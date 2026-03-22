import React, { useState } from 'react';
import { MessageSquare, Calendar, Clock, Tag, BarChart3, Filter, Search } from 'lucide-react';
import { Project } from '../types';

interface AllCommentsViewerProps {
  project: Project;
  className?: string;
}

export const AllCommentsViewer: React.FC<AllCommentsViewerProps> = ({ project, className = '' }) => {
  const [filterStage, setFilterStage] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const allComments = (project.stageComments || [])
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter comments
  const filteredComments = allComments.filter(comment => {
    const matchesStage = filterStage === 'all' || comment.stageId === filterStage;
    const matchesSearch = searchTerm === '' || 
      comment.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.stageName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStage && matchesSearch;
  });

  // Get unique stages for filter
  const uniqueStages = Array.from(new Set(allComments.map(c => c.stageId)))
    .map(stageId => ({
      id: stageId,
      name: allComments.find(c => c.stageId === stageId)?.stageName || stageId
    }));

  // Statistics
  const totalComments = allComments.length;
  const totalWords = allComments.reduce((sum, c) => sum + c.wordCount, 0);
  const totalCharacters = allComments.reduce((sum, c) => sum + c.characterCount, 0);
  const avgWordsPerComment = totalComments > 0 ? Math.round(totalWords / totalComments) : 0;

  if (allComments.length === 0) {
    return (
      <div className={`p-6 text-center text-slate-500 dark:text-slate-400 ${className}`}>
        <MessageSquare size={32} className="mx-auto mb-3 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Comments Yet</h3>
        <p className="text-sm">Start adding detailed comments to track project progress and decisions.</p>
      </div>
    );
  }

  // Group comments by date
  const commentsByDate = filteredComments.reduce((acc, comment) => {
    const date = comment.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(comment);
    return acc;
  }, {} as Record<string, typeof filteredComments>);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Statistics */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <MessageSquare size={20} className="text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Project Comments Overview
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalComments}</div>
            <div className="text-slate-600 dark:text-slate-400">Total Comments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalWords}</div>
            <div className="text-slate-600 dark:text-slate-400">Total Words</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{avgWordsPerComment}</div>
            <div className="text-slate-600 dark:text-slate-400">Avg Words/Comment</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{uniqueStages.length}</div>
            <div className="text-slate-600 dark:text-slate-400">Stages with Comments</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-500" />
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800"
          >
            <option value="all">All Stages</option>
            {uniqueStages.map(stage => (
              <option key={stage.id} value={stage.id}>{stage.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2 flex-1">
          <Search size={16} className="text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search comments..."
            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800"
          />
        </div>
      </div>

      {/* Comments Timeline */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-blue-500" />
          <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300">
            Comments Timeline ({filteredComments.length} of {totalComments})
          </h4>
        </div>
        
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {Object.entries(commentsByDate).map(([date, comments]) => (
            <div key={date} className="border-l-4 border-purple-200 dark:border-purple-800 pl-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">{date}</span>
                <span className="text-sm text-slate-500">({comments.length} comment{comments.length > 1 ? 's' : ''})</span>
              </div>
              
              <div className="space-y-4">
                {comments.map((comment, index) => (
                  <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                    {/* Comment Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Tag size={14} className="text-slate-400" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{comment.stageName}</span>
                        </div>
                        <span className="text-xs text-slate-500">{comment.userName}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <BarChart3 size={12} />
                          <span>{comment.characterCount}c / {comment.wordCount}w</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{new Date(comment.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Comment Content */}
                    <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-3">
                      <p className="whitespace-pre-wrap">{comment.comment}</p>
                    </div>
                    
                    {/* Comment Metadata */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <span>
                        {comment.characterCount > 500 ? 'Detailed' : 
                         comment.characterCount > 200 ? 'Medium' : 'Brief'} comment
                      </span>
                      <span>
                        Est. reading time: {Math.ceil(comment.wordCount / 200)} min
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};