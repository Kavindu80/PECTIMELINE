
import React, { useState } from 'react';
import { Project } from '../types';
import { TIMELINE_STAGES, PLANT_COLORS } from '../constants';
import { calculateProjectDuration, getStageDate } from '../utils/durationCalculator';
import { X, Edit, AlertTriangle, Calendar, CheckCircle2, ChevronDown, ChevronUp, History, Trash2 } from 'lucide-react';

interface ProjectDetailsModalProps {
   project: Project;
   isOpen: boolean;
   onClose: () => void;
   onEdit: (project: Project) => void;
   onDelete: (id: string) => void;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({ project, isOpen, onClose, onEdit, onDelete }) => {
   const [showDeadlineHistory, setShowDeadlineHistory] = useState(false);

   if (!isOpen) return null;

   const plantColor = PLANT_COLORS[project.plant] || 'text-slate-400';

   // Calculate pipeline progress using centralized duration logic
   const completedStagesCount = TIMELINE_STAGES.filter(stage => !!getStageDate(project, stage.id, 'actual')).length;
   const progressPercentage = Math.round((completedStagesCount / TIMELINE_STAGES.length) * 100);

   // Status Colors Logic
   const statusColor = project.status.includes('Hold') ? 'bg-red-500' :
      project.status === 'Ongoing' ? 'bg-blue-600' :
         project.status === 'Completed' ? 'bg-emerald-500' : 'bg-slate-600';

   return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/60 dark:bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200">
         <div className="bg-white dark:bg-[#0F172A] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-6xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh] sm:max-h-[90vh]">

            {/* TOP SECTION: HEADER & KEY INFO */}
            <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 shrink-0">
               <div className="flex justify-between items-start">
                  <div>
                     <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3">
                        <span className={`${statusColor} text-white px-2 sm:px-3 py-1 rounded text-[9px] sm:text-[10px] font-black uppercase tracking-wider shrink-0`}>
                           {project.status.toUpperCase()}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                           <span>Style No: <span className="text-slate-800 dark:text-white">{project.styleNo}</span></span>
                           <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
                           <span className={plantColor}>Plant: {project.plant}</span>
                           <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
                           <span>{project.product}</span>
                        </div>
                     </div>
                  </div>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-2 bg-slate-100 dark:bg-slate-800/50 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                     <X size={18} />
                  </button>
               </div>

               <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 items-stretch lg:items-end mt-4">
                  {/* Solution */}
                  <div className="flex-1 min-w-0">
                     <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Solution</div>
                     <div className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug break-words">
                        {project.solution}
                     </div>
                  </div>

                  {/* Progress Bar Segmented */}
                  <div className="flex-1 w-full lg:max-w-md shrink-0">
                     <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 mb-2">
                        <span>Pipeline Progress</span>
                        <span className="text-cyan-600 dark:text-cyan-400 font-bold">{progressPercentage}%</span>
                     </div>
                     <div className="flex gap-1 h-1.5 w-full">
                        {TIMELINE_STAGES.map((stage, idx) => {
                           // Check if stage is completed using centralized logic
                           const actualDate = getStageDate(project, stage.id, 'actual');
                           const isCompleted = !!actualDate;
                           
                           return (
                              <div
                                 key={idx}
                                 className={`flex-1 rounded-full ${isCompleted ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-slate-200 dark:bg-slate-800'}`}
                              />
                           );
                        })}
                     </div>
                  </div>

                  {/* Deadline & History Trigger */}
                  <div className="shrink-0 sm:text-right min-w-0 sm:min-w-[140px] relative">
                     <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1 flex items-center justify-end gap-1">
                        <Calendar size={12} /> Deadline
                     </div>
                     <div
                        className={`text-xl font-black cursor-pointer group flex items-center justify-end gap-2 ${project.deadlineStatus === 'Overdue' ? 'text-red-500' :
                           project.deadlineStatus === 'Approaching' ? 'text-amber-500' : 'text-slate-700 dark:text-slate-200'
                           }`}
                        onClick={() => setShowDeadlineHistory(!showDeadlineHistory)}
                     >
                        {project.extendedDeadline || project.styleDueDate || 'TBD'}
                        {project.deadlineHistory && project.deadlineHistory.length > 0 && (
                           <ChevronDown size={16} className={`text-slate-400 dark:text-slate-500 transition-transform ${showDeadlineHistory ? 'rotate-180' : ''}`} />
                        )}
                     </div>

                     {/* Deadline Extended Tree (Dropdown) */}
                     {showDeadlineHistory && project.deadlineHistory && project.deadlineHistory.length > 0 && (
                        <div className="absolute top-full right-0 mt-3 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                           <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <History size={12} /> Extension History
                           </h4>
                           <div className="relative pl-3 border-l border-slate-200 dark:border-slate-700 ml-1 space-y-4">
                              {project.deadlineHistory.map((h, i) => (
                                 <div key={i} className="relative">
                                    <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-purple-500"></div>
                                    <div className="text-[10px] font-bold text-slate-800 dark:text-white">{h.date}</div>
                                    <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{h.reason}</div>
                                    <div className="text-[8px] text-slate-400 dark:text-slate-600 mt-1 uppercase">By: {h.updatedBy}</div>
                                 </div>
                              ))}
                              {/* Original */}
                              <div className="relative">
                                 <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600"></div>
                                 <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{project.styleDueDate}</div>
                                 <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase mt-0.5">Original Plan</div>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* MIDDLE SECTION: STEPPER VISUALIZATION */}
            <div className="p-4 sm:p-6 lg:p-10 overflow-x-auto custom-scrollbar border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1221]">
               <div className="flex justify-between min-w-[700px] sm:min-w-[900px] relative px-2 sm:px-4">
                  {/* Connecting Line */}
                  <div className="absolute top-[22px] left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0"></div>

                  {TIMELINE_STAGES.map((stage, idx) => {
                     const actualDate = getStageDate(project, stage.id, 'actual');
                     const plannedDate = getStageDate(project, stage.id, 'planned');
                     const isDone = !!actualDate;
                     
                     // Helper logic for "Next" stage pulse (similar to ProjectTimeline)
                     const previousCompleted = idx === 0 || !!getStageDate(project, TIMELINE_STAGES[idx - 1].id, 'actual');
                     const isNext = !isDone && previousCompleted;

                     // Determine Display Date
                     const date = actualDate || (isNext ? plannedDate : '');

                     // For PD stage, get the latest file link to show update info
                     const pdFileLink = stage.id === 'pd' ? (project.stageFiles || [])
                        .filter(f => f.stageId === 'pd')
                        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0] : null;

                     // Calculate color for PD based on planned vs actual
                     let pdStatusColor = '';
                     if (pdFileLink && pdFileLink.actualDate && pdFileLink.plannedDate) {
                        const actualDate = new Date(pdFileLink.actualDate);
                        const plannedDate = new Date(pdFileLink.plannedDate);
                        if (actualDate <= plannedDate) {
                           pdStatusColor = 'text-green-600 dark:text-green-400';
                        } else {
                           const diffDays = Math.ceil((actualDate.getTime() - plannedDate.getTime()) / (1000 * 60 * 60 * 24));
                           pdStatusColor = diffDays <= 3 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
                        }
                     }

                     return (
                        <div key={stage.id} className="flex flex-col items-center relative z-10 group">
                           <div className={`
                          w-12 h-12 rounded-full flex items-center justify-center border-[3px] transition-all duration-300
                          ${isDone
                                 ? 'bg-white dark:bg-[#0B1221] border-cyan-500 text-cyan-600 dark:text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-110'
                                 : isNext
                                    ? 'bg-white dark:bg-[#0B1221] border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse'
                                    : 'bg-white dark:bg-[#0B1221] border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600'
                              }
                       `}>
                              <stage.icon size={18} />
                           </div>

                           <div className="mt-4 text-center space-y-1.5">
                              <div className={`text-[9px] font-black uppercase tracking-wider ${isDone ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>
                                 {stage.label}
                              </div>

                                 {date ? (
                                    <div className={`text-[9px] font-bold px-2.5 py-1 rounded-md shadow-sm ${
                                       isDone 
                                          ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-900/50' 
                                          : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50'
                                    }`}>
                                       {date}
                                    </div>
                                 ) : isNext ? (
                                 <div className="text-[9px] font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-2.5 py-1 rounded-md shadow-sm">
                                    --
                                 </div>
                              ) : (
                                 <div className="text-[9px] font-bold text-slate-400 dark:text-slate-700 px-2.5 py-1">
                                    --
                                 </div>
                              )}

                              {/* PD Stage: Show update date below icon with color coding */}
                              {stage.id === 'pd' && pdFileLink && (
                                 <div className="mt-2 space-y-0.5">
                                    <div className={`text-[8px] font-bold ${pdStatusColor || 'text-slate-500 dark:text-slate-400'}`}>
                                       Updated: {pdFileLink.uploadedAt}
                                    </div>
                                    {pdFileLink.uploadedBy && (
                                       <div className="text-[7px] text-slate-400 dark:text-slate-500">
                                          By: {pdFileLink.uploadedBy}
                                       </div>
                                    )}
                                 </div>
                              )}
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            {/* BOTTOM SECTION: DETAILED GRID */}
            <div className="flex-1 bg-white dark:bg-slate-900/30 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">

                  {/* Left Column: Dates & Handover */}
                  <div className="space-y-6">
                     <div>
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Overview</h3>
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 grid grid-cols-2 gap-y-4 gap-x-8">
                           <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Style In Date</span>
                              <span className="text-xs font-mono text-slate-800 dark:text-white">{project.styleInDate}</span>
                           </div>
                           <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Cut Handover</span>
                              <span className="text-xs font-mono text-purple-600 dark:text-purple-400">{project.cutHandoverDate || '-'}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">VE Handover</span>
                              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">{project.handoverVeDate || 'Pending'}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Order Qty</span>
                              <span className="text-xs font-mono text-slate-800 dark:text-white">{project.orderQty?.toLocaleString() || '0'}</span>
                           </div>
                           <div className="border-t border-slate-200 dark:border-slate-800/50 my-1"></div>
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase">Original Deadline</span>
                              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">{project.styleDueDate || 'Not Set'}</span>
                           </div>
                           {project.extendedDeadline && (
                              <div className="flex justify-between items-center">
                                 <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase">Extended To</span>
                                 <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">{project.extendedDeadline}</span>
                              </div>
                           )}
                        </div>
                     </div>

                     {/* Drop / Delay Reason */}
                     {(project.status.includes('Hold') || project.deadlineStatus === 'Overdue' || project.reasonForDrop) && (
                        <div className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                           <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <AlertTriangle size={12} /> Drop / Delay Reason
                           </h4>
                           <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                              {project.reasonForDrop || project.commentsOnCompletionDelay || 'No specific delay reason logged.'}
                           </p>
                        </div>
                     )}
                  </div>

                  {/* Right Column: Actions & Meta */}
                  <div className="flex flex-col justify-end space-y-4">
                     <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase">Customer</span>
                           <span className="text-xs text-slate-800 dark:text-white font-bold">{project.customer}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase">Source</span>
                           <span className="text-xs text-slate-800 dark:text-white font-bold">{project.source}</span>
                        </div>
                     </div>

                     <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-auto items-stretch sm:items-center">
                        <button
                           onClick={() => onDelete(project.id)}
                           className="p-3 text-red-500 hover:text-red-700 dark:hover:text-white hover:bg-red-50 dark:hover:bg-red-500/20 rounded-xl transition-colors"
                           title="Delete Record"
                        >
                           <Trash2 size={16} />
                        </button>
                        <button
                           onClick={onClose}
                           className="flex-1 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-xl transition-colors uppercase tracking-wider"
                        >
                           Close View
                        </button>
                        <button
                           onClick={() => { onClose(); onEdit(project); }}
                           className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                        >
                           <Edit size={14} /> Edit Record
                        </button>
                     </div>
                  </div>

               </div>
            </div>

         </div>
      </div>
   );
};
