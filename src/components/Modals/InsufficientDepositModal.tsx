import React from 'react';
import { AlertCircle, CreditCard, ArrowRight, X, Sparkles, Wallet } from 'lucide-react';
import { VIPPlan } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { soundEngine } from '../../utils/audio';
import { formatUSDT } from '../../utils/formatters';

interface InsufficientDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRechargeNow: (plan: VIPPlan) => void;
  plan: VIPPlan | null;
  currentDepositBalance: number;
}

export const InsufficientDepositModal: React.FC<InsufficientDepositModalProps> = ({
  isOpen,
  onClose,
  onRechargeNow,
  plan,
  currentDepositBalance,
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  if (!isOpen || !plan) return null;

  const planCost = plan.priceUSDT;
  const shortfall = Math.max(0, planCost - currentDepositBalance);

  const handleGoToDeposit = () => {
    soundEngine.playClick();
    onRechargeNow(plan);
  };

  return (
    <div
      id="insufficient-deposit-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div
        id="insufficient-deposit-modal"
        className="w-full max-w-md rounded-3xl p-5 sm:p-6 border-2 border-orange-500/50 bg-gradient-to-b from-[#18120C] via-[#0E1017] to-[#0A0B10] shadow-[0_0_50px_rgba(255,107,0,0.3)] relative text-white text-center space-y-4 sm:space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-60 h-60 bg-[#FF6B00]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="insufficient-deposit-close-btn"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="absolute top-4 end-4 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-black/60 border border-white/15 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer transition-all hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated Warning Icon */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-[#FF6B00] via-amber-400 to-orange-500 p-0.5 shadow-xl shadow-orange-500/30 flex items-center justify-center animate-pulse">
          <div className="w-full h-full bg-[#0A0B10] rounded-[22px] flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-[#FF6B00]" />
          </div>
        </div>

        {/* Header Title (Strictly as specified by User) */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-xs font-black text-[#FF6B00]">
            <CreditCard className="w-3.5 h-3.5" />
            <span>{isArabic ? 'تنبيه رصيد الإيداع' : 'Deposit Balance Alert'}</span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-white leading-snug px-2">
            {isArabic 
              ? 'عذراً يا شريكنا! رصيدك الحالي لا يكفي لشراء هذه الباقة. يرجى شحن حسابك لتفعيل الأرباح فوراً.'
              : 'Sorry partner! Your current deposit balance is insufficient to purchase this plan. Please recharge your account to activate earnings immediately.'}
          </h3>
        </div>

        {/* Breakdown Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-black/60 border border-white/10 text-xs space-y-2.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-300">
            <span className="font-semibold">{isArabic ? 'الباقة المختارة:' : 'Selected Plan:'}</span>
            <span className="font-bold text-amber-400">{plan.name} ({plan.title})</span>
          </div>

          <div className="flex items-center justify-between text-gray-300">
            <span className="font-semibold">{isArabic ? 'سعر تفعيل الباقة:' : 'Plan Price:'}</span>
            <span className="font-mono font-black text-white">${formatUSDT(planCost)} USDT</span>
          </div>

          <div className="flex items-center justify-between text-gray-300 border-t border-white/5 pt-2">
            <span className="font-semibold">{isArabic ? 'رصيد الإيداع الحالي:' : 'Current Deposit Balance:'}</span>
            <span className="font-mono font-black text-[#FF6B00]">${formatUSDT(currentDepositBalance)} USDT</span>
          </div>

          <div className="flex items-center justify-between text-gray-200 border-t border-white/5 pt-2 bg-orange-500/10 px-2.5 py-1.5 rounded-xl border border-orange-500/20">
            <span className="font-bold text-orange-200">{isArabic ? 'المبلغ المطلوب شحنه:' : 'Required Shortfall:'}</span>
            <span className="font-mono font-black text-emerald-400 text-sm">${formatUSDT(shortfall)} USDT</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Main Action Button: "شحن الرصيد الآن" */}
          <button
            id="insufficient-deposit-recharge-btn"
            onClick={handleGoToDeposit}
            className="w-full py-3.5 px-5 rounded-2xl font-black text-sm uppercase tracking-wider text-black bg-gradient-to-r from-[#FF6B00] via-amber-400 to-[#FF6B00] hover:brightness-110 shadow-xl shadow-orange-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>{isArabic ? 'شحن الرصيد الآن' : 'Recharge Balance Now'}</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>

          {/* Secondary Dismiss Button */}
          <button
            id="insufficient-deposit-cancel-btn"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isArabic ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};
