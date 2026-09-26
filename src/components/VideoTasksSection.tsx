import React, { useState, useEffect } from 'react';
import { 
  Play, 
  CheckCircle2, 
  Coins, 
  Zap, 
  TrendingUp, 
  ShieldCheck, 
  Send, 
  Layers, 
  Cpu, 
  BarChart3, 
  ExternalLink, 
  Lock, 
  Flame, 
  Award, 
  Sparkles, 
  Clock,
  Eye
} from 'lucide-react';
import { VideoTask, VIPPlan } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatUSDT } from '../utils/formatters';
import { DailyTaskCountdownClock } from './DailyTaskCountdownClock';
import { TaskPreviewModal } from './Modals/TaskPreviewModal';

interface VideoTasksSectionProps {
  tasks: VideoTask[];
  currentVipPlan: VIPPlan;
  tasksCompletedToday: number;
  activeTimers: Record<string, number>; // taskId -> seconds remaining (10 to 0)
  vipExpiresAt?: number;
  userBalance?: number;
  totalDepositedUSDT?: number;
  isMasterAdmin?: boolean;
  isLoading?: boolean;
  onWatchAndEarn: (task: VideoTask) => void;
  onOpenVIPUpgrade: () => void;
  onOpenVipLockWarning?: () => void;
  onOpenCenterActivation?: () => void;
  onVip1CapReached?: () => void;
}

// Icon helper
const getTaskIcon = (iconName: string) => {
  switch (iconName) {
    case 'Coins': return <Coins className="w-5 h-5 text-amber-400" />;
    case 'Zap': return <Zap className="w-5 h-5 text-cyan-400" />;
    case 'TrendingUp': return <TrendingUp className="w-5 h-5 text-emerald-400" />;
    case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-blue-400" />;
    case 'Send': return <Send className="w-5 h-5 text-sky-400" />;
    case 'Layers': return <Layers className="w-5 h-5 text-purple-400" />;
    case 'Cpu': return <Cpu className="w-5 h-5 text-orange-400" />;
    case 'BarChart3': return <BarChart3 className="w-5 h-5 text-pink-400" />;
    default: return <Play className="w-5 h-5 text-orange-400" />;
  }
};

// Isolated Countdown Timer to prevent re-rendering the whole tasks section every second
const VipCountdownBadge: React.FC<{ expiry: number }> = React.memo(({ expiry }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const diff = Math.max(0, expiry - now);
  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return <span>{`${pad(h)}:${pad(m)}:${pad(s)}`}</span>;
});

/**
 * Shimmer-style Skeleton for Video Tasks Section
 * Displays cyber-styled cards, quota bar, and filter placeholders during hydration.
 */
export const VideoTasksSkeleton: React.FC = React.memo(() => {
  const { t, language } = useLanguage();
  return (
    <section id="video-tasks-skeleton-section" className="w-full space-y-4 animate-pulse">
      {/* 1. Today's Tasks Quota Banner Skeleton */}
      <div className="w-full p-4 sm:p-5 rounded-3xl border border-orange-500/25 bg-gradient-to-b from-[#141722]/95 via-[#0E1019]/95 to-[#080A10]/98 relative overflow-hidden space-y-4 shadow-xl shadow-black/60 animate-shimmer-sweep">
        {/* VIP Membership Banner Skeleton */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-orange-600/10 border border-orange-500/30 flex items-center justify-between gap-3 flex-wrap relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-orange-400/40" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-4 sm:h-5 w-32 sm:w-44 bg-white/20 rounded-md" />
                <div className="h-4 w-16 bg-white/10 rounded-full" />
              </div>
              <div className="h-3 w-40 bg-white/10 rounded" />
            </div>
          </div>
          <div className="h-6 w-24 bg-black/60 rounded-xl border border-white/5" />
        </div>

        {/* 4 Stats Grid Blocks Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          {[
            { label: 'المهام المتبقية', color: 'orange' },
            { label: 'الربح اليومي الصافي', color: 'emerald' },
            { label: 'ربح الإعلان الواحد', color: 'cyan' },
            { label: 'نسبة الإنجاز', color: 'amber' }
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 sm:p-4 rounded-[16px] bg-[#161B29]/90 border border-white/5 flex flex-col justify-between space-y-2 relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-gray-400">
                <div className="h-3 w-16 bg-white/10 rounded" />
                <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/5" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <div className="h-6 w-14 bg-white/20 rounded" />
                <div className="h-4 w-8 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar Skeleton */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-36 bg-white/10 rounded" />
            <div className="h-3.5 w-20 bg-white/10 rounded" />
          </div>
          <div className="w-full h-2.5 sm:h-3 rounded-full bg-black/80 border border-white/15 overflow-hidden p-0.5">
            <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-orange-500/40 via-amber-400/40 to-emerald-400/40" />
          </div>
        </div>
      </div>

      {/* 2. Title & Category Filter Tabs Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0">
            <Play className="w-5 h-5 text-orange-500/40" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-6 w-32 bg-white/20 rounded-md" />
              <div className="h-5 w-24 bg-blue-500/10 rounded-full border border-blue-500/20" />
            </div>
            <div className="h-3.5 w-48 bg-white/10 rounded" />
          </div>
        </div>

        {/* Category Pills Skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[1, 2, 3, 4, 5].map((c) => (
            <div key={c} className="h-8 w-20 sm:w-24 rounded-xl bg-white/5 border border-white/5 shrink-0" />
          ))}
        </div>
      </div>

      {/* 3. Task Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((cardIdx) => (
          <div
            key={cardIdx}
            className="p-4 pt-5 rounded-2xl bg-[#0F1118] border border-white/10 flex flex-col items-center justify-between space-y-4 relative overflow-hidden animate-shimmer-sweep"
          >
            {/* Top row: Category tag & Duration */}
            <div className="w-full flex items-center justify-between gap-2">
              <div className="h-5 w-20 bg-white/10 rounded-full" />
              <div className="h-5 w-14 bg-white/5 rounded-full" />
            </div>

            {/* Thumbnail Preview Area with Center Play Button Skeleton */}
            <div className="w-full h-32 sm:h-36 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-center relative overflow-hidden">
              <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shadow-lg">
                <Play className="w-5 h-5 text-gray-500/40 ml-0.5" />
              </div>
            </div>

            {/* Title & Sponsor line */}
            <div className="w-full space-y-1.5 text-center">
              <div className="h-4 w-3/4 mx-auto bg-white/15 rounded" />
              <div className="h-3 w-1/2 mx-auto bg-white/5 rounded" />
            </div>

            {/* Reward Pill */}
            <div className="h-8 w-32 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <div className="h-3 w-20 bg-emerald-400/30 rounded" />
            </div>

            {/* CTA Button Skeleton */}
            <div className="w-full h-10 rounded-xl bg-gradient-to-r from-orange-500/30 via-amber-500/25 to-orange-500/30 border border-orange-500/40 shadow-sm" />
          </div>
        ))}
      </div>
    </section>
  );
});

export const VideoTasksSection: React.FC<VideoTasksSectionProps> = React.memo(({
  tasks,
  currentVipPlan,
  tasksCompletedToday,
  activeTimers,
  vipExpiresAt,
  userBalance = 0,
  totalDepositedUSDT = 0,
  isMasterAdmin = false,
  isLoading = false,
  onWatchAndEarn,
  onOpenVIPUpgrade,
  onOpenVipLockWarning,
  onOpenCenterActivation,
  onVip1CapReached,
}) => {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [previewTask, setPreviewTask] = useState<VideoTask | null>(null);

  // Show shimmer skeleton while data hydrates or if tasks are not yet loaded
  if (isLoading || !tasks || tasks.length === 0) {
    return <VideoTasksSkeleton />;
  }

  // Strict UI Constraint: Hide sync card and counter from free VIP 1, active exclusively for recharged accounts
  const isRechargedAccount = (totalDepositedUSDT > 0) || (currentVipPlan?.level || 0) > 1 || isMasterAdmin;

  const isVipLocked = !currentVipPlan || currentVipPlan.level < 1;

  // STRICT INTEGER ENFORCEMENT: Guaranteed integer task bounds (starts 10 down to 0)
  const maxDailyTasks = Math.max(1, Math.floor(currentVipPlan?.tasksPerDay || 10));
  const safeCompletedToday = Math.min(maxDailyTasks, Math.max(0, Math.floor(Number(tasksCompletedToday) || 0)));
  const remainingTasks = Math.max(0, maxDailyTasks - safeCompletedToday);
  // Strict clean percentage in 10% steps (0%, 10%, 20%, ..., 100%)
  const progressPercent = Math.min(100, Math.max(0, Math.round((safeCompletedToday / maxDailyTasks) * 100)));
  const isLimitReached = safeCompletedToday >= maxDailyTasks;

  const handleLockTrigger = () => {
    if (onOpenCenterActivation) {
      onOpenCenterActivation();
    } else if (onOpenVipLockWarning) {
      onOpenVipLockWarning();
    } else {
      onOpenVIPUpgrade();
    }
  };

  const categories = [
    { id: 'All', label: t('tasks.cat_all') },
    { id: 'DeFi & Staking', label: t('tasks.cat_defi') },
    { id: 'Exchange Ads', label: t('tasks.cat_exchanges') },
    { id: 'Layer 1 Tech', label: t('tasks.cat_tech') },
    { id: 'Web3 Wallet', label: t('tasks.cat_wallets') }
  ];

  const filteredTasks = tasks.filter(task => {
    if (selectedCategory === 'All') return true;
    return task.category === selectedCategory;
  });

  return (
    <section id="video-tasks-section" className="w-full space-y-4">
      {/* Premium 24-Hour Task Reset Countdown (العداد التنازلي والمزامنة) - حصرياً للحسابات الشاحنة ومخفي عن VIP 1 المجاني */}
      {isRechargedAccount && (
        <DailyTaskCountdownClock />
      )}

      {/* 1. Prominent Today's Tasks & Decremental Remaining Counter Card (Modern Cyberpunk & Luxury Dark UI) */}
      <div 
        id="tasks-quota-counter-card"
        className="w-full p-4 sm:p-5 rounded-3xl border border-orange-500/35 bg-gradient-to-b from-[#141722]/95 via-[#0E1019]/95 to-[#080A10]/98 relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(255,107,0,0.12)] space-y-4 backdrop-blur-xl"
      >
        <div className="absolute top-0 right-0 w-72 h-36 bg-[#FF6B00]/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-36 bg-amber-500/8 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-[#00FF88]/5 rounded-full blur-3xl pointer-events-none" />

        {/* VIP 1 Membership Banner (Premium Luxury Gradient & Warm Golden Borders) */}
        <div 
          id="vip-membership-header-card"
          className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#FF6B00]/25 via-amber-500/20 to-orange-600/15 border border-orange-500/50 shadow-[0_4px_25px_rgba(255,107,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.15)] flex items-center justify-between gap-3 flex-wrap relative overflow-hidden backdrop-blur-md"
        >
          {/* Subtle Ambient Sheen */}
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />

          {/* Right: Tier Badge & Plan Info */}
          <div className="flex items-center gap-3 relative z-10 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-[#FF6B00] to-amber-500 p-0.5 shadow-[0_0_16px_rgba(255,107,0,0.45)] flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0D0F17] rounded-[14px] flex items-center justify-center">
                {isVipLocked ? (
                  <Lock className="w-5 h-5 text-amber-400" />
                ) : (
                  <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                )}
              </div>
            </div>

            <div className="flex flex-col min-w-0 text-right">
              {isVipLocked ? (
                <span className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>تتطلب تفعيل VIP 1 أولاً</span>
                </span>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-300 tracking-tight drop-shadow-sm">
                      {t(`vip.tier_${currentVipPlan.level}_name`) !== `vip.tier_${currentVipPlan.level}_name`
                        ? t(`vip.tier_${currentVipPlan.level}_name`)
                        : currentVipPlan.name}
                      {' - '}
                      {t(`vip.tier_${currentVipPlan.level}_sub`) !== `vip.tier_${currentVipPlan.level}_sub`
                        ? t(`vip.tier_${currentVipPlan.level}_sub`)
                        : currentVipPlan.title}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/60 border border-amber-400/40 text-amber-300 font-black font-mono">
                      (${currentVipPlan.priceUSDT ? currentVipPlan.priceUSDT.toFixed(2) : '0.00'})
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-amber-200/80 font-medium">
                    عضوية مفعلة • أرباح يومية معتمدة
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Left: Status Badges (Completed / Expiry Countdown) */}
          <div className="flex items-center gap-2 relative z-10">
            {!isVipLocked && isLimitReached && (
              <span className="text-xs px-3 py-1 rounded-xl bg-emerald-500/20 text-[#00FF88] border border-emerald-500/40 font-black flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,255,136,0.3)]">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                <span>{t('tasks.completed')}</span>
              </span>
            )}

            {!isVipLocked && vipExpiresAt && (
              <span className="text-[11px] px-3 py-1 rounded-xl bg-black/70 text-amber-300 border border-orange-500/40 font-mono font-bold flex items-center gap-1.5 shadow-sm backdrop-blur-sm">
                <Clock className="w-3.5 h-3.5 text-[#FF6B00] animate-spin" />
                <VipCountdownBadge expiry={vipExpiresAt} />
              </span>
            )}
          </div>
        </div>

        {/* 4 Luxury Cyberpunk Glassmorphic Grid Stats Blocks (Border-radius: 16px & Warm Neon Glow) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Block 1: المهام المتبقية */}
          <div 
            id="stats-block-remaining-tasks"
            className="p-3 sm:p-4 rounded-[16px] bg-gradient-to-b from-[#161B29]/90 via-[#10131E]/92 to-[#0B0D16]/98 border border-orange-500/35 hover:border-orange-500/60 shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_18px_rgba(255,107,0,0.12)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.7),0_0_25px_rgba(255,107,0,0.22)] transition-all flex flex-col justify-between relative overflow-hidden group backdrop-blur-md"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between text-gray-400 mb-2 relative z-10">
              <span className="text-[11px] sm:text-xs font-bold text-gray-300">المهام المتبقية</span>
              <div className="w-7 h-7 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-[#FF7A00] shadow-[0_0_10px_rgba(255,122,0,0.3)] shrink-0">
                <Coins className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 relative z-10" dir="ltr">
              <span className="text-xl sm:text-2xl font-black font-mono text-[#FF8A00] drop-shadow-[0_0_10px_rgba(255,138,0,0.4)]">
                {isVipLocked ? 0 : remainingTasks}
              </span>
              <span className="text-xs font-black text-gray-400 font-mono">
                / {maxDailyTasks}
              </span>
            </div>
          </div>

          {/* Block 2: الربح اليومي الصافي (Bold Bright Neon Green USDT 0.90) */}
          <div 
            id="stats-block-daily-income"
            className="p-3 sm:p-4 rounded-[16px] bg-gradient-to-b from-[#161B29]/90 via-[#10131E]/92 to-[#0B0D16]/98 border border-emerald-500/35 hover:border-emerald-500/60 shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_18px_rgba(0,255,136,0.12)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.7),0_0_25px_rgba(0,255,136,0.22)] transition-all flex flex-col justify-between relative overflow-hidden group backdrop-blur-md"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between text-gray-400 mb-2 relative z-10">
              <span className="text-[11px] sm:text-xs font-bold text-gray-300">الربح اليومي الصافي</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[#00FF88] shadow-[0_0_10px_rgba(0,255,136,0.3)] shrink-0">
                <TrendingUp className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 relative z-10" dir="ltr">
              <span className="text-xs sm:text-sm font-black text-[#00FF88]/90 font-mono tracking-tight">
                USDT
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-[#00FF88] drop-shadow-[0_0_12px_rgba(0,255,136,0.6)]">
                {isVipLocked ? '0.00' : formatUSDT(currentVipPlan.level === 1 ? 0.90 : currentVipPlan.dailyIncomeUSDT)}
              </span>
            </div>
          </div>

          {/* Block 3: ربح الإعلان الواحد (Bright Neon Cyan USDT 0.09) */}
          <div 
            id="stats-block-ad-reward"
            className="p-3 sm:p-4 rounded-[16px] bg-gradient-to-b from-[#161B29]/90 via-[#10131E]/92 to-[#0B0D16]/98 border border-cyan-500/35 hover:border-cyan-500/60 shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_18px_rgba(0,229,255,0.12)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.7),0_0_25px_rgba(0,229,255,0.22)] transition-all flex flex-col justify-between relative overflow-hidden group backdrop-blur-md"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between text-gray-400 mb-2 relative z-10">
              <span className="text-[11px] sm:text-xs font-bold text-gray-300">ربح الإعلان الواحد</span>
              <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.3)] shrink-0">
                <Sparkles className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 relative z-10" dir="ltr">
              <span className="text-xs sm:text-sm font-black text-[#00E5FF]/90 font-mono tracking-tight">
                USDT
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-[#00E5FF] drop-shadow-[0_0_12px_rgba(0,229,255,0.6)]">
                {isVipLocked ? '0.00' : formatUSDT(currentVipPlan.level === 1 ? 0.09 : currentVipPlan.rewardPerTaskUSDT)}
              </span>
            </div>
          </div>

          {/* Block 4: نسبة الإنجاز */}
          <div 
            id="stats-block-progress-percent"
            className="p-3 sm:p-4 rounded-[16px] bg-gradient-to-b from-[#161B29]/90 via-[#10131E]/92 to-[#0B0D16]/98 border border-amber-500/35 hover:border-amber-500/60 shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_18px_rgba(251,191,36,0.12)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.7),0_0_25px_rgba(251,191,36,0.22)] transition-all flex flex-col justify-between relative overflow-hidden group backdrop-blur-md"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between text-gray-400 mb-2 relative z-10">
              <span className="text-[11px] sm:text-xs font-bold text-gray-300">نسبة الإنجاز</span>
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)] shrink-0">
                <Zap className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 relative z-10" dir="ltr">
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                {isVipLocked ? 0 : progressPercent}%
              </span>
              <span className="text-[11px] font-black text-amber-200/80">مكتمل</span>
            </div>
          </div>
        </div>

        {/* Dynamic Smooth Gradient Progress Bar (شريط إنجاز المهام اليومية المتدرج والواضح) */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-300">
            <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 animate-pulse" />
              <span>شريط إنجاز المهام اليومية</span>
            </span>
            <div className="font-mono font-bold text-xs sm:text-sm flex items-center gap-1.5" dir="ltr">
              <span className="text-gray-400 font-semibold">({isVipLocked ? 0 : progressPercent}%)</span>
              <span className="text-white font-black">
                <span className="text-[#FF7A00] drop-shadow-[0_0_8px_rgba(255,122,0,0.5)]">{isVipLocked ? 0 : safeCompletedToday}</span>
                <span className="text-gray-400 mx-1">/</span>
                <span>{maxDailyTasks}</span>
              </span>
            </div>
          </div>
          <div className="w-full h-2.5 sm:h-3 rounded-full bg-black/80 border border-white/15 overflow-hidden p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] via-amber-400 to-[#00FF88] shadow-[0_0_14px_rgba(255,107,0,0.6)] transition-all duration-700 relative overflow-hidden"
              style={{ width: `${isVipLocked ? 0 : Math.max(3, progressPercent)}%` }}
            >
              {/* Sleek light gleam on active progress */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. VIP 0 LOCKED STATE BANNER */}
      {isVipLocked ? (
        <div 
          id="tasks-locked-vip-guard"
          className="p-8 sm:p-10 rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-[#16120C] via-[#0E0F14] to-[#07080C] text-center space-y-5 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-xl shadow-amber-500/20 flex items-center justify-center animate-bounce duration-1000">
            <div className="w-full h-full bg-[#0A0B10] rounded-[22px] flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          <div className="max-w-lg mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {t('tasks.locked_vip1_required')}
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              {t('tasks.locked_vip1_desc')}
            </p>
          </div>

          <div className="pt-2">
            <button
              id="tasks-unlock-vip1-now-btn"
              onClick={handleLockTrigger}
              className="inline-flex items-center justify-center gap-2 py-4 px-8 rounded-2xl bg-gradient-to-r from-[#FF6B00] via-amber-400 to-orange-500 hover:from-[#ff7a1a] hover:via-amber-300 hover:to-orange-400 text-black font-black text-sm uppercase tracking-wider shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 active:scale-95 transition-all cursor-pointer group"
            >
              <Sparkles className="w-4 h-4 text-black group-hover:rotate-12 transition-transform" />
              <span>{t('tasks.activate_vip1_btn')}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Section Title & Category Filtering Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shadow-lg shadow-orange-500/10">
                <Play className="w-5 h-5 text-[#FF6B00] fill-[#FF6B00]/20" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {t('tasks.title')}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-[#00A3FF] border border-blue-500/30 flex items-center gap-1">
                    <Award className="w-3 h-3 text-[#FF6B00]" />
                    <span>{language === 'ar' ? 'إعلانات 10 ثوانٍ' : '10s Ads'}</span>
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                  {t('tasks.subtitle')}
                </p>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  id={`task-filter-${(cat.id || '').toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#FF6B00] text-black font-bold shadow-md shadow-orange-500/20'
                      : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Video Ad Task Cards Grid (Fluid Multi-Column Scaling Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 w-full">
            {filteredTasks.map((task) => {
              const isTimerActive = activeTimers[task.id] !== undefined;
              const secondsRemaining = isTimerActive ? activeTimers[task.id] : 10;
              const isCompleted = task.completedToday;
              const isLockedByVip = task.requiredVipLevel > currentVipPlan.level;

              // Dynamic Net Reward Display according to user's active VIP Tier (0.09 USDT for VIP 1, 0.204 USDT for VIP 2)
              const singleReward = currentVipPlan.level === 1 ? 0.09 : currentVipPlan.rewardPerTaskUSDT;
              const rewardDisplay = `+${formatUSDT(singleReward)} USDT`;

              // SVG Circle calculation for countdown loader (radius = 32, circumference = 2 * PI * 32 ≈ 201)
              const radius = 32;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - ((10 - secondsRemaining) / 10) * circumference;

              const isAvailable = !isCompleted && !isLockedByVip && !isLimitReached && !isTimerActive;

              return (
                <div
                  key={task.id}
                  id={`task-card-${task.id}`}
                  className={`task-card ${
                    task.id === 'task-1' || (task.sponsor || '').toLowerCase().includes('binance')
                      ? 'video-task-card-binance'
                      : ''
                  } p-4 pt-5 rounded-2xl flex flex-col items-center justify-between transition-all duration-500 ease-out relative overflow-hidden group ${
                    isTimerActive
                      ? 'border-2 border-[#FF6B00] shadow-2xl shadow-orange-500/20 bg-orange-500/5 ring-2 ring-orange-500/30 ring-offset-2 ring-offset-black'
                      : isCompleted
                      ? 'border border-emerald-500/30 opacity-90'
                      : isLockedByVip
                      ? 'border border-white/5 opacity-75'
                      : isAvailable
                      ? 'border border-orange-500/30 hover:border-[#FF6B00]/70 hover:shadow-xl hover:shadow-orange-500/10'
                      : 'border border-white/5 hover:border-[#00A3FF]/40'
                  }`}
                >
                  {/* Subtle Top Daily Progress Bar (Animates and fills smoothly as user completes daily tasks) */}
                  <div 
                    className="absolute top-0 inset-x-0 h-1 bg-white/[0.06] overflow-hidden pointer-events-none z-10"
                    title={`${safeCompletedToday}/${maxDailyTasks} (${progressPercent}%)`}
                  >
                    <div
                      className={`h-full transition-all duration-700 ease-out ${
                        isLimitReached
                          ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-[#00FF87] shadow-[0_0_8px_rgba(0,255,135,0.8)]'
                          : safeCompletedToday > 0
                          ? 'bg-gradient-to-r from-[#FF6B00] via-amber-400 to-[#FF9500] shadow-[0_0_8px_rgba(255,107,0,0.7)]'
                          : 'bg-transparent'
                      }`}
                      style={{
                        width: `${progressPercent}%`,
                      }}
                    />
                    {/* Subtle moving shimmer ray across filled segment */}
                    {progressPercent > 0 && (
                      <div 
                        className="absolute inset-y-0 h-full w-12 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-pulse pointer-events-none"
                        style={{
                          left: `calc(${Math.max(0, progressPercent - 8)}% - 24px)`,
                        }}
                      />
                    )}
                  </div>

                  {/* Internal Layout Container */}
                  <div className="w-full flex flex-col items-center">
                    {/* Thumbnail Image with Direct Watch Action */}
                    <div 
                      dir="ltr"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (task.completedToday || isCompleted) return;
                        if (isLockedByVip) {
                          onOpenVIPUpgrade();
                          return;
                        }
                        if (isTimerActive) return;
                        onWatchAndEarn(task);
                      }}
                      className="relative w-full h-32 sm:h-36 rounded-xl overflow-hidden mb-3 bg-black/80 border border-white/10 hover:border-[#FF6B00]/60 shadow-md cursor-pointer group/thumb touch-manipulation select-none active:scale-[0.98] transition-transform"
                    >
                      <img 
                        src={task.thumbnailUrl || 'https://image.tmdb.org/t/p/w1280/i7CsYZtB0iK9Td1Ub4EQoCZ3ZP5.jpg'} 
                        alt={task.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300 opacity-90 group-hover/thumb:opacity-100 select-none"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                      
                      {/* Top badges on thumbnail */}
                      <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
                        <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-extrabold text-white border border-white/10 flex items-center gap-1">
                          <Play className="w-2.5 h-2.5 text-[#FF6B00] fill-[#FF6B00]" />
                          <span>{t('tasks.duration', { sec: task.durationSeconds })}</span>
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold text-gray-300 border border-white/10 font-mono">
                          {t('tasks.views', { views: task.viewsCount })}
                        </span>
                      </div>

                      {/* Center Direct Action Badge */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="px-3.5 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-orange-500/40 text-white flex items-center gap-1.5 shadow-xl group-hover/thumb:scale-105 transition-transform">
                          {task.completedToday ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-[11px] font-black text-emerald-300">
                                {language === 'ar' ? 'مكتملة' : 'Completed'}
                              </span>
                            </>
                          ) : isLockedByVip ? (
                            <>
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-[11px] font-black text-amber-300">
                                {language === 'ar' ? 'ترقية VIP' : 'VIP Required'}
                              </span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 text-[#FF6B00] fill-[#FF6B00]" />
                              <span className="text-[11px] font-black text-white">
                                {language === 'ar' ? 'مشاهدة فوراً' : 'Watch & Earn'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Task Metadata & Title */}
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-extrabold text-[#00A3FF] flex items-center gap-1">
                          {getTaskIcon(task.iconName)}
                          <span className="truncate max-w-[130px]">
                            {t(`task.${task.id.replace('task-', '')}.sponsor`) !== `task.${task.id.replace('task-', '')}.sponsor`
                              ? t(`task.${task.id.replace('task-', '')}.sponsor`)
                              : task.sponsor}
                          </span>
                        </span>

                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-mono font-black border border-emerald-500/20">
                          {rewardDisplay}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white leading-snug line-clamp-2 min-h-[34px]">
                        {t(`task.${task.id.replace('task-', '')}.title`) !== `task.${task.id.replace('task-', '')}.title`
                          ? t(`task.${task.id.replace('task-', '')}.title`)
                          : task.title}
                      </h4>

                      {/* Tag Pills */}
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        {task.tags.map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-medium text-gray-400 border border-white/5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Button & Circular Timer Overlay */}
                  <div className="w-full mt-3 pt-3 border-t border-white/5">
                    {isTimerActive ? (
                      /* Circular Countdown Loader Overlay */
                      <div className="w-full py-2 px-3 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center gap-2 text-xs font-black text-orange-300 font-mono">
                        <div className="relative w-6 h-6 flex items-center justify-center">
                          <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 76 76">
                            <circle
                              cx="38"
                              cy="38"
                              r={radius}
                              stroke="rgba(255,107,0,0.2)"
                              strokeWidth="8"
                              fill="transparent"
                            />
                            <circle
                              cx="38"
                              cy="38"
                              r={radius}
                              stroke="#FF6B00"
                              strokeWidth="8"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                              fill="transparent"
                              className="transition-all duration-1000 ease-linear"
                            />
                          </svg>
                        </div>
                        <span className="tracking-wide">{t('tasks.watching')} ({secondsRemaining}s)</span>
                      </div>
                    ) : isCompleted ? (
                      /* Completed State */
                      <div 
                        onClick={() => setPreviewTask(task)}
                        className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs uppercase tracking-wider animate-in fade-in zoom-in-95 duration-300 shadow-sm shadow-emerald-500/10 cursor-pointer hover:bg-emerald-500/15 transition-all"
                        title={language === 'ar' ? 'انقر لمعاينة المهمة المكتملة' : 'Click to inspect completed task'}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{t('tasks.completed')}</span>
                        <Eye className="w-3.5 h-3.5 text-emerald-400/80 ms-1" />
                      </div>
                    ) : isLockedByVip ? (
                      /* Locked State */
                      <div className="flex items-center gap-2 w-full">
                        <button
                          id={`task-locked-preview-btn-${task.id}`}
                          type="button"
                          onClick={() => setPreviewTask(task)}
                          className="py-2.5 px-3 rounded-xl font-bold text-xs bg-white/5 text-gray-300 hover:text-white border border-white/10 hover:border-amber-500/30 flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                          title={language === 'ar' ? 'معاينة تفاصيل المهمة' : 'Preview Task'}
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                        <button
                          id={`task-locked-btn-${task.id}`}
                          onClick={onOpenVIPUpgrade}
                          className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-white/5 text-amber-400 border border-amber-500/30 hover:bg-white/10 flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider transition-all duration-300 active:scale-95 truncate"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{t('tasks.vip_required', { vip: task.requiredVipLevel })}</span>
                        </button>
                      </div>
                    ) : (
                      /* Prominent Action Controls: Preview Button + Watch Ads Button */
                      <div className="flex items-center gap-2 w-full">
                        {/* 1. Dedicated Task Preview Trigger Button */}
                        <button
                          id={`task-preview-action-btn-${task.id}`}
                          type="button"
                          onClick={() => setPreviewTask(task)}
                          className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/40 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95 shadow-sm"
                          title={language === 'ar' ? 'معاينة تفاصيل المهمة' : 'Preview Task Details'}
                        >
                          <Eye className="w-3.5 h-3.5 text-[#FF6B00]" />
                          <span className="text-[11px] font-extrabold text-gray-200">
                            {language === 'ar' ? 'معاينة' : 'Preview'}
                          </span>
                        </button>

                        {/* 2. Direct Watch & Earn Button with Glowing Pulse */}
                        <div className="relative group/btn flex-1 min-w-0">
                          {isAvailable && (
                            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#FF6B00] via-amber-400 to-orange-500 opacity-50 blur-sm group-hover/btn:opacity-80 transition-opacity duration-300 animate-ambient-glow -z-10" />
                          )}

                          <button
                            id={`task-watch-btn-${task.id}`}
                            onClick={() => {
                              onWatchAndEarn(task);
                            }}
                            className={`task-btn relative w-full py-2.5 px-3 bg-gradient-to-r from-[#FF6B00] via-amber-400 to-orange-500 hover:from-[#ff7a1a] hover:via-amber-300 hover:to-orange-400 text-black font-black uppercase tracking-wider rounded-xl text-xs shadow-lg transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 overflow-hidden ${
                              isAvailable ? 'animate-glow-pulse' : 'shadow-orange-500/20'
                            }`}
                          >
                            <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shine pointer-events-none" />
                            <Play className="w-3.5 h-3.5 text-black fill-black shrink-0" />
                            <span className="font-black drop-shadow-sm truncate">{t('tasks.watch_earn')}</span>
                            <ExternalLink className="w-3 h-3 text-black opacity-90 shrink-0" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Rich Task Preview & Verification Modal */}
      <TaskPreviewModal
        isOpen={!!previewTask}
        task={previewTask}
        currentVipPlan={currentVipPlan}
        tasksCompletedToday={tasksCompletedToday}
        isTimerActive={previewTask ? activeTimers[previewTask.id] !== undefined : false}
        onClose={() => setPreviewTask(null)}
        onStartTask={(task) => {
          onWatchAndEarn(task);
        }}
        onOpenVIPUpgrade={onOpenVIPUpgrade}
      />
    </section>
  );
});
