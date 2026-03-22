
import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Project } from '../types';
import { Clock, Activity, Target, Factory } from 'lucide-react';

const DEADLINE_COLORS = {
  'Overdue': '#EF4444',
  'Approaching': '#F59E0B',
  'On Track': '#10B981',
  'Extended': '#6366F1'
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-blue-500/50 p-3 rounded-xl shadow-2xl backdrop-blur-md ring-1 ring-slate-200 dark:ring-white/10">
        <p className="text-[10px] font-black text-slate-500 dark:text-white uppercase tracking-widest mb-1 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: payload[0].payload.fill || payload[0].color }}></span>
          {payload[0].name}
        </p>
        <p className="text-sm font-black text-blue-600 dark:text-blue-400">
          Count: <span className="text-slate-800 dark:text-white">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const Visualizations: React.FC<{ projects: Project[] }> = React.memo(({ projects }) => {

  // High-Level: Distribution by Category (Unit)
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => {
      const cat = p.category === 'Summary' ? 'Other' : p.category;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [projects]);

  const deadlineData = useMemo(() => {
    const counts: Record<string, number> = { 'Overdue': 0, 'Approaching': 0, 'On Track': 0, 'Extended': 0 };
    projects.forEach(p => {
      if (counts[p.deadlineStatus] !== undefined) counts[p.deadlineStatus]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">

      {/* Health Monitor (Deadlines) */}
      <div className="bg-white dark:bg-[#0F172A] rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col ring-1 ring-slate-100 dark:ring-slate-800/50 min-h-[200px] sm:min-h-[220px]">
        <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
          <Clock size={10} className="text-amber-500" /> Deadline Distribution
        </h3>
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="w-full sm:w-1/2 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deadlineData}
                  innerRadius={40}
                  outerRadius={55}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="transparent"
                  strokeWidth={2}
                >
                  {deadlineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DEADLINE_COLORS[entry.name as keyof typeof DEADLINE_COLORS]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full sm:w-1/2 space-y-2.5">
            {deadlineData.map((d) => (
              <div key={d.name} className="flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ backgroundColor: DEADLINE_COLORS[d.name as keyof typeof DEADLINE_COLORS] }}></div>
                  <span className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">{d.name}</span>
                </div>
                <span className="text-[11px] font-black text-slate-800 dark:text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* High Level Unit Load */}
      <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800/50 min-h-[200px] sm:min-h-[220px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Factory size={10} className="text-blue-500" /> Workload
          </h3>
        </div>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" strokeOpacity={0.2} className="dark:stroke-slate-700" />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                fontSize={9}
                fontWeight={700}
                tickLine={false}
                axisLine={false}
                stroke="#64748b"
                width={120}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="value" name="Active Styles" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});
