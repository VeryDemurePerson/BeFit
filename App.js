import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, Text } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/services/firebase';

// Import screens
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
import ChatbotScreen from './src/screens/ChatbotScreen'; // AI Chatbot
import FloatingChatButton from './src/components/FloatingChatButton'; // Floating button
import { ThemeProvider } from './src/screens/ThemeContext'; // Theme provider


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

<<<<<<< HEAD
// Tab icon component
=======
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
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

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

// Workout Stack
function WorkoutStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkoutList" component={WorkoutScreen} />
      <Stack.Screen
        name="AddWorkout"
        component={AddWorkoutScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="EditWorkout"
        component={EditWorkoutScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}

// Goals Stack
function GoalsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GoalsList" component={GoalsScreen} />
      <Stack.Screen
        name="EditGoal"
        component={EditGoalScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}

// Profile Stack
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}

// Nutrition Stack
function NutritionStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NutritionList" component={NutritionScreen} />
      <Stack.Screen 
        name="AddMeal" 
        component={AddMealScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}

<<<<<<< HEAD
// Main App Tabs (NO AI COACH TAB - using floating button instead)
=======


// Main App Tabs (after login) - FIXED VERSION
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
function MainTabs() {
  const [chatVisible, setChatVisible] = React.useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name={route.name} focused={focused} color={color} size={size} />
          ),
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#E5E5EA',
            height: 60,
            paddingBottom: 5,
            paddingTop: 5,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
          }}
        />
        <Tab.Screen
          name="Workout"
          component={WorkoutStack}
          options={{
            tabBarLabel: 'Workout',
          }}
        />
        <Tab.Screen
          name="Goals"
          component={GoalsStack}
          options={{
            tabBarLabel: 'Goals',
          }}
        />
        <Tab.Screen
          name="Progress"
          component={ProgressScreen}
          options={{
            tabBarLabel: 'Progress',
          }}
        />
        <Tab.Screen
          name="Nutrition"
          component={NutritionStack}
          options={{
            tabBarLabel: 'Nutrition',
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStack}
          options={{
            tabBarLabel: 'Profile',
          }}
        />
      </Tab.Navigator>

      {/* Floating AI Chat Button */}
      <FloatingChatButton onPress={() => setChatVisible(true)} />

      {/* AI Chat Modal */}
      {chatVisible && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <ChatbotScreen 
            navigation={{ 
              goBack: () => setChatVisible(false) 
            }} 
          />
        </View>
      )}
    </>
  );
}

// Root Navigator with Chatbot as modal
function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen 
        name="Chatbot" 
        component={ChatbotScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
<<<<<<< HEAD
    </Stack.Navigator>
=======
      <Tab.Screen
        name="Workout"
        component={WorkoutStack}
        options={{
          tabBarLabel: 'Workout',
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsStack}
        options={{
          tabBarLabel: 'Goals',
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progress',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
      <Tab.Screen
        name="Nutrition"
        component={NutritionStack}
        options={{
          tabBarLabel: 'Nutrition',
        }}
      />

      
    </Tab.Navigator>
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        {user ? <RootNavigator /> : <AuthStack />}
      </NavigationContainer>
    </ThemeProvider>
  );
}