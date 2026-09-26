import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface StoredAccount {
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
  referralCode: string;
  referredBy?: string;
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
  tasksState?: { id: string; completedToday: boolean }[];
  transactions?: any[];
  lastModified?: number;
}

interface NetworkDatabase {
  accounts: StoredAccount[];
  transactions: any[];
  notifications: any[];
  lastUpdated: number;
}

const DB_FILE = path.join(process.cwd(), "unified_network_db.json");

const DEFAULT_ADMIN: StoredAccount = {
  id: "ADMIN-001",
  email: "free@gmail.com",
  username: "free@gmail.com",
  password: "000000",
  walletAddress: "",
  vipLevel: 0,
  totalBalanceUSDT: 0.0,
  totalDepositedUSDT: 0.0,
  taskEarningsToday: 0.0,
  totalWithdrawnUSDT: 0.0,
  tasksCompletedToday: 0,
  referralCode: "885101",
  referralCount: 0,
  referralEarningsUSDT: 0.0,
  tier1TaskCommissionUSDT: 0.0,
  tier2TaskCommissionUSDT: 0.0,
  tier3TaskCommissionUSDT: 0.0,
  joinedDate: "2026-08-28",
};

function loadDb(): NetworkDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.accounts)) {
        // Preserve all registered user accounts
        parsed.accounts = parsed.accounts.filter((u: StoredAccount) => {
          const email = (u.email || "").toLowerCase().trim();
          return Boolean(email);
        });

        // Ensure transactions are clean
        parsed.transactions = (parsed.transactions || []).filter((tx: any) => {
          return Boolean(tx && tx.id);
        });

        // Ensure notifications are clean
        parsed.notifications = (parsed.notifications || []).filter((n: any) => {
          return Boolean(n && n.id);
        });

        // Ensure free@gmail.com is always present and immune
        const adminFound = parsed.accounts.find(
          (u: StoredAccount) => (u.email || "").toLowerCase().trim() === "free@gmail.com"
        );
        if (!adminFound) {
          parsed.accounts.unshift(DEFAULT_ADMIN);
        } else {
          if (!adminFound.referralCode) adminFound.referralCode = "885101";
          if (!adminFound.password) adminFound.password = "000000";
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error("[UnifiedDB] Failed to load DB, initializing fresh store:", e);
  }

  const freshDb: NetworkDatabase = {
    accounts: [DEFAULT_ADMIN],
    transactions: [],
    notifications: [],
    lastUpdated: Date.now(),
  };
  saveDb(freshDb);
  return freshDb;
}

function saveDb(db: NetworkDatabase) {
  try {
    db.lastUpdated = Date.now();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("[UnifiedDB] Failed to write DB file:", e);
  }
}

function generateUniqueCode(existingUsers: StoredAccount[] = []): string {
  const existing = new Set(existingUsers.map((u) => (u.referralCode || "").trim().toUpperCase()));
  let code = "";
  let attempts = 0;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    attempts++;
  } while (existing.has(code) && attempts < 10000);
  return code;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body parsing with high limit
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // CORS headers for embedded iframe or local testing
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // --- API ROUTES FIRST ---

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // 1. Get entire unified network state
  app.get("/api/network/state", (_req, res) => {
    const db = loadDb();
    res.json({
      success: true,
      accounts: db.accounts,
      transactions: db.transactions,
      notifications: db.notifications,
      lastUpdated: db.lastUpdated,
    });
  });

  // 2. Real-time Live Link Registration Endpoint
  // Directly updates inviter's team size in the unified network database across all browsers & incognito tabs
  app.post("/api/network/register", (req, res) => {
    const { email, username, password, referralCode, referredBy } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    const db = loadDb();

    // Check if user already exists
    const existing = db.accounts.find((u) => (u.email || "").toLowerCase() === cleanEmail);
    if (existing) {
      return res.json({
        success: true,
        alreadyExists: true,
        user: existing,
        allAccounts: db.accounts,
      });
    }

    // Resolve inviter
    let inviter: StoredAccount | null = null;
    const cleanRef = (referredBy || referralCode || "").trim().toUpperCase();
    if (cleanRef) {
      inviter = db.accounts.find(
        (u) =>
          (u.referralCode && u.referralCode.trim().toUpperCase() === cleanRef) ||
          (u.email && u.email.split("@")[0].trim().toUpperCase() === cleanRef) ||
          (cleanRef === "885101" && (u.email || "").toLowerCase() === "free@gmail.com")
      ) || null;
    }

    // Always fallback to free@gmail.com if inviter code was 885101
    if (!inviter && cleanRef === "885101") {
      inviter = db.accounts.find((u) => (u.email || "").toLowerCase() === "free@gmail.com") || null;
    }

    const newReferralCode = generateUniqueCode(db.accounts);
    const newAccount: StoredAccount = {
      id: `USR-${Date.now().toString().slice(-6)}`,
      email: cleanEmail,
      username: username || cleanEmail.split("@")[0],
      password: password || "123456",
      walletAddress: `0x${Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}...${Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      vipLevel: 0,
      totalBalanceUSDT: 0.0,
      totalDepositedUSDT: 0.0,
      taskEarningsToday: 0.0,
      totalWithdrawnUSDT: 0.0,
      tasksCompletedToday: 0,
      referralCode: newReferralCode,
      referredBy: inviter ? inviter.referralCode : cleanRef || undefined,
      referralCount: 0,
      referralEarningsUSDT: 0.0,
      joinedDate: new Date().toISOString().split("T")[0],
      tasksState: [],
    };

    // Increment inviter's team size in real-time
    if (inviter) {
      inviter.referralCount = (inviter.referralCount || 0) + 1;
    }

    db.accounts.push(newAccount);
    saveDb(db);

    console.log(`[UnifiedDB] Registered new user ${cleanEmail}, inviter: ${inviter?.email || "none"}, team count now: ${inviter?.referralCount || 0}`);

    return res.json({
      success: true,
      user: newAccount,
      inviter: inviter || undefined,
      allAccounts: db.accounts,
    });
  });

  // 3. Deposit Approval & 3-Tier Commission Instant Distribution
  // Level 1: 10%, Level 2: 5%, Level 3: 2%
  app.post("/api/network/approve-deposit", (req, res) => {
    const { txId, depositorEmail, amount } = req.body;
    const exactAmount = Number(Number(amount || 0).toFixed(2));
    if (exactAmount <= 0) {
      return res.status(400).json({ success: false, error: "Invalid amount" });
    }

    const db = loadDb();
    const cleanEmail = (depositorEmail || "").trim().toLowerCase();

    // 1. Strict Transaction Check (Idempotent Approval)
    let targetTx = db.transactions.find((t) => t.id === txId);
    if (targetTx && (targetTx.status === "completed" || targetTx.status === "approved")) {
      return res.json({
        success: true,
        alreadyApproved: true,
        accounts: db.accounts,
        transactions: db.transactions,
      });
    }

    let depositor = db.accounts.find(
      (u) =>
        (u.email || "").toLowerCase() === cleanEmail ||
        (u.username || "").toLowerCase() === cleanEmail ||
        (cleanEmail.includes("@") && (u.email || "").toLowerCase().startsWith(cleanEmail.split("@")[0]))
    );

    if (depositor && Array.isArray((depositor as any).processedDepositTxIds) && (depositor as any).processedDepositTxIds.includes(txId)) {
      return res.json({
        success: true,
        alreadyApproved: true,
        accounts: db.accounts,
        transactions: db.transactions,
      });
    }

    if (!targetTx && txId) {
      targetTx = {
        id: txId,
        type: "deposit",
        amountUSDT: exactAmount,
        timestamp: new Date().toISOString(),
        status: "completed",
        description: `إيداع مؤكد بقيمة ${exactAmount.toFixed(2)} USDT`,
        userEmail: cleanEmail,
      };
      db.transactions.push(targetTx);
    } else if (targetTx) {
      targetTx.status = "completed";
    }

    // 2. Credit depositor totalDepositedUSDT
    if (depositor) {
      depositor.totalDepositedUSDT = Number(((depositor.totalDepositedUSDT || 0) + exactAmount).toFixed(2));
      (depositor as any).processedDepositTxIds = [...((depositor as any).processedDepositTxIds || []), txId];
      // STRICT RULE: Deposit is credited EXCLUSIVELY to totalDepositedUSDT for purchasing VIP plans
      // It is NEVER added to totalBalanceUSDT (withdrawable balance)
      depositor.lastModified = Date.now();
    } else {
      depositor = {
        id: `USR-${Date.now().toString().slice(-6)}`,
        email: cleanEmail.includes("@") ? cleanEmail : `${cleanEmail}@gmail.com`,
        username: cleanEmail.includes("@") ? cleanEmail.split("@")[0] : cleanEmail,
        password: "000000",
        walletAddress: "",
        vipLevel: 0,
        totalBalanceUSDT: 0.0,
        totalDepositedUSDT: exactAmount,
        taskEarningsToday: 0.0,
        totalWithdrawnUSDT: 0.0,
        tasksCompletedToday: 0,
        referralCode: generateUniqueCode(db.accounts),
        referralCount: 0,
        referralEarningsUSDT: 0.0,
        joinedDate: new Date().toISOString().split("T")[0],
        tasksState: [],
        lastModified: Date.now(),
      };
      db.accounts.push(depositor);
    }

    // 3. Prevent duplicate commission
    const alreadyHandled = db.transactions.some(
      (t) => t.type === "referral_commission" && t.id.includes(`depcomm-l1-${txId}`)
    );

    const commissionResults: any = { totalDistributed: 0 };

    if (!alreadyHandled && depositor && depositor.referredBy) {
      const cleanDepositorName = depositor.username || depositor.email.split("@")[0];

      // Tier 1: 10%
      const l1Code = depositor.referredBy.trim().toUpperCase();
      const level1Sponsor = db.accounts.find(
        (u) => (u.referralCode || "").trim().toUpperCase() === l1Code || (l1Code === "885101" && (u.email || "").toLowerCase() === "free@gmail.com")
      );

      if (level1Sponsor) {
        const comm1 = Number((exactAmount * 0.1).toFixed(2));
        if (comm1 > 0) {
          level1Sponsor.totalBalanceUSDT = Number(((level1Sponsor.totalBalanceUSDT || 0) + comm1).toFixed(2));
          level1Sponsor.referralEarningsUSDT = Number(((level1Sponsor.referralEarningsUSDT || 0) + comm1).toFixed(2));

          const tx1 = {
            id: `tx-depcomm-l1-${txId || Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: "referral_commission",
            amountUSDT: comm1,
            status: "completed",
            description: `عمولة إيداع المستوى 1 (10%): إيداع ${exactAmount.toFixed(2)} USDT بواسطة @${cleanDepositorName} (+${comm1.toFixed(2)} USDT)`,
            timestamp: new Date().toISOString(),
            userEmail: level1Sponsor.email,
            txHash: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
          };
          db.transactions.push(tx1);

          commissionResults.tier1 = {
            sponsorEmail: level1Sponsor.email,
            amount: comm1,
            ratePercent: 10,
          };
          commissionResults.totalDistributed = Number((commissionResults.totalDistributed + comm1).toFixed(2));

          db.notifications.push({
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: "referral_bonus",
            title: "عمولة إحالة مباشرة (المستوى 1)",
            badgeLabel: "عمولة إيداع +10%",
            message: `تهانينا! حصلت على عمولة فورية بقيمة +${comm1.toFixed(2)} USDT إثر قيام العضو @${cleanDepositorName} بشحن حسابه. 💰`,
            amount: comm1,
            userEmail: level1Sponsor.email,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }

        // Tier 2: 5%
        if (level1Sponsor.referredBy) {
          const l2Code = level1Sponsor.referredBy.trim().toUpperCase();
          const level2Sponsor = db.accounts.find((u) => u.referralCode.trim().toUpperCase() === l2Code);
          if (level2Sponsor) {
            const comm2 = Number((exactAmount * 0.05).toFixed(2));
            if (comm2 > 0) {
              level2Sponsor.totalBalanceUSDT = Number(((level2Sponsor.totalBalanceUSDT || 0) + comm2).toFixed(2));
              level2Sponsor.referralEarningsUSDT = Number(((level2Sponsor.referralEarningsUSDT || 0) + comm2).toFixed(2));

              const tx2 = {
                id: `tx-depcomm-l2-${txId || Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                type: "referral_commission",
                amountUSDT: comm2,
                status: "completed",
                description: `عمولة إيداع المستوى 2 (5%): إيداع ${exactAmount.toFixed(2)} USDT بواسطة @${cleanDepositorName} (+${comm2.toFixed(2)} USDT)`,
                timestamp: new Date().toISOString(),
                userEmail: level2Sponsor.email,
              };
              db.transactions.push(tx2);

              commissionResults.tier2 = {
                sponsorEmail: level2Sponsor.email,
                amount: comm2,
                ratePercent: 5,
              };
              commissionResults.totalDistributed = Number((commissionResults.totalDistributed + comm2).toFixed(2));
            }

            // Tier 3: 2%
            if (level2Sponsor.referredBy) {
              const l3Code = level2Sponsor.referredBy.trim().toUpperCase();
              const level3Sponsor = db.accounts.find((u) => u.referralCode.trim().toUpperCase() === l3Code);
              if (level3Sponsor) {
                const comm3 = Number((exactAmount * 0.02).toFixed(2));
                if (comm3 > 0) {
                  level3Sponsor.totalBalanceUSDT = Number(((level3Sponsor.totalBalanceUSDT || 0) + comm3).toFixed(2));
                  level3Sponsor.referralEarningsUSDT = Number(((level3Sponsor.referralEarningsUSDT || 0) + comm3).toFixed(2));

                  const tx3 = {
                    id: `tx-depcomm-l3-${txId || Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    type: "referral_commission",
                    amountUSDT: comm3,
                    status: "completed",
                    description: `عمولة إيداع المستوى 3 (2%): إيداع ${exactAmount.toFixed(2)} USDT بواسطة @${cleanDepositorName} (+${comm3.toFixed(2)} USDT)`,
                    timestamp: new Date().toISOString(),
                    userEmail: level3Sponsor.email,
                  };
                  db.transactions.push(tx3);

                  commissionResults.tier3 = {
                    sponsorEmail: level3Sponsor.email,
                    amount: comm3,
                    ratePercent: 2,
                  };
                  commissionResults.totalDistributed = Number((commissionResults.totalDistributed + comm3).toFixed(2));
                }
              }
            }
          }
        }
      }
    }

    // Automated notification in depositor's inbox
    db.notifications.unshift({
      id: `notif-depapp-${txId || Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: "deposit_approved",
      title: "تم قبول الإيداع",
      badgeLabel: "تم قبول الإيداع",
      message: `تمت الموافقة بنجاح على إيداعك بقيمة +${exactAmount.toFixed(2)} USDT وإضافته إلى محفظتك الاستثمارية. 💵`,
      amount: exactAmount,
      userEmail: depositor.email,
      timestamp: new Date().toISOString(),
      read: false,
    });

    saveDb(db);

    return res.json({
      success: true,
      accounts: db.accounts,
      transactions: db.transactions,
      notifications: db.notifications,
      commissionResults,
    });
  });

  // 4. Record new transaction (Deposit request, withdrawal request, etc.)
  app.post("/api/network/transaction", (req, res) => {
    const { transaction } = req.body;
    if (!transaction || !transaction.id) {
      return res.status(400).json({ success: false, error: "Transaction object required" });
    }

    const db = loadDb();
    const existingIdx = db.transactions.findIndex((t) => t.id === transaction.id);
    if (existingIdx >= 0) {
      db.transactions[existingIdx] = { ...db.transactions[existingIdx], ...transaction };
    } else {
      db.transactions.unshift(transaction);
    }

    // Automated server notification for transactions
    if (transaction.type === "deposit" && transaction.status === "pending") {
      const exists = db.notifications.some((n) => n.id === `notif-dep-req-${transaction.id}`);
      if (!exists) {
        db.notifications.unshift({
          id: `notif-dep-req-${transaction.id}`,
          type: "deposit_pending",
          title: "طلب إيداع قيد المراجعة",
          badgeLabel: "إيداع قيد المراجعة",
          message: `تم تسجيل طلب شحن بقيمة +${Number(transaction.amountUSDT || 0).toFixed(2)} USDT عبر شبكة TRC-20 بنجاح، وطلبك قيد المراجعة والتدقيق الإداري.`,
          amount: Number(transaction.amountUSDT || 0),
          userEmail: (transaction.userEmail || "").toLowerCase(),
          timestamp: transaction.timestamp || new Date().toISOString(),
          read: false,
        });
      }
    } else if (transaction.type === "withdraw" && transaction.status === "pending") {
      const exists = db.notifications.some((n) => n.id === `notif-wth-req-${transaction.id}`);
      if (!exists) {
        db.notifications.unshift({
          id: `notif-wth-req-${transaction.id}`,
          type: "withdrawal_pending",
          title: "طلب سحب قيد المعالجة",
          badgeLabel: "سحب قيد المعالجة",
          message: `تم تسجيل طلب سحب بقيمة ${Number(transaction.amountUSDT || 0).toFixed(2)} USDT بنجاح، وطلبك قيد المراجعة والتحويل.`,
          amount: Number(transaction.amountUSDT || 0),
          userEmail: (transaction.userEmail || "").toLowerCase(),
          timestamp: transaction.timestamp || new Date().toISOString(),
          read: false,
        });
      }
    }

    saveDb(db);
    return res.json({ success: true, transactions: db.transactions, notifications: db.notifications });
  });

  // 4a. Explicit Transaction Status Update (For permanent withdrawal / deposit approvals)
  app.post("/api/network/transaction/status", (req, res) => {
    const { txId, status } = req.body;
    if (!txId) {
      return res.status(400).json({ success: false, error: "txId required" });
    }

    const db = loadDb();
    const cleanId = (txId || "").trim().toLowerCase();
    const target = db.transactions.find((t) => t.id === txId || (t.id && t.id.trim().toLowerCase() === cleanId));
    if (target) {
      target.status = status || "completed";
      const cleanTargetEmail = (target.userEmail || "").toLowerCase();

      // Automated server notification for status transition
      if (target.type === "withdraw" && (status === "completed" || status === "approved")) {
        db.notifications.unshift({
          id: `notif-wthapp-${target.id}-${Date.now()}`,
          type: "withdrawal_approved",
          title: "تم قبول السحب",
          badgeLabel: "تم قبول السحب",
          message: `تمت الموافقة على طلب سحب بقيمة ${Number(target.amountUSDT || 0).toFixed(2)} USDT وتم تحويل الأموال بنجاح إلى محفظتك! 🚀`,
          amount: Number(target.amountUSDT || 0),
          userEmail: cleanTargetEmail,
          timestamp: new Date().toISOString(),
          read: false,
        });
      } else if (target.type === "withdraw" && (status === "failed" || status === "rejected")) {
        db.notifications.unshift({
          id: `notif-wthrej-${target.id}-${Date.now()}`,
          type: "withdrawal_rejected",
          title: "تم رفض السحب",
          badgeLabel: "تم رفض السحب",
          message: `تم رفض طلب السحب بقيمة ${Number(target.amountUSDT || 0).toFixed(2)} USDT وإعادة الرصيد إلى محفظتك.`,
          amount: Number(target.amountUSDT || 0),
          userEmail: cleanTargetEmail,
          timestamp: new Date().toISOString(),
          read: false,
        });
      } else if (target.type === "deposit" && (status === "completed" || status === "approved")) {
        db.notifications.unshift({
          id: `notif-depapp-${target.id}-${Date.now()}`,
          type: "deposit_approved",
          title: "تم قبول الإيداع",
          badgeLabel: "تم قبول الإيداع",
          message: `تمت الموافقة بنجاح على إيداع بقيمة +${Number(target.amountUSDT || 0).toFixed(2)} USDT في محفظتك الاستثمارية. 💵`,
          amount: Number(target.amountUSDT || 0),
          userEmail: cleanTargetEmail,
          timestamp: new Date().toISOString(),
          read: false,
        });
      }

      saveDb(db);
    }

    return res.json({ success: true, transactions: db.transactions, notifications: db.notifications });
  });

  // 4b. Plan Purchase Deduction (Deduct deposit on VIP upgrade and persist permanently)
  app.post("/api/network/purchase-plan", (req, res) => {
    const { email, planLevel, planCost } = req.body;
    const db = loadDb();
    const cleanEmail = (email || "").trim().toLowerCase();
    const account = db.accounts.find((u) => (u.email || "").toLowerCase() === cleanEmail || (u.username || "").toLowerCase() === cleanEmail);
    if (account) {
      const currentDep = Number((account.totalDepositedUSDT || 0).toFixed(2));
      const cost = Number(Number(planCost || 0).toFixed(2));
      account.totalDepositedUSDT = Math.max(0, Number((currentDep - cost).toFixed(2)));
      account.vipLevel = Math.max(account.vipLevel || 0, Number(planLevel) || 0);
      account.vipActivatedAt = Date.now();
      account.lastModified = Date.now();

      // Automated VIP activation notification
      db.notifications.unshift({
        id: `notif-vip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: "vip_activated",
        title: "تفعيل باقة VIP",
        badgeLabel: `تفعيل باقة VIP ${planLevel}`,
        message: `تهانينا! تم تفعيل اشتراك VIP ${planLevel} بنجاح. يمكنك الآن بدء جني الأرباح من مشاهدة الإعلانات اليومية. 🚀`,
        vipLevel: Number(planLevel),
        amount: cost,
        userEmail: cleanEmail,
        timestamp: new Date().toISOString(),
        read: false,
      });

      saveDb(db);
      return res.json({ success: true, account, notifications: db.notifications });
    }
    return res.status(404).json({ success: false, error: "Account not found" });
  });

  // 4c. Withdrawal Balance Deduction (Deduct total balance and persist permanently)
  app.post("/api/network/withdraw", (req, res) => {
    const { email, amount } = req.body;
    const db = loadDb();
    const cleanEmail = (email || "").trim().toLowerCase();
    const account = db.accounts.find((u) => (u.email || "").toLowerCase() === cleanEmail || (u.username || "").toLowerCase() === cleanEmail);
    if (account) {
      const currentBal = Number((account.totalBalanceUSDT || 0).toFixed(2));
      const deductAmt = Number(Number(amount || 0).toFixed(2));
      account.totalBalanceUSDT = Math.max(0, Number((currentBal - deductAmt).toFixed(2)));
      account.lastModified = Date.now();

      db.notifications.unshift({
        id: `notif-wth-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: "withdrawal_pending",
        title: "طلب سحب قيد المعالجة",
        badgeLabel: "سحب قيد المعالجة",
        message: `تم تسجيل طلب سحب بقيمة ${deductAmt.toFixed(2)} USDT بنجاح، وطلبك قيد المعالجة الإدارية. ⏳`,
        amount: deductAmt,
        userEmail: cleanEmail,
        timestamp: new Date().toISOString(),
        read: false,
      });

      saveDb(db);
      return res.json({ success: true, account, notifications: db.notifications });
    }
    return res.status(404).json({ success: false, error: "Account not found" });
  });

  // 4d. Direct deposit addition on server
  app.post("/api/network/deposit", (req, res) => {
    const { email, amount } = req.body;
    const db = loadDb();
    const cleanEmail = (email || "").trim().toLowerCase();
    const account = db.accounts.find((u) => (u.email || "").toLowerCase() === cleanEmail || (u.username || "").toLowerCase() === cleanEmail);
    if (account) {
      const addAmt = Number(Number(amount || 0).toFixed(2));
      account.totalBalanceUSDT = Number(((account.totalBalanceUSDT || 0) + addAmt).toFixed(2));
      account.totalDepositedUSDT = Number(((account.totalDepositedUSDT || 0) + addAmt).toFixed(2));
      account.lastModified = Date.now();

      db.notifications.unshift({
        id: `notif-dep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: "deposit_approved",
        title: "تم قبول الإيداع",
        badgeLabel: "تم قبول الإيداع",
        message: `تمت إضافة إيداع بقيمة +${addAmt.toFixed(2)} USDT بنجاح إلى حسابك. 💵`,
        amount: addAmt,
        userEmail: cleanEmail,
        timestamp: new Date().toISOString(),
        read: false,
      });

      saveDb(db);
      return res.json({ success: true, account, notifications: db.notifications });
    }
    return res.status(404).json({ success: false, error: "Account not found" });
  });

  // 4e. Notification Direct API Management (Record, Read, Delete)
  app.post("/api/network/notification", (req, res) => {
    const { notification } = req.body;
    if (!notification || !notification.id) {
      return res.status(400).json({ success: false, error: "Notification object required" });
    }
    const db = loadDb();
    const cleanUserEmail = (notification.userEmail || "").trim().toLowerCase();
    const cleanNotif = {
      ...notification,
      userEmail: cleanUserEmail,
      timestamp: notification.timestamp || new Date().toISOString(),
    };
    const existingIdx = db.notifications.findIndex((n) => n.id === notification.id);
    if (existingIdx >= 0) {
      db.notifications[existingIdx] = { ...db.notifications[existingIdx], ...cleanNotif };
    } else {
      db.notifications.unshift(cleanNotif);
    }
    saveDb(db);
    return res.json({ success: true, notifications: db.notifications });
  });

  app.post("/api/network/notification/read", (req, res) => {
    const { notifId, email } = req.body;
    const db = loadDb();
    if (notifId) {
      const target = db.notifications.find((n) => n.id === notifId);
      if (target) target.read = true;
    }
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      db.notifications.forEach((n) => {
        if ((n.userEmail || "").toLowerCase() === cleanEmail) {
          n.read = true;
        }
      });
    }
    saveDb(db);
    return res.json({ success: true, notifications: db.notifications });
  });

  app.post("/api/network/notification/delete", (req, res) => {
    const { notifId, email, clearAll } = req.body;
    const db = loadDb();
    if (clearAll && email) {
      const cleanEmail = email.trim().toLowerCase();
      db.notifications = db.notifications.filter((n) => (n.userEmail || "").toLowerCase() !== cleanEmail);
    } else if (notifId) {
      db.notifications = db.notifications.filter((n) => n.id !== notifId);
    }
    saveDb(db);
    return res.json({ success: true, notifications: db.notifications });
  });

  // 4e. Direct Real-time Ad Tracking & 0.01$ Instant Commission to Inviter
  // Automatically called on each ad view completion by a referred member
  app.post("/api/network/task-ad-completed", (req, res) => {
    const { userEmail, referrerCode } = req.body;
    if (!userEmail) {
      return res.status(400).json({ success: false, error: "userEmail is required" });
    }

    const cleanEmail = (userEmail || "").trim().toLowerCase();
    const db = loadDb();
    const subUser = db.accounts.find(
      (u) => (u.email || "").toLowerCase() === cleanEmail || (u.username || "").toLowerCase() === cleanEmail
    );

    const cleanRef = (referrerCode || subUser?.referredBy || "").trim().toUpperCase();

    if (!cleanRef) {
      return res.json({ success: true, commissionAdded: false, reason: "No inviter found" });
    }

    if (subUser && !subUser.referredBy) {
      subUser.referredBy = cleanRef;
    }

    const inviter = db.accounts.find(
      (u) =>
        (u.referralCode && u.referralCode.trim().toUpperCase() === cleanRef) ||
        (u.email && u.email.trim().toUpperCase() === cleanRef) ||
        (u.email && u.email.split("@")[0].trim().toUpperCase() === cleanRef) ||
        (cleanRef === "885101" && (u.email || "").toLowerCase() === "free@gmail.com")
    );

    if (inviter) {
      const currentPending = Number(inviter.pending_commissions ?? inviter.pendingReferralRewardsUSDT ?? 0);
      const newPending = Number((currentPending + 0.01).toFixed(2));
      inviter.pending_commissions = newPending;
      inviter.pendingReferralRewardsUSDT = newPending;
      inviter.lastModified = Date.now();
      saveDb(db);

      console.log(`[UnifiedDB] Auto-added 0.01$ ad commission to inviter ${inviter.email}. New pending: ${newPending}`);
      return res.json({
        success: true,
        commissionAdded: true,
        inviterEmail: inviter.email,
        pending_commissions: newPending,
      });
    }

    return res.json({ success: true, commissionAdded: false, reason: "Inviter not found in database" });
  });

  // 4f. Secure Claim Commissions Endpoint (تفريغ العمولات المعلقة وإضافتها للرصيد الأساسي)
  app.post("/api/network/claim-commissions", (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    const db = loadDb();
    const account = db.accounts.find(
      (u) => (u.email || "").toLowerCase() === cleanEmail || (u.username || "").toLowerCase() === cleanEmail
    );

    if (!account) {
      return res.status(404).json({ success: false, error: "Account not found" });
    }

    const pending = Number(account.pending_commissions ?? account.pendingReferralRewardsUSDT ?? 0);
    if (pending <= 0) {
      return res.json({ success: false, claimedAmount: 0, newBalance: account.totalBalanceUSDT || 0 });
    }

    const currentBal = Number((account.totalBalanceUSDT || 0).toFixed(2));
    const currentRefEarn = Number((account.referralEarningsUSDT || 0).toFixed(2));
    const newBal = Number((currentBal + pending).toFixed(2));
    const newRefEarn = Number((currentRefEarn + pending).toFixed(2));

    account.totalBalanceUSDT = newBal;
    account.referralEarningsUSDT = newRefEarn;
    account.pending_commissions = 0;
    account.pendingReferralRewardsUSDT = 0;
    account.lastModified = Date.now();

    const txId = `tx-claim-comm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const tx = {
      id: txId,
      type: "referral_commission",
      amountUSDT: pending,
      status: "completed",
      description: `حصد وتجميع عمولات الإعلانات المعلقة (+${pending.toFixed(2)} USDT)`,
      timestamp: new Date().toISOString(),
      userEmail: account.email,
    };
    db.transactions.unshift(tx);
    saveDb(db);

    return res.json({
      success: true,
      claimedAmount: pending,
      newBalance: newBal,
      transactions: db.transactions,
    });
  });

  // 4g. Direct Admin Balance & Deposit Adjuster
  app.post("/api/network/adjust-balance", (req, res) => {
    const { email, totalBalanceUSDT, totalDepositedUSDT } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: "email is required" });
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    const db = loadDb();
    const account = db.accounts.find(
      (u) => (u.email || "").toLowerCase() === cleanEmail || (u.username || "").toLowerCase() === cleanEmail
    );

    if (account) {
      if (typeof totalBalanceUSDT === "number") {
        account.totalBalanceUSDT = totalBalanceUSDT;
      }
      if (typeof totalDepositedUSDT === "number") {
        account.totalDepositedUSDT = totalDepositedUSDT;
      }
      account.lastModified = Date.now();
      saveDb(db);
      return res.json({ success: true, account });
    }

    return res.status(404).json({ success: false, error: "Account not found" });
  });

  // 4g-2. Automated 24-Hour Task Reset Endpoint
  app.post("/api/network/reset-tasks", (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: "Email required" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const db = loadDb();
    const account = db.accounts.find(
      (u) => (u.email || "").toLowerCase() === cleanEmail || (u.username || "").toLowerCase() === cleanEmail
    );
    if (account) {
      account.tasksCompletedToday = 0;
      account.taskEarningsToday = 0.0;
      account.lastTasksResetTimestamp = Date.now();
      account.lastTasksResetDate = new Date().toISOString().split("T")[0];
      account.lastModified = Date.now();
      saveDb(db);
      return res.json({ success: true, account });
    }
    return res.status(404).json({ success: false, error: "Account not found" });
  });

  // 4h. Hard Reset / Factory Purge Endpoint
  app.post("/api/network/factory-reset", (_req, res) => {
    const freshDb: NetworkDatabase = {
      accounts: [{
        ...DEFAULT_ADMIN,
        totalBalanceUSDT: 0.0,
        totalDepositedUSDT: 0.0,
        vipLevel: 0,
        referralCode: "885101",
        password: "000000",
        lastModified: Date.now(),
      }],
      transactions: [],
      notifications: [],
      lastUpdated: Date.now(),
    };
    saveDb(freshDb);
    return res.json({ success: true, accounts: freshDb.accounts, transactions: [], notifications: [] });
  });

  // 5. Universal Bidirectional Sync with Data Shield Lock
  // Seamlessly merges client localStorage accounts and server DB accounts without losing balances
  app.post("/api/network/sync", (req, res) => {
    const { clientAccounts, clientTransactions, clientNotifications } = req.body;
    const db = loadDb();

    let modified = false;

    // Merge accounts
    if (Array.isArray(clientAccounts)) {
      for (const clientAcc of clientAccounts) {
        if (!clientAcc || !clientAcc.email) continue;
        const cEmail = (clientAcc.email || "").toLowerCase().trim();

        if (!cEmail) continue;

        const serverAccIdx = db.accounts.findIndex((u) => (u.email || "").toLowerCase().trim() === cEmail);
        if (serverAccIdx >= 0) {
          const sAcc = db.accounts[serverAccIdx];
          
          const clientTime = Number(clientAcc.lastModified) || 0;
          const serverTime = Number(sAcc.lastModified) || 0;

          // If client has equal or newer timestamp, trust client's verified balance and deposit
          let newBal: number;
          let newDep: number;

          if (clientTime >= serverTime) {
            newBal = typeof clientAcc.totalBalanceUSDT === "number" ? clientAcc.totalBalanceUSDT : (sAcc.totalBalanceUSDT || 0);
            newDep = typeof clientAcc.totalDepositedUSDT === "number" ? clientAcc.totalDepositedUSDT : (sAcc.totalDepositedUSDT || 0);
          } else {
            newBal = sAcc.totalBalanceUSDT || 0;
            newDep = sAcc.totalDepositedUSDT || 0;
          }

          const newVip = Math.max(sAcc.vipLevel || 0, clientAcc.vipLevel || 0);
          const newRefCt = Math.max(sAcc.referralCount || 0, clientAcc.referralCount || 0);
          const newRefEarn = Math.max(sAcc.referralEarningsUSDT || 0, clientAcc.referralEarningsUSDT || 0);
          const newPendingComm = Math.max(
            sAcc.pending_commissions || sAcc.pendingReferralRewardsUSDT || 0,
            clientAcc.pending_commissions || clientAcc.pendingReferralRewardsUSDT || 0
          );
          let newTasks: number;
          if (clientTime >= serverTime) {
            newTasks = typeof clientAcc.tasksCompletedToday === "number" ? clientAcc.tasksCompletedToday : (sAcc.tasksCompletedToday || 0);
          } else {
            newTasks = sAcc.tasksCompletedToday || 0;
          }
          const latestMod = Math.max(clientTime, serverTime, Date.now());
          const newResetTime = Math.max(sAcc.lastTasksResetTimestamp || 0, clientAcc.lastTasksResetTimestamp || 0);
          const newResetDate = clientAcc.lastTasksResetDate || sAcc.lastTasksResetDate;

          if (
            newBal !== sAcc.totalBalanceUSDT ||
            newDep !== sAcc.totalDepositedUSDT ||
            newVip !== sAcc.vipLevel ||
            newRefCt !== sAcc.referralCount ||
            newRefEarn !== sAcc.referralEarningsUSDT ||
            newPendingComm !== (sAcc.pending_commissions || sAcc.pendingReferralRewardsUSDT || 0) ||
            newTasks !== sAcc.tasksCompletedToday ||
            (!sAcc.referredBy && clientAcc.referredBy)
          ) {
            db.accounts[serverAccIdx] = {
              ...sAcc,
              ...clientAcc,
              totalBalanceUSDT: newBal,
              totalDepositedUSDT: newDep,
              vipLevel: newVip,
              referralCount: newRefCt,
              referralEarningsUSDT: newRefEarn,
              pending_commissions: newPendingComm,
              pendingReferralRewardsUSDT: newPendingComm,
              tasksCompletedToday: newTasks,
              lastTasksResetTimestamp: newResetTime,
              lastTasksResetDate: newResetDate,
              referredBy: sAcc.referredBy || clientAcc.referredBy,
              lastModified: latestMod,
            };
            modified = true;
          }
        } else {
          // New account registered in client
          db.accounts.push({
            ...clientAcc,
            lastModified: clientAcc.lastModified || Date.now(),
          });
          modified = true;
        }
      }
    }

    // Merge transactions (drop old pre-purge test transactions)
    if (Array.isArray(clientTransactions)) {
      for (const cTx of clientTransactions) {
        if (!cTx || !cTx.id) continue;
        const txTime = new Date(cTx.timestamp).getTime();
        if (isNaN(txTime) || txTime < 1789295000000) continue;

        const existingIdx = db.transactions.findIndex((t) => t.id === cTx.id);
        if (existingIdx >= 0) {
          // If status was updated to completed or failed on client, prioritize it!
          if (cTx.status && cTx.status !== db.transactions[existingIdx].status) {
            db.transactions[existingIdx].status = cTx.status;
            modified = true;
          }
        } else {
          db.transactions.push(cTx);
          modified = true;
        }
      }
    }

    // Merge notifications (drop old pre-purge notifications)
    if (Array.isArray(clientNotifications)) {
      for (const cN of clientNotifications) {
        if (!cN || !cN.id) continue;
        const nTime = new Date(cN.timestamp).getTime();
        if (isNaN(nTime) || nTime < 1789295000000) continue;

        const exists = db.notifications.some((n) => n.id === cN.id);
        if (!exists) {
          db.notifications.push(cN);
          modified = true;
        }
      }
    }

    if (modified) {
      saveDb(db);
    }

    res.json({
      success: true,
      accounts: db.accounts,
      transactions: db.transactions,
      notifications: db.notifications,
      lastUpdated: db.lastUpdated,
    });
  });

  // --- VITE MIDDLEWARE (DEV) & STATIC SERVING (PROD) ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[UnifiedNetworkBridge] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
