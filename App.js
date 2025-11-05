import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, Text } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/services/firebase';
import { useTheme, ThemeProvider } from './src/screens/ThemeContext';
import { lightTheme, darkTheme } from './src/screens/themes';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import AddWorkoutScreen from './src/screens/AddWorkoutScreen';
import EditWorkoutScreen from './src/screens/EditWorkoutScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import EditGoalScreen from './src/screens/EditGoalScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import NutritionScreen from './src/screens/NutritionScreen';
import AddMealScreen from './src/screens/AddMealScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused, color, size }) => {
  const getIcon = () => {
    switch (name) {
      case 'Home': return '🏠';
      case 'Workout': return '💪';
      case 'Goals': return '🎯';
      case 'Progress': return '📊';
      case 'Profile': return '👤';
      case 'Nutrition': return '🍎';
      default: return '.';
    }
  };
  return (
    <Text style={{ 
      fontSize: size || 20, 
      color: focused ? color : '#8E8E93',
      opacity: focused ? 1 : 0.6 
    }}>
      {getIcon()}
    </Text>
  );
};

// Auth stack
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
      <Stack.Screen name="AddWorkout" component={AddWorkoutScreen} />
      <Stack.Screen name="EditWorkout" component={EditWorkoutScreen} />
    </Stack.Navigator>
  );
}

// Goals stack
function GoalsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GoalsList" component={GoalsScreen} />
      <Stack.Screen name="EditGoal" component={EditGoalScreen} />
    </Stack.Navigator>
  );
}

// Profile stack
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}

// Nutrition stack
function NutritionStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NutritionList" component={NutritionScreen} />
      <Stack.Screen name="AddMeal" component={AddMealScreen} />
    </Stack.Navigator>
  );
}

// Main Tabs with theme
function MainTabs() {
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <TabIcon name={route.name} focused={focused} color={color} size={size} />
        ),
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Workout" component={WorkoutStack} />
      <Tab.Screen name="Goals" component={GoalsStack} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
      <Tab.Screen name="Nutrition" component={NutritionStack} />
    </Tab.Navigator>
  );
}

// Root App
function AppContent() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
