import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configure notification handler - FIXED: Updated deprecated properties
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // CHANGED: from shouldShowAlert
    shouldShowList: true, // ADDED: for notification list
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
  }

  // Initialize notifications and request permissions
  async initialize() {
    // Skip on web platform
    if (Platform.OS === "web") {
      console.log("Notifications not supported on web");
      return null;
    }

    if (!Device.isDevice) {
      console.log("Notifications only work on physical devices");
      return null;
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Permission not granted for notifications");
        return null;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error("Error initializing notifications:", error);
      return null;
    }
  }

  // Set up listeners for notifications
  setupListeners(onNotificationReceived, onNotificationResponse) {
    if (Platform.OS === "web") {
      return;
    }

    try {
      this.notificationListener = Notifications.addNotificationReceivedListener(
        onNotificationReceived
      );

      this.responseListener =
        Notifications.addNotificationResponseReceivedListener(
          onNotificationResponse
        );
    } catch (error) {
      console.error("Error setting up notification listeners:", error);
    }
  }

  // Clean up listeners - FIXED: Changed method call
  removeListeners() {
    if (Platform.OS === "web") {
      return;
    }

    try {
      // FIXED: Use .remove() method instead of removeNotificationSubscription
      if (this.notificationListener?.remove) {
        this.notificationListener.remove();
      }
      if (this.responseListener?.remove) {
        this.responseListener.remove();
      }
    } catch (error) {
      console.log("Error removing notification listeners:", error);
    }
  }

  // Schedule daily workout reminder
  async scheduleWorkoutReminder(hour = 8, minute = 0) {
    if (Platform.OS === "web") {
      return;
    }

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      const trigger = {
        hour,
        minute,
        repeats: true,
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "💪 Time to Workout!",
          body: "Your body is waiting! Let's crush today's workout.",
          data: { type: "workout_reminder", screen: "WorkoutScreen" },
          sound: true,
        },
        trigger,
      });

      await AsyncStorage.setItem(
        "workout_reminder_time",
        JSON.stringify({ hour, minute })
      );
    } catch (error) {
      console.error("Error scheduling workout reminder:", error);
    }
  }

  // Schedule hydration reminders (every 2 hours during waking hours)
  async scheduleHydrationReminders(
    startHour = 8,
    endHour = 22,
    intervalHours = 2
  ) {
    if (Platform.OS === "web") {
      return [];
    }

    try {
      const identifiers = [];

      for (let hour = startHour; hour <= endHour; hour += intervalHours) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "💧 Hydration Check",
            body: "Time to drink some water! Stay hydrated, stay healthy.",
            data: { type: "hydration_reminder", screen: "WaterTrackerScreen" },
            sound: true,
          },
          trigger: {
            hour,
            minute: 0,
            repeats: true,
          },
        });
        identifiers.push(id);
      }

      await AsyncStorage.setItem(
        "hydration_reminder_ids",
        JSON.stringify(identifiers)
      );
      return identifiers;
    } catch (error) {
      console.error("Error scheduling hydration reminders:", error);
      return [];
    }
  }

  // Send streak maintenance alert
  async sendStreakAlert(streakDays, lastWorkoutDate) {
    if (Platform.OS === "web") {
      return;
    }

    try {
      const today = new Date().toDateString();
      const lastWorkout = new Date(lastWorkoutDate).toDateString();

      // Only send if user hasn't worked out today
      if (today !== lastWorkout) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🔥 Don't Break Your ${streakDays}-Day Streak!`,
            body: "You're doing amazing! Complete a workout today to keep the momentum going.",
            data: { type: "streak_alert", screen: "WorkoutScreen", streakDays },
            sound: true,
          },
          trigger: {
            seconds: 3600, // Send 1 hour from now
          },
        });
      }
    } catch (error) {
      console.error("Error sending streak alert:", error);
    }
  }

  // Send goal achievement notification
  async sendGoalAchievement(goalType, goalName) {
    if (Platform.OS === "web") {
      return;
    }

    try {
      const titles = {
        workout: "🏆 Workout Goal Achieved!",
        nutrition: "🥗 Nutrition Goal Crushed!",
        hydration: "💧 Hydration Goal Complete!",
        weight: "⚖️ Weight Goal Reached!",
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: titles[goalType] || "🎉 Goal Achieved!",
          body: `Congratulations! You've achieved your ${goalName} goal. You're unstoppable!`,
          data: { type: "goal_achievement", goalType, screen: "GoalsScreen" },
          sound: true,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error("Error sending goal achievement notification:", error);
    }
  }

  // Send progress milestone notification
  async sendProgressMilestone(message, screen = "ProgressScreen") {
    if (Platform.OS === "web") {
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📈 Progress Milestone!",
          body: message,
          data: { type: "progress_milestone", screen },
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Error sending progress milestone:", error);
    }
  }

  // Send meal reminder
  async scheduleMealReminder(mealType, hour, minute) {
    if (Platform.OS === "web") {
      return;
    }

    try {
      const mealEmojis = {
        breakfast: "🍳",
        lunch: "🍱",
        dinner: "🍽️",
        snack: "🍎",
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${mealEmojis[mealType] || "🍴"} ${
            mealType.charAt(0).toUpperCase() + mealType.slice(1)
          } Time!`,
          body: "Don't forget to log your meal and track your nutrition.",
          data: { type: "meal_reminder", mealType, screen: "NutritionScreen" },
          sound: true,
        },
        trigger: {
          hour,
          minute,
          repeats: true,
        },
      });
    } catch (error) {
      console.error("Error scheduling meal reminder:", error);
    }
  }

  // Cancel all notifications
  async cancelAllNotifications() {
    if (Platform.OS === "web") {
      return;
    }

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem("workout_reminder_time");
      await AsyncStorage.removeItem("hydration_reminder_ids");
    } catch (error) {
      console.error("Error canceling notifications:", error);
    }
  }

  // Get all scheduled notifications (for debugging/settings)
  async getScheduledNotifications() {
    if (Platform.OS === "web") {
      return [];
    }

    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Error getting scheduled notifications:", error);
      return [];
    }
  }

  // Check if user worked out today (helper function)
  async checkDailyWorkoutStatus() {
    if (Platform.OS === "web") {
      return;
    }

    try {
      const lastWorkout = await AsyncStorage.getItem("last_workout_date");
      const today = new Date().toDateString();

      if (lastWorkout !== today) {
        const streak = await AsyncStorage.getItem("workout_streak");
        if (streak && parseInt(streak) > 0) {
          await this.sendStreakAlert(parseInt(streak), lastWorkout);
        }
      }
    } catch (error) {
      console.error("Error checking daily workout status:", error);
    }
  }

  // Update workout streak
  async updateWorkoutStreak() {
    try {
      const today = new Date().toDateString();
      const lastWorkout = await AsyncStorage.getItem("last_workout_date");
      let streak = parseInt(
        (await AsyncStorage.getItem("workout_streak")) || "0"
      );

      if (lastWorkout) {
        const lastDate = new Date(lastWorkout);
        const todayDate = new Date(today);
        const diffTime = Math.abs(todayDate - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day
          streak += 1;
          if (streak % 7 === 0) {
            await this.sendProgressMilestone(
              `Amazing! You've maintained a ${streak}-day workout streak! 🔥`,
              "ProgressScreen"
            );
          }
        } else if (diffDays > 1) {
          // Streak broken
          streak = 1;
        }
      } else {
        streak = 1;
      }

      await AsyncStorage.setItem("workout_streak", streak.toString());
      await AsyncStorage.setItem("last_workout_date", today);
      return streak;
    } catch (error) {
      console.error("Error updating workout streak:", error);
      return 0;
    }
  }
}

export default new NotificationService();
