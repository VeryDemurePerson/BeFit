// services/geminiApi.js
// SUPER SIMPLE VERSION THAT WILL WORK

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

console.log('🔑 API Key:', API_KEY ? 'LOADED ✅' : 'MISSING ❌');

/**
 * Send message to Gemini
 */
export const sendMessageToGemini = async (userMessage, userData = {}) => {
  console.log('📤 Sending to Gemini...');
  console.log('📊 User data received:', userData);
  
  if (!API_KEY) {
    throw new Error('API key not found');
  }

  // Build personalized context with user data
  const {
    totalWorkouts = 0,
    weeklyWorkouts = 0,
    todayCalories = 0,
    recentWorkouts = [],
    goals = {},
  } = userData;

  let context = `You are a professional fitness coach for the BeFit app.

USER'S PROFILE:
- Total workouts completed: ${totalWorkouts}
- Workouts this week: ${weeklyWorkouts}
- Calories consumed today: ${todayCalories}`;

  if (goals.weeklyWorkouts) {
    context += `\n- Weekly workout goal: ${goals.weeklyWorkouts} sessions`;
  }

  if (goals.dailyWater) {
    context += `\n- Daily water goal: ${goals.dailyWater} glasses`;
  }

  if (recentWorkouts && recentWorkouts.length > 0) {
    context += `\n\nRECENT WORKOUTS:`;
    recentWorkouts.slice(0, 3).forEach((workout, i) => {
      context += `\n${i + 1}. ${workout.exercise} - ${workout.duration} min (${workout.type})`;
    });
  }

  const fullPrompt = `${context}

USER QUESTION: ${userMessage}

Provide detailed, personalized fitness advice based on their data. Include:
- Specific recommendations tailored to their current progress
- Actionable steps they can take
- Motivation based on their achievements
- Any relevant tips or warnings

Be thorough, encouraging, and specific. Aim for 200-300 words.`;

  console.log('📝 Prompt with context:', fullPrompt.substring(0, 200) + '...');

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: fullPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        }
      }),
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.error('❌ No text in response:', JSON.stringify(data));
      throw new Error('No response from AI');
    }

    console.log('✅ Got personalized response!');
    return text;

  } catch (error) {
    console.error('❌ Error:', error);
    throw new Error('Failed to get AI response. Try again.');
  }
};

/**
 * Get quick tip
 */
export const getQuickTip = async (category = 'general') => {
  console.log('💡 Getting quick tip...');
  
  if (!API_KEY) {
    return 'Stay consistent! 💪';
  }

  try {
    const prompts = {
      workout: 'Give me a detailed workout tip with specific exercises and sets/reps recommendations. Include why it works. 3-4 sentences.',
      nutrition: 'Give me a detailed nutrition tip with specific foods and meal timing suggestions. Include the science behind it. 3-4 sentences.',
      motivation: 'Give me an inspiring and detailed motivational message about fitness. Include specific strategies to stay motivated. 3-4 sentences.',
      general: 'Give me a detailed fitness or wellness tip with actionable advice. Include why it matters. 3-4 sentences.',
    };

    const prompt = prompts[category] || prompts.general;

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 1000,
        }
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    }
  } catch (error) {
    console.error('❌ Quick tip error:', error);
  }

  return 'Stay consistent with your fitness journey! 💪';
};