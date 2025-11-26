// src/services/i18n.js
import i18n from "i18n-js";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define translations
const translations = {
  en: {
    // Auth screens
    login: "Login",
    signUp: "Sign Up",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    fullName: "Full Name",
    age: "Age",
    weight: "Weight (kg)",
    height: "Height (cm)",
    alreadyHaveAccount: "Already have an account?",
    dontHaveAccount: "Don't have an account?",
    // Navigation
    home: "Home",
    workout: "Workout",
    goals: "Goals",
    progress: "Progress",
    nutrition: "Nutrition",
    profile: "Profile",
    // Home Screen
    welcome: "Welcome",
    todayStats: "Today's Stats",
    waterIntake: "Water Intake",
    calories: "Calories",
    workouts: "Workouts",
    quickActions: "Quick Actions",
    logWorkout: "Log Workout",
    addMeal: "Add Meal",
    trackWater: "Track Water",
    // Workout Screen
    myWorkouts: "My Workouts",
    addWorkout: "Add Workout",
    editWorkout: "Edit Workout",
    deleteWorkout: "Delete Workout",
    exercise: "Exercise",
    type: "Type",
    duration: "Duration (min)",
    calories_burned: "Calories Burned",
    notes: "Notes",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    // Workout Types
    cardio: "Cardio",
    strength: "Strength",
    flexibility: "Flexibility",
    sports: "Sports",
    other: "Other",
    // Exercise Types
    running: "Running",
    cycling: "Cycling",
    swimming: "Swimming",
    walking: "Walking",
    pushups: "Push-ups",
    squats: "Squats",
    lunges: "Lunges",
    plank: "Plank",
    yoga: "Yoga",
    stretching: "Stretching",
    pilates: "Pilates",
    basketball: "Basketball",
    football: "Football",
    tennis: "Tennis",
    // Goals Screen
    myGoals: "My Goals",
    addGoal: "Add Goal",
    editGoal: "Edit Goal",
    goalTitle: "Goal Title",
    targetValue: "Target Value",
    currentValue: "Current Value",
    deadline: "Deadline",
    completed: "Completed",
    inProgress: "In Progress",
    // Progress Screen
    myProgress: "My Progress",
    weeklyProgress: "Weekly Progress",
    monthlyProgress: "Monthly Progress",
    totalWorkouts: "Total Workouts",
    totalDuration: "Total Duration",
    averageDuration: "Average Duration",
    // Nutrition Screen
    myNutrition: "My Nutrition",
    addMealBtn: "Add Meal",
    mealName: "Meal Name",
    mealType: "Meal Type",
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snack: "Snack",
    protein: "Protein (g)",
    carbs: "Carbs (g)",
    fats: "Fats (g)",
    // Profile Screen
    myProfile: "My Profile",
    editProfile: "Edit Profile",
    accountInfo: "Account Information",
    statistics: "Statistics",
    settings: "Settings",
    language: "Language",
    theme: "Theme",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    logout: "Logout",
    joinDate: "Join Date",
    currentStreak: "Current Streak",
    days: "days",
    favoriteWorkout: "Favorite Workout",
    waterGlasses: "Water Glasses",
    changeAvatar: "Change Avatar",
    // Chatbot
    aiCoach: "AI Coach",
    askQuestion: "Ask me anything about fitness...",
    // Common
    search: "Search",
    filter: "Filter",
    sortBy: "Sort By",
    date: "Date",
    recent: "Recent",
    oldest: "Oldest",
    viewTutorial: "View Tutorial",
    watchVideo: "Watch Video",
    // Messages
    success: "Success",
    error: "Error",
    loading: "Loading...",
    noData: "No data available",
    confirmDelete: "Are you sure you want to delete this?",
    savedSuccessfully: "Saved successfully!",
    deletedSuccessfully: "Deleted successfully!",
    updateSuccessfully: "Updated successfully!",
  },
  vi: {
    // Auth screens
    login: "Đăng nhập",
    signUp: "Đăng ký",
    email: "Email",
    password: "Mật khẩu",
    confirmPassword: "Xác nhận mật khẩu",
    fullName: "Họ và tên",
    age: "Tuổi",
    weight: "Cân nặng (kg)",
    height: "Chiều cao (cm)",
    alreadyHaveAccount: "Đã có tài khoản?",
    dontHaveAccount: "Chưa có tài khoản?",
    // Navigation
    home: "Trang chủ",
    workout: "Tập luyện",
    goals: "Mục tiêu",
    progress: "Tiến độ",
    nutrition: "Dinh dưỡng",
    profile: "Hồ sơ",
    // Home Screen
    welcome: "Chào mừng",
    todayStats: "Thống kê hôm nay",
    waterIntake: "Lượng nước uống",
    calories: "Calo",
    workouts: "Bài tập",
    quickActions: "Thao tác nhanh",
    logWorkout: "Ghi nhận tập luyện",
    addMeal: "Thêm bữa ăn",
    trackWater: "Theo dõi nước",
    // Workout Screen
    myWorkouts: "Bài tập của tôi",
    addWorkout: "Thêm bài tập",
    editWorkout: "Sửa bài tập",
    deleteWorkout: "Xóa bài tập",
    exercise: "Bài tập",
    type: "Loại",
    duration: "Thời gian (phút)",
    calories_burned: "Calo đốt cháy",
    notes: "Ghi chú",
    save: "Lưu",
    cancel: "Hủy",
    delete: "Xóa",
    // Workout Types
    cardio: "Tim mạch",
    strength: "Sức mạnh",
    flexibility: "Linh hoạt",
    sports: "Thể thao",
    other: "Khác",
    // Exercise Types
    running: "Chạy bộ",
    cycling: "Đạp xe",
    swimming: "Bơi lội",
    walking: "Đi bộ",
    pushups: "Chống đẩy",
    squats: "Squats",
    lunges: "Lunges",
    plank: "Plank",
    yoga: "Yoga",
    stretching: "Giãn cơ",
    pilates: "Pilates",
    basketball: "Bóng rổ",
    football: "Bóng đá",
    tennis: "Quần vợt",
    // Goals Screen
    myGoals: "Mục tiêu của tôi",
    addGoal: "Thêm mục tiêu",
    editGoal: "Sửa mục tiêu",
    goalTitle: "Tiêu đề mục tiêu",
    targetValue: "Giá trị mục tiêu",
    currentValue: "Giá trị hiện tại",
    deadline: "Hạn chót",
    completed: "Hoàn thành",
    inProgress: "Đang thực hiện",
    // Progress Screen
    myProgress: "Tiến độ của tôi",
    weeklyProgress: "Tiến độ tuần",
    monthlyProgress: "Tiến độ tháng",
    totalWorkouts: "Tổng bài tập",
    totalDuration: "Tổng thời gian",
    averageDuration: "Thời gian trung bình",
    // Nutrition Screen
    myNutrition: "Dinh dưỡng của tôi",
    addMealBtn: "Thêm bữa ăn",
    mealName: "Tên bữa ăn",
    mealType: "Loại bữa ăn",
    breakfast: "Bữa sáng",
    lunch: "Bữa trưa",
    dinner: "Bữa tối",
    snack: "Bữa phụ",
    protein: "Protein (g)",
    carbs: "Carbs (g)",
    fats: "Chất béo (g)",
    // Profile Screen
    myProfile: "Hồ sơ của tôi",
    editProfile: "Sửa hồ sơ",
    accountInfo: "Thông tin tài khoản",
    statistics: "Thống kê",
    settings: "Cài đặt",
    language: "Ngôn ngữ",
    theme: "Giao diện",
    darkMode: "Chế độ tối",
    lightMode: "Chế độ sáng",
    logout: "Đăng xuất",
    joinDate: "Ngày tham gia",
    currentStreak: "Chuỗi hiện tại",
    days: "ngày",
    favoriteWorkout: "Bài tập yêu thích",
    waterGlasses: "Ly nước",
    changeAvatar: "Đổi ảnh đại diện",
    // Chatbot
    aiCoach: "Huấn luyện viên AI",
    askQuestion: "Hỏi tôi bất cứ điều gì về thể dục...",
    // Common
    search: "Tìm kiếm",
    filter: "Lọc",
    sortBy: "Sắp xếp theo",
    date: "Ngày",
    recent: "Gần đây",
    oldest: "Cũ nhất",
    viewTutorial: "Xem hướng dẫn",
    watchVideo: "Xem video",
    // Messages
    success: "Thành công",
    error: "Lỗi",
    loading: "Đang tải...",
    noData: "Không có dữ liệu",
    confirmDelete: "Bạn có chắc chắn muốn xóa không?",
    savedSuccessfully: "Lưu thành công!",
    deletedSuccessfully: "Xóa thành công!",
    updateSuccessfully: "Cập nhật thành công!",
  },
};

// Set i18n configuration
i18n.translations = translations;
i18n.fallbacks = true;

// Function to initialize language
export const initializeLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem("userLanguage");
    if (savedLanguage) {
      i18n.locale = savedLanguage;
    } else {
      // Get device locale
      const deviceLocale = Localization.locale;
      i18n.locale = deviceLocale.startsWith("vi") ? "vi" : "en";
    }
  } catch (error) {
    console.error("Error initializing language:", error);
    i18n.locale = "en";
  }
};

// Function to change language
export const changeLanguage = async (languageCode) => {
  try {
    i18n.locale = languageCode;
    await AsyncStorage.setItem("userLanguage", languageCode);
  } catch (error) {
    console.error("Error changing language:", error);
  }
};

// Function to get current language
export const getCurrentLanguage = () => i18n.locale;

export default i18n;
