/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Stats, Quest, Message, Punishment, RewardItem, Achievement, IntensityLevel } from './types';
import { createChatSession, speakText, VOICE_OPTIONS } from './services/gemini';
import { Chat, Content } from '@google/genai';
import Dashboard from './components/Dashboard';
import SystemBackground from './components/SystemBackground';
import { getLevelName } from './constants';
import { Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [stats, setStats] = useState<Stats>(() => {
    const saved = localStorage.getItem('STATS');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          intelligence: parsed.intelligence || 0,
          stamina: parsed.stamina || 0,
          strength: parsed.strength || 0,
          talent: parsed.talent !== undefined ? parsed.talent : (parsed.charisma || 0), // Migration from charisma
          focus: parsed.focus || 0,
          level: parsed.level || 1,
        };
      } catch (e) {
        console.error("Failed to parse stats", e);
      }
    }
    return {
      intelligence: 0,
      stamina: 0,
      strength: 0,
      talent: 0,
      focus: 0,
      level: 1,
    };
  });
  const [points, setPoints] = useState<number>(() => {
    const saved = localStorage.getItem('POINTS');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse points", e);
      }
    }
    return 0;
  });
  const [quests, setQuests] = useState<Quest[]>(() => {
    const saved = localStorage.getItem('QUESTS');
    let initialQuests: Quest[] = [];
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          initialQuests = parsed;
        }
      } catch (e) {
        console.error("Failed to parse quests", e);
      }
    }
    
    // Check if the guitar quest already exists
    const hasGuitarQuest = initialQuests.some((q: Quest) => q.title === "Tập đàn Guitar");
    
    if (!hasGuitarQuest) {
      initialQuests.push({
        id: "daily-guitar-practice",
        title: "Tập đàn Guitar",
        description: "Tập luyện guitar trong 15 phút để nâng cao kỹ năng âm nhạc.",
        type: "daily",
        status: "pending",
        rewardPoints: 20,
        penaltyPoints: 10,
        deadline: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
        createdAt: Date.now(),
        statRewards: {
          talent: 2,
          focus: 1
        }
      });
    }

    // Check if the YouTube quest already exists
    const hasYouTubeQuest = initialQuests.some((q: Quest) => q.title === "Làm một video trên YouTube");
    
    if (!hasYouTubeQuest) {
      initialQuests.push({
        id: "daily-youtube-video",
        title: "Làm một video trên YouTube",
        description: "Sáng tạo và đăng tải một video trên YouTube để chia sẻ kiến thức hoặc trải nghiệm.",
        type: "daily",
        status: "pending",
        rewardPoints: 50,
        penaltyPoints: 25,
        deadline: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
        createdAt: Date.now(),
        statRewards: {
          talent: 5
        }
      });
    }
    
    return initialQuests;
  });
  const [punishments, setPunishments] = useState<Punishment[]>(() => {
    const saved = localStorage.getItem('PUNISHMENTS');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse punishments", e);
      }
    }
    return [];
  });
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('ACHIEVEMENTS');
    if (saved) {
      try {
        return JSON.parse(saved).map((a: any) => ({
          ...a,
          unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : undefined
        }));
      } catch (e) { return []; }
    }
    return [];
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('CHAT_HISTORY');
    if (saved) {
      try {
        return JSON.parse(saved).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) { return []; }
    }
    return [];
  });
  const [isTyping, setIsTyping] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    return localStorage.getItem('SELECTED_VOICE') || 'Puck';
  });
  const [intensity, setIntensity] = useState<IntensityLevel>(() => {
    return (localStorage.getItem('INTENSITY') as IntensityLevel) || 'normal';
  });
  
  const [randomQuestSchedule, setRandomQuestSchedule] = useState<{ date: string, times: { time: number, triggered: boolean }[] }>(() => {
    const saved = localStorage.getItem('RANDOM_QUEST_SCHEDULE');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse randomQuestSchedule", e);
      }
    }
    return { date: '', times: [] };
  });

  const chatRef = useRef<Chat | null>(null);

  // Persist state changes
  useEffect(() => { localStorage.setItem('STATS', JSON.stringify(stats)); }, [stats]);
  useEffect(() => { localStorage.setItem('POINTS', JSON.stringify(points)); }, [points]);
  useEffect(() => { localStorage.setItem('QUESTS', JSON.stringify(quests)); }, [quests]);
  useEffect(() => { localStorage.setItem('PUNISHMENTS', JSON.stringify(punishments)); }, [punishments]);
  useEffect(() => { localStorage.setItem('ACHIEVEMENTS', JSON.stringify(achievements)); }, [achievements]);
  useEffect(() => { localStorage.setItem('CHAT_HISTORY', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem('SELECTED_VOICE', selectedVoice); }, [selectedVoice]);
  useEffect(() => { localStorage.setItem('INTENSITY', intensity); }, [intensity]);
  useEffect(() => { localStorage.setItem('RANDOM_QUEST_SCHEDULE', JSON.stringify(randomQuestSchedule)); }, [randomQuestSchedule]);

  useEffect(() => {
    // Initialize Random Quest Schedule for the day
    const today = new Date().toDateString();
    
    // Only schedule if date changed OR if schedule is empty (first run)
    if (randomQuestSchedule.date !== today || randomQuestSchedule.times.length === 0) {
      const questCount = 3; // Exactly 3 random quests per day
      const times: { time: number, triggered: boolean }[] = [];
      
      // Available windows: 06:30-10:30 (4h) and 18:00-22:00 (4h)
      // Total 8 hours window
      
      for (let i = 0; i < questCount; i++) {
        // Pick a random slot in the 8-hour window
        const randomOffset = Math.random() * 8; 
        let hour;
        
        if (randomOffset < 4) {
          // Morning slot (6.5 + offset)
          hour = 6.5 + randomOffset;
        } else {
          // Evening slot (18 + (offset - 4))
          hour = 18 + (randomOffset - 4);
        }
        
        const date = new Date();
        date.setHours(Math.floor(hour));
        date.setMinutes(Math.floor((hour % 1) * 60));
        date.setSeconds(0);
        date.setMilliseconds(0);
        
        times.push({ time: date.getTime(), triggered: false });
      }

      // Sort times
      times.sort((a, b) => a.time - b.time);

      setRandomQuestSchedule({
        date: today,
        times: times
      });
      
      console.log(`Scheduled ${questCount} random quests for today:`, times.map(t => new Date(t.time).toLocaleTimeString()));
    }
  }, [randomQuestSchedule.date]); // Removed stats.level dependency to avoid re-scheduling on stat changes

  useEffect(() => {
    // Check for random quest triggers
    const timer = setInterval(() => {
      const now = Date.now();
      const today = new Date().toDateString();

      if (randomQuestSchedule.date === today) {
        const updatedTimes = randomQuestSchedule.times.map(t => {
          if (!t.triggered && now >= t.time && now < t.time + 600000) { // Trigger within 10 mins of scheduled time
            // Trigger Quest
            requestRandomQuest();
            return { ...t, triggered: true };
          }
          return t;
        });

        // Only update state if something changed
        if (JSON.stringify(updatedTimes) !== JSON.stringify(randomQuestSchedule.times)) {
           setRandomQuestSchedule(prev => ({ ...prev, times: updatedTimes }));
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(timer);
  }, [randomQuestSchedule]);

  useEffect(() => {
    // Check for expired punishments
    const timer = setInterval(() => {
      const now = Date.now();
      
      setPunishments(prev => {
        let hasChanges = false;
        const updated = prev.map(p => {
          if (p.status === 'pending' && p.deadline && now > p.deadline) {
            hasChanges = true;
            return { ...p, status: 'failed' as Punishment['status'] };
          }
          return p;
        }).filter(p => {
          // Remove if deadline passed by at least 10 seconds
          if (p.deadline && now > p.deadline + 10000) {
            hasChanges = true;
            return false;
          }
          return true;
        });
        return hasChanges ? updated : prev;
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(timer);
  }, []);

  // Apply penalties for failed punishments
  useEffect(() => {
    const newlyFailed = punishments.filter(p => p.status === 'failed' && !p.penaltyApplied);
    
    if (newlyFailed.length > 0) {
      const count = newlyFailed.length;
      
      // Apply penalties
      setStats(prev => ({
        intelligence: Math.max(0, prev.intelligence - 5 * count),
        stamina: Math.max(0, prev.stamina - 5 * count),
        strength: Math.max(0, prev.strength - 5 * count),
        talent: Math.max(0, prev.talent - 5 * count),
        focus: Math.max(0, prev.focus - 5 * count),
        level: prev.level
      }));
      
      setPoints(prev => Math.max(0, prev - 50 * count));
      
      // Mark as applied to prevent loop
      setPunishments(prev => prev.map(p => 
        newlyFailed.find(nf => nf.id === p.id) ? { ...p, penaltyApplied: true } : p
      ));

      handleSystemMessage(`⚠️ CẢNH BÁO: Ký Chủ đã thất bại trong việc hoàn thành ${count} hình phạt! 
      Hậu quả: Trừ ${5 * count} điểm tất cả chỉ số và ${50 * count} Tích phân.`);
    }
  }, [punishments]);

  useEffect(() => {
    // Convert existing messages to history format for Gemini
    const history: Content[] = messages.map(msg => ({
      role: msg.sender === 'host' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    chatRef.current = createChatSession(history);
    
    // Only send initial greeting if no history exists
    if (messages.length === 0) {
      // Initial greeting
      handleSystemMessage("Hệ thống khởi động... Đang kết nối với Ký Chủ Trần Huy...\n\nKý Chủ, chào mừng ngài đến với Hệ Thống Học Bá. Để bắt đầu quá trình bồi dưỡng, yêu cầu ngài cung cấp ngay lập tức các thông tin sau:\n1. Mục tiêu học tập cụ thể.\n2. Tình trạng thể chất hiện tại.\n3. Mục tiêu thể chất.\n4. Thời khóa biểu cố định trong tuần.");
      
      // Automatically send the provided info if it exists
      const providedInfo = `
Mục tiêu học tập cụ thể: Đạt điểm 8, 9 trong tất cả các môn.
Tình trạng thể chất hiện tại: Chiều cao 1m67, cân nặng 45kg (hơi gầy), khả năng vận động sơ bộ kém.
Mục tiêu thể chất: Tăng cơ, tăng cân, cải thiện sức bền bằng cách hít xà đơn.
Thời khóa biểu cố định trong tuần: 
- Giờ học chính khóa: 10h30 sáng - 18h tối.
- Giờ tự học: 19h30 tối - 21h tối.
- Giờ ngủ: 22h22 tối - 6h22 sáng (đảm bảo 8 tiếng).
`;
      handleSendMessage(`Đây là thông tin chi tiết của tôi: ${providedInfo}`);
    } else {
      // Check for daily quest expiration on new day
      const today = new Date().toDateString();
      const lastLogin = localStorage.getItem('LAST_LOGIN_DATE');

      if (lastLogin && lastLogin !== today) {
        // Identify failed daily quests (created before today and pending)
        // Default createdAt to Date.now() for migration to avoid mass failing old quests
        const failedQuests = quests.filter(q => 
          (q.type === 'daily' || q.type === 'random') && 
          q.status === 'pending' && 
          new Date(q.createdAt || Date.now()).toDateString() !== today
        );

        if (failedQuests.length > 0) {
          // Mark failed quests as 'failed' status
          setQuests(prev => prev.map(q => 
            ((q.type === 'daily' || q.type === 'random') && q.status === 'pending' && new Date(q.createdAt || Date.now()).toDateString() !== today)
              ? { ...q, status: 'failed' }
              : q
          ));
          
          // Add punishment for each failed quest
          failedQuests.forEach(q => {
            setPunishments(prev => [...prev, {
              id: Math.random().toString(36).substring(7),
              description: `Hình phạt cho nhiệm vụ thất bại: ${q.title}`,
              status: 'pending' as const,
              duration: 1440, // 24 hours
              deadline: Date.now() + 1440 * 60000,
              penaltyApplied: false
            } as Punishment]);
          });

          // Notify AI to generate punishments and new daily quests
          handleSendMessage(`[System Report: New Day Detected (${today}). User failed ${failedQuests.length} quests from previous days: ${failedQuests.map(q => q.title).join(', ')}. Punishments have been added for 24 hours. Please generate ${2 + stats.level} new daily quests for today based on Level ${stats.level} and Intensity ${intensity}.]`, 0, true);
        } else {
           // Request new daily quests
           handleSendMessage(`[System Report: New Day Detected (${today}). User completed all previous daily quests (or none existed). Please generate ${2 + stats.level} new daily quests for today based on Level ${stats.level} and Intensity ${intensity}.]`, 0, true);
        }
        
        localStorage.setItem('LAST_LOGIN_DATE', today);
      } else if (!lastLogin) {
        localStorage.setItem('LAST_LOGIN_DATE', today);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const expiredQuests = quests.filter(q => q.type === 'random' && q.status === 'pending' && q.deadline && now > new Date(q.deadline).getTime());
      
      if (expiredQuests.length > 0) {
        setQuests(prev => prev.map(q => 
          (q.type === 'random' && q.status === 'pending' && q.deadline && now > new Date(q.deadline).getTime())
            ? { ...q, status: 'failed' }
            : q
        ));
        
        expiredQuests.forEach(q => {
          setPunishments(prev => [...prev, {
            id: Math.random().toString(36).substring(7),
            description: `Hình phạt cho nhiệm vụ đột xuất thất bại: ${q.title}`,
            status: 'pending' as const,
            duration: 1440, // 24 hours
            deadline: Date.now() + 1440 * 60000,
            penaltyApplied: false
          } as Punishment]);
        });
        
        handleSendMessage(`[System Report: User failed ${expiredQuests.length} random quests: ${expiredQuests.map(q => q.title).join(', ')}. Punishments have been added for 24 hours.]`, 0, true);
      }
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, [quests]);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (chatRef.current && selectedVoice) {
      const voice = VOICE_OPTIONS.find(v => v.id === selectedVoice);
      if (voice) {
        handleSendMessage(`[System Note: User changed voice to ${voice.name} (${voice.gender}). New persona style: ${voice.style}. Please adapt your tone and personality to match this style immediately.]`, 0, true);
      }
    }
  }, [selectedVoice]);

  const handleSystemMessage = (text: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random(),
      sender: 'system',
      text,
      timestamp: new Date()
    }]);
  };

  const handleSendMessage = async (text: string, retryCount = 0, isHidden = false) => {
    if (!text.trim() || !chatRef.current) return;

    const userMsg: Message = {
      id: Date.now().toString() + Math.random(),
      sender: 'host',
      text,
      timestamp: new Date()
    };
    
    // Only add user message if it's the first attempt and not hidden
    if (retryCount === 0 && !isHidden) {
      setMessages(prev => [...prev, userMsg]);
    }
    
    setIsTyping(true);

    try {
      // Inject current stats into the message context for the AI
      let baseDailyQuests = 2 + stats.level;
      let finalDailyQuests = baseDailyQuests;
      let intensityNote = "";

      if (intensity === 'hard') {
        finalDailyQuests += 2;
        intensityNote = "Intensity: HARD (+2 Daily Quests, Increased Difficulty)";
      } else if (intensity === 'hell') {
        finalDailyQuests *= 3;
        intensityNote = "Intensity: HELL (x3 Daily Quests, Extreme Difficulty & Duration)";
      } else {
        intensityNote = "Intensity: NORMAL (Standard Difficulty)";
      }

      const contextMessage = `[System Note: Current Stats: Intelligence=${stats.intelligence}, Stamina=${stats.stamina}, Strength=${stats.strength}, Talent=${stats.talent}, Focus=${stats.focus}, Level=${stats.level}. Points=${points}. Quests Pending=${quests.filter(q => q.status === 'pending').length}. Achievements Unlocked=${achievements.length}.
      
      QUEST RULES (Level ${stats.level}, ${intensityNote}):
      1. Daily Quests Quantity: ${finalDailyQuests} (Base: ${baseDailyQuests}).
      2. Monthly Quests: Increase quantity and difficulty based on level.
      3. Intensity Mode: ${intensity.toUpperCase()}. Adjust study time and workout intensity accordingly.
      ] ${text}`;
      
      const response = await chatRef.current.sendMessage({ message: contextMessage });
      
      // Handle function calls
      if (response.functionCalls && response.functionCalls.length > 0) {
        const functionResponses = [];
        for (const call of response.functionCalls) {
          if (call.name === 'update_stats') {
            const args = call.args as any;
            
            // Calculate new stats based on current stats + updates
            // If args provides a value, use it (clamped to 100). If not, keep current value.
            // Note: The tool description implies absolute values, but we can treat them as such.
            // If the AI wants to increment, it should calculate based on the context provided.
            
            const newStats = {
              intelligence: args.intelligence !== undefined ? Math.min(args.intelligence, 100) : stats.intelligence,
              stamina: args.stamina !== undefined ? Math.min(args.stamina, 100) : stats.stamina,
              strength: args.strength !== undefined ? Math.min(args.strength, 100) : stats.strength,
              talent: args.talent !== undefined ? Math.min(args.talent, 100) : stats.talent,
              focus: args.focus !== undefined ? Math.min(args.focus, 100) : stats.focus,
              level: stats.level,
            };
            
            // Check for level up condition: All stats >= 100
            // Removed auto level up. Waiting for user manual confirmation via Dashboard.
            if (newStats.intelligence >= 100 && newStats.stamina >= 100 && newStats.strength >= 100 && newStats.talent >= 100 && newStats.focus >= 100) {
                 // Optional: Notify user they are ready to level up if not already notified?
                 // For now, just let the UI handle the button.
            }
            
            setStats(newStats);
            functionResponses.push({
              id: call.id,
              name: call.name,
              response: { result: "Stats updated successfully." }
            });
          } else if (call.name === 'add_quest') {
            const args = call.args as any;
            let deadline = args.deadline;
            if (args.type === 'random') {
              // Enforce at least 30 minutes for random quests
              deadline = Date.now() + 30 * 60000;
            }
            setQuests(prev => [...prev, {
              id: Math.random().toString(36).substring(7),
              title: args.title,
              description: args.description,
              type: args.type as any,
              status: 'pending',
              rewardPoints: args.rewardPoints,
              penaltyPoints: args.penaltyPoints,
              deadline: deadline,
              createdAt: Date.now(),
              statRewards: args.statRewards,
            }]);
            functionResponses.push({
              id: call.id,
              name: call.name,
              response: { result: "Quest added successfully." }
            });
          } else if (call.name === 'update_quest_status') {
            const args = call.args as any;
            setQuests(prev => prev.map(q => 
              q.title.toLowerCase().includes(args.questTitle.toLowerCase()) 
                ? { ...q, status: args.status } 
                : q
            ));
            functionResponses.push({
              id: call.id,
              name: call.name,
              response: { result: "Quest status updated successfully." }
            });
          } else if (call.name === 'update_points') {
            const args = call.args as any;
            setPoints(prev => prev + args.amount);
            functionResponses.push({
              id: call.id,
              name: call.name,
              response: { result: "Points updated successfully." }
            });
          } else if (call.name === 'add_punishment') {
            const args = call.args as any;
            const duration = args.duration || 60; // Default 60 minutes if not specified
            setPunishments(prev => [...prev, {
              id: Math.random().toString(36).substring(7),
              description: args.description,
              status: 'pending',
              duration: duration,
              deadline: Date.now() + duration * 60000,
              penaltyApplied: false
            }]);
            functionResponses.push({
              id: call.id,
              name: call.name,
              response: { result: `Punishment added successfully with ${duration} minutes deadline.` }
            });
          } else if (call.name === 'update_punishment_status') {
            const args = call.args as any;
            setPunishments(prev => prev.map(p => 
              p.description.toLowerCase().includes(args.punishmentDescription.toLowerCase()) 
                ? { ...p, status: args.status } 
                : p
            ));
            functionResponses.push({
              id: call.id,
              name: call.name,
              response: { result: "Punishment status updated successfully." }
            });
          } else if (call.name === 'unlock_achievement') {
            const args = call.args as any;
            // Check if achievement already exists to prevent duplicates
            const exists = achievements.some(a => a.title === args.title);
            if (!exists) {
              setAchievements(prev => [...prev, {
                id: Math.random().toString(36).substring(7),
                title: args.title,
                description: args.description,
                type: args.type,
                icon: args.icon,
                unlockedAt: new Date()
              }]);
              handleSystemMessage(`🏆 CHÚC MỪNG! Ký Chủ đã mở khóa thành tựu mới: [${args.title}] - ${args.description}`);
            }
            functionResponses.push({
              id: call.id,
              name: call.name,
              response: { result: "Achievement unlocked successfully." }
            });
          }
        }
        
        if (functionResponses.length > 0) {
           const followUp = await chatRef.current.sendMessage({
             message: `[Hệ thống nội bộ: Đã thực thi các lệnh sau thành công: ${functionResponses.map(f => f.name).join(', ')}. Hãy tiếp tục phản hồi Ký Chủ.]`
           });
           if (followUp.text) {
             handleSystemMessage(followUp.text);
           }
        }
      } else if (response.text) {
        handleSystemMessage(response.text);
        const audioBase64 = await speakText(response.text, selectedVoice);
        if (audioBase64) {
          try {
            const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
            audio.play().catch(e => {
              if (e.name === 'NotAllowedError') {
                console.log("Autoplay blocked, user needs to interact.");
              } else {
                console.error("Audio playback error:", e);
              }
            });
          } catch (e) {
            console.error("Failed to create audio object:", e);
          }
        }
      }
    } catch (error: any) {
      // Parse error message safely
      let errorMessage = '';
      let errorStatus = '';
      
      try {
        if (error?.error?.message) {
          errorMessage = error.error.message;
          errorStatus = error.error.status || '';
        } else if (error?.message) {
          errorMessage = error.message;
        } else {
          errorMessage = JSON.stringify(error);
        }
      } catch (e) {
        errorMessage = "Unknown error";
      }

      const isQuotaExceeded = 
        errorMessage.toLowerCase().includes('quota') || 
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        errorStatus === 'RESOURCE_EXHAUSTED' ||
        error?.status === 'RESOURCE_EXHAUSTED';
      
      const isRateLimit = 
        error?.status === 429 || 
        error?.code === 429 || 
        errorMessage.includes('429') ||
        errorMessage.toLowerCase().includes('too many requests');

      const isOverloaded = 
        error?.status === 503 || 
        errorMessage.includes('503') ||
        errorMessage.toLowerCase().includes('overloaded');

      if (isQuotaExceeded) {
         console.warn("Quota exceeded:", errorMessage);
         handleSystemMessage("⚠️ CẢNH BÁO HỆ THỐNG: Năng lượng xử lý đã cạn kiệt (Hết Quota API). Hệ thống buộc phải chuyển sang chế độ ngủ đông. Vui lòng quay lại sau!");
         return;
      }

      if ((isRateLimit || isOverloaded) && retryCount < 3) {
        console.log(`Rate limit/Overload detected. Retrying... (${retryCount + 1}/3)`);
        const delay = Math.pow(2, retryCount) * 2000; // Exponential backoff: 2s, 4s, 8s
        handleSystemMessage(`⚠️ Hệ thống đang quá tải. Đang thử kết nối lại sau ${delay/1000} giây... (Lần ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return handleSendMessage(text, retryCount + 1, isHidden);
      }
      
      console.error("Error sending message:", error);
      handleSystemMessage(`⚠️ LỖI HỆ THỐNG: Không thể kết nối. Chi tiết: ${errorMessage.substring(0, 100)}...`);
    } finally {
      setIsTyping(false);
    }
  };

  const requestRandomQuest = () => {
    handleSendMessage("Hệ thống, hãy giao cho tôi một nhiệm vụ đột xuất (Random Quest) ngay bây giờ dựa trên thời khóa biểu và mục tiêu của tôi.");
  };

  // Automatically request random quest every hour during free time
  // Replaced by specific schedule logic above
  /*
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      
      // Define free time: 06:00-10:30 and 18:00-22:00
      const isFreeTime = (hour >= 6 && hour < 10) || (hour >= 18 && hour < 22);
      
      if (isFreeTime) {
        requestRandomQuest();
      }
    }, 3600000); // 1 hour
    
    return () => clearInterval(timer);
  }, []);
  */

  const handleBuyItem = (item: RewardItem) => {
    handleSendMessage(`Hệ thống, tôi muốn dùng ${item.cost} Tích phân để đổi lấy vật phẩm: ${item.name}.`);
  };

  const handleCompletePunishment = (p: Punishment) => {
    handleSendMessage(`Hệ thống, tôi báo cáo đã hoàn thành hình phạt: ${p.description}. Hãy kiểm tra và cập nhật trạng thái.`);
  };

  const handleCompleteQuest = (q: Quest) => {
    // 1. Remove quest locally
    setQuests(prev => prev.filter(quest => quest.id !== q.id));

    // 2. Add points locally
    setPoints(prev => prev + q.rewardPoints);

    // 3. Update stats locally if rewards exist
    let statUpdateMsg = "";
    if (q.statRewards) {
      // Diminishing returns logic: Higher levels gain stats slower
      // Formula: Multiplier = 1 / (1 + (Level - 1) * 0.3)
      const decayFactor = 1 / (1 + (stats.level - 1) * 0.3);
      
      // Intensity Multiplier: Harder modes give more stats
      // Normal: 1.0x
      // Hard: 1.5x
      // Hell: 2.5x
      const intensityMultiplier = intensity === 'hell' ? 2.5 : intensity === 'hard' ? 1.5 : 1.0;
      
      // BOOST: 10x multiplier requested by user for faster progression
      const baseMultiplier = 10;

      const applyReward = (val: number) => Math.max(1, Math.round(val * decayFactor * intensityMultiplier * baseMultiplier));

      const actualRewards = {
        intelligence: q.statRewards.intelligence ? applyReward(q.statRewards.intelligence) : 0,
        stamina: q.statRewards.stamina ? applyReward(q.statRewards.stamina) : 0,
        strength: q.statRewards.strength ? applyReward(q.statRewards.strength) : 0,
        talent: q.statRewards.talent ? applyReward(q.statRewards.talent) : 0,
        focus: q.statRewards.focus ? applyReward(q.statRewards.focus) : 0,
      };

      setStats(prev => {
        const newStats = { ...prev };
        if (actualRewards.intelligence) newStats.intelligence = Math.min(100, newStats.intelligence + actualRewards.intelligence);
        if (actualRewards.stamina) newStats.stamina = Math.min(100, newStats.stamina + actualRewards.stamina);
        if (actualRewards.strength) newStats.strength = Math.min(100, newStats.strength + actualRewards.strength);
        if (actualRewards.talent) newStats.talent = Math.min(100, newStats.talent + actualRewards.talent);
        if (actualRewards.focus) newStats.focus = Math.min(100, newStats.focus + actualRewards.focus);
        
        return newStats;
      });
      
      statUpdateMsg = Object.entries(actualRewards)
        .filter(([_, val]) => val > 0)
        .map(([key, value]) => `+${value} ${key === 'intelligence' ? 'Trí lực' : key === 'stamina' ? 'Sức bền' : key === 'strength' ? 'Thể lực' : key === 'talent' ? 'Tài năng' : 'Tập trung'}`)
        .join(', ');

      if (stats.level > 1 && decayFactor < 0.9) {
        statUpdateMsg += ` (Giảm ${Math.round((1 - decayFactor) * 100)}% do cấp cao`;
      }
      
      if (intensity !== 'normal') {
          statUpdateMsg += `${stats.level > 1 && decayFactor < 0.9 ? ', ' : ' ('}Bonus ${intensity === 'hard' ? 'Khó' : 'Địa Ngục'} x${intensityMultiplier})`;
      } else if (stats.level > 1 && decayFactor < 0.9) {
          statUpdateMsg += `)`;
      }
    }

    // 4. Notify AI
    let message = `[System Report: User manually completed quest "${q.title}". Local state updated: Status=Completed, Points=+${q.rewardPoints}`;
    if (statUpdateMsg) {
      message += `, Stats=[${statUpdateMsg}]`;
    }
    message += `.] Hệ thống, tôi đã hoàn thành nhiệm vụ "${q.title}".`;
    
    if (!q.statRewards) {
       message += ` Tuy nhiên, nhiệm vụ này chưa có phần thưởng chỉ số cụ thể. Dựa vào nội dung nhiệm vụ, hãy đánh giá và TẶNG THÊM chỉ số phù hợp cho tôi nếu xứng đáng (sử dụng tool update_stats).`;
    } else {
       message += ` Đã nhận được tích phân và chỉ số thưởng. Hãy đưa ra lời nhận xét.`;
    }

    handleSendMessage(message);
  };

  const handleFailQuest = (q: Quest) => {
    // 1. Remove quest locally
    setQuests(prev => prev.filter(quest => quest.id !== q.id));
    
    // 2. Add punishment
    setPunishments(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      description: `Hình phạt cho nhiệm vụ thất bại: ${q.title}`,
      status: 'pending' as const,
      duration: 1440, // 24 hours
      deadline: Date.now() + 1440 * 60000,
      penaltyApplied: false
    } as Punishment]);
    
    handleSendMessage(`Hệ thống, tôi báo cáo chưa hoàn thành nhiệm vụ: "${q.title}". Hình phạt 24 giờ đã được áp dụng.`);
  };

  const handleLevelUp = () => {
    setStats(prev => {
      if (prev.level >= 10) return prev;
      
      const newLevel = prev.level + 1;
      const newLevelName = getLevelName(newLevel);
      
      handleSystemMessage(`🎉 CHÚC MỪNG KÝ CHỦ! Ngài đã chính thức thăng cấp lên [${newLevelName}] (Cấp ${newLevel})! 
      
      Toàn bộ chỉ số đã được reset về 0 để bắt đầu hành trình chinh phục đỉnh cao mới.
      
      ⚠️ CẬP NHẬT HỆ THỐNG:
      - Số lượng nhiệm vụ hàng ngày tăng lên: ${2 + newLevel}.
      - Cường độ luyện tập và học tập sẽ tăng cao hơn. Hãy chuẩn bị tinh thần!`);
      
      return {
        ...prev,
        level: newLevel,
        intelligence: 0,
        stamina: 0,
        strength: 0,
        talent: 0,
        focus: 0
      };
    });
  };

  const handleSetIntensity = (newIntensity: IntensityLevel) => {
    setIntensity(newIntensity);
    
    let intensityNote = "";
    let questAdjustment = "";
    
    if (newIntensity === 'hard') {
      intensityNote = "HARD (+5 Daily Quests, Double Study Time, Heavy Workout)";
      questAdjustment = "Generate 5 additional difficult daily quests immediately. Increase duration/reps of existing pending quests significantly.";
    } else if (newIntensity === 'hell') {
      intensityNote = "HELL (x3 Daily Quests, x5 Study Time, x5 Workout Intensity)";
      questAdjustment = "Generate additional daily quests to match x3 quantity. Set all quests to extreme difficulty (e.g., x5 study duration, x5 workout reps).";
    } else {
      intensityNote = "NORMAL (Standard Difficulty)";
      questAdjustment = "Adjust future quests to standard difficulty.";
    }

    handleSendMessage(`[System Update: User changed intensity to ${newIntensity.toUpperCase()}. Rules: ${intensityNote}. Action Required: ${questAdjustment} Update the quest list now.]`, 0, true);
  };

  const [activeTab, setActiveTab] = useState('status');

  return (
    <div className="h-[100dvh] bg-[#05070a] text-slate-300 font-sans flex flex-col md:flex-row overflow-hidden relative">
      <SystemBackground />
      
      {/* Dashboard Panel */}
      <Dashboard 
        stats={stats}
        quests={quests} 
        punishments={punishments} 
        achievements={achievements}
        points={points} 
        onBuyItem={handleBuyItem}
        onCompletePunishment={handleCompletePunishment}
        onCompleteQuest={handleCompleteQuest}
        onFailQuest={handleFailQuest}
        messages={messages}
        onSendMessage={handleSendMessage}
        isTyping={isTyping}
        selectedVoice={selectedVoice}
        onSelectVoice={setSelectedVoice}
        onLevelUp={handleLevelUp}
        intensity={intensity}
        onSetIntensity={handleSetIntensity}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Floating Action Button for Random Quest - Hide in Chat */}
      <AnimatePresence>
        {activeTab !== 'chat' && (
          <motion.button 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={requestRandomQuest}
            disabled={isTyping}
            className="absolute bottom-6 right-6 bg-orange-500 hover:bg-orange-400 text-white p-4 rounded-full shadow-lg shadow-orange-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 group z-20"
            title="Yêu cầu Nhiệm vụ đột xuất"
          >
            <Zap className="w-6 h-6" />
            <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700">
              Nhiệm vụ đột xuất
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
