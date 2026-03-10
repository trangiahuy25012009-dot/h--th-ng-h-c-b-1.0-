import React, { useState } from 'react';
import { Quest, Punishment, RewardItem, Stats } from '../types';
import { Trophy, Gift, AlertOctagon, CheckCircle2, Circle, XCircle, Clock, AlertTriangle, Target, ShoppingCart, User, Brain, Heart, Zap, Star, Shield, Activity } from 'lucide-react';
import { motion } from 'motion/react';

const STORE_ITEMS: RewardItem[] = [
  { id: '1', name: 'Thẻ Tập Trung x2', description: 'Nhân đôi điểm tập trung trong 1 giờ.', cost: 50, icon: '🎯' },
  { id: '2', name: 'Gợi Ý Giải Bài', description: 'Hệ thống sẽ hướng dẫn chi tiết một bài tập khó.', cost: 30, icon: '💡' },
  { id: '3', name: 'Quyền Nghỉ Ngơi', description: 'Được phép bỏ qua 1 nhiệm vụ hàng ngày không bị phạt.', cost: 100, icon: '☕' },
  { id: '4', name: 'Nhạc Sóng Não', description: 'Mở khóa playlist nhạc giúp tăng cường ghi nhớ.', cost: 20, icon: '🎧' },
];

export default function RightPanel({ 
  stats,
  quests, 
  punishments,
  points,
  onBuyItem,
  onCompletePunishment,
  onCompleteQuest,
  onFailQuest
}: { 
  stats: Stats,
  quests: Quest[], 
  punishments: Punishment[],
  points: number,
  onBuyItem: (item: RewardItem) => void,
  onCompletePunishment: (p: Punishment) => void,
  onCompleteQuest: (q: Quest) => void,
  onFailQuest: (q: Quest) => void
}) {
  return (
    <div className="w-full md:w-[400px] bg-[#05070a] border-l border-blue-500/20 flex flex-col shrink-0 p-6 gap-6 overflow-y-auto">
      <h1 className="text-2xl font-bold text-center glow-text tracking-widest">HỆ THỐNG HỌC BÁ</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <StatusView stats={stats} points={points} />
        <LevelView stats={stats} points={points} />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <QuestsView quests={quests} onCompleteQuest={onCompleteQuest} onFailQuest={onFailQuest} />
        <RewardsView points={points} onBuyItem={onBuyItem} />
      </div>

      <PunishmentsView punishments={punishments} onCompletePunishment={onCompletePunishment} />
    </div>
  );
}

function StatusView({ stats, points }: { stats: Stats, points: number }) {
  return (
    <div className="bg-[#0a0f16]/80 p-4 rounded-xl glow-border">
      <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-4 flex items-center gap-2">
        <User className="w-4 h-4" /> TRẠNG THÁI
      </h3>
      <div className="space-y-2">
        <StatBar icon={<Brain className="w-4 h-4 text-purple-400" />} label="Trí lực" value={stats.intelligence} color="bg-purple-500" />
        <StatBar icon={<Heart className="w-4 h-4 text-red-400" />} label="Thể lực" value={stats.strength} color="bg-red-500" />
        <StatBar icon={<Zap className="w-4 h-4 text-yellow-400" />} label="Sức bền" value={stats.stamina} color="bg-yellow-500" />
        <StatBar icon={<Star className="w-4 h-4 text-pink-400" />} label="Tài năng" value={stats.talent} color="bg-pink-500" />
      </div>
    </div>
  );
}

function LevelView({ stats, points }: { stats: Stats, points: number }) {
  return (
    <div className="bg-[#0a0f16]/80 p-4 rounded-xl glow-border flex flex-col justify-center items-center">
      <div className="text-blue-400 text-sm font-bold">CẤP ĐỘ: SIÊU CẤP</div>
      <div className="text-emerald-400 text-lg font-bold">ĐIỂM: {points}</div>
      <div className="w-full bg-slate-800 h-2 rounded-full mt-2">
        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '98%' }}></div>
      </div>
    </div>
  );
}

function StatBar({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="flex items-center gap-2 text-slate-300">{icon} {label}</span>
        <span className="font-mono text-slate-400">{value}/100</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function QuestsView({ quests, onCompleteQuest, onFailQuest }: { quests: Quest[], onCompleteQuest: (q: Quest) => void, onFailQuest: (q: Quest) => void }) {
  return (
    <div className="bg-[#0a0f16]/80 p-4 rounded-xl glow-border">
      <h3 className="text-sm font-semibold text-yellow-300 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Trophy className="w-4 h-4" /> NHIỆM VỤ
      </h3>
      <div className="text-2xl font-bold text-white">{quests.length}</div>
      <div className="text-xs text-slate-400">Đang thực hiện</div>
    </div>
  );
}

function QuestSection({ title, quests, icon, onCompleteQuest, onFailQuest }: { title: string, quests: Quest[], icon: React.ReactNode, onCompleteQuest: (q: Quest) => void, onFailQuest: (q: Quest) => void }) {
  if (quests.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        {icon} {title}
      </h3>
      <div className="space-y-3">
        {quests.map(quest => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={quest.id} 
            className={`p-3 rounded-lg border ${
              quest.status === 'completed' ? 'bg-emerald-900/20 border-emerald-800/50' :
              quest.status === 'failed' ? 'bg-red-900/20 border-red-800/50' :
              'bg-slate-800/50 border-slate-700'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {quest.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {quest.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                {quest.status === 'pending' && <Circle className="w-4 h-4 text-slate-500" />}
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-medium ${quest.status !== 'pending' ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                  {quest.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1">{quest.description}</p>
                {quest.deadline && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-orange-400/80 font-medium">
                    <Clock className="w-3 h-3" /> Hạn chót: {quest.deadline}
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-3 text-xs font-mono">
                    <span className="text-emerald-400">+{quest.rewardPoints} TP</span>
                    <span className="text-red-400">-{quest.penaltyPoints} TP</span>
                  </div>
                  {quest.status === 'pending' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onCompleteQuest(quest)}
                        className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase tracking-wider font-bold rounded transition-colors"
                      >
                        Hoàn thành
                      </button>
                      <button 
                        onClick={() => onFailQuest(quest)}
                        className="px-2 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 text-[10px] uppercase tracking-wider font-bold rounded transition-colors"
                      >
                        Chưa làm
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function RewardsView({ points, onBuyItem }: { points: number, onBuyItem: (item: RewardItem) => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-xl p-4 mb-6 text-center">
        <div className="text-xs text-emerald-500 uppercase tracking-wider mb-1 font-semibold">Tích phân hiện có</div>
        <div className="text-3xl font-mono text-emerald-400 font-bold">{points}</div>
      </div>

      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Vật Phẩm Hệ Thống</h3>
      
      {STORE_ITEMS.map(item => (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={item.id} 
          className="p-3 rounded-lg border bg-slate-800/50 border-slate-700 flex flex-col gap-3"
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">{item.icon}</div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-slate-200">{item.name}</h4>
              <p className="text-xs text-slate-500 mt-1">{item.description}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1 pt-3 border-t border-slate-700/50">
            <span className="text-sm font-mono text-emerald-400 font-bold">{item.cost} TP</span>
            <button 
              onClick={() => onBuyItem(item)}
              disabled={points < item.cost}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <ShoppingCart className="w-3 h-3" /> Đổi
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function PunishmentsView({ punishments, onCompletePunishment }: { punishments: Punishment[], onCompletePunishment: (p: Punishment) => void }) {
  if (punishments.length === 0) {
    return (
      <div className="text-center text-slate-500 text-sm mt-10 italic">
        Ký Chủ đang làm rất tốt. Không có hình phạt nào.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {punishments.map(p => (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={p.id} 
          className={`p-4 rounded-lg border ${
            p.status === 'completed' ? 'bg-slate-800/30 border-slate-800' : 'bg-red-900/20 border-red-800/50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {p.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-slate-500" /> : <AlertOctagon className="w-5 h-5 text-red-500" />}
            </div>
            <div className="flex-1">
              <p className={`text-sm ${p.status === 'completed' ? 'text-slate-500 line-through' : 'text-red-200'}`}>
                {p.description}
              </p>
              {p.status === 'pending' && (
                <button 
                  onClick={() => onCompletePunishment(p)}
                  className="mt-3 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 text-xs font-medium rounded-lg transition-colors"
                >
                  Báo cáo hoàn thành
                </button>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
