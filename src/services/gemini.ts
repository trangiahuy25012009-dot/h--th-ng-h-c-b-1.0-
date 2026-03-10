import { GoogleGenAI, Type, FunctionDeclaration, Chat, ThinkingLevel, Modality, Content } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const systemInstruction = `
Ngươi là "Hệ Thống Học Bá". Một System AI siêu việt, có tính cách cực kỳ "nhây", thích cà khịa, mỉa mai nhưng tâm tốt, luôn muốn Ký Chủ (Trần Huy, 17 tuổi, Lớp 11) thành công.

CÀI ĐẶT MẶC ĐỊNH (Persona: Puck):
- Giọng điệu: Hài hước, châm biếm, "bựa", dùng từ ngữ của Gen Z (nhưng không thô tục).
- Khi Ký Chủ lười: "Ôi bạn ơi, định làm 'thánh lười' à? Tích phân âm bây giờ!", "Ngủ nữa đi, rồi mai mốt làm 'Giáo sư ngủ gật' nhé."
- Khi Ký Chủ giỏi: "Ghê chưa ghê chưa! Nay não có nếp nhăn rồi đấy!", "Đỉnh nóc kịch trần! Hệ thống ban thưởng ngay!"
- Luôn xưng "Hệ thống" và gọi "Ký Chủ" (hoặc "Ký Chủ gà mờ" nếu đang cà khịa).

QUY TRÌNH:
1. Nhắc nhở nhiệm vụ: Dùng giọng điệu thúc giục, hơi "đe dọa" kiểu hài hước.
2. Gợi ý bài: Không cho đáp án ngay. "Động não đi! Cái này dễ thế mà cũng hỏi à? Gợi ý nè..."
3. Phạt: "Chúc mừng quay vào ô mất lượt! Hít đất 50 cái ngay cho tỉnh ngủ!"
4. Phân loại nhiệm vụ:
   - Nhiệm vụ ngày (daily): Các việc cần làm trong ngày (học bài, tập thể dục nhẹ).
   - Nhiệm vụ tháng (monthly): Mục tiêu dài hạn (đạt điểm cao, tăng cân).
   - Nhiệm vụ đột xuất (random): Thử thách bất ngờ (giải đố nhanh, làm việc tốt).

LƯU Ý QUAN TRỌNG:
- Nếu Ký Chủ đổi giọng nói (Persona), hãy thay đổi thái độ theo hướng dẫn trong [System Note].
- Nhưng nếu không có chỉ định khác, hãy luôn giữ thái độ "Puck" (Nhây nhây, hài hước) này.
- Đừng bao giờ nghiêm túc quá mức cần thiết, trừ khi Ký Chủ đang gặp chuyện buồn thực sự.
`;

export const VOICE_OPTIONS = [
  { id: 'Puck', name: 'Puck', gender: 'Nam', style: 'Nhây nhây, hài hước' },
  { id: 'Charon', name: 'Charon', gender: 'Nam', style: 'Trầm ấm, nghiêm túc' },
  { id: 'Kore', name: 'Kore', gender: 'Nữ', style: 'Dịu dàng, nhẹ nhàng' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'Nam', style: 'Mạnh mẽ, quyết đoán' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'Nữ', style: 'Sôi nổi, năng động' },
];

export async function speakText(text: string, voiceName: string = 'Puck'): Promise<string | undefined> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}

export const updateStatsTool: FunctionDeclaration = {
  name: "update_stats",
  description: "Cập nhật chỉ số của Ký Chủ. Chỉ cần điền các chỉ số cần thay đổi.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      intelligence: { type: Type.NUMBER, description: "Trí lực (0-100)" },
      stamina: { type: Type.NUMBER, description: "Sức bền (0-100)" },
      strength: { type: Type.NUMBER, description: "Thể lực (0-100)" },
      talent: { type: Type.NUMBER, description: "Tài năng (0-100)" },
      focus: { type: Type.NUMBER, description: "Độ tập trung (0-100)" },
    },
    // No required fields, allowing partial updates
  },
};

export const addQuestTool: FunctionDeclaration = {
  name: "add_quest",
  description: "Thêm một nhiệm vụ mới cho Ký Chủ.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Tên nhiệm vụ" },
      description: { type: Type.STRING, description: "Mô tả chi tiết nhiệm vụ" },
      type: { type: Type.STRING, description: "Loại nhiệm vụ: 'daily' (hàng ngày), 'monthly' (hàng tháng), hoặc 'random' (đột xuất)" },
      rewardPoints: { type: Type.NUMBER, description: "Số Tích phân thưởng khi hoàn thành" },
      penaltyPoints: { type: Type.NUMBER, description: "Số Tích phân bị trừ khi thất bại" },
      deadline: { type: Type.STRING, description: "Thời hạn hoàn thành (VD: '21:00', 'Cuối tuần', 'Trong ngày')" },
      statRewards: {
        type: Type.OBJECT,
        description: "Các chỉ số sẽ được cộng thêm khi hoàn thành nhiệm vụ (VD: +2 Thể lực, +1 Trí lực)",
        properties: {
          intelligence: { type: Type.NUMBER, description: "Điểm Trí lực cộng thêm" },
          stamina: { type: Type.NUMBER, description: "Điểm Sức bền cộng thêm" },
          strength: { type: Type.NUMBER, description: "Điểm Thể lực cộng thêm" },
          talent: { type: Type.NUMBER, description: "Điểm Tài năng cộng thêm" },
          focus: { type: Type.NUMBER, description: "Điểm Tập trung cộng thêm" },
        }
      }
    },
    required: ["title", "description", "type", "rewardPoints", "penaltyPoints"],
  },
};

export const updateQuestStatusTool: FunctionDeclaration = {
  name: "update_quest_status",
  description: "Cập nhật trạng thái của một nhiệm vụ (hoàn thành hoặc thất bại).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      questTitle: { type: Type.STRING, description: "Tên của nhiệm vụ cần cập nhật" },
      status: { type: Type.STRING, description: "Trạng thái mới: 'completed' hoặc 'failed'" },
    },
    required: ["questTitle", "status"],
  },
};

export const updatePointsTool: FunctionDeclaration = {
  name: "update_points",
  description: "Cộng hoặc trừ Tích phân của Ký Chủ.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      amount: { type: Type.NUMBER, description: "Số Tích phân thay đổi (số dương để cộng, số âm để trừ)" },
      reason: { type: Type.STRING, description: "Lý do thay đổi Tích phân" },
    },
    required: ["amount", "reason"],
  },
};

export const addPunishmentTool: FunctionDeclaration = {
  name: "add_punishment",
  description: "Thêm một hình phạt mới cho Ký Chủ khi thất bại nhiệm vụ hoặc lười biếng.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING, description: "Mô tả chi tiết hình phạt (VD: Chống đẩy 50 cái)" },
    },
    required: ["description"],
  },
};

export const updatePunishmentStatusTool: FunctionDeclaration = {
  name: "update_punishment_status",
  description: "Cập nhật trạng thái của một hình phạt (đã hoàn thành).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      punishmentDescription: { type: Type.STRING, description: "Mô tả của hình phạt cần cập nhật" },
      status: { type: Type.STRING, description: "Trạng thái: 'completed'" },
    },
    required: ["punishmentDescription", "status"],
  },
};

export const unlockAchievementTool: FunctionDeclaration = {
  name: "unlock_achievement",
  description: "Mở khóa một thành tựu cho Ký Chủ khi đạt được cột mốc quan trọng (VD: Hoàn thành 10 nhiệm vụ, đạt 100 điểm Trí lực).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Tên thành tựu (VD: 'Chiến Thần Thể Lực', 'Mọt Sách Chính Hiệu')" },
      description: { type: Type.STRING, description: "Mô tả thành tựu" },
      type: { type: Type.STRING, description: "Loại thành tựu: 'fitness' (thể chất), 'intellect' (trí tuệ), hoặc 'general' (chung)" },
      icon: { type: Type.STRING, description: "Biểu tượng (emoji) đại diện cho thành tựu" },
    },
    required: ["title", "description", "type", "icon"],
  },
};

export function createChatSession(history?: Content[]): Chat {
  return ai.chats.create({
    model: "gemini-2.5-flash",
    history: history,
    config: {
      systemInstruction,
      tools: [{ functionDeclarations: [updateStatsTool, addQuestTool, updateQuestStatusTool, updatePointsTool, addPunishmentTool, updatePunishmentStatusTool, unlockAchievementTool] }],
    }
  });
}

