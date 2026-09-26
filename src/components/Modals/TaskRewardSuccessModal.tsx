import React from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  Coins, 
  ArrowRight, 
  X, 
  Flame, 
  Zap, 
  TrendingUp, 
  ShieldCheck,
  Crown,
  CalendarCheck,
  Target
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { soundEngine } from '../../utils/audio';
import { formatUSDT } from '../../utils/formatters';
import { INITIAL_VIP_PLANS } from '../../data/initialData';

interface TaskRewardSuccessModalProps {
  isOpen: boolean;
  rewardAmount: number;
  remainingTasksToday: number;
  newBalance?: number;
  vipLevel?: number;
  onClose: () => void;
  onNextTask: () => void;
  onGoToTasks?: () => void;
}

export const TaskRewardSuccessModal: React.FC<TaskRewardSuccessModalProps> = ({
  isOpen,
  rewardAmount,
  remainingTasksToday,
  newBalance,
  vipLevel = 2,
  onClose,
  onNextTask,
  onGoToTasks,
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  if (!isOpen) return null;

  // Dynamic VIP tier resolution (VIP 1, VIP 2, etc.)
  const effectiveVipLevel = vipLevel ?? 1;
  const currentPlan = INITIAL_VIP_PLANS.find((p) => p.level === effectiveVipLevel) || INITIAL_VIP_PLANS[0];

  // STRICT INTEGER: (0/10) work-day task progress for 10 daily tasks
  const maxDailyTasks = Math.max(1, Math.floor(currentPlan?.tasksPerDay || 10));
  const safeRemaining = Math.max(0, Math.floor(Number(remainingTasksToday) || 0));
  const completedTasks = Math.max(0, Math.min(maxDailyTasks, maxDailyTasks - safeRemaining));
  const counterDisplay = `(${completedTasks}/${maxDailyTasks})`;

  const handleNextClick = () => {
    soundEngine.playClickSound();
    onNextTask();
    onClose();
  };

  const handleCloseAndGoToTasks = () => {
    soundEngine.playClickSound();
    if (onGoToTasks) {
      onGoToTasks();
    }
    onClose();
  };

  const formattedReward = rewardAmount > 0 ? formatUSDT(rewardAmount) : '0.09';

  return (
    <div 
      id="task-reward-center-popup-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="task-reward-center-popup"
        className="w-full max-w-[360px] sm:max-w-[390px] mx-auto rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 border border-orange-500/60 bg-gradient-to-b from-[#1A140E] via-[#0E1017] to-[#0A0B10] shadow-[0_0_40px_rgba(255,107,0,0.3)] relative text-white text-center space-y-2.5 sm:space-y-3 animate-in zoom-in-95 duration-200 overflow-hidden my-auto max-h-[92vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Ambient Glowing Background Auras */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-56 h-56 bg-[#FF6B00]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Close Button (X) */}
        <button
          id="task-reward-close-x-btn"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 left-3 sm:top-4 sm:left-4 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Celebratory Icon & Badge */}
        <div className="flex flex-col items-center pt-0.5">
          <div className="relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#FF6B00] via-amber-500 to-orange-400 p-0.5 shadow-xl shadow-orange-500/40">
              <div className="w-full h-full bg-[#0E1017] rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#FF6B00]/20 to-transparent" />
                <Coins className="w-7 h-7 sm:w-8 sm:h-8 text-[#FF6B00] animate-pulse drop-shadow-[0_0_12px_rgba(255,107,0,0.8)]" />
              </div>
            </div>
            
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-[#0E1017] items-center justify-center text-white text-[9px] font-bold">
                <CheckCircle2 className="w-3 h-3" />
              </span>
            </span>
          </div>

          <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-[#FF6B00] text-[10.5px] font-bold">
            <Sparkles className="w-3 h-3" />
            <span>{isArabic ? 'مكافأة معتمدة وموثقة ⚡' : 'Verified Task Reward ⚡'}</span>
          </div>
        </div>

        {/* Dynamic VIP Tier Status Banner (سواء كان المستخدم VIP 1 أو غيره) */}
        <div 
          id="task-reward-vip-status-strip"
          className="rounded-xl p-2 sm:p-2.5 bg-gradient-to-r from-black/80 via-[#161B28]/80 to-black/80 border border-amber-500/30 shadow-inner flex items-center justify-between gap-2 text-right"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Crown className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] sm:text-xs font-black text-amber-300">
                  {effectiveVipLevel === 10 ? 'حساب VIP 10 (الماسية الملكية)' : `حساب ${currentPlan.name}`}
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[8.5px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  نشط
                </span>
              </div>
              <span className="text-[9.5px] text-gray-400 font-medium block">
                {effectiveVipLevel === 10
                  ? 'ربح 25.00$ لكل مهمة (250.00$ يومياً)'
                  : `ربح ${currentPlan.rewardPerTaskUSDT.toFixed(3)}$ لكل مهمة (${currentPlan.dailyIncomeUSDT.toFixed(2)}$ يومياً)`}
              </span>
            </div>
          </div>
          <div className="text-left shrink-0">
            <span className="text-[9px] text-gray-400 block font-medium">مستوى العضوية</span>
            <span className="text-[11px] font-black font-mono text-cyan-400">Level {effectiveVipLevel}</span>
          </div>
        </div>

        {/* Marketing Title and Text */}
        <div className="space-y-0.5 px-1">
          <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
            {isArabic ? 'تهانينا! تمت المهمة بنجاح' : 'Congratulations! Task Completed'}
          </h3>
          <p className="text-[11.5px] sm:text-xs text-gray-200 leading-relaxed font-semibold">
            {isArabic ? (
              <>
                تم استلام مكافأة المهمة بنجاح! أضيف{' '}
                <span className="text-[#FF6B00] font-black text-xs sm:text-sm font-mono">+{formattedReward} USDT</span>{' '}
                صافي إلى رصيدك.
              </>
            ) : (
              <>
                Task reward received!{' '}
                <span className="text-[#FF6B00] font-black text-xs sm:text-sm font-mono">+{formattedReward} USDT</span>{' '}
                credited to your balance.
              </>
            )}
          </p>
        </div>

        {/* العداد (1/10) لبطاقة إنجاز يوم العمل الجاري بتصميم أنيق وملموم */}
        <div 
          id="task-reward-workday-counter"
          className="rounded-xl p-2 sm:p-2.5 bg-gradient-to-r from-[#201509]/95 via-[#16120C]/95 to-[#0E131F]/95 border border-amber-500/40 shadow-md shadow-orange-950/30 flex items-center justify-between gap-2.5 text-right"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#FF6B00] to-amber-400 p-0.5 shadow-sm shadow-orange-500/30 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0A0D15] rounded-[7px] flex items-center justify-center">
                <CalendarCheck className="w-3.5 h-3.5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-black text-white">
                  عداد إنجاز يوم العمل الجاري
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-[9.5px] text-amber-200/80 font-medium">
                أكمل مهام اليوم لحصد وتثبيت كامل الأرباح اليومية
              </p>
            </div>
          </div>

          {/* الرقم البارز (1/10) بحجم متناسق */}
          <div className="px-2.5 py-1 rounded-lg bg-black/80 border border-amber-400/40 shadow-inner flex flex-col items-center justify-center shrink-0 min-w-[65px]">
            <span className="text-base sm:text-lg font-black font-mono text-amber-400 tracking-wider drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] leading-tight">
              {counterDisplay}
            </span>
            <span className="text-[8px] text-amber-300/90 font-bold uppercase tracking-wider">
              مهام اليوم
            </span>
          </div>
        </div>

        {/* Live Balance & Quota Card */}
        <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">
          <div className="text-center p-1.5 rounded-lg bg-white/5 border border-white/5">
            <div className="text-[9.5px] text-gray-400 font-medium mb-0.5">
              {isArabic ? 'المهام المتبقية اليوم' : 'Remaining Tasks'}
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-amber-400 flex items-center justify-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              <span>{safeRemaining}</span>
            </div>
          </div>

          <div className="text-center p-1.5 rounded-lg bg-white/5 border border-white/5">
            <div className="text-[9.5px] text-gray-400 font-medium mb-0.5">
              {isArabic ? 'رصيد الحساب الحالي' : 'Current Balance'}
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-emerald-400 font-mono flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{newBalance !== undefined ? formatUSDT(newBalance) : '0.00'} $</span>
            </div>
          </div>
        </div>

        {/* Action Controls - Compact & Sized Appropriately */}
        <div className="space-y-1.5 pt-0.5">
          {/* Next Task Button */}
          <button
            id="task-reward-next-task-btn"
            onClick={handleNextClick}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#FF6B00] via-orange-500 to-[#FF8533] hover:from-[#FF7A1A] hover:to-[#FF6B00] text-white font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(255,107,0,0.45)] hover:shadow-[0_0_28px_rgba(255,107,0,0.65)] active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 border border-orange-400/50"
          >
            <span>{isArabic ? 'الانتقال إلى المهمة التالية 🚀' : 'Go to Next Task 🚀'}</span>
            <ArrowRight className={`w-3.5 h-3.5 ${isArabic ? 'rotate-180' : ''}`} />
          </button>

          {/* زر إغلاق أنيق يوجه المستخدم فوراً إلى صفحة المهام لإكمال يوم العمل الجاري */}
          <button
            id="task-reward-close-to-tasks-btn"
            onClick={handleCloseAndGoToTasks}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/20 to-amber-500/15 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-500/40 text-orange-200 hover:text-white font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-orange-950/20 active:scale-95 group"
          >
            <Target className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>{isArabic ? `إغلاق والانتقال لصفحة المهام لإكمال يوم العمل ${counterDisplay} 🚀` : `Close & Go to Tasks (${counterDisplay}) 🚀`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
