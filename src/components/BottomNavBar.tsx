import React from 'react';
import { 
  Home, 
  Layers, 
  PlayCircle,
  Users, 
  User 
} from 'lucide-react';
import { NavTab } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { soundEngine } from '../utils/audio';

interface BottomNavBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  vipLevel: number;
  availableTasksCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = React.memo(({
  activeTab,
  onSelectTab,
  vipLevel,
  availableTasksCount = 10,
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { 
      id: 'home', 
      label: isArabic ? 'الرئيسية' : 'Home', 
      icon: Home 
    },
    { 
      id: 'vip', 
      label: isArabic ? 'الخطط' : 'Plans', 
      icon: Layers, 
    },
    {
      id: 'tasks',
      label: isArabic ? 'المهام' : 'Tasks',
      icon: PlayCircle,
      badge: availableTasksCount > 0 ? availableTasksCount : undefined,
    },
    { 
      id: 'team', 
      label: isArabic ? 'الإحالة' : 'Referral', 
      icon: Users 
    },
    { 
      id: 'profile', 
      label: isArabic ? 'الحساب' : 'Account', 
      icon: User 
    },
  ];

  return (
    <nav 
      id="bottom-glass-navbar-container" 
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#080A0F]/95 border-t border-white/10 backdrop-blur-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.8)]"
      dir="ltr"
      style={{ direction: 'ltr' }}
    >
      <div 
        id="bottom-glass-navbar"
        className="w-full max-w-lg mx-auto px-2 py-2 sm:py-2.5 flex items-center justify-around flex-row"
        dir="ltr"
        style={{ direction: 'ltr' }}
      >
        {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-tab-btn-${item.id}`}
                onClick={() => {
                  soundEngine.playClick();
                  onSelectTab(item.id);
                }}
                className={`relative flex-1 flex flex-col items-center justify-center py-2 px-2 sm:px-3 rounded-2xl cursor-pointer select-none touch-manipulation active:scale-95 ${
                  isActive
                    ? 'text-[#FF6B00]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {/* Active Neon Glow Pill Background */}
                {isActive && (
                  <div className="absolute inset-0 bg-[#FF6B00]/10 rounded-2xl border border-[#FF6B00]/40 shadow-[0_0_15px_rgba(255,107,0,0.2)]" />
                )}

                {/* Icon Container with optional badge */}
                <div className="relative z-10 flex items-center justify-center">
                  <Icon 
                    className={`w-5 h-5 ${
                      isActive 
                        ? 'text-[#FF6B00] scale-105 drop-shadow-[0_0_10px_rgba(255,107,0,0.7)]' 
                        : 'text-gray-400'
                    }`} 
                  />

                  {/* Badge for VIP tier */}
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-3 px-1 py-0.2 min-w-[14px] text-[8px] font-black rounded-full bg-[#FF6B00] text-black flex items-center justify-center shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Text Label */}
                <span 
                  className={`relative z-10 text-[11px] font-bold mt-1 tracking-tight leading-none ${
                    isActive ? 'text-[#FF6B00] font-black drop-shadow-[0_0_8px_rgba(255,107,0,0.4)]' : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </span>

                {/* Active micro dot */}
                {isActive && (
                  <div className="relative z-10 w-1 h-1 rounded-full bg-[#FF6B00] mt-0.5 shadow-[0_0_6px_#FF6B00]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    );
});
