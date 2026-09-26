import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  X, 
  Coins, 
  ShieldCheck, 
  Crown, 
  ArrowRight, 
  Flame, 
  TrendingUp, 
  Check,
  Zap,
  ArrowDownToLine,
  Target,
  CalendarCheck
} from 'lucide-react';
import { ToastNotificationData } from '../types';
import { soundEngine } from '../utils/audio';
import { formatUSDT } from '../utils/formatters';
import { INITIAL_VIP_PLANS } from '../data/initialData';

interface ToastNotificationProps {
  toast: ToastNotificationData | null;
  onClose: () => void;
  userVipLevel?: number;
  tasksCompletedToday?: number;
  onNavigateToTasks?: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toast,
  onClose,
  userVipLevel = 2,
  tasksCompletedToday = 0,
  onNavigateToTasks,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  if (!toast) return null;

  const isArabic = true; // Platform default is Arabic

  // Dynamic VIP tier resolution (supports VIP 2, VIP 10, or current level dynamically)
  const effectiveVipLevel = toast.vipLevel ?? userVipLevel ?? 2;
  const currentPlan = INITIAL_VIP_PLANS.find((p) => p.level === effectiveVipLevel) || INITIAL_VIP_PLANS[1];

  // Determine modal theme and action type safely
  const toastTitle = toast.title || '';
  const toastMessage = toast.message || '';
  const actionType = toast.actionType || (
    toast.type === 'vip' 
      ? 'vip_activated' 
      : (toastTitle.includes('سحب') || toastMessage.includes('سحب') || toastTitle.toLowerCase().includes('withdraw')) 
        ? 'withdraw_success' 
        : (toastTitle.includes('مهمة') || toastTitle.includes('إعلان') || toastMessage.includes('المهمة'))
          ? 'task_reward'
          : 'general'
  );

  const handleDismiss = () => {
    setIsClosing(true);
    soundEngine.playClick();
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  const handleActionClick = () => {
    setIsClosing(true);
    soundEngine.playClickSound();
    if (toast.onAction) {
      toast.onAction();
    }
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  // Close and navigate immediately to the tasks page to complete current work day
  const handleCloseAndGoToTasks = () => {
    setIsClosing(true);
    soundEngine.playClickSound();
    const navFn = toast.onNavigateToTasks || onNavigateToTasks;
    if (navFn) {
      navFn();
    }
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  // Primary action button text
  let primaryButtonText = toast.actionButtonText;
  if (!primaryButtonText) {
    if (actionType === 'vip_activated') {
      primaryButtonText = 'الانتقال إلى المهام الآن 🚀';
    } else if (actionType === 'withdraw_success') {
      primaryButtonText = 'حسناً فهمت';
    } else if (actionType === 'task_reward') {
      primaryButtonText = 'الانتقال إلى المهمة التالية 🚀';
    } else {
      primaryButtonText = 'حسناً فهمت';
    }
  }

  return (
    <div 
      id="global-center-modal-overlay"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md select-none transition-opacity duration-200 ${
        isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      onClick={handleDismiss}
      dir="rtl"
    >
      <div
        id="global-center-popup-card"
        className={`w-full max-w-[385px] sm:max-w-[420px] mx-auto rounded-3xl p-5 sm:p-6 border-2 border-orange-500/70 bg-gradient-to-b from-[#1A140E] via-[#0E1017] to-[#0A0B10] shadow-[0_0_50px_rgba(255,107,0,0.35)] relative text-white text-center space-y-4 overflow-hidden transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'animate-in zoom-in-95 duration-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glowing Background Auras */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FF6B00]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 right-0 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Close Button (X) */}
        <button
          id="global-center-modal-close-x"
          onClick={handleDismiss}
          aria-label="إغلاق"
          className="absolute top-4 left-4 sm:top-5 sm:left-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Pulsing 3D Icon and Verified Badge */}
        <div className="flex flex-col items-center pt-1">
          <div className="relative">
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-tr from-[#FF6B00] via-amber-500 to-orange-400 p-0.5 shadow-2xl shadow-orange-500/50">
              <div className="w-full h-full bg-[#0E1017] rounded-[22px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#FF6B00]/20 to-transparent" />
                {actionType === 'vip_activated' || toast.type === 'vip' ? (
                  <Crown className="w-10 h-10 sm:w-11 sm:h-11 text-[#FF6B00] animate-pulse drop-shadow-[0_0_15px_rgba(255,107,0,0.8)]" />
                ) : actionType === 'withdraw_success' ? (
                  <ArrowDownToLine className="w-10 h-10 sm:w-11 sm:h-11 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                ) : actionType === 'task_reward' ? (
                  <Coins className="w-10 h-10 sm:w-11 sm:h-11 text-[#FF6B00] animate-pulse drop-shadow-[0_0_15px_rgba(255,107,0,0.8)]" />
                ) : (
                  <Sparkles className="w-10 h-10 sm:w-11 sm:h-11 text-amber-400 animate-pulse drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
                )}
              </div>
            </div>
            
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 border-2 border-[#0E1017] items-center justify-center text-white text-[10px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </span>
          </div>

          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-[#FF6B00] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {actionType === 'vip_activated'
                ? `تفعيل معتمد • ${currentPlan.name} نشط ⚡`
                : actionType === 'withdraw_success'
                  ? 'سحب معتمد • TRC-20 ⚡'
                  : actionType === 'task_reward'
                    ? 'مكافأة معتمدة وموثقة ⚡'
                    : 'إشعار نظام معتمد ⚡'}
            </span>
          </div>
        </div>

        {/* Dynamic VIP Tier Status Banner (سواء كان المستخدم VIP 2 أو VIP 10) */}
        <div 
          id="unified-popup-vip-status-strip"
          className="rounded-2xl p-2.5 sm:p-3 bg-gradient-to-r from-black/80 via-[#161B28]/80 to-black/80 border border-amber-500/30 shadow-inner flex items-center justify-between gap-2 text-right"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-amber-300">
                  {effectiveVipLevel === 10 ? 'حساب VIP 10 (الماسية الملكية)' : `حساب ${currentPlan.name}`}
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  نشط
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium block">
                {effectiveVipLevel === 10
                  ? 'ربح 25.00$ لكل مهمة (250.00$ يومياً)'
                  : `ربح ${currentPlan.rewardPerTaskUSDT.toFixed(3)}$ لكل مهمة (${currentPlan.dailyIncomeUSDT.toFixed(2)}$ يومياً)`}
              </span>
            </div>
          </div>
          <div className="text-left shrink-0">
            <span className="text-[10px] text-gray-400 block font-medium">مستوى العضوية</span>
            <span className="text-xs font-black font-mono text-cyan-400">Level {effectiveVipLevel}</span>
          </div>
        </div>

        {/* Modal Title and Message */}
        <div className="space-y-1 px-1">
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight">
            {toast.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-semibold">
            {toast.message}
          </p>
        </div>

        {/* Highlight Stats Row for Amounts */}
        {toast.amount !== undefined && toast.amount > 0 && (
          <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
            <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
              <div className="text-[10px] text-gray-400 font-medium mb-0.5">
                {actionType === 'withdraw_success' ? 'قيمة السحب الصافي' : 'القيمة المعتمدة'}
              </div>
              <div className="text-sm sm:text-base font-extrabold text-[#FF6B00] font-mono flex items-center justify-center gap-1">
                <span>{formatUSDT(toast.amount)} USDT</span>
              </div>
            </div>

            <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
              <div className="text-[10px] text-gray-400 font-medium mb-0.5">
                الحالة التشغيلية
              </div>
              <div className="text-xs font-extrabold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                <Check className="w-3.5 h-3.5" />
                <span>{actionType === 'withdraw_success' ? 'قيد المراجعة الفورية' : 'تم التنفيذ بنجاح'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls: Primary + Elegant Close & Navigate to Tasks Button */}
        <div className="space-y-2 pt-1">
          {/* Main Action Button */}
          <button
            id="global-center-modal-action-btn"
            onClick={handleActionClick}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#FF6B00] via-orange-500 to-[#FF8533] hover:from-[#FF7A1A] hover:to-[#FF6B00] text-white font-black text-sm sm:text-base shadow-[0_0_25px_rgba(255,107,0,0.5)] hover:shadow-[0_0_35px_rgba(255,107,0,0.7)] active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 border border-orange-400/50"
          >
            <span>{primaryButtonText}</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>

          {/* زر إغلاق أنيق يوجه المستخدم فوراً إلى صفحة المهام لإكمال يوم العمل الجاري */}
          <button
            id="unified-popup-close-to-tasks-btn"
            onClick={handleCloseAndGoToTasks}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/20 to-amber-500/15 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-500/50 text-orange-200 hover:text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-orange-950/30 active:scale-95 group"
          >
            <Target className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>إغلاق والانتقال لصفحة المهام 🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
};

