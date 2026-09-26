import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck,
  Mail,
  Radio,
  Menu
} from 'lucide-react';
import { UserProfile, VIPPlan } from '../types';
import { soundEngine } from '../utils/audio';
import { storage } from '../utils/storage';
import adRocketLogo from '../assets/images/ad_rocket_android_logo_1789164710567.jpg';
import { FloatingLanguageWidget } from './FloatingLanguageWidget';

interface HeaderNavProps {
  user: UserProfile;
  vipPlan: VIPPlan;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenDeposit: () => void;
  onOpenAdminPanel?: () => void;
  onToggleThemeAttempt?: () => void;
  onSelectTab: (tab: 'home' | 'vip' | 'tasks' | 'wallet' | 'profile' | 'team' | 'proofs') => void;
  unreadCount?: number;
  onOpenInbox?: () => void;
  onOpenSidebar?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  onSelectTab,
  unreadCount,
  onOpenInbox,
  onOpenSidebar,
}) => {
  const [internalHasUnread, setInternalHasUnread] = useState<boolean>(() => {
    if (typeof unreadCount === 'number') return unreadCount > 0;
    try {
      const email = storage.getCurrentUserEmail();
      if (!email) return false;
      return storage.getUserNotifications(email).some(n => !n.read);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let timer: any = null;
    const checkUnread = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          const email = storage.getCurrentUserEmail();
          if (!email) {
            setInternalHasUnread(false);
            return;
          }
          const unread = storage.getUserNotifications(email).some(n => !n.read);
          setInternalHasUnread(unread);
        } catch {
          setInternalHasUnread(false);
        }
      }, 300);
    };

    window.addEventListener('vipads_notifications_changed', checkUnread);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('vipads_notifications_changed', checkUnread);
    };
  }, []);

  const isBadgeVisible = typeof unreadCount === 'number' ? unreadCount > 0 : internalHasUnread;
  return (
    <header className="sticky top-0 z-50 w-full bg-[#080A0F] border-b border-white/10 shadow-lg transform-gpu" dir="ltr">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
        
        {/* LEFT SECTION: Hamburger Menu Button + Platform Name "ADS VIP" */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hamburger Menu Trigger for Sidebar */}
          {onOpenSidebar && (
            <button
              id="nav-open-sidebar-btn"
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onOpenSidebar();
              }}
              className="w-10 h-10 rounded-2xl bg-[#12151D] hover:bg-[#181C26] border border-white/10 hover:border-[#FF6B00]/60 flex items-center justify-center text-gray-300 hover:text-white transition-all cursor-pointer active:scale-95 group shadow-md"
              title="فتح القائمة الجانبية / Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-gray-300 group-hover:text-[#FF6B00] transition-colors" />
            </button>
          )}

          <div 
            id="brand-logo-container" 
            onClick={() => {
              soundEngine.playClick();
              onSelectTab('home');
            }}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group"
          >
            {/* Custom Android Ad Rocket 3D Logo */}
            <div
              id="nav-brand-logo-btn"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-black border border-[#FF6B00]/80 group-hover:border-amber-400 p-0.5 shadow-[0_0_18px_rgba(255,107,0,0.4)] transition-all active:scale-95 overflow-hidden flex items-center justify-center shrink-0"
              title="ADS VIP - Ad Rocket"
            >
              <img 
                src={adRocketLogo} 
                alt="ADS VIP Logo" 
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-[14px] group-hover:scale-110 transition-transform duration-500 select-none"
              />
            </div>

            {/* Platform Name: ADS VIP */}
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl sm:text-2xl tracking-tight text-white font-sans flex items-center">
                ADS <span className="text-[#FF6B00] ml-1">VIP</span>
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Live Indicator, Envelope Messages, Clean Globe, and Golden Shield */}
        <div className="flex items-center gap-2 sm:gap-2.5 select-none">
          {/* Live broadcast pill */}
          <div 
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold"
            title="بث مباشر متصل بالنسخة المنشورة عبر Firestore"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Radio className="w-3 h-3 animate-pulse" />
            <span>مباشر</span>
          </div>

          {/* Envelope Icon with Red Alert Notification Badge */}
          <button
            type="button"
            id="nav-inbox-envelope-btn"
            onClick={() => {
              soundEngine.playClick();
              if (onOpenInbox) onOpenInbox();
            }}
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#12151D] hover:bg-[#181C26] border border-white/10 hover:border-[#FF6B00]/50 flex items-center justify-center text-gray-300 hover:text-white transition-all cursor-pointer active:scale-95 group shadow-md"
            title="صندوق الرسائل والإشعارات"
          >
            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-[#FF6B00] transition-colors" />

            {/* Glowing Neon Red Badge - appears ONLY when there are unread notifications */}
            {isBadgeVisible && (
              <span 
                id="nav-inbox-unread-badge"
                className="absolute -top-1 -right-1 flex h-3 w-3 sm:h-3.5 sm:w-3.5 items-center justify-center pointer-events-none"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-80" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-red-500 border-2 border-[#080A0F] shadow-[0_0_10px_#EF4444]" />
              </span>
            )}
          </button>

          {/* Pure Clean Globe Language Button */}
          <div className="relative flex items-center justify-center">
            <FloatingLanguageWidget floating={false} />
          </div>

          {/* Shiny Golden Shield */}
          <div 
            id="nav-security-shield-badge"
            onClick={() => {
              soundEngine.playClick();
              onSelectTab('vip');
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 via-black/70 to-black/90 border border-amber-500/60 hover:border-amber-400 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer active:scale-95 group"
            title="ADS VIP Shield"
          >
            <ShieldCheck className="w-5 h-5 text-amber-400 group-hover:scale-110 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)] transition-transform" />
          </div>
        </div>

      </div>
    </header>
  );
};

