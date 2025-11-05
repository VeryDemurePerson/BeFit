import "react-native-gesture-handler";
import React, { useState, useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, ActivityIndicator, Text } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./src/services/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NotificationService from "./src/services/NotificationService";

import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import HomeScreen from "./src/screens/HomeScreen";
import WorkoutScreen from "./src/screens/WorkoutScreen";
import AddWorkoutScreen from "./src/screens/AddWorkoutScreen";
import EditWorkoutScreen from "./src/screens/EditWorkoutScreen";
import ProgressScreen from "./src/screens/ProgressScreen";
import GoalsScreen from "./src/screens/GoalsScreen";
import EditGoalScreen from "./src/screens/EditGoalScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import EditProfileScreen from "./src/screens/EditProfileScreen";
import NutritionScreen from "./src/screens/NutritionScreen";
import AddMealScreen from "./src/screens/AddMealScreen";
import NotificationSettingsScreen from "./src/screens/NotificationSettingsScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused, color, size }) => {
  const getIcon = () => {
    switch (name) {
      case "Home":
        return "🏠";
      case "Workout":
        return "💪";
      case "Goals":
        return "🎯";
      case "Progress":
        return "📊";
      case "Profile":
        return "👤";
      case "Nutrition":
        return "🍎";
      default:
        return ".";
    }
  };
  return (
    <Text
      style={{
        fontSize: size || 20,
        color: focused ? color : "#8E8E93",
        opacity: focused ? 1 : 0.6,
      }}
    >
      {getIcon()}
    </Text>
  );
};

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

// Workout stack
function WorkoutStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkoutList" component={WorkoutScreen} />
      <Stack.Screen
        name="AddWorkout"
        component={AddWorkoutScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditWorkout"
        component={EditWorkoutScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

// Goals stack
function GoalsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GoalsList" component={GoalsScreen} />
      <Stack.Screen
        name="EditGoal"
        component={EditGoalScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

// Profile stack
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: "Notification Settings",
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
}

// Nutrition stack
function NutritionStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NutritionList" component={NutritionScreen} />
      <Stack.Screen
        name="AddMeal"
        component={AddMealScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

// Main App Tabs (after login)
function MainTabs() {
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <TabIcon
            name={route.name}
            focused={focused}
            color={color}
            size={size}
          />
        ),
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#E5E5EA",
          height: 70,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="Workout"
        component={WorkoutStack}
        options={{
          tabBarLabel: "Workout",
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsStack}
        options={{
          tabBarLabel: "Goals",
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: "Progress",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: "Profile",
        }}
      />
      <Tab.Screen
        name="Nutrition"
        component={NutritionStack}
        options={{
          tabBarLabel: "Nutrition",
        }}
      />
    </Tab.Navigator>
  );
}

// Root App
function AppContent() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigationRef = useRef();

  // Initialize notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const token = await NotificationService.initialize();
        console.log("Notification token:", token);

        // Set up notification listeners
        NotificationService.setupListeners(
          (notification) => {
            console.log("Notification received:", notification);
          },
          (response) => {
            const { data } = response.notification.request.content;
            console.log("Notification tapped:", data);

            // Navigate to appropriate screen based on notification type
            if (navigationRef.current && data.screen) {
              navigationRef.current.navigate(data.screen, data);
            }
          }
        );

        // Load and apply saved notification settings
        const settings = await AsyncStorage.getItem("notification_settings");
        if (settings) {
          const parsed = JSON.parse(settings);

          // Schedule workout reminder if enabled
          if (parsed.workoutEnabled && parsed.workoutTime) {
            const time = new Date(parsed.workoutTime);
            await NotificationService.scheduleWorkoutReminder(
              time.getHours(),
              time.getMinutes()
            );
          }

          // Schedule hydration reminders if enabled
          if (parsed.hydrationEnabled) {
            await NotificationService.scheduleHydrationReminders(
              8,
              22,
              parsed.hydrationInterval || 2
            );
          }

          // Schedule meal reminders if enabled
          if (parsed.mealReminders) {
            for (const [mealType, meal] of Object.entries(
              parsed.mealReminders
            )) {
              if (meal.enabled) {
                const time = new Date(meal.time);
                await NotificationService.scheduleMealReminder(
                  mealType,
                  time.getHours(),
                  time.getMinutes()
                );
              }
            }
          }
        } else {
          // First time setup - schedule default notifications
          await NotificationService.scheduleWorkoutReminder(8, 0);
          await NotificationService.scheduleHydrationReminders(8, 22, 2);
        }

        // Check daily workout status (for streak alerts)
        await NotificationService.checkDailyWorkoutStatus();
      } catch (error) {
        console.error("Error initializing notifications:", error);
      }
    };

    initializeNotifications();

    // Cleanup listeners on unmount
    return () => {
      NotificationService.removeListeners();
    };
  }, []);

  // Check workout status daily at app launch
  useEffect(() => {
    const checkStatus = async () => {
      await NotificationService.checkDailyWorkoutStatus();
    };
    checkStatus();
  }, []);

  // Firebase authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

// INTEGRATION EXAMPLE: Call this function when user completes a workout
export const onWorkoutComplete = async (workoutData) => {
  // Update streak
  const newStreak = await NotificationService.updateWorkoutStreak();

  // Check if they hit a milestone
  if (newStreak > 0 && newStreak % 5 === 0) {
    await NotificationService.sendProgressMilestone(
      `You're on fire! ${newStreak} days in a row! 🔥`,
      "ProgressScreen"
    );
  }
};

// INTEGRATION EXAMPLE: Call this when user achieves a goal
export const onGoalAchieved = async (goalType, goalName) => {
  const settings = await AsyncStorage.getItem("notification_settings");
  const parsed = settings ? JSON.parse(settings) : {};

  if (parsed.goalEnabled !== false) {
    await NotificationService.sendGoalAchievement(goalType, goalName);
  }
};

// INTEGRATION EXAMPLE: Call this when user reaches hydration goal
export const onHydrationGoalReached = async () => {
  await NotificationService.sendGoalAchievement(
    "hydration",
    "Daily Water Intake"
  );
};
