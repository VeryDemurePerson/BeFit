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

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([fetchUserData(), fetchTodayStats(), fetchRecentWorkouts()]);
    setLoading(false);
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

      querySnapshot.forEach((doc) => {
        const workout = doc.data();
        workoutCount++;
        totalDuration += workout.duration || 0;
        const caloriesPerMinute =
          workout.type === 'cardio' ? 8 : workout.type === 'strength' ? 6 : 4;
        estimatedCalories += (workout.duration || 0) * caloriesPerMinute;
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
      let workoutList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      workoutList.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB - dateA;
      });
      setRecentWorkouts(workoutList.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent workouts:', error);
    }
  };

  const QuickStatCard = ({ title, value, unit, color, icon }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={{ marginBottom: 5 }}>{icon}</View>
      <Text style={[styles.statTitle, { color }]}>{title}</Text>
      <Text style={styles.statValue}>
        {value} <Text style={styles.statUnit}>{unit}</Text>
      </Text>
    </View>
  );

  const ActionButton = ({ title, subtitle, onPress, color, icon }) => (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor: color }]}
      onPress={onPress}
    >
      {icon}
      <Text style={styles.actionButtonTitle}>{title}</Text>
      <Text style={styles.actionButtonSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );

  const RecentWorkoutItem = ({ workout }) => (
    <View style={styles.recentWorkoutItem}>
      <View style={styles.recentWorkoutInfo}>
        <Text style={styles.recentWorkoutName}>{workout.exercise}</Text>
        <Text style={styles.recentWorkoutDetails}>
          {workout.duration} min • {workout.type}
        </Text>
      </View>
      <Text style={styles.recentWorkoutDate}>
        {new Date(workout.createdAt.toDate()).toLocaleDateString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {userData?.name || 'User'} 👋</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.statsGrid}>
            <QuickStatCard
              title="Workouts"
              value={todayStats.workouts}
              unit="sessions"
              color="#FF7043"
              icon={<FontAwesome5 name="dumbbell" size={20} color="#FF7043" />}
            />
            <QuickStatCard
              title="Duration"
              value={todayStats.totalDuration}
              unit="min"
              color="#ff0000ff"
              icon={<Ionicons name="timer-outline" size={22} color="#ff0000ff" />}
            />
            <QuickStatCard
              title="Calories"
              value={todayStats.calories}
              unit="kcal"
              color="#4CAF50"
              icon={<MaterialCommunityIcons name="fire" size={22} color="#4CAF50" />}
            />
            <QuickStatCard
              title="Total Workouts"
              value={userData?.totalWorkouts || 0}
              unit="all time"
              color="#9C27B0"
              icon={<Ionicons name="trophy-outline" size={22} color="#9C27B0" />}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <ActionButton
              title="Log Workout"
              subtitle="Track your exercise"
              onPress={() => navigation.navigate('Workout')}
              color="#FF7043"
              icon={<FontAwesome5 name="dumbbell" size={26} color="white" style={{ marginBottom: 6 }} />}
            />
            <ActionButton
              title="View Progress"
              subtitle="Check your stats"
              onPress={() => navigation.navigate('Progress')}
              color="#34C759"
              icon={<Ionicons name="stats-chart-outline" size={26} color="white" style={{ marginBottom: 6 }} />}
            />
            <ActionButton
              title="Set Goals"
              subtitle="Plan your fitness"
              onPress={() => navigation.navigate('Goals')}
              color="#9C27B0"
              icon={<Ionicons name="flag-outline" size={26} color="white" style={{ marginBottom: 6 }} />}
            />
            <ActionButton
              title="Water Intake"
              subtitle="Stay hydrated"
              onPress={() => {}}
              color="#29B6F6"
              icon={<Ionicons name="water-outline" size={26} color="white" style={{ marginBottom: 6 }} />}
            />
            <ActionButton
              title="Log Food"
              subtitle="Track nutrition"
              onPress={() => navigation.navigate('Nutrition', { screen: 'AddMeal' })}
              color="#FF4567"
              icon={<MaterialCommunityIcons name="food-apple-outline" size={26} color="white" style={{ marginBottom: 6 }} />}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            {recentWorkouts.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('Workout')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentWorkouts.length === 0 ? (
            <View style={styles.emptyWorkouts}>
              <Text style={styles.emptyWorkoutsText}>
                No workouts yet. Start your fitness journey!
              </Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => navigation.navigate('Workout')}
              >
                <Text style={styles.startButtonText}>Log First Workout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.recentWorkoutsList}>
              {recentWorkouts.map((workout) => (
                <RecentWorkoutItem key={workout.id} workout={workout} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.motivationCard}>
            <Text style={styles.motivationQuote}>
              "The only bad workout is the one that didn't happen."
            </Text>
            <Text style={styles.motivationAuthor}>- Anonymous</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 20 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  date: { fontSize: 16, color: '#666' },
  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  seeAllText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { backgroundColor: 'white', padding: 15, borderRadius: 8, width: '48%', marginBottom: 10, borderLeftWidth: 4 },
  statTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statUnit: { fontSize: 12, color: '#666' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionButton: { padding: 20, borderRadius: 8, width: '48%', marginBottom: 10, alignItems: 'center' },
  actionButtonTitle: { color: 'white', fontSize: 16, fontWeight: '600', marginTop: 5 },
  actionButtonSubtitle: { color: 'white', fontSize: 12, opacity: 0.9 },
  emptyWorkouts: { backgroundColor: 'white', padding: 30, borderRadius: 8, alignItems: 'center' },
  emptyWorkoutsText: { color: '#666', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  startButton: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 },
  startButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  recentWorkoutsList: { backgroundColor: 'white', borderRadius: 8 },
  recentWorkoutItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  recentWorkoutInfo: { flex: 1 },
  recentWorkoutName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 2 },
  recentWorkoutDetails: { fontSize: 14, color: '#666' },
  recentWorkoutDate: { fontSize: 12, color: '#999' },
  motivationCard: { backgroundColor: '#007AFF', padding: 20, borderRadius: 8, alignItems: 'center' },
  motivationQuote: { color: 'white', fontSize: 16, fontStyle: 'italic', textAlign: 'center', marginBottom: 5 },
  motivationAuthor: { color: 'white', fontSize: 14, opacity: 0.8 },
});

export default HomeScreen;
