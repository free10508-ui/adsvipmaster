import confetti from 'canvas-confetti';

/**
 * Dynamic Confetti Celebration Engine
 * Tailored intensities based on task reward amounts, referral bonuses,
 * milestones, and screen-wide VIP upgrade celebrations.
 */

// Luxury Cyber Theme Color Palettes
const PALETTES = {
  // Classic Neon Orange + Gold + Cyan + Emerald
  standard: ['#FF6B00', '#FBBF24', '#00A3FF', '#10B981', '#FFFFFF'],
  // High-value Gold & Amber Luxury
  luxuryGold: ['#FFD700', '#FFA500', '#FF6B00', '#F59E0B', '#FFFBEB'],
  // Cyber Holographic (VIP & Milestones)
  cyberRoyal: ['#FF6B00', '#F59E0B', '#00A3FF', '#A855F7', '#EC4899', '#10B981'],
  // Emerald Wealth
  emeraldGreen: ['#10B981', '#34D399', '#059669', '#FBBF24', '#00A3FF'],
};

/**
 * Trigger dynamic confetti for task completion based on the reward amount.
 * - Minor Tasks (e.g. <= 0.20 USDT like standard 0.09 USDT task): Small, focused burst.
 * - Medium Tasks (e.g. 0.20 - 2.00 USDT): Double-angled burst.
 * - High-Value Tasks (e.g. > 2.00 USDT): Tri-burst with stars and vibrant spread.
 */
export function triggerTaskConfetti(
  rewardAmount: number,
  customOrigin?: { x: number; y: number }
) {
  try {
    const origin = customOrigin || { x: 0.5, y: 0.68 };

    if (rewardAmount <= 0.20) {
      // 1. MINOR TASK BURST: Focused, quick, and satisfying (e.g., 0.09 USDT task)
      confetti({
        particleCount: 35,
        spread: 50,
        startVelocity: 26,
        decay: 0.92,
        ticks: 110,
        gravity: 1.1,
        origin,
        colors: PALETTES.standard,
        shapes: ['circle', 'square'],
        scalar: 0.85,
        zIndex: 9999,
      });
    } else if (rewardAmount <= 2.00) {
      // 2. MEDIUM TASK BURST: Double side-cannon bloom
      confetti({
        particleCount: 45,
        angle: 60,
        spread: 60,
        startVelocity: 32,
        decay: 0.91,
        ticks: 140,
        origin: { x: Math.max(0.1, origin.x - 0.2), y: origin.y },
        colors: PALETTES.cyberRoyal,
        shapes: ['circle', 'square'],
        scalar: 0.95,
        zIndex: 9999,
      });

      confetti({
        particleCount: 45,
        angle: 120,
        spread: 60,
        startVelocity: 32,
        decay: 0.91,
        ticks: 140,
        origin: { x: Math.min(0.9, origin.x + 0.2), y: origin.y },
        colors: PALETTES.cyberRoyal,
        shapes: ['circle', 'square'],
        scalar: 0.95,
        zIndex: 9999,
      });
    } else {
      // 3. MAJOR HIGH-TIER TASK BURST: Center bloom + dual angled fireworks
      confetti({
        particleCount: 75,
        spread: 80,
        startVelocity: 38,
        origin,
        colors: PALETTES.luxuryGold,
        shapes: ['circle', 'star', 'square'],
        scalar: 1.1,
        zIndex: 9999,
      });

      setTimeout(() => {
        try {
          confetti({
            particleCount: 40,
            angle: 90,
            spread: 110,
            startVelocity: 30,
            origin: { x: 0.5, y: 0.55 },
            colors: PALETTES.cyberRoyal,
            shapes: ['star', 'circle'],
            zIndex: 9999,
          });
        } catch {
          // Ignore fallback
        }
      }, 180);
    }
  } catch {
    // Confetti fallback safely ignored
  }
}

/**
 * Trigger multi-stage Milestone celebration.
 * Screen-spanning multi-burst with stars and gold showers lasting ~2.5s.
 */
export function triggerMilestoneConfetti(rewardAmount: number = 5.0) {
  try {
    // Stage 1: Left & Right energetic cannon launch
    confetti({
      particleCount: 70,
      angle: 60,
      spread: 75,
      startVelocity: 45,
      origin: { x: 0.08, y: 0.75 },
      colors: PALETTES.cyberRoyal,
      shapes: ['star', 'circle', 'square'],
      scalar: 1.05,
      zIndex: 99999,
    });

    confetti({
      particleCount: 70,
      angle: 120,
      spread: 75,
      startVelocity: 45,
      origin: { x: 0.92, y: 0.75 },
      colors: PALETTES.cyberRoyal,
      shapes: ['star', 'circle', 'square'],
      scalar: 1.05,
      zIndex: 99999,
    });

    // Stage 2: Central golden star burst at 350ms
    setTimeout(() => {
      try {
        confetti({
          particleCount: 90,
          spread: 100,
          startVelocity: 36,
          origin: { x: 0.5, y: 0.45 },
          colors: PALETTES.luxuryGold,
          shapes: ['star', 'circle'],
          scalar: 1.2,
          zIndex: 99999,
        });
      } catch {}
    }, 350);

    // Stage 3: Cascading shimmer at 800ms
    setTimeout(() => {
      try {
        confetti({
          particleCount: 60,
          spread: 120,
          startVelocity: 25,
          gravity: 0.8,
          decay: 0.93,
          origin: { x: 0.5, y: 0.25 },
          colors: PALETTES.standard,
          shapes: ['circle'],
          scalar: 0.9,
          zIndex: 99999,
        });
      } catch {}
    }, 800);
  } catch {}
}

/**
 * Confetti disabled for VIP upgrades to maintain a calm, natural, and premium executive UX.
 */
export function triggerVIPUpgradeConfetti(_vipLevel: number = 1, _planName: string = 'VIP') {
  // Completely disabled as requested: calm, professional, non-distracting UI
  return;
}

/**
 * Trigger referral invite / commission celebration
 */
export function triggerReferralBonusConfetti(bonusAmount: number = 1.0) {
  try {
    const isBigBonus = bonusAmount >= 5.0;

    confetti({
      particleCount: isBigBonus ? 85 : 50,
      spread: isBigBonus ? 85 : 60,
      startVelocity: isBigBonus ? 38 : 28,
      origin: { x: 0.5, y: 0.62 },
      colors: PALETTES.emeraldGreen,
      shapes: ['circle', 'square', 'star'],
      scalar: 1.0,
      zIndex: 9999,
    });

    if (isBigBonus) {
      setTimeout(() => {
        try {
          confetti({
            particleCount: 45,
            spread: 110,
            startVelocity: 30,
            origin: { x: 0.5, y: 0.45 },
            colors: PALETTES.luxuryGold,
            shapes: ['star'],
            zIndex: 9999,
          });
        } catch {}
      }, 250);
    }
  } catch {}
}
