import React, { useState } from 'react';
import { MessageSquare, Edit3, Save, X, User, Clock, BarChart3 } from 'lucide-react';
import { Project } from '../types';

interface StageCommentsSectionProps {
  project: Project;
  stageId: string;
  stageName: string;
  onUpdateProject?: (project: Project) => void;
}

export const StageCommentsSection: React.FC<StageCommentsSectionProps> = ({
  project,
  stageId,
  stageName,
  onUpdateProject
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());

  const stageComments = (project.stageComments || []).filter(comment => comment.stageId === stageId);
  const editKey = `${project.id}-${stageId}-comment`;

  const getCharacterCount = (text: string) => text.length;
  const getWordCount = (text: string) => text.trim().split(/\s+/).filter(word => word.length > 0).length;

  const handleSaveComment = () => {
    if (!commentText.trim()) return;

    const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timestamp = new Date().toISOString();
    
    const newComment = {
      date: currentDate,
      comment: commentText.trim(),
      timestamp: timestamp,
      stageId: stageId,
      stageName: stageName,
      characterCount: getCharacterCount(commentText.trim()),
      wordCount: getWordCount(commentText.trim()),
      userId: 'current-user', // TODO: Get from auth context
      userName: 'Current User' // TODO: Get from auth context
    };
    
    const updatedComments = [...(project.stageComments || []), newComment];
    onUpdateProject?.({ ...project, stageComments: updatedComments });
    setIsEditing(false);
    setCommentText('');
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedComments(newExpanded);
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <MessageSquare size={10} /> Stage Comments
        </span>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-[11px] text-purple-500 hover:text-purple-400 font-bold flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-purple-500/10 transition-colors"
          >
            <Edit3 size={14} /> Add Comment
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={handleSaveComment}
              disabled={!commentText.trim()}
              className="text-[11px] text-green-500 hover:text-green-400 font-bold flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-green-500/10 transition-colors disabled:opacity-50"
            >
              <Save size={14} /> Save
            </button>
            <button 
              onClick={() => {setIsEditing(false); setCommentText('');}}
              className="text-[11px] text-slate-400 hover:text-slate-300 font-bold px-2 py-1 rounded-lg hover:bg-slate-500/10 transition-colors"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        )}
      </div>
      {/* Comment Input */}
      {isEditing && (
        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 bg-white dark:bg-[#0F172A] border border-purple-300 dark:border-purple-600 rounded-lg text-[11px] text-slate-800 dark:text-white focus:outline-none resize-none"
            placeholder={`Add detailed comment about ${stageName.toLowerCase()}...`}
          />
          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <BarChart3 size={10} />
                {getCharacterCount(commentText)} characters
              </span>
              <span>{getWordCount(commentText)} words</span>
            </div>
            <div className="text-slate-400">
              {commentText.length > 500 && (
                <span className="text-amber-500">Long comment - consider breaking into sections</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Display Comments */}
      {stageComments.length > 0 && (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {stageComments
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((commentEntry, index) => {
              const isExpanded = expandedComments.has(index);
              const shouldTruncate = commentEntry.comment.length > 150;
              
              return (
                <div key={index} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                  {/* Comment Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-semibold text-purple-600 dark:text-purple-400">{commentEntry.date}</span>
                      <div className="flex items-center gap-1 text-[8px] text-slate-400">
                        <User size={8} />
                        <span>{commentEntry.userName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[8px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <BarChart3 size={8} />
                        <span>{commentEntry.characterCount}c / {commentEntry.wordCount}w</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={8} />
                        <span>{new Date(commentEntry.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Comment Content */}
                  <div className="text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed">
                    <p className="whitespace-pre-wrap">
                      {shouldTruncate && !isExpanded 
                        ? truncateText(commentEntry.comment)
                        : commentEntry.comment
                      }
                    </p>
                    
                    {shouldTruncate && (
                      <button
                        onClick={() => toggleExpanded(index)}
                        className="mt-2 text-[10px] text-purple-500 hover:text-purple-400 font-medium"
                      >
                        {isExpanded ? 'Show Less' : 'Show More'}
                      </button>
                    )}
                  </div>
                  
                  {/* Comment Stats */}
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between text-[8px] text-slate-400">
                      <span>
                        {commentEntry.characterCount > 500 ? 'Detailed' : 
                         commentEntry.characterCount > 200 ? 'Medium' : 'Brief'} comment
                      </span>
                      <span>
                        Est. reading time: {Math.ceil(commentEntry.wordCount / 200)} min
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Empty State */}
      {stageComments.length === 0 && !isEditing && (
        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic leading-relaxed text-center py-4">
          No detailed comments added yet. Click "Add Comment" to provide comprehensive feedback.
        </p>
      )}

      {/* Summary */}
      {stageComments.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-[9px] text-slate-500">
            <span>{stageComments.length} comment{stageComments.length > 1 ? 's' : ''} recorded</span>
            <span>
              Total: {stageComments.reduce((sum, c) => sum + c.wordCount, 0)} words, 
              {stageComments.reduce((sum, c) => sum + c.characterCount, 0)} characters
            </span>
          </div>
        </div>
      )}
    </div>
  );
};