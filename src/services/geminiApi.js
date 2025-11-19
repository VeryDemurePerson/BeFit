import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. LẤY API KEY TỪ FILE .ENV (AN TOÀN)
// Key này được load từ file .env nhờ có tiền tố EXPO_PUBLIC_
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Kiểm tra xem key có tồn tại không
if (!API_KEY) {
  throw new Error("Không tìm thấy EXPO_PUBLIC_GEMINI_API_KEY. Bạn đã thêm nó vào file .env và khởi động lại app chưa?");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// 2. SỬ DỤNG MODEL MẠNH HƠN MÀ BẠN ĐÃ TÌM THẤY
// Bạn có thể dùng 'models/gemini-2.5-pro' hoặc 'models/gemini-2.5-flash'
const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-pro' });

/**
 * Gửi tin nhắn tới Gemini với bối cảnh fitness
 * @param {string} userMessage - Câu hỏi của người dùng
 * @param {object} userData - Dữ liệu fitness của người dùng
 * @returns {Promise<string>} - Phản hồi của AI
 */
export const sendMessageToGemini = async (userMessage, userData = {}) => {
  try {
    // Xây dựng bối cảnh về người dùng
    const contextPrompt = buildFitnessContext(userData);
    
    // Kết hợp bối cảnh với tin nhắn
    const fullPrompt = `${contextPrompt}

User Question: ${userMessage}

Please provide helpful, personalized fitness advice based on the user's data and question. Be encouraging, specific, and practical.`;

    // Tạo phản hồi
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    // Cung cấp thông báo lỗi rõ ràng hơn cho người dùng
    return 'Xin lỗi, tôi đang gặp sự cố khi kết nối. Vui lòng thử lại sau.';
  }
};

/**
 * Xây dựng bối cảnh fitness từ dữ liệu người dùng
 */
const buildFitnessContext = (userData) => {
  const {
    totalWorkouts = 0,
    recentWorkouts = [],
    goals = {},
    todayCalories = 0,
    weeklyWorkouts = 0,
  } = userData;

  let context = `You are a professional fitness coach and nutritionist assistant for the BeFit app. 

User's Fitness Profile:
- Total workouts completed: ${totalWorkouts}
- Workouts this week: ${weeklyWorkouts}
- Today's calories consumed: ${todayCalories}
`;

  // Thêm mục tiêu nếu có
  if (goals.weeklyWorkouts) {
    context += `- Weekly workout goal: ${goals.weeklyWorkouts} sessions\n`;
  }
  if (goals.dailyWater) {
    context += `- Daily water goal: ${goals.dailyWater} glasses\n`;
  }

  // Thêm các bài tập gần đây nếu có
  if (recentWorkouts && recentWorkouts.length > 0) {
    context += `\nRecent Workouts (last 3):\n`;
    recentWorkouts.slice(0, 3).forEach((workout, index) => {
      context += `${index + 1}. ${workout.exercise} - ${workout.duration} min (${workout.type})\n`;
    });
  }

  return context;
};

/**
 * Lấy mẹo fitness nhanh
 */
export const getQuickTip = async (category = 'general') => {
  try {
    const prompts = {
      workout: 'Give me one quick, actionable workout tip in 2-3 sentences.',
      nutrition: 'Give me one quick, actionable nutrition tip in 2-3 sentences.',
      motivation: 'Give me a short, motivational fitness quote or message in 2-3 sentences.',
      general: 'Give me one quick, actionable fitness or wellness tip in 2-3 sentences.',
    };

    const prompt = prompts[category] || prompts.general;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error('Gemini Quick Tip Error:', error);
    // Cung cấp một mẹo dự phòng khi có lỗi
    return 'Stay consistent with your fitness journey. Small steps lead to big results! 💪';
  }
};