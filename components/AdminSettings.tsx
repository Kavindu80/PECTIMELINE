
import React, { useState } from 'react';
import { Settings2, Globe, Bell, Database, Info, Save, Check, RefreshCw } from 'lucide-react';

interface SettingsState {
    systemName: string;
    autoRefreshMinutes: number;
    emailAlerts: boolean;
    deadlineWarningDays: number;
    sharePointUrl: string;
    syncFrequencyMinutes: number;
}


export const AdminSettings: React.FC = () => {
    const [settings, setSettings] = useState<SettingsState>({
        systemName: 'M_DAS Industrial Engineering Hub',
        autoRefreshMinutes: 3,
        emailAlerts: true,
        deadlineWarningDays: 3,
        sharePointUrl: 'https://massl-my.sharepoint.com/:x:/r/personal/rumalis_masholdings_com/Documents/SE%20Weekly%20Plan.xlsx',
        syncFrequencyMinutes: 3,
    });

    const [saved, setSaved] = useState(false);

    const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const SettingSection: React.FC<{ title: string; icon: React.ReactNode; color: string; children: React.ReactNode }> = ({ title, icon, color, children }) => (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <div className={color}>{icon}</div>
                <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</h4>
            </div>
            <div className="p-5 space-y-5">{children}</div>
        </div>
    );

    const SettingRow: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
        <div className="flex items-center justify-between gap-6">
            <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-800 dark:text-white">{label}</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );

    const Toggle: React.FC<{ checked: boolean; onChange: (val: boolean) => void }> = ({ checked, onChange }) => (
        <button
            onClick={() => onChange(!checked)}
            className={`w-10 h-5 rounded-full transition-all relative ${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
        >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
    );

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in">
            {/* Header */}
            <div className="flex justify-between items-end shrink-0">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Settings</h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Configure system preferences and integrations</p>
                </div>
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg transition-all ${saved
                        ? 'bg-green-500 text-white shadow-green-500/20'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                        }`}
                >
                    {saved ? <><Check size={12} /> Saved</> : <><Save size={12} /> Save Changes</>}
                </button>
            </div>

            {/* Settings Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">

                {/* General */}
                <SettingSection title="General" icon={<Settings2 size={12} />} color="text-blue-500">
                    <SettingRow label="System Name" description="Name shown in the dashboard header">
                        <input
                            value={settings.systemName}
                            onChange={e => update('systemName', e.target.value)}
                            className="w-64 px-3 py-1.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-800 dark:text-white text-right focus:border-blue-500 focus:outline-none"
                        />
                    </SettingRow>
                    <div className="border-t border-slate-100 dark:border-slate-800"></div>
                    <SettingRow label="Auto-Refresh Interval" description="How often to refresh data from source (in minutes)">
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                max={60}
                                value={settings.autoRefreshMinutes}
                                onChange={e => update('autoRefreshMinutes', parseInt(e.target.value) || 1)}
                                className="w-20 px-3 py-1.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-800 dark:text-white text-right focus:border-blue-500 focus:outline-none"
                            />
                            <span className="text-[9px] text-slate-400 font-bold">MIN</span>
                        </div>
                    </SettingRow>
                </SettingSection>

                {/* Notifications */}
                <SettingSection title="Notifications" icon={<Bell size={12} />} color="text-amber-500">
                    <SettingRow label="Email Alerts" description="Send email notifications for critical deadlines">
                        <Toggle checked={settings.emailAlerts} onChange={val => update('emailAlerts', val)} />
                    </SettingRow>
                    <div className="border-t border-slate-100 dark:border-slate-800"></div>
                    <SettingRow label="Deadline Warning" description="Days before deadline to show warning status">
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                max={14}
                                value={settings.deadlineWarningDays}
                                onChange={e => update('deadlineWarningDays', parseInt(e.target.value) || 1)}
                                className="w-20 px-3 py-1.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-800 dark:text-white text-right focus:border-blue-500 focus:outline-none"
                            />
                            <span className="text-[9px] text-slate-400 font-bold">DAYS</span>
                        </div>
                    </SettingRow>
                </SettingSection>

                {/* Data Source */}
                <SettingSection title="Data Source" icon={<Database size={12} />} color="text-green-500">
                    <SettingRow label="SharePoint URL" description="Excel file URL for live data sync">
                        <input
                            value={settings.sharePointUrl}
                            onChange={e => update('sharePointUrl', e.target.value)}
                            className="w-80 px-3 py-1.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-800 dark:text-white text-right focus:border-blue-500 focus:outline-none font-mono truncate"
                        />
                    </SettingRow>
                    <div className="border-t border-slate-100 dark:border-slate-800"></div>
                    <SettingRow label="Sync Frequency" description="How often to pull fresh data from SharePoint">
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                max={60}
                                value={settings.syncFrequencyMinutes}
                                onChange={e => update('syncFrequencyMinutes', parseInt(e.target.value) || 1)}
                                className="w-20 px-3 py-1.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-800 dark:text-white text-right focus:border-blue-500 focus:outline-none"
                            />
                            <span className="text-[9px] text-slate-400 font-bold">MIN</span>
                        </div>
                    </SettingRow>
                </SettingSection>

                {/* About */}
                <SettingSection title="About" icon={<Info size={12} />} color="text-purple-500">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Version</p>
                            <p className="text-sm font-black text-slate-800 dark:text-white">2.1.0</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Build</p>
                            <p className="text-sm font-black text-slate-800 dark:text-white">2026.02.14</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Environment</p>
                            <p className="text-sm font-black text-slate-800 dark:text-white">Production</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Framework</p>
                            <p className="text-sm font-black text-slate-800 dark:text-white">React + Vite</p>
                        </div>
                    </div>
                </SettingSection>
            </div>
        </div>
    );
};
