import React, { useEffect } from 'react';
import { ShieldAlert, Clock, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { soundEngine } from '../../utils/audio';

interface InactivityWarningModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  totalWarningSeconds?: number;
  onExtendSession: () => void;
  onLogoutNow: () => void;
}

export const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
  isOpen,
  secondsRemaining,
  totalWarningSeconds = 60,
  onExtendSession,
  onLogoutNow,
}) => {
  const { language } = useLanguage();

  // Play warning chime when opened
  useEffect(() => {
    if (isOpen) {
      soundEngine.playWarning();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / totalWarningSeconds) * 100));
  const isUrgent = secondsRemaining <= 15;

  return (
    <div
      id="inactivity-warning-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="inactivity-warning-modal"
        className="w-full max-w-md rounded-3xl p-6 sm:p-7 border-2 border-orange-500/60 bg-gradient-to-b from-[#18130C] via-[#0E1017] to-[#0A0B10] shadow-[0_0_60px_rgba(255,107,0,0.35)] relative text-white text-center space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing aura effect */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 ${isUrgent ? 'bg-red-500/20' : 'bg-[#FF6B00]/20'} rounded-full blur-3xl pointer-events-none transition-colors duration-500`} />

        {/* Security Shield & Pulsing Clock Badge */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          {/* Animated circular SVG progress ring */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="34"
              className="stroke-white/10 fill-none"
              strokeWidth="6"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              className={`fill-none transition-all duration-1000 ${
                isUrgent
                  ? 'stroke-red-500'
                  : 'stroke-gradient-to-r stroke-amber-400'
              }`}
              stroke={isUrgent ? '#EF4444' : '#FF6B00'}
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 34}
              strokeDashoffset={2 * Math.PI * 34 * (1 - progressPercent / 100)}
              strokeLinecap="round"
            />
          </svg>

          {/* Center Countdown Number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`font-mono font-black text-2xl tracking-tighter ${
                isUrgent ? 'text-red-400 animate-pulse' : 'text-amber-300'
              }`}
            >
              {secondsRemaining}s
            </span>
          </div>
        </div>

        {/* Title and Security Badge */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs font-bold text-[#FF6B00]">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'تنبيه أمان الجلسة' : 'Session Security Alert'}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
            {language === 'ar' ? 'هل ما زلت متواجداً؟' : 'Are You Still There?'}
          </h3>
        </div>

        {/* Explanatory Message */}
        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-start sm:text-center space-y-2">
          <p className="text-sm font-bold text-orange-200 leading-relaxed">
            {language === 'ar'
              ? `تم رصد عدم نشاطك لمدة 29 دقيقة. سيتم تسجيل الخروج التلقائي لحماية حسابك وأموالك بعد ${secondsRemaining} ثانية.`
              : `No activity detected for 29 minutes. For security and fund protection, you will be logged out in ${secondsRemaining} seconds.`}
          </p>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-300 pt-1">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {language === 'ar'
                ? 'انقر على "تمديد الجلسة" للاستمرار في استخدام المنصة'
                : 'Click "Extend Session" to keep your session active'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-2 rounded-full bg-black/50 border border-white/10 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isUrgent
                  ? 'bg-gradient-to-r from-red-500 to-amber-500 animate-pulse'
                  : 'bg-gradient-to-r from-[#FF6B00] via-amber-400 to-emerald-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-gray-400 font-mono">
            <span>{language === 'ar' ? 'المهلة المتبقية' : 'Remaining'}</span>
            <span className="font-bold text-white">00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2.5">
          <button
            id="inactivity-extend-session-btn"
            onClick={() => {
              soundEngine.playClickSound();
              onExtendSession();
            }}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#FF6B00] via-amber-400 to-orange-500 hover:from-[#ff7a1a] hover:via-amber-300 hover:to-orange-400 text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5 text-black" />
            <span>{language === 'ar' ? 'تمديد الجلسة والبقاء مسجلاً' : 'Extend Session & Stay Logged In'}</span>
          </button>

          <button
            id="inactivity-logout-now-btn"
            onClick={() => {
              soundEngine.playClickSound();
              onLogoutNow();
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white font-medium text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4 text-gray-400" />
            <span>{language === 'ar' ? 'تسجيل الخروج الآن' : 'Logout Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
