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
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [todayStats, setTodayStats] = useState({
    workouts: 0,
    totalDuration: 0,
    calories: 0
  });
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchUserData(),
      fetchTodayStats(),
      fetchRecentWorkouts()
    ]);
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
        
        // Simple calorie estimation (can be improved)
        const caloriesPerMinute = workout.type === 'cardio' ? 8 : 
                                  workout.type === 'strength' ? 6 : 4;
        estimatedCalories += (workout.duration || 0) * caloriesPerMinute;
      });

      setTodayStats({
        workouts: workoutCount,
        totalDuration,
        calories: estimatedCalories
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
      let workoutList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort in JavaScript and take first 5
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

  const QuickStatCard = ({ title, value, unit, color = '#007AFF', subtitle }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>
        {value} <Text style={styles.statUnit}>{unit}</Text>
      </Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const ActionButton = ({ title, subtitle, onPress, color = '#007AFF' }) => (
    <TouchableOpacity 
      style={[styles.actionButton, { backgroundColor: color }]} 
      onPress={onPress}
    >
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {userData?.name || 'User'}! 👋
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* Today's Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.statsGrid}>
            <QuickStatCard 
              title="Workouts" 
              value={todayStats.workouts} 
              unit="sessions" 
              color="#FF6B6B"
              subtitle="today"
            />
            <QuickStatCard 
              title="Duration" 
              value={todayStats.totalDuration} 
              unit="min" 
              color="#4ECDC4"
              subtitle="total"
            />
            <QuickStatCard 
              title="Calories" 
              value={todayStats.calories} 
              unit="kcal" 
              color="#45B7D1"
              subtitle="estimated"
            />
            <QuickStatCard 
              title="Total Workouts" 
              value={userData?.totalWorkouts || 0} 
              unit="all time" 
              color="#96CEB4"
              subtitle="lifetime"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <ActionButton
              title="Log Workout"
              subtitle="Track your exercise"
              onPress={() => navigation.navigate('Workout')}
              color="#007AFF"
            />
            <ActionButton
              title="View Progress"
              subtitle="Check your stats"
              onPress={() => navigation.navigate('Progress')}
              color="#AF52DE"
            />
            <ActionButton
              title="Set Goals"
              subtitle="Plan your fitness"
              onPress={() => navigation.navigate('Goals')}
              color="#FF9500"
            />
            <ActionButton
              title="Water Intake"
              subtitle="Stay hydrated"
              onPress={() => {}}
              color="#34C759"
            />

<ActionButton
  title="Log Food"
  subtitle="Track nutrition"
  onPress={() => navigation.navigate('Nutrition', { screen: 'AddMeal' })}
  color="#FF4567"
/>
          </View>
        </View>

        {/* Recent Workouts */}
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

        {/* Motivational Quote */}
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  date: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  seeAllText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    width: '48%',
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#666',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    padding: 20,
    borderRadius: 8,
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
  },
  actionButtonTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  actionButtonSubtitle: {
    color: 'white',
    fontSize: 12,
    opacity: 0.9,
  },
  emptyWorkouts: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyWorkoutsText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  recentWorkoutsList: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
  },
  recentWorkoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentWorkoutInfo: {
    flex: 1,
  },
  recentWorkoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  recentWorkoutDetails: {
    fontSize: 14,
    color: '#666',
  },
  recentWorkoutDate: {
    fontSize: 12,
    color: '#999',
  },
  motivationCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  motivationQuote: {
    color: 'white',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 5,
  },
  motivationAuthor: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
  },
});

export default HomeScreen;