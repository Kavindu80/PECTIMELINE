
import React, { useState, useRef } from 'react';
import { Project, BrainstormSolution } from '../types';
import { PLANTS } from '../constants';
import { X, Save, Settings, Calendar, List, Clock, CheckCircle2, AlertOctagon, ChevronDown, History, PlusCircle, Trash2, Users, Lightbulb } from 'lucide-react';

interface EditProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Project) => void;
  onDelete?: (id: string) => void;
  mode?: 'create' | 'edit';
}

const TABS = [
  { id: 'info', label: 'Basic Info', icon: List },
  { id: 'cut', label: 'Cut & Dates', icon: Calendar },
  { id: 'handover', label: 'Handover', icon: CheckCircle2 },
  { id: 'status', label: 'Status & Drop', icon: AlertOctagon },
  { id: 'path', label: 'Critical Path', icon: Clock },
  { id: 'deadlines', label: 'Deadlines', icon: History },
  { id: 'solutions', label: 'Solutions', icon: Lightbulb },
];

const LIFECYCLE_STATUSES = [
  "New",
  "Pending Cut",
  "Cut Received",
  "Ongoing",
  "Brainstorming",
  "Trial Run",
  "Technical Validation",
  "Mockup Pending",
  "Solution Pending",
  "Completed",
  "Handed Over",
  "Hold",
  "Dropped"
];

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
  // Handle 2 digit year (assuming 20xx)
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${month}-${day.padStart(2, '0')}`;
};

const DateInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => {

  const handleDatePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    if (!val) return;

    // Parse parts to avoid UTC timezone issues
    const [year, month, day] = val.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    const monthShort = dateObj.toLocaleString('default', { month: 'short' });
    const yearShort = year.slice(-2);

    onChange(`${day}-${monthShort}-${yearShort}`);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div style={{ position: 'relative' }} className="flex items-center w-full">
        <input
          type="text"
          placeholder="DD-MMM-YY"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-3 pr-11 py-2.5 bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-800 dark:text-white font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm"
        />
        {/* Visual calendar button (decorative only) */}
        <div 
          className="absolute right-1 top-1 bottom-1 w-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-500 transition-all cursor-pointer group"
          style={{ zIndex: 10, pointerEvents: 'none' }}
        >
          <Calendar size={16} className="text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" />
        </div>
        {/* Invisible native date input covering the button area — triggers native picker on any browser/domain */}
        <input
          type="date"
          value={getISODate(value)}
          onChange={handleDatePick}
          title="Select date"
          style={{
            position: 'absolute',
            right: '4px',
            top: '4px',
            bottom: '4px',
            width: '40px',
            opacity: 0,
            cursor: 'pointer',
            zIndex: 20,
          }}
        />
      </div>
    </div>
  );
};

const TextInput = ({ label, value, onChange, type = "text" }: { label: string, value: string | number, onChange: (val: string | number) => void, type?: string }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? 0 : parseInt(e.target.value)) : e.target.value)}
      className="w-full px-3 py-2.5 bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-800 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-colors shadow-sm placeholder:text-slate-400"
    />
  </div>
);

const SelectInput = ({ label, value, onChange, options }: { label: string, value: string, onChange: (val: string) => void, options: string[] }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-3 pr-8 py-2.5 bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-800 dark:text-white appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-none cursor-pointer shadow-sm"
      >
        <option value="" className="bg-white dark:bg-slate-900 text-slate-500">Select...</option>
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{opt}</option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
        <ChevronDown size={14} />
      </div>
    </div>
  </div>
);

export const EditProjectModal: React.FC<EditProjectModalProps> = ({ project, isOpen, onClose, onSave, onDelete, mode = 'edit' }) => {
  const [formData, setFormData] = useState<Project>(project);
  const [activeTab, setActiveTab] = useState('info');

  // State for new deadline input
  const [newDeadlineDate, setNewDeadlineDate] = useState('');
  const [newDeadlineReason, setNewDeadlineReason] = useState('');

  const [newSolution, setNewSolution] = useState<BrainstormSolution>({
    id: '', entryDate: '', machineCode: '', operationSMV: '', operation: '',
    solutionText: '', comments: '', team: '', responsible: '',
    startDate: '', expectedEndDate: '', actualEndDate: '', status: 'Pending'
  });

  if (!isOpen) return null;

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

  // Helper to update a field with automatic date calculations
  const update = (key: keyof Project, val: any) => {
    setFormData(p => {
      const updated = { ...p, [key]: val };

      // Auto-update Cut Requested Date when Style In Date changes
      if (key === 'styleInDate' && val) {
        // Only auto-update if cutRequestedDate is empty or equals old styleInDate
        if (!updated.cutRequestedDate || updated.cutRequestedDate === p.styleInDate) {
          updated.cutRequestedDate = val;
        }
        // Only auto-update if cutRequiredDate is empty or was auto-calculated before
        if (!updated.cutRequiredDate || (p.styleInDate && updated.cutRequiredDate === addWeekdays(p.styleInDate, 14))) {
          updated.cutRequiredDate = addWeekdays(val, 14);
        }
      }

      // Auto-calculate Cut Required Date when Cut Requested Date changes
      if (key === 'cutRequestedDate' && val) {
        // Only auto-update if cutRequiredDate is empty or was auto-calculated before
        if (!updated.cutRequiredDate || (p.cutRequestedDate && updated.cutRequiredDate === addWeekdays(p.cutRequestedDate, 14))) {
          updated.cutRequiredDate = addWeekdays(val, 14);
        }
      }

      return updated;
    });
  };

  const handleAddDeadline = () => {
    if (!newDeadlineDate || !newDeadlineReason) return;

    // Create new history entry
    const newEntry = {
      date: newDeadlineDate,
      reason: newDeadlineReason,
      timestamp: new Date().toISOString(),
      updatedBy: 'SYS_ADM' // Mock user
    };

    const updatedHistory = [newEntry, ...(formData.deadlineHistory || [])];

    setFormData(prev => ({
      ...prev,
      deadlineHistory: updatedHistory,
      extendedDeadline: newEntry.date // Update the effective deadline
    }));

    // Reset inputs
    setNewDeadlineDate('');
    setNewDeadlineReason('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/60 dark:bg-slate-950/95 backdrop-blur-md">
      <div className="bg-white dark:bg-[#1E293B] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-5xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/50 shrink-0">
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-tight uppercase flex items-center gap-2">
              {mode === 'create' ? <PlusCircle size={14} className="text-blue-500" /> : <Settings size={14} className="text-blue-500" />}
              {mode === 'create' ? 'Create New Style Record' : 'Update Style Record'}
            </h3>
            <p className="text-[8px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-widest mt-1">
              {mode === 'create' ? 'New Entry' : `Ref: ${project.styleNo}`}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 shrink-0 overflow-x-auto custom-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-500 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
              <tab.icon size={12} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-[#151d2f]">

          {activeTab === 'info' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

                <TextInput label="Week" value={formData.inWeek} onChange={(val) => update('inWeek', val)} type="number" />
                <TextInput label="Style No" value={formData.styleNo} onChange={(val) => update('styleNo', val)} />
                <TextInput label="Customer" value={formData.customer} onChange={(val) => update('customer', val)} />
                <TextInput label="Source" value={formData.source || ''} onChange={(val) => update('source', val)} />
                <TextInput label="Product" value={formData.product} onChange={(val) => update('product', val)} />
                <TextInput label="Chassis" value={formData.chassis || ''} onChange={(val) => update('chassis', val)} />
                <TextInput label="Order Qty" value={formData.orderQty || 0} onChange={(val) => update('orderQty', val)} type="number" />
                <SelectInput label="Plant" value={formData.plant} onChange={(val) => update('plant', val)} options={PLANTS} />
                <TextInput label="Platform" value={formData.platformStyle || ''} onChange={(val) => update('platformStyle', val)} />
                <SelectInput label="Core / Not" value={formData.core || ''} onChange={(val) => update('core', val)} options={['Core', 'Not Core']} />
                <TextInput label="Term" value={formData.term || ''} onChange={(val) => update('term', val)} />
                <DateInput label="Original Deadline" value={formData.styleDueDate} onChange={(val) => update('styleDueDate', val)} />
              </div>
            </div>
          )}

          {activeTab === 'cut' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
              <DateInput label="Style In Date" value={formData.styleInDate} onChange={(val) => update('styleInDate', val)} />
              <DateInput label="Cut Requested" value={formData.cutRequestedDate || ''} onChange={(val) => update('cutRequestedDate', val)} />
              <DateInput label="Cut Required" value={formData.cutRequiredDate || ''} onChange={(val) => update('cutRequiredDate', val)} />
              <DateInput label="Commited Date" value={formData.commitedDate || ''} onChange={(val) => update('commitedDate', val)} />
              <DateInput label="Cut Received" value={formData.cutReceivedDate || ''} onChange={(val) => update('cutReceivedDate', val)} />
              <DateInput label="Cut Handover" value={formData.cutHandoverDate || ''} onChange={(val) => update('cutHandoverDate', val)} />
              <div className="col-span-full">
                <TextInput label="Comments / Remarks" value={formData.comment || ''} onChange={(val) => update('comment', val)} />
              </div>
            </div>
          )}

          {activeTab === 'path' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-cyan-50 dark:bg-cyan-500/[0.03] p-5 rounded-2xl border border-cyan-100 dark:border-cyan-500/10">
                <h4 className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div> Development Cycle
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <DateInput label="Cut Kit" value={formData.cutKitChecking || ''} onChange={(val) => update('cutKitChecking', val)} />
                  <TextInput label="Working Week" value={formData.workingWeek || 0} onChange={(val) => update('workingWeek', val)} type="number" />
                  <DateInput label="Brainstorming" value={formData.brainstormingDate || ''} onChange={(val) => update('brainstormingDate', val)} />
                  <DateInput label="Machine Avail" value={formData.machineAvailabilityDate || ''} onChange={(val) => update('machineAvailabilityDate', val)} />
                  <DateInput label="SE Trial" value={formData.seTrialDate || ''} onChange={(val) => update('seTrialDate', val)} />
                  <DateInput label="Solution Done" value={formData.solutionCompletedDate || ''} onChange={(val) => update('solutionCompletedDate', val)} />
                  <DateInput label="Mockup" value={formData.mockupDate || ''} onChange={(val) => update('mockupDate', val)} />
                  <DateInput label="Validation" value={formData.technicalValidationDate || ''} onChange={(val) => update('technicalValidationDate', val)} />
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-500/[0.03] p-5 rounded-2xl border border-blue-100 dark:border-blue-500/10">
                <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Technical Gates
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <DateInput label="Video" value={formData.videoDate || ''} onChange={(val) => update('videoDate', val)} />
                  <DateInput label="STW" value={formData.stwDate || ''} onChange={(val) => update('stwDate', val)} />
                  <DateInput label="MDS" value={formData.mdsDate || ''} onChange={(val) => update('mdsDate', val)} />
                  <DateInput label="Program Drawing" value={formData.pdDate || ''} onChange={(val) => update('pdDate', val)} />
                  <DateInput label="Share Plant" value={formData.sharePointDate || ''} onChange={(val) => update('sharePointDate', val)} />
                </div>

                <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 mt-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Additional Print Data
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <DateInput label="Sample Date" value={formData.sampleDate || ''} onChange={(val) => update('sampleDate', val)} />
                  <DateInput label="BOM Date" value={formData.bomDate || ''} onChange={(val) => update('bomDate', val)} />
                  <DateInput label="DXF Date" value={formData.dxfDate || ''} onChange={(val) => update('dxfDate', val)} />
                  <DateInput label="Cut & Trims" value={formData.cutTrimsDate || ''} onChange={(val) => update('cutTrimsDate', val)} />
                  <TextInput label="Sewing T" value={formData.sewingTe || ''} onChange={(val) => update('sewingTe', val)} />
                  <TextInput label="Pattern T" value={formData.patternTe || ''} onChange={(val) => update('patternTe', val)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'handover' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
              <DateInput label="IE Shared" value={formData.ieShareDate || ''} onChange={(val) => update('ieShareDate', val)} />
              <DateInput label="Unlock SDH" value={formData.unlockSdhDate || ''} onChange={(val) => update('unlockSdhDate', val)} />
              <TextInput label="SMV Savings" value={formData.smvSavings || ''} onChange={(val) => update('smvSavings', val)} />
              <DateInput label="Handover VE" value={formData.handoverVeDate || ''} onChange={(val) => update('handoverVeDate', val)} />
              <DateInput label="Plant Handover" value={formData.plantHandoverVeDate || ''} onChange={(val) => update('plantHandoverVeDate', val)} />
              <TextInput label="Routed" value={formData.routed || ''} onChange={(val) => update('routed', val)} />
              <TextInput label="Ingenium App" value={formData.ingeniumAppUpdating || ''} onChange={(val) => update('ingeniumAppUpdating', val)} />
            </div>
          )}

          {activeTab === 'status' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase">Production Dates</h4>
                <DateInput label="FI Date (Final Inspection)" value={formData.fiDate || ''} onChange={(val) => update('fiDate', val)} />
                <DateInput label="PP Date (Pre-Production Meeting)" value={formData.ppDate || ''} onChange={(val) => update('ppDate', val)} />
                <DateInput label="PSD Date (Planned Start Date - Bulk Production)" value={formData.psdDate || ''} onChange={(val) => update('psdDate', val)} />

                <h4 className="text-[10px] font-black text-slate-500 uppercase mt-6">Planning Data</h4>
                <DateInput label="Planned Start" value={formData.plannedStartDate || ''} onChange={(val) => update('plannedStartDate', val)} />
                <DateInput label="Actual Start" value={formData.actualStartDate || ''} onChange={(val) => update('actualStartDate', val)} />
                <TextInput label="Start Delay Comment" value={formData.commentsOnStartDelay || ''} onChange={(val) => update('commentsOnStartDelay', val)} />
                <DateInput label="Planned Complete" value={formData.plannedCompleteDate || ''} onChange={(val) => update('plannedCompleteDate', val)} />
                <DateInput label="Actual Complete" value={formData.actualCompleteDate || ''} onChange={(val) => update('actualCompleteDate', val)} />
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase">Overall Status</h4>
                <SelectInput label="Status" value={formData.status} onChange={(val) => update('status', val)} options={LIFECYCLE_STATUSES} />
                <div className="p-4 bg-red-50 dark:bg-red-500/5 rounded-xl border border-red-100 dark:border-red-500/20">
                  <TextInput label="Reason For Drop" value={formData.reasonForDrop || ''} onChange={(val) => update('reasonForDrop', val)} />
                  <div className="mt-4">
                    <TextInput label="Completion Delay Comment" value={formData.commentsOnCompletionDelay || ''} onChange={(val) => update('commentsOnCompletionDelay', val)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deadlines' && (
            <div className="flex flex-col h-full gap-6 animate-in fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Update Section */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Clock size={12} className="text-blue-500" /> Deadline Management
                  </h4>

                  <div className="mb-8">
                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Current Effective Deadline</p>
                    <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                      {formData.extendedDeadline || formData.styleDueDate || 'N/A'}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${formData.extendedDeadline ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                      {formData.extendedDeadline ? 'Extended from original plan' : 'Original plan active'}
                    </div>
                    {/* Original vs Current visual */}
                    {formData.styleDueDate && (
                      <div className="mt-4 flex items-center gap-3">
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Original</p>
                          <p className="text-[12px] font-black text-slate-600 dark:text-slate-300">{formData.styleDueDate}</p>
                        </div>
                        {formData.extendedDeadline && (
                          <>
                            <div className="flex items-center gap-1 text-amber-500">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-500/10 rounded-lg px-3 py-2 border border-amber-200 dark:border-amber-500/20">
                              <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-0.5">Extended</p>
                              <p className="text-[12px] font-black text-amber-600 dark:text-amber-400">{formData.extendedDeadline}</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    {!formData.styleDueDate && (
                      <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-lg">
                        <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400">⚠ No original deadline set. Set it on the "Cut & Dates" tab.</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">

                    <DateInput
                      label="New Target Date"
                      value={newDeadlineDate}
                      onChange={setNewDeadlineDate}
                    />

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Reason for Update</label>
                      <textarea
                        value={newDeadlineReason}
                        onChange={(e) => setNewDeadlineReason(e.target.value)}
                        placeholder="Why is the deadline changing?"
                        className="w-full px-3 py-2.5 bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-800 dark:text-white resize-none h-24 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-700"
                      />
                    </div>
                    <button
                      onClick={handleAddDeadline}
                      disabled={!newDeadlineDate || !newDeadlineReason}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mt-2"
                    >
                      <PlusCircle size={14} /> Update Deadline
                    </button>
                  </div>
                </div>

                {/* History Section */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col h-full overflow-hidden">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <History size={12} className="text-purple-500" /> Modification History
                  </h4>

                  <div className="relative flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {(!formData.deadlineHistory || formData.deadlineHistory.length === 0) ? (
                      <div className="text-center py-10 text-slate-500 dark:text-slate-600">
                        <p className="text-[10px] font-bold uppercase">No updates recorded</p>
                      </div>
                    ) : (
                      <div className="space-y-0 pl-4 border-l border-slate-200 dark:border-slate-800 ml-2">
                        {formData.deadlineHistory.map((history, idx) => (
                          <div key={idx} className="relative pb-8">
                            <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-purple-500 z-10"></div>
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-slate-800 dark:text-white">{history.date}</span>
                                <span className="text-[8px] font-mono text-slate-500">{new Date(history.timestamp).toLocaleDateString()}</span>
                              </div>
                              <p className="text-[10px] text-slate-600 dark:text-slate-400 italic">"{history.reason}"</p>
                              <p className="text-[8px] font-bold text-slate-400 dark:text-slate-600 uppercase mt-1">By: {history.updatedBy || 'Unknown'}</p>
                            </div>
                          </div>
                        ))}
                        {/* Original Plan - Base Entry */}
                        {formData.styleDueDate && (
                          <div className="relative pb-0">
                            <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 z-10"></div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">{formData.styleDueDate}</span>
                              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Original Plan</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'solutions' && (
            <div className="space-y-6 animate-in fade-in h-full flex flex-col">
              {/* Add Solution Form */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
                <h4 className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <PlusCircle size={12} /> Add New Solution
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                  <div className="lg:col-span-2">
                    <TextInput label="Solution Text *" value={newSolution.solutionText} onChange={(val) => setNewSolution({ ...newSolution, solutionText: String(val) })} />
                  </div>
                  <TextInput label="Operation" value={newSolution.operation} onChange={(val) => setNewSolution({ ...newSolution, operation: String(val) })} />
                  <TextInput label="Mechanic" value={newSolution.team} onChange={(val) => setNewSolution({ ...newSolution, team: String(val) })} />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <TextInput label="Machine Code" value={newSolution.machineCode} onChange={(val) => setNewSolution({ ...newSolution, machineCode: String(val) })} />
                  <TextInput label="SMV" value={newSolution.operationSMV} onChange={(val) => setNewSolution({ ...newSolution, operationSMV: String(val) })} />
                </div>
                <div className="mb-4">
                  <TextInput label="Comments" value={newSolution.comments} onChange={(val) => {
                    let newComments = String(val);
                    if (!newSolution.comments && newComments) {
                        const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                        newComments = `[${today}] ${newComments}`;
                    }
                    setNewSolution({ ...newSolution, comments: newComments });
                  }} />
                </div>
                <button
                  onClick={() => {
                    if (!newSolution.solutionText) return;
                    const sol: BrainstormSolution = {
                      ...newSolution,
                      id: `sol-${Date.now()}`,
                      entryDate: newSolution.entryDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-')
                    };
                    const updatedSolutions = [...(formData.solutions || []), sol];
                    update('solutions', updatedSolutions);
                    setNewSolution({
                      id: '', entryDate: '', machineCode: '', operationSMV: '', operation: '',
                      solutionText: '', comments: '', team: '', responsible: '',
                      startDate: '', expectedEndDate: '', actualEndDate: '', status: 'Pending'
                    });
                  }}
                  disabled={!newSolution.solutionText}
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-lg shadow-cyan-600/20"
                >
                  Add Solution Entry
                </button>
              </div>

              {/* Solutions List */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden flex-1 min-h-[200px]">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center shrink-0">
                  <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Active Solutions ({formData.solutions?.length || 0})
                  </h4>
                </div>
                <div className="overflow-y-auto custom-scrollbar p-0 flex-1">
                  {(!formData.solutions || formData.solutions.length === 0) ? (
                    <div className="text-center py-10 text-slate-400 dark:text-slate-600">
                      <Lightbulb size={24} className="mx-auto mb-2 opacity-50" />
                      <p className="text-[10px] font-bold uppercase">No solutions added yet</p>
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10 shadow-sm">
                        <tr>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Entry Date</th>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Solution</th>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Machine / SMV</th>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {formData.solutions.map((sol) => (
                          <tr key={sol.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3 text-[10px] font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">{sol.entryDate}</td>
                            <td className="px-4 py-3">
                              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{sol.solutionText}</div>
                              <div className="text-[9px] text-slate-500 dark:text-slate-400">{sol.operation}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{sol.machineCode || '-'}</div>
                              <div className="text-[9px] text-slate-500 dark:text-slate-500">{sol.operationSMV ? `${sol.operationSMV} min` : '-'}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${sol.status === 'Done' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                                sol.status === 'In Progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                  sol.status === 'Trial' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                }`}>
                                {sol.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => {
                                  const updated = formData.solutions?.filter(s => s.id !== sol.id);
                                  update('solutions', updated);
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete Solution"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="p-4 bg-white dark:bg-[#0F172A] border-t border-slate-200 dark:border-slate-800 flex justify-between gap-3 shrink-0">
          <div className="flex items-center">
            {mode === 'edit' && onDelete && (
              <button
                onClick={() => onDelete(project.id)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-500 hover:text-red-700 dark:hover:text-white hover:bg-red-50 dark:hover:bg-red-500/20 rounded-xl transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button onClick={onClose} className="px-6 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">Cancel</button>
            <button onClick={() => onSave(formData)} className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5">
              {mode === 'create' ? 'Create Record' : 'Save Record'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
