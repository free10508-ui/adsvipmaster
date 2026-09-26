import React, { useState, useRef, useEffect } from 'react';
import { 
  ExternalLink, 
  ChevronRight, 
  ChevronLeft, 
  Gift
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, Keyboard } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Swiper CSS styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import { useLanguage } from '../context/LanguageContext';
import { PLATFORM_AD_BANNERS } from '../data/adBannersData';
import { DIRECT_AD_URL } from '../data/initialData';
import { soundEngine } from '../utils/audio';
import { CachedImage } from './CachedImage';
import { imageCache } from '../utils/imageCache';

interface AdBannersCarouselProps {
  onActionClick?: () => void;
  className?: string;
}

export const AdBannersCarousel: React.FC<AdBannersCarouselProps> = ({ 
  onActionClick,
  className = '' 
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    const urls = PLATFORM_AD_BANNERS.map((b) => b.imageUrl).filter(Boolean);
    imageCache.preloadStaticImages(urls);
  }, []);

  const handleOpenAd = (targetUrl: string = DIRECT_AD_URL) => {
    soundEngine.playClick();
    if (onActionClick) onActionClick();
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playClick();
    swiperRef.current?.slidePrev();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playClick();
    swiperRef.current?.slideNext();
  };

  return (
    <section 
      id="top-ad-banners-slider-section"
      className={`w-full relative select-none ${className}`}
      aria-label="Promotional Advertising Banners"
    >
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.6)] bg-[#07080C] group">
        
        {/* Main Swiper Carousel Container */}
        <Swiper
          modules={[Autoplay, Pagination, Navigation, Keyboard]}
          spaceBetween={12}
          slidesPerView={1}
          loop={true}
          speed={650}
          grabCursor={true}
          keyboard={{ enabled: true }}
          autoplay={{
            delay: 4500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          dir={isArabic ? 'rtl' : 'ltr'}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={(swiper) => {
            setActiveIndex(swiper.realIndex);
          }}
          className="w-full h-[235px] xs:h-[245px] sm:h-[265px] md:h-[290px] lg:h-[310px]"
        >
          {PLATFORM_AD_BANNERS.map((banner, index) => {
            const title = isArabic ? banner.titleAr : banner.title;
            const badge = isArabic ? banner.badgeAr : banner.badge;
            const ctaText = isArabic ? banner.ctaTextAr : banner.ctaText;

            return (
              <SwiperSlide key={banner.id || index} className="w-full h-full">
                <div 
                  onClick={() => handleOpenAd(banner.targetUrl)}
                  className="w-full h-full relative flex flex-col justify-between cursor-pointer overflow-hidden group/slide"
                >
                  {/* 1. Pristine 4K Ultra-HD Banner Image (No heavy overlays in center) */}
                  <div className="absolute inset-0 z-0">
                    <CachedImage 
                      src={banner.imageUrl} 
                      alt={title}
                      className="w-full h-full object-cover object-center filter brightness-100 contrast-110 scale-100 group-hover/slide:scale-102 transition-transform duration-1000 ease-out"
                    />
                    
                    {/* Subtle micro-gradient only at the very top for badge readability */}
                    <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />
                    
                    {/* Subtle micro-gradient only at bottom behind the glass bar */}
                    <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none z-10" />
                  </div>

                  {/* 2. Top Sleek Micro Badges (Keeps main visual area 100% open) */}
                  <div className="relative z-20 p-2 sm:p-2.5 flex items-center justify-between gap-2 pointer-events-none">
                    <div className="flex items-center gap-1.5">
                      <span 
                        className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-tight backdrop-blur-md shadow-sm pointer-events-auto border"
                        style={{ 
                          backgroundColor: `${banner.accentColor}25`,
                          color: '#FFFFFF',
                          borderColor: `${banner.accentColor}50`
                        }}
                      >
                        {badge}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-gray-300 text-[9px] sm:text-[10px] font-medium border border-white/10 hidden xs:inline-block">
                        {banner.sponsor}
                      </span>
                    </div>

                    {banner.rewardBonusUSDT && (
                      <div className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[9px] sm:text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm">
                        <Gift className="w-2.5 h-2.5 text-emerald-400" />
                        <span>+{banner.rewardBonusUSDT.toFixed(2)} USDT</span>
                      </div>
                    )}
                  </div>

                  {/* 3. Sleek Frosted Bottom Bar (Separated from image, no overlapping mess) */}
                  <div className="relative z-20 mt-auto bg-black/55 backdrop-blur-md border-t border-white/10 px-3.5 sm:px-5 py-2.5 flex items-center justify-between gap-3">
                    
                    {/* Left/Right Text Details: Clean single-line title */}
                    <div className="min-w-0 flex-1 pe-2">
                      <h3 className="text-xs sm:text-sm md:text-base font-bold text-white truncate tracking-tight drop-shadow-sm">
                        {title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-gray-300 truncate hidden xs:block mt-0.5">
                        {isArabic ? banner.subtitleAr : banner.subtitle}
                      </p>
                    </div>

                    {/* Compact CTA Action Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        id={`banner-cta-${banner.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAd(banner.targetUrl);
                        }}
                        className="px-3 sm:px-4 py-1.5 rounded-xl font-bold text-[11px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-md hover:scale-105 active:scale-95 text-black"
                        style={{
                          backgroundColor: banner.accentColor,
                          boxShadow: `0 2px 10px ${banner.accentColor}40`
                        }}
                      >
                        <span>{ctaText}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                  </div>

                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* 4. Refined, Discreet, Semi-Transparent Micro Navigation Controls */}
        <div 
          className="absolute top-2.5 end-2.5 z-30 flex items-center gap-1 bg-black/45 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10 shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Micro Previous Arrow */}
          <button
            id="ad-slider-prev-btn"
            type="button"
            onClick={handlePrev}
            className="w-4 h-4 rounded-full hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Previous Slide"
          >
            {isArabic ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>

          {/* Micro Minimalist Dots */}
          <div className="flex items-center gap-1 px-0.5">
            {PLATFORM_AD_BANNERS.map((banner, i) => (
              <button
                key={i}
                type="button"
                onClick={() => swiperRef.current?.slideToLoop(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                  activeIndex === i
                    ? 'w-3 shadow-sm'
                    : 'w-1 bg-white/30 hover:bg-white/60'
                }`}
                style={{
                  backgroundColor: activeIndex === i ? banner.accentColor : undefined
                }}
              />
            ))}
          </div>

          {/* Micro Next Arrow */}
          <button
            id="ad-slider-next-btn"
            type="button"
            onClick={handleNext}
            className="w-4 h-4 rounded-full hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Next Slide"
          >
            {isArabic ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        </div>

      </div>
    </section>
  );
};
