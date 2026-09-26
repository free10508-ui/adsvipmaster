import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { soundEngine } from '../utils/audio';

const TELEGRAM_SUPPORT_URL = 'https://t.me/ameliaadsvip';

export const FloatingSupportWidget: React.FC = () => {
  // Positioning state (x, y) - default to right edge, vertically centered
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const initialY = typeof window !== 'undefined' ? Math.max(120, window.innerHeight * 0.55) : 380;
    const initialX = typeof window !== 'undefined' ? window.innerWidth - 65 : 320;
    return { x: initialX, y: initialY };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isDocked, setIsDocked] = useState(true);
  const [dockSide, setDockSide] = useState<'left' | 'right'>('right');
  const [isHovered, setIsHovered] = useState(false);

  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0
  });

  const movedDistanceRef = useRef<number>(0);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep within viewport on screen resize
  useEffect(() => {
    const handleResize = () => {
      const maxX = window.innerWidth - 60;
      const maxY = window.innerHeight - 100;
      setPosition(prev => ({
        x: dockSide === 'right' ? maxX : 8,
        y: Math.min(Math.max(80, prev.y), maxY)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dockSide]);

  // Handle snapping and automatic hiding
  const snapToEdge = (currentX: number, currentY: number) => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const safeTop = 75;
    const safeBottom = screenHeight - 110;

    const clampedY = Math.min(Math.max(safeTop, currentY), safeBottom);
    const snapToRight = currentX > screenWidth / 2;
    const targetX = snapToRight ? screenWidth - 58 : 6;

    setDockSide(snapToRight ? 'right' : 'left');
    setPosition({ x: targetX, y: clampedY });

    // Auto dock / hide 50% after a short period
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsDocked(true);
    }, 1500);
  };

  // Pointer / Touch down
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only primary button
    if (e.button !== 0) return;
    
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    setIsDragging(true);
    setIsDocked(false);
    movedDistanceRef.current = 0;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y
    };

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  };

  // Pointer / Touch move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;
    movedDistanceRef.current = Math.hypot(deltaX, deltaY);

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const newX = Math.min(Math.max(0, dragStartRef.current.posX + deltaX), screenWidth - 56);
    const newY = Math.min(Math.max(70, dragStartRef.current.posY + deltaY), screenHeight - 95);

    setPosition({ x: newX, y: newY });
  };

  // Pointer / Touch up
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // safe fallback
    }

    // If movement was negligible (< 6px), it's a tap/click -> open Telegram
    if (movedDistanceRef.current < 6) {
      handleClick();
    } else {
      snapToEdge(position.x, position.y);
    }
  };

  const handleClick = () => {
    soundEngine.playClick();
    // Open the official live Telegram support directly
    window.open(TELEGRAM_SUPPORT_URL, '_blank', 'noopener,noreferrer');
  };

  // Determine transform offset when docked (hiding 50% into edge)
  const getDockTransform = () => {
    if (isDragging) return 'none';
    if (!isDocked || isHovered) return 'translateX(0)';
    return dockSide === 'right' ? 'translateX(50%)' : 'translateX(-50%)';
  };

  return (
    <div
      id="floating-telegram-support"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: getDockTransform(),
        transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.3s ease, top 0.3s ease',
        touchAction: 'none',
        zIndex: 45
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => {
        setIsHovered(true);
        setIsDocked(false);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!isDragging) {
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          hideTimerRef.current = setTimeout(() => setIsDocked(true), 2000);
        }
      }}
      className="select-none cursor-grab active:cursor-grabbing group"
      title="خدمة العملاء والدعم الفني 24/7 - Telegram @ameliaadsvip"
    >
      <div className="relative flex items-center">
        {/* Sleek expandable tooltip when hovered */}
        {(isHovered || !isDocked) && !isDragging && (
          <div 
            className={`absolute ${
              dockSide === 'right' ? 'right-full mr-2.5' : 'left-full ml-2.5'
            } hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0D1017]/95 border border-[#00A3FF]/40 shadow-xl backdrop-blur-md whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-white">دعم تليجرام 24/7</span>
            <span className="text-[10px] text-sky-400 font-mono">@ameliaadsvip</span>
          </div>
        )}

        {/* Circular Floating Button with High-Resolution Blonde Customer Support Avatar */}
        <div 
          className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-full p-[2px] bg-gradient-to-tr from-[#0088cc] via-[#00c6ff] to-[#FF6B00] shadow-[0_4px_22px_rgba(0,198,255,0.45)] transition-all duration-300 ${
            isDocked && !isHovered && !isDragging 
              ? 'opacity-75 hover:opacity-100 scale-95' 
              : 'opacity-100 scale-100'
          } ${isDragging ? 'scale-110 shadow-[0_8px_30px_rgba(0,198,255,0.7)] ring-2 ring-[#00c6ff]' : ''}`}
        >
          {/* Inner Circle Content: High-Resolution Blonde Support Avatar */}
          <div className="w-full h-full rounded-full bg-[#09101d] flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-200">
            {/* Real High-Resolution Blonde Customer Support Representative */}
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop"
              alt="VIP Customer Support"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center select-none pointer-events-none rounded-full"
              onError={(e) => {
                // Reliable high-res backup blonde corporate support photo
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=256&auto=format&fit=crop";
              }}
            />

            {/* Subtle soft dark vignette on bottom edge for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none rounded-full" />

            {/* Micro Telegram Plane Icon in bottom corner */}
            <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-[#0088cc] border border-white flex items-center justify-center text-white shadow-xs pointer-events-none z-10">
              <Send className="w-2.5 h-2.5 -translate-x-[0.5px] translate-y-[0.5px]" />
            </div>

            {/* Live Ripple Effect */}
            <div className="absolute inset-0 rounded-full border border-sky-400/35 animate-ping pointer-events-none opacity-30" />
          </div>

          {/* Live Online Indicator (Top Right) */}
          <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#09101d] shadow-[0_0_10px_rgba(52,211,153,0.95)] animate-pulse z-20" />
        </div>

        {/* Subtle Edge Peek Indicator when docked */}
        {isDocked && !isHovered && !isDragging && (
          <div 
            className={`absolute top-1/2 -translate-y-1/2 ${
              dockSide === 'right' ? '-left-1' : '-right-1'
            } w-1.5 h-6 rounded-full bg-[#00c6ff] shadow-[0_0_8px_#00c6ff] animate-pulse`} 
          />
        )}
      </div>
    </div>
  );
};
