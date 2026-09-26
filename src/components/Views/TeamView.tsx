import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Share2, 
  Users, 
  RefreshCw, 
  DollarSign, 
  ChevronLeft, 
  ExternalLink,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  UserPlus,
  Gift,
  Radio
} from 'lucide-react';
import { UserProfile } from '../../types';
import { soundEngine } from '../../utils/audio';
import { storage } from '../../utils/storage';
import { db, getDocIdForEmail, firebaseSync } from '../../utils/firebaseSync';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFullTeamData, FullTeamData, TeamLevelData, registerReferralMember } from '../../utils/teamUtils';
import { TeamLevelDetailsModal } from '../Modals/TeamLevelDetailsModal';
import { useLanguage } from '../../context/LanguageContext';

interface TeamViewProps {
  user: UserProfile;
  onShowToast?: (title: string, message: string, type?: 'success' | 'info' | 'vip') => void;
  onCopySuccess?: (type: 'code' | 'link') => void;
  onUpdateUser?: (updatedFields: Partial<UserProfile>) => void;
}

export const TeamView: React.FC<TeamViewProps> = React.memo(({
  user,
  onShowToast,
  onCopySuccess,
  onUpdateUser,
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);
  const [smoothToastMessage, setSmoothToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedLevelForDetails, setSelectedLevelForDetails] = useState<TeamLevelData | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showClaimSuccessModal, setShowClaimSuccessModal] = useState(false);

  // Derive current user fresh data from storage for accurate pending rewards
  const currentUserData = storage.getUserByEmail(user.email || '');
  const pendingRewards = Number((currentUserData?.pending_commissions ?? currentUserData?.pendingReferralRewardsUSDT ?? user.pending_commissions ?? user.pendingReferralRewardsUSDT ?? 0).toFixed(2));

  // Live real-time pending commissions from onSnapshot listener
  const [livePending, setLivePending] = useState<number>(pendingRewards);
  const [justIncreased, setJustIncreased] = useState(false);
  const prevPendingRef = useRef(pendingRewards);

  // Derive referral code (defaults to 885101 if not set)
  const referralCode = user.referralCode || '885101';

  // Construct complete clean referral link using the live website domain so external visitors open the platform directly
  const referralLink = useMemo(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      return `${window.location.origin}?r=${referralCode}`;
    }
    return `https://vipads.pro/r/${referralCode}`;
  }, [referralCode]);

  // Reactive Full Team Data from Storage
  const teamData: FullTeamData = useMemo(() => {
    return getFullTeamData(referralCode, user.email);
  }, [referralCode, user.email, refreshTrigger]);

  // 1. Real-time Live View: onSnapshot Listener on user's account document in Firestore
  useEffect(() => {
    const cleanEmail = (user.email || storage.getCurrentUserEmail() || '').toLowerCase().trim();
    if (!cleanEmail) return;

    const docId = getDocIdForEmail(cleanEmail);
    const docRef = doc(db, 'accounts', docId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        if (!data) return;

        const remotePending = Number((data.pending_commissions ?? data.pendingReferralRewardsUSDT ?? 0).toFixed(2));

        if (remotePending > prevPendingRef.current) {
          setJustIncreased(true);
          soundEngine.playTaskRewardSound();
          setTimeout(() => setJustIncreased(false), 2200);
        }
        prevPendingRef.current = remotePending;
        setLivePending(remotePending);

        if (onUpdateUser) {
          onUpdateUser({
            pending_commissions: remotePending,
            pendingReferralRewardsUSDT: remotePending,
            totalBalanceUSDT: typeof data.totalBalanceUSDT === 'number' ? data.totalBalanceUSDT : user.totalBalanceUSDT,
            referralEarningsUSDT: typeof data.referralEarningsUSDT === 'number' ? data.referralEarningsUSDT : user.referralEarningsUSDT,
            referralCount: typeof data.referralCount === 'number' ? data.referralCount : user.referralCount,
          });
        }
      },
      (err) => {
        console.warn('[TeamView] Live pending commissions onSnapshot note:', err);
      }
    );

    return () => unsubscribe();
  }, [user.email]);

  // 2. Listen to cross-tab, local storage, and custom team events
  useEffect(() => {
    const handleStorageChange = () => {
      const fresh = storage.getUserByEmail(user.email || '');
      const val = Number((fresh?.pending_commissions ?? fresh?.pendingReferralRewardsUSDT ?? 0).toFixed(2));
      if (val > prevPendingRef.current) {
        setJustIncreased(true);
        setTimeout(() => setJustIncreased(false), 2200);
      }
      prevPendingRef.current = val;
      setLivePending(val);
      setRefreshTrigger((prev) => prev + 1);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('vipads:team_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('vipads:team_updated', handleStorageChange);
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [user.email]);

  const handleCopyCode = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(referralCode);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = referralCode;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch (e) {
      console.warn('Clipboard copy error', e);
    }
    soundEngine.playSuccess();
    setCopiedType('code');
    
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setSmoothToastMessage('تم نسخ شفرة الدعوة بنجاح');
    toastTimerRef.current = setTimeout(() => {
      setSmoothToastMessage(null);
    }, 2000);

    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyLink = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(referralLink);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = referralLink;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch (e) {
      console.warn('Clipboard copy error', e);
    }
    soundEngine.playSuccess();
    setCopiedType('link');
    
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setSmoothToastMessage('تم نسخ رابط الإحالة');
    toastTimerRef.current = setTimeout(() => {
      setSmoothToastMessage(null);
    }, 2500);

    if (onShowToast) {
      onShowToast(
        'تم نسخ رابط الإحالة',
        'تم نسخ رابط الإحالة الخاص بك بنجاح إلى الحافظة! شاركه مع أصدقائك الآن.',
        'success'
      );
    }

    if (onCopySuccess) {
      onCopySuccess('link');
    }

    setTimeout(() => setCopiedType(null), 2500);
  };

  // Fast Social Sharing Handlers
  const handleNativeShare = async () => {
    soundEngine.playClick();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'منصة VIP Crypto Ads',
          text: `انضم إلى فريقي في منصة VIP Crypto Ads وحقق أرباح USDT يومية مع كود الدعوة: ${referralCode}`,
          url: referralLink,
        });
        return;
      } catch (e) {
        // User cancelled or share failed, fallback to copy
      }
    }
    handleCopyLink();
  };

  const shareFacebook = () => {
    soundEngine.playClick();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareTwitter = () => {
    soundEngine.playClick();
    const text = `انضم إلى فريقي في منصة VIP Ads واربح USDT يومياً! كود الدعوة: ${referralCode}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareWhatsApp = () => {
    soundEngine.playClick();
    const text = `انضم إلى فريقي في منصة VIP Crypto Ads واربح USDT يومياً! سجل عبر رابطي:\n${referralLink}\nشفرة الدعوة: ${referralCode}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareTelegram = () => {
    soundEngine.playClick();
    const text = `انضم إلى فريقي في منصة VIP Crypto Ads واربح USDT يومياً! سجل عبر رابطي:\n${referralLink}\nشفرة الدعوة: ${referralCode}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Open Level Details Modal
  const openDetails = (level: TeamLevelData) => {
    soundEngine.playClick();
    setSelectedLevelForDetails(level);
  };

  // Claim Accumulated Referral Rewards via atomic Firestore Transaction (منع الـ Race Condition وتفريغ العمولات للرصيد الأساسي)
  const handleClaimRewards = async () => {
    const currentTotalPending = Math.max(livePending, pendingRewards);
    if (currentTotalPending <= 0) return;
    setIsClaiming(true);
    soundEngine.playClick();

    try {
      const result = await firebaseSync.claimCommissionsTransaction(user.email || '');
      setIsClaiming(false);
      if (result.success && result.claimedAmount > 0) {
        soundEngine.playSuccess();
        setLivePending(0);
        prevPendingRef.current = 0;
        if (onUpdateUser) {
          onUpdateUser({
            totalBalanceUSDT: result.newBalance,
            pending_commissions: 0,
            pendingReferralRewardsUSDT: 0,
            referralEarningsUSDT: Number(((user.referralEarningsUSDT || 0) + result.claimedAmount).toFixed(2)),
          });
        }
        setRefreshTrigger((prev) => prev + 1);
        setShowClaimSuccessModal(true);
      } else {
        setIsClaiming(false);
      }
    } catch (e) {
      console.warn('Claim transaction error:', e);
      setIsClaiming(false);
    }
  };

  return (
    <div id="team-referral-view" className="w-full max-w-xl mx-auto space-y-4 pb-24 animate-in fade-in duration-300" dir="rtl">
      
      {/* INTERACTIVE REFERRAL INVITATION BANNER - CLICK TO COPY REFERRAL LINK */}
      <div 
        id="referral-banner-card"
        onClick={handleCopyLink}
        className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-orange-500/35 hover:border-orange-400 shadow-xl shadow-black/60 transition-all duration-300 cursor-pointer active:scale-[0.99] select-none block w-full bg-[#0E121B]"
        title="انقر لنسخ رابط الإحالة الخاص بك"
      >
        <img
          src="https://i.ibb.co/Y4VzqFCV/Modern-Business-Trading-Investment-Facebook-Post.png"
          alt="Referral Invitation Banner"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://i.ibb.co/Kc8M3pP8/Modern-Business-Trading-Investment-Facebook-Post.png";
          }}
          className="w-full h-auto object-cover rounded-2xl sm:rounded-3xl group-hover:scale-[1.015] transition-transform duration-500"
          loading="eager"
          referrerPolicy="no-referrer"
        />

        {/* Hover / Tap Hint Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3 pointer-events-none">
          <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF6B00] to-amber-400 text-black font-black text-xs shadow-lg shadow-orange-500/30 flex items-center gap-1.5 animate-bounce">
            <Copy className="w-3.5 h-3.5 text-black stroke-[3]" />
            <span>انقر لنسخ رابط الإحالة</span>
          </span>
        </div>
      </div>

      {/* 1. TOP CARD: INVITATION CODE & REFERRAL LINK */}
      <div 
        id="invite-code-card"
        className="rounded-3xl p-4 sm:p-5 bg-[#0E121B]/95 border border-white/10 shadow-2xl shadow-black/80 space-y-4 backdrop-blur-xl"
      >
        {/* Row 1: Invite Code Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-200 font-black text-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>شفرة الدعوة</span>
          </div>
          <span className="text-xs font-bold text-amber-400">
            شارك الكود مع أصدقائك
          </span>
        </div>

        {/* Invite Code Display Box */}
        <div className="rounded-2xl p-2.5 sm:p-3 bg-black/70 border border-white/10 flex items-center justify-between gap-2 shadow-inner">
          <span className="text-xl sm:text-2xl font-black font-mono text-amber-400 tracking-wider select-all pr-2">
            {referralCode}
          </span>
          <button
            id="copy-invite-code-btn"
            onClick={handleCopyCode}
            className="py-2 px-4 rounded-xl font-black text-xs uppercase text-black bg-gradient-to-r from-[#FF6B00] to-amber-400 hover:from-[#ff7a1a] hover:to-amber-500 shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            {copiedType === 'code' ? (
              <>
                <Check className="w-4 h-4 text-black stroke-[3]" />
                <span>تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-black stroke-[2.5]" />
                <span>نسخ</span>
              </>
            )}
          </button>
        </div>

        {/* Row 2: Referral Link Header */}
        <div className="flex items-center gap-1.5 text-gray-200 font-black text-sm pt-1">
          <Share2 className="w-4 h-4 text-[#0095FF]" />
          <span>رابط الإحالة الخاص بك</span>
        </div>

        {/* Referral Link Display Box */}
        <div className="rounded-2xl p-2.5 sm:p-3 bg-black/70 border border-white/10 flex items-center justify-between gap-2 shadow-inner">
          <div className="flex-1 overflow-hidden pr-2">
            <span className="text-xs font-mono text-gray-300 truncate block select-all text-left" dir="ltr">
              {referralLink}
            </span>
          </div>
          <button
            id="copy-referral-link-btn"
            onClick={handleCopyLink}
            className="py-2 px-4 rounded-xl font-black text-xs uppercase text-white bg-[#0095FF] hover:bg-[#0080FF] shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            {copiedType === 'link' ? (
              <>
                <Check className="w-4 h-4 text-white stroke-[3]" />
                <span>تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-white stroke-[2.5]" />
                <span>نسخ</span>
              </>
            )}
          </button>
        </div>

        {/* Fast Social Sharing Section */}
        <div className="pt-2 border-t border-white/5 space-y-2.5">
          <p className="text-xs text-gray-400 font-bold text-center">
            مشاركة سريعة عبر شبكات التواصل:
          </p>
          <div className="flex items-center justify-center gap-3">
            {/* 1. Orange Native Share */}
            <button
              onClick={handleNativeShare}
              title="مشاركة الرابط"
              className="w-11 h-11 rounded-full bg-[#FF6B00] hover:bg-[#ff7a1a] text-black shadow-lg shadow-orange-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Share2 className="w-5 h-5 text-black stroke-[2.5]" />
            </button>

            {/* 2. Facebook */}
            <button
              onClick={shareFacebook}
              title="Facebook"
              className="w-11 h-11 rounded-full bg-[#1877F2]/20 hover:bg-[#1877F2]/30 border border-[#1877F2]/40 text-[#1877F2] flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>

            {/* 3. X (Twitter) */}
            <button
              onClick={shareTwitter}
              title="X / Twitter"
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>

            {/* 4. WhatsApp */}
            <button
              onClick={shareWhatsApp}
              title="WhatsApp"
              className="w-11 h-11 rounded-full bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </button>

            {/* 5. Telegram */}
            <button
              onClick={shareTelegram}
              title="Telegram"
              className="w-11 h-11 rounded-full bg-[#229ED9]/20 hover:bg-[#229ED9]/30 border border-[#229ED9]/40 text-[#229ED9] flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.94z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 2. REWARDS BOX & CLAIM BUTTON (حاوية نيون فخمة مقسمة إلى مربعات وباقات صغيرة رشاقة بجانب بعضها) */}
      <div 
        id="claimable-rewards-card"
        className="rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#1A1308]/95 via-[#0E121B]/95 to-[#161B28]/95 border border-amber-500/40 shadow-2xl shadow-black/80 backdrop-blur-xl space-y-4 relative overflow-hidden"
      >
        {/* Ambient subtle glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FF6B00]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-amber-400 p-0.5 shadow-md shadow-orange-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0A0D15] rounded-[10px] flex items-center justify-center">
                <Gift className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div>
              <h4 className="text-white font-black text-sm sm:text-base">
                {isArabic ? 'مكافآت الفريق وعمولات الإعلانات' : 'Team Rewards & Ad Commissions'}
              </h4>
              <p className="text-[11px] text-gray-400 font-medium">
                {isArabic ? 'حصد وتجميع عوائد الفريق المباشر فوراً' : 'Claim direct team ad earnings instantly'}
              </p>
            </div>
          </div>
          
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono">
            0.01 USDT / إعلان
          </span>
        </div>

        {/* Grid Stats Blocks (مربعات وباقات صغيرة رشاقة بجانب بعضها) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* المربع الأول: عمولات معلقة + زر يجمع 💰 */}
          <div className="rounded-2xl p-2.5 sm:p-3.5 bg-gradient-to-b from-[#22170B] to-[#120E08] border border-[#FF6B00]/50 shadow-lg shadow-orange-950/40 flex flex-col justify-between items-center text-center relative overflow-hidden transition-all duration-300">
            {justIncreased && (
              <div className="absolute top-1 left-1 bg-emerald-400 text-black font-black text-[9px] px-1.5 py-0.5 rounded-full animate-bounce shadow-md shadow-emerald-500/50 flex items-center gap-0.5 z-10">
                <span>+0.01$</span>
                <span>⚡</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="text-[10px] sm:text-xs text-amber-300 font-bold">
                {isArabic ? 'عمولات معلقة' : 'Pending'}
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" title="تحديث لحظي مباشر" />
            </div>
            <div className="my-1 flex items-baseline justify-center gap-0.5 sm:gap-1">
              <span className={`text-lg sm:text-2xl font-black font-mono tracking-tight transition-all duration-300 ${
                justIncreased ? 'text-emerald-400 scale-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'text-amber-400'
              }`}>
                ${livePending.toFixed(2)}
              </span>
              <span className="text-[9px] sm:text-[10px] text-amber-300 font-bold">USDT</span>
            </div>
            <button
              id="claim-team-rewards-btn"
              onClick={handleClaimRewards}
              disabled={isClaiming || livePending <= 0}
              className={`w-full py-1.5 px-1 sm:px-2 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider text-black flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md ${
                livePending > 0 
                  ? 'bg-gradient-to-r from-[#FF6B00] via-[#FFA000] to-[#FF5500] hover:from-[#ff7a1a] hover:to-[#ff6000] shadow-orange-500/40 active:scale-95 animate-pulse' 
                  : 'bg-white/10 text-gray-400 border border-white/5 cursor-not-allowed opacity-60'
              }`}
            >
              {isClaiming ? (
                <span className="animate-spin text-xs">⏳</span>
              ) : (
                <span>{isArabic ? 'يجمع 💰' : 'Claim 💰'}</span>
              )}
            </button>
          </div>

          {/* المربع الثاني: إجمالي أرباح الفريق */}
          <div className="rounded-2xl p-2.5 sm:p-3.5 bg-[#0B0F19]/90 border border-emerald-500/30 shadow-lg flex flex-col justify-between items-center text-center">
            <span className="text-[10px] sm:text-xs text-gray-300 font-bold">
              {isArabic ? 'إجمالي أرباح الفريق' : 'Total Earnings'}
            </span>
            <div className="my-1 flex items-baseline justify-center gap-0.5 sm:gap-1">
              <span className="text-lg sm:text-2xl font-black font-mono text-emerald-400 tracking-tight">
                ${(user.referralEarningsUSDT || 0).toFixed(2)}
              </span>
              <span className="text-[9px] sm:text-[10px] text-emerald-300 font-bold">USDT</span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-emerald-300 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              {isArabic ? 'مجموع ما تم جمعه' : 'Total Claimed'}
            </span>
          </div>

          {/* المربع الثالث: إحالات الفريق */}
          <div className="rounded-2xl p-2.5 sm:p-3.5 bg-[#0B0F19]/90 border border-cyan-500/30 shadow-lg flex flex-col justify-between items-center text-center">
            <span className="text-[10px] sm:text-xs text-gray-300 font-bold">
              {isArabic ? 'إحالات الفريق' : 'Team Referrals'}
            </span>
            <div className="my-1 flex items-baseline justify-center gap-0.5 sm:gap-1">
              <span className="text-lg sm:text-2xl font-black font-mono text-cyan-400 tracking-tight">
                {teamData.teamSize || user.referralCount || 0}
              </span>
              <span className="text-[9px] sm:text-[10px] text-cyan-300 font-bold">{isArabic ? 'عضو' : 'Members'}</span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-cyan-300 font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              {isArabic ? 'الأعضاء النشطين' : 'Active Members'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. MIDDLE CARD: TEAM OVERVIEW METRICS (Matching image.png exactly) */}
      <div 
        id="team-overview-card"
        className="rounded-3xl p-4 sm:p-5 bg-[#0E121B]/95 border border-white/10 shadow-2xl shadow-black/80 space-y-3.5 backdrop-blur-xl"
      >
        {/* Top 2 Main Metric Cards */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Right Card: حجم الفريق */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-[#181D2D]/90 to-[#0F131D] border border-white/10 flex flex-col justify-between min-h-[105px]">
            <div className="flex items-center justify-between">
              <span className="text-gray-200 font-bold text-xs sm:text-sm">
                حجم الفريق
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/20 border border-[#FF6B00]/30 text-[#FF6B00] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                {teamData.teamSize}
              </span>
              <span className="text-xs text-gray-400 font-bold">
                عضو
              </span>
            </div>
          </div>

          {/* Left Card: إعادة شحن الفريق */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-[#181D2D]/90 to-[#0F131D] border border-[#00F0FF]/20 flex flex-col justify-between min-h-[105px]">
            <div className="flex items-center justify-between">
              <span className="text-gray-200 font-bold text-xs sm:text-sm">
                إعادة شحن الفريق
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/20 border border-[#00F0FF]/30 text-[#00F0FF] flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-xl sm:text-2xl font-black font-mono text-[#00F0FF]">
                ${teamData.teamRechargeUSDT.toFixed(2)}
              </span>
              <span className="text-xs text-[#00F0FF] font-bold">
                USDT
              </span>
            </div>
          </div>

        </div>

        {/* Bottom 3 Sub-Stats */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {/* 1. فريق جديد */}
          <div className="rounded-xl p-2.5 bg-black/40 border border-white/5 text-center flex flex-col justify-center">
            <span className="text-[10px] sm:text-xs text-gray-400 font-bold block truncate">
              فريق جديد
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-white mt-0.5">
              {teamData.newTeamTodayCount}
            </span>
          </div>

          {/* 2. شحن إعادة الشحن */}
          <div className="rounded-xl p-2.5 bg-black/40 border border-white/5 text-center flex flex-col justify-center">
            <span className="text-[10px] sm:text-xs text-gray-400 font-bold block truncate">
              شحن إعادة الشحن
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-cyan-400 mt-0.5">
              ${teamData.teamRechargeUSDT.toFixed(2)}
            </span>
          </div>

          {/* 3. الانسحاب الأول */}
          <div className="rounded-xl p-2.5 bg-black/40 border border-white/5 text-center flex flex-col justify-center">
            <span className="text-[10px] sm:text-xs text-gray-400 font-bold block truncate">
              الانسحاب الأول
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-white mt-0.5">
              {teamData.firstWithdrawalCount}
            </span>
          </div>
        </div>

      </div>

      {/* 3. THE 3 REFERRAL LEVELS (10%, 5%, 2%) */}
      <div className="space-y-3">

        {/* LEVEL 1: 10% Commission */}
        <div 
          id="referral-level-1-card"
          className="rounded-3xl p-4 sm:p-5 bg-[#0E121B]/95 border border-white/10 shadow-xl shadow-black/80 space-y-3.5 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-white">
                مستوى الإحالة 1
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/20 to-[#FF6B00]/20 border border-amber-400/40 text-amber-400">
                10% عمولة
              </span>
            </div>
            <button
              onClick={() => openDetails(teamData.level1)}
              className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>تفاصيل</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 divide-x divide-x-reverse divide-white/5 text-center">
            <div className="pr-1">
              <span className="text-[11px] sm:text-xs text-gray-400 font-bold block mb-1">
                يسجل صالح
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black font-mono text-white">
                  {teamData.level1.validMembersCount}
                </span>
                <span className="text-xs text-gray-400">عضو</span>
              </div>
            </div>

            <div className="pl-1">
              <span className="text-[11px] sm:text-xs text-gray-400 font-bold block mb-1">
                إجمالي الإدخال
              </span>
              <div className="flex items-center justify-center gap-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-[#00F0FF]">
                  ${teamData.level1.totalDepositUSDT.toFixed(2)}
                </span>
                <span className="text-xs text-cyan-400 font-bold">USDT</span>
              </div>
            </div>
          </div>
        </div>

        {/* LEVEL 2: 5% Commission */}
        <div 
          id="referral-level-2-card"
          className="rounded-3xl p-4 sm:p-5 bg-[#0E121B]/95 border border-white/10 shadow-xl shadow-black/80 space-y-3.5 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-white">
                مستوى الإحالة 2
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-400">
                5% عمولة
              </span>
            </div>
            <button
              onClick={() => openDetails(teamData.level2)}
              className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-400 hover:text-cyan-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>تفاصيل</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 divide-x divide-x-reverse divide-white/5 text-center">
            <div className="pr-1">
              <span className="text-[11px] sm:text-xs text-gray-400 font-bold block mb-1">
                يسجل صالح
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black font-mono text-white">
                  {teamData.level2.validMembersCount}
                </span>
                <span className="text-xs text-gray-400">عضو</span>
              </div>
            </div>

            <div className="pl-1">
              <span className="text-[11px] sm:text-xs text-gray-400 font-bold block mb-1">
                إجمالي الدخل
              </span>
              <div className="flex items-center justify-center gap-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-[#00F0FF]">
                  ${teamData.level2.totalDepositUSDT.toFixed(2)}
                </span>
                <span className="text-xs text-cyan-400 font-bold">USDT</span>
              </div>
            </div>
          </div>
        </div>

        {/* LEVEL 3: 2% Commission */}
        <div 
          id="referral-level-3-card"
          className="rounded-3xl p-4 sm:p-5 bg-[#0E121B]/95 border border-white/10 shadow-xl shadow-black/80 space-y-3.5 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-white">
                مستوى الإحالة 3
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 text-emerald-400">
                2% عمولة
              </span>
            </div>
            <button
              onClick={() => openDetails(teamData.level3)}
              className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>تفاصيل</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 divide-x divide-x-reverse divide-white/5 text-center">
            <div className="pr-1">
              <span className="text-[11px] sm:text-xs text-gray-400 font-bold block mb-1">
                يسجل صالح
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black font-mono text-white">
                  {teamData.level3.validMembersCount}
                </span>
                <span className="text-xs text-gray-400">عضو</span>
              </div>
            </div>

            <div className="pl-1">
              <span className="text-[11px] sm:text-xs text-gray-400 font-bold block mb-1">
                إجمالي الدخل
              </span>
              <div className="flex items-center justify-center gap-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-[#00F0FF]">
                  ${teamData.level3.totalDepositUSDT.toFixed(2)}
                </span>
                <span className="text-xs text-cyan-400 font-bold">USDT</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. BOTTOM CARD: PREMIUM REFERRAL RULES CARD (كرت شروط وقواعد الفريق الصارمة في أسفل الصفحة) */}
      <div 
        id="team-referral-strict-rules-card"
        className="rounded-3xl p-4 sm:p-5 bg-gradient-to-b from-[#111624]/95 to-[#0A0D15]/95 border border-white/10 shadow-2xl shadow-black/80 space-y-3.5 text-right backdrop-blur-xl"
      >
        {/* Marketing Highlight Badge: سحب الأرباح على الفور وبدون أي قيود */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-[#FF6B00]/15 to-transparent border border-emerald-500/35 flex items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-black text-xs sm:text-sm drop-shadow-xs">
              {isArabic ? '💡 سحب الأرباح على الفور وبدون أي قيود' : '💡 Instant profit withdrawals with zero restrictions'}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0 font-mono">
            {isArabic ? 'فوري ومباشر' : 'Instant 24/7'}
          </span>
        </div>

        {/* Card Header with Users Icon & Badge */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 pt-1">
          <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] shadow-xs">
            {isArabic ? 'نظام العمولات الفوري' : 'Instant 3-Tier Commissions'}
          </span>
          <div className="flex items-center gap-2.5">
            <span className="text-sm sm:text-base font-black tracking-wide text-white drop-shadow-sm">
              {isArabic ? 'قواعد وشروط بناء الفريق' : 'Team Building Rules'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/20 border border-[#FF6B00]/40 flex items-center justify-center text-[#FF6B00] shrink-0 shadow-md">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* List of 4 Rules as Luxury Grid Row Items */}
        <div className="space-y-3 pt-1 text-xs leading-relaxed">
          {/* Quick-Action Grid Stats Blocks Above Orange Details Strip */}
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-black/60 border border-amber-500/30 shadow-inner">
            {/* 1. عمولات معلقة + يجمع 💰 */}
            <div className="rounded-xl p-2 bg-gradient-to-b from-[#201509] to-[#120E08] border border-[#FF6B00]/40 flex flex-col items-center justify-between text-center">
              <span className="text-[10px] text-amber-300 font-bold">
                {isArabic ? 'عمولات معلقة' : 'Pending'}
              </span>
              <div className="my-1 flex items-baseline justify-center gap-0.5">
                <span className="text-base sm:text-lg font-black font-mono text-amber-400">
                  ${pendingRewards.toFixed(2)}
                </span>
                <span className="text-[9px] text-amber-300 font-bold">USDT</span>
              </div>
              <button
                type="button"
                onClick={handleClaimRewards}
                disabled={isClaiming || pendingRewards <= 0}
                className={`w-full py-1 px-1.5 rounded-lg font-black text-[10px] sm:text-[11px] uppercase tracking-wider text-black flex items-center justify-center gap-1 transition-all cursor-pointer shadow ${
                  pendingRewards > 0 
                    ? 'bg-gradient-to-r from-[#FF6B00] via-[#FFA000] to-[#FF5500] hover:from-[#ff7a1a] shadow-orange-500/40 active:scale-95 animate-pulse' 
                    : 'bg-white/10 text-gray-400 border border-white/5 cursor-not-allowed opacity-60'
                }`}
              >
                <span>{isArabic ? 'يجمع 💰' : 'Claim 💰'}</span>
              </button>
            </div>

            {/* 2. إجمالي أرباح الفريق */}
            <div className="rounded-xl p-2 bg-[#0E131F] border border-emerald-500/25 flex flex-col items-center justify-between text-center">
              <span className="text-[10px] text-gray-300 font-bold">
                {isArabic ? 'إجمالي أرباح الفريق' : 'Total Earnings'}
              </span>
              <div className="my-1 flex items-baseline justify-center gap-0.5">
                <span className="text-base sm:text-lg font-black font-mono text-emerald-400">
                  ${(user.referralEarningsUSDT || 0).toFixed(2)}
                </span>
                <span className="text-[9px] text-emerald-300 font-bold">USDT</span>
              </div>
              <span className="text-[9px] text-emerald-300 font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10">
                {isArabic ? 'المجموع' : 'Total'}
              </span>
            </div>

            {/* 3. إحالات الفريق */}
            <div className="rounded-xl p-2 bg-[#0E131F] border border-cyan-500/25 flex flex-col items-center justify-between text-center">
              <span className="text-[10px] text-gray-300 font-bold">
                {isArabic ? 'إحالات الفريق' : 'Referrals'}
              </span>
              <div className="my-1 flex items-baseline justify-center gap-0.5">
                <span className="text-base sm:text-lg font-black font-mono text-cyan-400">
                  {teamData.teamSize || user.referralCount || 0}
                </span>
                <span className="text-[9px] text-cyan-300 font-bold">{isArabic ? 'عضو' : 'Members'}</span>
              </div>
              <span className="text-[9px] text-cyan-300 font-medium px-1.5 py-0.5 rounded-full bg-cyan-500/10">
                {isArabic ? 'النشطين' : 'Active'}
              </span>
            </div>
          </div>

          {/* Highlight Banner / Card with requested terms */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-right shadow-md">
            <div className="flex items-center gap-2 text-amber-400 font-black text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{isArabic ? 'تفاصيل وشروط مكافآت الإعلانات:' : 'Ad Rewards Terms & Details:'}</span>
            </div>
            <div className="space-y-1.5 pr-1">
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-xs sm:text-[12.5px] text-amber-200 font-bold leading-relaxed">
                  {isArabic 
                    ? 'تكسب عوائد إضافية بقيمة 0.01 USDT مع كل إعلان يشاهده عضو فريقك المباشر.' 
                    : 'Earn an additional 0.01 USDT for every ad watched by your direct team member.'}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <p className="text-xs sm:text-[12.5px] text-amber-200 font-bold leading-relaxed">
                  {isArabic 
                    ? 'اضغط على زر يجمع بانتظام لنقل مكافآت الفريق إلى رصيدك الأساسي القابل للسحب.' 
                    : 'Tap the Claim button regularly to transfer team rewards to your withdrawable balance.'}
                </p>
              </div>
            </div>
          </div>

          {/* Luxury Card: البند 1 ➔ خلفية زرقاء نيون خفيفة (Midnight Neon Blue) */}
          <div className="rounded-2xl p-3.5 sm:p-4 bg-gradient-to-r from-[#0C1A30]/90 via-[#0A1628]/95 to-[#081220]/90 border border-sky-500/30 shadow-lg shadow-sky-950/30 flex items-start gap-3 transition-all hover:border-sky-500/50">
            <span className="w-7 h-7 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-300 font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              1
            </span>
            <div className="space-y-0.5 text-right">
              <span className="text-sky-300 font-black text-xs block">
                {isArabic ? 'رابط الإحالة ومستويات الفريق الثلاثة' : 'Referral Link & 3-Tier Network'}
              </span>
              <p className="text-sky-100/90 text-xs sm:text-[12.5px] leading-relaxed font-medium">
                {isArabic 
                  ? 'انشر رابط إحالتك الفريد لفتح مستويات الأرباح الثلاثة (Level 1, L2, L3) وبناء فريقك الاستثماري بكامل المزايا.' 
                  : 'Share your unique referral link to unlock all 3 profit levels (Level 1, L2, L3) and build your investment team.'}
              </p>
            </div>
          </div>

          {/* Luxury Card: البند 2 ➔ خلفية برتقالية/صفراء دافئة ونظيفة (Neon Gold/Orange) */}
          <div className="rounded-2xl p-3.5 sm:p-4 bg-gradient-to-r from-[#261505]/90 via-[#1F1104]/95 to-[#160B02]/90 border border-amber-500/35 shadow-lg shadow-orange-950/30 flex items-start gap-3 transition-all hover:border-amber-500/50">
            <span className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              2
            </span>
            <div className="space-y-0.5 text-right">
              <span className="text-amber-300 font-black text-xs block">
                {isArabic ? 'عمولات الإيداع الفورية (10% و 5% و 2%)' : 'Instant Deposit Commissions (10%, 5%, 2%)'}
              </span>
              <p className="text-amber-100/90 text-xs sm:text-[12.5px] leading-relaxed font-medium">
                {isArabic 
                  ? 'يتم احتساب ونزول عمولات الإيداع الفورية (10% و 5% و 2%) في حسابك بمجرد قبول الإدارة للشحن الفعلي لفريقك.' 
                  : 'Instant deposit commissions (10%, 5%, and 2%) are credited to your balance as soon as team recharges are verified.'}
              </p>
            </div>
          </div>

          {/* Luxury Card: البند 3 ➔ خلفية بنفسجية/حمراء هادئة (Cyber Purple/Crimson) */}
          <div className="rounded-2xl p-3.5 sm:p-4 bg-gradient-to-r from-[#220A24]/90 via-[#1A071C]/95 to-[#130515]/90 border border-purple-500/35 shadow-lg shadow-purple-950/30 flex items-start gap-3 transition-all hover:border-purple-500/50">
            <span className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              3
            </span>
            <div className="space-y-0.5 text-right">
              <span className="text-purple-300 font-black text-xs block">
                {isArabic ? 'الدعم والاستشارات المالية المتخصصة' : 'Dedicated Support & Financial Advisory'}
              </span>
              <p className="text-purple-100/90 text-xs sm:text-[12.5px] leading-relaxed font-medium">
                {isArabic 
                  ? 'لمزيد من النصائح حول كيفية تضخيم أرباح فريقك اليومية، تواصل مع مستشارك المالي عبر أيقونة الدعم العائمة.' 
                  : 'For more tips on maximizing your daily team earnings, contact your financial advisor via the floating support icon.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: LEVEL DETAILS */}
      <TeamLevelDetailsModal
        isOpen={!!selectedLevelForDetails}
        onClose={() => setSelectedLevelForDetails(null)}
        levelData={selectedLevelForDetails}
        sponsorReferralCode={referralCode}
        onDataChanged={() => setRefreshTrigger((prev) => prev + 1)}
        onShowToast={onShowToast}
      />

      {/* CENTERED POPUP MODAL: CLAIM SUCCESS */}
      {showClaimSuccessModal && (
        <div 
          id="claim-success-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div 
            id="claim-success-modal-container"
            dir={isArabic ? 'rtl' : 'ltr'}
            className="w-full max-w-sm rounded-[32px] p-6 bg-[#0E121E] border border-amber-500/30 shadow-[0_25px_80px_rgba(0,0,0,0.95)] relative text-center text-white animate-in zoom-in-95 duration-200 space-y-4"
          >
            {/* Ambient glow */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Icon */}
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-[#FF6B00] via-amber-400 to-orange-500 p-0.5 shadow-xl shadow-orange-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#0A0B10] rounded-[22px] flex items-center justify-center">
                <Coins className="w-8 h-8 text-amber-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white">
                {isArabic ? 'تأكيد العملية' : 'Confirmation'}
              </h3>
              <p className="text-sm font-bold text-emerald-400 leading-relaxed">
                تم جمع المكافآت بنجاح! تم إضافة الرصيد إلى حسابك الأساسي 💰
              </p>
            </div>

            <button
              id="close-claim-modal-btn"
              type="button"
              onClick={() => setShowClaimSuccessModal(false)}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-[#FF6B00] via-[#FFA000] to-[#FF5500] hover:from-[#ff7a1a] hover:to-[#ff6000] text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
            >
              {isArabic ? 'حسناً' : 'OK'}
            </button>
          </div>
        </div>
      )}

      {/* Delicate Smooth Green Bottom Toast Notification */}
      {smoothToastMessage && (
        <div 
          id="smooth-copy-toast"
          className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600/95 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 border border-emerald-400/40 backdrop-blur-md">
            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
            <span>{smoothToastMessage}</span>
          </div>
        </div>
      )}

    </div>
  );
});
