<<<<<<< HEAD

import React, { useState } from 'react';
=======
import React, { useState } from "react";
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
<<<<<<< HEAD
} from 'react-native';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
=======
} from "react-native";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c

const EditGoalScreen = ({ navigation, route }) => {
  const { goalType, currentValue } = route.params;
  const [newValue, setNewValue] = useState(currentValue.toString());
  const [loading, setLoading] = useState(false);

  const getGoalTitle = (goalType) => {
    switch (goalType) {
<<<<<<< HEAD
      case 'weeklyWorkouts': return 'Weekly Workouts';
      case 'weeklyDuration': return 'Weekly Minutes';
      case 'dailyWater': return 'Daily Water (glasses)';
      case 'monthlyWorkouts': return 'Monthly Workouts';
      default: return '';
=======
      case "weeklyWorkouts":
        return "Weekly Workouts";
      case "weeklyDuration":
        return "Weekly Minutes";
      case "dailyWater":
        return "Daily Water (glasses)";
      case "monthlyWorkouts":
        return "Monthly Workouts";
      default:
        return "";
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    }
  };

  const getGoalIcon = (goalType) => {
    switch (goalType) {
<<<<<<< HEAD
      case 'weeklyWorkouts': return '🏃‍♂️';
      case 'weeklyDuration': return '⏱️';
      case 'dailyWater': return '💧';
      case 'monthlyWorkouts': return '📅';
      default: return '🎯';
=======
      case "weeklyWorkouts":
        return "";
      case "weeklyDuration":
        return "";
      case "dailyWater":
        return "";
      case "monthlyWorkouts":
        return "";
      default:
        return "";
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    }
  };

  const getGoalHint = (goalType) => {
    switch (goalType) {
<<<<<<< HEAD
      case 'weeklyWorkouts': return 'How many workouts per week?';
      case 'weeklyDuration': return 'How many minutes per week?';
      case 'dailyWater': return 'How many glasses per day?';
      case 'monthlyWorkouts': return 'How many workouts per month?';
      default: return '';
=======
      case "weeklyWorkouts":
        return "How many workouts per week?";
      case "weeklyDuration":
        return "How many minutes per week?";
      case "dailyWater":
        return "How many glasses per day?";
      case "monthlyWorkouts":
        return "How many workouts per month?";
      default:
        return "";
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    }
  };

  const getSuggestions = (goalType) => {
    switch (goalType) {
<<<<<<< HEAD
      case 'weeklyWorkouts': return ['2', '3', '4', '5'];
      case 'weeklyDuration': return ['90', '120', '150', '180'];
      case 'dailyWater': return ['6', '8', '10', '12'];
      case 'monthlyWorkouts': return ['8', '12', '16', '20'];
      default: return [];
=======
      case "weeklyWorkouts":
        return ["2", "3", "4", "5"];
      case "weeklyDuration":
        return ["90", "120", "150", "180"];
      case "dailyWater":
        return ["6", "8", "10", "12"];
      case "monthlyWorkouts":
        return ["8", "12", "16", "20"];
      default:
        return [];
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    }
  };

  const updateGoal = async () => {
    if (!newValue || isNaN(parseInt(newValue)) || parseInt(newValue) < 1) {
<<<<<<< HEAD
      Alert.alert('Error', 'Please enter a valid number greater than 0');
=======
      Alert.alert("Error", "Please enter a valid number greater than 0");
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
      return;
    }

    setLoading(true);
    try {
<<<<<<< HEAD
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Get existing user document
      const userDoc = await getDoc(userRef);
      
=======
      const userRef = doc(db, "users", auth.currentUser.uid);

      // Get existing user document
      const userDoc = await getDoc(userRef);

>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
      if (userDoc.exists()) {
        // Get existing goals and update only the specific goal
        const existingData = userDoc.data();
        const currentGoals = existingData.goals || {};
<<<<<<< HEAD
        
        // Update only the specific goal, keeping all others
        const updatedGoals = {
          ...currentGoals,
          [goalType]: parseInt(newValue)
        };
        
        // Update the document with the merged goals
        await updateDoc(userRef, {
          goals: updatedGoals,
          updatedAt: new Date()
=======

        // Update only the specific goal, keeping all others
        const updatedGoals = {
          ...currentGoals,
          [goalType]: parseInt(newValue),
        };

        // Update the document with the merged goals
        await updateDoc(userRef, {
          goals: updatedGoals,
          updatedAt: new Date(),
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
        });
      } else {
        // Create new document with just this goal
        const newGoals = {
<<<<<<< HEAD
          [goalType]: parseInt(newValue)
        };
        
        await setDoc(userRef, {
          goals: newGoals,
          email: auth.currentUser.email,
          createdAt: new Date()
        });
      }
      
      Alert.alert('Success', 'Goal updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
=======
          [goalType]: parseInt(newValue),
        };

        await setDoc(userRef, {
          goals: newGoals,
          email: auth.currentUser.email,
          createdAt: new Date(),
        });
      }

      Alert.alert("Success", "Goal updated successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
      ]);
    } catch (error) {
      Alert.alert('Error', `Failed to update goal: ${error.message}`);
      console.error('Error updating goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const SuggestionButton = ({ value }) => (
<<<<<<< HEAD
    <TouchableOpacity 
      style={[styles.suggestionButton, newValue === value && styles.suggestionButtonActive]}
      onPress={() => setNewValue(value)}
    >
      <Text style={[styles.suggestionText, newValue === value && styles.suggestionTextActive]}>
=======
    <TouchableOpacity
      style={[
        styles.suggestionButton,
        newValue === value && styles.suggestionButtonActive,
      ]}
      onPress={() => setNewValue(value)}
    >
      <Text
        style={[
          styles.suggestionText,
          newValue === value && styles.suggestionTextActive,
        ]}
      >
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
        {value}
      </Text>
    </TouchableOpacity>
  );

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
<<<<<<< HEAD
            {loading ? 'Saving...' : 'Save'}
=======
            {loading ? "Saving..." : "Save"}
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
<<<<<<< HEAD
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
=======
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
        {/* Goal Info */}
        <View style={styles.goalInfoContainer}>
          <Text style={styles.goalIcon}>{getGoalIcon(goalType)}</Text>
          <Text style={styles.goalTitle}>{getGoalTitle(goalType)}</Text>
          <Text style={styles.goalHint}>{getGoalHint(goalType)}</Text>
        </View>

        {/* Current Value Display */}
        <View style={styles.currentValueContainer}>
          <Text style={styles.currentValueLabel}>Current Goal:</Text>
          <Text style={styles.currentValue}>{currentValue}</Text>
        </View>

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

        {/* Quick Suggestions */}
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Quick Select:</Text>
          <View style={styles.suggestionsGrid}>
            {getSuggestions(goalType).map((suggestion) => (
              <SuggestionButton key={suggestion} value={suggestion} />
            ))}
          </View>
        </View>

        {/* Goal Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips</Text>
<<<<<<< HEAD
          {goalType === 'weeklyWorkouts' && (
            <>
              <Text style={styles.tipText}>• Beginners: Start with 2-3 workouts per week</Text>
              <Text style={styles.tipText}>• Intermediate: Aim for 3-4 workouts per week</Text>
              <Text style={styles.tipText}>• Advanced: 4-5 workouts per week</Text>
            </>
          )}
          {goalType === 'weeklyDuration' && (
            <>
              <Text style={styles.tipText}>• WHO recommends 150 minutes per week</Text>
              <Text style={styles.tipText}>• Break it down: 30 min x 5 days</Text>
              <Text style={styles.tipText}>• Include both cardio and strength training</Text>
            </>
          )}
          {goalType === 'dailyWater' && (
            <>
              <Text style={styles.tipText}>• General guideline: 8 glasses (8oz each)</Text>
              <Text style={styles.tipText}>• More if you exercise regularly</Text>
              <Text style={styles.tipText}>• Listen to your body's thirst signals</Text>
            </>
          )}
          {goalType === 'monthlyWorkouts' && (
            <>
              <Text style={styles.tipText}>• Consistency is key for progress</Text>
              <Text style={styles.tipText}>• Allow rest days for recovery</Text>
              <Text style={styles.tipText}>• Gradually increase as you build habits</Text>
=======
          {goalType === "weeklyWorkouts" && (
            <>
              <Text style={styles.tipText}>
                • Beginners: Start with 2-3 workouts per week
              </Text>
              <Text style={styles.tipText}>
                • Intermediate: Aim for 3-4 workouts per week
              </Text>
              <Text style={styles.tipText}>
                • Advanced: 4-5 workouts per week
              </Text>
            </>
          )}
          {goalType === "weeklyDuration" && (
            <>
              <Text style={styles.tipText}>
                • WHO recommends 150 minutes per week
              </Text>
              <Text style={styles.tipText}>
                • Break it down: 30 min x 5 days
              </Text>
              <Text style={styles.tipText}>
                • Include both cardio and strength training
              </Text>
            </>
          )}
          {goalType === "dailyWater" && (
            <>
              <Text style={styles.tipText}>
                • General guideline: 8 glasses (8oz each)
              </Text>
              <Text style={styles.tipText}>
                • More if you exercise regularly
              </Text>
              <Text style={styles.tipText}>
                • Listen to your body's thirst signals
              </Text>
            </>
          )}
          {goalType === "monthlyWorkouts" && (
            <>
              <Text style={styles.tipText}>
                • Consistency is key for progress
              </Text>
              <Text style={styles.tipText}>• Allow rest days for recovery</Text>
              <Text style={styles.tipText}>
                • Gradually increase as you build habits
              </Text>
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
<<<<<<< HEAD
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
=======
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cancelButton: {
    color: "#007AFF",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    fontSize: 16,
  },
  title: {
    fontSize: 18,
<<<<<<< HEAD
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
=======
    fontWeight: "bold",
    color: "#333",
  },
  saveButton: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
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
  goalInfoContainer: {
<<<<<<< HEAD
    alignItems: 'center',
=======
    alignItems: "center",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    marginBottom: 30,
  },
  goalIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  goalTitle: {
    fontSize: 24,
<<<<<<< HEAD
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
=======
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  goalHint: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  currentValueContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentValueLabel: {
    fontSize: 14,
<<<<<<< HEAD
    color: '#666',
=======
    color: "#666",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    marginBottom: 5,
  },
  currentValue: {
    fontSize: 32,
<<<<<<< HEAD
    fontWeight: 'bold',
    color: '#007AFF',
=======
    fontWeight: "bold",
    color: "#007AFF",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
<<<<<<< HEAD
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'white',
=======
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "white",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    fontSize: 18,
    borderWidth: 1,
<<<<<<< HEAD
    borderColor: '#ddd',
    textAlign: 'center',
=======
    borderColor: "#ddd",
    textAlign: "center",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
  },
  suggestionsContainer: {
    marginBottom: 30,
  },
  suggestionsTitle: {
    fontSize: 16,
<<<<<<< HEAD
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
=======
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  suggestionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  suggestionButton: {
    backgroundColor: "white",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
<<<<<<< HEAD
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
=======
    borderColor: "#ddd",
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  suggestionButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  suggestionTextActive: {
    color: "white",
  },
  tipsContainer: {
    backgroundColor: "#E3F2FD",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    padding: 20,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
<<<<<<< HEAD
    fontWeight: '600',
    color: '#1976D2',
=======
    fontWeight: "600",
    color: "#1976D2",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    marginBottom: 15,
  },
  tipText: {
    fontSize: 14,
<<<<<<< HEAD
    color: '#1976D2',
=======
    color: "#1976D2",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    marginBottom: 8,
    lineHeight: 20,
  },
});

<<<<<<< HEAD
export default EditGoalScreen;
=======
export default EditGoalScreen;
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
