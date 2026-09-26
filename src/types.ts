export type NavTab = 'home' | 'vip' | 'team' | 'profile' | 'tasks' | 'wallet' | 'proofs';

export type LanguageCode = 'ar' | 'en' | 'es' | 'fr' | 'ru' | 'ca' | 'hi';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'rtl' | 'ltr';
}

export interface VIPPlan {
  id: string;
  level: number;
  name: string;
  title: string;
  priceUSDT: number;
  dailyIncomeUSDT: number;
  monthlyIncomeUSDT: number;
  tasksPerDay: number;
  rewardPerTaskUSDT: number;
  badgeColor: string;
  borderColor: string;
  glowColor: string;
  accentColor: string;
  popularTag?: string;
  perks: string[];
  // Rich 4K Visual Media & Equipment Assets
  bgImageUrl: string;
  characterImageUrl: string;
  characterGender: 'male' | 'female';
  characterName: string;
  characterNameAr: string;
  characterRole: string;
  characterRoleAr: string;
  equipmentImageUrl: string;
  equipmentName: string;
  equipmentNameAr: string;
  equipmentPower: string;
  videoAdPreviewUrl: string;
  videoAdTitle: string;
  videoAdTitleAr: string;
  sponsorImageUrl: string;
  sponsorBrand: string;
}

export interface VideoTask {
  id: string;
  title: string;
  sponsor: string;
  category: string;
  iconName: string;
  durationSeconds: number;
  rewardUSDT: number;
  requiredVipLevel: number;
  viewsCount: string;
  adUrl: string;
  tags: string[];
  thumbnailUrl?: string;
  completedToday?: boolean;
}

export interface CompletedTaskLog {
  id: string;
  taskId: string;
  taskTitle: string;
  sponsor: string;
  rewardUSDT: number;
  vipLevel: number;
  completedAt: string; // ISO date string
  dateKey: string; // YYYY-MM-DD
  userEmail?: string;
  category?: string;
}

export interface AdBanner {
  id: string;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  badge: string;
  badgeAr: string;
  sponsor: string;
  sponsorLogoUrl?: string;
  imageUrl: string;
  targetUrl: string;
  ctaText: string;
  ctaTextAr: string;
  rewardBonusUSDT?: number;
  category: 'exchange' | 'defi' | 'crypto_card' | 'bot' | 'airdrop' | 'vip_boost';
  accentColor: string;
}

export interface UserProfile {
  username: string;
  userId: string;
  email?: string;
  avatarUrl?: string;
  photoURL?: string;
  walletAddress: string;
  vipLevel: number;
  totalBalanceUSDT: number;
  totalDepositedUSDT?: number;
  taskEarningsToday: number;
  totalWithdrawnUSDT: number;
  tasksCompletedToday: number;
  completedTaskDays?: number;
  withdrawalsCount?: number;
  referralCode: string;
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
  lastTasksResetTimestamp?: number;
  lastTasksResetDate?: string;
}

export interface Transaction {
  id: string;
  type: 'task_reward' | 'deposit' | 'withdraw' | 'vip_upgrade' | 'referral_commission';
  amountUSDT: number;
  timestamp: Date | string;
  status: 'completed' | 'approved' | 'pending' | 'processing' | 'failed';
  description: string;
  txHash?: string;
  userEmail?: string;
}

export interface ReferredMember {
  id: string;
  username: string;
  walletAddress: string;
  vipTier: string;
  joinedAt: string;
  bonusEarnedUSDT: number;
  status: 'active' | 'watching_ads' | 'vip_upgraded';
}

export interface ReferralMilestone {
  id: string;
  requiredInvites: number;
  rewardUSDT: number;
  title: string;
  subtitleAr?: string;
  claimed: boolean;
}

export interface ToastNotificationData {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'vip';
  amount?: number;
  actionType?: 'vip_activated' | 'withdraw_success' | 'task_reward' | 'general';
  actionButtonText?: string;
  onAction?: () => void;
  remainingTasks?: number;
  newBalance?: number;
  vipLevel?: number;
  counterText?: string;
  onNavigateToTasks?: () => void;
}

export type NotificationType = 
  | 'deposit_pending'
  | 'deposit_approved' 
  | 'deposit_rejected' 
  | 'vip_activated' 
  | 'withdrawal_pending'
  | 'withdrawal_approved' 
  | 'withdrawal_rejected' 
  | 'referral_bonus'
  | 'welcome' 
  | 'system';

export interface SystemNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string | Date;
  read: boolean;
  amount?: number;
  vipLevel?: number;
  badgeLabel?: string;
  userEmail?: string;
  userId?: string;
}

