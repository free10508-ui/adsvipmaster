import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User, 
  ShieldCheck, 
  PlusCircle, 
  MinusCircle, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Gift, 
  Trash2, 
  Sliders, 
  Zap, 
  Check, 
  Clock, 
  Users, 
  AlertOctagon, 
  Search, 
  Mail, 
  Wallet,
  Sparkles,
  ChevronRight,
  UserCheck,
  Plus,
  Minus,
  ArrowDownToLine,
  Coins,
  Radio
} from 'lucide-react';
import { UserProfile, VIPPlan, VideoTask, Transaction } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { soundEngine } from '../../utils/audio';
import { storage, StoredAccount } from '../../utils/storage';
import { firebaseSync } from '../../utils/firebaseSync';

interface UserAdminControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  vipPlans: VIPPlan[];
  tasks: VideoTask[];
  transactions: Transaction[];
  onUpdateUser: (updatedFields: Partial<UserProfile>) => void;
  onSetVipLevel: (level: number, freeUpgrade?: boolean) => void;
  onAddDeposit: (amount: number, description?: string) => void;
  onDeductBalance: (amount: number) => void;
  onAdjustUserBalance?: (
    email: string, 
    amount: number, 
    type: 'add_deposit' | 'add_balance' | 'deduct_deposit' | 'deduct_balance' | 'add' | 'deduct'
  ) => void;
  onSwitchUser?: (email: string) => void;
  onResetDailyTasks: () => void;
  onCompleteAllDailyTasks: () => void;
  onAddReferral: (customName?: string, bonusAmount?: number) => void;
  onClaimAllMilestones: () => void;
  onAddCustomTransaction: (tx: Partial<Transaction>) => void;
  onClearTransactions: () => void;
  onApproveTransaction?: (txId: string) => void;
  onRejectTransaction?: (txId: string) => void;
  onApproveWithdrawal?: (txId: string) => void;
  onRejectWithdrawal?: (txId: string) => void;
  onMasterResetPlatform?: () => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'vip', amount?: number) => void;
}

type AdminSectionTab = 'all' | 'users' | 'deposits' | 'withdrawals' | 'factory_reset';

export const UserAdminControlModal: React.FC<UserAdminControlModalProps> = ({
  isOpen,
  onClose,
  user,
  vipPlans,
  transactions,
  onUpdateUser,
  onSetVipLevel,
  onAddDeposit,
  onDeductBalance,
  onAdjustUserBalance,
  onSwitchUser,
  onResetDailyTasks,
  onCompleteAllDailyTasks,
  onAddReferral,
  onClaimAllMilestones,
  onClearTransactions,
  onApproveTransaction,
  onRejectTransaction,
  onApproveWithdrawal,
  onRejectWithdrawal,
  onMasterResetPlatform,
  onShowToast
}) => {
  const { language } = useLanguage();
  const [activeSection, setActiveSection] = useState<AdminSectionTab>('all');
  const [withdrawalSubFilter, setWithdrawalSubFilter] = useState<'pending' | 'all' | 'completed' | 'failed'>('pending');
  
  // Real registered accounts state loaded directly from storage
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Per-user inline amount control state
  const [inlineAmounts, setInlineAmounts] = useState<Record<string, string>>({});

  // Dedicated strictly isolated balance adjustment state
  const [selectedTargetEmail, setSelectedTargetEmail] = useState('');
  const [depositInputAmount, setDepositInputAmount] = useState('10');
  const [totalBalanceInputAmount, setTotalBalanceInputAmount] = useState('5');
  const [pendingBonusInputAmount, setPendingBonusInputAmount] = useState('0.25');

  // Quick Funds Modal State for specific user
  const [quickFundsModal, setQuickFundsModal] = useState<{
    isOpen: boolean;
    type: 'add' | 'deduct';
    userEmail: string;
    amount: string;
  }>({
    isOpen: false,
    type: 'add',
    userEmail: '',
    amount: '50.00'
  });

  // Master Reset Security Confirmation Dialog State
  const [showMasterResetConfirm, setShowMasterResetConfirm] = useState(false);
  const [approvingTxIds, setApprovingTxIds] = useState<Set<string>>(new Set());

  // Immediate Local Reactive Transaction State
  const [modalTransactions, setModalTransactions] = useState<Transaction[]>(transactions);

  useEffect(() => {
    setModalTransactions((prev) => {
      if (prev.length === transactions.length) {
        const hasDiff = prev.some((pt, i) => {
          const nt = transactions[i];
          return !nt || pt.id !== nt.id || pt.status !== nt.status || pt.amountUSDT !== nt.amountUSDT;
        });
        if (!hasDiff) return prev;
      }
      return transactions;
    });
  }, [transactions]);

  const [isPullingLive, setIsPullingLive] = useState(false);
  const hasPulledLiveOnOpenRef = useRef(false);

  // Reload accounts when modal opens or live broadcast events arrive
  useEffect(() => {
    if (isOpen) {
      const reload = () => {
        const allUsers = storage.getAllUsers();
        setAccounts(allUsers);
        const allTxs = storage.getAllTransactions();
        setModalTransactions(allTxs);
        const uName = user?.username || '';
        if (!selectedEmail && allUsers.length > 0) {
          setSelectedEmail(uName.includes('@') ? uName : (allUsers[0]?.email || ''));
        }
        if (!selectedTargetEmail && allUsers.length > 0) {
          setSelectedTargetEmail(allUsers[0]?.email || '');
        }
      };

      reload();

      // Subscribe to real-time live onSnapshot stream for all registered accounts
      const unsubAccounts = firebaseSync.subscribeToAllAccountsLive((freshAccounts) => {
        setAccounts(freshAccounts);
      });

      // Subscribe to real-time live onSnapshot stream for all transactions
      const unsubTxs = firebaseSync.subscribeToAllTransactionsLive((freshTxs) => {
        setModalTransactions(freshTxs);
      });

      // Trigger instantaneous bidirectional cloud handshake once per modal open
      if (!hasPulledLiveOnOpenRef.current) {
        hasPulledLiveOnOpenRef.current = true;
        firebaseSync.forcePullAndPushAll().then(() => {
          reload();
        }).catch(() => {});
      }

      window.addEventListener('storage', reload);
      window.addEventListener('vipads:team_updated', reload);
      window.addEventListener('vipads_accounts_updated', reload);
      window.addEventListener('vipads_transactions_changed', reload);

      return () => {
        unsubAccounts();
        if (unsubTxs) unsubTxs();
        window.removeEventListener('storage', reload);
        window.removeEventListener('vipads:team_updated', reload);
        window.removeEventListener('vipads_accounts_updated', reload);
        window.removeEventListener('vipads_transactions_changed', reload);
      };
    } else {
      hasPulledLiveOnOpenRef.current = false;
    }
  }, [isOpen]);

  const handleManualLiveSync = async () => {
    setIsPullingLive(true);
    soundEngine.playClickSound();
    try {
      const res = await firebaseSync.forcePullAndPushAll();
      const allUsers = storage.getAllUsers();
      setAccounts(allUsers);
      soundEngine.playTaskRewardSound();
      onShowToast(
        'تم البث المباشر',
        `تم الاتصال بسحابة Firebase وتحديث ${allUsers.length} حساب مسجل بنجاح ⚡`,
        'success'
      );
    } catch {
      onShowToast('تنبيه', 'تم تحديث البيانات المحلية', 'info');
    } finally {
      setIsPullingLive(false);
    }
  };

  const currentEmail = storage.getCurrentUserEmail();
  const isAdmin = storage.isAdminEmail(user?.username || '') || storage.isAdminEmail(currentEmail || '');

  if (!isOpen || !isAdmin) return null;

  const currentPlan = vipPlans.find(p => p.level === user?.vipLevel) || vipPlans[0];

  // Filtered accounts based on search
  const q = (userSearchQuery || '').toLowerCase().trim();
  const filteredAccounts = accounts.filter(acc => 
    (acc.email || '').toLowerCase().includes(q) ||
    (acc.username || '').toLowerCase().includes(q) ||
    (acc.id || '').toLowerCase().includes(q)
  );

  // Selected account object
  const uNameSafe = user?.username || '';
  const activeSelectedAccount = accounts.find(a => a.email === selectedEmail) || accounts[0] || {
    id: user?.userId || 'USR-001',
    email: uNameSafe.includes('@') ? uNameSafe : `${uNameSafe.toLowerCase() || 'admin'}@gmail.com`,
    username: uNameSafe || 'admin',
    walletAddress: user?.walletAddress || '',
    vipLevel: user?.vipLevel || 0,
    totalBalanceUSDT: user?.totalBalanceUSDT || 0,
    taskEarningsToday: user?.taskEarningsToday || 0,
    totalWithdrawnUSDT: user?.totalWithdrawnUSDT || 0,
    tasksCompletedToday: user?.tasksCompletedToday || 0,
    referralCode: user?.referralCode || '',
    referralCount: user?.referralCount || 0,
    referralEarningsUSDT: user?.referralEarningsUSDT || 0,
    joinedDate: user.joinedDate || '2026-08-28'
  };

  // Transaction Lists (Filtered from local reactive modalTransactions)
  const allDeposits = modalTransactions.filter(t => t.type === 'deposit');
  const allWithdrawals = modalTransactions.filter(t => t.type === 'withdraw');
  const pendingDeposits = allDeposits.filter(t => t.status === 'pending');
  const pendingWithdrawals = allWithdrawals.filter(t => t.status === 'pending');

  // STRICT ISOLATED MANUAL BALANCE INJECTION:
  // Handler 1: خانة "زيادة رصيد الإيداع" (Deposit Balance Only - Zero impact on Total Balance)
  const handleExecuteDepositAdjustment = (targetEmail: string, type: 'add_deposit' | 'deduct_deposit', customAmount?: number) => {
    let amountNum: number;
    if (customAmount !== undefined && !isNaN(customAmount) && customAmount > 0) {
      amountNum = customAmount;
    } else {
      amountNum = parseFloat(depositInputAmount);
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      onShowToast('خطأ في المبلغ', 'يرجى إدخال مبلغ صحيح أكبر من 0', 'warning');
      return;
    }

    const targetAccountEmail = (targetEmail || selectedTargetEmail || (accounts[0]?.email || '') || user.email || 'free@gmail.com').trim().toLowerCase();
    const exactAmount = Number(Math.abs(amountNum).toFixed(2));

    if (onAdjustUserBalance) {
      onAdjustUserBalance(targetAccountEmail, exactAmount, type);
    } else {
      if (type === 'add_deposit') {
        storage.addDepositOnlyToUser(targetAccountEmail, exactAmount);
      } else {
        storage.deductDepositOnlyFromUser(targetAccountEmail, exactAmount);
      }
      const currentActiveEmail = (user.email || user.username || '').trim().toLowerCase();
      if (targetAccountEmail === currentActiveEmail) {
        if (type === 'add_deposit') {
          onUpdateUser({ totalDepositedUSDT: Number(((user.totalDepositedUSDT || 0) + exactAmount).toFixed(2)) });
        } else {
          onUpdateUser({ totalDepositedUSDT: Math.max(0, Number(((user.totalDepositedUSDT || 0) - exactAmount).toFixed(2))) });
        }
      }
    }

    soundEngine.playTaskRewardSound();
    onShowToast(
      type === 'add_deposit' ? 'تمت زيادة رصيد الإيداع' : 'تم خصم رصيد الإيداع',
      type === 'add_deposit' 
        ? `تمت إضافة +${exactAmount.toFixed(2)} USDT لرصيد الإيداع بنجاح`
        : `تم خصم -${exactAmount.toFixed(2)} USDT من رصيد الإيداع`,
      'success',
      exactAmount
    );

    // Refresh local accounts state immediately on first click
    const updated = storage.getAllUsers();
    setAccounts(updated);
  };

  // STRICT ISOLATED MANUAL BALANCE INJECTION:
  // Handler 2: خانة "زيادة إجمالي الرصيد" (Total Balance Only - Zero impact on Deposit Balance)
  const handleExecuteBalanceAdjustment = (targetEmail: string, type: 'add_balance' | 'deduct_balance', customAmount?: number) => {
    let amountNum: number;
    if (customAmount !== undefined && !isNaN(customAmount) && customAmount > 0) {
      amountNum = customAmount;
    } else {
      amountNum = parseFloat(totalBalanceInputAmount);
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      onShowToast('خطأ في المبلغ', 'يرجى إدخال مبلغ صحيح أكبر من 0', 'warning');
      return;
    }

    const targetAccountEmail = (targetEmail || selectedTargetEmail || (accounts[0]?.email || '') || user.email || 'free@gmail.com').trim().toLowerCase();
    const exactAmount = Number(Math.abs(amountNum).toFixed(2));

    if (onAdjustUserBalance) {
      onAdjustUserBalance(targetAccountEmail, exactAmount, type);
    } else {
      if (type === 'add_balance') {
        storage.addBalanceOnlyToUser(targetAccountEmail, exactAmount);
      } else {
        storage.deductBalanceOnlyFromUser(targetAccountEmail, exactAmount);
      }
      const currentActiveEmail = (user.email || user.username || '').trim().toLowerCase();
      if (targetAccountEmail === currentActiveEmail) {
        if (type === 'add_balance') {
          onUpdateUser({ totalBalanceUSDT: Number(((user.totalBalanceUSDT || 0) + exactAmount).toFixed(2)) });
        } else {
          onUpdateUser({ totalBalanceUSDT: Math.max(0, Number(((user.totalBalanceUSDT || 0) - exactAmount).toFixed(2))) });
        }
      }
    }

    soundEngine.playTaskRewardSound();
    onShowToast(
      type === 'add_balance' ? 'تمت زيادة إجمالي الرصيد' : 'تم خصم إجمالي الرصيد',
      type === 'add_balance' 
        ? `تمت إضافة +${exactAmount.toFixed(2)} USDT لإجمالي الرصيد بنجاح`
        : `تم خصم -${exactAmount.toFixed(2)} USDT من إجمالي الرصيد`,
      'success',
      exactAmount
    );

    // Refresh local accounts state immediately on first click
    const updated = storage.getAllUsers();
    setAccounts(updated);
  };

  // Immediate pending referral bonus adjustment for team rewards testing
  const handleExecutePendingReferralAdjustment = (targetEmail: string) => {
    const rawVal = pendingBonusInputAmount.trim();
    const amountNum = parseFloat(rawVal);
    if (isNaN(amountNum) || amountNum <= 0) {
      onShowToast('خطأ في المبلغ', 'يرجى إدخال سنتات صحيحة أكبر من 0 (مثال: 0.25)', 'warning');
      return;
    }
    const targetAccountEmail = (targetEmail || selectedTargetEmail || (accounts[0]?.email || '') || user.email || 'free@gmail.com').trim().toLowerCase();
    const exactAmount = Number(Math.abs(amountNum).toFixed(2));
    
    const newPending = storage.addPendingReferralRewards(targetAccountEmail, exactAmount);
    
    const currentActiveEmail = (user.email || user.username || '').trim().toLowerCase();
    if (targetAccountEmail === currentActiveEmail) {
      onUpdateUser({ pendingReferralRewardsUSDT: newPending });
    }
    soundEngine.playTaskRewardSound();
    onShowToast(
      'تمت إضافة مكافأة الفريق (سنتيات)',
      `تمت إضافة +${exactAmount.toFixed(2)} USDT في خانة العمولات المعلقة لتجربة زر يجمع 💰`,
      'success',
      exactAmount
    );
    const updated = storage.getAllUsers();
    setAccounts(updated);
  };

  // Immediate inline balance adjustment for a specific user's Gmail
  const handleInlineFunds = (targetEmail: string, type: 'add' | 'deduct', customAmount?: number) => {
    let amountNum: number;
    if (customAmount !== undefined && !isNaN(customAmount) && customAmount > 0) {
      amountNum = customAmount;
    } else {
      const rawVal = inlineAmounts[targetEmail] !== undefined && inlineAmounts[targetEmail] !== '' ? inlineAmounts[targetEmail] : '10';
      amountNum = parseFloat(rawVal);
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      onShowToast('خطأ في المبلغ', 'يرجى إدخال مبلغ صحيح أكبر من 0', 'warning');
      return;
    }

    if (onAdjustUserBalance) {
      onAdjustUserBalance(targetEmail, amountNum, type);
    } else {
      if (type === 'add') {
        storage.addBalanceOnlyToUser(targetEmail, amountNum);
      } else {
        storage.deductBalanceOnlyFromUser(targetEmail, amountNum);
      }
      const cleanTargetEmail = (targetEmail || '').trim().toLowerCase();
      const currentActiveEmail = (user.email || user.username || '').trim().toLowerCase();
      if (cleanTargetEmail === currentActiveEmail) {
        if (type === 'add') {
          onUpdateUser({ totalBalanceUSDT: Number(((user.totalBalanceUSDT || 0) + amountNum).toFixed(2)) });
        } else {
          onDeductBalance(amountNum);
        }
      }
    }

    if (type === 'add') {
      soundEngine.playTaskRewardSound();
      onShowToast('تم', 'تم', 'success', amountNum);
    } else {
      soundEngine.playClickSound();
      onShowToast('تم', 'تم', 'warning', amountNum);
    }

    // Refresh local accounts state immediately
    const updated = storage.getAllUsers();
    setAccounts(updated);
  };

  // Instant Withdrawal Approval Handler: Permanent persistence, instant removal from UI, zeroing notifications
  const handleApproveWithdrawalInternal = (txId: string) => {
    soundEngine.playTaskRewardSound();

    // 1. Immediately update status in storage permanently
    storage.updateTransactionStatus(txId, 'completed');

    // 2. Erase from modalTransactions instantly in the same millisecond so it completely vanishes from list
    const cleanTxId = (txId || '').trim().toLowerCase();
    setModalTransactions(prev => prev.filter(t => t.id !== txId && (t.id || '').trim().toLowerCase() !== cleanTxId));

    // 3. Clear and zero unread notification badge from top header
    storage.markAllNotificationsAsRead(user.email || 'free@gmail.com');
    storage.markAllNotificationsAsRead(storage.getCurrentUserEmail());
    storage.getAllUsers().forEach(u => storage.markAllNotificationsAsRead(u.email));

    // 4. Delegate to parent handler
    if (onApproveWithdrawal) {
      onApproveWithdrawal(txId);
    }

    // 5. Instantly refresh accounts state
    setAccounts(storage.getAllUsers());
  };

  const handleRejectWithdrawalInternal = (txId: string) => {
    soundEngine.playClickSound();
    storage.updateTransactionStatus(txId, 'failed');
    setModalTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'failed' } : t));
    if (onRejectWithdrawal) {
      onRejectWithdrawal(txId);
    }
    setAccounts(storage.getAllUsers());
  };

  const handleApproveDepositInternal = (txId: string) => {
    soundEngine.playTaskRewardSound();
    const targetTx = modalTransactions.find((t) => t.id === txId) || storage.getAllTransactions().find((t) => t.id === txId);
    if (!targetTx || targetTx.status === 'completed' || targetTx.status === 'approved') return;

    setApprovingTxIds(prev => new Set(prev).add(txId));
    setModalTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'completed' } : t));

    if (onApproveTransaction) {
      onApproveTransaction(txId);
    } else {
      storage.updateTransactionStatus(txId, 'completed');
      const targetEmail = (targetTx.userEmail || user.username || '').trim().toLowerCase();
      const exactAmount = Number(targetTx.amountUSDT.toFixed(2));
      storage.recordApprovedDeposit(targetEmail, exactAmount, txId);
      firebaseSync.approveDepositAtomic(txId, targetEmail, exactAmount).catch((e) => {
        console.warn('Firebase atomic deposit approval fallback:', e);
      });
    }
    setAccounts(storage.getAllUsers());
  };

  // Handle Quick Add / Deduct execution
  const handleExecuteQuickFunds = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(quickFundsModal.amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const targetEmail = quickFundsModal.userEmail;

    if (onAdjustUserBalance) {
      onAdjustUserBalance(targetEmail, amountNum, quickFundsModal.type);
    } else {
      if (quickFundsModal.type === 'add') {
        storage.addFundsToUser(targetEmail, amountNum);
        storage.addNotificationForUser(targetEmail, {
          type: 'deposit_approved',
          title: 'تم قبول الإيداع',
          badgeLabel: 'تم قبول الإيداع',
          message: 'تهانينا! تم تأكيد عملية الشحن بنجاح وإضافة الرصيد الصافي لمحفظتك. استثمر بأمان الآن! 💰',
          amount: amountNum,
          userEmail: targetEmail,
        });
        const cleanTarget = (targetEmail || '').trim().toLowerCase();
        const currentActive = (user.email || user.username || '').trim().toLowerCase();
        if (cleanTarget === currentActive) {
          onAddDeposit(amountNum, `إيداع إداري مباشر لحساب ${targetEmail} (+${amountNum.toFixed(2)} USDT)`);
        }
      } else {
        storage.deductFundsFromUser(targetEmail, amountNum);
        const cleanTarget = (targetEmail || '').trim().toLowerCase();
        const currentActive = (user.email || user.username || '').trim().toLowerCase();
        if (cleanTarget === currentActive) {
          onDeductBalance(amountNum);
        }
      }
    }

    if (quickFundsModal.type === 'add') {
      soundEngine.playTaskRewardSound();
      onShowToast('تم', 'تم', 'success', amountNum);
    } else {
      soundEngine.playClickSound();
      onShowToast('تم', 'تم', 'warning', amountNum);
    }

    // Refresh local accounts state
    setAccounts(storage.getAllUsers());
    setQuickFundsModal(prev => ({ ...prev, isOpen: false }));
  };

  // Master Reset Execution
  const handleExecuteMasterReset = () => {
    setShowMasterResetConfirm(false);
    storage.factoryReset();
    if (onMasterResetPlatform) {
      onMasterResetPlatform();
    }
    setAccounts(storage.getAllUsers());
    onClose();
  };

  return (
    <div 
      dir="rtl"
      id="user-admin-control-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-7xl rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-slate-600/80 shadow-[0_20px_60px_rgba(0,0,0,0.5)] bg-[#131b2e] text-white h-[98vh] sm:h-auto sm:max-h-[96vh] flex flex-col my-auto overflow-hidden">
        
        {/* TOP HEADER */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 gap-2 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#FF6B00] via-amber-500 to-[#00A3FF] p-0.5 shadow-lg shadow-orange-500/20 shrink-0">
              <div className="w-full h-full bg-[#0E1017] rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
                <Sliders className="w-4 h-4 sm:w-6 sm:h-6 text-[#FF6B00]" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-xl font-black text-white tracking-tight truncate">
                  لوحة التحكم والإدارة الذكية
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/40 text-[9px] sm:text-[10px] font-black uppercase font-mono">
                  Admin
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 hidden xs:block truncate">
                إدارة المستخدمين والأرصدة • اعتماد الإيداعات والسحوبات • ضبط المصنع
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Cloud Stream Badge & Sync Button */}
            <button
              id="admin-modal-live-sync-btn"
              onClick={handleManualLiveSync}
              disabled={isPullingLive}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border transition-all cursor-pointer text-xs font-black select-none ${
                isPullingLive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60'
              }`}
              title="مزامنة فورية حية مع سحابة Firestore لجلب كافة الحسابات المسجلة من كافة الأجهزة"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Radio className={`w-3.5 h-3.5 ${isPullingLive ? 'animate-spin' : 'animate-pulse'}`} />
              <span>{isPullingLive ? 'جاري المزامنة...' : 'بث مباشر حي'}</span>
            </button>

            <button
              id="admin-modal-close-btn"
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white border border-white/20 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="إغلاق اللوحة"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">إغلاق</span>
            </button>
          </div>
        </div>

        {/* 4 SUMMARY STATS COUNTERS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2.5 my-2 sm:my-3 shrink-0">
          {/* Stat 1: Total Users */}
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#18233d] border border-blue-500/40 flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-300 block truncate">المستخدمين</span>
                <span className="text-xs sm:text-sm font-black font-mono text-white truncate">{accounts.length} حسابات</span>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-black bg-blue-500/25 text-blue-300 border border-blue-500/50 shrink-0">
              {accounts.length}
            </span>
          </div>

          {/* Stat 2: Pending Deposits */}
          <div 
            id="admin-stat-deposits"
            onClick={() => setActiveSection('deposits')}
            className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#152e25] border border-emerald-500/40 flex items-center justify-between cursor-pointer hover:bg-emerald-900/40 hover:border-emerald-500/60 transition-all group"
            title="انقر لعرض قسم طلبات الإيداع"
          >
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-300 block truncate">إيداعات معلقة</span>
                <span className="text-xs sm:text-sm font-black font-mono text-emerald-400 truncate">{pendingDeposits.length} طلبات</span>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-black bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 animate-pulse shrink-0 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
              {pendingDeposits.length}
            </span>
          </div>

          {/* Stat 3: Pending Withdrawals */}
          <div 
            id="admin-stat-withdrawals"
            onClick={() => {
              setActiveSection('withdrawals');
              setWithdrawalSubFilter('pending');
            }}
            className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#12283a] border border-cyan-500/40 flex items-center justify-between cursor-pointer hover:bg-cyan-900/40 hover:border-cyan-500/60 transition-all group"
            title="انقر لعرض قسم طلبات السحب المعلقة"
          >
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-300 block truncate">سحوبات معلقة</span>
                <span className="text-xs sm:text-sm font-black font-mono text-cyan-400 truncate">{pendingWithdrawals.length} طلبات</span>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-black bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shrink-0 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
              {pendingWithdrawals.length}
            </span>
          </div>

          {/* Stat 4: Total Platform Balance */}
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#292218] border border-amber-500/40 flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-300 block truncate">أموال المنصة</span>
                <span className="text-xs sm:text-sm font-black font-mono text-amber-400 truncate">
                  ${accounts.reduce((acc, curr) => acc + (curr.totalBalanceUSDT || 0), 0).toFixed(1)}
                </span>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-black bg-amber-500/25 text-amber-300 border border-amber-500/50 shrink-0">
              USDT
            </span>
          </div>
        </div>

        {/* SECTION NAVIGATION TABS */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl sm:rounded-2xl bg-[#182138] border border-slate-700/60 overflow-x-auto custom-scrollbar shrink-0 mb-2 sm:mb-3">
          <button
            id="admin-tab-all"
            onClick={() => setActiveSection('all')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'all'
                ? 'bg-[#FF6B00] text-black shadow-md shadow-orange-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span>كافة الأقسام</span>
          </button>

          <button
            id="admin-tab-users"
            onClick={() => setActiveSection('users')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'users'
                ? 'bg-blue-500 text-black shadow-md shadow-blue-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>المستخدمون ({accounts.length})</span>
          </button>

          <button
            id="admin-tab-deposits"
            onClick={() => setActiveSection('deposits')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'deposits'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
            <span>الإيداعات ({pendingDeposits.length})</span>
          </button>

          <button
            id="admin-tab-withdrawals"
            onClick={() => setActiveSection('withdrawals')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'withdrawals'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            <span>السحوبات ({pendingWithdrawals.length})</span>
          </button>

          <button
            id="admin-tab-factory"
            onClick={() => setActiveSection('factory_reset')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'factory_reset'
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
            <span>ضبط المصنع</span>
          </button>
        </div>

        {/* 4-COLUMN MAIN CONTAINER */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pe-1 min-h-0">
          <div className={`grid gap-3 sm:gap-4 ${
            activeSection === 'all'
              ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}>
            
            {/* ========================================================================= */}
            {/* SECTION 1: USERS (المستخدمون) */}
            {/* ========================================================================= */}
            {(activeSection === 'all' || activeSection === 'users') && (
              <div className="rounded-2xl bg-[#162035] border border-blue-500/40 p-3 sm:p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-white">القسم 1: المستخدمون (Users)</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-blue-400">{accounts.length} حساب</span>
                  </div>

                  {/* Dedicated Isolated Balance Injection Controls (الفصل التام بين خانات التعديل) */}
                  <div className="space-y-3">
                    {/* Target User Selector with Live Double Balance Readout */}
                    <div className="p-3.5 rounded-2xl bg-[#171f33] border border-blue-500/40 space-y-2.5 shadow-md">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-gray-100 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-blue-400" />
                          <span>الحساب المستهدف للتعديل:</span>
                        </label>
                        <span className="text-[11px] font-mono text-blue-300 font-bold bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-400/30">{accounts.length} حساب مسجل</span>
                      </div>
                      <select
                        value={selectedTargetEmail}
                        onChange={(e) => setSelectedTargetEmail(e.target.value)}
                        className="w-full py-2 px-3 rounded-xl bg-[#0e1424] border-2 border-blue-500/60 text-white font-mono text-xs font-bold focus:border-blue-400 outline-none truncate cursor-pointer shadow-inner"
                      >
                        {accounts.map(a => (
                          <option key={`sel-opt-${a.id}`} value={a.email} className="bg-[#0e1424] text-white">
                            {a.email} — [رصيد: ${(a.totalBalanceUSDT || 0).toFixed(2)} | إيداع: ${(a.totalDepositedUSDT || 0).toFixed(2)} USDT]
                          </option>
                        ))}
                      </select>

                      {/* Live Balances Display for the Targeted User */}
                      {(() => {
                        const targetAcc = accounts.find(a => (a.email || '').toLowerCase() === (selectedTargetEmail || '').toLowerCase()) || accounts[0];
                        if (!targetAcc) return null;
                        return (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="p-2.5 rounded-xl bg-[#063321] border border-emerald-400/60 text-center shadow-sm">
                              <span className="text-[11px] text-emerald-200 block font-bold">رصيد الإيداع الحالي:</span>
                              <span className="text-sm font-black font-mono text-emerald-300">
                                ${(targetAcc.totalDepositedUSDT || 0).toFixed(2)} USDT
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-[#0c2a4d] border border-sky-400/60 text-center shadow-sm">
                              <span className="text-[11px] text-sky-200 block font-bold">إجمالي الرصيد الحالي:</span>
                              <span className="text-sm font-black font-mono text-sky-300">
                                ${(targetAcc.totalBalanceUSDT || 0).toFixed(2)} USDT
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* 1. خانة "زيادة رصيد الإيداع" (مستقلة بالكامل ولا تؤثر على إجمالي الرصيد) */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c2d1f] via-[#082418] to-[#0c2d1f] border-2 border-emerald-400 shadow-[0_4px_25px_rgba(16,185,129,0.25)] space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-emerald-400/30">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center border border-emerald-400/40">
                            <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <h4 className="text-xs sm:text-sm font-black text-white">خانة "زيادة رصيد الإيداع"</h4>
                        </div>
                        <span className="text-[10px] font-black text-emerald-200 bg-emerald-500/25 px-2.5 py-1 rounded-full border border-emerald-400/50">
                          مستقل 100% • إيداع فقط
                        </span>
                      </div>

                      <p className="text-[11px] text-emerald-100 font-medium leading-relaxed">
                        عند كتابة مبلغ والضغط على إرسال، تتم زيادة المبلغ بالملي فوق <span className="font-black text-emerald-300 underline underline-offset-2">رصيد الإيداع (totalDepositedUSDT)</span> فقط دون أي مساس بإجمالي الرصيد.
                      </p>

                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-black text-emerald-200 shrink-0 w-14">المبلغ:</label>
                          <div className="relative flex-1">
                            <input
                              type="number"
                              step="any"
                              min="0.01"
                              placeholder="10.00"
                              value={depositInputAmount}
                              onChange={(e) => setDepositInputAmount(e.target.value)}
                              className="w-full py-2 ps-3 pe-14 rounded-xl bg-[#061a12] border-2 border-emerald-400 text-white font-mono font-black text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/30 outline-none text-left placeholder:text-emerald-700/60 shadow-inner"
                            />
                            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-emerald-300 font-mono font-black">
                              USDT
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {['10', '50', '100'].map((val) => (
                              <button
                                key={`dep-pre-${val}`}
                                type="button"
                                onClick={() => setDepositInputAmount(val)}
                                className="px-2 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-mono font-black border border-emerald-400/40 cursor-pointer active:scale-95 transition-all"
                              >
                                ${val}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            id="btn-admin-add-deposit"
                            onClick={() => {
                              const email = selectedTargetEmail || (accounts[0]?.email || '');
                              handleExecuteDepositAdjustment(email, 'add_deposit');
                            }}
                            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/30 cursor-pointer active:scale-95 transition-all"
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            <span>إرسال وزيادة رصيد الإيداع</span>
                          </button>
                          <button
                            type="button"
                            id="btn-admin-deduct-deposit"
                            onClick={() => {
                              const email = selectedTargetEmail || (accounts[0]?.email || '');
                              handleExecuteDepositAdjustment(email, 'deduct_deposit');
                            }}
                            className="py-2.5 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border-2 border-red-400/80 text-red-200 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                          >
                            <Minus className="w-4 h-4 stroke-[3]" />
                            <span>خصم من الإيداع (-)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 2. خانة "زيادة إجمالي الرصيد" (مستقلة بالكامل ولا تؤثر على رصيد الإيداع) */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0d2a4a] via-[#091e36] to-[#0d2a4a] border-2 border-sky-400 shadow-[0_4px_25px_rgba(14,165,233,0.25)] space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-sky-400/30">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-sky-400/20 text-sky-300 flex items-center justify-center border border-sky-400/40">
                            <Coins className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <h4 className="text-xs sm:text-sm font-black text-white">خانة "زيادة إجمالي الرصيد"</h4>
                        </div>
                        <span className="text-[10px] font-black text-sky-200 bg-sky-500/25 px-2.5 py-1 rounded-full border border-sky-400/50">
                          مستقل 100% • رصيد مالي فقط
                        </span>
                      </div>

                      <p className="text-[11px] text-sky-100 font-medium leading-relaxed">
                        عند كتابة مبلغ والضغط على إرسال، تتم زيادة المبلغ بالملي فوق <span className="font-black text-sky-300 underline underline-offset-2">إجمالي الرصيد (totalBalanceUSDT)</span> فقط دون أي مساس برصيد الإيداع.
                      </p>

                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-black text-sky-200 shrink-0 w-14">المبلغ:</label>
                          <div className="relative flex-1">
                            <input
                              type="number"
                              step="any"
                              min="0.01"
                              placeholder="5.00"
                              value={totalBalanceInputAmount}
                              onChange={(e) => setTotalBalanceInputAmount(e.target.value)}
                              className="w-full py-2 ps-3 pe-14 rounded-xl bg-[#071728] border-2 border-sky-400 text-white font-mono font-black text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-400/30 outline-none text-left placeholder:text-sky-700/60 shadow-inner"
                            />
                            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-sky-300 font-mono font-black">
                              USDT
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {['5', '10', '50', '100'].map((val) => (
                              <button
                                key={`bal-pre-${val}`}
                                type="button"
                                onClick={() => setTotalBalanceInputAmount(val)}
                                className="px-2 py-1.5 rounded-lg bg-sky-900/60 hover:bg-sky-800 text-sky-200 text-xs font-mono font-black border border-sky-400/40 cursor-pointer active:scale-95 transition-all"
                              >
                                ${val}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            id="btn-admin-add-total-balance"
                            onClick={() => {
                              const email = selectedTargetEmail || (accounts[0]?.email || '');
                              handleExecuteBalanceAdjustment(email, 'add_balance');
                            }}
                            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/30 cursor-pointer active:scale-95 transition-all"
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            <span>إرسال وزيادة إجمالي الرصيد</span>
                          </button>
                          <button
                            type="button"
                            id="btn-admin-deduct-total-balance"
                            onClick={() => {
                              const email = selectedTargetEmail || (accounts[0]?.email || '');
                              handleExecuteBalanceAdjustment(email, 'deduct_balance');
                            }}
                            className="py-2.5 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border-2 border-red-400/80 text-red-200 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                          >
                            <Minus className="w-4 h-4 stroke-[3]" />
                            <span>خصم من الرصيد (-)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 3. خانة "مكافأة الفريق ودعوة الإعلانات" (سنتيات العمولات المعلقة لتجربة زر يجمع 💰) */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#2a1708] via-[#1c1005] to-[#2a1708] border-2 border-amber-400 shadow-[0_4px_25px_rgba(245,158,11,0.25)] space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-amber-400/30">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/40">
                            <Gift className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <h4 className="text-xs sm:text-sm font-black text-white">خانة "مكافأة الفريق ودعوة الإعلانات"</h4>
                        </div>
                        <span className="text-[10px] font-black text-amber-200 bg-amber-500/25 px-2.5 py-1 rounded-full border border-amber-400/50">
                          عمولات معلقة • زر يجمع 💰
                        </span>
                      </div>

                      <p className="text-[11px] text-amber-100 font-medium leading-relaxed">
                        تُضيف سنتيات مباشرة إلى <span className="font-black text-amber-300 underline underline-offset-2">العمولات المعلقة (pendingReferralRewardsUSDT)</span> لاختبار زر "يجمع 💰" في تبويب الفريق ومشاهدة تحويلها الفوري للرصيد الأساسي.
                      </p>

                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-black text-amber-200 shrink-0 w-14">المبلغ:</label>
                          <div className="relative flex-1">
                            <input
                              type="number"
                              step="any"
                              min="0.01"
                              placeholder="0.25"
                              value={pendingBonusInputAmount}
                              onChange={(e) => setPendingBonusInputAmount(e.target.value)}
                              className="w-full py-2 ps-3 pe-14 rounded-xl bg-[#140b04] border-2 border-amber-400 text-white font-mono font-black text-sm focus:border-amber-300 focus:ring-2 focus:ring-amber-400/30 outline-none text-left placeholder:text-amber-700/60 shadow-inner"
                            />
                            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-amber-300 font-mono font-black">
                              USDT
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {['0.10', '0.25', '0.50', '1.00'].map((val) => (
                              <button
                                key={`pending-pre-${val}`}
                                type="button"
                                onClick={() => setPendingBonusInputAmount(val)}
                                className="px-2 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 text-amber-200 text-xs font-mono font-black border border-amber-400/40 cursor-pointer active:scale-95 transition-all"
                              >
                                ${val}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Action button */}
                        <div className="pt-1">
                          <button
                            type="button"
                            id="btn-admin-add-pending-rewards"
                            onClick={() => {
                              const email = selectedTargetEmail || (accounts[0]?.email || '');
                              handleExecutePendingReferralAdjustment(email);
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/30 cursor-pointer active:scale-95 transition-all"
                          >
                            <Sparkles className="w-4 h-4 stroke-[3]" />
                            <span>إرسال سنتيات إلى خانة عمولات معلقة (زر يجمع 💰)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="بحث بالبريد أو الاسم..."
                      className="w-full py-2 ps-9 pe-3 rounded-xl bg-black/80 border border-white/10 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  {/* Registered Users List with Direct Inline Manual Balance Controls */}
                  <div className="space-y-2 max-h-72 sm:max-h-80 overflow-y-auto custom-scrollbar pr-0.5">
                    {filteredAccounts.map((acc) => {
                      const isSelected = selectedEmail === acc.email;
                      const accEmail = (acc.email || '').trim().toLowerCase();
                      const currentActive = (user.email || user.username || '').trim().toLowerCase();
                      const isCurrentActive = accEmail !== '' && accEmail === currentActive;
                      const currentAmountVal = inlineAmounts[acc.email] !== undefined ? inlineAmounts[acc.email] : '10';

                      return (
                        <div
                          key={acc.id}
                          className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-blue-500/15 border-blue-400/80 shadow-md shadow-blue-500/10'
                              : 'bg-black/70 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex flex-col gap-2">
                            {/* Top row: User Gmail, Status, and Real-Time Synced Balance */}
                            <div 
                              onClick={() => {
                                setSelectedEmail(acc.email);
                                soundEngine.playClickSound();
                              }}
                              className="cursor-pointer flex-1 min-w-0"
                            >
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span className="text-xs font-bold text-white break-all">
                                  {acc.email}
                                </span>
                                {isCurrentActive && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    الحساب الحالي
                                  </span>
                                )}
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                                  VIP {acc.vipLevel}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-1.5 text-xs font-mono">
                                <div className="bg-emerald-950/50 px-2 py-1 rounded border border-emerald-500/30 flex items-center justify-between">
                                  <span className="text-[10px] text-emerald-300 font-bold">الإيداع:</span>
                                  <span className="text-emerald-400 font-black text-xs">
                                    ${(acc.totalDepositedUSDT || 0).toFixed(2)}
                                  </span>
                                </div>
                                <div className="bg-sky-950/50 px-2 py-1 rounded border border-sky-500/30 flex items-center justify-between">
                                  <span className="text-[10px] text-sky-300 font-bold">إجمالي الرصيد:</span>
                                  <span className="text-sky-400 font-black text-xs">
                                    ${(acc.totalBalanceUSDT || 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Bottom row: Inline Manual Balance Control */}
                            <div className="flex items-center gap-1.5 pt-2 border-t border-white/10 flex-wrap">
                              <div className="relative flex items-center shrink-0">
                                <input
                                  type="number"
                                  step="any"
                                  min="0.01"
                                  placeholder="10.00"
                                  value={currentAmountVal}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setInlineAmounts(prev => ({ ...prev, [acc.email]: val }));
                                  }}
                                  className="w-18 sm:w-20 px-2 py-1.5 rounded-lg bg-black/90 border border-white/25 text-white font-mono font-bold text-xs focus:border-[#FF6B00] outline-none text-center"
                                />
                                <span className="text-[10px] text-gray-400 font-mono ms-1 select-none">USDT</span>
                              </div>

                              <div className="flex items-center gap-1 flex-1 justify-end flex-wrap">
                                {/* زر زيادة رصيد الإيداع فقط */}
                                <button
                                  id={`admin-btn-add-dep-${acc.id}`}
                                  title={`زيادة رصيد الإيداع فقط لحساب ${acc.email} يدوياً`}
                                  onClick={() => handleExecuteDepositAdjustment(acc.email, 'add_deposit', parseFloat(currentAmountVal))}
                                  className="px-2 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[11px] flex items-center gap-1 shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95 transition-all"
                                >
                                  <Plus className="w-3 h-3 stroke-[3]" />
                                  <span>+ إيداع</span>
                                </button>

                                {/* زر زيادة إجمالي الرصيد فقط */}
                                <button
                                  id={`admin-btn-add-bal-${acc.id}`}
                                  title={`زيادة إجمالي الرصيد فقط لحساب ${acc.email} يدوياً`}
                                  onClick={() => handleExecuteBalanceAdjustment(acc.email, 'add_balance', parseFloat(currentAmountVal))}
                                  className="px-2 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-black text-[11px] flex items-center gap-1 shadow-md shadow-sky-500/20 cursor-pointer active:scale-95 transition-all"
                                >
                                  <Plus className="w-3 h-3 stroke-[3]" />
                                  <span>+ رصيد</span>
                                </button>

                                {/* زر خصم من الرصيد */}
                                <button
                                  id={`admin-btn-deduct-bal-${acc.id}`}
                                  title={`خصم من إجمالي الرصيد لحساب ${acc.email}`}
                                  onClick={() => handleExecuteBalanceAdjustment(acc.email, 'deduct_balance', parseFloat(currentAmountVal))}
                                  className="px-1.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                                >
                                  <Minus className="w-3 h-3 stroke-[3]" />
                                  <span>خصم</span>
                                </button>

                                {/* Switch to this user button if not current */}
                                {onSwitchUser && !isCurrentActive && (
                                  <button
                                    id={`admin-btn-switch-${acc.id}`}
                                    title={`تسجيل الدخول وعرض حساب ${acc.email}`}
                                    onClick={() => {
                                      soundEngine.playClick();
                                      onSwitchUser(acc.email);
                                    }}
                                    className="px-2 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 font-bold text-[11px] flex items-center gap-1 border border-blue-500/30 cursor-pointer active:scale-95 transition-all"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span className="hidden xs:inline">عرض</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected User Full Details Drawer / Card */}
                  <div className="p-3 rounded-xl bg-black/90 border border-blue-500/30 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                      <span className="text-gray-400 font-bold text-[11px]">تفاصيل الحساب المحدد:</span>
                      <span className="font-mono text-blue-400 font-bold">{activeSelectedAccount.email}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] font-mono">
                      <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/20">
                        <span className="text-emerald-400 font-bold block">رصيد الإيداع:</span>
                        <span className="text-emerald-300 font-bold text-xs">${(activeSelectedAccount.totalDepositedUSDT || 0).toFixed(2)} USDT</span>
                      </div>
                      <div className="p-2 rounded-lg bg-sky-950/40 border border-sky-500/20">
                        <span className="text-sky-400 font-bold block">إجمالي الرصيد:</span>
                        <span className="text-sky-300 font-bold text-xs">${activeSelectedAccount.totalBalanceUSDT.toFixed(2)} USDT</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-gray-500 block">مستوى VIP:</span>
                        <span className="text-amber-400 font-bold text-xs">VIP {activeSelectedAccount.vipLevel}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-gray-500 block">تاريخ التسجيل:</span>
                        <span className="text-gray-300">{activeSelectedAccount.joinedDate}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-gray-500 block">معرف الحساب:</span>
                        <span className="text-gray-300">{activeSelectedAccount.id}</span>
                      </div>
                    </div>

                    {/* Quick Preset Buttons for Selected User */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[10px] text-gray-400 font-bold">حقن سريع منفصل:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* زيادات رصيد الإيداع فقط */}
                        <div className="flex items-center gap-1">
                          {[10, 50].map((amt) => (
                            <button
                              key={`quick-add-dep-${amt}`}
                              onClick={() => handleExecuteDepositAdjustment(activeSelectedAccount.email, 'add_deposit', amt)}
                              className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold cursor-pointer transition-all"
                            >
                              +{amt} إيداع
                            </button>
                          ))}
                        </div>

                        {/* زيادات إجمالي الرصيد فقط */}
                        <div className="flex items-center gap-1">
                          {[5, 10, 50].map((amt) => (
                            <button
                              key={`quick-add-bal-${amt}`}
                              onClick={() => handleExecuteBalanceAdjustment(activeSelectedAccount.email, 'add_balance', amt)}
                              className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-[10px] font-mono font-bold cursor-pointer transition-all"
                            >
                              +{amt} رصيد
                            </button>
                          ))}
                        </div>

                        {/* خصم من الرصيد */}
                        <div className="flex items-center gap-1">
                          {[10].map((amt) => (
                            <button
                              key={`quick-deduct-bal-${amt}`}
                              onClick={() => handleExecuteBalanceAdjustment(activeSelectedAccount.email, 'deduct_balance', amt)}
                              className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-[10px] font-mono font-bold cursor-pointer transition-all"
                            >
                              -{amt} رصيد
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quick VIP Override for Selected User */}
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[10px] text-gray-400 block mb-1">تعديل باقة VIP للحساب (المستويات 0 إلى 10):</span>
                      <div className="grid grid-cols-6 sm:grid-cols-11 gap-1">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
                          <button
                            key={`vip-lvl-${lvl}`}
                            onClick={() => {
                              const updated = accounts.map(a => a.email === activeSelectedAccount.email ? { ...a, vipLevel: lvl } : a);
                              storage.saveAllUsers(updated);
                              setAccounts(updated);
                              const selectedEmail = (activeSelectedAccount?.email || '').trim().toLowerCase();
                              const currentActive = (user.email || user.username || '').trim().toLowerCase();
                              const isCur = selectedEmail !== '' && selectedEmail === currentActive;
                              if (isCur) {
                                onSetVipLevel(lvl, true);
                              }
                              storage.addNotificationForUser(activeSelectedAccount.email, {
                                type: 'vip_activated',
                                title: 'تفعيل باقة VIP',
                                badgeLabel: `تفعيل باقة VIP ${lvl}`,
                                message: 'مبارك الترقية! تم تنشيط باقة VIP الجديدة لحسابك بنجاح. انطلق الآن وضاعف أرباحك اليومية! 🚀',
                                vipLevel: lvl,
                                userEmail: activeSelectedAccount.email,
                              });
                              onShowToast('تعديل VIP', `تم تعيين VIP ${lvl} للحساب ${activeSelectedAccount.email}`, 'vip');
                            }}
                            className={`py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                              activeSelectedAccount.vipLevel === lvl
                                ? 'bg-amber-400 text-black shadow-sm'
                                : 'bg-white/5 hover:bg-white/15 text-gray-300'
                            }`}
                          >
                            VIP {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-center text-[10px] text-gray-400">
                  ⚡ الرصيد مربوط ومزامن بالبريد الإلكتروني (الجيميل) مباشرة في قاعدة البيانات المصغرة للتطبيق.
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 2: DEPOSITS (طلبات الإيداع) */}
            {/* ========================================================================= */}
            {(activeSection === 'all' || activeSection === 'deposits') && (
              <div className="rounded-2xl bg-[#142330] border border-emerald-500/40 p-3 sm:p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-white">القسم 2: طلبات الإيداع (Deposits)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {pendingDeposits.length} معلق
                    </span>
                  </div>

                  {/* Deposits List */}
                  <div className="space-y-2 max-h-72 sm:max-h-80 overflow-y-auto custom-scrollbar pr-0.5">
                    {allDeposits.length === 0 ? (
                      <div className="p-8 rounded-xl bg-black/40 text-center text-gray-500 text-xs">
                        لا توجد طلبات إيداع مسجلة حالياً
                      </div>
                    ) : (
                      allDeposits.map((tx) => (
                        <div 
                          key={tx.id}
                          className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
                            tx.status === 'pending'
                              ? 'bg-amber-950/30 border-amber-500/50 shadow-md shadow-amber-500/10'
                              : tx.status === 'completed'
                              ? 'bg-emerald-950/20 border-emerald-500/20'
                              : 'bg-red-950/20 border-red-500/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold truncate max-w-full">
                                  <Mail className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span className="truncate">{tx.userEmail || user.username}</span>
                                </span>
                                <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase font-mono shrink-0 ${
                                  tx.status === 'pending'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                    : tx.status === 'completed'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                }`}>
                                  {tx.status === 'pending' ? 'قيد المعالجة' : tx.status === 'completed' ? 'تم القبول' : 'مرفوض'}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-gray-200 line-clamp-2">{tx.description}</p>
                              <span className="text-[10px] text-gray-400 font-mono block">
                                {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(tx.timestamp).toLocaleDateString()}
                              </span>
                            </div>

                            <span className="text-sm font-mono font-black text-emerald-400 shrink-0 self-start">
                              +${tx.amountUSDT.toFixed(2)}
                            </span>
                          </div>

                          {/* Direct Clickable Action Buttons for Pending Deposits */}
                          {tx.status === 'pending' && (
                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/10">
                              <button
                                onClick={() => {
                                  if (onRejectTransaction) onRejectTransaction(tx.id);
                                }}
                                className="py-2 px-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs cursor-pointer active:scale-95 transition-all text-center flex items-center justify-center gap-1"
                              >
                                <span>رفض</span>
                                <span>✕</span>
                              </button>
                              <button
                                id={`admin-approve-deposit-btn-${tx.id}`}
                                disabled={approvingTxIds.has(tx.id) || tx.status === 'completed'}
                                onClick={() => {
                                  if (approvingTxIds.has(tx.id)) return;
                                  handleApproveDepositInternal(tx.id);
                                }}
                                className="py-2 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-xs cursor-pointer active:scale-95 shadow-md shadow-emerald-500/20 transition-all text-center flex items-center justify-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>{approvingTxIds.has(tx.id) ? (language === 'ar' ? 'جارٍ القبول...' : 'Approving...') : (language === 'ar' ? 'قبول الإيداع' : 'Approve Deposit')}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2 pb-1 px-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-0.5">
                  <div className="text-[10px] sm:text-[11px] font-bold text-emerald-300">
                    ⚡ نظام العمولات التلقائي (10% / 5% / 2%)
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-gray-400 leading-relaxed">
                    عند «قبول الإيداع»، يقوم النظام تلقائياً بتوزيع العمولات للمستويات الثلاثة وإيداعها في محافظهم فوراً.
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 3: WITHDRAWALS (طلبات السحب) */}
            {/* ========================================================================= */}
            {(activeSection === 'all' || activeSection === 'withdrawals') && (
              <div className="rounded-2xl bg-[#142334] border border-cyan-500/40 p-3 sm:p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-white">القسم 3: طلبات السحب (Withdrawals)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setWithdrawalSubFilter('pending')}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                          withdrawalSubFilter === 'pending'
                            ? 'bg-cyan-500 text-black border-cyan-400 font-black shadow-sm shadow-cyan-500/30'
                            : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
                        }`}
                      >
                        معلق ({pendingWithdrawals.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setWithdrawalSubFilter('all')}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                          withdrawalSubFilter === 'all'
                            ? 'bg-white/20 text-white border-white/40 font-black'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        الكل ({allWithdrawals.length})
                      </button>
                    </div>
                  </div>

                  {/* Withdrawals List */}
                  <div className="space-y-2 max-h-72 sm:max-h-80 overflow-y-auto custom-scrollbar pr-0.5">
                    {(withdrawalSubFilter === 'pending' ? pendingWithdrawals : allWithdrawals).length === 0 ? (
                      <div className="p-8 rounded-xl bg-black/40 text-center text-gray-500 text-xs">
                        {withdrawalSubFilter === 'pending' && allWithdrawals.length > 0 ? (
                          <div className="space-y-2">
                            <p>لا توجد طلبات سحب معلقة حالياً</p>
                            <button
                              type="button"
                              onClick={() => setWithdrawalSubFilter('all')}
                              className="text-xs text-cyan-400 hover:underline font-bold"
                            >
                              عرض كافة الطلبات السابقة ({allWithdrawals.length})
                            </button>
                          </div>
                        ) : (
                          'لا توجد طلبات سحب مسجلة حالياً'
                        )}
                      </div>
                    ) : (
                      (withdrawalSubFilter === 'pending' ? pendingWithdrawals : allWithdrawals).map((tx) => (
                        <div 
                          key={tx.id}
                          className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
                            tx.status === 'pending'
                              ? 'bg-amber-950/30 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                              : tx.status === 'completed'
                              ? 'bg-cyan-950/20 border-cyan-500/20'
                              : 'bg-red-950/20 border-red-500/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-semibold truncate max-w-full">
                                  <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
                                  <span className="truncate">{tx.userEmail || user.username}</span>
                                </span>
                                <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase font-mono shrink-0 ${
                                  tx.status === 'pending'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                    : tx.status === 'completed'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                }`}>
                                  {tx.status === 'pending' ? 'قيد المراجعة' : tx.status === 'completed' ? 'تم التحويل' : 'مرفوض'}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-gray-200 line-clamp-2">{tx.description}</p>
                              <span className="text-[10px] text-gray-400 font-mono block">
                                {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(tx.timestamp).toLocaleDateString()}
                              </span>
                            </div>

                            <span className="text-sm font-mono font-black text-cyan-400 shrink-0 self-start">
                              -${tx.amountUSDT.toFixed(2)}
                            </span>
                          </div>

                          {/* Direct Clickable Action Buttons for Pending Withdrawals */}
                          {tx.status === 'pending' && (
                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/10">
                              <button
                                onClick={() => handleRejectWithdrawalInternal(tx.id)}
                                className="py-2 px-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs cursor-pointer active:scale-95 transition-all text-center flex items-center justify-center gap-1"
                              >
                                <span>رفض وإعادة</span>
                                <span>✕</span>
                              </button>
                              <button
                                onClick={() => handleApproveWithdrawalInternal(tx.id)}
                                className="py-2 px-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs cursor-pointer active:scale-95 shadow-md shadow-cyan-500/20 transition-all text-center flex items-center justify-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>قبول وتحويل</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2 text-center text-[10px] text-gray-500 font-mono">
                  رفض السحب يعيد المبلغ تلقائياً لرصيد المستخدم المتاح
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 4: FACTORY RESET (إعادة ضبط المصنع وتصفير المنصة) */}
            {/* ========================================================================= */}
            {(activeSection === 'all' || activeSection === 'factory_reset') && (
              <div className="rounded-2xl bg-[#1c1d2e] border border-red-500/40 p-4 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
                        <AlertOctagon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-white">القسم 4: ضبط المصنع والعمليات</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-red-400">Master Operations</span>
                  </div>

                  {/* System Quick Controls */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        onResetDailyTasks();
                        onShowToast('تصفير المهام', 'تمت إعادة ضبط عداد المهام اليومية إلى (0)', 'success');
                      }}
                      className="w-full p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                        <span>تصفير عداد المهام اليومية (0 مهام)</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onCompleteAllDailyTasks();
                        onShowToast('إنهاء المهام', 'تم إنهاء كافة المهام وإضافة الأرباح فوراً', 'success');
                      }}
                      className="w-full p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>إنهاء كافة مهام اليوم وإضافة الأرباح</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClaimAllMilestones();
                        onShowToast('جوائز الإحالة', 'تم استلام كافة جوائز ومكافآت الإحالات', 'vip');
                      }}
                      className="w-full p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Gift className="w-3.5 h-3.5 text-purple-400" />
                        <span>تفعيل جميع مكافآت الإحالات</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClearTransactions();
                        onShowToast('مسح السجل', 'تم تفريغ سجل المعاملات بالكامل', 'info');
                      }}
                      className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                        <span>مسح سجل المعاملات فقط</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* MASTER FACTORY RESET BUTTON */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-b from-red-950/60 to-black border-2 border-red-500/60 shadow-xl shadow-red-500/20 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-black text-red-400">إجراء أمني حرج</span>
                    </div>

                    <p className="text-[10px] text-gray-300 leading-relaxed">
                      يقوم بمسح كامل لـ localStorage، تصفير كافة الأرصدة إلى (0.00 USDT)، وإرجاع التطبيق للحالة الأولية.
                    </p>

                    <button
                      id="admin-master-factory-reset-btn"
                      type="button"
                      onClick={() => setShowMasterResetConfirm(true)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:brightness-125 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/40 active:scale-95 transition-all border border-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>إعادة ضبط المصنع وتصفير المنصة</span>
                    </button>
                  </div>
                </div>

                <div className="text-center pt-2 text-[10px] text-gray-500 font-mono">
                  Multi-User Isolated Storage Engine v3.0
                </div>
              </div>
            )}

          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="pt-2.5 sm:pt-3 mt-2 sm:mt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-400 text-center sm:text-start">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
            <span>نظام إدارة الحسابات المتعددة متزامن بشكل دائم مع localStorage</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto py-2 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer transition-colors text-center"
          >
            إغلاق اللوحة
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* QUICK INLINE FUNDS MODAL (+ / -) */}
      {/* ========================================================================= */}
      {quickFundsModal.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl p-6 bg-[#131826] border-2 border-slate-600 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                {quickFundsModal.type === 'add' ? (
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                    <MinusCircle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-black">
                    {quickFundsModal.type === 'add' ? 'إضافة أموال للحساب' : 'خصم أموال من الحساب'}
                  </h3>
                  <span className="text-[10px] text-gray-400 font-mono">{quickFundsModal.userEmail}</span>
                </div>
              </div>

              <button
                onClick={() => setQuickFundsModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteQuickFunds} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">المبلغ المطلوب (USDT):</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    value={quickFundsModal.amount}
                    onChange={(e) => setQuickFundsModal(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    className="w-full py-2.5 ps-3 pe-14 rounded-xl bg-black/80 border border-white/20 text-white font-mono font-bold text-sm focus:border-[#FF6B00] outline-none"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-black text-[#FF6B00]">USDT</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {['10', '50', '100', '500'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuickFundsModal(prev => ({ ...prev, amount: preset }))}
                    className="py-1.5 rounded-lg text-xs font-mono font-bold bg-white/5 hover:bg-white/15 border border-white/10 transition-colors"
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickFundsModal(prev => ({ ...prev, isOpen: false }))}
                  className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-all ${
                    quickFundsModal.type === 'add'
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/30'
                      : 'bg-red-500 hover:bg-red-400 text-white shadow-md shadow-red-500/30'
                  }`}
                >
                  {quickFundsModal.type === 'add' ? 'تأكيد الإضافة +' : 'تأكيد الخصم -'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MASTER RESET SECURITY CONFIRMATION DIALOG */}
      {/* ========================================================================= */}
      {showMasterResetConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl p-6 bg-[#131826] border-2 border-red-500 shadow-2xl shadow-red-500/30 text-white space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto text-red-500 animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-red-400">
                تأكيد إعادة ضبط المصنع وتصفير المنصة
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                تحذير: هذا الإجراء سيقوم بمسح كافة بيانات التخزين المحلي (localStorage) وتصفير المنصة بالكامل.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs text-gray-300 space-y-1.5 font-mono text-start">
              <div className="flex items-center gap-2 text-red-300 font-bold">
                <Check className="w-3.5 h-3.5 text-red-400" />
                <span>تصفير جميع أرصدة المستخدمين إلى 0.00 USDT المطلق</span>
              </div>
              <div className="flex items-center gap-2 text-red-300 font-bold">
                <Check className="w-3.5 h-3.5 text-red-400" />
                <span>مسح وإلغاء كافة السجلات والإيداعات والسحوبات</span>
              </div>
              <div className="flex items-center gap-2 text-red-300 font-bold">
                <Check className="w-3.5 h-3.5 text-red-400" />
                <span>إعادة المنصة للحالة الصفرية الابتدائية</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowMasterResetConfirm(false)}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer transition-all"
              >
                إلغاء الأمر
              </button>

              <button
                type="button"
                onClick={handleExecuteMasterReset}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-red-600/40 active:scale-95 transition-all"
              >
                تأكيد التصفير الآن
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
