// src/screens/AddMealScreen.js - Food logging with USDA search
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { searchFoods } from '../services/foodApi';

const AddMealScreen = ({ navigation, route }) => {
  const { mealType = 'Breakfast' } = route.params || {};
  const [foods, setFoods] = useState([{ id: Date.now(), name: '', calories: '', protein: 0, carbs: 0, fat: 0 }]);
  const [loading, setLoading] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState({});
  const [searchLoading, setSearchLoading] = useState({});
  const searchTimeouts = useRef({});

  const addFoodField = () => setFoods([...foods, { id: Date.now(), name: '', calories: '', protein: 0, carbs: 0, fat: 0 }]);
  const removeFoodField = (id) => foods.length > 1 && setFoods(foods.filter((food) => food.id !== id));

  const updateFood = (index, field, value) => {
    const updatedFoods = foods.map((food, i) =>
      i === index ? { ...food, [field]: value } : food
    );
    setFoods(updatedFoods);
  };

  const performSearch = useCallback(async (text, id) => {
    console.log('performSearch called with:', text, 'for id:', id);
    const trimmedText = text?.trim();
    if (!trimmedText || trimmedText.length < 2 || !/[a-zA-Z0-9]/.test(trimmedText)) {
      setSearchSuggestions(prev => ({ ...prev, [id]: [] }));
      setSearchLoading(prev => ({ ...prev, [id]: false }));
      return;
    }
    
    setSearchLoading(prev => ({ ...prev, [id]: true }));
    try {
      const results = await searchFoods(trimmedText);
      console.log('Search completed, got', results?.length || 0, 'results for id', id);
      
      setSearchSuggestions(prev => ({ ...prev, [id]: results || [] }));
    } catch (error) {
      console.error('Search error:', error);
      setSearchSuggestions(prev => ({ ...prev, [id]: [] }));
    } finally {
      setSearchLoading(prev => ({ ...prev, [id]: false }));
    }
  }, []);

  const handleFoodNameChange = useCallback((text, id) => {
    console.log('handleFoodNameChange called with:', text, 'for id:', id);
    
    // Update the food name immediately
    setFoods(prevFoods => 
      prevFoods.map((food) => 
        food.id === id ? { ...food, name: text } : food
      )
    );
    
    if (searchTimeouts.current[id]) {
      clearTimeout(searchTimeouts.current[id]);
    }
    
    const trimmedText = text?.trim();
    if (trimmedText && trimmedText.length >= 2 && /[a-zA-Z0-9]/.test(trimmedText)) {
      searchTimeouts.current[id] = setTimeout(() => {
        performSearch(text, id);
      }, 400);
    } else {
      setSearchSuggestions(prev => ({ ...prev, [id]: [] }));
      setSearchLoading(prev => ({ ...prev, [id]: false }));
    }
  }, [performSearch]);

  useEffect(() => {
    return () => {
      Object.values(searchTimeouts.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  const saveMeal = async () => {
    const validFoods = foods.filter(food => food.name.trim() && food.calories);
    if (validFoods.length === 0) return Alert.alert('Error', 'Please add at least one food item with calories');

    for (let food of validFoods) {
      if (isNaN(food.calories) || parseInt(food.calories) < 0) {
        return Alert.alert('Error', `Please enter a valid calorie value for ${food.name}`);
      }
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const nutritionDocRef = doc(db, 'nutrition', `${auth.currentUser.uid}_${today}`);
      const nutritionDoc = await getDoc(nutritionDocRef);
      const existingData = nutritionDoc.exists() ? nutritionDoc.data() : {
        meals: [],
        totalCalories: 0,
        nutrients: { protein: 0, carbs: 0, fat: 0, fiber: 0 }
      };

      const mealCalories = validFoods.reduce((sum, f) => sum + parseInt(f.calories), 0);
      const mealProtein = validFoods.reduce((sum, f) => sum + (f.protein || 0), 0);
      const mealCarbs = validFoods.reduce((sum, f) => sum + (f.carbs || 0), 0);
      const mealFat = validFoods.reduce((sum, f) => sum + (f.fat || 0), 0);

      const newMeal = {
        type: mealType,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        foods: validFoods.map(f => ({
          name: f.name.trim(),
          calories: parseInt(f.calories),
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat
        })),
        calories: mealCalories
      };

      const updatedData = {
        meals: [...existingData.meals, newMeal],
        totalCalories: existingData.totalCalories + mealCalories,
        nutrients: {
          protein: existingData.nutrients.protein + mealProtein,
          carbs: existingData.nutrients.carbs + mealCarbs,
          fat: existingData.nutrients.fat + mealFat,
          fiber: existingData.nutrients.fiber
        },
        date: today,
        userId: auth.currentUser.uid,
        updatedAt: new Date()
      };

      await setDoc(nutritionDocRef, updatedData);

      Alert.alert('Success', 'Meal logged successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', `Failed to save meal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const FoodInput = ({ food, suggestions, loadingSuggestions }) => {
    const [localName, setLocalName] = useState(food.name);
    const searchTimeoutRef = useRef(null);

    // Sync local state with prop changes (from suggestions)
    useEffect(() => {
      if (food.name !== localName) {
        setLocalName(food.name);
      }
    }, [food.name]);

    const handleTextChange = (text) => {
      setLocalName(text);
      
      // Update parent state
      setFoods(prevFoods => 
        prevFoods.map((f) => 
          f.id === food.id ? { ...f, name: text } : f
        )
      );

      // Clear existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Search after delay
      const trimmedText = text?.trim();
      if (trimmedText && trimmedText.length >= 2 && /[a-zA-Z0-9]/.test(trimmedText)) {
        searchTimeoutRef.current = setTimeout(() => {
          performSearch(text, food.id);
        }, 400);
      } else {
        setSearchSuggestions(prev => ({ ...prev, [food.id]: [] }));
        setSearchLoading(prev => ({ ...prev, [food.id]: false }));
      }
    };

    const handleSelectSuggestion = (item) => {
      setLocalName(item.name);
      
      setFoods(prevFoods => 
        prevFoods.map((f) => 
          f.id === food.id ? {
            ...f,
            name: item.name,
            calories: item.calories.toString(),
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat
          } : f
        )
      );
      
      setSearchSuggestions(prev => ({ ...prev, [food.id]: [] }));
    };

    const handleCaloriesChange = (text) => {
      setFoods(prevFoods => 
        prevFoods.map((f) => 
          f.id === food.id ? { ...f, calories: text } : f
        )
      );
    };

    const handleMacroChange = (field, text) => {
      setFoods(prevFoods => 
        prevFoods.map((f) => 
          f.id === food.id ? { ...f, [field]: parseFloat(text) || 0 } : f
        )
      );
    };

    useEffect(() => {
      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, []);

    return (
      <View style={styles.foodInputContainer}>
        <View style={styles.foodInputHeader}>
          <Text style={styles.foodInputTitle}>Food Item</Text>
          {foods.length > 1 && (
            <TouchableOpacity onPress={() => removeFoodField(food.id)}>
              <Text style={styles.removeButton}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.inputLabel}>Food Name</Text>
        <TextInput
          style={styles.input}
          value={localName}
          onChangeText={handleTextChange}
          placeholder="e.g., Chicken breast"
        />

        {loadingSuggestions && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {!loadingSuggestions && suggestions.length === 0 && food.name.length >= 2 && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No results found. Try a different search.</Text>
          </View>
        )}

        {suggestions.length > 0 && (
          <View style={styles.suggestionsWrapper}>
            <Text style={styles.suggestionsHeader}>{suggestions.length} suggestions found:</Text>
            <ScrollView style={styles.suggestionsBox} nestedScrollEnabled>
              {suggestions.map((item, i) => (
                <TouchableOpacity
                  key={`suggestion-${food.id}-${i}`}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionName}>{item.name}</Text>
                  <Text style={styles.suggestionMacros}>
                    {item.calories} cal | P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.inputLabel}>Calories</Text>
        <TextInput
          style={styles.input}
          value={food.calories}
          onChangeText={handleCaloriesChange}
          placeholder="e.g., 200"
          keyboardType="numeric"
        />

        <View style={styles.macrosContainer}>
          <View style={styles.macroInput}>
            <Text style={styles.inputLabel}>Protein (g)</Text>
            <TextInput
              style={styles.smallInput}
              value={food.protein.toString()}
              onChangeText={(text) => handleMacroChange('protein', text)}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.macroInput}>
            <Text style={styles.inputLabel}>Carbs (g)</Text>
            <TextInput
              style={styles.smallInput}
              value={food.carbs.toString()}
              onChangeText={(text) => handleMacroChange('carbs', text)}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.macroInput}>
            <Text style={styles.inputLabel}>Fat (g)</Text>
            <TextInput
              style={styles.smallInput}
              value={food.fat.toString()}
              onChangeText={(text) => handleMacroChange('fat', text)}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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

      {foods.map((food) => (
        <FoodInput 
          key={food.id} 
          food={food}
          suggestions={searchSuggestions[food.id] || []}
          loadingSuggestions={searchLoading[food.id] || false}
        />
      ))}

      <TouchableOpacity style={styles.addFoodButton} onPress={addFoodField}>
        <Text style={styles.addFoodButtonText}>+ Add Another Food</Text>
      </TouchableOpacity>

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total Calories:</Text>
        <Text style={styles.totalValue}>
          {foods.reduce((sum, food) => sum + (parseInt(food.calories) || 0), 0)} cal
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  cancelButton: { color: '#007AFF', fontSize: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  saveButton: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  mealTypeContainer: { marginBottom: 25 },
  mealTypeTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 },
  mealTypeSelector: { flexDirection: 'row', justifyContent: 'space-between' },
  mealTypeButton: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6,
    borderWidth: 1, borderColor: '#ddd', marginHorizontal: 3, alignItems: 'center',
    backgroundColor: 'white'
  },
  mealTypeButtonActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  mealTypeButtonText: { color: '#666', fontSize: 14, fontWeight: '500' },
  mealTypeButtonTextActive: { color: 'white' },
  foodInputContainer: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 20 },
  foodInputHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  foodInputTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  removeButton: { color: '#FF3B30', fontSize: 14, fontWeight: '500' },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 8 },
  input: { 
    backgroundColor: '#f8f8f8', 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    borderRadius: 8, 
    fontSize: 16, 
    borderWidth: 1, 
    borderColor: '#e0e0e0',
    marginBottom: 15
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginBottom: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: '#007AFF',
    fontSize: 14,
  },
  noResultsContainer: {
    padding: 10,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    marginBottom: 10,
  },
  noResultsText: {
    color: '#856404',
    fontSize: 13,
  },
  suggestionsHeader: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    fontWeight: '500',
  },
  suggestionsWrapper: {
    marginBottom: 15,
  },
  suggestionsBox: { 
    backgroundColor: 'white', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    marginBottom: 15,
    maxHeight: 200 
  },
  suggestionItem: { 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  suggestionName: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: '#333',
    marginBottom: 4
  },
  suggestionMacros: { 
    fontSize: 12, 
    color: '#666' 
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  macroInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  smallInput: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    textAlign: 'center',
  },
  addFoodButton: { 
    backgroundColor: '#E3F2FD', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#2196F3', 
    borderStyle: 'dashed' 
  },
  addFoodButtonText: { 
    color: '#2196F3', 
    fontSize: 16, 
    fontWeight: '500' 
  },
  totalContainer: { 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  totalLabel: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#333' 
  },
  totalValue: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#007AFF' 
  },
});

export default AddMealScreen;