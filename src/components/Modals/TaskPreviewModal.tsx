import React from 'react';
import { 
  Play, 
  X, 
  Sparkles, 
  Clock, 
  Coins, 
  ShieldCheck, 
  Flame, 
  ExternalLink, 
  CheckCircle2, 
  Lock, 
  Eye, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { VideoTask, VIPPlan } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { formatUSDT } from '../../utils/formatters';
import { soundEngine } from '../../utils/audio';

interface TaskPreviewModalProps {
  isOpen: boolean;
  task: VideoTask | null;
  currentVipPlan: VIPPlan;
  tasksCompletedToday: number;
  isTimerActive?: boolean;
  onClose: () => void;
  onStartTask: (task: VideoTask) => void;
  onOpenVIPUpgrade: () => void;
}

export const TaskPreviewModal: React.FC<TaskPreviewModalProps> = ({
  isOpen,
  task,
  currentVipPlan,
  tasksCompletedToday,
  isTimerActive = false,
  onClose,
  onStartTask,
  onOpenVIPUpgrade,
}) => {
  const { t, language } = useLanguage();
  const isAr = language === 'ar';

  if (!isOpen || !task) return null;

  const isCompleted = task.completedToday;
  const isLockedByVip = task.requiredVipLevel > currentVipPlan.level;
  const maxDailyTasks = Math.max(1, Math.floor(currentVipPlan?.tasksPerDay || 10));
  const safeCompletedToday = Math.min(maxDailyTasks, Math.max(0, Math.floor(Number(tasksCompletedToday) || 0)));
  const isLimitReached = safeCompletedToday >= maxDailyTasks;
  const remainingToday = Math.max(0, maxDailyTasks - safeCompletedToday);

  // Dynamic reward for current user's VIP tier (0.09 USDT for VIP 1, 0.204 USDT for VIP 2)
  const rewardAmount = currentVipPlan.level === 1 ? 0.09 : (currentVipPlan.rewardPerTaskUSDT || 0.204);
  const rewardDisplay = `+${formatUSDT(rewardAmount)} USDT`;

  // Localized title & sponsor if available
  const taskNumber = task.id.replace('task-', '');
  const taskTitle = t(`task.${taskNumber}.title`) !== `task.${taskNumber}.title`
    ? t(`task.${taskNumber}.title`)
    : task.title;

  const taskSponsor = t(`task.${taskNumber}.sponsor`) !== `task.${taskNumber}.sponsor`
    ? t(`task.${taskNumber}.sponsor`)
    : task.sponsor;

  const handleStart = () => {
    if (isCompleted || isTimerActive || isLimitReached) return;
    if (isLockedByVip) {
      soundEngine.playClick();
      onOpenVIPUpgrade();
      onClose();
      return;
    }
    soundEngine.playClick();
    onClose();
    onStartTask(task);
  };

  return (
    <div 
      id="task-preview-modal-overlay"
      className="fixed inset-0 z-[60] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="task-preview-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] sm:max-w-lg rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 pb-8 sm:pb-6 border border-orange-500/35 bg-[#0D0F17] shadow-[0_0_50px_rgba(255,107,0,0.25)] relative text-white max-h-[92vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200 space-y-2.5 sm:space-y-3.5 my-auto"
      >
        {/* Background ambient light */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#FF6B00]/12 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="task-preview-close-btn"
          onClick={onClose}
          className="absolute top-3 end-3 sm:top-4 sm:end-4 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-black/60 border border-white/15 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer transition-all hover:bg-white/10"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Modal Header */}
        <div className="relative z-10 flex items-center gap-2.5 pb-2 border-b border-white/10">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#FF6B00] via-amber-400 to-orange-500 p-0.5 shadow-md shadow-orange-500/25 shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-[10px] bg-black/70 flex items-center justify-center">
              <Eye className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#FF6B00]" />
            </div>
          </div>
          <div className="text-start">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                {isAr ? 'معاينة تفاصيل المهمة الإعلانية' : 'Task Preview & Verification'}
              </h3>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/40">
                {isAr ? 'إعلان معتمد 4K' : 'Verified 4K Ad'}
              </span>
            </div>
            <p className="text-[10.5px] sm:text-xs text-gray-400">
              {isAr ? 'راجع تفاصيل المحتوى والربح المضمون قبل بدء المهمة' : 'Inspect ad details and guaranteed reward before watching'}
            </p>
          </div>
        </div>

        {/* Cinematic Media Showcase Preview Card */}
        <div className="relative z-10 rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 bg-black group shadow-xl">
          <div className="relative h-36 sm:h-48 w-full overflow-hidden bg-black/90">
            <img
              src={task.thumbnailUrl || 'https://image.tmdb.org/t/p/w1280/i7CsYZtB0iK9Td1Ub4EQoCZ3ZP5.jpg'}
              alt={taskTitle}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 select-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/40 pointer-events-none" />

            {/* Top Info Badges */}
            <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
              <span className="px-2 py-0.5 rounded-lg bg-black/85 backdrop-blur-md text-[10px] sm:text-[11px] font-extrabold text-white border border-white/15 flex items-center gap-1.5 shadow-md">
                <ShieldCheck className="w-3 h-3 text-[#00A3FF]" />
                <span className="truncate max-w-[130px] sm:max-w-[150px]">{taskSponsor}</span>
              </span>

              <span className="px-2 py-0.5 rounded-lg bg-black/85 backdrop-blur-md text-[10px] sm:text-[11px] font-mono font-bold text-amber-300 border border-amber-400/30 flex items-center gap-1 shadow-md">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>{task.viewsCount} {isAr ? 'مشاهدة' : 'Views'}</span>
              </span>
            </div>

            {/* Center Animated Play Ring */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="relative flex items-center justify-center">
                <span className="absolute w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FF6B00]/30 animate-ping" />
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-[#FF6B00] to-amber-400 p-0.5 shadow-xl shadow-orange-500/50 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF6B00] fill-[#FF6B00] ms-0.5" />
                  </div>
                </div>
              </div>
              <span className="mt-1.5 px-2.5 py-0.5 rounded-full bg-black/85 text-[9px] font-black text-amber-300 border border-amber-400/40 tracking-wider uppercase backdrop-blur-md">
                {isAr ? 'جاهز للمشاهدة الفورية' : 'READY FOR STREAM'}
              </span>
            </div>

            {/* Bottom Meta Overlay */}
            <div className="absolute bottom-2 inset-x-2 flex items-center justify-between pointer-events-none">
              <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[9.5px] font-bold text-gray-200 border border-white/10 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#FF6B00]" />
                <span>{task.durationSeconds} {isAr ? 'ثوانٍ فقط' : 'Seconds Only'}</span>
              </span>

              <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[9.5px] font-bold text-[#00A3FF] border border-[#00A3FF]/30 flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#00A3FF]" />
                <span>{task.category}</span>
              </span>
            </div>
          </div>

          {/* Title & Tags description box */}
          <div className="p-2.5 sm:p-3 text-start bg-[#12141D] border-t border-white/10 space-y-1.5">
            <h4 className="text-xs sm:text-sm font-black text-white leading-snug">
              {taskTitle}
            </h4>

            <div className="flex items-center gap-1 flex-wrap">
              {task.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.2 rounded bg-white/5 text-[9.5px] font-medium text-gray-300 border border-white/10"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Guaranteed Profit Callout Card */}
        <div className="relative z-10 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-950/40 via-black/60 to-[#12141D] border border-emerald-500/30 flex items-center justify-between gap-2.5 text-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40 shadow-inner">
              <Coins className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">
                {isAr ? 'مكافأة المهمة المضمونة:' : 'Guaranteed Task Profit:'}
              </p>
              <p className="text-lg sm:text-xl font-black text-emerald-400 font-mono tracking-tight leading-tight">
                {rewardDisplay}
              </p>
            </div>
          </div>

          <div className="text-end">
            <span className="text-[9.5px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold block mb-0.5">
              {isAr ? 'سحب فوري' : 'Instant Payout'}
            </span>
            <span className="text-[10px] sm:text-[11px] text-gray-400 font-mono">
              {isAr ? `المتبقي: ${remainingToday} مهام` : `${remainingToday} Left Today`}
            </span>
          </div>
        </div>

        {/* Quick 3-Step Guide (كيف تعمل المهمة؟) */}
        <div className="relative z-10 p-2.5 rounded-xl sm:rounded-2xl bg-black/40 border border-white/5 text-start space-y-1.5">
          <p className="text-[10.5px] sm:text-[11px] font-bold text-gray-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#FF6B00]" />
            <span>{isAr ? 'خطوات تنفيذ المهمة وكسب الأرباح:' : 'How to Complete and Earn:'}</span>
          </p>

          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:gap-2 text-[10.5px] sm:text-[11px] text-gray-300">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/5 flex items-center sm:items-start gap-2">
              <span className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#FF6B00]/20 text-[#FF6B00] font-bold flex items-center justify-center shrink-0 text-[9.5px] sm:text-[10px] border border-[#FF6B00]/40">
                1
              </span>
              <span className="leading-tight">
                {isAr ? 'انقر زر "بدء المهمة" لفتح نافذة الإعلان' : 'Click "Start Task" to open ad link'}
              </span>
            </div>

            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/5 flex items-center sm:items-start gap-2">
              <span className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[9.5px] sm:text-[10px] border border-amber-400/40">
                2
              </span>
              <span className="leading-tight">
                {isAr ? 'شاهد الإعلان حتى انتهاء عداد 10 ثوانٍ' : 'Watch ad for 10s until countdown finishes'}
              </span>
            </div>

            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/5 flex items-center sm:items-start gap-2">
              <span className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-emerald-400/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[9.5px] sm:text-[10px] border border-emerald-400/40">
                3
              </span>
              <span className="leading-tight">
                {isAr ? 'تضاف الأرباح فوراً إلى رصيد محفظتك' : 'Earnings credit immediately to your wallet'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="relative z-10 pt-1 flex flex-col sm:flex-row items-center gap-2">
          {isCompleted ? (
            <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'تم إكمال هذه المهمة واستلام أرباحها بنجاح' : 'Task completed and reward claimed successfully'}</span>
            </div>
          ) : isLockedByVip ? (
            <button
              id="task-preview-upgrade-btn"
              onClick={handleStart}
              className="w-full py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/30 cursor-pointer transition-all active:scale-95"
            >
              <Lock className="w-3.5 h-3.5 text-black" />
              <span>{isAr ? `ترقية الباقة لفتح باقة VIP ${task.requiredVipLevel}` : `Upgrade to VIP ${task.requiredVipLevel} to Unlock`}</span>
            </button>
          ) : isLimitReached ? (
            <div className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>{isAr ? 'تم الوصول للحد اليومي، يرجى الترقية لمهام أكثر' : 'Daily quota reached. Upgrade for more tasks'}</span>
            </div>
          ) : (
            <button
              id="task-preview-start-btn"
              onClick={handleStart}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-[#FF6B00] via-amber-400 to-orange-500 hover:from-[#ff7c1a] hover:via-amber-300 hover:to-orange-400 text-black flex items-center justify-center gap-1.5 shadow-xl shadow-orange-500/30 cursor-pointer transition-all active:scale-95 group/start relative overflow-hidden"
            >
              {/* Shimmer light beam */}
              <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 animate-shine pointer-events-none" />
              <Play className="w-3.5 h-3.5 fill-black shrink-0" />
              <span className="drop-shadow-sm font-black tracking-wide truncate">
                {isAr 
                  ? `بدء المهمة وكسب ${rewardDisplay} الآن 🚀` 
                  : `Start Task & Earn ${rewardDisplay} Now 🚀`}
              </span>
              <ExternalLink className="w-3 h-3 shrink-0 opacity-80" />
            </button>
          )}

          <button
            id="task-preview-cancel-btn"
            onClick={onClose}
            className="w-full sm:w-auto py-2 sm:py-2.5 px-4 rounded-xl font-bold text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer shrink-0"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
