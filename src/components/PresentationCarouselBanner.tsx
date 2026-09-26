import React, { useRef, useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  ArrowUpRight
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Keyboard } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Swiper CSS styles
import 'swiper/css';
import 'swiper/css/navigation';

import { soundEngine } from '../utils/audio';
import { CachedImage } from './CachedImage';
import { imageCache } from '../utils/imageCache';

interface PresentationCarouselBannerProps {
  onActionClick?: () => void;
  className?: string;
}

export interface BannerSlide {
  id: number;
  slideNumber: string;
  badge: string;
  badgeColor: string;
  accentColor: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
}

export const BANNER_SLIDES_11: BannerSlide[] = [
  {
    id: 1,
    slideNumber: '01 / 05',
    badge: 'ملحمة الأبطال ⚡',
    badgeColor: 'bg-red-500/80 text-white border-red-500/40',
    accentColor: '#EF4444',
    title: 'Avengers: Endgame (2019) - المنتقمون نهاية اللعبة والتحالف الأسطوري للأبطال',
    subtitle: 'أضخم تجمع لنجوم هوليوود وأبطال مارفل في تاريخ السينما لإنقاذ الكون بجودة 4K',
    imageUrl: 'https://image.tmdb.org/t/p/w780/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
    ctaText: 'مشاهدة العرض'
  },
  {
    id: 2,
    slideNumber: '02 / 05',
    badge: 'خيال علمي 🪐',
    badgeColor: 'bg-orange-500/80 text-white border-orange-500/40',
    accentColor: '#FF6B00',
    title: 'Dune: Part Two (2024) - كثبان الجزء الثاني وأعظم ملحمة بصرية فضائية',
    subtitle: 'تحفة دينيس فيلنوف البصرية وصحراء أراكيس بدقة فائقة الجودة من Warner Bros',
    imageUrl: 'https://image.tmdb.org/t/p/w780/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
    ctaText: 'مشاهدة العرض'
  },
  {
    id: 3,
    slideNumber: '03 / 05',
    badge: 'عوالم باندورا 🌊',
    badgeColor: 'bg-cyan-500/80 text-white border-cyan-500/40',
    accentColor: '#06B6D4',
    title: 'Avatar: The Way of Water - أفاتار طريق الماء والتقنية الأحدث بهوليوود',
    subtitle: 'تحفة جيمس كاميرون وأعظم ثورة مؤثرات بصرية في تاريخ السينما الحديثة',
    imageUrl: 'https://image.tmdb.org/t/p/w780/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
    ctaText: 'مشاهدة العرض'
  },
  {
    id: 4,
    slideNumber: '04 / 05',
    badge: 'ملحمة الأكوان 🕸️',
    badgeColor: 'bg-indigo-600/80 text-white border-indigo-500/40',
    accentColor: '#6366F1',
    title: 'Spider-Man: No Way Home (2021) - سبايدرمان لا عودة إلى الديار في ملحمة الأكوان 4K',
    subtitle: 'تحفة مارفل وسوني السينمائية التي جمعت أساطير السينما في أضخم مواجهة بدقة فائقة',
    imageUrl: 'https://image.tmdb.org/t/p/w780/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
    ctaText: 'مشاهدة العرض'
  },
  {
    id: 5,
    slideNumber: '05 / 05',
    badge: 'فاست آند فيوريوس 🏎️',
    badgeColor: 'bg-amber-500/80 text-white border-amber-500/40',
    accentColor: '#F59E0B',
    title: 'Fast X (2023) - فاست آند فيوريوس 10 وأضخم اجتماع لنجوم الأكشن والإثارة',
    subtitle: 'طاقم العائلة الأسطوري وفريق السرعة والمطاردات بدقة 4K من Universal Pictures',
    imageUrl: 'https://image.tmdb.org/t/p/w780/fiVW06jE7z9YnO4trhaMEdclSiC.jpg',
    ctaText: 'مشاهدة العرض'
  },
];

export const PresentationCarouselBanner: React.FC<PresentationCarouselBannerProps> = ({
  onActionClick,
  className = '',
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  // Pre-cache all slide images once on mount in browser CacheStorage
  useEffect(() => {
    const urls = BANNER_SLIDES_11.map((s) => s.imageUrl).filter(Boolean);
    imageCache.preloadStaticImages(urls);
  }, []);

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

  const handleSlideClick = () => {
    soundEngine.playClick();
    if (onActionClick) onActionClick();
  };

  return (
    <div 
      id="presentation-autoplay-carousel"
      className={`w-full select-none ${className}`}
      dir="rtl"
    >
      <div className="relative w-full h-[225px] xs:h-[240px] sm:h-[260px] md:h-[280px] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.6)] bg-[#07090E] group">
        
        {/* Continuous Smooth Hardware-Accelerated Swiper Slide Transition */}
        <Swiper
          modules={[Autoplay, Navigation, Keyboard]}
          spaceBetween={0}
          slidesPerView={1}
          loop={true}
          speed={600}
          grabCursor={true}
          keyboard={{ enabled: true }}
          autoplay={{
            delay: 3800,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          dir="rtl"
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={(swiper) => {
            setActiveIndex(swiper.realIndex);
          }}
          className="w-full h-full"
        >
          {BANNER_SLIDES_11.map((slide) => (
            <SwiperSlide key={slide.id} className="w-full h-full">
              <div 
                onClick={handleSlideClick}
                className="w-full h-full relative flex flex-col justify-between cursor-pointer overflow-hidden group/slide"
              >
                {/* 1. Full 4K Background Image: Hardware accelerated, strictly non-flicker */}
                <div className="absolute inset-0 z-0">
                  <CachedImage 
                    src={slide.imageUrl} 
                    alt={slide.title}
                    className="w-full h-full object-cover object-center filter brightness-100 contrast-105 transform scale-100 group-hover/slide:scale-103 transition-transform duration-1000 ease-out will-change-transform"
                  />

                  {/* Micro subtle gradients only for text legibility without blocking artwork */}
                  <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-black/55 to-transparent pointer-events-none z-10" />
                  <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none z-10" />
                </div>

                {/* 2. Micro Mini Badge at Top Start (Super compact & discreet) */}
                <div className="relative z-20 p-2.5 sm:p-3 flex items-center justify-start pointer-events-none">
                  <span 
                    className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-tight shadow-sm backdrop-blur-md border ${slide.badgeColor}`}
                  >
                    {slide.badge}
                  </span>
                </div>

                {/* 3. Bottom Glass Bar with Title and Action CTA */}
                <div className="relative z-20 mt-auto bg-black/60 backdrop-blur-md border-t border-white/10 px-3 sm:px-4 py-2 flex items-center justify-between gap-2.5">
                  <div className="min-w-0 flex-1 pe-1">
                    <h3 className="text-[11px] xs:text-xs sm:text-sm font-bold text-white truncate tracking-tight drop-shadow-sm">
                      {slide.title}
                    </h3>
                    <p className="text-[9px] sm:text-[11px] text-gray-300 truncate hidden xs:block mt-0.5 font-normal">
                      {slide.subtitle}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px] sm:text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all">
                    <span>{slide.ctaText}</span>
                    <ArrowUpRight className="w-3 h-3 text-black stroke-[2.5]" />
                  </div>
                </div>

              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* 4. Shrunk, Micro-Sized Floating Navigation Controls (Arrows + Dots + Counter) */}
        <div 
          className="absolute top-2.5 start-auto end-2.5 z-30 flex items-center gap-1 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10 shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Micro Previous Arrow */}
          <button
            id="carousel-prev-btn"
            type="button"
            onClick={handlePrev}
            className="w-4 h-4 rounded-full hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronRight className="w-3 h-3" />
          </button>

          {/* Micro Minimalist Dots */}
          <div className="flex items-center gap-1 px-0.5">
            {BANNER_SLIDES_11.map((slide, i) => (
              <button
                key={i}
                type="button"
                onClick={() => swiperRef.current?.slideToLoop(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                  activeIndex === i
                    ? 'w-3 bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                    : 'w-1 bg-white/35 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          {/* Micro Next Arrow */}
          <button
            id="carousel-next-btn"
            type="button"
            onClick={handleNext}
            className="w-4 h-4 rounded-full hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Next Slide"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>

          {/* Micro Counter Indicator */}
          <span className="text-[9px] font-mono text-gray-300 ps-1 pe-0.5 font-bold border-s border-white/15">
            {activeIndex + 1}/{BANNER_SLIDES_11.length}
          </span>
        </div>

      </div>
    </div>
  );
};
