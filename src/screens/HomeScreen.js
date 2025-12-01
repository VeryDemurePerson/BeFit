// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from './themes';

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [todayStats, setTodayStats] = useState({
    workouts: 0,
    totalDuration: 0,
    calories: 0,
  });
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  // Simple combined daily progress percent
  const workoutRatio = Math.min(todayStats.workouts / 1, 1); // target: 1 workout
  const durationRatio = Math.min(todayStats.totalDuration / 45, 1); // target: 45 min
  const calorieRatio = Math.min(todayStats.calories / 400, 1); // target: 400 kcal

  const todayPercent = Math.round(
    (workoutRatio * 0.4 + durationRatio * 0.4 + calorieRatio * 0.2) * 100
  ) || 0;

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      await Promise.all([fetchUserData(), fetchTodayStats(), fetchRecentWorkouts()]);
    } catch (err) {
      console.error('Error fetching home data:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchTodayStats = async () => {
    try {
      const today = new Date().toDateString();
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('userId', '==', auth.currentUser.uid),
        where('date', '==', today)
      );
      const querySnapshot = await getDocs(workoutsQuery);
      let workoutCount = 0;
      let totalDuration = 0;
      let estimatedCalories = 0;

      querySnapshot.forEach((docSnap) => {
        const workout = docSnap.data();
        workoutCount++;
        const duration = workout.duration || 0;
        totalDuration += duration;
        const caloriesPerMinute =
          workout.type === 'cardio'
            ? 8
            : workout.type === 'strength'
            ? 6
            : 4;
        estimatedCalories += duration * caloriesPerMinute;
      });

      setTodayStats({
        workouts: workoutCount,
        totalDuration,
        calories: estimatedCalories,
      });
    } catch (error) {
      console.error('Error fetching today stats:', error);
    }
  };

  const fetchRecentWorkouts = async () => {
    try {
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('userId', '==', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(workoutsQuery);
      let workoutList = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      workoutList.sort((a, b) => {
        try {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB - dateA;
        } catch {
          return 0;
        }
      });
      setRecentWorkouts(workoutList.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent workouts:', error);
    }
  };

  const QuickStatCard = ({ title, value, unit, color, icon }) => (
    <View
      style={[
        styles.statCard,
        {
          borderLeftColor: color,
          backgroundColor: colors.card,
        },
      ]}
    >
      <View style={{ marginBottom: 4 }}>{icon}</View>
      <Text style={[styles.statTitle, { color }]}>{title}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>
        {value}{' '}
        <Text style={[styles.statUnit, { color: colors.subtext }]}>{unit}</Text>
      </Text>
    </View>
  );

  const ActionButton = ({ title, subtitle, onPress, color, icon }) => (
    <TouchableOpacity
      style={[
        styles.actionButton,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View
        style={[
          styles.actionIconBubble,
          { backgroundColor: color || colors.accent },
        ]}
      >
        {icon}
      </View>
      <Text style={[styles.actionButtonTitle, { color: colors.text }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.actionButtonSubtitle, { color: colors.subtext }]}>
          {subtitle}
        </Text>
      ) : null}
    </TouchableOpacity>
  );

  const RecentWorkoutItem = ({ workout }) => {
    let dateLabel = '';
    try {
      const d =
        workout.createdAt?.toDate?.() || new Date(workout.createdAt || Date.now());
      dateLabel = d.toLocaleDateString();
    } catch {
      dateLabel = '';
    }

    return (
      <View
        style={[
          styles.recentWorkoutItem,
          { borderBottomColor: colors.border, backgroundColor: colors.card },
        ]}
      >
        <View style={styles.recentWorkoutInfo}>
          <Text style={[styles.recentWorkoutName, { color: colors.text }]}>
            {workout.exercise || 'Workout'}
          </Text>
          <Text style={[styles.recentWorkoutDetails, { color: colors.subtext }]}>
            {workout.duration || 0} min • {workout.type || 'general'}
          </Text>
        </View>
        <Text style={[styles.recentWorkoutDate, { color: colors.subtext }]}>
          {dateLabel}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <Text style={[styles.greeting, { color: colors.text }]}>
            Hello, {userData?.name || userData?.fullName || 'User'} 👋
          </Text>
          <Text style={[styles.date, { color: colors.subtext }]}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* TODAY'S PROGRESS – MAIN FOCUS CARD */}
        <View style={styles.section}>
          <View
            style={[
              styles.progressCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.progressHeaderRow}>
              <View>
                <Text
                  style={[styles.progressTitle, { color: colors.text }]}
                >
                  Today&apos;s Progress
                </Text>
                <Text
                  style={[styles.progressSubtitle, { color: colors.subtext }]}
                >
                  Keep going, you&apos;re doing great 💪
                </Text>
              </View>
              <View style={styles.progressBadge}>
                <Ionicons name="sunny-outline" size={16} color="#fff" />
                <Text style={styles.progressBadgeText}>Active day</Text>
              </View>
            </View>

            {/* Big daily score bar */}
            <View style={styles.mainBarTrack}>
              <View
                style={[
                  styles.mainBarFill,
                  {
                    width: `${Math.min(Math.max(todayPercent, 0), 100)}%`,
                    backgroundColor: colors.accent,
                  },
                ]}
              />
            </View>
            <View style={styles.mainBarLabelsRow}>
              <Text
                style={[styles.mainBarLabel, { color: colors.subtext }]}
              >
                Daily activity score
              </Text>
              <Text
                style={[styles.mainBarValue, { color: colors.accent }]}
              >
                {todayPercent}%
              </Text>
            </View>

            <View style={styles.mainBarTrack}>
              <View
                style={[
                  styles.mainBarFill,
                  {
                    width: `${Math.min(Math.max(todayPercent, 0), 100)}%`,
                    backgroundColor: colors.accent,
                  },
                ]}
              />
            </View>
            <View style={styles.mainBarLabelsRow}>
              <Text style={[styles.mainBarLabel, { color: colors.subtext }]}>
                Daily activity score
              </Text>
              <Text style={[styles.mainBarValue, { color: colors.accent }]}>
                {todayPercent}%
              </Text>
            </View>


            {/* Stats inside card */}
            <View style={styles.statsGrid}>
              <QuickStatCard
                title="Workouts"
                value={todayStats.workouts}
                unit="today"
                color="#FF7043"
                icon={
                  <FontAwesome5 name="dumbbell" size={18} color="#FF7043" />
                }
              />
              <QuickStatCard
                title="Duration"
                value={todayStats.totalDuration}
                unit="min"
                color="#FF0000"
                icon={
                  <Ionicons
                    name="timer-outline"
                    size={20}
                    color="#FF0000"
                  />
                }
              />
              <QuickStatCard
                title="Calories"
                value={todayStats.calories}
                unit="kcal"
                color="#4CAF50"
                icon={
                  <MaterialCommunityIcons
                    name="fire"
                    size={20}
                    color="#4CAF50"
                  />
                }
              />
              <QuickStatCard
                title="Total Workouts"
                value={userData?.totalWorkouts || 0}
                unit="all time"
                color="#9C27B0"
                icon={
                  <Ionicons
                    name="trophy-outline"
                    size={20}
                    color="#9C27B0"
                  />
                }
              />
            </View>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Quick Actions
          </Text>
          <View style={styles.actionGrid}>
            <ActionButton
              title="Log Workout"
              subtitle="Track your exercise"
              onPress={() => navigation.navigate('Workout')}
              color="#FF7043"
              icon={
                <FontAwesome5
                  name="dumbbell"
                  size={20}
                  color="#fff"
                />
              }
            />
            <ActionButton
              title="View Progress"
              subtitle="Check your stats"
              onPress={() => navigation.navigate('Progress')}
              color="#34C759"
              icon={
                <Ionicons
                  name="stats-chart-outline"
                  size={20}
                  color="#fff"
                />
              }
            />
            <ActionButton
              title="Set Goals"
              subtitle="Plan your fitness"
              onPress={() => navigation.navigate('Goals')}
              color="#9C27B0"
              icon={
                <Ionicons
                  name="flag-outline"
                  size={20}
                  color="#fff"
                />
              }
            />
            <ActionButton
              title="Water Intake"
              subtitle="Stay hydrated"
              onPress={() => navigation.navigate('WaterTracker')}
              color="#29B6F6"
              icon={
                <Ionicons
                  name="water-outline"
                  size={20}
                  color="#fff"
                />
              }
            />
            <ActionButton
              title="Log Food"
              subtitle="Track nutrition"
              onPress={() =>
                navigation.navigate('Nutrition', {
                  screen: 'AddMeal',
                })
              }
              color="#FF4567"
              icon={
                <MaterialCommunityIcons
                  name="food-apple-outline"
                  size={20}
                  color="#fff"
                />
              }
            />
            <ActionButton
              title="Edit Profile"
              subtitle="Update your info"
              onPress={() => navigation.navigate('EditProfile')}
              color="#6C63FF"
              icon={
                <Ionicons
                  name="person-circle-outline"
                  size={20}
                  color="#fff"
                />
              }
            />
          </View>
        </View>

        {/* RECENT WORKOUTS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              Recent Workouts
            </Text>
            {recentWorkouts.length > 0 && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Workout')}
              >
                <Text
                  style={[styles.seeAllText, { color: colors.accent }]}
                >
                  See All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {recentWorkouts.length === 0 ? (
            <View
              style={[
                styles.emptyWorkouts,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.emptyWorkoutsText,
                  { color: colors.subtext },
                ]}
              >
                No workouts yet. Start your fitness journey!
              </Text>
              <TouchableOpacity
                style={[
                  styles.startButton,
                  { backgroundColor: colors.accent },
                ]}
                onPress={() => navigation.navigate('Workout')}
              >
                <Text style={styles.startButtonText}>
                  Log First Workout
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.recentWorkoutsList,
                { backgroundColor: colors.card },
              ]}
            >
              {recentWorkouts.map((workout) => (
                <RecentWorkoutItem key={workout.id} workout={workout} />
              ))}
            </View>
          )}
        </View>

        {/* MOTIVATION CARD */}
        <View style={styles.section}>
          <View
            style={[
              styles.motivationCard,
              { backgroundColor: colors.accent },
            ]}
          >
            <Text style={styles.motivationQuote}>
              &quot;The only bad workout is the one that didn&apos;t
              happen.&quot;
            </Text>
            <Text style={styles.motivationAuthor}>- Anonymous</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 20 },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  greeting: { fontSize: 24, fontWeight: 'bold' },
  date: { fontSize: 16 },

  section: { marginTop: 20, paddingHorizontal: 20 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  seeAllText: { fontSize: 16, fontWeight: '600' },

  // Big progress card
  progressCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  progressBadgeText: {
    color: '#fff',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
  },
  mainBarTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(180,180,200,0.25)',
    overflow: 'hidden',
    marginTop: 6,
  },
  mainBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  mainBarLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  mainBarLabel: {
    fontSize: 12,
  },
  mainBarValue: {
    fontSize: 12,
    fontWeight: '600',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    width: '48%',
    marginBottom: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statTitle: { fontSize: 14, fontWeight: '600' },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statUnit: { fontSize: 12 },

  // Quick actions
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionButtonTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  actionButtonSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },

  // Recent workouts
  emptyWorkouts: {
    padding: 30,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyWorkoutsText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  startButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  startButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },

  recentWorkoutsList: { borderRadius: 8, overflow: 'hidden' },
  recentWorkoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  recentWorkoutInfo: { flex: 1 },
  recentWorkoutName: { fontSize: 16, fontWeight: '600' },
  recentWorkoutDetails: { fontSize: 14 },
  recentWorkoutDate: { fontSize: 12 },

  // Motivation
  motivationCard: { padding: 20, borderRadius: 8, alignItems: 'center' },
  motivationQuote: {
    color: 'white',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 5,
  },
  motivationAuthor: { color: 'white', fontSize: 14, opacity: 0.8 },

    // --- Big Today progress bar ---
  mainBarTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(180,180,200,0.25)',
    overflow: 'hidden',
    marginTop: 8,
  },
  mainBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  mainBarLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  mainBarLabel: {
    fontSize: 12,
  },
  mainBarValue: {
    fontSize: 12,
    fontWeight: '600',
  },

});

export default HomeScreen;
