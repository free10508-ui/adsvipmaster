import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Globe, Check, X, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageCode } from '../types';
import { soundEngine } from '../utils/audio';

interface FloatingLanguageWidgetProps {
  /** If true, renders as a fixed floating circular button on screen. If false, renders as inline circular button. */
  floating?: boolean;
  className?: string;
  position?: 'bottom-left' | 'top-right' | 'inline';
}

interface LanguageCardConfig {
  code: LanguageCode;
  primaryName: string;
  secondaryName: string;
  flag: string;
}

const LANGUAGE_DETAILS: LanguageCardConfig[] = [
  {
    code: 'ar',
    primaryName: 'العربية',
    secondaryName: 'المملكة العربية السعودية',
    flag: '🇸🇦',
  },
  {
    code: 'en',
    primaryName: 'English',
    secondaryName: 'الإنجليزية (United States)',
    flag: '🇺🇸',
  },
  {
    code: 'fr',
    primaryName: 'Français',
    secondaryName: 'الفرنسية (France)',
    flag: '🇫🇷',
  },
  {
    code: 'es',
    primaryName: 'Español',
    secondaryName: 'الإسبانية (Spain)',
    flag: '🇪🇸',
  },
  {
    code: 'ru',
    primaryName: 'Русский',
    secondaryName: 'الروسية (Russia)',
    flag: '🇷🇺',
  },
  {
    code: 'ca',
    primaryName: 'English / Français',
    secondaryName: 'كندا (Canada - Bilingual)',
    flag: '🇨🇦',
  },
];

export const FloatingLanguageWidget: React.FC<FloatingLanguageWidgetProps> = ({
  floating = true,
  className = '',
  position = 'bottom-left',
}) => {
  const { language, setLanguage, currentLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelectLanguage = (code: LanguageCode) => {
    soundEngine.playClick();
    setLanguage(code);
    setIsOpen(false);
  };

  // Determine floating positioning class
  const positionClasses = floating
    ? position === 'bottom-left'
      ? 'fixed bottom-24 left-3.5 z-40 sm:bottom-28 sm:left-6'
      : 'fixed top-4 right-4 z-40'
    : 'relative';

  return (
    <>
      {/* 🌐 Clean Globe Button (Transparent, Minimalist, No outer circle, No flag text) */}
      <div className={`${positionClasses} ${className}`}>
        <button
          id="header-globe-language-btn"
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setIsOpen(!isOpen);
          }}
          aria-expanded={isOpen}
          aria-label={t('nav.select_language')}
          title="تغيير لغة المنصة / Change Platform Language"
          className="relative p-1.5 rounded-xl hover:bg-white/10 active:scale-95 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer select-none group"
        >
          {/* Pure clean Globe Icon */}
          <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-gray-200 group-hover:text-[#FF6B00] group-hover:scale-110 transition-all duration-200 drop-shadow-[0_0_8px_rgba(255,107,0,0.35)]" />
        </button>
      </div>

      {/* 📋 Expanded Professional Vertical Modal (6 Options - Mobile-Optimized) - Portal into document.body with Absolute Front Layer */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          id="language-modal-backdrop"
          style={{ zIndex: 999999 }}
          className="fixed inset-0 !z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsOpen(false)}
        >
          <div
            id="language-expanded-modal"
            style={{ zIndex: 1000000 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[360px] sm:max-w-[390px] rounded-3xl bg-[#0D0F17] border border-orange-500/40 p-4 sm:p-5 shadow-[0_0_50px_rgba(255,107,0,0.25)] relative !z-[1000000] text-white space-y-3.5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar my-auto"
            dir="rtl"
          >
            {/* Background Ambient Glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-orange-500/12 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-orange-500/15 border border-orange-500/40 flex items-center justify-center text-lg">
                  🌐
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                      قائمة اللغات المعتمدة
                    </h3>
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium">
                    اختر لغتك المفضلة (6 خيارات كاملة)
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                id="close-language-modal-btn"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
                title="إغلاق / Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language Options: 6 Complete Vertical Cards */}
            <div className="space-y-2 relative z-10 py-1">
              {LANGUAGE_DETAILS.map((item) => {
                const isSelected = language === item.code;
                return (
                  <button
                    key={item.code}
                    id={`lang-choice-${item.code}`}
                    type="button"
                    onClick={() => handleSelectLanguage(item.code)}
                    className={`w-full p-2.5 sm:p-3 rounded-2xl flex items-center justify-between gap-3 text-right transition-all cursor-pointer select-none active:scale-[0.98] ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-500/20 via-orange-500/15 to-transparent border-2 border-orange-500 text-white shadow-md shadow-orange-500/20 font-bold'
                        : 'bg-[#121520]/80 hover:bg-[#171B2A] border border-white/10 hover:border-orange-500/40 text-gray-300 hover:text-white'
                    }`}
                  >
                    {/* Right side: Flag Emoji & Text Details */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                        {item.flag}
                      </div>
                      <div className="flex flex-col min-w-0 text-right">
                        <span className="text-sm font-black text-white tracking-wide truncate">
                          {item.primaryName}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium truncate">
                          {item.secondaryName}
                        </span>
                      </div>
                    </div>

                    {/* Left side: Selected Check Badge */}
                    <div className="shrink-0 flex items-center">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-orange-500 text-black flex items-center justify-center shadow-md shadow-orange-500/40">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-white/20 bg-white/5 flex items-center justify-center opacity-40 group-hover:opacity-100" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Dismiss / Status Bar */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400 relative z-10">
              <span className="flex items-center gap-1.5 text-orange-400 font-medium">
                <Globe className="w-3 h-3" />
                <span>تبديل فوري بدون إعادة تحميل</span>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                تم الإختيار
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
