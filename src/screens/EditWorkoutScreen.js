// src/screens/EditWorkoutScreen.js - Separate Edit/Add Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const EditWorkoutScreen = ({ navigation, route }) => {
  const { mode, workout } = route.params || { mode: 'add' };
  const isEditing = mode === 'edit';
  
  const [formData, setFormData] = useState({
    exercise: '',
    duration: '',
    sets: '',
    reps: '',
    weight: '',
    notes: '',
    type: 'strength'
  });
  const [saving, setSaving] = useState(false);

  const workoutTypes = ['strength', 'cardio', 'flexibility'];

  useEffect(() => {
    if (isEditing && workout) {
      setFormData({
        exercise: workout.exercise || '',
        duration: workout.duration?.toString() || '',
        sets: workout.sets?.toString() || '',
        reps: workout.reps?.toString() || '',
        weight: workout.weight?.toString() || '',
        notes: workout.notes || '',
        type: workout.type || 'strength'
      });
    }
  }, [isEditing, workout]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.exercise.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return false;
    }
    
    if (!formData.duration.trim()) {
      Alert.alert('Error', 'Please enter workout duration');
      return false;
    }
    
    const duration = parseInt(formData.duration);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Error', 'Please enter a valid duration in minutes');
      return false;
    }
    
    // Validate numeric fields if provided
    if (formData.sets && (isNaN(parseInt(formData.sets)) || parseInt(formData.sets) < 0)) {
      Alert.alert('Error', 'Please enter a valid number of sets');
      return false;
    }
    
    if (formData.reps && (isNaN(parseInt(formData.reps)) || parseInt(formData.reps) < 0)) {
      Alert.alert('Error', 'Please enter a valid number of reps');
      return false;
    }
    
    if (formData.weight && (isNaN(parseFloat(formData.weight)) || parseFloat(formData.weight) < 0)) {
      Alert.alert('Error', 'Please enter a valid weight');
      return false;
    }
    
    return true;
  };

  const saveWorkout = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const workoutData = {
        exercise: formData.exercise.trim(),
        duration: parseInt(formData.duration),
        sets: formData.sets ? parseInt(formData.sets) : null,
        reps: formData.reps ? parseInt(formData.reps) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        notes: formData.notes.trim(),
        type: formData.type,
        userId: auth.currentUser.uid,
      };

      if (isEditing) {
        await updateDoc(doc(db, 'workouts', workout.id), {
          ...workoutData,
          updatedAt: new Date(),
        });
        Alert.alert('Success', 'Workout updated successfully!');
      } else {
        await addDoc(collection(db, 'workouts'), {
          ...workoutData,
          createdAt: new Date(),
          date: new Date().toDateString()
        });
        Alert.alert('Success', 'Workout logged successfully!');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout');
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({ label, field, placeholder, keyboardType = 'default', multiline = false }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={formData[field]}
        onChangeText={(value) => updateField(field, value)}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        returnKeyType={multiline ? 'default' : 'next'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Edit Workout' : 'Add Workout'}
        </Text>
        <TouchableOpacity onPress={saveWorkout} disabled={saving}>
          <Text style={[styles.saveButton, saving && styles.disabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Workout Type Selector */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Workout Type</Text>
          <View style={styles.typeSelector}>
            {workoutTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  formData.type === type && styles.typeButtonActive
                ]}
                onPress={() => updateField('type', type)}
              >
                <Text style={[
                  styles.typeButtonText,
                  formData.type === type && styles.typeButtonTextActive
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Exercise Name */}
        <InputField
          label="Exercise Name *"
          field="exercise"
          placeholder="e.g., Push-ups, Running, Yoga"
        />

        {/* Duration */}
        <InputField
          label="Duration (minutes) *"
          field="duration"
          placeholder="30"
          keyboardType="numeric"
        />

        {/* Strength Training Fields */}
        {formData.type === 'strength' && (
          <>
            <InputField
              label="Sets"
              field="sets"
              placeholder="3"
              keyboardType="numeric"
            />
            
            <InputField
              label="Reps"
              field="reps"
              placeholder="12"
              keyboardType="numeric"
            />
            
            <InputField
              label="Weight (kg)"
              field="weight"
              placeholder="20"
              keyboardType="numeric"
            />
          </>
        )}

        {/* Notes */}
        <InputField
          label="Notes"
          field="notes"
          placeholder="How did it feel? Any observations..."
          multiline={true}
        />

        {/* Tips Section */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips</Text>
          {formData.type === 'strength' && (
            <Text style={styles.tipText}>• Track your sets, reps, and weight for progress monitoring</Text>
          )}
          {formData.type === 'cardio' && (
            <Text style={styles.tipText}>• Focus on duration and intensity level</Text>
          )}
          {formData.type === 'flexibility' && (
            <Text style={styles.tipText}>• Note which muscle groups you stretched</Text>
          )}
          <Text style={styles.tipText}>• Add notes about how the workout felt</Text>
        </View>

        {/* Edit Info */}
        {isEditing && (
          <View style={styles.editInfo}>
            <Text style={styles.editInfoText}>
              Originally logged: {workout?.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
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
    fontSize: 16,
    color: '#FF3B30',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
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
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  tipsContainer: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 4,
    lineHeight: 20,
  },
  editInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  editInfoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default EditWorkoutScreen;