import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  Zap, 
  ShieldCheck, 
  Gift, 
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { storage } from '../utils/storage';
import { purgeReferralQueriesFromUrl } from '../utils/urlHelper';
import { registerAccountDeviceSilent } from '../utils/securityFraud';
import { auth, googleProvider } from '../utils/firebaseSync';
import { signInWithPopup } from 'firebase/auth';
import adRocketLogo from '../assets/images/ad_rocket_android_logo_1789164710567.jpg';
import { FloatingLanguageWidget } from './FloatingLanguageWidget';

interface AuthScreenProps {
  onLogin?: (credentials: { identifier: string; isNewUser?: boolean }) => void;
  onLoginSuccess?: (credentials: { identifier: string; isNewUser?: boolean }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onLoginSuccess }) => {
  const { t, language, setLanguage } = useLanguage();
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isReferralLocked, setIsReferralLocked] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Auto-detect referral code from URL query parameter e.g., ?ref=749201 or ?r=749201 or #/r/749201
  useEffect(() => {
    try {
      // 1. Check window.location.search
      const urlParams = new URLSearchParams(window.location.search);
      let refParam = urlParams.get('ref') || urlParams.get('r') || urlParams.get('referral') || urlParams.get('invite');
      
      // 2. Check hash if any query params or routes exist after # (common in single-page apps)
      if (!refParam && window.location.hash) {
        const hash = window.location.hash;
        if (hash.includes('?')) {
          const hashQuery = hash.substring(hash.indexOf('?'));
          const hashParams = new URLSearchParams(hashQuery);
          refParam = hashParams.get('ref') || hashParams.get('r') || hashParams.get('referral') || hashParams.get('invite');
        } else if (hash.includes('/r/')) {
          refParam = hash.split('/r/')[1]?.split('?')[0]?.split('/')[0]?.trim();
        }
      }

      // 3. Check pathname (/r/CODE)
      if (!refParam && window.location.pathname.includes('/r/')) {
        const parts = window.location.pathname.split('/r/');
        if (parts.length > 1) {
          refParam = parts[1].split('/')[0].split('?')[0].trim();
        }
      }

      if (refParam) {
        const cleanRef = refParam.trim().toUpperCase();
        setReferralCode(cleanRef);
        setIsReferralLocked(true);
        // Force Register Gate: visitor with referral must land directly on register
        setAuthMode('register');
      }
    } catch (e) {
      console.warn('Referral param detection error:', e);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanRaw = identifier.trim();

    if (!cleanRaw) {
      setErrorMessage(
        language === 'ar'
          ? 'برجاء إدخال بريد إلكتروني صحيح أو رقم هاتف صحيح!'
          : t('auth.error_invalid_identity')
      );
      return;
    }

    // Flexible Identity Validation (حقل الهوية المرن - بريد أو هاتف):
    // 1. Email format: must contain @, valid domain with dot and 2+ char extension, no spaces
    // 2. Phone format: digits only (allowing optional leading + or 00), min 7 digits, max 16 digits
    // Explicitly rejects single characters/numbers like "1", weak strings, or random letters
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanRaw);
    const cleanPhoneDigits = cleanRaw.replace(/[\s\-\(\)]/g, '');
    const isPhone = /^(\+|00)?[0-9]{7,16}$/.test(cleanPhoneDigits);

    if (!isEmail && !isPhone) {
      setErrorMessage(
        language === 'ar'
          ? 'برجاء إدخال بريد إلكتروني صحيح أو رقم هاتف صحيح!'
          : t('auth.error_invalid_identity')
      );
      return;
    }

    if (!password) {
      setErrorMessage(language === 'ar' ? 'يرجى إدخال كلمة المرور' : t('auth.error_fields'));
      return;
    }

    // Password Constraints: min 6 characters for new registration
    if (authMode === 'register' && password.length < 6) {
      setErrorMessage(
        language === 'ar'
          ? 'كلمة المرور يجب ألا تقل عن 6 خانات!'
          : t('auth.error_password_min_length')
      );
      return;
    }

    const cleanEmail = cleanRaw.toLowerCase();

    if (authMode === 'register') {
      if (password !== confirmPassword) {
        setErrorMessage(language === 'ar' ? 'كلمات المرور غير متطابقة، يرجى التأكد وإعادة المحاولة' : t('auth.error_password_match'));
        return;
      }

      // Check duplicate registration - ONLY if truly existing in localStorage/registry
      const isAlreadyRegistered = storage.userExists(cleanEmail);
      if (isAlreadyRegistered) {
        setErrorMessage(
          language === 'ar'
            ? '⚠️ هذا الحساب مسجل بالفعل في المنصة! يرجى التبديل لتبويب تسجيل الدخول.'
            : 'This account is already registered. Please log in.'
        );
        return;
      }

      // Referral code is 100% required
      if (!referralCode || !referralCode.trim()) {
        setErrorMessage(
          language === 'ar'
            ? 'رمز الدعوة مطلوب لإتمام إنشاء الحساب!'
            : 'Referral code is required!'
        );
        return;
      }
    } else {
      // Login mode: strictly for existing registered accounts only
      const userExists = storage.userExists(cleanEmail);
      const existingUser = storage.getUserByEmail(cleanEmail);
      if (!userExists || !existingUser) {
        setErrorMessage(
          language === 'ar'
            ? '⚠️ هذا الحساب غير مسجل في المنصة! يرجى الانتقال لتبويب إنشاء حساب جديد.'
            : 'Account does not exist. Please switch to Sign Up to create an account.'
        );
        return;
      }

      // Check password: Admin free@gmail.com strictly accepts "000000"
      if (cleanEmail === 'free@gmail.com') {
        if (password !== '000000') {
          setErrorMessage(
            language === 'ar'
              ? 'كلمة المرور غير صحيحة!'
              : 'Incorrect password!'
          );
          return;
        }
      } else {
        let registeredPass = '';
        try {
          registeredPass = (localStorage.getItem(`vipads_user_pass_${cleanEmail}`) || '').trim();
        } catch {}

        const userPass = (existingUser.password || registeredPass || '').trim();
        if (userPass && password !== userPass) {
          setErrorMessage(
            language === 'ar'
              ? 'كلمة المرور غير صحيحة!'
              : 'Incorrect password!'
          );
          return;
        }
      }
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);

      if (authMode === 'register') {
        const usernamePart = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
        const regResult = storage.registerNewUser(cleanEmail, usernamePart, password, referralCode.trim());
        if (!regResult.success) {
          setErrorMessage(regResult.error || 'فشل إنشاء الحساب');
          return;
        }
        // Immediate Silent URL Purge & Active Session Enforcer upon Registration Success
        purgeReferralQueriesFromUrl();
        // Silent Device Fingerprint Registration
        registerAccountDeviceSilent(cleanEmail, referralCode.trim());
        try {
          localStorage.setItem('vipads_is_logged_in', 'true');
          localStorage.setItem('vipads_user_registered', 'true');
          localStorage.setItem(`vipads_user_pass_${cleanEmail}`, password);
          storage.setCurrentUserEmail(cleanEmail);
        } catch {}
      } else {
        // Strict login mode: User MUST exist in database
        const user = storage.getUserByEmail(cleanEmail);
        if (!user) {
          setErrorMessage(
            language === 'ar'
              ? 'الحساب غير موجود'
              : 'Account does not exist'
          );
          return;
        }
        
        storage.setCurrentUserEmail(user.email);
        // Silent Device Fingerprint Registration
        registerAccountDeviceSilent(cleanEmail);
        if (cleanEmail === 'free@gmail.com') {
          user.password = '000000';
          storage.updateUserPassword('free@gmail.com', '000000');
        }
        purgeReferralQueriesFromUrl();
        try {
          localStorage.setItem('vipads_is_logged_in', 'true');
          localStorage.setItem('vipads_user_registered', 'true');
          localStorage.setItem(`vipads_user_pass_${cleanEmail}`, cleanEmail === 'free@gmail.com' ? '000000' : password);
        } catch {}
      }

      const loginCallback = onLogin || onLoginSuccess;
      if (loginCallback) {
        loginCallback({
          identifier: cleanEmail,
          isNewUser: authMode === 'register'
        });
      }
    }, 450);
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleEmail = result.user.email?.toLowerCase().trim();
      if (!googleEmail) {
        throw new Error(language === 'ar' ? 'لم يتم العثور على بريد إلكتروني في حساب Google' : 'No email found in Google account');
      }

      const displayName = result.user.displayName || googleEmail.split('@')[0];
      const userExists = storage.userExists(googleEmail);
      const existingUser = storage.getUserByEmail(googleEmail);

      if (userExists && existingUser) {
        // Existing user: Keep 100% of their money, balances, vipLevel, tasks intact!
        try {
          localStorage.setItem('vipads_is_logged_in', 'true');
          localStorage.setItem('vipads_user_registered', 'true');
          storage.setCurrentUserEmail(googleEmail);
        } catch {}

        const loginCallback = onLogin || onLoginSuccess;
        if (loginCallback) {
          loginCallback({ identifier: googleEmail, isNewUser: false });
        }
      } else {
        // New user registering with Google Auth
        const cleanRef = referralCode.trim() || 'VIP777';
        const regResult = storage.registerNewUser(
          googleEmail,
          displayName,
          'GoogleSec_' + result.user.uid.slice(0, 8),
          cleanRef
        );

        if (!regResult.success && !storage.userExists(googleEmail)) {
          setErrorMessage(regResult.error || (language === 'ar' ? 'فشل إنشاء الحساب بواسطة Google' : 'Failed to register with Google'));
          setIsGoogleLoading(false);
          return;
        }

        purgeReferralQueriesFromUrl();
        registerAccountDeviceSilent(googleEmail, cleanRef);

        try {
          localStorage.setItem('vipads_is_logged_in', 'true');
          localStorage.setItem('vipads_user_registered', 'true');
          storage.setCurrentUserEmail(googleEmail);
        } catch {}

        const loginCallback = onLogin || onLoginSuccess;
        if (loginCallback) {
          loginCallback({ identifier: googleEmail, isNewUser: true });
        }
      }
    } catch (error: any) {
      console.warn('Google Sign-In Error:', error);
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        setErrorMessage(language === 'ar' ? 'تم إغلاق نافذة تسجيل الدخول أو إلغاؤها' : 'Google sign-in popup was closed');
      } else {
        setErrorMessage(error?.message || (language === 'ar' ? 'تعذر تسجيل الدخول بواسطة Google' : 'Failed to sign in with Google'));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#07080c] flex flex-col justify-between selection:bg-[#FF6B00]/30 selection:text-[#FF6B00]">
      
      {/* Background ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#FF6B00]/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#00A3FF]/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-96 bg-[#FF6B00]/5 rounded-full blur-3xl" />
      </div>

      {/* Top Navbar with Logo and Clean Globe Icon (Elevated Z-Index) */}
      <header className="relative z-[9999] w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black border border-[#FF6B00] p-0.5 shadow-lg shadow-[#FF6B00]/25 flex items-center justify-center overflow-hidden shrink-0">
            <img 
              src={adRocketLogo} 
              alt="Logo" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-[8px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-xl tracking-wider text-white font-mono">
              {t('brand.name')}
            </span>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#FF6B00] text-black uppercase">
              {t('brand.crypto')}
            </span>
          </div>
        </div>

        {/* Circular Floating Globe Button with Expanded 6-Language Modal */}
        <FloatingLanguageWidget floating={false} />
      </header>

      {/* Main Authentication Card with Clean Margin-Top Spacing */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 pt-8 sm:pt-14 pb-12 flex-1 flex flex-col justify-center mt-4 sm:mt-8">
        <div className="rounded-3xl bg-[#0D0F17]/90 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
          
          {/* Header Title & Neatly Formatted Texts */}
          <div className="text-center space-y-3 pb-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/25 text-[#FF6B00] text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>VIPads Web3 Gateway</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-normal leading-relaxed px-1">
              {authMode === 'login' ? t('auth.title_login') : t('auth.title_register')}
            </h1>
            
            <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto leading-relaxed px-2">
              {authMode === 'login' ? t('auth.subtitle_login') : t('auth.subtitle_register')}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-black/50 rounded-2xl border border-white/5">
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage('');
              }}
              className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF8533] text-black shadow-md shadow-[#FF6B00]/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>{t('auth.login_tab')}</span>
            </button>

            <button
              id="auth-tab-register"
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMessage('');
              }}
              className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-[#00A3FF] to-[#38BDF8] text-black shadow-md shadow-[#00A3FF]/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{t('auth.register_tab')}</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center animate-in fade-in duration-150">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Identifier: Email / Phone */}
            <div className="space-y-1.5 text-start">
              <label className="text-xs font-bold text-gray-300 block">
                {language === 'ar' ? 'البريد الإلكتروني أو رقم الهاتف' : t('auth.email_or_phone')} <span className="text-[#FF6B00]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="auth-identifier-input"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder={language === 'ar' ? 'البريد الإلكتروني أو رقم الهاتف' : t('auth.email_or_phone')}
                  required
                  className="w-full ps-10 pe-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 text-start">
              <label className="text-xs font-bold text-gray-300 block">
                {t('auth.password')} <span className="text-[#FF6B00]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder={
                    authMode === 'register'
                      ? (language === 'ar' ? 'كلمة المرور (6 خانات على الأقل)' : 'Password (min 6 characters)')
                      : (language === 'ar' ? 'كلمة المرور' : t('auth.password'))
                  }
                  required
                  minLength={authMode === 'register' ? 6 : 1}
                  className="w-full ps-10 pe-10 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 pe-3.5 flex items-center text-gray-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* If Register Mode: Confirm Password & Invite Code */}
            {authMode === 'register' && (
              <>
                <div className="space-y-1.5 text-start animate-in fade-in duration-200">
                  <label className="text-xs font-bold text-gray-300 block">
                    {t('auth.confirm_password')} <span className="text-[#00A3FF]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="auth-confirm-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder={language === 'ar' ? 'تأكيد كلمة المرور' : t('auth.confirm_password')}
                      required
                      minLength={6}
                      className="w-full ps-10 pe-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-[#00A3FF] focus:ring-1 focus:ring-[#00A3FF] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-start animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-300 flex items-center gap-1">
                      <span>{language === 'ar' ? 'رمز الدعوة' : 'Referral Code'}</span>
                      <span className="text-red-400 font-bold">*</span>
                    </label>
                    {isReferralLocked && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>كود موثق ومقفل</span>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-gray-400">
                      <Gift className={`w-4 h-4 ${isReferralLocked ? 'text-emerald-400' : 'text-[#FF6B00]'}`} />
                    </div>
                    <input
                      id="auth-referral-code-input"
                      type="text"
                      required
                      value={referralCode}
                      readOnly={isReferralLocked}
                      onChange={(e) => {
                        if (!isReferralLocked) {
                          setReferralCode(e.target.value.toUpperCase());
                        }
                      }}
                      placeholder={language === 'ar' ? 'رمز الدعوة' : 'Referral Code'}
                      className={`w-full ps-10 pe-10 py-3 rounded-2xl text-white text-xs placeholder:text-gray-500 uppercase font-mono transition-all ${
                        isReferralLocked
                          ? 'bg-emerald-950/20 border border-emerald-500/40 text-emerald-300 cursor-not-allowed select-all'
                          : 'bg-black/40 border border-white/10 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]'
                      }`}
                    />
                    {isReferralLocked && (
                      <div className="absolute inset-y-0 end-0 pe-3 flex items-center pointer-events-none text-emerald-400">
                        <Lock className="w-3.5 h-3.5 opacity-80" />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Remember Me & Forgot Password (Login mode) */}
            {authMode === 'login' && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-gray-400 hover:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-700 bg-black/60 text-[#FF6B00] focus:ring-0 cursor-pointer"
                  />
                  <span>{t('auth.remember_me')}</span>
                </label>
                <button
                  type="button"
                  onClick={() => window.open('https://t.me/ameliaadsvip', '_blank')}
                  className="text-xs text-[#00A3FF] hover:underline cursor-pointer"
                >
                  {t('auth.forgot_password')}
                </button>
              </div>
            )}

            {/* Submit Dynamic Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg mt-2 ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-[#FF6B00] to-[#ff7a1a] hover:from-[#ff7a1a] hover:to-[#FF6B00] text-black shadow-[#FF6B00]/25'
                  : 'bg-gradient-to-r from-[#00A3FF] to-[#38BDF8] hover:from-[#38BDF8] hover:to-[#00A3FF] text-black shadow-[#00A3FF]/25'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {authMode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  <span>{authMode === 'login' ? t('auth.submit_login') : t('auth.submit_register')}</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#0b0c12] px-3 text-[10px] uppercase tracking-wider text-gray-400 font-bold whitespace-nowrap">
                {language === 'ar' ? 'أو عبر الدخول المباشر' : 'or continue with'}
              </span>
              <div className="border-t border-white/10 w-full" />
            </div>

            {/* Google Sign-in Button with Firebase Auth */}
            <button
              id="auth-google-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-3 transition-all hover:border-white/30 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>
                {language === 'ar'
                  ? 'تسجيل الدخول باستخدام Google'
                  : 'Continue with Google'}
              </span>
            </button>

          </form>

          {/* Switch Mode Footer Text */}
          <div className="pt-2 text-center text-xs text-gray-400 border-t border-white/5">
            {authMode === 'login' ? (
              <p>
                {t('auth.dont_have_account')}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMessage('');
                  }}
                  className="font-bold text-[#FF6B00] hover:underline cursor-pointer ms-1"
                >
                  {t('auth.switch_to_register')}
                </button>
              </p>
            ) : (
              <p>
                {t('auth.already_have_account')}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage('');
                  }}
                  className="font-bold text-[#00A3FF] hover:underline cursor-pointer ms-1"
                >
                  {t('auth.switch_to_login')}
                </button>
              </p>
            )}
          </div>

          {/* Security Guarantee Note */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('auth.security_badge')}</span>
          </div>

        </div>
      </div>

      {/* Footer Disclaimer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 py-4 text-center border-t border-white/5">
        <p className="text-[11px] text-gray-500">
          {t('auth.terms_agree')}
        </p>
      </footer>

    </div>
  );
};
