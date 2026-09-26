import React, { useState } from 'react';
import { 
  X, 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { soundEngine } from '../../utils/audio';
import { storage } from '../../utils/storage';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'vip') => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onShowToast
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = (userEmail || '').trim().toLowerCase();
    const storedUser = storage.getUserByEmail(cleanEmail);

    // If user has existing password, check it
    if (storedUser && storedUser.password) {
      if (!currentPassword) {
        soundEngine.playError();
        setError(isArabic ? 'يرجى إدخال كلمة المرور الحالية' : 'Please enter current password');
        return;
      }
      if (storedUser.password !== currentPassword) {
        soundEngine.playError();
        setError(isArabic ? 'كلمة المرور الحالية غير صحيحة' : 'Current password does not match');
        return;
      }
    }

    if (!newPassword || newPassword.length < 6) {
      soundEngine.playError();
      setError(isArabic ? 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' : 'New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      soundEngine.playError();
      setError(isArabic ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    soundEngine.playClickSound();

    const success = storage.updateUserPassword(cleanEmail, newPassword);
    setIsSubmitting(false);

    if (success) {
      soundEngine.playTaskRewardSound();
      onShowToast(
        isArabic ? 'تم تغيير كلمة المرور بنجاح' : 'Password Updated',
        isArabic ? 'تم تحديث كلمة المرور لحسابك وحفظ التعديلات' : 'Your password has been successfully updated',
        'success'
      );
      // Reset state and close
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } else {
      soundEngine.playError();
      setError(isArabic ? 'حدث خطأ أثناء حفظ كلمة المرور' : 'Failed to update password');
    }
  };

  return (
    <div 
      dir={isArabic ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 pb-28 sm:pb-28 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-3xl p-5 sm:p-7 glass border border-white/15 shadow-2xl bg-[#090B12] text-white flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6B00] via-amber-500 to-rose-500 p-0.5 shadow-lg shadow-orange-500/20 shrink-0">
              <div className="w-full h-full bg-[#0E1018] rounded-[14px] flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-[#FF6B00]" />
              </div>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                {isArabic ? 'تغيير كلمة المرور' : 'Change Password'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {isArabic ? 'تحديث كلمة سر الدخول لحماية أمان محفظتك' : 'Update your credentials to secure your account'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto space-y-4 py-4 custom-scrollbar flex-1">
          
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs font-bold animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-gray-400" />
              <span>{isArabic ? 'كلمة المرور الحالية' : 'Current Password'}</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={isArabic ? 'أدخل كلمة المرور الحالية' : 'Enter current password'}
                className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/10 focus:border-[#FF6B00] text-white placeholder-gray-500 text-sm font-medium outline-none transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 end-3 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>{isArabic ? 'كلمة المرور الجديدة' : 'New Password'}</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={isArabic ? '6 أحرف على الأقل' : 'At least 6 characters'}
                className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/10 focus:border-amber-400 text-white placeholder-gray-500 text-sm font-medium outline-none transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 end-3 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isArabic ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={isArabic ? 'أعد كتابة كلمة المرور الجديدة' : 'Re-enter new password'}
                className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/10 focus:border-emerald-500 text-white placeholder-gray-500 text-sm font-medium outline-none transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 end-3 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Security Note */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-2.5 text-gray-400 text-[11px] leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              {isArabic 
                ? 'بعد تغيير كلمة المرور، ستتمكن من تسجيل الدخول فوراً ببياناتك الجديدة مع الحفاظ على جميع أرصدتك والمهام المسجلة.'
                : 'After changing your password, your session stays active and balances remain fully intact.'}
            </span>
          </div>

          {/* Submit Button */}
          <div className="pt-2 pb-6 sm:pb-2 sticky bottom-0 bg-gradient-to-t from-[#090B12] via-[#090B12]/95 to-transparent">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-amber-500 hover:brightness-110 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isSubmitting ? (isArabic ? 'جاري التحديث...' : 'Updating...') : (isArabic ? 'تأكيد وحفظ كلمة المرور' : 'Update Password')}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
