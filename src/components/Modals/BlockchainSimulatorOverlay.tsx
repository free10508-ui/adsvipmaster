import React, { useEffect, useState } from 'react';
import { Cpu, ShieldCheck, Zap, Activity } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface BlockchainSimulatorOverlayProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  network?: string;
  durationMs?: number;
  onComplete?: () => void;
}

export const BlockchainSimulatorOverlay: React.FC<BlockchainSimulatorOverlayProps> = ({
  isOpen,
  title,
  subtitle,
  network = 'TRC20 / BEP20 Smart Contract',
  durationMs = 1000,
  onComplete,
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    setProgress(15);
    const step1 = setTimeout(() => setProgress(55), durationMs * 0.3);
    const step2 = setTimeout(() => setProgress(88), durationMs * 0.7);
    const step3 = setTimeout(() => {
      setProgress(100);
      if (onComplete) {
        onComplete();
      }
    }, durationMs);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
    };
  }, [isOpen, durationMs, onComplete]);

  if (!isOpen) return null;

  return (
    <div 
      dir={isArabic ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
    >
      {/* Flight mode simulated ripple glow rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-[360px] h-[360px] rounded-full border border-orange-500/20 animate-ping opacity-30" style={{ animationDuration: '1.2s' }} />
        <div className="w-[280px] h-[280px] rounded-full border border-amber-400/25 animate-ping opacity-40" style={{ animationDuration: '0.9s' }} />
        <div className="w-[200px] h-[200px] rounded-full bg-orange-500/10 rounded-full blur-2xl animate-pulse" />
      </div>

      {/* Main HUD Card */}
      <div className="relative w-full max-w-sm p-6 rounded-3xl bg-[#0D1017]/95 border border-orange-500/40 shadow-[0_20px_70px_rgba(255,107,0,0.25)] text-center text-white space-y-4">
        
        {/* Animated Central Node Icon */}
        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-amber-400 animate-spin opacity-80 blur-[2px]" style={{ animationDuration: '2s' }} />
          <div className="relative w-14 h-14 rounded-2xl bg-[#0c0e15] border border-orange-400/60 flex items-center justify-center text-[#FF6B00] shadow-inner">
            <Cpu className="w-7 h-7 text-amber-400 animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider mb-1">
            <Zap className="w-3 h-3 fill-amber-400" />
            <span>{isArabic ? 'معالجة فورية فائقة السرعة' : 'Lightning 1.0s Process'}</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white leading-tight">
            {title}
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            {subtitle || (isArabic ? 'جاري الاتصال بالعقد الذكي وتوثيق المعاملة عبر البلوكتشين...' : 'Connecting to blockchain network and smart contract...')}
          </p>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <Activity className="w-3 h-3 animate-spin" />
              <span>{isArabic ? 'بث المعاملة' : 'Broadcasting'}</span>
            </span>
            <span className="text-amber-400 font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-black/60 border border-white/10 overflow-hidden p-0.5">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] via-amber-400 to-emerald-400 transition-all duration-300 shadow-[0_0_12px_rgba(255,107,0,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Real-time Blockchain Badges */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400 font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{network}</span>
          </span>
          <span className="text-gray-500">1.0s Confirmed</span>
        </div>
      </div>
    </div>
  );
};
