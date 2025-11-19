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
<<<<<<< HEAD
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore'; // Thêm updateDoc
=======
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
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

<<<<<<< HEAD
  // Các state cho modal (dù bạn đã xóa modal, các hàm gọi chúng vẫn còn)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [newValue, setNewValue] = useState('');


=======
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
  useFocusEffect(
    React.useCallback(() => {
      fetchGoalsAndProgress();
    }, [])
  );

  // Bạn không cần 2 useEffect, useFocusEffect là đủ
  // useEffect(() => {
  //   fetchGoalsAndProgress();
  // }, []);

  const fetchGoalsAndProgress = async () => {
    try {
      // Fetch user goals
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().goals) {
          // Trộn goals từ DB với default goals để tránh lỗi undefined
          setGoals(prevDefaults => ({ ...prevDefaults, ...userDoc.data().goals }));
        }
      } catch (goalError)  {
        console.log('Could not fetch goals, using defaults:', goalError.message);
      }

      // Calculate current progress
      await calculateProgress();
    } catch (error) {
      console.error('Error fetching goals:', error);
      Alert.alert('Error', 'Failed to load goals data');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = async () => {
    try {
      const now = new Date();
      // Bắt đầu tuần từ Chủ Nhật (hoặc Thứ Hai, tùy logic của bạn)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Giả sử tuần bắt đầu từ Chủ Nhật
      startOfWeek.setHours(0, 0, 0, 0);
      
      const oneWeekAgo = startOfWeek; // Sử dụng startOfWeek thay vì 7 ngày
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const today = new Date().toISOString().split('T')[0];

      // Fetch workouts
      let workouts = [];
      try {
        const workoutsQuery = query(
          collection(db, 'workouts'),
          where('userId', '==', auth.currentUser.uid),
          where('createdAt', '>=', monthStart) // Tối ưu: Chỉ lấy workout trong tháng
        );
        const workoutsSnapshot = await getDocs(workoutsQuery);
        workouts = workoutsSnapshot.docs.map(doc => {
            const data = doc.data();
            // Đảm bảo createdAt là đối tượng Date
            data.createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            return data;
        });
      } catch (workoutError) {
        console.log('Could not fetch workouts for progress calculation:', workoutError.message);
      }

<<<<<<< HEAD
   
      const thisWeekWorkouts = workouts.filter(w => w.createdAt >= oneWeekAgo);
=======
      // Weekly workouts
      const thisWeekWorkouts = workouts.filter(w => {
        const date = w.createdAt?.toDate?.() || new Date(w.createdAt);
        return date >= oneWeekAgo;
      });
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c

      const weeklyWorkoutsCount = thisWeekWorkouts.length;
      const weeklyDurationCount = thisWeekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);

<<<<<<< HEAD
    
      const thisMonthWorkouts = workouts.filter(w => w.createdAt >= monthStart);
=======
      // Monthly workouts
      const thisMonthWorkouts = workouts.filter(w => {
        const date = w.createdAt?.toDate?.() || new Date(w.createdAt);
        return date >= monthStart;
      });
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c

      // Daily water
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

<<<<<<< HEAD
  // Hàm này đã tồn tại nhưng không được dùng vì modal đã bị xóa
  const openEditModal = (goalType) => {
    setEditingGoal(goalType);
    setNewValue(goals[goalType].toString());
    setShowEditModal(true);
  };

=======
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
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
    // SỬA LỖI: Thay thế các ký tự vỡ bằng emoji thật
    switch (goalType) {
<<<<<<< HEAD
      case 'weeklyWorkouts': return '🏃‍♂️'; // Trước đây là: 'ðŸƒâ€â™‚ï¸'
      case 'weeklyDuration': return '⏱️'; // Trước đây là: 'â±ï¸'
      case 'dailyWater': return '💧'; // Trước đây là: 'ðŸ’§'
      case 'monthlyWorkouts': return '📅'; // Trước đây là: 'ðŸ“…'
      default: return '🎯'; // Trước đây là: 'ðŸŽ¯'
=======
      case 'weeklyWorkouts': return '🏃‍♂️';
      case 'weeklyDuration': return '⏱️';
      case 'dailyWater': return '💧';
      case 'monthlyWorkouts': return '📅';
      default: return '🎯';
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    }
  };

  const getProgressPercentage = (goalType) => {
    const goal = goals[goalType];
    const current = progress[goalType];
    if (!goal || goal === 0) return 0; // Tránh chia cho 0
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
<<<<<<< HEAD
          // SỬA LỖI: Thay thế ký tự vỡ bằng emoji thật
=======
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
          <Text style={styles.completedMessage}>🎉 Goal Completed!</Text>
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
<<<<<<< HEAD
          {/* SỬA LỖI: Thay thế ký tự vỡ bằng emoji thật */}
=======
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
          <Text style={styles.actionIcon}>💪</Text>
          <Text style={styles.actionText}>Add Workout</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={addWaterGlass}
        >
<<<<<<< HEAD
          {/* SỬA LỖI: Thay thế ký tự vỡ bằng emoji thật */}
=======
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
          <Text style={styles.actionIcon}>💧</Text>
          <Text style={styles.actionText}>Drink Water</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Progress')}
        >
<<<<<<< HEAD
          {/* SỬA LỖI: Thay thế ký tự vỡ bằng emoji thật */}
=======
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>View Progress</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

<<<<<<< HEAD
  // Tệp của bạn có tham chiếu đến EditGoalModal nhưng nó trả về null
  // Điều này là bình thường nếu bạn đã chuyển nó sang một màn hình riêng
  const EditGoalModal = () => {
    return null;
  };

=======
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
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

// ... styles của bạn (giữ nguyên không đổi)
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
<<<<<<< HEAD
  
  // Bạn có các style này nhưng không có modal
  // Tôi sẽ giữ chúng lại phòng trường hợp bạn dùng ở đâu đó
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
=======
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
});

export default GoalsScreen;