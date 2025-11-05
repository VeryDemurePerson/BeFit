// src/screens/GoalsScreen.js
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from './themes';

const GoalsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  const [goals, setGoals] = useState({
    weeklyWorkouts: 3,
    weeklyDuration: 150,
    dailyWater: 8,
    monthlyWorkouts: 12,
  });
  const [progress, setProgress] = useState({
    weeklyWorkouts: 0,
    weeklyDuration: 0,
    dailyWater: 0,
    monthlyWorkouts: 0,
  });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchGoalsAndProgress();
    }, [])
  );

  useEffect(() => {
    fetchGoalsAndProgress();
  }, []);

  const fetchGoalsAndProgress = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists() && userDoc.data().goals) {
        setGoals(userDoc.data().goals);
      }
      await calculateProgress();
    } catch (error) {
      Alert.alert('Error', 'Failed to load goals data');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = async () => {
    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const today = new Date().toISOString().split('T')[0];

      let workouts = [];
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('userId', '==', auth.currentUser.uid)
      );
      const workoutsSnapshot = await getDocs(workoutsQuery);
      workouts = workoutsSnapshot.docs.map(doc => doc.data());

      const thisWeekWorkouts = workouts.filter(w => {
        const date = w.createdAt?.toDate?.() || new Date(w.createdAt);
        return date >= oneWeekAgo;
      });
      const weeklyWorkoutsCount = thisWeekWorkouts.length;
      const weeklyDurationCount = thisWeekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);

      const thisMonthWorkouts = workouts.filter(w => {
        const date = w.createdAt?.toDate?.() || new Date(w.createdAt);
        return date >= monthStart;
      });

      let dailyWaterCount = 0;
      const waterDoc = await getDoc(doc(db, 'water_intake', `${auth.currentUser.uid}_${today}`));
      dailyWaterCount = waterDoc.exists() ? waterDoc.data().glasses : 0;

      setProgress({
        weeklyWorkouts: weeklyWorkoutsCount,
        weeklyDuration: weeklyDurationCount,
        dailyWater: dailyWaterCount,
        monthlyWorkouts: thisMonthWorkouts.length,
      });
    } catch (error) {
      console.error('Error calculating progress:', error);
    }
  };

  const addWaterGlass = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const waterDocRef = doc(db, 'water_intake', `${auth.currentUser.uid}_${today}`);
      const waterDoc = await getDoc(waterDocRef);
      const currentGlasses = waterDoc.exists() ? waterDoc.data().glasses : 0;

      await setDoc(
        waterDocRef,
        {
          userId: auth.currentUser.uid,
          date: today,
          glasses: currentGlasses + 1,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      setProgress(prev => ({
        ...prev,
        dailyWater: currentGlasses + 1,
      }));
      Alert.alert('Great!', `Water glass added! Total today: ${currentGlasses + 1}`);
    } catch (error) {
      Alert.alert('Error', `Failed to add water glass: ${error.message}`);
    }
  };

  const getGoalTitle = goalType => {
    switch (goalType) {
      case 'weeklyWorkouts':
        return 'Weekly Workouts';
      case 'weeklyDuration':
        return 'Weekly Minutes';
      case 'dailyWater':
        return 'Daily Water (glasses)';
      case 'monthlyWorkouts':
        return 'Monthly Workouts';
      default:
        return '';
    }
  };

  const getGoalIcon = goalType => {
    switch (goalType) {
      case 'weeklyWorkouts': return '🏃‍♂️';
      case 'weeklyDuration': return '⏱️';
      case 'dailyWater': return '💧';
      case 'monthlyWorkouts': return '📅';
      default: return '🎯';
    }
  };

  const getProgressPercentage = goalType => {
    const goal = goals[goalType];
    const current = progress[goalType];
    if (goal === 0) return 0;
    return Math.min(Math.round((current / goal) * 100), 100);
  };

  const GoalCard = ({ goalType }) => {
    const percentage = getProgressPercentage(goalType);
    const isCompleted = percentage >= 100;
    const current = progress[goalType];
    const target = goals[goalType];

    return (
      <View
        style={[
          styles.goalCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          isCompleted && { borderWidth: 2, borderColor: '#4CAF50' },
        ]}
      >
        <View style={styles.goalHeader}>
          <Text style={[styles.goalIcon, { color: colors.text }]}>{getGoalIcon(goalType)}</Text>
          <View style={styles.goalInfo}>
            <Text style={[styles.goalTitle, { color: colors.text }]}>{getGoalTitle(goalType)}</Text>
            <Text style={[styles.goalProgress, { color: colors.subtext }]}>
              {current} / {target}
            </Text>
          </View>
          <View style={styles.goalActions}>
            <Text
              style={[
                styles.goalPercentage,
                { color: isCompleted ? '#4CAF50' : colors.accent },
              ]}
            >
              {percentage}%
            </Text>
            <TouchableOpacity
              style={[styles.modifyButton, { backgroundColor: colors.accent }]}
              onPress={() =>
                navigation.navigate('EditGoal', { goalType, currentValue: target })
              }
            >
              <Text style={styles.modifyButtonText}>Modify</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View
          style={[
            styles.progressBarContainer,
            { backgroundColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.progressBar,
              { width: `${percentage}%`, backgroundColor: isCompleted ? '#4CAF50' : colors.accent },
            ]}
          />
        </View>
        {isCompleted && (
          <Text style={[styles.completedMessage, { color: '#4CAF50' }]}>
            🎉 Goal Completed!
          </Text>
        )}
      </View>
    );
  };

  const QuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Workout', { screen: 'AddWorkout' })}
        >
          <Text style={styles.actionIcon}>💪</Text>
          <Text style={[styles.actionText, { color: colors.text }]}>Add Workout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={addWaterGlass}
        >
          <Text style={styles.actionIcon}>💧</Text>
          <Text style={[styles.actionText, { color: colors.text }]}>Drink Water</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Progress')}
        >
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={[styles.actionText, { color: colors.text }]}>View Progress</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>Loading goals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Goals</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.goalsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Fitness Goals</Text>
          {Object.keys(goals).map(goalType => (
            <GoalCard key={goalType} goalType={goalType} />
          ))}
        </View>
        <QuickActions />
        <View
          style={[
            styles.motivationContainer,
            { backgroundColor: '#007AFF' },
          ]}
        >
          <Text style={styles.motivationTitle}>Stay Motivated</Text>
          <Text style={styles.motivationText}>
            "Setting goals is the first step in turning the invisible into the visible."
          </Text>
          <Text style={styles.motivationAuthor}>- Tony Robbins</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  content: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  goalsContainer: { padding: 20 },
  goalCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
  },
  goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  goalIcon: { fontSize: 24, marginRight: 15 },
  goalInfo: { flex: 1 },
  goalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  goalProgress: { fontSize: 14 },
  goalActions: { alignItems: 'flex-end' },
  goalPercentage: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  modifyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modifyButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: { height: '100%', borderRadius: 4 },
  completedMessage: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  quickActionsContainer: { padding: 20, paddingTop: 0 },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
  },
  actionIcon: { fontSize: 24, marginBottom: 8 },
  actionText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  motivationContainer: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  motivationText: {
    fontSize: 16,
    color: 'white',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  motivationAuthor: { fontSize: 14, color: 'white', opacity: 0.8 },
});

export default GoalsScreen;
