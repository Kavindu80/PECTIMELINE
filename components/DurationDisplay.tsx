import React, { useState } from 'react';
import { 
  Clock, Calendar, AlertTriangle, CheckCircle2, 
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  Target, Zap, AlertCircle
} from 'lucide-react';
import { 
  calculateProjectDuration, 
  getDurationStatusColor, 
  getStageStatusColor,
  ProjectDurationSummary,
  StageDuration 
} from '../utils/durationCalculator';
import { Project } from '../types';

interface DurationDisplayProps {
  project: Project;
  compact?: boolean;
}

export const DurationDisplay: React.FC<DurationDisplayProps> = ({ 
  project, 
  compact = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const duration = calculateProjectDuration(project);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* Compact Duration Badge */}
        <div className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider ${getDurationStatusColor(duration.overallStatus)}`}>
          <div className="flex items-center gap-1">
            <Clock size={10} />
            <span>{duration.totalActualDuration || duration.totalPlannedDuration} Days</span>
            {duration.daysLate > 0 && (
              <span className="text-red-500">+{duration.daysLate}</span>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-1">
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                duration.overallStatus === 'delayed' ? 'bg-red-500' :
                duration.overallStatus === 'at-risk' ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min((duration.completedStages / duration.totalStages) * 100, 100)}%` }}
            />
          </div>
          <span className="text-[8px] font-bold text-slate-500">
            {duration.completedStages}/{duration.totalStages}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div 
        className="px-4 py-3 pr-10 sm:pr-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-cyan-500 shrink-0" />
              <h3 className="text-[11px] font-black text-slate-700 dark:text-white uppercase tracking-wider">
                Development Duration
              </h3>
            </div>
            
            {/* Status Badge */}
            <div className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider whitespace-nowrap ${getDurationStatusColor(duration.overallStatus)}`}>
              {duration.overallStatus.replace('-', ' ')}
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            {/* Summary Stats */}
            <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:ml-auto">
              <div className="text-center">
                <div className="text-slate-500 font-medium whitespace-nowrap">Total Days</div>
                <div className="font-bold text-slate-800 dark:text-white">
                  {duration.totalActualDuration || duration.totalPlannedDuration}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-slate-500 font-medium">Progress</div>
                <div className="font-bold text-cyan-600 dark:text-cyan-400">
                  {Math.round((duration.completedStages / duration.totalStages) * 100)}%
                </div>
              </div>
              
              {duration.daysLate !== 0 && (
                <div className="text-center hidden sm:block">
                  <div className="text-slate-500 font-medium">Variance</div>
                  <div className={`font-bold flex items-center justify-center gap-1 ${
                    duration.daysLate > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  }`}>
                    {duration.daysLate > 0 ? (
                      <TrendingUp size={10} />
                    ) : duration.daysLate < 0 ? (
                      <TrendingDown size={10} />
                    ) : (
                      <Minus size={10} />
                    )}
                    {Math.abs(duration.daysLate)} days
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                duration.overallStatus === 'delayed' ? 'bg-red-500' :
                duration.overallStatus === 'at-risk' ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min((duration.completedStages / duration.totalStages) * 100, 100)}%` }}
            />
          </div>
          <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 min-w-[40px]">
            {duration.completedStages}/{duration.totalStages}
          </span>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Critical Path Alert */}
          {duration.criticalPath.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-red-500" />
                <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider">
                  Critical Path Issues
                </span>
              </div>
              <p className="text-[9px] text-red-600 dark:text-red-400">
                The following stages are causing delays: {duration.criticalPath.map(stageId => 
                  duration.stageDurations.find(s => s.stageId === stageId)?.stageName
                ).join(', ')}
              </p>
            </div>
          )}

          {/* Stage Timeline */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Target size={14} className="text-slate-500" />
              <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Stage Timeline (Business Days Only)
              </span>
            </div>

            {duration.stageDurations.map((stage, index) => (
              <div key={stage.stageId} className="relative">
                {/* Connection Line */}
                {index < duration.stageDurations.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-6 bg-slate-200 dark:bg-slate-700" />
                )}

                <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  {/* Stage Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    stage.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20 border-green-500 text-green-600 dark:text-green-400' :
                    stage.status === 'overdue' ? 'bg-red-100 dark:bg-red-900/20 border-red-500 text-red-600 dark:text-red-400' :
                    stage.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400' :
                    'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400'
                  }`}>
                    {stage.status === 'completed' ? (
                      <CheckCircle2 size={14} />
                    ) : stage.status === 'overdue' ? (
                      <AlertCircle size={14} />
                    ) : stage.status === 'in-progress' ? (
                      <Zap size={14} />
                    ) : (
                      <Clock size={14} />
                    )}
                  </div>

                  {/* Stage Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-[10px] font-bold text-slate-800 dark:text-white">
                        {stage.stageName}
                      </h4>
                      <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${getStageStatusColor(stage.status)}`}>
                        {stage.status.replace('-', ' ')}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-[9px]">
                      <div>
                        <span className="text-slate-500 font-medium">Planned:</span>
                        <div className="font-bold text-slate-700 dark:text-slate-300 truncate">
                          {stage.plannedDate || 'TBD'}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-slate-500 font-medium">Actual:</span>
                        <div className="font-bold text-slate-700 dark:text-slate-300 truncate">
                          {stage.actualDate || 'Pending'}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-slate-500 font-medium">Duration:</span>
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          {stage.actualDuration || stage.plannedDuration} days
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-slate-500 font-medium">Variance:</span>
                        <div className={`font-bold ${
                          stage.isLate ? 'text-red-600 dark:text-red-400' : 
                          stage.daysLate < 0 ? 'text-green-600 dark:text-green-400' : 
                          'text-slate-500'
                        }`}>
                          {stage.daysLate === 0 ? 'On Time' : 
                           stage.daysLate > 0 ? `+${stage.daysLate} days` : 
                           `${stage.daysLate} days`}
                        </div>
                      </div>
                    </div>

                    {/* Late Warning */}
                    {stage.isLate && (
                      <div className="mt-2 flex items-center gap-1 text-[8px] text-red-600 dark:text-red-400">
                        <AlertTriangle size={10} />
                        <span>This stage is {stage.daysLate} business day{stage.daysLate > 1 ? 's' : ''} behind schedule</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Footer */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-[9px]">
              <div className="text-center">
                <div className="text-slate-500 font-medium mb-1">Planned Duration</div>
                <div className="text-[11px] font-bold text-slate-800 dark:text-white">
                  {duration.totalPlannedDuration} business days
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-slate-500 font-medium mb-1">Actual Duration</div>
                <div className="text-[11px] font-bold text-slate-800 dark:text-white">
                  {duration.totalActualDuration} business days
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-slate-500 font-medium mb-1">Completion Rate</div>
                <div className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
                  {Math.round((duration.completedStages / duration.totalStages) * 100)}%
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-slate-500 font-medium mb-1">Overall Status</div>
                <div className={`text-[11px] font-bold ${
                  duration.overallStatus === 'delayed' ? 'text-red-600 dark:text-red-400' :
                  duration.overallStatus === 'at-risk' ? 'text-amber-600 dark:text-amber-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {duration.overallStatus.replace('-', ' ').toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};