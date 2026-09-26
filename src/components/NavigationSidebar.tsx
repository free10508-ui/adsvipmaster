import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Home, 
  Layers, 
  PlayCircle, 
  Users, 
  User, 
  Wallet, 
  FileCheck2, 
  ShieldCheck, 
  Headphones, 
  Crown, 
  Sparkles, 
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Zap,
  Radio
} from 'lucide-react';
import { NavTab, UserProfile, VIPPlan } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { soundEngine } from '../utils/audio';
import adRocketLogo from '../assets/images/ad_rocket_android_logo_1789164710567.jpg';

interface NavigationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: UserProfile;
  vipPlan: VIPPlan;
  availableTasksCount?: number;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onOpenVIPUpgrade?: () => void;
  onOpenSupportCommunity?: () => void;
  onOpenProofs?: () => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  user,
  vipPlan,
  availableTasksCount = 0,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenVIPUpgrade,
  onOpenSupportCommunity,
  onOpenProofs,
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Smooth slide-in/out transition handling
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small tick for CSS transition to kick in
      const timer = requestAnimationFrame(() => {
        setIsAnimatingIn(true);
      });
      // Prevent background scrolling while open
      document.body.style.overflow = 'hidden';
      return () => cancelAnimationFrame(timer);
    } else {
      setIsAnimatingIn(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = '';
      }, 350); // Matches cubic-bezier transition time
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !shouldRender) return null;

  const handleTabClick = (tab: NavTab) => {
    soundEngine.playClick();
    onSelectTab(tab);
    onClose();
  };

  const menuItems: {
    id: NavTab;
    label: string;
    description: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'home',
      label: isArabic ? 'الرئيسية' : 'Home',
      description: isArabic ? 'نظرة عامة والترقيات والمهام' : 'Overview, promos & tasks',
      icon: Home,
    },
    {
      id: 'vip',
      label: isArabic ? 'خطط الـ VIP' : 'VIP Plans',
      description: isArabic ? 'ترقية الباقات ومضاعفة الأرباح' : 'Upgrade tiers & daily income',
      icon: Layers,
      badge: `VIP ${user.vipLevel}`,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'tasks',
      label: isArabic ? 'مهام الفيديو' : 'Video Tasks',
      description: isArabic ? 'شاهد الإعلانات واكسب USDT' : 'Watch ads & earn USDT rewards',
      icon: PlayCircle,
      badge: availableTasksCount > 0 ? availableTasksCount : undefined,
      badgeColor: 'bg-[#FF6B00] text-black font-black',
    },
    {
      id: 'team',
      label: isArabic ? 'فريق الإحالة' : 'Team Referral',
      description: isArabic ? 'دعوة الأصدقاء وعمولات 3 أجيال' : 'Invite friends & 3-tier bonus',
      icon: Users,
    },
    {
      id: 'wallet',
      label: isArabic ? 'المحفظة الرقمية' : 'Digital Wallet',
      description: isArabic ? 'إيداع وشحن وسحب فوري' : 'Deposit & instant withdrawal',
      icon: Wallet,
    },
    {
      id: 'profile',
      label: isArabic ? 'الحساب والعمليات' : 'Account & Profile',
      description: isArabic ? 'بياناتك وسجل المعاملات' : 'Personal data & transaction log',
      icon: User,
    },
    {
      id: 'proofs',
      label: isArabic ? 'إثباتات السحب الحية' : 'Live Withdrawal Proofs',
      description: isArabic ? 'سجلات حقيقية وموثقة من بلوكتشين' : 'Real-time blockchain receipts',
      icon: FileCheck2,
      badge: isArabic ? 'مباشر' : 'LIVE',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    },
  ];

  return createPortal(
    <div
      id="navigation-sidebar-portal"
      className="fixed inset-0 !z-[999999] select-none pointer-events-auto"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* 1. Backdrop Blur Overlay with Smooth Fade Transition */}
      <div
        id="sidebar-backdrop-overlay"
        onClick={() => {
          soundEngine.playClick();
          onClose();
        }}
        className={`fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300 ease-out cursor-pointer ${
          isAnimatingIn ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 2. Glassmorphic Sidebar Body with Elastic Smooth Slide-In */}
      <aside
        id="navigation-sidebar-container"
        style={{
          transition: 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease-out',
        }}
        className={`fixed top-0 bottom-0 ${
          isArabic ? 'right-0' : 'left-0'
        } w-full max-w-[320px] sm:max-w-[360px] bg-[#0A0D15]/95 backdrop-blur-2xl border-${
          isArabic ? 'l' : 'r'
        } border-orange-500/25 shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(255,107,0,0.15)] flex flex-col justify-between z-10 overflow-hidden ${
          isAnimatingIn
            ? 'translate-x-0 opacity-100'
            : isArabic
            ? 'translate-x-full opacity-0'
            : '-translate-x-full opacity-0'
        }`}
      >
        {/* Ambient Neon Backlights */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#FF6B00]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-20 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 right-1/4 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* TOP: Header Bar & Close Button */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            {/* 3D Brand Logo */}
            <div className="w-10 h-10 rounded-2xl bg-black border border-[#FF6B00]/80 p-0.5 shadow-[0_0_15px_rgba(255,107,0,0.4)] flex items-center justify-center shrink-0">
              <img
                src={adRocketLogo}
                alt="Logo"
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-white tracking-tight">ADS</span>
                <span className="font-black text-lg text-[#FF6B00]">VIP</span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 block tracking-wider uppercase">
                {isArabic ? 'القائمة الرئيسية' : 'Main Navigation'}
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button
            id="close-sidebar-btn"
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-orange-500/40 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
            title={isArabic ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MIDDLE: Scrollable Menu Items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 space-y-1.5 relative z-10">
          {/* User Quick Info Capsule */}
          <div className="p-3.5 mb-3 rounded-2xl bg-gradient-to-r from-white/[0.04] to-white/[0.02] border border-white/10 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider">
                {isArabic ? 'الرصيد المتاح' : 'Available Balance'}
              </span>
              <span className="font-mono font-black text-base text-[#00FF87] drop-shadow-[0_0_8px_rgba(0,255,135,0.4)] block truncate">
                ${user.totalBalanceUSDT.toFixed(2)} USDT
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-gradient-to-r from-amber-500 to-[#FF6B00] text-black shrink-0 flex items-center gap-1 shadow-sm">
              <Crown className="w-3 h-3" />
              <span>VIP {user.vipLevel}</span>
            </span>
          </div>

          {/* Navigation Tab Links */}
          <div className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`sidebar-item-${item.id}`}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer text-right group relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF6B00]/20 via-orange-500/15 to-transparent border border-[#FF6B00]/40 text-white shadow-[0_0_20px_rgba(255,107,0,0.15)]'
                      : 'hover:bg-white/[0.04] border border-transparent hover:border-white/10 text-gray-300 hover:text-white'
                  }`}
                >
                  {/* Left Highlight Pill for Active Item */}
                  {isActive && (
                    <div
                      className={`absolute top-2 bottom-2 ${
                        isArabic ? 'right-0' : 'left-0'
                      } w-1.5 rounded-full bg-[#FF6B00] shadow-[0_0_8px_#FF6B00]`}
                    />
                  )}

                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        isActive
                          ? 'bg-[#FF6B00] text-black shadow-[0_0_12px_rgba(255,107,0,0.5)]'
                          : 'bg-white/5 group-hover:bg-orange-500/15 text-gray-300 group-hover:text-orange-400 border border-white/10 group-hover:border-orange-500/30'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-black tracking-tight ${
                            isActive ? 'text-white' : 'text-gray-200 group-hover:text-white'
                          }`}
                        >
                          {item.label}
                        </span>
                        {item.badge !== undefined && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                              item.badgeColor || 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 block truncate group-hover:text-gray-300 mt-0.5">
                        {item.description}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-transform ${
                      isArabic ? 'rotate-180' : ''
                    } ${isActive ? 'text-orange-400' : ''}`}
                  />
                </button>
              );
            })}
          </div>

          {/* Quick Support & Community Card */}
          {onOpenSupportCommunity && (
            <div className="pt-2">
              <button
                id="sidebar-community-support-btn"
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onClose();
                  onOpenSupportCommunity();
                }}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#102018] to-transparent border border-emerald-500/30 hover:border-emerald-400/50 flex items-center justify-between text-right group cursor-pointer transition-all active:scale-[0.99] shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">
                      {isArabic ? 'الدعم والمجتمع المالي' : 'Support & Community'}
                    </span>
                    <span className="text-[10px] text-emerald-400/90 font-medium block">
                      {isArabic ? 'خدمة متواصلة 24/7 ومكافآت' : '24/7 Helpdesk & Group'}
                    </span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-emerald-400 ${isArabic ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM: Quick Action Buttons (Deposit & Upgrade) */}
        <div className="p-4 border-t border-white/10 bg-black/40 space-y-2 relative z-10">
          <div className="grid grid-cols-2 gap-2">
            {onOpenDeposit && (
              <button
                id="sidebar-quick-deposit-btn"
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onClose();
                  onOpenDeposit();
                }}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-emerald-500/40 text-emerald-400 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-xs"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isArabic ? 'إيداع سريع' : 'Deposit'}</span>
              </button>
            )}

            {onOpenVIPUpgrade && (
              <button
                id="sidebar-quick-upgrade-btn"
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onClose();
                  onOpenVIPUpgrade();
                }}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF6B00] to-amber-500 text-black font-black text-xs shadow-[0_0_12px_rgba(255,107,0,0.35)] hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Crown className="w-3.5 h-3.5 text-black" />
                <span>{isArabic ? 'ترقية الباقة' : 'Upgrade'}</span>
              </button>
            )}
          </div>

          <div className="text-center pt-1">
            <span className="text-[10px] font-mono font-bold text-gray-500 tracking-wider uppercase">
              ADS VIP v4.5 • TRC-20 Encrypted
            </span>
          </div>
        </div>
      </aside>
    </div>,
    document.body
  );
};
