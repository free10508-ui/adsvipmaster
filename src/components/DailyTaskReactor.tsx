import React from 'react';
import { 
  Zap, 
  ChevronLeft
} from 'lucide-react';
import { UserProfile, VIPPlan } from '../types';
import { soundEngine } from '../utils/audio';

interface DailyTaskReactorProps {
  user: UserProfile;
  vipPlan: VIPPlan;
  onScrollToTasks: () => void;
}

export const DailyTaskReactor: React.FC<DailyTaskReactorProps> = ({
  user,
  vipPlan,
  onScrollToTasks,
}) => {
  const completedToday = user.tasksCompletedToday || 0;
  const maxTasks = Math.max(1, vipPlan.tasksPerDay || 10);
  const progressRatio = Math.min(1, completedToday / maxTasks);
  const remaining = Math.max(0, maxTasks - completedToday);
  const percentage = Math.round(progressRatio * 100);

  // Compact circular gauge math (r=15, cx=18, cy=18, strokeWidth=3)
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressRatio);

  return (
    <div 
      id="daily-task-reactor-hub"
      onClick={() => {
        soundEngine.playClick();
        onScrollToTasks();
      }}
      className="group relative overflow-hidden rounded-xl sm:rounded-2xl py-2 px-3 sm:px-4 bg-gradient-to-r from-[#140E0A] via-[#0F0B14] to-[#0A0D15] border border-orange-500/35 hover:border-orange-400 shadow-md shadow-orange-500/5 hover:shadow-orange-500/15 transition-all duration-200 cursor-pointer select-none active:scale-[0.99] flex items-center justify-between gap-2.5"
      dir="rtl"
    >
      {/* Background radial energy flare */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

      {/* Right/Middle content: Icon + Single Bold Text Line */}
      <div className="relative z-10 flex items-center gap-2 min-w-0 flex-1">
        <div className="w-6 h-6 rounded-lg bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400 shrink-0 shadow-sm">
          <Zap className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
        </div>
        <p className="text-xs sm:text-[13px] font-black text-white tracking-tight truncate sm:whitespace-nowrap leading-none">
          المهام اليومية: تم إنجاز ({completedToday}/{maxTasks}) ▪ المتبقي: {remaining} فيديوهات
        </p>
      </div>

      {/* Left content: Compact Glowing Circular Gauge */}
      <div className="relative z-10 flex items-center gap-1.5 shrink-0">
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            {/* Background Track */}
            <circle
              cx="18"
              cy="18"
              r={radius}
              className="text-white/10"
              strokeWidth="3"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Animated Glowing Progress Arc */}
            <circle
              cx="18"
              cy="18"
              r={radius}
              stroke="url(#compact-reactor-gradient)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="transparent"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
                transition: 'stroke-dashoffset 0.8s ease-in-out',
              }}
            />
            <defs>
              <linearGradient id="compact-reactor-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B00" />
                <stop offset="50%" stopColor="#FFB300" />
                <stop offset="100%" stopColor="#00FF88" />
              </linearGradient>
            </defs>
          </svg>

          {/* Centered Percentage Value */}
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <span className="text-[10px] sm:text-[11px] font-black font-mono text-orange-400 leading-none">
              {percentage}%
            </span>
          </div>
        </div>

        <ChevronLeft className="w-4 h-4 text-orange-400/70 group-hover:text-orange-400 group-hover:-translate-x-0.5 transition-all" />
      </div>
    </div>
  );
};
