import React from 'react';
import { ExternalLink, Sparkles, Flame, Gift, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DIRECT_AD_URL } from '../data/initialData';
import { soundEngine } from '../utils/audio';
import { CachedImage } from './CachedImage';

interface SponsorAdBannerCardProps {
  title?: string;
  subtitle?: string;
  sponsorName?: string;
  imageUrl?: string;
  badge?: string;
  rewardBonusUSDT?: number;
  adUrl?: string;
  variant?: 'orange' | 'blue' | 'emerald' | 'purple';
}

export const SponsorAdBannerCard: React.FC<SponsorAdBannerCardProps> = ({
  title,
  subtitle,
  sponsorName = 'VIPADS Crypto Network',
  imageUrl = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1600&h=600&q=95',
  badge,
  rewardBonusUSDT = 0.10,
  adUrl = DIRECT_AD_URL,
  variant = 'orange'
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const defaultTitle = isArabic
    ? 'عروض الرعاة الرسميين: مكافأة تسجيل وإيداع مضاعفة'
    : 'Featured Sponsor Campaign: Double Staking & Task Booster';

  const defaultSubtitle = isArabic
    ? 'شاهد الإعلان المميز واحصل على بونص فوري يُضاف لرصيد حسابك مع سحب مباشر'
    : 'Engage with top-tier Web3 sponsors to unlock extra dividend rewards.';

  const defaultBadge = isArabic ? 'إعلان راعي حصري ⭐' : 'SPONSORED AD ⭐';

  const colorClasses = {
    orange: {
      border: 'border-[#FF6B00]/40 hover:border-[#FF6B00]',
      badge: 'bg-[#FF6B00]/20 text-[#FF6B00] border-[#FF6B00]/40',
      btn: 'bg-[#FF6B00] hover:bg-[#ff7a1a] text-black shadow-[#FF6B00]/30',
      glow: '#FF6B00'
    },
    blue: {
      border: 'border-[#00A3FF]/40 hover:border-[#00A3FF]',
      badge: 'bg-[#00A3FF]/20 text-[#00A3FF] border-[#00A3FF]/40',
      btn: 'bg-[#00A3FF] hover:bg-[#38BDF8] text-black shadow-[#00A3FF]/30',
      glow: '#00A3FF'
    },
    emerald: {
      border: 'border-emerald-500/40 hover:border-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      btn: 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/30',
      glow: '#10B981'
    },
    purple: {
      border: 'border-purple-500/40 hover:border-purple-400',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      btn: 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/30',
      glow: '#8B5CF6'
    }
  }[variant];

  const handleClick = () => {
    soundEngine.playClick();
    window.open(adUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      onClick={handleClick}
      className={`relative overflow-hidden rounded-3xl border ${colorClasses.border} bg-[#0A0C13] shadow-xl p-5 sm:p-6 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5`}
    >
      {/* Background Graphic Image with Glowing Blend */}
      <div className="absolute inset-0 z-0">
        <CachedImage 
          src={imageUrl} 
          alt={title || defaultTitle}
          className="w-full h-full object-cover opacity-25 group-hover:opacity-40 scale-100 group-hover:scale-105 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0C13] via-[#0A0C13]/90 to-transparent z-10" />
        <div 
          className="absolute -bottom-16 -right-16 w-52 h-52 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: colorClasses.glow }}
        />
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div className="space-y-2 max-w-xl text-start">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${colorClasses.badge} flex items-center gap-1`}>
              <Flame className="w-3 h-3" />
              <span>{badge || defaultBadge}</span>
            </span>
            <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#FF6B00]" />
              <span>{sponsorName}</span>
            </span>
            {rewardBonusUSDT > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20">
                +{rewardBonusUSDT.toFixed(2)} USDT
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-black text-white group-hover:text-amber-200 transition-colors leading-snug">
            {title || defaultTitle}
          </h3>

          <p className="text-xs text-gray-400 leading-relaxed">
            {subtitle || defaultSubtitle}
          </p>
        </div>

        {/* CTA Button */}
        <div className="shrink-0 flex items-center">
          <button 
            type="button"
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md ${colorClasses.btn} cursor-pointer transition-transform group-hover:scale-105`}
          >
            <span>{isArabic ? 'فتح الإعلان' : 'Visit Sponsor'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
