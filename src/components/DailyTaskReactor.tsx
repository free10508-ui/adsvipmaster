import React from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  Flame, 
  Zap, 
  ArrowRight,
  Target
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

  // SVG Circular math
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressRatio);

  return (
    <div 
      id="daily-task-reactor-hub"
      onClick={() => {
        soundEngine.playClick();
        onScrollToTasks();
      }}
      className="group relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 bg-gradient-to-r from-[#140E0A] via-[#0F0B14] to-[#0A0D15] border border-orange-500/35 hover:border-orange-400 shadow-xl shadow-orange-500/5 hover:shadow-orange-500/20 transition-all duration-300 cursor-pointer select-none"
      dir="rtl"
    >
      {/* Background radial energy flare */}
      <div className="absolute right-0 top-0 w-44 h-44 bg-orange-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform" />
      
      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Left/Middle Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400">
              <Zap className="w-4 h-4 text-orange-400 fill-orange-400" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                مفاعل المهام اليومية (Orbital Reactor)
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-orange-500/20 text-orange-400 border border-orange-400/40">
                  {percentage}%
                </span>
              </span>
            </div>
          </div>

          <p className="text-[11px] sm:text-xs text-gray-300 font-medium">
            أنجزت <span className="text-orange-400 font-black font-mono">{completedToday}</span> من أصل <span className="text-white font-black font-mono">{maxTasks}</span> مهام متاحة اليوم
          </p>

          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              متبقي {remaining} فيديو لجمع كل أرباح اليوم
            </span>
            <span>•</span>
            <span className="text-amber-300 hover:underline">
              انقر لبدء المشاهدة فوراً ←
            </span>
          </div>
        </div>

        {/* Right: Circular Glowing Reactor Dial (مثل 0.70 أو 70%) */}
        <div className="relative w-24 h-24 sm:w-26 sm:h-26 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-white/10"
              strokeWidth="7"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Animated Glowing Progress Arc */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="url(#reactor-gradient)"
              strokeWidth="7"
              strokeLinecap="round"
              fill="transparent"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
                transition: 'stroke-dashoffset 0.8s ease-in-out',
              }}
            />
            <defs>
              <linearGradient id="reactor-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B00" />
                <stop offset="50%" stopColor="#FFB300" />
                <stop offset="100%" stopColor="#00F0FF" />
              </linearGradient>
            </defs>
          </svg>

          {/* Core Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-sm sm:text-base font-black font-mono text-white tracking-tight">
              {progressRatio.toFixed(2)}
            </span>
            <span className="text-[9px] font-mono text-orange-400 font-bold tracking-tight">
              RATIO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
