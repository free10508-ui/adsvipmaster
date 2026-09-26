import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  CheckCheck, 
  Trash2, 
  X, 
  ArrowUpRight, 
  ArrowDownLeft,
  Clock, 
  Inbox,
  ShieldCheck,
  Crown,
  Gift,
  Copy,
  Check,
  Receipt,
  Radio,
  ExternalLink
} from 'lucide-react';
import { SystemNotification, NotificationType, Transaction } from '../../types';
import { soundEngine } from '../../utils/audio';
import { storage } from '../../utils/storage';
import { firebaseSync } from '../../utils/firebaseSync';

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: SystemNotification[];
  transactions?: Transaction[];
  userId?: string;
  userEmail?: string;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDeleteNotification?: (id: string) => void;
  onClearAll?: () => void;
}

export const InboxModal: React.FC<InboxModalProps> = ({
  isOpen,
  onClose,
  notifications: initialNotifications,
  transactions: propTransactions,
  userId,
  userEmail,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
}) => {
  const effectiveEmail = (userEmail || storage.getCurrentUserEmail() || '').trim().toLowerCase();

  const [internalNotifs, setInternalNotifs] = useState<SystemNotification[]>(() => {
    if (initialNotifications && initialNotifications.length > 0) return initialNotifications;
    return storage.getUserNotifications(effectiveEmail);
  });

  // Debounced listener active strictly and exclusively while modal is OPEN to eliminate memory leaks and background re-renders
  useEffect(() => {
    if (!isOpen) return;

    // Load initial fresh state
    setInternalNotifs(storage.getUserNotifications(effectiveEmail));

    let timer: any = null;
    const handleNotifsChange = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setInternalNotifs(storage.getUserNotifications(effectiveEmail));
      }, 250);
    };

    window.addEventListener('vipads_notifications_changed', handleNotifsChange);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('vipads_notifications_changed', handleNotifsChange);
    };
  }, [isOpen, effectiveEmail]);

  const [activeMainTab, setActiveMainTab] = useState<'notifications' | 'transactions'>('notifications');
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const [txFilter, setTxFilter] = useState<'all' | 'deposit' | 'withdraw' | 'vip_upgrade'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const displayUID = userId || (userEmail ? `UID-${userEmail.slice(0, 4).toUpperCase()}` : 'UID-USR-1002');
  const activeNotifications = internalNotifs;
  const unreadCount = activeNotifications.filter(n => !n.read).length;

  const filteredNotifications = notifFilter === 'unread' 
    ? activeNotifications.filter(n => !n.read)
    : activeNotifications;

  const transactions = (propTransactions && propTransactions.length > 0)
    ? propTransactions
    : storage.getAllTransactions().filter(t => {
        if (!t.userEmail) return true;
        const uEmail = effectiveEmail;
        const tEmail = (t.userEmail || '').toLowerCase().trim();
        return tEmail === uEmail;
      });

  const filteredTransactions = transactions.filter(t => {
    if (txFilter === 'all') return true;
    return t.type === txFilter;
  });

  const handleMarkAsReadInternal = (id: string) => {
    storage.markNotificationAsRead(effectiveEmail, id);
    try {
      firebaseSync.markNotificationReadLive(id);
    } catch {}
    setInternalNotifs(storage.getUserNotifications(effectiveEmail));
    if (onMarkAsRead) onMarkAsRead(id);
  };

  const handleMarkAllAsReadInternal = () => {
    storage.markAllNotificationsAsRead(effectiveEmail);
    setInternalNotifs(storage.getUserNotifications(effectiveEmail));
    if (onMarkAllAsRead) onMarkAllAsRead();
  };

  const handleDeleteNotificationInternal = (id: string) => {
    storage.deleteNotification(effectiveEmail, id);
    setInternalNotifs(storage.getUserNotifications(effectiveEmail));
    if (onDeleteNotification) onDeleteNotification(id);
  };

  const handleClearAllInternal = () => {
    storage.clearAllNotifications(effectiveEmail);
    setInternalNotifs([]);
    if (onClearAll) onClearAll();
  };

  const handleCopy = (text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      soundEngine.playClick();
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch {}
  };

  const getNotificationVisuals = (type: NotificationType) => {
    switch (type) {
      case 'deposit_pending':
        return {
          icon: <Clock className="w-5 h-5 text-amber-400 animate-pulse" />,
          badgeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
          cardGlow: 'hover:border-amber-500/40 bg-gradient-to-l from-amber-950/20 via-[#131722]/80 to-[#10121A]',
          iconContainerBg: 'bg-amber-500/20 border-amber-500/30',
          defaultTitle: 'طلب إيداع قيد المراجعة',
          accentColor: 'text-amber-400',
        };
      case 'deposit_approved':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          badgeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
          cardGlow: 'hover:border-emerald-500/40 bg-gradient-to-l from-emerald-950/20 via-[#131722]/80 to-[#10121A]',
          iconContainerBg: 'bg-emerald-500/20 border-emerald-500/30',
          defaultTitle: 'تم قبول الإيداع',
          accentColor: 'text-emerald-400',
        };
      case 'deposit_rejected':
        return {
          icon: <XCircle className="w-5 h-5 text-red-400" />,
          badgeBg: 'bg-red-500/15 border-red-500/40 text-red-300',
          cardGlow: 'hover:border-red-500/40 bg-gradient-to-l from-red-950/20 via-[#131722]/80 to-[#10121A]',
          iconContainerBg: 'bg-red-500/20 border-red-500/30',
          defaultTitle: 'تم رفض الإيداع',
          accentColor: 'text-red-400',
        };
      case 'vip_activated':
        return {
          icon: <Crown className="w-5 h-5 text-[#FF6B00]" />,
          badgeBg: 'bg-[#FF6B00]/15 border-[#FF6B00]/40 text-[#FF6B00]',
          cardGlow: 'hover:border-[#FF6B00]/40 bg-gradient-to-l from-orange-950/20 via-[#131722]/80 to-[#10121A]',
          iconContainerBg: 'bg-[#FF6B00]/20 border-[#FF6B00]/30',
          defaultTitle: 'تفعيل باقة VIP',
          accentColor: 'text-[#FF6B00]',
        };
      case 'withdrawal_pending':
        return {
          icon: <Clock className="w-5 h-5 text-amber-400 animate-pulse" />,
          badgeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
          cardGlow: 'hover:border-amber-500/40 bg-gradient-to-l from-amber-950/20 via-[#131722]/80 to-[#10121A]',
          iconContainerBg: 'bg-amber-500/20 border-amber-500/30',
          defaultTitle: 'طلب سحب قيد المعالجة',
          accentColor: 'text-amber-400',
        };
      case 'withdrawal_approved':
        return {
          icon: <ArrowUpRight className="w-5 h-5 text-cyan-400" />,
          badgeBg: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
          cardGlow: 'hover:border-cyan-500/40 bg-gradient-to-l from-cyan-950/20 via-[#131722]/80 to-[#10121A]',
          iconContainerBg: 'bg-cyan-500/20 border-cyan-500/30',
          defaultTitle: 'تم قبول السحب',
          accentColor: 'text-cyan-400',
        };
      case 'withdrawal_rejected':
        return {
          icon: <XCircle className="w-5 h-5 text-red-400" />,
          badgeBg: 'bg-red-500/15 border-red-500/40 text-red-300',
          cardGlow: 'hover:border-red-500/40 bg-gradient-to-l from-red-950/20 via-[#131722]/80 to-[#10121A]',
          iconContainerBg: 'bg-red-500/20 border-red-500/30',
          defaultTitle: 'تم رفض السحب',
          accentColor: 'text-red-400',
        };
      case 'referral_bonus':
        return {
          icon: <Gift className="w-5 h-5 text-amber-400" />,
          badgeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
          cardGlow: 'hover:border-amber-500/40 bg-gradient-to-l from-amber-950/20 via-[#131722]/80 to-[#10121A]',
          iconContainerBg: 'bg-amber-500/20 border-amber-500/30',
          defaultTitle: 'عمولة إحالة جديدة',
          accentColor: 'text-amber-400',
        };
      default:
        return {
          icon: <Sparkles className="w-5 h-5 text-amber-400" />,
          badgeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
          cardGlow: 'hover:border-amber-500/40 bg-gradient-to-l from-amber-950/20 via-[#131722]/80 to-[#10121A]',
          iconContainerBg: 'bg-amber-500/20 border-amber-500/30',
          defaultTitle: 'إشعار من المنظومة',
          accentColor: 'text-amber-400',
        };
    }
  };

  const formatNotificationTime = (timestamp: string | Date) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffMinutes < 1) return 'الآن';
      if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getTransactionVisuals = (type: Transaction['type'], status: Transaction['status']) => {
    const isCompleted = status === 'completed' || status === 'approved';
    const isPending = status === 'pending' || status === 'processing';

    let typeLabel = 'معاملة';
    let typeIcon = <Receipt className="w-4 h-4 text-gray-400" />;
    let isPositive = false;

    if (type === 'deposit') {
      typeLabel = 'شحن رصيد إيداع';
      typeIcon = <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      isPositive = true;
    } else if (type === 'withdraw') {
      typeLabel = 'طلب سحب أرباح';
      typeIcon = <ArrowUpRight className="w-4 h-4 text-cyan-400" />;
      isPositive = false;
    } else if (type === 'vip_upgrade') {
      typeLabel = 'ترقية باقة VIP';
      typeIcon = <Crown className="w-4 h-4 text-[#FF6B00]" />;
      isPositive = false;
    } else if (type === 'task_reward' || type === 'referral_commission') {
      typeLabel = 'عمولة وأرباح';
      typeIcon = <Gift className="w-4 h-4 text-amber-400" />;
      isPositive = true;
    }

    let statusBadge = {
      label: 'مكتمل بنجاح',
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    };

    if (isPending) {
      statusBadge = {
        label: 'قيد المعالجة والتأكيد',
        color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        icon: <Clock className="w-3.5 h-3.5 animate-pulse" />,
      };
    } else if (status === 'failed') {
      statusBadge = {
        label: 'ملغي / مرفوض',
        color: 'bg-red-500/15 text-red-400 border-red-500/30',
        icon: <XCircle className="w-3.5 h-3.5" />,
      };
    }

    return { typeLabel, typeIcon, isPositive, statusBadge };
  };

  return (
    <div 
      dir="rtl"
      id="inbox-system-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div 
        id="inbox-modal-card"
        className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl p-4 sm:p-5 glass-panel-elevated border border-white/15 bg-[#0C0E14] text-white flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* TOP HEADER WITH USER UID & REAL-TIME STATUS */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF6B00] via-amber-500 to-[#00A3FF] p-0.5 shadow-lg shadow-orange-500/20 shrink-0">
              <div className="w-full h-full bg-[#0E1017] rounded-[14px] flex items-center justify-center">
                <Mail className="w-5 h-5 text-[#FF6B00]" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-[#0C0E14]"></span>
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  مركز الرسائل والمعاملات
                </h3>
                {/* User UID Pill */}
                <button
                  type="button"
                  id="inbox-user-uid-pill"
                  onClick={() => handleCopy(displayUID, 'uid')}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-400 transition-all cursor-pointer active:scale-95"
                  title="انقر لنسخ الـ UID"
                >
                  <span>UID: {displayUID}</span>
                  {copiedId === 'uid' ? (
                    <Check className="w-3 h-3 text-emerald-300" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-70" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-400">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span className="text-emerald-400/90 font-medium">متصل ومزامن لحظياً بقاعدة البيانات الحية</span>
              </div>
            </div>
          </div>

          <button
            id="close-inbox-modal-btn"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer active:scale-95 shrink-0"
            title="إغلاق"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* PRIMARY DUAL SWITCHER: [الإشعارات والتنبيهات] vs [سجل المعاملات] */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/60 rounded-xl border border-white/10 my-3 shrink-0">
          <button
            type="button"
            id="inbox-tab-notifications"
            onClick={() => {
              soundEngine.playClick();
              setActiveMainTab('notifications');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeMainTab === 'notifications'
                ? 'bg-gradient-to-r from-[#FF6B00] to-orange-500 text-black shadow-md shadow-orange-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>الإشعارات والتنبيهات</span>
            {unreadCount > 0 ? (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeMainTab === 'notifications' ? 'bg-black text-white font-bold' : 'bg-red-500 text-white'
              }`}>
                {unreadCount}
              </span>
            ) : (
              <span className="text-[10px] opacity-75">({activeNotifications.length})</span>
            )}
          </button>

          <button
            type="button"
            id="inbox-tab-transactions"
            onClick={() => {
              soundEngine.playClick();
              setActiveMainTab('transactions');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeMainTab === 'transactions'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-md shadow-emerald-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>سجل المعاملات</span>
            <span className={`text-[10px] font-mono ${
              activeMainTab === 'transactions' ? 'text-black font-bold' : 'opacity-75'
            }`}>
              ({transactions.length})
            </span>
          </button>
        </div>

        {/* ================= VIEW 1: NOTIFICATIONS ================= */}
        {activeMainTab === 'notifications' && (
          <>
            {/* TABS & ACTIONS TOOLBAR */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/5 gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 text-xs font-bold">
                <button
                  id="inbox-filter-all"
                  onClick={() => {
                    soundEngine.playClick();
                    setNotifFilter('all');
                  }}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer text-xs ${
                    notifFilter === 'all' 
                      ? 'bg-white/15 text-white font-black' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  الكل ({activeNotifications.length})
                </button>
                <button
                  id="inbox-filter-unread"
                  onClick={() => {
                    soundEngine.playClick();
                    setNotifFilter('unread');
                  }}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer text-xs ${
                    notifFilter === 'unread' 
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-black' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  غير مقروء ({unreadCount})
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    id="inbox-mark-all-read-btn"
                    onClick={() => {
                      soundEngine.playClick();
                      handleMarkAllAsReadInternal();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
                    title="تحديد الكل كمقروء"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden xs:inline">قراءة الكل</span>
                  </button>
                )}

                {activeNotifications.length > 0 && (
                  <button
                    id="inbox-clear-all-btn"
                    onClick={() => {
                      soundEngine.playClick();
                      handleClearAllInternal();
                    }}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer active:scale-95"
                    title="مسح الكل"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* NOTIFICATIONS LETTERS LIST */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-2 space-y-2.5 pr-0.5">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 mb-3">
                    <Inbox className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-300">
                    {notifFilter === 'unread' ? 'لا توجد رسائل جديدة غير مقروءة' : 'صندوق الرسائل فارغ'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    ستتلقى هنا إشعارات فورية عند تسجيل شحن، تأكيد إيداع، طلب سحب، شراء خطة VIP، أو نزول عمولة إحالة.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const visuals = getNotificationVisuals(notif.type);
                  return (
                    <div
                      key={notif.id}
                      id={`letter-item-${notif.id}`}
                      onClick={() => {
                        if (!notif.read) {
                          handleMarkAsReadInternal(notif.id);
                        }
                      }}
                      className={`relative p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
                        notif.read 
                          ? 'bg-[#12141C]/60 border-white/5 opacity-85 hover:opacity-100 hover:border-white/15' 
                          : `${visuals.cardGlow} border-white/15 shadow-lg shadow-black/40`
                      }`}
                    >
                      {/* Accent strip for unread message */}
                      {!notif.read && (
                        <span className="absolute start-0 top-3 bottom-3 w-1 rounded-e-full bg-[#FF6B00] shadow-[0_0_8px_#FF6B00]" />
                      )}

                      <div className="flex items-start gap-3">
                        {/* Visual Icon Badge */}
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0 ${visuals.iconContainerBg}`}>
                          {visuals.icon}
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${visuals.badgeBg}`}>
                                {notif.badgeLabel || visuals.defaultTitle}
                              </span>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_#EF4444]" />
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-500" />
                                {formatNotificationTime(notif.timestamp)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotificationInternal(notif.id);
                                }}
                                className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                title="حذف الرسالة"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Main Message Text */}
                          <p className="text-xs sm:text-[13px] font-bold text-gray-100 leading-relaxed">
                            {notif.message}
                          </p>

                          {/* Optional details footer: Amount or VIP Level */}
                          {(notif.amount !== undefined || notif.vipLevel !== undefined) && (
                            <div className="pt-1 flex items-center gap-2 text-[11px] font-mono flex-wrap">
                              {notif.amount !== undefined && (
                                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-emerald-400 font-bold">
                                  المبلغ: +${notif.amount.toFixed(2)} USDT
                                </span>
                              )}
                              {notif.vipLevel !== undefined && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                                  المستوى: VIP {notif.vipLevel}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ================= VIEW 2: TRANSACTIONS LOG ================= */}
        {activeMainTab === 'transactions' && (
          <>
            {/* FILTER CHIPS FOR TRANSACTIONS */}
            <div className="flex items-center gap-1.5 pb-2.5 border-b border-white/5 overflow-x-auto custom-scrollbar shrink-0">
              <button
                type="button"
                id="tx-filter-all"
                onClick={() => {
                  soundEngine.playClick();
                  setTxFilter('all');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  txFilter === 'all'
                    ? 'bg-emerald-500 text-black font-black shadow-sm'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                الكل ({transactions.length})
              </button>
              <button
                type="button"
                id="tx-filter-deposit"
                onClick={() => {
                  soundEngine.playClick();
                  setTxFilter('deposit');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  txFilter === 'deposit'
                    ? 'bg-emerald-500 text-black font-black shadow-sm'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                شحن وإيداع
              </button>
              <button
                type="button"
                id="tx-filter-withdraw"
                onClick={() => {
                  soundEngine.playClick();
                  setTxFilter('withdraw');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  txFilter === 'withdraw'
                    ? 'bg-emerald-500 text-black font-black shadow-sm'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                سحوبات
              </button>
              <button
                type="button"
                id="tx-filter-vip"
                onClick={() => {
                  soundEngine.playClick();
                  setTxFilter('vip_upgrade');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  txFilter === 'vip_upgrade'
                    ? 'bg-emerald-500 text-black font-black shadow-sm'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                ترقيات VIP
              </button>
            </div>

            {/* TRANSACTIONS LIST */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-2 space-y-2.5 pr-0.5">
              {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 mb-3">
                    <Receipt className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-300">لا توجد معاملات مسجلة</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    تظهر هنا كافة المعاملات المالية المعتمدة وقيد المراجعة الخاصة بـ {displayUID} مباشرة من السيرفر.
                  </p>
                </div>
              ) : (
                filteredTransactions.map((tx) => {
                  const visuals = getTransactionVisuals(tx.type, tx.status);
                  return (
                    <div
                      key={tx.id}
                      id={`tx-card-${tx.id}`}
                      className="p-3.5 rounded-xl border border-white/10 bg-[#12151E]/90 hover:border-white/20 transition-all space-y-2.5 shadow-md"
                    >
                      {/* Top Row: Type, Status Badge, Amount */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                            {visuals.typeIcon}
                          </div>
                          <div>
                            <span className="text-xs font-black text-white block">
                              {visuals.typeLabel}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {formatNotificationTime(tx.timestamp)}
                            </span>
                          </div>
                        </div>

                        <div className="text-left">
                          <span className={`text-sm font-black font-mono block ${
                            visuals.isPositive ? 'text-emerald-400' : 'text-orange-400'
                          }`}>
                            {visuals.isPositive ? '+' : '-'}${tx.amountUSDT.toFixed(2)} USDT
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${visuals.statusBadge.color}`}>
                            {visuals.statusBadge.icon}
                            {visuals.statusBadge.label}
                          </span>
                        </div>
                      </div>

                      {/* Description and metadata */}
                      {tx.description && (
                        <p className="text-[11px] text-gray-300 bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5 leading-relaxed font-sans">
                          {tx.description}
                        </p>
                      )}

                      {/* Meta Footer: TxID / Hash with Quick Copy */}
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-1 border-t border-white/5">
                        <span className="truncate max-w-[140px] xs:max-w-[180px]">
                          رقم المعاملة: #{tx.id.slice(0, 16)}
                        </span>
                        {tx.txHash && (
                          <button
                            type="button"
                            onClick={() => handleCopy(tx.txHash!, tx.id)}
                            className="inline-flex items-center gap-1 text-gray-400 hover:text-emerald-300 transition-colors cursor-pointer"
                            title="نسخ Hash المعاملة"
                          >
                            <span>Hash: {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}</span>
                            {copiedId === tx.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-60" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* FOOTER INFO */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-gray-300 font-medium">نظام إشعارات ومعاملات آمن ومشفر فورياً</span>
          </span>
          <button
            id="close-inbox-footer-btn"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold transition-all cursor-pointer text-xs active:scale-95"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
