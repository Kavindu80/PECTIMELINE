
export type ProjectStatus = 'Summary' | 'MDS SE' | 'Unichela Panadura VE' | 'Casualine VE' | 'Long Term';

export type DeadlineStatus = 'On Track' | 'Approaching' | 'Overdue' | 'Extended';

export type SubFilterType = 'All' | 'Ongoing' | 'Completed' | 'Critical';

export interface DeadlineUpdate {
  date: string;
  reason: string;
  timestamp: string;
  updatedBy: string;
}

export interface CutKitItem {
  id: string;
  component: string;
  quantity: number;
  receivedQty: number;
  status: 'Pending' | 'Partial' | 'Complete' | 'Missing';
  notes: string;
}

export interface CutActuals {
  requested?: string;
  required?: string;
  received?: string;
  handover?: string;
  responsible?: string;
}


export interface StageFileLink {
  id: string;
  stageId: string; // 'mds' | 'pd' | 'stw' etc
  solutionId: string;
  fileName: string;
  fileUrl: string;
  fileType: 'pdf' | 'excel' | 'other';
  uploadedAt: string;
  uploadedBy?: string; // User who uploaded the document
  plannedDate?: string; // Planned completion date
  actualDate?: string; // Actual completion date
}

export interface StageDates {
  startDate: string;
  expectedDate: string;
  actualDate: string;
  status?: 'Pending' | 'In Progress' | 'Trial' | 'Done' | 'Drop';
  comments?: string;
  workingDaysCount?: number; // Days count excluding weekends
}

export interface SolutionMachine {
  id: string;
  machineType: string; // e.g. 'Lockstitch', 'Overlock'
  attachments: string; // e.g. 'Binder', 'Hemmer'
  count: number;
  kitStatus: 'Pending' | 'Ready' | 'Issue';
  remarks: string;
}

export interface BrainstormSolution {
  id: string;
  entryDate: string;
  machineCode: string; // Kept for backward compatibility or main machine code
  operationSMV: string; // Costed SMV
  actualSmv?: string; // Actual SMV
  expectedSmv?: string; // Expected SMV
  routedSmv?: string; // Routed SMV
  savingSmv?: string; // SMV Saving (auto-calculated: costed - routed)
  operation: string;
  solutionText: string;
  comments: string;
  dailyComments?: Array<{
    date: string;
    note: string;
    timestamp: string;
    stageId?: string; // Stage where the comment was added (e.g. 'brainstorm', 'trial', 'mockup')
  }>;
  team: string;
  responsible: string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate: string;
  actualMachineDate?: string; // Machine Availability Actual Date
  status: 'Pending' | 'In Progress' | 'Trial' | 'Done' | 'Drop';
  videoLink?: string;
  videoDescription?: string;
  stwLink?: string; // STW document link
  mdsLink?: string; // MDS document link
  pdLink?: string; // PD document link
  videoDate?: string; // Video upload date
  stwDate?: string; // STW upload date
  mdsDate?: string; // MDS upload date
  pdDate?: string; // PD upload date
  // VE-specific fields (only for Unichela Panadura VE and Casualine VE)
  yamazumiChartLink?: string; // Yamazumi Chart upload (PDF, Excel, Image)
  yamazumiChartDate?: string; // Upload date
  craftsmanshipLevel?: 'Level 1' | 'Level 2' | 'Level 3' | 'Level 4'; // Beginner, Medium, Skilled, Expert
  layoutLink?: string; // Layout upload (PDF, Excel, Image)
  layoutDate?: string; // Upload date
  stageTracking?: Record<string, StageDates>; // Keyed by stageId
  machines?: SolutionMachine[]; // Detailed machine requirements
}

export interface Project {
  id: string;

  // Basic Info
  inWeek: number; // Week
  styleInDate: string; // Style In Date
  no?: string; // No.
  core?: string; // Core / Not
  source?: string; // Source
  customer: string; // Customer
  styleNo: string; // Style No.
  product: string; // Product
  component?: string; // Component
  chassis?: string; // Chassis
  solution: string; // Solution
  solutions?: BrainstormSolution[]; // Multiple brainstorm solutions

  // Personnel/Flags
  fi: boolean; // FI
  pp: boolean; // PP
  psd: boolean; // PSD

  orderQty?: number; // Order Quantity
  plant: string; // Plant
  platformStyle?: string; // Platform/Style
  term?: string; // Short Term/ Long Term

  // Cut Dates (Purple Section)
  cutRequestedDate?: string;
  cutRequiredDate?: string;
  commitedDate?: string;
  cutReceivedDate?: string;
  cutHandoverDate?: string;
  comment?: string;

  // Critical Path (Cyan Section)
  cutKitChecking?: string;
  workingWeek?: number;
  brainstormingDate?: string; // Brainstorming
  machineAvailabilityDate?: string; // Machine Availability
  seTrialDate?: string; // SE Trail line Start
  solutionCompletedDate?: string; // Solution completed date
  mockupDate?: string; // Mockup
  technicalValidationDate?: string; // Technical Validation
  videoDate?: string; // Vedio
  videoLink?: string; // Video URL link
  videoDescription?: string; // Video description
  stwDate?: string; // STW
  mdsDate?: string; // MDS (Machine Date Sheet)
  pdDate?: string; // PD (Progarm Drawing)
  sharePointDate?: string; // Solution to share point

  // Print Sheet Specific Fields
  sampleDate?: string; // Sample
  bomDate?: string; // BOM
  dxfDate?: string; // DXF
  cutTrimsDate?: string; // Cut & Trims
  sewingTe?: string; // Sewing T
  patternTe?: string; // Pattern T

  // Actual Dates for MDS SE Grid
  brainstormingActualDate?: string;
  seTrialActualDate?: string;
  solutionCompletedActualDate?: string;
  mockupActualDate?: string;
  technicalValidationActualDate?: string;
  videoActualDate?: string;
  stwActualDate?: string;
  mdsActualDate?: string;
  pdActualDate?: string;
  sharePointActualDate?: string;

  // More Actuals for Handover & Kit Checking
  cutKitCheckingActualDate?: string;
  ieShareActualDate?: string;
  unlockSdhActualDate?: string;
  handoverVeActualDate?: string;
  plantHandoverVeActualDate?: string;
  ingeniumAppActualDate?: string;

  // Handover & IE (Yellow/Green)
  ieShareDate?: string; // Shared to IE team
  unlockSdhDate?: string; // Unlock SDH
  smvSavings?: string; // SMV Savings
  handoverVeDate?: string; // Handover to VE
  plantHandoverVeDate?: string; // Plant Handover by VE
  routed?: string; // Routed
  ingeniumAppUpdating?: string; // Ingenium App Updating

  // Size Set (Pink)
  sizeSetCompletionDate?: string; // Size set completion Date
  sizeSetVeHandoverDate?: string; // Size set VE handover Date

  // Planning (Red/Green Section)
  fiDate?: string; // FI Date - Final Inspection
  ppDate?: string; // PP Date - Pre-Production Meeting
  psdDate?: string; // PSD Date - Planned Start Date (bulk production start on sewing line)
  plannedStartDate?: string; // Planned Start Date
  actualStartDate?: string; // Actual Start Date
  commentsOnStartDelay?: string; // Comments on Start Delay
  plannedCompleteDate?: string; // Planned Complete Date
  actualCompleteDate?: string; // Actual Complete Date- Ready to H/O
  commentsOnCompletionDelay?: string; // Comments on Completion Delay
  status: string; // Status
  reasonForDrop?: string; // Reason For Dropping

  // Computed/Legacy
  category: ProjectStatus;
  deadlineStatus: DeadlineStatus;

  // Legacy mappings for compatibility
  engineerName: string; // Mapped from Owner/Engineer if available or inferred
  mechanic: string;
  sewing: string;
  styleDueDate: string; // Mapped to Cut Required Date usually
  extendedDeadline?: string;

  // New Feature: Deadline History
  deadlineHistory?: DeadlineUpdate[];

  // Cut Kit Items
  cutKitItems?: CutKitItem[];
  cutActuals?: CutActuals;

  // Per-stage notes (legacy - being phased out)
  stageNotes?: Record<string, string>;
  
  // Date-wise notes for all stages
  dailyNotes?: Array<{
    date: string;
    note: string;
    timestamp: string;
    stageId: string;
    stageName: string;
  }>;

  // Date-wise comments for all stages (longer form content)
  stageComments?: Array<{
    date: string;
    comment: string;
    timestamp: string;
    stageId: string;
    stageName: string;
    characterCount: number;
    wordCount: number;
    userId?: string;
    userName?: string;
  }>;

  // Per-stage file links (for MDS, PD etc.)
  stageFiles?: StageFileLink[];

  // VE Handover
  veHandover?: string; // Target VE category (e.g. 'Unichela Panadura VE')
  veHandoverDate?: string; // Date when handed over
  handoverSource?: string; // Where it came from (e.g. 'MDS SE')

  // SE Signoff
  initialSmv?: string;
  latestSmv?: string;
  totalSmvSaving?: string;
  eph?: string;
  operationalCostSavings?: string;
  impact?: string;
  seSignoffDate?: string;
}

export interface EngineerPerformance {
  name: string;
  total: number;
  completed: number;
  active: number;
  points: number;
  efficiency: number;
}

export interface Notification {
  id: string;
  projectId: string;
  message: string;
  type: 'urgent' | 'warning' | 'info';
  timestamp: Date;
  owner: string;
}
