import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageCode } from '../types';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, currentLanguage, supportedLanguages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle language switch
  const handleSelectLanguage = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id="language-selector-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={t('nav.select_language')}
        className="h-9 px-2.5 sm:px-3 rounded-xl bg-black/40 border border-white/10 hover:border-[#FF6B00]/40 flex items-center gap-1.5 sm:gap-2 text-gray-200 hover:text-white transition-all cursor-pointer select-none active:scale-95 shadow-sm"
      >
        <Globe className="w-4 h-4 text-[#FF6B00] shrink-0" />
        <span className="text-base leading-none select-none">{currentLanguage.flag}</span>
        <span className="hidden xs:inline-block text-xs font-bold font-sans tracking-wide">
          {currentLanguage.nativeName}
        </span>
        <ChevronDown 
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#FF6B00]' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="language-dropdown-menu"
          className="absolute top-full mt-2 end-0 z-50 w-64 rounded-2xl glass border border-white/15 shadow-2xl p-1.5 bg-[#12141A]/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header title inside dropdown */}
          <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>{t('nav.select_language')}</span>
            </span>
            <span className="text-[10px] text-gray-400 font-mono font-bold bg-white/5 px-2 py-0.5 rounded-full">
              {supportedLanguages.length} Langs
            </span>
          </div>

          {/* Language Options List */}
          <div className="py-1 space-y-0.5">
            {supportedLanguages.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  id={`lang-option-${lang.code}`}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30 font-extrabold shadow-sm'
                      : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg leading-none">{lang.flag}</span>
                    <div className="flex flex-col text-start">
                      <span className="leading-tight text-white font-medium">{lang.nativeName}</span>
                      <span className="text-[10px] text-gray-400 font-normal">{lang.name}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#FF6B00] text-black flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
