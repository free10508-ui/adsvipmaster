import React, { useState, useRef, useMemo } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Heart,
  Share2,
  Lock,
  Search,
  Check,
  Sparkles,
  Copy,
  Filter,
  X,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText
} from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { ALL_PROOFS_DATA, ProofCardData } from '../data/proofsData';

interface WithdrawalProofsViewProps {
  onBack?: () => void;
  isModal?: boolean;
}

export const WithdrawalProofsView: React.FC<WithdrawalProofsViewProps> = ({ onBack }) => {
  // Filters: All selected by default so gallery is rich & full
  const [selectedNetwork, setSelectedNetwork] = useState<'all' | 'TRC-20' | 'BEP-20'>('all');
  const [selectedTier, setSelectedTier] = useState<'all' | 'VIP 1' | 'VIP 2' | 'VIP 3' | 'VIP 4' | 'VIP 5'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Lightbox State for Full Image Viewer
  const [activeLightboxProof, setActiveLightboxProof] = useState<ProofCardData | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  // Likes tracking state
  const [likesState, setLikesState] = useState<Record<string, { count: number; isLiked: boolean }>>(() => {
    const init: Record<string, { count: number; isLiked: boolean }> = {};
    ALL_PROOFS_DATA.forEach(p => {
      init[p.id] = { count: p.initialLikes, isLiked: false };
    });
    return init;
  });

  // Toast alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleLike = (e: React.MouseEvent, proofId: string, baseLikes: number) => {
    e.stopPropagation();
    soundEngine.playClick();
    setLikesState(prev => {
      const current = prev[proofId] || { count: baseLikes, isLiked: false };
      const nextIsLiked = !current.isLiked;
      return {
        ...prev,
        [proofId]: {
          count: nextIsLiked ? current.count + 1 : current.count - 1,
          isLiked: nextIsLiked,
        }
      };
    });
  };

  const handleShare = (e: React.MouseEvent, proof: ProofCardData) => {
    e.stopPropagation();
    soundEngine.playClick();
    const shareText = `إثبات سحب معتمد بقيمة +USDT ${proof.formattedAmount} عبر شبكة ${proof.network} (${proof.vipTier}) - هاش المعاملة: ${proof.txHash}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText);
      showToast('تم نسخ رابط وتفاصيل إثبات السحب بنجاح!');
    } else {
      showToast(`إثبات سحب معتمد: +USDT ${proof.formattedAmount}`);
    }
  };

  const handleCopyHash = (txHash: string) => {
    soundEngine.playClick();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txHash);
      showToast(`تم نسخ الهاش: ${txHash}`);
    }
  };

  // Filtered Proofs
  const filteredProofs = useMemo(() => {
    return ALL_PROOFS_DATA.filter(proof => {
      if (selectedNetwork !== 'all' && proof.network !== selectedNetwork) {
        return false;
      }
      if (selectedTier !== 'all' && proof.vipTier !== selectedTier) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = (searchQuery || '').toLowerCase().trim();
        return (
          (proof.txHash || '').toLowerCase().includes(query) ||
          (proof.formattedAmount || '').includes(query) ||
          (proof.title || '').toLowerCase().includes(query) ||
          (proof.vipTier || '').toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [selectedNetwork, selectedTier, searchQuery]);

  // Open Lightbox
  const handleOpenLightbox = (proof: ProofCardData) => {
    soundEngine.playClick();
    setActiveLightboxProof(proof);
    setZoomLevel(1);
    setShowTechnicalDetails(false);
  };

  // Lightbox Navigation
  const currentLightboxIndex = useMemo(() => {
    if (!activeLightboxProof) return -1;
    return filteredProofs.findIndex(p => p.id === activeLightboxProof.id);
  }, [activeLightboxProof, filteredProofs]);

  const handleNextProof = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentLightboxIndex < 0 || filteredProofs.length === 0) return;
    soundEngine.playClick();
    const nextIdx = (currentLightboxIndex + 1) % filteredProofs.length;
    setActiveLightboxProof(filteredProofs[nextIdx]);
    setZoomLevel(1);
  };

  const handlePrevProof = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentLightboxIndex < 0 || filteredProofs.length === 0) return;
    soundEngine.playClick();
    const prevIdx = (currentLightboxIndex - 1 + filteredProofs.length) % filteredProofs.length;
    setActiveLightboxProof(filteredProofs[prevIdx]);
    setZoomLevel(1);
  };

  return (
    <div 
      className="w-full bg-[#0a0e17] text-white select-none flex flex-col relative"
      dir="rtl"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* MODAL MAIN CONTENT CONTAINER */}
      <div className="w-full p-3 sm:p-5 md:p-6 flex flex-col gap-4">

        {/* 1. TOP HEADER */}
        <div className="flex items-center justify-between gap-3 pb-1">
          {/* Right Side: Shield Icon + Title + Verified Badge + Subtitle */}
          <div className="flex items-center gap-3">
            {/* Glowing Amber Shield Box */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#1c150c] border border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center justify-center text-amber-500 shrink-0">
              <ShieldCheck className="w-6 h-6 stroke-[2.3]" />
            </div>

            <div className="text-right">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight">
                  إثباتات السحب المعتمدة
                </h2>
                {/* Green Pill Badge */}
                <span className="px-2 py-0.5 rounded-full bg-[#003820] text-[#00E599] border border-[#00E599]/40 text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-xs">
                  <span>موثق 100%</span>
                  <Check className="w-3 h-3 text-[#00E599] stroke-[3]" />
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium mt-0.5">
                {ALL_PROOFS_DATA.length} إثبات سحب حي ومؤكد على البلوكشين لجميع باقات VIP
              </p>
            </div>
          </div>

          {/* Left Side: Circular Close Button */}
          {onBack && (
            <button
              id="proofs-close-btn"
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onBack();
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#181d2c] hover:bg-[#232a3d] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0 active:scale-95"
              title="إغلاق"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>

        {/* 2. FILTERING STRIP */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          
          {/* Level Filter (المستوى) on Right in RTL */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            <span className="text-xs font-bold text-gray-300 ml-1 shrink-0 flex items-center gap-1">
              <span>المستوى:</span>
              <Filter className="w-3.5 h-3.5 text-amber-500" />
            </span>

            {/* 'الكل' Pill */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setSelectedTier('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedTier === 'all'
                  ? 'bg-[#00B4D8] text-black font-black shadow-[0_0_12px_rgba(0,180,216,0.5)]'
                  : 'bg-[#181d2a] text-gray-300 hover:bg-[#22293b] border border-white/5'
              }`}
            >
              الكل
            </button>

            {/* VIP 1 to VIP 5 Pills */}
            {(['VIP 1', 'VIP 2', 'VIP 3', 'VIP 4', 'VIP 5'] as const).map((tier) => {
              const isActive = selectedTier === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedTier(tier);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-black font-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : 'bg-[#181d2a] text-gray-300 hover:bg-[#22293b] border border-white/5'
                  }`}
                >
                  {tier}
                </button>
              );
            })}
          </div>

          {/* Network Filter + Counter */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            <span className="text-xs font-bold text-gray-300 ml-1 shrink-0">
              الشبكة:
            </span>

            {/* الكل */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setSelectedNetwork('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedNetwork === 'all'
                  ? 'bg-white/20 text-white border border-white/40'
                  : 'bg-[#181d2a] text-gray-300 hover:bg-[#22293b] border border-white/5'
              }`}
            >
              الكل
            </button>

            {/* TRC-20 */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setSelectedNetwork('TRC-20');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedNetwork === 'TRC-20'
                  ? 'bg-[#7A1C1C] text-white border border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.3)]'
                  : 'bg-[#181d2a] text-gray-300 hover:bg-[#22293b] border border-white/5'
              }`}
            >
              TRC-20
            </button>

            {/* BEP-20 */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setSelectedNetwork('BEP-20');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedNetwork === 'BEP-20'
                  ? 'bg-[#856404] text-white border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                  : 'bg-[#181d2a] text-gray-300 hover:bg-[#22293b] border border-white/5'
              }`}
            >
              BEP-20
            </button>

            {/* Count Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-[#141824] border border-white/10 text-emerald-400 text-xs font-black shrink-0 whitespace-nowrap">
              {filteredProofs.length} إثبات معروض
            </div>
          </div>

        </div>

        {/* Search Input Filter */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم المعاملة، الهاش، المبلغ، أو الباقة..."
            className="w-full px-9 py-2 rounded-xl bg-[#111624] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3. PROOFS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-4 pt-1">
          {filteredProofs.length === 0 ? (
            <div className="col-span-full p-8 text-center text-gray-400 bg-[#0e121d] rounded-3xl border border-white/10 space-y-2">
              <AlertCircle className="w-8 h-8 text-gray-500 mx-auto" />
              <p className="text-xs font-bold">لا توجد إثباتات تطابق الفلاتر المحددة</p>
              <button 
                type="button"
                onClick={() => {
                  setSelectedNetwork('all');
                  setSelectedTier('all');
                  setSearchQuery('');
                }}
                className="mt-2 px-4 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 text-xs font-bold"
              >
                إعادة تعيين الفلاتر
              </button>
            </div>
          ) : (
            filteredProofs.map((proof) => {
              const currentLike = likesState[proof.id] || { count: proof.initialLikes, isLiked: false };

              return (
                <div
                  key={proof.id}
                  id={`proof-card-${proof.id}`}
                  onClick={() => handleOpenLightbox(proof)}
                  className="rounded-2xl sm:rounded-3xl bg-[#0e121d] border border-white/10 overflow-hidden flex flex-col relative shadow-lg hover:border-amber-500/40 hover:shadow-[0_8px_25px_rgba(0,0,0,0.6)] transition-all cursor-pointer group"
                >
                  {/* COMPACT AUTHENTIC SCREENSHOT CONTAINER */}
                  <div className="h-44 sm:h-52 relative overflow-hidden bg-white select-none group/img">
                    
                    {/* The Authentic Verified TronScan Proof Image */}
                    <img 
                      src={proof.imageSrc} 
                      alt={proof.title}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top select-none pointer-events-none group-hover:scale-105 transition-transform duration-300"
                      draggable={false}
                    />

                    {/* Anti-Drag and Context protection */}
                    <div 
                      className="absolute inset-0 z-20 bg-transparent select-none"
                      onContextMenu={(e) => e.preventDefault()}
                      draggable={false}
                    />

                    {/* Top Floating Badges */}
                    <div className="absolute top-2 inset-x-2 z-20 flex items-center justify-between pointer-events-none">
                      {/* Left: Network Badge */}
                      <span className={`px-2 py-0.5 rounded-full font-black text-[9px] sm:text-[10px] flex items-center gap-1 shadow-md ${
                        proof.network === 'TRC-20' ? 'bg-[#00D084] text-black' : 'bg-[#F3BA2F] text-black'
                      }`}>
                        <span>{proof.network}</span>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>

                      {/* Right: VIP Tier Luxury Gold Badge */}
                      <span className="px-2 py-0.5 rounded-full bg-[#2A200A]/90 backdrop-blur-xs text-[#FFD700] border border-[#FFD700]/50 font-black text-[9px] sm:text-[10px] shadow-md tracking-wide">
                        {proof.vipTier}
                      </span>
                    </div>

                    {/* Hover Magnify Overlay Button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-25 pointer-events-none">
                      <div className="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold flex items-center gap-1.5 shadow-xl">
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>انقر لمعاينة الصورة كاملة</span>
                      </div>
                    </div>

                    {/* SMOOTH BOTTOM GRADIENT OVERLAY */}
                    <div className="absolute inset-x-0 bottom-0 h-16 sm:h-20 bg-gradient-to-t from-[#0e121d] via-[#0e121d]/85 via-45% to-transparent flex items-end justify-center pb-1 z-10 pointer-events-none">
                      {/* Bright Neon Green Withdrawal Amount */}
                      <span className="text-[#00FF85] font-black font-mono text-sm sm:text-base tracking-tight drop-shadow-[0_0_8px_rgba(0,255,133,0.5)]">
                        +USDT {proof.formattedAmount}
                      </span>
                    </div>

                  </div>

                  {/* CARD BOTTOM DETAILS */}
                  <div className="p-2.5 sm:p-3 bg-[#0e121d] flex flex-col gap-1.5 z-20">
                    {/* Arabic Title */}
                    <p className="text-white font-bold text-[11px] sm:text-xs truncate text-right">
                      {proof.title}
                    </p>

                    {/* Footer Row: Time Ago on Right, Action Icons on Left */}
                    <div className="flex items-center justify-between pt-0.5 text-gray-400">
                      {/* Time Ago */}
                      <span className="text-[10px] sm:text-[11px] text-gray-400">
                        {proof.timeAgo}
                      </span>

                      {/* Action Icons: Share & Like */}
                      <div className="flex items-center gap-2">
                        {/* Share Icon */}
                        <button
                          type="button"
                          onClick={(e) => handleShare(e, proof)}
                          className="text-gray-400 hover:text-white transition-colors cursor-pointer p-0.5"
                          title="مشاركة"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Heart / Like Icon with Counter */}
                        <button
                          type="button"
                          onClick={(e) => handleLike(e, proof.id, proof.initialLikes)}
                          className={`flex items-center gap-1 text-[10px] sm:text-[11px] font-mono cursor-pointer transition-colors ${
                            currentLike.isLiked ? 'text-rose-500 font-bold' : 'text-gray-400 hover:text-rose-400'
                          }`}
                        >
                          <span>{currentLike.count}</span>
                          <Heart 
                            className={`w-3.5 h-3.5 transition-transform ${
                              currentLike.isLiked ? 'fill-rose-500 text-rose-500 scale-110' : ''
                            }`} 
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* 4. MODAL FOOTER BAR */}
        <div className="mt-2 pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          
          {/* Close Gallery Button on Left in RTL */}
          {onBack && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onBack();
              }}
              className="px-5 py-2 rounded-xl bg-[#212738] hover:bg-[#2c344a] text-white text-xs font-bold transition-colors border border-white/5 cursor-pointer order-2 sm:order-1"
            >
              إغلاق المعرض
            </button>
          )}

          {/* Guaranteed Blockchain Text on Right in RTL */}
          <div className="flex items-center gap-1.5 text-gray-400 text-[11px] sm:text-xs text-right order-1 sm:order-2">
            <span>جميع عمليات السحب فورية وتخضع للتحقق المالي المباشر على البلوكشين دون أي وسيط.</span>
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          </div>

        </div>

      </div>

      {/* 5. CINEMATIC FULL-SCREEN LIGHTBOX VIEWER */}
      {activeLightboxProof && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-xl animate-in fade-in duration-200 select-none overflow-hidden"
          onClick={() => setActiveLightboxProof(null)}
          dir="rtl"
        >
          {/* LIGHTBOX TOP TOOLBAR */}
          <div 
            className="w-full px-4 py-3 bg-[#0d121f]/90 border-b border-white/10 flex items-center justify-between gap-3 shrink-0 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Right: Info & Index */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-white">
                    {activeLightboxProof.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                    {activeLightboxProof.vipTier}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    {activeLightboxProof.network}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">
                  إثبات سحب رقم {currentLightboxIndex + 1} من إجمالي {filteredProofs.length} معتمد
                </p>
              </div>
            </div>

            {/* Left: Zoom Controls + Toggle Details + Close */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Zoom Out */}
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.25))}
                disabled={zoomLevel <= 0.75}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer"
                title="تصغير"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {/* Zoom Level Indicator */}
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="px-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-mono font-bold text-gray-300 hover:text-white cursor-pointer"
                title="إعادة ضبط الحجم"
              >
                {Math.round(zoomLevel * 100)}%
              </button>

              {/* Zoom In */}
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
                disabled={zoomLevel >= 2.5}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer"
                title="تكبير"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Reset Zoom */}
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer"
                title="حجم طبيعي"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Technical Details Toggle */}
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  showTechnicalDetails
                    ? 'bg-amber-500 text-black border-amber-400 font-black'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border-white/10'
                }`}
                title="بيانات البلوكشين"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">البيانات التقنية</span>
              </button>

              {/* Close Lightbox */}
              <button
                type="button"
                onClick={() => setActiveLightboxProof(null)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 hover:text-rose-300 border border-rose-500/30 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                title="إغلاق المعاينة"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* LIGHTBOX MAIN STAGE (PREV ARROW + FULL SCREENSHOT + NEXT ARROW) */}
          <div 
            className="flex-1 flex items-center justify-center relative p-2 sm:p-4 overflow-auto custom-scrollbar"
            onClick={() => setActiveLightboxProof(null)}
          >
            {/* Previous Arrow Button */}
            {filteredProofs.length > 1 && (
              <button
                type="button"
                onClick={handlePrevProof}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-2xl"
                title="الإثبات السابق"
              >
                <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
            )}

            {/* The Authentic Full-Size SVG Receipt Container */}
            <div 
              className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] border-2 border-white/20 bg-white relative">
                <img 
                  src={activeLightboxProof.imageSrc} 
                  alt={activeLightboxProof.title}
                  referrerPolicy="no-referrer"
                  className="max-h-[72vh] sm:max-h-[76vh] w-auto object-contain select-none pointer-events-none block"
                  draggable={false}
                />
                
                {/* Verified Overlay Tag */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md text-[10px] text-[#00E599] font-mono flex items-center gap-1.5 border border-[#00E599]/40 shadow-lg pointer-events-none">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00E599]" />
                  <span>VERIFIED BLOCKCHAIN RECEIPT</span>
                </div>
              </div>
            </div>

            {/* Next Arrow Button */}
            {filteredProofs.length > 1 && (
              <button
                type="button"
                onClick={handleNextProof}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-2xl"
                title="الإثبات التالي"
              >
                <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
            )}
          </div>

          {/* LIGHTBOX TECHNICAL DETAILS DRAWER (Optional slide-up or overlay) */}
          {showTechnicalDetails && (
            <div 
              className="w-full max-w-3xl mx-auto px-4 py-3 bg-[#0d121f]/95 border-t border-white/10 flex flex-col gap-2 shrink-0 animate-in slide-in-from-bottom duration-150 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2 rounded-xl bg-[#141926] border border-white/5">
                  <span className="text-[10px] text-gray-400 block">المبلغ الصافي:</span>
                  <span className="text-emerald-400 font-black">+USDT {activeLightboxProof.formattedAmount}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#141926] border border-white/5">
                  <span className="text-[10px] text-gray-400 block">الشبكة والباقة:</span>
                  <span className="text-amber-400 font-bold">{activeLightboxProof.network} | {activeLightboxProof.vipTier}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#141926] border border-white/5">
                  <span className="text-[10px] text-gray-400 block">ارتفاع الكتلة:</span>
                  <span className="text-cyan-400">#{activeLightboxProof.blockHeight}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#141926] border border-white/5">
                  <span className="text-[10px] text-gray-400 block">وقت المعاملة:</span>
                  <span className="text-gray-300">{activeLightboxProof.timeAgo}</span>
                </div>
              </div>
            </div>
          )}

          {/* LIGHTBOX BOTTOM CONTROL BAR */}
          <div 
            className="w-full px-4 py-3 bg-[#0a0e17] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Right: Amount & Hash */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold block">المبلغ المحول بنجاح:</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-[#00FF85] tracking-tight drop-shadow-[0_0_10px_rgba(0,255,133,0.5)]">
                  +USDT {activeLightboxProof.formattedAmount}
                </div>
              </div>

              <div className="hidden sm:block h-8 w-[1px] bg-white/10" />

              <div className="text-right">
                <span className="text-[10px] text-gray-400 block">هاش المعاملة:</span>
                <button
                  type="button"
                  onClick={() => handleCopyHash(activeLightboxProof.txHash)}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer"
                  title="انقر لنسخ الهاش"
                >
                  <span>{activeLightboxProof.txHash}</span>
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Left: Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleCopyHash(activeLightboxProof.txHash)}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#00B4D8] text-black font-black text-xs hover:bg-[#0096b8] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ الهاش</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleShare(e, activeLightboxProof)}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">مشاركة</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveLightboxProof(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] px-4 py-2.5 rounded-2xl bg-emerald-500 text-black font-black text-xs shadow-2xl flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
