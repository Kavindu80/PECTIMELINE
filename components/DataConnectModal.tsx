
import React, { useState } from 'react';
import { X, Link2, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';

interface DataConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (url: string) => void;
  currentUrl: string;
}

export const DataConnectModal: React.FC<DataConnectModalProps> = ({ isOpen, onClose, onConnect, currentUrl }) => {
  const [url, setUrl] = useState(currentUrl);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Link2 size={20} className="text-blue-600" />
            Connect Online Spreadsheet
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6 space-y-3">
            <div className="flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <HelpCircle size={20} className="text-blue-600 shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">How to get your Excel link:</p>
                <ol className="list-decimal ml-4 space-y-1 opacity-90">
                  <li>Open your Excel Online file.</li>
                  <li>Go to <b>File {'>'} Share {'>'} Embed</b> or <b>Publish to Web</b>.</li>
                  <li>Select <b>CSV</b> format and copy the generated link.</li>
                </ol>
              </div>
            </div>
          </div>

          <label className="block text-sm font-semibold text-slate-700 mb-2">Spreadsheet CSV URL</label>
          <input 
            type="text" 
            placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <div className="mt-8 flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                onConnect(url);
                onClose();
              }}
              className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all"
            >
              Connect & Sync
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
