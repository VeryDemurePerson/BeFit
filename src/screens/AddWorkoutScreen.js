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
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from './themes';
import { recordWorkoutGamification } from '../gamification/engine';

// Exercise database with YouTube video IDs
const EXERCISE_DATABASE = {
  running: { 
    type: 'cardio', 
    fields: ['distance', 'pace', 'calories'], 
    units: { distance: 'km', pace: 'min/km', calories: 'kcal' },
    videoId: 'brFHyOtTwH4',
    thumbnail: 'https://img.youtube.com/vi/brFHyOtTwH4/hqdefault.jpg',
  },
  'push-ups': { 
    type: 'strength', 
    fields: ['sets', 'reps', 'weight'], 
    units: { sets: 'sets', reps: 'reps', weight: 'kg' },
    videoId: 'IODxDxX7oi4',
    thumbnail: 'https://img.youtube.com/vi/IODxDxX7oi4/hqdefault.jpg',
  },
  'push ups': { 
    type: 'strength', 
    fields: ['sets', 'reps', 'weight'], 
    units: { sets: 'sets', reps: 'reps', weight: 'kg' },
    videoId: 'IODxDxX7oi4',
    thumbnail: 'https://img.youtube.com/vi/IODxDxX7oi4/hqdefault.jpg',
  },
  'pull-ups': { 
    type: 'strength', 
    fields: ['sets', 'reps', 'weight'], 
    units: { sets: 'sets', reps: 'reps', weight: 'kg' },
    videoId: 'eGo4IYlbE5g',
    thumbnail: 'https://img.youtube.com/vi/eGo4IYlbE5g/hqdefault.jpg',
  },
  squats: { 
    type: 'strength', 
    fields: ['sets', 'reps', 'weight'], 
    units: { sets: 'sets', reps: 'reps', weight: 'kg' },
    videoId: 'ultWZbUMPL8',
    thumbnail: 'https://img.youtube.com/vi/ultWZbUMPL8/hqdefault.jpg',
  },
  deadlifts: { 
    type: 'strength', 
    fields: ['sets', 'reps', 'weight'], 
    units: { sets: 'sets', reps: 'reps', weight: 'kg' },
    videoId: 'op9kVnSso6Q',
    thumbnail: 'https://img.youtube.com/vi/op9kVnSso6Q/hqdefault.jpg',
  },
  'bench press': { 
    type: 'strength', 
    fields: ['sets', 'reps', 'weight'], 
    units: { sets: 'sets', reps: 'reps', weight: 'kg' },
    videoId: 'rT7DgCr-3pg',
    thumbnail: 'https://img.youtube.com/vi/rT7DgCr-3pg/hqdefault.jpg',
  },
  planks: { 
    type: 'strength', 
    fields: ['sets', 'hold_time'], 
    units: { sets: 'sets', hold_time: 'seconds' },
    videoId: 'ASdvN_XEl_c',
    thumbnail: 'https://img.youtube.com/vi/ASdvN_XEl_c/hqdefault.jpg',
  },
  yoga: { 
    type: 'flexibility', 
    fields: ['poses', 'difficulty'], 
    units: { poses: 'poses', difficulty: 'level (1-10)' },
    videoId: 'v7AYKMP6rOE',
    thumbnail: 'https://img.youtube.com/vi/v7AYKMP6rOE/hqdefault.jpg',
  },
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
  const [weightUnit, setWeightUnit] = useState('kg'); // 'kg' or 'lbs'
  const [distanceUnit, setDistanceUnit] = useState('km'); // 'km' or 'mi'
  const [sets, setSets] = useState([{ id: 1, reps: '', weight: '' }]); // Individual sets tracking

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

  // Set management functions
  const addSet = () => {
    const newId = sets.length > 0 ? Math.max(...sets.map(s => s.id)) + 1 : 1;
    const lastSet = sets[sets.length - 1];
    setSets([...sets, { 
      id: newId, 
      reps: lastSet?.reps || '', 
      weight: lastSet?.weight || '' 
    }]);
  };

  const removeSet = (id) => {
    if (sets.length > 1) {
      setSets(sets.filter(set => set.id !== id));
    }
  };

  const updateSet = (id, field, value) => {
    setSets(sets.map(set => 
      set.id === id ? { ...set, [field]: value } : set
    ));
  };

  const duplicateSet = (id) => {
    const setToDuplicate = sets.find(s => s.id === id);
    if (setToDuplicate) {
      const newId = Math.max(...sets.map(s => s.id)) + 1;
      const setIndex = sets.findIndex(s => s.id === id);
      const newSets = [...sets];
      newSets.splice(setIndex + 1, 0, { 
        id: newId, 
        reps: setToDuplicate.reps, 
        weight: setToDuplicate.weight 
      });
      setSets(newSets);
    }
  };

  // Conversion functions
  const kgToLbs = (kg) => (kg * 2.20462).toFixed(1);
  const lbsToKg = (lbs) => (lbs / 2.20462).toFixed(1);
  const kmToMi = (km) => (km * 0.621371).toFixed(2);
  const miToKm = (mi) => (mi / 0.621371).toFixed(2);

  const convertWeight = (value, fromUnit) => {
    if (!value || value === '0') return '0';
    return fromUnit === 'kg' ? kgToLbs(parseFloat(value)) : lbsToKg(parseFloat(value));
  };

  const convertDistance = (value, fromUnit) => {
    if (!value || value === '0') return '0';
    return fromUnit === 'km' ? kmToMi(parseFloat(value)) : miToKm(parseFloat(value));
  };

  const toggleWeightUnit = () => {
    const newUnit = weightUnit === 'kg' ? 'lbs' : 'kg';
    
    // Convert all set weights
    setSets(sets.map(set => ({
      ...set,
      weight: set.weight ? convertWeight(set.weight, weightUnit) : ''
    })));
    
    // Convert dynamic field weight if exists
    if (dynamicFields.weight) {
      const convertedWeight = convertWeight(dynamicFields.weight, weightUnit);
      updateDynamicField('weight', convertedWeight);
    }
    
    setWeightUnit(newUnit);
  };

  const toggleDistanceUnit = () => {
    const newUnit = distanceUnit === 'km' ? 'mi' : 'km';
    
    // Convert existing distance values
    if (dynamicFields.distance) {
      const convertedDistance = convertDistance(dynamicFields.distance, distanceUnit);
      updateDynamicField('distance', convertedDistance);
    }
    
    setDistanceUnit(newUnit);
  };

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

      // Process set data for strength exercises
      const isStrength = detectedExercise?.type === 'strength';
      const hasRepsAndWeight = detectedExercise?.fields.includes('reps') && 
                               detectedExercise?.fields.includes('weight');
      
      let setsData = null;
      if (isStrength && hasRepsAndWeight) {
        setsData = sets
          .filter(set => set.reps && set.weight)
          .map(set => ({
            reps: parseInt(set.reps),
            weight: parseFloat(set.weight),
            unit: weightUnit
          }));
      }

      const workoutData = {
        userId: auth.currentUser.uid,
        exercise: formData.exercise.trim(),
        duration: parseInt(formData.duration),
        notes: formData.notes.trim(),
        type: formData.type,
        detectedFields: processedDynamicFields,
        sets: setsData, // Add individual sets data
        totalSets: setsData ? setsData.length : (processedDynamicFields.sets || 0),
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

  const openYouTubeVideo = async (videoId) => {
    // Try to open in YouTube app first, fallback to browser
    const youtubeAppUrl = `vnd.youtube://${videoId}`;
    const youtubeWebUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
      const canOpenYoutubeApp = await Linking.canOpenURL(youtubeAppUrl);
      if (canOpenYoutubeApp) {
        await Linking.openURL(youtubeAppUrl);
      } else {
        await Linking.openURL(youtubeWebUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open video');
      console.error('Error opening YouTube:', error);
    }
  };

  const renderVideoButton = () => {
    if (!detectedExercise || !detectedExercise.videoId) return null;

    return (
      <TouchableOpacity
        style={[styles.videoCard, { 
          backgroundColor: colors.card,
          borderColor: colors.accent 
        }]}
        onPress={() => openYouTubeVideo(detectedExercise.videoId)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: detectedExercise.thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.playOverlay}>
          <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.9)" />
        </View>
        <View style={styles.videoCardContent}>
          <Text style={[styles.videoCardTitle, { color: colors.text }]}>
            Watch Form Demonstration
          </Text>
          <Text style={[styles.videoCardSubtitle, { color: colors.subtext }]}>
            Learn proper technique • Opens in YouTube
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDynamicFields = () => {
    if (!detectedExercise) return null;

    const isStrength = detectedExercise.type === 'strength';
    const hasWeight = detectedExercise.fields.includes('weight');
    const hasDistance = detectedExercise.fields.includes('distance');

    return (
      <View
        style={[
          styles.dynamicFieldsContainer,
          { backgroundColor: colors.accentSoft, borderColor: colors.accent },
        ]}
      >
        <View style={styles.detectedHeader}>
          <View style={styles.detectedInfo}>
            <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
            <Text style={[styles.detectedExerciseText, { color: colors.accent }]}>
              Detected: {formData.exercise}
            </Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.typeBadgeText}>{detectedExercise.type}</Text>
          </View>
        </View>

        {renderVideoButton()}

        {/* Strength exercises: Individual Set Tracking */}
        {isStrength && (
          <View style={[styles.strengthCard, { 
            backgroundColor: colors.card,
            borderColor: colors.border 
          }]}>
            <View style={styles.strengthCardHeader}>
              <Ionicons name="barbell-outline" size={20} color={colors.accent} />
              <Text style={[styles.strengthCardTitle, { color: colors.text }]}>
                Sets & Performance
              </Text>
              {hasWeight && (
                <TouchableOpacity
                  style={[styles.unitToggleSmall, { 
                    backgroundColor: colors.accent + '20',
                    borderColor: colors.accent 
                  }]}
                  onPress={toggleWeightUnit}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.unitToggleTextSmall, { color: colors.accent }]}>
                    {weightUnit}
                  </Text>
                  <Ionicons name="swap-horizontal" size={12} color={colors.accent} />
                </TouchableOpacity>
              )}
            </View>

            {/* Individual Sets */}
            {sets.map((set, index) => (
              <View 
                key={set.id} 
                style={[styles.setRow, { 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border 
                }]}
              >
                <View style={[styles.setNumber, { backgroundColor: colors.accent + '15' }]}>
                  <Text style={[styles.setNumberText, { color: colors.accent }]}>
                    {index + 1}
                  </Text>
                </View>

                <View style={styles.setInputs}>
                  {/* Reps Input */}
                  <View style={styles.setInputGroup}>
                    <Text style={[styles.setInputLabel, { color: colors.subtext }]}>
                      Reps
                    </Text>
                    <TextInput
                      style={[styles.setInput, { 
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.text 
                      }]}
                      value={set.reps}
                      onChangeText={(value) => updateSet(set.id, 'reps', value)}
                      placeholder="10"
                      placeholderTextColor={colors.placeholderText}
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Weight Input */}
                  {hasWeight && (
                    <View style={styles.setInputGroup}>
                      <Text style={[styles.setInputLabel, { color: colors.subtext }]}>
                        Weight ({weightUnit})
                      </Text>
                      <TextInput
                        style={[styles.setInput, { 
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          color: colors.text 
                        }]}
                        value={set.weight}
                        onChangeText={(value) => updateSet(set.id, 'weight', value)}
                        placeholder={weightUnit === 'kg' ? '50' : '110'}
                        placeholderTextColor={colors.placeholderText}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  )}
                </View>

                {/* Set Actions */}
                <View style={styles.setActions}>
                  <TouchableOpacity
                    style={[styles.setActionButton, { backgroundColor: colors.accent + '15' }]}
                    onPress={() => duplicateSet(set.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="copy-outline" size={18} color={colors.accent} />
                  </TouchableOpacity>
                  
                  {sets.length > 1 && (
                    <TouchableOpacity
                      style={[styles.setActionButton, { backgroundColor: colors.danger + '15' }]}
                      onPress={() => removeSet(set.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {/* Add Set Button */}
            <TouchableOpacity
              style={[styles.addSetButton, { 
                backgroundColor: colors.accent + '10',
                borderColor: colors.accent 
              }]}
              onPress={addSet}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
              <Text style={[styles.addSetButtonText, { color: colors.accent }]}>
                Add Set
              </Text>
            </TouchableOpacity>

            {/* Summary */}
            {sets.length > 0 && sets.some(s => s.reps && s.weight) && (
              <View style={[styles.setSummary, { 
                backgroundColor: colors.accentSoft,
                borderColor: colors.accent 
              }]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>
                    Total Sets:
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.accent }]}>
                    {sets.filter(s => s.reps && s.weight).length}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>
                    Total Reps:
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.accent }]}>
                    {sets.reduce((sum, s) => sum + (parseInt(s.reps) || 0), 0)}
                  </Text>
                </View>
                {hasWeight && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.text }]}>
                      Total Volume:
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.accent }]}>
                      {sets.reduce((sum, s) => 
                        sum + ((parseInt(s.reps) || 0) * (parseFloat(s.weight) || 0)), 0
                      ).toFixed(1)} {weightUnit}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Hold Time for planks */}
            {detectedExercise.fields.includes('hold_time') && (
              <View style={styles.inputContainer}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  Hold Time per Set
                </Text>
                <View style={[styles.inputWithIcon, { 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border 
                }]}>
                  <Ionicons name="timer-outline" size={20} color={colors.subtext} />
                  <TextInput
                    style={[styles.iconInput, { color: colors.text }]}
                    value={dynamicFields.hold_time || ''}
                    onChangeText={(value) => updateDynamicField('hold_time', value)}
                    placeholder="60"
                    placeholderTextColor={colors.placeholderText}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.unitLabel, { color: colors.subtext }]}>
                    seconds
                  </Text>
                </View>
                <Text style={[styles.fieldHint, { color: colors.subtext }]}>
                  Hold time for each set
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Cardio exercises: Distance, Pace, Calories */}
        {detectedExercise.type === 'cardio' && (
          <View style={[styles.cardioCard, { 
            backgroundColor: colors.card,
            borderColor: colors.border 
          }]}>
            <View style={styles.cardioCardHeader}>
              <Ionicons name="speedometer-outline" size={20} color={colors.accent} />
              <Text style={[styles.cardioCardTitle, { color: colors.text }]}>
                Cardio Metrics
              </Text>
            </View>

            {/* Distance with Unit Toggle */}
            {hasDistance && (
              <View style={styles.inputContainer}>
                <View style={styles.weightHeader}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>
                    Distance
                  </Text>
                  <TouchableOpacity
                    style={[styles.unitToggle, { 
                      backgroundColor: colors.accent + '20',
                      borderColor: colors.accent 
                    }]}
                    onPress={toggleDistanceUnit}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.unitToggleText, { color: colors.accent }]}>
                      {distanceUnit}
                    </Text>
                    <Ionicons name="swap-horizontal" size={14} color={colors.accent} />
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputWithIcon, { 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border 
                }]}>
                  <Ionicons name="navigate-outline" size={20} color={colors.subtext} />
                  <TextInput
                    style={[styles.iconInput, { color: colors.text }]}
                    value={dynamicFields.distance || ''}
                    onChangeText={(value) => updateDynamicField('distance', value)}
                    placeholder={distanceUnit === 'km' ? '5.0' : '3.1'}
                    placeholderTextColor={colors.placeholderText}
                    keyboardType="decimal-pad"
                  />
                  <Text style={[styles.unitLabel, { color: colors.subtext }]}>
                    {distanceUnit}
                  </Text>
                </View>
                {dynamicFields.distance && parseFloat(dynamicFields.distance) > 0 && (
                  <Text style={[styles.conversionHint, { color: colors.subtext }]}>
                    ≈ {convertDistance(dynamicFields.distance, distanceUnit)} {distanceUnit === 'km' ? 'mi' : 'km'}
                  </Text>
                )}
              </View>
            )}

            {/* Other cardio fields */}
            {detectedExercise.fields.filter(f => f !== 'distance').map((field) => (
              <View key={field} style={styles.inputContainer}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  {field.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </Text>
                <View style={[styles.inputWithIcon, { 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border 
                }]}>
                  <Ionicons 
                    name={
                      field.includes('pace') ? 'stopwatch-outline' :
                      field.includes('speed') ? 'speedometer-outline' :
                      field.includes('calories') ? 'flame-outline' :
                      field.includes('steps') ? 'footsteps-outline' :
                      'analytics-outline'
                    } 
                    size={20} 
                    color={colors.subtext} 
                  />
                  <TextInput
                    style={[styles.iconInput, { color: colors.text }]}
                    value={dynamicFields[field] || ''}
                    onChangeText={(value) => updateDynamicField(field, value)}
                    placeholder={
                      field === 'pace' ? '5:30' :
                      field === 'speed' ? '20' :
                      field === 'calories' ? '300' :
                      field === 'steps' ? '10000' :
                      '0'
                    }
                    placeholderTextColor={colors.placeholderText}
                    keyboardType={field === 'pace' ? 'default' : 'numeric'}
                  />
                  <Text style={[styles.unitLabel, { color: colors.subtext }]}>
                    {detectedExercise.units[field]}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Flexibility and Sports - keep existing layout */}
        {!isStrength && detectedExercise.type !== 'cardio' && detectedExercise.fields.map((field) => (
          <View key={field} style={styles.inputContainer}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              {field.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}{' '}
              {detectedExercise.units[field] && (
                <Text style={{ color: colors.subtext }}>
                  ({detectedExercise.units[field]})
                </Text>
              )}
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text },
              ]}
              value={dynamicFields[field] || ''}
              onChangeText={(value) => updateDynamicField(field, value)}
              placeholder={`Enter ${field.replace('_', ' ')}`}
              placeholderTextColor={colors.placeholderText}
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
        <Text style={[styles.suggestionsTitle, { color: colors.subtext }]}>
          <Ionicons name="search-outline" size={14} color={colors.subtext} /> Suggestions:
        </Text>
        <View style={styles.suggestionsGrid}>
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion}
              style={[
                styles.suggestionChip,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => updateField('exercise', suggestion)}
              activeOpacity={0.7}
            >
              <View style={styles.suggestionContent}>
                <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion}</Text>
                <Text style={[styles.suggestionType, { color: colors.subtext }]}>
                  {EXERCISE_DATABASE[suggestion].type}
                </Text>
              </View>
              {EXERCISE_DATABASE[suggestion].videoId && (
                <Ionicons name="play-circle-outline" size={18} color={colors.accent} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="close" size={28} color={colors.subtext} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Add Workout</Text>
        <TouchableOpacity 
          onPress={saveWorkout} 
          disabled={loading}
          style={[styles.saveButton, { 
            backgroundColor: colors.accent,
            opacity: loading ? 0.6 : 1 
          }]}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Exercise Name <Text style={{ color: colors.danger }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text },
            ]}
            value={formData.exercise}
            onChangeText={(text) => updateField('exercise', text)}
            placeholder="e.g., Running, Push-ups, Yoga"
            placeholderTextColor={colors.placeholderText}
          />
        </View>

        {renderExerciseSuggestions()}
        {renderDynamicFields()}

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Duration (minutes) <Text style={{ color: colors.danger }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text },
            ]}
            value={formData.duration}
            onChangeText={(text) => updateField('duration', text)}
            placeholder="e.g., 30"
            placeholderTextColor={colors.placeholderText}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Notes (Optional)</Text>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text },
            ]}
            value={formData.notes}
            onChangeText={(text) => updateField('notes', text)}
            placeholder="Add any notes about your workout..."
            placeholderTextColor={colors.placeholderText}
            multiline
            numberOfLines={4}
          />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  inputContainer: { marginBottom: 20 },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1.5,
    minHeight: 50,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1.5,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  suggestionsContainer: { marginBottom: 20 },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  suggestionsGrid: { gap: 8 },
  suggestionChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionContent: { flex: 1 },
  suggestionText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestionType: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  dynamicFieldsContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  detectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  detectedExerciseText: {
    fontSize: 15,
    fontWeight: '700',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  videoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    // meal-like card shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  thumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: '#000',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoCardContent: {
    padding: 16,
  },
  videoCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  videoCardSubtitle: {
    fontSize: 13,
  },
  strengthCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  strengthCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  strengthCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  setsRepsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 10,
  },
  iconInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  unitLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  fieldHint: {
    fontSize: 12,
    marginTop: 4,
  },
  weightSection: {
    marginBottom: 8,
  },
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  unitToggleText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  conversionHint: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
  cardioCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardioCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  cardioCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  unitToggleSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1.5,
    marginLeft: 'auto',
  },
  unitToggleTextSmall: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    gap: 12,
  },
  setNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setNumberText: {
    fontSize: 16,
    fontWeight: '700',
  },
  setInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  setInputGroup: {
    flex: 1,
  },
  setInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  setInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    textAlign: 'center',
  },
  setActions: {
    flexDirection: 'row',
    gap: 6,
  },
  setActionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: 8,
    minHeight: 56,
  },
  addSetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  setSummary: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default AddWorkoutScreen;
