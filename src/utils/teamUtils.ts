import { storage, StoredAccount } from './storage';
import { Transaction } from '../types';

export interface TeamMemberItem {
  id: string;
  email: string;
  username: string;
  walletAddress: string;
  vipLevel: number;
  joinedDate: string;
  depositAmount: number;
  commissionGeneratedUSDT: number;
  tasksCompleted: number;
  status: 'active' | 'inactive';
}

export interface TeamLevelData {
  levelNumber: 1 | 2 | 3;
  commissionRate: number; // 10%, 5%, 2%
  membersCount: number;
  validMembersCount: number;
  totalDepositUSDT: number;
  totalCommissionUSDT: number;
  members: TeamMemberItem[];
}

export interface FullTeamData {
  teamSize: number;
  teamRechargeUSDT: number;
  newTeamTodayCount: number;
  teamRechargeCount: number;
  firstWithdrawalCount: number;
  level1: TeamLevelData;
  level2: TeamLevelData;
  level3: TeamLevelData;
}

export const getFullTeamData = (userReferralCode: string, userEmail?: string): FullTeamData => {
  const cleanCode = (userReferralCode || '').trim().toUpperCase();
  const allUsers = storage.getAllUsers();
  const allTx = storage.getAllTransactions();
  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to calculate total verified deposit of a specific user
  const getUserTotalDeposit = (acc: StoredAccount): number => {
    if (typeof acc.totalDepositedUSDT === 'number' && acc.totalDepositedUSDT > 0) {
      return acc.totalDepositedUSDT;
    }
    const accEmail = (acc.email || '').toLowerCase();
    const userTxs = allTx.filter(
      (tx) =>
        accEmail &&
        (tx.userEmail || '').toLowerCase() === accEmail &&
        (tx.type === 'deposit' || tx.type === 'vip_upgrade') &&
        tx.status === 'completed'
    );
    return userTxs.reduce((sum, tx) => sum + (tx.amountUSDT || 0), 0);
  };

  // Helper to calculate total withdrawal of a user
  const getUserTotalWithdrawal = (acc: StoredAccount): number => {
    if (typeof acc.totalWithdrawnUSDT === 'number' && acc.totalWithdrawnUSDT > 0) {
      return acc.totalWithdrawnUSDT;
    }
    const accEmail = (acc.email || '').toLowerCase();
    const userTxs = allTx.filter(
      (tx) =>
        accEmail &&
        (tx.userEmail || '').toLowerCase() === accEmail &&
        tx.type === 'withdraw' &&
        tx.status === 'completed'
    );
    return userTxs.reduce((sum, tx) => sum + (tx.amountUSDT || 0), 0);
  };

  // Helper to map StoredAccount to TeamMemberItem
  const mapMemberItem = (acc: StoredAccount, commissionRate: number): TeamMemberItem => {
    const deposit = getUserTotalDeposit(acc);
    // Estimated commission generated for the sponsor based on tasks or deposits
    const commissionGenerated = (acc.tasksCompletedToday || 0) * 0.09 * (commissionRate / 100);

    return {
      id: acc.id,
      email: acc.email,
      username: acc.username || acc.email.split('@')[0],
      walletAddress: acc.walletAddress,
      vipLevel: acc.vipLevel,
      joinedDate: acc.joinedDate || todayStr,
      depositAmount: deposit,
      commissionGeneratedUSDT: Number(commissionGenerated.toFixed(4)),
      tasksCompleted: acc.tasksCompletedToday || 0,
      status: acc.vipLevel > 0 || acc.tasksCompletedToday > 0 || deposit > 0 ? 'active' : 'active',
    };
  };

  // 1. Find Level 1 Members (Direct referrals)
  const l1Accounts = cleanCode
    ? allUsers.filter((u) => u.referredBy && u.referredBy.trim().toUpperCase() === cleanCode)
    : [];
  const l1Codes = l1Accounts.map((u) => (u.referralCode || '').trim().toUpperCase()).filter(Boolean);

  // 2. Find Level 2 Members
  const l2Accounts = l1Codes.length > 0
    ? allUsers.filter((u) => u.referredBy && l1Codes.includes((u.referredBy || '').trim().toUpperCase()))
    : [];
  const l2Codes = l2Accounts.map((u) => (u.referralCode || '').trim().toUpperCase()).filter(Boolean);

  // 3. Find Level 3 Members
  const l3Accounts = l2Codes.length > 0
    ? allUsers.filter((u) => u.referredBy && l2Codes.includes((u.referredBy || '').trim().toUpperCase()))
    : [];

  const l1Members = l1Accounts.map((a) => mapMemberItem(a, 10));
  const l2Members = l2Accounts.map((a) => mapMemberItem(a, 5));
  const l3Members = l3Accounts.map((a) => mapMemberItem(a, 2));

  const l1Deposits = l1Members.reduce((sum, m) => sum + m.depositAmount, 0);
  const l2Deposits = l2Members.reduce((sum, m) => sum + m.depositAmount, 0);
  const l3Deposits = l3Members.reduce((sum, m) => sum + m.depositAmount, 0);

  // Fetch verified commission amounts recorded for the user
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  const refComms = allTx.filter(
    (tx) =>
      (tx.userEmail || '').toLowerCase() === cleanEmail &&
      tx.type === 'referral_commission' &&
      tx.status === 'completed'
  );

  const l1Comm = refComms
    .filter((tx) => {
      const desc = tx.description || '';
      return desc.includes('المستوى 1') || desc.includes('Level 1') || !desc.includes('المستوى');
    })
    .reduce((sum, tx) => sum + (tx.amountUSDT || 0), 0);
  const l2Comm = refComms
    .filter((tx) => {
      const desc = tx.description || '';
      return desc.includes('المستوى 2') || desc.includes('Level 2');
    })
    .reduce((sum, tx) => sum + (tx.amountUSDT || 0), 0);
  const l3Comm = refComms
    .filter((tx) => {
      const desc = tx.description || '';
      return desc.includes('المستوى 3') || desc.includes('Level 3');
    })
    .reduce((sum, tx) => sum + (tx.amountUSDT || 0), 0);

  const allTeamAccounts = [...l1Accounts, ...l2Accounts, ...l3Accounts];
  const teamSize = allTeamAccounts.length;
  const teamRechargeUSDT = l1Deposits + l2Deposits + l3Deposits;

  // New team today
  const newTeamTodayCount = allTeamAccounts.filter(
    (a) => (a.joinedDate || '').startsWith(todayStr)
  ).length;

  // Total members who recharged
  const teamRechargeCount = allTeamAccounts.filter((a) => getUserTotalDeposit(a) > 0).length;

  // First withdrawal count
  const firstWithdrawalCount = allTeamAccounts.filter((a) => getUserTotalWithdrawal(a) > 0).length;

  return {
    teamSize,
    teamRechargeUSDT,
    newTeamTodayCount,
    teamRechargeCount,
    firstWithdrawalCount,
    level1: {
      levelNumber: 1,
      commissionRate: 10,
      membersCount: l1Accounts.length,
      validMembersCount: l1Accounts.length,
      totalDepositUSDT: l1Deposits,
      totalCommissionUSDT: Number((l1Comm || l1Deposits * 0.10).toFixed(2)),
      members: l1Members,
    },
    level2: {
      levelNumber: 2,
      commissionRate: 5,
      membersCount: l2Accounts.length,
      validMembersCount: l2Accounts.length,
      totalDepositUSDT: l2Deposits,
      totalCommissionUSDT: Number((l2Comm || l2Deposits * 0.05).toFixed(2)),
      members: l2Members,
    },
    level3: {
      levelNumber: 3,
      commissionRate: 2,
      membersCount: l3Accounts.length,
      validMembersCount: l3Accounts.length,
      totalDepositUSDT: l3Deposits,
      totalCommissionUSDT: Number((l3Comm || l3Deposits * 0.02).toFixed(2)),
      members: l3Members,
    },
  };
};

/**
 * Interactive helper to register or simulate a new member joining via the referral link
 */
export const registerReferralMember = (
  sponsorRefCode: string,
  level: 1 | 2 | 3 = 1,
  initialDeposit: number = 0
): StoredAccount => {
  const users = storage.getAllUsers();
  const cleanSponsorCode = (sponsorRefCode || '').trim().toUpperCase();
  const sponsor = users.find((u) => (u.referralCode || '').toUpperCase() === cleanSponsorCode);

  let targetInviterCode = cleanSponsorCode;

  if (level === 2) {
    // Find or create an L1 user to be the direct parent
    let l1User = users.find((u) => (u.referredBy || '').toUpperCase() === cleanSponsorCode);
    if (!l1User) {
      l1User = registerReferralMember(cleanSponsorCode, 1, 0);
    }
    targetInviterCode = l1User.referralCode || cleanSponsorCode;
  } else if (level === 3) {
    // Find or create an L2 user
    let l1User = users.find((u) => (u.referredBy || '').toUpperCase() === cleanSponsorCode);
    if (!l1User) {
      l1User = registerReferralMember(cleanSponsorCode, 1, 0);
    }
    let l2User = users.find((u) => (u.referredBy || '').toUpperCase() === (l1User.referralCode || '').toUpperCase());
    if (!l2User) {
      l2User = registerReferralMember(l1User.referralCode || cleanSponsorCode, 1, 0);
    }
    targetInviterCode = l2User.referralCode || cleanSponsorCode;
  }

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const randomEmail = `trader_${randomNum}@crypto.vip`;
  const randomUsername = `Member_${randomNum}`;

  const result = storage.registerNewUser(randomEmail, randomUsername, '123456', targetInviterCode);
  const created = result.user || storage.getUserByEmail(randomEmail)!;

  if (initialDeposit > 0) {
    const depTx: Transaction = {
      id: `tx-dep-${Date.now()}-${randomNum}`,
      type: 'deposit',
      amountUSDT: initialDeposit,
      status: 'pending', // Strictly pending admin approval from Control Panel!
      description: `طلب إيداع شبكة TRC-20 (+${initialDeposit.toFixed(2)} USDT) [بانتظار موافقة المشرف]`,
      timestamp: new Date().toISOString(),
      userEmail: created.email,
    };
    storage.addTransaction(depTx);
    // Note: Total deposit and 10%/5%/2% commissions are strictly bound to Admin approval!
  }

  // Notify listeners to re-render
  window.dispatchEvent(new Event('storage'));
  return created;
};
