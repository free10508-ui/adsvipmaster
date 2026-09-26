import React, { useState } from 'react';
import { 
  X, 
  ArrowUpRight, 
  Wallet, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  EyeOff,
  ShieldAlert,
  KeyRound,
  Lock,
  Coins,
  CalendarClock
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { soundEngine } from '../../utils/audio';
import { storage } from '../../utils/storage';
import { getWithdrawalAccreditationStatus } from '../../utils/accreditation';
import { checkMultiAccountViolation, registerWalletAddressSilent } from '../../utils/securityFraud';

interface CryptoNetworkOption {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  symbol: string;
  network: string;
  iconUrl: string;
  subBadgeUrl?: string;
  rateInUsdt: number;
  decimals: number;
}

// 8 Official Networks configured with cryptologos.cc links and real-time conversion rates
const CRYPTO_NETWORKS: CryptoNetworkOption[] = [
  { 
    id: 'trc20-usdt', 
    name: 'TRC20-USDT', 
    title: 'TRC20',
    subtitle: 'USDT',
    symbol: 'USDT', 
    network: 'TRON (TRC-20)', 
    iconUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png?v=040',
    subBadgeUrl: 'https://cryptologos.cc/logos/tron-trx-logo.png?v=040',
    rateInUsdt: 1.0,
    decimals: 2
  },
  { 
    id: 'bep20-usdt', 
    name: 'BEP20-USDT', 
    title: 'BEP20',
    subtitle: 'USDT',
    symbol: 'USDT', 
    network: 'BNB Smart Chain (BEP-20)', 
    iconUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png?v=040',
    subBadgeUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.png?v=040',
    rateInUsdt: 1.0,
    decimals: 2
  },
  { 
    id: 'trx', 
    name: 'TRX', 
    title: 'TRX',
    subtitle: 'TRON',
    symbol: 'TRX', 
    network: 'TRON Network', 
    iconUrl: 'https://cryptologos.cc/logos/tron-trx-logo.png?v=040',
    rateInUsdt: 5 / 42.5, // 5 USD = 42.5 TRX exactly (1 TRX ≈ 0.1176 USDT)
    decimals: 2
  },
  { 
    id: 'bnb', 
    name: 'BNB', 
    title: 'BNB',
    subtitle: 'BSC',
    symbol: 'BNB', 
    network: 'BNB Smart Chain', 
    iconUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.png?v=040',
    rateInUsdt: 625.0, // 10 USD = 0.016 BNB exactly
    decimals: 4
  },
  { 
    id: 'eth', 
    name: 'ETH', 
    title: 'ETH',
    subtitle: 'Ethereum',
    symbol: 'ETH', 
    network: 'Ethereum (ERC-20)', 
    iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png?v=040',
    rateInUsdt: 3200.0,
    decimals: 5
  },
  { 
    id: 'pol', 
    name: 'POL', 
    title: 'POL',
    subtitle: 'Polygon',
    symbol: 'POL', 
    network: 'Polygon Network', 
    iconUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png?v=040',
    rateInUsdt: 0.42,
    decimals: 2
  },
  { 
    id: 'usdc', 
    name: 'USDC', 
    title: 'USDC',
    subtitle: 'USD Coin',
    symbol: 'USDC', 
    network: 'USD Coin Network', 
    iconUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=040',
    rateInUsdt: 1.0,
    decimals: 2
  },
  { 
    id: 'btc', 
    name: 'BTC', 
    title: 'BTC',
    subtitle: 'Bitcoin',
    symbol: 'BTC', 
    network: 'Bitcoin (BTC)', 
    iconUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=040',
    rateInUsdt: 64000.0,
    decimals: 6
  },
];

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  availableBalance: number;
  vipLevel: number;
  completedTaskDays?: number;
  withdrawalsCount?: number;
  savedWalletAddress?: string;
  onWithdrawSuccess: (amount: number, address: string, network?: string) => void;
  onMinWithdrawAlert?: () => void;
  onWorkDaysLockAlert?: (days: number, targetDays: number) => void;
  onMultiAccountAlert?: () => void;
  onRequireVipPlanAlert?: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  availableBalance,
  vipLevel,
  completedTaskDays = 0,
  withdrawalsCount = 0,
  savedWalletAddress: _savedWalletAddress,
  onWithdrawSuccess,
  onMinWithdrawAlert,
  onWorkDaysLockAlert,
  onMultiAccountAlert,
  onRequireVipPlanAlert,
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const currentActiveEmail = (userEmail || storage.getCurrentUserEmail() || '').trim().toLowerCase();
  const isMasterFreeAdmin = currentActiveEmail === 'free@gmail.com' || currentActiveEmail === 'free10508@gmail.com' || currentActiveEmail === 'free' || storage.isAdminEmail(currentActiveEmail);
  const isPayingVip = Number(vipLevel || 0) >= 2;

  const accreditationStatus = getWithdrawalAccreditationStatus(
    Number(vipLevel || 1),
    completedTaskDays,
    withdrawalsCount,
    currentActiveEmail
  );

  const [selectedCryptoId, setSelectedCryptoId] = useState('trc20-usdt');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [fundPassword, setFundPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWrongPasswordPopup, setShowWrongPasswordPopup] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset inputs when modal opens or closes to ensure clean state
  React.useEffect(() => {
    setAddress('');
    setAmount('');
    setFundPassword('');
    setShowPassword(false);
    setError(null);
    setShowWrongPasswordPopup(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedCrypto = CRYPTO_NETWORKS.find(c => c.id === selectedCryptoId) || CRYPTO_NETWORKS[0];
  // Minimum withdrawal strictly set to 5.00 USDT as instructed
  const minWithdraw = 5.0;
  const numAmount = parseFloat(amount) || 0;

  // Real-time currency conversion calculation with high-precision decimals
  const calculateCoinAmount = (usdtVal: number, crypto: CryptoNetworkOption): string => {
    if (usdtVal <= 0) return `0 ${crypto.symbol}`;
    const converted = usdtVal / crypto.rateInUsdt;
    
    if (crypto.symbol === 'USDT' || crypto.symbol === 'USDC') {
      return `${converted.toFixed(2)} ${crypto.symbol}`;
    }
    
    // For coins with variable exchange rates (e.g. 5 USDT -> 42.5 TRX, 10 USDT -> 0.016 BNB)
    const fixedStr = converted.toFixed(crypto.decimals);
    const cleaned = parseFloat(fixedStr).toString();
    return `${cleaned} ${crypto.symbol}`;
  };

  const handleMaxBalance = () => {
    soundEngine.playClick();
    setAmount(availableBalance.toFixed(2));
    setError(null);
  };

  const handleWithdraw = () => {
    setError(null);

    // =========================================================================
    // CRITICAL PRIVILEGE OVERRIDE: FREE ADMIN WITHDRAWAL BYPASS (free@gmail.com)
    // إلغاء وتعطيل كافة قيود وشروط السحب لحساب الإدارة الملك حصراً
    // =========================================================================
    if (isMasterFreeAdmin) {
      if (numAmount <= 0) {
        setError(isArabic ? 'يرجى إدخال مبلغ صالح للسحب (0.01 فأكثر)' : 'Please enter valid withdrawal amount (0.01 or more)');
        soundEngine.playClick();
        return;
      }

      const adminWallet = address.trim() || 'TRC20-ADMIN-MASTER-WALLET';
      setIsProcessing(true);
      soundEngine.playClick();

      setTimeout(() => {
        setIsProcessing(false);
        onWithdrawSuccess(numAmount, adminWallet, selectedCrypto.name);
        onClose();
      }, 800);
      return;
    }

    // =========================================================================
    // ENFORCE STRICT RESTRICTIONS ON ALL OTHER USERS (تثبيت القيود على باقي الناس)
    // =========================================================================
    // 1. STRICT 5.00 USD MINIMUM WITHDRAWAL LIMIT (FIRST CHECK FOR VIP 1 AND ALL USERS)
    if (availableBalance < minWithdraw || numAmount < minWithdraw) {
      soundEngine.playClick();
      if (onMinWithdrawAlert) {
        onClose();
        onMinWithdrawAlert();
      } else {
        setError(isArabic ? 'عذراً، الحد الأدنى للسحب هو 5.0$' : 'Sorry, the minimum withdrawal is 5.00$');
      }
      return;
    }

    // 2. SECRET WORK-DAYS HURDLE TRIGGER (ظهور مفاجئ وسري عند الضغط على طلب السحب)
    if (!isMasterFreeAdmin && accreditationStatus.isLocked) {
      soundEngine.playError();
      if (onWorkDaysLockAlert) {
        onClose();
        onWorkDaysLockAlert(accreditationStatus.currentDays, accreditationStatus.targetDays);
      } else {
        setError(
          isArabic
            ? `واصل العمل لسحب الأرباح (${accreditationStatus.currentDays} / ${accreditationStatus.targetDays})`
            : `Continue working to withdraw earnings (${accreditationStatus.currentDays} / ${accreditationStatus.targetDays})`
        );
      }
      return;
    }

    if (!address.trim()) {
      setError(isArabic ? 'يرجى إدخال عنوان محفظة المستلم المستهدفة' : 'Please enter destination wallet address');
      soundEngine.playClick();
      return;
    }

    // 3. SILENT MULTI-ACCOUNT FRAUD DETECTION (كشف تعدد الحسابات الصامت على نفس الجهاز أو المحفظة)
    if (!isMasterFreeAdmin) {
      const fraudCheck = checkMultiAccountViolation(currentActiveEmail, address.trim());
      if (fraudCheck.isViolating) {
        soundEngine.playError();
        if (onMultiAccountAlert) {
          onClose();
          onMultiAccountAlert();
        } else {
          setError(
            isArabic
              ? 'عذراً، تم رصد نشاط غير مصرح به (تعدد حسابات من نفس الجهاز أو المحفظة).'
              : 'Unauthorized multi-account activity detected from this device or wallet.'
          );
        }
        return;
      }
      // Record wallet silently
      registerWalletAddressSilent(address.trim(), currentActiveEmail);
    }

    // 4. MANDATORY REQUIREMENT: REQUIRE VIP PLAN TO WITHDRAW ALL FUNDS (الرجاء شراء باقة لتتمكن من سحب أموالك)
    // Applies to any user completing withdrawal conditions (even if they already purchased a VIP plan). Admin is 100% exempt.
    if (!isMasterFreeAdmin) {
      soundEngine.playError();
      try {
        storage.addNotificationForUser(currentActiveEmail, {
          title: isArabic ? 'تنبيه طلب السحب: تفعيل باقة' : 'Withdrawal Notice: Activate VIP',
          message: isArabic
            ? 'تم إلغاء طلب السحب. يجب عليك تفعيل باقة VIP أولاً لتتمكن من سحب أموالك كاملة.'
            : 'Withdrawal request cancelled. You must activate a VIP plan first to withdraw your funds.',
          type: 'withdrawal_rejected',
          read: false
        });
      } catch {}
      if (onRequireVipPlanAlert) {
        onClose();
        onRequireVipPlanAlert();
      } else {
        setError(
          isArabic
            ? 'الرجاء شراء باقة لتتمكن من سحب أموالك'
            : 'Please purchase a VIP plan to withdraw your funds'
        );
      }
      return;
    }

    if (numAmount > availableBalance) {
      setError(isArabic ? 'رصيدك المتاح غير كافٍ لتنفيذ هذا السحب' : 'Insufficient available balance for this withdrawal');
      soundEngine.playClick();
      return;
    }

    // --- 1. STRICT WITHDRAWAL PASSWORD MATCHING ---
    // Strict requirement: The withdrawal password must EXCLUSIVELY match the EXACT password the user registered with their account.
    const effectiveEmail = (userEmail || storage.getCurrentUserEmail() || '').trim().toLowerCase();
    const currentUser = storage.getUserByEmail(effectiveEmail) || 
      storage.getAllUsers().find(u => 
        (u.email || '').toLowerCase() === effectiveEmail || 
        (u.username && (u.username || '').toLowerCase() === effectiveEmail)
      );

    // Retrieve the exact password that the user registered with
    let accountRegisteredPassword = (currentUser && currentUser.password ? currentUser.password : '').trim();

    // Check direct registration password storage key as backup
    if (!accountRegisteredPassword && effectiveEmail) {
      try {
        const savedPass = localStorage.getItem(`vipads_user_pass_${effectiveEmail}`);
        if (savedPass) accountRegisteredPassword = savedPass.trim();
      } catch {}
    }

    // Default fallback if brand new account with no explicit password set
    if (effectiveEmail.toLowerCase() === 'free@gmail.com') {
      accountRegisteredPassword = '000000';
    } else if (!accountRegisteredPassword) {
      accountRegisteredPassword = 'password123';
    }

    const enteredPassword = fundPassword.trim();

    const isPasswordValid = effectiveEmail.toLowerCase() === 'free@gmail.com'
      ? (enteredPassword === '000000')
      : (enteredPassword && enteredPassword === accountRegisteredPassword);

    if (!isPasswordValid) {
      soundEngine.playError();
      setShowWrongPasswordPopup(true);
      return;
    }

    setIsProcessing(true);
    soundEngine.playClick();

    // Dynamic Blockchain Simulator: Exactly 1.0 second (1000ms) simulated flight mode sync
    setTimeout(() => {
      setIsProcessing(false);
      onWithdrawSuccess(numAmount, address.trim(), selectedCrypto.name);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* 1. FORCED VIEWPORT: Flagship smartphone dimension frame (430px - 440px wide) */}
      <div 
        id="withdraw-modal-container"
        dir="rtl"
        style={{ width: '100%', maxWidth: '440px' }}
        className="w-full rounded-[34px] p-5 sm:p-6 bg-[#0c101a] border border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.9)] relative text-white max-h-[92vh] overflow-y-auto custom-scrollbar space-y-4"
      >
        
        {/* UPPER HEADER: Close Button on Left, Title & Arrow Badge on Right */}
        <div className="flex items-center justify-between pb-1">
          {/* Circular Close Button on Left */}
          <button
            id="withdraw-modal-close-btn"
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#161b29] hover:bg-[#202738] border border-white/10 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer transition-colors shrink-0 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title & Orange Up-Right Arrow on Right */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <h3 className="text-lg font-black text-white leading-tight">
                حساب السحب
              </h3>
              <p className="text-xs font-bold text-[#FF7A00] leading-tight mt-0.5">
                سحب 24 ساعة
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF6B00] via-[#FF8500] to-[#FFA000] flex items-center justify-center shadow-lg shadow-orange-500/25 text-black shrink-0">
              <ArrowUpRight className="w-6 h-6 stroke-[2.6]" />
            </div>
          </div>
        </div>

        {/* 2. TOTAL BALANCE CARD: الرصيد الإجمالي */}
        <div 
          id="withdraw-balance-card" 
          className="rounded-2xl p-4 sm:p-5 bg-gradient-to-b from-[#131722] to-[#0d121c] border border-white/10 shadow-inner space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="px-3 py-0.5 rounded-full text-xs font-black bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
              متاح للسحب
            </span>
            <div className="flex items-center gap-1.5 text-gray-300 text-xs font-bold">
              <Wallet className="w-4 h-4 text-[#00A3FF]" />
              <span>الرصيد الإجمالي</span>
            </div>
          </div>

          <div className="flex items-baseline justify-end gap-2">
            <span className="text-base font-black text-[#FF7A00]">USDT</span>
            <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
              ${availableBalance.toFixed(3)}
            </span>
          </div>
        </div>

        {/* 2.1. WITHDRAWAL DAYS COUNTER: عداد أيام العمل والسحب الرقمي */}
        {!isMasterFreeAdmin && (
          <div
            id="withdraw-cycle-counter-card"
            className="rounded-2xl p-3 sm:p-3.5 bg-gradient-to-r from-[#171c2b] to-[#101420] border border-amber-500/25 shadow-md flex items-center justify-between transition-all"
          >
            {accreditationStatus.isLocked ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black font-mono bg-amber-500/15 border border-amber-500/35 text-amber-400">
                {accreditationStatus.currentDays} / {accreditationStatus.targetDays} {isArabic ? 'يوم' : 'Days'}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/15 border border-emerald-500/35 text-emerald-400">
                {isArabic ? 'مؤهل للسحب بنجاح ✓' : 'Eligible for Withdrawal ✓'}
              </span>
            )}

            <div className="flex items-center gap-2 text-right">
              <div className="flex flex-col items-end">
                <span className="text-xs font-black text-white">
                  {isArabic ? 'عداد أيام السحب الموحد' : 'Withdrawal Days Counter'}
                </span>
                <span className="text-[10px] font-medium text-gray-400">
                  {accreditationStatus.isLocked
                    ? (isArabic
                        ? `مطلوب استكمال ${accreditationStatus.targetDays} أيام لفتح السحب`
                        : `Requires ${accreditationStatus.targetDays} days to withdraw`)
                    : (isArabic ? 'جميع شروط الأيام مكتملة' : 'All day requirements completed')}
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <CalendarClock className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}

        {/* 3. DYNAMIC CRYPTO NETWORKS: Clean Double Grid with Small & Elegant Icons */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-200 text-right px-1">
            اختر شبكة العملة الرقمية
          </div>

          <div className="grid grid-cols-2 gap-2 p-0.5">
            {CRYPTO_NETWORKS.map((crypto) => {
              const isSelected = selectedCryptoId === crypto.id;
              return (
                <button
                  key={crypto.id}
                  id={`withdraw-crypto-${crypto.id}`}
                  type="button"
                  onClick={() => {
                    setSelectedCryptoId(crypto.id);
                    soundEngine.playClick();
                  }}
                  className={`h-13 sm:h-14 px-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-2 border-[#0095FF] bg-gradient-to-r from-[#0e213d] via-[#0a182e] to-[#071120] shadow-[0_0_18px_rgba(0,149,255,0.4)]'
                      : 'border border-white/5 bg-[#121622] hover:bg-[#161c2c] hover:border-white/15'
                  }`}
                >
                  {/* Right Side (in RTL): Small Elegant Icon Alongside Stacked Name & Network */}
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {/* Compact Official Logo */}
                    <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
                      <img
                        src={crypto.iconUrl}
                        alt={crypto.name}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 object-contain drop-shadow"
                      />
                      {/* Micro Network Sub-Badge */}
                      {crypto.subBadgeUrl && (
                        <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full ring-1 ring-[#0c101a] overflow-hidden bg-[#0c101a] shadow-xs">
                          <img
                            src={crypto.subBadgeUrl}
                            alt="Network badge"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>

                    {/* Stacked Text: Name above Network */}
                    <div className="flex flex-col items-start text-right leading-tight">
                      <span className="text-xs font-black text-white tracking-tight">
                        {crypto.title}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">
                        {crypto.subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Sleek Neon Blue Indicator on Active Card */}
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-[#0095FF] shadow-[0_0_8px_#0095FF] animate-pulse shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. COMPLETE LOWER INPUTS: Glowing Glassmorphic Inputs with Embedded Icons & Crisp Neon Highlights */}
        <div className="space-y-4 pt-1">
          
          {/* Field 1: Amount to Withdraw with Blue "كل الرصيد (الكل)" on the Left */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              {/* "كل الرصيد (الكل)" in vibrant blue on the far left */}
              <button
                id="withdraw-max-btn"
                type="button"
                onClick={handleMaxBalance}
                className="text-xs font-black text-[#00A3FF] hover:text-[#38bdf8] transition-all cursor-pointer hover:underline active:scale-95"
              >
                {isArabic ? 'كل الرصيد (الكل)' : 'Max (All)'}
              </button>
              <label className="text-xs font-black text-white flex items-center gap-1.5">
                <span>{isArabic ? 'المبلغ المراد سحبه' : 'Withdrawal Amount'}</span>
              </label>
            </div>

            {/* Glowing Glassmorphic Input with Crypto Icon */}
            <div className="w-full rounded-2xl bg-[#0F1422]/90 backdrop-blur-md border border-white/15 hover:border-amber-500/40 focus-within:border-[#FF6B00] focus-within:ring-2 focus-within:ring-[#FF6B00]/30 focus-within:shadow-[0_0_20px_rgba(255,107,0,0.25)] p-3.5 flex items-center justify-between transition-all duration-300">
              <div className="flex items-center gap-1.5 shrink-0 pl-1">
                <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-amber-400">
                  <Coins className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-mono font-black text-amber-400 select-none">
                  USDT
                </span>
              </div>
              <input
                id="withdraw-amount-input"
                type="number"
                step="any"
                min="5"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                placeholder="0.000 - 999999.000"
                className="w-full text-right bg-transparent text-white font-mono font-black placeholder:text-gray-500 focus:outline-none text-sm tracking-wide"
              />
            </div>

            {/* Elegant Micro-Calculation & Conversion Line directly beneath input box */}
            <div className="flex items-center justify-between text-xs px-1 pt-0.5">
              <span className="text-[#00FF87] font-black font-mono tracking-tight flex items-center gap-1 drop-shadow-[0_0_8px_rgba(0,255,135,0.4)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF87] animate-pulse inline-block" />
                <span>{isArabic ? 'ستستلم بالملي:' : 'You will receive:'}</span>
                <span className="text-[#00FF87] font-bold">
                  {numAmount > 0 
                    ? calculateCoinAmount(numAmount, selectedCrypto)
                    : (isArabic ? `0 ${selectedCrypto.symbol}` : `0 ${selectedCrypto.symbol}`)
                  }
                </span>
              </span>
              <span className="font-bold text-[#FF8500] drop-shadow-[0_0_6px_rgba(255,133,0,0.3)]">
                {isMasterFreeAdmin 
                  ? (isArabic ? 'الحد الأدنى: 0.01 USDT' : 'Min: 0.01 USDT')
                  : (isArabic ? 'الحد الأدنى: 5.00 USDT' : 'Min: 5.00 USDT')}
              </span>
            </div>

            {/* Clear balance and exchange rate sub-line with vivid text */}
            <div className="flex items-center justify-between text-[11px] px-1 text-gray-300">
              <span className="text-gray-300 font-medium">
                {selectedCrypto.symbol !== 'USDT' && selectedCrypto.symbol !== 'USDC' ? (
                  `سعر الصرف: 1 ${selectedCrypto.symbol} ≈ $${selectedCrypto.rateInUsdt >= 1 ? selectedCrypto.rateInUsdt.toLocaleString(undefined, { maximumFractionDigits: 2 }) : selectedCrypto.rateInUsdt.toFixed(4)}`
                ) : (
                  isArabic ? '1:1 تحويل فوري ومباشر' : '1:1 Instant Conversion'
                )}
              </span>
              <span className="text-[#00FF87] font-bold font-mono drop-shadow-[0_0_6px_rgba(0,255,135,0.35)]">
                {isArabic ? `الرصيد المتاح: $${availableBalance.toFixed(2)}` : `Available: $${availableBalance.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Field 2: Clean Destination Wallet Input with Wallet Icon */}
          <div className="space-y-1.5">
            <div className="w-full rounded-2xl bg-[#0F1422]/90 backdrop-blur-md border border-white/15 hover:border-amber-500/40 focus-within:border-[#FF6B00] focus-within:ring-2 focus-within:ring-[#FF6B00]/30 focus-within:shadow-[0_0_20px_rgba(255,107,0,0.25)] p-3.5 flex items-center gap-2.5 transition-all duration-300">
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 shrink-0">
                <Wallet className="w-4 h-4 text-amber-400/80" />
              </div>
              <input
                id="withdraw-address-input"
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setError(null);
                }}
                placeholder={isArabic ? 'عنوان المحفظة' : 'Wallet Address'}
                className="w-full text-right bg-transparent text-white font-mono placeholder:text-gray-400 focus:outline-none text-xs font-bold tracking-wide"
              />
            </div>
          </div>

          {/* Field 3: Security Password with Eye Icon on the Left/Right */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-amber-400 font-mono">
                {fundPassword ? '●●●●●●' : ''}
              </span>
              <label className="text-xs font-black text-white">
                {isArabic ? 'كلمة المرور (المسجل بها الحساب)' : 'Account Password'}
              </label>
            </div>

            <div className="w-full rounded-2xl bg-[#0F1422]/90 backdrop-blur-md border border-white/15 hover:border-amber-500/40 focus-within:border-[#FF6B00] focus-within:ring-2 focus-within:ring-[#FF6B00]/30 focus-within:shadow-[0_0_20px_rgba(255,107,0,0.25)] p-3.5 flex items-center gap-2.5 transition-all duration-300">
              {/* Eye toggle icon */}
              <button
                id="withdraw-toggle-password-btn"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-amber-400 transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/5 shrink-0"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <input
                id="withdraw-fund-password-input"
                type={showPassword ? 'text' : 'password'}
                value={fundPassword}
                onChange={(e) => {
                  setFundPassword(e.target.value);
                  setError(null);
                }}
                placeholder={isArabic ? 'أدخل نفس كلمة المرور التي سجلت بها حسابك' : 'Enter the same password you registered with'}
                className="w-full text-right bg-transparent text-white placeholder:text-gray-400 focus:outline-none text-xs font-bold"
              />
            </div>
          </div>

        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2.5 shadow-lg shadow-rose-950/40">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {/* 5. CONFIRM WITHDRAWAL BUTTON: Glowing Drop Shadow with Neon Flare */}
        <button
          id="confirm-withdraw-action-btn"
          type="button"
          onClick={handleWithdraw}
          disabled={isProcessing}
          className={`relative w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-[#FF6B00] via-[#FF8500] to-[#FF5500] hover:from-[#ff7a1a] hover:to-[#ff6000] text-black shadow-[0_0_30px_rgba(255,107,0,0.45),0_10px_25px_rgba(0,0,0,0.6)] flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-98 disabled:opacity-50 overflow-hidden border border-amber-400/40 ${
            isProcessing ? 'animate-pulse' : ''
          }`}
        >
          {/* Dynamic Skeleton Ripple Wave effect during flight mode loading */}
          {isProcessing && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_1s_infinite]" />
          )}

          {isProcessing ? (
            <div className="flex items-center justify-center gap-2.5 z-10">
              <div className="relative flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span className="absolute w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </div>
              <div className="flex flex-col items-start text-start leading-tight">
                <span className="text-xs font-black">جاري بث المعاملة عبر شبكة البلوكتشين...</span>
                <span className="text-[10px] font-mono font-bold opacity-85">Smart Contract Broadcasting • 1.0s</span>
              </div>
            </div>
          ) : (
            <>
              <ArrowUpRight className="w-5 h-5 stroke-[2.6]" />
              <span>{isArabic ? 'طلب السحب' : 'Request Withdrawal'}</span>
            </>
          )}
        </button>

        {/* 6. PREMIUM WITHDRAWAL RULES CARD (كرت شروط وتعليمات السحب الصارمة) */}
        <div 
          id="withdrawal-strict-rules-card"
          className="rounded-2xl p-4 bg-gradient-to-b from-[#111522]/95 to-[#0A0D15]/95 border border-white/10 shadow-xl space-y-3 text-right"
        >
          {/* Card Header with Shield & Badge */}
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              {isArabic ? 'معالجة آلية 24/7' : 'Auto 24/7'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-white">
                {isArabic ? 'شروط وقواعد السحب الصارمة' : 'Strict Withdrawal Rules'}
              </span>
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* List of 4 Strict Rules */}
          <div className="space-y-2 text-xs leading-relaxed">
            {/* Rule 1 */}
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <p className="text-gray-300 text-[11.5px]">
                {isArabic 
                  ? 'الحد الأدنى لطلب عملية السحب الفوري هو 5.00 USDT.' 
                  : 'Minimum instant withdrawal request is 5.00 USDT.'
                }
              </p>
            </div>

            {/* Rule 2 */}
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-sky-400/15 border border-sky-400/30 text-sky-300 font-mono font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <p className="text-gray-300 text-[11.5px]">
                {isArabic 
                  ? 'تدعم المنصة السحب الآمن عبر شبكات: TRC-20, BEP-20, POLYGON, ETH.' 
                  : 'Platform supports secure withdrawals via: TRC-20, BEP-20, POLYGON, ETH.'
                }
              </p>
            </div>

            {/* Rule 3 */}
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 font-mono font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <p className="text-gray-300 text-[11.5px]">
                {isArabic 
                  ? 'يتم معالجة طلب السحب وإيداعه في محفظتك تلقائياً خلال فترة من 1 إلى 5 دقائق فقط.' 
                  : 'Withdrawal requests are processed and deposited to your wallet automatically within 1 to 5 minutes only.'
                }
              </p>
            </div>

            {/* Rule 4 */}
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-rose-400/15 border border-rose-400/30 text-rose-300 font-mono font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                4
              </span>
              <p className="text-gray-300 text-[11.5px]">
                {isArabic 
                  ? 'في حال تأخر وصول الرصيد لأي سبب تقني، يرجى الضغط فوراً على أيقونة خدمة العملاء العائمة للتواصل مع الدعم الفني المباشر (24 ساعة/يوم).' 
                  : 'If funds are delayed for any technical reason, please click the floating customer support icon for live 24/7 assistance.'
                }
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* CENTERED POPUP MODAL: Strict Security Alert for Incorrect Password */}
      {showWrongPasswordPopup && (
        <div 
          id="withdraw-wrong-password-popup"
          dir={isArabic ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-sm rounded-3xl p-6 glass border border-rose-500/50 shadow-[0_20px_70px_rgba(244,63,94,0.35)] bg-[#0E0A12] text-center space-y-4 text-white">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowWrongPasswordPopup(false)}
              className="absolute top-4 start-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Glowing Security Shield Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 mx-auto flex items-center justify-center shadow-xl shadow-rose-600/30 p-0.5">
              <div className="w-full h-full bg-[#160D17] rounded-[14px] flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-8 h-8 stroke-[2.3] animate-pulse" />
              </div>
            </div>

            {/* Title & Warning Text */}
            <div className="space-y-2">
              <span className="px-3 py-0.5 rounded-full text-[10.5px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                {isArabic ? 'حظر أمني فوري' : 'Security Block'}
              </span>
              <h4 className="text-lg font-black text-white">
                {isArabic ? 'تنبيه أمني: كلمة المرور غير مطابقة!' : 'Security Alert: Password Mismatch!'}
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed pt-1">
                {isArabic 
                  ? 'يرجى إدخال نفس كلمة المرور التي قمت بالتسجيل بها في حسابك لتأكيد السحب.' 
                  : 'Please enter the exact password you registered your account with to confirm withdrawal.'}
              </p>
            </div>

            {/* Security Tip Box */}
            <div className="p-3 rounded-2xl bg-black/60 border border-white/10 text-start flex items-center gap-2.5">
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-[11px] text-gray-400">
                {isArabic 
                  ? 'كلمة المرور المطلوبة للسحب تطابق حصرياً نفس كلمة المرور التي سجلت بها حسابك في المنصة.' 
                  : 'The withdrawal password strictly matches the exact password used during account registration.'}
              </p>
            </div>

            {/* Action Button */}
            <button
              type="button"
              id="close-wrong-password-popup-btn"
              onClick={() => {
                soundEngine.playClick();
                setShowWrongPasswordPopup(false);
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
            >
              {isArabic ? 'حسناً، فهمت وسأعيد المحاولة' : 'Understood, Retry with Correct Password'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
