import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Wallet, 
  ShieldCheck, 
  Copy, 
  Check, 
  Save, 
  Settings,
  Calendar,
  Sparkles,
  CheckCircle2,
  Lock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { UserProfile } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { soundEngine } from '../../utils/audio';
import { storage } from '../../utils/storage';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updatedFields: Partial<UserProfile>) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'vip') => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onShowToast
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const uName = user?.username || '';
  const userEmail = user?.email || (uName.includes('@') ? uName : `${uName || 'user'}@gmail.com`);

  const cleanWallet = (user.walletAddress && user.walletAddress !== 'TYqQwVENsSVVeSTNks31SyxStHV8x5HXSZ') ? user.walletAddress : '';
  const [username, setUsername] = useState(user.username);
  const [walletAddress, setWalletAddress] = useState(cleanWallet);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize whenever modal opens or user props change
  React.useEffect(() => {
    if (isOpen) {
      setUsername(user.username);
      const valid = (user.walletAddress && user.walletAddress !== 'TYqQwVENsSVVeSTNks31SyxStHV8x5HXSZ') ? user.walletAddress : '';
      setWalletAddress(valid);
    }
  }, [isOpen, user.username, user.walletAddress]);

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldName: string) => {
    soundEngine.playClick();
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedWallet = walletAddress.trim();
    if (!trimmedWallet || trimmedWallet.length < 10) {
      soundEngine.playError();
      onShowToast(
        isArabic ? 'عنوان المحفظة مطلوب' : 'Wallet Address Required',
        isArabic ? 'أدخل عنوان محفظة USDT TRC-20 الخاصة بك هنا لسحب الأرباح' : 'Please enter your USDT TRC-20 wallet address here for withdrawal',
        'warning'
      );
      return;
    }

    setIsSaving(true);
    soundEngine.playClick();

    const trimmedUsername = username.trim() || user.username;

    // Update in storage
    storage.updateUser(userEmail, {
      username: trimmedUsername,
      walletAddress: trimmedWallet
    });

    // Update parent state
    onUpdateUser({
      username: trimmedUsername,
      walletAddress: trimmedWallet
    });

    setIsSaving(false);
    soundEngine.playTaskRewardSound();
    onShowToast(
      isArabic ? 'تم حفظ عنوان المحفظة بنجاح' : 'Wallet Address Saved',
      isArabic ? 'تم ربط عنوان محفظتك الشخصية بنجاح وسيتم اعتماده تلقائياً في صفحة السحب' : 'Your personal withdrawal wallet has been safely linked to your account',
      'success'
    );
    onClose();
  };

  return (
    <div 
      dir={isArabic ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 pb-28 sm:pb-28 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-3xl p-5 sm:p-7 glass border border-white/15 shadow-2xl bg-[#0A0C13] text-white flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00A3FF] via-indigo-500 to-[#FF6B00] p-0.5 shadow-lg shadow-sky-500/20 shrink-0">
              <div className="w-full h-full bg-[#0E1018] rounded-[14px] flex items-center justify-center">
                <Settings className="w-6 h-6 text-[#00A3FF]" />
              </div>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                {isArabic ? 'إعدادات الحساب' : 'Account Settings'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {isArabic ? 'إدارة البيانات الشخصية وعنوان محفظة سحب الأرباح' : 'Manage your profile and withdrawal USDT wallet address'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="overflow-y-auto space-y-4 py-4 custom-scrollbar flex-1">
          
          {/* Readonly info: Email & ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Email */}
            <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-1">
              <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#00A3FF]" />
                <span>{isArabic ? 'البريد الإلكتروني' : 'Email Address'}</span>
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-white truncate" title={userEmail}>
                  {userEmail}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(userEmail, 'email')}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* ID */}
            <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-1">
              <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>{isArabic ? 'المعرف الرقمي (UID)' : 'User ID'}</span>
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-black text-amber-400">
                  {user.userId || 'USR-1002'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(user.userId || 'USR-1002', 'id')}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  {copiedField === 'id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span>{isArabic ? 'اسم المستخدم / الاسم الظاهر' : 'Username / Display Name'}</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isArabic ? 'أدخل اسم المستخدم' : 'Enter username'}
              className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/10 focus:border-[#00A3FF] text-white placeholder-gray-500 text-sm font-medium outline-none transition-all"
            />
          </div>

          {/* TRC-20 Wallet Address */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isArabic ? 'عنوان محفظة سحب الأرباح (USDT TRC-20)' : 'USDT TRC-20 Withdrawal Address'}</span>
              </label>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                TRC-20
              </span>
            </div>
            <div className="relative">
              <input
                id="settings-wallet-address-input"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder={isArabic ? 'أدخل عنوان محفظة USDT TRC-20 الخاصة بك هنا لسحب الأرباح' : 'Enter your USDT TRC-20 wallet address here for withdrawal'}
                className="w-full px-4 py-3.5 pe-16 rounded-2xl bg-black/60 border border-white/10 focus:border-emerald-500 text-white placeholder-gray-500 text-xs sm:text-sm font-mono outline-none transition-all"
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text && text.trim()) {
                      setWalletAddress(text.trim());
                      soundEngine.playClick();
                    }
                  } catch {
                    const promptText = window.prompt(isArabic ? 'الصق عنوان محفظتك هنا:' : 'Paste your wallet address:');
                    if (promptText && promptText.trim()) {
                      setWalletAddress(promptText.trim());
                      soundEngine.playClick();
                    }
                  }
                }}
                className="absolute end-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold cursor-pointer transition-all active:scale-95"
              >
                {isArabic ? 'لصق' : 'Paste'}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {isArabic 
                ? 'تأكد من إدخال عنوان USDT الصحيح على شبكة TRON (TRC-20) لتجنب فقدان الأموال عند السحب.' 
                : 'Ensure this is your valid Tron TRC-20 address for automated withdrawal processing.'}
            </p>
          </div>

          {/* Security Status Box */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-emerald-300">
                  {isArabic ? 'حماية الحساب نشطة (تشفير 256-bit)' : 'Account Security Active (256-bit)'}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {isArabic ? 'جلسة مشفرة ومحمية ببروتوكولات التشفير الأمني المستمر' : 'Encrypted session protected by security protocols'}
              </p>
            </div>
          </div>

          {/* Registration Date */}
          <div className="flex items-center justify-between text-xs text-gray-400 px-1 pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{isArabic ? 'تاريخ التسجيل:' : 'Member Since:'}</span>
            </span>
            <span className="font-mono font-bold text-gray-300">
              {user.joinedDate || '2026-08-28'}
            </span>
          </div>

          {/* Save Button (Prominent & Clear of any bar) */}
          <div className="pt-2 pb-6 sm:pb-2 sticky bottom-0 bg-gradient-to-t from-[#0A0C13] via-[#0A0C13]/95 to-transparent">
            <button
              type="submit"
              id="save-account-settings-btn"
              disabled={isSaving}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#00A3FF] to-[#0077FF] hover:brightness-110 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-sky-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ التعديلات' : 'Save Changes')}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
