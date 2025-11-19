// src/screens/AddWorkoutScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from './themes';
import { recordWorkoutGamification } from '../gamification/engine';

// Exercise database (unchanged)
const EXERCISE_DATABASE = {
  running: { type: 'cardio', fields: ['distance', 'pace', 'calories'], units: { distance: 'km', pace: 'min/km', calories: 'kcal' } },
  jogging: { type: 'cardio', fields: ['distance', 'pace', 'calories'], units: { distance: 'km', pace: 'min/km', calories: 'kcal' } },
  cycling: { type: 'cardio', fields: ['distance', 'speed', 'calories'], units: { distance: 'km', speed: 'km/h', calories: 'kcal' } },
  walking: { type: 'cardio', fields: ['distance', 'steps', 'calories'], units: { distance: 'km', steps: 'steps', calories: 'kcal' } },
  swimming: { type: 'cardio', fields: ['distance', 'strokes', 'calories'], units: { distance: 'm', strokes: 'strokes', calories: 'kcal' } },
  rowing: { type: 'cardio', fields: ['distance', 'strokes', 'calories'], units: { distance: 'm', strokes: 'strokes/min', calories: 'kcal' } },
  'push-ups': { type: 'strength', fields: ['sets', 'reps', 'weight'], units: { sets: 'sets', reps: 'reps', weight: 'kg' } },
  'push ups': { type: 'strength', fields: ['sets', 'reps', 'weight'], units: { sets: 'sets', reps: 'reps', weight: 'kg' } },
  'pull-ups': { type: 'strength', fields: ['sets', 'reps', 'weight'], units: { sets: 'sets', reps: 'reps', weight: 'kg' } },
  'pull ups': { type: 'strength', fields: ['sets', 'reps', 'weight'], units: { sets: 'sets', reps: 'reps', weight: 'kg' } },
  squats: { type: 'strength', fields: ['sets', 'reps', 'weight'], units: { sets: 'sets', reps: 'reps', weight: 'kg' } },
  deadlifts: { type: 'strength', fields: ['sets', 'reps', 'weight'], units: { sets: 'sets', reps: 'reps', weight: 'kg' } },
  'bench press': { type: 'strength', fields: ['sets', 'reps', 'weight'], units: { sets: 'sets', reps: 'reps', weight: 'kg' } },
  'bicep curls': { type: 'strength', fields: ['sets', 'reps', 'weight'], units: { sets: 'sets', reps: 'reps', weight: 'kg' } },
  lunges: { type: 'strength', fields: ['sets', 'reps', 'weight'], units: { sets: 'sets', reps: 'reps', weight: 'kg' } },
  planks: { type: 'strength', fields: ['sets', 'hold_time'], units: { sets: 'sets', hold_time: 'seconds' } },
  yoga: { type: 'flexibility', fields: ['poses', 'difficulty'], units: { poses: 'poses', difficulty: 'level (1-10)' } },
  stretching: { type: 'flexibility', fields: ['muscle_groups', 'hold_time'], units: { muscle_groups: 'groups', hold_time: 'seconds' } },
  pilates: { type: 'flexibility', fields: ['exercises', 'difficulty'], units: { exercises: 'exercises', difficulty: 'level (1-10)' } },
  basketball: { type: 'sports', fields: ['points', 'rebounds', 'calories'], units: { points: 'points', rebounds: 'rebounds', calories: 'kcal' } },
  tennis: { type: 'sports', fields: ['sets_won', 'games_won', 'calories'], units: { sets_won: 'sets', games_won: 'games', calories: 'kcal' } },
  football: { type: 'sports', fields: ['goals', 'assists', 'calories'], units: { goals: 'goals', assists: 'assists', calories: 'kcal' } },
  soccer: { type: 'sports', fields: ['goals', 'assists', 'calories'], units: { goals: 'goals', assists: 'assists', calories: 'kcal' } },
};

const AddWorkoutScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  const [formData, setFormData] = useState({
    exercise: '',
    duration: '',
    notes: '',
    type: 'general',
  });
  const [detectedExercise, setDetectedExercise] = useState(null);
  const [dynamicFields, setDynamicFields] = useState({});
  const [loading, setLoading] = useState(false);

  // Detect exercise type automatically
  useEffect(() => {
    if (formData.exercise.trim().length > 2) {
      const exerciseLower = formData.exercise.toLowerCase().trim();
      let match = EXERCISE_DATABASE[exerciseLower];
      if (!match) {
        const partialMatch = Object.keys(EXERCISE_DATABASE).find((key) =>
          exerciseLower.includes(key) || key.includes(exerciseLower)
        );
        if (partialMatch) match = EXERCISE_DATABASE[partialMatch];
      }
      if (match && match !== detectedExercise) {
        setDetectedExercise(match);
        setFormData((prev) => ({ ...prev, type: match.type }));
        setDynamicFields({});
      } else if (!match && detectedExercise) {
        setDetectedExercise(null);
        setFormData((prev) => ({ ...prev, type: 'general' }));
        setDynamicFields({});
      }
    } else {
      setDetectedExercise(null);
      setFormData((prev) => ({ ...prev, type: 'general' }));
      setDynamicFields({});
    }
  }, [formData.exercise]);

  const updateField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const updateDynamicField = (field, value) => setDynamicFields((prev) => ({ ...prev, [field]: value }));

  const validateForm = () => {
    if (!formData.exercise.trim()) return Alert.alert('Error', 'Please enter an exercise name');
    if (!formData.duration.trim()) return Alert.alert('Error', 'Please enter workout duration');
    const duration = parseInt(formData.duration);
    if (isNaN(duration) || duration <= 0) return Alert.alert('Error', 'Please enter a valid duration');
    return true;
  };

  const saveWorkout = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const processedDynamicFields = {};
      if (detectedExercise) {
        detectedExercise.fields.forEach((field) => {
          const value = dynamicFields[field];
          if (value && value.trim()) processedDynamicFields[field] = parseFloat(value);
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

      await addDoc(collection(db, 'workouts'), workoutData);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { totalWorkouts: increment(1) });
      try {
        await recordWorkoutGamification(auth.currentUser.uid, workoutData, new Date());
      } catch (e) {
        console.log('Gamification (workout) error:', e);
      }

      Alert.alert('Success', 'Workout logged successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('Error', `Failed to log workout: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderDynamicFields = () => {
    if (!detectedExercise) return null;
    return (
      <View
        style={[
          styles.dynamicFieldsContainer,
          { backgroundColor: colors.highlight, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.detectedExerciseText, { color: colors.accent }]}>
          Detected: {formData.exercise} ({detectedExercise.type})
        </Text>
        {detectedExercise.fields.map((field) => (
          <View key={field} style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {field.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}{' '}
              {detectedExercise.units[field] && `(${detectedExercise.units[field]})`}
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
              ]}
              value={dynamicFields[field] || ''}
              onChangeText={(value) => updateDynamicField(field, value)}
              placeholder={`Enter ${field.replace('_', ' ')}`}
              placeholderTextColor={colors.subtext}
              keyboardType="numeric"
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
        <Text style={[styles.suggestionsTitle, { color: colors.subtext }]}>Suggestions:</Text>
        <View style={styles.suggestionsGrid}>
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion}
              style={[
                styles.suggestionChip,
                { backgroundColor: colors.card, borderColor: colors.accent },
              ]}
              onPress={() => updateField('exercise', suggestion)}
            >
              <Text style={[styles.suggestionText, { color: colors.accent }]}>{suggestion}</Text>
              <Text style={[styles.suggestionType, { color: colors.subtext }]}>
                ({EXERCISE_DATABASE[suggestion].type})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

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
        <Text style={[styles.title, { color: colors.text }]}>Add Workout</Text>
        <TouchableOpacity onPress={saveWorkout} disabled={loading}>
          <Text
            style={[
              styles.saveButton,
              { color: colors.accent, opacity: loading ? 0.5 : 1 },
            ]}
          >
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Exercise Name */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Exercise Name *</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
            ]}
            value={formData.exercise}
            onChangeText={(text) => updateField('exercise', text)}
            placeholder="e.g., Running, Push-ups, Yoga"
            placeholderTextColor={colors.subtext}
          />
        </View>

        {renderExerciseSuggestions()}

        {/* Duration */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Duration (minutes) *</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
            ]}
            value={formData.duration}
            onChangeText={(text) => updateField('duration', text)}
            placeholder="30"
            placeholderTextColor={colors.subtext}
            keyboardType="numeric"
          />
        </View>

        {renderDynamicFields()}

        {/* Notes */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Notes</Text>
          <TextInput
            style={[
              styles.input,
              styles.notesInput,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
            ]}
            value={formData.notes}
            onChangeText={(text) => updateField('notes', text)}
            placeholder="How did it feel?"
            placeholderTextColor={colors.subtext}
            multiline
          />
        </View>

        {/* Info Section (same yellow style as Edit screen) */}
        <View
          style={[
            styles.infoContainer,
            {
              backgroundColor: theme === 'light' ? '#FFF3CD' : '#403418',
              borderColor: theme === 'light' ? '#FFEAA7' : '#66522b',
            },
          ]}
        >
          <Text
            style={[
              styles.infoTitle,
              { color: theme === 'light' ? '#856404' : '#ffcd6a' },
            ]}
          >
            Smart Form Detection
          </Text>
          <Text
            style={[
              styles.infoText,
              { color: theme === 'light' ? '#856404' : '#ffcd6a' },
            ]}
          >
            Type an exercise name and the form will automatically show relevant fields.
            Supported: Running, Cycling, Push-ups, Squats, Yoga, and many more!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  cancelButton: { fontSize: 16 },
  title: { fontSize: 18, fontWeight: 'bold' },
  saveButton: { fontSize: 16, fontWeight: '600' },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
  },
  notesInput: { height: 100, textAlignVertical: 'top' },
  suggestionsContainer: { marginBottom: 20 },
  suggestionsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 5,
  },
  suggestionText: { fontSize: 14, fontWeight: '600' },
  suggestionType: { fontSize: 11, marginTop: 2 },
  dynamicFieldsContainer: { padding: 15, borderRadius: 8, marginBottom: 20, borderWidth: 1 },
  detectedExerciseText: { fontSize: 14, fontWeight: '600', marginBottom: 15, textAlign: 'center' },
  infoContainer: { padding: 15, borderRadius: 8, marginTop: 10, borderWidth: 1 },
  infoTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  infoText: { fontSize: 14, lineHeight: 20 },
});

export default AddWorkoutScreen;
