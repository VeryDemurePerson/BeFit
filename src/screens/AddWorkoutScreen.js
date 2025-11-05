// src/screens/AddWorkoutScreen.js - Dynamic Exercise-Specific Form
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
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";

// Exercise database with specific fields for each exercise type
const EXERCISE_DATABASE = {
  // Cardio exercises
  running: {
    type: "cardio",
    fields: ["distance", "pace", "calories"],
    units: { distance: "km", pace: "min/km", calories: "kcal" },
  },
  jogging: {
    type: "cardio",
    fields: ["distance", "pace", "calories"],
    units: { distance: "km", pace: "min/km", calories: "kcal" },
  },
  cycling: {
    type: "cardio",
    fields: ["distance", "speed", "calories"],
    units: { distance: "km", speed: "km/h", calories: "kcal" },
  },
  walking: {
    type: "cardio",
    fields: ["distance", "steps", "calories"],
    units: { distance: "km", steps: "steps", calories: "kcal" },
  },
  swimming: {
    type: "cardio",
    fields: ["distance", "strokes", "calories"],
    units: { distance: "m", strokes: "strokes", calories: "kcal" },
  },
  rowing: {
    type: "cardio",
    fields: ["distance", "strokes", "calories"],
    units: { distance: "m", strokes: "strokes/min", calories: "kcal" },
  },

  // Strength exercises
  "push-ups": {
    type: "strength",
    fields: ["sets", "reps", "weight"],
    units: { sets: "sets", reps: "reps", weight: "kg" },
  },
  "push ups": {
    type: "strength",
    fields: ["sets", "reps", "weight"],
    units: { sets: "sets", reps: "reps", weight: "kg" },
  },
  "pull-ups": {
    type: "strength",
    fields: ["sets", "reps", "weight"],
    units: { sets: "sets", reps: "reps", weight: "kg" },
  },
  "pull ups": {
    type: "strength",
    fields: ["sets", "reps", "weight"],
    units: { sets: "sets", reps: "reps", weight: "kg" },
  },
  squats: {
    type: "strength",
    fields: ["sets", "reps", "weight"],
    units: { sets: "sets", reps: "reps", weight: "kg" },
  },
  deadlifts: {
    type: "strength",
    fields: ["sets", "reps", "weight"],
    units: { sets: "sets", reps: "reps", weight: "kg" },
  },
  "bench press": {
    type: "strength",
    fields: ["sets", "reps", "weight"],
    units: { sets: "sets", reps: "reps", weight: "kg" },
  },
  "bicep curls": {
    type: "strength",
    fields: ["sets", "reps", "weight"],
    units: { sets: "sets", reps: "reps", weight: "kg" },
  },
  lunges: {
    type: "strength",
    fields: ["sets", "reps", "weight"],
    units: { sets: "sets", reps: "reps", weight: "kg" },
  },
  planks: {
    type: "strength",
    fields: ["sets", "hold_time"],
    units: { sets: "sets", hold_time: "seconds" },
  },

  // Flexibility exercises
  yoga: {
    type: "flexibility",
    fields: ["poses", "difficulty"],
    units: { poses: "poses", difficulty: "level (1-10)" },
  },
  stretching: {
    type: "flexibility",
    fields: ["muscle_groups", "hold_time"],
    units: { muscle_groups: "groups", hold_time: "seconds" },
  },
  pilates: {
    type: "flexibility",
    fields: ["exercises", "difficulty"],
    units: { exercises: "exercises", difficulty: "level (1-10)" },
  },

  // Sports
  basketball: {
    type: "sports",
    fields: ["points", "rebounds", "calories"],
    units: { points: "points", rebounds: "rebounds", calories: "kcal" },
  },
  tennis: {
    type: "sports",
    fields: ["sets_won", "games_won", "calories"],
    units: { sets_won: "sets", games_won: "games", calories: "kcal" },
  },
  football: {
    type: "sports",
    fields: ["goals", "assists", "calories"],
    units: { goals: "goals", assists: "assists", calories: "kcal" },
  },
  soccer: {
    type: "sports",
    fields: ["goals", "assists", "calories"],
    units: { goals: "goals", assists: "assists", calories: "kcal" },
  },
};

const AddWorkoutScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    exercise: "",
    duration: "",
    notes: "",
    type: "general",
  });
  const [detectedExercise, setDetectedExercise] = useState(null);
  const [dynamicFields, setDynamicFields] = useState({});
  const [loading, setLoading] = useState(false);

  // Detect exercise type when user types
  useEffect(() => {
    if (formData.exercise.trim().length > 2) {
      const exerciseLower = formData.exercise.toLowerCase().trim();

      // Find exact match first
      let match = EXERCISE_DATABASE[exerciseLower];

      // If no exact match, try partial matching
      if (!match) {
        const partialMatch = Object.keys(EXERCISE_DATABASE).find(
          (key) => exerciseLower.includes(key) || key.includes(exerciseLower)
        );
        if (partialMatch) {
          match = EXERCISE_DATABASE[partialMatch];
        }
      }

      if (match && match !== detectedExercise) {
        setDetectedExercise(match);
        setFormData((prev) => ({ ...prev, type: match.type }));
        // Clear dynamic fields when exercise changes
        setDynamicFields({});
      } else if (!match && detectedExercise) {
        setDetectedExercise(null);
        setFormData((prev) => ({ ...prev, type: "general" }));
        setDynamicFields({});
      }
    } else {
      setDetectedExercise(null);
      setFormData((prev) => ({ ...prev, type: "general" }));
      setDynamicFields({});
    }
  }, [formData.exercise]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateDynamicField = (field, value) => {
    setDynamicFields((prev) => ({ ...prev, [field]: value }));
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

    // Validate dynamic fields
    if (detectedExercise) {
      for (const field of detectedExercise.fields) {
        const value = dynamicFields[field];
        if (value && value.trim()) {
          const numValue = parseFloat(value);
          if (isNaN(numValue) || numValue < 0) {
            Alert.alert(
              "Error",
              `Please enter a valid ${field.replace("_", " ")}`
            );
            return false;
          }
        }
      }
    }

    return true;
  };

  const saveWorkout = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Prepare dynamic fields for saving
      const processedDynamicFields = {};
      if (detectedExercise) {
        detectedExercise.fields.forEach((field) => {
          const value = dynamicFields[field];
          if (value && value.trim()) {
            processedDynamicFields[field] = parseFloat(value);
          }
        });
      }

      const workoutData = {
        userId: auth.currentUser.uid,
        exercise: formData.exercise.trim(),
        duration: parseInt(formData.duration),
        notes: formData.notes.trim(),
        type: formData.type,
        detectedFields: processedDynamicFields,
        createdAt: new Date(),
        date: new Date().toDateString(),
      };

      const docRef = await addDoc(collection(db, "workouts"), workoutData);

      // Update user's total workout count
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        totalWorkouts: increment(1),
      });

      Alert.alert("Success", "Workout logged successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error saving workout:", error);
      Alert.alert("Error", `Failed to log workout: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderDynamicFields = () => {
    if (!detectedExercise) return null;

    return (
      <View style={styles.dynamicFieldsContainer}>
        <Text style={styles.detectedExerciseText}>
          Detected: {formData.exercise} ({detectedExercise.type})
        </Text>

        {detectedExercise.fields.map((field) => (
          <View key={field} style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {field.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              {detectedExercise.units[field] &&
                ` (${detectedExercise.units[field]})`}
            </Text>
            <TextInput
              style={styles.input}
              value={dynamicFields[field] || ""}
              onChangeText={(value) => updateDynamicField(field, value)}
              placeholder={`Enter ${field.replace("_", " ")}`}
              keyboardType={
                field.includes("time") || field.includes("difficulty")
                  ? "numeric"
                  : "numeric"
              }
              returnKeyType="next"
            />
          </View>
        ))}
      </View>
    );
  };

  const renderExerciseSuggestions = () => {
    if (formData.exercise.length < 2) return null;

    const suggestions = Object.keys(EXERCISE_DATABASE)
      .filter(
        (exercise) =>
          exercise.toLowerCase().includes(formData.exercise.toLowerCase()) &&
          exercise.toLowerCase() !== formData.exercise.toLowerCase()
      )
      .slice(0, 5);

    if (suggestions.length === 0) return null;

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Suggestions:</Text>
        <View style={styles.suggestionsGrid}>
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion}
              style={styles.suggestionChip}
              onPress={() => updateField("exercise", suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
              <Text style={styles.suggestionType}>
                ({EXERCISE_DATABASE[suggestion].type})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Workout</Text>
        <TouchableOpacity onPress={saveWorkout} disabled={loading}>
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
        {/* Exercise Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Exercise Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.exercise}
            onChangeText={(text) => updateField("exercise", text)}
            placeholder="e.g., Running, Push-ups, Yoga"
            returnKeyType="next"
            autoFocus
          />
        </View>

        {/* Exercise Suggestions */}
        {renderExerciseSuggestions()}

        {/* Duration */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Duration (minutes) *</Text>
          <TextInput
            style={styles.input}
            value={formData.duration}
            onChangeText={(text) => updateField("duration", text)}
            placeholder="30"
            keyboardType="numeric"
            returnKeyType="next"
          />
        </View>

        {/* Dynamic Fields based on detected exercise */}
        {renderDynamicFields()}

        {/* Notes */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={formData.notes}
            onChangeText={(text) => updateField("notes", text)}
            placeholder="How did it feel? Any observations..."
            multiline
            numberOfLines={4}
            returnKeyType="done"
          />
        </View>

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Smart Form Detection</Text>
          <Text style={styles.infoText}>
            Type an exercise name and the form will automatically show relevant
            fields. Supported: Running, Cycling, Push-ups, Squats, Yoga, and
            many more!
          </Text>
        </View>
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
    color: "#007AFF",
    fontSize: 16,
  },
  title: {
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
  input: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  notesInput: {
    height: 100,
    textAlignVertical: "top",
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 10,
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#007AFF",
    marginBottom: 5,
  },
  suggestionText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  suggestionType: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  dynamicFieldsContainer: {
    backgroundColor: "#E8F4FD",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  detectedExerciseText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 15,
    textAlign: "center",
  },
  infoContainer: {
    backgroundColor: "#F0F8FF",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#1976D2",
    lineHeight: 20,
  },
});

export default AddWorkoutScreen;
