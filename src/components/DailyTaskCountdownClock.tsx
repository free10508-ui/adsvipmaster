import React, { useState, useEffect } from 'react';
import { Clock, Zap, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { storage } from '../utils/storage';
import { soundEngine } from '../utils/audio';

export const DailyTaskCountdownClock: React.FC = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  // Compute remaining seconds in the continuous 24-hour cycle (aligned to daily midnight UTC)
  const calculateRemainingSeconds = (): number => {
    const now = new Date();
    // Target midnight UTC of the next 24-hour cycle
    const nextReset = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0
    ));
    const diff = Math.floor((nextReset.getTime() - now.getTime()) / 1000);
    // If somehow 0 or negative, loop back to 24 hours (86400s)
    return diff > 0 ? diff : 86400;
  };

  const [secondsRemaining, setSecondsRemaining] = useState<number>(calculateRemainingSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          // Automated 24-hour expiration reached: reset daily tasks immediately
          try {
            const currentEmail = storage.getCurrentUserEmail();
            if (currentEmail) {
              storage.resetDailyTasksNow(currentEmail, true);
              soundEngine.playTaskRewardSound();
            }
          } catch {}
          return calculateRemainingSeconds();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Percentage of the 24-hour period remaining
  const percentageRemaining = Math.max(0, Math.min(100, (secondsRemaining / 86400) * 100));

  return (
    <div 
      id="daily-task-countdown-card"
      className="w-full p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-[#141722]/95 via-[#0E1019]/95 to-[#090B12]/98 border border-orange-500/35 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(255,107,0,0.14)] relative overflow-hidden group backdrop-blur-xl"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-56 h-28 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-56 h-28 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#00FF88]/5 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header Information */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-orange-500/25 to-amber-500/10 border border-orange-500/40 flex items-center justify-center text-[#FF6B00] shadow-[0_0_15px_rgba(255,107,0,0.25)] shrink-0">
            <Clock className="w-4 h-4 animate-pulse text-[#FF7A00]" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2 flex-wrap">
              <span className="tracking-tight">{isArabic ? 'تحديث المهام اليومي المنتظم' : 'Daily Task Cycle'}</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[10px] text-[#00FF88] font-black shadow-[0_0_10px_rgba(0,255,136,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-ping" />
                <span>{isArabic ? 'مباشر نشط' : 'Live Sync'}</span>
              </span>
            </h4>
            <p className="text-[11px] sm:text-xs text-gray-400 font-medium mt-0.5">
              {isArabic 
                ? 'الوقت المتبقي لتحديث المهام اليومية الجديدة' 
                : 'Time remaining for new daily tasks update'}
            </p>
          </div>
        </div>

        {/* 24H Auto Cycle Badge */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-full bg-black/60 border border-orange-500/30 text-[11px] text-orange-300 font-mono shadow-[0_0_12px_rgba(255,107,0,0.15)] backdrop-blur-sm">
          <RefreshCw className="w-3.5 h-3.5 text-[#FF6B00] animate-spin" style={{ animationDuration: '8s' }} />
          <span className="font-semibold">{isArabic ? 'دورة 24:00:00 ساعة تلقائية' : 'Auto 24:00:00 Reset'}</span>
        </div>
      </div>

      {/* 3D Modern Cyberpunk / Luxury Digital Countdown Clock Body */}
      <div className="relative z-10 pt-4 pb-1 flex flex-col items-center justify-center">
        <div className="flex items-center justify-center gap-2 sm:gap-4" dir="ltr">
          {/* Hours 3D Block */}
          <div className="flex flex-col items-center">
            <div className="relative min-w-[70px] sm:min-w-[88px] px-3 sm:px-4 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-b from-[#1D2230] via-[#121520] to-[#0A0C14] border border-orange-500/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),inset_0_-3px_8px_rgba(0,0,0,0.9),0_8px_25px_rgba(0,0,0,0.7),0_0_20px_rgba(255,107,0,0.18)] flex items-center justify-center overflow-hidden group/box">
              {/* Subtle metallic display split line */}
              <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/60 z-10 pointer-events-none shadow-[0_1px_0_rgba(255,255,255,0.06)]" />
              {/* Top ambient highlight */}
              <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/[0.07] to-transparent pointer-events-none" />
              
              <span className="relative z-20 font-mono text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-orange-400 tracking-wider drop-shadow-[0_2px_8px_rgba(255,107,0,0.3)]">
                {pad(hours)}
              </span>
            </div>
            <span className="text-[11px] sm:text-xs text-gray-400 font-black mt-2 tracking-wide">
              {isArabic ? 'ساعة' : 'HOURS'}
            </span>
          </div>

          {/* 3D Glowing Colon Separator */}
          <div className="flex flex-col items-center justify-center -mt-6">
            <span className="font-mono text-2xl sm:text-3xl font-black text-[#FF6B00] animate-pulse drop-shadow-[0_0_10px_rgba(255,107,0,0.7)]">
              :
            </span>
          </div>

          {/* Minutes 3D Block */}
          <div className="flex flex-col items-center">
            <div className="relative min-w-[70px] sm:min-w-[88px] px-3 sm:px-4 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-b from-[#1D2230] via-[#121520] to-[#0A0C14] border border-orange-500/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),inset_0_-3px_8px_rgba(0,0,0,0.9),0_8px_25px_rgba(0,0,0,0.7),0_0_20px_rgba(255,107,0,0.18)] flex items-center justify-center overflow-hidden group/box">
              {/* Subtle metallic display split line */}
              <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/60 z-10 pointer-events-none shadow-[0_1px_0_rgba(255,255,255,0.06)]" />
              {/* Top ambient highlight */}
              <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/[0.07] to-transparent pointer-events-none" />
              
              <span className="relative z-20 font-mono text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-orange-400 tracking-wider drop-shadow-[0_2px_8px_rgba(255,107,0,0.3)]">
                {pad(minutes)}
              </span>
            </div>
            <span className="text-[11px] sm:text-xs text-gray-400 font-black mt-2 tracking-wide">
              {isArabic ? 'دقيقة' : 'MINUTES'}
            </span>
          </div>

          {/* 3D Glowing Colon Separator */}
          <div className="flex flex-col items-center justify-center -mt-6">
            <span className="font-mono text-2xl sm:text-3xl font-black text-[#FF6B00] animate-pulse drop-shadow-[0_0_10px_rgba(255,107,0,0.7)]">
              :
            </span>
          </div>

          {/* Seconds 3D Block (Extra Neon Glow) */}
          <div className="flex flex-col items-center">
            <div className="relative min-w-[70px] sm:min-w-[88px] px-3 sm:px-4 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-b from-[#222838] via-[#141724] to-[#0B0D16] border-2 border-orange-500/60 shadow-[inset_0_1px_3px_rgba(255,255,255,0.2),inset_0_-3px_8px_rgba(0,0,0,0.9),0_8px_25px_rgba(0,0,0,0.7),0_0_25px_rgba(255,107,0,0.3)] flex items-center justify-center overflow-hidden">
              {/* Subtle metallic display split line */}
              <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/60 z-10 pointer-events-none shadow-[0_1px_0_rgba(255,255,255,0.06)]" />
              {/* Ambient neon orange backfill */}
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/15 via-transparent to-white/[0.08] pointer-events-none" />
              
              <span className="relative z-20 font-mono text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-orange-300 to-[#FF7A00] tracking-wider drop-shadow-[0_2px_12px_rgba(255,122,0,0.5)]">
                {pad(seconds)}
              </span>
            </div>
            <span className="text-[11px] sm:text-xs text-[#FF8A00] font-black mt-2 tracking-wide flex items-center gap-1">
              <Zap className="w-3 h-3 fill-[#FF8A00] animate-bounce" />
              <span>{isArabic ? 'ثانية' : 'SECONDS'}</span>
            </span>
          </div>
        </div>

        {/* Sleek Smart Dashboard 24H Cycle Progress Bar */}
        <div className="w-full max-w-md mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-gray-300 font-mono font-bold">
            <span className="flex items-center gap-1.5 text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span>{isArabic ? 'معدل دورة اليوم' : 'Cycle Progress'}</span>
            </span>
            <span className="text-[#FF8A00] font-black">{percentageRemaining.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-black/80 border border-white/10 overflow-hidden p-0.5 shadow-inner">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] via-amber-400 to-[#00FF88] shadow-[0_0_12px_rgba(255,107,0,0.5)] transition-all duration-1000"
              style={{ width: `${percentageRemaining}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
