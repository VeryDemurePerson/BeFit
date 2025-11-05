// src/screens/WorkoutScreen.js - Updated with Edit/Delete + Light/Dark Mode
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from './themes';

const WorkoutScreen = ({ navigation }) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  useFocusEffect(
    React.useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('userId', '==', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(workoutsQuery);
      const workoutList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      workoutList.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || Date.now());
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || Date.now());
        return dateB - dateA;
      });
      setWorkouts(workoutList);
    } catch (error) {
      console.error('Error fetching workouts:', error);
      Alert.alert('Error', 'Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkouts();
    setRefreshing(false);
  };

  const navigateToAddWorkout = () => {
    navigation.navigate('AddWorkout');
  };

  const navigateToEditWorkout = (workout) => {
    navigation.navigate('EditWorkout', { mode: 'edit', workout });
  };

  const deleteWorkout = (workout) => {
    Alert.alert(
      'Delete Workout',
      `Are you sure you want to delete "${workout.exercise}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'workouts', workout.id));
              Alert.alert('Success', 'Workout deleted successfully!');
              fetchWorkouts();
            } catch (error) {
              console.error('Error deleting workout:', error);
              Alert.alert('Error', 'Failed to delete workout');
            }
          },
        },
      ]
    );
  };

  const getWorkoutTypeColor = (type) => {
    switch (type) {
      case 'strength':
        return '#FF6B6B';
      case 'cardio':
        return '#4ECDC4';
      case 'flexibility':
        return '#45B7D1';
      default:
        return '#007AFF';
    }
  };

  const renderWorkoutDetails = (workout) => {
    const details = [];

    details.push(
      <View key="duration" style={styles.workoutDetailItem}>
        <Text style={[styles.workoutDetailLabel, { color: colors.subtext }]}>Duration:</Text>
        <Text style={[styles.workoutDetailValue, { color: colors.text }]}>
          {workout.duration} min
        </Text>
      </View>
    );

    if (workout.detectedFields) {
      Object.entries(workout.detectedFields).forEach(([field, value]) => {
        if (value !== null && value !== undefined) {
          const label = field.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
          let displayValue = value;

          if (field === 'distance') displayValue += ' km';
          else if (field === 'pace') displayValue += ' min/km';
          else if (field === 'speed') displayValue += ' km/h';
          else if (field === 'calories') displayValue += ' kcal';
          else if (field === 'weight') displayValue += ' kg';
          else if (field === 'sets') displayValue += ' sets';
          else if (field === 'reps') displayValue += ' reps';
          else if (field === 'steps') displayValue += ' steps';
          else if (field === 'hold_time') displayValue += ' sec';

          details.push(
            <View key={field} style={styles.workoutDetailItem}>
              <Text style={[styles.workoutDetailLabel, { color: colors.subtext }]}>{label}:</Text>
              <Text style={[styles.workoutDetailValue, { color: colors.text }]}>{displayValue}</Text>
            </View>
          );
        }
      });
    }

    return details;
  };

  const WorkoutCard = ({ workout }) => {
    const workoutDate = workout.createdAt?.toDate?.()
      ? new Date(workout.createdAt.toDate())
      : new Date(workout.createdAt || Date.now());

    return (
      <View style={[styles.workoutCard, { backgroundColor: colors.card }]}>
        <View style={styles.workoutHeader}>
          <Text style={[styles.workoutExercise, { color: colors.text }]}>{workout.exercise}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigateToEditWorkout(workout)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteWorkout(workout)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.workoutSubHeader}>
          <View
            style={[
              styles.workoutTypeBadge,
              { backgroundColor: getWorkoutTypeColor(workout.type) },
            ]}
          >
            <Text style={styles.workoutType}>{workout.type}</Text>
          </View>
        </View>

        <View style={styles.workoutDetails}>{renderWorkoutDetails(workout)}</View>

        {workout.notes && (
          <View style={styles.notesContainer}>
            <Text style={[styles.workoutNotes, { color: colors.subtext }]}>
              {workout.notes}
            </Text>
          </View>
        )}

        <Text style={[styles.workoutDate, { color: colors.subtext }]}>
          {workoutDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
          {workout.updatedAt && ' (edited)'}
        </Text>
      </View>
    );
  };

  const WorkoutStats = () => {
    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const thisWeek = workouts.filter((w) => {
      const date = w.createdAt?.toDate?.()
        ? new Date(w.createdAt.toDate())
        : new Date(w.createdAt || Date.now());
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }).length;

    return (
      <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.accent }]}>{totalWorkouts}</Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Total Workouts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.accent }]}>
            {Math.round((totalDuration / 60) * 10) / 10}
          </Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Hours Trained</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.accent }]}>{thisWeek}</Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>This Week</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading workouts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Workouts</Text>
        <TouchableOpacity style={styles.addButton} onPress={navigateToAddWorkout}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {workouts.length > 0 && <WorkoutStats />}

        <View style={styles.workoutsList}>
          {workouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>💪</Text>
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No workouts yet</Text>
              <Text style={[styles.emptyStateText, { color: colors.subtext }]}>
                Start your fitness journey by logging your first workout!
              </Text>
              <TouchableOpacity style={styles.startButton} onPress={navigateToAddWorkout}>
                <Text style={styles.startButtonText}>Log First Workout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            workouts.map((workout) => <WorkoutCard key={workout.id} workout={workout} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  statsContainer: {
    flexDirection: 'row',
    margin: 20,
    borderRadius: 8,
    padding: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12, textAlign: 'center' },
  workoutsList: { paddingHorizontal: 20, paddingBottom: 20 },
  workoutCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  workoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  workoutExercise: { fontSize: 18, fontWeight: 'bold' },
  actionButtons: { flexDirection: 'row', gap: 8 },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },
  workoutSubHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  workoutTypeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  workoutType: { color: 'white', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  workoutDetails: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  workoutDetailItem: { flexDirection: 'row', marginRight: 15, marginBottom: 4 },
  workoutDetailLabel: { fontSize: 14 },
  workoutDetailValue: { fontSize: 14, fontWeight: '600' },
  notesContainer: { marginBottom: 8 },
  workoutNotes: { fontSize: 14, fontStyle: 'italic' },
  workoutDate: { fontSize: 12, textAlign: 'right' },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyStateIcon: { fontSize: 48, marginBottom: 20 },
  emptyStateTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  emptyStateText: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 30 },
  startButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});

export default WorkoutScreen;
