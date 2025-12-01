// src/screens/AddMealScreen.js — Light/Dark Mode + Gamification
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from './themes';
import { recordMealGamification } from '../gamification/engine';

const commonFoods = {
  'Grilled Chicken': 165,
  'Salmon Fillet': 230,
  'Brown Rice (1 cup)': 216,
  'Steamed Broccoli': 55,
  'Greek Yogurt': 130,
  'Banana': 105,
  'Apple': 95,
  'Oatmeal (1 cup)': 150,
};

const AddMealScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  const [foods, setFoods] = useState([{ id: Date.now(), name: '', calories: '' }]);
  const [loading, setLoading] = useState(false);
  const mealType = route?.params?.mealType || 'Lunch';

  const addFoodField = () => setFoods([...foods, { id: Date.now(), name: '', calories: '' }]);
  const removeFoodField = (index) => foods.length > 1 && setFoods(foods.filter((_, i) => i !== index));
  const updateFood = (index, field, value) =>
    setFoods(foods.map((food, i) => (i === index ? { ...food, [field]: value } : food)));

  const selectCommonFood = (name, calories, index) => {
    updateFood(index, 'name', name);
    updateFood(index, 'calories', calories.toString());
  };

  const saveMeal = async () => {
    const validFoods = foods.filter((f) => f.name.trim() && f.calories);
    if (!validFoods.length) return Alert.alert('Error', 'Please add at least one food item with calories');

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const ref = doc(db, 'nutrition', `${auth.currentUser.uid}_${today}`);
      const docSnap = await getDoc(ref);
      const existing = docSnap.exists()
        ? docSnap.data()
        : { meals: [], totalCalories: 0, nutrients: { protein: 0, carbs: 0, fat: 0, fiber: 0 } };

      const mealCalories = validFoods.reduce((sum, f) => sum + parseInt(f.calories), 0);
      const est = {
        protein: Math.round((mealCalories * 0.15) / 4),
        carbs: Math.round((mealCalories * 0.5) / 4),
        fat: Math.round((mealCalories * 0.35) / 9),
        fiber: Math.round(mealCalories * 0.02),
      };

      const newMeal = {
        type: mealType,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        foods: validFoods.map((f) => ({ name: f.name.trim(), calories: parseInt(f.calories) })),
        calories: mealCalories,
      };

      const updated = {
        meals: [...existing.meals, newMeal],
        totalCalories: existing.totalCalories + mealCalories,
        nutrients: {
          protein: existing.nutrients.protein + est.protein,
          carbs: existing.nutrients.carbs + est.carbs,
          fat: existing.nutrients.fat + est.fat,
          fiber: existing.nutrients.fiber + est.fiber,
        },
        date: today,
        userId: auth.currentUser.uid,
        updatedAt: new Date(),
      };

      await setDoc(ref, updated);

      // 🔥 Gamification: log a meal
      try {
        await recordMealGamification(auth.currentUser.uid);
      } catch (e) {
        console.log('Gamification (meal) error:', e);
      }

      Alert.alert('Success', 'Meal logged successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      console.error('Error saving meal:', err);
      Alert.alert('Error', `Failed to save meal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalCalories = foods.reduce((sum, f) => sum + (parseInt(f.calories) || 0), 0);

  const FoodInput = ({ food, index }) => (
    <View style={[styles.foodCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.foodHeader}>
        <Text style={[styles.foodTitle, { color: colors.text }]}>Food #{index + 1}</Text>
        {foods.length > 1 && (
          <TouchableOpacity onPress={() => removeFoodField(index)}>
            <Text style={[styles.removeButton, { color: '#FF3B30' }]}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.inputLabel, { color: colors.text }]}>Food Name</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.input, color: colors.text, borderColor: colors.border },
        ]}
        value={food.name}
        onChangeText={(t) => updateFood(index, 'name', t)}
        placeholder="e.g., Grilled Chicken"
        placeholderTextColor={colors.subtext}
      />

      <Text style={[styles.inputLabel, { color: colors.text }]}>Calories</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.input, color: colors.text, borderColor: colors.border },
        ]}
        value={food.calories}
        onChangeText={(t) => updateFood(index, 'calories', t)}
        placeholder="e.g., 165"
        placeholderTextColor={colors.subtext}
        keyboardType="numeric"
      />

      <Text style={[styles.suggestionsTitle, { color: colors.subtext }]}>Quick Add:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
        {Object.entries(commonFoods).map(([name, cal]) => (
          <TouchableOpacity
            key={name}
            style={[styles.suggestionChip, { backgroundColor: colors.border }]}
            onPress={() => selectCommonFood(name, cal, index)}
          >
            <Text style={[styles.suggestionText, { color: colors.text }]}>
              {name} • {cal} cal
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
          <Text style={[styles.backButton, { color: colors.accent }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Log Meal</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Meal Type Selector */}
        <View
          style={[
            styles.mealTypeContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Meal Type</Text>
          <View style={styles.mealTypeButtons}>
            {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.mealTypeButton,
                  {
                    backgroundColor: mealType === type ? colors.accent : colors.input,
                    borderColor: mealType === type ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => navigation.setParams({ mealType: type })}
              >
                <Text
                  style={[
                    styles.mealTypeButtonText,
                    { color: mealType === type ? '#fff' : colors.text },
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {foods.map((food, i) => (
          <FoodInput key={food.id} food={food} index={i} />
        ))}

        <TouchableOpacity
          style={[
            styles.addFoodButton,
            { borderColor: colors.accent, backgroundColor: colors.card },
          ]}
          onPress={addFoodField}
        >
          <Text style={[styles.addFoodButtonText, { color: colors.accent }]}>
            + Add Another Food
          </Text>
        </TouchableOpacity>

        <View
          style={[
            styles.totalContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.totalLabel, { color: colors.text }]}>
            Total Calories:
          </Text>
          <Text style={[styles.totalValue, { color: colors.accent }]}>{totalCalories} cal</Text>
        </View>

        <View
          style={[
            styles.reminderContainer,
            { backgroundColor: colors.highlight, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.reminderTitle, { color: colors.text }]}>
            Tip for balanced meals
          </Text>
          <Text style={[styles.reminderText, { color: colors.subtext }]}>
            Aim for a mix of lean protein, complex carbs, and healthy fats. Logging regularly
            helps us track your habits and unlock nutrition achievements!
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: loading ? colors.border : colors.accent,
              opacity: loading ? 0.7 : 1,
            },
          ]}
          onPress={saveMeal}
          disabled={loading}
        >
          <Text style={[styles.saveButtonText, { color: '#fff' }]}>
            {loading ? 'Saving...' : 'Save Meal'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { fontSize: 14, fontWeight: '500' },
  title: { fontSize: 20, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 32 },
  mealTypeContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  mealTypeButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mealTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  mealTypeButtonText: { fontSize: 14, fontWeight: '500' },
  foodCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 10,
  },
  foodTitle: { fontSize: 14, fontWeight: '600' },
  removeButton: { fontSize: 13, fontWeight: '500' },
  inputLabel: { fontSize: 13, marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  suggestionsTitle: { fontSize: 12, marginTop: 10, marginBottom: 4 },
  suggestionsScroll: { marginHorizontal: -4 },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 4,
  },
  suggestionText: { fontSize: 12 },
  addFoodButton: {
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 10,
  },
  addFoodButtonText: { fontSize: 14, fontWeight: '500' },
  totalContainer: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  totalLabel: { fontSize: 18, fontWeight: '600' },
  totalValue: { fontSize: 24, fontWeight: 'bold' },
  reminderContainer: { padding: 20, borderRadius: 12, borderWidth: 1 },
  reminderTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  reminderText: { fontSize: 14, lineHeight: 20 },
  saveButton: {
    marginTop: 10,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 16, fontWeight: '600' },
});

export default AddMealScreen;