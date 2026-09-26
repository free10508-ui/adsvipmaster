import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  doc,
  setDoc,
  getDoc,
  getDocs,
  getDocFromServer,
  onSnapshot,
  collection,
  writeBatch,
  runTransaction,
  query,
  where,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { StoredAccount, storage } from './storage';
import { Transaction } from '../types';

// Silence harmless internal network transport retry messages
try {
  setLogLevel('silent');
} catch {}

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfigJson) : getApp();

// Target Firestore Database ID
const databaseId = firebaseConfigJson.firestoreDatabaseId || '(default)';

let db: ReturnType<typeof getFirestore>;
try {
  db = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
      experimentalLongPollingOptions: { timeoutSeconds: 15 },
      ignoreUndefinedProperties: true,
    },
    databaseId
  );
} catch {
  try {
    db = initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
        experimentalLongPollingOptions: { timeoutSeconds: 15 },
      },
      databaseId
    );
  } catch {
    db = getFirestore(app, databaseId);
  }
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { db };

// Error Handling according to Firebase Skill Specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationTypeOrContext: OperationType | string,
  path?: string | null
) {
  if (typeof operationTypeOrContext === 'string' && !Object.values(OperationType).includes(operationTypeOrContext as OperationType)) {
    handleNetworkOrQuotaError(error, operationTypeOrContext);
    return;
  }
  const operationType = operationTypeOrContext as OperationType;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path: path || null,
  };
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
}

// Validate Connection to Firestore on boot as required
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection check: Client appears offline, will retry in background.');
    }
    return false;
  }
}
testConnection();

// Collections
const ACCOUNTS_COLLECTION = 'accounts';
const TRANSACTIONS_COLLECTION = 'transactions';
const NOTIFICATIONS_COLLECTION = 'notifications';
const NETWORK_DOC = 'unified_network';
const GLOBAL_DOC_ID = 'state';

export interface FirebaseNetworkState {
  accounts: StoredAccount[];
  transactions: Transaction[];
  lastUpdated: number;
}

let unsubscribeAccounts: (() => void) | null = null;
let unsubscribeTransactions: (() => void) | null = null;
let unsubscribeNotifications: (() => void) | null = null;
let unsubscribeLegacyState: (() => void) | null = null;
let isPushing = false;
let isPullingAndPushing = false;
let isQuotaExhausted = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('vipads_firestore_quota_exhausted') === 'true';
let accountsBroadcastTimeout: any = null;
let txBroadcastTimeout: any = null;
let notifsBroadcastTimeout: any = null;
let accountsDebounceTimer: any = null;
let txDebounceTimer: any = null;
let notifsDebounceTimer: any = null;
let hasDoneInitialHandshake = false;
let onUpdateTimeout: any = null;

// Memory leak prevention: clear and dispose all active Firestore polling & stream listeners
export function clearAllFirestoreMemory(): void {
  try {
    if (unsubscribeAccounts) {
      unsubscribeAccounts();
      unsubscribeAccounts = null;
    }
    if (unsubscribeTransactions) {
      unsubscribeTransactions();
      unsubscribeTransactions = null;
    }
    if (unsubscribeNotifications) {
      unsubscribeNotifications();
      unsubscribeNotifications = null;
    }
    if (unsubscribeLegacyState) {
      unsubscribeLegacyState();
      unsubscribeLegacyState = null;
    }
    if (accountsBroadcastTimeout) {
      clearTimeout(accountsBroadcastTimeout);
      accountsBroadcastTimeout = null;
    }
    if (txBroadcastTimeout) {
      clearTimeout(txBroadcastTimeout);
      txBroadcastTimeout = null;
    }
    if (notifsBroadcastTimeout) {
      clearTimeout(notifsBroadcastTimeout);
      notifsBroadcastTimeout = null;
    }
    if (accountsDebounceTimer) {
      clearTimeout(accountsDebounceTimer);
      accountsDebounceTimer = null;
    }
    if (txDebounceTimer) {
      clearTimeout(txDebounceTimer);
      txDebounceTimer = null;
    }
    if (notifsDebounceTimer) {
      clearTimeout(notifsDebounceTimer);
      notifsDebounceTimer = null;
    }
    if (onUpdateTimeout) {
      clearTimeout(onUpdateTimeout);
      onUpdateTimeout = null;
    }
    isPushing = false;
    isPullingAndPushing = false;
  } catch (e) {
    console.warn('[FirebaseLive] Error clearing Firestore memory:', e);
  }
}

// Automatically bind page unloading hooks to clear memory leaks when user navigates away or closes tab
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', clearAllFirestoreMemory);
  window.addEventListener('pagehide', clearAllFirestoreMemory);
}

function handleNetworkOrQuotaError(err: any, context: string) {
  const msg = String(err?.message || err || '');
  const code = String(err?.code || '');
  if (
    code === 'unavailable' ||
    code.includes('unavailable') ||
    msg.includes('unavailable') ||
    msg.includes('Could not reach Cloud Firestore backend') ||
    msg.includes('The operation could not be completed')
  ) {
    // Transient network connection or offline fallback: Firestore SDK switches to offline cache gracefully
    return;
  }
  if (
    code === 'resource-exhausted' ||
    code.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('resource-exhausted') ||
    msg.includes('maximum allowed queued writes') ||
    msg.includes('Free daily write units')
  ) {
    if (!isQuotaExhausted) {
      isQuotaExhausted = true;
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('vipads_firestore_quota_exhausted', 'true');
        }
      } catch {}
      try {
        if (unsubscribeAccounts) { unsubscribeAccounts(); unsubscribeAccounts = null; }
        if (unsubscribeTransactions) { unsubscribeTransactions(); unsubscribeTransactions = null; }
        if (unsubscribeLegacyState) { unsubscribeLegacyState(); unsubscribeLegacyState = null; }
      } catch {}
      console.warn(`[FirebaseLive] Firestore daily quota reached during ${context}. Gracefully relying on local & Express Unified Network DB.`);
    }
    return;
  }
  console.warn(`[FirebaseLive] ${context} error:`, err);
}

// Helper to sanitize Firestore document ID from email
export function getDocIdForEmail(email: string): string {
  return (email || '').toLowerCase().trim().replace(/[\/\#\$\[\]]/g, '_');
}

export const firebaseSync = {
  // Check if Firestore quota is currently exhausted
  isQuotaExhausted(): boolean {
    return isQuotaExhausted;
  },

  // 1. Initialize Real-time Two-Way Live Stream
  startLiveStream(onUpdate?: (data: FirebaseNetworkState) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    // If quota is exhausted for the day, skip Firestore completely and rely on local & Express Unified Network DB
    if (isQuotaExhausted) {
      return () => {};
    }

    // Clear previous listeners and timeouts cleanly
    clearAllFirestoreMemory();

    // Initial Two-way Handshake: upload any local accounts to Firestore and download all remote accounts once per session
    if (!hasDoneInitialHandshake) {
      hasDoneInitialHandshake = true;
      firebaseSync.forcePullAndPushAll().catch((err) => handleFirestoreError(err, 'initial handshake'));
    }

    // A) Listen to 'accounts' collection in real-time with debounced processing
    try {
      const accountsColRef = collection(db, ACCOUNTS_COLLECTION);
      let isFirstAccountsSnapshot = true;
      let pendingAccounts: StoredAccount[] = [];

      unsubscribeAccounts = onSnapshot(
        accountsColRef,
        (snapshot) => {
          if (snapshot.empty) return;

          if (isFirstAccountsSnapshot) {
            isFirstAccountsSnapshot = false;
            snapshot.forEach((d) => {
              const data = d.data() as StoredAccount;
              if (data && data.email) {
                pendingAccounts.push(data);
              }
            });
          } else {
            const changes = snapshot.docChanges();
            if (changes.length === 0) return;
            for (const change of changes) {
              if (change.type === 'added' || change.type === 'modified') {
                const data = change.doc.data() as StoredAccount;
                if (data && data.email) {
                  pendingAccounts.push(data);
                }
              }
            }
          }

          if (pendingAccounts.length === 0) return;

          if (accountsDebounceTimer) clearTimeout(accountsDebounceTimer);
          accountsDebounceTimer = setTimeout(() => {
            const batch = pendingAccounts;
            pendingAccounts = [];
            const hasChanged = firebaseSync.mergeAccountsIntoLocalStorage(batch);

            if (hasChanged && onUpdate) {
              if (onUpdateTimeout) clearTimeout(onUpdateTimeout);
              onUpdateTimeout = setTimeout(() => {
                onUpdate({
                  accounts: storage.getAllUsers(),
                  transactions: [],
                  lastUpdated: Date.now(),
                });
              }, 300);
            }
          }, 400);
        },
        (err) => {
          handleFirestoreError(err, 'accounts onSnapshot');
        }
      );
    } catch (e) {
      handleFirestoreError(e, 'attach accounts onSnapshot');
    }

    // B) Listen to 'transactions' collection in real-time with debounced processing
    try {
      const txsColRef = collection(db, TRANSACTIONS_COLLECTION);
      let isFirstTxsSnapshot = true;
      let pendingTxs: Transaction[] = [];

      unsubscribeTransactions = onSnapshot(
        txsColRef,
        (snapshot) => {
          if (snapshot.empty) return;

          if (isFirstTxsSnapshot) {
            isFirstTxsSnapshot = false;
            snapshot.forEach((d) => {
              const data = d.data() as Transaction;
              if (data && data.id) {
                pendingTxs.push(data);
              }
            });
          } else {
            const changes = snapshot.docChanges();
            if (changes.length === 0) return;
            for (const change of changes) {
              if (change.type === 'added' || change.type === 'modified') {
                const data = change.doc.data() as Transaction;
                if (data && data.id) {
                  pendingTxs.push(data);
                }
              }
            }
          }

          if (pendingTxs.length === 0) return;

          if (txDebounceTimer) clearTimeout(txDebounceTimer);
          txDebounceTimer = setTimeout(() => {
            const batch = pendingTxs;
            pendingTxs = [];
            firebaseSync.mergeTransactionsIntoLocalStorage(batch);
          }, 400);
        },
        (err) => {
          handleFirestoreError(err, 'transactions onSnapshot');
        }
      );
    } catch (e) {
      handleFirestoreError(e, 'attach transactions onSnapshot');
    }

    // C) Listen to 'notifications' collection in real-time (targeted to active user to eliminate unnecessary data)
    try {
      const currentEmail = (storage.getCurrentUserEmail() || '').trim().toLowerCase();
      let notifsQuery: any = null;
      if (currentEmail) {
        notifsQuery = query(collection(db, NOTIFICATIONS_COLLECTION), where('userEmail', '==', currentEmail));
      } else {
        notifsQuery = collection(db, NOTIFICATIONS_COLLECTION);
      }

      let isFirstNotifsSnapshot = true;
      let pendingNotifs: any[] = [];

      unsubscribeNotifications = onSnapshot(
        notifsQuery,
        (snapshot: any) => {
          if (snapshot.empty) return;

          if (isFirstNotifsSnapshot) {
            isFirstNotifsSnapshot = false;
            snapshot.forEach((d: any) => {
              const data = d.data();
              if (data && data.id) {
                pendingNotifs.push(data);
              }
            });
          } else {
            const changes = snapshot.docChanges();
            if (changes.length === 0) return;
            for (const change of changes) {
              if (change.type === 'added' || change.type === 'modified') {
                const data = change.doc.data();
                if (data && data.id) {
                  pendingNotifs.push(data);
                }
              }
            }
          }

          if (pendingNotifs.length === 0) return;

          if (notifsDebounceTimer) clearTimeout(notifsDebounceTimer);
          notifsDebounceTimer = setTimeout(() => {
            const batch = pendingNotifs;
            pendingNotifs = [];
            firebaseSync.mergeNotificationsIntoLocalStorage(batch);
          }, 400);
        },
        (err: any) => {
          handleFirestoreError(err, 'notifications onSnapshot');
        }
      );
    } catch (e) {
      handleFirestoreError(e, 'attach notifications onSnapshot');
    }

    return () => {
      clearAllFirestoreMemory();
    };
  },

  // 1b. Real-time Live Listener specifically for Admin Panel (onSnapshot across all accounts)
  subscribeToAllAccountsLive(callback: (accounts: StoredAccount[]) => void): () => void {
    if (isQuotaExhausted) {
      callback(storage.getAllUsers());
      return () => {};
    }
    try {
      const colRef = collection(db, ACCOUNTS_COLLECTION);
      return onSnapshot(
        colRef,
        (snapshot) => {
          if (snapshot.empty) return;
          const remoteAccounts: StoredAccount[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as StoredAccount;
            if (data && data.email) {
              remoteAccounts.push(data);
            }
          });
          firebaseSync.mergeAccountsIntoLocalStorage(remoteAccounts);
          callback(storage.getAllUsers());
        },
        (err) => {
          handleFirestoreError(err, 'subscribeToAllAccountsLive');
          callback(storage.getAllUsers());
        }
      );
    } catch (e) {
      callback(storage.getAllUsers());
      return () => {};
    }
  },

  // 1b. Real-time Live Listener for Transactions (Admin Panel & Dashboard)
  subscribeToAllTransactionsLive(callback: (transactions: Transaction[]) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    if (isQuotaExhausted) {
      callback(storage.getAllTransactions());
      return () => {};
    }
    try {
      const colRef = collection(db, TRANSACTIONS_COLLECTION);
      return onSnapshot(
        colRef,
        (snapshot) => {
          if (snapshot.empty) return;
          const remoteTxs: Transaction[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as Transaction;
            if (data && data.id) {
              remoteTxs.push(data);
            }
          });
          firebaseSync.mergeTransactionsIntoLocalStorage(remoteTxs);
          callback(storage.getAllTransactions());
        },
        (err) => {
          handleFirestoreError(err, 'subscribeToAllTransactionsLive');
          callback(storage.getAllTransactions());
        }
      );
    } catch (e) {
      callback(storage.getAllTransactions());
      return () => {};
    }
  },

  // 2. Safe Intelligent Bidirectional Account Merge
  mergeAccountsIntoLocalStorage(remoteAccounts: StoredAccount[]): boolean {
    try {
      const rawLocal = localStorage.getItem('vipads_multi_users_registry');
      let localAccounts: StoredAccount[] = rawLocal ? JSON.parse(rawLocal) : [];

      let hasChanges = false;
      const updatedEmails = new Set<string>();
      const localMap = new Map<string, StoredAccount>();
      localAccounts.forEach((acc) => {
        if (acc && acc.email) {
          localMap.set(acc.email.toLowerCase().trim(), acc);
        }
      });

      // Merge every remote account into localMap
      remoteAccounts.forEach((remoteAcc) => {
        if (!remoteAcc || !remoteAcc.email) return;
        const email = remoteAcc.email.toLowerCase().trim();
        const existing = localMap.get(email);

        if (!existing) {
          // Brand new user from live stream!
          localMap.set(email, remoteAcc);
          updatedEmails.add(email);
          hasChanges = true;
        } else {
          const remoteMod = typeof remoteAcc.lastModified === 'number' ? remoteAcc.lastModified : 0;
          const localMod = typeof existing.lastModified === 'number' ? existing.lastModified : 0;

          let newBal: number;
          let newDep: number;
          let newVip: number;
          let newRefs: number;
          let newPending: number;
          let newRefEarnings: number;

          const isFreeAdmin = email === 'free@gmail.com';

          if (remoteMod > localMod) {
            // Remote Firestore update is strictly newer
            newBal = typeof remoteAcc.totalBalanceUSDT === 'number' ? Number(remoteAcc.totalBalanceUSDT.toFixed(2)) : (existing.totalBalanceUSDT || 0);
            newDep = typeof remoteAcc.totalDepositedUSDT === 'number' ? Number(remoteAcc.totalDepositedUSDT.toFixed(2)) : (existing.totalDepositedUSDT || 0);
            newVip = (isFreeAdmin && remoteAcc.vipLevel === 0) ? 0 : (typeof remoteAcc.vipLevel === 'number' ? remoteAcc.vipLevel : (existing.vipLevel || 0));
            newRefs = (isFreeAdmin && remoteAcc.referralCount === 0) ? 0 : (typeof remoteAcc.referralCount === 'number' ? remoteAcc.referralCount : (existing.referralCount || 0));
            const remotePending = Number((remoteAcc.pending_commissions ?? remoteAcc.pendingReferralRewardsUSDT ?? 0).toFixed(2));
            newPending = (isFreeAdmin && remotePending === 0) ? 0 : remotePending;
            newRefEarnings = (isFreeAdmin && remoteAcc.referralEarningsUSDT === 0) ? 0 : Number((remoteAcc.referralEarningsUSDT ?? 0).toFixed(2));
          } else if (localMod > remoteMod) {
            // Local update is strictly newer (e.g. recent withdrawal, plan purchase, or local admin balance adjustment)
            newBal = typeof existing.totalBalanceUSDT === 'number' ? Number(existing.totalBalanceUSDT.toFixed(2)) : (remoteAcc.totalBalanceUSDT || 0);
            newDep = typeof existing.totalDepositedUSDT === 'number' ? Number(existing.totalDepositedUSDT.toFixed(2)) : (remoteAcc.totalDepositedUSDT || 0);
            newVip = typeof existing.vipLevel === 'number' ? existing.vipLevel : (remoteAcc.vipLevel || 0);
            newRefs = typeof existing.referralCount === 'number' ? existing.referralCount : (remoteAcc.referralCount || 0);
            newPending = Number((existing.pending_commissions ?? existing.pendingReferralRewardsUSDT ?? 0).toFixed(2));
            newRefEarnings = Number((existing.referralEarningsUSDT ?? 0).toFixed(2));

            // Sync the newer local account to Firestore asynchronously so Firestore gets the latest state!
            try {
              firebaseSync.updateUserLive(existing).catch(() => {});
            } catch {}
          } else {
            // Equal or missing timestamps: Always preserve the local account state as primary, fallback to remote if missing
            newBal = typeof existing.totalBalanceUSDT === 'number' ? existing.totalBalanceUSDT : (remoteAcc.totalBalanceUSDT || 0);
            newDep = typeof existing.totalDepositedUSDT === 'number' ? existing.totalDepositedUSDT : (remoteAcc.totalDepositedUSDT || 0);
            newVip = typeof existing.vipLevel === 'number' ? existing.vipLevel : (remoteAcc.vipLevel || 0);
            newRefs = typeof existing.referralCount === 'number' ? existing.referralCount : (remoteAcc.referralCount || 0);
            newPending = Number((existing.pending_commissions ?? existing.pendingReferralRewardsUSDT ?? remoteAcc.pendingReferralRewardsUSDT ?? 0).toFixed(2));
            newRefEarnings = Number((existing.referralEarningsUSDT ?? remoteAcc.referralEarningsUSDT ?? 0).toFixed(2));
          }

          const existingPending = Number((existing.pending_commissions ?? existing.pendingReferralRewardsUSDT ?? 0).toFixed(2));
          const passwordChanged = Boolean(remoteAcc.password && existing.password !== remoteAcc.password);
          const balChanged = Math.abs((existing.totalBalanceUSDT || 0) - newBal) > 0.001;
          const depChanged = Math.abs((existing.totalDepositedUSDT || 0) - newDep) > 0.001;
          const vipChanged = (existing.vipLevel || 0) !== newVip;
          const refsChanged = (existing.referralCount || 0) !== newRefs;
          const pendingChanged = Math.abs(existingPending - newPending) > 0.001;
          const refEarnChanged = Math.abs((existing.referralEarningsUSDT || 0) - newRefEarnings) > 0.001;

          if (
            balChanged ||
            depChanged ||
            vipChanged ||
            refsChanged ||
            pendingChanged ||
            refEarnChanged ||
            passwordChanged
          ) {
            localMap.set(email, {
              ...existing,
              ...remoteAcc,
              totalBalanceUSDT: newBal,
              totalDepositedUSDT: newDep,
              vipLevel: newVip,
              referralCount: newRefs,
              pending_commissions: newPending,
              pendingReferralRewardsUSDT: newPending,
              referralEarningsUSDT: newRefEarnings,
              password: remoteAcc.password || existing.password || '123456',
              lastModified: Math.max(remoteMod, localMod, Date.now()),
            });
            updatedEmails.add(email);
            hasChanges = true;
          }
        }
      });

      // Also ensure Admin free@gmail.com is protected
      let admin = localMap.get('free@gmail.com');
      if (!admin) {
        admin = {
          id: 'ADMIN-001',
          email: 'free@gmail.com',
          username: 'free@gmail.com',
          password: '000000',
          walletAddress: '',
          vipLevel: 0,
          totalBalanceUSDT: 0.0,
          totalDepositedUSDT: 0.0,
          taskEarningsToday: 0.0,
          totalWithdrawnUSDT: 0.0,
          tasksCompletedToday: 0,
          referralCode: '885101',
          referralCount: 0,
          referralEarningsUSDT: 0.0,
          pendingReferralRewardsUSDT: 0.0,
          tier1TaskCommissionUSDT: 0.0,
          tier2TaskCommissionUSDT: 0.0,
          tier3TaskCommissionUSDT: 0.0,
          joinedDate: '2026-08-28',
        };
        localMap.set('free@gmail.com', admin);
        updatedEmails.add('free@gmail.com');
        hasChanges = true;
      }

      if (hasChanges || localAccounts.length !== localMap.size) {
        const mergedList = Array.from(localMap.values());
        localStorage.setItem('vipads_multi_users_registry', JSON.stringify(mergedList));
        storage.invalidateUsersCache(mergedList);

        // Sync lifetime backup keys ONLY for changed accounts & active user
        const currentEmail = (storage.getCurrentUserEmail() || '').toLowerCase().trim();
        if (currentEmail) updatedEmails.add(currentEmail);

        updatedEmails.forEach((email) => {
          const u = localMap.get(email);
          if (u && u.email) {
            const key = `vipads_lifetime_balance_${email}`;
            try {
              const prev = localStorage.getItem(key);
              const pObj = prev ? JSON.parse(prev) : {};
              pObj.totalBalanceUSDT = typeof u.totalBalanceUSDT === 'number' ? u.totalBalanceUSDT : 0;
              pObj.totalDepositedUSDT = typeof u.totalDepositedUSDT === 'number' ? u.totalDepositedUSDT : 0;
              pObj.vipLevel = u.vipLevel !== undefined ? u.vipLevel : (pObj.vipLevel || 0);
              pObj.referralCount = u.referralCount !== undefined ? u.referralCount : (pObj.referralCount || 0);
              pObj.pendingReferralRewardsUSDT = typeof u.pendingReferralRewardsUSDT === 'number' ? u.pendingReferralRewardsUSDT : 0;
              localStorage.setItem(key, JSON.stringify(pObj));
            } catch {}
          }
        });

        // Debounced broadcast notification exclusively for UI components
        if (accountsBroadcastTimeout) clearTimeout(accountsBroadcastTimeout);
        accountsBroadcastTimeout = setTimeout(() => {
          window.dispatchEvent(new CustomEvent('vipads_accounts_updated'));
        }, 300);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[FirebaseLive] mergeAccountsIntoLocalStorage error:', e);
      return false;
    }
  },

  // 3. Safe Merge for Transactions
  mergeTransactionsIntoLocalStorage(remoteTxs: Transaction[]): boolean {
    try {
      const rawTxs = localStorage.getItem('vipads_global_transactions');
      const localTxs: Transaction[] = rawTxs ? JSON.parse(rawTxs) : [];

      const txMap = new Map<string, Transaction>();
      localTxs.forEach((t) => {
        if (t && t.id) txMap.set(t.id, t);
      });

      let changed = false;
      remoteTxs.forEach((rtx) => {
        if (!rtx || !rtx.id) return;
        const ltx = txMap.get(rtx.id);
        if (!ltx) {
          txMap.set(rtx.id, rtx);
          changed = true;
        } else {
          // Never downgrade completed transaction
          if ((ltx.status === 'completed' || ltx.status === 'approved') && rtx.status === 'pending') {
            // Keep completed
          } else if (ltx.status !== rtx.status) {
            txMap.set(rtx.id, { ...ltx, ...rtx });
            changed = true;
          }
        }
      });

      if (changed || localTxs.length !== txMap.size) {
        const mergedList = Array.from(txMap.values());
        localStorage.setItem('vipads_global_transactions', JSON.stringify(mergedList));
        localStorage.setItem('vipads_all_transactions', JSON.stringify(mergedList));
        storage.invalidateTransactionsCache(mergedList);
        if (txBroadcastTimeout) clearTimeout(txBroadcastTimeout);
        txBroadcastTimeout = setTimeout(() => {
          window.dispatchEvent(new CustomEvent('vipads_transactions_changed'));
        }, 300);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[FirebaseLive] mergeTransactionsIntoLocalStorage error:', e);
      return false;
    }
  },

  // 3b. Safe Merge for Notifications
  mergeNotificationsIntoLocalStorage(remoteNotifs: any[]): boolean {
    try {
      const currentEmail = (storage.getCurrentUserEmail() || '').trim().toLowerCase();
      if (!currentEmail || !Array.isArray(remoteNotifs) || remoteNotifs.length === 0) return false;

      // Filter notifications for active user
      const userRemote = remoteNotifs.filter((n) => 
        (n?.userEmail || '').trim().toLowerCase() === currentEmail
      );
      if (userRemote.length === 0) return false;

      const localNotifs = storage.getUserNotifications(currentEmail);
      const notifMap = new Map<string, any>();
      localNotifs.forEach((n) => {
        if (n && n.id) notifMap.set(n.id, n);
      });

      let changed = false;
      userRemote.forEach((rn) => {
        if (!rn || !rn.id) return;
        const ln = notifMap.get(rn.id);
        if (!ln) {
          notifMap.set(rn.id, rn);
          changed = true;
        } else if (ln.read !== rn.read) {
          notifMap.set(rn.id, { ...ln, ...rn });
          changed = true;
        }
      });

      if (changed) {
        const mergedList = Array.from(notifMap.values()).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        storage.saveUserNotifications(currentEmail, mergedList);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[FirebaseLive] mergeNotificationsIntoLocalStorage error:', e);
      return false;
    }
  },

  // 3c. Record notification live in Firestore
  async recordNotificationLive(notification: any): Promise<void> {
    if (isQuotaExhausted || !notification || !notification.id) return;
    try {
      const notifDocId = notification.id.replace(/[\/\#\$\[\]]/g, '_');
      await setDoc(
        doc(db, NOTIFICATIONS_COLLECTION, notifDocId),
        {
          ...notification,
          userEmail: (notification.userEmail || '').trim().toLowerCase(),
          timestamp: typeof notification.timestamp === 'string' ? notification.timestamp : new Date(notification.timestamp).toISOString(),
          lastUpdated: Date.now(),
        },
        { merge: true }
      );
    } catch (e) {
      handleFirestoreError(e, 'recordNotificationLive');
    }
  },

  // 3d. Mark single notification as read in Firestore
  async markNotificationReadLive(notifId: string): Promise<void> {
    if (isQuotaExhausted || !notifId) return;
    try {
      const notifDocId = notifId.replace(/[\/\#\$\[\]]/g, '_');
      await setDoc(doc(db, NOTIFICATIONS_COLLECTION, notifDocId), { read: true }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, 'markNotificationReadLive');
    }
  },

  // 3e. Mark all notifications as read in Firestore
  async markAllNotificationsReadLive(userEmail: string): Promise<void> {
    if (isQuotaExhausted || !userEmail) return;
    try {
      const clean = userEmail.trim().toLowerCase();
      const q = query(collection(db, NOTIFICATIONS_COLLECTION), where('userEmail', '==', clean));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((d) => {
        batch.update(d.ref, { read: true });
      });
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, 'markAllNotificationsReadLive');
    }
  },

  // 3f. Delete notification from Firestore
  async deleteNotificationLive(notifId: string): Promise<void> {
    if (isQuotaExhausted || !notifId) return;
    try {
      const notifDocId = notifId.replace(/[\/\#\$\[\]]/g, '_');
      await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notifDocId));
    } catch (e) {
      handleFirestoreError(e, 'deleteNotificationLive');
    }
  },

  // 4. Force pull from Firestore and push missing local accounts (Full Two-Way Sync)
  async forcePullAndPushAll(): Promise<{ accountsCount: number; success: boolean }> {
    if (isPullingAndPushing) return { accountsCount: 0, success: false };
    isPullingAndPushing = true;
    try {
      if (isQuotaExhausted) {
        return { accountsCount: 0, success: false };
      }

      // 1. Fetch remote accounts
      const accountsCol = collection(db, ACCOUNTS_COLLECTION);
      const snap = await getDocs(accountsCol);
      const remoteAccounts: StoredAccount[] = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data() as StoredAccount;
        if (data && data.email) {
          remoteAccounts.push(data);
        }
      });

      // 2. Read local accounts
      let localAccounts: StoredAccount[] = [];
      try {
        const raw = localStorage.getItem('vipads_multi_users_registry');
        if (raw) localAccounts = JSON.parse(raw);
      } catch {}

      // 3. Push any local accounts not yet in Firestore (only if quota is healthy)
      if (!isQuotaExhausted) {
        for (const lAcc of localAccounts) {
          if (!lAcc || !lAcc.email) continue;
          const cleanEmail = lAcc.email.toLowerCase().trim();
          const foundRemotely = remoteAccounts.some(
            (ra) => (ra.email || '').toLowerCase().trim() === cleanEmail
          );
          if (!foundRemotely) {
            try {
              const docId = getDocIdForEmail(cleanEmail);
              await setDoc(doc(db, ACCOUNTS_COLLECTION, docId), lAcc, { merge: true });
              remoteAccounts.push(lAcc);
            } catch (err) {
              handleFirestoreError(err, 'push missing local account');
            }
          }
        }
      }

      // 4. Merge all into local storage
      firebaseSync.mergeAccountsIntoLocalStorage(remoteAccounts);

      return { accountsCount: remoteAccounts.length, success: true };
    } catch (e) {
      handleFirestoreError(e, 'forcePullAndPushAll');
      return { accountsCount: 0, success: false };
    } finally {
      isPullingAndPushing = false;
    }
  },

  // 5. Sync Local accounts to Firestore (e.g. on registration)
  async syncLocalToRemote(): Promise<void> {
    if (isPushing || isQuotaExhausted || typeof window === 'undefined') return;
    isPushing = true;
    try {
      let localAccounts: StoredAccount[] = [];
      try {
        const raw = localStorage.getItem('vipads_multi_users_registry');
        if (raw) localAccounts = JSON.parse(raw);
      } catch {}

      if (localAccounts.length === 0) return;

      for (const acc of localAccounts) {
        if (!acc || !acc.email || isQuotaExhausted) continue;
        try {
          const docId = getDocIdForEmail(acc.email);
          await setDoc(doc(db, ACCOUNTS_COLLECTION, docId), acc, { merge: true });
        } catch (err) {
          handleFirestoreError(err, 'syncLocalToRemote batch');
        }
      }
    } catch (e) {
      handleFirestoreError(e, 'syncLocalToRemote');
    } finally {
      isPushing = false;
    }
  },

  // 6. Record user registration immediately into Firestore live stream
  async recordUserRegistered(user: StoredAccount, inviter?: StoredAccount): Promise<void> {
    if (isQuotaExhausted) return;
    try {
      if (!user || !user.email) return;
      const userDocId = getDocIdForEmail(user.email);
      await setDoc(doc(db, ACCOUNTS_COLLECTION, userDocId), user, { merge: true });

      if (inviter && inviter.email && !isQuotaExhausted) {
        const inviterDocId = getDocIdForEmail(inviter.email);
        await setDoc(doc(db, ACCOUNTS_COLLECTION, inviterDocId), inviter, { merge: true });
      }
    } catch (e) {
      handleFirestoreError(e, 'recordUserRegistered');
    }
  },

  // 7. Update user balance/VIP live in Firestore
  async updateUserLive(user: Partial<StoredAccount> & { email: string }): Promise<void> {
    if (isQuotaExhausted || !user.email) return;
    try {
      const docId = getDocIdForEmail(user.email);
      await setDoc(doc(db, ACCOUNTS_COLLECTION, docId), user, { merge: true });
    } catch (e) {
      handleFirestoreError(e, 'updateUserLive');
    }
  },

  // 8. Record transaction live in Firestore
  async recordTransactionLive(tx: Transaction): Promise<void> {
    if (isQuotaExhausted || !tx || !tx.id) return;
    try {
      const txDocId = tx.id.replace(/[\/\#\$\[\]]/g, '_');
      await setDoc(doc(db, TRANSACTIONS_COLLECTION, txDocId), tx, { merge: true });
    } catch (e) {
      handleFirestoreError(e, 'recordTransactionLive');
    }
  },

  // 9. Broadcast local state to Firestore legacy doc
  async pushStateToFirebase(customAccounts?: StoredAccount[], customTxs?: Transaction[]): Promise<boolean> {
    if (isQuotaExhausted) return false;
    try {
      let accountsToPush = customAccounts;
      if (!accountsToPush) {
        const raw = localStorage.getItem('vipads_multi_users_registry');
        accountsToPush = raw ? JSON.parse(raw) : [];
      }

      let txsToPush = customTxs;
      if (!txsToPush) {
        const raw = localStorage.getItem('vipads_global_transactions');
        txsToPush = raw ? JSON.parse(raw) : [];
      }

      const stateDocRef = doc(db, NETWORK_DOC, GLOBAL_DOC_ID);
      await setDoc(
        stateDocRef,
        {
          accounts: accountsToPush,
          transactions: txsToPush,
          lastUpdated: Date.now(),
        },
        { merge: true }
      );
      return true;
    } catch (e) {
      handleFirestoreError(e, 'pushStateToFirebase');
      return false;
    }
  },

  // 10. Real-time Ad Tracking: Automatically credits 0.01$ to inviter's pending_commissions in Firestore & Server
  async trackAdCommissionLive(subUserEmail: string): Promise<boolean> {
    const cleanEmail = (subUserEmail || '').toLowerCase().trim();
    if (!cleanEmail) return false;

    const subUserLocal = storage.getUserByEmail(cleanEmail);
    const localRef = (subUserLocal?.referredBy || '').trim();

    // 1. Notify Express Backend to update server database immediately
    try {
      fetch('/api/network/task-ad-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: cleanEmail, referrerCode: localRef }),
      }).catch(() => {});
    } catch {}

    if (isQuotaExhausted) return false;

    try {
      // Find sub-user to determine inviter
      let subUserDoc: StoredAccount | null = null;
      try {
        const subSnap = await getDoc(doc(db, ACCOUNTS_COLLECTION, getDocIdForEmail(cleanEmail)));
        if (subSnap.exists()) {
          subUserDoc = subSnap.data() as StoredAccount;
        }
      } catch (err) {
        handleFirestoreError(err, 'trackAdCommissionLive get subUser');
      }

      const referredBy = subUserDoc?.referredBy || storage.getUserByEmail(cleanEmail)?.referredBy;
      if (!referredBy) return false;

      const cleanRef = referredBy.trim().toUpperCase();

      // Resolve inviter doc ID
      let inviterDocId: string | null = null;
      if (cleanRef === '885101') {
        inviterDocId = getDocIdForEmail('free@gmail.com');
      } else {
        const localUser = storage.getAllUsers().find(
          (u) =>
            (u.referralCode && u.referralCode.trim().toUpperCase() === cleanRef) ||
            (u.email && u.email.trim().toUpperCase() === cleanRef) ||
            (u.email && u.email.split('@')[0].trim().toUpperCase() === cleanRef)
        );
        if (localUser && localUser.email) {
          inviterDocId = getDocIdForEmail(localUser.email);
        } else {
          try {
            const q = query(
              collection(db, ACCOUNTS_COLLECTION),
              where('referralCode', '==', cleanRef),
              limit(1)
            );
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
              inviterDocId = querySnap.docs[0].id;
            }
          } catch (err) {
            handleFirestoreError(err, 'trackAdCommissionLive query inviter');
          }
        }
      }

      if (!inviterDocId) return false;

      const inviterDocRef = doc(db, ACCOUNTS_COLLECTION, inviterDocId);

      // Execute atomic transaction to prevent race conditions on concurrent ad watches
      await runTransaction(db, async (transaction) => {
        const inviterSnap = await transaction.get(inviterDocRef);
        if (!inviterSnap.exists()) return;
        const data = inviterSnap.data() || {};
        const curPending = Number((data.pending_commissions ?? data.pendingReferralRewardsUSDT ?? 0).toFixed(2));
        const newPending = Number((curPending + 0.01).toFixed(2));
        transaction.update(inviterDocRef, {
          pending_commissions: newPending,
          pendingReferralRewardsUSDT: newPending,
          lastModified: Date.now(),
        });
      });

      console.log(`[FirebaseLive] Credited 0.01$ commission to inviter doc ${inviterDocId}`);
      return true;
    } catch (e) {
      handleFirestoreError(e, 'trackAdCommissionLive transaction');
      return false;
    }
  },

  // 11. Atomic Firestore Transaction to Claim Pending Commissions into totalBalanceUSDT
  async claimCommissionsTransaction(email: string): Promise<{ success: boolean; claimedAmount: number; newBalance: number }> {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) return { success: false, claimedAmount: 0, newBalance: 0 };

    // Fallback if quota exhausted
    if (isQuotaExhausted) {
      const localRes = storage.claimReferralRewards(cleanEmail);
      try {
        fetch('/api/network/claim-commissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        }).catch(() => {});
      } catch {}
      return localRes;
    }

    try {
      const userDocId = getDocIdForEmail(cleanEmail);
      const userDocRef = doc(db, ACCOUNTS_COLLECTION, userDocId);

      const result = await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) {
          throw new Error('User document not found in Firestore');
        }

        const data = userDoc.data() || {};
        const pending = Number((data.pending_commissions ?? data.pendingReferralRewardsUSDT ?? 0).toFixed(2));
        if (pending <= 0) {
          return {
            success: false,
            claimedAmount: 0,
            newBalance: Number(data.totalBalanceUSDT || 0),
          };
        }

        const curBal = Number((data.totalBalanceUSDT || 0).toFixed(2));
        const curRefEarn = Number((data.referralEarningsUSDT || 0).toFixed(2));
        const newBal = Number((curBal + pending).toFixed(2));
        const newRefEarn = Number((curRefEarn + pending).toFixed(2));

        transaction.update(userDocRef, {
          totalBalanceUSDT: newBal,
          referralEarningsUSDT: newRefEarn,
          pending_commissions: 0,
          pendingReferralRewardsUSDT: 0,
          lastModified: Date.now(),
        });

        const txId = `tx-claim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const txDocRef = doc(db, TRANSACTIONS_COLLECTION, txId);
        const newTx: Transaction = {
          id: txId,
          type: 'referral_commission',
          amountUSDT: pending,
          status: 'completed',
          description: `حصد وتجميع عمولات الإعلانات المعلقة (+${pending.toFixed(2)} USDT)`,
          timestamp: new Date(),
          userEmail: cleanEmail,
        };

        transaction.set(txDocRef, newTx);

        return { success: true, claimedAmount: pending, newBalance: newBal };
      });

      // Synchronize with local state and Express server
      storage.claimReferralRewards(cleanEmail);
      try {
        fetch('/api/network/claim-commissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        }).catch(() => {});
      } catch {}

      return result;
    } catch (err) {
      console.warn('[FirebaseLive] claimCommissionsTransaction error, falling back to storage:', err);
      const fallback = storage.claimReferralRewards(cleanEmail);
      try {
        fetch('/api/network/claim-commissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        }).catch(() => {});
      } catch {}
      return fallback;
    }
  },

  // 12. Atomic Firestore Transaction to Approve Deposit, Credit Account, and Distribute Commissions
  async approveDepositAtomic(
    txId: string,
    depositorEmailOrUsername: string,
    amount: number
  ): Promise<{
    success: boolean;
    depositor?: StoredAccount;
    commissionsDistributed?: number;
    error?: string;
  }> {
    const cleanEmail = (depositorEmailOrUsername || '').toLowerCase().trim();
    const exactAmount = Number(amount.toFixed(2));
    if (!txId || exactAmount <= 0) {
      return { success: false, error: 'Invalid parameters' };
    }

    // Fallback if quota exhausted
    if (isQuotaExhausted) {
      storage.recordApprovedDeposit(cleanEmail, exactAmount, txId);
      storage.updateTransactionStatus(txId, 'completed');
      window.dispatchEvent(new CustomEvent('vipads_accounts_updated'));
      window.dispatchEvent(new CustomEvent('vipads_transactions_changed'));
      return { success: true };
    }

    try {
      const txDocId = txId.replace(/[\/\#\$\[\]]/g, '_');
      const txDocRef = doc(db, TRANSACTIONS_COLLECTION, txDocId);

      // Resolve user document reference in Firestore
      let userDocId = cleanEmail.includes('@') ? getDocIdForEmail(cleanEmail) : '';
      if (!userDocId) {
        const localU = storage.getUserByEmail(cleanEmail);
        if (localU?.email) {
          userDocId = getDocIdForEmail(localU.email);
        } else {
          userDocId = cleanEmail.replace(/[\/\#\$\[\]]/g, '_');
        }
      }
      const userDocRef = doc(db, ACCOUNTS_COLLECTION, userDocId);

      const atomicResult = await runTransaction(db, async (transaction) => {
        // 1. Check transaction if already completed
        const txSnap = await transaction.get(txDocRef);
        if (txSnap.exists()) {
          const txData = txSnap.data();
          if (txData?.status === 'completed' || txData?.status === 'approved') {
            return { success: true, alreadyApproved: true };
          }
        }

        // 2. Read or create user document
        const userSnap = await transaction.get(userDocRef);
        let updatedUser: StoredAccount;

        if (userSnap.exists()) {
          const uData = userSnap.data() as StoredAccount;
          const userProcessedTxs: string[] = Array.isArray(uData.processedDepositTxIds) ? uData.processedDepositTxIds : [];
          if (userProcessedTxs.includes(txId)) {
            return { success: true, alreadyApproved: true };
          }

          const curBal = typeof uData.totalBalanceUSDT === 'number' ? uData.totalBalanceUSDT : 0;
          const curDep = typeof uData.totalDepositedUSDT === 'number' ? uData.totalDepositedUSDT : 0;
          // STRICT RULE: Deposits go ONLY and EXCLUSIVELY to totalDepositedUSDT (for VIP plan subscriptions)
          // NEVER added to withdrawable totalBalanceUSDT
          const newBal = curBal;
          const newDep = Number((curDep + exactAmount).toFixed(2));

          updatedUser = {
            ...uData,
            totalBalanceUSDT: newBal,
            totalDepositedUSDT: newDep,
            processedDepositTxIds: [...userProcessedTxs, txId],
            lastModified: Date.now(),
          };
          transaction.set(userDocRef, updatedUser, { merge: true });
        } else {
          // Document did not exist yet in Firestore (e.g. registered in incognito mode)
          const localAcc = storage.getUserByEmail(cleanEmail);
          const baseName = cleanEmail.split('@')[0] || 'user';
          const localBal = typeof localAcc?.totalBalanceUSDT === 'number' ? localAcc.totalBalanceUSDT : 0;
          const localDep = typeof localAcc?.totalDepositedUSDT === 'number' ? localAcc.totalDepositedUSDT : 0;
          updatedUser = {
            id: localAcc?.id || `USR-${Date.now().toString().slice(-6)}`,
            email: localAcc?.email || (cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@gmail.com`),
            username: localAcc?.username || baseName,
            walletAddress: localAcc?.walletAddress || '',
            vipLevel: localAcc?.vipLevel || 0,
            totalBalanceUSDT: localBal,
            totalDepositedUSDT: Number((localDep + exactAmount).toFixed(2)),
            taskEarningsToday: 0,
            totalWithdrawnUSDT: 0,
            tasksCompletedToday: 0,
            referralCode: localAcc?.referralCode || `${Math.floor(100000 + Math.random() * 900000)}`,
            referredBy: localAcc?.referredBy || '',
            referralCount: 0,
            referralEarningsUSDT: 0,
            pending_commissions: 0,
            pendingReferralRewardsUSDT: 0,
            joinedDate: localAcc?.joinedDate || new Date().toISOString().split('T')[0],
            processedDepositTxIds: [txId],
            lastModified: Date.now(),
          };
          transaction.set(userDocRef, updatedUser, { merge: true });
        }

        // 3. Mark transaction as completed
        if (txSnap.exists()) {
          transaction.update(txDocRef, {
            status: 'completed',
            amountUSDT: exactAmount,
            approvedAt: Date.now(),
            userEmail: updatedUser.email,
          });
        } else {
          transaction.set(txDocRef, {
            id: txId,
            type: 'deposit',
            amountUSDT: exactAmount,
            status: 'completed',
            description: `USDT Deposit (${exactAmount.toFixed(2)} USDT) [تم القبول بنجاح]`,
            timestamp: new Date().toISOString(),
            userEmail: updatedUser.email,
            approvedAt: Date.now(),
          });
        }

        // 4. Distribute 3-Tier Referral Commissions inside the SAME atomic transaction
        let totalDistributed = 0;
        const referredByCode = (updatedUser.referredBy || '').trim().toUpperCase();

        if (referredByCode) {
          // Find Level 1 Sponsor
          let l1DocId = '';
          if (referredByCode === '885101') {
            l1DocId = getDocIdForEmail('free@gmail.com');
          } else {
            const localL1 = storage.getAllUsers().find(
              (u) =>
                (u.referralCode && u.referralCode.trim().toUpperCase() === referredByCode) ||
                (u.email && u.email.toLowerCase() === referredByCode.toLowerCase())
            );
            if (localL1?.email) {
              l1DocId = getDocIdForEmail(localL1.email);
            }
          }

          if (l1DocId) {
            const l1Ref = doc(db, ACCOUNTS_COLLECTION, l1DocId);
            const l1Snap = await transaction.get(l1Ref);
            if (l1Snap.exists()) {
              const l1Data = l1Snap.data() as StoredAccount;
              const comm1 = Number((exactAmount * 0.10).toFixed(2));
              if (comm1 > 0) {
                totalDistributed += comm1;
                const newBal = Number(((l1Data.totalBalanceUSDT || 0) + comm1).toFixed(2));
                const newEarn = Number(((l1Data.referralEarningsUSDT || 0) + comm1).toFixed(2));
                transaction.update(l1Ref, {
                  totalBalanceUSDT: newBal,
                  referralEarningsUSDT: newEarn,
                  lastModified: Date.now(),
                });

                // Create L1 Transaction Doc
                const l1TxId = `tx-comm1-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
                const l1TxRef = doc(db, TRANSACTIONS_COLLECTION, l1TxId);
                transaction.set(l1TxRef, {
                  id: l1TxId,
                  type: 'referral_commission',
                  amountUSDT: comm1,
                  status: 'completed',
                  description: `عمولة إيداع فريق مستوى 1 (10%) من (${updatedUser.email})`,
                  timestamp: new Date().toISOString(),
                  userEmail: l1Data.email,
                });

                // Level 2 Sponsor Check
                const l2Code = (l1Data.referredBy || '').trim().toUpperCase();
                if (l2Code) {
                  let l2DocId = '';
                  if (l2Code === '885101') {
                    l2DocId = getDocIdForEmail('free@gmail.com');
                  } else {
                    const localL2 = storage.getAllUsers().find(
                      (u) =>
                        (u.referralCode && u.referralCode.trim().toUpperCase() === l2Code) ||
                        (u.email && u.email.toLowerCase() === l2Code.toLowerCase())
                    );
                    if (localL2?.email) l2DocId = getDocIdForEmail(localL2.email);
                  }

                  if (l2DocId && l2DocId !== l1DocId) {
                    const l2Ref = doc(db, ACCOUNTS_COLLECTION, l2DocId);
                    const l2Snap = await transaction.get(l2Ref);
                    if (l2Snap.exists()) {
                      const l2Data = l2Snap.data() as StoredAccount;
                      const comm2 = Number((exactAmount * 0.05).toFixed(2));
                      if (comm2 > 0) {
                        totalDistributed += comm2;
                        const newL2Bal = Number(((l2Data.totalBalanceUSDT || 0) + comm2).toFixed(2));
                        const newL2Earn = Number(((l2Data.referralEarningsUSDT || 0) + comm2).toFixed(2));
                        transaction.update(l2Ref, {
                          totalBalanceUSDT: newL2Bal,
                          referralEarningsUSDT: newL2Earn,
                          lastModified: Date.now(),
                        });

                        const l2TxId = `tx-comm2-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
                        const l2TxRef = doc(db, TRANSACTIONS_COLLECTION, l2TxId);
                        transaction.set(l2TxRef, {
                          id: l2TxId,
                          type: 'referral_commission',
                          amountUSDT: comm2,
                          status: 'completed',
                          description: `عمولة إيداع فريق مستوى 2 (5%) من (${updatedUser.email})`,
                          timestamp: new Date().toISOString(),
                          userEmail: l2Data.email,
                        });

                        // Level 3 Sponsor Check
                        const l3Code = (l2Data.referredBy || '').trim().toUpperCase();
                        if (l3Code) {
                          let l3DocId = '';
                          if (l3Code === '885101') {
                            l3DocId = getDocIdForEmail('free@gmail.com');
                          } else {
                            const localL3 = storage.getAllUsers().find(
                              (u) =>
                                (u.referralCode && u.referralCode.trim().toUpperCase() === l3Code) ||
                                (u.email && u.email.toLowerCase() === l3Code.toLowerCase())
                            );
                            if (localL3?.email) l3DocId = getDocIdForEmail(localL3.email);
                          }

                          if (l3DocId && l3DocId !== l2DocId && l3DocId !== l1DocId) {
                            const l3Ref = doc(db, ACCOUNTS_COLLECTION, l3DocId);
                            const l3Snap = await transaction.get(l3Ref);
                            if (l3Snap.exists()) {
                              const l3Data = l3Snap.data() as StoredAccount;
                              const comm3 = Number((exactAmount * 0.02).toFixed(2));
                              if (comm3 > 0) {
                                totalDistributed += comm3;
                                const newL3Bal = Number(((l3Data.totalBalanceUSDT || 0) + comm3).toFixed(2));
                                const newL3Earn = Number(((l3Data.referralEarningsUSDT || 0) + comm3).toFixed(2));
                                transaction.update(l3Ref, {
                                  totalBalanceUSDT: newL3Bal,
                                  referralEarningsUSDT: newL3Earn,
                                  lastModified: Date.now(),
                                });

                                const l3TxId = `tx-comm3-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
                                const l3TxRef = doc(db, TRANSACTIONS_COLLECTION, l3TxId);
                                transaction.set(l3TxRef, {
                                  id: l3TxId,
                                  type: 'referral_commission',
                                  amountUSDT: comm3,
                                  status: 'completed',
                                  description: `عمولة إيداع فريق مستوى 3 (2%) من (${updatedUser.email})`,
                                  timestamp: new Date().toISOString(),
                                  userEmail: l3Data.email,
                                });
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }

        return {
          success: true,
          depositor: updatedUser,
          commissionsDistributed: totalDistributed,
        };
      });

      // Synchronize with local storage & dispatch events
      storage.recordApprovedDeposit(cleanEmail, exactAmount);
      storage.updateTransactionStatus(txId, 'completed');
      window.dispatchEvent(new CustomEvent('vipads_accounts_updated'));
      window.dispatchEvent(new CustomEvent('vipads_transactions_changed'));

      return atomicResult;
    } catch (err) {
      handleFirestoreError(err, 'approveDepositAtomic');
      storage.recordApprovedDeposit(cleanEmail, exactAmount);
      storage.updateTransactionStatus(txId, 'completed');
      window.dispatchEvent(new CustomEvent('vipads_accounts_updated'));
      window.dispatchEvent(new CustomEvent('vipads_transactions_changed'));
      return { success: true };
    }
  },
};
