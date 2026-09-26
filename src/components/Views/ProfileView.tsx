import React, { useState, useMemo } from 'react';
import { 
  User, 
  Crown, 
  Copy, 
  Check, 
  LogOut, 
  Power, 
  Shield, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Receipt, 
  Settings, 
  KeyRound, 
  ChevronLeft, 
  ChevronRight, 
  Sliders, 
  CreditCard,
  Download,
  Smartphone,
  Calendar,
  History,
  TrendingUp,
  X
} from 'lucide-react';
import { UserProfile, VIPPlan, ReferredMember, ReferralMilestone, Transaction } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { soundEngine } from '../../utils/audio';
import { storage } from '../../utils/storage';
import { FinancialRecordsModal } from '../Modals/FinancialRecordsModal';
import { AccountSettingsModal } from '../Modals/AccountSettingsModal';
import { ChangePasswordModal } from '../Modals/ChangePasswordModal';
import { DownloadAppModal } from '../Modals/DownloadAppModal';
import { TaskHistoryModal } from '../Modals/TaskHistoryModal';

interface ProfileViewProps {
  user: UserProfile;
  vipPlan: VIPPlan;
  transactions?: Transaction[];
  referredMembers?: ReferredMember[];
  milestones?: ReferralMilestone[];
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onOpenVIPUpgrade: () => void;
  onOpenAdminPanel?: () => void;
  onUpdateUser?: (updatedFields: Partial<UserProfile>) => void;
  onLogout?: () => void;
  onToggleThemeAttempt?: () => void;
  onSimulateReferral?: (newMember: ReferredMember, bonusAmount: number) => void;
  onClaimMilestone?: (milestoneId: string, bonusAmount: number) => void;
  onCopySuccess?: (type: 'code' | 'link') => void;
  onShowToast?: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'vip', amount?: number) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = React.memo(({
  user,
  vipPlan,
  transactions = [],
  referredMembers = [],
  milestones = [],
  onOpenDeposit,
  onOpenWithdraw,
  onOpenVIPUpgrade,
  onOpenAdminPanel,
  onUpdateUser,
  onLogout,
  onToggleThemeAttempt,
  onSimulateReferral,
  onClaimMilestone,
  onCopySuccess,
  onShowToast,
}) => {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';

  // Sub-modals for operational buttons
  const [showTaskHistory, setShowTaskHistory] = useState(false);
  const [showFinancialRecords, setShowFinancialRecords] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDownloadApp, setShowDownloadApp] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // User copy state
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Dynamic user email & ID resolution
  const uName = user?.username || '';
  const userEmail = user?.email || (uName.includes('@') ? uName : `${(uName || '').toLowerCase() || 'user'}@gmail.com`);
  const userId = user?.userId || 'USR-1002';

  // Strict Security Check: Show button ONLY and EXCLUSIVELY to free@gmail.com
  const currentStoredEmail = (storage.getCurrentUserEmail() || '').trim().toLowerCase();
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  const cleanUsername = (uName || '').trim().toLowerCase();
  const isAuthorizedAdmin = 
    cleanEmail === 'free@gmail.com' ||
    cleanUsername === 'free@gmail.com' ||
    cleanUsername === 'free' ||
    currentStoredEmail === 'free@gmail.com' ||
    storage.isAdminEmail(cleanEmail) ||
    storage.isAdminEmail(currentStoredEmail);

  // Strict Real-Time Balances:
  // Real User Balance tied strictly to user's Gmail account (Live Synchronized)
  const withdrawableBalance = Math.max(0, Number((user.totalBalanceUSDT || 0).toFixed(2)));

  // Real Deposit Balance tied strictly to user's account in localStorage (مبلغ الإيداع الفعلي)
  const totalRechargeUSDT = Math.max(0, Number((user.totalDepositedUSDT ?? 0).toFixed(2)));

  const copyEmail = () => {
    navigator.clipboard.writeText(userEmail);
    setCopiedEmail(true);
    soundEngine.playClick();
    if (onShowToast) {
      onShowToast(isArabic ? 'تم النسخ' : 'Copied', isArabic ? 'تم نسخ البريد الإلكتروني' : 'Email copied to clipboard', 'info');
    }
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const copyId = () => {
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    soundEngine.playClick();
    if (onShowToast) {
      onShowToast(isArabic ? 'تم النسخ' : 'Copied', isArabic ? 'تم نسخ المعرف الرقمي UID' : 'User ID copied to clipboard', 'info');
    }
    setTimeout(() => setCopiedId(false), 2000);
  };

  const vipBadgeColor = user.vipLevel > 0 
    ? 'from-[#FF6B00] via-amber-500 to-yellow-400 text-black' 
    : 'from-gray-700 to-gray-800 text-gray-300 border border-white/10';

  return (
    <div id="profile-view" className="w-full space-y-5 animate-in fade-in duration-300 pb-16" dir={isArabic ? 'rtl' : 'ltr'}>
      
      {/* 1. DYNAMIC USER DATA: Compact Real-time Profile Header Card */}
      <div 
        id="profile-user-card" 
        className="rounded-3xl p-4 sm:p-5 glass border border-amber-500/25 shadow-[0_4px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(255,107,0,0.12)] relative overflow-hidden bg-gradient-to-br from-[#121624]/90 via-[#0C0E17]/95 to-[#080A10]/95 backdrop-blur-xl"
      >
        {/* Subtle Glow ambient flare */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF6B00]/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3.5 relative z-10">
          {/* Top Line: User Avatar, Email with Copy, and Live Status */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Compact VIP Avatar */}
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6B00] via-amber-500 to-yellow-400 p-0.5 shadow-[0_0_15px_rgba(255,107,0,0.35)]">
                  <div className="w-full h-full bg-[#0B0D14] rounded-[14px] flex items-center justify-center relative overflow-hidden">
                    <User className="w-5 h-5 text-[#FF6B00]" />
                    {user.vipLevel > 0 && (
                      <div className="absolute top-1 right-1">
                        <Crown className="w-3 h-3 text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]" />
                      </div>
                    )}
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-black font-black text-[7px] font-mono border-2 border-[#0B0D14] shadow-[0_0_8px_#10B981]">
                  LIVE
                </span>
              </div>

              {/* User Email with Copy Button */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-white text-base sm:text-lg tracking-tight truncate drop-shadow-sm" title={userEmail}>
                    {userEmail}
                  </span>
                  <button
                    onClick={copyEmail}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-all cursor-pointer shrink-0 border border-white/10 active:scale-95 shadow-xs"
                    title={isArabic ? 'نسخ البريد الإلكتروني' : 'Copy Email'}
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>TRC-20</span>
                  </span>
                </div>
              </div>
            </div>

            {/* VIP Level Badge on the upper right */}
            <span className={`px-3 py-1 rounded-2xl text-xs font-black bg-gradient-to-r ${vipBadgeColor} shadow-[0_0_15px_rgba(255,107,0,0.3)] flex items-center gap-1.5 shrink-0 border border-amber-400/40`}>
              <Crown className="w-3.5 h-3.5" />
              <span>VIP {user.vipLevel}</span>
            </span>
          </div>

          {/* Bottom Controls Bar: Neatly distributed and aligned buttons (UID, Upgrade VIP, Admin) */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            {/* UID Pill with Copy */}
            <div className="flex items-center gap-1.5 bg-black/50 hover:bg-black/70 px-2.5 py-1.5 rounded-xl border border-white/10 transition-colors shrink-0">
              <span className="font-bold text-gray-400 text-[10px] uppercase tracking-wider">UID:</span>
              <span className="font-mono font-black text-amber-400 text-xs tracking-wide">{userId}</span>
              <button
                onClick={copyId}
                className="p-1 hover:text-white text-gray-400 transition-colors cursor-pointer rounded-md active:scale-90"
                title={isArabic ? 'نسخ المعرف' : 'Copy UID'}
              >
                {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            {/* Action Buttons Group (Upgrade & Admin) */}
            <div className="flex items-center gap-2 shrink-0 ms-auto">
              <button
                id="profile-upgrade-tier-btn"
                onClick={onOpenVIPUpgrade}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-black text-xs text-black bg-gradient-to-r from-[#FF6B00] via-amber-400 to-[#FF6B00] hover:brightness-110 shadow-[0_0_15px_rgba(255,107,0,0.4)] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Crown className="w-3.5 h-3.5 text-black" />
                <span>{isArabic ? 'ترقية' : 'Upgrade'}</span>
              </button>

              {isAuthorizedAdmin && onOpenAdminPanel && (
                <button
                  id="btn-admin-control-top"
                  onClick={() => {
                    soundEngine.playClick();
                    onOpenAdminPanel();
                  }}
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-bold text-xs text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-400 flex items-center gap-1.5 cursor-pointer transition-all shrink-0 active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  title={isArabic ? 'لوحة التحكم الإدارية' : 'Admin Control'}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isArabic ? 'الإدارة' : 'Control'}</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 2. REAL-TIME BALANCES: Dynamic Position Swap (Withdrawable Balance on RIGHT, Deposit Amount on LEFT in RTL) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        
        {/* المربع الأيمن في العرض العربي (Right Card): إجمالي الرصيد القابل للسحب */}
        <div 
          id="card-withdrawable-balance"
          className="rounded-3xl p-4 sm:p-5 relative overflow-hidden glass border border-emerald-500/40 bg-gradient-to-br from-[#061C14]/85 via-[#0A1412]/90 to-[#070D12]/95 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_25px_rgba(16,185,129,0.18)] flex flex-col justify-between backdrop-blur-xl group hover:border-emerald-400/60 transition-all"
        >
          {/* Neon Ambient Flare */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/25 transition-all" />

          <div className="flex items-center gap-2 sm:gap-2.5 mb-3 relative z-10">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-gray-200 leading-tight">
              {isArabic ? 'إجمالي الرصيد' : 'Total Balance'}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 sm:gap-2 relative z-10">
            <span className="text-xs sm:text-sm font-black font-mono text-emerald-300/90 tracking-wider">
              USDT
            </span>
            <span className="text-2xl sm:text-3xl md:text-4xl font-black font-mono text-[#00FF87] tracking-tight drop-shadow-[0_0_15px_rgba(0,255,135,0.65)]">
              ${withdrawableBalance.toFixed(2)}
            </span>
          </div>
        </div>

        {/* المربع الأيسر في العرض العربي (Left Card): مبلغ الإيداع */}
        <div 
          id="card-recharge-amount"
          className="rounded-3xl p-4 sm:p-5 relative overflow-hidden glass border border-[#FF6B00]/40 bg-gradient-to-br from-[#241108]/85 via-[#160D0A]/90 to-[#0C0B12]/95 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_25px_rgba(255,107,0,0.18)] flex flex-col justify-between backdrop-blur-xl group hover:border-[#FF6B00]/60 transition-all"
        >
          {/* Neon Ambient Flare */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#FF6B00]/15 rounded-full blur-2xl pointer-events-none group-hover:bg-[#FF6B00]/25 transition-all" />

          <div className="flex items-center gap-2 sm:gap-2.5 mb-3 relative z-10">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#FF6B00]/15 border border-[#FF6B00]/40 flex items-center justify-center text-[#FF6B00] shrink-0 shadow-[0_0_12px_rgba(255,107,0,0.3)]">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-gray-200 leading-tight">
              {isArabic ? 'مبلغ الإيداع' : 'Deposit Amount'}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 sm:gap-2 relative z-10">
            <span className="text-xs sm:text-sm font-black font-mono text-amber-400/90 tracking-wider">
              USDT
            </span>
            <span className="text-2xl sm:text-3xl md:text-4xl font-black font-mono text-[#FF8C00] tracking-tight drop-shadow-[0_0_15px_rgba(255,140,0,0.65)]">
              ${totalRechargeUSDT.toFixed(2)}
            </span>
          </div>
        </div>

      </div>

      {/* 2.5 7-DAY TASK HISTORY QUICK BANNER */}
      <div 
        id="profile-task-history-banner"
        onClick={() => {
          soundEngine.playClick();
          setShowTaskHistory(true);
        }}
        className="rounded-3xl p-4 sm:p-5 glass border border-amber-500/35 bg-gradient-to-r from-amber-500/15 via-[#151928]/90 to-[#0A0D18]/95 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_20px_rgba(245,158,11,0.15)] hover:border-amber-400/60 transition-all cursor-pointer group active:scale-[0.99] backdrop-blur-xl relative overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/25 to-[#FF6B00]/25 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-white">
                  {isArabic ? 'سجل إنجاز المهام وعوائد الـ 7 أيام' : '7-Day Task History & Rewards'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                  7 DAYS
                </span>
              </div>
              <span className="text-xs text-gray-300 block mt-0.5 font-medium">
                {isArabic 
                  ? 'عرض تفصيلي لمهام الفيديو المكتملة، إجمالي الأرباح اليومية وتوزيع مكافآت الرعاة' 
                  : 'View completed video ads, daily profit totals & sponsor breakdown'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex flex-col text-end">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1 justify-end">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{isArabic ? 'عرض السجل' : 'View History'}</span>
              </span>
              <span className="text-[10px] text-gray-400">
                {isArabic ? 'تحديث فوري' : 'Live analytics'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/5 group-hover:bg-amber-500/25 border border-white/10 group-hover:border-amber-500/40 flex items-center justify-center text-gray-300 group-hover:text-amber-300 transition-all shadow-sm">
              {isArabic ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          </div>
        </div>
      </div>

      {/* 3. OPERATIONAL BUTTONS: Deposit, Withdraw, Financial Records, Settings, Change Password */}
      <div className="rounded-3xl p-4 sm:p-5 glass border border-white/10 space-y-3 bg-[#0A0D15]/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between gap-2 px-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#FF6B00]" />
            <span>{isArabic ? 'العمليات وإدارة الحساب' : 'Account Operations & Management'}</span>
          </h4>

          {/* زر الإدارة السري المصغر (Shrunk Admin Toggle) - خاص بـ free@gmail.com */}
          {isAuthorizedAdmin && onOpenAdminPanel && (
            <button
              id="btn-goto-admin-dashboard"
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onOpenAdminPanel();
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-[11px] font-bold text-[#FF6B00] cursor-pointer transition-all shadow-xs active:scale-95"
              title={isArabic ? 'لوحة التحكم الإدارية' : 'Admin Control'}
            >
              <Shield className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>{isArabic ? 'الإدارة' : 'Control'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          
          {/* زر 1: تعبئة رصيد (Deposit / Recharge) */}
          <button
            id="profile-op-deposit-btn"
            type="button"
            onClick={() => {
              soundEngine.playClick();
              if (onOpenDeposit) onOpenDeposit();
            }}
            className="p-3.5 rounded-2xl bg-black/50 hover:bg-white/5 border border-white/10 hover:border-[#FF6B00]/40 text-start flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-sm active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] shrink-0 group-hover:scale-105 transition-transform">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-black text-white block">
                  {isArabic ? 'تعبئة رصيد' : 'Recharge / Deposit'}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  {isArabic ? 'شحن فوري TRC-20' : 'Instant deposit'}
                </span>
              </div>
            </div>
            <div className="text-gray-400 group-hover:text-white transition-colors">
              {isArabic ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          </button>

          {/* زر 2: سحب الأرباح (Withdraw Profits) */}
          <button
            id="profile-op-withdraw-btn"
            type="button"
            onClick={() => {
              soundEngine.playClick();
              if (onOpenWithdraw) onOpenWithdraw();
            }}
            className="p-3.5 rounded-2xl bg-black/50 hover:bg-white/5 border border-white/10 hover:border-[#00A3FF]/40 text-start flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-sm active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00A3FF]/15 border border-[#00A3FF]/30 flex items-center justify-center text-[#00A3FF] shrink-0 group-hover:scale-105 transition-transform">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-black text-white block">
                  {isArabic ? 'سحب الأرباح' : 'Withdraw Profits'}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  {isArabic ? 'تحويل فوري للمحفظة' : 'Direct payout'}
                </span>
              </div>
            </div>
            <div className="text-gray-400 group-hover:text-white transition-colors">
              {isArabic ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          </button>

          {/* زر 3: سجل المهام (Task History - 7 Days) */}
          <button
            id="profile-task-history-btn"
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShowTaskHistory(true);
            }}
            className="p-3.5 rounded-2xl bg-black/50 hover:bg-white/5 border border-white/10 hover:border-amber-500/40 text-start flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-sm active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-white block">
                    {isArabic ? 'سجل المهام' : 'Task History'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                    7D
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  {isArabic ? 'آخر 7 أيام، الأرباح وتوزيع المكافآت' : 'Last 7 days, earnings & breakdown'}
                </span>
              </div>
            </div>
            <div className="text-gray-400 group-hover:text-white transition-colors">
              {isArabic ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          </button>

          {/* زر 4: السجلات المالية (Financial Records) */}
          <button
            id="profile-financial-records-btn"
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShowFinancialRecords(true);
            }}
            className="p-3.5 rounded-2xl bg-black/50 hover:bg-white/5 border border-white/10 hover:border-emerald-500/40 text-start flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-sm active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-black text-white block">
                  {isArabic ? 'السجلات المالية' : 'Financial Records'}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  {isArabic ? 'الإيداع، السحب والمهام' : 'Transactions & history'}
                </span>
              </div>
            </div>
            <div className="text-gray-400 group-hover:text-white transition-colors">
              {isArabic ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          </button>

          {/* زر 4: إعدادات الحساب (Account Settings) */}
          <button
            id="profile-account-settings-btn"
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShowAccountSettings(true);
            }}
            className="p-3.5 rounded-2xl bg-black/50 hover:bg-white/5 border border-white/10 hover:border-white/20 text-start flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-sm active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-gray-300 shrink-0 group-hover:scale-105 transition-transform">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-black text-white block">
                  {isArabic ? 'إعدادات الحساب' : 'Account Settings'}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  {isArabic ? 'الاسم، ومحفظة TRC-20' : 'Profile & wallet info'}
                </span>
              </div>
            </div>
            <div className="text-gray-400 group-hover:text-white transition-colors">
              {isArabic ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          </button>

          {/* زر 5: تغيير كلمة المرور (Change Password) */}
          <button
            id="profile-change-password-btn"
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShowChangePassword(true);
            }}
            className="p-3.5 rounded-2xl bg-black/50 hover:bg-white/5 border border-white/10 hover:border-amber-500/40 text-start flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-sm active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-black text-white block">
                  {isArabic ? 'تغيير كلمة المرور' : 'Change Password'}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  {isArabic ? 'تحديث كلمة سر الدخول' : 'Update credentials'}
                </span>
              </div>
            </div>
            <div className="text-gray-400 group-hover:text-white transition-colors">
              {isArabic ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          </button>

          {/* زر 6: تثبيت وتنزيل التطبيق (PWA Installation) */}
          <button
            id="profile-download-app-btn"
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShowDownloadApp(true);
            }}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FF6B00]/10 via-[#0A0D14] to-[#00A3FF]/10 hover:from-[#FF6B00]/20 hover:to-[#00A3FF]/20 border border-[#FF6B00]/40 hover:border-[#FF6B00] text-start flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-md active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF6B00]/20 border border-[#FF6B00]/40 flex items-center justify-center text-[#FF6B00] shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white block group-hover:text-[#FF6B00] transition-colors">
                    {isArabic ? 'تثبيت وتنزيل التطبيق' : 'Install & Download App'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/40 font-mono">
                    PWA
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  {isArabic ? 'تشغيل ملء الشاشة على الهاتف مع أيقونة رسمية' : 'Standalone mobile app & home screen icon'}
                </span>
              </div>
            </div>
            <div className="text-[#FF6B00] group-hover:translate-x-[-2px] transition-transform">
              {isArabic ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          </button>

        </div>
      </div>

      {/* 5. FINAL PAGE BOUNDARY: LOG OUT (تسجيل الخروج) */}
      <div 
        id="profile-logout-section" 
        className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-rose-500/30 bg-gradient-to-br from-[#160D12] via-[#0F0A0E] to-[#0A0B10] shadow-xl relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <Power className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-start">
              <h4 className="text-base font-black text-white flex items-center gap-2">
                <span>{t('auth.logout')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  {userEmail}
                </span>
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                {isArabic 
                  ? 'تسجيل خروج أمني فوري من الجلسة الحالية وحماية المحفظة' 
                  : 'Instant secure logout from session & wallet protection'}
              </p>
            </div>
          </div>

          <button
            id="profile-logout-action-btn"
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShowLogoutConfirm(true);
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('auth.logout')}</span>
          </button>
        </div>
      </div>

      {/* MODAL 0: Task History Modal (Last 7 Days) */}
      <TaskHistoryModal
        isOpen={showTaskHistory}
        onClose={() => setShowTaskHistory(false)}
        userEmail={userEmail}
        vipLevel={user.vipLevel}
      />

      {/* MODAL 1: Financial Records Modal */}
      <FinancialRecordsModal
        isOpen={showFinancialRecords}
        onClose={() => setShowFinancialRecords(false)}
        transactions={transactions}
        userEmail={userEmail}
      />

      {/* MODAL 2: Account Settings Modal */}
      <AccountSettingsModal
        isOpen={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
        user={user}
        onUpdateUser={(updatedFields) => {
          if (onUpdateUser) onUpdateUser(updatedFields);
        }}
        onShowToast={(title, msg, type) => {
          if (onShowToast) onShowToast(title, msg, type);
        }}
      />

      {/* MODAL 3: Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        userEmail={userEmail}
        onShowToast={(title, msg, type) => {
          if (onShowToast) onShowToast(title, msg, type);
        }}
      />

      {/* MODAL 4: Download & Install App (PWA) Modal */}
      <DownloadAppModal
        isOpen={showDownloadApp}
        onClose={() => setShowDownloadApp(false)}
        onShowToast={(title, msg, type) => {
          if (onShowToast) onShowToast(title, msg, type);
        }}
      />

      {/* MODAL 5: Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl p-6 glass border border-rose-500/40 shadow-2xl bg-[#0F0C13] text-center space-y-4">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 mx-auto flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/20">
              <Power className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">{t('auth.logout_confirm_title')}</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                {t('auth.logout_confirm_desc')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-bold text-xs cursor-pointer transition-all"
              >
                {t('common.cancel')}
              </button>

              <button
                id="confirm-logout-btn"
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  if (onLogout) onLogout();
                }}
                className="py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-600/40 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('auth.logout')}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
});
