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
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useFocusEffect } from '@react-navigation/native';

const GoalsScreen = ({ navigation }) => {
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
     
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().goals) {
          setGoals(userDoc.data().goals);
        }
      } catch (goalError) {
        console.log('Could not fetch goals, using defaults:', goalError.message);
      }

      // Calculate current progress
      await calculateProgress();
    } catch (error) {
      console.error('Error fetching goals:', error);
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
      try {
        const workoutsQuery = query(
          collection(db, 'workouts'),
          where('userId', '==', auth.currentUser.uid)
        );
        const workoutsSnapshot = await getDocs(workoutsQuery);
        workouts = workoutsSnapshot.docs.map(doc => doc.data());
      } catch (workoutError) {
        console.log('Could not fetch workouts for progress calculation:', workoutError.message);
      }

   
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
      try {
        const waterDoc = await getDoc(doc(db, 'water_intake', `${auth.currentUser.uid}_${today}`));
        dailyWaterCount = waterDoc.exists() ? waterDoc.data().glasses : 0;
      } catch (waterError) {
        console.log('Could not fetch water data:', waterError.message);
      }

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

  const updateGoal = async (goalType, value) => {
    try {
      const newGoals = { ...goals, [goalType]: parseInt(value) };
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        
        await updateDoc(userRef, {
          goals: newGoals
        });
      } else {
        
        await setDoc(userRef, {
          goals: newGoals,
          email: auth.currentUser.email,
          createdAt: new Date()
        });
      }
      
      setGoals(newGoals);
      setShowEditModal(false);
      Alert.alert('Success', 'Goal updated successfully!');
    } catch (error) {
      Alert.alert('Error', `Failed to update goal: ${error.message}`);
      console.error('Error updating goal:', error);
    }
  };

  const addWaterGlass = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const waterDocRef = doc(db, 'water_intake', `${auth.currentUser.uid}_${today}`);
      
      const waterDoc = await getDoc(waterDocRef);
      const currentGlasses = waterDoc.exists() ? waterDoc.data().glasses : 0;
      
      await setDoc(waterDocRef, {
        userId: auth.currentUser.uid,
        date: today,
        glasses: currentGlasses + 1,
        updatedAt: new Date()
      }, { merge: true });
      
     
      setProgress(prev => ({
        ...prev,
        dailyWater: currentGlasses + 1
      }));
      
      Alert.alert('Great!', `Water glass added! Total today: ${currentGlasses + 1}`);
    } catch (error) {
      Alert.alert('Error', `Failed to add water glass: ${error.message}`);
      console.error('Error adding water:', error);
    }
  };

  const openEditModal = (goalType) => {
    setEditingGoal(goalType);
    setNewValue(goals[goalType].toString());
    setShowEditModal(true);
  };

  const getGoalTitle = (goalType) => {
    switch (goalType) {
      case 'weeklyWorkouts': return 'Weekly Workouts';
      case 'weeklyDuration': return 'Weekly Minutes';
      case 'dailyWater': return 'Daily Water (glasses)';
      case 'monthlyWorkouts': return 'Monthly Workouts';
      default: return '';
    }
  };

  const getGoalIcon = (goalType) => {
    switch (goalType) {
      case 'weeklyWorkouts': return 'ðŸƒâ€â™‚ï¸';
      case 'weeklyDuration': return 'â±ï¸';
      case 'dailyWater': return 'ðŸ’§';
      case 'monthlyWorkouts': return 'ðŸ“…';
      default: return 'ðŸŽ¯';
    }
  };

  const getProgressPercentage = (goalType) => {
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
      <View style={[styles.goalCard, isCompleted && styles.completedGoal]}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalIcon}>{getGoalIcon(goalType)}</Text>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>{getGoalTitle(goalType)}</Text>
            <Text style={styles.goalProgress}>
              {current} / {target}
            </Text>
          </View>
          <View style={styles.goalActions}>
            <Text style={[styles.goalPercentage, isCompleted && styles.completedText]}>
              {percentage}%
            </Text>
            <TouchableOpacity 
              style={styles.modifyButton}
              onPress={() => navigation.navigate('EditGoal', { 
                goalType: goalType, 
                currentValue: target 
              })}
            >
              <Text style={styles.modifyButtonText}>Modify</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${percentage}%` },
              isCompleted && styles.completedProgressBar
            ]} 
          />
        </View>
        
        {isCompleted && (
          <Text style={styles.completedMessage}>ðŸŽ‰ Goal Completed!</Text>
        )}
      </View>
    );
  };

  const QuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Workout', { screen: 'AddWorkout' })}
        >
          <Text style={styles.actionIcon}>💪</Text>
          <Text style={styles.actionText}>Add Workout</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={addWaterGlass}
        >
          <Text style={styles.actionIcon}>ðŸ’§</Text>
          <Text style={styles.actionText}>Drink Water</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Progress')}
        >
          <Text style={styles.actionIcon}>ðŸ“Š</Text>
          <Text style={styles.actionText}>View Progress</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const EditGoalModal = () => {
   
    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading goals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Goals</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Goals Overview */}
        <View style={styles.goalsContainer}>
          <Text style={styles.sectionTitle}>Your Fitness Goals</Text>
          
          {Object.keys(goals).map(goalType => (
            <GoalCard key={goalType} goalType={goalType} />
          ))}
        </View>

        {/* Quick Actions */}
        <QuickActions />

        {/* Motivation Section */}
        <View style={styles.motivationContainer}>
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  goalsContainer: {
    padding: 20,
  },
  goalCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedGoal: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  goalIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  goalProgress: {
    fontSize: 14,
    color: '#666',
  },
  goalActions: {
    alignItems: 'flex-end',
  },
  goalPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  modifyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modifyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  completedText: {
    color: '#4CAF50',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  completedProgressBar: {
    backgroundColor: '#4CAF50',
  },
  completedMessage: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  quickActionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  motivationContainer: {
    backgroundColor: '#007AFF',
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
  motivationAuthor: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
  },
  
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCancel: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSave: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 100,
  },
  editGoalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  goalInput: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#ddd',
    textAlign: 'center',
    width: 200,
    marginBottom: 15,
  },
  goalHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default GoalsScreen;