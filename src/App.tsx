/**
 * Crypto VIP Task & Video Ads Platform
 * Ultra-Premium Dark Theme with Neon Orange & Electric Blue Accents
 */
import React, { useState, useEffect, useRef } from 'react';
import { 
  triggerTaskConfetti, 
  triggerMilestoneConfetti, 
  triggerVIPUpgradeConfetti, 
  triggerReferralBonusConfetti 
} from './utils/confetti';
import { 
  NavTab, 
  UserProfile, 
  VIPPlan, 
  VideoTask, 
  Transaction, 
  ToastNotificationData,
  ReferredMember,
  ReferralMilestone,
  SystemNotification
} from './types';
import { 
  INITIAL_USER_PROFILE, 
  INITIAL_VIP_PLANS, 
  INITIAL_VIDEO_TASKS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_REFERRED_MEMBERS,
  INITIAL_REFERRAL_MILESTONES,
  DIRECT_AD_URL 
} from './data/initialData';
import { formatUSDT } from './utils/formatters';
import { soundEngine } from './utils/audio';
import { storage, StoredAccount } from './utils/storage';
import { networkSync } from './utils/networkSync';
import { firebaseSync, auth } from './utils/firebaseSync';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { purgeReferralQueriesFromUrl, hasReferralParamInUrl } from './utils/urlHelper';
import { registerAccountDeviceSilent } from './utils/securityFraud';
import { useLanguage } from './context/LanguageContext';
import { HeaderNav } from './components/HeaderNav';
import { HeroHeader } from './components/HeroHeader';
import { VIPPlansSection } from './components/VIPPlansSection';
import { VideoTasksSection } from './components/VideoTasksSection';
import { BottomNavBar } from './components/BottomNavBar';
import { WalletView } from './components/Views/WalletView';
import { ProfileView } from './components/Views/ProfileView';
import { TeamView } from './components/Views/TeamView';
import { DepositModal } from './components/Modals/DepositModal';
import { WithdrawModal } from './components/Modals/WithdrawModal';
import { VIPUpgradeModal } from './components/Modals/VIPUpgradeModal';
import { ToastNotification } from './components/ToastNotification';
import { AuthScreen } from './components/AuthScreen';
import { AdBannersCarousel } from './components/AdBannersCarousel';
import { SponsorAdBannerCard } from './components/SponsorAdBannerCard';
import { UserAdminControlModal } from './components/Modals/UserAdminControlModal';
import { VipLockWarningModal } from './components/Modals/VipLockWarningModal';
import { ElegantRulePopupModal, ElegantPopupType } from './components/Modals/ElegantRulePopupModal';
import { CenterActivationModal } from './components/Modals/CenterActivationModal';
import { InactivityWarningModal } from './components/Modals/InactivityWarningModal';
import { SupportCommunityModal } from './components/Modals/SupportCommunityModal';
import { InsufficientDepositModal } from './components/Modals/InsufficientDepositModal';
import { WithdrawalProofsView } from './components/WithdrawalProofsView';
import { BlockchainSimulatorOverlay } from './components/Modals/BlockchainSimulatorOverlay';
import { PremiumWelcomeModal } from './components/Modals/PremiumWelcomeModal';
import { InboxModal } from './components/Modals/InboxModal';
import { FloatingSupportWidget } from './components/FloatingSupportWidget';
import { FloatingLanguageWidget } from './components/FloatingLanguageWidget';
import { TaskRewardSuccessModal } from './components/Modals/TaskRewardSuccessModal';
import { NavigationSidebar } from './components/NavigationSidebar';
import { TabTransitionMicroLoader } from './components/TabTransitionMicroLoader';

export default function App() {
  const { t, language } = useLanguage();

  // Authentication State with Permanent Active Session Keep-Alive Shield
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return true;

      const storedLoggedIn = localStorage.getItem('vipads_is_logged_in');
      const currentEmail = storage.getCurrentUserEmail();

      // 1. ACTIVE SESSION LIFETIME ENFORCER (تثبيت الجلسات مدى الحياة ومنع الخروج التلقائي عند التنشيط):
      // إذا كان المستخدم مسجل دخول ولديه بريد جلسة نشط، تظل الجلسة نشطة دائماً وأبداً
      if (storedLoggedIn === 'true' && currentEmail) {
        if (hasReferralParamInUrl()) {
          purgeReferralQueriesFromUrl();
        }
        return true;
      }

      // 2. Explicit Manual Logout: مستخدم سجل خروج يدوياً وبشكل صريح
      if (storedLoggedIn === 'false') {
        return false;
      }

      // 3. New visitor: زائر جديد بدون جلسة سابقة
      if (storedLoggedIn === null) {
        return false;
      }

      return storedLoggedIn === 'true';
    } catch {
      return false;
    }
  });

  // Active Session Enforcer: Clean address bar URL immediately whenever logged in
  useEffect(() => {
    if (isLoggedIn && hasReferralParamInUrl()) {
      purgeReferralQueriesFromUrl();
    }
  }, [isLoggedIn]);

  // Firebase Auth State Observer: Ensure persistent Google / Firebase authenticated session
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        const email = firebaseUser.email.toLowerCase().trim();
        const photo = firebaseUser.photoURL;
        if (photo) {
          try {
            localStorage.setItem(`vipads_user_avatar_${email}`, photo);
          } catch {}
          storage.updateUser(email, { avatarUrl: photo, photoURL: photo });
          setUser((prev) => ({ ...prev, avatarUrl: photo, photoURL: photo }));
        }

        const currentEmail = storage.getCurrentUserEmail();
        if (!currentEmail || currentEmail !== email) {
          if (!storage.userExists(email)) {
            storage.registerNewUser(email, firebaseUser.displayName || email.split('@')[0]);
          }
          storage.setCurrentUserEmail(email);
          try {
            localStorage.setItem('vipads_is_logged_in', 'true');
            localStorage.setItem('vipads_user_registered', 'true');
          } catch {}
          setIsLoggedIn(true);
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // State management with Hardcore LocalStorage Rehydration & Forced Home Tab Standby
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedTab = sessionStorage.getItem('vipads_active_tab');
        // If the user refreshed or if savedTab was 'home' or not set: lock 100% to 'home'
        // Strictly forbid automatically redirecting or moving them to 'team' (referral) or any other page upon refresh
        if (!savedTab || savedTab === 'home' || savedTab === 'team') {
          try {
            sessionStorage.setItem('vipads_active_tab', 'home');
          } catch {}
          return 'home';
        }
        return savedTab as NavTab;
      }
    } catch {}
    return 'home';
  });
  const [user, setUser] = useState<UserProfile>(() => {
    const currentEmail = storage.getCurrentUserEmail();
    const stored = storage.getUserByEmail(currentEmail);
    if (stored) {
      const userTasks = storage.getUserTasks(currentEmail);
      const countFromTasks = userTasks.filter(t => t.completedToday).length;
      const tasksCompleted = Math.max(stored.tasksCompletedToday || 0, countFromTasks);

      return {
        username: stored.username,
        userId: stored.id,
        email: stored.email,
        walletAddress: (stored.walletAddress && stored.walletAddress !== 'TYqQwVENsSVVeSTNks31SyxStHV8x5HXSZ') ? stored.walletAddress : '',
        vipLevel: stored.vipLevel,
        totalBalanceUSDT: stored.totalBalanceUSDT,
        totalDepositedUSDT: storage.getTotalDepositedForUser(stored.email),
        taskEarningsToday: stored.taskEarningsToday,
        totalWithdrawnUSDT: stored.totalWithdrawnUSDT,
        tasksCompletedToday: tasksCompleted,
        completedTaskDays: stored.completedTaskDays || 0,
        withdrawalsCount: stored.withdrawalsCount || 0,
        referralCode: stored.referralCode,
        referralCount: stored.referralCount,
        referralEarningsUSDT: stored.referralEarningsUSDT,
        pendingReferralRewardsUSDT: stored.pendingReferralRewardsUSDT ?? 0,
        tier1TaskCommissionUSDT: stored.tier1TaskCommissionUSDT || 0,
        tier2TaskCommissionUSDT: stored.tier2TaskCommissionUSDT || 0,
        tier3TaskCommissionUSDT: stored.tier3TaskCommissionUSDT || 0,
        joinedDate: stored.joinedDate,
        vipActivatedAt: stored.vipActivatedAt,
        vipExpiresAt: stored.vipExpiresAt,
        avatarUrl: stored.avatarUrl || (typeof localStorage !== 'undefined' ? localStorage.getItem(`vipads_user_avatar_${stored.email}`) || undefined : undefined),
        photoURL: stored.photoURL || stored.avatarUrl || (typeof localStorage !== 'undefined' ? localStorage.getItem(`vipads_user_avatar_${stored.email}`) || undefined : undefined),
      };
    }
    return INITIAL_USER_PROFILE;
  });
  const [vipPlans] = useState<VIPPlan[]>(INITIAL_VIP_PLANS);
  const [tasks, setTasks] = useState<VideoTask[]>(() => {
    const currentEmail = storage.getCurrentUserEmail();
    return storage.getUserTasks(currentEmail);
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => storage.getAllTransactions());
  const [referredMembers, setReferredMembers] = useState<ReferredMember[]>(() => {
    const currentEmail = storage.getCurrentUserEmail();
    const stored = storage.getUserByEmail(currentEmail);
    if (stored && stored.referralCode) {
      return storage.getReferredMembersForUser(stored.referralCode);
    }
    return [];
  });
  const [referralMilestones, setReferralMilestones] = useState<ReferralMilestone[]>(INITIAL_REFERRAL_MILESTONES);
  const [isMuted, setIsMuted] = useState(false);

  // Automatic Immediate Video Tasks Persistence to localStorage
  useEffect(() => {
    const currentEmail = storage.getCurrentUserEmail();
    storage.saveUserTasks(currentEmail, tasks);
  }, [tasks]);

  // Automatic Immediate Persistence to localStorage with Initial Mount Guard
  const isInitialUserMount = useRef(true);
  const isSyncingFromStorageRef = useRef(false);
  useEffect(() => {
    if (isInitialUserMount.current) {
      isInitialUserMount.current = false;
      return;
    }
    if (isSyncingFromStorageRef.current) {
      isSyncingFromStorageRef.current = false;
      return;
    }
    const currentEmail = storage.getCurrentUserEmail();
    if (!currentEmail) return;
    const existing = storage.getUserByEmail(currentEmail);
    if (!existing) return;

    // Check if any state field differs from existing storage data before saving
    const hasRealChange = 
      existing.username !== user.username ||
      existing.walletAddress !== user.walletAddress ||
      existing.vipLevel !== user.vipLevel ||
      Math.abs((existing.totalBalanceUSDT || 0) - (user.totalBalanceUSDT || 0)) > 0.001 ||
      Math.abs((existing.totalDepositedUSDT || 0) - (user.totalDepositedUSDT ?? existing.totalDepositedUSDT ?? 0)) > 0.001 ||
      existing.tasksCompletedToday !== user.tasksCompletedToday ||
      existing.taskEarningsToday !== user.taskEarningsToday ||
      Math.abs((existing.totalWithdrawnUSDT || 0) - (user.totalWithdrawnUSDT || 0)) > 0.001 ||
      existing.referralCount !== user.referralCount ||
      existing.vipExpiresAt !== user.vipExpiresAt;

    if (!hasRealChange) {
      return;
    }

    storage.saveUser({
      ...existing,
      username: user.username,
      email: user.email || existing.email,
      walletAddress: user.walletAddress,
      vipLevel: user.vipLevel,
      totalBalanceUSDT: user.totalBalanceUSDT,
      totalDepositedUSDT: user.totalDepositedUSDT !== undefined ? user.totalDepositedUSDT : existing.totalDepositedUSDT,
      taskEarningsToday: user.taskEarningsToday,
      totalWithdrawnUSDT: user.totalWithdrawnUSDT,
      tasksCompletedToday: user.tasksCompletedToday,
      completedTaskDays: user.completedTaskDays,
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      referralEarningsUSDT: user.referralEarningsUSDT,
      pendingReferralRewardsUSDT: user.pendingReferralRewardsUSDT,
      tier1TaskCommissionUSDT: user.tier1TaskCommissionUSDT,
      tier2TaskCommissionUSDT: user.tier2TaskCommissionUSDT,
      tier3TaskCommissionUSDT: user.tier3TaskCommissionUSDT,
      joinedDate: user.joinedDate,
      vipActivatedAt: user.vipActivatedAt,
      vipExpiresAt: user.vipExpiresAt,
    });

    // Silent background device registration for existing & returning accounts
    if (user.email) {
      registerAccountDeviceSilent(user.email, user.referralCode);
    }
  }, [user]);

  // Synchronize live team size and referral statistics when new registrations or updates occur
  const syncTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const handleSync = () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        const currentEmail = storage.getCurrentUserEmail();
        if (!currentEmail) return;
        const updated = storage.getUserByEmail(currentEmail);
        if (!updated) return;

        setUser((prev) => {
          const updatedDep = typeof updated.totalDepositedUSDT === 'number' ? updated.totalDepositedUSDT : (prev.totalDepositedUSDT || 0);
          const prevDep = typeof prev.totalDepositedUSDT === 'number' ? prev.totalDepositedUSDT : 0;
          const nextDep = updatedDep;

          const updatedEarnings = typeof updated.referralEarningsUSDT === 'number' ? updated.referralEarningsUSDT : (prev.referralEarningsUSDT || 0);
          const prevEarnings = typeof prev.referralEarningsUSDT === 'number' ? prev.referralEarningsUSDT : 0;
          const nextEarnings = updatedEarnings;

          const updatedPending = typeof updated.pendingReferralRewardsUSDT === 'number' ? updated.pendingReferralRewardsUSDT : (prev.pendingReferralRewardsUSDT || 0);
          const prevPending = typeof prev.pendingReferralRewardsUSDT === 'number' ? prev.pendingReferralRewardsUSDT : 0;

          const updatedVip = typeof updated.vipLevel === 'number' ? updated.vipLevel : (prev.vipLevel || 0);
          const prevVip = typeof prev.vipLevel === 'number' ? prev.vipLevel : 0;
          const nextVip = updatedVip;

          const updatedRefs = typeof updated.referralCount === 'number' ? updated.referralCount : 0;
          const prevRefs = typeof prev.referralCount === 'number' ? prev.referralCount : 0;

          const updatedBal = typeof updated.totalBalanceUSDT === 'number' ? updated.totalBalanceUSDT : prev.totalBalanceUSDT;

          const changed = 
            prevRefs !== updatedRefs ||
            Math.abs(prev.totalBalanceUSDT - updatedBal) > 0.001 ||
            Math.abs(prevDep - nextDep) > 0.001 ||
            Math.abs(prevEarnings - nextEarnings) > 0.001 ||
            Math.abs(prevPending - updatedPending) > 0.001 ||
            prevVip !== nextVip;

          if (changed) {
            isSyncingFromStorageRef.current = true;
            return {
              ...prev,
              referralCount: updatedRefs,
              totalBalanceUSDT: updatedBal,
              totalDepositedUSDT: nextDep,
              referralEarningsUSDT: nextEarnings,
              pendingReferralRewardsUSDT: updatedPending,
              vipLevel: nextVip,
            };
          }
          return prev;
        });

        if (updated.referralCode) {
          const newMembers = storage.getReferredMembersForUser(updated.referralCode);
          setReferredMembers((prev) => {
            if (prev.length === newMembers.length) {
              const hasDiff = prev.some((pm, i) => {
                const nm = newMembers[i];
                return !nm || pm.id !== nm.id || pm.vipTier !== nm.vipTier || pm.status !== nm.status;
              });
              if (!hasDiff) return prev;
            }
            return newMembers;
          });
        }

        const latestTxs = storage.getAllTransactions();
        setTransactions((prev) => {
          if (prev.length === latestTxs.length) {
            const hasDiff = prev.some((ptx, i) => {
              const ntx = latestTxs[i];
              return !ntx || ptx.id !== ntx.id || ptx.status !== ntx.status || ptx.amountUSDT !== ntx.amountUSDT;
            });
            if (!hasDiff) return prev;
          }
          return latestTxs;
        });
      }, 300);
    };

    // Initialize Network Sync Engine for live cross-browser link synchronization
    networkSync.init(handleSync);

    // Initialize Firebase Real-Time Firestore Live Stream (بث مباشر بين المنشور والمعاينة)
    const unsubscribeFirebase = firebaseSync.startLiveStream(() => {
      handleSync();
    });

    window.addEventListener('storage', handleSync);
    window.addEventListener('vipads:team_updated', handleSync);
    window.addEventListener('vipads_accounts_updated', handleSync);
    window.addEventListener('vipads_transactions_changed', handleSync);
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      networkSync.destroy();
      unsubscribeFirebase();
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('vipads:team_updated', handleSync);
      window.removeEventListener('vipads_accounts_updated', handleSync);
      window.removeEventListener('vipads_transactions_changed', handleSync);
    };
  }, []);

  // OS-Level Theme Preference Detection & Strict Obsidian Dark Theme Enforcement
  useEffect(() => {
    // Strictly force dark theme on html & body
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    document.body.classList.add('bg-[#0A0B10]', 'text-white');

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      
      const enforceObsidianDarkTheme = () => {
        // Enforce dark mode regardless of OS preference
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.body.classList.add('bg-[#0A0B10]', 'text-white');
      };

      enforceObsidianDarkTheme();

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', enforceObsidianDarkTheme);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(enforceObsidianDarkTheme);
      }

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', enforceObsidianDarkTheme);
        } else if (mediaQuery.removeListener) {
          mediaQuery.removeListener(enforceObsidianDarkTheme);
        }
      };
    }
  }, []);

  // Active 10-second timers: { [taskId: string]: remainingSeconds }
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});
  const timerIntervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const completedTasksLockRef = useRef<Set<string>>(new Set());
  const lastDepositSubmissionRef = useRef<{ time: number; amount: number; userEmail: string } | null>(null);
  const processingApprovalTxIdsRef = useRef<Set<string>>(new Set());

  // Modals state
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositTarget, setDepositTarget] = useState<{ name?: string; price?: number } | null>(null);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState<VIPPlan | null>(null);
  const [insufficientDepositPlan, setInsufficientDepositPlan] = useState<VIPPlan | null>(null);
  const [isAdminControlOpen, setIsAdminControlOpen] = useState(false);
  const [isVipLockModalOpen, setIsVipLockModalOpen] = useState(false);
  const [isCenterActivationOpen, setIsCenterActivationOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [elegantRulePopup, setElegantRulePopup] = useState<ElegantPopupType | null>(null);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Center Luxury Task Reward Success Modal (Replaces top black toast)
  const [taskRewardModal, setTaskRewardModal] = useState<{
    isOpen: boolean;
    rewardAmount: number;
    remainingTasksToday: number;
    newBalance?: number;
  }>({
    isOpen: false,
    rewardAmount: 0.09,
    remainingTasksToday: 0,
    newBalance: 0,
  });

  // VIP2 Work Days Lock Alert state
  const [workDaysProgress, setWorkDaysProgress] = useState<number>(0);
  const [workDaysTarget, setWorkDaysTarget] = useState<number>(5);

  // Phone / Browser Back Button Handling (popstate navigation)
  const isPopStateRef = useRef(false);

  useEffect(() => {
    // Initial state push so back button has an entry
    if (typeof window !== 'undefined' && window.history) {
      if (!window.history.state || !window.history.state.tab || window.history.state.tab === 'team') {
        window.history.replaceState({ tab: activeTab }, '', window.location.href);
      }
    }

    const handlePopState = (event: PopStateEvent) => {
      // 1. If any modal is open, close the modal first as a back step
      if (taskRewardModal.isOpen) {
        setTaskRewardModal((prev) => ({ ...prev, isOpen: false }));
        return;
      }
      if (isWelcomeModalOpen) {
        setIsWelcomeModalOpen(false);
        setActiveTab('home');
        try {
          sessionStorage.setItem('vipads_active_tab', 'home');
        } catch {}
        return;
      }
      if (isDepositOpen) {
        setIsDepositOpen(false);
        return;
      }
      if (isWithdrawOpen) {
        setIsWithdrawOpen(false);
        return;
      }
      if (isSupportOpen) {
        setIsSupportOpen(false);
        return;
      }
      if (isInboxOpen) {
        setIsInboxOpen(false);
        return;
      }
      if (isAdminControlOpen) {
        setIsAdminControlOpen(false);
        return;
      }
      if (isVipLockModalOpen) {
        setIsVipLockModalOpen(false);
        return;
      }
      if (isCenterActivationOpen) {
        setIsCenterActivationOpen(false);
        return;
      }
      if (elegantRulePopup) {
        setElegantRulePopup(null);
        return;
      }
      if (selectedPlanToUpgrade) {
        setSelectedPlanToUpgrade(null);
        return;
      }

      // 2. If no modal is open, navigate tabs
      const stateTab = (event.state && event.state.tab) as NavTab | undefined;
      isPopStateRef.current = true;
      if (stateTab && stateTab !== 'team') {
        setActiveTab(stateTab);
        try {
          sessionStorage.setItem('vipads_active_tab', stateTab);
        } catch {}
      } else {
        // Default back to home
        setActiveTab('home');
        try {
          sessionStorage.setItem('vipads_active_tab', 'home');
        } catch {}
      }
      setTimeout(() => {
        isPopStateRef.current = false;
      }, 50);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [
    taskRewardModal.isOpen,
    isWelcomeModalOpen,
    isDepositOpen,
    isWithdrawOpen,
    isSupportOpen,
    isInboxOpen,
    isAdminControlOpen,
    isVipLockModalOpen,
    isCenterActivationOpen,
    elegantRulePopup,
    selectedPlanToUpgrade,
    activeTab
  ]);

  // Hydration state for micro-visual feedback on tab switch or data hydration
  const [isSectionHydrating, setIsSectionHydrating] = useState<boolean>(false);

  // Push new history entry whenever user navigates tab directly with zero lag and instant scroll reset
  const handleSelectTab = (newTab: NavTab) => {
    if (newTab === activeTab) return;

    try {
      sessionStorage.setItem('vipads_active_tab', newTab);
    } catch {}
    if (typeof window !== 'undefined' && window.history && !isPopStateRef.current) {
      window.history.pushState({ tab: newTab }, '', window.location.href);
    }

    if (newTab === 'vip' || newTab === 'tasks') {
      setIsSectionHydrating(true);
      setTimeout(() => {
        setIsSectionHydrating(false);
      }, 140);
    }

    setActiveTab(newTab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };
  // (Notifications state and live update listeners are fully decoupled and isolated inside InboxModal & HeaderNav to prevent App.tsx re-renders)
  const handleOpenInbox = () => {
    setIsInboxOpen(true);
  };

  // --- AUTOMATIC 24-HOUR / DAILY TASK RENEWAL LIFECYCLE ---
  useEffect(() => {
    if (!isLoggedIn) return;

    const currentEmail = (user.email || user.username || storage.getCurrentUserEmail() || '').trim().toLowerCase();
    if (!currentEmail) return;

    const performDailyCheckAndReset = () => {
      const didReset = storage.checkAndResetDailyTasks(currentEmail);
      if (didReset) {
        // Daily reset triggered!
        const refreshedUser = storage.getUserByEmail(currentEmail);
        if (refreshedUser) {
          setUser((prev) => ({
            ...prev,
            tasksCompletedToday: 0,
            taskEarningsToday: 0,
            lastTasksResetTimestamp: refreshedUser.lastTasksResetTimestamp,
            lastTasksResetDate: refreshedUser.lastTasksResetDate,
          }));
        }
        setTasks(storage.getUserTasks(currentEmail));
        completedTasksLockRef.current.clear();

        showToast(
          language === 'ar' ? 'تجديد المهام اليومية' : 'Daily Tasks Renewed',
          language === 'ar' 
            ? 'تم تجديد الـ 10 مهام اليومية بالكامل أوتوماتيكياً! استمتع بمشاهدة الإعلانات وكسب الأرباح 🚀' 
            : 'Your 10 daily tasks have been automatically renewed! Enjoy watching and earning 🚀',
          'success'
        );
      }
    };

    // 1. Check immediately on mount/login
    performDailyCheckAndReset();

    // 2. Periodic background check every 30 seconds (skipped when tab hidden to preserve mobile battery & CPU)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      performDailyCheckAndReset();
    }, 30000);

    // 3. Check on window focus and visibility change (e.g. coming back after 24 hours)
    const handleFocus = () => performDailyCheckAndReset();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // 4. Listen for custom daily tasks reset event
    const handleResetEvent = () => {
      const refreshedUser = storage.getUserByEmail(currentEmail);
      if (refreshedUser) {
        setUser((prev) => ({
          ...prev,
          tasksCompletedToday: 0,
          taskEarningsToday: 0,
        }));
      }
      setTasks(storage.getUserTasks(currentEmail));
      completedTasksLockRef.current.clear();
    };
    window.addEventListener('vipads:daily_tasks_reset', handleResetEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('vipads:daily_tasks_reset', handleResetEvent);
    };
  }, [isLoggedIn, user.email, language]);

  // Auto-trigger welcome modal for fresh users on initial registration/login
  useEffect(() => {
    if (!isLoggedIn) return;
    try {
      const currentEmail = storage.getCurrentUserEmail();
      if (!currentEmail) return;
      const seenKey = `vipads_welcome_seen_${currentEmail.toLowerCase()}`;
      const hasSeen = localStorage.getItem(seenKey);
      if (!hasSeen) {
        // Show after a slight delay for smooth aesthetic entrance
        const timer = setTimeout(() => {
          setIsWelcomeModalOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn(e);
    }
  }, [isLoggedIn]);

  const handleCloseWelcomeModal = () => {
    try {
      const currentEmail = storage.getCurrentUserEmail();
      if (currentEmail) {
        localStorage.setItem(`vipads_welcome_seen_${currentEmail.toLowerCase()}`, 'true');
      }
    } catch (e) {
      console.warn(e);
    }
    setIsWelcomeModalOpen(false);
    // Explicitly land on clean Home page as requested
    setActiveTab('home');
  };

  const handleStartEarningFromWelcome = () => {
    // Close welcome modal and land cleanly on the Home page only
    handleCloseWelcomeModal();
    setActiveTab('home');
    soundEngine.playSuccess();
  };

  // Floating Toast Notification
  const [toast, setToast] = useState<ToastNotificationData | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Current active VIP Plan
  const currentVipPlan = vipPlans.find((p) => p.level === user.vipLevel) || vipPlans[0];
  const getNextPlanToUpgrade = (): VIPPlan => {
    const nextLevel = user.vipLevel < 10 ? user.vipLevel + 1 : 10;
    return vipPlans.find((p) => p.level === nextLevel) || vipPlans[1] || vipPlans[0];
  };

  // Sound toggle handler
  const handleToggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    soundEngine.setMuted(newMute);
  };

  // Login handler
  const handleLogin = (credentials: { identifier: string; isNewUser?: boolean }) => {
    setIsLoggedIn(true);
    try {
      localStorage.setItem('vipads_is_logged_in', 'true');
      localStorage.setItem('vipads_user_registered', 'true');
      purgeReferralQueriesFromUrl();
    } catch (e) {
      console.warn(e);
    }

    const cleanEmail = credentials.identifier.trim().toLowerCase();
    storage.setCurrentUserEmail(cleanEmail);

    let account = storage.getUserByEmail(cleanEmail);
    if (!account) {
      const reg = storage.registerNewUser(cleanEmail);
      account = reg.user || null;
    }

    if (account) {
      setUser({
        username: account.username,
        userId: account.id,
        email: account.email,
        walletAddress: account.walletAddress,
        vipLevel: account.vipLevel,
        totalBalanceUSDT: account.totalBalanceUSDT,
        totalDepositedUSDT: storage.getTotalDepositedForUser(account.email),
        taskEarningsToday: account.taskEarningsToday,
        totalWithdrawnUSDT: account.totalWithdrawnUSDT,
        tasksCompletedToday: account.tasksCompletedToday,
        completedTaskDays: (cleanEmail === 'free@gmail.com' || account.email?.toLowerCase() === 'free@gmail.com') ? 10 : (account.completedTaskDays || 0),
        withdrawalsCount: account.withdrawalsCount || 0,
        referralCode: account.referralCode,
        referralCount: account.referralCount,
        referralEarningsUSDT: account.referralEarningsUSDT,
        pendingReferralRewardsUSDT: account.pendingReferralRewardsUSDT || 0,
        tier1TaskCommissionUSDT: account.tier1TaskCommissionUSDT || 0,
        tier2TaskCommissionUSDT: account.tier2TaskCommissionUSDT || 0,
        tier3TaskCommissionUSDT: account.tier3TaskCommissionUSDT || 0,
        joinedDate: account.joinedDate,
        vipActivatedAt: account.vipActivatedAt,
        vipExpiresAt: account.vipExpiresAt,
      });
      setReferredMembers(storage.getReferredMembersForUser(account.referralCode));
      setTasks(storage.getUserTasks(account.email));
    }
    setTransactions(storage.getAllTransactions());
    setActiveTab('home');

    if (credentials.isNewUser) {
      setIsWelcomeModalOpen(true);
      showToast(
        t('auth.login_success_title'),
        language === 'ar' ? 'تم إنشاء الحساب بنجاح! رصيدك الابتدائي 0.00 USDT مع 10 مهام متاحة.' : 'Account registered successfully!',
        'success'
      );
    } else {
      showToast(
        t('auth.login_success_title'),
        t('auth.login_success_desc'),
        'success'
      );
    }
  };

  // Auto-Logout Security System: 30 minutes inactivity timeout with 60s countdown warning modal
  const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  const WARNING_BEFORE_TIMEOUT_MS = 60 * 1000; // 60 seconds
  const WARNING_THRESHOLD_MS = INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_TIMEOUT_MS; // 29 minutes (1740s)

  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [inactivitySecondsLeft, setInactivitySecondsLeft] = useState(60);
  const lastActivityTimeRef = useRef<number>(Date.now());

  // Dynamic Blockchain Simulator Loading State (محاكي الاتصال الحقيقي بالسيرفر وشبكة البلوكتشين)
  const [blockchainSimState, setBlockchainSimState] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    network?: string;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    network: 'TRC20 / BEP20 Smart Contract',
  });

  // Logout handler
  const handleLogout = (isAutoInactivity: boolean = false) => {
    setIsLoggedIn(false);
    setShowInactivityWarning(false);
    try {
      signOut(auth).catch(() => {});
      localStorage.setItem('vipads_is_logged_in', 'false');
      localStorage.removeItem('vipads_user_registered');
      purgeReferralQueriesFromUrl();
    } catch (e) {
      console.warn(e);
    }
    if (isAutoInactivity) {
      showToast(
        language === 'ar' ? 'انتهت مدة الجلسة (30 دقيقة)' : 'Session Expired (30m)',
        language === 'ar'
          ? 'تم تسجيل الخروج التلقائي لحماية أمان حسابك وأموالك بعد 30 دقيقة من عدم النشاط.'
          : 'You have been automatically logged out after 30 minutes of inactivity for security protection.',
        'warning'
      );
    } else {
      showToast(
        t('auth.logout'),
        t('auth.logout_button_desc'),
        'info'
      );
    }
  };

  // Inactivity detection lifecycle
  useEffect(() => {
    if (!isLoggedIn) {
      setShowInactivityWarning(false);
      return;
    }

    // Initialize activity timestamp on login/mount
    lastActivityTimeRef.current = Date.now();

    // Throttled activity updater to minimize DOM event overhead
    let lastThrottledTime = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastThrottledTime > 1000) {
        lastThrottledTime = now;
        // If warning modal is not active, keep updating activity time
        if (!showInactivityWarning) {
          lastActivityTimeRef.current = now;
        }
      }
    };

    const userEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
    ];

    userEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Perpetual Session Lifetime: Auto-logout is strictly forbidden.
    // Sessions remain perpetually active; users are NEVER logged out automatically.
    const inactivityInterval = setInterval(() => {
      // Kept as passive heartbeat only, never triggers logout or disruptive countdown
      setShowInactivityWarning(false);
    }, 60000);

    return () => {
      userEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      clearInterval(inactivityInterval);
    };
  }, [isLoggedIn, showInactivityWarning]);

  // Extend Session Handler
  const handleExtendSession = () => {
    lastActivityTimeRef.current = Date.now();
    setShowInactivityWarning(false);
    setInactivitySecondsLeft(60);
    showToast(
      language === 'ar' ? 'تم تمديد الجلسة بنجاح' : 'Session Extended',
      language === 'ar'
        ? 'تم تحديث أمان جلستك لمدة 30 دقيقة إضافية.'
        : 'Your session has been extended for another 30 minutes.',
      'success'
    );
  };

  // Immediate Logout from Warning Modal
  const handleLogoutFromWarning = () => {
    setShowInactivityWarning(false);
    handleLogout(false);
  };

  // Helper to trigger Global Center Modal notification (Unified Honey/Golden-Neon Center Modal)
  const showToast = (
    title: string, 
    message?: string, 
    type: 'success' | 'info' | 'warning' | 'vip' = 'success', 
    amount?: number,
    options?: {
      actionType?: 'vip_activated' | 'withdraw_success' | 'task_reward' | 'general';
      actionButtonText?: string;
      onAction?: () => void;
      remainingTasks?: number;
      newBalance?: number;
      vipLevel?: number;
      counterText?: string;
      onNavigateToTasks?: () => void;
    }
  ) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    const safeTitle = title || '';
    const safeMessage = message !== undefined && message !== null ? message : safeTitle;

    setToast({
      id: Date.now().toString(),
      title: safeTitle,
      message: safeMessage,
      type,
      amount,
      actionType: options?.actionType,
      actionButtonText: options?.actionButtonText,
      onAction: options?.onAction,
      remainingTasks: options?.remainingTasks,
      newBalance: options?.newBalance,
      vipLevel: options?.vipLevel,
      counterText: options?.counterText,
      onNavigateToTasks: options?.onNavigateToTasks,
    });

    // For critical action modals (VIP, withdrawal, task reward), do not prematurely auto-dismiss
    const isCriticalModal = options?.actionType === 'vip_activated' || 
                            options?.actionType === 'withdraw_success' || 
                            options?.actionType === 'task_reward' || 
                            type === 'vip';
    if (!isCriticalModal) {
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null);
      }, 6000);
    }
  };

  // Theme Toggle Interceptor: Strictly forces VIP Obsidian Dark Mode & alerts user
  const handleToggleThemeAttempt = () => {
    soundEngine.playClick();
    
    // Enforce dark mode class
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    document.body.classList.add('bg-[#0A0B10]', 'text-white');

    // Notify user that Light Theme is locked for premium branding
    showToast(
      t('theme.locked_title'),
      t('theme.locked_desc'),
      'vip'
    );
  };

  /**
   * CORE JAVASCRIPT LOGIC:
   * 1. Check if VIP 1 is activated; if not, show modal warning:
   *    "يرجى الذهاب لصفحة الباقات وتفعيل باقة VIP 1 لإجراء إعادة اختيار هذه المرة!"
   * 2. Check daily task limits (10 tasks per day for all VIP levels)
   * 3. Open direct ad link: "https://omg10.com/4/11633609" in a new window/tab
   * 4. Circular 10-second countdown loader appears on clicked card
   * 5. When countdown reaches 0:
   *    - Dynamically credits currentVipPlan.rewardPerTaskUSDT to user balance
   *    - Deduct 1 from available tasks for today and add reward instantly to dashboard balance
   *    - Record transaction and trigger sound + confetti
   */
  const handleWatchAndEarn = (task: VideoTask) => {
    // 0. VIP Protection Lock: if VIP 1 is not yet activated, trigger Center Activation Popup (replaces top alerts)
    if (user.vipLevel < 1) {
      setIsCenterActivationOpen(true);
      return;
    }

    if (activeTimers[task.id] !== undefined || task.completedToday || completedTasksLockRef.current.has(task.id)) {
      return;
    }

    // Enforce daily task quota according to VIP tier (strictly integer)
    const maxDailyTasks = Math.max(1, Math.floor(currentVipPlan.tasksPerDay || 10));
    const currentCompleted = Math.floor(Number(user.tasksCompletedToday) || 0);
    if (currentCompleted >= maxDailyTasks) {
      showToast(
        t('tasks.daily_limit_reached'),
        t('tasks.daily_limit_reached_desc', { max: maxDailyTasks }),
        'warning'
      );
      return;
    }

    soundEngine.playClickSound();

    // 1. Start 10-second countdown loader FIRST so UI reacts with 0ms delay
    const duration = 10;
    let remaining = duration;
    setActiveTimers((prev) => ({ ...prev, [task.id]: remaining }));

    // 2. Open the direct ad link in a new window/tab non-blockingly
    try {
      window.open(DIRECT_AD_URL, '_blank', 'noopener,noreferrer');
    } catch {
      // Fallback
      window.open(DIRECT_AD_URL, '_blank');
    }

    // Dynamic net reward calculation based on user's current VIP plan:
    // VIP 1 earns 0.09 USDT per task; VIP 2 earns 0.204 USDT per task (2.04 USDT daily for 10 tasks)
    const calculatedReward = currentVipPlan.level === 1 
      ? 0.09 
      : (currentVipPlan.rewardPerTaskUSDT || 0.204);

    const interval = setInterval(() => {
      remaining -= 1;

      if (remaining <= 0) {
        // Timer finished!
        clearInterval(interval);
        delete timerIntervalsRef.current[task.id];

        setActiveTimers((prev) => {
          const updated = { ...prev };
          delete updated[task.id];
          return updated;
        });

        // Trigger single reward logic outside of React state updater
        onTaskCompleted(task, calculatedReward);
      } else {
        setActiveTimers((prev) => ({ ...prev, [task.id]: remaining }));
      }
    }, 1000);

    timerIntervalsRef.current[task.id] = interval;
  };

  // Called when 10-second countdown finishes
  const onTaskCompleted = (task: VideoTask, rewardAmount: number) => {
    // Strict Idempotency Check: Prevent duplicate reward execution
    if (!task || !task.id) return;
    if (completedTasksLockRef.current.has(task.id) || task.completedToday) {
      return;
    }
    completedTasksLockRef.current.add(task.id);

    const currentEmail = (user.email || storage.getCurrentUserEmail() || '').trim().toLowerCase();
    const isMasterAdmin = storage.isAdminEmail(currentEmail) || currentEmail === 'free@gmail.com' || currentEmail === 'free10508@gmail.com';
    const existing = storage.getUserByEmail(currentEmail);
    const maxDailyTasks = Math.max(1, Math.floor(currentVipPlan.tasksPerDay || 10));

    // Authoritative balance & progress retrieval (immune to any stale closure state)
    const currentCompleted = existing && typeof existing.tasksCompletedToday === 'number'
      ? existing.tasksCompletedToday
      : (Math.floor(Number(user.tasksCompletedToday)) || 0);

    const currentBal = existing && typeof existing.totalBalanceUSDT === 'number'
      ? existing.totalBalanceUSDT
      : (typeof user.totalBalanceUSDT === 'number' ? user.totalBalanceUSDT : 0);

    const currentEarn = existing && typeof existing.taskEarningsToday === 'number'
      ? existing.taskEarningsToday
      : (typeof user.taskEarningsToday === 'number' ? user.taskEarningsToday : 0);

    // Play celebratory sound
    soundEngine.playTaskRewardSound();

    // Dynamic confetti burst scaled to task reward amount
    triggerTaskConfetti(rewardAmount);

    // Exact reward per task based on VIP tier (0.09 USDT for VIP 1, 0.204 USDT for VIP 2)
    const exactReward = currentVipPlan.level === 1 
      ? 0.09 
      : Number((rewardAmount || currentVipPlan.rewardPerTaskUSDT || 0.204).toFixed(4));

    const newTasksCompleted = Math.min(maxDailyTasks, currentCompleted + 1);
    const newTotal = Number((currentBal + exactReward).toFixed(2));
    const newTaskEarnings = Number((currentEarn + exactReward).toFixed(2));
    const todayDateStr = new Date().toISOString().split('T')[0];

    let newCompletedDays = user.completedTaskDays || 0;
    if (newTasksCompleted >= maxDailyTasks) {
      if (!existing?.lastCompletedTaskDayDate || existing.lastCompletedTaskDayDate !== todayDateStr) {
        newCompletedDays = (existing?.completedTaskDays || user.completedTaskDays || 0) + 1;
      }
    }

    if (existing) {
      storage.updateUser(currentEmail, {
        totalBalanceUSDT: newTotal,
        taskEarningsToday: newTaskEarnings,
        tasksCompletedToday: newTasksCompleted,
        completedTaskDays: newCompletedDays,
        lastCompletedTaskDayDate: newTasksCompleted >= maxDailyTasks ? todayDateStr : (existing?.lastCompletedTaskDayDate || ''),
        lastTasksResetDate: existing?.lastTasksResetDate || todayDateStr,
        lastTasksResetTimestamp: existing?.lastTasksResetTimestamp || Date.now(),
        lastModified: Date.now(),
      });
    } else {
      storage.syncEmailLifetimeBalances(currentEmail, newTotal, user.totalDepositedUSDT || 0, user.vipLevel, newTasksCompleted);
    }

    // 1. Immediately update user balance and task counts in React state (Zero Delay)
    setUser((prev) => ({
      ...prev,
      totalBalanceUSDT: newTotal,
      taskEarningsToday: newTaskEarnings,
      tasksCompletedToday: newTasksCompleted,
      completedTaskDays: newCompletedDays,
    }));

    // 2. Mark task as completed and persist tasks
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === task.id ? { ...t, completedToday: true } : t));
      storage.saveUserTasks(currentEmail, updated);
      return updated;
    });

    // 3. Record in task completion history logs (for 7-day Task History view)
    const nowIso = new Date().toISOString();
    const todayDateKey = nowIso.slice(0, 10);
    storage.addCompletedTaskLog(currentEmail, {
      taskId: task.id,
      taskTitle: task.title,
      sponsor: task.sponsor,
      rewardUSDT: exactReward,
      vipLevel: user.vipLevel,
      completedAt: nowIso,
      dateKey: todayDateKey,
      category: task.category || 'Video Ads'
    });

    // 4. Record in transaction history
    const uniqueTxId = `tx-task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newTx: Transaction = {
      id: uniqueTxId,
      type: 'task_reward',
      amountUSDT: exactReward,
      timestamp: new Date(),
      status: 'completed',
      description: `${task.sponsor} Video Task Reward (+${formatUSDT(exactReward)} USDT)`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    // 5. Distribute 3-Tier Free Referral Commission for active VIP tasks (to upline sponsors only)
    storage.distribute3TierTaskCommission(currentEmail, exactReward);
    firebaseSync.trackAdCommissionLive(currentEmail).catch((err) => {
      console.warn('[Firebase] Live ad commission error:', err);
    });

    // 6. INSTANT DATABASE PERSISTENCE (Zero delay to Firestore & Server Unified DB)
    try {
      firebaseSync.updateUserLive({
        email: currentEmail,
        totalBalanceUSDT: newTotal,
        taskEarningsToday: newTaskEarnings,
        tasksCompletedToday: newTasksCompleted,
        completedTaskDays: newCompletedDays,
        lastModified: Date.now(),
      }).catch((e) => console.warn('[Firebase] Immediate reward push note:', e));

      firebaseSync.recordTransactionLive(newTx).catch(() => {});
    } catch {}

    try {
      networkSync.syncNow().catch(() => {});
    } catch {}

    // 7. Centered Luxury Popup Modal: strictly integer remaining tasks today and new balance
    const remainingTasksToday = Math.max(0, maxDailyTasks - newTasksCompleted);
    setTaskRewardModal({
      isOpen: true,
      rewardAmount: exactReward,
      remainingTasksToday,
      newBalance: newTotal,
    });
  };

  // Clean up all timer intervals on unmount
  useEffect(() => {
    return () => {
      const intervals = timerIntervalsRef.current;
      for (const id in intervals) {
        if (intervals[id]) {
          clearInterval(intervals[id]);
        }
      }
    };
  }, []);

  // Handle Deposit Request (pending approval - funds are not credited until manual admin verification)
  const handleDepositSuccess = (amount: number, networkName?: string, address?: string) => {
    soundEngine.playClickSound();

    const uName = user.username || '';
    const userEmailStr = user.email || (uName.includes('@') ? uName : `${uName.toLowerCase() || 'user'}@gmail.com`);
    const exactDepositAmount = Number(amount.toFixed(2));
    const now = Date.now();

    // Prevent duplicate deposit request submissions in background (Strict Single Execution)
    if (
      lastDepositSubmissionRef.current &&
      lastDepositSubmissionRef.current.amount === exactDepositAmount &&
      lastDepositSubmissionRef.current.userEmail === userEmailStr &&
      now - lastDepositSubmissionRef.current.time < 3000
    ) {
      console.warn('[Deposit] Duplicate deposit request in background prevented:', exactDepositAmount);
      return;
    }
    lastDepositSubmissionRef.current = { time: now, amount: exactDepositAmount, userEmail: userEmailStr };

    const newTx: Transaction = {
      id: `tx-dep-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'deposit',
      amountUSDT: exactDepositAmount,
      timestamp: new Date(),
      status: 'pending',
      description: `${networkName || 'USDT'} Deposit (${exactDepositAmount.toFixed(2)} USDT) [قيد المعالجة]`,
      txHash: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      userEmail: userEmailStr,
    };

    setTransactions((prev) => [newTx, ...prev]);
    storage.addTransaction(newTx);
    firebaseSync.recordTransactionLive(newTx).catch(() => {});
    networkSync.postTransaction(newTx).catch(() => {});

    // Real-time Automated Notification for Deposit Submission
    storage.addNotificationForUser(userEmailStr, {
      type: 'deposit_pending',
      title: 'طلب إيداع قيد المراجعة',
      badgeLabel: 'إيداع قيد المراجعة',
      message: `تم تسجيل طلب شحن بقيمة +${amount.toFixed(2)} USDT عبر شبكة ${networkName || 'TRC-20'} بنجاح، وطلبك قيد المراجعة والتدقيق الإداري.`,
      amount: Number(amount.toFixed(2)),
      userId: user.userId,
    });

    // Ensure depositor account is immediately registered on Firestore and Server
    const currentUserRecord = storage.getUserByEmail(userEmailStr);
    if (currentUserRecord) {
      firebaseSync.updateUserLive(currentUserRecord).catch(() => {});
      networkSync.registerUser(currentUserRecord).catch(() => {});
    }

    // Send subtle toast or system confirmation
    showToast(
      language === 'ar' ? 'تم تسجيل طلب الإيداع' : 'Deposit Request Submitted',
      language === 'ar' ? `طلب إيداع ${amount.toFixed(2)} USDT قيد المعالجة وسيتم التحقق منه` : `Deposit request of ${amount.toFixed(2)} USDT is pending approval`,
      'info'
    );
  };

  // Handle Withdraw Success (queued for admin processing)
  const handleWithdrawSuccess = (amount: number, address: string, network: string = 'TRC20-USDT') => {
    soundEngine.playClickSound();
    const uName = user.username || '';
    const userEmailStr = user.email || (uName.includes('@') ? uName : `${uName.toLowerCase() || 'user'}@gmail.com`);

    const newBalance = Math.max(0, Number((user.totalBalanceUSDT - amount).toFixed(2)));
    const now = Date.now();
    const newWithdrawalsCount = (user.withdrawalsCount || 0) + 1;
    setUser((prev) => ({
      ...prev,
      totalBalanceUSDT: newBalance,
      withdrawalsCount: newWithdrawalsCount,
    }));
    storage.updateUser(userEmailStr, { 
      totalBalanceUSDT: newBalance,
      withdrawalsCount: newWithdrawalsCount,
      lastModified: now,
    });
    storage.syncEmailLifetimeBalances(userEmailStr, newBalance, user.totalDepositedUSDT ?? 0, user.vipLevel);
    networkSync.withdrawFunds(userEmailStr, amount).then(() => {
      networkSync.syncNow();
    }).catch(() => {});

    const newTx: Transaction = {
      id: `tx-wth-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'withdraw',
      amountUSDT: amount,
      timestamp: new Date(),
      status: 'pending',
      description: `سحب ${amount.toFixed(2)} USDT عبر ${network} إلى ${address}`,
      txHash: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      userEmail: userEmailStr,
    };
    storage.addTransaction(newTx);
    firebaseSync.recordTransactionLive(newTx).catch(() => {});
    networkSync.postTransaction(newTx).catch(() => {});

    // Real-time Automated Notification for Withdrawal Submission
    storage.addNotificationForUser(userEmailStr, {
      type: 'withdrawal_pending',
      title: 'طلب سحب قيد المعالجة',
      badgeLabel: 'سحب قيد المعالجة',
      message: `تم تسجيل طلب سحب بقيمة ${amount.toFixed(2)} USDT إلى عنوان المحفظة (${address.slice(0, 6)}...${address.slice(-4)}) عبر شبكة ${network}. جاري المراجعة.`,
      amount: amount,
      userId: user.userId,
    });

    setTransactions(storage.getAllTransactions());

    showToast(
      language === 'ar' ? 'تم تسجيل طلب السحب بنجاح! 🚀' : 'Withdrawal Request Submitted! 🚀',
      language === 'ar'
        ? `تم خصم ${amount.toFixed(2)} USDT بنجاح، وطلبك قيد المراجعة الإدارية وسرعة المعالجة الفورية عبر شبكة ${network}.`
        : `Withdrawal request of ${amount.toFixed(2)} USDT is pending admin review`,
      'success',
      amount,
      {
        actionType: 'withdraw_success',
        actionButtonText: language === 'ar' ? 'حسناً فهمت' : 'Understood',
      }
    );
  };

  // VIP Purchase Logic & Auto-Redirect (منظومة الشراء والتحويل التلقائي وحفظ الأرصدة مع محاكي البلوكتشين 1.0 ثانية)
  const handleSubscribeVIPPlan = (plan: VIPPlan) => {
    soundEngine.playClick();

    // Special case for VIP 1 free activation if currently VIP 0
    if (plan.level === 1 && user.vipLevel === 0 && plan.priceUSDT === 0) {
      handleActivateVip1();
      return;
    }

    const currentDeposit = Number((user.totalDepositedUSDT || 0).toFixed(2));
    const currentBalance = Number((user.totalBalanceUSDT || 0).toFixed(2));
    const planCost = Number(plan.priceUSDT.toFixed(2));

    const canPayFromDeposit = currentDeposit >= planCost && planCost > 0;
    const canPayFromBalance = !canPayFromDeposit && currentBalance >= planCost && planCost > 0;

    // Condition 1: Either deposit balance or total balance is sufficient
    // يتم تفعيل الباقة فوراً ويُخصم سعرها بالكامل وبشكل دائم وموثق في localStorage
    if (canPayFromDeposit || canPayFromBalance) {
      setBlockchainSimState({
        isOpen: true,
        title: language === 'ar' ? `جارٍ توثيق تفعيل ${plan.name} عبر البلوكتشين` : `Activating ${plan.name} via Blockchain`,
        subtitle: language === 'ar'
          ? `تأكيد العقد الذكي وخصم $${formatUSDT(planCost)} USDT وتفعيل مهام الـ VIP...`
          : `Validating smart contract and unlocking VIP tasks...`,
        network: 'Smart Contract Sync • 1.0s',
      });

      setTimeout(() => {
        setBlockchainSimState(prev => ({ ...prev, isOpen: false }));

        const newDeposited = canPayFromDeposit
          ? Math.max(0, Number((currentDeposit - planCost).toFixed(2)))
          : currentDeposit;
        const newBalance = canPayFromBalance
          ? Math.max(0, Number((currentBalance - planCost).toFixed(2)))
          : currentBalance;
        const now = Date.now();
        const activeEmail = (user.email || storage.getCurrentUserEmail()).trim().toLowerCase();

        setUser((prev) => ({
          ...prev,
          vipLevel: plan.level,
          vipActivatedAt: now,
          vipExpiresAt: undefined,
          totalDepositedUSDT: newDeposited,
          totalBalanceUSDT: newBalance,
          tasksCompletedToday: 0,
        }));

        // Instantly refresh tasks for the newly purchased VIP plan
        setTasks((prev) => {
          const refreshed = prev.map((t) => ({ ...t, completedToday: false }));
          storage.saveUserTasks(activeEmail, refreshed);
          return refreshed;
        });

        storage.updateUser(activeEmail, {
          vipLevel: plan.level,
          vipActivatedAt: now,
          vipExpiresAt: undefined,
          totalDepositedUSDT: newDeposited,
          totalBalanceUSDT: newBalance,
          tasksCompletedToday: 0,
          lastModified: now,
        });
        storage.syncEmailLifetimeBalances(activeEmail, newBalance, newDeposited, plan.level);

        networkSync.purchasePlan(activeEmail, plan.level, planCost).then(() => {
          networkSync.syncNow();
        }).catch(() => {});

        const newTx: Transaction = {
          id: `tx-vip-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: 'vip_upgrade',
          amountUSDT: planCost,
          timestamp: new Date(),
          status: 'completed',
          description: `شراء وتفعيل باقة ${plan.name} (${plan.title}) - ${canPayFromDeposit ? 'خصم كامل من رصيد الإيداع' : 'خصم كامل من الرصيد المالي'}`,
          userEmail: activeEmail,
        };
        setTransactions((prev) => [newTx, ...prev]);
        storage.addTransaction(newTx);

        // Automated System Letter in Inbox Center
        storage.addNotificationForUser(activeEmail, {
          type: 'vip_activated',
          title: 'تفعيل باقة VIP',
          badgeLabel: `تفعيل باقة ${plan.name}`,
          message: 'مبارك الترقية! تم تنشيط باقة VIP الجديدة لحسابك بنجاح. انطلق الآن وضاعف أرباحك اليومية! 🚀',
          vipLevel: plan.level,
          userEmail: activeEmail,
        });

        soundEngine.playUpgradeSound();
        triggerVIPUpgradeConfetti(plan.level, plan.name);

        showToast(
          language === 'ar' ? 'تم شراء وتفعيل الباقة بنجاح! 🚀' : 'VIP Plan Activated! 🚀',
          language === 'ar'
            ? `تهانينا! تم تفعيل باقة ${plan.name} فوراً وخُصم $${formatUSDT(planCost)} USDT بنجاح. انطلق الآن وضاعف أرباحك!`
            : `Congratulations! ${plan.name} activated. $${formatUSDT(planCost)} USDT deducted successfully.`,
          'vip',
          planCost,
          {
            actionType: 'vip_activated',
            actionButtonText: language === 'ar' ? 'الانتقال إلى المهام الآن 🚀' : 'Go to Tasks Now 🚀',
            onAction: handleGoToTasksFromActivation,
          }
        );
        setSelectedPlanToUpgrade(null);
      }, 1000);
      return;
    }

    // Condition 2: Balances are insufficient or 0.00
    // احظر العملية فوراً واعرض له مربعاً منبثقاً في منتصف الشاشة مع زر شحن الرصيد الآن
    soundEngine.playError();
    setSelectedPlanToUpgrade(null);
    setInsufficientDepositPlan(plan);
  };

  // Handle VIP Upgrade Modal Confirmation
  const handleConfirmUpgrade = (plan: VIPPlan) => {
    handleSubscribeVIPPlan(plan);
  };

  // Handle Recharge Button click from Insufficient Balance Modal
  const handleRechargeFromInsufficientModal = (plan: VIPPlan) => {
    setInsufficientDepositPlan(null);
    setDepositTarget({ name: plan.name, price: plan.priceUSDT });
    setIsDepositOpen(true);
  };

  // Handle VIP 1 Instant Free Activation (Unlocks 10 daily tasks with 1.0s Dynamic Blockchain Simulator)
  const handleActivateVip1 = () => {
    soundEngine.playClick();
    setBlockchainSimState({
      isOpen: true,
      title: language === 'ar' ? 'جارٍ تفعيل باقة VIP 1 المجانية' : 'Activating Free VIP 1 Tier',
      subtitle: language === 'ar'
        ? 'توثيق العقد الذكي وتفعيل 10 مهام يومية فورياً لربح 0.60$ USDT...'
        : 'Broadcasting smart contract and unlocking 10 daily tasks...',
      network: 'BEP20 / TRC20 Fast Sync • 1.0s',
    });

    setTimeout(() => {
      setBlockchainSimState(prev => ({ ...prev, isOpen: false }));
      soundEngine.playUpgradeSound();
      const now = Date.now();
      const expiresAt = now + 24 * 60 * 60 * 1000;

      triggerVIPUpgradeConfetti(1, 'VIP 1');

      setUser((prev) => ({
        ...prev,
        vipLevel: 1,
        vipActivatedAt: now,
        vipExpiresAt: expiresAt,
        tasksCompletedToday: 0,
      }));

      // Unlock all 10 tasks for 24 hours
      setTasks((prev) => prev.map((t) => ({ ...t, completedToday: false })));

      const currentEmail = storage.getCurrentUserEmail();
      storage.updateUser(currentEmail, {
        vipLevel: 1,
        vipActivatedAt: now,
        vipExpiresAt: expiresAt,
        tasksCompletedToday: 0,
      });

      const newTx: Transaction = {
        id: `tx-vip1-act-${Date.now()}`,
        type: 'vip_upgrade',
        amountUSDT: 0.00,
        timestamp: new Date(),
        status: 'completed',
        description: 'تفعيل باقة VIP 1 المجانية (فتح 10 مهام لمدة 24 ساعة)',
      };
      setTransactions((prev) => [newTx, ...prev]);
      storage.addTransaction(newTx);

      // Automated System Letter in Inbox Center
      storage.addNotificationForUser(currentEmail, {
        type: 'vip_activated',
        title: 'تفعيل باقة VIP',
        badgeLabel: 'تفعيل باقة VIP 1',
        message: 'مبارك الترقية! تم تنشيط باقة VIP الجديدة لحسابك بنجاح. انطلق الآن وضاعف أرباحك اليومية! 🚀',
        vipLevel: 1,
        userEmail: currentEmail,
      });

      // Open Center Activation Popup with "انتقل للمهام" and "إغلاق" (replaces top alerts)
      setIsCenterActivationOpen(true);
    }, 1000);
  };

  // Navigate straight to tasks from center activation popup (Stays in Home tab)
  const handleGoToTasksFromActivation = () => {
    setIsCenterActivationOpen(false);
    if (activeTab !== 'home' && activeTab !== 'tasks') {
      setActiveTab('home');
      try {
        sessionStorage.setItem('vipads_active_tab', 'home');
      } catch {}
    }
    setTimeout(() => {
      const tasksElem = document.getElementById('video-tasks-section');
      if (tasksElem) {
        tasksElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Action from Center Task Reward Modal: Navigate smoothly to next task
  const handleNextTaskFromModal = () => {
    setTaskRewardModal((prev) => ({ ...prev, isOpen: false }));
    if (activeTab !== 'home' && activeTab !== 'tasks') {
      setActiveTab('home');
      try {
        sessionStorage.setItem('vipads_active_tab', 'home');
      } catch {}
    }
    setTimeout(() => {
      const tasksElem = document.getElementById('video-tasks-section');
      if (tasksElem) {
        tasksElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  // Route locked tier clicks straight to the deposit form
  const handleOpenDepositForLockedTier = (plan: VIPPlan) => {
    soundEngine.playClick();
    setDepositTarget({ name: plan.name, price: plan.priceUSDT });
    setIsDepositOpen(true);
  };

  // 24-Hour Post-Activation Task Window Expiration Monitor
  useEffect(() => {
    const checkVipExpiration = () => {
      if (user.vipExpiresAt && user.vipExpiresAt > 0) {
        if (Date.now() >= user.vipExpiresAt && user.vipLevel === 1) {
          setUser((prev) => ({
            ...prev,
            vipLevel: 0,
            vipExpiresAt: undefined,
            vipActivatedAt: undefined,
            tasksCompletedToday: 0,
          }));

          const currentEmail = storage.getCurrentUserEmail();
          storage.updateUser(currentEmail, {
            vipLevel: 0,
            vipExpiresAt: undefined,
            vipActivatedAt: undefined,
            tasksCompletedToday: 0,
          });
        }
      }
    };

    checkVipExpiration();
    const interval = setInterval(checkVipExpiration, 5000);
    return () => clearInterval(interval);
  }, [user.vipExpiresAt, user.vipLevel]);

  // Handle Simulated Referral Invite with Instant Bonus
  const handleSimulateReferral = (newMember: ReferredMember, bonusAmount: number) => {
    soundEngine.playTaskRewardSound();

    // Register simulated sub-user in persistent storage for complete multi-user database consistency
    const allUsers = storage.getAllUsers();
    const simulatedAccount: StoredAccount = {
      id: newMember.id,
      email: `${newMember.username}@gmail.com`,
      username: newMember.username,
      password: 'password123',
      walletAddress: newMember.walletAddress,
      vipLevel: 2, // Paid VIP 2 tier (Activated deposit)
      totalBalanceUSDT: 50.00,
      taskEarningsToday: 0.00,
      totalWithdrawnUSDT: 0.00,
      tasksCompletedToday: 0,
      referralCode: `VIP_${(newMember.username || 'USER').toUpperCase().slice(0, 5)}_${Math.floor(10 + Math.random() * 90)}`,
      referredBy: user.referralCode,
      referralCount: 0,
      referralEarningsUSDT: 0.00,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    allUsers.push(simulatedAccount);
    storage.saveAllUsers(allUsers);

    // Also record a deposit transaction for the simulated user
    const simDepTx: Transaction = {
      id: `tx-dep-sim-${Date.now()}`,
      type: 'deposit',
      amountUSDT: 50.00,
      status: 'completed',
      timestamp: new Date().toISOString(),
      userEmail: simulatedAccount.email,
      description: `شحن رصيد وتفعيل باقة VIP 2`,
      txHash: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
    storage.addTransaction(simDepTx);

    // Trigger referral bonus confetti
    triggerReferralBonusConfetti(bonusAmount);

    setUser((prev) => ({
      ...prev,
      referralCount: prev.referralCount + 1,
      totalBalanceUSDT: Number((prev.totalBalanceUSDT + bonusAmount).toFixed(2)),
      referralEarningsUSDT: Number((prev.referralEarningsUSDT + bonusAmount).toFixed(2)),
    }));

    setReferredMembers((prev) => [
      {
        ...newMember,
        vipTier: 'VIP 2',
        status: 'vip_upgraded',
      },
      ...prev,
    ]);

    const newTx: Transaction = {
      id: `tx-ref-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'referral_commission',
      amountUSDT: bonusAmount,
      timestamp: new Date(),
      status: 'completed',
      description: `عمولة إحالة فورية لانضمام @${newMember.username} وشحن VIP (+${bonusAmount.toFixed(2)} USDT)`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    showToast(
      t('toast.referral_bonus_title'),
      t('toast.referral_bonus_body', { amount: bonusAmount.toFixed(2), name: `@${newMember.username}` }),
      'success',
      bonusAmount
    );
  };

  // Handle Claim Milestone Reward with strict sub-users database deposit validation
  const handleClaimMilestone = (milestoneId: string, rewardAmount: number) => {
    // 1. Verify milestone existence and state
    const targetMilestone = referralMilestones.find((m) => m.id === milestoneId);
    if (!targetMilestone || targetMilestone.claimed) return;

    // 2. Strict Sub-Users Database Lock Check:
    // Only count direct referrals who have completed a real deposit or paid VIP activation
    const depositActivatedCount = storage.getDepositActivatedReferredCountForUser(user.referralCode);
    if (depositActivatedCount < targetMilestone.requiredInvites) {
      soundEngine.playError();
      showToast(
        language === 'ar' ? 'المكافأة مقفلة' : 'Milestone Locked',
        language === 'ar' 
          ? `يتطلب استلام هذه المكافأة شحن ${targetMilestone.requiredInvites} أصدقاء لباقات VIP (المحقق حالياً: ${depositActivatedCount})`
          : `Requires ${targetMilestone.requiredInvites} referrals with active VIP deposits (Current: ${depositActivatedCount})`,
        'warning'
      );
      return;
    }

    soundEngine.playUpgradeSound();

    // Trigger rich multi-burst milestone celebration
    triggerMilestoneConfetti(rewardAmount);

    setUser((prev) => ({
      ...prev,
      totalBalanceUSDT: Number((prev.totalBalanceUSDT + rewardAmount).toFixed(2)),
      referralEarningsUSDT: Number((prev.referralEarningsUSDT + rewardAmount).toFixed(2)),
    }));

    setReferralMilestones((prev) =>
      prev.map((m) => (m.id === milestoneId ? { ...m, claimed: true } : m))
    );

    const newTx: Transaction = {
      id: `tx-ms-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'referral_commission',
      amountUSDT: rewardAmount,
      timestamp: new Date(),
      status: 'completed',
      description: `مكافأة إنجاز إيداعات الفريق: ${targetMilestone.title} (+${rewardAmount.toFixed(2)} USDT)`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    showToast(
      language === 'ar' ? '🎉 تم استلام مكافأة الفريق!' : t('toast.milestone_claimed_title'),
      language === 'ar'
        ? `تمت إضافة +${rewardAmount.toFixed(2)} USDT إلى رصيدك بنجاح لتفعيل ${targetMilestone.requiredInvites} شحنات VIP من فريقك.`
        : t('toast.milestone_claimed_body', { amount: rewardAmount.toFixed(2) }),
      'vip',
      rewardAmount
    );
  };

  const handleCopySuccess = (type: 'code' | 'link') => {
    soundEngine.playClickSound();
    if (type === 'code') {
      showToast(t('brand.name'), t('toast.code_copied'), 'info');
    } else {
      showToast(t('brand.name'), t('toast.link_copied'), 'info');
    }
  };

  const handleOpenWithdraw = () => {
    soundEngine.playClick();
    // Allow withdrawal modal to open smoothly for everyone across all plans (including VIP 1 free)
    // Intelligent checks (min $5.0 and secret sequential counter) execute upon pressing "Confirm Withdrawal"
    setIsWithdrawOpen(true);
  };

  const scrollToTasks = () => {
    handleSelectTab('tasks');
  };

  const scrollToVIP = () => {
    handleSelectTab('vip');
  };

  const availableTasksCount = tasks.filter((t) => !t.completedToday).length;

  // Admin Master Control Handlers (Direct live manipulation on current logged-in user)
  const handleSetVipLevelDirect = (level: number, freeOverride: boolean) => {
    const targetPlan = vipPlans.find((p) => p.level === level) || vipPlans[0];
    
    if (!freeOverride && user.totalBalanceUSDT < targetPlan.priceUSDT) {
      showToast(
        language === 'ar' ? 'رصيد غير كافٍ' : 'Insufficient Balance',
        language === 'ar' 
          ? `تحتاج إلى شحن ${(targetPlan.priceUSDT - user.totalBalanceUSDT).toFixed(2)} USDT إضافية أو اختر (تفعيل مجاني فوري)` 
          : `Need $${(targetPlan.priceUSDT - user.totalBalanceUSDT).toFixed(2)} more USDT or use Free Activation`,
        'warning'
      );
      return;
    }

    if (!freeOverride) {
      setUser((prev) => ({
        ...prev,
        vipLevel: level,
        totalBalanceUSDT: Math.max(0, prev.totalBalanceUSDT - targetPlan.priceUSDT)
      }));
    } else {
      setUser((prev) => ({
        ...prev,
        vipLevel: level
      }));
    }

    const newTx: Transaction = {
      id: `tx-admin-vip-${Date.now()}`,
      type: 'vip_upgrade',
      amountUSDT: freeOverride ? 0 : targetPlan.priceUSDT,
      description: `${targetPlan.name} (${targetPlan.title}) ${freeOverride ? 'Free Admin Override' : 'Upgrade'}`,
      status: 'completed',
      timestamp: new Date(),
      txHash: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
    setTransactions((prev) => [newTx, ...prev]);

    const uName = user.username || '';
    const userEmailStr = user.email || (uName.includes('@') ? uName : `${uName.toLowerCase() || 'user'}@gmail.com`);
    storage.addNotificationForUser(userEmailStr, {
      type: 'vip_activated',
      title: 'تفعيل باقة VIP',
      badgeLabel: `تفعيل باقة ${targetPlan.name}`,
      message: 'مبارك الترقية! تم تنشيط باقة VIP الجديدة لحسابك بنجاح. انطلق الآن وضاعف أرباحك اليومية! 🚀',
      vipLevel: targetPlan.level,
      userEmail: userEmailStr,
    });

    triggerVIPUpgradeConfetti(targetPlan.level, targetPlan.name);
    soundEngine.playUpgradeSound();
  };

  const handleAddAdminDeposit = (amount: number, description?: string) => {
    const exactAmount = Number(Math.abs(amount).toFixed(2));
    const uName = user.username || '';
    const userEmailStr = user.email || (uName.includes('@') ? uName : `${uName.toLowerCase() || 'user'}@gmail.com`);

    storage.recordApprovedDeposit(userEmailStr, exactAmount);

    setUser((prev) => ({
      ...prev,
      totalDepositedUSDT: Number(((prev.totalDepositedUSDT || 0) + exactAmount).toFixed(2)),
    }));

    const newTx: Transaction = {
      id: `tx-admin-dep-${Date.now()}`,
      type: 'deposit',
      amountUSDT: exactAmount,
      description: description || `USDT Direct Deposit (+${exactAmount.toFixed(2)} USDT)`,
      status: 'completed',
      timestamp: new Date(),
      txHash: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      userEmail: userEmailStr,
    };
    storage.addTransaction(newTx);

    // Auto-distribute 3-tier deposit commission to upline sponsors (10%, 5%, 2%)
    storage.distributeDepositCommission(userEmailStr, exactAmount, newTx.id);

    // Automated System Letter in Inbox Center
    storage.addNotificationForUser(userEmailStr, {
      type: 'deposit_approved',
      title: 'تم قبول الإيداع',
      badgeLabel: 'تم قبول الإيداع',
      message: 'تهانينا! تم تأكيد عملية الشحن بنجاح وإضافة الرصيد الصافي لمحفظتك. استثمر بأمان الآن! 💰',
      amount: exactAmount,
      userEmail: userEmailStr,
    });

    setTransactions(storage.getAllTransactions());
  };

  const handleDeductBalance = (amount: number) => {
    setUser((prev) => ({
      ...prev,
      totalBalanceUSDT: Math.max(0, prev.totalBalanceUSDT - amount),
    }));

    const uName = user.username || '';
    const userEmailStr = uName.includes('@') ? uName : `${uName.toLowerCase() || 'user'}@gmail.com`;

    const newTx: Transaction = {
      id: `tx-admin-deduct-${Date.now()}`,
      type: 'withdraw',
      amountUSDT: amount,
      description: `Admin Balance Deduction (-${amount.toFixed(2)} USDT)`,
      status: 'completed',
      timestamp: new Date(),
      userEmail: userEmailStr,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Real-time Live Admin-User Balance Sync (Isolated Manual Balance Injection)
  const handleAdjustUserBalance = (
    targetEmail: string, 
    amount: number, 
    type: 'add_deposit' | 'add_balance' | 'deduct_deposit' | 'deduct_balance' | 'add' | 'deduct'
  ) => {
    const cleanTargetEmail = (targetEmail || '').trim().toLowerCase();
    const currentActiveEmail = (user.email || user.username || storage.getCurrentUserEmail() || '').trim().toLowerCase();

    let success = false;
    const exactAmount = Number(Math.abs(amount).toFixed(2));

    if (type === 'add_deposit') {
      const res = storage.addDepositOnlyToUser(cleanTargetEmail, exactAmount);
      success = res.success;
    } else if (type === 'add_balance' || type === 'add') {
      const res = storage.addBalanceOnlyToUser(cleanTargetEmail, exactAmount);
      success = res.success;
    } else if (type === 'deduct_deposit') {
      success = storage.deductDepositOnlyFromUser(cleanTargetEmail, exactAmount);
    } else if (type === 'deduct_balance' || type === 'deduct') {
      success = storage.deductBalanceOnlyFromUser(cleanTargetEmail, exactAmount);
    }

    // Check if target is the currently active user session
    const currentUsernameClean = (user.username || '').trim().toLowerCase();
    const currentEmailClean = (user.email || '').trim().toLowerCase();
    const isCurrentActive = cleanTargetEmail === currentActiveEmail ||
      cleanTargetEmail === currentUsernameClean ||
      cleanTargetEmail === currentEmailClean ||
      (currentActiveEmail && cleanTargetEmail && (
        currentActiveEmail.includes(cleanTargetEmail) ||
        cleanTargetEmail.includes(currentActiveEmail)
      ));

    if (isCurrentActive && success) {
      const updatedUser = storage.getUserByEmail(cleanTargetEmail);
      if (updatedUser) {
        setUser((prev) => ({
          ...prev,
          totalBalanceUSDT: updatedUser.totalBalanceUSDT,
          totalDepositedUSDT: updatedUser.totalDepositedUSDT ?? prev.totalDepositedUSDT,
        }));
      } else {
        setUser((prev) => {
          if (type === 'add_deposit') {
            return {
              ...prev,
              totalDepositedUSDT: Number(((prev.totalDepositedUSDT || 0) + exactAmount).toFixed(2)),
            };
          } else if (type === 'add_balance' || type === 'add') {
            return {
              ...prev,
              totalBalanceUSDT: Number(((prev.totalBalanceUSDT || 0) + exactAmount).toFixed(2)),
            };
          } else if (type === 'deduct_deposit') {
            return {
              ...prev,
              totalDepositedUSDT: Math.max(0, Number(((prev.totalDepositedUSDT || 0) - exactAmount).toFixed(2))),
            };
          } else {
            return {
              ...prev,
              totalBalanceUSDT: Math.max(0, Number(((prev.totalBalanceUSDT || 0) - exactAmount).toFixed(2))),
            };
          }
        });
      }
    }

    if (success) {
      const updatedTargetUser = storage.getUserByEmail(cleanTargetEmail);
      if (updatedTargetUser) {
        firebaseSync.updateUserLive({
          email: cleanTargetEmail,
          totalBalanceUSDT: updatedTargetUser.totalBalanceUSDT,
          totalDepositedUSDT: updatedTargetUser.totalDepositedUSDT,
          lastModified: Date.now(),
        }).catch(() => {});

        try {
          fetch('/api/network/adjust-balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: cleanTargetEmail,
              totalBalanceUSDT: updatedTargetUser.totalBalanceUSDT,
              totalDepositedUSDT: updatedTargetUser.totalDepositedUSDT,
            }),
          }).catch(() => {});
        } catch {}
      }
    }

    // Immediately synchronize transactions state
    setTransactions(storage.getAllTransactions());
  };

  const handleSwitchUser = (targetEmail: string) => {
    const found = storage.getUserByEmail(targetEmail);
    if (found) {
      storage.setCurrentUserEmail(found.email);
      const userTasks = storage.getUserTasks(found.email);
      setTasks(userTasks);
      setUser((prev) => ({
        ...prev,
        userId: found.id,
        username: found.username || found.email.split('@')[0],
        email: found.email,
        walletAddress: found.walletAddress,
        vipLevel: found.vipLevel,
        totalBalanceUSDT: found.totalBalanceUSDT,
        totalDepositedUSDT: storage.getTotalDepositedForUser(found.email),
        taskEarningsToday: found.taskEarningsToday,
        totalWithdrawnUSDT: found.totalWithdrawnUSDT,
        tasksCompletedToday: found.tasksCompletedToday,
        referralCode: found.referralCode,
        referralCount: found.referralCount,
        referralEarningsUSDT: found.referralEarningsUSDT,
      }));
      setTransactions(storage.getAllTransactions());
      showToast('تبديل الحساب', `تم الانتقال بنجاح إلى حساب ${found.email}`, 'info');
    }
  };

  const handleResetDailyTasks = () => {
    const currentEmail = storage.getCurrentUserEmail();
    setUser((prev) => ({
      ...prev,
      tasksCompletedToday: 0
    }));
    setTasks((prev) => {
      const updated = prev.map((t) => ({ ...t, completedToday: false }));
      storage.saveUserTasks(currentEmail, updated);
      return updated;
    });
  };

  const handleCompleteAllDailyTasks = () => {
    const currentEmail = storage.getCurrentUserEmail();
    const totalDailyReward = currentVipPlan.dailyIncomeUSDT;
    setUser((prev) => ({
      ...prev,
      tasksCompletedToday: currentVipPlan.tasksPerDay,
      totalBalanceUSDT: prev.totalBalanceUSDT + totalDailyReward,
      taskEarningsToday: prev.taskEarningsToday + totalDailyReward
    }));
    setTasks((prev) => {
      const updated = prev.map((t) => ({ ...t, completedToday: true }));
      storage.saveUserTasks(currentEmail, updated);
      return updated;
    });

    const newTx: Transaction = {
      id: `tx-admin-alltasks-${Date.now()}`,
      type: 'task_reward',
      amountUSDT: totalDailyReward,
      description: `All Daily Video Tasks Auto-Completed (+${totalDailyReward.toFixed(2)} USDT)`,
      status: 'completed',
      timestamp: new Date()
    };
    setTransactions((prev) => [newTx, ...prev]);

    triggerTaskConfetti(totalDailyReward);
    soundEngine.playTaskRewardSound();
  };

  const handleAddAdminReferral = (customName?: string, bonusAmount = 0) => {
    const username = customName || `vip_partner_${Math.floor(1000 + Math.random() * 9000)}`;
    const newMember: ReferredMember = {
      id: `ref-${Date.now()}`,
      username,
      walletAddress: `T${Array.from({ length: 33 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      vipTier: 'VIP 1',
      joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      bonusEarnedUSDT: bonusAmount,
      status: 'active'
    };
    setReferredMembers((prev) => [newMember, ...prev]);
    setUser((prev) => ({
      ...prev,
      totalBalanceUSDT: Number((prev.totalBalanceUSDT + bonusAmount).toFixed(2)),
      referralEarningsUSDT: Number((prev.referralEarningsUSDT + bonusAmount).toFixed(2)),
      referralCount: prev.referralCount + 1,
    }));

    if (bonusAmount > 0) {
      const newTx: Transaction = {
        id: `tx-admin-ref-${Date.now()}`,
        type: 'referral_commission',
        amountUSDT: bonusAmount,
        description: `Referral Commission for @${username}`,
        status: 'completed',
        timestamp: new Date()
      };
      setTransactions((prev) => [newTx, ...prev]);
      triggerReferralBonusConfetti(bonusAmount);
      soundEngine.playTaskRewardSound();
    }
  };

  const handleClaimAllMilestonesDirect = () => {
    let totalClaimed = 0;
    setReferralMilestones((prev) =>
      prev.map((m) => {
        if (!m.claimed) {
          totalClaimed += m.rewardUSDT;
          return { ...m, claimed: true };
        }
        return m;
      })
    );
    if (totalClaimed > 0) {
      setUser((prev) => ({
        ...prev,
        totalBalanceUSDT: prev.totalBalanceUSDT + totalClaimed,
        referralEarningsUSDT: prev.referralEarningsUSDT + totalClaimed
      }));
      const newTx: Transaction = {
        id: `tx-admin-milestones-${Date.now()}`,
        type: 'referral_commission',
        amountUSDT: totalClaimed,
        description: `All Referral Milestone Rewards Claimed (+${totalClaimed.toFixed(2)} USDT)`,
        status: 'completed',
        timestamp: new Date()
      };
      setTransactions((prev) => [newTx, ...prev]);
      triggerMilestoneConfetti(totalClaimed);
      soundEngine.playUpgradeSound();
    }
  };

  const handleAddCustomTransaction = (tx: Partial<Transaction>) => {
    const newTx: Transaction = {
      id: `tx-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: tx.type || 'deposit',
      amountUSDT: tx.amountUSDT || 10,
      description: tx.description || 'Admin Manual Transaction',
      status: tx.status || 'completed',
      timestamp: tx.timestamp || new Date(),
      txHash: tx.txHash || `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleApproveTransaction = (txId: string) => {
    if (!txId) return;
    if (processingApprovalTxIdsRef.current.has(txId)) {
      console.warn('[Approve] Transaction already processing approval:', txId);
      return;
    }
    processingApprovalTxIdsRef.current.add(txId);

    const targetTx = transactions.find((t) => t.id === txId) || storage.getAllTransactions().find((t) => t.id === txId);
    if (!targetTx) {
      processingApprovalTxIdsRef.current.delete(txId);
      return;
    }

    if (targetTx.status === 'completed' || targetTx.status === 'approved') {
      console.warn('[Approve] Transaction already completed/approved:', txId);
      processingApprovalTxIdsRef.current.delete(txId);
      return;
    }

    const targetEmail = (targetTx.userEmail || user.username || '').trim().toLowerCase();
    const exactAmount = Number(targetTx.amountUSDT.toFixed(2));

    // Credit deposit strictly to totalDepositedUSDT
    if (targetTx.type === 'deposit') {
      const credited = storage.recordApprovedDeposit(targetEmail, exactAmount, txId);
      const currentEmail = (storage.getCurrentUserEmail() || '').toLowerCase().trim();
      const currentUsername = (user.username || '').toLowerCase().trim();
      const isTarget = 
        targetEmail === currentEmail || 
        targetEmail === currentUsername ||
        (currentEmail && targetEmail && (targetEmail.includes(currentEmail) || currentEmail.includes(targetEmail))) ||
        (currentUsername && targetEmail && (targetEmail.startsWith(currentUsername) || currentUsername.startsWith(targetEmail)));

      if (isTarget && credited) {
        setUser((prev) => ({
          ...prev,
          totalDepositedUSDT: Number(((prev.totalDepositedUSDT || 0) + exactAmount).toFixed(2)),
          // STRICT RULE: Approved deposit goes ONLY to totalDepositedUSDT for purchasing VIP plans
        }));
      }
    }

    // Automated 3-Tier Deposit-Based Commission (Level 1: 10%, Level 2: 5%, Level 3: 2%)
    let commissionNotice = '';
    if ((targetTx.type === 'deposit' || targetTx.type === 'vip_upgrade') && exactAmount > 0) {
      const commResults = storage.distributeDepositCommission(targetEmail, exactAmount, txId);
      
      // If current logged-in user received commission as an upline sponsor, update state immediately
      const currentEmail = (storage.getCurrentUserEmail() || '').toLowerCase().trim();
      const currentUsername = (user.username || '').toLowerCase().trim();
      const currentRefCode = (user.referralCode || '').toLowerCase().trim();
      let earnedByCurrentUser = 0;

      const matchesCurrentUser = (emailStr?: string, usernameStr?: string, refCodeStr?: string) => {
        if (!emailStr && !usernameStr && !refCodeStr) return false;
        const e = (emailStr || '').toLowerCase().trim();
        const u = (usernameStr || '').toLowerCase().trim();
        const r = (refCodeStr || '').toLowerCase().trim();
        if (r && currentRefCode && r === currentRefCode) return true;
        return e === currentEmail || e === currentUsername || u === currentEmail || u === currentUsername;
      };

      if (commResults.tier1 && matchesCurrentUser(commResults.tier1.sponsorEmail, commResults.tier1.sponsorUsername, commResults.tier1.sponsorRefCode)) {
        earnedByCurrentUser += commResults.tier1.amount;
      }
      if (commResults.tier2 && matchesCurrentUser(commResults.tier2.sponsorEmail, commResults.tier2.sponsorUsername, commResults.tier2.sponsorRefCode)) {
        earnedByCurrentUser += commResults.tier2.amount;
      }
      if (commResults.tier3 && matchesCurrentUser(commResults.tier3.sponsorEmail, commResults.tier3.sponsorUsername, commResults.tier3.sponsorRefCode)) {
        earnedByCurrentUser += commResults.tier3.amount;
      }

      if (earnedByCurrentUser > 0) {
        setUser((prev) => ({
          ...prev,
          totalBalanceUSDT: Number(((prev.totalBalanceUSDT || 0) + earnedByCurrentUser).toFixed(2)),
          referralEarningsUSDT: Number(((prev.referralEarningsUSDT || 0) + earnedByCurrentUser).toFixed(2)),
        }));
      }

      // Update referred members list state so deposit commissions show updated values
      setReferredMembers(storage.getReferredMembersForUser(user.referralCode));

      if (commResults.totalDistributed > 0) {
        commissionNotice = language === 'ar'
          ? ` • تم صرف عمولات الإحالة تلقائياً (+${commResults.totalDistributed.toFixed(2)} USDT)`
          : ` • Referral commissions credited (+${commResults.totalDistributed.toFixed(2)} USDT)`;
      }
    }

    storage.updateTransactionStatus(txId, 'completed');
    const updatedTxs = storage.getAllTransactions();
    setTransactions(updatedTxs);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('vipads:team_updated'));

    // Global Unified Database Bridge: Broadcast deposit approval & commission distribution to backend
    networkSync.approveDeposit({
      txId,
      depositorEmail: targetEmail,
      amount: exactAmount,
    }).catch(() => {});

    // Atomic Firestore Transaction: Ensure status, balance, and commissions are updated in Firestore
    firebaseSync.approveDepositAtomic(txId, targetEmail, exactAmount).catch((e) => {
      console.warn('Firebase atomic deposit approval fallback:', e);
    });

    // Automated System Letter in Inbox Center
    if (targetTx.type === 'deposit') {
      storage.addNotificationForUser(targetEmail, {
        type: 'deposit_approved',
        title: 'تم قبول الإيداع',
        badgeLabel: 'تم قبول الإيداع',
        message: 'تهانينا! تم تأكيد عملية الشحن بنجاح وإضافة الرصيد الصافي لمحفظتك. استثمر بأمان الآن! 💰',
        amount: exactAmount,
        userEmail: targetEmail,
      });
    }

    soundEngine.playTaskRewardSound();
    triggerReferralBonusConfetti(targetTx.amountUSDT);

    showToast(
      language === 'ar' ? 'تمت الموافقة على الإيداع' : 'Deposit Approved',
      language === 'ar'
        ? `تم اعتماد وقيد مبلغ +${exactAmount.toFixed(2)} USDT لحساب (${targetEmail})${commissionNotice}`
        : `Approved & credited +${exactAmount.toFixed(2)} USDT${commissionNotice}`,
      'success',
      exactAmount
    );

    setTimeout(() => {
      processingApprovalTxIdsRef.current.delete(txId);
    }, 1500);
  };

  const handleRejectTransaction = (txId: string) => {
    const targetTx = transactions.find((t) => t.id === txId);
    if (!targetTx) return;

    const targetEmail = (targetTx.userEmail || user.username || '').trim().toLowerCase();

    // Automated System Letter in Inbox Center
    storage.addNotificationForUser(targetEmail, {
      type: 'deposit_rejected',
      title: 'تم رفض الإيداع',
      badgeLabel: 'تم رفض الإيداع',
      message: 'تنبيه مالي: تم رفض طلب إعادة الشحن. يرجى التأكد من بيانات المعاملة والمحاولة مجدداً أو مراجعة الدعم. ❌',
      amount: targetTx.amountUSDT,
      userEmail: targetEmail,
    });

    storage.updateTransactionStatus(txId, 'failed');
    setTransactions(storage.getAllTransactions());

    soundEngine.playClickSound();
    showToast(
      language === 'ar' ? 'تم رفض المعاملة' : 'Transaction Rejected',
      language === 'ar' ? `تم رفض طلب الإيداع بقيمة ${targetTx.amountUSDT.toFixed(2)} USDT` : `Deposit request of ${targetTx.amountUSDT.toFixed(2)} USDT was rejected`,
      'warning'
    );
  };

  const handleApproveWithdrawal = (txId: string) => {
    const all = storage.getAllTransactions();
    const cleanId = (txId || '').trim().toLowerCase();
    const targetTx = all.find((t) => t.id === txId || (t.id && t.id.trim().toLowerCase() === cleanId)) || transactions.find((t) => t.id === txId);
    if (!targetTx) return;

    const targetEmail = targetTx.userEmail || user.username || '';
    // Record approved withdrawal on user record
    storage.recordApprovedWithdrawal(targetEmail, targetTx.amountUSDT);
    const currentEmail = (storage.getCurrentUserEmail() || '').toLowerCase();
    const cleanTargetEmail = (targetEmail || '').toLowerCase();
    const cleanUsername = (user.username || '').toLowerCase();
    if (cleanTargetEmail === currentEmail || cleanTargetEmail === cleanUsername) {
      setUser((prev) => ({
        ...prev,
        totalWithdrawnUSDT: Number(((prev.totalWithdrawnUSDT || 0) + targetTx.amountUSDT).toFixed(2)),
      }));
    }

    // Automated System Letter in Inbox Center (marked read to prevent red badge popup)
    storage.addNotificationForUser(targetEmail, {
      type: 'withdrawal_approved',
      title: 'تم قبول السحب',
      badgeLabel: 'تم قبول السحب',
      message: `تم تحويل مبلغ ${targetTx.amountUSDT.toFixed(2)} USDT إلى محفظتك بنجاح. شكراً لثقتكم! ✅`,
      amount: targetTx.amountUSDT,
      userEmail: targetEmail,
      read: true,
    });

    // Mark as completed permanently in storage & server
    storage.updateTransactionStatus(targetTx.id, 'completed');

    // Erase red notification badge completely from top header
    storage.markAllNotificationsAsRead(currentEmail);
    storage.markAllNotificationsAsRead('free@gmail.com');
    storage.markAllNotificationsAsRead(targetEmail);
    storage.getAllUsers().forEach((u) => storage.markAllNotificationsAsRead(u.email));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vipads_notifications_changed'));
    }

    // Immediately update transactions in state so it disappears from pending list
    setTransactions((prev) =>
      prev.map((t) => (t.id === targetTx.id || (t.id && t.id.trim().toLowerCase() === cleanId) ? { ...t, status: 'completed' } : t))
    );

    soundEngine.playTaskRewardSound();
    showToast(
      language === 'ar' ? 'تمت الموافقة على السحب' : 'Withdrawal Approved',
      language === 'ar'
        ? `تم اعتماد وتحويل مبلغ ${targetTx.amountUSDT.toFixed(2)} USDT لمحفظة العميل بنجاح`
        : `Approved and sent ${targetTx.amountUSDT.toFixed(2)} USDT`,
      'success',
      targetTx.amountUSDT
    );
  };

  const handleRejectWithdrawal = (txId: string) => {
    const all = storage.getAllTransactions();
    const cleanId = (txId || '').trim().toLowerCase();
    const targetTx = all.find((t) => t.id === txId || (t.id && t.id.trim().toLowerCase() === cleanId)) || transactions.find((t) => t.id === txId);
    if (!targetTx) return;

    const targetEmail = targetTx.userEmail || user.username || '';
    // Refund the deducted amount back to user's balance
    storage.addFundsToUser(targetEmail, targetTx.amountUSDT, `إعادة قيد سحب مرفوض (+${targetTx.amountUSDT.toFixed(2)} USDT)`);
    const currentEmail = (storage.getCurrentUserEmail() || '').toLowerCase();
    const cleanTargetEmail = (targetEmail || '').toLowerCase();
    const cleanUsername = (user.username || '').toLowerCase();
    if (cleanTargetEmail === currentEmail || cleanTargetEmail === cleanUsername) {
      setUser((prev) => ({
        ...prev,
        totalBalanceUSDT: Number(((prev.totalBalanceUSDT || 0) + targetTx.amountUSDT).toFixed(2)),
      }));
    }

    // Automated System Letter in Inbox Center
    storage.addNotificationForUser(targetEmail, {
      type: 'withdrawal_rejected',
      title: 'تم رفض السحب',
      badgeLabel: 'تم رفض السحب',
      message: `تنبيه: تم رفض طلب السحب وإعادة قيد ${targetTx.amountUSDT.toFixed(2)} USDT إلى رصيدك. ❌`,
      amount: targetTx.amountUSDT,
      userEmail: targetEmail,
    });

    storage.updateTransactionStatus(targetTx.id, 'failed');
    const updatedTransactions = storage.getAllTransactions();
    setTransactions(updatedTransactions);

    soundEngine.playClickSound();
    showToast(
      language === 'ar' ? 'تم رفض السحب واسترجاع الرصيد' : 'Withdrawal Rejected',
      language === 'ar'
        ? `تم رفض طلب السحب وإعادة قيد ${targetTx.amountUSDT.toFixed(2)} USDT لرصيد العميل (${targetEmail})`
        : `Withdrawal rejected and refunded ${targetTx.amountUSDT.toFixed(2)} USDT`,
      'warning'
    );
  };

  // Master Reset & Zero Out Platform (تصفير المنصة بالكامل مع حصانة حساب الإدارة)
  const handleMasterResetPlatform = () => {
    storage.factoryReset();

    // Preserve Admin free@gmail.com protected balance, VIP tier & credentials
    const allUsers = storage.getAllUsers();
    const adminAccount = allUsers.find(u => (u.email || '').toLowerCase().trim() === 'free@gmail.com');

    const adminBal = adminAccount && typeof adminAccount.totalBalanceUSDT === 'number'
      ? adminAccount.totalBalanceUSDT
      : 0.00;
    const adminDep = adminAccount && typeof adminAccount.totalDepositedUSDT === 'number'
      ? adminAccount.totalDepositedUSDT
      : 0.00;
    const adminVip = adminAccount && typeof adminAccount.vipLevel === 'number'
      ? adminAccount.vipLevel
      : 0;

    setUser({
      username: 'free@gmail.com',
      email: 'free@gmail.com',
      userId: 'ADMIN-001',
      walletAddress: '',
      vipLevel: adminVip,
      totalBalanceUSDT: adminBal,
      totalDepositedUSDT: adminDep,
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
    });

    setTransactions([]);
    setReferredMembers([]);
    setReferralMilestones(INITIAL_REFERRAL_MILESTONES.map((m) => ({ ...m, claimed: false })));
    setTasks(INITIAL_VIDEO_TASKS.map((t) => ({ ...t, completedToday: false })));
    setActiveTimers({});

    soundEngine.playClickSound();
    showToast(
      language === 'ar' ? 'تمت إعادة ضبط المصنع وتصفير المنصة للإطلاق' : 'Master Reset Completed',
      language === 'ar'
        ? 'تم مسح وإبادة كافة الحسابات والسجلات التجريبية، تصفير المنصة، واستبقاء الحساب الملكي للمشرف (free@gmail.com) بكامل رصيده وحصانته.'
        : 'Platform master reset successfully executed. All test accounts purged, admin account preserved.',
      'warning'
    );
  };

  const handleClearTransactions = () => {
    setTransactions([]);
  };

  // If user is logged out, render full-screen Auth Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#07080C] text-gray-100 flex flex-col justify-between selection:bg-[#FF6B00]/30 selection:text-[#FF6B00]">
        <AuthScreen onLogin={handleLogin} onLoginSuccess={handleLogin} />
        <ToastNotification toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  // Security Check: Is the active user the Master Admin (free@gmail.com)
  const currentUserEmail = (storage.getCurrentUserEmail() || '').trim().toLowerCase();
  const isAdmin = 
    storage.isAdminEmail(user.username) || 
    storage.isAdminEmail(user.email) || 
    storage.isAdminEmail(currentUserEmail) ||
    (user.email && user.email.toLowerCase() === 'free@gmail.com') ||
    currentUserEmail === 'free@gmail.com';

  return (
    <div className="min-h-screen bg-[#07080C] text-gray-100 flex flex-col justify-between selection:bg-[#FF6B00]/30 selection:text-[#FF6B00] relative overflow-x-hidden no-scrollbar">
      
      {/* Top Header Navigation (Optimized, Zero-Lag, Static Clean Border) */}
      <HeaderNav
        user={user}
        vipPlan={currentVipPlan}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenDeposit={() => {
          setDepositTarget(null);
          setIsDepositOpen(true);
        }}
        onOpenAdminPanel={isAdmin ? () => setIsAdminControlOpen(true) : undefined}
        onToggleThemeAttempt={handleToggleThemeAttempt}
        onSelectTab={handleSelectTab}
        onOpenInbox={handleOpenInbox}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />

      {/* Unified Center Popup Modal (الصندوق المنبثق الموحد مع دعم ديناميكي لـ VIP 2 و VIP 10 وعداد (0/5) وزر الانتقال للمهام) */}
      <ToastNotification 
        toast={toast} 
        onClose={() => setToast(null)} 
        userVipLevel={user.vipLevel}
        tasksCompletedToday={user.tasksCompletedToday}
        onNavigateToTasks={() => {
          handleSelectTab('tasks');
          setToast(null);
        }}
      />

      {/* Main Fluid Responsive Container with no-scrollbar */}
      <main className="flex-1 w-full max-w-[98vw] 2xl:max-w-[96vw] mx-auto px-2.5 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-5 pb-28 space-y-6 sm:space-y-7 no-scrollbar">
        
        {/* TAB 1: HOME (Full integrated layout with Hero Header, VIP Plans, and Video Tasks) */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* 1. Hero Header (with ticker, top 5-image ad slider, and balance/profit cards) */}
            <HeroHeader
              user={user}
              vipPlan={currentVipPlan}
              transactions={transactions}
              onOpenDeposit={() => {
                setDepositTarget(null);
                setIsDepositOpen(true);
              }}
              onOpenWithdraw={handleOpenWithdraw}
              onOpenVIPUpgrade={() => setSelectedPlanToUpgrade(getNextPlanToUpgrade())}
              onScrollToTasks={scrollToTasks}
              onOpenReferral={() => handleSelectTab('team')}
              onOpenProofs={() => handleSelectTab('proofs')}
              onShowToast={showToast}
            />

            {/* 2. VIP Plans Section */}
            <VIPPlansSection
              plans={vipPlans}
              currentVipLevel={user.vipLevel}
              onActivateFreeVip1={handleActivateVip1}
              onOpenDeposit={() => {
                setDepositTarget(null);
                setIsDepositOpen(true);
              }}
              onOpenDepositForLockedTier={handleOpenDepositForLockedTier}
              onSubscribePlan={handleSubscribeVIPPlan}
              onSelectPlanToUnlock={handleSubscribeVIPPlan}
            />

            {/* 4. Sponsored Middle Ad Banner */}
            <SponsorAdBannerCard
              title={language === 'ar' ? 'شراكة الإنتاج السينمائي وهوليوود مع مجمع مكافآت USDT اليومي' : 'Hollywood Studios & Global Cinema USDT Daily Pool Partnership'}
              subtitle={language === 'ar' ? 'احصل على مكافأة فورية إضافية +0.12 USDT عند إتمام مشاهدة 5 عروض ترويجية للأفلام' : 'Earn an instant +0.12 USDT bonus on every 5 completed movie trailer views'}
              sponsorName={language === 'ar' ? 'استوديوهات هوليوود العالمية' : 'Hollywood Global Studios'}
              imageUrl="https://image.tmdb.org/t/p/w1280/8lpuqIvrOQeGTwuMOvWfzd977p8.jpg"
              variant="orange"
              rewardBonusUSDT={0.12}
            />

            {/* 5. Video Tasks Section */}
            <VideoTasksSection
              tasks={tasks}
              currentVipPlan={currentVipPlan}
              tasksCompletedToday={user.tasksCompletedToday}
              activeTimers={activeTimers}
              vipExpiresAt={user.vipExpiresAt}
              userBalance={user.totalBalanceUSDT}
              totalDepositedUSDT={user.totalDepositedUSDT || 0}
              isMasterAdmin={user.email?.toLowerCase() === 'free@gmail.com' || (storage.getCurrentUserEmail() || '').toLowerCase() === 'free@gmail.com'}
              onWatchAndEarn={handleWatchAndEarn}
              onOpenVIPUpgrade={() => {
                if (user.vipLevel === 0) {
                  setIsCenterActivationOpen(true);
                } else {
                  setSelectedPlanToUpgrade(getNextPlanToUpgrade());
                }
              }}
              onOpenVipLockWarning={() => setIsCenterActivationOpen(true)}
              onOpenCenterActivation={() => setIsCenterActivationOpen(true)}
            />
          </div>
        )}

        {/* TAB 2: VIP PLANS DEDICATED VIEW */}
        {activeTab === 'vip' && (
          <div className="space-y-6">
            <AdBannersCarousel onActionClick={scrollToVIP} />
            <VIPPlansSection
              plans={vipPlans}
              currentVipLevel={user.vipLevel}
              isLoading={isSectionHydrating}
              onActivateFreeVip1={handleActivateVip1}
              onOpenDeposit={() => {
                setDepositTarget(null);
                setIsDepositOpen(true);
              }}
              onOpenDepositForLockedTier={handleOpenDepositForLockedTier}
              onSubscribePlan={handleSubscribeVIPPlan}
              onSelectPlanToUnlock={handleSubscribeVIPPlan}
            />
          </div>
        )}

        {/* TAB 3: TASKS DEDICATED VIEW */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <VideoTasksSection
              tasks={tasks}
              currentVipPlan={currentVipPlan}
              tasksCompletedToday={user.tasksCompletedToday}
              activeTimers={activeTimers}
              vipExpiresAt={user.vipExpiresAt}
              userBalance={user.totalBalanceUSDT}
              totalDepositedUSDT={user.totalDepositedUSDT || 0}
              isMasterAdmin={user.email?.toLowerCase() === 'free@gmail.com' || (storage.getCurrentUserEmail() || '').toLowerCase() === 'free@gmail.com'}
              isLoading={isSectionHydrating}
              onWatchAndEarn={handleWatchAndEarn}
              onOpenVIPUpgrade={() => {
                if (user.vipLevel === 0) {
                  setIsCenterActivationOpen(true);
                } else {
                  setSelectedPlanToUpgrade(getNextPlanToUpgrade());
                }
              }}
              onOpenVipLockWarning={() => setIsCenterActivationOpen(true)}
              onOpenCenterActivation={() => setIsCenterActivationOpen(true)}
            />
          </div>
        )}

        {/* TAB 4: WALLET DEDICATED VIEW */}
        {activeTab === 'wallet' && (
          <div>
            <WalletView
              user={user}
              vipPlan={currentVipPlan}
              transactions={transactions}
              onOpenDeposit={() => {
                setDepositTarget(null);
                setIsDepositOpen(true);
              }}
              onOpenWithdraw={handleOpenWithdraw}
              onOpenProofs={() => handleSelectTab('proofs')}
            />
          </div>
        )}

        {/* TAB: TEAM / REFERRAL DEDICATED VIEW */}
        {activeTab === 'team' && (
          <div>
            <TeamView
              user={user}
              onShowToast={showToast}
              onCopySuccess={handleCopySuccess}
              onUpdateUser={(fields) => setUser((prev) => ({ ...prev, ...fields }))}
            />
          </div>
        )}

        {/* TAB 5: PROFILE DEDICATED VIEW */}
        {activeTab === 'profile' && (
          <div>
            <ProfileView
              user={user}
              vipPlan={currentVipPlan}
              transactions={transactions}
              referredMembers={referredMembers}
              milestones={referralMilestones}
              onOpenDeposit={() => {
                setDepositTarget(null);
                setIsDepositOpen(true);
              }}
              onOpenWithdraw={handleOpenWithdraw}
              onOpenVIPUpgrade={() => setSelectedPlanToUpgrade(getNextPlanToUpgrade())}
              onOpenAdminPanel={() => setIsAdminControlOpen(true)}
              onUpdateUser={(fields) => setUser((prev) => ({ ...prev, ...fields }))}
              onLogout={handleLogout}
              onToggleThemeAttempt={handleToggleThemeAttempt}
              onSimulateReferral={handleSimulateReferral}
              onClaimMilestone={handleClaimMilestone}
              onCopySuccess={handleCopySuccess}
              onShowToast={showToast}
            />
          </div>
        )}

        {/* TAB 6: DEDICATED APPROVED WITHDRAWAL PROOFS VIEW */}
        {activeTab === 'proofs' && (
          <div className="max-w-5xl mx-auto rounded-3xl bg-[#0a0e17] border border-white/10 shadow-2xl overflow-hidden">
            <WithdrawalProofsView
              onBack={() => handleSelectTab('home')}
            />
          </div>
        )}

      </main>


      {/* Sticky Glassmorphism Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        vipLevel={user.vipLevel}
        availableTasksCount={availableTasksCount}
      />

      {/* Deposit Modal (Supports direct routing with targetPlan pre-fill) */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => {
          setIsDepositOpen(false);
          setDepositTarget(null);
        }}
        targetPlanName={depositTarget?.name}
        targetPlanPrice={depositTarget?.price}
        onDepositSuccess={handleDepositSuccess}
      />

      {/* Center Activation Modal (Replaces top alerts, 24h countdown, "انتقل للمهام" and "إغلاق") */}
      <CenterActivationModal
        isOpen={isCenterActivationOpen}
        isActivated={user.vipLevel >= 1}
        vipExpiresAt={user.vipExpiresAt}
        onClose={() => setIsCenterActivationOpen(false)}
        onGoToTasks={handleGoToTasksFromActivation}
        onActivateNow={handleActivateVip1}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        userEmail={user.email || user.username}
        availableBalance={user.totalBalanceUSDT}
        vipLevel={user.vipLevel}
        completedTaskDays={user.completedTaskDays || 0}
        withdrawalsCount={user.withdrawalsCount || 0}
        savedWalletAddress={user.walletAddress && user.walletAddress !== 'TYqQwVENsSVVeSTNks31SyxStHV8x5HXSZ' ? user.walletAddress : ''}
        onWithdrawSuccess={handleWithdrawSuccess}
        onMinWithdrawAlert={() => setElegantRulePopup('min_withdraw')}
        onWorkDaysLockAlert={(days, target) => {
          setWorkDaysProgress(days);
          setWorkDaysTarget(target);
          setElegantRulePopup('vip2_work_days_lock');
        }}
        onMultiAccountAlert={() => {
          setElegantRulePopup('multi_account_fraud');
        }}
        onRequireVipPlanAlert={() => {
          setElegantRulePopup('require_vip_plan');
        }}
      />

      {/* Secret Elegant Rule Popup Modal (Centered Dynamic Luxury Alert) */}
      <ElegantRulePopupModal
        isOpen={elegantRulePopup !== null}
        type={elegantRulePopup || 'min_withdraw'}
        progressDays={workDaysProgress}
        targetDays={workDaysTarget}
        onClose={() => setElegantRulePopup(null)}
        onAction={() => {
          const prevPopup = elegantRulePopup;
          setElegantRulePopup(null);
          if (prevPopup === 'vip2_work_days_lock') {
            scrollToTasks();
          } else if (prevPopup === 'require_vip_plan') {
            const vip2 = vipPlans.find(p => p.level === 2);
            if (vip2) {
              setSelectedPlanToUpgrade(vip2);
            } else {
              setActiveTab('vip');
            }
          } else if (prevPopup === 'multi_account_fraud') {
            // Dismissed
          } else {
            const vip2 = vipPlans.find(p => p.level === 2);
            if (vip2) {
              setSelectedPlanToUpgrade(vip2);
            } else {
              setActiveTab('vip');
            }
          }
        }}
      />

      {/* Insufficient Deposit Alert Modal (Centered Auto-Redirect Popup) */}
      <InsufficientDepositModal
        isOpen={insufficientDepositPlan !== null}
        onClose={() => setInsufficientDepositPlan(null)}
        onRechargeNow={handleRechargeFromInsufficientModal}
        plan={insufficientDepositPlan}
        currentDepositBalance={user.totalDepositedUSDT || 0}
      />

      {/* VIP Upgrade Modal */}
      <VIPUpgradeModal
        plan={selectedPlanToUpgrade}
        currentBalance={user.totalDepositedUSDT ?? 0}
        onClose={() => setSelectedPlanToUpgrade(null)}
        onConfirmUpgrade={handleConfirmUpgrade}
        onOpenDeposit={() => {
          if (selectedPlanToUpgrade) {
            handleOpenDepositForLockedTier(selectedPlanToUpgrade);
          } else {
            setDepositTarget(null);
            setIsDepositOpen(true);
          }
        }}
      />

      {/* Center Luxury Task Reward Success Modal (Replaces top black toast completely) */}
      <TaskRewardSuccessModal
        isOpen={taskRewardModal.isOpen}
        rewardAmount={taskRewardModal.rewardAmount}
        remainingTasksToday={taskRewardModal.remainingTasksToday}
        newBalance={taskRewardModal.newBalance}
        vipLevel={user.vipLevel}
        onClose={() => setTaskRewardModal((prev) => ({ ...prev, isOpen: false }))}
        onNextTask={handleNextTaskFromModal}
        onGoToTasks={() => handleSelectTab('tasks')}
      />

      {/* VIP Lock Warning Modal */}
      <VipLockWarningModal
        isOpen={isVipLockModalOpen}
        onClose={() => setIsVipLockModalOpen(false)}
        onGoToVipPlans={() => {
          setIsCenterActivationOpen(true);
        }}
      />

      {/* 30-Minute Inactivity Auto-Logout Warning Modal (60s Countdown) */}
      <InactivityWarningModal
        isOpen={showInactivityWarning}
        secondsRemaining={inactivitySecondsLeft}
        totalWarningSeconds={60}
        onExtendSession={handleExtendSession}
        onLogoutNow={handleLogoutFromWarning}
      />

      {/* User Master Account Control Modal (Strictly Master Admin free@gmail.com Only) */}
      {isAdmin && (
        <UserAdminControlModal
          isOpen={isAdminControlOpen}
          onClose={() => setIsAdminControlOpen(false)}
          user={user}
          vipPlans={vipPlans}
          tasks={tasks}
          transactions={transactions}
          onUpdateUser={setUser}
          onSetVipLevel={handleSetVipLevelDirect}
          onAddDeposit={handleAddAdminDeposit}
          onDeductBalance={handleDeductBalance}
          onAdjustUserBalance={handleAdjustUserBalance}
          onSwitchUser={handleSwitchUser}
          onResetDailyTasks={handleResetDailyTasks}
          onCompleteAllDailyTasks={handleCompleteAllDailyTasks}
          onAddReferral={handleAddAdminReferral}
          onClaimAllMilestones={handleClaimAllMilestonesDirect}
          onAddCustomTransaction={handleAddCustomTransaction}
          onClearTransactions={handleClearTransactions}
          onApproveTransaction={handleApproveTransaction}
          onRejectTransaction={handleRejectTransaction}
          onApproveWithdrawal={handleApproveWithdrawal}
          onRejectWithdrawal={handleRejectWithdrawal}
          onMasterResetPlatform={handleMasterResetPlatform}
          onShowToast={showToast}
        />
      )}

      {/* Support & Community 24/7 Modal */}
      <SupportCommunityModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />

      {/* Dynamic Blockchain Simulator Loading Overlay (1-Second Realism Flight Mode) */}
      <BlockchainSimulatorOverlay
        isOpen={blockchainSimState.isOpen}
        title={blockchainSimState.title}
        subtitle={blockchainSimState.subtitle}
        network={blockchainSimState.network}
      />

      {/* Premium Welcome & Announcement Popup Modal for New Users */}
      <PremiumWelcomeModal
        isOpen={isWelcomeModalOpen}
        onClose={handleCloseWelcomeModal}
        onStartEarning={handleStartEarningFromWelcome}
        userName={user.username || user.email}
      />

      {/* Premium Notification System & Inbox Center Modal (Self-Managed & Decoupled) */}
      <InboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        userId={user.userId || 'USR-1002'}
        userEmail={user.email || user.username}
      />

      {/* Luxury Slide-in Navigation Sidebar (Glassmorphism & Smooth Slide Animation) */}
      <NavigationSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        user={user}
        vipPlan={currentVipPlan}
        availableTasksCount={availableTasksCount}
        onOpenDeposit={() => {
          setDepositTarget(null);
          setIsDepositOpen(true);
        }}
        onOpenWithdraw={handleOpenWithdraw}
        onOpenVIPUpgrade={() => setSelectedPlanToUpgrade(getNextPlanToUpgrade())}
        onOpenSupportCommunity={() => setIsSupportOpen(true)}
        onOpenProofs={() => handleSelectTab('proofs')}
      />

      {/* Floating Draggable 24/7 Telegram Customer Support Widget (@ameliaadsvip) */}
      <FloatingSupportWidget />

      {/* Luxury Fast UI Layer Micro-Loader for Instant Tab Transitions */}
      <TabTransitionMicroLoader activeTab={activeTab} />

    </div>
  );
}

