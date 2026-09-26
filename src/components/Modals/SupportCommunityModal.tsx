import React, { useState } from 'react';
import { 
  X, 
  Headphones, 
  Send, 
  Crown, 
  MessageSquare, 
  CheckCircle2, 
  ExternalLink,
  Sparkles,
  PhoneCall,
  Clock,
  HelpCircle
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';

interface SupportCommunityModalProps {
  isOpen: boolean;
  initialTab?: 'support' | 'community';
  onClose: () => void;
}

export const SupportCommunityModal: React.FC<SupportCommunityModalProps> = ({
  isOpen,
  initialTab = 'support',
  onClose,
}) => {
  const [tab, setTab] = useState<'support' | 'community'>(initialTab);
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim()) return;
    soundEngine.playSuccess();
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      setTicketMessage('');
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-3xl bg-[#0D1017] border border-[#00A3FF]/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#00A3FF]/15 via-[#0D1017] to-orange-500/10">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-[#00A3FF]/20 border border-[#00A3FF]/50 flex items-center justify-center text-[#00A3FF] shadow-[0_0_15px_rgba(0,163,255,0.3)]">
              <Headphones className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0D1017] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">مركز الدعم ومجتمع VIP</h3>
                <span className="px-2 py-0.5 rounded-full bg-orange-500 text-black text-[10px] font-black">
                  24/7 نشط
                </span>
              </div>
              <p className="text-xs text-gray-400">خدمة العملاء المباشرة ومجموعة تليجرام الرسمية</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1.5 bg-black/60 border-b border-white/5">
          <button
            onClick={() => {
              soundEngine.playClick();
              setTab('support');
            }}
            className={`py-2 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'support' 
                ? 'bg-[#00A3FF] text-black font-black shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>خدمة العملاء (24/7)</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setTab('community');
            }}
            className={`py-2 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'community' 
                ? 'bg-[#FF6B00] text-black font-black shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>مجتمع VIP تليجرام</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {tab === 'support' ? (
            <div className="space-y-4">
              {/* Live Support Channel Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="https://t.me/ameliaadsvip"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => soundEngine.playClick()}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-[#0088cc]/20 to-black/60 border border-[#0088cc]/40 hover:border-[#0088cc] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0088cc] flex items-center justify-center text-white shrink-0 shadow-md">
                      <Send className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-white block">محادثة تليجرام المباشرة</span>
                      <span className="text-[10px] text-emerald-400 block">متصل الآن • رد فوري</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </a>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-[#FF6B00] shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">متوسط وقت الاستجابة</span>
                    <span className="text-[10px] text-gray-400 block">أقل من 60 ثانية على مدار الساعة</span>
                  </div>
                </div>
              </div>

              {/* Instant In-App Message */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <MessageSquare className="w-4 h-4 text-[#00A3FF]" />
                  <span>إرسال تذكرة دعم سريعة للمشرف</span>
                </div>

                {isSent ? (
                  <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-center space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                    <p className="text-xs font-bold text-emerald-300">تم استلام رسالتك بنجاح!</p>
                    <p className="text-[10px] text-gray-400">سيقوم فريق الدعم بالرد خلال دقائق عبر إشعار المنصة</p>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="space-y-3">
                    <textarea
                      rows={3}
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="اكتب استفسارك أو رقم العملية هنا..."
                      className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#00A3FF] transition-colors resize-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00A3FF] to-cyan-500 hover:from-cyan-400 hover:to-[#00A3FF] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال التذكرة الآن</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Community card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1A1208] via-black to-[#0A0E17] border border-orange-500/40 text-center space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-[#FF6B00] to-amber-400 p-0.5 mx-auto shadow-xl shadow-orange-500/30">
                  <div className="w-full h-full rounded-[22px] bg-black flex items-center justify-center">
                    <Crown className="w-7 h-7 text-amber-400" />
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-black text-white">قناة ومجتمع كبار الشخصيات الرسمية</h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    انضم إلى أكثر من 45,000 مستثمر عربي لمتابعة إثباتات السحب اليومية، التحديثات، ومسابقات شحن الرصيد
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-gray-400 block text-[10px]">الأعضاء النشطين</span>
                    <span className="text-amber-400 font-mono font-bold">48,290+ عضو</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-gray-400 block text-[10px]">المكافآت الأسبوعية</span>
                    <span className="text-emerald-400 font-mono font-bold">$10,000 USDT</span>
                  </div>
                </div>

                <a
                  href="https://t.me/ameliaadsvip"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => soundEngine.playClick()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6B00] via-amber-500 to-[#FF8533] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 hover:brightness-110 active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4 text-black" />
                  <span>انضم لقناة تليجرام الرسمية الآن</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
