import React, { useState } from 'react';
import { 
  X, 
  Users, 
  DollarSign, 
  Sparkles, 
  UserPlus, 
  Calendar, 
  CheckCircle2, 
  Crown, 
  ArrowDownLeft,
  Share2,
  Copy,
  Check,
  Play
} from 'lucide-react';
import { TeamLevelData, registerReferralMember } from '../../utils/teamUtils';
import { storage } from '../../utils/storage';
import { soundEngine } from '../../utils/audio';

interface TeamLevelDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelData: TeamLevelData | null;
  sponsorReferralCode: string;
  onDataChanged?: () => void;
  onShowToast?: (title: string, message: string, type?: 'success' | 'info' | 'vip') => void;
}

export const TeamLevelDetailsModal: React.FC<TeamLevelDetailsModalProps> = ({
  isOpen,
  onClose,
  levelData,
  sponsorReferralCode,
  onDataChanged,
  onShowToast,
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSimulatingAd, setIsSimulatingAd] = useState(false);
  const [simDeposit, setSimDeposit] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen || !levelData) return null;

  const handleSimulateWatchAd = (targetMemberEmail?: string) => {
    setIsSimulatingAd(true);
    soundEngine.playClick();

    setTimeout(() => {
      let emailToUse = targetMemberEmail;
      if (!emailToUse) {
        if (levelData.members.length > 0) {
          emailToUse = levelData.members[0].email;
        } else {
          const newAcc = registerReferralMember(sponsorReferralCode, levelData.levelNumber, 0);
          emailToUse = newAcc.email;
        }
      }

      storage.distribute3TierTaskCommission(emailToUse, 0.09);
      setIsSimulatingAd(false);
      soundEngine.playSuccess();

      if (onShowToast) {
        onShowToast(
          'تمت إضافة عمولة الإعلان (+0.01$)',
          'أتم العضو مشاهدة إعلان، وأُضيفت +0.01 USDT فوراً في خانة "العمولات المعلقة" بجانب زر "يجمع"!',
          'success'
        );
      }

      if (onDataChanged) {
        onDataChanged();
      }
    }, 250);
  };

  const handleSimulateAdd = () => {
    setIsSimulating(true);
    soundEngine.playClick();

    setTimeout(() => {
      const newAcc = registerReferralMember(sponsorReferralCode, levelData.levelNumber, simDeposit);
      setIsSimulating(false);
      soundEngine.playSuccess();

      if (onShowToast) {
        if (simDeposit > 0) {
          onShowToast(
            'طلب إيداع قيد المراجعة الإدارية',
            `تم تسجيل ${newAcc.username} في المستوى ${levelData.levelNumber} وإرسال طلب شحن ($${simDeposit.toFixed(2)} USDT) قيد المعالجة. يرجى قبول الطلب من لوحة التحكم لتنزيل العمولة فوراً.`,
            'info'
          );
        } else {
          onShowToast(
            'تم تسجيل عضو جديد مجاناً!',
            `تم تسجيل ${newAcc.username} في المستوى ${levelData.levelNumber} بنجاح. زاد حجم الفريق (+1 عضو) بدون إضافة رصيد (0.00$) وفقاً للنظام الصارم.`,
            'success'
          );
        }
      }

      if (onDataChanged) {
        onDataChanged();
      }
    }, 400);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    soundEngine.playSuccess();
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const levelColor = levelData.levelNumber === 1 
    ? 'from-amber-400 to-[#FF6B00]' 
    : levelData.levelNumber === 2 
    ? 'from-cyan-400 to-blue-500' 
    : 'from-emerald-400 to-teal-500';

  const badgeBorder = levelData.levelNumber === 1
    ? 'border-amber-400/40 text-amber-300 bg-amber-500/10'
    : levelData.levelNumber === 2
    ? 'border-cyan-400/40 text-cyan-300 bg-cyan-500/10'
    : 'border-emerald-400/40 text-emerald-300 bg-emerald-500/10';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-lg bg-[#0E121B] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black/90 max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${levelColor} p-0.5 flex items-center justify-center shadow-lg`}>
              <div className="w-full h-full bg-[#0E121B] rounded-2xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">
                  تفاصيل مستوى الإحالة {levelData.levelNumber}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black border ${badgeBorder}`}>
                  عمولة {levelData.commissionRate}%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                سجل الأعضاء النشطين وعمولات المستوى المكتسبة
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1 pl-1">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold">نسبة العمولة</span>
              <span className="text-xl font-black font-mono text-amber-400 mt-1">
                {levelData.commissionRate}%
              </span>
              <span className="text-[9px] text-gray-500 mt-0.5">نسبة ثابتة</span>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold">يسجل صالح</span>
              <span className="text-xl font-black font-mono text-white mt-1">
                {levelData.validMembersCount}
              </span>
              <span className="text-[9px] text-gray-500 mt-0.5">عضو مسجل</span>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold">إجمالي الإدخال</span>
              <span className="text-xl font-black font-mono text-[#00F0FF] mt-1">
                ${levelData.totalDepositUSDT.toFixed(2)}
              </span>
              <span className="text-[9px] text-cyan-400/80 mt-0.5">USDT شحن</span>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold">إجمالي الدخل</span>
              <span className="text-xl font-black font-mono text-emerald-400 mt-1">
                ${levelData.totalCommissionUSDT.toFixed(2)}
              </span>
              <span className="text-[9px] text-emerald-500/80 mt-0.5">USDT عمولة</span>
            </div>
          </div>

          {/* Quick Simulation Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#FF6B00]/5 to-transparent border border-amber-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                محاكاة تسجيل عضو جديد عبر الرابط للتجربة:
              </span>
              <span className="text-[10px] text-gray-400">تحديث فوري للعداد</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={simDeposit}
                onChange={(e) => setSimDeposit(Number(e.target.value))}
                className="bg-black/60 border border-white/10 text-xs rounded-xl px-2.5 py-2 text-white font-mono focus:outline-none focus:border-amber-400 flex-1"
              >
                <option value={0}>بدون إيداع (0.00 USDT - تسجيل مجاني)</option>
                <option value={10}>شحن 10.00 USDT (VIP 2)</option>
                <option value={30}>شحن 30.00 USDT (VIP 3)</option>
                <option value={60}>شحن 60.00 USDT (VIP 4)</option>
                <option value={100}>شحن 100.00 USDT</option>
              </select>
              <button
                onClick={handleSimulateAdd}
                disabled={isSimulating}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-[#FF6B00] hover:from-amber-300 hover:to-orange-500 text-black font-black text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isSimulating ? 'جارِ الإضافة...' : 'إضافة عضو'}</span>
              </button>
            </div>

            {levelData.levelNumber === 1 && (
              <button
                type="button"
                onClick={() => handleSimulateWatchAd()}
                disabled={isSimulatingAd}
                className="w-full mt-2.5 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>
                  {isSimulatingAd ? 'جارِ تسجيل المشاهدة...' : 'تجربة إتمام إعلان لعضو الإحالة (+0.01 USDT في العمولات المعلقة)'}
                </span>
              </button>
            )}
          </div>

          {/* Members List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400 font-bold px-1">
              <span>قائمة أعضاء المستوى ({levelData.members.length})</span>
              <span>تفاصيل النشاط والإيداع</span>
            </div>

            {levelData.members.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl bg-black/20 border border-white/5 space-y-2">
                <Users className="w-8 h-8 text-gray-600 mx-auto" />
                <p className="text-xs text-gray-400 font-medium">
                  لا يوجد أعضاء مسجلين في هذا المستوى حتى الآن.
                </p>
                <p className="text-[11px] text-gray-500">
                  قم بمشاركة رابط الإحالة أو شفرة الدعوة الخاصة بك لتسجيل أعضاء جدد والبدء في جني الأرباح!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {levelData.members.map((member, idx) => (
                  <div
                    key={member.id || `m-${idx}`}
                    className="p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 font-black font-mono">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">
                            {member.username}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold">
                            VIP {member.vipLevel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                          <span className="font-mono">{member.joinedDate}</span>
                          <span>•</span>
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            يسجل صالح
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left flex flex-col items-end gap-1">
                      <span className="text-xs font-mono font-black text-[#00F0FF] block">
                        ${member.depositAmount.toFixed(2)}
                      </span>
                      {levelData.levelNumber === 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSimulateWatchAd(member.email);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          title="محاكاة مشاهدة إعلان (+0.01 USDT عمولة معلقة)"
                        >
                          <Play className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                          <span>إعلان (+0.01$)</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            شفرة الدعوة: <span className="font-mono font-bold text-amber-400">{sponsorReferralCode}</span>
          </span>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
