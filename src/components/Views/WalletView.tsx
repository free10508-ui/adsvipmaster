import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Copy, 
  Check, 
  Coins, 
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { UserProfile, Transaction, VIPPlan } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { SponsorAdBannerCard } from '../SponsorAdBannerCard';

interface WalletViewProps {
  user: UserProfile;
  vipPlan: VIPPlan;
  transactions: Transaction[];
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenProofs?: () => void;
}

export const WalletView: React.FC<WalletViewProps> = React.memo(({
  user,
  transactions,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenProofs,
}) => {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const [filter, setFilter] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (user.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredTx = transactions.filter((tx) => {
    if (filter === 'all') return true;
    if (filter === 'rewards') return tx.type === 'task_reward';
    if (filter === 'deposits') return tx.type === 'deposit';
    if (filter === 'withdraws') return tx.type === 'withdraw';
    return true;
  });

  return (
    <div id="wallet-view" className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Wallet Balance Hero Card */}
      <div className="rounded-3xl p-6 sm:p-8 glass border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF6B00]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#00A3FF]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00A3FF]/20 text-[#00A3FF] border border-[#00A3FF]/30">
                {t('wallet.primary_account')}
              </span>
              <span className="text-xs text-gray-400 font-mono">TRC20 & BEP20</span>
            </div>

            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                ${user.totalBalanceUSDT.toFixed(2)}
              </span>
              <span className="text-base font-bold text-[#FF6B00]">{t('hero.currency')}</span>
            </div>

            {/* Wallet Address Chip */}
            <div className="flex items-center gap-2 mt-3 p-2 rounded-xl bg-black/40 border border-white/5 w-fit">
              <span className="text-xs font-mono text-gray-300">
                {user.walletAddress || (isArabic ? 'لم يتم ربط محفظة سحب بعد' : 'No withdrawal wallet linked')}
              </span>
              {user.walletAddress && (
                <button
                  id="wallet-copy-chip-btn"
                  onClick={copyAddress}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title={t('common.copy')}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              id="wallet-recharge-btn"
              onClick={onOpenDeposit}
              className="px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-black bg-[#FF6B00] hover:bg-[#ff7a1a] shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4 text-black stroke-[3]" />
              <span>{t('hero.recharge')}</span>
            </button>

            <button
              id="wallet-withdraw-btn"
              onClick={onOpenWithdraw}
              className="px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-white bg-white/10 hover:bg-white/15 border border-white/10 hover:border-[#00A3FF]/40 shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 text-[#00A3FF]" />
              <span>{t('hero.withdraw')}</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Breakdown Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/5 relative z-10">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              {t('wallet.today_ad_profits')}
            </span>
            <span className="text-xl font-extrabold font-mono text-emerald-400 mt-1 block">
              +${user.taskEarningsToday.toFixed(2)} USDT
            </span>
            <span className="text-[10px] text-gray-500">{t('wallet.from_tasks')}</span>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              {t('wallet.total_withdrawn')}
            </span>
            <span className="text-xl font-extrabold font-mono text-[#00A3FF] mt-1 block">
              ${user.totalWithdrawnUSDT.toFixed(2)} USDT
            </span>
            <span className="text-[10px] text-gray-500">{t('wallet.sent_onchain')}</span>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              {t('wallet.referral_commissions')}
            </span>
            <span className="text-xl font-extrabold font-mono text-[#FF6B00] mt-1 block">
              +${user.referralEarningsUSDT.toFixed(2)} USDT
            </span>
            <span className="text-[10px] text-gray-500">{t('wallet.team_members', { count: user.referralCount })}</span>
          </div>
        </div>
      </div>

      {/* Sponsored Payout Guarantee Ad Banner */}
      <SponsorAdBannerCard
        title="Tether TRC-20 & BEP-20 Official Settlement Gateway"
        subtitle="Guaranteed automated on-chain execution with zero delay and instant confirmation"
        sponsorName="Tether TRON Liquidity"
        imageUrl="https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=1000&q=80"
        variant="emerald"
        rewardBonusUSDT={0.10}
      />

      {/* Approved Withdrawal Proofs Showcase Trigger Banner */}
      {onOpenProofs && (
        <div 
          onClick={onOpenProofs}
          className="rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-[#0D1424] via-[#111A2E] to-[#0D1424] border border-emerald-500/30 hover:border-emerald-500/60 shadow-xl flex items-center justify-between gap-4 cursor-pointer group transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-black text-white group-hover:text-emerald-300 transition-colors">
                  إثباتات السحب المعتمدة
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                  موثق 100%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                تصفح أكثر من 120+ إثبات تحويل حقيقي موثق من مستكشف TronScan مع تفاصيل الكتل والمبالغ
              </p>
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-black shrink-0 group-hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-1.5">
            <span>عرض السجلات</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </div>
        </div>
      )}

      {/* Transaction History Section */}
      <div className="rounded-3xl p-6 glass border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">
              {t('wallet.tx_history')}
            </h3>
            <p className="text-xs text-gray-400">
              {t('wallet.tx_subtitle')}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: t('tasks.cat_all') },
              { id: 'rewards', label: t('wallet.filter_rewards') },
              { id: 'deposits', label: t('wallet.filter_deposits') },
              { id: 'withdraws', label: t('wallet.filter_withdraws') }
            ].map((f) => (
              <button
                key={f.id}
                id={`tx-filter-${f.id}`}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  filter === f.id
                    ? 'bg-[#FF6B00] text-black font-bold'
                    : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-2.5">
          {filteredTx.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-sm">
              {t('wallet.no_transactions')}
            </div>
          ) : (
            filteredTx.map((tx, index) => {
              const isPositive = tx.type === 'task_reward' || tx.type === 'deposit' || tx.type === 'referral_commission';
              return (
                <div
                  key={`${tx.id}-${index}`}
                  id={`tx-item-${tx.id}-${index}`}
                  className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      tx.type === 'task_reward' ? 'bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/30' :
                      tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      tx.type === 'referral_commission' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                      'bg-[#00A3FF]/10 text-[#00A3FF] border border-[#00A3FF]/30'
                    }`}>
                      {tx.type === 'task_reward' && <Coins className="w-5 h-5" />}
                      {tx.type === 'deposit' && <ArrowDownLeft className="w-5 h-5" />}
                      {tx.type === 'referral_commission' && <Sparkles className="w-5 h-5" />}
                      {tx.type === 'withdraw' && <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">
                          {tx.description}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                          tx.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            : tx.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/40'
                        }`}>
                          {tx.status === 'pending' ? 'في المعالجة' : tx.status === 'completed' ? 'مكتمل' : 'مرفوض'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500 font-mono flex-wrap">
                        {tx.userEmail && (
                          <span className="text-gray-400 font-medium">{tx.userEmail} • </span>
                        )}
                        <span>{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(tx.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-end">
                    <span className={`text-sm sm:text-base font-black font-mono ${isPositive ? 'text-emerald-400' : 'text-gray-200'}`}>
                      {isPositive ? '+' : '-'}${tx.amountUSDT.toFixed(2)} USDT
                    </span>
                    {tx.txHash && (
                      <span className="text-[10px] text-gray-500 block font-mono">
                        Tx: {tx.txHash}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
});

