import { StoredAccount, storage } from './storage';
import { Transaction } from '../types';

let isSyncing = false;
let pollingInterval: any = null;
let currentAbortController: AbortController | null = null;
let focusHandler: (() => void) | null = null;
let visibilityHandler: (() => void) | null = null;

export const networkSync = {
  // 1. Initialize real-time bridge & auto-sync
  init(onDataUpdated?: () => void): void {
    if (typeof window === 'undefined') return;

    // Clean any prior instance listeners first
    networkSync.destroy();

    // Initial sync
    networkSync.syncNow(onDataUpdated);

    // Optimized polling: every 60 seconds, and only when page is actively visible
    pollingInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return; // Skip background polling to conserve CPU & memory
      }
      networkSync.syncNow(onDataUpdated);
    }, 60000);

    // Instant sync when user switches back to tab or focuses window
    focusHandler = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        networkSync.syncNow(onDataUpdated);
      }
    };
    window.addEventListener('focus', focusHandler);

    visibilityHandler = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        networkSync.syncNow(onDataUpdated);
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
  },

  // 1b. Cleanup all timers, listeners, and abort in-flight requests on page departure or unmount
  destroy(): void {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    if (focusHandler && typeof window !== 'undefined') {
      window.removeEventListener('focus', focusHandler);
      focusHandler = null;
    }
    if (visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
    isSyncing = false;
  },

  // 2. Perform bidirectional sync with server's Unified Database
  async syncNow(callback?: () => void): Promise<boolean> {
    if (isSyncing || typeof window === 'undefined') return false;
    isSyncing = true;

    try {
      // Gather local accounts, transactions, and notifications from localStorage
      let localAccounts: StoredAccount[] = [];
      let localTransactions: Transaction[] = [];
      let localNotifications: any[] = [];

      try {
        const rawUsers = localStorage.getItem('vipads_multi_users_registry');
        if (rawUsers) localAccounts = JSON.parse(rawUsers);
      } catch {}

      try {
        const rawTxs = localStorage.getItem('vipads_global_transactions');
        if (rawTxs) localTransactions = JSON.parse(rawTxs);
      } catch {}

      const activeEmail = (storage.getCurrentUserEmail() || '').trim().toLowerCase();
      if (activeEmail) {
        try {
          localNotifications = storage.getUserNotifications(activeEmail);
        } catch {}
      }

      if (currentAbortController) {
        currentAbortController.abort();
      }
      currentAbortController = new AbortController();

      const response = await fetch('/api/network/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: currentAbortController.signal,
        body: JSON.stringify({
          clientAccounts: localAccounts,
          clientTransactions: localTransactions,
          clientNotifications: localNotifications,
        }),
      });

      if (!response.ok) {
        isSyncing = false;
        return false;
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.accounts)) {
        // Hydrate local storage with unified database accounts
        const existingUsersRaw = localStorage.getItem('vipads_multi_users_registry');
        const existingUsers: StoredAccount[] = existingUsersRaw ? JSON.parse(existingUsersRaw) : [];

        // Check if there are updates
        const accountsChanged = data.accounts.length !== existingUsers.length ||
          data.accounts.some((sa: StoredAccount) => {
            const saEmail = (sa?.email || '').trim().toLowerCase();
            const la = existingUsers.find((u) => (u?.email || '').trim().toLowerCase() === saEmail);
            return !la ||
              la.referralCount !== sa.referralCount ||
              la.totalBalanceUSDT !== sa.totalBalanceUSDT ||
              la.totalDepositedUSDT !== sa.totalDepositedUSDT ||
              la.vipLevel !== sa.vipLevel;
          });

        if (accountsChanged) {
          const userMap = new Map<string, StoredAccount>();
          const updatedEmails = new Set<string>();
          existingUsers.forEach((u) => {
            const k = (u?.email || '').trim().toLowerCase();
            if (k) userMap.set(k, u);
          });
          data.accounts.forEach((sa: StoredAccount) => {
            const k = (sa?.email || '').trim().toLowerCase();
            if (!k) return;
            const existing = userMap.get(k);
            if (!existing) {
              userMap.set(k, sa);
              updatedEmails.add(k);
            } else {
              const sTime = Number(sa.lastModified) || 0;
              const lTime = Number(existing.lastModified) || 0;
              userMap.set(k, {
                ...existing,
                ...sa,
                totalBalanceUSDT: sTime >= lTime ? (sa.totalBalanceUSDT ?? existing.totalBalanceUSDT) : existing.totalBalanceUSDT,
                totalDepositedUSDT: sTime >= lTime ? (sa.totalDepositedUSDT ?? existing.totalDepositedUSDT) : existing.totalDepositedUSDT,
                vipLevel: Math.max(existing.vipLevel || 0, sa.vipLevel || 0),
                referralCount: Math.max(existing.referralCount || 0, sa.referralCount || 0),
                referralEarningsUSDT: Math.max(existing.referralEarningsUSDT || 0, sa.referralEarningsUSDT || 0),
                referredBy: existing.referredBy || sa.referredBy,
                lastModified: Math.max(sTime, lTime, Date.now()),
              });
              updatedEmails.add(k);
            }
          });
          const mergedAccounts = Array.from(userMap.values());
          localStorage.setItem('vipads_multi_users_registry', JSON.stringify(mergedAccounts));
          storage.invalidateUsersCache(mergedAccounts);

          // Only update individual lifetime backup keys for changed users and active user
          const activeEmail = (storage.getCurrentUserEmail() || '').trim().toLowerCase();
          if (activeEmail) updatedEmails.add(activeEmail);

          updatedEmails.forEach((uEmail) => {
            const u = userMap.get(uEmail);
            if (u && uEmail) {
              const k = `vipads_lifetime_balance_${uEmail}`;
              try {
                const prev = localStorage.getItem(k);
                const pObj = prev ? JSON.parse(prev) : {};
                pObj.totalBalanceUSDT = typeof u.totalBalanceUSDT === 'number' ? u.totalBalanceUSDT : (pObj.totalBalanceUSDT || 0);
                pObj.totalDepositedUSDT = typeof u.totalDepositedUSDT === 'number' ? u.totalDepositedUSDT : (pObj.totalDepositedUSDT || 0);
                pObj.vipLevel = Math.max(pObj.vipLevel || 0, u.vipLevel || 0);
                pObj.referralCount = Math.max(pObj.referralCount || 0, u.referralCount || 0);
                pObj.lastUpdated = Date.now();
                localStorage.setItem(k, JSON.stringify(pObj));
              } catch {}
            }
          });

          // Dispatch notification to UI only if accounts changed
          window.dispatchEvent(new CustomEvent('vipads:team_updated'));
          window.dispatchEvent(new CustomEvent('vipads_accounts_updated'));
          if (callback) callback();
        }

        if (Array.isArray(data.transactions)) {
          if (data.transactions.length === 0) {
            // Keep local transactions if server has empty list
          } else {
            // Merge safely: Never downgrade a completed/approved transaction back to pending!
            let localTxs: any[] = [];
            try {
              const raw = localStorage.getItem('vipads_global_transactions');
              if (raw) localTxs = JSON.parse(raw);
            } catch {}

            const serverIds = new Set(data.transactions.map((t: any) => t?.id).filter(Boolean));
            const localOnly = localTxs.filter((lt: any) => lt?.id && !serverIds.has(lt.id));
            const combinedTxs = [...data.transactions, ...localOnly];

            const mergedTxs = combinedTxs.map((sTx: any) => {
              const lTx = localTxs.find((lt: any) => lt?.id === sTx?.id);
              if (lTx && (lTx.status === 'completed' || lTx.status === 'approved') && sTx.status === 'pending') {
                return { ...sTx, status: 'completed' };
              }
              return sTx;
            });

            // Check if transactions actually changed before disk write & event dispatch
            let hasTxDiff = mergedTxs.length !== localTxs.length;
            if (!hasTxDiff) {
              hasTxDiff = mergedTxs.some((mt: any, idx: number) => {
                const lt = localTxs[idx];
                return !lt || lt.id !== mt.id || lt.status !== mt.status || lt.amountUSDT !== mt.amountUSDT;
              });
            }

            if (hasTxDiff) {
              localStorage.setItem('vipads_global_transactions', JSON.stringify(mergedTxs));
              localStorage.setItem('vipads_all_transactions', JSON.stringify(mergedTxs));
              storage.invalidateTransactionsCache(mergedTxs);
              window.dispatchEvent(new CustomEvent('vipads_transactions_changed'));
            }
          }
        }

        // Hydrate notifications from unified server database
        if (Array.isArray(data.notifications)) {
          const currentEmail = (storage.getCurrentUserEmail() || '').trim().toLowerCase();
          if (currentEmail) {
            const serverNotifsForUser = data.notifications.filter((n: any) => 
              (n.userEmail || '').trim().toLowerCase() === currentEmail
            );
            if (serverNotifsForUser.length > 0) {
              const localNotifs = storage.getUserNotifications(currentEmail);
              const notifMap = new Map<string, any>();
              localNotifs.forEach((n) => notifMap.set(n.id, n));
              let hasNotifChanges = false;

              serverNotifsForUser.forEach((sn: any) => {
                const existing = notifMap.get(sn.id);
                if (!existing) {
                  notifMap.set(sn.id, sn);
                  hasNotifChanges = true;
                } else if (existing.read !== sn.read) {
                  notifMap.set(sn.id, { ...existing, read: sn.read });
                  hasNotifChanges = true;
                }
              });

              if (hasNotifChanges) {
                const mergedNotifs = Array.from(notifMap.values()).sort(
                  (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );
                storage.saveUserNotifications(currentEmail, mergedNotifs);
              }
            }
          }
        }
      }

      isSyncing = false;
      return true;
    } catch {
      isSyncing = false;
      return false;
    }
  },

  // Post notification to server
  async postNotification(notification: any): Promise<boolean> {
    try {
      const response = await fetch('/api/network/notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  // 3. Register user directly into the server's Unified Database
  async registerUser(payload: {
    email: string;
    username?: string;
    password?: string;
    referralCode?: string;
    referredBy?: string;
  }): Promise<{ success: boolean; user?: StoredAccount; inviter?: StoredAccount; allAccounts?: StoredAccount[] }> {
    try {
      const response = await fetch('/api/network/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return { success: false };
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.allAccounts)) {
        const curUsersRaw = localStorage.getItem('vipads_multi_users_registry');
        const curUsers: StoredAccount[] = curUsersRaw ? JSON.parse(curUsersRaw) : [];
        const userMap = new Map<string, StoredAccount>();
        curUsers.forEach((u) => { if (u?.email) userMap.set(u.email.toLowerCase().trim(), u); });
        data.allAccounts.forEach((sa: StoredAccount) => {
          if (sa?.email) {
            const k = sa.email.toLowerCase().trim();
            if (!userMap.has(k)) {
              userMap.set(k, sa);
            }
          }
        });
        localStorage.setItem('vipads_multi_users_registry', JSON.stringify(Array.from(userMap.values())));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('vipads:team_updated'));
      }

      return data;
    } catch (e) {
      console.warn('Network registration error:', e);
      return { success: false };
    }
  },

  // 4. Approve deposit with 3-tier commission distribution on server
  async approveDeposit(payload: {
    txId: string;
    depositorEmail: string;
    amount: number;
  }): Promise<boolean> {
    try {
      const response = await fetch('/api/network/approve-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (data.success) {
        if (Array.isArray(data.accounts)) {
          const curUsersRaw = localStorage.getItem('vipads_multi_users_registry');
          const curUsers: StoredAccount[] = curUsersRaw ? JSON.parse(curUsersRaw) : [];
          const userMap = new Map<string, StoredAccount>();
          curUsers.forEach((u) => { if (u?.email) userMap.set(u.email.toLowerCase().trim(), u); });
          data.accounts.forEach((sa: StoredAccount) => {
            if (sa?.email) {
              const k = sa.email.toLowerCase().trim();
              const existing = userMap.get(k);
              if (!existing) {
                userMap.set(k, sa);
              } else {
                userMap.set(k, {
                  ...existing,
                  ...sa,
                  totalBalanceUSDT: typeof sa.totalBalanceUSDT === 'number' ? sa.totalBalanceUSDT : existing.totalBalanceUSDT,
                  totalDepositedUSDT: typeof sa.totalDepositedUSDT === 'number' ? sa.totalDepositedUSDT : existing.totalDepositedUSDT,
                  lastModified: Date.now(),
                });
              }
            }
          });
          localStorage.setItem('vipads_multi_users_registry', JSON.stringify(Array.from(userMap.values())));
        }
        if (Array.isArray(data.transactions)) {
          let localTxs: any[] = [];
          try {
            const raw = localStorage.getItem('vipads_global_transactions');
            if (raw) localTxs = JSON.parse(raw);
          } catch {}

          const mergedTxs = data.transactions.map((sTx: any) => {
            const lTx = localTxs.find((lt: any) => lt.id === sTx.id);
            if (lTx && (lTx.status === 'completed' || lTx.status === 'approved') && sTx.status === 'pending') {
              return { ...sTx, status: 'completed' };
            }
            return sTx;
          });

          localStorage.setItem('vipads_global_transactions', JSON.stringify(mergedTxs));
          localStorage.setItem('vipads_all_transactions', JSON.stringify(mergedTxs));
        }
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('vipads:team_updated'));
        window.dispatchEvent(new CustomEvent('vipads_transactions_changed'));
        window.dispatchEvent(new CustomEvent('vipads_accounts_updated'));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  // 5. Post transaction to server
  async postTransaction(tx: Transaction): Promise<boolean> {
    try {
      const response = await fetch('/api/network/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: tx }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  // 5b. Update transaction status on server
  async updateTransactionStatus(txId: string, status: string): Promise<boolean> {
    try {
      const response = await fetch('/api/network/transaction/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId, status }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  // 6. Direct plan purchase deduction on server
  async purchasePlan(email: string, planLevel: number, planCost: number): Promise<boolean> {
    try {
      const response = await fetch('/api/network/purchase-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, planLevel, planCost }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  // 7. Direct withdrawal deduction on server
  async withdrawFunds(email: string, amount: number): Promise<boolean> {
    try {
      const response = await fetch('/api/network/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  // 8. Direct deposit balance addition on server
  async depositFunds(email: string, amount: number): Promise<boolean> {
    try {
      const response = await fetch('/api/network/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};

// Clear timers and cancel in-flight network sync when user leaves page or closes tab
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => networkSync.destroy());
  window.addEventListener('pagehide', () => networkSync.destroy());
}

