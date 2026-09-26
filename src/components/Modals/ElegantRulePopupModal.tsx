import React from 'react';
import { ShieldAlert, Sparkles, ArrowRight, Lock, Gift, Coins } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { soundEngine } from '../../utils/audio';
import adRocketLogo from '../../assets/images/ad_rocket_android_logo_1789164710567.jpg';

export type ElegantPopupType = 
  | 'min_withdraw' 
  | 'vip1_freeze_4_50' 
  | 'vip2_lock_4_50' 
  | 'vip2_work_days_lock' 
  | 'vip1_cap_4_50'
  | 'multi_account_fraud'
  | 'require_vip_plan';

interface ElegantRulePopupModalProps {
  isOpen: boolean;
  type: ElegantPopupType | null;
  progressDays?: number;
  targetDays?: number;
  onClose: () => void;
  onAction?: () => void;
}

export const ElegantRulePopupModal: React.FC<ElegantRulePopupModalProps> = ({
  isOpen,
  type,
  progressDays = 0,
  targetDays = 10,
  onClose,
  onAction,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  if (!isOpen || !type) return null;

  const handleAction = () => {
    soundEngine.playClickSound();
    onClose();
    if (onAction) {
      onAction();
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'min_withdraw':
        return {
          icon: <Coins className="w-8 h-8 text-[#FF6B00]" />,
          gradientBadge: 'from-amber-500/20 to-orange-500/20 text-orange-400 border-orange-500/30',
          badgeText: isAr ? 'تنبيه نظام السحب' : 'Withdrawal Alert',
          title: isAr ? 'الحد الأدنى للسحب' : 'Minimum Withdrawal Limit',
          message: isAr
            ? 'عذراً، الحد الأدنى للسحب هو 5.0$'
            : 'Sorry, the minimum withdrawal amount is 5.00$',
          btnText: isAr ? 'فهمت ذلك' : 'Understood',
          actionBtn: null,
          isSecretHurdle: false,
          currentProgress: 0,
          targetProgress: 0,
        };

      case 'vip1_cap_4_50':
      case 'vip1_freeze_4_50':
      case 'vip2_lock_4_50':
        return {
          icon: <Lock className="w-8 h-8 text-[#FF6B00]" />,
          gradientBadge: 'from-amber-500/20 to-orange-500/20 text-orange-400 border-orange-500/30',
          badgeText: isAr ? 'تنبيه الترقية' : 'Upgrade Required',
          title: isAr
            ? 'عذراً، يرجى الترقية إلى VIP 2 لتتمكن من مواصلة العمل وجني الأرباح'
            : 'Sorry, please upgrade to VIP 2 to continue working and earning profits',
          message: isAr
            ? 'عذراً، يرجى الترقية إلى VIP 2 لتتمكن من مواصلة العمل وجني الأرباح'
            : 'Sorry, please upgrade to VIP 2 to continue working and earning profits',
          btnText: isAr ? 'الترقية إلى VIP 2' : 'Upgrade to VIP 2',
          actionBtn: true,
          isSecretHurdle: false,
          currentProgress: 0,
          targetProgress: 0,
        };

      case 'vip2_work_days_lock':
        const target = targetDays || 10;
        const current = Math.min(target, Math.max(0, progressDays));
        return {
          icon: null,
          isSecretHurdle: true,
          gradientBadge: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
          badgeText: isAr ? 'طلب السحب' : 'Withdrawal Request',
          title: isAr ? 'واصل العمل لسحب الأرباح' : 'Continue Working to Withdraw Earnings',
          currentProgress: current,
          targetProgress: target,
          message: isAr
            ? 'يرجى استكمال مهام العمل اليومية لتفعيل وسحب أرباحك بنجاح إلى محفظتك الرقمية.'
            : 'Please complete your daily work tasks to successfully activate and withdraw your earnings to your digital wallet.',
          btnText: isAr ? 'واصل العمل الآن' : 'Continue Working Now',
          actionBtn: true,
        };

      case 'multi_account_fraud':
        return {
          icon: null,
          isSecretHurdle: true,
          gradientBadge: 'from-red-500/25 to-rose-600/25 text-red-400 border-red-500/40',
          badgeText: isAr ? 'نظام مكافحة الاحتيال والتكرار' : 'Anti-Fraud Security System',
          title: isAr ? 'تم رصد نشاط غير مصرح به (تعدد حسابات)' : 'Unauthorized Multi-Account Activity Detected',
          currentProgress: 0,
          targetProgress: 0,
          message: isAr
            ? 'نعتذر منك، تم تعليق طلب السحب بواسطة خوارزمية الحماية لاكتشاف تكرار إنشاء أو استخدام حسابات إحالة من نفس الجهاز وشبكة الاتصال مخالفة لقوانين المسابقة والشروط والأحكام. إذا كنت تعتقد أن هذا خطأ يرجى التواصل مع الدعم الفني.'
            : 'Sorry, your withdrawal request has been suspended by the security algorithm due to multi-accounting detection from the same device and network in violation of competition terms. Contact support if you believe this is an error.',
          btnText: isAr ? 'فهمت الشروط والأحكام' : 'I Understand',
          actionBtn: false,
        };

      case 'require_vip_plan':
        return {
          icon: null,
          isSecretHurdle: true,
          gradientBadge: 'from-amber-500/25 to-yellow-500/25 text-amber-300 border-amber-400/40',
          badgeText: isAr ? 'تنبيه السحب' : 'Withdrawal Notice',
          title: isAr ? 'الرجاء شراء باقة لتتمكن من سحب أموالك' : 'Please Purchase a VIP Plan to Withdraw Your Funds',
          currentProgress: 0,
          targetProgress: 0,
          message: isAr
            ? 'تم إلغاء طلب السحب. يجب عليك تفعيل باقة VIP أولاً لتتمكن من سحب أموالك وأرباحك كاملة إلى محفظتك.'
            : 'Withdrawal request cancelled. You must activate a VIP plan first in order to withdraw your funds to your wallet.',
          btnText: isAr ? 'تفعيل باقة الآن' : 'Activate VIP Plan Now',
          actionBtn: true,
        };

      default:
        return null;
    }
  };

  const config = renderContent();
  if (!config) return null;

  return (
    <div
      id="elegant-rule-popup-backdrop"
      className="fixed inset-0 !z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="elegant-rule-popup-container"
        dir={isAr ? 'rtl' : 'ltr'}
        className="w-full max-w-[370px] sm:max-w-md rounded-[24px] p-6 sm:p-7 bg-[#0D111A]/95 border border-orange-500/35 shadow-[0_0_50px_rgba(255,107,0,0.25),0_20px_60px_rgba(0,0,0,0.85)] relative text-center text-white animate-in zoom-in-95 duration-200 space-y-4 sm:space-y-5 backdrop-blur-xl"
      >
        {/* Neon Ambient Glow circle behind modal */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-52 h-52 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Icon Badge with Refined Glow & Rounded Shape */}
        {config.isSecretHurdle ? (
          <div className="w-20 h-20 mx-auto rounded-[24px] p-0.5 bg-gradient-to-tr from-[#FF6B00] via-amber-400 to-orange-500 shadow-[0_0_25px_rgba(255,107,0,0.4)] relative">
            <div className="w-full h-full rounded-[22px] overflow-hidden bg-[#0A0D15] flex items-center justify-center p-1.5">
              <img
                src={adRocketLogo}
                alt="Platform Logo"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo.png';
                }}
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>
          </div>
        ) : (
          <div className="w-20 h-20 mx-auto rounded-[24px] bg-gradient-to-tr from-[#FF6B00] via-amber-400 to-orange-500 p-0.5 shadow-[0_0_25px_rgba(255,107,0,0.35)] flex items-center justify-center">
            <div className="w-full h-full bg-[#0A0D15] rounded-[22px] flex items-center justify-center">
              {config.icon}
            </div>
          </div>
        )}

        {/* Title & Badge */}
        <div className="space-y-2.5">
          <div
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r ${config.gradientBadge} border text-xs font-bold shadow-xs`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{config.badgeText}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white leading-snug tracking-tight drop-shadow-sm">
            {config.title}
          </h3>
        </div>

        {/* Secret Hurdle Counter Card (Only for work-days steps) */}
        {config.isSecretHurdle && (config.targetProgress || 0) > 0 && (
          <div className="p-4 rounded-[18px] bg-white/[0.04] border border-amber-500/25 text-center space-y-2.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-mono font-black text-amber-400 text-lg tracking-wider">
                ({config.currentProgress} / {config.targetProgress})
              </span>
              <span className="text-gray-200 font-semibold text-xs">
                {isAr ? 'مستوى الإنجاز الحالي' : 'Current Progress'}
              </span>
            </div>

            {/* Smooth Progress Bar */}
            <div className="w-full h-3 bg-black/70 rounded-full overflow-hidden border border-white/10 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-[#FF7A00] transition-all duration-700 shadow-[0_0_12px_rgba(255,122,0,0.6)]"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      6,
                      ((config.currentProgress || 0) / Math.max(1, config.targetProgress || 1)) * 100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Message body: Polished dark glassmorphic box with high contrast typography */}
        <div className="p-4 rounded-[18px] bg-[#141824]/80 border border-white/10 text-center shadow-inner">
          <p className="text-sm sm:text-base font-bold text-gray-100 leading-relaxed drop-shadow-xs">
            {config.message}
          </p>
        </div>

        {/* Action Controls: Full Pill-shaped Button with Luxurious Neon Glow */}
        <div className="pt-2 flex flex-col gap-2.5">
          {config.actionBtn ? (
            <button
              id="elegant-popup-action-btn"
              type="button"
              onClick={handleAction}
              className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#FF6B00] via-[#FFA000] to-[#FF5500] hover:from-[#ff7a1a] hover:to-[#ff6000] text-black font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(255,107,0,0.45)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 group border border-amber-300/40"
            >
              <Sparkles className="w-4 h-4 text-black group-hover:rotate-12 transition-transform" />
              <span>{config.btnText}</span>
              <ArrowRight
                className={`w-4 h-4 text-black transition-transform ${
                  isAr ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'
                }`}
              />
            </button>
          ) : (
            <button
              id="elegant-popup-confirm-btn"
              type="button"
              onClick={onClose}
              className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#FF6B00] via-[#FFA000] to-[#FF5500] hover:from-[#ff7a1a] hover:to-[#ff6000] text-black font-black text-sm sm:text-base tracking-wide shadow-[0_0_25px_rgba(255,107,0,0.5)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-300/40"
            >
              <span>{config.btnText}</span>
            </button>
          )}

          {config.actionBtn && (
            <button
              id="elegant-popup-dismiss-btn"
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold text-xs transition-colors cursor-pointer border border-white/5"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
