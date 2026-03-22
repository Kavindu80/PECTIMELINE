import React, { useState } from 'react';
import { Project, BrainstormSolution, StageDates } from '../types';
import { 
  Lightbulb, Wrench, Package, FileCheck, Plus, 
  CheckCircle2, Trash2, Clock 
} from 'lucide-react';

interface StageManagerProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  currentUserEmail?: string;
}

const STAGE_FLOW = [
  { 
    id: 'brainstorm', 
    label: 'Brainstorm', 
    icon: Lightbulb, 
    color: 'yellow',
    description: 'Generate and develop solution ideas'
  },
  { 
    id: 'trial', 
    label: 'Machine Trial', 
    icon: Wrench, 
    color: 'blue',
    description: 'Test solutions on actual machines'
  },
  { 
    id: 'mockup', 
    label: 'Mockup', 
    icon: Package, 
    color: 'purple',
    description: 'Create physical samples and prototypes'
  },
  { 
    id: 'valid', 
    label: 'Validation', 
    icon: FileCheck, 
    color: 'green',
    description: 'Validate and approve final solutions'
  }
];

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
  stageTracking: {}
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
  const months: Record<string, number> = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
  const month = months[monthStr];
  if (month === undefined) return null;
  return new Date(2000 + parseInt(year), month, parseInt(day));
};

const getWorkingDaysCount = (startStr: string, actualStr: string): number | null => {
  const startDate = parseDate(startStr);
  const actualDate = parseDate(actualStr);
  if (!startDate || !actualDate) return null;
  if (actualDate < startDate) return 0;

  let count = 0;
  const cur = new Date(startDate.getTime());
  while (cur <= actualDate) {
    const dayOfWeek = cur.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

export const StageManager: React.FC<StageManagerProps> = ({ 
  project, 
  onUpdateProject
}) => {
  const [activeStage, setActiveStage] = useState<string>('brainstorm');
  const [editingField, setEditingField] = useState<{ solId: string; field: string; stage: string } | null>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [showAddSolution, setShowAddSolution] = useState(false);
  const [newSolution, setNewSolution] = useState<BrainstormSolution>({ ...EMPTY_SOLUTION });

  const solutions = project.solutions || [];

  const handleAddSolution = () => {
    if (!newSolution.solutionText.trim()) return;
    
    const solution: BrainstormSolution = {
      ...newSolution,
      id: `sol-${Date.now()}`,
      entryDate: formatToday(),
      stageTracking: {
        brainstorm: {
          startDate: formatToday(),
          expectedDate: '',
          actualDate: ''
        }
      }
    };
    
    const updatedProject = {
      ...project,
      solutions: [...solutions, solution]
    };
    
    onUpdateProject(updatedProject);
    setNewSolution({ ...EMPTY_SOLUTION });
    setShowAddSolution(false);
  };

  const handleUpdateSolution = (solutionId: string, updates: Partial<BrainstormSolution>) => {
    const updatedSolutions = solutions.map(sol => 
      sol.id === solutionId ? { ...sol, ...updates } : sol
    );
    
    onUpdateProject({ ...project, solutions: updatedSolutions });
  };

  const handleStageProgress = (solutionId: string, stage: string, action: 'start' | 'complete') => {
    const solution = solutions.find(s => s.id === solutionId);
    if (!solution) return;

    console.group(`🔍 STAGE PROGRESS: ${stage} - ${action}`);
    console.log('Solution ID:', solutionId);
    console.log('Active Stage:', activeStage);
    console.log('Target Stage:', stage);
    console.log('BEFORE - Full stageTracking:', JSON.parse(JSON.stringify(solution.stageTracking || {})));

    const currentTracking = solution.stageTracking || {};
    
    // CRITICAL FIX: Always create a new object to avoid mutation
    const existingStageTracking = currentTracking[stage] || { startDate: '', expectedDate: '', actualDate: '' };
    const stageTracking = { ...existingStageTracking }; // Create a copy to avoid mutation

    if (action === 'start') {
      stageTracking.startDate = formatToday();
      stageTracking.status = 'In Progress';
    } else if (action === 'complete') {
      stageTracking.actualDate = formatToday();
      stageTracking.status = 'Done';
      // Removed auto-progress to next stage - each stage should be updated manually by user preference
    }

    const updatedTracking = {
      ...currentTracking,
      [stage]: stageTracking
    };
    
    console.log('AFTER - Full stageTracking:', JSON.parse(JSON.stringify(updatedTracking)));
    console.log('Changed stage only:', stage, stageTracking);
    console.log('Other stages unchanged:', Object.keys(updatedTracking).filter(k => k !== stage));
    console.groupEnd();

    handleUpdateSolution(solutionId, { stageTracking: updatedTracking });
  };

  const handleDeleteSolution = (solutionId: string) => {
    if (window.confirm('Are you sure you want to delete this solution?')) {
      const updatedSolutions = solutions.filter(s => s.id !== solutionId);
      onUpdateProject({ ...project, solutions: updatedSolutions });
    }
  };

  const handleSaveField = (solutionId: string, field: string, stage: string) => {
    if ((field.includes('Date') || field === 'comments') && stage !== 'general') {
      // Update stage tracking
      const solution = solutions.find(s => s.id === solutionId);
      if (solution) {
        const currentTracking = solution.stageTracking || {};
        // CRITICAL FIX: Always create a new object to avoid mutation
        const existingStageTracking = currentTracking[stage] || { startDate: '', expectedDate: '', actualDate: '' };
        const stageTracking = { ...existingStageTracking }; // Create a copy to avoid mutation
        
        if (field === 'startDate') stageTracking.startDate = fieldValue;
        if (field === 'expectedDate') stageTracking.expectedDate = fieldValue;
        if (field === 'actualDate') stageTracking.actualDate = fieldValue;
        if (field === 'comments') stageTracking.comments = fieldValue;
        if (field === 'status') {
          stageTracking.status = fieldValue as any;
          if (fieldValue === 'Done' && !stageTracking.actualDate) {
            stageTracking.actualDate = formatToday();
          } else if (fieldValue === 'Pending') {
            stageTracking.actualDate = '';
          }
        }
        
        const updatedTracking = {
          ...currentTracking,
          [stage]: stageTracking
        };
        
        handleUpdateSolution(solutionId, { stageTracking: updatedTracking });
      }
    } else {
      // Update general solution field
      const updates: any = { [field]: fieldValue };
      
      // Auto-calculate SMV saving
      if (field === 'operationSMV' || field === 'routedSmv') {
        const solution = solutions.find(s => s.id === solutionId);
        if (solution) {
          const costed = parseFloat(field === 'operationSMV' ? fieldValue : (solution.operationSMV || '0'));
          const routed = parseFloat(field === 'routedSmv' ? fieldValue : (solution.routedSmv || '0'));
          if (!isNaN(costed) && !isNaN(routed)) {
            updates.savingSmv = (costed - routed).toFixed(2);
          }
        }
      }
      
      handleUpdateSolution(solutionId, updates);
    }
    
    setEditingField(null);
  };

  const getSolutionStageStatus = (solution: BrainstormSolution, stageId: string) => {
    const tracking = solution.stageTracking?.[stageId];
    if (!tracking) return 'not-started';
    
    // Prefer explicit status if available
    if (tracking.status) {
      if (tracking.status === 'Done') return 'completed';
      if (tracking.status === 'In Progress' || tracking.status === 'Trial') return 'in-progress';
      if (tracking.status === 'Drop') return 'dropped';
      return 'not-started';
    }

    if (tracking.actualDate) return 'completed';
    if (tracking.startDate) return 'in-progress';
    return 'not-started';
  };

  const getStageColor = (color: string) => {
    const colors = {
      yellow: 'bg-yellow-500 text-white',
      blue: 'bg-blue-500 text-white',
      purple: 'bg-purple-500 text-white',
      green: 'bg-green-500 text-white'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const renderEditableField = (
    solution: BrainstormSolution, 
    field: string, 
    stage: string = 'general',
    placeholder: string = '',
    multiline: boolean = false
  ) => {
    const isEditing = editingField?.solId === solution.id && 
                     editingField?.field === field && 
                     editingField?.stage === stage;
    
    let value: string = '';
    if (stage !== 'general' && (field.includes('Date') || field === 'comments')) {
      const trackingValue = solution.stageTracking?.[stage]?.[field as keyof StageDates];
      value = trackingValue !== undefined ? String(trackingValue) : '';
    } else {
      value = String((solution as any)[field] || '');
    }

    if (isEditing) {
      if (multiline) {
        return (
          <textarea
            autoFocus
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            onBlur={() => handleSaveField(solution.id, field, stage)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setEditingField(null);
              // Ctrl+Enter or Cmd+Enter to save
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                handleSaveField(solution.id, field, stage);
              }
            }}
            className="w-full text-[10px] bg-white dark:bg-slate-800 border border-cyan-400 rounded px-2 py-1 outline-none resize-y min-h-[60px]"
            placeholder={placeholder}
          />
        );
      }
      
      return (
        <input
          type="text"
          autoFocus
          value={fieldValue}
          onChange={(e) => setFieldValue(e.target.value)}
          onBlur={() => handleSaveField(solution.id, field, stage)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveField(solution.id, field, stage);
            if (e.key === 'Escape') setEditingField(null);
          }}
          className="w-full text-[10px] bg-white dark:bg-slate-800 border border-cyan-400 rounded px-2 py-1 outline-none"
          placeholder={placeholder}
        />
      );
    }

    return (
      <div
        onClick={() => {
          setEditingField({ solId: solution.id, field, stage });
          setFieldValue(value);
        }}
        className={`text-[10px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-2 py-1 -mx-2 -my-1 transition-colors ${
          multiline ? 'min-h-[60px]' : 'min-h-[24px]'
        } flex items-center`}
      >
        {value || '-'}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Stage Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {STAGE_FLOW.map((stage) => {
          const completedSolutions = solutions.filter(s => 
            getSolutionStageStatus(s, stage.id) === 'completed'
          ).length;
          const totalSolutions = solutions.length;
          
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`flex-1 px-4 py-3 text-center transition-all ${
                activeStage === stage.id
                  ? `${getStageColor(stage.color)} shadow-lg`
                  : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <stage.icon size={16} />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {stage.label}
                </span>
              </div>
              <div className="text-[8px] opacity-80">
                {completedSolutions}/{totalSolutions} Complete
              </div>
            </button>
          );
        })}
      </div>

      {/* Stage Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
              {STAGE_FLOW.find(s => s.id === activeStage)?.label} Stage
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {STAGE_FLOW.find(s => s.id === activeStage)?.description}
            </p>
          </div>
          
          {activeStage === 'brainstorm' && (
            <button
              onClick={() => setShowAddSolution(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all"
            >
              <Plus size={14} /> Add Solution
            </button>
          )}
        </div>

        {/* Add Solution Form */}
        {showAddSolution && activeStage === 'brainstorm' && (
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="text-[12px] font-bold text-cyan-600 dark:text-cyan-400 mb-4">
              New Solution
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Solution Description *
                </label>
                <input
                  value={newSolution.solutionText}
                  onChange={(e) => setNewSolution(prev => ({ ...prev, solutionText: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-800 dark:text-white focus:border-cyan-500 outline-none"
                  placeholder="Describe the solution approach..."
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Operation
                </label>
                <input
                  value={newSolution.operation}
                  onChange={(e) => setNewSolution(prev => ({ ...prev, operation: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-800 dark:text-white focus:border-cyan-500 outline-none"
                  placeholder="Operation name..."
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Machine Code
                </label>
                <input
                  value={newSolution.machineCode}
                  onChange={(e) => setNewSolution(prev => ({ ...prev, machineCode: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-800 dark:text-white focus:border-cyan-500 outline-none"
                  placeholder="e.g. SND, OVL..."
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Responsible Person
                </label>
                <input
                  value={newSolution.responsible}
                  onChange={(e) => setNewSolution(prev => ({ ...prev, responsible: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-800 dark:text-white focus:border-cyan-500 outline-none"
                  placeholder="Assigned person..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddSolution(false);
                  setNewSolution({ ...EMPTY_SOLUTION });
                }}
                className="px-4 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSolution}
                disabled={!newSolution.solutionText.trim()}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all"
              >
                Add Solution
              </button>
            </div>
          </div>
        )}

        {/* Solutions List */}
        {solutions.length > 0 ? (
          <div className="space-y-4">
            {solutions.map((solution) => {
              const stageStatus = getSolutionStageStatus(solution, activeStage);
              
              return (
                <div
                  key={solution.id}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  {/* Solution Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1">
                          <span className="text-[9px] text-slate-500 font-medium block mb-1">Solution Description:</span>
                          {renderEditableField(solution, 'solutionText', 'general', 'Solution description...', true)}
                        </div>
                        <span className={`px-2 py-1 rounded text-[8px] font-bold uppercase ${
                          stageStatus === 'completed' ? 'bg-green-100 text-green-800' :
                          stageStatus === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {stageStatus.replace('-', ' ')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px]">
                        <div>
                          <span className="text-slate-500 font-medium">Operation:</span>
                          {renderEditableField(solution, 'operation', 'general', 'Operation name')}
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Machine:</span>
                          {renderEditableField(solution, 'machineCode', 'general', 'Machine code')}
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Costed SMV:</span>
                          {renderEditableField(solution, 'operationSMV', 'general', '0.00')}
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Responsible:</span>
                          {renderEditableField(solution, 'responsible', 'general', 'Person name')}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteSolution(solution.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Stage-Specific Content */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                    {/* Common Editable Fields - Available in ALL stages */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block mb-1">Team:</span>
                        {renderEditableField(solution, 'team', 'general', 'Team name')}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block mb-1">Expected SMV:</span>
                        {renderEditableField(solution, 'expectedSmv', 'general', '0.00')}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block mb-1">Routed SMV:</span>
                        {renderEditableField(solution, 'routedSmv', 'general', '0.00')}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block mb-1">SMV Saving:</span>
                        <div className="text-[10px] font-bold text-green-600 dark:text-green-400 px-2 py-1">
                          {solution.savingSmv || '0.00'}
                        </div>
                      </div>
                    </div>

                    {/* Additional Editable Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block mb-1">Actual SMV:</span>
                        {renderEditableField(solution, 'actualSmv', 'general', '0.00')}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block mb-1">Status:</span>
                        {renderEditableField(solution, 'status', 'general', 'Pending')}
                      </div>
                    </div>

                    {/* Comments - Full Width */}
                    <div className="mb-4">
                      <span className="text-[10px] text-slate-500 font-medium block mb-1">Comments:</span>
                      {renderEditableField(solution, 'comments', activeStage, 'Add comments...', true)}
                    </div>

                    {/* Stage-Specific Additional Fields */}
                    {activeStage === 'trial' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-[10px] text-slate-500 font-medium block mb-1">Actual Machine Date:</span>
                          {renderEditableField(solution, 'actualMachineDate', 'general', 'DD-MMM-YY')}
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-medium block mb-1">Video Link:</span>
                          {renderEditableField(solution, 'videoLink', 'general', 'https://...')}
                        </div>
                      </div>
                    )}

                    {activeStage === 'valid' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-[10px] text-slate-500 font-medium block mb-1">STW Date:</span>
                          {renderEditableField(solution, 'stwDate', 'general', 'DD-MMM-YY')}
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-medium block mb-1">MDS Date:</span>
                          {renderEditableField(solution, 'mdsDate', 'general', 'DD-MMM-YY')}
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-medium block mb-1">PD Date:</span>
                          {renderEditableField(solution, 'pdDate', 'general', 'DD-MMM-YY')}
                        </div>
                      </div>
                    )}

                    {/* Stage Progress Controls */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="grid grid-cols-3 gap-4 flex-1">
                        <div>
                          <span className="text-[10px] text-slate-500 font-medium block mb-1">Start Date:</span>
                          {renderEditableField(solution, 'startDate', activeStage, 'DD-MMM-YY')}
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-medium block mb-1">Expected Date:</span>
                          {renderEditableField(solution, 'expectedDate', activeStage, 'DD-MMM-YY')}
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-medium block mb-1">Actual Date:</span>
                          {renderEditableField(solution, 'actualDate', activeStage, 'DD-MMM-YY')}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        {stageStatus === 'not-started' && (
                          <button
                            onClick={() => handleStageProgress(solution.id, activeStage, 'start')}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-all"
                          >
                            Start
                          </button>
                        )}
                        
                        {stageStatus === 'in-progress' && (
                          <button
                            onClick={() => handleStageProgress(solution.id, activeStage, 'complete')}
                            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-all"
                          >
                            Complete
                          </button>
                        )}
                        
                        {stageStatus === 'completed' && (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded text-[10px] font-bold">
                              <CheckCircle2 size={12} />
                              Completed
                            </div>
                            {(solution.stageTracking?.[activeStage]?.startDate || solution.entryDate) && solution.stageTracking?.[activeStage]?.actualDate && (
                              <div className="text-[9px] font-bold text-green-600 flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                                <Clock size={10} /> {getWorkingDaysCount(solution.stageTracking[activeStage].startDate || solution.entryDate, solution.stageTracking[activeStage].actualDate)} Days Taken
                              </div>
                            )}
                          </div>
                        )}
                        {stageStatus === 'in-progress' && (solution.stageTracking?.[activeStage]?.startDate || solution.entryDate) && (
                          <div className="text-[9px] font-bold text-cyan-600 flex items-center gap-1 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">
                            <Clock size={10} /> {getWorkingDaysCount(solution.stageTracking[activeStage].startDate || solution.entryDate, formatToday())} Days Active
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Lightbulb size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-[12px] font-medium">No solutions added yet</p>
            <p className="text-[10px] opacity-75">Click "Add Solution" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};