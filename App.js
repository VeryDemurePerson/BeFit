import React, { useState, useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/services/firebase';
import { useTheme, ThemeProvider } from './src/screens/ThemeContext';
import { lightTheme, darkTheme } from './src/screens/themes';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';

// Main app screens
import HomeScreen from './src/screens/HomeScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NutritionScreen from './src/screens/NutritionScreen';
import WaterTrackerScreen from './src/screens/WaterTrackerScreen';
import GoalsScreen from './src/screens/GoalsScreen';

// Hidden / detail screens
import AddWorkoutScreen from './src/screens/AddWorkoutScreen';
import EditWorkoutScreen from './src/screens/EditWorkoutScreen';
import AddMealScreen from './src/screens/AddMealScreen';
import ChatbotScreen from './src/screens/ChatbotScreen';
import FloatingChatButton from './src/components/FloatingChatButton';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab icon component
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

// Auth Stack
function AuthStack() {
  return (
    <>
      <SafeAreaView
        style={[
          styles.tabBar,
          {
            backgroundColor: themeColors.card,
            borderTopColor: themeColors.border,
          },
        ]}
      >
        {PRIMARY_TABS.map((routeName, index) => {
          const route = state.routes.find((r) => r.name === routeName);
          if (!route) return null;

// Workout Stack
function WorkoutStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkoutList" component={WorkoutScreen} />
      <Stack.Screen name="AddWorkout" component={AddWorkoutScreen} />
      <Stack.Screen name="EditWorkout" component={EditWorkoutScreen} />
    </Stack.Navigator>
  );
}

// Goals Stack
function GoalsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GoalsList" component={GoalsScreen} />
      <Stack.Screen name="EditGoal" component={EditGoalScreen} />
    </Stack.Navigator>
  );
}

      <Modal
        visible={moreVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMoreVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPressOut={() => setMoreVisible(false)}
        >
          <View
            style={[
              styles.moreCard,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.moreTitle,
                {
                  color: themeColors.text,
                },
              ]}
            >
              Quick Actions
            </Text>

            {quickActions.map((item) => (
              <TouchableOpacity
                key={item.screen}
                style={styles.moreItem}
                onPress={() => {
                  setMoreVisible(false);
                  navigation.navigate(item.screen);
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={themeColors.accent}
                />
                <Text
                  style={[
                    styles.moreItemLabel,
                    { color: themeColors.text },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// Main App Tabs
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
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { theme } = useTheme();
  const themeColors = theme === 'light' ? lightTheme : darkTheme;
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setCheckingAuth(false);
    });
    return unsubscribe;
  }, []);

  if (checkingAuth) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: themeColors.background },
        ]}
      >
        <ActivityIndicator size="large" color={themeColors.accent} />
        <Text
          style={[
            styles.loadingText,
            { color: themeColors.subtext },
          ]}
        >
          Loading BeFit...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <RootNavigator /> : <AuthStack />}
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
