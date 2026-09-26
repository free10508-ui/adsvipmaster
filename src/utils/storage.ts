import { UserProfile, Transaction, VideoTask, CompletedTaskLog, ReferredMember, ReferralMilestone, SystemNotification } from '../types';
import { INITIAL_VIDEO_TASKS } from '../data/initialData';
import { networkSync } from './networkSync';
import { firebaseSync } from './firebaseSync';
import { purgeReferralQueriesFromUrl, hasReferralParamInUrl } from './urlHelper';

export interface StoredAccount {
  id: string;
  email: string;
  username: string;
  password?: string;
  walletAddress: string;
  vipLevel: number;
  totalBalanceUSDT: number;
  totalDepositedUSDT?: number;
  taskEarningsToday: number;
  totalWithdrawnUSDT: number;
  tasksCompletedToday: number;
  completedTaskDays?: number;
  withdrawalsCount?: number;
  lastCompletedTaskDayDate?: string;
  lastTasksResetTimestamp?: number;
  lastTasksResetDate?: string;
  referralCode: string;
  referredBy?: string; // Referral code of inviter
  referralCount: number;
  referralEarningsUSDT: number;
  pending_commissions?: number;
  pendingReferralRewardsUSDT?: number;
  tier1TaskCommissionUSDT?: number;
  tier2TaskCommissionUSDT?: number;
  tier3TaskCommissionUSDT?: number;
  joinedDate: string;
  vipActivatedAt?: number;
  vipExpiresAt?: number;
  tasksState?: { id: string; completedToday: boolean }[];
  transactions?: Transaction[];
  processedDepositTxIds?: string[];
  lastModified?: number;
}

const STORAGE_KEYS = {
  USERS_REGISTRY: 'vipads_multi_users_registry',
  CURRENT_USER_EMAIL: 'vipads_current_user_email',
  GLOBAL_TRANSACTIONS: 'vipads_global_transactions',
  IS_LOGGED_IN: 'vipads_is_logged_in',
};

// Immediate Cloud & Live Stream Synchronization Helper
function syncAccountLiveToCloud(user: StoredAccount): void {
  if (!user || !user.email) return;
  const safeUser = {
    ...user,
    lastModified: user.lastModified || Date.now(),
  };
  try {
    firebaseSync.updateUserLive(safeUser).catch(() => {});
  } catch {}
  try {
    networkSync.syncNow().catch(() => {});
  } catch {}
}

// Initial Clean Seed Accounts with absolute zero balances and zero mock transactions (Admin Only)
const DEFAULT_ACCOUNTS: StoredAccount[] = [
  {
    id: 'ADMIN-001',
    email: 'free@gmail.com',
    username: 'free@gmail.com',
    password: '000000',
    walletAddress: '',
    vipLevel: 0,
    totalBalanceUSDT: 0.00,
    totalDepositedUSDT: 0.00,
    taskEarningsToday: 0.00,
    totalWithdrawnUSDT: 0.00,
    tasksCompletedToday: 0,
    referralCode: '885101',
    referralCount: 0,
    referralEarningsUSDT: 0.00,
    pendingReferralRewardsUSDT: 0.00,
    tier1TaskCommissionUSDT: 0.00,
    tier2TaskCommissionUSDT: 0.00,
    tier3TaskCommissionUSDT: 0.00,
    joinedDate: '2026-08-28',
  }
];

const DEFAULT_TRANSACTIONS: Transaction[] = [];

export const ADMIN_EMAIL = 'free@gmail.com';

// Generates a guaranteed unique 6-digit numeric referral code
export function generateUnique6DigitReferralCode(existingUsers: StoredAccount[] = []): string {
  const existingCodes = new Set(existingUsers.map(u => (u.referralCode || '').trim()));
  let code = '';
  let attempts = 0;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    attempts++;
  } while (existingCodes.has(code) && attempts < 10000);
  return code;
}

// Perpetual State Persistence Guard: Checks, locks in, and protects existing balances, tasks, and VIP levels across code updates
(function runPerpetualStatePersistenceGuard() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;

    // --- PERPETUAL PRESERVATION SHIELD ---
    // Strictly forbids any automated account wiping of other registered users.
    // 1. One-time clean reset for test admin account free@gmail.com if requested
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('vipads_admin_reset_applied_v2') !== 'true') {
        localStorage.setItem('vipads_admin_reset_applied_v2', 'true');
        localStorage.removeItem('vipads_user_tasks_free@gmail.com');
        localStorage.removeItem('vipads_task_history_free@gmail.com');
        localStorage.removeItem('vipads_notifications_free@gmail.com');
        localStorage.setItem('vipads_lifetime_balance_free@gmail.com', JSON.stringify({
          email: 'free@gmail.com',
          totalBalanceUSDT: 0.00,
          totalDepositedUSDT: 0.00,
          vipLevel: 0,
          tasksCompletedToday: 0,
          lastUpdated: Date.now()
        }));
      }
    } catch {}

    // 1. Scan for any previously accumulated balances or tasks for the primary admin free@gmail.com
    let preservedBalance = 0.00;
    let preservedDeposit = 0.00;
    let preservedVipLevel = 0;
    let preservedTasksCompleted = 0;
    let preservedTaskEarnings = 0.00;

    // A) Check per-email lifetime balance key
    try {
      const rawLifetime = localStorage.getItem('vipads_lifetime_balance_free@gmail.com');
      if (rawLifetime) {
        const p = JSON.parse(rawLifetime);
        if (typeof p.totalBalanceUSDT === 'number' && !isNaN(p.totalBalanceUSDT)) {
          preservedBalance = p.totalBalanceUSDT;
        }
        if (typeof p.totalDepositedUSDT === 'number' && !isNaN(p.totalDepositedUSDT)) {
          preservedDeposit = p.totalDepositedUSDT;
        }
        if (typeof p.vipLevel === 'number') {
          preservedVipLevel = p.vipLevel;
        }
        if (typeof p.tasksCompletedToday === 'number') {
          preservedTasksCompleted = p.tasksCompletedToday;
        }
      }
    } catch {}

    // B) Check existing users registry in localStorage (Universal Hydration Shield)
    let usersList: StoredAccount[] = [];
    try {
      const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS_REGISTRY);
      if (rawUsers) {
        const parsed = JSON.parse(rawUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          usersList = parsed.filter((u: any) => {
            const email = (u.email || '').toLowerCase().trim();
            // Purge only legacy banned mock accounts
            return email !== 'gamaa1943@gmail.com' && email !== 'yzyzyz0111@gmail.com';
          });

          // Universal Hydration Shield: Preserve and protect all existing users' balances, VIP & referrals
          usersList.forEach(u => {
            if (!u || !u.email || typeof u.email !== 'string') return;
            const userEmailKey = `vipads_lifetime_balance_${(u.email || '').toLowerCase().trim()}`;
            try {
              const uLifetimeRaw = localStorage.getItem(userEmailKey);
              if (uLifetimeRaw) {
                const uL = JSON.parse(uLifetimeRaw);
                if (u.totalBalanceUSDT === undefined || isNaN(u.totalBalanceUSDT)) {
                  u.totalBalanceUSDT = typeof uL.totalBalanceUSDT === 'number' ? uL.totalBalanceUSDT : 0;
                }
                if (u.totalDepositedUSDT === undefined || isNaN(u.totalDepositedUSDT)) {
                  u.totalDepositedUSDT = typeof uL.totalDepositedUSDT === 'number' ? uL.totalDepositedUSDT : 0;
                }
                if (typeof uL.vipLevel === 'number' && uL.vipLevel > (u.vipLevel || 0)) {
                  u.vipLevel = uL.vipLevel;
                }
                if (typeof uL.tasksCompletedToday === 'number' && uL.tasksCompletedToday > (u.tasksCompletedToday || 0)) {
                  u.tasksCompletedToday = uL.tasksCompletedToday;
                }
                if (typeof uL.referralCount === 'number' && uL.referralCount > (u.referralCount || 0)) {
                  u.referralCount = uL.referralCount;
                }
                if (typeof uL.pendingReferralRewardsUSDT === 'number') {
                  u.pendingReferralRewardsUSDT = Number(uL.pendingReferralRewardsUSDT.toFixed(2));
                }
                if (typeof uL.referralEarningsUSDT === 'number') {
                  u.referralEarningsUSDT = Math.max(u.referralEarningsUSDT || 0, Number(uL.referralEarningsUSDT.toFixed(2)));
                }
              }
            } catch {}
          });

          const adminFound = usersList.find(u => (u.email || '').toLowerCase().trim() === 'free@gmail.com');
          const isExplicitAdminReset = typeof localStorage !== 'undefined' && localStorage.getItem('vipads_admin_reset_applied_v2') === 'true';
          if (adminFound && !isExplicitAdminReset) {
            if (typeof adminFound.totalBalanceUSDT === 'number' && !isNaN(adminFound.totalBalanceUSDT)) {
              preservedBalance = adminFound.totalBalanceUSDT;
            }
            if (typeof adminFound.totalDepositedUSDT === 'number' && !isNaN(adminFound.totalDepositedUSDT)) {
              preservedDeposit = adminFound.totalDepositedUSDT;
            }
            if (typeof adminFound.vipLevel === 'number' && adminFound.vipLevel > 0) {
              preservedVipLevel = Math.max(preservedVipLevel, adminFound.vipLevel);
            }
            if (typeof adminFound.tasksCompletedToday === 'number' && adminFound.tasksCompletedToday > 0) {
              preservedTasksCompleted = Math.max(preservedTasksCompleted, adminFound.tasksCompletedToday);
            }
            if (typeof adminFound.taskEarningsToday === 'number' && adminFound.taskEarningsToday > 0) {
              preservedTaskEarnings = Math.max(preservedTaskEarnings, adminFound.taskEarningsToday);
            }
          } else if (adminFound && isExplicitAdminReset) {
            adminFound.vipLevel = 0;
            adminFound.totalBalanceUSDT = 0.00;
            adminFound.totalDepositedUSDT = 0.00;
            adminFound.tasksCompletedToday = 0;
            adminFound.taskEarningsToday = 0.00;
            adminFound.completedTaskDays = 0;
            adminFound.withdrawalsCount = 0;
            adminFound.totalWithdrawnUSDT = 0.00;
            preservedBalance = 0.00;
            preservedDeposit = 0.00;
            preservedVipLevel = 0;
            preservedTasksCompleted = 0;
            preservedTaskEarnings = 0.00;
          }
        }
      }
    } catch {}

    // C) Check dedicated task storage for completed tasks
    try {
      const rawTasks = localStorage.getItem('vipads_user_tasks_free@gmail.com');
      if (rawTasks) {
        const pTasks = JSON.parse(rawTasks);
        if (Array.isArray(pTasks)) {
          const completedCount = pTasks.filter((t: any) => t.completedToday).length;
          preservedTasksCompleted = Math.max(preservedTasksCompleted, completedCount);
        }
      }
    } catch {}

    // 2. Ensure admin account free@gmail.com exists with PRESERVED and LOCKED-IN stats (never downgraded to zero)
    let adminAccount = usersList.find(u => (u.email || '').toLowerCase().trim() === 'free@gmail.com');
    if (adminAccount) {
      adminAccount.password = '000000';
      const isExplicitReset = typeof localStorage !== 'undefined' && localStorage.getItem('vipads_admin_reset_applied_v2') === 'true';
      if (isExplicitReset) {
        adminAccount.totalBalanceUSDT = 0.00;
        adminAccount.totalDepositedUSDT = 0.00;
        adminAccount.vipLevel = 0;
        adminAccount.tasksCompletedToday = 0;
        adminAccount.taskEarningsToday = 0.00;
        adminAccount.completedTaskDays = 0;
        adminAccount.withdrawalsCount = 0;
        adminAccount.totalWithdrawnUSDT = 0.00;
        adminAccount.pendingReferralRewardsUSDT = 0.00;
        delete (adminAccount as any).vipActivatedAt;
        delete (adminAccount as any).vipExpiresAt;
      } else {
        if (adminAccount.totalBalanceUSDT === undefined || isNaN(adminAccount.totalBalanceUSDT)) {
          adminAccount.totalBalanceUSDT = preservedBalance;
        }
        if (adminAccount.totalDepositedUSDT === undefined || isNaN(adminAccount.totalDepositedUSDT)) {
          adminAccount.totalDepositedUSDT = preservedDeposit;
        }
        adminAccount.vipLevel = Math.max(adminAccount.vipLevel || 0, preservedVipLevel);
        adminAccount.tasksCompletedToday = Math.max(adminAccount.tasksCompletedToday || 0, preservedTasksCompleted);
        adminAccount.taskEarningsToday = Math.max(adminAccount.taskEarningsToday || 0, preservedTaskEarnings);
      }
      adminAccount.referralCode = '885101';
      if (adminAccount.walletAddress === 'TYqQwVENsSVVeSTNks31SyxStHV8x5HXSZ') {
        adminAccount.walletAddress = '';
      }
      const isClaimedTest = typeof localStorage !== 'undefined' && localStorage.getItem('vipads_admin_claimed_test_referral') === 'true';
      if (!isClaimedTest && (!adminAccount.pendingReferralRewardsUSDT || adminAccount.pendingReferralRewardsUSDT <= 0)) {
        adminAccount.pendingReferralRewardsUSDT = 0.00;
      }
    } else {
      adminAccount = {
        id: 'ADMIN-001',
        email: 'free@gmail.com',
        username: 'free@gmail.com',
        password: '000000',
        walletAddress: '',
        vipLevel: preservedVipLevel,
        totalBalanceUSDT: preservedBalance,
        totalDepositedUSDT: preservedDeposit,
        taskEarningsToday: preservedTaskEarnings,
        totalWithdrawnUSDT: 0.00,
        tasksCompletedToday: preservedTasksCompleted,
        referralCode: '885101',
        referralCount: 0,
        referralEarningsUSDT: 0.00,
        pendingReferralRewardsUSDT: 0.00,
        tier1TaskCommissionUSDT: 0.00,
        tier2TaskCommissionUSDT: 0.00,
        tier3TaskCommissionUSDT: 0.00,
        joinedDate: '2026-08-28',
      };
      usersList.unshift(adminAccount);
    }

    // Persist clean registry preserving all real user data
    localStorage.setItem(STORAGE_KEYS.USERS_REGISTRY, JSON.stringify(usersList));

    // Only set default active user if an explicit session exists, preventing auto-login for fresh visitors
    const existingIsLoggedIn = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
    const existingActiveEmail = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_EMAIL);

    if (existingIsLoggedIn === 'true' && existingActiveEmail) {
      // User is explicitly logged in, preserve their session and identity
    } else if (existingIsLoggedIn === null) {
      // Clean new visitor without session: force login screen, do not auto-login to admin
      localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'false');
    }

    // Lock in the lifetime balances so they are NEVER zeroed out on code reload
    localStorage.setItem('vipads_lifetime_balance_free@gmail.com', JSON.stringify({
      email: 'free@gmail.com',
      totalBalanceUSDT: Number(preservedBalance.toFixed(2)),
      totalDepositedUSDT: Number(preservedDeposit.toFixed(2)),
      vipLevel: preservedVipLevel,
      tasksCompletedToday: preservedTasksCompleted,
      lastUpdated: Date.now()
    }));

    // Purge legacy mock notifications
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('vipads_notifications_')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const clean = parsed.filter((n: any) => 
                !n.id?.startsWith('notif-seed-') && 
                !(n.amount === 50 && n.type === 'deposit_approved')
              );
              localStorage.setItem(key, JSON.stringify(clean));
            }
          }
        } catch (e) {
          console.warn(e);
        }
      }
    }
  } catch (e) {
    console.warn('Storage state persistence guard error:', e);
  }
})();

// Cooldown cache to avoid hammering reset calculations repeatedly
const lastResetCheckMap = new Map<string, number>();

// High-performance in-memory cache for instant 0ms access across tab navigations
let inMemoryUsersCache: StoredAccount[] | null = null;
let inMemoryTransactionsCache: Transaction[] | null = null;

export const storage = {
  // Direct Cache Invalidation & Update Methods for Instant UI
  invalidateUsersCache(updatedUsers?: StoredAccount[]): void {
    if (updatedUsers && Array.isArray(updatedUsers)) {
      inMemoryUsersCache = [...updatedUsers];
    } else {
      inMemoryUsersCache = null;
    }
  },

  invalidateTransactionsCache(updatedTxs?: Transaction[]): void {
    if (updatedTxs && Array.isArray(updatedTxs)) {
      inMemoryTransactionsCache = [...updatedTxs];
    } else {
      inMemoryTransactionsCache = null;
    }
  },

  isAdminEmail(email?: string): boolean {
    if (!email) return false;
    const clean = (email || '').trim().toLowerCase();
    return clean === 'free@gmail.com' || clean === 'free' || clean === 'free10508@gmail.com' || clean === 'free10508';
  },
  // --- LIFETIME BALANCES TIED STRICTLY TO GMAIL ---
  syncEmailLifetimeBalances(
    email: string, 
    totalBalanceUSDT: number, 
    totalDepositedUSDT: number, 
    vipLevel?: number,
    tasksCompletedToday?: number,
    pendingReferralRewardsUSDT?: number,
    referralEarningsUSDT?: number,
    completedTaskDays?: number,
    withdrawalsCount?: number,
    totalWithdrawnUSDT?: number
  ): void {
    if (!email) return;
    const cleanEmail = (email || '').trim().toLowerCase();
    try {
      const key = `vipads_lifetime_balance_${cleanEmail}`;
      const existingRaw = localStorage.getItem(key);
      let existingData: any = null;
      if (existingRaw) {
        try { existingData = JSON.parse(existingRaw); } catch {}
      }

      // Safe values: preserve explicit numeric inputs (including 0.00 after spending or withdrawing)
      let safeBalance = (typeof totalBalanceUSDT === 'number' && !isNaN(totalBalanceUSDT))
        ? Number(Math.max(0, totalBalanceUSDT).toFixed(2))
        : (existingData?.totalBalanceUSDT || 0);

      let safeDeposit = (typeof totalDepositedUSDT === 'number' && !isNaN(totalDepositedUSDT))
        ? Number(Math.max(0, totalDepositedUSDT).toFixed(2))
        : (existingData?.totalDepositedUSDT || 0);

      let safeVip = (vipLevel !== undefined && !isNaN(vipLevel))
        ? vipLevel
        : (existingData?.vipLevel || 0);

      let safeTasks = (tasksCompletedToday !== undefined && !isNaN(tasksCompletedToday))
        ? Math.floor(Math.max(0, Number(tasksCompletedToday)))
        : Math.floor(existingData?.tasksCompletedToday || 0);

      let safePending = (pendingReferralRewardsUSDT !== undefined && !isNaN(pendingReferralRewardsUSDT))
        ? Number(Math.max(0, pendingReferralRewardsUSDT).toFixed(2))
        : (typeof existingData?.pendingReferralRewardsUSDT === 'number' ? existingData.pendingReferralRewardsUSDT : 0);

      let safeEarnings = (referralEarningsUSDT !== undefined && !isNaN(referralEarningsUSDT))
        ? Number(Math.max(0, referralEarningsUSDT).toFixed(2))
        : (typeof existingData?.referralEarningsUSDT === 'number' ? existingData.referralEarningsUSDT : 0);

      let safeCompletedDays = (completedTaskDays !== undefined && !isNaN(completedTaskDays))
        ? completedTaskDays
        : (existingData?.completedTaskDays !== undefined ? existingData.completedTaskDays : 0);

      let safeWithdrawalsCount = (withdrawalsCount !== undefined && !isNaN(withdrawalsCount))
        ? withdrawalsCount
        : (existingData?.withdrawalsCount !== undefined ? existingData.withdrawalsCount : 0);

      let safeWithdrawn = (totalWithdrawnUSDT !== undefined && !isNaN(totalWithdrawnUSDT))
        ? Number(Math.max(0, totalWithdrawnUSDT).toFixed(2))
        : (typeof existingData?.totalWithdrawnUSDT === 'number' ? existingData.totalWithdrawnUSDT : 0);

      const payload = {
        email: cleanEmail,
        totalBalanceUSDT: Number(Math.max(0, safeBalance).toFixed(2)),
        totalDepositedUSDT: Number(Math.max(0, safeDeposit).toFixed(2)),
        vipLevel: safeVip,
        tasksCompletedToday: Math.max(0, safeTasks),
        pendingReferralRewardsUSDT: safePending,
        referralEarningsUSDT: safeEarnings,
        completedTaskDays: safeCompletedDays,
        withdrawalsCount: safeWithdrawalsCount,
        totalWithdrawnUSDT: safeWithdrawn,
        lastUpdated: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to sync lifetime balance for email:', e);
    }
  },

  getEmailLifetimeBalances(email: string): { 
    totalBalanceUSDT?: number; 
    totalDepositedUSDT?: number; 
    vipLevel?: number; 
    tasksCompletedToday?: number;
    pendingReferralRewardsUSDT?: number;
    referralEarningsUSDT?: number;
    completedTaskDays?: number;
    withdrawalsCount?: number;
    totalWithdrawnUSDT?: number;
  } | null {
    if (!email) return null;
    const cleanEmail = (email || '').trim().toLowerCase();
    try {
      const key = `vipads_lifetime_balance_${cleanEmail}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return null;
  },

  // --- AUTOMATIC 24-HOUR / DAILY TASK RENEWAL ---
  shouldResetDailyTasks(account: StoredAccount | null): boolean {
    if (!account) return false;
    const now = Date.now();
    const todayDateStr = new Date().toISOString().split('T')[0];
    const localDateStr = new Date().toLocaleDateString('en-CA');

    const lastResetTime = account.lastTasksResetTimestamp || 0;
    const lastResetDate = account.lastTasksResetDate || '';

    // Condition 1: 24 hours (86,400,000 ms) passed since last reset
    const twentyFourHoursPassed = lastResetTime > 0 && (now - lastResetTime) >= (24 * 60 * 60 * 1000);

    // Condition 2: Calendar date has changed and reset was not performed on this new date
    const calendarDateChanged = Boolean(lastResetDate && lastResetDate !== todayDateStr && lastResetDate !== localDateStr);

    // Condition 3: Completed tasks exist without any reset record set yet
    const hasUnrecordedOldTasks = (!lastResetTime && !lastResetDate && (account.tasksCompletedToday || 0) > 0);

    return twentyFourHoursPassed || calendarDateChanged || hasUnrecordedOldTasks;
  },

  resetDailyTasksNow(email?: string, force = false): boolean {
    const cleanEmail = (email || storage.getCurrentUserEmail() || '').trim().toLowerCase();
    if (!cleanEmail) return false;

    const now = Date.now();
    const todayDateStr = new Date().toISOString().split('T')[0];

    const users = storage.getAllUsers();
    const idx = users.findIndex(u => (u.email || '').trim().toLowerCase() === cleanEmail);
    if (idx < 0) return false;

    const account = users[idx];
    if (!force && !storage.shouldResetDailyTasks(account)) {
      return false;
    }

    lastResetCheckMap.set(cleanEmail, now);

    // Reset user daily counters
    const updatedAccount: StoredAccount = {
      ...account,
      tasksCompletedToday: 0,
      taskEarningsToday: 0,
      lastTasksResetTimestamp: now,
      lastTasksResetDate: todayDateStr,
      lastModified: now,
    };
    users[idx] = updatedAccount;
    storage.saveAllUsers(users);

    // Reset all tasks to not completed for this user
    const freshTasks = INITIAL_VIDEO_TASKS.map(t => ({ ...t, completedToday: false }));
    const taskKey = `vipads_user_tasks_${cleanEmail}`;
    try {
      localStorage.setItem(taskKey, JSON.stringify(freshTasks));
    } catch {}

    // Sync to lifetime balance key with tasksCompletedToday = 0
    storage.syncEmailLifetimeBalances(
      cleanEmail,
      updatedAccount.totalBalanceUSDT,
      updatedAccount.totalDepositedUSDT ?? 0,
      updatedAccount.vipLevel,
      0, // explicitly 0 tasks completed today
      updatedAccount.pendingReferralRewardsUSDT,
      updatedAccount.referralEarningsUSDT,
      updatedAccount.completedTaskDays,
      updatedAccount.withdrawalsCount,
      updatedAccount.totalWithdrawnUSDT
    );

    // Push reset to Firestore Database safely in background
    try {
      firebaseSync.updateUserLive({
        email: cleanEmail,
        tasksCompletedToday: 0,
        taskEarningsToday: 0,
        lastTasksResetTimestamp: now,
        lastTasksResetDate: todayDateStr,
        lastModified: now,
      }).catch(() => {});
    } catch {}

    // Push reset to Express Server in background
    try {
      fetch('/api/network/reset-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      }).catch(() => {});
    } catch {}

    // Dispatch global event for active components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vipads:daily_tasks_reset', { detail: { email: cleanEmail } }));
      window.dispatchEvent(new CustomEvent('vipads_accounts_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    return true;
  },

  checkAndResetDailyTasks(email?: string): boolean {
    const cleanEmail = (email || storage.getCurrentUserEmail() || '').trim().toLowerCase();
    if (!cleanEmail) return false;

    // Cooldown guard: prevent evaluating reset more than once every 5 seconds per account
    const now = Date.now();
    const lastCheck = lastResetCheckMap.get(cleanEmail) || 0;
    if (now - lastCheck < 5000) {
      return false;
    }

    const users = storage.getAllUsers();
    const account = users.find(u => (u.email || '').trim().toLowerCase() === cleanEmail);
    if (!account) return false;

    if (!storage.shouldResetDailyTasks(account)) {
      lastResetCheckMap.set(cleanEmail, now);
      return false;
    }

    return storage.resetDailyTasksNow(cleanEmail, true);
  },

  // --- VIDEO TASKS PERSISTENCE ---
  getUserTasks(email?: string): VideoTask[] {
    try {
      const targetEmail = (email || storage.getCurrentUserEmail() || '').trim().toLowerCase();
      if (targetEmail) {
        // Auto-check if 24 hours have passed whenever tasks are loaded
        const u = storage.getUserByEmail(targetEmail);
        if (u && storage.shouldResetDailyTasks(u)) {
          storage.resetDailyTasksNow(targetEmail, true);
          return INITIAL_VIDEO_TASKS.map(t => ({ ...t, completedToday: false }));
        }
      }
      const key = `vipads_user_tasks_${targetEmail}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with INITIAL_VIDEO_TASKS so latest Hollywood thumbnails and metadata are always loaded
          return INITIAL_VIDEO_TASKS.map((initialTask) => {
            const saved = parsed.find((p: VideoTask) => p.id === initialTask.id);
            if (saved) {
              return {
                ...initialTask,
                completedToday: saved.completedToday ?? false,
              };
            }
            return initialTask;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load user tasks from storage:', e);
    }
    return INITIAL_VIDEO_TASKS.map(t => ({ ...t, completedToday: false }));
  },

  saveUserTasks(email: string, tasks: VideoTask[]): void {
    try {
      if (!email) return;
      const targetEmail = (email || '').trim().toLowerCase();
      const key = `vipads_user_tasks_${targetEmail}`;
      localStorage.setItem(key, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save user tasks to storage:', e);
    }
  },

  // --- TASK COMPLETION HISTORY LOGS ---
  getCompletedTaskLogs(email?: string): CompletedTaskLog[] {
    try {
      const targetEmail = (email || storage.getCurrentUserEmail() || '').trim().toLowerCase();
      const key = `vipads_task_history_${targetEmail}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }

      // If empty, generate realistic seed history for the past 7 days based on user's VIP level and transactions
      return storage.seedInitialTaskHistory(targetEmail);
    } catch (e) {
      console.warn('Failed to load task history:', e);
      return [];
    }
  },

  saveCompletedTaskLogs(email: string, logs: CompletedTaskLog[]): void {
    try {
      if (!email) return;
      const targetEmail = (email || '').trim().toLowerCase();
      const key = `vipads_task_history_${targetEmail}`;
      localStorage.setItem(key, JSON.stringify(logs));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vipads:task_history_updated'));
      }
    } catch (e) {
      console.warn('Failed to save task history:', e);
    }
  },

  addCompletedTaskLog(email: string, log: Omit<CompletedTaskLog, 'id'>): CompletedTaskLog {
    const targetEmail = (email || '').trim().toLowerCase();
    const existing = storage.getCompletedTaskLogs(targetEmail);
    const newLog: CompletedTaskLog = {
      ...log,
      id: `task-log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userEmail: targetEmail
    };
    const updated = [newLog, ...existing];
    storage.saveCompletedTaskLogs(targetEmail, updated);
    return newLog;
  },

  seedInitialTaskHistory(email: string): CompletedTaskLog[] {
    const targetEmail = (email || '').trim().toLowerCase();
    const user = storage.getUserByEmail(targetEmail);
    const vipLevel = user?.vipLevel || 1;
    
    // Determine reward per task according to VIP level: 0.09 USDT for VIP 1, 0.204 USDT for VIP 2 (2.04 USDT daily)
    const rewardPerTask = vipLevel === 1 ? 0.09 : vipLevel === 2 ? 0.204 : vipLevel === 3 ? 0.75 : 1.45;
    const tasksPerDay = 10;
    const logs: CompletedTaskLog[] = [];

    // Current tasksCompletedToday for today (day 0)
    const currentCompletedToday = user?.tasksCompletedToday || 0;
    const now = new Date();

    // Past 7 days: day 0 (today) to day 6 (6 days ago)
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const dayDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      const year = dayDate.getFullYear();
      const month = String(dayDate.getMonth() + 1).padStart(2, '0');
      const day = String(dayDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const completedCount = dayOffset === 0 
        ? Math.min(tasksPerDay, currentCompletedToday > 0 ? currentCompletedToday : (vipLevel >= 1 ? 10 : 3))
        : (vipLevel >= 1 ? Math.floor(8 + (dayOffset % 3)) : Math.floor(5 + (dayOffset % 4)));

      for (let i = 0; i < completedCount; i++) {
        const taskSample = INITIAL_VIDEO_TASKS[i % INITIAL_VIDEO_TASKS.length];
        const taskHour = 8 + Math.floor((i * 1.2));
        const taskMinute = (i * 7 + 12) % 60;
        const taskTimestamp = new Date(dayDate);
        taskTimestamp.setHours(taskHour, taskMinute, 0, 0);

        logs.push({
          id: `seed-log-${dateKey}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          taskId: taskSample.id,
          taskTitle: taskSample.title,
          sponsor: taskSample.sponsor,
          rewardUSDT: Number(rewardPerTask.toFixed(3)),
          vipLevel: vipLevel,
          completedAt: taskTimestamp.toISOString(),
          dateKey: dateKey,
          userEmail: targetEmail,
          category: taskSample.category || 'Streaming Ads'
        });
      }
    }

    try {
      const key = `vipads_task_history_${targetEmail}`;
      localStorage.setItem(key, JSON.stringify(logs));
    } catch {}

    return logs;
  },

  // --- USERS REGISTRY ---
  getAllUsers(): StoredAccount[] {
    // Fast path: Return in-memory cache instantaneously (0ms)
    if (inMemoryUsersCache && Array.isArray(inMemoryUsersCache) && inMemoryUsersCache.length > 0) {
      return inMemoryUsersCache;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USERS_REGISTRY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const list: StoredAccount[] = parsed.map((u: StoredAccount) => {
            const userEmail = (u.email || '').trim().toLowerCase();
            const userUsername = (u.username || '').trim().toLowerCase();
            const effectiveEmail = userEmail || `${userUsername}@gmail.com`;

            // Lifetime persistent values
            let balance = typeof u.totalBalanceUSDT === 'number' && !isNaN(u.totalBalanceUSDT) && u.totalBalanceUSDT >= 0
              ? Number(u.totalBalanceUSDT.toFixed(2))
              : 0.00;
            if (balance === 220) balance = 0.00;

            let deposit = typeof u.totalDepositedUSDT === 'number' && !isNaN(u.totalDepositedUSDT) && u.totalDepositedUSDT >= 0
              ? Number(u.totalDepositedUSDT.toFixed(2))
              : 0.00;
            if (deposit === 220) deposit = 0.00;

            let vipLvl = Number(u.vipLevel) || 0;

            // Check dedicated per-email lifetime record only as fallback if u.totalBalanceUSDT / u.totalDepositedUSDT is missing
            let lifetime: any = null;
            if (u.totalBalanceUSDT === undefined || u.totalDepositedUSDT === undefined) {
              lifetime = storage.getEmailLifetimeBalances(effectiveEmail);
              if (lifetime) {
                if (u.totalBalanceUSDT === undefined && typeof lifetime.totalBalanceUSDT === 'number') {
                  balance = Number(lifetime.totalBalanceUSDT.toFixed(2));
                }
                if (u.totalDepositedUSDT === undefined && typeof lifetime.totalDepositedUSDT === 'number') {
                  deposit = Number(lifetime.totalDepositedUSDT.toFixed(2));
                }
                if (typeof lifetime.vipLevel === 'number' && !isNaN(lifetime.vipLevel)) {
                  vipLvl = Math.max(vipLvl, lifetime.vipLevel);
                }
              }
            }

            let tasksToday = Number(u.tasksCompletedToday) || 0;
            if (lifetime && typeof lifetime.tasksCompletedToday === 'number') {
              tasksToday = Math.max(tasksToday, lifetime.tasksCompletedToday);
            }

            return {
              ...u,
              email: effectiveEmail,
              walletAddress: (u.walletAddress && u.walletAddress !== 'TYqQwVENsSVVeSTNks31SyxStHV8x5HXSZ') ? u.walletAddress : '',
              totalBalanceUSDT: balance,
              totalDepositedUSDT: deposit,
              vipLevel: vipLvl,
              taskEarningsToday: Number(u.taskEarningsToday) || 0,
              totalWithdrawnUSDT: Number(u.totalWithdrawnUSDT) || (lifetime && typeof lifetime.totalWithdrawnUSDT === 'number' ? lifetime.totalWithdrawnUSDT : 0),
              tasksCompletedToday: tasksToday,
              completedTaskDays: typeof u.completedTaskDays === 'number' ? u.completedTaskDays : (lifetime && typeof lifetime.completedTaskDays === 'number' ? lifetime.completedTaskDays : 0),
              withdrawalsCount: typeof u.withdrawalsCount === 'number' ? u.withdrawalsCount : (lifetime && typeof lifetime.withdrawalsCount === 'number' ? lifetime.withdrawalsCount : 0),
              referralCount: Number(u.referralCount) || 0,
              referralEarningsUSDT: typeof u.referralEarningsUSDT === 'number' ? Number(u.referralEarningsUSDT.toFixed(2)) : (lifetime && typeof lifetime.referralEarningsUSDT === 'number' ? Number(lifetime.referralEarningsUSDT.toFixed(2)) : 0),
              pendingReferralRewardsUSDT: typeof u.pendingReferralRewardsUSDT === 'number' ? Number(u.pendingReferralRewardsUSDT.toFixed(2)) : (lifetime && typeof lifetime.pendingReferralRewardsUSDT === 'number' ? Number(lifetime.pendingReferralRewardsUSDT.toFixed(2)) : 0),
              tier1TaskCommissionUSDT: Number(u.tier1TaskCommissionUSDT) || 0,
              tier2TaskCommissionUSDT: Number(u.tier2TaskCommissionUSDT) || 0,
              tier3TaskCommissionUSDT: Number(u.tier3TaskCommissionUSDT) || 0,
            };
          });

          // Ensure default seeded accounts are present
          DEFAULT_ACCOUNTS.forEach(seed => {
            if (!list.some(u => (u.email || '').toLowerCase() === (seed.email || '').toLowerCase())) {
              list.push({ ...seed });
            }
          });

          inMemoryUsersCache = list;
          return list;
        }
      }
    } catch (e) {
      console.warn('Failed to load users registry from localStorage:', e);
    }
    // Initialize default registry in localStorage
    storage.saveAllUsers(DEFAULT_ACCOUNTS);
    inMemoryUsersCache = DEFAULT_ACCOUNTS;
    return DEFAULT_ACCOUNTS;
  },

  saveAllUsers(users: StoredAccount[]): void {
    try {
      inMemoryUsersCache = [...users];
      localStorage.setItem(STORAGE_KEYS.USERS_REGISTRY, JSON.stringify(users));
      
      // Fast sync: Only sync the currently logged-in user's individual lifetime key to prevent 100+ blocking disk I/O operations
      const currentEmail = (storage.getCurrentUserEmail() || '').trim().toLowerCase();
      if (currentEmail) {
        const currentUser = users.find(u => (u.email || '').trim().toLowerCase() === currentEmail);
        if (currentUser && currentUser.email) {
          storage.syncEmailLifetimeBalances(
            currentUser.email,
            currentUser.totalBalanceUSDT,
            currentUser.totalDepositedUSDT ?? 0,
            currentUser.vipLevel,
            currentUser.tasksCompletedToday,
            currentUser.pendingReferralRewardsUSDT,
            currentUser.referralEarningsUSDT,
            currentUser.completedTaskDays,
            currentUser.withdrawalsCount,
            currentUser.totalWithdrawnUSDT
          );
        }
      }
    } catch (e) {
      console.warn('Failed to save users registry:', e);
    }
  },

  userExists(email: string): boolean {
    if (!email) return false;
    const cleanEmail = (email || '').trim().toLowerCase();
    if (cleanEmail === 'free@gmail.com' || cleanEmail === 'free') return true;

    // Check localStorage registry directly
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USERS_REGISTRY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.some((u: any) => 
          (u.email || '').trim().toLowerCase() === cleanEmail ||
          (u.username || '').trim().toLowerCase() === cleanEmail
        )) {
          return true;
        }
      }
    } catch {}

    // Check registered password key
    try {
      const pass = localStorage.getItem(`vipads_user_pass_${cleanEmail}`);
      if (pass && pass.trim().length > 0) return true;
    } catch {}

    // Check lifetime balance
    try {
      const lifetime = localStorage.getItem(`vipads_lifetime_balance_${cleanEmail}`);
      if (lifetime) {
        const p = JSON.parse(lifetime);
        if (p && p.email && p.email.toLowerCase() === cleanEmail) {
          return true;
        }
      }
    } catch {}

    return false;
  },

  getUserByEmail(email: string): StoredAccount | null {
    if (!email) return null;
    const cleanEmail = (email || '').trim().toLowerCase();

    const users = storage.getAllUsers();
    let found = users.find(u => (u.email || '').toLowerCase() === cleanEmail || (u.username || '').toLowerCase() === cleanEmail);
    
    // Only recover if user actually exists (master admin, or explicitly registered with saved password, or real lifetime balance)
    if (!found) {
      const isMaster = cleanEmail === 'free@gmail.com' || cleanEmail === 'free';
      const lifetime = storage.getEmailLifetimeBalances(cleanEmail);
      let storedPass: string | null = null;
      try {
        storedPass = localStorage.getItem(`vipads_user_pass_${cleanEmail}`);
      } catch {}

      const hasRegisteredRecord = isMaster || (storedPass !== null && storedPass.trim().length > 0) || (lifetime !== null);
      
      if (hasRegisteredRecord) {
        const recoveredAccount: StoredAccount = {
          id: isMaster ? 'ADMIN-001' : `USER-${Date.now()}`,
          email: isMaster ? 'free@gmail.com' : cleanEmail,
          username: isMaster ? 'free@gmail.com' : (cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail),
          password: isMaster ? '000000' : (storedPass || '123456'),
          walletAddress: '',
          vipLevel: lifetime?.vipLevel ?? 0,
          totalBalanceUSDT: typeof lifetime?.totalBalanceUSDT === 'number' ? lifetime.totalBalanceUSDT : 0.00,
          totalDepositedUSDT: typeof lifetime?.totalDepositedUSDT === 'number' ? lifetime.totalDepositedUSDT : 0.00,
          taskEarningsToday: 0.00,
          totalWithdrawnUSDT: typeof lifetime?.totalWithdrawnUSDT === 'number' ? lifetime.totalWithdrawnUSDT : 0.00,
          tasksCompletedToday: typeof lifetime?.tasksCompletedToday === 'number' ? lifetime.tasksCompletedToday : 0,
          referralCode: isMaster ? '885101' : Math.floor(100000 + Math.random() * 900000).toString(),
          referralCount: 0,
          referralEarningsUSDT: typeof lifetime?.referralEarningsUSDT === 'number' ? lifetime.referralEarningsUSDT : 0.00,
          pendingReferralRewardsUSDT: typeof lifetime?.pendingReferralRewardsUSDT === 'number' ? lifetime.pendingReferralRewardsUSDT : 0.00,
          tier1TaskCommissionUSDT: 0.00,
          tier2TaskCommissionUSDT: 0.00,
          tier3TaskCommissionUSDT: 0.00,
          joinedDate: '2026-08-28',
        };
        users.push(recoveredAccount);
        storage.saveAllUsers(users);
        found = recoveredAccount;
      } else {
        return null;
      }
    }

    // Check if lifetime balance has updated values
    const lifetime = storage.getEmailLifetimeBalances(found.email);
    if (lifetime) {
      if (typeof lifetime.totalBalanceUSDT === 'number') {
        found.totalBalanceUSDT = Number(lifetime.totalBalanceUSDT.toFixed(2));
      }
      if (typeof lifetime.totalDepositedUSDT === 'number') {
        found.totalDepositedUSDT = Number(lifetime.totalDepositedUSDT.toFixed(2));
      }
      if (typeof lifetime.vipLevel === 'number') {
        found.vipLevel = lifetime.vipLevel;
      }
      if (typeof lifetime.tasksCompletedToday === 'number') {
        found.tasksCompletedToday = Math.floor(lifetime.tasksCompletedToday);
      }
      if (typeof lifetime.pendingReferralRewardsUSDT === 'number') {
        found.pendingReferralRewardsUSDT = Number(lifetime.pendingReferralRewardsUSDT.toFixed(2));
      }
      if (typeof lifetime.referralEarningsUSDT === 'number') {
        found.referralEarningsUSDT = Number(lifetime.referralEarningsUSDT.toFixed(2));
      }
      if (typeof lifetime.completedTaskDays === 'number') {
        found.completedTaskDays = lifetime.completedTaskDays;
      }
      if (typeof lifetime.withdrawalsCount === 'number') {
        found.withdrawalsCount = lifetime.withdrawalsCount;
      }
      if (typeof lifetime.totalWithdrawnUSDT === 'number') {
        found.totalWithdrawnUSDT = Number(lifetime.totalWithdrawnUSDT.toFixed(2));
      }
    }

    // Cross-verify with user tasks
    const savedTasks = storage.getUserTasks(found.email);
    const countFromTasks = savedTasks.filter(t => t.completedToday).length;
    found.tasksCompletedToday = Math.floor(countFromTasks);

    if (found.walletAddress === 'TYqQwVENsSVVeSTNks31SyxStHV8x5HXSZ') {
      found.walletAddress = '';
    }

    if (cleanEmail === 'free@gmail.com') {
      const isClaimedTest = typeof localStorage !== 'undefined' && localStorage.getItem('vipads_admin_claimed_test_referral') === 'true';
      if (!isClaimedTest && (!found.pendingReferralRewardsUSDT || found.pendingReferralRewardsUSDT <= 0)) {
        found.pendingReferralRewardsUSDT = 0.25;
      }
    }

    return found;
  },

  getUserByReferralCode(code: string): StoredAccount | null {
    if (!code) return null;
    const users = storage.getAllUsers();
    const cleanCode = (code || '').trim().toUpperCase();
    return users.find(u => (u.referralCode || '').toUpperCase() === cleanCode) || null;
  },

  saveUser(updatedUser: StoredAccount): void {
    if (!updatedUser) return;
    const users = storage.getAllUsers();
    const cleanEmail = (updatedUser.email || '').trim().toLowerCase();
    const idx = users.findIndex(u => (cleanEmail && (u.email || '').toLowerCase() === cleanEmail) || (updatedUser.id && u.id === updatedUser.id));
    
    let safeUser: StoredAccount = { 
      ...updatedUser,
      lastModified: updatedUser.lastModified || Date.now()
    };

    if (idx >= 0) {
      const existing = users[idx];
      // Only fallback to existing values if incoming values are undefined or NaN
      if (safeUser.totalBalanceUSDT === undefined || isNaN(safeUser.totalBalanceUSDT)) {
        safeUser.totalBalanceUSDT = existing.totalBalanceUSDT || 0;
      }
      if (safeUser.totalDepositedUSDT === undefined || isNaN(safeUser.totalDepositedUSDT)) {
        safeUser.totalDepositedUSDT = existing.totalDepositedUSDT || 0;
      }
      if (safeUser.vipLevel === undefined) {
        safeUser.vipLevel = existing.vipLevel || 0;
      }
      if (safeUser.tasksCompletedToday === undefined) {
        safeUser.tasksCompletedToday = Math.floor(existing.tasksCompletedToday || 0);
      } else {
        safeUser.tasksCompletedToday = Math.floor(Number(safeUser.tasksCompletedToday) || 0);
      }
      if (safeUser.taskEarningsToday === undefined) {
        safeUser.taskEarningsToday = existing.taskEarningsToday || 0;
      }
      if (safeUser.completedTaskDays === undefined) {
        safeUser.completedTaskDays = existing.completedTaskDays || 0;
      }
      if (safeUser.withdrawalsCount === undefined) {
        safeUser.withdrawalsCount = existing.withdrawalsCount || 0;
      }
      users[idx] = { ...existing, ...safeUser };
    } else {
      users.push(safeUser);
    }
    storage.saveAllUsers(users);
    storage.syncEmailLifetimeBalances(
      cleanEmail, 
      safeUser.totalBalanceUSDT, 
      safeUser.totalDepositedUSDT ?? 0, 
      safeUser.vipLevel,
      safeUser.tasksCompletedToday,
      safeUser.pendingReferralRewardsUSDT,
      safeUser.referralEarningsUSDT,
      safeUser.completedTaskDays,
      safeUser.withdrawalsCount,
      safeUser.totalWithdrawnUSDT
    );
    syncAccountLiveToCloud(idx >= 0 ? users[idx] : safeUser);
  },

  updateUser(email: string, partial: Partial<StoredAccount>): StoredAccount | null {
    const user = storage.getUserByEmail(email);
    if (!user) return null;
    const merged = { 
      ...user, 
      ...partial,
      lastModified: partial.lastModified || Date.now()
    };
    storage.saveUser(merged);
    return merged;
  },

  deductDepositFromUser(email: string, amount: number): boolean {
    if (!email) return false;
    const cleanEmail = (email || '').trim().toLowerCase();
    const users = storage.getAllUsers();
    let user = users.find(u => (u.email || '').toLowerCase() === cleanEmail || (u.username || '').toLowerCase() === cleanEmail);
    if (!user) return false;
    const exactAmount = Number(Math.abs(amount).toFixed(2));
    user.totalDepositedUSDT = Math.max(0, Number(((user.totalDepositedUSDT || 0) - exactAmount).toFixed(2)));
    user.lastModified = Date.now();
    storage.saveAllUsers(users);
    storage.syncEmailLifetimeBalances(user.email, user.totalBalanceUSDT, user.totalDepositedUSDT, user.vipLevel);
    syncAccountLiveToCloud(user);
    return true;
  },

  deductBalanceFromUser(email: string, amount: number): boolean {
    if (!email) return false;
    const cleanEmail = (email || '').trim().toLowerCase();
    const users = storage.getAllUsers();
    let user = users.find(u => (u.email || '').toLowerCase() === cleanEmail || (u.username || '').toLowerCase() === cleanEmail);
    if (!user) return false;
    const exactAmount = Number(Math.abs(amount).toFixed(2));
    user.totalBalanceUSDT = Math.max(0, Number(((user.totalBalanceUSDT || 0) - exactAmount).toFixed(2)));
    user.lastModified = Date.now();
    storage.saveAllUsers(users);
    storage.syncEmailLifetimeBalances(user.email, user.totalBalanceUSDT, user.totalDepositedUSDT ?? 0, user.vipLevel);
    syncAccountLiveToCloud(user);
    return true;
  },

  updateUserPassword(email: string, newPassword: string): boolean {
    const user = storage.getUserByEmail(email);
    if (!user) return false;
    user.password = newPassword;
    storage.saveUser(user);
    return true;
  },

  getTotalDepositedForUser(email: string): number {
    if (!email) return 0.00;
    const clean = (email || '').trim().toLowerCase();
    const user = storage.getUserByEmail(clean);
    if (user && typeof user.totalDepositedUSDT === 'number' && !isNaN(user.totalDepositedUSDT)) {
      return Number(user.totalDepositedUSDT.toFixed(2));
    }
    const lifetime = storage.getEmailLifetimeBalances(clean);
    if (lifetime && typeof lifetime.totalDepositedUSDT === 'number' && !isNaN(lifetime.totalDepositedUSDT)) {
      return Number(lifetime.totalDepositedUSDT.toFixed(2));
    }
    return 0.00;
  },

  registerNewUser(
    email: string, 
    username?: string, 
    password?: string, 
    invitedByRefCode?: string
  ): { success: boolean; error?: string; user?: StoredAccount; inviter?: StoredAccount } {
    const cleanEmail = (email || '').trim().toLowerCase();
    const users = storage.getAllUsers();

    const existing = users.find(u => (u.email || '').toLowerCase() === cleanEmail || (u.username && (u.username || '').toLowerCase() === cleanEmail));
    if (existing) {
      return {
        success: false,
        error: '⚠️ هذا الحساب مسجل بالفعل في المنصة. يرجى تسجيل الدخول.'
      };
    }

    const cleanName = username || (cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail);
    
    // Check if inviter referral code exists (supports referral code, username, or email)
    let inviterUser: StoredAccount | null = null;
    let cleanRef = '';
    if (invitedByRefCode && invitedByRefCode.trim()) {
      cleanRef = invitedByRefCode.trim().toUpperCase();
      inviterUser = users.find(u => 
        (u.referralCode && (u.referralCode || '').trim().toUpperCase() === cleanRef) ||
        (u.username && (u.username || '').trim().toUpperCase() === cleanRef) ||
        (u.email && (u.email || '').split('@')[0].trim().toUpperCase() === cleanRef) ||
        (cleanRef === '885101' && (u.email || '').toLowerCase() === 'free@gmail.com')
      ) || null;

      // Special guarantee for default sponsor 885101 across isolated browsers/sessions
      if (!inviterUser && cleanRef === '885101') {
        const adminAcc = users.find(u => (u.email || '').toLowerCase() === 'free@gmail.com');
        if (adminAcc) {
          adminAcc.referralCode = '885101';
          inviterUser = adminAcc;
        } else {
          inviterUser = {
            id: 'ADMIN-001',
            email: 'free@gmail.com',
            username: 'free@gmail.com',
            password: '000000',
            walletAddress: '',
            vipLevel: 0,
            totalBalanceUSDT: 0.00,
            totalDepositedUSDT: 0.00,
            taskEarningsToday: 0.00,
            totalWithdrawnUSDT: 0.00,
            tasksCompletedToday: 0,
            referralCode: '885101',
            referralCount: 0,
            referralEarningsUSDT: 0.00,
            tier1TaskCommissionUSDT: 0.00,
            tier2TaskCommissionUSDT: 0.00,
            tier3TaskCommissionUSDT: 0.00,
            joinedDate: '2026-08-28',
          };
          users.unshift(inviterUser);
        }
      }
    }

    const newAccount: StoredAccount = {
      id: `USR-${Date.now().toString().slice(-6)}`,
      email: cleanEmail,
      username: cleanName,
      password: password || '123456',
      walletAddress: `0x${Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}...${Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      vipLevel: 0, // Starts at VIP 0 (Locked tasks until user activates VIP 1 for 0.00 USDT)
      totalBalanceUSDT: 0.00, // Absolute zero baseline
      totalDepositedUSDT: 0.00,
      taskEarningsToday: 0.00,
      totalWithdrawnUSDT: 0.00,
      tasksCompletedToday: 0,
      completedTaskDays: 0,
      withdrawalsCount: 0,
      referralCode: generateUnique6DigitReferralCode(users),
      referredBy: inviterUser ? inviterUser.referralCode : (cleanRef || undefined),
      referralCount: 0,
      referralEarningsUSDT: 0.00,
      joinedDate: new Date().toISOString().split('T')[0],
      tasksState: [],
    };

    // If registered via inviter, link referredBy and increment referral count.
    // Zero Funds on Free Registrations (منع أرباح التسجيل المجاني):
    // عند تسجيل أي شخص عبر رابط الإحالة، يزداد "حجم الفريق" بمقدار (1 عضو)،
    // ولكن لا يتم إضافة أي مبالغ مادية أو سنتات نهائياً في رصيد المستخدم المستضيف.
    // التسجيل المجاني قيمته صفر أرباح.
    if (inviterUser) {
      inviterUser.referralCount = (inviterUser.referralCount || 0) + 1;
      
      // Update inviter lifetime storage directly
      try {
        const inviterLifetimeKey = `vipads_lifetime_balance_${(inviterUser.email || '').toLowerCase()}`;
        const existingLifetime = localStorage.getItem(inviterLifetimeKey);
        if (existingLifetime) {
          const parsed = JSON.parse(existingLifetime);
          parsed.referralCount = inviterUser.referralCount;
          parsed.lastUpdated = Date.now();
          localStorage.setItem(inviterLifetimeKey, JSON.stringify(parsed));
        }
      } catch (e) {
        console.warn('Failed to update inviter lifetime record:', e);
      }
    }

    users.push(newAccount);
    storage.saveAllUsers(users);
    storage.setCurrentUserEmail(cleanEmail);

    // CRITICAL: Immediate Session Enforcer & Silent URL Referral Purge
    try {
      localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
      localStorage.setItem('vipads_is_logged_in', 'true');
      localStorage.setItem('vipads_user_registered', 'true');
      localStorage.setItem(`vipads_user_pass_${cleanEmail}`, password || '123456');
      purgeReferralQueriesFromUrl();
    } catch {}

    // Global Unified Database Bridge: Send registration to backend immediately
    try {
      firebaseSync.recordUserRegistered(newAccount, inviterUser).catch(() => {});
    } catch {}

    try {
      networkSync.registerUser({
        email: cleanEmail,
        username: cleanName,
        password: password || '123456',
        referralCode: newAccount.referralCode,
        referredBy: newAccount.referredBy,
      }).then((res) => {
        if (res.success && Array.isArray(res.allAccounts)) {
          const curUsers = storage.getAllUsers();
          const userMap = new Map<string, StoredAccount>();
          curUsers.forEach(u => { if (u?.email) userMap.set(u.email.toLowerCase().trim(), u); });
          res.allAccounts.forEach(remoteU => {
            if (remoteU?.email) {
              const emailKey = remoteU.email.toLowerCase().trim();
              if (!userMap.has(emailKey)) {
                userMap.set(emailKey, remoteU);
              }
            }
          });
          storage.saveAllUsers(Array.from(userMap.values()));
        }
      }).catch((err) => {
        console.warn('Backend sync registration non-blocking warning:', err);
      });
    } catch {}

    // Dispatch global storage event for immediate UI updates across tabs and views
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('vipads:team_updated', {
          detail: {
            newUserId: newAccount.id,
            inviterCode: inviterUser?.referralCode
          }
        }));
      }
    } catch (e) {
      console.warn('Dispatch event error:', e);
    }

    return {
      success: true,
      user: newAccount,
      inviter: inviterUser || undefined
    };
  },

  // Get count of referred members who completed a real deposit or paid VIP activation
  getDepositActivatedReferredCountForUser(userRefCode: string): number {
    if (!userRefCode) return 0;
    const allUsers = storage.getAllUsers();
    const cleanRef = (userRefCode || '').trim().toUpperCase();
    const directChildren = allUsers.filter(u => u.referredBy && (u.referredBy || '').toUpperCase() === cleanRef);
    
    // Check all completed transactions to see which direct referrals made completed deposits or paid VIP upgrades
    const allTx = storage.getAllTransactions();
    const activeDepositors = directChildren.filter(child => {
      // 1. If child has vipLevel >= 2 (paid VIP upgrade)
      if (child.vipLevel >= 2) return true;
      // 2. If child has completed deposit or vip_upgrade transactions
      const hasCompletedDeposit = allTx.some(
        tx => (tx.userEmail || '').toLowerCase() === (child.email || '').toLowerCase() &&
              (tx.type === 'deposit' || tx.type === 'vip_upgrade') &&
              tx.status === 'completed' &&
              tx.amountUSDT > 0
      );
      return hasCompletedDeposit;
    });

    return activeDepositors.length;
  },

  // Get dynamic members referred by a specific user referral code
  getReferredMembersForUser(userRefCode: string): ReferredMember[] {
    if (!userRefCode) return [];
    const allUsers = storage.getAllUsers();
    const cleanRef = (userRefCode || '').trim().toUpperCase();

    const directChildren = allUsers.filter(u => u.referredBy && (u.referredBy || '').toUpperCase() === cleanRef);
    return directChildren.map(child => {
      // Real deposit commission earned from this child: 10% (Level 1) of their deposited amount
      const childDeposits = typeof child.totalDepositedUSDT === 'number' ? child.totalDepositedUSDT : 0;
      const commissionEarned = Number((childDeposits * 0.10).toFixed(2));
      return {
        id: child.id,
        username: child.username || child.email.split('@')[0],
        walletAddress: child.walletAddress,
        vipTier: child.vipLevel > 0 ? `VIP ${child.vipLevel}` : 'VIP 0',
        joinedAt: child.joinedDate,
        bonusEarnedUSDT: commissionEarned,
        status: child.vipLevel > 0 ? 'vip_upgraded' : child.tasksCompletedToday > 0 ? 'watching_ads' : 'active'
      };
    });
  },

  /**
   * Automated 3-Tier Deposit-Based Commission System:
   * Level 1 (Direct Sponsor): 10% of approved deposit
   * Level 2 (2nd Upline Sponsor): 5% of approved deposit
   * Level 3 (3rd Upline Sponsor): 2% of approved deposit
   *
   * Automatically triggered when an admin approves a deposit in the Admin Panel.
   */
  distributeDepositCommission(
    depositorEmailOrUsername: string,
    depositAmount: number,
    sourceTxId?: string
  ): {
    tier1?: { sponsorEmail: string; sponsorUsername: string; sponsorRefCode?: string; amount: number; ratePercent: number };
    tier2?: { sponsorEmail: string; sponsorUsername: string; sponsorRefCode?: string; amount: number; ratePercent: number };
    tier3?: { sponsorEmail: string; sponsorUsername: string; sponsorRefCode?: string; amount: number; ratePercent: number };
    totalDistributed: number;
  } {
    const exactAmount = Number(Math.abs(depositAmount).toFixed(2));
    if (exactAmount <= 0) {
      return { totalDistributed: 0 };
    }

    const allUsers = storage.getAllUsers();
    const cleanSub = (depositorEmailOrUsername || '').trim().toLowerCase();
    const depositor = allUsers.find(u => {
      const uEmail = (u.email || '').toLowerCase();
      const uName = (u.username || '').toLowerCase();
      return uEmail === cleanSub || 
        uName === cleanSub ||
        (cleanSub.includes('@') && uEmail && uEmail.startsWith(cleanSub.split('@')[0])) ||
        (!cleanSub.includes('@') && cleanSub && uName && uName.startsWith(cleanSub));
    });

    if (!depositor || !depositor.referredBy) {
      return { totalDistributed: 0 };
    }

    // Double-distribution guard: check if commission was already processed for this sourceTxId
    if (sourceTxId) {
      const allTxs = storage.getAllTransactions();
      const alreadyHandled = allTxs.some(
        tx => tx.type === 'referral_commission' && (tx.id || '').includes(`depcomm-l1-${sourceTxId}`)
      );
      if (alreadyHandled) {
        return { totalDistributed: 0 };
      }
    }

    const results: {
      tier1?: { sponsorEmail: string; sponsorUsername: string; sponsorRefCode?: string; amount: number; ratePercent: number };
      tier2?: { sponsorEmail: string; sponsorUsername: string; sponsorRefCode?: string; amount: number; ratePercent: number };
      tier3?: { sponsorEmail: string; sponsorUsername: string; sponsorRefCode?: string; amount: number; ratePercent: number };
      totalDistributed: number;
    } = { totalDistributed: 0 };

    const cleanDepositorName = depositor.username || depositor.email.split('@')[0];

    // --- LEVEL 1: 10% Direct Sponsor Commission ---
    const l1Code = (depositor.referredBy || '').trim().toUpperCase();
    const level1Sponsor = allUsers.find(
      u => (u.referralCode && (u.referralCode || '').trim().toUpperCase() === l1Code) ||
           (l1Code === '885101' && (u.email || '').toLowerCase() === 'free@gmail.com')
    );
    if (level1Sponsor) {
      const comm1 = Number((exactAmount * 0.10).toFixed(2));
      if (comm1 > 0) {
        level1Sponsor.totalBalanceUSDT = Number(((level1Sponsor.totalBalanceUSDT || 0) + comm1).toFixed(2));
        level1Sponsor.referralEarningsUSDT = Number(((level1Sponsor.referralEarningsUSDT || 0) + comm1).toFixed(2));

        const tx1: Transaction = {
          id: `tx-depcomm-l1-${sourceTxId || Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'referral_commission',
          amountUSDT: comm1,
          status: 'completed',
          description: `عمولة إيداع المستوى 1 (10%): إيداع ${exactAmount.toFixed(2)} USDT بواسطة @${cleanDepositorName} (+${comm1.toFixed(2)} USDT)`,
          timestamp: new Date().toISOString(),
          userEmail: level1Sponsor.email,
          txHash: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
        };
        storage.addTransaction(tx1);

        results.tier1 = {
          sponsorEmail: level1Sponsor.email,
          sponsorUsername: level1Sponsor.username,
          sponsorRefCode: level1Sponsor.referralCode,
          amount: comm1,
          ratePercent: 10
        };
        results.totalDistributed = Number((results.totalDistributed + comm1).toFixed(2));

        // Automated letter in sponsor's Inbox Center
        storage.addNotificationForUser(level1Sponsor.email, {
          type: 'referral_bonus',
          title: 'عمولة إحالة مباشرة (المستوى 1)',
          badgeLabel: 'عمولة إيداع +10%',
          message: `تهانينا! حصلت على عمولة فورية بقيمة +${comm1.toFixed(2)} USDT إثر قيام العضو @${cleanDepositorName} بشحن حسابه. 💰`,
          amount: comm1,
          userEmail: level1Sponsor.email,
        });
      }

      // --- LEVEL 2: 5% Indirect Sponsor Commission ---
      if (level1Sponsor.referredBy) {
        const l2Code = (level1Sponsor.referredBy || '').trim().toUpperCase();
        const level2Sponsor = allUsers.find(u => (u.referralCode || '').trim().toUpperCase() === l2Code);
        if (level2Sponsor) {
          const comm2 = Number((exactAmount * 0.05).toFixed(2));
          if (comm2 > 0) {
            level2Sponsor.totalBalanceUSDT = Number(((level2Sponsor.totalBalanceUSDT || 0) + comm2).toFixed(2));
            level2Sponsor.referralEarningsUSDT = Number(((level2Sponsor.referralEarningsUSDT || 0) + comm2).toFixed(2));

            const tx2: Transaction = {
              id: `tx-depcomm-l2-${sourceTxId || Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'referral_commission',
              amountUSDT: comm2,
              status: 'completed',
              description: `عمولة إيداع المستوى 2 (5%): إيداع ${exactAmount.toFixed(2)} USDT بواسطة @${cleanDepositorName} (+${comm2.toFixed(2)} USDT)`,
              timestamp: new Date().toISOString(),
              userEmail: level2Sponsor.email,
              txHash: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
            };
            storage.addTransaction(tx2);

            results.tier2 = {
              sponsorEmail: level2Sponsor.email,
              sponsorUsername: level2Sponsor.username,
              sponsorRefCode: level2Sponsor.referralCode,
              amount: comm2,
              ratePercent: 5
            };
            results.totalDistributed = Number((results.totalDistributed + comm2).toFixed(2));

            // Automated letter in sponsor's Inbox Center
            storage.addNotificationForUser(level2Sponsor.email, {
              type: 'referral_bonus',
              title: 'عمولة فريق (المستوى 2)',
              badgeLabel: 'عمولة إيداع +5%',
              message: `تهانينا! حصلت على عمولة فريق غير مباشرة بقيمة +${comm2.toFixed(2)} USDT إثر قيام العضو @${cleanDepositorName} بشحن حسابه. 💰`,
              amount: comm2,
              userEmail: level2Sponsor.email,
            });
          }

          // --- LEVEL 3: 2% Indirect Sponsor Commission ---
          if (level2Sponsor.referredBy) {
            const l3Code = (level2Sponsor.referredBy || '').trim().toUpperCase();
            const level3Sponsor = allUsers.find(u => (u.referralCode || '').trim().toUpperCase() === l3Code);
            if (level3Sponsor) {
              const comm3 = Number((exactAmount * 0.02).toFixed(2));
              if (comm3 > 0) {
                level3Sponsor.totalBalanceUSDT = Number(((level3Sponsor.totalBalanceUSDT || 0) + comm3).toFixed(2));
                level3Sponsor.referralEarningsUSDT = Number(((level3Sponsor.referralEarningsUSDT || 0) + comm3).toFixed(2));

                const tx3: Transaction = {
                  id: `tx-depcomm-l3-${sourceTxId || Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  type: 'referral_commission',
                  amountUSDT: comm3,
                  status: 'completed',
                  description: `عمولة إيداع المستوى 3 (2%): إيداع ${exactAmount.toFixed(2)} USDT بواسطة @${cleanDepositorName} (+${comm3.toFixed(2)} USDT)`,
                  timestamp: new Date().toISOString(),
                  userEmail: level3Sponsor.email,
                  txHash: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
                };
                storage.addTransaction(tx3);

                results.tier3 = {
                  sponsorEmail: level3Sponsor.email,
                  sponsorUsername: level3Sponsor.username,
                  sponsorRefCode: level3Sponsor.referralCode,
                  amount: comm3,
                  ratePercent: 2
                };
                results.totalDistributed = Number((results.totalDistributed + comm3).toFixed(2));

                // Automated letter in sponsor's Inbox Center
                storage.addNotificationForUser(level3Sponsor.email, {
                  type: 'referral_bonus',
                  title: 'عمولة شبكة (المستوى 3)',
                  badgeLabel: 'عمولة إيداع +2%',
                  message: `تهانينا! حصلت على عمولة شبكة بقيمة +${comm3.toFixed(2)} USDT إثر قيام العضو @${cleanDepositorName} بشحن حسابه. 💰`,
                  amount: comm3,
                  userEmail: level3Sponsor.email,
                });
              }
            }
          }
        }
      }
    }

    storage.saveAllUsers(allUsers);
    return results;
  },

  /**
   * Referral Task Rewards Engine (Manual Claim System):
   * When a direct team member (Level 1) finishes an ad:
   * Accumulates exactly 0.01 USDT into pendingReferralRewardsUSDT.
   * No automatic balance injection. The sponsor claims rewards manually via the "يجمع" button.
   */
  distribute3TierTaskCommission(
    subUserEmail: string, 
    _taskReward: number = 0.09
  ): { 
    tier1?: { sponsorEmail: string; bonus: number }; 
    tier2?: { sponsorEmail: string; bonus: number }; 
    tier3?: { sponsorEmail: string; bonus: number }; 
  } {
    const allUsers = storage.getAllUsers();
    const cleanSubEmail = (subUserEmail || '').trim().toLowerCase();
    const subUser = allUsers.find(u => (u.email || '').toLowerCase() === cleanSubEmail || (u.username || '').toLowerCase() === cleanSubEmail);
    if (!subUser || !subUser.referredBy) {
      return {};
    }

    const results: { 
      tier1?: { sponsorEmail: string; bonus: number }; 
      tier2?: { sponsorEmail: string; bonus: number }; 
      tier3?: { sponsorEmail: string; bonus: number }; 
    } = {};

    // 1. Level 1 Upline Sponsor:
    // Accumulate exactly 0.01 USDT per ad watched by direct Level 1 referral member into pendingReferralRewardsUSDT
    const cleanRef = (subUser.referredBy || '').trim().toUpperCase();
    const level1Sponsor = allUsers.find(u => 
      (u.referralCode && (u.referralCode || '').trim().toUpperCase() === cleanRef) ||
      (u.username && (u.username || '').trim().toUpperCase() === cleanRef) ||
      (u.email && (u.email || '').trim().toUpperCase() === cleanRef) ||
      (u.email && (u.email || '').split('@')[0].trim().toUpperCase() === cleanRef) ||
      (cleanRef === '885101' && (u.email || '').toLowerCase() === 'free@gmail.com')
    );

    if (level1Sponsor) {
      const bonus1 = 0.01; // exactly 0.01 USDT per ad
      const currentPending = Number((level1Sponsor.pending_commissions ?? level1Sponsor.pendingReferralRewardsUSDT ?? 0).toFixed(2));
      const newPending = Number((currentPending + bonus1).toFixed(2));
      level1Sponsor.pending_commissions = newPending;
      level1Sponsor.pendingReferralRewardsUSDT = newPending;
      level1Sponsor.lastModified = Date.now();

      // Update lifetime balance sync for sponsor so it survives page reload
      storage.syncEmailLifetimeBalances(
        level1Sponsor.email,
        level1Sponsor.totalBalanceUSDT,
        level1Sponsor.totalDepositedUSDT ?? 0,
        level1Sponsor.vipLevel,
        level1Sponsor.tasksCompletedToday,
        newPending,
        level1Sponsor.referralEarningsUSDT
      );

      results.tier1 = { sponsorEmail: level1Sponsor.email, bonus: bonus1 };
    }

    storage.saveAllUsers(allUsers);

    try {
      window.dispatchEvent(new Event('vipads:team_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    return results;
  },

  /**
   * Claims all pending referral rewards accumulated from team ad views (0.01 USDT per ad)
   * Zeros out pending rewards (0.00), transfers full amount to user totalBalanceUSDT, and records transaction.
   */
  claimReferralRewards(email: string): { success: boolean; claimedAmount: number; newBalance: number } {
    const cleanEmail = (email || '').trim().toLowerCase();
    const allUsers = storage.getAllUsers();
    const user = allUsers.find(u => (u.email || '').toLowerCase() === cleanEmail || (u.username || '').toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, claimedAmount: 0, newBalance: 0 };
    }

    const pendingAmount = Number((user.pending_commissions ?? user.pendingReferralRewardsUSDT ?? 0).toFixed(2));
    if (pendingAmount <= 0) {
      return { success: false, claimedAmount: 0, newBalance: user.totalBalanceUSDT };
    }

    // Zero out pending rewards and credit to main wallet balance
    user.pending_commissions = 0.00;
    user.pendingReferralRewardsUSDT = 0.00;
    user.totalBalanceUSDT = Number(((user.totalBalanceUSDT || 0) + pendingAmount).toFixed(2));
    user.referralEarningsUSDT = Number(((user.referralEarningsUSDT || 0) + pendingAmount).toFixed(2));
    user.tier1TaskCommissionUSDT = Number(((user.tier1TaskCommissionUSDT || 0) + pendingAmount).toFixed(2));
    user.lastModified = Date.now();

    storage.saveAllUsers(allUsers);
    
    // Sync lifetime balance with updated totalBalanceUSDT and 0.00 pending rewards
    storage.syncEmailLifetimeBalances(
      user.email,
      user.totalBalanceUSDT,
      user.totalDepositedUSDT ?? 0,
      user.vipLevel,
      user.tasksCompletedToday,
      0.00,
      user.referralEarningsUSDT
    );

    // Record in transaction log
    const tx: Transaction = {
      id: `tx-claim-comm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'referral_commission',
      amountUSDT: pendingAmount,
      status: 'completed',
      description: `حصد وتجميع مكافآت إعلانات الفريق (+${pendingAmount.toFixed(2)} USDT)`,
      timestamp: new Date().toISOString(),
      userEmail: user.email,
      txHash: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
    storage.addTransaction(tx);

    try {
      if (cleanEmail === 'free@gmail.com') {
        localStorage.setItem('vipads_admin_claimed_test_referral', 'true');
      }
      window.dispatchEvent(new Event('vipads:team_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    return { success: true, claimedAmount: pendingAmount, newBalance: user.totalBalanceUSDT };
  },

  /**
   * Adds pending referral rewards (cents or custom amount) to a user for testing or promotions
   */
  addPendingReferralRewards(email: string, amount: number): number {
    const cleanEmail = (email || '').trim().toLowerCase();
    const allUsers = storage.getAllUsers();
    const user = allUsers.find(u => (u.email || '').toLowerCase() === cleanEmail || (u.username || '').toLowerCase() === cleanEmail);
    if (!user) return 0;
    const safeAmount = Math.max(0, Number(amount.toFixed(2)));
    user.pendingReferralRewardsUSDT = Number(((user.pendingReferralRewardsUSDT || 0) + safeAmount).toFixed(2));
    user.lastModified = Date.now();
    storage.saveAllUsers(allUsers);
    storage.syncEmailLifetimeBalances(
      user.email,
      user.totalBalanceUSDT,
      user.totalDepositedUSDT ?? 0,
      user.vipLevel,
      user.tasksCompletedToday,
      user.pendingReferralRewardsUSDT,
      user.referralEarningsUSDT
    );
    try {
      if (cleanEmail === 'free@gmail.com') {
        localStorage.removeItem('vipads_admin_claimed_test_referral');
      }
      window.dispatchEvent(new Event('vipads:team_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
    return user.pendingReferralRewardsUSDT;
  },

  // --- CURRENT USER SESSION ---
  getCurrentUserEmail(): string {
    try {
      const email = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_EMAIL);
      if (email) return email;
    } catch (e) {
      console.warn(e);
    }
    return '';
  },

  setCurrentUserEmail(email: string): void {
    try {
      if (email) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_EMAIL, email.trim().toLowerCase());
      }
    } catch (e) {
      console.warn(e);
    }
  },

  // --- TRANSACTIONS ---
  getAllTransactions(): Transaction[] {
    if (inMemoryTransactionsCache && Array.isArray(inMemoryTransactionsCache)) {
      return inMemoryTransactionsCache;
    }

    try {
      let approvedList: string[] = [];
      try {
        const rawApp = localStorage.getItem('vipads_approved_tx_ids');
        if (rawApp) {
          const parsedApp = JSON.parse(rawApp);
          if (Array.isArray(parsedApp)) approvedList = parsedApp;
        }
      } catch {}

      const raw = localStorage.getItem(STORAGE_KEYS.GLOBAL_TRANSACTIONS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((tx: any) => {
            const amt = Number(tx.amountUSDT);
            if (amt === 220 || tx.amountUSDT === '220' || isNaN(amt)) return false;
            return true;
          });
          const result = valid.map((tx: any) => {
            const cleanId = (tx.id || '').trim().toLowerCase();
            const isApproved = Array.isArray(approvedList) && (
              (tx.id && approvedList.includes(tx.id)) || (cleanId ? approvedList.includes(cleanId) : false)
            );
            return {
              ...tx,
              amountUSDT: Number(tx.amountUSDT) || 0,
              timestamp: tx.timestamp || new Date().toISOString(),
              status: isApproved ? 'completed' : (tx.status === 'approved' ? 'completed' : tx.status),
            };
          });
          inMemoryTransactionsCache = result;
          return result;
        }
      }
    } catch (e) {
      console.warn('Failed to load transactions:', e);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.GLOBAL_TRANSACTIONS, JSON.stringify(DEFAULT_TRANSACTIONS));
      localStorage.setItem('vipads_all_transactions', JSON.stringify(DEFAULT_TRANSACTIONS));
    } catch {}
    inMemoryTransactionsCache = DEFAULT_TRANSACTIONS;
    return DEFAULT_TRANSACTIONS;
  },

  saveAllTransactions(transactions: Transaction[]): void {
    try {
      inMemoryTransactionsCache = [...transactions];
      localStorage.setItem(STORAGE_KEYS.GLOBAL_TRANSACTIONS, JSON.stringify(transactions));
      localStorage.setItem('vipads_all_transactions', JSON.stringify(transactions));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vipads_transactions_changed'));
      }
    } catch (e) {
      console.warn('Failed to save transactions:', e);
    }
  },

  addTransaction(tx: Transaction): void {
    const all = storage.getAllTransactions();
    all.unshift(tx);
    storage.saveAllTransactions(all);
    try {
      networkSync.postTransaction(tx).catch(() => {});
    } catch {}
    try {
      firebaseSync.recordTransactionLive(tx).catch(() => {});
    } catch {}
  },

  updateTransactionStatus(txId: string, status: 'completed' | 'approved' | 'pending' | 'processing' | 'failed'): Transaction | null {
    const all = storage.getAllTransactions();
    const cleanId = (txId || '').trim().toLowerCase();
    const target = all.find(t => t.id === txId || (t.id && t.id.trim().toLowerCase() === cleanId));
    if (target) {
      const normalizedStatus = (status === 'approved' || status === 'completed') ? 'completed' : status;
      target.status = normalizedStatus;
      storage.saveAllTransactions(all);

      if (normalizedStatus === 'completed') {
        try {
          let approvedList: string[] = [];
          const rawApp = localStorage.getItem('vipads_approved_tx_ids');
          if (rawApp) {
            const parsedApp = JSON.parse(rawApp);
            if (Array.isArray(parsedApp)) approvedList = parsedApp;
          }
          if (target.id && !approvedList.includes(target.id)) approvedList.push(target.id);
          if (cleanId && !approvedList.includes(cleanId)) approvedList.push(cleanId);
          localStorage.setItem('vipads_approved_tx_ids', JSON.stringify(approvedList));
        } catch {}
      }

      try {
        firebaseSync.recordTransactionLive(target).catch(() => {});
        networkSync.postTransaction(target).catch(() => {});
        networkSync.updateTransactionStatus(target.id, normalizedStatus).catch(() => {});
      } catch {}

      // Real-time Automated Notifications on Transaction Status Completion/Rejection
      try {
        const uEmail = (target.userEmail || '').trim().toLowerCase();
        if (uEmail) {
          if (target.type === 'withdraw' && normalizedStatus === 'completed') {
            storage.addNotificationForUser(uEmail, {
              type: 'withdrawal_approved',
              title: 'تم قبول السحب',
              badgeLabel: 'تم قبول السحب',
              message: `تمت الموافقة على طلب سحب بقيمة ${target.amountUSDT.toFixed(2)} USDT وتم تحويل الأموال بنجاح إلى محفظتك! 🚀`,
              amount: target.amountUSDT,
            });
          } else if (target.type === 'withdraw' && normalizedStatus === 'failed') {
            storage.addNotificationForUser(uEmail, {
              type: 'withdrawal_rejected',
              title: 'تم رفض السحب',
              badgeLabel: 'تم رفض السحب',
              message: `تم رفض طلب السحب بقيمة ${target.amountUSDT.toFixed(2)} USDT وإعادة الرصيد إلى محفظتك. ⚠️`,
              amount: target.amountUSDT,
            });
          } else if (target.type === 'deposit' && normalizedStatus === 'completed') {
            storage.addNotificationForUser(uEmail, {
              type: 'deposit_approved',
              title: 'تم قبول الإيداع',
              badgeLabel: 'تم قبول الإيداع',
              message: `تمت الموافقة بنجاح على إيداع بقيمة +${target.amountUSDT.toFixed(2)} USDT وإضافته إلى محفظتك الاستثمارية. 💵`,
              amount: target.amountUSDT,
            });
          }
        }
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('vipads_transactions_changed', { detail: { txId, status: normalizedStatus } }));
      }
      return target;
    }
    return null;
  },

  // --- ADMIN FUNDING TOOLS ---
  recordApprovedWithdrawal(email: string, amount: number): boolean {
    const cleanEmail = (email || '').trim().toLowerCase();
    const users = storage.getAllUsers();
    let user = users.find(u => {
      const uEmail = (u.email || '').toLowerCase();
      const uName = (u.username || '').toLowerCase();
      return uEmail === cleanEmail || 
        uName === cleanEmail ||
        (uEmail && cleanEmail && (uEmail.includes(cleanEmail) || cleanEmail.includes(uEmail))) ||
        (uName && cleanEmail && (uName.startsWith(cleanEmail) || cleanEmail.startsWith(uName)));
    });
    if (!user && cleanEmail.includes('@')) {
      const part = cleanEmail.split('@')[0];
      user = users.find(u => (u.username || '').toLowerCase() === part);
    }
    if (!user && users.length === 1) {
      user = users[0];
    }
    if (!user) return false;
    const exactAmount = Number(Math.abs(amount).toFixed(2));
    user.totalWithdrawnUSDT = Number(((user.totalWithdrawnUSDT || 0) + exactAmount).toFixed(2));
    user.lastModified = Date.now();
    storage.saveAllUsers(users);
    storage.syncEmailLifetimeBalances(
      user.email,
      user.totalBalanceUSDT,
      user.totalDepositedUSDT ?? 0,
      user.vipLevel,
      user.tasksCompletedToday,
      user.pendingReferralRewardsUSDT,
      user.referralEarningsUSDT,
      user.completedTaskDays,
      user.withdrawalsCount,
      user.totalWithdrawnUSDT
    );
    syncAccountLiveToCloud(user);
    return true;
  },
  recordApprovedDeposit(email: string, amount: number, txId?: string): boolean {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) return false;
    const exactAmount = Number(Math.abs(amount).toFixed(2));
    if (exactAmount <= 0) return false;

    // Strict Transaction ID idempotency:
    if (txId) {
      const cleanTxId = txId.trim();
      let approvedList: string[] = [];
      try {
        const rawApp = localStorage.getItem('vipads_approved_tx_ids');
        if (rawApp) {
          const parsed = JSON.parse(rawApp);
          if (Array.isArray(parsed)) approvedList = parsed;
        }
      } catch {}

      if (approvedList.includes(cleanTxId)) {
        console.warn(`[Storage] Deposit txId ${cleanTxId} was already credited. Skipping.`);
        return false;
      }

      approvedList.push(cleanTxId);
      try {
        localStorage.setItem('vipads_approved_tx_ids', JSON.stringify(approvedList));
      } catch {}
    }

    const users = storage.getAllUsers();
    let user = users.find(u => {
      const uEmail = (u.email || '').toLowerCase();
      const uName = (u.username || '').toLowerCase();
      return uEmail === cleanEmail || 
        uName === cleanEmail ||
        (uEmail && cleanEmail && (uEmail.includes(cleanEmail) || cleanEmail.includes(uEmail))) ||
        (uName && cleanEmail && (uName.startsWith(cleanEmail) || cleanEmail.startsWith(uName)));
    });
    if (!user && cleanEmail.includes('@')) {
      const part = cleanEmail.split('@')[0];
      user = users.find(u => (u.username || '').toLowerCase() === part);
    }

    if (txId && user && Array.isArray(user.processedDepositTxIds) && user.processedDepositTxIds.includes(txId.trim())) {
      console.warn(`[Storage] User already processed txId ${txId}. Skipping.`);
      return false;
    }

    if (!user) {
      // User registered remotely or in incognito; safely instantiate their record in local registry
      user = {
        id: `USR-${Date.now().toString().slice(-6)}`,
        email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@gmail.com`,
        username: cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail,
        password: '000000',
        walletAddress: '',
        vipLevel: 0,
        totalBalanceUSDT: 0,
        totalDepositedUSDT: exactAmount,
        taskEarningsToday: 0,
        totalWithdrawnUSDT: 0,
        tasksCompletedToday: 0,
        referralCode: generateUnique6DigitReferralCode(users),
        referralCount: 0,
        referralEarningsUSDT: 0,
        joinedDate: new Date().toISOString().split('T')[0],
        processedDepositTxIds: txId ? [txId.trim()] : [],
        lastModified: Date.now(),
      };
      users.push(user);
    } else {
      user.totalDepositedUSDT = Number(((user.totalDepositedUSDT || 0) + exactAmount).toFixed(2));
      if (txId) {
        user.processedDepositTxIds = [...(user.processedDepositTxIds || []), txId.trim()];
      }
      // STRICT RULE: Deposit goes ONLY to totalDepositedUSDT for purchasing VIP plans
      // It is NEVER added to withdrawable totalBalanceUSDT
      user.lastModified = Date.now();
    }
    storage.saveAllUsers(users);
    storage.syncEmailLifetimeBalances(user.email, user.totalBalanceUSDT, user.totalDepositedUSDT, user.vipLevel);
    syncAccountLiveToCloud(user);
    return true;
  },

  /**
   * STRICT ISOLATED MANUAL BALANCE INJECTION:
   * 1. addDepositOnlyToUser:
   * Adds EXACTLY `amount` to user's `totalDepositedUSDT`.
   * Absolutely ZERO change or impact to `totalBalanceUSDT`.
   */
  addDepositOnlyToUser(email: string, amount: number, note?: string, recordTransaction = true): { success: boolean; newDeposit: number; currentBalance: number } {
    const cleanEmail = (email || '').trim().toLowerCase();
    const users = storage.getAllUsers();
    let user = users.find(u => (u.email || '').toLowerCase() === cleanEmail || (u.username || '').toLowerCase() === cleanEmail);
    if (!user) {
      user = users.find(u => {
        const uEmail = (u.email || '').toLowerCase();
        return (uEmail && cleanEmail && (uEmail.includes(cleanEmail) || cleanEmail.includes(uEmail)));
      });
    }
    if (!user) return { success: false, newDeposit: 0, currentBalance: 0 };

    const exactAmount = Number(Math.abs(amount).toFixed(2));
    const currentDeposit = Number(user.totalDepositedUSDT || 0);
    const newDeposit = Number((currentDeposit + exactAmount).toFixed(2));
    
    // STRICT ISOLATION: Modify ONLY totalDepositedUSDT
    user.totalDepositedUSDT = newDeposit;
    user.lastModified = Date.now();
    storage.saveAllUsers(users);
    storage.syncEmailLifetimeBalances(
      user.email, 
      user.totalBalanceUSDT, 
      user.totalDepositedUSDT, 
      user.vipLevel,
      user.tasksCompletedToday,
      user.pendingReferralRewardsUSDT,
      user.referralEarningsUSDT,
      user.completedTaskDays,
      user.withdrawalsCount,
      user.totalWithdrawnUSDT
    );
    syncAccountLiveToCloud(user);

    if (recordTransaction) {
      const tx: Transaction = {
        id: `tx-admin-dep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'deposit',
        amountUSDT: exactAmount,
        status: 'completed',
        description: note || `زيادة رصيد الإيداع إدارياً (+${exactAmount.toFixed(2)} USDT)`,
        timestamp: new Date().toISOString(),
        userEmail: user.email,
        txHash: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
      };
      storage.addTransaction(tx);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('vipads:team_updated'));
      window.dispatchEvent(new CustomEvent('vipads:balance_updated', { 
        detail: { email: user.email, totalDepositedUSDT: newDeposit, totalBalanceUSDT: user.totalBalanceUSDT } 
      }));
    }

    return { success: true, newDeposit, currentBalance: user.totalBalanceUSDT };
  },

  /**
   * STRICT ISOLATED MANUAL BALANCE INJECTION:
   * 2. addBalanceOnlyToUser:
   * Adds EXACTLY `amount` to user's `totalBalanceUSDT`.
   * Absolutely ZERO change or impact to `totalDepositedUSDT`.
   */
  addBalanceOnlyToUser(email: string, amount: number, note?: string, recordTransaction = true): { success: boolean; newBalance: number; currentDeposit: number } {
    const cleanEmail = (email || '').trim().toLowerCase();
    const users = storage.getAllUsers();
    let user = users.find(u => (u.email || '').toLowerCase() === cleanEmail || (u.username || '').toLowerCase() === cleanEmail);
    if (!user) {
      user = users.find(u => {
        const uEmail = (u.email || '').toLowerCase();
        return (uEmail && cleanEmail && (uEmail.includes(cleanEmail) || cleanEmail.includes(uEmail)));
      });
    }
    if (!user) return { success: false, newBalance: 0, currentDeposit: 0 };

    const exactAmount = Number(Math.abs(amount).toFixed(2));
    const currentBalance = Number(user.totalBalanceUSDT || 0);
    const newBalance = Number((currentBalance + exactAmount).toFixed(2));
    
    // STRICT ISOLATION: Modify ONLY totalBalanceUSDT
    user.totalBalanceUSDT = newBalance;
    user.lastModified = Date.now();
    storage.saveAllUsers(users);
    storage.syncEmailLifetimeBalances(
      user.email, 
      user.totalBalanceUSDT, 
      user.totalDepositedUSDT ?? 0, 
      user.vipLevel,
      user.tasksCompletedToday,
      user.pendingReferralRewardsUSDT,
      user.referralEarningsUSDT,
      user.completedTaskDays,
      user.withdrawalsCount,
      user.totalWithdrawnUSDT
    );
    syncAccountLiveToCloud(user);

    if (recordTransaction) {
      const tx: Transaction = {
        id: `tx-admin-bal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'deposit',
        amountUSDT: exactAmount,
        status: 'completed',
        description: note || `زيادة إجمالي الرصيد إدارياً (+${exactAmount.toFixed(2)} USDT)`,
        timestamp: new Date().toISOString(),
        userEmail: user.email,
        txHash: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
      };
      storage.addTransaction(tx);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('vipads:team_updated'));
      window.dispatchEvent(new CustomEvent('vipads:balance_updated', { 
        detail: { email: user.email, totalBalanceUSDT: newBalance, totalDepositedUSDT: user.totalDepositedUSDT ?? 0 } 
      }));
    }

    return { success: true, newBalance, currentDeposit: user.totalDepositedUSDT ?? 0 };
  },

  /**
   * Deduct exclusively from user's deposit balance
   */
  deductDepositOnlyFromUser(email: string, amount: number, note?: string): boolean {
    const cleanEmail = (email || '').trim().toLowerCase();
    const users = storage.getAllUsers();
    let user = users.find(u => (u.email || '').toLowerCase() === cleanEmail || (u.username || '').toLowerCase() === cleanEmail);
    if (!user) return false;
    const exactAmount = Number(Math.abs(amount).toFixed(2));
    user.totalDepositedUSDT = Math.max(0, Number(((user.totalDepositedUSDT || 0) - exactAmount).toFixed(2)));
    user.lastModified = Date.now();
    storage.saveAllUsers(users);
    storage.syncEmailLifetimeBalances(user.email, user.totalBalanceUSDT, user.totalDepositedUSDT, user.vipLevel);
    syncAccountLiveToCloud(user);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('vipads:balance_updated', { 
        detail: { email: user.email, totalDepositedUSDT: user.totalDepositedUSDT, totalBalanceUSDT: user.totalBalanceUSDT } 
      }));
    }
    return true;
  },

  /**
   * Deduct exclusively from user's total balance
   */
  deductBalanceOnlyFromUser(email: string, amount: number, note?: string): boolean {
    const cleanEmail = (email || '').trim().toLowerCase();
    const users = storage.getAllUsers();
    let user = users.find(u => (u.email || '').toLowerCase() === cleanEmail || (u.username || '').toLowerCase() === cleanEmail);
    if (!user) return false;
    const exactAmount = Number(Math.abs(amount).toFixed(2));
    user.totalBalanceUSDT = Math.max(0, Number(((user.totalBalanceUSDT || 0) - exactAmount).toFixed(2)));
    user.lastModified = Date.now();
    storage.saveAllUsers(users);
    storage.syncEmailLifetimeBalances(user.email, user.totalBalanceUSDT, user.totalDepositedUSDT ?? 0, user.vipLevel);
    syncAccountLiveToCloud(user);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('vipads:balance_updated', { 
        detail: { email: user.email, totalBalanceUSDT: user.totalBalanceUSDT, totalDepositedUSDT: user.totalDepositedUSDT ?? 0 } 
      }));
    }
    return true;
  },

  addFundsToUser(email: string, amount: number, note?: string, recordTransaction = true): boolean {
    const cleanEmail = (email || '').trim().toLowerCase();
    const users = storage.getAllUsers();
    let user = users.find(u => (u.email || '').toLowerCase() === cleanEmail || (u.username || '').toLowerCase() === cleanEmail);
    if (!user) {
      user = users.find(u => {
        const uEmail = (u.email || '').toLowerCase();
        return (uEmail && cleanEmail && (uEmail.includes(cleanEmail) || cleanEmail.includes(uEmail)));
      });
    }
    if (!user) return false;

    const exactAmount = Number(Math.abs(amount).toFixed(2));
    // Generic addFundsToUser modifies totalBalanceUSDT ONLY (does NOT inflate deposit)
    user.totalBalanceUSDT = Number(((user.totalBalanceUSDT || 0) + exactAmount).toFixed(2));
    user.lastModified = Date.now();
    storage.saveAllUsers(users);
    storage.syncEmailLifetimeBalances(user.email, user.totalBalanceUSDT, user.totalDepositedUSDT ?? 0, user.vipLevel);
    syncAccountLiveToCloud(user);

    if (recordTransaction) {
      const tx: Transaction = {
        id: `tx-admin-add-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'deposit',
        amountUSDT: exactAmount,
        status: 'completed',
        description: note || `إيداع إداري يدوي مباشر لحساب ${user.email} (+${exactAmount.toFixed(2)} USDT)`,
        timestamp: new Date().toISOString(),
        userEmail: user.email,
        txHash: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
      };
      storage.addTransaction(tx);
    }

    try {
      networkSync.depositFunds(user.email, exactAmount).catch(() => {});
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('vipads:team_updated'));
    }
    return true;
  },

  deductFundsFromUser(email: string, amount: number, note?: string): boolean {
    const cleanEmail = (email || '').trim().toLowerCase();
    const users = storage.getAllUsers();
    let user = users.find(u => (u.email || '').toLowerCase() === cleanEmail || (u.username || '').toLowerCase() === cleanEmail);
    if (!user) {
      user = users.find(u => {
        const uEmail = (u.email || '').toLowerCase();
        return (uEmail && cleanEmail && (uEmail.includes(cleanEmail) || cleanEmail.includes(uEmail)));
      });
    }
    if (!user) return false;

    const exactAmount = Number(Math.abs(amount).toFixed(2));
    user.totalBalanceUSDT = Math.max(0, Number(((user.totalBalanceUSDT || 0) - exactAmount).toFixed(2)));
    user.lastModified = Date.now();
    storage.saveAllUsers(users);
    storage.syncEmailLifetimeBalances(user.email, user.totalBalanceUSDT, user.totalDepositedUSDT ?? 0, user.vipLevel);
    syncAccountLiveToCloud(user);

    const tx: Transaction = {
      id: `tx-admin-deduct-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'withdraw',
      amountUSDT: exactAmount,
      status: 'completed',
      description: note || `خصم رصيد إداري مباشر من حساب ${user.email} (-${exactAmount.toFixed(2)} USDT)`,
      timestamp: new Date().toISOString(),
      userEmail: user.email,
      txHash: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
    storage.addTransaction(tx);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('vipads:team_updated'));
    }
    return true;
  },

  // --- USER NOTIFICATIONS & INBOX SYSTEM ---
  getUserNotifications(email?: string): SystemNotification[] {
    try {
      const targetEmail = (email || storage.getCurrentUserEmail() || '').trim().toLowerCase();
      if (!targetEmail) return [];
      const raw = localStorage.getItem(`vipads_notifications_${targetEmail}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Strictly filter out any mock/seed notifications (such as the 50.00 USDT test deposit)
          const clean = parsed.filter((n: any) => 
            !n.id?.startsWith('notif-seed-') && 
            !(n.amount === 50 && n.type === 'deposit_approved' && n.id?.includes('seed'))
          );
          if (clean.length !== parsed.length) {
            try {
              localStorage.setItem(`vipads_notifications_${targetEmail}`, JSON.stringify(clean));
            } catch {}
          }
          return clean;
        }
      }
      
      // Strict Production Rule: Inbox is 100% EMPTY for any new user.
      // Notifications only appear when actual real transactions/actions occur (e.g. approved deposit, approved withdrawal, referral commission).
      return [];
    } catch (e) {
      console.warn('Failed to load user notifications:', e);
      return [];
    }
  },

  saveUserNotifications(email: string, notifications: SystemNotification[]): void {
    try {
      const targetEmail = (email || '').trim().toLowerCase();
      if (!targetEmail) return;
      const key = `vipads_notifications_${targetEmail}`;
      const nextRaw = JSON.stringify(notifications);
      const prevRaw = localStorage.getItem(key);
      if (prevRaw === nextRaw) {
        return; // Identical, avoid redundant state updates and event dispatch
      }
      localStorage.setItem(key, nextRaw);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vipads_notifications_changed', { detail: { email: targetEmail } }));
      }
    } catch (e) {
      console.warn('Failed to save user notifications:', e);
    }
  },

  addNotificationForUser(
    email: string, 
    notification: Omit<SystemNotification, 'id' | 'timestamp' | 'read'> & { id?: string; timestamp?: string | Date; read?: boolean; userId?: string }
  ): SystemNotification {
    const targetEmail = (email || '').trim().toLowerCase();
    const currentList = storage.getUserNotifications(targetEmail);
    const newNotif: SystemNotification = {
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      badgeLabel: notification.badgeLabel,
      amount: notification.amount,
      vipLevel: notification.vipLevel,
      userId: notification.userId,
      timestamp: notification.timestamp ? new Date(notification.timestamp).toISOString() : new Date().toISOString(),
      read: notification.read ?? false,
      userEmail: targetEmail
    };

    const updated = [newNotif, ...currentList.filter((n) => n.id !== newNotif.id)];
    storage.saveUserNotifications(targetEmail, updated);

    // Live Real-time Broadcast to Firestore & Unified Server DB
    try {
      firebaseSync.recordNotificationLive(newNotif).catch(() => {});
    } catch {}
    try {
      networkSync.postNotification(newNotif).catch(() => {});
    } catch {}

    return newNotif;
  },

  markNotificationAsRead(email: string, notifId: string): void {
    const targetEmail = (email || '').trim().toLowerCase();
    const current = storage.getUserNotifications(targetEmail);
    const updated = current.map(n => n.id === notifId ? { ...n, read: true } : n);
    storage.saveUserNotifications(targetEmail, updated);

    try {
      firebaseSync.markNotificationReadLive(notifId).catch(() => {});
      fetch('/api/network/notification/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifId, email: targetEmail }),
      }).catch(() => {});
    } catch {}
  },

  markAllNotificationsAsRead(email: string): void {
    const targetEmail = (email || '').trim().toLowerCase();
    const current = storage.getUserNotifications(targetEmail);
    const updated = current.map(n => ({ ...n, read: true }));
    storage.saveUserNotifications(targetEmail, updated);

    try {
      firebaseSync.markAllNotificationsReadLive(targetEmail).catch(() => {});
      fetch('/api/network/notification/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      }).catch(() => {});
    } catch {}
  },

  deleteNotification(email: string, notifId: string): void {
    const targetEmail = (email || '').trim().toLowerCase();
    const current = storage.getUserNotifications(targetEmail);
    const updated = current.filter(n => n.id !== notifId);
    storage.saveUserNotifications(targetEmail, updated);

    try {
      firebaseSync.deleteNotificationLive(notifId).catch(() => {});
      fetch('/api/network/notification/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifId, email: targetEmail }),
      }).catch(() => {});
    } catch {}
  },

  clearAllNotifications(email: string): void {
    const targetEmail = (email || '').trim().toLowerCase();
    storage.saveUserNotifications(targetEmail, []);

    try {
      fetch('/api/network/notification/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearAll: true, email: targetEmail }),
      }).catch(() => {});
    } catch {}
  },

  getUnreadNotificationsCount(email?: string): number {
    const targetEmail = (email || storage.getCurrentUserEmail() || '').trim().toLowerCase();
    const notifs = storage.getUserNotifications(targetEmail);
    return notifs.filter(n => !n.read).length;
  },

  // --- MASTER FACTORY RESET (PRODUCTION RESET: PURGE ALL TEST DATA, ZERO ADMIN TO BRAND NEW STATE) ---
  factoryReset(): void {
    try {
      const cleanAdmin: StoredAccount = {
        id: 'ADMIN-001',
        email: 'free@gmail.com',
        username: 'free@gmail.com',
        password: '000000',
        walletAddress: '',
        vipLevel: 0,
        totalBalanceUSDT: 0.00,
        totalDepositedUSDT: 0.00,
        taskEarningsToday: 0.00,
        totalWithdrawnUSDT: 0.00,
        tasksCompletedToday: 0,
        referralCode: '885101',
        referralCount: 0,
        referralEarningsUSDT: 0.00,
        pendingReferralRewardsUSDT: 0.00,
        tier1TaskCommissionUSDT: 0.00,
        tier2TaskCommissionUSDT: 0.00,
        tier3TaskCommissionUSDT: 0.00,
        joinedDate: '2026-08-28',
      };

      // Wipe test accounts and legacy keys from localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (!k) continue;
          if (k.startsWith('vipads_lifetime_balance_')) {
            localStorage.removeItem(k);
          } else if (k.startsWith('vipads_user_tasks_')) {
            localStorage.removeItem(k);
          } else if (k.startsWith('vipads_user_pass_') && !k.includes('free@gmail.com')) {
            localStorage.removeItem(k);
          } else if (k.startsWith('vipads_notifications_')) {
            localStorage.removeItem(k);
          } else if (k.startsWith('vipads_task_history_')) {
            localStorage.removeItem(k);
          }
        }
        localStorage.removeItem('vipads_approved_tx_ids');
        localStorage.setItem('vipads_lifetime_balance_free@gmail.com', JSON.stringify({
          email: 'free@gmail.com',
          totalBalanceUSDT: 0.00,
          totalDepositedUSDT: 0.00,
          vipLevel: 0,
          tasksCompletedToday: 0,
          lastUpdated: Date.now()
        }));
      }

      storage.saveAllUsers([cleanAdmin]);
      storage.saveAllTransactions([]);

      // Reset server network store
      try {
        fetch('/api/network/factory-reset', { method: 'POST' }).catch(() => {});
      } catch {}
    } catch (e) {
      console.warn('Production reset error:', e);
    }
  }
};

