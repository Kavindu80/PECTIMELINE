
import React, { useState, useRef, useEffect } from 'react';
import { Project, BrainstormSolution, CutKitItem, StageFileLink, SolutionMachine, CutActuals, StageDates } from '../types';

import { PLANT_COLORS, TIMELINE_STAGES } from '../constants';
// import { SolutionFeedbackSheet } from './SolutionFeedbackSheet'; // Deprecated ok
import { pdf } from '@react-pdf/renderer';
import { SolutionFeedbackPDF } from './SolutionFeedbackPDF';
import { DurationDisplay } from './DurationDisplay';
import {
    ChevronRight, Calendar, Trash2, ChevronDown, History, Send, ArrowRightLeft,
    Plus, Check, X, Lightbulb, Clock, AlertCircle, AlertTriangle, Video, Link2, ExternalLink,
    Package, Edit3, Save, FileText, StickyNote, Paperclip, Upload, FileSpreadsheet, Share2, Wrenc, PenTool, Printer, BarChart3, Award, Layout
} from 'lucide-react';
import { calculateBusinessDays, parseDisplayDate } from '../utils/durationCalculator';

// Helper to safely parse DD-MMM-YY back to YYYY-MM-DD for the native picker
const getISODate = (displayDate: string) => {
    if (!displayDate) return '';
    const parts = displayDate.split('-');
    if (parts.length !== 3) return '';
    const [day, monthStr, year] = parts;
    const monthMap: Record<string, string> = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    const month = monthMap[monthStr];
    if (!month) return '';
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month}-${day.padStart(2, '0')}`;
};

// Helper to get status color based on date comparison
const getDateStatusColor = (actual: string | undefined, plan: string | undefined) => {
    if (!actual) return null;
    if (!plan) return 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-600 dark:text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]';

    const parseDateHelper = (d: string) => {
        if (!d) return null;
        let parts = d.split('-');
        if (parts.length === 3 && parts[0].length === 4) return new Date(d);
        if (parts.length === 3) {
            const [day, monthStr, year] = parts;
            const months: Record<string, number> = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
            const m = months[monthStr];
            if (m !== undefined) {
                const y = year.length === 2 ? 2000 + parseInt(year) : parseInt(year);
                return new Date(y, m, parseInt(day));
            }
        }
        return new Date(d);
    };

    const d1 = parseDateHelper(actual);
    const d2 = parseDateHelper(plan);

    if (!d1 || !d2) return null;

    if (d1 <= d2) return 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-600 dark:text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]';

    const diffTime = Math.abs(d1.getTime() - d2.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) {
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-600 dark:text-yellow-400 shadow-lg shadow-yellow-500/20';
    }

    return 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-600 dark:text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
};

const CutDateInput = ({
    label,
    value,
    plan,
    isLate,
    isEditing,
    onFocus,
    onBlur,
    onChange,
    onEnter,
    onDatePick
}: {
    label: string,
    value: string,
    plan?: string,
    isLate: boolean,
    isEditing: boolean,
    onFocus: () => void,
    onBlur: () => void,
    onChange: (val: string) => void,
    onEnter: () => void,
    onDatePick: (val: string) => void
}) => {
    // Use plan date as default if no value exists
    const displayValue = value || plan || '';

    const handleNativePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (!val) return;
        const [year, month, day] = val.split('-');
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const monthShort = dateObj.toLocaleString('default', { month: 'short' });
        const yearShort = year.slice(-2);
        const formatted = `${day}-${monthShort}-${yearShort}`;
        onDatePick(formatted);
    };
    return (
        <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</label>
            <div style={{ position: 'relative' }} className="flex items-center w-full">
                <input
                    value={displayValue}
                    onChange={e => onChange(e.target.value)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onKeyDown={e => e.key === 'Enter' && onEnter()}
                    className={`w-full pl-2 pr-8 py-1.5 text-xs bg-white dark:bg-slate-800 border rounded outline-none transition-colors ${isEditing ? 'border-orange-400 ring-1 ring-orange-400/20' :
                        isLate ? 'border-red-200 text-red-500' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-orange-300'
                        } font-bold`}
                    placeholder="DD-MMM-YY"
                />
                {/* Visual calendar icon (decorative only) */}
                <div 
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-orange-500 transition-colors group cursor-pointer"
                    style={{ zIndex: 10, pointerEvents: 'none' }}
                >
                    <Calendar size={12} className="group-hover:scale-110 transition-transform" />
                </div>
                {/* Invisible native date input covering the button area — triggers native picker on any browser/domain */}
                <input
                    type="date"
                    className="date-picker-trigger"
                    value={getISODate(displayValue)}
                    onChange={handleNativePick}
                    title="Select date"
                    style={{
                        position: 'absolute',
                        right: '4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '24px',
                        height: '24px',
                        opacity: 0,
                        cursor: 'pointer',
                        zIndex: 20,
                    }}
                />
            </div>
        </div>
    );
};

// Helper to get live or stored working days count
const getLiveStageDays = (sol: BrainstormSolution, stageId: string) => {
    const tracking = sol.stageTracking?.[stageId];
    if (!tracking) return undefined;

    if (tracking.status === 'Done') {
        return tracking.workingDaysCount;
    }

    if (tracking.status === 'In Progress' && tracking.startDate) {
        const start = parseDisplayDate(tracking.startDate);
        if (start) {
            // Live count from start to today
            return calculateBusinessDays(start, new Date());
        }
    }

    return undefined;
};

interface ProjectTimelineProps {
    projects: Project[];
    onEdit: (project: Project) => void;
    onDelete: (projectId: string) => void;
    activeCategory?: string;
    onVeHandover?: (projectId: string, targetVE: string) => void;
    onUpdateProject?: (project: Project) => void;
    onSeSignoff?: (project: Project) => void;
    currentUserEmail?: string; // Logged-in user email
}

const VE_TARGETS = [
    { id: 'Unichela Panadura VE', label: 'Unichela Panadura VE', color: 'text-orange-500' },
    { id: 'Casualine VE', label: 'Casualine VE', color: 'text-emerald-500' },
];

const SOLUTION_STATUS_COLORS: Record<string, string> = {
    'Pending': 'bg-red-500 text-white',
    'In Progress': 'bg-amber-500 text-white',
    'Trial': 'bg-blue-500 text-white',
    'Done': 'bg-green-500 text-white',
    'Drop': 'bg-slate-500 text-white',
};

const EMPTY_SOLUTION: BrainstormSolution = {
    id: '',
    entryDate: '',
    machineCode: '',
    operationSMV: '',
    operation: '',
    solutionText: '',
    comments: '',
    team: '',
    responsible: '',
    startDate: '',
    expectedEndDate: '',
    actualEndDate: '',
    status: 'Pending',
};

const formatToday = (): string => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day}-${months[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
};

const parseDate = (d: string): Date | null => {
    if (!d) return null;
    const parts = d.split('-');
    if (parts.length !== 3) return null;
    const [day, monthStr, year] = parts;
    const months = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
    const month = months[monthStr as keyof typeof months] ?? -1;
    if (month === -1) return null;
    return new Date(2000 + parseInt(year), month, parseInt(day));
};

const EMPTY_CUT_KIT: CutKitItem = { id: '', component: '', quantity: 0, receivedQty: 0, status: 'Pending', notes: '' };

const CUT_KIT_STATUS_COLORS: Record<string, string> = {
    'Pending': 'bg-amber-500 text-white',
    'Partial': 'bg-orange-500 text-white',
    'Complete': 'bg-green-500 text-white',
    'Missing': 'bg-red-500 text-white',
};

// Helper function to check if a stage is actually completed (has actual date, not just planned)
const isStageActuallyCompleted = (project: Project, stageId: string): boolean => {
    switch (stageId) {
        case 'cut_check':
            return !!(project.cutActuals?.handover || project.cutActuals?.received);
        case 'brainstorm':
            return (project.solutions || []).some(s => !!(s.stageTracking?.['brainstorm']?.actualDate));
        case 'mach_avail':
            return (project.solutions || []).some(s => !!s.actualMachineDate);
        case 'trial':
        case 'mockup':
        case 'valid':
        case 'video':
            return (project.solutions || []).some(sol =>
                !!(sol.stageTracking?.[stageId]?.actualDate)
            );
        case 'stw':
        case 'mds':
        case 'pd':
            return (project.stageFiles || []).some(f => f.stageId === stageId && !!f.actualDate);
        case 'share':
            return !!project.seSignoffDate;
        default:
            return false;
    }
};

// Helper function to check if a stage has been started (has planned date or any partial work)
const isStageStarted = (project: Project, stageId: string): boolean => {
    // Check if there's a planned date for this stage
    const stageConfig = TIMELINE_STAGES.find(s => s.id === stageId);
    const plannedDate = stageConfig ? (project[stageConfig.dateKey as keyof Project] as string) : '';
    if (plannedDate) return true;

    switch (stageId) {
        case 'cut_check': {
            const actuals = project.cutActuals || {};
            // Check if any cut dates are set or any cut actuals exist
            return !!(project.cutRequestedDate || project.cutRequiredDate || project.cutReceivedDate || project.cutHandoverDate ||
                actuals.requested || actuals.required || actuals.received || actuals.handover);
        }
        case 'brainstorm':
            return (project.solutions || []).some(s =>
                !!(s.stageTracking?.['brainstorm']?.startDate || s.stageTracking?.['brainstorm']?.actualDate ||
                    s.startDate || s.actualEndDate || s.status === 'In Progress' || s.status === 'Done')
            );
        case 'mach_avail':
            return (project.solutions || []).some(s => !!(s.actualMachineDate || (s.machines && s.machines.length > 0)));
        case 'trial':
        case 'mockup':
        case 'valid':
        case 'video':
            return (project.solutions || []).some(sol =>
                !!(sol.stageTracking?.[stageId]?.startDate || sol.stageTracking?.[stageId]?.actualDate ||
                    sol.stageTracking?.[stageId]?.status === 'In Progress' || sol.stageTracking?.[stageId]?.status === 'Done')
            );
        case 'stw':
        case 'mds':
        case 'pd':
            return (project.stageFiles || []).some(f => f.stageId === stageId);
        case 'share':
            return !!(project.seSignoffDate || project.initialSmv || project.latestSmv);
        default:
            return false;
    }
};



// Helper function to add weekdays (excluding weekends)
const addWeekdays = (dateStr: string, days: number): string => {
    if (!dateStr) return '';

    // Parse DD-MMM-YY format
    const parts = dateStr.split('-');
    if (parts.length !== 3) return '';

    const [day, monthStr, year] = parts;
    const monthMap: Record<string, number> = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    const month = monthMap[monthStr];
    if (month === undefined) return '';

    const fullYear = 2000 + parseInt(year);
    let currentDate = new Date(fullYear, month, parseInt(day));

    let addedDays = 0;
    while (addedDays < days) {
        currentDate.setDate(currentDate.getDate() + 1);
        const dayOfWeek = currentDate.getDay();
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            addedDays++;
        }
    }

    // Format back to DD-MMM-YY
    const resultDay = currentDate.getDate().toString().padStart(2, '0');
    const resultMonth = currentDate.toLocaleString('default', { month: 'short' });
    const resultYear = currentDate.getFullYear().toString().slice(-2);

    return `${resultDay}-${resultMonth}-${resultYear}`;
};

const KIT_STATUS_COLORS: Record<string, string> = {
    'Pending': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/50',
    'Ready': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/50',
    'Issue': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/50',
};

export const ProjectTimeline: React.FC<ProjectTimelineProps> = React.memo(({
    projects,
    onEdit,
    onDelete,
    activeCategory,
    onVeHandover,
    onUpdateProject,
    onSeSignoff,
    currentUserEmail
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [deadlineDropdownId, setDeadlineDropdownId] = useState<string | null>(null);
    const [durationDropdownId, setDurationDropdownId] = useState<string | null>(null);
    const durationDropdownRef = useRef<HTMLDivElement>(null);
    const [veDropdownId, setVeDropdownId] = useState<string | null>(null);
    const [veHandoverConfirm, setVeHandoverConfirm] = useState<{ projectId: string; ve: { id: string; label: string; color: string } } | null>(null);
    const [activeStage, setActiveStage] = useState<Record<string, string>>({});
    const [showAddSolution, setShowAddSolution] = useState<string | null>(null);
    const [newSolution, setNewSolution] = useState<BrainstormSolution>({ ...EMPTY_SOLUTION });
    const [newCutKit, setNewCutKit] = useState<CutKitItem>({ ...EMPTY_CUT_KIT });
    const [showAddCutKit, setShowAddCutKit] = useState<string | null>(null);
    const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
    const [editVideoLink, setEditVideoLink] = useState('');
    const [editVideoDesc, setEditVideoDesc] = useState('');
    const [editingNoteKey, setEditingNoteKey] = useState<string | null>(null);
    const [editNoteText, setEditNoteText] = useState('');
    const [editingSolField, setEditingSolField] = useState<{ projId: string; solId: string; field: string } | null>(null);
    const [editFieldValue, setEditFieldValue] = useState('');

    // State for SE Signoff fields
    const [editingSeField, setEditingSeField] = useState<{ projId: string, field: string } | null>(null);
    const [seFieldValue, setSeFieldValue] = useState('');
    const [showAddFileLink, setShowAddFileLink] = useState<string | null>(null);
    const [newFileLink, setNewFileLink] = useState({ solutionId: '', fileName: '', fileUrl: '', fileType: 'pdf' as 'pdf' | 'excel' | 'other', plannedDate: '', actualDate: '' });

    // Machine Stage State


    // Cut Actuals State
    const [editingCutActual, setEditingCutActual] = useState<{ projId: string, field: keyof CutActuals } | null>(null);
    const [cutActualValue, setCutActualValue] = useState('');
    // const [printingProjectId, setPrintingProjectId] = useState<string | null>(null); // Deprecated

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('[data-dropdown]')) {
                setDeadlineDropdownId(null);
                setDurationDropdownId(null);
                setVeDropdownId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Position duration dropdown to avoid cutoff
    useEffect(() => {
        const positionDropdown = () => {
            if (durationDropdownId && durationDropdownRef.current) {
                const dropdown = durationDropdownRef.current;
                const trigger = document.querySelector(`[data-duration-trigger="${durationDropdownId}"]`) as HTMLElement;

                if (trigger) {
                    const triggerRect = trigger.getBoundingClientRect();
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;

                    // Skip manual positioning on small mobile screens where we use a simplified modal style
                    if (viewportWidth < 640) {
                        dropdown.style.top = '';
                        dropdown.style.left = '';
                        dropdown.style.width = '';
                        return;
                    }

                    // Calculate dropdown dimensions
                    const dropdownWidth = Math.min(450, viewportWidth - 32);

                    // Calculate optimal position (relative to viewport since dropdown is fixed)
                    let top = triggerRect.bottom + 8;
                    let left = triggerRect.right - dropdownWidth;

                    // Adjust if dropdown would go off right edge
                    if (left + dropdownWidth > viewportWidth - 16) {
                        left = viewportWidth - dropdownWidth - 16;
                    }

                    // Adjust if dropdown would go off left edge
                    if (left < 16) {
                        left = 16;
                    }

                    // Adjust if dropdown would go off bottom edge
                    const dropdownHeight = Math.min(dropdown.scrollHeight, viewportHeight * 0.8);
                    if (top + dropdownHeight > viewportHeight - 16) {
                        top = triggerRect.top - dropdownHeight - 8;
                    }

                    // Ensure dropdown doesn't go off top edge
                    if (top < 16) {
                        top = 16;
                    }

                    dropdown.style.top = `${top}px`;
                    dropdown.style.left = `${left}px`;
                    dropdown.style.width = `${dropdownWidth}px`;
                    dropdown.style.position = 'fixed';
                }
            }
        };

        positionDropdown();

        // Reposition on window resize and scroll
        window.addEventListener('resize', positionDropdown);
        window.addEventListener('scroll', positionDropdown);

        return () => {
            window.removeEventListener('resize', positionDropdown);
            window.removeEventListener('scroll', positionDropdown);
        };
    }, [durationDropdownId]);

    const lastAddedRef = useRef<number>(0);

    const handleAddSolution = (project: Project) => {
        if (!newSolution.solutionText.trim()) return;

        // Prevent rapid double-clicks (1000ms cooldown — increased for Supabase sync time)
        const now = Date.now();
        if (now - lastAddedRef.current < 1000) return;
        lastAddedRef.current = now;

        // Prevent duplicate: check if solution with same text already exists (trim + case-insensitive)
        const existingSolutions = project.solutions || [];
        const newText = newSolution.solutionText.trim().toLowerCase();
        if (existingSolutions.some(s => s.solutionText.trim().toLowerCase() === newText)) {
            setShowAddSolution(null);
            setNewSolution({ ...EMPTY_SOLUTION });
            return;
        }

        // Also prevent duplicate by checking if any sol-* ID is still pending (not yet synced)
        if (existingSolutions.some(s => s.id.startsWith('sol-'))) {
            // A previous add hasn't been synced yet — skip to prevent double creation
            console.warn('Previous solution still syncing, skipping add');
            return;
        }

        const solution: BrainstormSolution = {
            ...newSolution,
            id: `sol-${now}`,
            entryDate: newSolution.entryDate || formatToday(),
        };

        // Reset form IMMEDIATELY before triggering update (prevents re-submission)
        setNewSolution({ ...EMPTY_SOLUTION });
        setShowAddSolution(null);

        const updatedProject = {
            ...project,
            solutions: [...existingSolutions, solution]
        };
        onUpdateProject?.(updatedProject);
    };

    const handleToggleSolutionDone = (project: Project, solutionId: string) => {
        const updatedSolutions = (project.solutions || []).map(s => {
            if (s.id !== solutionId) return s;

            const newStatus = s.status === 'Done' ? 'Pending' : 'Done';
            const today = formatToday();

            // Update stage tracking for brainstorm stage instead of solution-level actualEndDate
            const currentTracking = s.stageTracking || {};
            const brainstormTracking = currentTracking['brainstorm'] || { startDate: '', expectedDate: '', actualDate: '' };

            return {
                ...s,
                status: newStatus as BrainstormSolution['status'],
                stageTracking: {
                    ...currentTracking,
                    brainstorm: {
                        ...brainstormTracking,
                        actualDate: newStatus === 'Done' ? today : ''
                    }
                }
            };
        });
        onUpdateProject?.({ ...project, solutions: updatedSolutions });
    };

    const handleUpdateSolutionStatus = (project: Project, solutionId: string, newStatus: BrainstormSolution['status'], stageId?: string) => {
        const today = formatToday();
        const effectiveStage = stageId || activeStage[project.id] || 'brainstorm';

        const updatedSolutions = (project.solutions || []).map(s => {
            if (s.id !== solutionId) return s;

            const currentTracking = s.stageTracking || {};
            const stageTracking = { ...(currentTracking[effectiveStage] || { startDate: '', expectedDate: '', actualDate: '' }) };

            // Start date tracking
            if (newStatus === 'In Progress' && !stageTracking.startDate) {
                stageTracking.startDate = today;
            }

            // End date and duration tracking
            if (newStatus === 'Done') {
                stageTracking.actualDate = today;
                const start = stageTracking.startDate || today;
                const startObj = parseDisplayDate(start);
                const actualObj = parseDisplayDate(today);
                if (startObj && actualObj) {
                    stageTracking.workingDaysCount = calculateBusinessDays(startObj, actualObj);
                }
            }

            stageTracking.status = newStatus;

            return {
                ...s,
                status: effectiveStage === 'brainstorm' ? newStatus : s.status,
                stageTracking: {
                    ...currentTracking,
                    [effectiveStage]: stageTracking
                }
            };
        });
        onUpdateProject?.({ ...project, solutions: updatedSolutions });
    };

    const handleDeleteSolution = (project: Project, solutionId: string) => {
        const updatedSolutions = (project.solutions || []).filter(s => s.id !== solutionId);
        onUpdateProject?.({ ...project, solutions: updatedSolutions });
    };

    const handleAddCutKit = (project: Project) => {
        if (!newCutKit.component.trim()) return;
        const item: CutKitItem = { ...newCutKit, id: `ck-${Date.now()}` };
        onUpdateProject?.({ ...project, cutKitItems: [...(project.cutKitItems || []), item] });
        setNewCutKit({ ...EMPTY_CUT_KIT });
        setShowAddCutKit(null);
    };

    const handleDeleteCutKit = (project: Project, itemId: string) => {
        onUpdateProject?.({ ...project, cutKitItems: (project.cutKitItems || []).filter(c => c.id !== itemId) });
    };

    const handleUpdateCutKitStatus = (project: Project, itemId: string, status: CutKitItem['status']) => {
        const updated = (project.cutKitItems || []).map(c => c.id === itemId ? { ...c, status } : c);
        onUpdateProject?.({ ...project, cutKitItems: updated });
    };

    const handleUpdateCutKitReceived = (project: Project, itemId: string, qty: number) => {
        const updated = (project.cutKitItems || []).map(c => c.id === itemId ? { ...c, receivedQty: qty } : c);
        onUpdateProject?.({ ...project, cutKitItems: updated });
    };

    const handleSaveVideo = (project: Project) => {
        onUpdateProject?.({ ...project, videoLink: editVideoLink, videoDescription: editVideoDesc });
        setEditingVideoId(null);
    };

    const handleSaveStageNote = (project: Project, stageId: string) => {
        const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        // Only prepend date if there is text and it doesn't already start with a date bracket
        let textToSave = editNoteText;
        if (textToSave.trim() && !textToSave.trim().startsWith('[')) {
            textToSave = `[${today}] ${textToSave.trim()}`;
        }

        const notes = { ...(project.stageNotes || {}), [stageId]: textToSave };
        onUpdateProject?.({ ...project, stageNotes: notes });
        setEditingNoteKey(null);
    };

    const handleSaveDailyNote = (project: Project, stageId: string, stageName: string) => {
        const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const timestamp = new Date().toISOString();

        const newNote = {
            date: currentDate,
            note: editNoteText,
            timestamp: timestamp,
            stageId: stageId,
            stageName: stageName
        };

        const updatedNotes = [...(project.dailyNotes || []), newNote];
        onUpdateProject?.({ ...project, dailyNotes: updatedNotes });
        setEditingNoteKey(null);
        setEditNoteText('');
    };

    const getStageNotes = (project: Project, stageId: string) => {
        return (project.dailyNotes || []).filter(note => note.stageId === stageId);
    };

    // Reusable Daily Notes Render Function (not a component to avoid focus loss on re-render)
    const renderDailyNotesSection = (project: Project, stageId: string, stageName: string) => {
        const stageNotes = getStageNotes(project, stageId);
        const editKey = `${project.id}-${stageId}`;

        return (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <StickyNote size={10} /> Daily Notes
                    </span>
                    {editingNoteKey !== editKey ? (
                        <button onClick={() => {
                            setEditingNoteKey(editKey);
                            setEditNoteText('');
                        }}
                            className="text-[11px] text-cyan-500 hover:text-cyan-400 font-bold flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-cyan-500/10 transition-colors">
                            <Edit3 size={14} /> Add Note
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => handleSaveDailyNote(project, stageId, stageName)}
                                className="text-[11px] text-green-500 hover:text-green-400 font-bold flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-green-500/10 transition-colors">
                                <Save size={14} /> Save
                            </button>
                            <button onClick={() => setEditingNoteKey(null)}
                                className="text-[11px] text-slate-400 hover:text-slate-300 font-bold px-2 py-1 rounded-lg hover:bg-slate-500/10 transition-colors">
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* Display existing notes */}
                {stageNotes.length > 0 && (
                    <div className="mb-3 space-y-2 max-h-32 overflow-y-auto">
                        {stageNotes
                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                            .map((noteEntry, index) => (
                                <div key={index} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">{noteEntry.date}</span>
                                        <span className="text-[10px] text-slate-400">{new Date(noteEntry.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{noteEntry.note}</p>
                                </div>
                            ))}
                    </div>
                )}

                {editingNoteKey === editKey ? (
                    <textarea value={editNoteText} onChange={e => setEditNoteText(e.target.value)} rows={2}
                        className="w-full px-3 py-2 bg-white dark:bg-[#0F172A] border border-cyan-300 dark:border-cyan-600 rounded-lg text-xs text-slate-800 dark:text-white focus:outline-none resize-none"
                        placeholder={`Add today's note about ${stageName.toLowerCase()}...`} />
                ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">
                        {stageNotes.length > 0
                            ? `${stageNotes.length} note(s) recorded`
                            : 'No notes added yet.'}
                    </p>
                )}
            </div>
        );
    };


    const handleSaveSolutionVideo = (project: Project, solId: string) => {
        const updatedSolutions = (project.solutions || []).map(s => {
            if (s.id !== solId) return s;
            // CRITICAL FIX: Always create a new object to avoid mutation
            const existingVideoTracking = s.stageTracking?.['video'] || { startDate: '', expectedDate: '', actualDate: '' };
            const currentVideoTracking = { ...existingVideoTracking }; // Create a copy to avoid mutation

            // Auto-update actual date if not set
            if (!currentVideoTracking.actualDate) {
                const today = formatToday();
                currentVideoTracking.actualDate = today;
                currentVideoTracking.status = 'Done';
                
                // Calculate working days if start date exists
                if (currentVideoTracking.startDate) {
                    const startObj = parseDisplayDate(currentVideoTracking.startDate);
                    const actualObj = parseDisplayDate(today);
                    if (startObj && actualObj) {
                        currentVideoTracking.workingDaysCount = calculateBusinessDays(startObj, actualObj);
                    }
                }
            }

            return {
                ...s,
                videoLink: editVideoLink,
                videoDescription: editVideoDesc,
                stageTracking: {
                    ...(s.stageTracking || {}),
                    'video': currentVideoTracking
                }
            };
        });
        onUpdateProject?.({ ...project, solutions: updatedSolutions });
        setEditingVideoId(null);
        setEditVideoLink('');
        setEditVideoDesc('');
    };

    const handleSaveSolField = (project: Project, solId: string, field: string) => {
        const currentActiveStage = activeStage[project.id] || TIMELINE_STAGES[0].id;

        console.group(`🔍 SAVING FIELD: ${field} in stage: ${currentActiveStage}`);
        console.log('Project ID:', project.id);
        console.log('Solution ID:', solId);
        console.log('Field Value:', editFieldValue);
        console.log('Active Stage State:', activeStage);
        console.log('Current Active Stage:', currentActiveStage);
        console.log('TIMELINE_STAGES[0].id:', TIMELINE_STAGES[0].id);

        // CRITICAL CHECK: Verify we have a valid stage
        if (!currentActiveStage) {
            console.error('❌ NO ACTIVE STAGE! This will cause issues!');
            console.groupEnd();
            return;
        }

        const updatedSolutions = (project.solutions || []).map(s => {
            if (s.id !== solId) return s;

            console.log('BEFORE - Full Solution:', JSON.parse(JSON.stringify(s)));
            console.log('BEFORE - stageTracking:', JSON.parse(JSON.stringify(s.stageTracking || {})));

            // Check if it is a date field that needs stage-specific tracking
            if (['startDate', 'expectedEndDate', 'actualEndDate'].includes(field)) {
                // CRITICAL FIX: Each stage should have completely independent tracking
                // Do NOT fallback to solution-level dates - this causes cross-stage contamination
                const existingStageDates = s.stageTracking?.[currentActiveStage] || {
                    startDate: '',
                    expectedDate: '',
                    actualDate: ''
                };

                console.log(`Existing dates for stage "${currentActiveStage}":`, existingStageDates);

                // Create a copy to avoid mutation
                const updatedStageDates = { ...existingStageDates };

                if (field === 'startDate') updatedStageDates.startDate = editFieldValue;
                if (field === 'expectedEndDate') updatedStageDates.expectedDate = editFieldValue;
                if (field === 'actualEndDate') updatedStageDates.actualDate = editFieldValue;

                // Calculate working days count if we have both dates
                if (updatedStageDates.startDate && updatedStageDates.actualDate) {
                    const startObj = parseDisplayDate(updatedStageDates.startDate);
                    const actualObj = parseDisplayDate(updatedStageDates.actualDate);
                    if (startObj && actualObj) {
                        updatedStageDates.workingDaysCount = calculateBusinessDays(startObj, actualObj);
                    }
                }

                console.log(`Updated dates for stage "${currentActiveStage}":`, updatedStageDates);

                const newStageTracking = {
                    ...(s.stageTracking || {}),
                    [currentActiveStage]: updatedStageDates
                };

                console.log('AFTER - stageTracking:', JSON.parse(JSON.stringify(newStageTracking)));
                console.log(`✅ Updated ONLY stage "${currentActiveStage}"`, updatedStageDates);
                console.log('Other stages:', Object.keys(newStageTracking).filter(k => k !== currentActiveStage));
                console.groupEnd();

                return {
                    ...s,
                    stageTracking: newStageTracking
                };
            }

            // Update the field
            const updatedSolution = { ...s, [field]: editFieldValue };

            // Auto-calculate savingSmv when operationSMV or routedSmv changes
            if (field === 'operationSMV' || field === 'routedSmv') {
                const costed = parseFloat(field === 'operationSMV' ? editFieldValue : (s.operationSMV || '0'));
                const routed = parseFloat(field === 'routedSmv' ? editFieldValue : (s.routedSmv || '0'));
                if (costed && routed) {
                    updatedSolution.savingSmv = (costed - routed).toFixed(2);
                }
            }

            console.groupEnd();
            return updatedSolution;
        });
        onUpdateProject?.({ ...project, solutions: updatedSolutions });
        setEditingSolField(null);
    };

    const handleSaveSolutionDailyComment = (project: Project, solId: string, text: string, stageId: string) => {
        if (!text.trim()) {
            setEditingSolField(null);
            return;
        }

        const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const timestamp = new Date().toISOString();

        const updatedSolutions = (project.solutions || []).map(s => {
            if (s.id !== solId) return s;

            const existingComments = s.dailyComments || [];
            // Find today's comment for THIS specific stage only
            const todayCommentIndex = existingComments.findIndex(c => c.date === currentDate && (c.stageId || 'brainstorm') === stageId);

            let newComments = [...existingComments];

            if (todayCommentIndex !== -1) {
                // Update existing today's comment for this stage
                newComments[todayCommentIndex] = {
                    ...newComments[todayCommentIndex],
                    note: text,
                    timestamp: timestamp,
                    stageId: stageId
                };
            } else {
                // Add new comment with stageId
                newComments.push({
                    date: currentDate,
                    note: text,
                    timestamp: timestamp,
                    stageId: stageId
                });
            }

            return {
                ...s,
                dailyComments: newComments
            };
        });

        onUpdateProject?.({ ...project, solutions: updatedSolutions });
        setEditingSolField(null);
        setEditFieldValue('');
    };

    const handleSaveSeField = (project: Project, field: keyof Project) => {
        if (!onUpdateProject) return;

        let updatedValue = seFieldValue;
        const updatedProject = { ...project, [field]: updatedValue };

        // Auto-calculate Total Saving if Initial or Latest SMV changes
        if (field === 'initialSmv' || field === 'latestSmv') {
            const init = parseFloat(field === 'initialSmv' ? updatedValue : (project.initialSmv || '0'));
            const latest = parseFloat(field === 'latestSmv' ? updatedValue : (project.latestSmv || '0'));
            if (!isNaN(init) && !isNaN(latest)) {
                updatedProject.totalSmvSaving = (init - latest).toFixed(2);
            }
        }

        // Auto-calculate Impact using new formula:
        // Total Impact ($) = Operational Cost Savings ($) + [saving * order quantity * EPH/60]
        if (field === 'operationalCostSavings' || field === 'eph' || field === 'initialSmv' || field === 'latestSmv') {
            const opCost = parseFloat(field === 'operationalCostSavings' ? updatedValue : (project.operationalCostSavings || '0'));
            const saving = parseFloat(updatedProject.totalSmvSaving || project.totalSmvSaving || '0');
            const orderQty = project.orderQty || 0;
            const eph = parseFloat(field === 'eph' ? updatedValue : (project.eph || '0'));

            if (!isNaN(opCost) && !isNaN(saving) && !isNaN(eph)) {
                const calculatedImpact = opCost + (saving * orderQty * eph / 60);
                updatedProject.impact = calculatedImpact.toFixed(2);
            }
        }

        onUpdateProject(updatedProject);
        setEditingSeField(null);
    };

    const handleAddFileLink = (project: Project, stageId: string) => {
        if (!newFileLink.fileName.trim() || !newFileLink.fileUrl.trim()) return;

        // Get planned date from project's Technical Gates based on stage
        let plannedDate = '';
        if (stageId === 'stw') plannedDate = project.stwDate || '';
        else if (stageId === 'mds') plannedDate = project.mdsDate || '';
        else if (stageId === 'pd') plannedDate = project.pdDate || '';

        // Automatically set actual date to today
        const actualDate = formatToday();

        const link: StageFileLink = {
            ...newFileLink,
            id: `fl-${Date.now()}`,
            stageId,
            plannedDate,
            actualDate,
            uploadedAt: formatToday(),
            uploadedBy: currentUserEmail || 'Unknown User',
        };
        onUpdateProject?.({ ...project, stageFiles: [...(project.stageFiles || []), link] });
        setNewFileLink({ solutionId: '', fileName: '', fileUrl: '', fileType: 'pdf', plannedDate: '', actualDate: '' });
        setShowAddFileLink(null);
    };


    const handleDeleteFileLink = (project: Project, linkId: string) => {
        onUpdateProject?.({ ...project, stageFiles: (project.stageFiles || []).filter(f => f.id !== linkId) });
    };



    const handleUpdateMachineStatus = (project: Project, solutionId: string, machineId: string, status: SolutionMachine['kitStatus']) => {
        const updatedSolutions = (project.solutions || []).map(sol => {
            if (sol.id === solutionId) {
                const updatedMachines = (sol.machines || []).map(m =>
                    m.id === machineId ? { ...m, kitStatus: status } : m
                );
                return { ...sol, machines: updatedMachines };
            }
            return sol;
        });

        const updatedProject = { ...project, solutions: updatedSolutions };
        onUpdateProject?.(updatedProject);
    };

    const handleSaveCutActual = (project: Project, field: keyof CutActuals) => {
        const currentActuals = project.cutActuals || {};
        const updatedActuals = { ...currentActuals, [field]: cutActualValue };
        onUpdateProject?.({ ...project, cutActuals: updatedActuals });
        setEditingCutActual(null);
    };

    if (projects.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-500 font-bold text-xs uppercase tracking-widest">
                No active timelines found
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-10">
            {projects.map((project) => {
                // Calculate progress based on ACTUAL completion, not planned dates
                const completedStages = TIMELINE_STAGES.filter(stage => isStageActuallyCompleted(project, stage.id)).length;
                const totalStages = TIMELINE_STAGES.length;
                const progressPercentage = Math.round((completedStages / totalStages) * 100);
                const plantColor = PLANT_COLORS[project.plant] || 'text-slate-400';
                const currentActiveStage = activeStage[project.id] || '';
                const solutions = project.solutions || [];

                return (
                    <div
                        key={project.id}
                        className={`bg-white dark:bg-[#1E293B] rounded-xl border transition-all duration-200 relative ${durationDropdownId === project.id || deadlineDropdownId === project.id ? 'z-50' : 'z-10'
                            } ${expandedId === project.id
                                ? 'border-cyan-500 shadow-xl shadow-cyan-900/10 ring-1 ring-cyan-500/20'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                    >
                        {/* Summary Strip */}
                        <div
                            className={`p-3 sm:p-4 flex flex-col lg:flex-row lg:items-start gap-4 sm:gap-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${expandedId === project.id ? 'rounded-t-xl' : 'rounded-xl'}`}
                            onClick={() => setExpandedId(expandedId === project.id ? null : project.id)}
                        >
                            {/* Project Info Block */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-tight ${project.status.includes('Hold') ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-blue-600 text-white'
                                        }`}>
                                        {project.status}
                                    </span>

                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-slate-500 font-bold uppercase">Style No:</span>
                                        <h3 className="text-sm font-black text-slate-800 dark:text-white">{project.styleNo}</h3>
                                    </div>

                                    <span className="hidden md:inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                    <span className={`text-xs font-black uppercase ${plantColor}`}>PLANT NAME: {project.plant}</span>
                                    <span className="hidden md:inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                    <span className="text-xs text-slate-400 dark:text-slate-400 font-bold uppercase truncate">{project.product}</span>

                                    {project.chassis && (
                                        <>
                                            <span className="hidden md:inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                            <span className="text-xs text-purple-500 dark:text-purple-400 font-black uppercase tracking-wide">
                                                {project.chassis}
                                            </span>
                                        </>
                                    )}
                                </div>

                                {/* Solutions count badge */}
                                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20">
                                        <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                                            {solutions.length} Solution{solutions.length > 1 ? 's' : ''} • {solutions.filter(s => s.status === 'Done').length} Done
                                        </span>
                                    </div>
                                {/* Handed From Badge */}
                                {project.handoverSource && (
                                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 ml-2">
                                        <History size={9} className="text-indigo-500" />
                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Handed From {project.handoverSource}</span>
                                        {project.styleInDate && (
                                            <span className="text-[7px] text-indigo-500/70 ml-1">({project.styleInDate})</span>
                                        )}
                                    </div>
                                )}
                                {/* VE Handover Badge */}
                                {project.veHandover && (
                                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 ml-2">
                                        <Send size={9} className="text-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Handed → {project.veHandover}</span>
                                        {project.veHandoverDate && (
                                            <span className="text-[7px] text-emerald-500/70 ml-1">({project.veHandoverDate})</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Mobile Compact Progress Bar */}
                            <div className="flex lg:hidden items-center gap-2 mt-1">
                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                                    {TIMELINE_STAGES.map((stage, idx) => {
                                        const isCompleted = isStageActuallyCompleted(project, stage.id);
                                        return (
                                            <div key={idx} className={`flex-1 rounded-full ${isCompleted ? 'bg-cyan-500' : isStageStarted(project, stage.id) ? 'bg-red-600 dark:bg-red-600' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                        );
                                    })}
                                </div>
                                <span className="text-[11px] font-black text-cyan-600 dark:text-cyan-400 shrink-0">{progressPercentage}%</span>
                            </div>

                            {/* Progress & Timeline (Desktop) */}
                            <div className="hidden lg:flex items-center gap-6 flex-[2] self-center border-l border-slate-100 dark:border-slate-800/50 pl-6">

                                {/* Timeline Visualization */}
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pipeline Progress</span>
                                        <span className={`text-[11px] font-black ${progressPercentage === 100 ? 'text-green-500 dark:text-green-400' : 'text-cyan-600 dark:text-cyan-400'}`}>
                                            {progressPercentage}%
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {TIMELINE_STAGES.map((stage) => {
                                            const isDone = isStageActuallyCompleted(project, stage.id);
                                            // Determine Display Date (Actual vs Plan)
                                            let displayDate = project[stage.dateKey as keyof Project] as string | undefined;

                                            // Override with Actual Date if available for specific stages
                                            if (stage.id === 'cut_check') {
                                                const actuals = project.cutActuals || {};
                                                if (actuals.handover) displayDate = actuals.handover;
                                                else if (actuals.received) displayDate = actuals.received;
                                            } else if (stage.id === 'mach_avail') {
                                                const solutionsWithActuals = (project.solutions || []).filter(s => !!s.actualMachineDate);
                                                if (solutionsWithActuals.length > 0) {
                                                    const latest = solutionsWithActuals.sort((a, b) => {
                                                        const d1 = parseDate(a.actualMachineDate || '')?.getTime() || 0;
                                                        const d2 = parseDate(b.actualMachineDate || '')?.getTime() || 0;
                                                        return d2 - d1;
                                                    })[0];
                                                    if (latest.actualMachineDate) displayDate = latest.actualMachineDate;
                                                }
                                            } else if (stage.id === 'brainstorm') {
                                                const doneSolutions = (project.solutions || []).filter(s => s.status === 'Done' && s.actualEndDate);
                                                if (doneSolutions.length > 0) {
                                                    const latest = doneSolutions.sort((a, b) => {
                                                        const d1 = parseDate(a.actualEndDate || '')?.getTime() || 0;
                                                        const d2 = parseDate(b.actualEndDate || '')?.getTime() || 0;
                                                        return d2 - d1;
                                                    })[0];
                                                    if (latest.actualEndDate) displayDate = latest.actualEndDate;
                                                }
                                            } else if (['trial', 'mockup', 'valid', 'video'].includes(stage.id)) {
                                                const relevantSolutions = (project.solutions || []).filter(sol =>
                                                    !!(sol.stageTracking?.[stage.id]?.actualDate)
                                                );
                                                if (relevantSolutions.length > 0) {
                                                    const latest = relevantSolutions.sort((a, b) => {
                                                        const d1 = parseDate(a.stageTracking?.[stage.id]?.actualDate || '')?.getTime() || 0;
                                                        const d2 = parseDate(b.stageTracking?.[stage.id]?.actualDate || '')?.getTime() || 0;
                                                        return d2 - d1;
                                                    })[0];
                                                    const act = latest.stageTracking?.[stage.id]?.actualDate;
                                                    if (act) displayDate = act;
                                                }
                                            } else if (['stw', 'mds', 'pd'].includes(stage.id)) {
                                                const stageFileLinks = (project.stageFiles || []).filter(f => f.stageId === stage.id && f.actualDate);
                                                if (stageFileLinks.length > 0) {
                                                    const latest = stageFileLinks.sort((a, b) => {
                                                        const d1 = parseDate(a.actualDate || '')?.getTime() || 0;
                                                        const d2 = parseDate(b.actualDate || '')?.getTime() || 0;
                                                        return d2 - d1;
                                                    })[0];
                                                    if (latest.actualDate) displayDate = latest.actualDate;
                                                }
                                            } else if (stage.id === 'share') {
                                                if (project.seSignoffDate) displayDate = project.seSignoffDate;
                                            }

                                            return (
                                                <div key={stage.id} className="flex items-center flex-1 group relative">
                                                    <div
                                                        className={`h-1.5 flex-1 rounded-full mr-1 transition-colors ${isDone
                                                            ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                                                            : isStageStarted(project, stage.id) ? 'bg-red-600 dark:bg-red-600 border border-red-500/50'
                                                            : 'bg-slate-300 dark:bg-slate-600 border border-slate-400/30 dark:border-slate-500/30'
                                                            }`}
                                                    />
                                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] bg-slate-900 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none border border-slate-700 shadow-xl">
                                                        {stage.label}: {displayDate || 'Pending Action'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Style In Date */}
                                <div className="shrink-0 text-right min-w-[80px]">
                                    <div className="flex items-center justify-end gap-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                                        <Calendar size={10} className="text-emerald-500" /> Style In
                                    </div>
                                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                        {project.styleInDate || 'TBD'}
                                    </div>
                                </div>

                                {/* Deadline Info */}
                                <div className="shrink-0 text-right min-w-[100px] relative">
                                    <div className="flex items-center justify-end gap-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                                        <Calendar size={10} /> Deadline
                                    </div>
                                    <div
                                        className={`text-[11px] font-bold flex items-center justify-end gap-1 ${project.deadlineStatus === 'Overdue' ? 'text-red-500' :
                                            project.deadlineStatus === 'Approaching' ? 'text-amber-500' : 'text-slate-700 dark:text-slate-200'
                                            } ${(project.deadlineHistory && project.deadlineHistory.length > 0) || project.extendedDeadline ? 'cursor-pointer hover:opacity-80' : ''}`}
                                        onClick={(e) => {
                                            if ((project.deadlineHistory && project.deadlineHistory.length > 0) || project.extendedDeadline) {
                                                e.stopPropagation();
                                                setDeadlineDropdownId(deadlineDropdownId === project.id ? null : project.id);
                                            }
                                        }}
                                    >
                                        {project.extendedDeadline || project.styleDueDate || 'TBD'}
                                        {((project.deadlineHistory && project.deadlineHistory.length > 0) || project.extendedDeadline) && (
                                            <ChevronDown size={12} className={`text-slate-400 dark:text-slate-500 transition-transform ${deadlineDropdownId === project.id ? 'rotate-180' : ''}`} />
                                        )}
                                    </div>
                                    {project.extendedDeadline && (
                                        <div className="text-[10px] text-amber-500 font-bold mt-0.5">Extended</div>
                                    )}

                                    {/* Deadline Extension History Dropdown */}
                                    {deadlineDropdownId === project.id && (
                                        <div data-dropdown className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in text-left" onClick={(e) => e.stopPropagation()}>
                                            <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <History size={12} /> Extension Timeline
                                            </h4>
                                            <div className="relative pl-3 border-l border-slate-200 dark:border-slate-700 ml-1 space-y-4">
                                                {project.extendedDeadline && (
                                                    <div className="relative">
                                                        <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                                                        <div className="text-xs font-bold text-amber-600 dark:text-amber-400">{project.extendedDeadline}</div>
                                                        <div className="text-[11px] text-amber-500 dark:text-amber-400/70 uppercase mt-0.5 font-bold">Current (Extended)</div>
                                                    </div>
                                                )}
                                                {project.deadlineHistory && project.deadlineHistory.map((h, i) => (
                                                    <div key={i} className="relative">
                                                        <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-purple-500"></div>
                                                        <div className="text-xs font-bold text-slate-800 dark:text-white">{h.date}</div>
                                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 italic">{h.reason}</div>
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-600 mt-1 uppercase">By: {h.updatedBy}</div>
                                                    </div>
                                                ))}
                                                {project.styleDueDate && (
                                                    <div className="relative">
                                                        <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600"></div>
                                                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{project.styleDueDate}</div>
                                                        <div className="text-[11px] text-slate-400 dark:text-slate-500 uppercase mt-0.5 font-bold">Original Plan</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Duration Info */}
                                <div
                                    data-dropdown
                                    data-duration-trigger={project.id}
                                    className="shrink-0 text-right min-w-[100px] relative cursor-pointer group/duration"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDurationDropdownId(durationDropdownId === project.id ? null : project.id);
                                    }}
                                >
                                    <div className="flex items-center justify-end gap-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 group-hover/duration:text-cyan-500 transition-colors">
                                        <Clock size={10} className="text-cyan-500" /> Duration
                                    </div>
                                    <div className="flex items-center justify-end gap-1 hover:opacity-80 transition-opacity">
                                        <DurationDisplay project={project} compact={true} />
                                        <ChevronDown size={12} className={`text-slate-400 dark:text-slate-500 transition-transform ${durationDropdownId === project.id ? 'rotate-180' : ''}`} />
                                    </div>

                                    {/* Duration Dropdown */}
                                    {durationDropdownId === project.id && (
                                        <>
                                            {/* Mobile Modal Overlay */}
                                            <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setDurationDropdownId(null)} />

                                            {/* Desktop Dropdown / Mobile Modal */}
                                            <div
                                                ref={durationDropdownRef}
                                                data-dropdown
                                                className="fixed bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[60] animate-in fade-in text-left max-h-[80vh] overflow-y-auto
                                                          sm:max-w-none
                                                          max-lg:inset-x-4 max-lg:top-1/2 max-lg:-translate-y-1/2 max-lg:max-h-[90vh]
                                                          lg:w-[450px]"
                                                onClick={(e) => e.stopPropagation()}>
                                                {/* Close button */}
                                                <div className="absolute top-3 right-3 z-10">
                                                    <button
                                                        onClick={() => setDurationDropdownId(null)}
                                                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                                <DurationDisplay project={project} />
                                            </div>
                                        </>
                                    )}
                                </div>

                            </div>

                            {/* Right Meta */}
                            <div className="flex items-center gap-4 shrink-0 self-center">
                                <ChevronRight
                                    size={16}
                                    className={`text-slate-400 dark:text-slate-500 transition-transform ${expandedId === project.id ? 'rotate-90' : ''}`}
                                />
                            </div>
                        </div>

                        {/* ===== EXPANDED SECTION ===== */}
                        {expandedId === project.id && (
                            <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0F172A]/50 p-3 sm:p-6 animate-in fade-in slide-in-from-top-2 duration-200 rounded-b-xl">

                                {/* Clickable Critical Path Stepper */}
                                <div className="relative">
                                    <div className="flex w-full items-start overflow-x-auto pb-6 custom-scrollbar px-2">
                                        {TIMELINE_STAGES.map((stage, idx) => {
                                            const isDone = isStageActuallyCompleted(project, stage.id);
                                            const isNext = !isDone && (idx === 0 || isStageActuallyCompleted(project, TIMELINE_STAGES[idx - 1].id));
                                            const isActive = currentActiveStage === stage.id;

                                            const stageHasStarted = isStageStarted(project, stage.id);
                                            let statusBaseClass = isDone
                                                ? 'bg-white dark:bg-[#1E293B] border-cyan-500 text-cyan-600 dark:text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                                                : stageHasStarted
                                                    ? 'bg-white dark:bg-[#1E293B] border-red-500 dark:border-red-600 text-red-500 dark:text-red-400'
                                                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500';

                                            // Custom Logic for Cut Check Stage
                                            if (stage.id === 'cut_check') {
                                                const actuals = project.cutActuals || {};
                                                // Check for the most critical/latest actual date that might be late
                                                // Or check logic: if any part is late?
                                                // For cut check, usually 'handover' is the final step?
                                                // Let's check all pairs. If any is late -> Red/Yellow.

                                                const comparisons = [
                                                    { act: actuals.requested, plan: project.cutRequestedDate },
                                                    { act: actuals.required, plan: project.cutRequiredDate },
                                                    { act: actuals.received, plan: project.cutReceivedDate },
                                                    { act: actuals.handover, plan: project.cutHandoverDate },
                                                ];

                                                // Find worst status
                                                let worstStatus = null;
                                                for (const comp of comparisons) {
                                                    const status = getDateStatusColor(comp.act, comp.plan);
                                                    if (status) {
                                                        if (status.includes('bg-red')) {
                                                            worstStatus = status;
                                                            break; // Red is worst, stop
                                                        }
                                                        if (status.includes('bg-yellow')) {
                                                            worstStatus = status;
                                                        } else if (!worstStatus) {
                                                            worstStatus = status; // Green
                                                        }
                                                    }
                                                }
                                                if (worstStatus) statusBaseClass = worstStatus;
                                            }

                                            // Custom Logic for Machine Availability Stage
                                            if (stage.id === 'mach_avail') {
                                                const planDate = project.machineAvailabilityDate;
                                                const solutionsWithActuals = (project.solutions || []).filter(s => !!s.actualMachineDate);

                                                if (solutionsWithActuals.length > 0 && planDate) {
                                                    // Check worst status among machines
                                                    let worstStatus = null;
                                                    for (const s of solutionsWithActuals) {
                                                        const status = getDateStatusColor(s.actualMachineDate, planDate);
                                                        if (status) {
                                                            if (status.includes('bg-red')) {
                                                                worstStatus = status;
                                                                break;
                                                            }
                                                            if (status.includes('bg-yellow')) {
                                                                worstStatus = status;
                                                            } else if (!worstStatus) {
                                                                worstStatus = status;
                                                            }
                                                        }
                                                    }
                                                    if (worstStatus) statusBaseClass = worstStatus;
                                                }
                                            }

                                            // Custom Logic for STW, MDS, PD Stages - Document Upload Date Comparison
                                            if (['stw', 'mds', 'pd'].includes(stage.id)) {
                                                // Get plan date from project's Technical Gates
                                                let planDate = '';
                                                if (stage.id === 'stw') planDate = project.stwDate || '';
                                                else if (stage.id === 'mds') planDate = project.mdsDate || '';
                                                else if (stage.id === 'pd') planDate = project.pdDate || '';

                                                // Get all file links for this stage
                                                const stageFileLinks = (project.stageFiles || []).filter(f => f.stageId === stage.id && f.actualDate);

                                                if (stageFileLinks.length > 0 && planDate) {
                                                    // Check worst status among all uploaded documents
                                                    let worstStatus = null;
                                                    for (const fileLink of stageFileLinks) {
                                                        const status = getDateStatusColor(fileLink.actualDate, planDate);
                                                        if (status) {
                                                            if (status.includes('bg-red')) {
                                                                worstStatus = status;
                                                                break; // Red is worst, stop checking
                                                            }
                                                            if (status.includes('bg-yellow')) {
                                                                worstStatus = status;
                                                            } else if (!worstStatus) {
                                                                worstStatus = status;
                                                            }
                                                        }
                                                    }
                                                    if (worstStatus) statusBaseClass = worstStatus;
                                                }
                                            }

                                            // Custom Logic for Brainstorm Stage
                                            if (stage.id === 'brainstorm') {
                                                const planDate = project.brainstormingDate;
                                                // Check for "Done" solutions and compare against plan
                                                const doneSolutions = (project.solutions || []).filter(s => s.status === 'Done' && s.actualEndDate);

                                                if (doneSolutions.length > 0 && planDate) {
                                                    // Find latest actual end date
                                                    const latest = doneSolutions.sort((a, b) => {
                                                        const d1 = parseDate(a.actualEndDate || '')?.getTime() || 0;
                                                        const d2 = parseDate(b.actualEndDate || '')?.getTime() || 0;
                                                        return d2 - d1;
                                                    })[0];

                                                    if (latest.actualEndDate) {
                                                        const status = getDateStatusColor(latest.actualEndDate, planDate);
                                                        if (status) statusBaseClass = status;
                                                    }
                                                }
                                            }

                                            // Custom Logic for Trial, Mockup, Valid, Video Stages
                                            if (['trial', 'mockup', 'valid', 'video'].includes(stage.id)) {
                                                const planDate = project[stage.dateKey as keyof Project] as string;
                                                const relevantSolutions = project.solutions || [];

                                                // Check if ANY solution tracks this stage and has an actual date
                                                // Removed generic 'sol.actualEndDate' fallback so stages become independent
                                                const solutionsWithActuals = relevantSolutions.filter(sol =>
                                                    !!sol.stageTracking?.[stage.id]?.actualDate
                                                );

                                                if (solutionsWithActuals.length > 0 && planDate) {
                                                    let worstStatus = null;
                                                    for (const sol of solutionsWithActuals) {
                                                        const act = sol.stageTracking?.[stage.id]?.actualDate;
                                                        const status = getDateStatusColor(act, planDate);
                                                        if (status) {
                                                            if (status.includes('bg-red')) {
                                                                worstStatus = status;
                                                                break;
                                                            }
                                                            if (status.includes('bg-yellow')) {
                                                                worstStatus = status;
                                                            } else if (!worstStatus) {
                                                                worstStatus = status;
                                                            }
                                                        }
                                                    }
                                                    if (worstStatus) statusBaseClass = worstStatus;
                                                }
                                            }

                                            // Determine Display Date (Actual vs Plan)
                                            let displayDate = project[stage.dateKey as keyof Project] as string | undefined;

                                            // Override with Actual Date if available for specific stages
                                            if (stage.id === 'cut_check') {
                                                const actuals = project.cutActuals || {};
                                                // Use Handover date as the completion date, or the latest available actual?
                                                // User wants "actual completion date". Handover is the final step of Cut Check.
                                                if (actuals.handover) displayDate = actuals.handover;
                                                else if (actuals.received) displayDate = actuals.received;
                                            } else if (stage.id === 'brainstorm') {
                                                const doneSolutions = (project.solutions || []).filter(s => s.status === 'Done' && s.actualEndDate);
                                                if (doneSolutions.length > 0) {
                                                    const latest = doneSolutions.sort((a, b) => {
                                                        const d1 = parseDate(a.actualEndDate || '')?.getTime() || 0;
                                                        const d2 = parseDate(b.actualEndDate || '')?.getTime() || 0;
                                                        return d2 - d1;
                                                    })[0];
                                                    if (latest.actualEndDate) displayDate = latest.actualEndDate;
                                                }
                                            } else if (stage.id === 'mach_avail') {
                                                // Find latest actual machine date
                                                const solutionsWithActuals = (project.solutions || []).filter(s => !!s.actualMachineDate);
                                                if (solutionsWithActuals.length > 0) {
                                                    // Sort to find latest
                                                    const latest = solutionsWithActuals.sort((a, b) => {
                                                        const d1 = parseDate(a.actualMachineDate || '')?.getTime() || 0;
                                                        const d2 = parseDate(b.actualMachineDate || '')?.getTime() || 0;
                                                        return d2 - d1;
                                                    })[0];
                                                    if (latest.actualMachineDate) displayDate = latest.actualMachineDate;
                                                }
                                            } else if (['stw', 'mds', 'pd'].includes(stage.id)) {
                                                // Find latest actual date from file uploads for STW, MDS, PD
                                                const stageFileLinks = (project.stageFiles || []).filter(f => f.stageId === stage.id && f.actualDate);
                                                if (stageFileLinks.length > 0) {
                                                    // Sort to find latest
                                                    const latest = stageFileLinks.sort((a, b) => {
                                                        const d1 = parseDate(a.actualDate || '')?.getTime() || 0;
                                                        const d2 = parseDate(b.actualDate || '')?.getTime() || 0;
                                                        return d2 - d1;
                                                    })[0];
                                                    if (latest.actualDate) displayDate = latest.actualDate;
                                                }
                                            } else if (['trial', 'mockup', 'valid', 'video'].includes(stage.id)) {
                                                // Find latest actual end date for this stage
                                                const relevantSolutions = (project.solutions || []).filter(sol =>
                                                    !!sol.stageTracking?.[stage.id]?.actualDate
                                                );
                                                if (relevantSolutions.length > 0) {
                                                    const latest = relevantSolutions.sort((a, b) => {
                                                        const d1 = parseDate(a.stageTracking?.[stage.id]?.actualDate || '')?.getTime() || 0;
                                                        const d2 = parseDate(b.stageTracking?.[stage.id]?.actualDate || '')?.getTime() || 0;
                                                        return d2 - d1;
                                                    })[0];
                                                    const act = latest.stageTracking?.[stage.id]?.actualDate;
                                                    if (act) displayDate = act;
                                                }
                                            }

                                            return (
                                                <div
                                                    key={stage.id}
                                                    className={`relative flex flex-col items-center min-w-[60px] sm:min-w-[72px] flex-1 group cursor-pointer transition-all shrink-0 ${isActive ? 'scale-105 sm:scale-110' : 'hover:scale-105'}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveStage(prev => ({
                                                            ...prev,
                                                            [project.id]: prev[project.id] === stage.id ? '' : stage.id
                                                        }));
                                                    }}
                                                >
                                                    <div className={`absolute top-5 h-0.5 -z-10 ${idx === 0 ? 'left-1/2 w-1/2' : idx === TIMELINE_STAGES.length - 1 ? 'left-0 w-1/2' : 'left-0 w-full'} ${
                                                        isDone
                                                            ? statusBaseClass.includes('bg-red') ? 'bg-red-400 dark:bg-red-600' 
                                                            : statusBaseClass.includes('bg-yellow') ? 'bg-yellow-400 dark:bg-yellow-600'
                                                            : 'bg-cyan-400 dark:bg-cyan-600'
                                                        : isNext ? 'bg-gradient-to-r from-cyan-400 to-slate-200 dark:from-cyan-600 dark:to-slate-800'
                                                        : stageHasStarted ? 'bg-red-200 dark:bg-red-900/30'
                                                        : 'bg-slate-200 dark:bg-slate-700'
                                                    }`} />
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center border-4 z-10 transition-all ${isActive
                                                            ? 'bg-cyan-100 dark:bg-cyan-900 border-cyan-400 text-cyan-700 dark:text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] ring-2 ring-cyan-300/50'
                                                            : isNext
                                                                ? 'bg-red-50 dark:bg-red-900 border-red-500 text-red-600 dark:text-red-200 animate-pulse'
                                                                : !stageHasStarted && !isDone
                                                                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500'
                                                                    : statusBaseClass
                                                            }`}
                                                    >
                                                        <stage.icon size={18} />
                                                    </div>
                                                    <div className="mt-2 sm:mt-3 text-center">
                                                        <div className={`text-[7px] sm:text-[11px] font-black uppercase tracking-wider mb-1 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : isDone ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                                                            {stage.label}
                                                        </div>
                                                        {displayDate ? (
                                                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${statusBaseClass.includes('bg-red') ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/20' :
                                                                statusBaseClass.includes('bg-yellow') ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-500/20' :
                                                                    statusBaseClass.includes('bg-green') ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/20' :
                                                                        'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20'
                                                                }`}>
                                                                {displayDate}
                                                            </div>
                                                        ) : (
                                                            <div className="text-[10px] font-bold text-slate-300 dark:text-red-800/60">--</div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* ===== STAGE DETAIL PANEL ===== */}
                                {currentActiveStage && (
                                    <div className="mt-2 mb-6 bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        {/* Stage Header */}
                                        <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {(() => {
                                                    const stageInfo = TIMELINE_STAGES.find(s => s.id === currentActiveStage);
                                                    if (!stageInfo) return null;
                                                    const StageIcon = stageInfo.icon;
                                                    return <StageIcon size={14} className="text-cyan-500" />;
                                                })()}
                                                <h4 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest">
                                                    {TIMELINE_STAGES.find(s => s.id === currentActiveStage)?.label} — Details
                                                </h4>
                                            </div>
                                            <button
                                                onClick={() => setActiveStage(prev => ({ ...prev, [project.id]: '' }))}
                                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>



                                        <div className="p-4">
                                            {/* === BRAINSTORM STAGE: Show solutions table with add functionality === */}
                                            {currentActiveStage === 'brainstorm' ? (
                                                <div>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <Lightbulb size={14} className="text-yellow-500" />
                                                            <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                                                                Brainstorm Solutions ({solutions.length})
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => setShowAddSolution(showAddSolution === project.id ? null : project.id)}
                                                            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[11px] font-black uppercase tracking-wider transition-all shadow-lg shadow-cyan-600/20"
                                                        >
                                                            <Plus size={14} /> Add Solution
                                                        </button>
                                                    </div>

                                                    {/* Add Solution Form */}
                                                    {showAddSolution === project.id && (
                                                        <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in">
                                                            <h5 className="text-[11px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                                <Plus size={10} /> New Solution Entry
                                                            </h5>
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                                                                <div className="md:col-span-2">
                                                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Solution *</label>
                                                                    <input value={newSolution.solutionText} onChange={e => setNewSolution(p => ({ ...p, solutionText: e.target.value }))}
                                                                        className="w-full px-2 py-1.5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:border-cyan-500 outline-none" placeholder="Solution description (required)" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Operation</label>
                                                                    <input value={newSolution.operation} onChange={e => setNewSolution(p => ({ ...p, operation: e.target.value }))}
                                                                        className="w-full px-2 py-1.5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:border-cyan-500 outline-none" placeholder="Operation description" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mechanic</label>
                                                                    <input value={newSolution.team} onChange={e => setNewSolution(p => ({ ...p, team: e.target.value }))}
                                                                        className="w-full px-2 py-1.5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:border-cyan-500 outline-none" placeholder="Mechanic name" />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Machine Code</label>
                                                                    <input value={newSolution.machineCode} onChange={e => setNewSolution(p => ({ ...p, machineCode: e.target.value }))}
                                                                        className="w-full px-2 py-1.5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:border-cyan-500 outline-none" placeholder="e.g. SND" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">SMV</label>
                                                                    <input value={newSolution.operationSMV} onChange={e => setNewSolution(p => ({ ...p, operationSMV: e.target.value }))}
                                                                        className="w-full px-2 py-1.5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:border-cyan-500 outline-none" placeholder="e.g. 16.10" />
                                                                </div>
                                                            </div>
                                                            <div className="mb-3">
                                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Comments</label>
                                                                <input value={newSolution.comments} onChange={e => setNewSolution(p => ({ ...p, comments: e.target.value }))}
                                                                    onFocus={() => {
                                                                        // Auto append date block when clicking if empty
                                                                        if (!newSolution.comments) {
                                                                            const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                                                                            setNewSolution(p => ({ ...p, comments: `[${today}] ` }));
                                                                        }
                                                                    }}
                                                                    className="w-full px-2 py-1.5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:border-cyan-500 outline-none" placeholder="[DD-MMM] Reason / Note..." />
                                                            </div>
                                                            <div className="flex gap-2 justify-end">
                                                                <button onClick={() => { setShowAddSolution(null); setNewSolution({ ...EMPTY_SOLUTION }); }}
                                                                    className="px-4 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors">Cancel</button>
                                                                <button onClick={() => handleAddSolution(project)}
                                                                    disabled={!newSolution.solutionText.trim()}
                                                                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-lg text-[11px] font-black uppercase tracking-wider transition-all">
                                                                    Save Solution
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Solutions Table */}
                                                    {solutions.length > 0 ? (
                                                        <div className="overflow-x-auto custom-scrollbar">
                                                            <table className="w-full text-left">
                                                                <thead>
                                                                    <tr className="bg-slate-100 dark:bg-slate-800/80">
                                                                        <th className="px-3 py-2 text-xs font-black text-slate-500 uppercase tracking-widest">Solution</th>
                                                                        <th className="px-3 py-2 text-xs font-black text-slate-500 uppercase tracking-widest">Operation</th>
                                                                        <th className="px-3 py-2 text-xs font-black text-slate-500 uppercase tracking-widest">Mechanic</th>
                                                                        <th className="px-3 py-2 text-xs font-black text-slate-500 uppercase tracking-widest">SMV Saving</th>
                                                                        <th className="px-3 py-2 text-xs font-black text-slate-500 uppercase tracking-widest">Expected SMV</th>
                                                                        <th className="px-3 py-2 text-xs font-black text-slate-500 uppercase tracking-widest">Routed SMV</th>
                                                                        <th className="px-3 py-2 text-xs font-black text-slate-500 uppercase tracking-widest">Costed SMV</th>
                                                                        <th className="px-3 py-2 text-xs font-black text-slate-500 uppercase tracking-widest">Comments</th>
                                                                        <th className="px-3 py-2 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                                                                        <th className="px-3 py-2 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {solutions.map((sol) => {
                                                                        const stageDays = getLiveStageDays(sol, 'brainstorm');
                                                                        return (
                                                                            <tr key={sol.id} className={`border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${sol.status === 'Done' ? 'opacity-70' : ''}`}>

                                                                            {/* Solution Text - Editable */}
                                                                            <td className="px-3 py-2.5">
                                                                                {editingSolField?.projId === project.id && editingSolField?.solId === sol.id && editingSolField?.field === 'solutionText' ? (
                                                                                    <textarea
                                                                                        autoFocus
                                                                                        rows={2}
                                                                                        value={editFieldValue}
                                                                                        onChange={(e) => setEditFieldValue(e.target.value)}
                                                                                        onBlur={() => handleSaveSolField(project, sol.id, 'solutionText')}
                                                                                        onKeyDown={(e) => {
                                                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                                                e.preventDefault();
                                                                                                handleSaveSolField(project, sol.id, 'solutionText');
                                                                                            }
                                                                                        }}
                                                                                        className="w-full text-xs bg-white dark:bg-slate-800 border border-cyan-400 rounded px-2 py-1 outline-none resize-none"
                                                                                    />
                                                                                ) : (
                                                                                    <div
                                                                                        onClick={() => { setEditingSolField({ projId: project.id, solId: sol.id, field: 'solutionText' }); setEditFieldValue(sol.solutionText || ''); }}
                                                                                        className="text-xs font-bold text-cyan-700 dark:text-cyan-400 max-w-[200px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-2 py-1 -mx-2 -my-1 transition-colors min-h-[24px] break-words whitespace-normal leading-relaxed"
                                                                                    >
                                                                                        {sol.solutionText || '-'}
                                                                                    </div>
                                                                                )}
                                                                            </td>

                                                                            {/* Operation - Editable */}
                                                                            <td className="px-3 py-2.5">
                                                                                {editingSolField?.projId === project.id && editingSolField?.solId === sol.id && editingSolField?.field === 'operation' ? (
                                                                                    <input
                                                                                        type="text"
                                                                                        autoFocus
                                                                                        value={editFieldValue}
                                                                                        onChange={(e) => setEditFieldValue(e.target.value)}
                                                                                        onBlur={() => handleSaveSolField(project, sol.id, 'operation')}
                                                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveSolField(project, sol.id, 'operation')}
                                                                                        className="w-full text-xs bg-white dark:bg-slate-800 border border-cyan-400 rounded px-2 py-1 outline-none"
                                                                                    />
                                                                                ) : (
                                                                                    <div
                                                                                        onClick={() => { setEditingSolField({ projId: project.id, solId: sol.id, field: 'operation' }); setEditFieldValue(sol.operation || ''); }}
                                                                                        className="text-xs text-slate-600 dark:text-slate-400 max-w-[180px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-2 py-1 -mx-2 -my-1 transition-colors min-h-[24px] break-words whitespace-normal leading-relaxed"
                                                                                    >
                                                                                        {sol.operation || '-'}
                                                                                    </div>
                                                                                )}
                                                                            </td>

                                                                            {/* Mechanic (Machine) - Editable */}
                                                                            <td className="px-3 py-2.5">
                                                                                {editingSolField?.projId === project.id && editingSolField?.solId === sol.id && editingSolField?.field === 'machineCode' ? (
                                                                                    <input
                                                                                        type="text"
                                                                                        autoFocus
                                                                                        value={editFieldValue}
                                                                                        onChange={(e) => setEditFieldValue(e.target.value)}
                                                                                        onBlur={() => handleSaveSolField(project, sol.id, 'machineCode')}
                                                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveSolField(project, sol.id, 'machineCode')}
                                                                                        className="w-full text-xs bg-white dark:bg-slate-800 border border-cyan-400 rounded px-2 py-1 outline-none"
                                                                                    />
                                                                                ) : (
                                                                                    <div
                                                                                        onClick={() => { setEditingSolField({ projId: project.id, solId: sol.id, field: 'machineCode' }); setEditFieldValue(sol.machineCode || ''); }}
                                                                                        className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-2 py-1 -mx-2 -my-1 transition-colors min-h-[24px] flex items-center"
                                                                                    >
                                                                                        {sol.machineCode || '-'}
                                                                                    </div>
                                                                                )}
                                                                            </td>

                                                                            {/* SMV Saving - Auto-calculated (Read-only) */}
                                                                            <td className="px-3 py-2.5">
                                                                                <div className="text-xs font-bold text-green-700 dark:text-green-400 px-2 py-1 min-h-[24px] flex items-center">
                                                                                    {(() => {
                                                                                        const costed = parseFloat(sol.operationSMV || '0');
                                                                                        const routed = parseFloat(sol.routedSmv || '0');
                                                                                        if (costed && routed) {
                                                                                            const saving = (costed - routed).toFixed(2);
                                                                                            return saving;
                                                                                        }
                                                                                        return '-';
                                                                                    })()}
                                                                                </div>
                                                                            </td>

                                                                            {/* Expected SMV - Editable */}
                                                                            <td className="px-3 py-2.5">
                                                                                {editingSolField?.projId === project.id && editingSolField?.solId === sol.id && editingSolField?.field === 'expectedSmv' ? (
                                                                                    <input
                                                                                        type="text"
                                                                                        autoFocus
                                                                                        value={editFieldValue}
                                                                                        onChange={(e) => setEditFieldValue(e.target.value)}
                                                                                        onBlur={() => handleSaveSolField(project, sol.id, 'expectedSmv')}
                                                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveSolField(project, sol.id, 'expectedSmv')}
                                                                                        className="w-full text-xs bg-white dark:bg-slate-800 border border-cyan-400 rounded px-2 py-1 outline-none"
                                                                                    />
                                                                                ) : (
                                                                                    <div
                                                                                        onClick={() => { setEditingSolField({ projId: project.id, solId: sol.id, field: 'expectedSmv' }); setEditFieldValue(sol.expectedSmv || ''); }}
                                                                                        className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-2 py-1 -mx-2 -my-1 transition-colors min-h-[24px] flex items-center"
                                                                                    >
                                                                                        {sol.expectedSmv || '-'}
                                                                                    </div>
                                                                                )}
                                                                            </td>

                                                                            {/* Routed SMV - Editable */}
                                                                            <td className="px-3 py-2.5">
                                                                                {editingSolField?.projId === project.id && editingSolField?.solId === sol.id && editingSolField?.field === 'routedSmv' ? (
                                                                                    <input
                                                                                        type="text"
                                                                                        autoFocus
                                                                                        value={editFieldValue}
                                                                                        onChange={(e) => setEditFieldValue(e.target.value)}
                                                                                        onBlur={() => handleSaveSolField(project, sol.id, 'routedSmv')}
                                                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveSolField(project, sol.id, 'routedSmv')}
                                                                                        className="w-full text-xs bg-white dark:bg-slate-800 border border-cyan-400 rounded px-2 py-1 outline-none"
                                                                                    />
                                                                                ) : (
                                                                                    <div
                                                                                        onClick={() => { setEditingSolField({ projId: project.id, solId: sol.id, field: 'routedSmv' }); setEditFieldValue(sol.routedSmv || ''); }}
                                                                                        className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-2 py-1 -mx-2 -my-1 transition-colors min-h-[24px] flex items-center"
                                                                                    >
                                                                                        {sol.routedSmv || '-'}
                                                                                    </div>
                                                                                )}
                                                                            </td>

                                                                            {/* Costed SMV (operationSMV) - Editable */}
                                                                            <td className="px-3 py-2.5">
                                                                                {editingSolField?.projId === project.id && editingSolField?.solId === sol.id && editingSolField?.field === 'operationSMV' ? (
                                                                                    <input
                                                                                        type="text"
                                                                                        autoFocus
                                                                                        value={editFieldValue}
                                                                                        onChange={(e) => setEditFieldValue(e.target.value)}
                                                                                        onBlur={() => handleSaveSolField(project, sol.id, 'operationSMV')}
                                                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveSolField(project, sol.id, 'operationSMV')}
                                                                                        className="w-full text-xs bg-white dark:bg-slate-800 border border-cyan-400 rounded px-2 py-1 outline-none"
                                                                                    />
                                                                                ) : (
                                                                                    <div
                                                                                        onClick={() => { setEditingSolField({ projId: project.id, solId: sol.id, field: 'operationSMV' }); setEditFieldValue(sol.operationSMV || ''); }}
                                                                                        className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-2 py-1 -mx-2 -my-1 transition-colors min-h-[24px] flex items-center"
                                                                                    >
                                                                                        {sol.operationSMV || '-'}
                                                                                    </div>
                                                                                )}
                                                                            </td>

                                                                            {/* Comments - Daily Notes Style */}
                                                                            <td className="px-3 py-2.5 align-top">
                                                                                <div className="flex flex-col gap-1.5 w-[200px] max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                                                                                    {/* Render legacy comments as first entry if it exists and hasn't been migrated */}
                                                                                    {sol.comments && (!sol.dailyComments || sol.dailyComments.filter(c => (c.stageId || 'brainstorm') === 'brainstorm').length === 0) && (
                                                                                        <div className="bg-slate-50 dark:bg-slate-800/80 rounded p-1.5 border border-slate-200 dark:border-slate-700">
                                                                                            <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words">{sol.comments}</p>
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Render new array-based daily comments filtered for brainstorm stage */}
                                                                                    {(sol.dailyComments || []).filter(c => (c.stageId || 'brainstorm') === 'brainstorm').map((note, idx) => (
                                                                                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/80 rounded p-1.5 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                                                            <div className="flex items-center justify-between mb-0.5">
                                                                                                <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">{note.date}</span>
                                                                                            </div>
                                                                                            <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words leading-tight">{note.note}</p>
                                                                                        </div>
                                                                                         ))}

                                                                                    {/* Add Note Button or Input */}
                                                                                    {editingSolField?.projId === project.id && editingSolField?.solId === sol.id && editingSolField?.field === 'dailyComments' ? (
                                                                                        <div className="mt-1 flex flex-col gap-1.5">
                                                                                            <textarea
                                                                                                autoFocus
                                                                                                rows={2}
                                                                                                value={editFieldValue}
                                                                                                onChange={(e) => setEditFieldValue(e.target.value)}
                                                                                                onKeyDown={(e) => {
                                                                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                                                                        e.preventDefault();
                                                                                                        handleSaveSolutionDailyComment(project, sol.id, editFieldValue, 'brainstorm');
                                                                                                    }
                                                                                                }}
                                                                                                className="w-full text-[11px] bg-white dark:bg-[#0F172A] border border-cyan-400 rounded px-1.5 py-1 outline-none resize-none focus:ring-1 focus:ring-cyan-500"
                                                                                                placeholder="Type comment and hit Enter..."
                                                                                            />
                                                                                            <div className="flex gap-2 justify-end">
                                                                                                <button onClick={() => handleSaveSolutionDailyComment(project, sol.id, editFieldValue, 'brainstorm')} className="text-[10px] font-bold text-green-600 flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded transition-colors hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800"><Save size={10} /> Save</button>
                                                                                                <button onClick={() => setEditingSolField(null)} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-1.5 py-0.5 rounded transition-colors">Cancel</button>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setEditingSolField({ projId: project.id, solId: sol.id, field: 'dailyComments' });
                                                                                                const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                                                                                const todayComment = (sol.dailyComments || []).find(c => c.date === today && (c.stageId || 'brainstorm') === 'brainstorm');
                                                                                                setEditFieldValue(todayComment ? todayComment.note : '');
                                                                                            }}
                                                                                            className="mt-1 self-start text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors border border-transparent hover:border-cyan-200 dark:hover:border-cyan-800"
                                                                                        >
                                                                                            <Plus size={10} /> Add Comment
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </td>

                                                                            {/* Status - Editable Dropdown */}
                                                                            <td className="px-3 py-2.5">
                                                                                <div className="flex flex-col gap-1.5">
                                                                                    <select
                                                                                        value={sol.status}
                                                                                        onChange={(e) => handleUpdateSolutionStatus(project, sol.id, e.target.value as BrainstormSolution['status'], 'brainstorm')}
                                                                                        className={`px-2 py-1 rounded text-[10px] font-black uppercase cursor-pointer border-0 outline-none ${SOLUTION_STATUS_COLORS[sol.status]}`}
                                                                                    >
                                                                                        <option value="Pending">Pending</option>
                                                                                        <option value="In Progress">In Progress</option>
                                                                                        <option value="Trial">Trial</option>
                                                                                        <option value="Done">Done</option>
                                                                                        <option value="Drop">Drop</option>
                                                                                    </select>
                                                                                    {stageDays !== undefined && (
                                                                                        <div className="inline-flex items-center justify-center bg-cyan-50 dark:bg-cyan-900/20 px-2 py-0.5 rounded border border-cyan-100 dark:border-cyan-800/50 self-start">
                                                                                            <span className="text-[9px] font-black text-cyan-600 dark:text-cyan-400">
                                                                                                {stageDays} {stageDays === 1 ? 'DAY' : 'DAYS'}
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                            {/* Actions - Delete Only */}
                                                                            <td className="px-3 py-2.5 text-center">
                                                                                <button
                                                                                    onClick={() => handleDeleteSolution(project, sol.id)}
                                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 transition-all mx-auto"
                                                                                    title="Remove solution"
                                                                                >
                                                                                    <Trash2 size={12} />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                         );
                                                                     })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8 text-slate-400 dark:text-slate-600">
                                                            <Lightbulb size={24} className="mx-auto mb-2 opacity-50" />
                                                            <p className="text-xs font-bold uppercase">No solutions added yet</p>
                                                            <p className="text-[11px] mt-1">Click "Add Solution" to start brainstorming</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : currentActiveStage === 'cut_check' ? (
                                                /* === CUT KIT CHECK STAGE === */
                                                <div>
                                                    {/* Cut Dates & Responsible Person */}
                                                    <div className="mb-6 bg-orange-50 dark:bg-orange-900/10 rounded-xl p-4 border border-orange-100 dark:border-orange-500/20">
                                                        <h4 className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                                            <Calendar size={12} /> Cut Dates & Responsibility
                                                        </h4>
                                                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                                            {/* Responsible */}
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Responsible</label>
                                                                {editingCutActual?.projId === project.id && editingCutActual?.field === 'responsible' ? (
                                                                    <input autoFocus value={cutActualValue} onChange={e => setCutActualValue(e.target.value)}
                                                                        onBlur={() => handleSaveCutActual(project, 'responsible')}
                                                                        onKeyDown={e => e.key === 'Enter' && handleSaveCutActual(project, 'responsible')}
                                                                        className="w-full text-xs bg-white dark:bg-slate-800 border border-orange-400 rounded px-2 py-1 outline-none" />
                                                                ) : (
                                                                    <div onClick={() => { setEditingCutActual({ projId: project.id, field: 'responsible' }); setCutActualValue(project.cutActuals?.responsible || ''); }}
                                                                        className="min-h-[24px] flex items-center text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 cursor-pointer hover:border-orange-400">
                                                                        {project.cutActuals?.responsible || 'Assign...'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* Dates */}
                                                            {[
                                                                { key: 'requested', label: 'Requested', plan: project.cutRequestedDate || project.styleInDate, isPlanField: true, projectKey: 'cutRequestedDate' },
                                                                { key: 'required', label: 'Required', plan: project.cutRequiredDate || (project.styleInDate ? addWeekdays(project.styleInDate, 14) : ''), isPlanField: true, projectKey: 'cutRequiredDate' },
                                                                { key: 'received', label: 'Received', plan: project.cutReceivedDate, isPlanField: false },
                                                                { key: 'handover', label: 'Handover', plan: project.cutHandoverDate, isPlanField: false },
                                                            ].map(d => {
                                                                const actual = project.cutActuals?.[d.key as keyof CutActuals];
                                                                const d1 = parseDate(actual as string || '');
                                                                const d2 = parseDate(d.plan as string || '');
                                                                const isLate = d1 && d2 && d1 > d2;

                                                                const isEditing = editingCutActual?.projId === project.id && editingCutActual?.field === d.key;

                                                                return (
                                                                    <CutDateInput
                                                                        key={d.key}
                                                                        label={d.label}
                                                                        value={isEditing ? cutActualValue : (d.isPlanField ? d.plan : actual) || ''}
                                                                        plan={d.plan}
                                                                        isLate={isLate || false}
                                                                        isEditing={isEditing || false}
                                                                        onFocus={() => {
                                                                            setEditingCutActual({ projId: project.id, field: d.key as any });
                                                                            setCutActualValue((d.isPlanField ? d.plan : actual) as string || '');
                                                                        }}
                                                                        onBlur={() => {
                                                                            if (d.isPlanField && d.projectKey) {
                                                                                // Save to project field for plan dates
                                                                                onUpdateProject?.({ ...project, [d.projectKey]: cutActualValue });
                                                                            } else {
                                                                                // Save to cutActuals for actual dates
                                                                                handleSaveCutActual(project, d.key as any);
                                                                            }
                                                                            setEditingCutActual(null);
                                                                        }}
                                                                        onChange={setCutActualValue}
                                                                        onEnter={() => {
                                                                            if (d.isPlanField && d.projectKey) {
                                                                                onUpdateProject?.({ ...project, [d.projectKey]: cutActualValue });
                                                                            } else {
                                                                                handleSaveCutActual(project, d.key as any);
                                                                            }
                                                                            setEditingCutActual(null);
                                                                        }}
                                                                        onDatePick={(val) => {
                                                                            if (d.isPlanField && d.projectKey) {
                                                                                // Save to project field for plan dates
                                                                                onUpdateProject?.({ ...project, [d.projectKey]: val });
                                                                            } else {
                                                                                // Save to cutActuals for actual dates
                                                                                const currentActuals = project.cutActuals || {};
                                                                                onUpdateProject?.({ ...project, cutActuals: { ...currentActuals, [d.key]: val } });
                                                                            }
                                                                            if (isEditing) setCutActualValue(val);
                                                                        }}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </div>



                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <Package size={14} className="text-orange-500" />
                                                            <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                                                                Component
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="overflow-x-auto custom-scrollbar">
                                                        <table className="w-full text-left">
                                                            <thead><tr className="bg-orange-50 dark:bg-orange-500/10">
                                                                <th className="px-3 py-2 text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Component</th>
                                                                <th className="px-3 py-2 text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest w-32">Status</th>
                                                            </tr></thead>
                                                            <tbody>
                                                                {['Cut Kit', 'Trims', 'Tech Pack', 'Pattern (DXF)'].map((componentName, idx) => {
                                                                    // Find existing item or create default
                                                                    const existingItem = (project.cutKitItems || []).find(item => item.component === componentName);
                                                                    const itemId = existingItem?.id || `static-${idx}`;
                                                                    const itemStatus = existingItem?.status || 'Pending';

                                                                    return (
                                                                        <tr key={itemId} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                                            <td className="px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200">{componentName}</td>
                                                                            <td className="px-3 py-2.5">
                                                                                <select
                                                                                    value={itemStatus}
                                                                                    onChange={e => {
                                                                                        const newStatus = e.target.value as CutKitItem['status'];
                                                                                        if (existingItem) {
                                                                                            handleUpdateCutKitStatus(project, existingItem.id, newStatus);
                                                                                        } else {
                                                                                            // Create new item
                                                                                            const newItem: CutKitItem = {
                                                                                                id: `ck-${Date.now()}-${idx}`,
                                                                                                component: componentName,
                                                                                                quantity: 0,
                                                                                                receivedQty: 0,
                                                                                                status: newStatus,
                                                                                                notes: ''
                                                                                            };
                                                                                            onUpdateProject?.({ ...project, cutKitItems: [...(project.cutKitItems || []), newItem] });
                                                                                        }
                                                                                    }}
                                                                                    className={`px-2 py-1 rounded text-[10px] font-black uppercase cursor-pointer border-0 outline-none ${CUT_KIT_STATUS_COLORS[itemStatus]}`}>
                                                                                    <option value="Pending">Pending</option>
                                                                                    <option value="Partial">Partial</option>
                                                                                    <option value="Complete">Complete</option>
                                                                                    <option value="Missing">Missing</option>
                                                                                </select>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Cut Kit Daily Notes */}
                                                    {renderDailyNotesSection(project, "cut_check", "Cut Kit")}
                                                </div>

                                            ) : currentActiveStage === 'mach_avail' ? (
                                                /* === MACHINE AVAILABILITY STAGE === */
                                                <div>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Wrench size={14} className="text-blue-500" />
                                                        <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Machine Requirements & Kit Check</span>
                                                    </div>

                                                    {solutions.length > 0 ? (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-left border-collapse">
                                                                <thead>
                                                                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                                        <th className="py-2 pl-2">Solution</th>
                                                                        <th className="py-2 pl-2">Machine</th>
                                                                        <th className="py-2">Responsible</th>
                                                                        <th className="py-2">Availability</th>
                                                                         <th className="py-2 pr-2 text-right">Kit Check</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {solutions.flatMap(sol => {
                                                                        const machines = (sol.machines && sol.machines.length > 0)
                                                                            ? sol.machines
                                                                            : [{ id: 'default', machineType: sol.machineCode || 'Unknown', attachments: '', kitStatus: 'Pending', count: 1, remarks: '' } as SolutionMachine];

                                                                        const d1 = parseDate(sol.actualMachineDate || '');
                                                                        const d2 = parseDate(project.machineAvailabilityDate || '');
                                                                        const isLate = d1 && d2 && d1 > d2;
                                                                        const isEditing = editingSolField?.projId === project.id && editingSolField?.solId === sol.id;
                                                                        const stageDays = getLiveStageDays(sol, 'mach_avail');

                                                                        return machines.map((mach, idx) => (
                                                                            <tr key={`${sol.id}-${mach.id || idx}`} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
                                                                                {/* Solution Column - Shared per Solution */}
                                                                                {idx === 0 && (
                                                                                    <td className="py-2 pl-2 align-top" rowSpan={machines.length}>
                                                                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[150px] truncate" title={sol.solutionText}>
                                                                                            {sol.solutionText || 'Untitled Solution'}
                                                                                        </div>
                                                                                        {sol.operation && <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{sol.operation}</div>}
                                                                                    </td>
                                                                                )}
                                                                                {/* Machine Column */}
                                                                                <td className="py-2 pl-2 align-top">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-6 h-6 rounded bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 shrink-0">
                                                                                            <Wrench size={10} />
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{mach.machineType}</div>
                                                                                            {mach.attachments && <div className="text-[10px] text-slate-500">{mach.attachments}</div>}
                                                                                        </div>
                                                                                    </div>
                                                                                </td>

                                                                                {/* Responsible Column - Shared per Solution */}
                                                                                 {idx === 0 && (
                                                                                     <td className="py-2 align-top" rowSpan={machines.length}>
                                                                                         <div className="max-w-[120px]">
                                                                                             {isEditing && editingSolField?.field === 'responsible' ? (
                                                                                                 <input
                                                                                                     autoFocus
                                                                                                     value={editFieldValue}
                                                                                                     onChange={e => setEditFieldValue(e.target.value)}
                                                                                                     onBlur={() => {
                                                                                                         const updatedSolutions = (project.solutions || []).map(s => s.id === sol.id ? { ...s, responsible: editFieldValue } : s);
                                                                                                         onUpdateProject?.({ ...project, solutions: updatedSolutions });
                                                                                                         setEditingSolField(null);
                                                                                                     }}
                                                                                                     onKeyDown={e => {
                                                                                                         if (e.key === 'Enter') {
                                                                                                             const updatedSolutions = (project.solutions || []).map(s => s.id === sol.id ? { ...s, responsible: editFieldValue } : s);
                                                                                                             onUpdateProject?.({ ...project, solutions: updatedSolutions });
                                                                                                             setEditingSolField(null);
                                                                                                         }
                                                                                                     }}
                                                                                                     className="w-full px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-orange-400 rounded text-[11px] focus:outline-none"
                                                                                                 />
                                                                                             ) : (
                                                                                                 <div
                                                                                                     onClick={() => { setEditingSolField({ projId: project.id, solId: sol.id, field: 'responsible' }); setEditFieldValue(sol.responsible || ''); }}
                                                                                                     className="w-full px-1.5 py-0.5 rounded text-[11px] border border-transparent hover:border-slate-300 dark:hover:border-slate-700 cursor-text text-slate-800 dark:text-slate-200 transition-colors uppercase font-black tracking-wider"
                                                                                                 >
                                                                                                     {sol.responsible || 'Assign...'}
                                                                                                 </div>
                                                                                             )}
                                                                                         </div>
                                                                                     </td>
                                                                                 )}
                                                                                {/* Availability Column - Shared per Solution */}
                                                                                 {idx === 0 && (
                                                                                     <td className="py-2 align-top" rowSpan={machines.length}>
                                                                                         <div className="max-w-[140px] flex flex-col gap-1.5">
                                                                                             <CutDateInput
                                                                                                 label=""
                                                                                                 value={isEditing && editingSolField?.field === 'actualMachineDate' ? editFieldValue : (sol.actualMachineDate || '')}
                                                                                                 plan={project.machineAvailabilityDate}
                                                                                                 isLate={isLate || false}
                                                                                                 isEditing={isEditing && editingSolField?.field === 'actualMachineDate'}
                                                                                                 onFocus={() => { setEditingSolField({ projId: project.id, solId: sol.id, field: 'actualMachineDate' }); setEditFieldValue(sol.actualMachineDate || ''); }}
                                                                                                 onBlur={() => {
                                                                                                     const updatedSolutions = (project.solutions || []).map(s => s.id === sol.id ? { ...s, actualMachineDate: editFieldValue } : s);
                                                                                                     onUpdateProject?.({ ...project, solutions: updatedSolutions });
                                                                                                     setEditingSolField(null);
                                                                                                 }}
                                                                                                 onChange={setEditFieldValue}
                                                                                                 onEnter={() => {
                                                                                                     const updatedSolutions = (project.solutions || []).map(s => s.id === sol.id ? { ...s, actualMachineDate: editFieldValue } : s);
                                                                                                     onUpdateProject?.({ ...project, solutions: updatedSolutions });
                                                                                                     setEditingSolField(null);
                                                                                                 }}
                                                                                                 onDatePick={(val) => {
                                                                                                     const updatedSolutions = (project.solutions || []).map(s => s.id === sol.id ? { ...s, actualMachineDate: val } : s);
                                                                                                     onUpdateProject?.({ ...project, solutions: updatedSolutions });
                                                                                                     if (isEditing && editingSolField?.field === 'actualMachineDate') setEditFieldValue(val);
                                                                                                 }}
                                                                                             />
                                                                                             {stageDays !== undefined && (
                                                                                                 <div className="inline-flex items-center justify-center bg-cyan-50 dark:bg-cyan-900/20 px-2 py-0.5 rounded border border-cyan-100 dark:border-cyan-800/50 self-start">
                                                                                                     <span className="text-[9px] font-black text-cyan-600 dark:text-cyan-400">
                                                                                                         {stageDays} {stageDays === 1 ? 'DAY' : 'DAYS'}
                                                                                                     </span>
                                                                                                 </div>
                                                                                             )}
                                                                                         </div>
                                                                                     </td>
                                                                                 )}
                                                                                {/* Kit Check Column */}
                                                                                <td className="py-2 pr-2 align-top text-right">
                                                                                    <select
                                                                                        value={mach.kitStatus}
                                                                                        onChange={(e) => {
                                                                                            if (sol.machines && sol.machines.length > 0) {
                                                                                                handleUpdateMachineStatus(project, sol.id, mach.id, e.target.value as SolutionMachine['kitStatus']);
                                                                                            } else {
                                                                                                const newMachine: SolutionMachine = {
                                                                                                    id: Date.now().toString(),
                                                                                                    machineType: sol.machineCode || 'Unknown',
                                                                                                    attachments: '',
                                                                                                    kitStatus: e.target.value as SolutionMachine['kitStatus'],
                                                                                                    count: 1,
                                                                                                    remarks: ''
                                                                                                };
                                                                                                const updatedSol = { ...sol, machines: [newMachine] };
                                                                                                const updatedSolutions = (project.solutions || []).map(s => s.id === sol.id ? updatedSol : s);
                                                                                                onUpdateProject?.({ ...project, solutions: updatedSolutions });
                                                                                            }
                                                                                        }}
                                                                                        className={`px-2 py-1 rounded text-xs font-black uppercase cursor-pointer border outline-none appearance-none text-center min-w-[80px] transition-colors focus:ring-1 focus:ring-white/20 ${KIT_STATUS_COLORS[mach.kitStatus || 'Pending']}`}
                                                                                    >
                                                                                        <option value="Pending" className="bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400">Pending</option>
                                                                                        <option value="Ready" className="bg-white dark:bg-slate-800 text-green-700 dark:text-green-400">Ready</option>
                                                                                        <option value="Issue" className="bg-white dark:bg-slate-800 text-red-700 dark:text-red-400">Issue</option>
                                                                                    </select>
                                                                                </td>
                                                                            </tr>
                                                                        ));
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8 text-slate-400 dark:text-slate-600">
                                                            <Wrench size={24} className="mx-auto mb-2 opacity-50" />
                                                            <p className="text-xs font-bold uppercase">No solutions found</p>
                                                            <p className="text-[11px] mt-1">Add solutions in the Brainstorm stage first.</p>
                                                        </div>
                                                    )}

                                                    {/* Machine Daily Notes */}
                                                    {renderDailyNotesSection(project, "mach_avail", "Machine Availability")}
                                                </div>

                                            ) : currentActiveStage === 'video' ? (
                                                /* === VIDEO STAGE === */
                                                <div>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Video size={14} className="text-rose-500" />
                                                        <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Solution Videos</span>
                                                    </div>

                                                    {solutions.length > 0 ? (
                                                        <div className="space-y-4">
                                                            {solutions.map(sol => (
                                                                <div key={sol.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`px-1.5 py-0.5 rounded text-[11px] font-black uppercase ${SOLUTION_STATUS_COLORS[sol.stageTracking?.[currentActiveStage]?.status || sol.status]}`}>{sol.stageTracking?.[currentActiveStage]?.status || sol.status}</span>
                                                                            <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{sol.solutionText}</h5>
                                                                        </div>
                                                                    </div>

                                                                    {editingVideoId === sol.id ? (
                                                                        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-rose-200 dark:border-rose-500/30 animate-in fade-in">
                                                                            <div className="grid grid-cols-1 gap-3 mb-3">
                                                                                <div>
                                                                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Video URL</label>
                                                                                    <input
                                                                                        value={editVideoLink}
                                                                                        onChange={e => setEditVideoLink(e.target.value)}
                                                                                        className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:border-rose-500 outline-none"
                                                                                        placeholder="https://youtube.com/watch?v=..."
                                                                                        autoFocus
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Description</label>
                                                                                    <input
                                                                                        value={editVideoDesc}
                                                                                        onChange={e => setEditVideoDesc(e.target.value)}
                                                                                        className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:border-rose-500 outline-none"
                                                                                        placeholder="Describe the video content..."
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex gap-2 justify-end">
                                                                                <button onClick={() => setEditingVideoId(null)} className="px-3 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                                                                                <button
                                                                                    onClick={() => handleSaveSolutionVideo(project, sol.id)}
                                                                                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-black uppercase tracking-wider"
                                                                                >
                                                                                    Save
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div>
                                                                            {sol.videoLink ? (
                                                                                <div className="space-y-3">
                                                                                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                                                                        <div className="w-8 h-8 rounded bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
                                                                                            <Video size={16} className="text-rose-500" />
                                                                                        </div>
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-0.5">{sol.videoDescription || 'Solution Video'}</p>
                                                                                            <a href={sol.videoLink} target="_blank" rel="noopener noreferrer" className="text-[11px] text-rose-500 hover:text-rose-400 font-bold flex items-center gap-1 break-all">
                                                                                                <Link2 size={10} /> {sol.videoLink} <ExternalLink size={8} />
                                                                                            </a>
                                                                                        </div>
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setEditingVideoId(sol.id);
                                                                                                setEditVideoLink(sol.videoLink || '');
                                                                                                setEditVideoDesc(sol.videoDescription || '');
                                                                                                setEditFieldValue(sol.videoLink || ''); // Hack to reuse editFieldValue for save if needed, but we use editVideoLink state
                                                                                            }}
                                                                                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                                                                        >
                                                                                            <Edit3 size={12} />
                                                                                        </button>
                                                                                    </div>

                                                                                    {/* Embed Preview */}
                                                                                    {(sol.videoLink.includes('youtube.com') || sol.videoLink.includes('youtu.be')) && (
                                                                                        <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-black aspect-video">
                                                                                            <iframe
                                                                                                width="100%"
                                                                                                height="100%"
                                                                                                src={`https://www.youtube.com/embed/${sol.videoLink.includes('youtu.be') ? sol.videoLink.split('/').pop() : new URLSearchParams(sol.videoLink.split('?')[1]).get('v')}`}
                                                                                                title={`Video for ${sol.solutionText}`}
                                                                                                frameBorder="0"
                                                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                                                allowFullScreen
                                                                                                className="w-full h-full"
                                                                                            />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setEditingVideoId(sol.id);
                                                                                        setEditVideoLink('');
                                                                                        setEditVideoDesc('');
                                                                                    }}
                                                                                    className="w-full py-2 flex items-center justify-center gap-1.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-400 hover:text-rose-500 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all"
                                                                                >
                                                                                    <Video size={12} /> Add Video
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8 text-slate-400 dark:text-slate-600">
                                                            <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                                                            <p className="text-xs font-bold uppercase">No solutions found</p>
                                                            <p className="text-[11px] mt-1">Add solutions in the Brainstorm stage to attach videos</p>
                                                        </div>
                                                    )}

                                                    {/* Video Daily Notes */}
                                                    {renderDailyNotesSection(project, "video", "Video")}
                                                </div>

                                            ) : ['mds', 'pd', 'stw', 'share'].includes(currentActiveStage) ? (
                                                /* === MDS/PD/STW/Share STAGE: Solution File Linking === */
                                                <div>
                                                    {currentActiveStage === 'share' && (
                                                        <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-500/20">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                                                        <Share2 size={12} /> SE Signoff & Impact
                                                                    </h4>
                                                                </div>
                                                                {project.seSignoffDate && (
                                                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded text-[11px] font-bold uppercase tracking-wider border border-green-200 dark:border-green-500/30">
                                                                        Signed Off: {project.seSignoffDate}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                                                                {/* Initial SMV */}
                                                                <div>
                                                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Initial SMV</label>
                                                                    {editingSeField?.projId === project.id && editingSeField?.field === 'initialSmv' ? (
                                                                        <input
                                                                            type="text"
                                                                            autoFocus
                                                                            value={seFieldValue}
                                                                            onChange={(e) => setSeFieldValue(e.target.value)}
                                                                            onBlur={() => handleSaveSeField(project, 'initialSmv')}
                                                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveSeField(project, 'initialSmv')}
                                                                            className="w-full bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-500 rounded px-2 py-1 text-xs font-bold text-slate-700 dark:text-white outline-none"
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            onClick={() => { setEditingSeField({ projId: project.id, field: 'initialSmv' }); setSeFieldValue(project.initialSmv || ''); }}
                                                                            className="min-h-[24px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 flex items-center text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:border-indigo-400 transition-colors"
                                                                        >
                                                                            {project.initialSmv || '0.00'}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Latest SMV */}
                                                                <div>
                                                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Latest SMV</label>
                                                                    {editingSeField?.projId === project.id && editingSeField?.field === 'latestSmv' ? (
                                                                        <input
                                                                            type="text"
                                                                            autoFocus
                                                                            value={seFieldValue}
                                                                            onChange={(e) => setSeFieldValue(e.target.value)}
                                                                            onBlur={() => handleSaveSeField(project, 'latestSmv')}
                                                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveSeField(project, 'latestSmv')}
                                                                            className="w-full bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-500 rounded px-2 py-1 text-xs font-bold text-slate-700 dark:text-white outline-none"
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            onClick={() => { setEditingSeField({ projId: project.id, field: 'latestSmv' }); setSeFieldValue(project.latestSmv || ''); }}
                                                                            className="min-h-[24px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 flex items-center text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:border-indigo-400 transition-colors"
                                                                        >
                                                                            {project.latestSmv || '0.00'}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Total Saving - Read Only / Calculated */}
                                                                <div>
                                                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Saving</label>
                                                                    <div className="min-h-[24px] bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/20 rounded px-2 py-1 flex items-center text-xs font-black text-emerald-600 dark:text-emerald-400">
                                                                        {project.totalSmvSaving || '0.00'}
                                                                    </div>
                                                                </div>

                                                                {/* EPH */}
                                                                <div>
                                                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">EPH</label>
                                                                    {editingSeField?.projId === project.id && editingSeField?.field === 'eph' ? (
                                                                        <input
                                                                            type="text"
                                                                            autoFocus
                                                                            value={seFieldValue}
                                                                            onChange={(e) => setSeFieldValue(e.target.value)}
                                                                            onBlur={() => handleSaveSeField(project, 'eph')}
                                                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveSeField(project, 'eph')}
                                                                            className="w-full bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-500 rounded px-2 py-1 text-xs font-bold text-slate-700 dark:text-white outline-none"
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            onClick={() => { setEditingSeField({ projId: project.id, field: 'eph' }); setSeFieldValue(project.eph || ''); }}
                                                                            className="min-h-[24px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 flex items-center text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:border-indigo-400 transition-colors"
                                                                        >
                                                                            {project.eph || '-'}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Order Quantity - Read Only from Style */}
                                                                <div>
                                                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Order Qty</label>
                                                                    <div className="min-h-[24px] bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/20 rounded px-2 py-1 flex items-center text-xs font-black text-blue-600 dark:text-blue-400">
                                                                        {project.orderQty?.toLocaleString() || '0'}
                                                                    </div>
                                                                </div>

                                                                {/* Operational Cost Savings */}
                                                                <div>
                                                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Op. Cost Savings ($)</label>
                                                                    {editingSeField?.projId === project.id && editingSeField?.field === 'operationalCostSavings' ? (
                                                                        <input
                                                                            type="text"
                                                                            autoFocus
                                                                            value={seFieldValue}
                                                                            onChange={(e) => setSeFieldValue(e.target.value)}
                                                                            onBlur={() => handleSaveSeField(project, 'operationalCostSavings')}
                                                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveSeField(project, 'operationalCostSavings')}
                                                                            className="w-full bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-500 rounded px-2 py-1 text-xs font-bold text-slate-700 dark:text-white outline-none"
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            onClick={() => { setEditingSeField({ projId: project.id, field: 'operationalCostSavings' }); setSeFieldValue(project.operationalCostSavings || ''); }}
                                                                            className="min-h-[24px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 flex items-center text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:border-indigo-400 transition-colors"
                                                                        >
                                                                            {project.operationalCostSavings || '0.00'}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Impact */}
                                                                <div className="sm:col-span-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-3 border-2 border-emerald-300 dark:border-emerald-500/30 flex justify-between items-center shadow-sm">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Impact ($)</span>
                                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Op. Cost + (Saving × Qty × EPH/60)</span>
                                                                    </div>
                                                                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">${project.impact || '0.00'}</span>
                                                                </div>

                                                            </div>

                                                            <div className="flex gap-3 mt-4">
                                                                <button
                                                                    onClick={async () => {
                                                                        const blob = await pdf(<SolutionFeedbackPDF project={project} />).toBlob();
                                                                        const url = URL.createObjectURL(blob);
                                                                        window.open(url, '_blank');
                                                                    }}
                                                                    className="flex-1 py-2 bg-white dark:bg-slate-800 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-lg shadow-lg shadow-indigo-600/10 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                                                >
                                                                    <Printer size={12} /> Print Sheet
                                                                </button>
                                                                <button
                                                                    onClick={() => onSeSignoff && onSeSignoff(project)}
                                                                    className="flex-[2] py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-600/20 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <Send size={12} /> SE Project Signoff
                                                                </button>
                                                            </div>

                                                        </div>
                                                    )}



                                                    {/* Documents Section - HIDE for Share Pt as requested */}
                                                    {currentActiveStage !== 'share' && (
                                                        <>
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <FileSpreadsheet size={16} className="text-blue-500" />
                                                                <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                                                                    {TIMELINE_STAGES.find(s => s.id === currentActiveStage)?.label} Documents
                                                                </span>
                                                            </div>

                                                            {solutions.length > 0 ? (
                                                                <div className="space-y-3">
                                                                    {solutions.map((sol) => {
                                                                        const fileLink = (project.stageFiles || []).find(f => f.solutionId === sol.id && f.stageId === currentActiveStage);
                                                                        return (
                                                                            <div key={sol.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500/30 transition-colors">
                                                                                <div className="flex items-center gap-2 mb-3">
                                                                                    <span className={`px-1.5 py-0.5 rounded text-[11px] font-black uppercase ${SOLUTION_STATUS_COLORS[sol.stageTracking?.[currentActiveStage]?.status || sol.status]}`}>{sol.stageTracking?.[currentActiveStage]?.status || sol.status}</span>
                                                                                    <h5 className="text-[12px] font-bold text-slate-700 dark:text-slate-200 truncate">{sol.solutionText}</h5>
                                                                                </div>

                                                                                {/* File Link Section */}
                                                                                <div>
                                                                                    {fileLink ? (
                                                                                        <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                                                                                            <div className="flex items-center justify-between mb-3">
                                                                                                <div className="flex items-center gap-2 overflow-hidden">
                                                                                                    <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${fileLink.fileType === 'excel' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                                                                        {fileLink.fileType === 'excel' ? <FileSpreadsheet size={16} /> : <FileText size={16} />}
                                                                                                    </div>
                                                                                                    <div className="min-w-0">
                                                                                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{fileLink.fileName}</p>
                                                                                                        <a href={fileLink.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1">
                                                                                                            View Document <ExternalLink size={8} />
                                                                                                        </a>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <button onClick={() => handleDeleteFileLink(project, fileLink.id)}
                                                                                                    className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                                                                                                    <Trash2 size={12} />
                                                                                                </button>
                                                                                            </div>

                                                                                            {/* Date Comparison - Automatic */}
                                                                                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                                                                                <div className="grid grid-cols-2 gap-3 mb-2">
                                                                                                    <div>
                                                                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Plan Date</p>
                                                                                                        <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">{fileLink.plannedDate || '--'}</p>
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Update Date</p>
                                                                                                        <p className={`text-xs font-mono font-bold ${!fileLink.actualDate ? 'text-slate-400' :
                                                                                                            !fileLink.plannedDate ? 'text-green-600 dark:text-green-400' :
                                                                                                                parseDate(fileLink.actualDate) && parseDate(fileLink.plannedDate) && parseDate(fileLink.actualDate)! <= parseDate(fileLink.plannedDate)! ? 'text-green-600 dark:text-green-400' :
                                                                                                                    parseDate(fileLink.actualDate) && parseDate(fileLink.plannedDate) && Math.abs(parseDate(fileLink.actualDate)!.getTime() - parseDate(fileLink.plannedDate)!.getTime()) / (1000 * 60 * 60 * 24) <= 3 ? 'text-yellow-600 dark:text-yellow-400' :
                                                                                                                        'text-red-600 dark:text-red-400'
                                                                                                            }`}>
                                                                                                            {fileLink.actualDate || '--'}
                                                                                                        </p>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                                                                                    <span className="uppercase">By:</span>
                                                                                                    <span className="ml-1 font-bold text-cyan-600 dark:text-cyan-400">{fileLink.uploadedBy || 'Unknown'}</span>
                                                                                                    <span className="mx-2">•</span>
                                                                                                    <span className="font-mono">{fileLink.uploadedAt}</span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : showAddFileLink === sol.id ? (
                                                                                        <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-cyan-500/30 animate-in fade-in">
                                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                                                                                <input value={newFileLink.fileName} onChange={e => setNewFileLink(p => ({ ...p, fileName: e.target.value }))}
                                                                                                    className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] focus:border-cyan-500 outline-none" placeholder="File Name e.g. MDS Sheet v1" />
                                                                                                <input value={newFileLink.fileUrl} onChange={e => setNewFileLink(p => ({ ...p, fileUrl: e.target.value }))}
                                                                                                    className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] focus:border-cyan-500 outline-none" placeholder="File URL / SharePoint Link" />
                                                                                            </div>
                                                                                            <div className="flex items-center justify-between">
                                                                                                <select value={newFileLink.fileType} onChange={e => setNewFileLink(p => ({ ...p, fileType: e.target.value as any }))}
                                                                                                    className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] outline-none">
                                                                                                    <option value="pdf">PDF Document</option>
                                                                                                    <option value="excel">Excel Sheet</option>
                                                                                                    <option value="other">Other File</option>
                                                                                                </select>
                                                                                                <div className="flex gap-2">
                                                                                                    <button onClick={() => { setShowAddFileLink(null); setNewFileLink({ solutionId: '', fileName: '', fileUrl: '', fileType: 'pdf', plannedDate: '', actualDate: '' }); }}
                                                                                                        className="px-2 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                                                                                                    <button onClick={() => handleAddFileLink(project, currentActiveStage)}
                                                                                                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-bold uppercase tracking-wider">
                                                                                                        Attach
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <button onClick={() => { setShowAddFileLink(sol.id); setNewFileLink({ solutionId: sol.id, fileName: '', fileUrl: '', fileType: 'pdf', plannedDate: '', actualDate: '' }); }}
                                                                                            className="w-full py-1.5 flex items-center justify-center gap-1.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-400 hover:text-cyan-600 hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/10 transition-all">
                                                                                            <Paperclip size={12} /> Attach Document
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-8 text-slate-400 dark:text-slate-600">
                                                                    <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                                                                    <p className="text-xs font-bold uppercase">No solutions found</p>
                                                                    <p className="text-[11px] mt-1">Add solutions in Brainstorm stage to attach files</p>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Daily Notes for file link stages */}
                                                    {renderDailyNotesSection(project, currentActiveStage, TIMELINE_STAGES.find(s => s.id === currentActiveStage)?.label || currentActiveStage)}
                                                </div>

                                            ) : currentActiveStage === 'valid' ? (
                                                /* === VALIDATION STAGE: Simplified Sign-off === */
                                                <div>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                                        <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                                                            Technical Validation Sign-off
                                                        </span>
                                                    </div>

                                                    {solutions.length > 0 ? (
                                                        <div className="overflow-x-auto custom-scrollbar">
                                                            <table className="w-full text-left">
                                                                <thead><tr className="bg-emerald-50 dark:bg-emerald-900/10">
                                                                    <th className="px-3 py-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Solution</th>
                                                                    <th className="px-3 py-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">SMV</th>
                                                                    <th className="px-3 py-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Mechanic</th>
                                                                    <th className="px-3 py-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Responsible</th>
                                                                    <th className="px-3 py-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-right">Sign-off</th>
                                                                </tr></thead>
                                                                <tbody>
                                                                    {solutions.map((sol) => {
                                                                        const stageActual = sol.stageTracking?.['valid']?.actualDate || '';
                                                                        const isSignedOff = !!stageActual;
                                                                        const planDate = project.technicalValidationDate;
                                                                        const statusColor = getDateStatusColor(stageActual, planDate); // Green/Yellow/Red based on plan

                                                                        return (
                                                                            <tr key={sol.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                                                <td className="px-3 py-3 text-xs font-bold text-slate-700 dark:text-slate-200">{sol.solutionText}</td>
                                                                                <td className="px-3 py-3">
                                                                                    {editingSolField?.projId === project.id && editingSolField?.solId === sol.id && editingSolField?.field === 'operationSMV' ? (
                                                                                        <input type="text" autoFocus value={editFieldValue}
                                                                                            onChange={(e) => setEditFieldValue(e.target.value)}
                                                                                            onBlur={() => handleSaveSolField(project, sol.id, 'operationSMV')}
                                                                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveSolField(project, sol.id, 'operationSMV')}
                                                                                            className="w-full text-xs bg-white dark:bg-slate-800 border border-emerald-400 rounded px-2 py-1 outline-none" />
                                                                                    ) : (
                                                                                        <div onClick={() => { setEditingSolField({ projId: project.id, solId: sol.id, field: 'operationSMV' }); setEditFieldValue(sol.operationSMV || ''); }}
                                                                                            className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded px-2 py-1 -mx-2 -my-1 min-h-[24px] flex items-center transition-colors">
                                                                                            {sol.operationSMV || '-'}
                                                                                        </div>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-3 py-3">
                                                                                    {editingSolField?.projId === project.id && editingSolField?.solId === sol.id && editingSolField?.field === 'team' ? (
                                                                                        <input type="text" autoFocus value={editFieldValue}
                                                                                            onChange={(e) => setEditFieldValue(e.target.value)}
                                                                                            onBlur={() => handleSaveSolField(project, sol.id, 'team')}
                                                                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveSolField(project, sol.id, 'team')}
                                                                                            className="w-full text-xs bg-white dark:bg-slate-800 border border-emerald-400 rounded px-2 py-1 outline-none" />
                                                                                    ) : (
                                                                                        <div onClick={() => { setEditingSolField({ projId: project.id, solId: sol.id, field: 'team' }); setEditFieldValue(sol.team || sol.machineCode || ''); }}
                                                                                            className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded px-2 py-1 -mx-2 -my-1 min-h-[24px] flex items-center transition-colors">
                                                                                            {sol.team || sol.machineCode || '-'}
                                                                                        </div>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-3 py-3">
                                                                                    {editingSolField?.projId === project.id && editingSolField?.solId === sol.id && editingSolField?.field === 'responsible' ? (
                                                                                        <input type="text" autoFocus value={editFieldValue}
                                                                                            onChange={(e) => setEditFieldValue(e.target.value)}
                                                                                            onBlur={() => handleSaveSolField(project, sol.id, 'responsible')}
                                                                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveSolField(project, sol.id, 'responsible')}
                                                                                            className="w-full text-xs bg-white dark:bg-slate-800 border border-emerald-400 rounded px-2 py-1 outline-none" />
                                                                                    ) : (
                                                                                        <div onClick={() => { setEditingSolField({ projId: project.id, solId: sol.id, field: 'responsible' }); setEditFieldValue(sol.responsible || ''); }}
                                                                                            className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded px-2 py-1 -mx-2 -my-1 min-h-[24px] flex items-center transition-colors">
                                                                                            {sol.responsible || '-'}
                                                                                        </div>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-3 py-3 text-right">
                                                                                    <button
                                                                                        onClick={() => {
                                                                                             if (!isSignedOff) {
                                                                                                 handleUpdateSolutionStatus(project, sol.id, 'Done', 'valid');
                                                                                             }
                                                                                         }}
                                                                                        disabled={isSignedOff}
                                                                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ml-auto transition-all ${isSignedOff
                                                                                            ? (statusColor || 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30')
                                                                                            : 'bg-slate-800 text-white hover:bg-slate-700 shadow-lg shadow-slate-800/20'
                                                                                            }`}
                                                                                    >
                                                                                        {isSignedOff ? (
                                                                                            <><CheckCircle2 size={12} /> Validated: {stageActual}</>
                                                                                        ) : (
                                                                                            <><PenTool size={12} /> Sign-off Validation</>
                                                                                        )}
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8 text-slate-400 dark:text-slate-600">
                                                            <CheckCircle2 size={24} className="mx-auto mb-2 opacity-50" />
                                                            <p className="text-xs font-bold uppercase">No solutions to validate</p>
                                                        </div>
                                                    )}

                                                    {/* VE-Specific Sections (Only for Unichela Panadura VE and Casualine VE) */}
                                                    {(project.category === 'Unichela Panadura VE' || project.category === 'Casualine VE') && solutions.length > 0 && (
                                                        <div className="mt-6 space-y-6">
                                                            {/* Yamazumi Chart Upload Section */}
                                                            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/30">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <BarChart3 size={14} className="text-purple-500" />
                                                                    <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Yamazumi Chart Upload</span>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    {solutions.map((sol) => (
                                                                        <div key={sol.id} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg">
                                                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 min-w-[150px]">{sol.solutionText}</span>
                                                                            {sol.yamazumiChartLink ? (
                                                                                <div className="flex items-center gap-2">
                                                                                    <a href={sol.yamazumiChartLink} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-500 hover:text-blue-600 underline font-bold">
                                                                                        ✓ View Chart
                                                                                    </a>
                                                                                    {sol.yamazumiChartDate && <span className="text-[10px] text-slate-400">{sol.yamazumiChartDate}</span>}
                                                                                </div>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const link = prompt('Enter Yamazumi Chart link (PDF/Excel/Image):');
                                                                                        if (link?.trim()) {
                                                                                            const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
                                                                                            const updatedSolutions = (project.solutions || []).map(s =>
                                                                                                s.id === sol.id ? { ...s, yamazumiChartLink: link, yamazumiChartDate: today } : s
                                                                                            );
                                                                                            onUpdateProject?.({ ...project, solutions: updatedSolutions });
                                                                                        }
                                                                                    }}
                                                                                    className="text-[11px] text-slate-500 hover:text-blue-500 font-bold px-3 py-1 border border-slate-300 dark:border-slate-700 rounded hover:border-blue-500 transition-colors"
                                                                                >
                                                                                    + Upload Chart
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Craftsmanship Level Section */}
                                                            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/30">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <Award size={14} className="text-amber-500" />
                                                                    <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Craftsmanship Level</span>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    {solutions.map((sol) => (
                                                                        <div key={sol.id} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg">
                                                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 min-w-[150px]">{sol.solutionText}</span>
                                                                            <select
                                                                                value={sol.craftsmanshipLevel || ''}
                                                                                onChange={(e) => {
                                                                                    const updatedSolutions = (project.solutions || []).map(s =>
                                                                                        s.id === sol.id ? { ...s, craftsmanshipLevel: e.target.value as any } : s
                                                                                    );
                                                                                    onUpdateProject?.({ ...project, solutions: updatedSolutions });
                                                                                }}
                                                                                className="text-[11px] px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold focus:border-amber-500 focus:outline-none"
                                                                            >
                                                                                <option value="">Select Level</option>
                                                                                <option value="Level 1">Level 1</option>
                                                                                <option value="Level 2">Level 2</option>
                                                                                <option value="Level 3">Level 3</option>
                                                                                <option value="Level 4">Level 4</option>
                                                                            </select>
                                                                            {sol.craftsmanshipLevel && (
                                                                                <span className={`text-[10px] font-bold px-2 py-1 rounded ${sol.craftsmanshipLevel === 'Level 1' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                                    sol.craftsmanshipLevel === 'Level 2' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                                        sol.craftsmanshipLevel === 'Level 3' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                                            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                                    }`}>
                                                                                    {sol.craftsmanshipLevel}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Layout Upload Section */}
                                                            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/30">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <Layout size={14} className="text-cyan-500" />
                                                                    <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Layout Upload</span>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    {solutions.map((sol) => (
                                                                        <div key={sol.id} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg">
                                                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 min-w-[150px]">{sol.solutionText}</span>
                                                                            {sol.layoutLink ? (
                                                                                <div className="flex items-center gap-2">
                                                                                    <a href={sol.layoutLink} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-500 hover:text-blue-600 underline font-bold">
                                                                                        ✓ View Layout
                                                                                    </a>
                                                                                    {sol.layoutDate && <span className="text-[10px] text-slate-400">{sol.layoutDate}</span>}
                                                                                </div>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const link = prompt('Enter Layout link (PDF/Excel/Image):');
                                                                                        if (link?.trim()) {
                                                                                            const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
                                                                                            const updatedSolutions = (project.solutions || []).map(s =>
                                                                                                s.id === sol.id ? { ...s, layoutLink: link, layoutDate: today } : s
                                                                                            );
                                                                                            onUpdateProject?.({ ...project, solutions: updatedSolutions });
                                                                                        }
                                                                                    }}
                                                                                    className="text-[11px] text-slate-500 hover:text-blue-500 font-bold px-3 py-1 border border-slate-300 dark:border-slate-700 rounded hover:border-blue-500 transition-colors"
                                                                                >
                                                                                    + Upload Layout
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Daily Notes - same as other stages */}
                                                    {renderDailyNotesSection(project, 'valid', 'Validation')}
                                                </div>

                                            ) : (
                                                /* === ALL OTHER STAGES: Solution tracking + stage notes === */
                                                <div>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Clock size={14} className="text-blue-500" />
                                                        <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                                                            Solution Tracking — {TIMELINE_STAGES.find(s => s.id === currentActiveStage)?.label} Stage
                                                        </span>
                                                    </div>

                                                    {solutions.length > 0 ? (
                                                        <div className="overflow-x-auto custom-scrollbar">
                                                            <table className="w-full text-left">
                                                                <thead><tr className="bg-slate-100 dark:bg-slate-800/80">
                                                                    <th className="px-3 py-2 text-xs font-black text-slate-500 uppercase tracking-widest">Solution</th>
                                                                    <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">SMV</th>
                                                                    <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Start Date</th>
                                                                    <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Expected End</th>
                                                                    <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actual End</th>
                                                                    <th className="px-3 py-2 text-xs font-black text-slate-500 uppercase tracking-widest">Comments</th>
                                                                    <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Mechanic</th>
                                                                    {!['trial', 'mockup'].includes(currentActiveStage) && (
                                                                        <th className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Responsible</th>
                                                                    )}
                                                                    <th className="px-3 py-2 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                                                                </tr></thead>
                                                                <tbody>
                                                                    {solutions.map((sol) => {
                                                                        const isEditableStage = ['trial', 'mockup', 'valid'].includes(currentActiveStage);
                                                                        // CRITICAL FIX: Do NOT fallback to solution-level dates
                                                                        // Each stage must have completely independent tracking
                                                                        const stageStart = sol.stageTracking?.[currentActiveStage]?.startDate || '';
                                                                        const stageExpected = sol.stageTracking?.[currentActiveStage]?.expectedDate || '';
                                                                        const stageActual = sol.stageTracking?.[currentActiveStage]?.actualDate || '';
                                                                        const stageDays = getLiveStageDays(sol, currentActiveStage);

                                                                        return (
                                                                            <tr key={sol.id} className={`border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${(sol.stageTracking?.[currentActiveStage]?.status || 'Pending') === 'Done' ? 'opacity-70' : ''}`}>
                                                                                <td className="px-3 py-2.5 text-xs font-bold text-cyan-700 dark:text-cyan-400 max-w-[180px]">{sol.solutionText}</td>
                                                                                <td className="px-3 py-2.5">
                                                                                    {editingSolField?.projId === project.id && editingSolField?.solId === sol.id && editingSolField?.field === 'operationSMV' ? (
                                                                                        <input type="text"
                                                                                            autoFocus
                                                                                            value={editFieldValue}
                                                                                            onChange={(e) => setEditFieldValue(e.target.value)}
                                                                                            onBlur={() => handleSaveSolField(project, sol.id, 'operationSMV')}
                                                                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveSolField(project, sol.id, 'operationSMV')}
                                                                                            className="w-full text-xs bg-white dark:bg-slate-800 border border-cyan-400 rounded px-2 py-1 outline-none"
                                                                                        />
                                                                                    ) : (
                                                                                        <div
                                                                                            onClick={() => { setEditingSolField({ projId: project.id, solId: sol.id, field: 'operationSMV' }); setEditFieldValue(sol.operationSMV || ''); }}
                                                                                            className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-2 py-1 -mx-2 -my-1 transition-colors min-h-[24px] flex items-center"
                                                                                        >
                                                                                            {sol.operationSMV || '-'}
                                                                                        </div>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-3 py-2.5">
                                                                                    {editingSolField?.solId === sol.id && editingSolField?.field === 'startDate' ? (
                                                                                        <input type="date" value={editFieldValue} onChange={e => setEditFieldValue(e.target.value)} onBlur={() => handleSaveSolField(project, sol.id, 'startDate')}
                                                                                            onKeyDown={e => e.key === 'Enter' && handleSaveSolField(project, sol.id, 'startDate')} autoFocus
                                                                                            className="w-24 text-[11px] bg-transparent border-b border-cyan-500 outline-none text-slate-700 dark:text-white p-0" />
                                                                                    ) : (
                                                                                        <span onClick={() => { setEditingSolField({ projId: project.id, solId: sol.id, field: 'startDate' }); setEditFieldValue(stageStart); }}
                                                                                            className="text-xs font-mono text-slate-600 dark:text-slate-400 cursor-pointer hover:text-cyan-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded px-1 -ml-1 transition-colors block min-h-[16px]">
                                                                                            {stageStart || '-'}
                                                                                        </span>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-3 py-2.5">
                                                                                    {editingSolField?.solId === sol.id && editingSolField?.field === 'expectedEndDate' ? (
                                                                                        <input type="date" value={editFieldValue} onChange={e => setEditFieldValue(e.target.value)} onBlur={() => handleSaveSolField(project, sol.id, 'expectedEndDate')}
                                                                                            onKeyDown={e => e.key === 'Enter' && handleSaveSolField(project, sol.id, 'expectedEndDate')} autoFocus
                                                                                            className="w-24 text-[11px] bg-transparent border-b border-cyan-500 outline-none text-slate-700 dark:text-white p-0" />
                                                                                    ) : (
                                                                                        <span onClick={() => { setEditingSolField({ projId: project.id, solId: sol.id, field: 'expectedEndDate' }); setEditFieldValue(stageExpected); }}
                                                                                            className="text-xs font-mono text-slate-600 dark:text-slate-400 cursor-pointer hover:text-cyan-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded px-1 -ml-1 transition-colors block min-h-[16px]">
                                                                                            {stageExpected || '-'}
                                                                                        </span>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-3 py-2.5">
                                                                                    {editingSolField?.solId === sol.id && editingSolField?.field === 'actualEndDate' ? (
                                                                                        <input type="date" value={editFieldValue} onChange={e => setEditFieldValue(e.target.value)} onBlur={() => handleSaveSolField(project, sol.id, 'actualEndDate')}
                                                                                            onKeyDown={e => e.key === 'Enter' && handleSaveSolField(project, sol.id, 'actualEndDate')} autoFocus
                                                                                            className="w-24 text-[11px] bg-transparent border-b border-cyan-500 outline-none text-slate-700 dark:text-white p-0" />
                                                                                    ) : (
                                                                                        <span onClick={() => { setEditingSolField({ projId: project.id, solId: sol.id, field: 'actualEndDate' }); setEditFieldValue(stageActual); }}
                                                                                            className={`text-xs font-mono cursor-pointer hover:text-cyan-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded px-1 -ml-1 transition-colors block min-h-[16px] ${stageActual ? 'text-green-600 dark:text-green-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                                                                                            {stageActual || '-'}
                                                                                        </span>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-3 py-2.5 align-top">
                                                                                    {isEditableStage ? (
                                                                                        <div className="flex flex-col gap-1.5 w-[200px] max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                                                                                            {/* Render array-based daily comments filtered for this specific stage */}
                                                                                            {(sol.dailyComments || []).filter(c => (c.stageId || 'brainstorm') === currentActiveStage).map((note, idx) => (
                                                                                                <div key={idx} className="bg-slate-50 dark:bg-slate-800/80 rounded p-1.5 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                                                                    <div className="flex items-center justify-between mb-0.5">
                                                                                                        <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">{note.date}</span>
                                                                                                    </div>
                                                                                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words leading-tight">{note.note}</p>
                                                                                                </div>
                                                                                            ))}

                                                                                            {/* Add Note Button or Input */}
                                                                                            {editingSolField?.projId === project.id && editingSolField?.solId === sol.id && editingSolField?.field === 'dailyComments' ? (
                                                                                                <div className="mt-1 flex flex-col gap-1.5">
                                                                                                    <textarea
                                                                                                        autoFocus
                                                                                                        rows={2}
                                                                                                        value={editFieldValue}
                                                                                                        onChange={(e) => setEditFieldValue(e.target.value)}
                                                                                                        onKeyDown={(e) => {
                                                                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                                                                e.preventDefault();
                                                                                                                handleSaveSolutionDailyComment(project, sol.id, editFieldValue, currentActiveStage);
                                                                                                            }
                                                                                                        }}
                                                                                                        className="w-full text-[11px] bg-white dark:bg-[#0F172A] border border-cyan-400 rounded px-1.5 py-1 outline-none resize-none focus:ring-1 focus:ring-cyan-500"
                                                                                                        placeholder="Type comment and hit Enter..."
                                                                                                    />
                                                                                                    <div className="flex gap-2 justify-end">
                                                                                                        <button onClick={() => handleSaveSolutionDailyComment(project, sol.id, editFieldValue, currentActiveStage)} className="text-[10px] font-bold text-green-600 flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded transition-colors hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800"><Save size={10} /> Save</button>
                                                                                                        <button onClick={() => setEditingSolField(null)} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-1.5 py-0.5 rounded transition-colors">Cancel</button>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <button
                                                                                                    onClick={() => {
                                                                                                        setEditingSolField({ projId: project.id, solId: sol.id, field: 'dailyComments' });
                                                                                                        const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                                                                                        const todayComment = (sol.dailyComments || []).find(c => c.date === today && (c.stageId || 'brainstorm') === currentActiveStage);
                                                                                                        setEditFieldValue(todayComment ? todayComment.note : '');
                                                                                                    }}
                                                                                                    className="mt-1 self-start text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors border border-transparent hover:border-cyan-200 dark:hover:border-cyan-800"
                                                                                                >
                                                                                                    <Plus size={10} /> Add Comment
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="flex flex-col gap-1.5 w-[200px] max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                                                                                            {/* Render daily comments filtered for this specific stage */}
                                                                                            {(sol.dailyComments || []).filter(c => (c.stageId || 'brainstorm') === currentActiveStage).map((note, idx) => (
                                                                                                <div key={idx} className="bg-slate-50 dark:bg-slate-800/80 rounded p-1.5 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                                                                    <div className="flex items-center justify-between mb-0.5">
                                                                                                        <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">{note.date}</span>
                                                                                                    </div>
                                                                                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words leading-tight">{note.note}</p>
                                                                                                </div>
                                                                                            ))}

                                                                                            {/* Add Note Button or Input */}
                                                                                            {editingSolField?.projId === project.id && editingSolField?.solId === sol.id && editingSolField?.field === 'dailyComments' ? (
                                                                                                <div className="mt-1 flex flex-col gap-1.5">
                                                                                                    <textarea
                                                                                                        autoFocus
                                                                                                        rows={2}
                                                                                                        value={editFieldValue}
                                                                                                        onChange={(e) => setEditFieldValue(e.target.value)}
                                                                                                        onKeyDown={(e) => {
                                                                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                                                                e.preventDefault();
                                                                                                                handleSaveSolutionDailyComment(project, sol.id, editFieldValue, currentActiveStage);
                                                                                                            }
                                                                                                        }}
                                                                                                        className="w-full text-[11px] bg-white dark:bg-[#0F172A] border border-cyan-400 rounded px-1.5 py-1 outline-none resize-none focus:ring-1 focus:ring-cyan-500"
                                                                                                        placeholder="Type comment and hit Enter..."
                                                                                                    />
                                                                                                    <div className="flex gap-2 justify-end">
                                                                                                        <button onClick={() => handleSaveSolutionDailyComment(project, sol.id, editFieldValue, currentActiveStage)} className="text-[10px] font-bold text-green-600 flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded transition-colors hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800"><Save size={10} /> Save</button>
                                                                                                        <button onClick={() => setEditingSolField(null)} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-1.5 py-0.5 rounded transition-colors">Cancel</button>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <button
                                                                                                    onClick={() => {
                                                                                                        setEditingSolField({ projId: project.id, solId: sol.id, field: 'dailyComments' });
                                                                                                        const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                                                                                        const todayComment = (sol.dailyComments || []).find(c => c.date === today && (c.stageId || 'brainstorm') === currentActiveStage);
                                                                                                        setEditFieldValue(todayComment ? todayComment.note : '');
                                                                                                    }}
                                                                                                    className="mt-1 self-start text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors border border-transparent hover:border-cyan-200 dark:hover:border-cyan-800"
                                                                                                >
                                                                                                    <Plus size={10} /> Add Comment
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-3 py-2.5">
                                                                                    {editingSolField?.projId === project.id && editingSolField?.solId === sol.id && editingSolField?.field === 'team' ? (
                                                                                        <input
                                                                                            type="text"
                                                                                            autoFocus
                                                                                            value={editFieldValue}
                                                                                            onChange={(e) => setEditFieldValue(e.target.value)}
                                                                                            onBlur={() => handleSaveSolField(project, sol.id, 'team')}
                                                                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveSolField(project, sol.id, 'team')}
                                                                                            className="w-full text-xs bg-white dark:bg-slate-800 border border-cyan-400 rounded px-2 py-1 outline-none"
                                                                                        />
                                                                                    ) : (
                                                                                        <div
                                                                                            onClick={() => { setEditingSolField({ projId: project.id, solId: sol.id, field: 'team' }); setEditFieldValue(sol.team || sol.machineCode || ''); }}
                                                                                            className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-2 py-1 -mx-2 -my-1 transition-colors min-h-[24px] flex items-center"
                                                                                        >
                                                                                            {sol.team || sol.machineCode || '-'}
                                                                                        </div>
                                                                                    )}
                                                                                </td>
                                                                                {!['trial', 'mockup'].includes(currentActiveStage) && (
                                                                                    <td className="px-3 py-2.5">
                                                                                        {currentActiveStage === 'valid' ? (
                                                                                            editingSolField?.projId === project.id && editingSolField?.solId === sol.id && editingSolField?.field === 'responsible' ? (
                                                                                                <input
                                                                                                    type="text"
                                                                                                    autoFocus
                                                                                                    value={editFieldValue}
                                                                                                    onChange={(e) => setEditFieldValue(e.target.value)}
                                                                                                    onBlur={() => handleSaveSolField(project, sol.id, 'responsible')}
                                                                                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveSolField(project, sol.id, 'responsible')}
                                                                                                    className="w-full text-xs bg-white dark:bg-slate-800 border border-cyan-400 rounded px-2 py-1 outline-none"
                                                                                                />
                                                                                            ) : (
                                                                                                <div
                                                                                                    onClick={() => { setEditingSolField({ projId: project.id, solId: sol.id, field: 'responsible' }); setEditFieldValue(sol.responsible || ''); }}
                                                                                                    className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-2 py-1 -mx-2 -my-1 transition-colors min-h-[24px] flex items-center"
                                                                                                >
                                                                                                    {sol.responsible || '-'}
                                                                                                </div>
                                                                                            )
                                                                                        ) : (
                                                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{sol.responsible || '-'}</span>
                                                                                        )}
                                                                                    </td>
                                                                                )}
                                                                                <td className="px-3 py-2.5">
                                                                                    <div className="flex flex-col gap-1.5">
                                                                                        <select value={sol.stageTracking?.[currentActiveStage]?.status || 'Pending'} onChange={(e) => handleUpdateSolutionStatus(project, sol.id, e.target.value as BrainstormSolution['status'], currentActiveStage)}
                                                                                            className={`px-2 py-1 rounded text-[10px] font-black uppercase cursor-pointer border-0 outline-none ${SOLUTION_STATUS_COLORS[sol.stageTracking?.[currentActiveStage]?.status || 'Pending']}`}>
                                                                                            <option value="Pending">Pending</option>
                                                                                            <option value="In Progress">In Progress</option>
                                                                                            <option value="Trial">Trial</option>
                                                                                            <option value="Done">Done</option>
                                                                                            <option value="Drop">Drop</option>
                                                                                        </select>
                                                                                        {stageDays !== undefined && (
                                                                                            <div className="inline-flex items-center justify-center bg-cyan-50 dark:bg-cyan-900/20 px-2 py-0.5 rounded border border-cyan-100 dark:border-cyan-800/50 self-start">
                                                                                                <span className="text-[9px] font-black text-cyan-600 dark:text-cyan-400">
                                                                                                    {stageDays} {stageDays === 1 ? 'DAY' : 'DAYS'}
                                                                                                </span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8 text-slate-400 dark:text-slate-600">
                                                            <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                                                            <p className="text-xs font-bold uppercase">No solutions to track</p>
                                                            <p className="text-[11px] mt-1">Add solutions in the Brainstorm stage first</p>
                                                        </div>
                                                    )}

                                                    {/* Daily Notes for Trial/Mockup/Valid; Stage Notes for other stages */}
                                                    {['trial', 'mockup', 'valid'].includes(currentActiveStage)
                                                        ? renderDailyNotesSection(project, currentActiveStage, TIMELINE_STAGES.find(s => s.id === currentActiveStage)?.label || currentActiveStage)
                                                        : (
                                                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><StickyNote size={10} /> Stage Notes</span>
                                                                    {editingNoteKey !== `${project.id}-${currentActiveStage}` ? (
                                                                        <button onClick={() => {
                                                                            setEditingNoteKey(`${project.id}-${currentActiveStage}`);
                                                                            let initVal = project.stageNotes?.[currentActiveStage] || '';
                                                                            if (!initVal) { initVal = `[${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}] `; }
                                                                            setEditNoteText(initVal);
                                                                        }}
                                                                            className="text-[11px] text-cyan-500 hover:text-cyan-400 font-bold flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-cyan-500/10 transition-colors"><Edit3 size={14} /> Edit</button>
                                                                    ) : (
                                                                        <div className="flex gap-2">
                                                                            <button onClick={() => handleSaveStageNote(project, currentActiveStage)} className="text-[11px] text-green-500 hover:text-green-400 font-bold flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-green-500/10 transition-colors"><Save size={14} /> Save</button>
                                                                            <button onClick={() => setEditingNoteKey(null)} className="text-[11px] text-slate-400 hover:text-slate-300 font-bold px-2 py-1 rounded-lg hover:bg-slate-500/10 transition-colors">Cancel</button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {editingNoteKey === `${project.id}-${currentActiveStage}` ? (
                                                                    <textarea value={editNoteText} onChange={e => setEditNoteText(e.target.value)} rows={2}
                                                                        className="w-full px-3 py-2 bg-white dark:bg-[#0F172A] border border-cyan-300 dark:border-cyan-600 rounded-lg text-xs text-slate-800 dark:text-white focus:outline-none resize-none"
                                                                        placeholder={`Add notes for ${TIMELINE_STAGES.find(s => s.id === currentActiveStage)?.label} stage...`} />
                                                                ) : (
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">{project.stageNotes?.[currentActiveStage] || 'No notes added.'}</p>
                                                                )}
                                                            </div>
                                                        )
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Detail Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-800">
                                    <div className="space-y-3">
                                        <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            Overview
                                        </h4>
                                        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">Cut Handover</span>
                                                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{project.cutHandoverDate || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">VE Handover</span>
                                                <span className="text-xs font-bold text-green-600 dark:text-green-400">{project.handoverVeDate || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">Status</span>
                                                <span className="text-xs font-bold text-slate-800 dark:text-white">{project.status}</span>
                                            </div>
                                            <div className="border-t border-slate-200 dark:border-slate-800/50 my-1"></div>
                                            <div className="flex justify-between">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">Chassis</span>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{project.chassis || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">Mechanic</span>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{project.mechanic || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 col-span-2 flex flex-col justify-end">
                                        <div className="flex flex-col gap-1 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                                            <div className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wide">Drop/Delay Reason:</div>
                                            <div className="text-xs text-slate-600 dark:text-slate-300 italic whitespace-normal break-words leading-relaxed">
                                                {project.reasonForDrop || project.commentsOnCompletionDelay || 'No issues reported'}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => onDelete(project.id)}
                                                className="px-4 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500/20 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                                                title="Delete Record"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            {/* VE Handover Button */}
                                            {activeCategory === 'MDS SE' && onVeHandover && !project.veHandover && (
                                                <div className="relative" data-dropdown>
                                                    <button
                                                        onClick={() => setVeDropdownId(veDropdownId === project.id ? null : project.id)}
                                                        className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
                                                    >
                                                        <ArrowRightLeft size={14} /> VE Handover
                                                    </button>
                                                    {veDropdownId === project.id && (
                                                        <div data-dropdown className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                                                            {veHandoverConfirm?.projectId === project.id ? (
                                                                /* In-app Confirmation Panel */
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                                                        <AlertTriangle size={14} />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest">Confirm Handover</span>
                                                                    </div>
                                                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                                                        Hand over <strong className="text-slate-800 dark:text-white">{project.styleNo}</strong> to <strong className={veHandoverConfirm.ve.color}>{veHandoverConfirm.ve.label}</strong>?
                                                                    </p>
                                                                    <p className="text-[9px] text-slate-400 dark:text-slate-500">A new fresh timeline will be created for the target VE department.</p>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => setVeHandoverConfirm(null)}
                                                                            className="flex-1 py-2 text-[10px] font-black uppercase rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                onVeHandover(project.id, veHandoverConfirm.ve.id);
                                                                                setVeDropdownId(null);
                                                                                setVeHandoverConfirm(null);
                                                                            }}
                                                                            className="flex-1 py-2 text-[10px] font-black uppercase rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-1"
                                                                        >
                                                                            <Send size={10} /> Confirm
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                /* Target Selection Panel */
                                                                <>
                                                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                                        <Send size={9} /> Select Target VE
                                                                    </p>
                                                                    <div className="space-y-1.5">
                                                                        {VE_TARGETS.map((ve) => (
                                                                            <button
                                                                                key={ve.id}
                                                                                onClick={() => {
                                                                                    setVeHandoverConfirm({ projectId: project.id, ve });
                                                                                }}
                                                                                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left font-bold text-xs transition-all border border-transparent hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 ${ve.color}`}
                                                                            >
                                                                                <ArrowRightLeft size={12} />
                                                                                {ve.label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {project.veHandover && activeCategory === 'MDS SE' && (
                                                <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-2">
                                                    <Send size={14} /> Handed → {project.veHandover.replace(' VE', '')}
                                                </div>
                                            )}
                                            <button
                                                onClick={() => onEdit(project)}
                                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/20"
                                            >
                                                Update Full Status
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                );
            })}

            {/* Print Only Section - HIDE/REMOVED */}
            <div className="hidden print:block fixed inset-0 bg-white z-[9999] overflow-y-auto">
            </div>
            {/*
            {printingProjectId && (
                <div className="hidden print:block fixed inset-0 bg-white z-[9999] overflow-y-auto top-0 left-0 w-full h-full p-0 m-0">
                    <SolutionFeedbackSheet project={projects.find(p => p.id === printingProjectId)!} />
                </div>
            )}
            */}
        </div >
    );
});
