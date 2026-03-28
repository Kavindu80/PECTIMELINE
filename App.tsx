import React, { useState, useMemo, useEffect, useCallback } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
import { Project, ProjectStatus, DeadlineStatus, Notification, SubFilterType } from './types';
import { CATEGORIES, PLANTS } from './constants';
import { fetchProjects, createProject, updateProject, deleteProject as deleteProjectFromDB, syncProjectSolutions, fetchAllSolutions, updateSolution } from './services/supabaseService';
import { needsPasswordChange } from './services/authService';
import { supabase } from './services/supabaseClient';
import { ProjectTable } from './components/ProjectTable';
import { ProjectTimeline } from './components/ProjectTimeline';
import { Visualizations } from './components/Visualizations';
import { SeSignoffModal } from './components/SeSignoffModal';
import { SummaryView } from './components/SummaryView';
import { DataConnectModal } from './components/DataConnectModal';
import { EditProjectModal } from './components/EditProjectModal';
import { ProjectDetailsModal } from './components/ProjectDetailsModal';
import { LoginPage } from './components/LoginPage';
import { AdminUserManagement } from './components/AdminUserManagement';
import { AdminSettings } from './components/AdminSettings';
import { parseCSVData } from './services/dataService';
import {
  Search, UserCircle, RefreshCw, Cloud,
  CloudOff, ShieldAlert,
  Filter, Layers, ArrowRight, Settings2, Bell, AlertTriangle, Monitor, X, Briefcase, ChevronLeft, ChevronRight, Info,
  CheckCircle2, LayoutList, Kanban, Calendar, Plus, CalendarDays, Sun, Moon, Users, Shield, Menu, SlidersHorizontal
} from 'lucide-react';

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'change-password' | 'forgot-password'>('login');
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');
  const [userEmail, setUserEmail] = useState('');

  const MAS_SHAREPOINT_LINK = 'https://massl-my.sharepoint.com/:x:/r/personal/rumalis_masholdings_com/Documents/SE%20Weekly%20Plan.xlsx?d=wd013059c32d24d0b9ee337062901ce1c&csf=1&web=1&e=ooIvX8&nav=MTVfezdBNEQxRUE0LTExRkEtNENBRi04MUIzLUM3OEVBOTIxQzFENX0';

  const EMPTY_PROJECT: Project = {
    id: '',
    inWeek: 0,
    styleInDate: '',
    no: '',
    core: 'Core',
    source: '',
    customer: '',
    styleNo: '',
    product: '',
    component: '',
    chassis: '',
    solution: '',
    solutions: [],
    fi: false,
    pp: false,
    psd: false,
    orderQty: 0,
    plant: 'Slimline', // Default
    platformStyle: '',
    term: '',
    status: 'Ongoing',
    category: 'MDS SE',
    deadlineStatus: 'On Track',
    engineerName: 'Unassigned',
    mechanic: '',
    sewing: '',
    styleDueDate: '',
    deadlineHistory: []
  };

  const calculateDeadlineStatus = useCallback((p: Partial<Project>): DeadlineStatus => {
    const targetDate = p.extendedDeadline ? new Date(p.extendedDeadline) : new Date(p.styleDueDate || '');
    if (isNaN(targetDate.getTime())) return 'On Track';

    const now = new Date();
    const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays <= 3) return 'Approaching';
    return p.extendedDeadline ? 'Extended' : 'On Track';
  }, []);

  // Helper for date parsing (DD-MMM-YY)
  const parseDate = useCallback((dateStr: string | undefined): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const [day, monthStr, year] = parts;
    const monthMap: Record<string, number> = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    const month = monthMap[monthStr];
    if (month === undefined) return null;
    const fullYear = 2000 + parseInt(year);
    return new Date(fullYear, month, parseInt(day));
  }, []);

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ProjectStatus>('Summary');
  const [activeSubFilter, setActiveSubFilter] = useState<SubFilterType>('All');

  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [customerFilter, setCustomerFilter] = useState<string>('All Customers');
  const [engineerFilter, setEngineerFilter] = useState<string>('All Personnel');
  const [sourceFilter, setSourceFilter] = useState<string>('All Sources');
  const [plantFilter, setPlantFilter] = useState<string>('All Plants');
  const [statusFilter, setStatusFilter] = useState<string>('All Statuses');

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const [excelUrl, setExcelUrl] = useState<string>(localStorage.getItem('mas_excel_url') || MAS_SHAREPOINT_LINK);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // State for modals
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [seSignoffProject, setSeSignoffProject] = useState<Project | null>(null); // New state for SE Signoff Modal

  // Admin view state
  const [adminView, setAdminView] = useState<'dashboard' | 'users' | 'settings'>('dashboard');

  // Mobile responsive state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Apply Theme Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const notifications: Notification[] = useMemo(() => {
    return projects
      .filter(p => p.deadlineStatus === 'Overdue' || p.deadlineStatus === 'Approaching' || p.status.toUpperCase().includes('HOLD'))
      .map(p => ({
        id: `notif-${p.id}`,
        projectId: p.id,
        message: p.status.toUpperCase().includes('HOLD')
          ? `BLOCKER: ${p.styleNo} is currently on HOLD.`
          : p.deadlineStatus === 'Overdue'
            ? `URGENT: Style ${p.styleNo} is OVERDUE.`
            : `WARNING: Style ${p.styleNo} due in < 3 days.`,
        type: p.deadlineStatus === 'Overdue' || p.status.toUpperCase().includes('HOLD') ? 'urgent' : 'warning',
        timestamp: new Date(),
        owner: p.engineerName || p.mechanic
      }));
  }, [projects]);

  const engineers = useMemo(() => {
    const list = new Set<string>();
    projects.forEach(p => {
      if (p.engineerName) list.add(p.engineerName);
      if (p.mechanic) list.add(p.mechanic);
    });
    return ['All Personnel', ...Array.from(list).sort()];
  }, [projects]);

  const customers = useMemo(() => {
    const list = Array.from(new Set(projects.map(p => p.customer))).filter(Boolean);
    return ['All Customers', ...list.sort()];
  }, [projects]);

  const sources = useMemo(() => {
    const list = Array.from(new Set(projects.map(p => p.source))).filter(Boolean);
    return ['All Sources', ...list.sort()];
  }, [projects]);

  const plants = useMemo(() => {
    const dataPlants = new Set(projects.map(p => p.plant).filter(Boolean));
    const allPlants = new Set([...PLANTS, ...Array.from(dataPlants)]);
    return ['All Plants', ...Array.from(allPlants).sort()];
  }, [projects]);

  const statuses = useMemo(() => {
    const list = Array.from(new Set(projects.map(p => p.status))).filter(Boolean);
    return ['All Statuses', ...list.sort()];
  }, [projects]);

  const fetchLiveData = async (url: string) => {
    if (!url) return;
    setIsSyncing(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Access Denied');
      const text = await response.text();

      setProjects(prevProjects => {
        const newProjects = parseCSVData(text);
        return newProjects.map(newP => {
          const existing = prevProjects.find(p => p.styleNo === newP.styleNo);
          if (existing) {
            const merged = {
              ...newP,
              extendedDeadline: existing.extendedDeadline,
              deadlineHistory: existing.deadlineHistory || [],
              status: existing.status !== newP.status ? newP.status : existing.status
            };
            return { ...merged, deadlineStatus: calculateDeadlineStatus(merged) };
          }
          return { ...newP, deadlineStatus: calculateDeadlineStatus(newP) };
        });
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

    const reloadData = async () => {
      try {
        setIsLoadingProjects(true);
        // Invalidate cache to ensure fresh data
        const { cacheService } = await import('./services/cacheService');
        cacheService.clear();

        // Load projects and all solutions in parallel
        const [projectData, solutionsByProject] = await Promise.all([
          fetchProjects(),
          fetchAllSolutions()
        ]);

        // Merge solutions into their respective projects
        const projectsWithSolutions = projectData.map(p => ({
          ...p,
          solutions: solutionsByProject[p.id] || [],
          deadlineStatus: calculateDeadlineStatus(p)
        }));

        setProjects(projectsWithSolutions);
        console.log(`✅ Robust reload: ${projectsWithSolutions.length} units sync'd`);
        
        // Also sync with Excel if available
        if (excelUrl && excelUrl !== MAS_SHAREPOINT_LINK) {
          fetchLiveData(excelUrl);
        }
      } catch (error) {
        console.error('Error loading projects:', error);
        setError('Failed to load projects from database');
      } finally {
        setIsLoadingProjects(false);
      }
    };

    useEffect(() => {
      if (isAuthenticated) {
        reloadData();
      }
    }, [isAuthenticated]);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const needsChange = await needsPasswordChange();
        if (needsChange) {
          setAuthView('change-password');
          // DO NOT set isAuthenticated to true yet, let LoginPage handle the flow
        } else {
          setIsAuthenticated(true);
          setUserEmail(session.user.email || '');
          setUserRole('user'); // You could fetch actual role here
        }
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserEmail('');
        setAuthView('login');
      } else if (event === 'PASSWORD_RECOVERY') {
        setAuthView('change-password');
      }
      // CRUCIAL: We intentionally DO NOT handle 'SIGNED_IN' here.
      // If we did, it would instantly set isAuthenticated=true and unmount LoginPage,
      // skipping the password change animation and security checks.
      // LoginPage's onLoginSuccess callback explicitly handles the successful login transition.
    });

    return () => subscription.unsubscribe();
  }, []);

  // Main Filtering Logic
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const q = debouncedSearchQuery.toLowerCase();

      const searchTarget = [
        p.customer, p.styleNo, p.solution, p.engineerName, p.mechanic, p.plant, p.product,
        p.no, p.status, p.chassis, p.component, p.comment
      ].map(val => (val || '').toString().toLowerCase()).join(' ');

      const matchesSearch = searchTarget.includes(q);
      const matchesCustomer = customerFilter === 'All Customers' || p.customer === customerFilter;
      const matchesPersonnel = engineerFilter === 'All Personnel' || p.engineerName === engineerFilter || p.mechanic === engineerFilter;
      const matchesSource = sourceFilter === 'All Sources' || p.source === sourceFilter;
      const matchesPlant = plantFilter === 'All Plants' || p.plant === plantFilter;
      const matchesStatus = statusFilter === 'All Statuses' || p.status === statusFilter;
      const matchesCategory = activeCategory === 'Summary' || p.category === activeCategory;

      let matchesSubFilter = true;
      if (activeSubFilter === 'Ongoing') matchesSubFilter = p.status === 'Ongoing';
      else if (activeSubFilter === 'Completed') matchesSubFilter = !!p.handoverVeDate;
      else if (activeSubFilter === 'Critical') matchesSubFilter = p.deadlineStatus === 'Overdue' || p.status.includes('Hold');

      let matchesDate = true;
      if (dateRange.start || dateRange.end) {
        const pDate = parseDate(p.styleInDate);
        if (!pDate) {
          matchesDate = false;
        } else {
          if (dateRange.start && pDate < new Date(dateRange.start)) matchesDate = false;
          if (dateRange.end && pDate > new Date(dateRange.end)) matchesDate = false;
        }
      }

      return matchesSearch && matchesCustomer && matchesPersonnel && matchesSource && matchesPlant && matchesStatus && matchesCategory && matchesSubFilter && matchesDate;
    });
  }, [projects, debouncedSearchQuery, customerFilter, engineerFilter, sourceFilter, plantFilter, statusFilter, activeCategory, activeSubFilter, dateRange, parseDate]);

  const handleCreateNew = () => {
    // Create a deep copy to avoid mutation issues
    const initialData = { ...EMPTY_PROJECT };

    // Automatically set category and default plant based on active view
    if (activeCategory === 'Unichela Panadura VE') {
      initialData.category = 'Unichela Panadura VE';
      initialData.plant = 'Unichela Panadura';
    } else if (activeCategory === 'Casualine VE') {
      initialData.category = 'Casualine VE';
      initialData.plant = 'Casualine';
    } else if (activeCategory === 'Long Term') {
      initialData.category = 'Long Term';
      initialData.term = 'Long Term';
      initialData.plant = 'Slimline';
    } else {
      // Default to MDS SE / Slimline for Summary or explicit MDS SE view
      initialData.category = 'MDS SE';
      initialData.plant = 'Slimline';
    }

    setEditingProject(initialData);
  };

  const handleSaveProject = async (projectData: Project) => {
    try {
      const isNew = !projectData.id;
      const projectToSave = {
        ...projectData,
        deadlineStatus: calculateDeadlineStatus(projectData)
      };

      if (isNew) {
        // Create the project first
        const created = await createProject(projectToSave);

        // If there are solutions, sync them to the new project
        let finalSolutions = projectToSave.solutions || [];
        if (finalSolutions.length > 0) {
          finalSolutions = await syncProjectSolutions(created.id, finalSolutions, []);
        }

        const finalProject = { ...created, solutions: finalSolutions };
        setProjects(prev => [finalProject, ...prev]);
      } else {
        // Get the previous version of this project from state (to diff solutions)
        const previousProject = projects.find(p => p.id === projectData.id);
        const previousSolutions = previousProject?.solutions || [];
        const currentSolutions = projectToSave.solutions || [];

        // Update project fields in DB
        const updated = await updateProject(projectData.id, projectToSave);

        // Sync solutions (create new, update modified, delete removed)
        let syncedSolutions = currentSolutions;
        try {
          syncedSolutions = await syncProjectSolutions(
            projectData.id,
            currentSolutions,
            previousSolutions
          );
        } catch (solErr) {
          console.error('Error syncing solutions (keeping local state):', solErr);
        }

        // Merge DB response with local sub-resources that aren't in the projects table
        const mergedProject = {
          ...updated,
          solutions: syncedSolutions,
          cutKitItems: projectToSave.cutKitItems,
          cutActuals: projectToSave.cutActuals,
          stageFiles: projectToSave.stageFiles,
          deadlineHistory: projectToSave.deadlineHistory,
        };

        setProjects(prev => prev.map(p => p.id === mergedProject.id ? mergedProject : p));
      }

      setEditingProject(null);
      if (viewingProject && viewingProject.id === projectToSave.id) {
        setViewingProject(projectToSave);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      setError('Failed to save project');
    }
  };

  /**
   * Inline update handler — optimistic local update to avoid row jumping.
   * Updates local state immediately to preserve list order, then silently
   * syncs solutions to Supabase in the background and applies the DB-generated
   * solution IDs back to local state.
   */
  const projectsRef = React.useRef(projects);
  projectsRef.current = projects;

  // Sync lock to prevent concurrent syncs from creating duplicates
  const syncLockRef = React.useRef<Record<string, boolean>>({});
  const pendingSyncRef = React.useRef<Record<string, Project>>({});

  const handleInlineUpdateProject = useCallback(async (updatedProject: Project) => {
    // 1. Immediately update local state maintaining original array position
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));

    const projectId = updatedProject.id;

    // If a sync is already in progress for this project, queue the latest update
    if (syncLockRef.current[projectId]) {
      pendingSyncRef.current[projectId] = updatedProject;
      return;
    }

    // Acquire sync lock
    syncLockRef.current[projectId] = true;

    try {
      // Read previous state from ref (always fresh) instead of stale closure
      const previousProject = projectsRef.current.find(p => p.id === projectId);
      const previousSolutions = previousProject?.solutions || [];
      const currentSolutions = updatedProject.solutions || [];

      // Update the project row in DB
      await updateProject(projectId, updatedProject);

      // Determine if we need full sync or targeted update
      const previousIds = previousSolutions.map(s => s.id).sort();
      const currentIds = currentSolutions.map(s => s.id).sort();
      const hasNewSolutions = currentSolutions.some(s => s.id.startsWith('sol-') || s.id.startsWith('ck-') || s.id.startsWith('fl-'));
      const hasDeletedSolutions = previousSolutions.some(prev => !prev.id.startsWith('sol-') && !currentIds.includes(prev.id));
      const sameCount = previousIds.length === currentIds.length;
      const sameIds = sameCount && previousIds.every((id, i) => id === currentIds[i]);

      let finalSolutions = currentSolutions;

      if (hasNewSolutions || hasDeletedSolutions) {
        // Full sync needed — new or deleted solutions
        const syncedSolutions = await syncProjectSolutions(projectId, currentSolutions, previousSolutions);
        if (syncedSolutions && syncedSolutions.length > 0) {
          finalSolutions = syncedSolutions;
        }
      } else if (sameIds && currentSolutions.length > 0) {
        // Targeted update — only changed solution fields (status, team, dates, etc.)
        // Find which solutions actually changed and update only those
        const updatePromises: Promise<void>[] = [];
        const mergedSolutions = [...currentSolutions];

        for (let i = 0; i < currentSolutions.length; i++) {
          const curr = currentSolutions[i];
          const prev = previousSolutions.find(p => p.id === curr.id);
          if (prev && JSON.stringify(prev) !== JSON.stringify(curr)) {
            updatePromises.push(
              updateSolution(curr.id, curr, projectId).then(updated => {
                // Merge: keep our latest local fields on top of DB response
                mergedSolutions[i] = { ...updated, team: curr.team, responsible: curr.responsible };
              }).catch(err => {
                console.error('Failed to update solution:', curr.id, err);
              })
            );
          }
        }

        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
          finalSolutions = mergedSolutions;
        }
      }

      // Apply final state back
      const finalProject = { ...updatedProject, solutions: finalSolutions };
      setProjects(prev => prev.map(p => p.id === projectId ? finalProject : p));
      setViewingProject(prev => prev?.id === projectId ? finalProject : prev);

    } catch (err) {
      console.error('Background sync failed (local state preserved):', err);
    } finally {
      // Release sync lock
      syncLockRef.current[projectId] = false;

      // Process any queued update
      const pending = pendingSyncRef.current[projectId];
      if (pending) {
        delete pendingSyncRef.current[projectId];
        // Re-run with the latest queued state
        handleInlineUpdateProject(pending);
      }
    }
  }, []);

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this style record? This action cannot be undone.')) {
      try {
        await deleteProjectFromDB(projectId);
        setProjects(prev => prev.filter(p => p.id !== projectId));
        setEditingProject(null);
        setViewingProject(null);
      } catch (error) {
        console.error('Error deleting project:', error);
        setError('Failed to delete project');
      }
    }
  };

  const handleVeHandover = async (projectId: string, targetVE: string) => {
    try {
      const originalProject = projects.find(p => p.id === projectId);
      if (!originalProject) return;

      const today = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dateStr = `${String(today.getDate()).padStart(2, '0')}-${months[today.getMonth()]}-${String(today.getFullYear()).slice(-2)}`;

      // 1. Update original project status in DB
      const updatedOriginalData: Partial<Project> = { 
        ...originalProject, 
        veHandover: targetVE, 
        veHandoverDate: dateStr,
        handoverVeDate: dateStr, // Ensure the UI-visible handover date is also set
        status: 'Handed Over' 
      };
      const updatedOriginal = await updateProject(projectId, updatedOriginalData);

      // 2. Create NEW project for Target VE in DB (Fresh Timeline)
      const newProjectData: Partial<Project> = {
        ...EMPTY_PROJECT,
        category: targetVE as ProjectStatus,
        plant: targetVE.replace(' VE', '').replace(' VE', ''), // Clean up plant name
        status: 'Ongoing',
        styleInDate: dateStr,
        
        // Copy static style info
        no: originalProject.no,
        styleNo: originalProject.styleNo,
        customer: originalProject.customer,
        product: originalProject.product,
        chassis: originalProject.chassis,
        orderQty: originalProject.orderQty,
        source: originalProject.source,
        core: originalProject.core,
        term: originalProject.term,
        platformStyle: originalProject.platformStyle,
        
        // Critical context
        solution: originalProject.solution,
        handoverSource: 'MDS SE',
        engineerName: 'Unassigned'
      };

      const createdNewProject = await createProject(newProjectData);

      // 3. Update local state with both updated objects (ensuring DB IDs are used)
      setProjects(prev => {
        const otherProjects = prev.filter(p => p.id !== projectId);
        // Important: preserve original solutions in updatedOriginal because updateProject returns them as []
        const originalWithSolutions = { ...updatedOriginal, solutions: originalProject.solutions };
        return [originalWithSolutions, createdNewProject, ...otherProjects];
      });

      console.log(`✅ Handover successful: Style ${originalProject.styleNo} moved to ${targetVE}`);
    } catch (err) {
      console.error('❌ Handover failed:', err);
      // More descriptive error for the user
      setError('Handover operation failed. Please check your network or try again.');
    }
  };

  const handleCategoryChange = (category: ProjectStatus) => {
    setActiveCategory(category);
    setActiveSubFilter('All');
  };

  const handleSubFilterChange = (category: ProjectStatus, filter: SubFilterType) => {
    setActiveCategory(category);
    setActiveSubFilter(filter);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCustomerFilter('All Customers');
    setEngineerFilter('All Personnel');
    setSourceFilter('All Sources');
    setPlantFilter('All Plants');
    setStatusFilter('All Statuses');
    setActiveSubFilter('All');
    setDateRange({ start: '', end: '' });
  };

  const handleLoginSuccess = (role: 'user' | 'admin', email: string) => {
    setUserRole(role);
    setUserEmail(email);
    setIsAuthenticated(true);
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(!isDarkMode)} initialView={authView} />;
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-[#0F172A] overflow-hidden text-slate-600 dark:text-slate-300 text-xs transition-colors duration-300">

      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      {/* Sidebar — Desktop: hover-expand strip | Mobile: slide-over drawer */}
      <aside className={`
        group fixed lg:relative z-[70] h-screen bg-white dark:bg-[#1E293B] border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col shrink-0
        transition-all duration-300 ease-in-out overflow-hidden
        ${isMobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
        lg:translate-x-0 lg:w-5 lg:hover:w-64
      `}>
        <div className={`flex-1 flex flex-col w-64 transition-opacity duration-200 whitespace-nowrap ${isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 delay-100'}`}>
          {/* Close button for mobile */}
          <div className="flex items-center justify-between px-4 py-3 lg:hidden border-b border-slate-200 dark:border-slate-800 shrink-0">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Navigation</span>
            <button onClick={() => setIsMobileSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white">
              <X size={16} />
            </button>
          </div>

          {/* Spacer to match alert bar height — desktop only */}
          {notifications.length > 0 && <div className="h-7 shrink-0 hidden lg:block"></div>}

          <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-center">
            <div className="h-12 w-auto flex items-center justify-center">
              <img
                src="/assets/image-removebg-preview.avif"
                alt="MAS Industrial Logo"
                className="h-full w-auto object-contain"
              />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5 custom-scrollbar">
            <p className="px-3 text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 whitespace-nowrap">OPERATIONAL LIFECYCLE</p>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { handleCategoryChange(cat.id); setAdminView('dashboard'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold transition-all duration-200 whitespace-nowrap ${activeCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 ring-1 ring-blue-400/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                <div className="shrink-0">{React.cloneElement(cat.icon as React.ReactElement<any>, { size: 14 })}</div>
                <span className="truncate">{cat.label}</span>
                {cat.id !== 'Summary' && (
                  <span className={`ml-auto text-[8px] font-black px-1.5 py-0.5 rounded-md ${activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-500 border border-slate-300 dark:border-slate-700'
                    }`}>
                    {projects.filter(p => p.category === cat.id).length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Admin Tools Section - Only visible to admins */}
          {userRole === 'admin' && (
            <div className="px-2 py-3 border-t border-slate-200 dark:border-slate-800">
              <p className="px-3 text-[8px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-3 whitespace-nowrap flex items-center gap-1.5">
                <Shield size={9} /> ADMIN TOOLS
              </p>
              <button
                onClick={() => { setAdminView('users'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold transition-all duration-200 whitespace-nowrap mb-0.5 ${adminView === 'users'
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 ring-1 ring-indigo-400/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                <Users size={14} />
                <span className="truncate">User Management</span>
              </button>
              <button
                onClick={() => { setAdminView('settings'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold transition-all duration-200 whitespace-nowrap ${adminView === 'settings'
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 ring-1 ring-indigo-400/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                <Settings2 size={14} />
                <span className="truncate">Settings</span>
              </button>
            </div>
          )}

          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 shrink-0">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setIsAuthenticated(false);
                setUserEmail('');
                setIsMobileSidebarOpen(false);
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 border border-blue-500 rounded-xl text-white transition-all font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 whitespace-nowrap"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              LOGOUT
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300 w-full">
        {/* Horizontal Alert Bar */}
        {notifications.length > 0 && (
          <div className="h-7 bg-red-50 dark:bg-red-600/10 border-b border-red-200 dark:border-red-500/20 flex items-center overflow-hidden shrink-0 print:hidden">
            <div className="bg-red-600 h-full flex items-center px-4 gap-2 text-white font-black text-[8px] tracking-[0.2em] uppercase z-10 shadow-[4px_0_10px_rgba(220,38,38,0.3)]">
              <ShieldAlert size={10} /> CRITICAL_ALERT_FEED
            </div>
            <div className="flex-1 relative overflow-hidden flex items-center">
              <div className="animate-marquee whitespace-nowrap flex gap-12 items-center">
                {notifications.map((n, i) => (
                  <div key={n.id + i} className="flex items-center gap-2 text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-tighter">
                    <span className="bg-red-100 dark:bg-red-500/20 px-1 rounded text-[7px] font-black">ST-{i + 1}</span>
                    <span className="text-slate-600 dark:text-slate-300">{n.owner}:</span>
                    <span>{n.message}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-700 mx-4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <header className="bg-white dark:bg-[#1E293B] border-b border-slate-200 dark:border-slate-800 shrink-0 z-10 shadow-sm transition-all">
          {/* Top row: Search + Filters + Right controls */}
          <div className="flex items-center px-2 sm:px-4 lg:px-6 gap-2 sm:gap-3 h-14 sm:h-16">

            {/* LEFT: Hamburger + Search & Filters */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden">

              {/* Hamburger Menu - Mobile Only */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors shrink-0"
                title="Open Menu"
              >
                <Menu size={18} />
              </button>

              {/* Search - Wider on Summary page */}
              <div className={`relative flex-1 min-w-0 group transition-all duration-300 ${activeCategory === 'Summary'
                ? 'sm:flex-1 sm:max-w-md md:max-w-lg lg:max-w-xl'
                : 'sm:flex-none sm:w-40 md:w-48 lg:w-52 shrink-0'
                }`}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400" size={14} />
                <input
                  type="text"
                  placeholder="Search by style, customer, engineer, product..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-500 dark:placeholder:text-slate-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block shrink-0"></div>

              {/* Mobile Filter Button */}
              <button
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                className={`lg:hidden p-2 rounded-lg transition-colors shrink-0 ${isMobileFilterOpen ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                title="Toggle Filters"
              >
                <SlidersHorizontal size={16} />
              </button>

              {/* Filters Row — Desktop: dropdowns + date picker inline */}
              {/* Summary screen: Only Status filter */}
              {/* Other screens: All filters */}
              {/* Date Picker — Always visible now */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                {activeCategory !== 'Summary' && (
                  <>
                    <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className="bg-slate-100 dark:bg-[#0F172A] hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500 transition-colors cursor-pointer shrink min-w-[70px]">
                      {customers.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="bg-slate-100 dark:bg-[#0F172A] hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500 transition-colors cursor-pointer shrink min-w-[70px]">
                      {sources.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select value={plantFilter} onChange={(e) => setPlantFilter(e.target.value)} className="bg-slate-100 dark:bg-[#0F172A] hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500 transition-colors cursor-pointer shrink min-w-[70px]">
                      {plants.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </>
                )}

                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-100 dark:bg-[#0F172A] hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500 transition-colors cursor-pointer shrink min-w-[70px]">
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <button onClick={clearFilters} className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10 transition-colors rounded-lg shrink-0" title="Clear Filters">
                  <X size={13} />
                </button>

                {/* Divider between filters and date */}
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 shrink-0 mx-0.5"></div>

                {/* Date Picker — inline with filters */}
                <div className="flex items-center bg-slate-100 dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-700 p-1 shadow-sm hover:border-blue-400 dark:hover:border-blue-500/50 transition-all group h-9 shrink-0">
                  <div className="h-7 w-7 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-slate-800/80 transition-all shadow-inner shrink-0">
                    <CalendarDays size={14} className="group-hover:scale-110 transition-transform" />
                  </div>

                  <div className="flex flex-col px-2 justify-center h-full min-w-0">
                    <span className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400/80 transition-colors">Target Period</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        className="bg-transparent border-none p-0 text-[10px] font-bold text-slate-700 dark:text-slate-200 focus:ring-0 focus:outline-none uppercase cursor-pointer w-[85px] h-4 font-mono tracking-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        title="Select start date"
                      />
                      <ArrowRight size={8} className="text-slate-400 dark:text-slate-600 shrink-0" />
                      <input
                        type="date"
                        className="bg-transparent border-none p-0 text-[10px] font-bold text-slate-700 dark:text-slate-200 focus:ring-0 focus:outline-none uppercase cursor-pointer w-[85px] h-4 font-mono tracking-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        title="Select end date"
                      />
                    </div>
                  </div>

                  {(dateRange.start || dateRange.end) && (
                    <button
                      onClick={() => setDateRange({ start: '', end: '' })}
                      className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-0.5"
                      title="Clear Date Filter"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: View, Profile, Theme — compact controls only */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

              {/* Active Filter Badge */}
              {activeSubFilter !== 'All' && (
                <div className="hidden xl:flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-2.5 py-1 rounded-full animate-in fade-in">
                  <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide">Filter: {activeSubFilter}</span>
                  <button onClick={() => setActiveSubFilter('All')} className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-white"><X size={10} /></button>
                </div>
              )}

              {/* View Toggle - Hide on Summary screen */}
              {activeCategory !== 'Summary' && (
                <div className="flex bg-slate-100 dark:bg-[#0F172A] p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-700 text-slate-700 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-0' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    <Kanban size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-700 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-0' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    <LayoutList size={14} />
                  </button>
                </div>
              )}

              {/* User Profile */}
              <div className="hidden sm:flex items-center gap-2 pl-1">
                <div className="relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${userRole === 'admin' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>
                    <UserCircle size={16} />
                  </div>
                  {userRole === 'admin' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white dark:border-[#1E293B]">
                      <Shield size={7} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="hidden md:block">
                  <p className="text-[9px] font-black text-slate-700 dark:text-slate-200 leading-tight">{userEmail || 'User'}</p>
                  <p className={`text-[7px] font-black uppercase tracking-widest ${userRole === 'admin' ? 'text-indigo-500' : 'text-blue-500'}`}>{userRole}</p>
                </div>
              </div>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Filter Drawer */}
        {isMobileFilterOpen && (
          <div className="lg:hidden bg-white dark:bg-[#1E293B] border-b border-slate-200 dark:border-slate-800 p-3 shrink-0 animate-in fade-in slide-in-from-top-2 duration-200 shadow-md space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Filters</span>
              <button onClick={clearFilters} className="text-[9px] font-bold text-red-500 hover:text-red-700 uppercase">Clear All</button>
            </div>

            {/* Summary screen: Only Status filter */}
            {/* Other screens: All filters */}
            {activeCategory === 'Summary' ? (
              // Summary screen - Status only
              <div className="grid grid-cols-1 gap-2">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500 cursor-pointer">
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {/* Mobile Date Range for Summary */}
                <div className="flex items-center gap-2 pt-1">
                  <CalendarDays size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="date"
                    className="flex-1 bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-200"
                    style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    placeholder="Start"
                  />
                  <ArrowRight size={10} className="text-slate-400 shrink-0" />
                  <input
                    type="date"
                    className="flex-1 bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-200"
                    style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    placeholder="End"
                  />
                </div>
              </div>
            ) : (
              // Other screens - All filters
              <>
                <div className="grid grid-cols-2 gap-2">
                  <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className="bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500 cursor-pointer">
                    {customers.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500 cursor-pointer">
                    {sources.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={plantFilter} onChange={(e) => setPlantFilter(e.target.value)} className="bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500 cursor-pointer">
                    {plants.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500 cursor-pointer">
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {/* Mobile Date Range */}
                <div className="flex items-center gap-2 pt-1">
                  <CalendarDays size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="date"
                    className="flex-1 bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-200"
                    style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    placeholder="Start"
                  />
                  <ArrowRight size={10} className="text-slate-400 shrink-0" />
                  <input
                    type="date"
                    className="flex-1 bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-200"
                    style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    placeholder="End"
                  />
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0F172A] p-3 sm:p-4 lg:p-6 transition-colors duration-300">

          {adminView === 'dashboard' && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-4 sm:mb-6 shrink-0">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h2 className="text-base sm:text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase">
                    {activeCategory} {viewMode === 'timeline' ? 'TIMELINE' : 'GRID'}
                  </h2>
                  <div className="flex gap-2">
                    <span className="bg-blue-50 dark:bg-blue-600/20 px-2 py-0.5 rounded text-[8px] font-black text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 tracking-widest uppercase">
                      Records: {filteredProjects.length}
                    </span>
                    {activeSubFilter !== 'All' && (
                      <span className="bg-amber-50 dark:bg-amber-600/20 px-2 py-0.5 rounded text-[8px] font-black text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 tracking-widest uppercase">
                        {activeSubFilter} Items Only
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {/* Only show Add Style button if NOT in Summary view */}
                {activeCategory !== 'Summary' && (
                  <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 border border-blue-500 rounded-xl text-white transition-all font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-900/20"
                  >
                    <Plus size={12} /> <span className="hidden sm:inline">ADD STYLE</span><span className="sm:hidden">ADD</span>
                  </button>
                )}
                <button 
                  onClick={() => reloadData()} 
                  disabled={isSyncing || isLoadingProjects}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all font-black text-[9px] uppercase tracking-widest disabled:opacity-50"
                >
                  <RefreshCw size={12} className={(isSyncing || isLoadingProjects) ? 'animate-spin' : ''} /> 
                  <span className="hidden sm:inline">{ (isSyncing || isLoadingProjects) ? 'SYNCING...' : 'REFRESH' }</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            {adminView === 'users' && userRole === 'admin' ? (
              <AdminUserManagement />
            ) : adminView === 'settings' && userRole === 'admin' ? (
              <AdminSettings />
            ) : activeCategory === 'Summary' ? (
              <div className="space-y-6 pb-6 animate-in fade-in duration-500">
                <Visualizations projects={filteredProjects} />
                <SummaryView
                  projects={filteredProjects}
                  onCategoryClick={handleCategoryChange}
                  onFilterClick={handleSubFilterChange}
                  onEdit={(p) => setEditingProject(p)}
                  onView={(p) => setViewingProject(p)}
                  searchQuery={searchQuery}
                  statusFilter={statusFilter}
                  dateRange={dateRange}
                />
              </div>
            ) : (
              <div className="h-full">
                {viewMode === 'timeline' ? (
                  <>
                    <ProjectTimeline
                      projects={filteredProjects}
                      onEdit={(p) => setEditingProject(p)}
                      onDelete={handleDeleteProject}
                      activeCategory={activeCategory}
                      onVeHandover={handleVeHandover}
                      onUpdateProject={handleInlineUpdateProject}
                      onSeSignoff={(p) => setSeSignoffProject(p)} // Pass handler
                      currentUserEmail={userEmail} // Pass logged-in user email
                    />
                    {seSignoffProject && (
                      <SeSignoffModal
                        isOpen={!!seSignoffProject}
                        onClose={() => setSeSignoffProject(null)}
                        project={seSignoffProject}
                        onSignOff={(emailData) => {
                          // Handle signoff logic here
                          console.log('Sending email:', emailData);
                          // Update project with signoff date
                          const today = new Date();
                          const day = String(today.getDate()).padStart(2, '0');
                          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          const dateStr = `${day}-${months[today.getMonth()]}-${String(today.getFullYear()).slice(-2)}`;

                          handleSaveProject({
                            ...seSignoffProject,
                            seSignoffDate: dateStr
                          });

                          setSeSignoffProject(null);
                          alert(`Signoff email sent to ${emailData.to}`);
                        }}
                      />
                    )}
                  </>
                ) : (
                  <ProjectTable
                    projects={filteredProjects}
                    category={activeCategory}
                    onEdit={(p) => setEditingProject(p)}
                    onDelete={handleDeleteProject}
                    onUpdateProject={handleSaveProject}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Overlays */}
      <DataConnectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConnect={(url) => { setExcelUrl(url); localStorage.setItem('mas_excel_url', url); fetchLiveData(url); }} currentUrl={excelUrl} />
      {editingProject && <EditProjectModal project={editingProject} isOpen={!!editingProject} onClose={() => setEditingProject(null)} onSave={handleSaveProject} onDelete={handleDeleteProject} mode={editingProject.id ? 'edit' : 'create'} />}
      {viewingProject && <ProjectDetailsModal project={viewingProject} isOpen={!!viewingProject} onClose={() => setViewingProject(null)} onEdit={setEditingProject} onDelete={handleDeleteProject} />}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 12px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 1px solid #f1f5f9; }
        .dark .custom-scrollbar::-webkit-scrollbar-track { background: #0F172A; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border: 1px solid #1e293b; }
        
        /* GLOBAL DATE PICKER FIX: Expand the tiny native calendar trigger to fill the entire input */
        .date-picker-trigger::-webkit-calendar-picker-indicator {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          color: transparent;
          background: transparent;
          cursor: pointer;
        }

        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 60s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div >
  );
};

export default App;
