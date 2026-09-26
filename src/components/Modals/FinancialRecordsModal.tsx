import React, { useState } from 'react';
import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Zap, 
  Gift, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  Filter,
  Receipt,
  FileText
} from 'lucide-react';
import { Transaction } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { soundEngine } from '../../utils/audio';

interface FinancialRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  userEmail?: string;
}

type RecordFilterType = 'all' | 'deposit' | 'withdraw' | 'task_reward' | 'referral_commission';

export const FinancialRecordsModal: React.FC<FinancialRecordsModalProps> = ({
  isOpen,
  onClose,
  transactions,
  userEmail
}) => {
  const { language } = useLanguage();
  const [filter, setFilter] = useState<RecordFilterType>('all');
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  if (!isOpen) return null;

  const isArabic = language === 'ar';
  const cleanEmail = (userEmail || '').trim().toLowerCase();

  // Filter transactions for this user
  const userTransactions = transactions.filter(t => {
    if (!t.userEmail) return true; // Global or default
    const txEmail = (t.userEmail || '').trim().toLowerCase();
    return txEmail === cleanEmail || (cleanEmail && cleanEmail.startsWith(txEmail));
  });

  const filteredTransactions = userTransactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const handleCopyHash = (hash: string, id: string) => {
    soundEngine.playClick();
    navigator.clipboard.writeText(hash);
    setCopiedTxId(id);
    setTimeout(() => setCopiedTxId(null), 2000);
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{isArabic ? 'مكتمل' : 'Completed'}</span>
          </span>
        );
      case 'pending':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3 animate-pulse" />
            <span>{isArabic ? 'قيد المراجعة' : 'Pending'}</span>
          </span>
        );
      case 'processing':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin" />
            <span>{isArabic ? 'قيد المعالجة' : 'Processing'}</span>
          </span>
        );
      case 'failed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>{isArabic ? 'ملغي / مرفوض' : 'Failed'}</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return (
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        );
      case 'withdraw':
        return (
          <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        );
      case 'task_reward':
        return (
          <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[#00A3FF] shrink-0">
            <Zap className="w-5 h-5 fill-current" />
          </div>
        );
      case 'referral_commission':
        return (
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] shrink-0">
            <Gift className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        );
    }
  };

  const getTypeLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return isArabic ? 'إيداع رصيد' : 'Deposit';
      case 'withdraw':
        return isArabic ? 'سحب أرباح' : 'Withdrawal';
      case 'task_reward':
        return isArabic ? 'أرباح مشاهدة إعلانات' : 'Task Reward';
      case 'referral_commission':
        return isArabic ? 'عمولة إحالة' : 'Referral Bonus';
      case 'vip_upgrade':
        return isArabic ? 'ترقية VIP' : 'VIP Upgrade';
      default:
        return isArabic ? 'عملية مالية' : 'Transaction';
    }
  };

  return (
    <div 
      dir={isArabic ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl rounded-3xl p-5 sm:p-7 glass border border-white/15 shadow-2xl bg-[#090B10] text-white flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00A3FF] to-[#FF6B00] p-0.5 shadow-lg shadow-sky-500/20 shrink-0">
              <div className="w-full h-full bg-[#0D0F17] rounded-[14px] flex items-center justify-center">
                <Receipt className="w-6 h-6 text-[#00A3FF]" />
              </div>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                {isArabic ? 'السجلات المالية' : 'Financial Records'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {isArabic ? 'سجل العمليات المكتملة، الإيداعات، السحوبات، وأرباح المهام' : 'Complete history of deposits, withdrawals, and task earnings'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-3 border-b border-white/10 shrink-0">
          {[
            { id: 'all', label: isArabic ? 'الكل' : 'All' },
            { id: 'deposit', label: isArabic ? 'إيداع' : 'Deposits' },
            { id: 'withdraw', label: isArabic ? 'سحب' : 'Withdrawals' },
            { id: 'task_reward', label: isArabic ? 'أرباح المهام' : 'Tasks' },
            { id: 'referral_commission', label: isArabic ? 'عمولات الإحالة' : 'Referrals' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => {
                soundEngine.playClick();
                setFilter(f.id as RecordFilterType);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filter === f.id
                  ? 'bg-[#FF6B00] text-black font-black shadow-md shadow-orange-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Records List */}
        <div className="overflow-y-auto space-y-3 py-4 pr-1 pl-1 flex-1 custom-scrollbar">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-black/40 border border-white/5 space-y-3 my-4">
              <FileText className="w-12 h-12 text-gray-600 mx-auto" />
              <p className="text-sm font-bold text-gray-400">
                {isArabic ? 'لا توجد سجلات مالية في هذا القسم حتى الآن' : 'No financial records found in this category'}
              </p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {isArabic ? 'ستظهر هنا جميع عمليات الإيداع والسحب وأرباح المهام اليومية بمجرد تسجيلها.' : 'All incoming and outgoing transactions will be logged here.'}
              </p>
            </div>
          ) : (
            filteredTransactions.map(tx => {
              const dateStr = typeof tx.timestamp === 'string' 
                ? new Date(tx.timestamp).toLocaleString(isArabic ? 'ar-EG' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })
                : new Date(tx.timestamp).toLocaleString(isArabic ? 'ar-EG' : 'en-US', { dateStyle: 'short', timeStyle: 'short' });
              
              const isPositive = tx.type === 'deposit' || tx.type === 'task_reward' || tx.type === 'referral_commission';
              
              return (
                <div
                  key={tx.id}
                  className="p-4 rounded-2xl bg-black/50 border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    {getTypeIcon(tx.type)}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-white">
                          {getTypeLabel(tx.type)}
                        </span>
                        {getStatusBadge(tx.status)}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500 font-mono">
                        <span>{dateStr}</span>
                        {tx.txHash && (
                          <button
                            onClick={() => handleCopyHash(tx.txHash!, tx.id)}
                            className="text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
                            title="Copy Tx Hash"
                          >
                            <span>TX: {tx.txHash.slice(0, 8)}...</span>
                            {copiedTxId === tx.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0 shrink-0">
                    <span className={`text-base font-black font-mono ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isPositive ? '+' : '-'}${tx.amountUSDT.toFixed(2)} USDT
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase font-mono mt-0.5">
                      TRC-20
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
          <span className="text-xs font-mono text-gray-400">
            {filteredTransactions.length} {isArabic ? 'سجلات مسجلة' : 'records found'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer transition-all"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
