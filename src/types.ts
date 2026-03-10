export type Stats = {
  intelligence: number;
  stamina: number;
  strength: number;
  talent: number;
  focus: number;
  level: number;
};

export type Quest = {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'monthly' | 'random';
  status: 'pending' | 'completed' | 'failed';
  rewardPoints: number;
  penaltyPoints: number;
  deadline?: string | number;
  createdAt?: number;
  statRewards?: {
    intelligence?: number;
    stamina?: number;
    strength?: number;
    talent?: number;
    focus?: number;
  };
};

export type Punishment = {
  id: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  deadline?: number;
  penaltyApplied?: boolean;
  duration?: number; // Duration in minutes, for display/reference
};

export type RewardItem = {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
};

export type Message = {
  id: string;
  sender: 'system' | 'host';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
};

export type VoiceOption = {
  id: string;
  name: string;
  gender: 'Nam' | 'Nữ';
  style: string;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  type: 'fitness' | 'intellect' | 'general';
};

export type IntensityLevel = 'normal' | 'hard' | 'hell';


