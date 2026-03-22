
import React from 'react';
import { Project, ProjectStatus } from '../types';
import { Edit2, Archive, Zap, Trash2 } from 'lucide-react';

interface ProjectTableProps {
  projects: Project[];
  category: ProjectStatus;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onUpdateProject: (project: Project) => void;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({ projects, category, onEdit, onDelete, onUpdateProject }) => {
  const filteredProjects = projects.filter(p => p.category === category || category === 'Summary');
  const [editingCell, setEditingCell] = React.useState<{ projId: string, field: string } | null>(null);
  const [editValue, setEditValue] = React.useState('');

  const handleStartEdit = (project: Project, field: string, value: string) => {
    setEditingCell({ projId: project.id, field });
    setEditValue(value || '');
  };

  const handleSaveEdit = (project: Project, field: string) => {
    if (editingCell) {
      onUpdateProject({ ...project, [field]: editValue });
      setEditingCell(null);
    }
  };

  // Helper to render an editable date cell
  const renderDateCell = (project: Project, field: keyof Project, planDate?: string, isActualField: boolean = true) => {
    const value = project[field] as string;
    const isEditing = editingCell?.projId === project.id && editingCell?.field === field;

    if (isEditing) {
      return (
        <input
          autoFocus
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleSaveEdit(project, field as string)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveEdit(project, field as string);
            if (e.key === 'Escape') setEditingCell(null);
          }}
          placeholder="DD-MMM-YY"
          className="w-full text-[11px] bg-white dark:bg-slate-800 border-2 border-blue-400 rounded px-1 py-0.5 outline-none min-w-[70px]"
        />
      );
    }

    return (
      <div
        onClick={() => handleStartEdit(project, field as string, value)}
        className={`cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded transition-colors min-h-[20px] flex items-center ${!value ? 'opacity-50 hover:opacity-100' : ''}`}
        title="Click to edit date"
      >
        {value ? (
          <span className="text-[11px] font-bold text-green-600 dark:text-green-400 whitespace-nowrap">✓ {value}</span>
        ) : (
          <span className="text-[10px] font-bold text-red-500 dark:text-red-400 italic">
            {planDate ? 'Missing' : 'Missing'}
          </span>
        )}
      </div>
    );
  };

  // Helper function to render empty fields in red
  const renderEmptyField = (value: any) => {
    return value ? (
      <span className="text-[11px] text-slate-700 dark:text-slate-300">{value}</span>
    ) : (
      <span className="text-[10px] font-bold text-red-500 dark:text-red-400 italic">Missing</span>
    );
  };

  // Helper function to render link cells with upload capability
  const renderLinkCell = (project: Project, solution: any, linkField: 'videoLink' | 'stwLink' | 'mdsLink' | 'pdLink', dateField: 'videoDate' | 'stwDate' | 'mdsDate' | 'pdDate', label: string) => {
    const link = solution?.[linkField];
    const date = solution?.[dateField];
    const isEditing = editingCell?.projId === project.id && editingCell?.field === `${solution?.id}_${linkField}`;

    if (isEditing) {
      return (
        <input
          autoFocus
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => {
            if (editValue.trim()) {
              const updatedSolutions = (project.solutions || []).map(s => {
                if (s.id === solution.id) {
                  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
                  return { ...s, [linkField]: editValue, [dateField]: today };
                }
                return s;
              });
              onUpdateProject({ ...project, solutions: updatedSolutions });
            }
            setEditingCell(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (editValue.trim()) {
                const updatedSolutions = (project.solutions || []).map(s => {
                  if (s.id === solution.id) {
                    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
                    return { ...s, [linkField]: editValue, [dateField]: today };
                  }
                  return s;
                });
                onUpdateProject({ ...project, solutions: updatedSolutions });
              }
              setEditingCell(null);
            }
            if (e.key === 'Escape') setEditingCell(null);
          }}
          placeholder="Enter link URL"
          className="w-full text-[11px] bg-white dark:bg-slate-800 border-2 border-blue-400 rounded px-1 py-0.5 outline-none min-w-[70px]"
        />
      );
    }

    if (link) {
      return (
        <div className="flex flex-col gap-0.5">
          <a 
            href={link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-500 hover:text-blue-600 underline text-[11px] font-bold"
            onClick={(e) => e.stopPropagation()}
          >
            ✓ {label}
          </a>
          {date && <span className="text-[7px] text-slate-400">{date}</span>}
        </div>
      );
    }

    return (
      <div
        onClick={() => {
          setEditingCell({ projId: project.id, field: `${solution?.id}_${linkField}` });
          setEditValue('');
        }}
        className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded transition-colors min-h-[20px] flex items-center"
        title={`Click to add ${label} link`}
      >
        <span className="text-[10px] font-bold text-red-500 dark:text-red-400 italic">Missing</span>
      </div>
    );
  };

  if (filteredProjects.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center h-full flex flex-col items-center justify-center">
        <Archive size={24} className="text-slate-400 dark:text-slate-700 mb-3" />
        <h3 className="text-xs font-black text-slate-500 dark:text-slate-600 uppercase">No records found for this stage</h3>
      </div>
    );
  }

  return (
    <div className="relative bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl h-full flex flex-col">
      {/* Scroll hint gradient for mobile */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-[#0F172A] to-transparent z-10 pointer-events-none lg:hidden" />
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[4200px]">
          <thead className="sticky top-0 bg-slate-50 dark:bg-[#1E293B] z-20 border-b border-slate-200 dark:border-slate-700 shadow-md">
            <tr>
              <th colSpan={10} className="px-2 py-1 text-[7px] font-black text-slate-500 uppercase tracking-widest text-center border-r border-slate-200 dark:border-slate-800">Style Info</th>
              <th colSpan={3} className="px-2 py-1 text-[7px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest text-center border-r border-slate-200 dark:border-slate-800 bg-indigo-50 dark:bg-[#1E293B]">Mechanic</th>
              <th colSpan={6} className="px-2 py-1 text-[7px] font-black text-purple-500 dark:text-purple-400 uppercase tracking-widest text-center border-r border-slate-200 dark:border-slate-800 bg-purple-50 dark:bg-[#1E293B]">Cut & Dates</th>
              <th colSpan={13} className="px-2 py-1 text-[7px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest text-center border-r border-slate-200 dark:border-slate-800 bg-cyan-50 dark:bg-[#06b6d4]/10">Critical Path (Actuals)</th>
              <th colSpan={7} className="px-2 py-1 text-[7px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest text-center border-r border-slate-200 dark:border-slate-800 bg-green-50 dark:bg-[#1E293B]">Handover & IE (Actuals)</th>
              <th colSpan={11} className="px-2 py-1 text-[7px] font-black text-red-500 dark:text-red-400 uppercase tracking-widest text-center bg-red-50 dark:bg-[#1E293B]">Planning & Status (Actuals)</th>
              <th className="bg-slate-50 dark:bg-[#1E293B]"></th>
            </tr>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              {/* Style Info */}
              <th className="th-cell w-10">Week</th>
              <th className="th-cell w-20">Style In</th>
              <th className="th-cell w-10">Number</th>
              <th className="th-cell w-12">Core</th>
              <th className="th-cell w-16">Source</th>
              <th className="th-cell w-20">Customer</th>
              <th className="th-cell w-24">Style No</th>
              <th className="th-cell w-16">Product</th>
              <th className="th-cell w-16">Chassis</th>
              <th className="th-cell min-w-[200px]">Solution</th>

              {/* Mechanic (Indigo) */}
              <th className="th-cell w-24 text-indigo-600 dark:text-indigo-300 border-l border-slate-200 dark:border-slate-800">Engineer</th>
              <th className="th-cell w-24 text-indigo-600 dark:text-indigo-300">Mechanic</th>
              <th className="th-cell w-24 text-indigo-600 dark:text-indigo-300">Sewing</th>

              {/* Cut Dates */}
              <th className="th-cell w-20 text-purple-600 dark:text-purple-300 border-l border-slate-200 dark:border-slate-800">Requested</th>
              <th className="th-cell w-20 text-purple-600 dark:text-purple-300">Required</th>
              <th className="th-cell w-20 text-purple-600 dark:text-purple-300">Committed</th>
              <th className="th-cell w-20 text-purple-600 dark:text-purple-300">Received</th>
              <th className="th-cell w-20 text-purple-600 dark:text-purple-300">Handover</th>
              <th className="th-cell w-32 text-purple-600 dark:text-purple-300">Comment</th>

              {/* Critical Path (Cyan) */}
              <th className="th-cell w-20 text-cyan-700 dark:text-cyan-300 border-l border-slate-200 dark:border-slate-800 bg-cyan-50 dark:bg-[#06b6d4]/5">Cut Kit</th>
              <th className="th-cell w-10 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-[#06b6d4]/5">Week</th>
              <th className="th-cell w-20 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-[#06b6d4]/5">Idea</th>
              <th className="th-cell w-20 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-[#06b6d4]/5">Machine</th>
              <th className="th-cell w-20 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-[#06b6d4]/5">SE Trial</th>
              <th className="th-cell w-20 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-[#06b6d4]/5">Solution Done</th>
              <th className="th-cell w-20 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-[#06b6d4]/5">Mockup</th>
              <th className="th-cell w-20 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-[#06b6d4]/5">Validation</th>
              <th className="th-cell w-20 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-[#06b6d4]/5">Video</th>
              <th className="th-cell w-20 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-[#06b6d4]/5">STW</th>
              <th className="th-cell w-20 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-[#06b6d4]/5">MDS</th>
              <th className="th-cell w-20 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-[#06b6d4]/5">Program Drawing</th>
              <th className="th-cell w-20 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-[#06b6d4]/5">Share Plant</th>

              {/* Handover & IE */}
              <th className="th-cell w-20 text-green-600 dark:text-green-300 border-l border-slate-200 dark:border-slate-800">IE Shared</th>
              <th className="th-cell w-20 text-green-600 dark:text-green-300">Unlock SDH</th>
              <th className="th-cell w-16 text-green-600 dark:text-green-300">SMV Savings</th>
              <th className="th-cell w-20 text-green-600 dark:text-green-300">VE Handover</th>
              <th className="th-cell w-20 text-green-600 dark:text-green-300">Plant Handover</th>
              <th className="th-cell w-16 text-green-600 dark:text-green-300">Routed</th>
              <th className="th-cell w-16 text-green-600 dark:text-green-300">Ingenium App</th>

              {/* Planning */}
              <th className="th-cell w-20 text-red-600 dark:text-red-300 border-l border-slate-200 dark:border-slate-800">FI Date</th>
              <th className="th-cell w-20 text-red-600 dark:text-red-300">PP Date</th>
              <th className="th-cell w-20 text-red-600 dark:text-red-300">PSD Date</th>
              <th className="th-cell w-20 text-red-600 dark:text-red-300">Planned Start</th>
              <th className="th-cell w-20 text-red-600 dark:text-red-300">Actual Start</th>
              <th className="th-cell w-24 text-red-600 dark:text-red-300">Start Delay</th>
              <th className="th-cell w-20 text-red-600 dark:text-red-300">Planned Completion</th>
              <th className="th-cell w-20 text-red-600 dark:text-red-300">Actual Completion</th>
              <th className="th-cell w-24 text-red-600 dark:text-red-300">Completion Delay</th>
              <th className="th-cell w-16 text-red-600 dark:text-red-300">Status</th>
              <th className="th-cell w-32 text-red-600 dark:text-red-300">Reason For Drop</th>

              <th className="th-cell w-14 text-right sticky right-0 bg-white dark:bg-[#0F172A] z-10">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredProjects.map((project) => {
              // Get all solutions for this project, or create a single row if no solutions
              const solutions = project.solutions && project.solutions.length > 0 ? project.solutions : [null];

              return solutions.map((solution, solutionIndex) => (
                <tr key={`${project.id}-${solutionIndex}`} className={`hover:bg-blue-50 dark:hover:bg-blue-600/5 transition-all text-xs font-medium group divide-x divide-slate-100 dark:divide-slate-800/50 ${project.status.toUpperCase().includes('HOLD') ? 'bg-red-50 dark:bg-red-500/[0.04]' : ''
                  } ${solutionIndex > 0 ? 'border-t-2 border-blue-200 dark:border-blue-800' : ''}`}>
                  {/* Info - Show only on first solution row */}
                  {solutionIndex === 0 ? (
                    <>
                      <td className="td-cell text-center text-blue-600 dark:text-blue-400" rowSpan={solutions.length}>{project.inWeek}</td>
                      <td className="td-cell text-slate-500 dark:text-slate-400" rowSpan={solutions.length}>{project.styleInDate}</td>
                      <td className="td-cell text-center text-slate-600 dark:text-slate-500" rowSpan={solutions.length}>{project.no}</td>
                      <td className="td-cell text-center" rowSpan={solutions.length}>
                        {project.core === 'Core' ? <span className="text-yellow-600 dark:text-yellow-500 font-bold">Y</span> : <span className="text-slate-400 dark:text-slate-600">N</span>}
                      </td>
                      <td className="td-cell text-slate-600 dark:text-slate-300" rowSpan={solutions.length}>{project.source}</td>
                      <td className="td-cell text-slate-800 dark:text-white font-bold" rowSpan={solutions.length}>{project.customer}</td>
                      <td className="td-cell text-slate-600 dark:text-slate-300 truncate" title={project.styleNo} rowSpan={solutions.length}>{project.styleNo}</td>
                      <td className="td-cell text-slate-500 dark:text-slate-400" rowSpan={solutions.length}>{project.product}</td>
                      <td className="td-cell text-purple-600 dark:text-purple-400 font-bold" rowSpan={solutions.length}>{project.chassis}</td>
                    </>
                  ) : null}

                  {/* Solution - Show solution-specific data */}
                  <td className="td-cell text-slate-600 dark:text-slate-300 max-w-[200px]" title={solution?.solutionText || project.solution}>
                    {solution ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-xs break-words whitespace-normal leading-relaxed">{solution.solutionText || '-'}</span>
                        {solution.operation && <span className="text-[10px] text-slate-400 break-words whitespace-normal leading-relaxed">Op: {solution.operation}</span>}
                        {solution.machineCode && <span className="text-[10px] text-blue-500">M/C: {solution.machineCode}</span>}
                        {solution.operationSMV && <span className="text-[10px] text-green-500">SMV: {solution.operationSMV}</span>}
                        {solution.comments && <span className="text-[7px] text-slate-400 italic break-words whitespace-normal leading-relaxed" title={solution.comments}>{solution.comments}</span>}
                      </div>
                    ) : (
                      <span className="break-words whitespace-normal leading-relaxed">{project.solution}</span>
                    )}
                  </td>

                  {/* Mechanic - Show solution responsible or project mechanic */}
                  <td className="td-cell text-slate-800 dark:text-white">{solution?.responsible || project.engineerName}</td>
                  <td className="td-cell text-slate-500 dark:text-slate-400">{solution?.team || project.mechanic}</td>
                  <td className="td-cell text-slate-500 dark:text-slate-400">{project.sewing}</td>

                  {/* Cut - Show only on first solution row - ONLY ACTUAL DATES */}
                  {solutionIndex === 0 ? (
                    <>
                      <td className="td-cell text-slate-500 dark:text-slate-400" rowSpan={solutions.length}>
                        {project.cutRequestedDate ? (
                          <span className="text-[11px] font-bold text-green-600 dark:text-green-400">✓ {project.cutRequestedDate}</span>
                        ) : <span className="text-[10px] text-slate-400">-</span>}
                      </td>
                      <td className="td-cell text-slate-500 dark:text-slate-400 font-bold" rowSpan={solutions.length}>{renderEmptyField(project.cutRequiredDate)}</td>
                      <td className="td-cell text-slate-500 dark:text-slate-400" rowSpan={solutions.length}>
                        {project.commitedDate ? (
                          <span className="text-[11px] font-bold text-green-600 dark:text-green-400">✓ {project.commitedDate}</span>
                        ) : <span className="text-[10px] text-slate-400">-</span>}
                      </td>
                      <td className="td-cell text-slate-500 dark:text-slate-400" rowSpan={solutions.length}>
                        {project.cutReceivedDate ? (
                          <span className="text-[11px] font-bold text-green-600 dark:text-green-400">✓ {project.cutReceivedDate}</span>
                        ) : <span className="text-[10px] text-slate-400">-</span>}
                      </td>
                      <td className="td-cell text-slate-500 dark:text-slate-400" rowSpan={solutions.length}>
                        {project.cutActuals?.handover ? (
                          (() => {
                            const actualDate = new Date(project.cutActuals.handover);
                            const planDate = project.cutHandoverDate ? new Date(project.cutHandoverDate) : null;
                            let colorClass = 'text-green-600 dark:text-green-400';
                            
                            if (planDate && actualDate > planDate) {
                              const diffDays = Math.ceil((actualDate.getTime() - planDate.getTime()) / (1000 * 60 * 60 * 24));
                              colorClass = diffDays <= 3 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
                            }
                            
                            return <span className={`text-[11px] font-bold ${colorClass}`}>✓ {project.cutActuals.handover}</span>;
                          })()
                        ) : <span className="text-[10px] text-slate-400">-</span>}
                      </td>
                      <td className="td-cell text-slate-500 truncate text-[10px]" title={project.comment} rowSpan={solutions.length}>{renderEmptyField(project.comment)}</td>
                    </>
                  ) : null}

                  {/* Critical Path - Show only on first solution row - ONLY ACTUAL DATES */}
                  {solutionIndex === 0 ? (
                    <>
                      <td className="td-cell text-slate-500 dark:text-slate-400 bg-cyan-50 dark:bg-[#06b6d4]/[0.02]" rowSpan={solutions.length}>
                        {renderDateCell(project, 'cutKitCheckingActualDate', project.cutKitChecking)}
                      </td>
                      <td className="td-cell text-center text-slate-500 bg-cyan-50 dark:bg-[#06b6d4]/[0.02]" rowSpan={solutions.length}>{renderEmptyField(project.workingWeek)}</td>
                    </>
                  ) : null}

                  {/* Solution-specific dates - ONLY ACTUAL DATES */}
                  <td className="td-cell text-slate-500 dark:text-slate-400 bg-cyan-50 dark:bg-[#06b6d4]/[0.02]">
                    {solution ? (
                      <div className="flex flex-col gap-0.5">
                        {solution.entryDate && <span className="text-[10px] text-slate-400">Added: {solution.entryDate}</span>}
                        {solution.actualEndDate ? (
                          <span className="text-[11px] font-bold text-green-600 dark:text-green-400">✓ {solution.actualEndDate}</span>
                        ) : (
                          <span className="text-[10px] text-amber-500">In Progress...</span>
                        )}
                        <span className={`text-[7px] px-1 py-0.5 rounded inline-block ${solution.status === 'Done' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          solution.status === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            solution.status === 'Trial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                          {solution.status}
                        </span>
                      </div>
                    ) : (
                      // Project level brainstorming actual date
                      renderDateCell(project, 'brainstormingActualDate', project.brainstormingDate)
                    )}
                  </td>
                  <td className="td-cell text-slate-500 dark:text-slate-400 bg-cyan-50 dark:bg-[#06b6d4]/[0.02]">
                    {/* Machine Availability - Complex because per solution. Just showing status for now or simple date if project level */}
                    {solution?.actualMachineDate ? (
                      <span className="text-[11px] font-bold text-green-600 dark:text-green-400">✓ {solution.actualMachineDate}</span>
                    ) : (
                      <span className="text-[10px] text-slate-400">-</span>
                    )}
                  </td>

                  {solutionIndex === 0 ? (
                    <>
                      <td className="td-cell text-slate-500 dark:text-slate-400 bg-cyan-50 dark:bg-[#06b6d4]/[0.02]" rowSpan={solutions.length}>
                        {renderDateCell(project, 'seTrialActualDate', project.seTrialDate)}
                      </td>
                      <td className="td-cell text-emerald-600 dark:text-emerald-400 font-bold bg-cyan-50 dark:bg-[#06b6d4]/[0.02]" rowSpan={solutions.length}>
                        {renderDateCell(project, 'solutionCompletedActualDate', project.solutionCompletedDate)}
                      </td>
                      <td className="td-cell text-slate-500 dark:text-slate-400 bg-cyan-50 dark:bg-[#06b6d4]/[0.02]" rowSpan={solutions.length}>
                        {renderDateCell(project, 'mockupActualDate', project.mockupDate)}
                      </td>
                      <td className="td-cell text-slate-500 dark:text-slate-400 bg-cyan-50 dark:bg-[#06b6d4]/[0.02]" rowSpan={solutions.length}>
                        {renderDateCell(project, 'technicalValidationActualDate', project.technicalValidationDate)}
                      </td>
                    </>
                  ) : null}

                  {/* Solution-wise Video, STW, MDS, PD links - Render for EVERY solution row */}
                  <td className="td-cell text-slate-500 dark:text-slate-400 bg-cyan-50 dark:bg-[#06b6d4]/[0.02]">
                    {renderLinkCell(project, solution, 'videoLink', 'videoDate', 'Video')}
                  </td>
                  <td className="td-cell text-slate-500 dark:text-slate-400 bg-cyan-50 dark:bg-[#06b6d4]/[0.02]">
                    {renderLinkCell(project, solution, 'stwLink', 'stwDate', 'STW')}
                  </td>
                  <td className="td-cell text-slate-500 dark:text-slate-400 bg-cyan-50 dark:bg-[#06b6d4]/[0.02]">
                    {renderLinkCell(project, solution, 'mdsLink', 'mdsDate', 'MDS')}
                  </td>
                  <td className="td-cell text-slate-500 dark:text-slate-400 bg-cyan-50 dark:bg-[#06b6d4]/[0.02]">
                    {renderLinkCell(project, solution, 'pdLink', 'pdDate', 'PD')}
                  </td>

                  {solutionIndex === 0 ? (
                    <>
                      <td className="td-cell text-slate-500 dark:text-slate-400 bg-cyan-50 dark:bg-[#06b6d4]/[0.02]" rowSpan={solutions.length}>
                        {renderDateCell(project, 'sharePointActualDate', project.sharePointDate)}
                      </td>

                      {/* Handover - ONLY ACTUAL DATES */}
                      <td className="td-cell text-slate-500 dark:text-slate-400" rowSpan={solutions.length}>
                        {renderDateCell(project, 'ieShareActualDate', project.ieShareDate)}
                      </td>
                      <td className="td-cell text-slate-500 dark:text-slate-400" rowSpan={solutions.length}>
                        {renderDateCell(project, 'unlockSdhActualDate', project.unlockSdhDate)}
                      </td>
                      <td className="td-cell text-slate-500 dark:text-slate-400" rowSpan={solutions.length}>{renderEmptyField(project.smvSavings)}</td>
                      <td className="td-cell text-emerald-600 dark:text-emerald-400 font-bold" rowSpan={solutions.length}>
                        {renderDateCell(project, 'handoverVeActualDate', project.handoverVeDate)}
                      </td>
                      <td className="td-cell text-emerald-600 dark:text-emerald-400 font-bold" rowSpan={solutions.length}>
                        {renderDateCell(project, 'plantHandoverVeActualDate', project.plantHandoverVeDate)}
                      </td>
                      <td className="td-cell text-slate-500 dark:text-slate-400" rowSpan={solutions.length}>{renderEmptyField(project.routed)}</td>
                      <td className="td-cell text-slate-500 dark:text-slate-400" rowSpan={solutions.length}>
                        {renderDateCell(project, 'ingeniumAppActualDate', project.ingeniumAppUpdating)}
                      </td>

                      {/* Planning - Production Dates & Status */}
                      <td className="td-cell text-slate-500 dark:text-slate-400" rowSpan={solutions.length}>
                        {renderDateCell(project, 'fiDate', undefined)}
                      </td>
                      <td className="td-cell text-slate-500 dark:text-slate-400" rowSpan={solutions.length}>
                        {renderDateCell(project, 'ppDate', undefined)}
                      </td>
                      <td className="td-cell text-slate-500 dark:text-slate-400" rowSpan={solutions.length}>
                        {renderDateCell(project, 'psdDate', undefined)}
                      </td>
                      <td className="td-cell text-slate-500 dark:text-slate-400" rowSpan={solutions.length}>{renderEmptyField(project.plannedStartDate)}</td>
                      <td className="td-cell text-slate-500 dark:text-slate-400" rowSpan={solutions.length}>
                        {renderDateCell(project, 'actualStartDate', project.plannedStartDate)}
                      </td>
                      <td className="td-cell text-red-500 dark:text-red-400 text-[10px]" rowSpan={solutions.length}>{project.commentsOnStartDelay || '-'}</td>
                      <td className="td-cell text-slate-500 dark:text-slate-400" rowSpan={solutions.length}>{renderEmptyField(project.plannedCompleteDate)}</td>
                      <td className="td-cell text-slate-500 dark:text-slate-400" rowSpan={solutions.length}>
                        {renderDateCell(project, 'actualCompleteDate', project.plannedCompleteDate)}
                      </td>
                      <td className="td-cell text-red-500 dark:text-red-400 text-[10px]" rowSpan={solutions.length}>{project.commentsOnCompletionDelay || '-'}</td>
                      <td className="td-cell font-bold text-slate-800 dark:text-white" rowSpan={solutions.length}>{project.status}</td>
                      <td className="td-cell text-red-500 dark:text-red-400 truncate text-[10px]" title={project.reasonForDrop} rowSpan={solutions.length}>{project.reasonForDrop || '-'}</td>

                      <td className="td-cell text-right sticky right-0 bg-white dark:bg-[#0F172A] z-10 group-hover:bg-white dark:group-hover:bg-[#0F172A] flex gap-1 justify-end" rowSpan={solutions.length}>
                        <button
                          onClick={() => onDelete(project.id)}
                          className="p-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 hover:border-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-red-400 hover:text-red-600 transition-all shadow-md"
                          title="Delete Record"
                        >
                          <Trash2 size={12} />
                        </button>
                        <button
                          onClick={() => onEdit(project)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-600 rounded-lg text-slate-500 dark:text-slate-500 hover:text-white transition-all shadow-md"
                        >
                          <Edit2 size={12} />
                        </button>
                      </td>
                    </>
                  ) : null}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
      <style>{`
        .th-cell { padding: 8px 12px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-size: 8px; }
        .td-cell { padding: 6px 12px; white-space: nowrap; }
      `}</style>
    </div>
  );
};
