import React from 'react';
import { Stats } from '../types';
import { User, Brain, Heart, Zap, Star, Target, Shield } from 'lucide-react';

const levelNames = [
  "Học Tra", "Học Giả", "Học Mướn", "Học Cụ", "Học Miệt",
  "Học Bá", "Học Quái", "Học Thánh", "Học Đế", "Học Thần"
];

function getLevelName(level: number) {
  // Map level 1-10 to index 0-9. Handle 0 just in case.
  const index = Math.max(0, Math.min(level - 1, 9));
  return levelNames[index] || "Học Thần";
}

export default function StatusPanel({ stats, points }: { stats: Stats, points: number }) {
  // Ensure we display at least level 1
  const displayLevel = Math.max(1, stats.level);
  
  return (
    <div className="w-full md:w-80 bg-[#111827] border-r border-slate-800 p-6 flex flex-col shrink-0 overflow-y-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-blue-900/50 border-2 border-blue-500 flex items-center justify-center">
          <User className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Trần Huy</h2>
          <p className="text-sm text-blue-400 font-mono">{getLevelName(displayLevel)}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
              Cấp {displayLevel} / 10
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 mb-8">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-semibold">Tích phân</div>
        <div className="text-3xl font-mono text-emerald-400 font-bold">{points}</div>
      </div>

      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Shield className="w-4 h-4" /> Bảng Chỉ Số
      </h3>
      
      <div className="space-y-4">
        <StatBar icon={<Brain className="w-4 h-4 text-purple-400" />} label="Trí lực" value={stats.intelligence} color="bg-purple-500" />
        <StatBar icon={<Heart className="w-4 h-4 text-red-400" />} label="Thể lực" value={stats.strength} color="bg-red-500" />
        <StatBar icon={<Zap className="w-4 h-4 text-yellow-400" />} label="Sức bền" value={stats.stamina} color="bg-yellow-500" />
        <StatBar icon={<Star className="w-4 h-4 text-pink-400" />} label="Tài năng" value={stats.talent} color="bg-pink-500" />
        <StatBar icon={<Target className="w-4 h-4 text-blue-400" />} label="Tập trung" value={stats.focus} color="bg-blue-500" />
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
