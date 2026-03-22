
import { Project, ProjectStatus } from '../types';

/**
 * Robust CSV parser that handles quoted fields containing commas and newlines
 */
const parseCSVLine = (text: string): string[] => {
  const result: string[] = [];
  let cell = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cell.trim());
      cell = '';
    } else {
      cell += char;
    }
  }
  result.push(cell.trim());
  return result;
};

export const parseCSVData = (csvText: string): Project[] => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const projects: Project[] = [];
  let currentHeaders: string[] = [];

  lines.forEach((line, idx) => {
    const values = parseCSVLine(line);
    
    // Detect Header Line based on specific headers from the Excel dump
    const isHeader = values.some(v => 
      v.toLowerCase().includes('style no') && 
      v.toLowerCase().includes('solution')
    );
    
    if (isHeader) {
      currentHeaders = values.map(h => h.toLowerCase().trim().replace(/['"]/g, '').replace(/\n/g, ' '));
      return;
    }

    if (currentHeaders.length === 0) return;

    const row: Record<string, string> = {};
    currentHeaders.forEach((header, i) => {
      row[header] = values[i] || '';
    });

    // Helper to get value by fuzzy matching header keys
    const getVal = (keys: string[]) => {
      for (const key of keys) {
        const lowerKey = key.toLowerCase();
        // Check exact match first
        if (row[lowerKey] !== undefined) return row[lowerKey];
        // Check keys containing newlines or extra spaces cleaned up
        const found = Object.keys(row).find(k => k.includes(lowerKey));
        if (found) return row[found];
      }
      return '';
    };

    const isCheck = (val: string) => {
      const v = val?.toLowerCase().trim();
      return ['true', 'yes', 'y', '1', 'checked', 'ok', 'done', 't'].includes(v || '');
    };

    // Mandatory fields check
    const styleNo = getVal(['style no.', 'style no', 'style']);
    if (!styleNo) return;

    const statusStr = getVal(['status']) || 'Ongoing';
    const styleInDate = getVal(['style in date', 'style in']);
    const solution = getVal(['solution']);
    const plant = getVal(['plant']);
    const term = getVal(['short term/ long term', 'term']);
    
    // Extract engineer name from solution if possible (often "Solution description - Name")
    let engineerName = getVal(['engineer', 'owner']);
    if (!engineerName && solution.includes('-')) {
        const parts = solution.split('-');
        engineerName = parts[parts.length - 1].trim();
    }

    projects.push({
      id: `row-${idx}-${Date.now()}`,
      
      inWeek: parseInt(getVal(['week', 'in week'])) || 0,
      styleInDate,
      no: getVal(['no.', 'no']),
      core: getVal(['core / not', 'core']),
      source: getVal(['source']),
      customer: getVal(['customer']),
      styleNo,
      product: getVal(['product']),
      component: getVal(['component']),
      chassis: getVal(['chassis']),
      solution,
      
      fi: isCheck(getVal(['fi'])),
      pp: isCheck(getVal(['pp'])),
      psd: isCheck(getVal(['psd'])),
      orderQty: parseInt(getVal(['order quantity', 'quantity']).replace(/,/g, '')) || 0,
      plant: plant,
      platformStyle: getVal(['platform/ style', 'platform']),
      term: term,
      
      // Cut Dates
      cutRequestedDate: getVal(['cut requested date']),
      cutRequiredDate: getVal(['cut required date']),
      commitedDate: getVal(['commited date']),
      cutReceivedDate: getVal(['cut received date']),
      cutHandoverDate: getVal(['cut handover date']),
      comment: getVal(['comment']),
      
      // Critical Path
      cutKitChecking: getVal(['cut kit checking']),
      workingWeek: parseInt(getVal(['working week'])) || 0,
      brainstormingDate: getVal(['brainstorming', 'brainstorming date']),
      machineAvailabilityDate: getVal(['machine availability']),
      seTrialDate: getVal(['se trail line start', 'se trial']),
      solutionCompletedDate: getVal(['solution completed date']),
      mockupDate: getVal(['mockup']),
      technicalValidationDate: getVal(['technical validation']),
      videoDate: getVal(['vedio']),
      stwDate: getVal(['stw']),
      mdsDate: getVal(['mds', 'machine date sheet']),
      pdDate: getVal(['pd', 'program drawing']),
      sharePointDate: getVal(['solution to share point']),
      
      // Handover
      ieShareDate: getVal(['shared to ie team']),
      unlockSdhDate: getVal(['unlock sdh']),
      smvSavings: getVal(['smv savings']),
      handoverVeDate: getVal(['handover to ve']),
      plantHandoverVeDate: getVal(['plant handover by ve']),
      routed: getVal(['routed']),
      ingeniumAppUpdating: getVal(['ingenium app updating']),
      
      // Size Set
      sizeSetCompletionDate: getVal(['size set completion date']),
      sizeSetVeHandoverDate: getVal(['size set ve handover date']),
      
      // Planning
      fiDate: getVal(['fi date']),
      plannedStartDate: getVal(['planned start date']),
      actualStartDate: getVal(['actual start date']),
      commentsOnStartDelay: getVal(['comments on start delay']),
      plannedCompleteDate: getVal(['planned complete date']),
      actualCompleteDate: getVal(['actual complete date', 'actual complete date- ready to h/o']),
      commentsOnCompletionDelay: getVal(['comments on completion delay']),
      status: statusStr,
      reasonForDrop: getVal(['reason for dropping']),

      category: determineCategory(plant, term),
      deadlineStatus: 'On Track', // Calculated elsewhere usually
      
      // Mapped/Legacy
      engineerName: engineerName || 'Unassigned',
      mechanic: '',
      sewing: '',
      styleDueDate: getVal(['cut required date']) || '',
      deadlineHistory: []
    });
  });

  return projects;
};

const determineCategory = (plant: string, term: string): ProjectStatus => {
  const p = (plant || '').toLowerCase();
  const t = (term || '').toLowerCase();
  
  if (t.includes('long term')) return 'Long Term';
  if (p.includes('upl') || p.includes('panadura')) return 'Unichela Panadura VE';
  if (p.includes('lc') || p.includes('casualine')) return 'Casualine VE';
  
  // Default fallback for SL or generic SE projects
  return 'MDS SE';
};
