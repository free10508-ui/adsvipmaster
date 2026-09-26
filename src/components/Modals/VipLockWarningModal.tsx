import React from 'react';
import { Lock, X, Sparkles, ArrowRight, ShieldAlert, Zap } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { soundEngine } from '../../utils/audio';

interface VipLockWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToVipPlans: () => void;
}

export const VipLockWarningModal: React.FC<VipLockWarningModalProps> = ({
  isOpen,
  onClose,
  onGoToVipPlans,
}) => {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  const handleNavigate = () => {
    soundEngine.playClickSound();
    onGoToVipPlans();
    onClose();
  };

  return (
    <div 
      id="vip-lock-warning-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="vip-lock-warning-modal"
        className="w-full max-w-md rounded-3xl p-6 border-2 border-orange-500/50 bg-gradient-to-b from-[#16120C] via-[#0E1017] to-[#0A0B10] shadow-[0_0_50px_rgba(255,107,0,0.25)] relative text-white text-center space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing aura effect in background */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FF6B00]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="vip-lock-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 end-4 z-20 w-9 h-9 rounded-2xl bg-black/60 border border-white/15 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer transition-all hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated Lock Icon */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-[#FF6B00] via-amber-400 to-orange-500 p-0.5 shadow-xl shadow-orange-500/30 flex items-center justify-center animate-pulse">
          <div className="w-full h-full bg-[#0A0B10] rounded-[22px] flex items-center justify-center">
            <Lock className="w-8 h-8 text-[#FF6B00]" />
          </div>
        </div>

        {/* Header Title */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs font-bold text-[#FF6B00]">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'تنبيه قفل المهام' : 'Tasks Locked Alert'}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
            {language === 'ar' ? 'الباقة غير مفعلة حالياً' : 'VIP 1 Tier Not Activated'}
          </h3>
        </div>

        {/* Explicit Warning Message requested by user */}
        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-start sm:text-center">
          <p className="text-sm sm:text-base font-bold text-orange-200 leading-relaxed">
            {language === 'ar' 
              ? 'يرجى الذهاب لصفحة الباقات وتفعيل باقة VIP 1 لإجراء إعادة اختيار هذه المرة!'
              : 'Please navigate to VIP Plans page and activate VIP 1 tier to unlock daily tasks!'}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {language === 'ar'
              ? '• باقة VIP 1 مجانية تماماً (0.00 USDT) وتمنحك 10 مهام يومياً بربح ثابت 0.09 USDT لكل مهمة (0.90 USDT يومياً).'
              : '• VIP 1 is 100% Free (0.00 USDT) granting 10 daily tasks with fixed 0.09 USDT per task (0.90 USDT/day).'}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-1 flex flex-col gap-2.5">
          <button
            id="vip-lock-modal-go-plans-btn"
            onClick={handleNavigate}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#FF6B00] via-amber-400 to-orange-500 hover:from-[#ff7a1a] hover:via-amber-300 hover:to-orange-400 text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 group"
          >
            <Sparkles className="w-4 h-4 text-black group-hover:rotate-12 transition-transform" />
            <span>
              {language === 'ar' 
                ? 'الانتقال لصفحة الباقات وتفعيل VIP 1 (0.00 USDT)' 
                : 'Go to VIP Plans & Activate VIP 1 Free'}
            </span>
            <ArrowRight className={`w-4 h-4 text-black transition-transform ${language === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
          </button>

          <button
            id="vip-lock-modal-cancel-btn"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold text-xs transition-colors cursor-pointer"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
