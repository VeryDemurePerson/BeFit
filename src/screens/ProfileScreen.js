<<<<<<< HEAD

import React, { useState, useEffect } from 'react';
=======
import React, { useState, useEffect } from "react";
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useFocusEffect } from "@react-navigation/native";

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalDuration: 0,
    totalWaterGlasses: 0,
    joinDate: "",
    currentStreak: 0,
    favoriteWorkoutType: "None",
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );

  useEffect(() => {
    fetchUserData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const fetchUserData = async () => {
    try {
      // Get user profile data
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }

      // Calculate user statistics
      await calculateUserStats();
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserStats = async () => {
    try {
      // Get all user workouts
      const workoutsQuery = query(
        collection(db, "workouts"),
        where("userId", "==", auth.currentUser.uid)
      );
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workouts = workoutsSnapshot.docs.map((doc) => doc.data());

      // Calculate total duration
      const totalDuration = workouts.reduce(
        (sum, workout) => sum + (workout.duration || 0),
        0
      );

      // Find most frequent workout type
      const workoutTypes = workouts.reduce((acc, workout) => {
        acc[workout.type] = (acc[workout.type] || 0) + 1;
        return acc;
      }, {});

      const favoriteWorkoutType =
        Object.keys(workoutTypes).length > 0
          ? Object.keys(workoutTypes).reduce((a, b) =>
              workoutTypes[a] > workoutTypes[b] ? a : b
            )
          : "None";

      // Calculate current streak (days with workouts in the last week)
      const now = new Date();
      const last7Days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        last7Days.push(date.toDateString());
      }

      const workoutDays = new Set(
        workouts.map((w) => new Date(w.createdAt.toDate()).toDateString())
      );
      let currentStreak = 0;
      for (const day of last7Days) {
        if (workoutDays.has(day)) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Get total water glasses (simplified calculation)
      let totalWaterGlasses = 0;
      try {
        // This is a simplified version - in reality you'd query all water intake docs
        const today = new Date().toISOString().split("T")[0];
        const waterDoc = await getDoc(
          doc(db, "water_intake", `${auth.currentUser.uid}_${today}`)
        );
        if (waterDoc.exists()) {
          totalWaterGlasses = waterDoc.data().glasses || 0;
        }
      } catch (waterError) {
        console.log("Could not fetch water data:", waterError);
      }

      // Safe string capitalization
      const formattedWorkoutType = favoriteWorkoutType && favoriteWorkoutType !== 'None'
        ? favoriteWorkoutType.charAt(0).toUpperCase() + favoriteWorkoutType.slice(1)
        : 'None';

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
      console.error("Error calculating user stats:", error);
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {userData?.name ? userData.name.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
          <Text style={styles.profileName}>{userData?.name || "User"}</Text>
          <Text style={styles.profileEmail}>
            {userData?.email || auth.currentUser?.email}
          </Text>
          <Text style={styles.joinDate}>Member since {stats.joinDate}</Text>
        </View>

        {/* Statistics Grid */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="🏋️‍♂️"
              title="Total Workouts"
              value={stats.totalWorkouts}
              color="#FF6B6B"
            />
            <StatCard
              icon="⏱️"
              title="Hours Trained"
              value={Math.round((stats.totalDuration / 60) * 10) / 10}
              color="#4ECDC4"
            />
            <StatCard
              icon="🔥"
              title="Current Streak"
              value={stats.currentStreak}
              subtitle="days"
              color="#FF9500"
            />
            <StatCard
              icon="💪"
              title="Favorite Type"
              value={stats.favoriteWorkoutType}
              color="#9C27B0"
            />
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <InfoRow
              label="Full Name"
              value={userData?.name}
              onPress={() =>
                navigation.navigate("EditProfile", { field: "name" })
              }
            />
            <InfoRow
              label="Age"
              value={userData?.age ? `${userData.age} years` : null}
              onPress={() =>
                navigation.navigate("EditProfile", { field: "age" })
              }
            />
            <InfoRow
              label="Height"
              value={userData?.height ? `${userData.height} cm` : null}
              onPress={() =>
                navigation.navigate("EditProfile", { field: "height" })
              }
            />
            <InfoRow
              label="Weight"
              value={userData?.weight ? `${userData.weight} kg` : null}
              onPress={() =>
                navigation.navigate("EditProfile", { field: "weight" })
              }
            />
            <InfoRow
              label="Email"
              value={userData?.email || auth.currentUser?.email}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <ActionButton
              title="Edit Profile"
              icon="✏️"
              onPress={() => navigation.navigate("EditProfile")}
              color="#007AFF"
            />
            <ActionButton
              title="View Progress"
              icon="📊"
              onPress={() => navigation.navigate("Progress")}
              color="#34C759"
            />
          </View>
        </View>

        {/* App Information */}
        <View style={styles.appInfoContainer}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Version" value="1.0.0" />
            <InfoRow
              label="Privacy Policy"
              value=""
              onPress={() =>
                Alert.alert(
                  "Privacy Policy",
                  "Privacy policy would be displayed here."
                )
              }
            />
            <InfoRow
              label="Terms of Service"
              value=""
              onPress={() =>
                Alert.alert(
                  "Terms of Service",
                  "Terms of service would be displayed here."
                )
              }
            />
          </View>
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: "white",
    padding: 30,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  joinDate: {
    fontSize: 14,
    color: "#999",
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "white",
    width: "48%",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
    borderTopWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  statSubtitle: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
  },
  infoContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  infoValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoValue: {
    fontSize: 16,
    color: "#666",
    marginRight: 5,
  },
  infoArrow: {
    fontSize: 18,
    color: "#ccc",
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  actionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  appInfoContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  signOutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  signOutButton: {
    backgroundColor: "#FF3B30",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  signOutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ProfileScreen;
