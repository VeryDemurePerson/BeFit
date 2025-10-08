// src/screens/AddMealScreen.js - Simple food logging
import React, { useState } from 'react';
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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AddMealScreen = ({ navigation, route }) => {
  const { mealType = 'Breakfast' } = route.params || {};
  const [foods, setFoods] = useState([{ name: '', calories: '' }]);
  const [loading, setLoading] = useState(false);

  // Common food items with approximate calories
  const commonFoods = {
    'Apple (medium)': 95,
    'Banana (medium)': 105,
    'Chicken breast (100g)': 165,
    'Rice (1 cup cooked)': 205,
    'Bread (1 slice)': 80,
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

  const addFoodField = () => {
    setFoods([...foods, { name: '', calories: '' }]);
  };

  const removeFoodField = (index) => {
    if (foods.length > 1) {
      setFoods(foods.filter((_, i) => i !== index));
    }
  };

  const updateFood = (index, field, value) => {
    const updatedFoods = foods.map((food, i) => 
      i === index ? { ...food, [field]: value } : food
    );
    setFoods(updatedFoods);
  };

  const selectCommonFood = (foodName, calories, index) => {
    updateFood(index, 'name', foodName);
    updateFood(index, 'calories', calories.toString());
  };

  const saveMeal = async () => {
    // Validate inputs
    const validFoods = foods.filter(food => food.name.trim() && food.calories);
    if (validFoods.length === 0) {
      Alert.alert('Error', 'Please add at least one food item with calories');
      return;
    }

    // Check for valid calorie values
    for (let food of validFoods) {
      if (isNaN(food.calories) || parseInt(food.calories) < 0) {
        Alert.alert('Error', `Please enter a valid calorie value for ${food.name}`);
        return;
      }
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const nutritionDocRef = doc(db, 'nutrition', `${auth.currentUser.uid}_${today}`);
      
      // Get existing nutrition data
      const nutritionDoc = await getDoc(nutritionDocRef);
      const existingData = nutritionDoc.exists() ? nutritionDoc.data() : {
        meals: [],
        totalCalories: 0,
        nutrients: { protein: 0, carbs: 0, fat: 0, fiber: 0 }
      };

      // Calculate meal calories
      const mealCalories = validFoods.reduce((sum, food) => sum + parseInt(food.calories), 0);

      // Estimate basic nutrients (simplified approximation)
      const estimatedNutrients = {
        protein: Math.round(mealCalories * 0.15 / 4), // ~15% calories from protein
        carbs: Math.round(mealCalories * 0.50 / 4),   // ~50% calories from carbs
        fat: Math.round(mealCalories * 0.35 / 9),     // ~35% calories from fat
        fiber: Math.round(mealCalories * 0.02)        // Rough fiber estimate
      };

      // Create new meal entry
      const newMeal = {
        type: mealType,
        time: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        foods: validFoods.map(food => ({
          name: food.name.trim(),
          calories: parseInt(food.calories)
        })),
        calories: mealCalories
      };

      // Update nutrition data
      const updatedData = {
        meals: [...existingData.meals, newMeal],
        totalCalories: existingData.totalCalories + mealCalories,
        nutrients: {
          protein: existingData.nutrients.protein + estimatedNutrients.protein,
          carbs: existingData.nutrients.carbs + estimatedNutrients.carbs,
          fat: existingData.nutrients.fat + estimatedNutrients.fat,
          fiber: existingData.nutrients.fiber + estimatedNutrients.fiber
        },
        date: today,
        userId: auth.currentUser.uid,
        updatedAt: new Date()
      };

      await setDoc(nutritionDocRef, updatedData);

      Alert.alert('Success', 'Meal logged successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', `Failed to save meal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const FoodInput = ({ food, index }) => (
    <View style={styles.foodInputContainer}>
      <View style={styles.foodInputHeader}>
        <Text style={styles.foodInputTitle}>Food Item {index + 1}</Text>
        {foods.length > 1 && (
          <TouchableOpacity onPress={() => removeFoodField(index)}>
            <Text style={styles.removeButton}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.inputLabel}>Food Name</Text>
      <TextInput
        style={styles.input}
        value={food.name}
        onChangeText={(text) => updateFood(index, 'name', text)}
        placeholder="e.g., Grilled Chicken"
        returnKeyType="next"
      />

      <Text style={styles.inputLabel}>Calories</Text>
      <TextInput
        style={styles.input}
        value={food.calories}
        onChangeText={(text) => updateFood(index, 'calories', text)}
        placeholder="e.g., 165"
        keyboardType="numeric"
        returnKeyType="next"
      />

      {/* Common foods suggestions */}
      <Text style={styles.suggestionsTitle}>Quick Add:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
        {Object.entries(commonFoods).map(([foodName, calories]) => (
          <TouchableOpacity
            key={foodName}
            style={styles.suggestionChip}
            onPress={() => selectCommonFood(foodName, calories, index)}
          >
            <Text style={styles.suggestionText}>{foodName}</Text>
            <Text style={styles.suggestionCalories}>{calories} cal</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add {mealType}</Text>
        <TouchableOpacity onPress={saveMeal} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.disabled]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.mealTypeContainer}>
          <Text style={styles.mealTypeTitle}>Meal Type</Text>
          <View style={styles.mealTypeSelector}>
            {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.mealTypeButton,
                  mealType === type && styles.mealTypeButtonActive
                ]}
                onPress={() => navigation.setParams({ mealType: type })}
              >
                <Text style={[
                  styles.mealTypeButtonText,
                  mealType === type && styles.mealTypeButtonTextActive
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Food Inputs */}
        {foods.map((food, index) => (
          <FoodInput key={index} food={food} index={index} />
        ))}

        {/* Add More Food Button */}
        <TouchableOpacity style={styles.addFoodButton} onPress={addFoodField}>
          <Text style={styles.addFoodButtonText}>+ Add Another Food</Text>
        </TouchableOpacity>

        {/* Total Calories Preview */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Calories:</Text>
          <Text style={styles.totalValue}>
            {foods.reduce((sum, food) => sum + (parseInt(food.calories) || 0), 0)} cal
          </Text>
        </View>

        {/* Healthy Eating Reminder */}
        <View style={styles.reminderContainer}>
          <Text style={styles.reminderTitle}>Remember</Text>
          <Text style={styles.reminderText}>
            Focus on nourishing your body with whole foods. This tracker helps you understand your eating patterns, 
            not restrict your intake. Listen to your body's hunger and fullness cues.
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
  mealTypeContainer: {
    marginBottom: 25,
  },
  mealTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  mealTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 3,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  mealTypeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  mealTypeButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  mealTypeButtonTextActive: {
    color: 'white',
  },
  foodInputContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foodInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  foodInputTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  removeButton: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  suggestionsScroll: {
    marginBottom: 5,
  },
  suggestionChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  suggestionCalories: {
    fontSize: 10,
    color: '#666',
  },
  addFoodButton: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
  },
  addFoodButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
  },
  totalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  reminderContainer: {
    backgroundColor: '#E8F5E8',
    padding: 20,
    borderRadius: 12,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 10,
  },
  reminderText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
});

export default AddMealScreen;