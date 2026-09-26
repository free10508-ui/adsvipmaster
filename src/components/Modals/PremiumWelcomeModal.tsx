import React from 'react';
import { 
  X, 
  Sparkles, 
  Gift, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  Rocket, 
  ShieldCheck, 
  Crown, 
  Layers, 
  Coins 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { soundEngine } from '../../utils/audio';

interface PremiumWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartEarning: () => void;
  userName?: string;
}

export const PremiumWelcomeModal: React.FC<PremiumWelcomeModalProps> = ({
  isOpen,
  onClose,
  onStartEarning,
  userName
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  if (!isOpen) return null;

  const handleStart = () => {
    soundEngine.playSuccess();
    onStartEarning();
  };

  const handleClose = () => {
    soundEngine.playClickSound();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#12141F] via-[#0E101A] to-[#0A0B12] border-2 border-[#FF6B00]/40 shadow-[0_0_50px_rgba(255,107,0,0.25)] p-5 sm:p-6 text-white my-auto overflow-hidden animate-in zoom-in-95 duration-200"
        style={{
          boxShadow: '0 0 35px rgba(255, 107, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
        }}
      >
        {/* Glow ambient background elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FF6B00]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#00A3FF]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button (X) */}
        <button
          id="welcome-modal-close-x-btn"
          onClick={handleClose}
          title={isAr ? 'إغلاق' : 'Close'}
          className="absolute top-4 start-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer z-20 border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header Badge */}
        <div className="flex flex-col items-center text-center pt-2 relative z-10">
          <div className="relative mb-3">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-[#FF6B00]/25 via-amber-500/20 to-transparent border border-[#FF6B00]/40 flex items-center justify-center shadow-lg shadow-[#FF6B00]/20">
              <Rocket className="w-8 h-8 sm:w-9 sm:h-9 text-[#FF6B00] animate-bounce" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#00A3FF] border-2 border-[#0E101A] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* Main Glowing Title */}
          <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] via-[#FF8A00] to-amber-300 leading-snug drop-shadow-sm">
            {isAr ? 'مرحباً بك في منصة ADS VIP الاستثمارية! 🚀' : 'Welcome to ADS VIP Investment Platform! 🚀'}
          </h2>

          {/* Greeting Text */}
          <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed max-w-xs">
            {isAr 
              ? 'يسعدنا انضمامك كشريك نجاح مميز في مجتمعنا الرقمي لتداول الإعلانات الذكية.'
              : 'We are thrilled to welcome you as a distinguished partner in our smart digital ad community.'}
          </p>
        </div>

        {/* Welcome Gift Box Card (كرت نيون رمادي أنيق) */}
        <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-[#161826]/90 border border-white/15 relative overflow-hidden shadow-inner backdrop-blur-md">
          <div className="absolute top-0 start-0 w-1.5 h-full bg-gradient-to-b from-[#FF6B00] to-amber-400" />

          {/* Header of Gift Box */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
            <Gift className="w-4 h-4 text-[#FF6B00] shrink-0" />
            <span className="text-xs font-black text-white tracking-wide">
              {isAr ? 'تفاصيل الهدية الترحيبية المجانية:' : 'Free Welcome Gift Package Details:'}
            </span>
          </div>

          {/* Bullet Points */}
          <div className="space-y-2.5 text-xs">
            {/* Item 1 */}
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/30">
                <Crown className="w-3 h-3" />
              </div>
              <p className="text-gray-200 leading-relaxed font-medium">
                <span className="text-amber-300 font-black">
                  {isAr ? '🎁 باقة VIP 1 (المجانية بالكامل)' : '🎁 VIP 1 (100% Free)'}
                </span>
                {' '}
                <span className="text-gray-300">
                  {isAr ? 'متاحة لتفعيلها يدوياً بنفسك بنقرة واحدة!' : 'ready for you to activate manually with 1-click!'}
                </span>
              </p>
            </div>

            {/* Item 2 */}
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                <Coins className="w-3 h-3" />
              </div>
              <p className="text-gray-200 leading-relaxed font-medium">
                <span className="text-gray-300">
                  {isAr ? '💰 أرباحك اليومية المضمونة:' : '💰 Guaranteed Daily Earnings:'}
                </span>
                {' '}
                <span className="text-emerald-400 font-mono font-black text-xs sm:text-sm px-1.5 py-0.2 bg-emerald-950/60 rounded border border-emerald-500/40">
                  0.90 USDT
                </span>
              </p>
            </div>

            {/* Item 3 */}
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30">
                <Layers className="w-3 h-3" />
              </div>
              <p className="text-gray-200 leading-relaxed font-medium">
                <span className="text-gray-300">
                  {isAr ? '📋 عدد المهام:' : '📋 Daily Tasks:'}
                </span>
                {' '}
                <span className="text-white font-black">
                  {isAr ? '10 إعلانات يومية سريعة' : '10 Quick Daily Ads'}
                </span>
                {' '}
                <span className="text-gray-400 font-mono text-[11px]">
                  {isAr ? '(ربح الإعلان 0.09 USDT)' : '(0.09 USDT / ad)'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Motivational Bottom Text */}
        <div className="mt-3.5 px-2 text-center">
          <p className="text-[11px] sm:text-xs text-amber-200/90 leading-relaxed font-semibold">
            {isAr 
              ? '⚡ «نفّذ مهامك اليومية الآن، واجمع أرباحك لتأهيل حسابك للترقية الفورية وسحب مبالغك الكبرى!»'
              : '⚡ "Complete your daily tasks now, collect your profits to qualify for instant upgrades and major withdrawals!"'}
          </p>
        </div>

        {/* Call to Action Button */}
        <div className="mt-4 pt-1">
          <button
            id="welcome-modal-start-earning-btn"
            onClick={handleStart}
            className="w-full py-3 sm:py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#FF6B00] via-[#FF8500] to-amber-500 hover:brightness-110 active:scale-98 text-black font-black text-xs sm:text-sm shadow-lg shadow-[#FF6B00]/30 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300/40"
          >
            <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            <span>{isAr ? 'ابدأ جني الأرباح الآن 💸 ➔' : 'Start Earning Profits Now 💸 ➔'}</span>
          </button>

          <p className="text-center text-[10px] text-gray-400 mt-2 font-mono flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>{isAr ? 'منصة آمنة ومحمية بأنظمة التشفير الذكية' : 'Secured platform with smart encryption'}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
