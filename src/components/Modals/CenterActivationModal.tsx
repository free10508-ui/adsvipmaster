import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  X, 
  Clock, 
  ArrowRight, 
  Crown, 
  Flame, 
  Coins, 
  ShieldCheck, 
  Zap,
  Play
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { soundEngine } from '../../utils/audio';

interface CenterActivationModalProps {
  isOpen: boolean;
  isActivated: boolean;
  vipExpiresAt?: number;
  onClose: () => void;
  onGoToTasks: () => void;
  onActivateNow?: () => void;
}

export const CenterActivationModal: React.FC<CenterActivationModalProps> = ({
  isOpen,
  isActivated,
  vipExpiresAt,
  onClose,
  onGoToTasks,
  onActivateNow,
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  // Live 24-Hour Countdown calculation
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 23,
    minutes: 59,
    seconds: 59,
  });

  useEffect(() => {
    if (!isOpen) return;

    const updateTimer = () => {
      const now = Date.now();
      const targetTime = vipExpiresAt || (now + 24 * 60 * 60 * 1000);
      const diffMs = Math.max(0, targetTime - now);

      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isOpen, vipExpiresAt]);

  if (!isOpen) return null;

  const handleNavigateToTasks = () => {
    soundEngine.playClickSound();
    onGoToTasks();
    onClose();
  };

  const handleActivateAndGo = () => {
    soundEngine.playUpgradeSound();
    if (onActivateNow) {
      onActivateNow();
    }
  };

  const format2Digits = (num: number) => (num < 10 ? `0${num}` : `${num}`);

  return (
    <div 
      id="center-activation-popup-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-5 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="center-activation-popup"
        className="w-full max-w-[375px] sm:max-w-[400px] mx-auto rounded-3xl p-5 sm:p-6 border-2 border-orange-500/60 bg-gradient-to-b from-[#18130D] via-[#0E1017] to-[#0A0B10] shadow-[0_0_50px_rgba(255,107,0,0.35)] relative text-white text-center space-y-4 animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glowing Background Auras */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FF6B00]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-0 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Close Button (X) */}
        <button
          id="center-activation-close-x-btn"
          onClick={onClose}
          aria-label={isArabic ? 'إغلاق' : 'Close'}
          className="absolute top-4 end-4 z-20 w-9 h-9 rounded-2xl bg-black/60 border border-white/15 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer transition-all hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Pulsing 3D Radiant Crown & Shield Icon */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center pt-1">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#FF6B00] via-amber-400 to-orange-500 p-0.5 shadow-2xl shadow-orange-500/40 animate-pulse">
            <div className="w-full h-full bg-[#0A0B10] rounded-[22px] flex items-center justify-center relative">
              {isActivated ? (
                <Crown className="w-10 h-10 text-[#FF6B00]" />
              ) : (
                <Zap className="w-10 h-10 text-amber-400" />
              )}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B00] opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FF6B00]" />
              </span>
            </div>
          </div>
        </div>

        {/* Header Badges & Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/40 text-xs font-black text-[#FF6B00] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {isArabic 
                ? (isActivated ? 'تفعيل معتمد • VIP 1 نشط' : 'تفعيل باقة VIP 1 المجانية')
                : (isActivated ? 'Official Activation • VIP 1 Active' : 'Activate Free VIP 1 Tier')}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
            {isActivated
              ? (isArabic ? 'تم تفعيل باقة VIP 1 بنجاح! 🚀' : 'VIP 1 Successfully Activated! 🚀')
              : (isArabic ? 'تفعيل باقة VIP 1 لفتح المهام اليومية' : 'Activate VIP 1 to Unlock Daily Tasks')}
          </h3>

          <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
            {isArabic
              ? 'تم فتح 10 مهام يومية لحسابك لمدة 24 ساعة من تاريخ التفعيل بربح ثابت 0.09 USDT لكل مهمة (0.90 USDT يومياً).'
              : '10 daily video tasks unlocked for 24 hours post-activation with guaranteed 0.09 USDT per task (0.90 USDT/day).'}
          </p>
        </div>

        {/* 24-Hours Countdown Live Timer Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/15 via-[#1A150F] to-amber-500/15 border border-orange-500/40 text-center space-y-2.5 shadow-inner">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-300">
            <Clock className="w-4 h-4 text-[#FF6B00] animate-spin" />
            <span>{isArabic ? 'المهلة النشطة للمهام (24 ساعة بعد التفعيل)' : 'Active Task Window (24h Post-Activation)'}</span>
          </div>

          {/* Time digits display */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 font-mono">
            {/* Hours */}
            <div className="flex flex-col items-center p-2 rounded-xl bg-black/60 border border-white/10 min-w-[58px]">
              <span className="text-xl sm:text-2xl font-black text-[#FF6B00]">
                {format2Digits(timeLeft.hours)}
              </span>
              <span className="text-[10px] text-gray-400 font-sans">{isArabic ? 'ساعة' : 'Hours'}</span>
            </div>
            <span className="text-xl font-black text-orange-500">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center p-2 rounded-xl bg-black/60 border border-white/10 min-w-[58px]">
              <span className="text-xl sm:text-2xl font-black text-amber-300">
                {format2Digits(timeLeft.minutes)}
              </span>
              <span className="text-[10px] text-gray-400 font-sans">{isArabic ? 'دقيقة' : 'Mins'}</span>
            </div>
            <span className="text-xl font-black text-orange-500">:</span>

            {/* Seconds */}
            <div className="flex flex-col items-center p-2 rounded-xl bg-black/60 border border-white/10 min-w-[58px]">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">
                {format2Digits(timeLeft.seconds)}
              </span>
              <span className="text-[10px] text-gray-400 font-sans">{isArabic ? 'ثانية' : 'Secs'}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isArabic ? '10 مهام فيديو معلنين جاهزة للربح الفوري' : '10 Video Ad Tasks Ready for Instant Earnings'}</span>
          </div>
        </div>

        {/* 3 Core Highlights (10 Tasks, 0.90 USDT/day, Instant Payouts) */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
            <Flame className="w-4 h-4 text-[#FF6B00] mb-1" />
            <span className="font-mono font-black text-white text-sm">10</span>
            <span className="text-[10px] text-gray-400">{isArabic ? 'مهام يومية' : 'Daily Tasks'}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
            <Coins className="w-4 h-4 text-amber-400 mb-1" />
            <span className="font-mono font-black text-amber-300 text-sm">0.90 $</span>
            <span className="text-[10px] text-gray-400">{isArabic ? 'ربح يومي' : 'Daily Profit'}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="font-mono font-black text-emerald-400 text-sm">TRC-20</span>
            <span className="text-[10px] text-gray-400">{isArabic ? 'سحب فوري' : 'Instant Out'}</span>
          </div>
        </div>

        {/* Action Buttons: Explicitly Contains "انتقل للمهام" or "إغلاق" */}
        <div className="pt-2 flex flex-col gap-2.5">
          {/* Main Requested Button: "انتقل للمهام" */}
          <button
            id="activation-modal-go-tasks-btn"
            onClick={isActivated ? handleNavigateToTasks : handleActivateAndGo}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#FF6B00] via-amber-400 to-orange-500 hover:from-[#ff7a1a] hover:via-amber-300 hover:to-orange-400 text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 group"
          >
            <Play className="w-4 h-4 text-black fill-black group-hover:scale-110 transition-transform" />
            <span className="text-sm font-black">
              {isArabic 
                ? (isActivated ? 'الانتقال إلى المهام الآن 🚀' : 'تفعيل الآن والانتقال للمهام 🚀') 
                : (isActivated ? 'Go to Tasks Now 🚀' : 'Activate Now & Go to Tasks 🚀')}
            </span>
            <ArrowRight className={`w-4 h-4 text-black transition-transform ${isArabic ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
          </button>

          {/* Secondary Requested Button: "إغلاق" */}
          <button
            id="activation-modal-close-btn"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white font-bold text-xs transition-colors cursor-pointer"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
