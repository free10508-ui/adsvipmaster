import React from 'react';
import { 
  X, 
  Crown, 
  Check, 
  Sparkles, 
  ArrowRight,
  Cpu,
  User,
  Activity,
  Play,
  Percent,
  Gift
} from 'lucide-react';
import { VIPPlan } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { formatUSDT } from '../../utils/formatters';

interface VIPUpgradeModalProps {
  plan: VIPPlan | null;
  currentBalance: number;
  onClose: () => void;
  onConfirmUpgrade: (plan: VIPPlan) => void;
  onOpenDeposit: () => void;
}

export const VIPUpgradeModal: React.FC<VIPUpgradeModalProps> = ({
  plan,
  currentBalance,
  onClose,
  onConfirmUpgrade,
  onOpenDeposit,
}) => {
  const { t, language } = useLanguage();
  if (!plan) return null;

  const hasEnoughBalance = currentBalance >= plan.priceUSDT;
  const shortfall = Math.max(0, plan.priceUSDT - currentBalance);

  const planName = t(`vip.tier_${plan.level}_name`) !== `vip.tier_${plan.level}_name`
    ? t(`vip.tier_${plan.level}_name`)
    : plan.name;

  const planTitle = t(`vip.tier_${plan.level}_sub`) !== `vip.tier_${plan.level}_sub`
    ? t(`vip.tier_${plan.level}_sub`)
    : plan.title;

  const characterName = language === 'ar' ? plan.characterNameAr : plan.characterName;
  const characterRole = language === 'ar' ? plan.characterRoleAr : plan.characterRole;
  const equipmentName = language === 'ar' ? plan.equipmentNameAr : plan.equipmentName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="vip-upgrade-modal"
        className="w-full max-w-lg rounded-3xl p-6 border border-orange-500/30 shadow-2xl relative text-white max-h-[92vh] overflow-y-auto custom-scrollbar bg-[#0E1017]"
      >
        {/* Full 4K Background Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl pointer-events-none">
          <img
            src={plan.bgImageUrl}
            alt="VIP Upgrade Background"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-20 filter blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0E1017]/80 via-[#0E1017]/95 to-[#0A0B10]" />
        </div>

        {/* Close Button */}
        <button
          id="vip-upgrade-close-btn"
          onClick={onClose}
          className="absolute top-5 end-5 z-20 w-9 h-9 rounded-2xl bg-black/60 border border-white/15 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer shadow-md"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="relative z-10 flex items-center gap-3.5 pb-4 border-b border-white/10">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-amber-400 p-0.5 shadow-lg shadow-orange-500/25 flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[14px] bg-black/60 flex items-center justify-center">
              <Crown className="w-7 h-7 text-[#FF6B00] animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white">
                {t('modal.vip.title', { name: planName })}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/40">
                Tier {plan.level}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {t('modal.vip.subtitle', { title: planTitle })}
            </p>
          </div>
        </div>

        {/* Visual Showcase: 3D Promo Graphic & 3D Discount Engine */}
        <div className="relative z-10 grid grid-cols-2 gap-3 mt-4">
          {/* 3D Promo Emblem Card */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-black/80 to-[#0e1017] relative group">
            <div className="h-32 w-full overflow-hidden relative flex items-center justify-center p-2">
              <img
                src={plan.characterImageUrl}
                alt={characterName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
              />
              <div className="absolute top-2 start-2 px-2 py-0.5 rounded bg-black/80 text-[9px] font-black text-[#FF6B00] border border-[#FF6B00]/30 flex items-center gap-1 shadow-md">
                <Percent className="w-2.5 h-2.5" />
                <span>3D Promo Icon</span>
              </div>
            </div>
            <div className="p-2 text-start bg-black/40 border-t border-white/5">
              <p className="text-xs font-black text-white line-clamp-1">{characterName}</p>
              <p className="text-[10px] text-amber-400 font-mono line-clamp-1">{characterRole}</p>
            </div>
          </div>

          {/* 3D Discount Engine Card */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-black/80 to-[#0e1017] relative group">
            <div className="h-32 w-full overflow-hidden relative flex items-center justify-center p-2">
              <img
                src={plan.equipmentImageUrl}
                alt={equipmentName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
              />
              <div className="absolute top-2 start-2 px-2 py-0.5 rounded bg-black/80 text-[9px] font-black text-[#00A3FF] border border-[#00A3FF]/30 flex items-center gap-1 shadow-md">
                <Cpu className="w-2.5 h-2.5" />
                <span>Discount Core</span>
              </div>
            </div>
            <div className="p-2 text-start bg-black/40 border-t border-white/5">
              <p className="text-xs font-black text-white line-clamp-1">{equipmentName}</p>
              <p className="text-[10px] text-cyan-400 font-mono line-clamp-1 font-bold">{plan.equipmentPower}</p>
            </div>
          </div>
        </div>

        {/* 3D Promo Premiere Banner */}
        <div className="relative z-10 mt-3 rounded-2xl overflow-hidden border border-amber-500/30 bg-black/80 group">
          <div className="h-24 w-full relative overflow-hidden flex items-center justify-center bg-black/60">
            <img
              src={plan.videoAdPreviewUrl}
              alt="3D Promo Showcase"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain object-center p-1 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-between px-3.5">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-9 h-9 rounded-full bg-amber-400/30 animate-ping" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 p-0.5 flex items-center justify-center shadow-lg shadow-orange-500/40">
                    <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 text-amber-300 fill-amber-300 ms-0.5" />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Gift className="w-2.5 h-2.5" />
                      Promo 3D
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                      HD 4K
                    </span>
                  </div>
                  <p className="text-xs font-black text-white line-clamp-1 mt-0.5">
                    {language === 'ar' ? plan.videoAdTitleAr : plan.videoAdTitle}
                  </p>
                </div>
              </div>

              <span className="px-2 py-1 rounded-lg bg-black/80 border border-white/10 text-[9px] font-mono text-gray-300">
                {plan.sponsorBrand}
              </span>
            </div>
          </div>
        </div>

        {/* Living Heartbeat Pulse Indicator */}
        <div className="relative z-10 mt-3.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-blue-500/15 border border-orange-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-orange-500/20 flex items-center justify-center text-[#FF6B00] animate-heartbeat">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-white block">
                {t('vip.live_heartbeat')}
              </span>
              <span className="text-[10px] text-gray-300">
                {plan.tasksPerDay} {t('vip.tasks_day_label')} • +${formatUSDT(plan.rewardPerTaskUSDT)}/ad • +${formatUSDT(plan.dailyIncomeUSDT)} USDT/day
              </span>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Active</span>
          </span>
        </div>

        {/* Tier Price & Daily Income Matrix */}
        <div className="relative z-10 grid grid-cols-2 gap-3 mt-3.5">
          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              {t('modal.vip.tier_cost')}
            </span>
            <span className="text-2xl font-black font-mono text-white">
              ${formatUSDT(plan.priceUSDT)}
            </span>
            <span className="text-[10px] text-gray-500 block">USDT</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              {t('modal.vip.daily_earnings')}
            </span>
            <span className="text-2xl font-black font-mono text-emerald-400">
              +${formatUSDT(plan.dailyIncomeUSDT)}
            </span>
            <span className="text-[10px] text-gray-500 block">USDT / day</span>
          </div>
        </div>

        {/* Perks Checklist */}
        <div className="relative z-10 mt-3.5 p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2.5 backdrop-blur-md">
          <span className="text-xs font-extrabold text-gray-200 uppercase tracking-wide block">
            {t('modal.vip.perks_title')}
          </span>
          {plan.perks.map((perk, i) => {
            const perkKey = `vip.tier_${plan.level}_perk_${i}`;
            const translatedPerk = t(perkKey);
            const displayPerk = translatedPerk !== perkKey ? translatedPerk : perk;
            return (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-200">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                </div>
                <span>{displayPerk}</span>
              </div>
            );
          })}
        </div>

        {/* Wallet Balance Check */}
        <div className="relative z-10 mt-3.5 p-3 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between text-xs backdrop-blur-md">
          <span className="text-gray-400 font-medium">{t('modal.vip.your_balance')}</span>
          <span className={`font-mono font-bold text-sm ${hasEnoughBalance ? 'text-emerald-400' : 'text-[#FF6B00]'}`}>
            ${formatUSDT(currentBalance)} USDT
          </span>
        </div>

        {/* Action Button */}
        <div className="relative z-10 mt-4 space-y-2">
          {hasEnoughBalance ? (
            <button
              id="confirm-vip-upgrade-btn"
              onClick={() => onConfirmUpgrade(plan)}
              className="w-full py-3.5 px-5 rounded-2xl font-black text-xs uppercase tracking-wider text-black bg-gradient-to-r from-[#FF6B00] to-amber-400 hover:from-[#ff7a1a] hover:to-amber-500 shadow-xl shadow-orange-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>{t('modal.vip.confirm_upgrade', { price: formatUSDT(plan.priceUSDT) })}</span>
            </button>
          ) : (
            <div className="space-y-2">
              <button
                id="vip-insufficient-deposit-btn"
                onClick={() => {
                  onClose();
                  onOpenDeposit();
                }}
                className="w-full py-3.5 px-5 rounded-2xl font-black text-xs uppercase tracking-wider text-black bg-gradient-to-r from-[#FF6B00] to-amber-400 hover:from-[#ff7a1a] hover:to-amber-500 shadow-xl shadow-orange-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('modal.vip.deposit_shortfall', { shortfall: formatUSDT(shortfall) })}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-center text-gray-400">
                {t('modal.vip.shortfall_note', { shortfall: formatUSDT(shortfall), name: planName })}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
