import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from './themes';

const ProfileScreen = ({ navigation }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const colors = isDark ? darkTheme : lightTheme;

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

      // Safe string capitalization
      const formattedWorkoutType =
        favoriteWorkoutType && favoriteWorkoutType !== "None"
          ? favoriteWorkoutType.charAt(0).toUpperCase() +
            favoriteWorkoutType.slice(1)
          : "None";

      setStats({
        totalWorkouts: workouts.length,
        totalDuration,
        totalWaterGlasses,
        joinDate: userData?.createdAt
          ? new Date(userData.createdAt.toDate()).toLocaleDateString()
          : "Unknown",
        currentStreak,
        favoriteWorkoutType:
          favoriteWorkoutType.charAt(0).toUpperCase() +
          favoriteWorkoutType.slice(1),
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
          } catch (error) {
            Alert.alert("Error", "Failed to sign out");
          }
        },
      },
    ]);
  };
  <TouchableOpacity
    onPress={() => navigation.navigate("NotificationSettings")}
    style={styles.settingButton}
  >
    <Text>🔔 Notification Settings</Text>
  </TouchableOpacity>;

  const StatCard = ({ icon, title, value, subtitle, color = "#007AFF" }) => (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const InfoRow = ({ label, value, onPress }) => (
    <TouchableOpacity
      style={styles.infoRow}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueContainer}>
        <Text style={styles.infoValue}>{value || "Not set"}</Text>
        {onPress && <Text style={styles.infoArrow}>›</Text>}
      </View>
    </TouchableOpacity>
  );

  const ActionButton = ({ title, onPress, color = "#007AFF", icon }) => (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor: color }]}
      onPress={onPress}
    >
      {icon && <Text style={styles.actionIcon}>{icon}</Text>}
      <Text style={styles.actionText}>{title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Image source={{ uri: userData.avatar }} style={styles.avatar} />
          <Text style={[styles.name, { color: colors.text }]}>{userData.name || 'User'}</Text>
          <Text style={[styles.email, { color: colors.text }]}>{userData.email}</Text>
        </View>

        {/* Options Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.option, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={[styles.optionText, { color: colors.text }]}>✏️ Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Goals')}
          >
            <Text style={[styles.optionText, { color: colors.text }]}>🎯 View Goals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Progress')}
          >
            <Text style={[styles.optionText, { color: colors.text }]}>📊 View Progress</Text>
          </TouchableOpacity>

          {/* Dark Mode Switch */}
          <View style={[styles.option, { backgroundColor: colors.card, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <Text style={[styles.optionText, { color: colors.text }]}>🌙 Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              thumbColor={isDark ? '#fff' : '#f4f3f4'}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
              ios_backgroundColor="#ccc"
            />
          </View>

        <TouchableOpacity
          style={styles.settingButton}
          onPress={() => navigation.navigate("NotificationSettings")}
        >
          <Text style={styles.settingButtonText}>🔔 Notification Settings</Text>
        </TouchableOpacity>

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <TouchableOpacity
            style={[styles.option, { backgroundColor: '#FF3B30' }]}
            onPress={logout}
          >
            <Text style={[styles.optionText, { color: '#fff', textAlign: 'center' }]}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },
  header: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
    opacity: 0.8,
  },
  section: {
    marginTop: 10,
  },
  option: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: "center",
  },
  settingButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
