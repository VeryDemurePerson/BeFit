// src/screens/AddMealScreen.js — Light/Dark Mode Ready (Final)
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

const AddMealScreen = ({ navigation, route }) => {
  const { mealType = 'Breakfast' } = route.params || {};
  const [foods, setFoods] = useState([{ id: Date.now(), name: '', calories: '' }]);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  const commonFoods = {
    'Apple (medium)': 95,
    'Banana (medium)': 105,
    'Chicken breast (100g)': 165,
    'Rice (1 cup cooked)': 205,
    'Egg (large)': 70,
    'Avocado (medium)': 234,
    'Salmon (100g)': 208,
    'Yogurt (1 cup)': 150,
    'Oatmeal (1 cup)': 154,
    'Broccoli (1 cup)': 25,
    'Sweet potato (medium)': 103,
    'Almonds (1 oz)': 164,
    'Orange (medium)': 62,
    'Pasta (1 cup cooked)': 220,
  };

  const addFoodField = () => setFoods([...foods, { id: Date.now(), name: '', calories: '' }]);
  const removeFoodField = (index) => foods.length > 1 && setFoods(foods.filter((_, i) => i !== index));
  const updateFood = (index, field, value) =>
    setFoods(foods.map((food, i) => (i === index ? { ...food, [field]: value } : food)));

  const selectCommonFood = (name, calories, index) => {
    updateFood(index, 'name', name);
    updateFood(index, 'calories', calories.toString());
  };

  const saveMeal = async () => {
    const validFoods = foods.filter(f => f.name.trim() && f.calories);
    if (!validFoods.length) return Alert.alert('Error', 'Please add at least one food item with calories');

    for (let food of validFoods) {
      if (isNaN(food.calories) || parseInt(food.calories) < 0)
        return Alert.alert('Error', `Invalid calorie value for ${food.name}`);
    }

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
        protein: Math.round(mealCalories * 0.15 / 4),
        carbs: Math.round(mealCalories * 0.5 / 4),
        fat: Math.round(mealCalories * 0.35 / 9),
        fiber: Math.round(mealCalories * 0.02),
      };

      const newMeal = {
        type: mealType,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        foods: validFoods.map(f => ({ name: f.name.trim(), calories: parseInt(f.calories) })),
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
      Alert.alert('Success', 'Meal logged successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      console.error('Error saving meal:', err);
      Alert.alert('Error', `Failed to save meal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const FoodInput = ({ food, index }) => (
    <View style={[styles.foodInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.foodInputHeader}>
        <Text style={[styles.foodInputTitle, { color: colors.text }]}>Food Item {index + 1}</Text>
        {foods.length > 1 && (
          <TouchableOpacity onPress={() => removeFoodField(index)}>
            <Text style={[styles.removeButton, { color: '#FF3B30' }]}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.inputLabel, { color: colors.text }]}>Food Name</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
        value={food.name}
        onChangeText={(t) => updateFood(index, 'name', t)}
        placeholder="e.g., Grilled Chicken"
        placeholderTextColor={colors.subtext}
      />

      <Text style={[styles.inputLabel, { color: colors.text }]}>Calories</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
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
            <Text style={[styles.suggestionText, { color: colors.text }]}>{name}</Text>
            <Text style={[styles.suggestionCalories, { color: colors.subtext }]}>{cal} cal</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelButton, { color: colors.accent }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Add {mealType}</Text>
        <TouchableOpacity onPress={saveMeal} disabled={loading}>
          <Text style={[styles.saveButton, { color: colors.accent, opacity: loading ? 0.5 : 1 }]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.mealTypeContainer}>
          <Text style={[styles.mealTypeTitle, { color: colors.text }]}>Meal Type</Text>
          <View style={styles.mealTypeSelector}>
            {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.mealTypeButton,
                  {
                    backgroundColor: mealType === type ? colors.accent : colors.card,
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
          <FoodInput key={i} food={food} index={i} />
        ))}

        <TouchableOpacity
          style={[styles.addFoodButton, { borderColor: colors.accent, backgroundColor: colors.card }]}
          onPress={addFoodField}
        >
          <Text style={[styles.addFoodButtonText, { color: colors.accent }]}>+ Add Another Food</Text>
        </TouchableOpacity>

        <View style={[styles.totalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total Calories:</Text>
          <Text style={[styles.totalValue, { color: colors.accent }]}>
            {foods.reduce((sum, f) => sum + (parseInt(f.calories) || 0), 0)} cal
          </Text>
        </View>

        <View style={[styles.reminderContainer, { backgroundColor: theme === 'light' ? '#E8F5E8' : '#1B3720' }]}>
          <Text style={[styles.reminderTitle, { color: '#4CAF50' }]}>Remember</Text>
          <Text style={[styles.reminderText, { color: '#4CAF50' }]}>
            Focus on nourishing your body with whole foods. This tracker helps you understand your eating patterns,
            not restrict your intake. Listen to your body's hunger and fullness cues.
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
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  cancelButton: { fontSize: 16 },
  saveButton: { fontSize: 16, fontWeight: '600' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  mealTypeContainer: { marginBottom: 25 },
  mealTypeTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  mealTypeSelector: { flexDirection: 'row', justifyContent: 'space-between' },
  mealTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  mealTypeButtonText: { fontSize: 14, fontWeight: '500' },
  foodInputContainer: { padding: 20, borderRadius: 12, marginBottom: 20, borderWidth: 1 },
  foodInputHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  foodInputTitle: { fontSize: 16, fontWeight: '600' },
  removeButton: { fontSize: 14, fontWeight: '500' },
  inputLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8, marginTop: 10 },
  input: { paddingHorizontal: 15, paddingVertical: 12, borderRadius: 8, fontSize: 16, borderWidth: 1 },
  suggestionsTitle: { fontSize: 14, fontWeight: '500', marginTop: 15, marginBottom: 10 },
  suggestionChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginRight: 8, minWidth: 80 },
  suggestionText: { fontSize: 12, fontWeight: '500', textAlign: 'center', marginBottom: 2 },
  suggestionCalories: { fontSize: 10 },
  addFoodButton: { padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 20, borderWidth: 1 },
  addFoodButtonText: { fontSize: 16, fontWeight: '500' },
  totalContainer: {
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  totalLabel: { fontSize: 18, fontWeight: '600' },
  totalValue: { fontSize: 24, fontWeight: 'bold' },
  reminderContainer: { padding: 20, borderRadius: 12 },
  reminderTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  reminderText: { fontSize: 14, lineHeight: 20 },
});

export default AddMealScreen;
