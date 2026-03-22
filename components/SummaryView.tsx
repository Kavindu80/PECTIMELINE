
import React, { useMemo, useRef, useEffect } from 'react';
import { Project, ProjectStatus, SubFilterType } from '../types';
import {
  BarChart3, AlertCircle, CheckCircle2,
  Factory, ArrowRight,
  Layers, Scissors
} from 'lucide-react';
import { CATEGORIES } from '../constants';

interface SummaryViewProps {
  projects: Project[];
  onCategoryClick: (category: ProjectStatus) => void;
  onFilterClick: (category: ProjectStatus, filter: SubFilterType) => void;
  onEdit: (project: Project) => void;
  onView: (project: Project) => void;
  searchQuery?: string;
  statusFilter?: string;
  dateRange?: { start: string; end: string };
}

export const SummaryView: React.FC<SummaryViewProps> = React.memo(({ projects, onCategoryClick, onFilterClick, onEdit, onView, searchQuery, statusFilter, dateRange }) => {

  const projectListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to project list when search or status filter is applied
  useEffect(() => {
    if ((searchQuery && searchQuery.trim() !== '') || (statusFilter && statusFilter !== 'All Statuses') || (dateRange && (dateRange.start !== '' || dateRange.end !== ''))) {
      projectListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchQuery, statusFilter, dateRange]);

  // Calculate Global Stats
  const stats = useMemo(() => {
    return {
      total: projects.length,
      seStyles: projects.filter(p => !p.handoverVeDate).length,
      veStyles: projects.filter(p => !!p.handoverVeDate).length,
      completed: projects.filter(p => p.status === 'Completed' || p.status === 'Handed Over').length,
      critical: projects.filter(p => p.deadlineStatus === 'Overdue' || p.status.includes('Hold')).length,
      totalSolutions: projects.reduce((acc, p) => acc + (p.solutions?.length || 0), 0),
    };
  }, [projects]);

  // Helper to get stats for a specific category
  const getCategoryStats = (catId: string) => {
    const catProjects = projects.filter(p => p.category === catId);
    return {
      count: catProjects.length,
      ongoing: catProjects.filter(p => p.status === 'Ongoing').length,
      completed: catProjects.filter(p => p.status === 'Completed' || p.status === 'Handed Over' || !!p.handoverVeDate).length,
      critical: catProjects.filter(p => p.deadlineStatus === 'Overdue' || p.status.includes('Hold')).length,
      projects: catProjects
    };
  };

  // All Projects for the Project List (sorted by core deadline for stability)
  const allProjectsList = useMemo(() => {
    return [...projects].sort((a, b) => {
      const dateA = a.extendedDeadline || a.cutRequiredDate || '';
      const dateB = b.extendedDeadline || b.cutRequiredDate || '';
      return dateA.localeCompare(dateB);
    });
  }, [projects]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">

      {/* SECTION 1: High Level KPI Cards (Redesigned) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">

        {/* Card 1: Total Styles */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 p-5 rounded-2xl shadow-xl shadow-blue-900/20 group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500">
            <Layers size={100} className="text-white" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <Layers size={18} className="text-white" />
              </div>
              <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Total Styles</span>
            </div>
            <p className="text-4xl font-black text-white tracking-tight">{stats.total}</p>
            <div className="h-1 w-full bg-blue-900/30 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-white/30 w-full"></div>
            </div>
          </div>
        </div>

        {/* Card 2: Total Solutions */}
        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-600 to-cyan-800 p-5 rounded-2xl shadow-xl shadow-cyan-900/20 group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500">
            <div className="text-white opacity-20"><svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg></div>
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>
              </div>
              <span className="text-[10px] font-black text-cyan-100 uppercase tracking-widest">Total Solutions</span>
            </div>
            <p className="text-4xl font-black text-white tracking-tight">{stats.totalSolutions}</p>
            <div className="h-1 w-full bg-cyan-900/30 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-white/30 w-full"></div>
            </div>
          </div>
        </div>

        {/* Card 3: Styles in SE */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 rounded-2xl shadow-xl shadow-indigo-900/20 group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500">
            <Scissors size={100} className="text-white" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <Scissors size={18} className="text-white" />
              </div>
              <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">In Development (SE)</span>
            </div>
            <p className="text-4xl font-black text-white tracking-tight">{stats.seStyles}</p>
            <div className="h-1 w-full bg-indigo-900/30 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-white/30" style={{ width: `${stats.total ? (stats.seStyles / stats.total) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>

        {/* Card 4: Styles Completed */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 rounded-2xl shadow-xl shadow-emerald-900/20 group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500">
            <CheckCircle2 size={100} className="text-white" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <CheckCircle2 size={18} className="text-white" />
              </div>
              <span className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">Styles Completed</span>
            </div>
            <p className="text-4xl font-black text-white tracking-tight">{stats.completed}</p>
            <div className="h-1 w-full bg-emerald-900/30 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-white/30" style={{ width: `${stats.total ? (stats.completed / stats.total) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>

        {/* Card 5: Deadline Exceeded */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-600 to-red-800 p-5 rounded-2xl shadow-xl shadow-red-900/20 group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500">
            <AlertCircle size={100} className="text-white" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <AlertCircle size={18} className="text-white" />
              </div>
              <span className="text-[10px] font-black text-red-100 uppercase tracking-widest">Deadline Exceeded</span>
            </div>
            <p className="text-4xl font-black text-white tracking-tight">{stats.critical}</p>
            <div className="h-1 w-full bg-red-900/30 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-white/30" style={{ width: `${stats.total ? (stats.critical / stats.total) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Plant/Category Command Center */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
        {CATEGORIES.filter(c => c.id !== 'Summary').map((cat) => {
          const stats = getCategoryStats(cat.id);
          const percentDone = stats.count > 0 ? Math.round((stats.completed / stats.count) * 100) : 0;

          return (
            <div
              key={cat.id}
              className={`relative overflow-hidden group text-left p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer ${cat.id === 'MDS SE' ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-500 dark:hover:border-indigo-500' :
                cat.id === 'Unichela Panadura VE' ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-500/30 hover:border-orange-500 dark:hover:border-orange-500' :
                  cat.id === 'Casualine VE' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-500 dark:hover:border-emerald-500' :
                    'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-500/30 hover:border-purple-500 dark:hover:border-purple-500'
                }`}
              onClick={() => onCategoryClick(cat.id)}
            >
              {/* Background Image for MDS SE */}
              {cat.id === 'MDS SE' && (
                <div className="absolute inset-0 z-0">
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 dark:opacity-15 group-hover:opacity-30 dark:group-hover:opacity-20 transition-opacity duration-500"
                    style={{ backgroundImage: 'url(/assets/rathmalana_mds.avif)' }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent"></div>
                </div>
              )}

              {/* Background Image for Unichela Panadura VE */}
              {cat.id === 'Unichela Panadura VE' && (
                <div className="absolute inset-0 z-0">
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 dark:opacity-15 group-hover:opacity-30 dark:group-hover:opacity-20 transition-opacity duration-500"
                    style={{ backgroundImage: 'url(/assets/panadura.avif)' }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent"></div>
                </div>
              )}

              {/* Background Image for Casualine VE */}
              {cat.id === 'Casualine VE' && (
                <div className="absolute inset-0 z-0">
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 dark:opacity-15 group-hover:opacity-30 dark:group-hover:opacity-20 transition-opacity duration-500"
                    style={{ backgroundImage: 'url(/assets/casualine.avif)' }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent"></div>
                </div>
              )}

              {/* Background Image for Long Term */}
              {cat.id === 'Long Term' && (
                <div className="absolute inset-0 z-0">
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 dark:opacity-15 group-hover:opacity-30 dark:group-hover:opacity-20 transition-opacity duration-500"
                    style={{ backgroundImage: 'url(/assets/long_t.avif)' }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent"></div>
                </div>
              )}

              {/* Background Icon Decoration */}
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500 pointer-events-none z-[1]">
                {React.cloneElement(cat.icon as React.ReactElement<any>, { size: 120 })}
              </div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl inline-flex ${cat.color} bg-opacity-20 text-white shadow-inner`}>
                    {cat.icon}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors">
                    Open View <ArrowRight size={10} />
                  </div>
                </div>

                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1 truncate">{cat.label}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-6">{stats.count} Active Projects</p>

                {/* Stats Buttons - Stop Propagation to allow specific filtering */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <button
                    onClick={(e) => { e.stopPropagation(); onFilterClick(cat.id, 'Ongoing'); }}
                    className="bg-white dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-600/20 rounded-lg p-2 text-center border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all group/stat"
                  >
                    <div className="text-[8px] font-black text-slate-400 dark:text-slate-500 group-hover/stat:text-blue-600 dark:group-hover/stat:text-blue-300 uppercase">Ongoing</div>
                    <div className="text-xl font-black text-blue-500 dark:text-blue-400 group-hover/stat:text-blue-600 dark:group-hover/stat:text-white">{stats.ongoing}</div>
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); onFilterClick(cat.id, 'Completed'); }}
                    className="bg-white dark:bg-slate-900/50 hover:bg-green-50 dark:hover:bg-green-600/20 rounded-lg p-2 text-center border border-slate-200 dark:border-slate-800 hover:border-green-500 transition-all group/stat"
                  >
                    <div className="text-[8px] font-black text-slate-400 dark:text-slate-500 group-hover/stat:text-green-600 dark:group-hover/stat:text-green-300 uppercase">Done</div>
                    <div className="text-xl font-black text-green-500 dark:text-green-400 group-hover/stat:text-green-600 dark:group-hover/stat:text-white">{stats.completed}</div>
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); onFilterClick(cat.id, 'Critical'); }}
                    className="bg-white dark:bg-slate-900/50 hover:bg-red-50 dark:hover:bg-red-600/20 rounded-lg p-2 text-center border border-slate-200 dark:border-slate-800 hover:border-red-500 transition-all group/stat"
                  >
                    <div className="text-[8px] font-black text-slate-400 dark:text-slate-500 group-hover/stat:text-red-600 dark:group-hover/stat:text-red-300 uppercase">Critical</div>
                    <div className={`text-xl font-black ${stats.critical > 0 ? 'text-red-500' : 'text-slate-400 dark:text-slate-600'} group-hover/stat:text-red-600 dark:group-hover/stat:text-white`}>{stats.critical}</div>
                  </button>
                </div>

                <div className="mt-auto">
                  <div className="flex justify-between text-[8px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    <span>Progress</span>
                    <span>{percentDone}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${cat.color}`}
                      style={{ width: `${percentDone}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 3: All Projects Overview */}
      <div ref={projectListRef} className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-3 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <AlertCircle size={16} className="text-blue-500" />
            Project Status Overview
          </h3>
          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">
            {allProjectsList.length} Projects Found
          </span>
        </div>

        {allProjectsList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-bold text-xs uppercase tracking-widest">
            No projects found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100 dark:bg-slate-900/80 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Style</th>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Issue / Solution</th>
                  <th className="px-6 py-3 text-right">Deadline</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allProjectsList.slice(0, 10).map((p) => {
                  // Determine status badge color based on actual project status
                  const getStatusColor = (status: string) => {
                    if (status.includes('Dropped') || status.includes('Drop')) {
                      return 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400';
                    } else if (status.includes('Hold')) {
                      return 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400';
                    } else if (status === 'Completed' || status === 'Handed Over') {
                      return 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400';
                    } else if (status === 'Ongoing' || status === 'Trial Run') {
                      return 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400';
                    } else if (status === 'New' || status === 'Pending Cut') {
                      return 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400';
                    } else {
                      return 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
                    }
                  };

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => onView(p)}
                    >
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${getStatusColor(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-[9px] font-bold text-slate-500 dark:text-slate-400">{p.category}</td>
                      <td className="px-6 py-3 text-[10px] font-black text-slate-800 dark:text-white">{p.styleNo}</td>
                      <td className="px-6 py-3 text-[9px] text-slate-500 dark:text-slate-400">{p.product}</td>
                      <td className="px-6 py-3">
                        <div className="max-w-[300px] truncate text-[10px] text-slate-600 dark:text-slate-300" title={p.solution || (p.solutions && p.solutions.length > 0 ? p.solutions[0].solutionText : '')}>
                          {(p.status.includes('Hold') || p.status.includes('Drop')) ? <span className="text-red-500 dark:text-red-400 font-bold mr-1">{p.reasonForDrop || 'Blocked'}:</span> : null}
                          {p.solution || (p.solutions && p.solutions.length > 0 ? p.solutions[0].solutionText : <span className="text-slate-400 italic">No solution added</span>)}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right text-[10px] font-mono font-bold text-red-500 dark:text-red-400">
                        {p.extendedDeadline || p.cutRequiredDate}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(p);
                          }}
                          className="text-[9px] font-black text-blue-500 hover:text-blue-700 dark:hover:text-white uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {allProjectsList.length > 10 && (
              <div className="p-3 text-center text-[9px] font-bold text-slate-500 border-t border-slate-200 dark:border-slate-800">
                + {allProjectsList.length - 10} more projects hidden
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
});
