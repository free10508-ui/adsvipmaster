/**
 * Silent Anti-Fraud & Multi-Account Detection Engine
 * محرك مكافحة الاحتيال والكشف الصامت لتعدد الحسابات
 * 
 * القواعد الصارمة:
 * 1. الكشف صامت 100% (Silent Shadow-Flagging):
 *    - المستخدم لا يشعر بأي شيء أثناء العمل اليومي أو تصفح المنصة أو زيادة الأرباح.
 *    - كل الأرصدة والمهام والمكافآت تعمل طبيعياً ودون أي علامات أو رسائل تحذيرية أثناء النشاط.
 * 2. الحسابات الحالية والمستقبلية:
 *    - لا يفقد أي مستخدم حالي أو جديد أي سنت من أمواله إطلاقاً.
 *    - الحسابات الطبيعية تسير وفق المسار النظامي.
 * 3. المطب الأمني النهائي عند السحب:
 *    - بعد استيفاء الحد الأدنى (5.0$) وإنهاء كافة أيام العمل المتتالية (10 ثم 5 ثم 3 ثم 2 ثم 1 يوم):
 *      أ) إذا كان لديه تعدد حسابات أو أجهزة مكررة: يظهر له تنبيه أمني رسمي لمكافحة الاحتيال.
 *      ب) بعد إنهاء جميع متطلبات أيام العمل بنجاح، يُطلب منه شراء باقة / ترقية خطة (VIP Plan) لسحب الأموال كاملة،
 *         بشعار المنصة الفاخر الأنيق في المنتصف.
 * 4. استثناء الإدارة (Admin Exemption):
 *    - حسابات الإدارة (free@gmail.com / free10508@gmail.com / free) مستثناة 100% من جميع هذه القيود.
 */

export interface DeviceFingerprintInfo {
  deviceId: string;
  userAgent: string;
  screenResolution: string;
  language: string;
  timeZone: string;
  platform: string;
  firstSeen: string;
  associatedEmails: string[];
  referralCodesUsed: string[];
}

const STORAGE_DEVICE_KEY = 'adrocket_sec_device_fp_v1';
const STORAGE_ACCOUNTS_REGISTRY = 'adrocket_sec_accounts_reg_v1';
const STORAGE_WALLET_REGISTRY = 'adrocket_sec_wallets_reg_v1';

/**
 * Generate a consistent, silent device fingerprint hash
 */
export function getSilentDeviceFingerprint(): string {
  try {
    const screenRes = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}` : 'default_res';
    const tz = typeof Intl !== 'undefined' && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
    const nav = typeof navigator !== 'undefined' ? `${navigator.userAgent}_${navigator.language}_${navigator.hardwareConcurrency || 4}` : 'default_nav';
    
    // Hash function (djb2 variant)
    let hash = 5381;
    const str = `${screenRes}|${tz}|${nav}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `DEV-${hex}`;
  } catch {
    return 'DEV-885101A';
  }
}

/**
 * Silently register active account for current device
 */
export function registerAccountDeviceSilent(email: string, referralCodeUsed?: string): void {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return;

  // Don't flag master admin
  if (cleanEmail === 'free@gmail.com' || cleanEmail === 'free10508@gmail.com' || cleanEmail === 'free') {
    return;
  }

  try {
    const deviceId = getSilentDeviceFingerprint();
    const rawRegistry = localStorage.getItem(STORAGE_ACCOUNTS_REGISTRY);
    const registry: Record<string, string[]> = rawRegistry ? JSON.parse(rawRegistry) : {};

    const emailsForDevice = registry[deviceId] || [];
    if (!emailsForDevice.includes(cleanEmail)) {
      emailsForDevice.push(cleanEmail);
      registry[deviceId] = emailsForDevice;
      localStorage.setItem(STORAGE_ACCOUNTS_REGISTRY, JSON.stringify(registry));
    }

    // Save individual device info
    const devInfoRaw = localStorage.getItem(`${STORAGE_DEVICE_KEY}_${deviceId}`);
    let devInfo: DeviceFingerprintInfo;
    if (devInfoRaw) {
      devInfo = JSON.parse(devInfoRaw);
      if (!devInfo.associatedEmails.includes(cleanEmail)) {
        devInfo.associatedEmails.push(cleanEmail);
      }
      if (referralCodeUsed && !devInfo.referralCodesUsed.includes(referralCodeUsed)) {
        devInfo.referralCodesUsed.push(referralCodeUsed);
      }
    } else {
      devInfo = {
        deviceId,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
        language: typeof navigator !== 'undefined' ? navigator.language : '',
        timeZone: typeof Intl !== 'undefined' && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
        platform: typeof navigator !== 'undefined' ? navigator.platform : '',
        firstSeen: new Date().toISOString(),
        associatedEmails: [cleanEmail],
        referralCodesUsed: referralCodeUsed ? [referralCodeUsed] : []
      };
    }
    localStorage.setItem(`${STORAGE_DEVICE_KEY}_${deviceId}`, JSON.stringify(devInfo));
  } catch (e) {
    console.warn('[AntiFraud] Silent registration non-blocking error:', e);
  }
}

/**
 * Silently record and check wallet address uniqueness
 */
export function registerWalletAddressSilent(walletAddress: string, email: string): boolean {
  const cleanWallet = (walletAddress || '').trim().toLowerCase();
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanWallet || !cleanEmail) return true;

  if (cleanEmail === 'free@gmail.com' || cleanEmail === 'free10508@gmail.com' || cleanEmail === 'free') {
    return true;
  }

  try {
    const rawWallets = localStorage.getItem(STORAGE_WALLET_REGISTRY);
    const wallets: Record<string, string[]> = rawWallets ? JSON.parse(rawWallets) : {};

    const emailsForWallet = wallets[cleanWallet] || [];
    if (!emailsForWallet.includes(cleanEmail)) {
      emailsForWallet.push(cleanEmail);
      wallets[cleanWallet] = emailsForWallet;
      localStorage.setItem(STORAGE_WALLET_REGISTRY, JSON.stringify(wallets));
    }

    // If used by more than 1 distinct non-admin email
    return emailsForWallet.length <= 1;
  } catch {
    return true;
  }
}

/**
 * Check if the current user has multi-account violation on this device or wallet
 */
export function checkMultiAccountViolation(email: string, targetWalletAddress?: string): {
  isViolating: boolean;
  reason?: 'device_multi_account' | 'wallet_multi_account' | 'referral_farm';
  accountCount: number;
} {
  const cleanEmail = (email || '').trim().toLowerCase();
  
  // Master admin bypass
  if (cleanEmail === 'free@gmail.com' || cleanEmail === 'free10508@gmail.com' || cleanEmail === 'free') {
    return { isViolating: false, accountCount: 1 };
  }

  try {
    const deviceId = getSilentDeviceFingerprint();
    const rawRegistry = localStorage.getItem(STORAGE_ACCOUNTS_REGISTRY);
    const registry: Record<string, string[]> = rawRegistry ? JSON.parse(rawRegistry) : {};
    const accountsOnDevice = registry[deviceId] || [];

    // Also check total users in storage that share this device identifier
    const flaggedMultiDev = accountsOnDevice.filter(e => e !== 'free@gmail.com' && e !== 'free10508@gmail.com');
    if (flaggedMultiDev.length >= 2) {
      return {
        isViolating: true,
        reason: 'device_multi_account',
        accountCount: flaggedMultiDev.length
      };
    }

    // Check wallet duplication
    if (targetWalletAddress) {
      const cleanWallet = targetWalletAddress.trim().toLowerCase();
      const rawWallets = localStorage.getItem(STORAGE_WALLET_REGISTRY);
      const wallets: Record<string, string[]> = rawWallets ? JSON.parse(rawWallets) : {};
      const emailsForWallet = (wallets[cleanWallet] || []).filter(e => e !== 'free@gmail.com' && e !== 'free10508@gmail.com');
      if (emailsForWallet.length >= 2) {
        return {
          isViolating: true,
          reason: 'wallet_multi_account',
          accountCount: emailsForWallet.length
        };
      }
    }

    return {
      isViolating: false,
      accountCount: 1
    };
  } catch {
    return { isViolating: false, accountCount: 1 };
  }
}
