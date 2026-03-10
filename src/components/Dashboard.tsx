import React, { useState } from 'react';
import { Stats, Quest, Punishment, RewardItem, Message, Achievement, IntensityLevel } from '../types';
import { SHOP_ITEMS } from '../constants/shopItems';
import { User, Brain, Heart, Zap, Star, Target, Shield, Trophy, Gift, AlertOctagon, CheckCircle2, Circle, XCircle, Clock, AlertTriangle, ShoppingCart, Cpu, Dumbbell, Settings, Volume2, Medal, Flame } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import ChatInterface from './ChatInterface';
import { VOICE_OPTIONS } from '../services/gemini';

// Removed local STORE_ITEMS

function SectionWrapper({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div 
      className={`max-w-5xl mx-auto ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      viewport={{ amount: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

export default function Dashboard({ 
  stats,
  quests, 
  punishments,
  achievements,
  points,
  onBuyItem,
  onCompletePunishment,
  onCompleteQuest,
  onFailQuest,
  messages,
  onSendMessage,
  isTyping,
  selectedVoice,
  onSelectVoice,
  onLevelUp,
  intensity,
  onSetIntensity,
  activeTab,
  onTabChange
}: { 
  stats: Stats,
  quests: Quest[], 
  punishments: Punishment[],
  achievements: Achievement[],
  points: number,
  onBuyItem: (item: RewardItem) => void,
  onCompletePunishment: (p: Punishment) => void,
  onCompleteQuest: (q: Quest) => void,
  onFailQuest: (q: Quest) => void,
  messages: Message[],
  onSendMessage: (text: string) => void,
  isTyping: boolean,
  selectedVoice: string,
  onSelectVoice: (voice: string) => void,
  onLevelUp: () => void,
  intensity: IntensityLevel,
  onSetIntensity: (level: IntensityLevel) => void,
  activeTab: string,
  onTabChange: (tab: string) => void
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isJumpingRef = React.useRef(false);

  const navItems = [
    { id: 'status', label: 'Bảng Chỉ Số', icon: Shield, color: 'text-blue-400' },
    { id: 'quests', label: 'Nhiệm Vụ', icon: Trophy, color: 'text-yellow-400' },
    { id: 'rewards', label: 'Cửa Hàng', icon: Gift, color: 'text-emerald-400' },
    { id: 'punishments', label: 'Hình Phạt', icon: AlertOctagon, color: 'text-red-400' },
    { id: 'achievements', label: 'Thành Tựu', icon: Medal, color: 'text-purple-400' },
    { id: 'chat', label: 'Trò chuyện', icon: Cpu, color: 'text-cyan-400', wrapperClass: 'h-full flex flex-col' },
    { id: 'settings', label: 'Cài đặt', icon: Settings, color: 'text-slate-400' },
  ];

  // Prepare items with clones for infinite scroll: [Clone Last, ...Real Items, Clone First]
  const itemsWithClones = [
    { ...navItems[navItems.length - 1], uniqueId: 'clone-last', originalId: navItems[navItems.length - 1].id },
    ...navItems.map(item => ({ ...item, uniqueId: item.id, originalId: item.id })),
    { ...navItems[0], uniqueId: 'clone-first', originalId: navItems[0].id }
  ];

  React.useEffect(() => {
    // Initialize scroll position to the first real item (Index 1)
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      containerRef.current.scrollLeft = width;
    }
  }, []);

  const scrollToSection = (id: string) => {
    onTabChange(id);
    const index = navItems.findIndex(item => item.id === id);
    if (index !== -1 && containerRef.current) {
      const width = containerRef.current.clientWidth;
      // Index + 1 because of the first clone
      containerRef.current.scrollTo({
        left: (index + 1) * width,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    if (!containerRef.current || isJumpingRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    
    // Calculate current index
    const rawIndex = Math.round(scrollLeft / width);
    
    // Update active tab
    let realIndex = rawIndex - 1;
    if (realIndex < 0) realIndex = navItems.length - 1;
    if (realIndex >= navItems.length) realIndex = 0;
    
    const activeItem = navItems[realIndex];
    if (activeItem && activeItem.id !== activeTab) {
      onTabChange(activeItem.id);
    }

    // Infinite Scroll Jump Logic
    // Check if we are at the clones and stable
    if (Math.abs(scrollLeft - rawIndex * width) < 2) {
        if (rawIndex === 0) {
            // At Clone Last -> Jump to Real Last
            isJumpingRef.current = true;
            container.scrollLeft = navItems.length * width;
            requestAnimationFrame(() => { isJumpingRef.current = false; });
        } else if (rawIndex === itemsWithClones.length - 1) {
            // At Clone First -> Jump to Real First
            isJumpingRef.current = true;
            container.scrollLeft = width;
            requestAnimationFrame(() => { isJumpingRef.current = false; });
        }
    }
  };

  const renderContent = (id: string) => {
    switch (id) {
      case 'status': return <StatusView stats={stats} points={points} onLevelUp={onLevelUp} />;
      case 'quests': return <QuestsView quests={quests} onCompleteQuest={onCompleteQuest} onFailQuest={onFailQuest} stats={stats} intensity={intensity} />;
      case 'rewards': return <RewardsView points={points} onBuyItem={onBuyItem} />;
      case 'punishments': return <PunishmentsView punishments={punishments} onCompletePunishment={onCompletePunishment} />;
      case 'achievements': return <AchievementsView achievements={achievements} />;
      case 'chat': return (
        <div className="flex-1 overflow-hidden flex flex-col h-full">
           <ChatInterface messages={messages} onSendMessage={onSendMessage} isTyping={isTyping} />
        </div>
      );
      case 'settings': return <SettingsView selectedVoice={selectedVoice} onSelectVoice={onSelectVoice} intensity={intensity} onSetIntensity={onSetIntensity} />;
      default: return null;
    }
  };

  return (
    <div className="h-full bg-[#05070a] text-white font-sans flex flex-col overflow-hidden">
      {/* Fixed Header & Navigation */}
      <div className="shrink-0 z-50 bg-[#05070a]/95 backdrop-blur-md pb-2 px-4 pt-2 border-b border-slate-800/50 shadow-lg shadow-black/20">
        <h1 className="text-2xl md:text-4xl font-bold text-center glow-text tracking-widest mb-4 pt-2">HỆ THỐNG HỌC BÁ</h1>
        
        <div className="flex justify-start md:justify-center gap-2 mb-1 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 text-sm relative overflow-hidden whitespace-nowrap shrink-0 ${
                activeTab === item.id 
                  ? 'text-blue-300 border-blue-500 glow-border bg-blue-900/20' 
                  : 'bg-[#0a0f16]/50 border-slate-800 text-slate-400 hover:border-slate-600'
              }`}
            >
              {activeTab === item.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-blue-900/30"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <item.icon className="w-4 h-4" /> {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Scroll Container */}
      <div 
        ref={containerRef} 
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
      >
        {itemsWithClones.map((item, index) => (
          <section 
            key={`${item.uniqueId}-${index}`} 
            className={`min-w-full h-full snap-center ${item.originalId === 'chat' ? 'overflow-hidden flex flex-col p-0' : 'overflow-y-auto p-4 md:p-6 pb-24 md:pb-6'}`}
          >
            <SectionWrapper className={item.wrapperClass}>
              {item.originalId !== 'chat' && (
                <SectionHeader icon={item.icon} title={item.label} color={item.color} />
              )}
              {renderContent(item.originalId)}
            </SectionWrapper>
          </section>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, color }: { icon: any, title: string, color: string }) {
  return (
    <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-2">
      <div className={`p-2 rounded-lg bg-[#0a0f16] border border-slate-800 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h2 className={`text-2xl font-bold uppercase tracking-wider ${color}`}>{title}</h2>
    </div>
  );
}

function AchievementsView({ achievements }: { achievements: Achievement[] }) {
  if (achievements.length === 0) {
    return (
      <div className="text-center text-slate-500 mt-10 border border-dashed border-slate-800 rounded-xl p-10">
        <Medal className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p className="text-lg">Chưa có thành tựu nào được mở khóa.</p>
        <p className="text-sm mt-2">Hãy nỗ lực hoàn thành nhiệm vụ và nâng cao chỉ số để ghi danh vào bảng vàng!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {achievements.map(achievement => (
        <motion.div 
          key={achievement.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-xl border relative overflow-hidden ${
            achievement.type === 'fitness' ? 'bg-red-900/20 border-red-500/30' :
            achievement.type === 'intellect' ? 'bg-blue-900/20 border-blue-500/30' :
            'bg-yellow-900/20 border-yellow-500/30'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="text-4xl">{achievement.icon}</div>
            <div>
              <h4 className={`font-bold text-lg ${
                achievement.type === 'fitness' ? 'text-red-400' :
                achievement.type === 'intellect' ? 'text-blue-400' :
                'text-yellow-400'
              }`}>
                {achievement.title}
              </h4>
              <p className="text-sm text-slate-300 mt-1">{achievement.description}</p>
              {achievement.unlockedAt && (
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Mở khóa: {new Date(achievement.unlockedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          
          {/* Decorative background icon */}
          <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none">
            <Medal className="w-24 h-24" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function SettingsView({ selectedVoice, onSelectVoice, intensity, onSetIntensity }: { 
  selectedVoice: string, 
  onSelectVoice: (voice: string) => void,
  intensity: IntensityLevel,
  onSetIntensity: (level: IntensityLevel) => void
}) {
  const [pendingIntensity, setPendingIntensity] = useState<IntensityLevel>(intensity);

  React.useEffect(() => {
    setPendingIntensity(intensity);
  }, [intensity]);

  const handleSave = () => {
    onSetIntensity(pendingIntensity);
  };

  const handleCancel = () => {
    setPendingIntensity(intensity);
  };

  return (
    <div className="max-w-2xl mx-auto bg-[#0a0f16]/80 p-8 rounded-xl glow-border">
      <h3 className="text-xl font-bold text-blue-300 uppercase tracking-wider mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6" /> Cài Đặt Hệ Thống
      </h3>
      
      {/* Intensity Selector */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" /> Cường Độ Tu Luyện
        </h4>
        <div className="bg-[#05070a] p-1 rounded-xl flex gap-1 border border-slate-800">
          {(['normal', 'hard', 'hell'] as IntensityLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => setPendingIntensity(level)}
              className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-wider transition-all ${
                pendingIntensity === level 
                  ? level === 'normal' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' :
                    level === 'hard' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50' :
                    'bg-red-700 text-white shadow-lg shadow-red-900/50 animate-pulse'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              {level === 'normal' ? 'Bình Thường' : level === 'hard' ? 'Khó' : 'Địa Ngục'}
            </button>
          ))}
        </div>
        
        <div className="mt-4 p-4 rounded-lg bg-slate-900/50 border border-slate-800 text-sm transition-all duration-300">
          {pendingIntensity === 'normal' && (
            <div className="text-blue-300 animate-in fade-in slide-in-from-top-1">
              <span className="font-bold block mb-1">CHẾ ĐỘ BÌNH THƯỜNG:</span>
              • Số lượng nhiệm vụ: Cơ bản (2 + Cấp độ)<br/>
              • Thời gian học: Tiêu chuẩn<br/>
              • Cường độ tập: Vừa sức<br/>
              • Thưởng chỉ số: 100% (Cơ bản)
            </div>
          )}
          {pendingIntensity === 'hard' && (
            <div className="text-orange-300 animate-in fade-in slide-in-from-top-1">
              <span className="font-bold block mb-1">CHẾ ĐỘ KHÓ:</span>
              • Số lượng nhiệm vụ: +5 nhiệm vụ mỗi ngày<br/>
              • Thời gian học: Gấp đôi bình thường<br/>
              • Cường độ tập: Nặng hơn<br/>
              • Thưởng chỉ số: 150% (Tăng tốc độ phát triển)
            </div>
          )}
          {pendingIntensity === 'hell' && (
            <div className="text-red-400 animate-in fade-in slide-in-from-top-1">
              <span className="font-bold block mb-1">CHẾ ĐỘ ĐỊA NGỤC:</span>
              • Số lượng nhiệm vụ: GẤP 3 LẦN<br/>
              • Thời gian học: GẤP 5 LẦN<br/>
              • Cường độ tập: Cực hạn sinh lý (GẤP 5 LẦN)<br/>
              • Thưởng chỉ số: 250% (Đột phá giới hạn)<br/>
              <span className="italic text-xs opacity-80 mt-1 block">"Chỉ dành cho những kẻ điên muốn thành thần."</span>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {pendingIntensity !== intensity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0f172a] border border-yellow-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-yellow-900/20 animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-yellow-500/10 rounded-full shrink-0">
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">CẢNH BÁO THAY ĐỔI CƯỜNG ĐỘ</h4>
                  <p className="text-slate-300 leading-relaxed">
                    Việc thay đổi cường độ sẽ <span className="text-white font-bold">làm mới toàn bộ nhiệm vụ hiện tại</span> và áp dụng mức độ khó mới ngay lập tức.
                  </p>
                  {pendingIntensity === 'hell' && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 font-bold text-sm flex items-center gap-2">
                        <Flame className="w-4 h-4" />
                        CẢNH BÁO: Chế độ ĐỊA NGỤC có thể gây quá tải về thể chất và tinh thần. Hãy cân nhắc kỹ!
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button 
                  onClick={handleCancel}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white font-medium transition-all"
                >
                  Hủy Bỏ
                </button>
                <button 
                  onClick={handleSave}
                  className="px-6 py-2.5 rounded-xl bg-yellow-600 text-white hover:bg-yellow-500 font-bold shadow-lg shadow-yellow-900/20 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  XÁC NHẬN LƯU
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-emerald-400" /> Giọng Nói AI
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VOICE_OPTIONS.map(voice => (
            <button
              key={voice.id}
              onClick={() => onSelectVoice(voice.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedVoice === voice.id
                  ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : 'bg-[#05070a] border-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`font-bold ${selectedVoice === voice.id ? 'text-blue-300' : 'text-slate-300'}`}>
                  {voice.name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {voice.gender}
                </span>
              </div>
              <p className="text-sm text-slate-500 italic">{voice.style}</p>
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg text-sm text-yellow-200/80">
        <p>Lưu ý: Thay đổi giọng nói sẽ áp dụng cho các phản hồi tiếp theo của Hệ Thống.</p>
      </div>
    </div>
  );
}

function StatusView({ stats, points, onLevelUp }: { stats: Stats, points: number, onLevelUp: () => void }) {
  const levelNames = [
    "Học Tra", "Học Giả", "Học Mướn", "Học Cụ", "Học Miệt",
    "Học Bá", "Học Quái", "Học Thánh", "Học Đế", "Học Thần"
  ];

  // Map level 1-10 to index 0-9. Handle 0 just in case.
  const index = Math.max(0, Math.min(stats.level - 1, 9));
  const currentLevelName = levelNames[index] || "Học Thần";
  
  // Calculate progress based on COMPLETED stats (100/100)
  const completedStatsCount = [stats.intelligence, stats.stamina, stats.strength, stats.talent, stats.focus].filter(s => s >= 100).length;
  const progress = completedStatsCount * 20;
  const canLevelUp = progress === 100;

  const data = [
    { name: 'Trí lực', value: stats.intelligence, icon: Brain, color: 'text-blue-400' },
    { name: 'Thể lực', value: stats.strength, icon: Dumbbell, color: 'text-red-400' },
    { name: 'Sức bền', value: stats.stamina, icon: Heart, color: 'text-green-400' },
    { name: 'Tài năng', value: stats.talent, icon: Star, color: 'text-yellow-400' },
    { name: 'Tập trung', value: stats.focus, icon: Target, color: 'text-purple-400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Trạng thái bản thân */}
        <div className="bg-[#0a0f16]/80 p-6 rounded-xl glow-border">
          <h3 className="text-lg font-semibold text-blue-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <User className="w-5 h-5" /> TRẠNG THÁI BẢN THÂN
          </h3>
          <div className="text-center mb-4">
            <div className="w-20 h-20 rounded-full bg-blue-900/50 border-2 border-blue-500 flex items-center justify-center mx-auto mb-2">
              <User className="w-10 h-10 text-blue-400" />
            </div>
            <div className="font-bold">Trần Gia Huy</div>
            <div className="text-sm text-slate-400">Tuổi: 17</div>
          </div>
          <div className="space-y-2 text-sm">
            <div>Sức khỏe Tâm thần: Bình thường</div>
            <div>Trạng thái: Tập trung</div>
            <div>Hoạt động: Học lớp 11</div>
          </div>
        </div>

        {/* Cấp độ & Điểm */}
        <motion.div 
          className="bg-[#0a0f16]/80 p-6 rounded-xl glow-border flex flex-col justify-center items-center cursor-pointer relative overflow-hidden"
          whileHover={{ scale: 1.02, rotate: [0, -1, 1, -1, 1, 0], transition: { duration: 0.5 } }}
        >
          <div className="text-blue-400 text-xl font-bold mb-2">CẤP ĐỘ: {currentLevelName.toUpperCase()}</div>
          <div className="text-emerald-400 text-3xl font-bold mb-2">ĐIỂM TÍCH LŨY: {points}</div>
          <div className="text-lg text-slate-300 mb-4">TIẾN TRÌNH: {progress}%</div>
          
          {canLevelUp ? (
            <motion.button
              onClick={onLevelUp}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={{ 
                boxShadow: ["0 0 0px #3b82f6", "0 0 20px #3b82f6", "0 0 0px #3b82f6"],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-lg shadow-lg uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" /> THĂNG CẤP NGAY
            </motion.button>
          ) : (
            <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-4 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
          )}
          
          {/* Helper text */}
          <div className="text-xs text-slate-500 mt-4 text-center">
            {completedStatsCount}/5 chỉ số đạt tối đa
          </div>
        </motion.div>

        {/* Biểu đồ kỹ năng (Progress bars) */}
        <div className="bg-[#0a0f16]/80 p-6 rounded-xl glow-border">
          <h3 className="text-lg font-semibold text-blue-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" /> BIỂU ĐỒ KỸ NĂNG
          </h3>
          <div className="space-y-4">
            {data.map(item => (
              <motion.div 
                key={item.name} 
                className="group p-2 rounded-lg transition-all duration-300 hover:bg-slate-800/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] cursor-pointer"
                whileHover={{ x: [0, -3, 3, -3, 3, 0], transition: { duration: 0.4 } }}
              >
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="flex items-center gap-2 group-hover:scale-105 transition-transform duration-300">
                    <item.icon className={`w-4 h-4 ${item.color} transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]`} />
                    <span className="group-hover:text-white transition-colors">{item.name}</span>
                  </span>
                  <span className={`font-mono transition-colors ${item.value >= 100 ? 'text-emerald-400 font-bold' : 'text-slate-400 group-hover:text-blue-300'}`}>
                    {item.value}/100
                  </span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ease-out ${item.value >= 100 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : item.color.replace('text-', 'bg-')} group-hover:brightness-125`} 
                    style={{ width: `${Math.min(item.value, 100)}%` }}
                  ></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
  );
}

function QuestsView({ quests, onCompleteQuest, onFailQuest, stats, intensity }: { quests: Quest[], onCompleteQuest: (q: Quest) => void, onFailQuest: (q: Quest) => void, stats: Stats, intensity: IntensityLevel }) {
  const [_, setTick] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 600000); // Update every 10 minutes
    return () => clearInterval(timer);
  }, []);

  const calculateTimeRemaining = (deadline?: string | number) => {
    if (!deadline) return null;
    
    let diff = 0;
    
    if (typeof deadline === 'number') {
      diff = deadline - Date.now();
    } else {
      const timeMatch = deadline.match(/(\d{1,2})[:h](\d{2})/);
      if (!timeMatch) return null;

      const now = new Date();
      const [_, h, m] = timeMatch;
      const deadlineDate = new Date();
      deadlineDate.setHours(parseInt(h), parseInt(m), 0, 0);

      diff = deadlineDate.getTime() - now.getTime();
    }

    if (diff < 0) return "Hết giờ";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}p`;
  };

  const dailyQuests = quests.filter(q => q.type === 'daily');
  const monthlyQuests = quests.filter(q => q.type === 'monthly');
  const randomQuests = quests.filter(q => q.type === 'random');

  const decayFactor = 1 / (1 + (stats.level - 1) * 0.3);
  const intensityMultiplier = intensity === 'hell' ? 2.5 : intensity === 'hard' ? 1.5 : 1.0;
  const baseMultiplier = 10;
  const calculateReward = (val: number) => Math.max(1, Math.round(val * decayFactor * intensityMultiplier * baseMultiplier));

  const renderQuestSection = (title: string, sectionQuests: Quest[], colorClass: string) => (
    <div className="mb-8">
      <h3 className={`text-xl font-bold ${colorClass} mb-4 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2`}>
        {title} <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">{sectionQuests.length}</span>
      </h3>
      {sectionQuests.length === 0 ? (
        <div className="text-slate-500 italic text-sm">Chưa có nhiệm vụ.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectionQuests.map(quest => (
            <div 
              key={quest.id} 
              className="bg-[#0a0f16]/80 p-5 rounded-xl glow-border relative overflow-hidden group border border-slate-800 hover:border-blue-500/30 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">{quest.title}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  quest.status === 'completed' ? 'bg-emerald-900/50 text-emerald-400' :
                  quest.status === 'failed' ? 'bg-red-900/50 text-red-400' :
                  'bg-blue-900/30 text-blue-400'
                }`}>
                  {quest.status === 'completed' ? 'Đã xong' : quest.status === 'failed' ? 'Thất bại' : 'Đang làm'}
                </span>
              </div>
              
              <p className="text-sm text-slate-400 mb-4">{quest.description}</p>
              
              {/* Deadline & Points */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {quest.deadline && (
                  <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Hạn chót</div>
                    <div className="text-sm font-mono text-orange-400 font-bold">
                      {typeof quest.deadline === 'number' 
                        ? new Date(quest.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                        : quest.deadline}
                      {(() => {
                        const rem = calculateTimeRemaining(quest.deadline);
                        return rem ? <span className="text-xs text-orange-600 block">({rem})</span> : null;
                      })()}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-1">
                  <div className="bg-emerald-900/10 p-1 px-2 rounded border border-emerald-900/30 flex justify-between items-center">
                    <span className="text-[10px] text-emerald-500 uppercase">Thưởng</span>
                    <span className="text-sm font-bold text-emerald-400">+{quest.rewardPoints} TP</span>
                  </div>
                  <div className="bg-red-900/10 p-1 px-2 rounded border border-red-900/30 flex justify-between items-center">
                    <span className="text-[10px] text-red-500 uppercase">Phạt</span>
                    <span className="text-sm font-bold text-red-400">-{quest.penaltyPoints} TP</span>
                  </div>
                </div>
              </div>
              
              {quest.statRewards && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(quest.statRewards).map(([key, value]) => (
                    <span key={key} className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      +{calculateReward(value)} {key === 'intelligence' ? 'Trí lực' : key === 'stamina' ? 'Sức bền' : key === 'strength' ? 'Thể lực' : key === 'talent' ? 'Tài năng' : 'Tập trung'}
                    </span>
                  ))}
                </div>
              )}
              
              {quest.status === 'pending' && (
                <div className="flex gap-2 pt-2 border-t border-slate-800">
                  <button 
                    onClick={() => onFailQuest(quest)} 
                    className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Thất bại
                  </button>
                  <button 
                    onClick={() => onCompleteQuest(quest)} 
                    className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Hoàn thành
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (quests.length === 0) {
    return <div className="text-center text-slate-500 mt-10">Chưa có nhiệm vụ nào. Hãy yêu cầu Hệ Thống giao việc!</div>;
  }

  return (
    <div className="pb-20">
      {renderQuestSection("Nhiệm Vụ Đột Xuất", randomQuests, "text-orange-400")}
      {renderQuestSection("Nhiệm Vụ Ngày", dailyQuests, "text-blue-400")}
      {renderQuestSection("Nhiệm Vụ Tháng", monthlyQuests, "text-purple-400")}
    </div>
  );
}

function RewardsView({ points, onBuyItem }: { points: number, onBuyItem: (item: any) => void }) {
  const [hideUnaffordable, setHideUnaffordable] = useState(false);

  const filteredItems = hideUnaffordable 
    ? SHOP_ITEMS.filter(item => points >= item.price)
    : SHOP_ITEMS;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setHideUnaffordable(!hideUnaffordable)}
          className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-all ${
            hideUnaffordable 
              ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' 
              : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
          }`}
        >
          {hideUnaffordable ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
          Chỉ hiện vật phẩm mua được
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-10 text-slate-500 italic border border-dashed border-slate-800 rounded-xl">
          <p>Không có vật phẩm nào phù hợp với túi tiền hiện tại của ngài.</p>
          <p className="text-xs mt-2">Hãy làm nhiệm vụ để kiếm thêm Tích phân nhé!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map(item => {
            const canAfford = points >= item.price;
            return (
              <div 
                key={item.id} 
                className={`p-4 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                  canAfford 
                    ? 'bg-gradient-to-br from-emerald-900/20 to-[#0a0f16] border border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:-translate-y-1' 
                    : 'bg-[#05070a] border border-slate-800/50 opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
                }`}
              >
                {canAfford && (
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold uppercase tracking-wider shadow-lg shadow-emerald-900/50 z-10">
                    Mua được
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-2">
                  <div className="text-3xl p-2 bg-slate-800/50 rounded-lg">{item.icon}</div>
                  <div className={`text-lg font-bold font-mono ${canAfford ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {item.price} TP
                  </div>
                </div>
                
                <h4 className={`text-lg font-bold mb-1 ${canAfford ? 'text-white' : 'text-slate-400'}`}>{item.name}</h4>
                <p className="text-sm text-slate-400 mb-4 min-h-[40px]">{item.description}</p>
                
                <button 
                  onClick={() => onBuyItem({ id: item.id, name: item.name, description: item.description, cost: item.price, icon: item.icon })} 
                  disabled={!canAfford}
                  className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    canAfford 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {canAfford ? (
                    <>
                      <ShoppingCart className="w-4 h-4" /> Đổi Ngay
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" /> Thiếu {item.price - points} TP
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PunishmentsView({ punishments, onCompletePunishment }: { punishments: Punishment[], onCompletePunishment: (p: Punishment) => void }) {
  const [now, setNow] = useState(Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (punishments.length === 0) return <div className="text-center text-slate-500 mt-10 border border-dashed border-slate-800 rounded-xl p-10">
    <AlertOctagon className="w-16 h-16 mx-auto mb-4 opacity-20 text-red-500" />
    <p className="text-lg">Không có hình phạt nào.</p>
    <p className="text-sm mt-2">Hãy duy trì phong độ này, Ký Chủ!</p>
  </div>;
  
  return (
    <div className="space-y-4">
      {punishments.map(p => {
        const timeLeft = p.deadline ? Math.max(0, p.deadline - now) : 0;
        
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        return (
          <div key={p.id} className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
            p.status === 'failed' 
              ? 'bg-red-900/10 border-red-500/50' 
              : p.status === 'completed'
                ? 'bg-emerald-900/10 border-emerald-500/30 opacity-60'
                : 'bg-[#0a0f16]/80 border-red-500/30 glow-border shadow-[0_0_15px_rgba(239,68,68,0.1)]'
          }`}>
            <div className="flex justify-between items-start mb-3">
              <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1 ${
                p.status === 'failed' ? 'bg-red-900/50 text-red-200' :
                p.status === 'completed' ? 'bg-emerald-900/50 text-emerald-200' :
                'bg-red-900/30 text-red-400 border border-red-500/30'
              }`}>
                {p.status === 'failed' ? <XCircle className="w-3 h-3" /> : p.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {p.status === 'failed' ? 'THẤT BẠI' : p.status === 'completed' ? 'ĐÃ XONG' : 'ĐANG THI HÀNH'}
              </span>
              
              {p.status === 'pending' && p.deadline && (
                <div className={`flex items-center gap-1.5 text-xs font-mono font-bold ${timeLeft < 300000 ? 'text-red-500 animate-pulse' : 'text-orange-400'}`}>
                  <Clock className="w-3.5 h-3.5" />
                  {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </div>
              )}
            </div>
            
            <p className="text-sm text-slate-200 mb-4 font-medium leading-relaxed">{p.description}</p>
            
            {p.status === 'failed' && p.penaltyApplied && (
              <div className="text-xs text-red-300 bg-red-950/50 p-3 rounded-lg mb-2 border border-red-500/20 flex items-start gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-1">HÌNH PHẠT ĐÃ ÁP DỤNG:</span>
                  -5 điểm tất cả chỉ số<br/>
                  -50 điểm Tích phân
                </div>
              </div>
            )}
            
            {p.status === 'pending' && (
              <button 
                onClick={() => onCompletePunishment(p)} 
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 group"
              >
                <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Báo cáo hoàn thành
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
