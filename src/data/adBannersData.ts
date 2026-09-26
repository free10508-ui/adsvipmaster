import { AdBanner } from '../types';
import { DIRECT_AD_URL } from './initialData';

export const PLATFORM_AD_BANNERS: AdBanner[] = [
  {
    id: 'ad-banner-1',
    title: 'Avengers: Endgame (2019) - The Ultimate Superhero Ensemble',
    titleAr: 'المنتقمون: نهاية اللعبة (2019) - التحالف الأسطوري للأبطال',
    subtitle: 'Marvel Studios largest blockbuster uniting Hollywood superstars in Ultra-HD 4K',
    subtitleAr: 'أضخم تجمع لنجوم هوليوود وأبطال مارفل في تاريخ السينما لإنقاذ الكون بجودة 4K',
    badge: 'Superheroes ⚡',
    badgeAr: 'ملحمة الأبطال الخارقين ⚡',
    sponsor: 'Marvel Studios',
    imageUrl: 'https://image.tmdb.org/t/p/w780/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
    targetUrl: DIRECT_AD_URL,
    ctaText: 'Watch Trailer',
    ctaTextAr: 'مشاهدة العرض',
    rewardBonusUSDT: 0.35,
    category: 'exchange',
    accentColor: '#EF4444'
  },
  {
    id: 'ad-banner-2',
    title: 'Dune: Part Two (2024) - Cosmic Sci-Fi Masterpiece',
    titleAr: 'كثبان الجزء الثاني (2024) - أعظم ملحمة خيال علمي بصرية',
    subtitle: 'Denis Villeneuve visual epic across the sands of Arrakis in Ultra-HD',
    subtitleAr: 'تحفة دينيس فيلنوف البصرية وصحراء أراكيس بدقة فائقة الجودة من Warner Bros',
    badge: 'Sci-Fi 4K 🪐',
    badgeAr: 'خيال علمي 4K 🪐',
    sponsor: 'Warner Bros. Pictures',
    imageUrl: 'https://image.tmdb.org/t/p/w780/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
    targetUrl: DIRECT_AD_URL,
    ctaText: 'Watch Trailer',
    ctaTextAr: 'مشاهدة العرض',
    rewardBonusUSDT: 0.30,
    category: 'bot',
    accentColor: '#FF6B00'
  },
  {
    id: 'ad-banner-3',
    title: 'Avatar: The Way of Water - Pandora 4K Ocean Odyssey',
    titleAr: 'أفاتار: طريق الماء - أحدث تقنيات المؤثرات بهوليوود',
    subtitle: 'James Cameron groundbreaking visual revolution and underwater 4K grandeur',
    subtitleAr: 'تحفة جيمس كاميرون وأعظم ثورة مؤثرات بصرية في تاريخ السينما الحديثة',
    badge: 'Pandora Worlds 🌊',
    badgeAr: 'عوالم باندورا 🌊',
    sponsor: '20th Century Studios',
    imageUrl: 'https://image.tmdb.org/t/p/w780/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
    targetUrl: DIRECT_AD_URL,
    ctaText: 'Watch Trailer',
    ctaTextAr: 'مشاهدة العرض',
    rewardBonusUSDT: 0.25,
    category: 'defi',
    accentColor: '#00A3FF'
  },
  {
    id: 'ad-banner-4',
    title: 'Spider-Man: No Way Home (2021) - Multiverse Cinema Epic',
    titleAr: 'سبايدرمان: لا عودة إلى الديار (2021) - ملحمة الأكوان السينمائية 4K',
    subtitle: 'Marvel & Sony record-shattering blockbuster uniting iconic stars in pristine Ultra-HD',
    subtitleAr: 'تحفة مارفل وسوني السينمائية التي جمعت أساطير السينما في أضخم مواجهة بدقة فائقة',
    badge: 'Multiverse 🕸️',
    badgeAr: 'ملحمة الأكوان 🕸️',
    sponsor: 'Sony Pictures & Marvel',
    imageUrl: 'https://image.tmdb.org/t/p/w780/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
    targetUrl: DIRECT_AD_URL,
    ctaText: 'Watch Trailer',
    ctaTextAr: 'مشاهدة العرض',
    rewardBonusUSDT: 0.20,
    category: 'crypto_card',
    accentColor: '#6366F1'
  },
  {
    id: 'ad-banner-5',
    title: 'Fast X (2023) - The Legendary Action Family Ensemble',
    titleAr: 'فاست آند فيوريوس 10 (2023) - أضخم اجتماع لنجوم الأكشن والإثارة',
    subtitle: 'Universal Pictures all-star action ensemble cast across global streets in 4K',
    subtitleAr: 'طاقم العائلة الأسطوري وفريق السرعة والمطاردات بدقة 4K من Universal Pictures',
    badge: 'Fast Family 🏎️',
    badgeAr: 'عائلة فاست آند فيوريوس 🏎️',
    sponsor: 'Universal Pictures',
    imageUrl: 'https://image.tmdb.org/t/p/w780/fiVW06jE7z9YnO4trhaMEdclSiC.jpg',
    targetUrl: DIRECT_AD_URL,
    ctaText: 'Watch Trailer',
    ctaTextAr: 'مشاهدة العرض',
    rewardBonusUSDT: 0.40,
    category: 'vip_boost',
    accentColor: '#F59E0B'
  }
];

export const LIVE_CRYPTO_TICKERS = [
  { symbol: 'BTC/USDT', price: '89,450.20', change: '+3.42%', up: true },
  { symbol: 'ETH/USDT', price: '3,280.75', change: '+2.85%', up: true },
  { symbol: 'USDT/USD', price: '1.0001', change: '+0.01%', up: true },
  { symbol: 'SOL/USDT', price: '194.30', change: '+5.12%', up: true },
  { symbol: 'TRX/USDT', price: '0.2450', change: '+1.94%', up: true },
  { symbol: 'BNB/USDT', price: '645.10', change: '+2.10%', up: true },
  { symbol: 'TON/USDT', price: '5.82', change: '+4.30%', up: true },
];

export const LIVE_PLATFORM_STATS = {
  totalPaidTodayUSDT: '148,920.50',
  activeAdViewers: '24,819',
  completedTasks24h: '392,410',
  partnerBrandsCount: '48+',
};
