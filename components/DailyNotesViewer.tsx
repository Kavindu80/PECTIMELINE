import React from 'react';
import { Calendar, Clock, Tag } from 'lucide-react';
import { Project } from '../types';

interface DailyNotesViewerProps {
  project: Project;
  className?: string;
}

export const DailyNotesViewer: React.FC<DailyNotesViewerProps> = ({ project, className = '' }) => {
  const allNotes = (project.dailyNotes || [])
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (allNotes.length === 0) {
    return (
      <div className={`p-4 text-center text-slate-500 dark:text-slate-400 ${className}`}>
        <Calendar size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No daily notes recorded yet</p>
      </div>
    );
  }

  // Group notes by date
  const notesByDate = allNotes.reduce((acc, note) => {
    const date = note.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(note);
    return acc;
  }, {} as Record<string, typeof allNotes>);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={16} className="text-blue-500" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Daily Notes Timeline ({allNotes.length} total)
        </h3>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(notesByDate).map(([date, notes]) => (
          <div key={date} className="border-l-2 border-blue-200 dark:border-blue-800 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{date}</span>
              <span className="text-xs text-slate-400">({notes.length} note{notes.length > 1 ? 's' : ''})</span>
            </div>
            
            <div className="space-y-2">
              {notes.map((note, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Tag size={12} className="text-slate-400" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{note.stageName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={10} />
                      {new Date(note.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{note.note}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};