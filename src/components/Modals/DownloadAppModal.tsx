import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  CheckCircle2, 
  Share2, 
  PlusSquare, 
  ArrowDownToLine, 
  ShieldCheck,
  Chrome,
  Apple
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { soundEngine } from '../../utils/audio';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'vip') => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  isOpen,
  onClose,
  onShowToast
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    soundEngine.playClick();

    if (deferredPrompt) {
      setIsInstalling(true);
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setIsInstalling(false);
      setDeferredPrompt(null);

      if (outcome === 'accepted') {
        soundEngine.playTaskRewardSound();
        if (onShowToast) {
          onShowToast(
            isArabic ? 'بدء تثبيت التطبيق' : 'Installing App',
            isArabic ? 'جاري تثبيت ADS VIP على شاشتك الرئيسية بنجاح' : 'ADS VIP is being added to your home screen',
            'success'
          );
        }
        onClose();
      }
    } else {
      // Guide user if deferred prompt is not natively available
      soundEngine.playClickSound();
      if (onShowToast) {
        onShowToast(
          isArabic ? 'تثبيت التطبيق على هاتفك' : 'Install ADS VIP',
          isArabic 
            ? 'اضغط على خيارات المتصفح (⋮) ثم اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"' 
            : 'Tap browser menu (⋮) and choose "Install App" or "Add to Home Screen"',
          'info'
        );
      }
    }
  };

  return (
    <div 
      dir={isArabic ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 pb-28 sm:pb-28 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200"
    >
      <div 
        id="pwa-download-modal-container"
        className="relative w-full max-w-md rounded-3xl p-5 sm:p-7 glass border border-[#FF6B00]/40 shadow-2xl bg-[#0B0E17] text-white flex flex-col max-h-[88vh] overflow-y-auto custom-scrollbar space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6B00] via-amber-500 to-[#00A3FF] p-0.5 shadow-lg shadow-orange-500/20 shrink-0">
              <div className="w-full h-full bg-[#0E1018] rounded-[14px] flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-[#FF6B00]" />
              </div>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                {isArabic ? 'تثبيت تطبيق ADS VIP' : 'Install ADS VIP App'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {isArabic ? 'تطبيق ويب تقدمي رسمي (PWA) فائق السرعة' : 'Official Fast Standalone Progressive Web App'}
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

        {/* App Icon & Feature Preview Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121624] to-[#0A0D14] border border-white/10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-black border border-[#FF6B00]/60 p-1 flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0 overflow-hidden">
            <img 
              src="/icon.png" 
              alt="ADS VIP Icon" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
              className="w-full h-full object-cover rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-black text-white">ADS VIP App</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30 font-mono">
                PWA v2.0
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              {isArabic 
                ? 'تشغيل بملء الشاشة، سرعة فائقة، وإشعارات الأرباح والمهام اليومية.'
                : 'Fullscreen standalone display, instant loading & daily task notifications.'}
            </p>
          </div>
        </div>

        {/* Standalone Status or Instructions */}
        {isStandalone ? (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              {isArabic 
                ? 'أنت تستخدم التطبيق حالياً في وضع الشاشة الكاملة المستقلة (Standalone Mode).'
                : 'You are currently running the app in Standalone Mode.'}
            </span>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
            {/* Native Android / Chrome Instruction */}
            <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <Chrome className="w-4 h-4 text-sky-400" />
                <span>{isArabic ? 'هواتف أندرويد و Google Chrome:' : 'Android & Google Chrome:'}</span>
              </div>
              <p className="text-[11.5px] text-gray-400">
                {isArabic 
                  ? 'اضغط على زر "تثبيت التطبيق الآن" بالأسفل مباشرة، أو اضغط على خيارات المتصفح (⋮) ثم اختر "تثبيت التطبيق" (Install App).' 
                  : 'Tap "Install App Now" below, or open browser menu (⋮) and tap "Install App".'}
              </p>
            </div>

            {/* Apple iOS Safari Instruction */}
            <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <Apple className="w-4 h-4 text-gray-200" />
                <span>{isArabic ? 'أجهزة آبل iPhone (Safari):' : 'Apple iPhone (Safari):'}</span>
              </div>
              <p className="text-[11.5px] text-gray-400 flex items-center gap-1.5 flex-wrap">
                <span>{isArabic ? 'اضغط زر المشاركة' : 'Tap the Share button'}</span>
                <Share2 className="w-3.5 h-3.5 text-sky-400 inline" />
                <span>{isArabic ? 'ثم اختر "إضافة إلى الصفحة الرئيسية"' : 'then select "Add to Home Screen"'}</span>
                <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" />
              </p>
            </div>
          </div>
        )}

        {/* Benefits Badges */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#FF6B00] shrink-0" />
            <span>{isArabic ? 'تشفير آمن 100%' : '100% Encrypted'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <ArrowDownToLine className="w-4 h-4 text-[#00A3FF] shrink-0" />
            <span>{isArabic ? 'شاشة كاملة بدون شريط' : 'Standalone Window'}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 sticky bottom-0 bg-gradient-to-t from-[#0B0E17] via-[#0B0E17]/95 to-transparent">
          <button
            type="button"
            id="install-pwa-app-btn"
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FF6B00] via-amber-500 to-[#FF8500] hover:brightness-110 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-500/30 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>
              {isInstalling 
                ? (isArabic ? 'جاري الفتح والتثبيت...' : 'Opening Install Prompt...') 
                : (isArabic ? 'تثبيت وتنزيل التطبيق الآن' : 'Install & Download App Now')}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
