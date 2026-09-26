import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownToLine, 
  Wallet, 
  Coins, 
  ShieldCheck, 
  ArrowDownRight,
  TrendingUp, 
  Users, 
  Crown, 
  Headphones, 
  Sparkles,
  CheckCircle2,
  Send,
  ExternalLink,
  CreditCard,
  Download
} from 'lucide-react';
import { UserProfile, VIPPlan, Transaction } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { soundEngine } from '../utils/audio';
import { storage } from '../utils/storage';
import { PresentationCarouselBanner } from './PresentationCarouselBanner';
import { WithdrawalProofsModal } from './Modals/WithdrawalProofsModal';
import { SupportCommunityModal } from './Modals/SupportCommunityModal';
import { DownloadAppModal } from './Modals/DownloadAppModal';
import { DailyTaskReactor } from './DailyTaskReactor';

interface HeroHeaderProps {
  user: UserProfile;
  vipPlan: VIPPlan;
  transactions?: Transaction[];
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenVIPUpgrade: () => void;
  onScrollToTasks: () => void;
  onOpenReferral?: () => void;
  onOpenProofs?: () => void;
  onShowToast?: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'vip', amount?: number) => void;
}

export const HeroHeader: React.FC<HeroHeaderProps> = React.memo(({
  user,
  vipPlan,
  transactions,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenVIPUpgrade,
  onScrollToTasks,
  onOpenReferral,
  onOpenProofs,
  onShowToast,
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  // Real User Balance tied strictly to user's Gmail account (Live Synchronized)
  const withdrawableAmount = Math.max(0, Number((user.totalBalanceUSDT || 0).toFixed(2)));

  // Real Deposit Balance tied strictly to user's account in localStorage (مبلغ الإيداع الفعلي)
  const totalDepositedAmount = Math.max(0, Number((user.totalDepositedUSDT ?? 0).toFixed(2)));

  // Modal states for Main Grid Features
  const [isProofsModalOpen, setIsProofsModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportInitialTab, setSupportInitialTab] = useState<'support' | 'community'>('support');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const handleOpenProofs = () => {
    soundEngine.playClick();
    if (onOpenProofs) {
      onOpenProofs();
    } else {
      setIsProofsModalOpen(true);
    }
  };

  const handleOpenSupport = () => {
    soundEngine.playClick();
    setSupportInitialTab('support');
    setIsSupportModalOpen(true);
  };

  const handleOpenCommunity = () => {
    soundEngine.playClick();
    setSupportInitialTab('community');
    setIsSupportModalOpen(true);
  };

  const handleOpenReferralAction = () => {
    soundEngine.playClick();
    if (onOpenReferral) {
      onOpenReferral();
    } else {
      const referralElem = document.getElementById('referral-system-section');
      if (referralElem) {
        referralElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div id="hero-dashboard-container" className="w-full space-y-3 sm:space-y-4" dir="rtl">
      
      {/* 1. AUTO-PLAY CAROUSEL (11 SLIDES - SHORT HEIGHT 180px - OBJECT-COVER - NO DISTORTION) */}
      <PresentationCarouselBanner onActionClick={onScrollToTasks} />

      {/* 2. VISUAL EYE-CATCHER: DAILY TASK ORBITAL REACTOR */}
      <div className="w-full">
        <DailyTaskReactor
          user={user}
          vipPlan={vipPlan}
          onScrollToTasks={onScrollToTasks}
        />
      </div>

      {/* 4. FIXED MAIN DASHBOARD: STRICTLY SEPARATED WALLET CARDS (مبلغ الإيداع وإجمالي الرصيد) */}
      <div 
        id="balance-and-withdraw-cards-grid"
        className="grid grid-cols-2 gap-2.5 sm:gap-4"
      >
        
        {/* CARD 1: مبلغ الإيداع (DEPOSIT AMOUNT CARD - CLEAN & CLUTTER-FREE) */}
        <div
          id="hero-deposit-amount-card"
          onClick={() => {
            soundEngine.playClick();
            onOpenDeposit();
          }}
          className="group relative overflow-hidden rounded-2xl sm:rounded-3xl p-3 sm:p-4.5 bg-[#100E14] border border-orange-500/35 hover:border-orange-500 shadow-md shadow-orange-500/5 hover:shadow-orange-500/15 transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

          {/* Header: Icon + Title + "+ إيداع" Action Button */}
          <div className="relative z-10 flex items-center justify-between gap-1 pb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-orange-400/60 bg-orange-500/10 flex items-center justify-center text-[#FF6B00] shrink-0">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs sm:text-sm font-black text-white tracking-tight">
                مبلغ الإيداع
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                soundEngine.playClick();
                onOpenDeposit();
              }}
              className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#FF6B00] hover:bg-orange-400 text-black font-black text-[10px] sm:text-xs tracking-tight shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
            >
              + إيداع
            </button>
          </div>

          {/* Amount: Net USDT only, clean without any filler text */}
          <div className="relative z-10 py-1 sm:py-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-black text-[#FF6B00] font-mono">USDT</span>
              <span className="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-orange-400 tracking-tight">
                {totalDepositedAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: إجمالي الرصيد (TOTAL WITHDRAWABLE BALANCE CARD) */}
        <div
          id="hero-total-balance-card"
          onClick={() => {
            soundEngine.playClick();
            onOpenWithdraw();
          }}
          className="group relative overflow-hidden rounded-2xl sm:rounded-3xl p-3 sm:p-4.5 bg-[#0C1018] border border-cyan-500/35 hover:border-cyan-500 shadow-md shadow-cyan-500/5 hover:shadow-cyan-500/15 transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

          {/* Header: Icon + Title + "سحب" Action Button */}
          <div className="relative z-10 flex items-center justify-between gap-1 pb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-cyan-400/60 bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs sm:text-sm font-black text-white tracking-tight">
                إجمالي الرصيد
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                soundEngine.playClick();
                onOpenWithdraw();
              }}
              className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[10px] sm:text-xs tracking-tight shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
            >
              سحب
            </button>
          </div>

          {/* Amount: USDT 0.00 */}
          <div className="relative z-10 py-1 sm:py-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-black text-cyan-400 font-mono">USDT</span>
              <span className="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-cyan-400 tracking-tight">
                {withdrawableAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. GRID LAYOUT OPTIONS: 4 PRO ELEGANT & WIDE BUTTONS (إثبات السحب - مركز الدعم - مجتمع VIP - الفريق والإحالة) */}
      <div 
        id="quick-features-grid"
        className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3"
      >
        
        {/* BUTTON 1: إثبات السحب (WITHDRAWAL PROOFS) */}
        <button
          id="feature-btn-proofs"
          onClick={handleOpenProofs}
          className="group relative overflow-hidden rounded-2xl p-3 sm:p-3.5 bg-[#0D1017] hover:bg-[#131822] border border-amber-500/25 hover:border-amber-400 shadow-md hover:shadow-amber-500/10 transition-all duration-200 text-right cursor-pointer flex items-center gap-2.5 active:scale-98"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-amber-400/40 bg-amber-400/10 flex items-center justify-center text-amber-400 group-hover:scale-105 group-hover:bg-amber-400/20 transition-all shrink-0 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-black text-white tracking-tight group-hover:text-amber-300 transition-colors">
              إثبات السحب
            </span>
            <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium truncate">
              سحوبات مباشرة موثقة
            </span>
          </div>
        </button>

        {/* BUTTON 2: مركز الدعم (SUPPORT CENTER) */}
        <button
          id="feature-btn-support"
          onClick={handleOpenSupport}
          className="group relative overflow-hidden rounded-2xl p-3 sm:p-3.5 bg-[#0D1017] hover:bg-[#131822] border border-pink-500/25 hover:border-pink-400 shadow-md hover:shadow-pink-500/10 transition-all duration-200 text-right cursor-pointer flex items-center gap-2.5 active:scale-98"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-pink-500/40 bg-pink-500/10 flex items-center justify-center text-pink-400 group-hover:scale-105 group-hover:bg-pink-500/20 transition-all shrink-0 shadow-sm">
            <Headphones className="w-5 h-5 text-pink-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-black text-white tracking-tight group-hover:text-pink-300 transition-colors">
              مركز الدعم
            </span>
            <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium truncate">
              خدمة عملاء 24/7
            </span>
          </div>
        </button>

        {/* BUTTON 3: مجتمع VIP (VIP COMMUNITY) */}
        <button
          id="feature-btn-community"
          onClick={handleOpenCommunity}
          className="group relative overflow-hidden rounded-2xl p-3 sm:p-3.5 bg-[#0D1017] hover:bg-[#131822] border border-teal-500/25 hover:border-teal-400 shadow-md hover:shadow-teal-500/10 transition-all duration-200 text-right cursor-pointer flex items-center gap-2.5 active:scale-98"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-teal-400/40 bg-teal-400/10 flex items-center justify-center text-teal-300 group-hover:scale-105 group-hover:bg-teal-400/20 transition-all shrink-0 shadow-sm">
            <Crown className="w-5 h-5 text-teal-300" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-black text-white tracking-tight group-hover:text-teal-200 transition-colors">
              مجتمع VIP
            </span>
            <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium truncate">
              قنوات التلغرام الرسمية
            </span>
          </div>
        </button>

        {/* BUTTON 4: الفريق والإحالة (TEAM & REFERRAL) */}
        <button
          id="feature-btn-referral"
          onClick={handleOpenReferralAction}
          className="group relative overflow-hidden rounded-2xl p-3 sm:p-3.5 bg-[#0D1017] hover:bg-[#131822] border border-purple-500/25 hover:border-purple-400 shadow-md hover:shadow-purple-500/10 transition-all duration-200 text-right cursor-pointer flex items-center gap-2.5 active:scale-98"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-purple-500/40 bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-105 group-hover:bg-purple-500/20 transition-all shrink-0 shadow-sm">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-black text-white tracking-tight group-hover:text-purple-300 transition-colors">
              الفريق والإحالة
            </span>
            <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium truncate">
              عمولات تصل إلى 10%
            </span>
          </div>
        </button>

        {/* BUTTON: تثبيت وتنزيل التطبيق (PWA INSTALLATION) */}
        <button
          id="feature-btn-download-app"
          onClick={() => {
            soundEngine.playClick();
            setIsDownloadModalOpen(true);
          }}
          className="col-span-2 sm:col-span-4 group relative overflow-hidden rounded-2xl p-3 sm:p-3.5 bg-gradient-to-r from-[#1E1107] via-[#140D0B] to-[#0A0D15] hover:from-[#261509] hover:to-[#0f1422] border border-[#FF6B00]/40 hover:border-[#FF6B00] shadow-md hover:shadow-orange-500/20 transition-all duration-200 text-right cursor-pointer flex items-center justify-between gap-3 active:scale-98"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-[#FF6B00]/50 bg-[#FF6B00]/15 flex items-center justify-center text-[#FF6B00] group-hover:scale-105 group-hover:bg-[#FF6B00]/25 transition-all shrink-0 shadow-sm">
              <Download className="w-5 h-5 text-[#FF6B00]" />
            </div>
            <div className="flex flex-col min-w-0 text-right">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-white tracking-tight group-hover:text-amber-300 transition-colors">
                  تثبيت التطبيق
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/40 font-mono">
                  PWA
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium truncate">
                تنزيل التطبيق للشاشة الرئيسية
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-[#FF6B00] shrink-0">
            <span>تثبيت</span>
            <Download className="w-4 h-4 text-[#FF6B00]" />
          </div>
        </button>

      </div>

      {/* Proofs Modal */}
      <WithdrawalProofsModal
        isOpen={isProofsModalOpen}
        onClose={() => setIsProofsModalOpen(false)}
      />

      {/* Support & Community Modal */}
      <SupportCommunityModal
        isOpen={isSupportModalOpen}
        initialTab={supportInitialTab}
        onClose={() => setIsSupportModalOpen(false)}
      />

      {/* Download & Install App (PWA) Modal */}
      <DownloadAppModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        onShowToast={onShowToast}
      />

    </div>
  );
});
