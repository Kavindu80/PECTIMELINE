import React, { useState, useEffect } from 'react';
import { X, Mail, Send, Copy, Eraser } from 'lucide-react';
import { Project } from '../types';

interface SeSignoffModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onSignOff: (emailData: { to: string; cc: string; subject: string; body: string }) => void;
}

export const SeSignoffModal: React.FC<SeSignoffModalProps> = ({ isOpen, onClose, project, onSignOff }) => {
    const [to, setTo] = useState('');
    const [cc, setCc] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    useEffect(() => {
        if (isOpen && project) {
            // Pre-fill data
            setTo('kavindul@masholdings.com'); // Default receiver as per generic requirement
            setCc('manager@example.com'); // Example CC
            setSubject(`SE Signoff - Style: ${project.styleNo}`);

            // Construct email body
            const totalSaving = project.totalSmvSaving || '0';
            const impact = project.impact || '0';

            let emailContent = `Hi Team,\n\nImprovements for style ${project.styleNo} are completed.\n`;
            emailContent += `Total SMV saving is ${totalSaving}, and the total dollar impact is ${impact}.\n\n`;
            emailContent += `Below are the relevant details of the style:\n`;
            emailContent += `- Customer: ${project.customer}\n`;
            emailContent += `- Product: ${project.product}\n`;
            emailContent += `- Order Qty: ${project.orderQty || 0}\n\n`;

            // Video Link
            if (project.videoLink) {
                emailContent += `Solution Video: ${project.videoLink}\n\n`;
            }

            if (project.solutions && project.solutions.length > 0) {
                emailContent += `Solutions Implemented:\n`;
                emailContent += `--------------------------------------------------------\n`;
                project.solutions.forEach((sol, index) => {
                    emailContent += `${index + 1}. ${sol.solutionText}\n`;
                    emailContent += `   Status: ${sol.status} | SMV: ${sol.operationSMV || '-'} | Resp: ${sol.responsible || '-'}\n`;

                    // Find attached files for this solution
                    const stwFile = (project.stageFiles || []).find(f => f.solutionId === sol.id && f.stageId === 'stw');
                    const mdsFile = (project.stageFiles || []).find(f => f.solutionId === sol.id && f.stageId === 'mds');
                    const pdFile = (project.stageFiles || []).find(f => f.solutionId === sol.id && f.stageId === 'pd');

                    if (stwFile) emailContent += `   [STW]: ${stwFile.fileUrl} (${stwFile.fileName})\n`;
                    if (mdsFile) emailContent += `   [MDS]: ${mdsFile.fileUrl} (${mdsFile.fileName})\n`;
                    if (pdFile) emailContent += `   [PD] : ${pdFile.fileUrl} (${pdFile.fileName})\n`;

                    emailContent += `\n`;
                });
                emailContent += `--------------------------------------------------------\n\n`;
            } else {
                emailContent += `No specific solutions tracked.\n\n`;
            }

            emailContent += `Please review and proceed with the next steps.\n\nBest Regards,\nSE Team`;

            setBody(emailContent);
        }
    }, [isOpen, project]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSignOff({ to, cc, subject, body });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <Mail className="text-blue-600" size={20} /> SE Signoff Email
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Compose and send signoff notification</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">

                    {/* Recipients */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">To</label>
                            <input
                                type="text"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="recipient@example.com"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CC</label>
                            <input
                                type="text"
                                value={cc}
                                onChange={(e) => setCc(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="manager@example.com"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Body */}
                    <div className="space-y-1 flex-1 flex flex-col min-h-[200px]">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Message Body</label>
                            <button onClick={() => navigator.clipboard.writeText(body)} className="text-[9px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1">
                                <Copy size={10} /> Copy Text
                            </button>
                        </div>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="flex-1 w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none leading-relaxed"
                        />
                    </div>

                    {/* Project Quick View */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-3">
                        <h4 className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Attached Data Preview</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <span className="block text-[9px] text-slate-500">Initial SMV</span>
                                <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">{project.initialSmv || '-'}</span>
                            </div>
                            <div>
                                <span className="block text-[9px] text-slate-500">Total Saving</span>
                                <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400">{project.totalSmvSaving || '-'}</span>
                            </div>
                            <div>
                                <span className="block text-[9px] text-slate-500">Cost Savings</span>
                                <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400">{project.operationalCostSavings || '-'}</span>
                            </div>
                            <div>
                                <span className="block text-[9px] text-slate-500">Impact</span>
                                <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400">{project.impact || '-'}</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
                    >
                        <Send size={14} /> Sign Off & Send
                    </button>
                </div>

            </div>
        </div>
    );
};
