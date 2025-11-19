<<<<<<< HEAD
// src/screens/EditGoalScreen.js
=======
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
<<<<<<< HEAD

=======
 
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
const EditGoalScreen = ({ navigation, route }) => {
  const { goalType, currentValue } = route.params;
  const [newValue, setNewValue] = useState(currentValue.toString());
  const [loading, setLoading] = useState(false);
<<<<<<< HEAD

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
<<<<<<< HEAD

  const getGoalIcon = (goalType) => {
    // SỬA LỖI: Thay thế các ký tự vỡ bằng emoji thật
    switch (goalType) {
      case 'weeklyWorkouts': return '🏃‍♂️'; // Trước đây là: 'ðŸƒâ€â™‚ï¸'
      case 'weeklyDuration': return '⏱️'; // Trước đây là: 'â±ï¸'
      case 'dailyWater': return '💧'; // Trước đây là: 'ðŸ’§'
      case 'monthlyWorkouts': return '📅'; // Trước đây là: 'ðŸ“…'
      default: return '🎯'; // Trước đây là: 'ðŸŽ¯'
    }
  };

=======
 
  const getGoalIcon = (goalType) => {
    switch (goalType) {
      case 'weeklyWorkouts': return 'ðŸƒâ€â™‚ï¸';
      case 'weeklyDuration': return 'â±ï¸';
      case 'dailyWater': return 'ðŸ’§';
      case 'monthlyWorkouts': return 'ðŸ“…';
      default: return 'ðŸŽ¯';
    }
  };
 
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
  const getGoalHint = (goalType) => {
    switch (goalType) {
      case 'weeklyWorkouts': return 'How many workouts per week?';
      case 'weeklyDuration': return 'How many minutes per week?';
      case 'dailyWater': return 'How many glasses per day?';
      case 'monthlyWorkouts': return 'How many workouts per month?';
      default: return '';
    }
  };
<<<<<<< HEAD

=======
 
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
  const getSuggestions = (goalType) => {
    switch (goalType) {
      case 'weeklyWorkouts': return ['2', '3', '4', '5'];
      case 'weeklyDuration': return ['90', '120', '150', '180'];
      case 'dailyWater': return ['6', '8', '10', '12'];
      case 'monthlyWorkouts': return ['8', '12', '16', '20'];
      default: return [];
    }
  };
<<<<<<< HEAD

=======
 
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
  const updateGoal = async () => {
    if (!newValue || isNaN(parseInt(newValue)) || parseInt(newValue) < 1) {
      Alert.alert('Error', 'Please enter a valid number greater than 0');
      return;
    }
<<<<<<< HEAD

=======
 
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    setLoading(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Check if user document exists first
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Update existing document
        const currentGoals = userDoc.data().goals || {};
        await updateDoc(userRef, {
          goals: {
            ...currentGoals,
            [goalType]: parseInt(newValue)
          }
        });
      } else {
        // Create new document with goals
        await setDoc(userRef, {
          goals: {
            [goalType]: parseInt(newValue)
          },
          email: auth.currentUser.email,
          createdAt: new Date()
        });
      }
      
      Alert.alert('Success', 'Goal updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      Alert.alert('Error', `Failed to update goal: ${error.message}`);
      console.error('Error updating goal:', error);
    } finally {
      setLoading(false);
    }
  };
<<<<<<< HEAD

  const SuggestionButton = ({ value }) => (
    <TouchableOpacity 
=======
 
  const SuggestionButton = ({ value }) => (
    <TouchableOpacity
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
      style={[styles.suggestionButton, newValue === value && styles.suggestionButtonActive]}
      onPress={() => setNewValue(value)}
    >
      <Text style={[styles.suggestionText, newValue === value && styles.suggestionTextActive]}>
        {value}
      </Text>
    </TouchableOpacity>
  );
<<<<<<< HEAD

=======
 
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Goal</Text>
        <TouchableOpacity onPress={updateGoal} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.disabled]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
<<<<<<< HEAD

=======
 
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Goal Info */}
        <View style={styles.goalInfoContainer}>
          <Text style={styles.goalIcon}>{getGoalIcon(goalType)}</Text>
          <Text style={styles.goalTitle}>{getGoalTitle(goalType)}</Text>
          <Text style={styles.goalHint}>{getGoalHint(goalType)}</Text>
        </View>
<<<<<<< HEAD

=======
 
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
        {/* Current Value Display */}
        <View style={styles.currentValueContainer}>
          <Text style={styles.currentValueLabel}>Current Goal:</Text>
          <Text style={styles.currentValue}>{currentValue}</Text>
        </View>
<<<<<<< HEAD

=======
 
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
        {/* Input Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>New Goal Value</Text>
          <TextInput
            style={styles.input}
            value={newValue}
            onChangeText={setNewValue}
            keyboardType="numeric"
            placeholder="Enter goal value"
            returnKeyType="done"
            autoFocus={true}
          />
        </View>
<<<<<<< HEAD

=======
 
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
        {/* Quick Suggestions */}
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Quick Select:</Text>
          <View style={styles.suggestionsGrid}>
            {getSuggestions(goalType).map((suggestion) => (
              <SuggestionButton key={suggestion} value={suggestion} />
            ))}
          </View>
        </View>
<<<<<<< HEAD

        {/* Goal Tips */}
        <View style={styles.tipsContainer}>
          {/* SỬA LỖI: Thay thế ký tự vỡ bằng emoji thật */}
          <Text style={styles.tipsTitle}>💡 Tips</Text>
          
          {/* SỬA LỖI: Thay thế 'â€¢' bằng dấu '•' */}
          {goalType === 'weeklyWorkouts' && (
            <>
              <Text style={styles.tipText}>• Beginners: Start with 2-3 workouts per week</Text>
              <Text style={styles.tipText}>• Intermediate: Aim for 3-4 workouts per week</Text>
              <Text style={styles.tipText}>• Advanced: 4-5 workouts per week</Text>
=======
 
        {/* Goal Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>ðŸ’¡ Tips</Text>
          {goalType === 'weeklyWorkouts' && (
            <>
              <Text style={styles.tipText}>â€¢ Beginners: Start with 2-3 workouts per week</Text>
              <Text style={styles.tipText}>â€¢ Intermediate: Aim for 3-4 workouts per week</Text>
              <Text style={styles.tipText}>â€¢ Advanced: 4-5 workouts per week</Text>
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
            </>
          )}
          {goalType === 'weeklyDuration' && (
            <>
<<<<<<< HEAD
              <Text style={styles.tipText}>• WHO recommends 150 minutes per week</Text>
              <Text style={styles.tipText}>• Break it down: 30 min x 5 days</Text>
              <Text style={styles.tipText}>• Include both cardio and strength training</Text>
=======
              <Text style={styles.tipText}>â€¢ WHO recommends 150 minutes per week</Text>
              <Text style={styles.tipText}>â€¢ Break it down: 30 min x 5 days</Text>
              <Text style={styles.tipText}>â€¢ Include both cardio and strength training</Text>
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
            </>
          )}
          {goalType === 'dailyWater' && (
            <>
<<<<<<< HEAD
              <Text style={styles.tipText}>• General guideline: 8 glasses (8oz each)</Text>
              <Text style={styles.tipText}>• More if you exercise regularly</Text>
              <Text style={styles.tipText}>• Listen to your body's thirst signals</Text>
=======
              <Text style={styles.tipText}>â€¢ General guideline: 8 glasses (8oz each)</Text>
              <Text style={styles.tipText}>â€¢ More if you exercise regularly</Text>
              <Text style={styles.tipText}>â€¢ Listen to your body's thirst signals</Text>
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
            </>
          )}
          {goalType === 'monthlyWorkouts' && (
            <>
<<<<<<< HEAD
              <Text style={styles.tipText}>• Consistency is key for progress</Text>
              <Text style={styles.tipText}>• Allow rest days for recovery</Text>
              <Text style={styles.tipText}>• Gradually increase as you build habits</Text>
=======
              <Text style={styles.tipText}>â€¢ Consistency is key for progress</Text>
              <Text style={styles.tipText}>â€¢ Allow rest days for recovery</Text>
              <Text style={styles.tipText}>â€¢ Gradually increase as you build habits</Text>
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
<<<<<<< HEAD

=======
 
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cancelButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
<<<<<<< HEAD
goalInfoContainer: {
=======
  goalInfoContainer: {
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    alignItems: 'center',
    marginBottom: 30,
  },
  goalIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  goalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  goalHint: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  currentValueContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentValueLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  currentValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#ddd',
    textAlign: 'center',
  },
  suggestionsContainer: {
    marginBottom: 30,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  suggestionButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  suggestionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  suggestionTextActive: {
    color: 'white',
  },
  tipsContainer: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 15,
  },
  tipText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 8,
    lineHeight: 20,
  },
});
<<<<<<< HEAD

export default EditGoalScreen;
=======
 
export default EditGoalScreen;
 
 
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
