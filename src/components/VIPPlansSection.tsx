import React, { useRef, useState } from 'react';
import { 
  Crown, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Zap, 
  Lock,
  Cpu,
  User,
  Film,
  Activity,
  Play,
  Flame,
  ShieldCheck,
  Percent,
  Gift,
  CreditCard
} from 'lucide-react';
import { VIPPlan } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { soundEngine } from '../utils/audio';
import { formatUSDT } from '../utils/formatters';

interface VIPPlansSectionProps {
  plans: VIPPlan[];
  currentVipLevel: number;
  isLoading?: boolean;
  onSelectPlanToUnlock: (plan: VIPPlan) => void;
  onActivateFreeVip1?: () => void;
  onOpenDepositForLockedTier?: (plan: VIPPlan) => void;
  onSubscribePlan?: (plan: VIPPlan) => void;
  onOpenDeposit?: () => void;
}

/**
 * Shimmer-style Skeleton for VIP Plans Section
 * Provides instantaneous visual structure and feedback during data hydration.
 */
export const VIPPlansSkeleton: React.FC = React.memo(() => {
  const { t, language } = useLanguage();
  return (
    <section id="vip-plans-skeleton-section" className="w-full space-y-5 animate-pulse">
      {/* Section Header Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500/30 to-amber-400/20 p-0.5 shrink-0 animate-shimmer-sweep">
            <div className="w-full h-full rounded-[14px] bg-[#120B06] flex items-center justify-center">
              <Crown className="w-5 h-5 text-orange-500/40" />
            </div>
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-6 w-32 sm:w-44 rounded-lg bg-white/10 animate-shimmer-sweep" />
              <div className="h-5 w-20 rounded-full bg-orange-500/10 border border-orange-500/20" />
            </div>
            <div className="h-3.5 w-48 sm:w-64 rounded bg-white/5 animate-shimmer-sweep" />
          </div>
        </div>

        {/* Deposit Button & Controls Skeleton */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-9 sm:h-10 w-28 sm:w-36 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 border border-orange-500/30 animate-shimmer-sweep" />
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/5" />
            <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/5" />
          </div>
        </div>
      </div>

      {/* Grid of 4 Shimmer Cards matching VIP 1, 2, 3, 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 w-full pt-1">
        {[1, 2, 3, 4].map((tier) => (
          <div
            key={tier}
            className="w-full max-w-[360px] sm:max-w-none mx-auto rounded-2xl p-3 sm:p-4 flex flex-col justify-between bg-[#0F1118] border border-white/10 relative overflow-hidden space-y-4 shadow-xl shadow-black/40 animate-shimmer-sweep"
          >
            {/* Top row: VIP tier label skeleton & daily income badge skeleton */}
            <div className="flex items-start justify-between gap-2 relative z-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-16 bg-white/15 rounded-md" />
                  <div className="h-4 w-12 bg-white/5 rounded" />
                </div>
                <div className="h-3 w-24 bg-white/5 rounded" />
              </div>
              <div className="h-6 w-20 rounded-full bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
                <div className="h-2.5 w-12 bg-orange-400/40 rounded" />
              </div>
            </div>

            {/* Media Area Skeleton with subtle aspect ratio and sweep */}
            <div className="w-full h-44 sm:h-48 rounded-xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2 shadow-inner">
                <Sparkles className="w-5 h-5 text-orange-400/30" />
              </div>
              <div className="h-3 w-28 bg-white/10 rounded-full" />
              <div className="h-2.5 w-20 bg-white/5 rounded-full mt-1.5" />
            </div>

            {/* 3-Tab Pill Switcher Skeleton */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/50 rounded-xl border border-white/5">
              <div className="h-7 rounded-lg bg-orange-500/20 border border-orange-500/30" />
              <div className="h-7 rounded-lg bg-white/5" />
              <div className="h-7 rounded-lg bg-white/5" />
            </div>

            {/* 4 Stats Grid Skeleton */}
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((statIndex) => (
                <div key={statIndex} className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 space-y-1.5">
                  <div className="h-2.5 w-12 bg-white/10 rounded" />
                  <div className="h-4 w-16 bg-white/20 rounded" />
                </div>
              ))}
            </div>

            {/* CTA Buttons Skeleton */}
            <div className="space-y-2 pt-1 relative z-10">
              <div className="h-10 sm:h-11 w-full rounded-xl bg-gradient-to-r from-orange-500/30 via-amber-500/25 to-orange-500/30 border border-orange-500/40 shadow-md shadow-orange-500/10" />
              <div className="h-8 w-full rounded-xl bg-white/5 border border-white/5" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

export const VIPPlansSection: React.FC<VIPPlansSectionProps> = React.memo(({
  plans,
  currentVipLevel,
  isLoading = false,
  onSelectPlanToUnlock,
  onActivateFreeVip1,
  onOpenDepositForLockedTier,
  onSubscribePlan,
  onOpenDeposit,
}) => {
  const { t, language } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Track selected media view per VIP card: 'partner' | 'equipment' | 'video'
  const [selectedMediaTabs, setSelectedMediaTabs] = useState<Record<string, 'partner' | 'equipment' | 'video'>>({});
  const isExecutingActionRef = useRef<boolean>(false);

  // Show shimmer skeleton while data hydrates or if plans are not yet populated
  if (isLoading || !plans || plans.length === 0) {
    return <VIPPlansSkeleton />;
  }

  const getActiveTab = (planId: string): 'partner' | 'equipment' | 'video' => {
    return selectedMediaTabs[planId] || 'partner';
  };

  const setActiveTab = (planId: string, tab: 'partner' | 'equipment' | 'video') => {
    soundEngine.playClick();
    setSelectedMediaTabs(prev => ({ ...prev, [planId]: tab }));
  };

  const handleLockedTierClick = (plan: VIPPlan) => {
    if (isExecutingActionRef.current) return;
    isExecutingActionRef.current = true;
    setTimeout(() => {
      isExecutingActionRef.current = false;
    }, 200);

    soundEngine.playClick();
    if (plan.level === 1 && currentVipLevel === 0) {
      if (onActivateFreeVip1) {
        onActivateFreeVip1();
      } else if (onSubscribePlan) {
        onSubscribePlan(plan);
      } else {
        onSelectPlanToUnlock(plan);
      }
    } else {
      if (onSubscribePlan) {
        onSubscribePlan(plan);
      } else {
        onSelectPlanToUnlock(plan);
      }
    }
  };

  const scrollLeft = () => {
    soundEngine.playClick();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -360, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    soundEngine.playClick();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 360, behavior: 'smooth' });
    }
  };

  return (
    <section id="vip-plans-section" className="w-full space-y-5">
      {/* Section Header with Title, Badge, and Scroll Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 p-0.5 shadow-lg shadow-orange-500/20 shrink-0">
            <div className="w-full h-full rounded-[14px] bg-[#120B06] flex items-center justify-center">
              <Crown className="w-6 h-6 text-[#FF6B00] animate-pulse" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-2 sm:gap-3">
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-none">
                {t('vip.title')}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-[#FF6B00]/15 text-[#FF9E40] border border-[#FF6B00]/35 shrink-0 leading-none shadow-sm shadow-orange-500/10">
                <Flame className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
                <span className="whitespace-nowrap">{t('vip.badge')}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1.5 leading-relaxed truncate sm:whitespace-normal">
              {t('vip.subtitle')}
            </p>
          </div>
        </div>

        {/* Actions & Carousel controls */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenDeposit && (
            <button
              id="vip-plans-header-deposit-btn"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (isExecutingActionRef.current) return;
                isExecutingActionRef.current = true;
                setTimeout(() => {
                  isExecutingActionRef.current = false;
                }, 1000);
                soundEngine.playClick();
                onOpenDeposit();
              }}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#FF6B00] via-amber-500 to-orange-500 text-black font-black text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-orange-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <CreditCard className="w-4 h-4 text-black shrink-0" />
              <span>{language === 'ar' ? 'شحن رصيد الإيداع' : 'Deposit Funds'}</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2">
            <button
              id="vip-scroll-left-btn"
              onClick={scrollLeft}
              aria-label="Scroll VIP plans left"
              className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 hover:border-orange-500/40 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              id="vip-scroll-right-btn"
              onClick={scrollRight}
              aria-label="Scroll VIP plans right"
              className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 hover:border-orange-500/40 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Container: Full-Width Stacked on Mobile, 2-Cols on Tablet, 4-Cols on Desktop */}
      <div
        ref={scrollContainerRef}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 w-full pt-1"
      >
        {plans.map((plan) => {
          const isCurrentPlan = plan.level === currentVipLevel;
          const isUnlockedPast = plan.level < currentVipLevel;
          const activeTab = getActiveTab(plan.id);

          // Card borders and glows
          let borderClass = 'border border-white/15 hover:border-white/30';
          if (plan.level === 1) {
            borderClass = 'border border-orange-500/40 shadow-xl shadow-orange-500/10 hover:border-orange-500/70';
          } else if (plan.level === 2) {
            borderClass = 'border border-cyan-400/50 shadow-xl shadow-cyan-400/15 hover:border-cyan-400/80';
          } else if (plan.level === 3) {
            borderClass = 'border border-yellow-400/60 shadow-xl shadow-yellow-400/20 hover:border-yellow-400/90';
          } else if (plan.level === 4) {
            borderClass = 'border-2 border-orange-500 shadow-2xl shadow-orange-500/30';
          }

          if (isCurrentPlan) {
            borderClass += ' ring-2 ring-[#FF6B00] ring-offset-2 ring-offset-black';
          }

          // Active 4K Media Asset based on user selection
          const currentMediaUrl = activeTab === 'partner' 
            ? plan.characterImageUrl 
            : activeTab === 'equipment' 
            ? plan.equipmentImageUrl 
            : plan.videoAdPreviewUrl;

          const currentMediaBadge = activeTab === 'partner'
            ? (language === 'ar' ? plan.characterNameAr : plan.characterName)
            : activeTab === 'equipment'
            ? (language === 'ar' ? plan.equipmentNameAr : plan.equipmentName)
            : (language === 'ar' ? plan.videoAdTitleAr : plan.videoAdTitle);

          const currentMediaSub = activeTab === 'partner'
            ? (language === 'ar' ? plan.characterRoleAr : plan.characterRole)
            : activeTab === 'equipment'
            ? plan.equipmentPower
            : plan.sponsorBrand;

            return (
            <div
              key={plan.id}
              id={`vip-card-${plan.level}`}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('button')) {
                  return;
                }
                if (!isCurrentPlan && !isUnlockedPast) {
                  handleLockedTierClick(plan);
                }
              }}
              className={`vip-card w-full max-w-[360px] sm:max-w-none mx-auto rounded-2xl p-3 sm:p-4 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden bg-[#0F1118] ${borderClass} ${
                !isCurrentPlan && !isUnlockedPast ? 'cursor-pointer hover:border-orange-500/80 hover:shadow-2xl hover:shadow-orange-500/20' : ''
              }`}
            >
              {/* 1. Full 4K Background Photo with Dark Cinematic Glass Gradient */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <img
                  src={plan.bgImageUrl}
                  alt="VIP Card Background"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-700 opacity-20 filter blur-[1px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D13] via-[#0D0F17]/95 to-[#0B0D13]/85" />
                {/* Diagonal Holographic Shine Sweep Effect */}
                <div className="absolute -inset-full w-[200%] h-[200%] bg-gradient-to-r from-transparent via-white/5 to-transparent -rotate-45 group-hover:animate-shine pointer-events-none" />
              </div>

              {/* Status Ribbons */}
              <div className="relative z-10">
                {isCurrentPlan && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#FF6B00] to-amber-500 text-black font-black text-[9px] tracking-wider uppercase shadow-lg shadow-orange-500/40 flex items-center gap-1.5 animate-pulse">
                    <Sparkles className="w-2.5 h-2.5 text-black" />
                    <span>{t('vip.current_plan_badge')}</span>
                  </div>
                )}

                {plan.popularTag && !isCurrentPlan && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#00A3FF]/20 text-[#00A3FF] border border-[#00A3FF]/50 font-black text-[9px] tracking-wider uppercase shadow-md backdrop-blur-md">
                    {plan.level === 1 ? t('vip.best_for_beginners') : plan.level === 2 ? t('vip.most_popular') : plan.level === 3 ? t('vip.high_yield') : t('vip.max_profit')}
                  </div>
                )}

                {/* Card Title Bar */}
                <div className="flex items-start justify-between gap-2 mt-0.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                        {language === 'ar' ? `المستوى ${plan.level}` : `TIER ${plan.level}`}
                      </span>
                    </div>

                    <h3 className="font-black text-lg text-white tracking-tight mt-0.5">
                      {t(`vip.tier_${plan.level}_name`) !== `vip.tier_${plan.level}_name` 
                        ? t(`vip.tier_${plan.level}_name`) 
                        : plan.name}
                    </h3>
                    <p className="text-[11px] text-gray-300 font-medium">
                      {t(`vip.tier_${plan.level}_sub`) !== `vip.tier_${plan.level}_sub` 
                        ? t(`vip.tier_${plan.level}_sub`) 
                        : plan.title}
                    </p>
                  </div>

                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${plan.badgeColor} p-0.5 shadow-md flex items-center justify-center shrink-0`}>
                    <div className="w-full h-full rounded-[10px] bg-black/60 backdrop-blur-md flex items-center justify-center">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* 2. Interactive 4K Media Showcase Hub (Edge-to-Edge Compact Banner) */}
                <div className="mt-2.5 rounded-xl overflow-hidden border border-white/10 bg-black/60 shadow-md relative">
                  
                  {/* Media Mode Tabs */}
                  <div className="grid grid-cols-3 p-1 bg-black/80 border-b border-white/10 text-[9px] sm:text-[10px] font-bold gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab(plan.id, 'partner');
                      }}
                      className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        activeTab === 'partner'
                          ? 'bg-[#FF6B00] text-black shadow-sm font-black'
                          : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <Percent className="w-3 h-3 shrink-0" />
                      <span className="truncate">{t('vip.tab_partner')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab(plan.id, 'equipment');
                      }}
                      className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        activeTab === 'equipment'
                          ? 'bg-[#00A3FF] text-black shadow-sm font-black'
                          : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <Cpu className="w-3 h-3 shrink-0" />
                      <span className="truncate">{t('vip.tab_equipment')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab(plan.id, 'video');
                      }}
                      className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        activeTab === 'video'
                          ? 'bg-amber-400 text-black shadow-sm font-black'
                          : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <Film className="w-3 h-3 shrink-0" />
                      <span className="truncate">{t('vip.tab_video_ad')}</span>
                    </button>
                  </div>

                  {/* 4K Landscape Banner Display - Compact height */}
                  <div className="relative h-36 sm:h-40 md:h-44 w-full overflow-hidden group/media bg-[#0F1118] block">
                    <img
                      src={currentMediaUrl}
                      alt={currentMediaBadge}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('vip1_banner.jpg')) {
                          target.src = '/images/vip1_banner.jpg';
                        }
                      }}
                      className="w-full h-full object-cover object-center group-hover/media:scale-105 transition-transform duration-700 block"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 pointer-events-none" />

                    {/* AI Video Launch Play Overlay if in video tab */}
                    {activeTab === 'video' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="relative flex items-center justify-center">
                          <span className="absolute w-10 h-10 rounded-full bg-amber-400/30 animate-ping" />
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 p-0.5 shadow-lg shadow-orange-500/50 flex items-center justify-center">
                            <div className="w-full h-full rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center">
                              <Play className="w-4 h-4 text-amber-300 fill-amber-300 ms-0.5" />
                            </div>
                          </div>
                        </div>
                        <span className="mt-1 px-2 py-0.5 rounded-full bg-black/80 text-[8px] font-black text-amber-300 border border-amber-400/40 tracking-wider uppercase backdrop-blur-md">
                          4K PROMO STREAM
                        </span>
                      </div>
                    )}

                    {/* Top Badges (Only show on non-VIP 1 or with clean styling for VIP 1) */}
                    {plan.level !== 1 && (
                      <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
                        <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[9px] font-bold text-white border border-white/20 flex items-center gap-1 shadow-sm">
                          {activeTab === 'partner' ? (
                            <>
                              <Percent className="w-2.5 h-2.5 text-[#FF6B00]" />
                              <span>{language === 'ar' ? 'إعلانات تجارية' : 'Commercial Ads'}</span>
                            </>
                          ) : activeTab === 'equipment' ? (
                            <>
                              <Cpu className="w-2.5 h-2.5 text-[#00A3FF]" />
                              <span>{language === 'ar' ? 'خصم استثماري %' : 'Discount Promo %'}</span>
                            </>
                          ) : (
                            <>
                              <Film className="w-2.5 h-2.5 text-amber-400" />
                              <span>{language === 'ar' ? 'بث الأرباح المباشر' : 'USD Cash Flow'}</span>
                            </>
                          )}
                        </span>

                        {/* Equalizer / Heartbeat pulse badge */}
                        <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[9px] font-black text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                          <div className="flex items-end gap-0.5 h-2">
                            <span className="w-0.5 h-1 bg-emerald-400 rounded-full animate-bounce" />
                            <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-bounce delay-75" />
                            <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-150" />
                          </div>
                          <span className="text-[8px] tracking-wide">4K ULTRA HD</span>
                        </span>
                      </div>
                    )}

                    {/* Bottom Media Title & Subtitle: Hidden for VIP 1 to preserve pure crispness of the banner */}
                    {plan.level !== 1 && (
                      <div className="absolute bottom-2 inset-x-2 text-start pointer-events-none bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 rounded-lg backdrop-blur-[2px]">
                        <p className="text-[11px] sm:text-xs font-black text-white line-clamp-1 drop-shadow-md">
                          {currentMediaBadge}
                        </p>
                        <p className="text-[9px] text-amber-300 font-mono line-clamp-1 font-semibold mt-0.5">
                          {currentMediaSub}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Living Heartbeat & Node Status Pulse Strip */}
                <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-blue-500/10 border border-orange-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-orange-500/20 flex items-center justify-center text-[#FF6B00]">
                      <Activity className="w-3 h-3" />
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold text-white block uppercase tracking-wider">
                        {t('vip.live_heartbeat')}
                      </span>
                      <span className="text-[8px] text-gray-400">
                        {plan.tasksPerDay} {t('vip.tasks_day_label')} • {formatUSDT(plan.rewardPerTaskUSDT)} USDT
                      </span>
                    </div>
                  </div>

                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-black border border-emerald-500/30">
                    {language === 'ar' ? 'نشط 24/7' : '24/7 Active'}
                  </span>
                </div>

                {/* Key Metrics: Daily Cap & Estimated Monthly Income */}
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  <div className="p-2 rounded-xl bg-black/50 border border-white/10 backdrop-blur-md">
                    <span className="text-[8px] font-bold text-gray-400 block uppercase tracking-wider">
                      {t('vip.daily_cap')}
                    </span>
                    <span className="text-sm sm:text-base font-black font-mono text-emerald-400">
                      +${formatUSDT(plan.dailyIncomeUSDT)}
                    </span>
                    <span className="text-[8px] text-gray-500 block">{language === 'ar' ? 'USDT / يومياً' : 'USDT / day'}</span>
                  </div>

                  <div className="p-2 rounded-xl bg-black/50 border border-white/10 backdrop-blur-md">
                    <span className="text-[8px] font-bold text-gray-400 block uppercase tracking-wider">
                      {t('vip.monthly_est')}
                    </span>
                    <span className="text-sm sm:text-base font-black font-mono text-[#00A3FF]">
                      +${formatUSDT(plan.monthlyIncomeUSDT)}
                    </span>
                    <span className="text-[8px] text-gray-500 block">{language === 'ar' ? 'USDT / شهرياً' : 'USDT / mo'}</span>
                  </div>
                </div>

                {/* Perks Checklist */}
                <div className="mt-2 space-y-1 text-xs bg-black/30 p-2 rounded-xl border border-white/5">
                  {plan.perks.slice(0, 3).map((perk, idx) => {
                    const perkKey = `vip.tier_${plan.level}_perk_${idx}`;
                    const translatedPerk = t(perkKey);
                    const displayPerk = translatedPerk !== perkKey ? translatedPerk : perk;
                    return (
                      <div key={idx} className="flex items-center gap-1.5 text-gray-300 leading-snug">
                        <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                          <Check className="w-1.5 h-1.5 text-emerald-400 stroke-[3]" />
                        </div>
                        <span className="text-[10px] font-medium">{displayPerk}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <div className="relative z-10 mt-2.5 pt-2 border-t border-white/10">
                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#00A3FF] to-blue-600 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-default shadow-md shadow-cyan-500/30"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    <span>{t('vip.active_plan')}</span>
                  </button>
                ) : isUnlockedPast ? (
                  <button
                    disabled
                    className="w-full py-2.5 sm:py-3 rounded-xl bg-white/5 text-gray-500 border border-white/5 text-[11px] sm:text-xs font-bold cursor-not-allowed uppercase flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-gray-500" />
                    <span>{t('vip.completed_tier')}</span>
                  </button>
                ) : (
                  <button
                    id={`vip-unlock-btn-${plan.level}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleLockedTierClick(plan);
                    }}
                    className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#FF6B00] via-amber-500 to-[#FF8533] hover:from-[#ff7a1a] hover:to-[#FFA04D] text-black text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-md shadow-orange-500/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-orange-500/50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-black" />
                    <span>
                      {plan.level === 1 && currentVipLevel === 0
                        ? (language === 'ar' ? 'اشترك الآن مجاناً (0.00 USDT)' : 'Subscribe Now Free (0.00 USDT)')
                        : (language === 'ar' ? `اشترك الآن • $${formatUSDT(plan.priceUSDT)}` : `Subscribe Now • $${formatUSDT(plan.priceUSDT)}`)}
                    </span>
                  </button>
                )}

                {/* Instant Deposit Shortcut for Plan */}
                {!isCurrentPlan && !isUnlockedPast && plan.priceUSDT > 0 && (
                  <button
                    id={`vip-deposit-shortcut-${plan.level}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (isExecutingActionRef.current) return;
                      isExecutingActionRef.current = true;
                      setTimeout(() => {
                        isExecutingActionRef.current = false;
                      }, 1000);
                      soundEngine.playClick();
                      if (onOpenDepositForLockedTier) {
                        onOpenDepositForLockedTier(plan);
                      } else if (onOpenDeposit) {
                        onOpenDeposit();
                      }
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-[#FF9E40] border border-orange-500/30 text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span>{language === 'ar' ? `إيداع لشراء ${plan.name}` : `Deposit to buy ${plan.name}`}</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
});


