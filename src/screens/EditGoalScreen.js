import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import NotificationService from "../services/NotificationService";

// When checking if goal is reached:
const checkGoal = async () => {
  if (currentProgress >= goalTarget) {
    await NotificationService.sendGoalAchievement(
      "workout", // or 'nutrition', 'hydration', 'weight'
      goalName // e.g., "Complete 10 Workouts"
    );
  }
};

const EditGoalScreen = ({ navigation, route }) => {
  const { goalType, currentValue } = route.params;
  const [newValue, setNewValue] = useState(currentValue.toString());
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  const getGoalTitle = (goalType) => {
    switch (goalType) {
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
    }
  };

  const getGoalIcon = (goalType) => {
    switch (goalType) {
      case "weeklyWorkouts":
        return "🏋️‍♂️";
      case "weeklyDuration":
        return "⏱️";
      case "dailyWater":
        return "💧";
      case "monthlyWorkouts":
        return "📅";
      default:
        return "🎯";
    }
  };

  const getGoalHint = (goalType) => {
    switch (goalType) {
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
    }
  };

  const getSuggestions = (goalType) => {
    switch (goalType) {
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
    }
  };

  const updateGoal = async () => {
    if (!newValue || isNaN(parseInt(newValue)) || parseInt(newValue) < 1) {
      Alert.alert("Error", "Please enter a valid number greater than 0");
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const currentGoals = userDoc.data().goals || {};
        await updateDoc(userRef, {
          goals: { ...currentGoals, [goalType]: parseInt(newValue) },
        });
      } else {
        await setDoc(userRef, {
          goals: { [goalType]: parseInt(newValue) },
          email: auth.currentUser.email,
          createdAt: new Date(),
        });
      }

      Alert.alert("Success", "Goal updated successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", `Failed to update goal: ${error.message}`);
      console.error("Error updating goal:", error);
    } finally {
      setLoading(false);
    }
  };

  const SuggestionButton = ({ value }) => (
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
        {value}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelButton, { color: colors.accent }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Edit Goal</Text>
        <TouchableOpacity onPress={updateGoal} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.disabled]}>
            {loading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.goalInfoContainer}>
          <Text style={styles.goalIcon}>{getGoalIcon(goalType)}</Text>
          <Text style={[styles.goalTitle, { color: colors.text }]}>
            {getGoalTitle(goalType)}
          </Text>
          <Text style={[styles.goalHint, { color: colors.subtext }]}>
            {getGoalHint(goalType)}
          </Text>
        </View>

        <View
          style={[
            styles.currentValueContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.currentValueLabel, { color: colors.subtext }]}>
            Current Goal:
          </Text>
          <Text style={[styles.currentValue, { color: colors.accent }]}>
            {currentValue}
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>New Goal Value</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={newValue}
            onChangeText={setNewValue}
            keyboardType="numeric"
            placeholder="Enter goal value"
            placeholderTextColor={colors.subtext}
            returnKeyType="done"
            autoFocus
          />
        </View>

        <View style={styles.suggestionsContainer}>
          <Text style={[styles.suggestionsTitle, { color: colors.text }]}>
            Quick Select:
          </Text>
          <View style={styles.suggestionsGrid}>
            {getSuggestions(goalType).map(v => (
              <SuggestionButton key={v} value={v} />
            ))}
          </View>
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips</Text>
          {goalType === "weeklyWorkouts" && (
            <>
              <Text style={styles.tipText}>
                • Beginners: Start with 2–3 workouts per week
              </Text>
              <Text style={styles.tipText}>
                • Intermediate: Aim for 3–4 workouts per week
              </Text>
              <Text style={styles.tipText}>
                • Advanced: 4–5 workouts per week
              </Text>
            </>
          )}
          {goalType === "weeklyDuration" && (
            <>
              <Text style={styles.tipText}>
                • WHO recommends 150 minutes per week
              </Text>
              <Text style={styles.tipText}>
                • Break it down: 30 min × 5 days
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
                • Listen to your body’s thirst signals
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
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
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
  cancelButton: { color: "#007AFF", fontSize: 16 },
  title: { fontSize: 18, fontWeight: "bold", color: "#333" },
  saveButton: { color: "#007AFF", fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.5 },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  goalInfoContainer: { alignItems: "center", marginBottom: 30 },
  goalIcon: { fontSize: 48, marginBottom: 15 },
  goalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  goalHint: { fontSize: 16, color: "#666", textAlign: "center" },
  currentValueContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentValueLabel: { fontSize: 14, color: "#666", marginBottom: 5 },
  currentValue: { fontSize: 32, fontWeight: "bold", color: "#007AFF" },
  inputContainer: { marginBottom: 30 },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    fontSize: 18,
    borderWidth: 1,
    borderColor: "#ddd",
    textAlign: "center",
  },
  suggestionsContainer: { marginBottom: 30 },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  suggestionsGrid: { flexDirection: "row", justifyContent: "space-between" },
  suggestionButton: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  suggestionButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  suggestionText: { fontSize: 16, fontWeight: "600", color: "#333" },
  suggestionTextActive: { color: "white" },
  tipsContainer: { backgroundColor: "#E3F2FD", padding: 20, borderRadius: 12 },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 15,
  },
  tipText: { fontSize: 14, color: "#1976D2", marginBottom: 8, lineHeight: 20 },
});

export default EditGoalScreen;
