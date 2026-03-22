// Development Duration Calculator
// Calculates business days (excluding weekends) and tracks stage-wise progress

export interface StageDuration {
  stageId: string;
  stageName: string;
  plannedDate: string;
  actualDate: string;
  plannedDuration: number; // Business days from start
  actualDuration: number; // Business days from start
  isLate: boolean;
  daysLate: number; // Positive if late, negative if early
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue';
}

export interface ProjectDurationSummary {
  totalPlannedDuration: number; // Total business days planned
  totalActualDuration: number; // Total business days actual (so far)
  completedStages: number;
  totalStages: number;
  overallStatus: 'on-track' | 'at-risk' | 'delayed';
  daysLate: number; // Overall project delay in business days
  stageDurations: StageDuration[];
  criticalPath: string[]; // Stage IDs that are causing delays
}

// Parse DD-MMM-YY format to Date
export const parseDisplayDate = (dateStr: string): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  
  const [day, monthStr, year] = parts;
  const monthMap: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  
  const month = monthMap[monthStr];
  if (month === undefined) return null;
  
  const fullYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year);
  return new Date(fullYear, month, parseInt(day));
};

// Calculate business days between two dates (excluding weekends)
export const calculateBusinessDays = (startDate: Date, endDate: Date): number => {
  if (startDate > endDate) return 0;
  
  let businessDays = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return businessDays;
};

// Add business days to a date (excluding weekends)
export const addBusinessDays = (startDate: Date, businessDays: number): Date => {
  const result = new Date(startDate);
  let daysAdded = 0;
  
  while (daysAdded < businessDays) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    // Skip weekends
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }
  
  return result;
};

// Format date to DD-MMM-YY
export const formatToDisplayDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
};

// Stage definitions for duration calculation
export const DURATION_STAGES = [
  { id: 'cut_check', name: 'Cut Kit Check', plannedDurationDays: 2 },
  { id: 'mach_avail', name: 'Machine Availability', plannedDurationDays: 1 },
  { id: 'brainstorm', name: 'Brainstorming', plannedDurationDays: 3 },
  { id: 'trial', name: 'Machine Trial', plannedDurationDays: 2 },
  { id: 'mockup', name: 'Mockup', plannedDurationDays: 1 },
  { id: 'valid', name: 'Technical Validation', plannedDurationDays: 1 },
  { id: 'video', name: 'Video Recording', plannedDurationDays: 1 },
  { id: 'stw', name: 'STW Documentation', plannedDurationDays: 1 },
  { id: 'mds', name: 'MDS Creation', plannedDurationDays: 1 },
  { id: 'pd', name: 'Program Drawing', plannedDurationDays: 1 },
  { id: 'share', name: 'SE Signoff', plannedDurationDays: 1 }
];

// Calculate project duration summary
export const calculateProjectDuration = (project: any): ProjectDurationSummary => {
  const startDate = parseDisplayDate(project.styleInDate) || parseDisplayDate(project.entryDate);
  if (!startDate) {
    // Try to find the earliest solution's entryDate as a final fallback
    const solutions = project.solutions || [];
    if (solutions.length > 0) {
      const dates = solutions
        .map((s: any) => parseDisplayDate(s.entryDate))
        .filter(Boolean)
        .sort((a: any, b: any) => a.getTime() - b.getTime());
      
      if (dates.length > 0) {
        // Use earliest date
        const earliest = dates[0];
        return calculateWithStartDate(earliest, project);
      }
    }

    return {
      totalPlannedDuration: 0,
      totalActualDuration: 0,
      completedStages: 0,
      totalStages: DURATION_STAGES.length,
      overallStatus: 'on-track' as const,
      daysLate: 0,
      stageDurations: [],
      criticalPath: []
    };
  }

  return calculateWithStartDate(startDate, project);
};

// Extracted internal logic to allow fallback recursion or direct call
const calculateWithStartDate = (startDate: Date, project: any): ProjectDurationSummary => {

  const stageDurations: StageDuration[] = [];
  let cumulativePlannedDays = 0;
  let completedStages = 0;
  let totalActualDuration = 0;
  const criticalPath: string[] = [];
  
  for (const stage of DURATION_STAGES) {
    // Get planned and actual dates for this stage
    const plannedDate = getStageDate(project, stage.id, 'planned');
    const actualDate = getStageDate(project, stage.id, 'actual');
    
    // Calculate planned duration from start
    const plannedDuration = cumulativePlannedDays + stage.plannedDurationDays;
    
    // Calculate actual duration if completed
    let actualDuration = 0;
    let isCompleted = false;
    let status: StageDuration['status'] = 'not-started';
    
    if (actualDate) {
      const actualDateObj = parseDisplayDate(actualDate);
      if (actualDateObj) {
        actualDuration = calculateBusinessDays(startDate, actualDateObj);
        isCompleted = true;
        completedStages++;
        status = 'completed';
        totalActualDuration = Math.max(totalActualDuration, actualDuration);
      }
    } else if (plannedDate) {
      // Check if we're past the planned date
      const plannedDateObj = parseDisplayDate(plannedDate);
      const today = new Date();
      if (plannedDateObj && today > plannedDateObj) {
        status = 'overdue';
      } else {
        status = 'in-progress';
      }
    }
    
    // Calculate if late and by how much
    let isLate = false;
    let daysLate = 0;
    
    if (isCompleted && plannedDate) {
      const plannedDateObj = parseDisplayDate(plannedDate);
      const actualDateObj = parseDisplayDate(actualDate!);
      if (plannedDateObj && actualDateObj) {
        daysLate = calculateBusinessDays(plannedDateObj, actualDateObj);
        isLate = daysLate > 0;
        if (isLate) {
          criticalPath.push(stage.id);
        }
      }
    }
    
    stageDurations.push({
      stageId: stage.id,
      stageName: stage.name,
      plannedDate: plannedDate || '',
      actualDate: actualDate || '',
      plannedDuration,
      actualDuration,
      isLate,
      daysLate,
      status
    });
    
    cumulativePlannedDays = plannedDuration;
  }
  
  // Calculate overall status
  const totalPlannedDuration = cumulativePlannedDays;
  const overallDaysLate = totalActualDuration - totalPlannedDuration;
  
  let overallStatus: ProjectDurationSummary['overallStatus'] = 'on-track';
  if (overallDaysLate > 5) {
    overallStatus = 'delayed';
  } else if (overallDaysLate > 2 || criticalPath.length > 0) {
    overallStatus = 'at-risk';
  }
  
  return {
    totalPlannedDuration,
    totalActualDuration,
    completedStages,
    totalStages: DURATION_STAGES.length,
    overallStatus,
    daysLate: overallDaysLate,
    stageDurations,
    criticalPath
  };
};

// Helper function to get stage date (planned or actual)
export const getStageDate = (project: any, stageId: string, type: 'planned' | 'actual'): string => {
  switch (stageId) {
    case 'cut_check':
      if (type === 'actual') {
        const actuals = project.cutActuals || {};
        return actuals.handover || actuals.received || '';
      }
      return project.cutHandoverDate || project.cutReceivedDate || '';
      
    case 'mach_avail':
      if (type === 'actual') {
        const solutions = project.solutions || [];
        const withActuals = solutions.filter((s: any) => s.actualMachineDate);
        if (withActuals.length > 0) {
          return withActuals.sort((a: any, b: any) => {
            const d1 = parseDisplayDate(a.actualMachineDate)?.getTime() || 0;
            const d2 = parseDisplayDate(b.actualMachineDate)?.getTime() || 0;
            return d2 - d1;
          })[0].actualMachineDate;
        }
        return '';
      }
      return project.machineAvailabilityDate || '';
      
    case 'brainstorm':
      if (type === 'actual') {
        const solutions = project.solutions || [];
        // Count as actual if date is present, regardless of status (matching ProjectTimeline)
        const withActuals = solutions.filter((s: any) => 
          s.stageTracking?.brainstorm?.actualDate || s.actualEndDate
        );
        if (withActuals.length > 0) {
          return withActuals.sort((a: any, b: any) => {
            const dateA = a.stageTracking?.brainstorm?.actualDate || a.actualEndDate;
            const dateB = b.stageTracking?.brainstorm?.actualDate || b.actualEndDate;
            const d1 = parseDisplayDate(dateA)?.getTime() || 0;
            const d2 = parseDisplayDate(dateB)?.getTime() || 0;
            return d2 - d1;
          })[0].stageTracking?.brainstorm?.actualDate || withActuals[0].actualEndDate;
        }
        return '';
      }
      return project.brainstormingDate || '';
      
    case 'trial':
      if (type === 'actual') {
        const solutions = project.solutions || [];
        const withActuals = solutions.filter((s: any) => 
          s.stageTracking?.trial?.actualDate
        );
        if (withActuals.length > 0) {
          return withActuals.sort((a: any, b: any) => {
            const d1 = parseDisplayDate(a.stageTracking?.trial?.actualDate)?.getTime() || 0;
            const d2 = parseDisplayDate(b.stageTracking?.trial?.actualDate)?.getTime() || 0;
            return d2 - d1;
          })[0].stageTracking.trial.actualDate;
        }
        return '';
      }
      return project.seTrialDate || '';
    
    case 'mockup':
      if (type === 'actual') {
        const solutions = project.solutions || [];
        const withActuals = solutions.filter((s: any) => 
          s.stageTracking?.mockup?.actualDate
        );
        if (withActuals.length > 0) {
          return withActuals.sort((a: any, b: any) => {
            const d1 = parseDisplayDate(a.stageTracking?.mockup?.actualDate)?.getTime() || 0;
            const d2 = parseDisplayDate(b.stageTracking?.mockup?.actualDate)?.getTime() || 0;
            return d2 - d1;
          })[0].stageTracking.mockup.actualDate;
        }
        return '';
      }
      return project.mockupDate || '';
      
    case 'valid':
      if (type === 'actual') {
        const solutions = project.solutions || [];
        const withActuals = solutions.filter((s: any) => 
          s.stageTracking?.valid?.actualDate
        );
        if (withActuals.length > 0) {
          return withActuals.sort((a: any, b: any) => {
            const d1 = parseDisplayDate(a.stageTracking.valid.actualDate)?.getTime() || 0;
            const d2 = parseDisplayDate(b.stageTracking.valid.actualDate)?.getTime() || 0;
            return d2 - d1;
          })[0].stageTracking.valid.actualDate;
        }
        return '';
      }
      return project.technicalValidationDate || '';
      
    case 'video':
      if (type === 'actual') {
        const solutions = project.solutions || [];
        const withActuals = solutions.filter((s: any) => 
          s.stageTracking?.video?.actualDate
        );
        if (withActuals.length > 0) {
          return withActuals.sort((a: any, b: any) => {
            const d1 = parseDisplayDate(a.stageTracking.video.actualDate)?.getTime() || 0;
            const d2 = parseDisplayDate(b.stageTracking.video.actualDate)?.getTime() || 0;
            return d2 - d1;
          })[0].stageTracking.video.actualDate;
        }
        return '';
      }
      return project.videoDate || '';
      
    case 'stw':
      if (type === 'actual') {
        const files = project.stageFiles || [];
        const stwFiles = files.filter((f: any) => f.stageId === 'stw' && f.actualDate);
        if (stwFiles.length > 0) {
          return stwFiles.sort((a: any, b: any) => {
            const d1 = parseDisplayDate(a.actualDate)?.getTime() || 0;
            const d2 = parseDisplayDate(b.actualDate)?.getTime() || 0;
            return d2 - d1;
          })[0].actualDate;
        }
        return '';
      }
      return project.stwDate || '';
      
    case 'mds':
      if (type === 'actual') {
        const files = project.stageFiles || [];
        const mdsFiles = files.filter((f: any) => f.stageId === 'mds' && f.actualDate);
        if (mdsFiles.length > 0) {
          return mdsFiles.sort((a: any, b: any) => {
            const d1 = parseDisplayDate(a.actualDate)?.getTime() || 0;
            const d2 = parseDisplayDate(b.actualDate)?.getTime() || 0;
            return d2 - d1;
          })[0].actualDate;
        }
        return '';
      }
      return project.mdsDate || '';
      
    case 'pd':
      if (type === 'actual') {
        const files = project.stageFiles || [];
        const pdFiles = files.filter((f: any) => f.stageId === 'pd' && f.actualDate);
        if (pdFiles.length > 0) {
          return pdFiles.sort((a: any, b: any) => {
            const d1 = parseDisplayDate(a.actualDate)?.getTime() || 0;
            const d2 = parseDisplayDate(b.actualDate)?.getTime() || 0;
            return d2 - d1;
          })[0].actualDate;
        }
        return '';
      }
      return project.pdDate || '';
      
    case 'share':
      if (type === 'actual') {
        return project.seSignoffDate || '';
      }
      return project.sharePointDate || '';
      
    default:
      return '';
  }
};

// Get duration status color
export const getDurationStatusColor = (status: ProjectDurationSummary['overallStatus']): string => {
  switch (status) {
    case 'on-track':
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    case 'at-risk':
      return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
    case 'delayed':
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    default:
      return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20';
  }
};

// Get stage status color
export const getStageStatusColor = (status: StageDuration['status']): string => {
  switch (status) {
    case 'completed':
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    case 'in-progress':
      return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    case 'overdue':
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    default:
      return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20';
  }
};