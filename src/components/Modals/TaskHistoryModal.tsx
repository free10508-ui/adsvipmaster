import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  Coins, 
  Award, 
  Play, 
  Clock, 
  Sparkles, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  BarChart3,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { CompletedTaskLog } from '../../types';
import { storage } from '../../utils/storage';
import { formatUSDT } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import { soundEngine } from '../../utils/audio';

interface TaskHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  vipLevel?: number;
}

interface DaySummary {
  dateKey: string;
  displayDateAr: string;
  displayDateEn: string;
  dayNameAr: string;
  dayNameEn: string;
  isToday: boolean;
  isYesterday: boolean;
  tasksCount: number;
  totalEarnings: number;
  logs: CompletedTaskLog[];
  sponsorsCount: Record<string, { count: number; earnings: number }>;
}

export const TaskHistoryModal: React.FC<TaskHistoryModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  vipLevel = 1,
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const [logs, setLogs] = useState<CompletedTaskLog[]>([]);
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all'); // 'all' or specific dateKey

  // Refresh logs when opening
  useEffect(() => {
    if (isOpen) {
      const email = (userEmail || storage.getCurrentUserEmail() || '').trim().toLowerCase();
      const userLogs = storage.getCompletedTaskLogs(email);
      setLogs(userLogs);
    }
  }, [isOpen, userEmail]);

  // Listen for real-time changes
  useEffect(() => {
    const handleUpdate = () => {
      const email = (userEmail || storage.getCurrentUserEmail() || '').trim().toLowerCase();
      setLogs(storage.getCompletedTaskLogs(email));
    };
    window.addEventListener('vipads:task_history_updated', handleUpdate);
    return () => window.removeEventListener('vipads:task_history_updated', handleUpdate);
  }, [userEmail]);

  // Aggregate the past 7 days breakdown
  const { days, total7DaysEarnings, total7DaysTasks, avgDailyEarnings, sponsorBreakdown } = useMemo(() => {
    const today = new Date();
    const dayMap = new Map<string, DaySummary>();
    const sponsorMap: Record<string, { count: number; earnings: number }> = {};

    // Build slots for exactly the last 7 calendar days
    for (let i = 0; i < 7; i++) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const dayIdx = d.getDay();
      const monthIdx = d.getMonth();

      dayMap.set(dateKey, {
        dateKey,
        displayDateAr: `${d.getDate()} ${monthNamesAr[monthIdx]}`,
        displayDateEn: `${monthNamesEn[monthIdx]} ${d.getDate()}`,
        dayNameAr: i === 0 ? 'اليوم' : i === 1 ? 'أمس' : dayNamesAr[dayIdx],
        dayNameEn: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : dayNamesEn[dayIdx],
        isToday: i === 0,
        isYesterday: i === 1,
        tasksCount: 0,
        totalEarnings: 0,
        logs: [],
        sponsorsCount: {}
      });
    }

    // Distribute logs into days
    logs.forEach(log => {
      const key = log.dateKey || (log.completedAt ? log.completedAt.slice(0, 10) : '');
      if (dayMap.has(key)) {
        const item = dayMap.get(key)!;
        item.tasksCount += 1;
        item.totalEarnings = Number((item.totalEarnings + log.rewardUSDT).toFixed(3));
        item.logs.push(log);

        const sp = log.sponsor || 'Official Sponsor';
        if (!item.sponsorsCount[sp]) {
          item.sponsorsCount[sp] = { count: 0, earnings: 0 };
        }
        item.sponsorsCount[sp].count += 1;
        item.sponsorsCount[sp].earnings = Number((item.sponsorsCount[sp].earnings + log.rewardUSDT).toFixed(3));

        // Global 7-day sponsor breakdown
        if (!sponsorMap[sp]) {
          sponsorMap[sp] = { count: 0, earnings: 0 };
        }
        sponsorMap[sp].count += 1;
        sponsorMap[sp].earnings = Number((sponsorMap[sp].earnings + log.rewardUSDT).toFixed(3));
      }
    });

    const daysList = Array.from(dayMap.values());
    const total7Earnings = Number(daysList.reduce((acc, d) => acc + d.totalEarnings, 0).toFixed(2));
    const total7Tasks = daysList.reduce((acc, d) => acc + d.tasksCount, 0);
    const avgDaily = Number((total7Earnings / 7).toFixed(2));

    // Sort logs descending by completion time within each day
    daysList.forEach(d => {
      d.logs.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    });

    return {
      days: daysList,
      total7DaysEarnings: total7Earnings,
      total7DaysTasks: total7Tasks,
      avgDailyEarnings: avgDaily,
      sponsorBreakdown: Object.entries(sponsorMap).sort((a, b) => b[1].earnings - a[1].earnings)
    };
  }, [logs]);

  // Set today as initially expanded by default
  useEffect(() => {
    if (isOpen && days.length > 0 && !expandedDateKey) {
      setExpandedDateKey(days[0].dateKey);
    }
  }, [isOpen, days, expandedDateKey]);

  if (!isOpen) return null;

  const filteredDays = selectedDayFilter === 'all' 
    ? days 
    : days.filter(d => d.dateKey === selectedDayFilter);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div 
        id="task-history-modal"
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-[20px] sm:rounded-[24px] border border-white/10 shadow-2xl bg-gradient-to-b from-[#111420] via-[#0A0D15] to-[#07090F] text-white overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/4 w-72 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-72 h-32 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-gradient-to-tr from-amber-500/20 to-[#FF6B00]/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {isArabic ? 'سجل المهام (آخر 7 أيام)' : 'Task History (Last 7 Days)'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono">
                  VIP {vipLevel}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                {isArabic ? 'إحصائيات إتمام مشاهدة الإعلانات وتفصيل الأرباح اليومية' : 'Daily completed video ads & comprehensive reward breakdown'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 rounded-[12px] bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer border border-white/10 shrink-0"
            title={isArabic ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-3.5 sm:p-5 overflow-y-auto custom-scrollbar space-y-4 flex-1 relative z-10">
          
          {/* 1. 7-Day Performance Metric Cards (Equally Sized, Bright Illuminated Numbers) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            
            {/* 1. أرباح المهام */}
            <div className="p-2.5 sm:p-3 rounded-[12px] bg-[#0E131F]/85 backdrop-blur-md border border-emerald-500/30 shadow-[0_4px_16px_rgba(0,0,0,0.35)] flex flex-col justify-between text-center min-h-[96px] sm:min-h-[105px]">
              <div className="flex items-center justify-center gap-1 text-emerald-400">
                <Coins className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] sm:text-xs font-bold text-gray-200 leading-tight">
                  {isArabic ? 'أرباح المهام' : 'Tasks Earnings'}
                </span>
              </div>
              <div className="my-1">
                <span className="text-xs sm:text-base font-black font-mono text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.45)] tracking-tight block">
                  +{formatUSDT(total7DaysEarnings)} <span className="text-[10px] text-emerald-300 font-bold">USDT</span>
                </span>
              </div>
              <span className="text-[10px] text-gray-300 block leading-tight">
                {isArabic ? 'مكافآت المهام' : 'Task Rewards'}
              </span>
            </div>

            {/* 2. المشاهدات */}
            <div className="p-2.5 sm:p-3 rounded-[12px] bg-[#0E131F]/85 backdrop-blur-md border border-emerald-500/30 shadow-[0_4px_16px_rgba(0,0,0,0.35)] flex flex-col justify-between text-center min-h-[96px] sm:min-h-[105px]">
              <div className="flex items-center justify-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] sm:text-xs font-bold text-gray-200 leading-tight">
                  {isArabic ? 'المشاهدات' : 'Total Views'}
                </span>
              </div>
              <div className="my-1">
                <span className="text-xs sm:text-base font-black font-mono text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.45)] tracking-tight block">
                  {total7DaysTasks} <span className="text-[10px] text-emerald-300 font-bold">{isArabic ? 'إعلان' : 'ads'}</span>
                </span>
              </div>
              <span className="text-[10px] text-gray-300 block leading-tight">
                {isArabic ? 'مشاهدات ناجحة' : '100% Verified'}
              </span>
            </div>

            {/* 3. المتوسط */}
            <div className="p-2.5 sm:p-3 rounded-[12px] bg-[#0E131F]/85 backdrop-blur-md border border-emerald-500/30 shadow-[0_4px_16px_rgba(0,0,0,0.35)] flex flex-col justify-between text-center min-h-[96px] sm:min-h-[105px]">
              <div className="flex items-center justify-center gap-1 text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] sm:text-xs font-bold text-gray-200 leading-tight">
                  {isArabic ? 'المتوسط' : 'Daily Avg'}
                </span>
              </div>
              <div className="my-1">
                <span className="text-xs sm:text-base font-black font-mono text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.45)] tracking-tight block">
                  +{formatUSDT(avgDailyEarnings)} <span className="text-[10px] text-emerald-300 font-bold">USDT</span>
                </span>
              </div>
              <span className="text-[10px] text-gray-300 block leading-tight">
                {isArabic ? 'متوسط يومي' : 'Per Active Day'}
              </span>
            </div>

          </div>

          {/* 2. Top Sponsors Reward Breakdown Pill Bar */}
          {sponsorBreakdown.length > 0 && (
            <div className="p-3 rounded-[12px] bg-[#0C0F17]/85 backdrop-blur-md border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-200 font-bold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isArabic ? 'توزيع عوائد الرعاة الرسميين' : 'Top Sponsor Yield Breakdown'}</span>
                </span>
                <span className="text-[11px] font-semibold text-gray-300 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                  {sponsorBreakdown.length} {isArabic ? 'جهات راعية' : 'sponsors'}
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {sponsorBreakdown.slice(0, 5).map(([sponsor, stats], idx) => (
                  <div 
                    key={sponsor}
                    className="shrink-0 px-3 py-2 rounded-[12px] bg-[#141824]/90 border border-white/10 flex items-center gap-2.5 text-xs shadow-sm"
                  >
                    <span className="w-5 h-5 rounded-[8px] bg-gradient-to-tr from-amber-500/20 to-[#FF6B00]/20 border border-amber-500/30 flex items-center justify-center font-bold text-[10px] text-amber-400 font-mono shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="leading-tight">
                      <span className="font-bold text-white text-[11px] block truncate max-w-[120px]">
                        {sponsor}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold mt-0.5 block">
                        +{formatUSDT(stats.earnings)} USDT <span className="text-gray-400 font-normal">({stats.count}x)</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Daily Day-by-Day Accordion Breakdown */}
          <div className="space-y-3">
            {/* Clean 2-Row Header to prevent any overlapping on mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-0.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-[8px] bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] shrink-0">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-white">
                  {isArabic ? 'تفاصيل الأيام الـ 7 الأخيرة' : 'Last 7 Days Breakdown'}
                </span>
              </div>

              {/* Pill-shaped filter buttons (الكل، اليوم، أمس) */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedDayFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                    selectedDayFilter === 'all' 
                      ? 'bg-amber-500 text-black border-amber-400 font-black shadow-[0_0_10px_rgba(245,158,11,0.4)]' 
                      : 'bg-[#131722]/90 text-gray-300 border-white/10 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {isArabic ? 'الكل' : 'All'}
                </button>
                {days.slice(0, 4).map(d => (
                  <button
                    key={d.dateKey}
                    type="button"
                    onClick={() => setSelectedDayFilter(d.dateKey)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                      selectedDayFilter === d.dateKey 
                        ? 'bg-amber-500 text-black border-amber-400 font-black shadow-[0_0_10px_rgba(245,158,11,0.4)]' 
                        : 'bg-[#131722]/90 text-gray-300 border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {isArabic ? d.dayNameAr : d.dayNameEn}
                  </button>
                ))}
              </div>
            </div>

            {filteredDays.map((day) => {
              const isExpanded = expandedDateKey === day.dateKey;
              const hasCompleted = day.tasksCount > 0;

              return (
                <div 
                  key={day.dateKey}
                  className={`rounded-[12px] border transition-all overflow-hidden ${
                    day.isToday 
                      ? 'border-[#FF6B00]/40 bg-gradient-to-r from-[#FF6B00]/10 via-[#121520] to-[#0A0D15]' 
                      : 'border-white/10 bg-[#0E111A]/90 hover:border-white/20'
                  }`}
                >
                  {/* Day Header Bar */}
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setExpandedDateKey(isExpanded ? null : day.dateKey);
                    }}
                    className="w-full p-3 sm:p-3.5 flex items-center justify-between text-start cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] flex items-center justify-center shrink-0 border ${
                        day.isToday 
                          ? 'bg-[#FF6B00]/20 border-[#FF6B00]/40 text-[#FF6B00]' 
                          : hasCompleted 
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                            : 'bg-white/5 border-white/10 text-gray-400'
                      }`}>
                        {day.isToday ? <Flame className="w-4 h-4 animate-pulse" /> : <Calendar className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="font-black text-white text-xs sm:text-sm">
                            {isArabic ? day.dayNameAr : day.dayNameEn}
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-semibold text-gray-300 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full font-mono" dir="ltr">
                            {isArabic ? day.displayDateAr : day.displayDateEn}
                          </span>
                          {day.isToday && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#FF6B00] text-black shadow-sm">
                              LIVE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-300 mt-1">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span className="text-gray-300 font-medium text-[11px] sm:text-xs">{day.tasksCount} {isArabic ? 'مهام مكتملة' : 'tasks'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                      <div className="text-end">
                        <span className="text-xs sm:text-sm font-black font-mono text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)] block">
                          +{formatUSDT(day.totalEarnings)} USDT
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {isArabic ? 'عائد اليوم' : 'Day reward'}
                        </span>
                      </div>
                      <div className="text-gray-400 group-hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </button>

                  {/* Accordion Content: Task by Task Breakdown */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-1.5 bg-black/35 animate-in fade-in duration-200">
                      {day.logs.length === 0 ? (
                        <div className="py-3 text-center text-xs text-gray-400">
                          {isArabic ? 'لم يتم تسجيل مهام في هذا اليوم' : 'No tasks completed on this day'}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {day.logs.map((taskLog, idx) => {
                            const timeStr = taskLog.completedAt 
                              ? new Date(taskLog.completedAt).toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })
                              : '--:--';

                            return (
                              <div 
                                key={taskLog.id || idx}
                                className="p-2.5 rounded-[12px] bg-[#141722]/90 hover:bg-[#181C2A] border border-white/5 flex items-center justify-between gap-2 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-[8px] bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                    <Play className="w-3.5 h-3.5 fill-emerald-400" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-white block truncate">
                                      {taskLog.taskTitle}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-300 mt-0.5">
                                      <span className="text-amber-300 font-semibold">{taskLog.sponsor}</span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1 font-mono text-gray-300">
                                        <Clock className="w-2.5 h-2.5 text-gray-400" />
                                        {timeStr}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-end shrink-0">
                                  <span className="text-xs font-black font-mono text-emerald-400 block">
                                    +{formatUSDT(taskLog.rewardUSDT)} USDT
                                  </span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/25">
                                    {isArabic ? 'مكتمل' : 'Completed'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-white/10 bg-[#0A0C12] flex items-center justify-between gap-3 shrink-0 relative z-10">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] sm:text-xs">
              {isArabic 
                ? 'يتم تحديث سجل المهام تلقائياً مع كل إعلان تشاهده' 
                : 'Task logs automatically update with each watched ad'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-amber-500/25 active:scale-95 shrink-0"
          >
            {isArabic ? 'تم / إغلاق' : 'Done'}
          </button>
        </div>

      </div>
    </div>
  );
};
