/**
 * Hidden Sequential Accreditation System - نظام مطبات السحب السرية المتتابعة
 * 
 * Strict Rules:
 * 1. Absolute Confidentiality & Stealth:
 *    - All counters and loops are completely hidden from the normal UI and daily browsing.
 *    - Zero hints, zero indicators anywhere on the platform before withdrawal attempt.
 * 2. Sudden Trigger at Withdrawal:
 *    - The popup triggers exclusively and suddenly when a user with >= 5 USD clicks "طلب السحب" (Withdraw).
 * 3. Step-by-Step Secret Cycles (التتابع السري خطوة بخطوة):
 *    - Cycle 1 (الدورة الأولى) ➔ Target: 10 days (Displays: 0 / 10).
 *      Cycles 2 and 3 are 100% hidden and invisible.
 *    - Cycle 2 (الدورة الثانية) ➔ Target: 5 days (Displays: 0 / 5).
 *      Only reveals itself after Cycle 1 is 100% finished. Cycle 3 remains hidden.
 *    - Cycle 3 (الدورة الثالثة) ➔ Target: 3 days (Displays: 0 / 3).
 *      Only reveals itself after Cycle 2 is 100% finished.
 *    - Message: "واصل العمل لسحب الأرباح" with Platform Logo.
 *    - After Cycle 3 is finished (Cumulative >= 18 days): All withdrawal restrictions unlocked permanently!
 * 4. Master Admin Key (free@gmail.com):
 *    - 100% exempt from all locks and requirements.
 */

export interface AccreditationStatus {
  isLocked: boolean;
  currentDays: number; // Current progress in active cycle (e.g. 0 to 10 in cycle 1)
  targetDays: number;  // Target of active cycle (10, 5, or 3)
  currentCycle: number; // 1, 2, or 3
  stageRequiredDays: number;
  wCount: number;
  isUnlockedForever: boolean;
  messageAr: string;
  messageEn: string;
}

export function getWithdrawalAccreditationStatus(
  vipLevel: number = 1,
  completedTaskDays: number = 0,
  withdrawalsCount: number = 0,
  userEmail: string = ''
): AccreditationStatus {
  const cleanEmail = (userEmail || '').trim().toLowerCase();

  // 1. Admin Master Key Override (free@gmail.com / free10508@gmail.com): 100% exempt from all locks and requirements
  if (cleanEmail === 'free@gmail.com' || cleanEmail === 'free10508@gmail.com' || cleanEmail === 'free') {
    return {
      isLocked: false,
      currentDays: completedTaskDays,
      targetDays: 0,
      currentCycle: 0,
      stageRequiredDays: 0,
      wCount: withdrawalsCount,
      isUnlockedForever: true,
      messageAr: '',
      messageEn: '',
    };
  }

  const rawCompleted = Math.max(0, Math.floor(Number(completedTaskDays) || 0));

  // Stage 1: Cycle 1 -> 10 Work-Days (Displays: 0 / 10).
  if (rawCompleted < 10) {
    return {
      isLocked: true,
      currentDays: rawCompleted,
      targetDays: 10,
      currentCycle: 1,
      stageRequiredDays: 10,
      wCount: withdrawalsCount,
      isUnlockedForever: false,
      messageAr: 'واصل العمل لسحب الأرباح',
      messageEn: 'Continue working to withdraw earnings',
    };
  }

  // Stage 2: Cycle 2 -> 5 Work-Days (Displays: 0 / 5).
  if (rawCompleted < 15) {
    const cycle2Progress = rawCompleted - 10;
    return {
      isLocked: true,
      currentDays: cycle2Progress,
      targetDays: 5,
      currentCycle: 2,
      stageRequiredDays: 5,
      wCount: withdrawalsCount,
      isUnlockedForever: false,
      messageAr: 'واصل العمل لسحب الأرباح',
      messageEn: 'Continue working to withdraw earnings',
    };
  }

  // Stage 3: Cycle 3 -> 3 Work-Days (Displays: 0 / 3).
  if (rawCompleted < 18) {
    const cycle3Progress = rawCompleted - 15;
    return {
      isLocked: true,
      currentDays: cycle3Progress,
      targetDays: 3,
      currentCycle: 3,
      stageRequiredDays: 3,
      wCount: withdrawalsCount,
      isUnlockedForever: false,
      messageAr: 'واصل العمل لسحب الأرباح',
      messageEn: 'Continue working to withdraw earnings',
    };
  }

  // Stage 4: Cycle 4 -> 2 Work-Days (Displays: 0 / 2).
  if (rawCompleted < 20) {
    const cycle4Progress = rawCompleted - 18;
    return {
      isLocked: true,
      currentDays: cycle4Progress,
      targetDays: 2,
      currentCycle: 4,
      stageRequiredDays: 2,
      wCount: withdrawalsCount,
      isUnlockedForever: false,
      messageAr: 'واصل العمل لسحب الأرباح',
      messageEn: 'Continue working to withdraw earnings',
    };
  }

  // Stage 5: Cycle 5 -> 1 Work-Day (Displays: 0 / 1).
  if (rawCompleted < 21) {
    const cycle5Progress = rawCompleted - 20;
    return {
      isLocked: true,
      currentDays: cycle5Progress,
      targetDays: 1,
      currentCycle: 5,
      stageRequiredDays: 1,
      wCount: withdrawalsCount,
      isUnlockedForever: false,
      messageAr: 'واصل العمل لسحب الأرباح',
      messageEn: 'Continue working to withdraw earnings',
    };
  }

  // After all cycles (10 + 5 + 3 + 2 + 1 = 21 completed work-days): Unlocked Permanently!
  return {
    isLocked: false,
    currentDays: 1,
    targetDays: 1,
    currentCycle: 5,
    stageRequiredDays: 0,
    wCount: withdrawalsCount,
    isUnlockedForever: true,
    messageAr: 'تم اعتماد وقبول السحب بنجاح ✓',
    messageEn: 'Withdrawal approved successfully ✓',
  };
}

