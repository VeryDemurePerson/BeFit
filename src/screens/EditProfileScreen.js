import React, { useState } from "react";
// src/screens/EditProfileScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
} from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from './themes';

const EditProfileScreen = ({ navigation }) => {
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
        return "";
      case "weeklyDuration":
        return "";
      case "dailyWater":
        return "";
      case "monthlyWorkouts":
        return "";
      default:
        return "";
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [goal, setGoal] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setFullName(data.fullName || data.name || '');
          setAge(data.age ? String(data.age) : '');
          setHeightCm(data.heightCm ? String(data.heightCm) : '');
          setWeightKg(data.weightKg ? String(data.weightKg) : '');
          setGoal(data.goal || data.fitnessGoal || '');
        } else {
          // If no profile doc yet, pre-fill name from auth if available
          setFullName(user.displayName || '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Error', 'Failed to load profile information.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to edit your profile.');
      return;
    }

  const updateGoal = async () => {
    if (!newValue || isNaN(parseInt(newValue)) || parseInt(newValue) < 1) {
      Alert.alert("Error", "Please enter a valid number greater than 0");
    if (!fullName.trim()) {
      Alert.alert('Missing name', 'Please enter your name.');
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);

      // Get existing user document
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        // Get existing goals and update only the specific goal
        const existingData = userDoc.data();
        const currentGoals = existingData.goals || {};
      const ref = doc(db, 'users', user.uid);

      const profileData = {
        fullName: fullName.trim(),
        age: age ? Number(age) : null,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        goal: goal.trim(),
        updatedAt: new Date(),
        userId: user.uid,
        email: user.email || null,
      };

      await setDoc(ref, profileData, { merge: true });

        // Update the document with the merged goals
        await updateDoc(userRef, {
          goals: updatedGoals,
          updatedAt: new Date(),
        });
      } else {
        // Create new document with just this goal
        const newGoals = {
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
      Alert.alert('Saved', 'Your profile has been updated.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile changes. Please try again.');
    } finally {
      setSaving(false);
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
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.subtext }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Goal</Text>
        <TouchableOpacity onPress={updateGoal} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.disabled]}>
            {loading ? "Saving..." : "Save"}
          </Text>
          <Text style={[styles.headerButton, { color: colors.accent }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Goal Info */}
        <View style={styles.goalInfoContainer}>
          <Text style={styles.goalIcon}>{getGoalIcon(goalType)}</Text>
          <Text style={styles.goalTitle}>{getGoalTitle(goalType)}</Text>
          <Text style={styles.goalHint}>{getGoalHint(goalType)}</Text>
        </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.label, { color: colors.subtext }]}>Full Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              placeholderTextColor={colors.subtext}
            />
          </View>

          {/* Basic info */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Basic Info
            </Text>

            <View style={styles.row}>
              <View style={styles.fieldHalf}>
                <Text style={[styles.label, { color: colors.subtext }]}>Age</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={age}
                  onChangeText={setAge}
                  placeholder="e.g. 22"
                  placeholderTextColor={colors.subtext}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.fieldHalf}>
                <Text style={[styles.label, { color: colors.subtext }]}>
                  Height (cm)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={heightCm}
                  onChangeText={setHeightCm}
                  placeholder="e.g. 165"
                  placeholderTextColor={colors.subtext}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.fieldHalf}>
                <Text style={[styles.label, { color: colors.subtext }]}>
                  Weight (kg)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={weightKg}
                  onChangeText={setWeightKg}
                  placeholder="e.g. 60"
                  placeholderTextColor={colors.subtext}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.fieldHalf, { opacity: 0 }]} />
            </View>
          </View>

        {/* Goal Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips</Text>
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
            </>
          )}
        </View>
      </ScrollView>
          {/* Goals */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Fitness Goal
            </Text>
            <Text style={[styles.helperText, { color: colors.subtext }]}>
              (Examples: "Build muscle", "Lose 5kg", "Run 5km", "Stay consistent 3x/week")
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={goal}
              onChangeText={setGoal}
              placeholder="Describe your main goal..."
              placeholderTextColor={colors.subtext}
              multiline
            />
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: saving ? colors.border : colors.accent,
                opacity: saving ? 0.7 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  // Header
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelButton: {
    color: "#007AFF",
    fontSize: 16,
  headerButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  saveButton: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
    fontWeight: '700',
  },
  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  goalInfoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  goalIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  goalTitle: {
    fontSize: 24,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentValueLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  currentValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#007AFF",
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
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
  suggestionsContainer: {
    marginBottom: 30,
  },
  suggestionsTitle: {
    fontSize: 16,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 11,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  fieldHalf: {
    flex: 1,
  },
  tipsContainer: {
    backgroundColor: "#E3F2FD",
    padding: 20,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 15,
  },
  tipText: {
    fontSize: 14,
    color: "#1976D2",
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default EditGoalScreen;
  saveButton: {
    marginTop: 8,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
