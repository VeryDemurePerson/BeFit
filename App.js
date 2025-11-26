// App.js
import 'react-native-gesture-handler';
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

// Auth screens
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
import EditGoalScreen from './src/screens/EditGoalScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';

// AI Chat
import ChatbotScreen from './src/screens/ChatbotScreen';
import FloatingChatButton from './src/components/FloatingChatButton';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const PRIMARY_TABS = ['Home', 'Workout', 'MoreCenterTab', 'Progress', 'Profile'];

function BeFitTabBar({ state, descriptors, navigation, themeColors }) {
  const [moreVisible, setMoreVisible] = useState(false);
  const activeRouteName = state.routes[state.index].name;

  const quickActions = [
    { label: 'Nutrition', icon: 'fast-food-outline', screen: 'Nutrition' },
    { label: 'Water tracker', icon: 'water-outline', screen: 'WaterTracker' },
    { label: 'Goals', icon: 'flag-outline', screen: 'Goals' },
  ];

  const renderIcon = (routeName, focused) => {
    const color = focused ? themeColors.accent : themeColors.subtext;
    const size = 22;

    switch (routeName) {
      case 'Home':
        return <Ionicons name="home-outline" size={size} color={color} />;
      case 'Workout':
        return <Ionicons name="barbell-outline" size={size} color={color} />;
      case 'Progress':
        return <Ionicons name="stats-chart-outline" size={size} color={color} />;
      case 'Profile':
        return <Ionicons name="person-outline" size={size} color={color} />;
      case 'MoreCenterTab':
        return (
          <View style={styles.moreCircle}>
            <Ionicons name="grid" size={20} color="#fff" />
          </View>
        );
      default:
        return null;
    }
  };

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
        {PRIMARY_TABS.map((routeName) => {
          const route = state.routes.find((r) => r.name === routeName);
          if (!route) return null;

          const isFocused = activeRouteName === routeName;

          return (
            <TouchableOpacity
              key={route.key ?? routeName}
              onPress={() => {
                if (routeName === 'MoreCenterTab') {
                  setMoreVisible(true);
                  return;
                }
                navigation.navigate(routeName);
              }}
              style={styles.tabButton}
              activeOpacity={0.8}
            >
              {renderIcon(routeName, isFocused)}
              {routeName !== 'MoreCenterTab' && (
                <Text
                  style={{
                    fontSize: 11,
                    marginTop: 2,
                    color: isFocused ? themeColors.accent : themeColors.subtext,
                  }}
                >
                  {routeName}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </SafeAreaView>

      {/* More / Quick Actions modal */}
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

function MainTabs() {
  const { theme } = useTheme();
  const themeColors = theme === 'light' ? lightTheme : darkTheme;
  const [chatVisible, setChatVisible] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) => (
          <BeFitTabBar {...props} themeColors={themeColors} />
        )}
      >
        {/* Visible tabs */}
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Workout" component={WorkoutScreen} />
        <Tab.Screen
          name="MoreCenterTab"
          component={HomeScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen name="Progress" component={ProgressScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />

        {/* Hidden screens accessed via navigation */}
        <Tab.Screen
          name="Nutrition"
          component={NutritionScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="WaterTracker"
          component={WaterTrackerScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="Goals"
          component={GoalsScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="AddWorkout"
          component={AddWorkoutScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="EditWorkout"
          component={EditWorkoutScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="AddMeal"
          component={AddMealScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="EditGoal"
          component={EditGoalScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ tabBarButton: () => null }}
        />
      </Tab.Navigator>

      {/* Floating AI Chat Button */}
      <FloatingChatButton onPress={() => setChatVisible(true)} />

      {/* AI Chat overlay */}
      {chatVisible && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <ChatbotScreen
            navigation={{
              goBack: () => setChatVisible(false),
            }}
          />
        </View>
      )}
    </>
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

const styles = StyleSheet.create({
  /* Loading screen */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  /* Navigation bar */
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },

  /* Centered More button */
  moreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5A67D8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* More popup modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  moreCard: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  moreTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  moreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  moreItemLabel: {
    marginLeft: 10,
    fontSize: 14,
  },
});
