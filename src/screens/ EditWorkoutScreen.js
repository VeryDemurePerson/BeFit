// src/screens/EditWorkoutScreen.js
import React, { useState } from 'react';
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
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from './themes';

const EditWorkoutScreen = ({ navigation, route }) => {
  const { workout } = route.params;
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  const [editedWorkout, setEditedWorkout] = useState({
    exercise: workout.exercise || '',
    duration: workout.duration?.toString() || '',
    sets: workout.sets?.toString() || '',
    reps: workout.reps?.toString() || '',
    weight: workout.weight?.toString() || '',
    notes: workout.notes || '',
    type: workout.type || 'strength',
  });
  const [loading, setLoading] = useState(false);

  const updateWorkout = async () => {
    if (!editedWorkout.exercise || !editedWorkout.duration) {
      Alert.alert('Error', 'Please fill in exercise name and duration');
      return;
    }

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

      await updateDoc(doc(db, 'workouts', workout.id), workoutData);
      Alert.alert('Success', 'Workout updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', `Failed to update workout: ${error.message}`);
    } finally {
      setLoading(false);
    }
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
        <Text style={[styles.title, { color: colors.text }]}>Edit Workout</Text>
        <TouchableOpacity onPress={updateWorkout} disabled={loading}>
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
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
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
                  styles.typeButtonText,
                  {
                    color:
                      editedWorkout.type === type
                        ? colors.inverseText
                        : colors.text,
                  },
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
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

        {/* Strength Fields */}
        {editedWorkout.type === 'strength' && (
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

            <Text style={[styles.inputLabel, { color: colors.text }]}>Reps</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={editedWorkout.reps}
              onChangeText={(text) =>
                setEditedWorkout((prev) => ({ ...prev, reps: text }))
              }
              placeholder="12"
              placeholderTextColor={colors.subtext}
              keyboardType="numeric"
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>Weight (kg)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={editedWorkout.weight}
              onChangeText={(text) =>
                setEditedWorkout((prev) => ({ ...prev, weight: text }))
              }
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

        {/* Original Date */}
        <View
          style={[
            styles.originalDateContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.originalDateLabel, { color: colors.subtext }]}>
            Original Date:
          </Text>
          <Text style={[styles.originalDateValue, { color: colors.text }]}>
            {workout.createdAt?.toDate
              ? new Date(workout.createdAt.toDate()).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Unknown date'}
          </Text>
        </View>

        {/* Warning */}
        <View
          style={[
            styles.warningContainer,
            {
              backgroundColor:
                theme === 'light' ? '#FFF3CD' : '#403418',
              borderColor: theme === 'light' ? '#FFEAA7' : '#66522b',
            },
          ]}
        >
          <Text
            style={[
              styles.warningTitle,
              { color: theme === 'light' ? '#856404' : '#ffcd6a' },
            ]}
          >
            Note
          </Text>
          <Text
            style={[
              styles.warningText,
              { color: theme === 'light' ? '#856404' : '#ffcd6a' },
            ]}
          >
            Editing this workout will update the information but keep the original
            date. The changes will be reflected in your progress statistics.
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
  inputLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 20 },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
  },
  notesInput: { height: 100, textAlignVertical: 'top' },
  typeSelector: { flexDirection: 'row', marginBottom: 10 },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
    alignItems: 'center',
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
