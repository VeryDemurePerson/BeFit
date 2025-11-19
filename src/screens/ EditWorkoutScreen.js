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

const EditWorkoutScreen = ({ navigation, route }) => {
  const { workout } = route.params;
  
  const [editedWorkout, setEditedWorkout] = useState({
    exercise: workout.exercise || '',
    duration: workout.duration?.toString() || '',
    sets: workout.sets?.toString() || '',
    reps: workout.reps?.toString() || '',
    weight: workout.weight?.toString() || '',
    notes: workout.notes || '',
    type: workout.type || 'strength'
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
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'workouts', workout.id), workoutData);

      Alert.alert('Success', 'Workout updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      console.error('Error updating workout:', error);
      Alert.alert('Error', `Failed to update workout: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Workout</Text>
        <TouchableOpacity onPress={updateWorkout} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.disabled]}>
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
        <Text style={styles.inputLabel}>Workout Type</Text>
        <View style={styles.typeSelector}>
          {['strength', 'cardio', 'flexibility'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                editedWorkout.type === type && styles.typeButtonActive
              ]}
              onPress={() => setEditedWorkout(prev => ({ ...prev, type }))}
            >
              <Text style={[
                styles.typeButtonText,
                editedWorkout.type === type && styles.typeButtonTextActive
              ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Exercise Name */}
        <Text style={styles.inputLabel}>Exercise Name *</Text>
        <TextInput
          style={styles.input}
          value={editedWorkout.exercise}
          onChangeText={(text) => setEditedWorkout(prev => ({ ...prev, exercise: text }))}
          placeholder="e.g., Push-ups, Running, Yoga"
          returnKeyType="next"
        />

        {/* Duration */}
        <Text style={styles.inputLabel}>Duration (minutes) *</Text>
        <TextInput
          style={styles.input}
          value={editedWorkout.duration}
          onChangeText={(text) => setEditedWorkout(prev => ({ ...prev, duration: text }))}
          placeholder="30"
          keyboardType="numeric"
          returnKeyType="next"
        />

        {/* Sets (for strength training) */}
        {editedWorkout.type === 'strength' && (
          <>
            <Text style={styles.inputLabel}>Sets</Text>
            <TextInput
              style={styles.input}
              value={editedWorkout.sets}
              onChangeText={(text) => setEditedWorkout(prev => ({ ...prev, sets: text }))}
              placeholder="3"
              keyboardType="numeric"
              returnKeyType="next"
            />

            <Text style={styles.inputLabel}>Reps</Text>
            <TextInput
              style={styles.input}
              value={editedWorkout.reps}
              onChangeText={(text) => setEditedWorkout(prev => ({ ...prev, reps: text }))}
              placeholder="12"
              keyboardType="numeric"
              returnKeyType="next"
            />

            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={editedWorkout.weight}
              onChangeText={(text) => setEditedWorkout(prev => ({ ...prev, weight: text }))}
              placeholder="20"
              keyboardType="numeric"
              returnKeyType="next"
            />
          </>
        )}

        {/* Notes */}
        <Text style={styles.inputLabel}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={editedWorkout.notes}
          onChangeText={(text) => setEditedWorkout(prev => ({ ...prev, notes: text }))}
          placeholder="How did it feel? Any observations..."
          multiline
          numberOfLines={4}
          returnKeyType="done"
        />

        {/* Original Date Display */}
        <View style={styles.originalDateContainer}>
          <Text style={styles.originalDateLabel}>Original Date:</Text>
          <Text style={styles.originalDateValue}>
            {new Date(workout.createdAt.toDate()).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>

        {/* Warning */}
        <View style={styles.warningContainer}>
          <Text style={styles.warningTitle}>Note</Text>
          <Text style={styles.warningText}>
            Editing this workout will update the information but keep the original date. 
            The changes will be reflected in your progress statistics.
          </Text>
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
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  originalDateContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  originalDateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  originalDateValue: {
    fontSize: 16,
    color: '#333',
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});

export default EditWorkoutScreen;