/// src/screens/EditWorkoutScreen.js - Separate Edit/Add Screen
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import NotificationService from "../services/NotificationService";

// Add this function to your AddWorkoutScreen component
const saveWorkoutWithNotifications = async (workoutData) => {
  try {
    // 1. Save the workout to Firestore
    await addDoc(collection(db, "workouts"), {
      ...workoutData,
      userId: auth.currentUser.uid,
      createdAt: new Date(),
      date: new Date().toDateString(),
    });

    // 2. Send workout completion celebration
    NotificationService.sendGoalAchievement(
      workoutData.exercise || "Workout",
      100
    );

    // 3. Check for streak milestones
    const currentStreak = await calculateCurrentStreak();

    if (currentStreak % 7 === 0 && currentStreak > 0) {
      // Every 7 days
      NotificationService.sendMilestoneCelebration(
        `${currentStreak} day streak! You're absolutely crushing it! 🔥🏆`
      );
    } else if (currentStreak === 3) {
      NotificationService.sendMilestoneCelebration(
        "3 day streak! Keep the momentum going! 💪"
      );
    } else if (currentStreak === 30) {
      NotificationService.sendMilestoneCelebration(
        "30 DAYS! You are a fitness champion! 🏅👑"
      );
    }

    // 4. Check total workout milestones
    const totalWorkouts = await getTotalWorkoutCount();

    if (totalWorkouts === 10) {
      NotificationService.sendMilestoneCelebration("10 workouts completed! 🎉");
    } else if (totalWorkouts === 50) {
      NotificationService.sendMilestoneCelebration(
        "50 workouts! You're unstoppable! 💪"
      );
    } else if (totalWorkouts === 100) {
      NotificationService.sendMilestoneCelebration(
        "100 WORKOUTS! Hall of Fame! 🏆👑"
      );
    } else if (totalWorkouts === 250) {
      NotificationService.sendMilestoneCelebration(
        "250 WORKOUTS! Legendary! 👑🔥"
      );
    }

    // 5. Check weekly goal progress
    const thisWeekWorkouts = await getThisWeekWorkoutCount();
    const weeklyGoal = 5; // You can make this configurable

    if (thisWeekWorkouts === weeklyGoal) {
      NotificationService.sendGoalAchievement("Weekly Workout Goal", 100);
    } else if (thisWeekWorkouts === weeklyGoal - 1) {
      // One more to go!
      NotificationService.sendMilestoneCelebration(
        "One more workout to hit your weekly goal! You got this! 💪"
      );
    }

    return true;
  } catch (error) {
    console.error("Error saving workout:", error);
    return false;
  }
};

// Helper function to calculate current streak
const calculateCurrentStreak = async () => {
  try {
    const workoutsQuery = query(
      collection(db, "workouts"),
      where("userId", "==", auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(workoutsQuery);
    const workouts = querySnapshot.docs.map((doc) => doc.data());

    // Get unique workout dates
    const workoutDays = new Set(
      workouts.map((w) => {
        const date = w.createdAt?.toDate?.() || new Date(w.createdAt);
        return date.toDateString();
      })
    );

    // Calculate streak from today backwards
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = checkDate.toDateString();

      if (workoutDays.has(dateString)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error("Error calculating streak:", error);
    return 0;
  }
};

// Helper function to get total workout count
const getTotalWorkoutCount = async () => {
  try {
    const workoutsQuery = query(
      collection(db, "workouts"),
      where("userId", "==", auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(workoutsQuery);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting workout count:", error);
    return 0;
  }
};

// Helper function to get this week's workout count
const getThisWeekWorkoutCount = async () => {
  try {
    const workoutsQuery = query(
      collection(db, "workouts"),
      where("userId", "==", auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(workoutsQuery);
    const workouts = querySnapshot.docs.map((doc) => doc.data());

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const thisWeek = workouts.filter((workout) => {
      const workoutDate =
        workout.createdAt?.toDate?.() || new Date(workout.createdAt);
      return workoutDate >= weekAgo;
    });

    return thisWeek.length;
  } catch (error) {
    console.error("Error getting this week workouts:", error);
    return 0;
  }
};

// USAGE EXAMPLE IN YOUR ADD/EDIT WORKOUT SCREEN:
// Replace your current save function with this:

const handleSaveWorkout = async () => {
  const workoutData = {
    exercise: exerciseName,
    type: workoutType,
    duration: duration,
    sets: sets,
    reps: reps,
    weight: weight,
    notes: notes,
    // ... other fields
  };

  const success = await saveWorkoutWithNotifications(workoutData);

  if (success) {
    Alert.alert("Success", "Workout saved! Great job! 🎉");
    navigation.goBack();
  } else {
    Alert.alert("Error", "Failed to save workout");
  }
};

export {
  saveWorkoutWithNotifications,
  calculateCurrentStreak,
  getTotalWorkoutCount,
  getThisWeekWorkoutCount,
};
const EditWorkoutScreen = ({ navigation, route }) => {
  const { mode, workout } = route.params || { mode: "add" };
  const isEditing = mode === "edit";

  const [formData, setFormData] = useState({
    exercise: "",
    duration: "",
    sets: "",
    reps: "",
    weight: "",
    notes: "",
    type: "strength",
  });
  const [saving, setSaving] = useState(false);

  const workoutTypes = ["strength", "cardio", "flexibility"];

  useEffect(() => {
    if (isEditing && workout) {
      setFormData({
        exercise: workout.exercise || "",
        duration: workout.duration?.toString() || "",
        sets: workout.sets?.toString() || "",
        reps: workout.reps?.toString() || "",
        weight: workout.weight?.toString() || "",
        notes: workout.notes || "",
        type: workout.type || "strength",
      });
    }
  }, [isEditing, workout]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.exercise.trim()) {
      Alert.alert("Error", "Please enter an exercise name");
      return false;
    }

    if (!formData.duration.trim()) {
      Alert.alert("Error", "Please enter workout duration");
      return false;
    }

    const duration = parseInt(formData.duration);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert("Error", "Please enter a valid duration in minutes");
      return false;
    }

    // Validate numeric fields if provided
    if (
      formData.sets &&
      (isNaN(parseInt(formData.sets)) || parseInt(formData.sets) < 0)
    ) {
      Alert.alert("Error", "Please enter a valid number of sets");
      return false;
    }

    if (
      formData.reps &&
      (isNaN(parseInt(formData.reps)) || parseInt(formData.reps) < 0)
    ) {
      Alert.alert("Error", "Please enter a valid number of reps");
      return false;
    }

    if (
      formData.weight &&
      (isNaN(parseFloat(formData.weight)) || parseFloat(formData.weight) < 0)
    ) {
      Alert.alert("Error", "Please enter a valid weight");
      return false;
    }

    return true;
  };

  const saveWorkout = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const workoutData = {
        exercise: editedWorkout.exercise,
        duration: parseInt(editedWorkout.duration),
        sets: editedWorkout.sets ? parseInt(editedWorkout.sets) : null,
        reps: editedWorkout.reps ? parseInt(editedWorkout.reps) : null,
        weight: editedWorkout.weight ? parseFloat(editedWorkout.weight) : null,
        notes: editedWorkout.notes,
        type: editedWorkout.type,
        updatedAt: new Date(),
      };

      if (isEditing) {
        await updateDoc(doc(db, "workouts", workout.id), {
          ...workoutData,
          updatedAt: new Date(),
        });
        Alert.alert("Success", "Workout updated successfully!");
      } else {
        await addDoc(collection(db, "workouts"), {
          ...workoutData,
          createdAt: new Date(),
          date: new Date().toDateString(),
        });
        Alert.alert("Success", "Workout logged successfully!");
      }

      navigation.goBack();
    } catch (error) {
      console.error("Error saving workout:", error);
      Alert.alert("Error", "Failed to save workout");
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({
    label,
    field,
    placeholder,
    keyboardType = "default",
    multiline = false,
  }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={formData[field]}
        onChangeText={(value) => updateField(field, value)}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        returnKeyType={multiline ? "default" : "next"}
      />
    </View>
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
        <Text style={styles.title}>
          {isEditing ? "Edit Workout" : "Add Workout"}
        </Text>
        <TouchableOpacity onPress={saveWorkout} disabled={saving}>
          <Text style={[styles.saveButton, saving && styles.disabled]}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Workout Type Selector */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Workout Type</Text>
        <View style={styles.typeSelector}>
          {['strength', 'cardio', 'flexibility'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                {
                  backgroundColor:
                    editedWorkout.type === type ? colors.accent : colors.card,
                  borderColor:
                    editedWorkout.type === type ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setEditedWorkout((prev) => ({ ...prev, type }))}
            >
              <Text
                style={[
                  styles.typeButton,
                  formData.type === type && styles.typeButtonActive,
                ]}
                onPress={() => updateField("type", type)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    formData.type === type && styles.typeButtonTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Exercise Name */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Exercise Name *</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          value={editedWorkout.exercise}
          onChangeText={(text) =>
            setEditedWorkout((prev) => ({ ...prev, exercise: text }))
          }
          placeholder="e.g., Push-ups, Running, Yoga"
          placeholderTextColor={colors.subtext}
        />

        {/* Duration */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Duration (minutes) *</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          value={editedWorkout.duration}
          onChangeText={(text) =>
            setEditedWorkout((prev) => ({ ...prev, duration: text }))
          }
          placeholder="30"
          placeholderTextColor={colors.subtext}
          keyboardType="numeric"
        />

        {/* Strength Training Fields */}
        {formData.type === "strength" && (
          <>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Sets</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={editedWorkout.sets}
              onChangeText={(text) =>
                setEditedWorkout((prev) => ({ ...prev, sets: text }))
              }
              placeholder="3"
              placeholderTextColor={colors.subtext}
              keyboardType="numeric"
            />

            <InputField
              label="Reps"
              field="reps"
              placeholder="12"
              placeholderTextColor={colors.subtext}
              keyboardType="numeric"
            />

            <InputField
              label="Weight (kg)"
              field="weight"
              placeholder="20"
              placeholderTextColor={colors.subtext}
              keyboardType="numeric"
            />
          </>
        )}

        {/* Notes */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Notes</Text>
        <TextInput
          style={[
            styles.input,
            styles.notesInput,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          value={editedWorkout.notes}
          onChangeText={(text) =>
            setEditedWorkout((prev) => ({ ...prev, notes: text }))
          }
          placeholder="How did it feel?"
          placeholderTextColor={colors.subtext}
          multiline
        />

        {/* Tips Section */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips</Text>
          {formData.type === "strength" && (
            <Text style={styles.tipText}>
              • Track your sets, reps, and weight for progress monitoring
            </Text>
          )}
          {formData.type === "cardio" && (
            <Text style={styles.tipText}>
              • Focus on duration and intensity level
            </Text>
          )}
          {formData.type === "flexibility" && (
            <Text style={styles.tipText}>
              • Note which muscle groups you stretched
            </Text>
          )}
          <Text style={styles.tipText}>
            • Add notes about how the workout felt
          </Text>
        </View>

        {/* Edit Info */}
        {isEditing && (
          <View style={styles.editInfo}>
            <Text style={styles.editInfoText}>
              Originally logged:{" "}
              {workout?.createdAt?.toDate?.()?.toLocaleDateString() ||
                "Unknown date"}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 16,
    color: "#FF3B30",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  saveButton: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
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
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  cancelButton: { fontSize: 16 },
  title: { fontSize: 18, fontWeight: 'bold' },
  saveButton: { fontSize: 16, fontWeight: '600' },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  inputLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 20 },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
  },
  typeSelector: {
    flexDirection: "row",
    gap: 10,
  },
  notesInput: { height: 100, textAlignVertical: 'top' },
  typeSelector: { flexDirection: 'row', marginBottom: 10 },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    backgroundColor: "white",
  },
  typeButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  typeButtonTextActive: {
    color: "white",
  },
  tipsContainer: {
    backgroundColor: "#E3F2FD",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: "#1976D2",
    marginBottom: 4,
    lineHeight: 20,
  },
  editInfo: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  editInfoText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  typeButtonText: { fontSize: 14, fontWeight: '600' },
  originalDateContainer: { padding: 15, borderRadius: 8, marginTop: 20, borderWidth: 1 },
  originalDateLabel: { fontSize: 14, fontWeight: '600', marginBottom: 5 },
  originalDateValue: { fontSize: 16 },
  warningContainer: { padding: 15, borderRadius: 8, marginTop: 20, borderWidth: 1 },
  warningTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  warningText: { fontSize: 14, lineHeight: 20 },
});

export default EditWorkoutScreen;
