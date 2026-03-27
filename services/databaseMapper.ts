// Database Mapper - Converts between TypeScript camelCase and SQL snake_case

import { Project, BrainstormSolution } from '../types';

// ==================== HELPERS ====================

const displayDateToISO_Cache = new Map<string, string | null>();

// Convert DD-MMM-YY (e.g. "15-Mar-26") to YYYY-MM-DD (e.g. "2026-03-15") for PostgreSQL DATE columns
const convertDisplayDateToISO = (dateStr: string | null | undefined): string | null | undefined => {
  if (dateStr === undefined) return undefined;
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') return null;
  if (displayDateToISO_Cache.has(dateStr)) return displayDateToISO_Cache.get(dateStr)!;

  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    displayDateToISO_Cache.set(dateStr, null);
    return null;
  }
  const [day, monthStr, year] = parts;
  const monthMap: Record<string, string> = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
    'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  const month = monthMap[monthStr];
  if (!month) {
    displayDateToISO_Cache.set(dateStr, null);
    return null;
  }
  const fullYear = year.length === 2 ? `20${year}` : year;
  const result = `${fullYear}-${month}-${day.padStart(2, '0')}`;
  displayDateToISO_Cache.set(dateStr, result);
  return result;
};

const isoToDisplayDate_Cache = new Map<string, string>();

// Convert YYYY-MM-DD (from DB) to DD-MMM-YY (for UI display)
const convertISOToDisplayDate = (isoStr: string | null | undefined): string => {
  if (!isoStr || typeof isoStr !== 'string' || isoStr.trim() === '') return '';
  if (isoToDisplayDate_Cache.has(isoStr)) return isoToDisplayDate_Cache.get(isoStr)!;

  // Handle both YYYY-MM-DD and YYYY-MM-DDTHH:MM:SS formats
  const datePart = isoStr.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length !== 3) {
    isoToDisplayDate_Cache.set(isoStr, isoStr);
    return isoStr; // Return as-is if not ISO format
  }
  const [year, month, day] = parts;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = parseInt(month, 10) - 1;
  if (monthIdx < 0 || monthIdx > 11) {
    isoToDisplayDate_Cache.set(isoStr, isoStr);
    return isoStr;
  }
  const shortYear = year.slice(-2);
  const result = `${day}-${monthNames[monthIdx]}-${shortYear}`;
  isoToDisplayDate_Cache.set(isoStr, result);
  return result;
};

// Remove keys with undefined, null, or empty string values from an object
// This prevents sending bad values to Supabase
const removeUndefined = (obj: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

// ==================== MAPPERS ====================

// Convert TypeScript Project to Database format
export const projectToDatabase = (project: Partial<Project>): any => {
  const { solutions, ...rest } = project as any;

  const mapped: Record<string, any> = {
    // Basic Info (non-date fields)
    in_week: rest.inWeek,
    no: rest.no,
    core: rest.core,
    source: rest.source,
    customer: rest.customer,
    style_no: rest.styleNo,
    product: rest.product,
    component: rest.component,
    chassis: rest.chassis,
    solution: rest.solution,

    // Personnel/Flags
    fi: rest.fi,
    pp: rest.pp,
    psd: rest.psd,

    order_qty: rest.orderQty,
    plant: rest.plant,
    platform_style: rest.platformStyle,
    term: rest.term,
    comment: rest.comment,

    // Text fields
    video_link: rest.videoLink,
    video_description: rest.videoDescription,
    sewing_te: rest.sewingTe,
    pattern_te: rest.patternTe,
    smv_savings: rest.smvSavings,
    routed: rest.routed,
    ingenium_app_updating: rest.ingeniumAppUpdating,
    comments_on_start_delay: rest.commentsOnStartDelay,
    comments_on_completion_delay: rest.commentsOnCompletionDelay,
    status: rest.status,
    reason_for_drop: rest.reasonForDrop,
    working_week: rest.workingWeek,

    // Computed
    category: rest.category,
    deadline_status: rest.deadlineStatus,
    engineer_name: rest.engineerName,
    mechanic: rest.mechanic,
    sewing: rest.sewing,
    ve_handover: rest.veHandover,
    handover_source: rest.handoverSource,

    // SE Signoff text fields
    initial_smv: rest.initialSmv,
    latest_smv: rest.latestSmv,
    total_smv_saving: rest.totalSmvSaving,
    eph: rest.eph,
    operational_cost_savings: rest.operationalCostSavings,
    impact: rest.impact,

    // JSONB fields
    stage_notes: rest.stageNotes,
    daily_notes: rest.dailyNotes,
    stage_comments: rest.stageComments,
    cut_actuals: rest.cutActuals,
    cut_kit_items: rest.cutKitItems,
    stage_files: rest.stageFiles,
    deadline_history: rest.deadlineHistory,

    // DATE fields — convert DD-MMM-YY to YYYY-MM-DD for PostgreSQL
    style_in_date: convertDisplayDateToISO(rest.styleInDate),
    cut_requested_date: convertDisplayDateToISO(rest.cutRequestedDate),
    cut_required_date: convertDisplayDateToISO(rest.cutRequiredDate),
    commited_date: convertDisplayDateToISO(rest.commitedDate),
    cut_received_date: convertDisplayDateToISO(rest.cutReceivedDate),
    cut_handover_date: convertDisplayDateToISO(rest.cutHandoverDate),
    cut_kit_checking: convertDisplayDateToISO(rest.cutKitChecking),
    brainstorming_date: convertDisplayDateToISO(rest.brainstormingDate),
    machine_availability_date: convertDisplayDateToISO(rest.machineAvailabilityDate),
    se_trial_date: convertDisplayDateToISO(rest.seTrialDate),
    solution_completed_date: convertDisplayDateToISO(rest.solutionCompletedDate),
    mockup_date: convertDisplayDateToISO(rest.mockupDate),
    technical_validation_date: convertDisplayDateToISO(rest.technicalValidationDate),
    video_date: convertDisplayDateToISO(rest.videoDate),
    stw_date: convertDisplayDateToISO(rest.stwDate),
    mds_date: convertDisplayDateToISO(rest.mdsDate),
    pd_date: convertDisplayDateToISO(rest.pdDate),
    share_point_date: convertDisplayDateToISO(rest.sharePointDate),
    sample_date: convertDisplayDateToISO(rest.sampleDate),
    bom_date: convertDisplayDateToISO(rest.bomDate),
    dxf_date: convertDisplayDateToISO(rest.dxfDate),
    cut_trims_date: convertDisplayDateToISO(rest.cutTrimsDate),
    brainstorming_actual_date: convertDisplayDateToISO(rest.brainstormingActualDate),
    se_trial_actual_date: convertDisplayDateToISO(rest.seTrialActualDate),
    solution_completed_actual_date: convertDisplayDateToISO(rest.solutionCompletedActualDate),
    mockup_actual_date: convertDisplayDateToISO(rest.mockupActualDate),
    technical_validation_actual_date: convertDisplayDateToISO(rest.technicalValidationActualDate),
    video_actual_date: convertDisplayDateToISO(rest.videoActualDate),
    stw_actual_date: convertDisplayDateToISO(rest.stwActualDate),
    mds_actual_date: convertDisplayDateToISO(rest.mdsActualDate),
    pd_actual_date: convertDisplayDateToISO(rest.pdActualDate),
    share_point_actual_date: convertDisplayDateToISO(rest.sharePointActualDate),
    cut_kit_checking_actual_date: convertDisplayDateToISO(rest.cutKitCheckingActualDate),
    ie_share_actual_date: convertDisplayDateToISO(rest.ieShareActualDate),
    unlock_sdh_actual_date: convertDisplayDateToISO(rest.unlockSdhActualDate),
    handover_ve_actual_date: convertDisplayDateToISO(rest.handoverVeActualDate),
    plant_handover_ve_actual_date: convertDisplayDateToISO(rest.plantHandoverVeActualDate),
    ingenium_app_actual_date: convertDisplayDateToISO(rest.ingeniumAppActualDate),
    ie_share_date: convertDisplayDateToISO(rest.ieShareDate),
    unlock_sdh_date: convertDisplayDateToISO(rest.unlockSdhDate),
    handover_ve_date: convertDisplayDateToISO(rest.handoverVeDate),
    plant_handover_ve_date: convertDisplayDateToISO(rest.plantHandoverVeDate),
    size_set_completion_date: convertDisplayDateToISO(rest.sizeSetCompletionDate),
    size_set_ve_handover_date: convertDisplayDateToISO(rest.sizeSetVeHandoverDate),
    fi_date: convertDisplayDateToISO(rest.fiDate),
    pp_date: convertDisplayDateToISO(rest.ppDate),
    psd_date: convertDisplayDateToISO(rest.psdDate),
    planned_start_date: convertDisplayDateToISO(rest.plannedStartDate),
    actual_start_date: convertDisplayDateToISO(rest.actualStartDate),
    planned_complete_date: convertDisplayDateToISO(rest.plannedCompleteDate),
    actual_complete_date: convertDisplayDateToISO(rest.actualCompleteDate),
    style_due_date: convertDisplayDateToISO(rest.styleDueDate),
    extended_deadline: convertDisplayDateToISO(rest.extendedDeadline),
    ve_handover_date: convertDisplayDateToISO(rest.veHandoverDate),
    se_signoff_date: convertDisplayDateToISO(rest.seSignoffDate),
  };

  // Remove undefined values to avoid sending bad data to Supabase
  return removeUndefined(mapped);
};

// Convert Database format to TypeScript Project
export const databaseToProject = (dbProject: any): Project => {
  return {
    id: dbProject.id,

    // Basic Info
    inWeek: dbProject.in_week || 0,
    no: dbProject.no,
    core: dbProject.core,
    source: dbProject.source,
    customer: dbProject.customer || '',
    styleNo: dbProject.style_no || '',
    product: dbProject.product || '',
    component: dbProject.component,
    chassis: dbProject.chassis,
    solution: dbProject.solution || '',
    solutions: dbProject.brainstorm_solutions || [],

    // Personnel/Flags
    fi: dbProject.fi || false,
    pp: dbProject.pp || false,
    psd: dbProject.psd || false,

    orderQty: dbProject.order_qty,
    plant: dbProject.plant || '',
    platformStyle: dbProject.platform_style,
    term: dbProject.term,
    comment: dbProject.comment,

    // Text fields
    videoLink: dbProject.video_link,
    videoDescription: dbProject.video_description,
    sewingTe: dbProject.sewing_te,
    patternTe: dbProject.pattern_te,
    smvSavings: dbProject.smv_savings,
    routed: dbProject.routed,
    ingeniumAppUpdating: dbProject.ingenium_app_updating,
    commentsOnStartDelay: dbProject.comments_on_start_delay,
    commentsOnCompletionDelay: dbProject.comments_on_completion_delay,
    status: dbProject.status || 'New',
    reasonForDrop: dbProject.reason_for_drop,
    workingWeek: dbProject.working_week,

    // Computed
    category: dbProject.category || 'MDS SE',
    deadlineStatus: dbProject.deadline_status || 'On Track',
    engineerName: dbProject.engineer_name || 'Unassigned',
    mechanic: dbProject.mechanic || '',
    sewing: dbProject.sewing || '',
    veHandover: dbProject.ve_handover,
    handoverSource: dbProject.handover_source,

    // SE Signoff text fields
    initialSmv: dbProject.initial_smv,
    latestSmv: dbProject.latest_smv,
    totalSmvSaving: dbProject.total_smv_saving,
    eph: dbProject.eph,
    operationalCostSavings: dbProject.operational_cost_savings,
    impact: dbProject.impact,

    // JSONB fields
    stageNotes: dbProject.stage_notes || {},
    dailyNotes: dbProject.daily_notes || [],
    stageComments: dbProject.stage_comments || [],
    cutKitItems: dbProject.cut_kit_items || [],
    cutActuals: dbProject.cut_actuals || {},
    stageFiles: dbProject.stage_files || [],
    deadlineHistory: dbProject.deadline_history || [],

    // DATE fields — convert YYYY-MM-DD from DB to DD-MMM-YY for UI
    styleInDate: convertISOToDisplayDate(dbProject.style_in_date),
    cutRequestedDate: convertISOToDisplayDate(dbProject.cut_requested_date),
    cutRequiredDate: convertISOToDisplayDate(dbProject.cut_required_date),
    commitedDate: convertISOToDisplayDate(dbProject.commited_date),
    cutReceivedDate: convertISOToDisplayDate(dbProject.cut_received_date),
    cutHandoverDate: convertISOToDisplayDate(dbProject.cut_handover_date),
    cutKitChecking: convertISOToDisplayDate(dbProject.cut_kit_checking),
    brainstormingDate: convertISOToDisplayDate(dbProject.brainstorming_date),
    machineAvailabilityDate: convertISOToDisplayDate(dbProject.machine_availability_date),
    seTrialDate: convertISOToDisplayDate(dbProject.se_trial_date),
    solutionCompletedDate: convertISOToDisplayDate(dbProject.solution_completed_date),
    mockupDate: convertISOToDisplayDate(dbProject.mockup_date),
    technicalValidationDate: convertISOToDisplayDate(dbProject.technical_validation_date),
    videoDate: convertISOToDisplayDate(dbProject.video_date),
    stwDate: convertISOToDisplayDate(dbProject.stw_date),
    mdsDate: convertISOToDisplayDate(dbProject.mds_date),
    pdDate: convertISOToDisplayDate(dbProject.pd_date),
    sharePointDate: convertISOToDisplayDate(dbProject.share_point_date),
    sampleDate: convertISOToDisplayDate(dbProject.sample_date),
    bomDate: convertISOToDisplayDate(dbProject.bom_date),
    dxfDate: convertISOToDisplayDate(dbProject.dxf_date),
    cutTrimsDate: convertISOToDisplayDate(dbProject.cut_trims_date),
    brainstormingActualDate: convertISOToDisplayDate(dbProject.brainstorming_actual_date),
    seTrialActualDate: convertISOToDisplayDate(dbProject.se_trial_actual_date),
    solutionCompletedActualDate: convertISOToDisplayDate(dbProject.solution_completed_actual_date),
    mockupActualDate: convertISOToDisplayDate(dbProject.mockup_actual_date),
    technicalValidationActualDate: convertISOToDisplayDate(dbProject.technical_validation_actual_date),
    videoActualDate: convertISOToDisplayDate(dbProject.video_actual_date),
    stwActualDate: convertISOToDisplayDate(dbProject.stw_actual_date),
    mdsActualDate: convertISOToDisplayDate(dbProject.mds_actual_date),
    pdActualDate: convertISOToDisplayDate(dbProject.pd_actual_date),
    sharePointActualDate: convertISOToDisplayDate(dbProject.share_point_actual_date),
    cutKitCheckingActualDate: convertISOToDisplayDate(dbProject.cut_kit_checking_actual_date),
    ieShareActualDate: convertISOToDisplayDate(dbProject.ie_share_actual_date),
    unlockSdhActualDate: convertISOToDisplayDate(dbProject.unlock_sdh_actual_date),
    handoverVeActualDate: convertISOToDisplayDate(dbProject.handover_ve_actual_date),
    plantHandoverVeActualDate: convertISOToDisplayDate(dbProject.plant_handover_ve_actual_date),
    ingeniumAppActualDate: convertISOToDisplayDate(dbProject.ingenium_app_actual_date),
    ieShareDate: convertISOToDisplayDate(dbProject.ie_share_date),
    unlockSdhDate: convertISOToDisplayDate(dbProject.unlock_sdh_date),
    handoverVeDate: convertISOToDisplayDate(dbProject.handover_ve_date),
    plantHandoverVeDate: convertISOToDisplayDate(dbProject.plant_handover_ve_date),
    sizeSetCompletionDate: convertISOToDisplayDate(dbProject.size_set_completion_date),
    sizeSetVeHandoverDate: convertISOToDisplayDate(dbProject.size_set_ve_handover_date),
    fiDate: convertISOToDisplayDate(dbProject.fi_date),
    ppDate: convertISOToDisplayDate(dbProject.pp_date),
    psdDate: convertISOToDisplayDate(dbProject.psd_date),
    plannedStartDate: convertISOToDisplayDate(dbProject.planned_start_date),
    actualStartDate: convertISOToDisplayDate(dbProject.actual_start_date),
    plannedCompleteDate: convertISOToDisplayDate(dbProject.planned_complete_date),
    actualCompleteDate: convertISOToDisplayDate(dbProject.actual_complete_date),
    styleDueDate: convertISOToDisplayDate(dbProject.style_due_date) || '',
    extendedDeadline: convertISOToDisplayDate(dbProject.extended_deadline),
    veHandoverDate: convertISOToDisplayDate(dbProject.ve_handover_date),
    seSignoffDate: convertISOToDisplayDate(dbProject.se_signoff_date),
  };
};

// ==================== SOLUTION MAPPERS ====================

// Convert TypeScript BrainstormSolution to Database format
export const solutionToDatabase = (solution: Partial<BrainstormSolution>, projectId: string): any => {
  const mapped: Record<string, any> = {
    project_id: projectId,
    machine_code: solution.machineCode,
    operation_smv: solution.operationSMV,
    actual_smv: solution.actualSmv,
    expected_smv: solution.expectedSmv,
    routed_smv: solution.routedSmv,
    saving_smv: solution.savingSmv,
    operation: solution.operation,
    solution_text: solution.solutionText,
    comments: solution.comments,
    team: solution.team,
    responsible: solution.responsible,
    status: solution.status,
    video_link: solution.videoLink,
    video_description: solution.videoDescription,
    stw_link: solution.stwLink,
    mds_link: solution.mdsLink,
    pd_link: solution.pdLink,
    stage_tracking: solution.stageTracking,
    machines: solution.machines,
    daily_comments: solution.dailyComments,

    // Craftsmanship / VE fields
    yamazumi_chart_link: solution.yamazumiChartLink,
    craftsmanship_level: solution.craftsmanshipLevel,
    layout_link: solution.layoutLink,

    // DATE fields
    entry_date: convertDisplayDateToISO(solution.entryDate),
    start_date: convertDisplayDateToISO(solution.startDate),
    expected_end_date: convertDisplayDateToISO(solution.expectedEndDate),
    actual_end_date: convertDisplayDateToISO(solution.actualEndDate),
    actual_machine_date: convertDisplayDateToISO(solution.actualMachineDate),
    video_date: convertDisplayDateToISO(solution.videoDate),
    stw_date: convertDisplayDateToISO(solution.stwDate),
    mds_date: convertDisplayDateToISO(solution.mdsDate),
    pd_date: convertDisplayDateToISO(solution.pdDate),
    yamazumi_chart_date: convertDisplayDateToISO(solution.yamazumiChartDate),
    layout_date: convertDisplayDateToISO(solution.layoutDate),
  };

  return removeUndefined(mapped);
};

// Convert Database format to TypeScript BrainstormSolution
export const databaseToSolution = (dbSol: any): BrainstormSolution => {
  return {
    id: dbSol.id,
    machineCode: dbSol.machine_code || '',
    operationSMV: dbSol.operation_smv || '',
    actualSmv: dbSol.actual_smv,
    expectedSmv: dbSol.expected_smv,
    routedSmv: dbSol.routed_smv,
    savingSmv: dbSol.saving_smv,
    operation: dbSol.operation || '',
    solutionText: dbSol.solution_text || '',
    comments: dbSol.comments || '',
    team: dbSol.team || '',
    responsible: dbSol.responsible || '',
    status: dbSol.status || 'Pending',
    videoLink: dbSol.video_link,
    videoDescription: dbSol.video_description,
    stwLink: dbSol.stw_link,
    mdsLink: dbSol.mds_link,
    pdLink: dbSol.pd_link,
    stageTracking: dbSol.stage_tracking || {},
    machines: dbSol.machines || [],
    dailyComments: dbSol.daily_comments || [],

    // Craftsmanship / VE fields
    yamazumiChartLink: dbSol.yamazumi_chart_link,
    craftsmanshipLevel: dbSol.craftsmanship_level,
    layoutLink: dbSol.layout_link,

    // DATE fields
    entryDate: convertISOToDisplayDate(dbSol.entry_date),
    startDate: convertISOToDisplayDate(dbSol.start_date),
    expectedEndDate: convertISOToDisplayDate(dbSol.expected_end_date),
    actualEndDate: convertISOToDisplayDate(dbSol.actual_end_date),
    actualMachineDate: convertISOToDisplayDate(dbSol.actual_machine_date),
    videoDate: convertISOToDisplayDate(dbSol.video_date),
    stwDate: convertISOToDisplayDate(dbSol.stw_date),
    mdsDate: convertISOToDisplayDate(dbSol.mds_date),
    pdDate: convertISOToDisplayDate(dbSol.pd_date),
    yamazumiChartDate: convertISOToDisplayDate(dbSol.yamazumi_chart_date),
    layoutDate: convertISOToDisplayDate(dbSol.layout_date),
  };
};
