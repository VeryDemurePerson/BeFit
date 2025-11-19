<<<<<<< HEAD

=======
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
<<<<<<< HEAD
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
=======
import { doc, getDoc, collection } from 'firebase/firestore';
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
import { auth, db } from '../services/firebase';
import { useFocusEffect } from '@react-navigation/native';

const NutritionScreen = ({ navigation }) => {
  const [todayNutrition, setTodayNutrition] = useState({
    meals: [],
    totalCalories: 0,
    nutrients: {
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    }
  });
  const [weeklyHistory, setWeeklyHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

<<<<<<< HEAD

  const dailyTargets = {
    calories: 2000, // Moderate baseline
    protein: 150,   // grams
    carbs: 250,     // grams  
    fat: 65,        // grams
    fiber: 25       // grams
=======
  // Daily targets - these could be made user-configurable
  const dailyTargets = {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    fiber: 25
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchNutritionData();
    }, [])
  );

  useEffect(() => {
    fetchNutritionData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNutritionData();
    setRefreshing(false);
  };

  const fetchNutritionData = async () => {
    try {
      await fetchTodayNutrition();
      await fetchWeeklyHistory();
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
<<<<<<< HEAD
=======
      Alert.alert('Error', 'Failed to load nutrition data');
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayNutrition = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const nutritionDoc = await getDoc(doc(db, 'nutrition', `${auth.currentUser.uid}_${today}`));
      
      if (nutritionDoc.exists()) {
        setTodayNutrition(nutritionDoc.data());
      } else {
        setTodayNutrition({
          meals: [],
          totalCalories: 0,
          nutrients: { protein: 0, carbs: 0, fat: 0, fiber: 0 }
        });
      }
    } catch (error) {
      console.error('Error fetching today nutrition:', error);
    }
  };

  const fetchWeeklyHistory = async () => {
    try {
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        try {
          const nutritionDoc = await getDoc(doc(db, 'nutrition', `${auth.currentUser.uid}_${dateString}`));
          weeklyData.push({
            date: dateString,
            dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
            calories: nutritionDoc.exists() ? nutritionDoc.data().totalCalories || 0 : 0
          });
        } catch (error) {
          weeklyData.push({
            date: dateString,
            dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
            calories: 0
          });
        }
      }
      setWeeklyHistory(weeklyData);
    } catch (error) {
      console.error('Error fetching weekly history:', error);
    }
  };

  const NutrientCard = ({ title, current, target, unit, color }) => {
    const percentage = Math.min((current / target) * 100, 100);
    
    return (
      <View style={styles.nutrientCard}>
        <View style={styles.nutrientHeader}>
          <Text style={styles.nutrientTitle}>{title}</Text>
          <Text style={styles.nutrientValues}>{Math.round(current)}/{target}{unit}</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${percentage}%`, backgroundColor: color }
            ]} 
          />
        </View>
        <Text style={styles.percentageText}>{Math.round(percentage)}% of target</Text>
      </View>
    );
  };

  const MealCard = ({ meal }) => (
    <View style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <Text style={styles.mealType}>{meal.type}</Text>
        <Text style={styles.mealTime}>{meal.time}</Text>
      </View>
      {meal.foods.map((food, index) => (
        <View key={index} style={styles.foodItem}>
          <Text style={styles.foodName}>{food.name}</Text>
          <Text style={styles.foodCalories}>{food.calories} cal</Text>
        </View>
      ))}
    </View>
  );

  const WeeklyChart = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Weekly Calorie Intake</Text>
      <View style={styles.barsContainer}>
        {weeklyHistory.map((day, index) => (
          <View key={index} style={styles.barContainer}>
            <View style={styles.barBackground}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: `${Math.min((day.calories / dailyTargets.calories) * 100, 100)}%`,
                    backgroundColor: day.calories >= dailyTargets.calories * 0.8 ? '#4CAF50' : '#2196F3'
                  }
                ]} 
              />
            </View>
            <Text style={styles.barLabel}>{day.dayName}</Text>
            <Text style={styles.barValue}>{day.calories}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const QuickAddMeal = () => (
    <View style={styles.quickMealContainer}>
      <Text style={styles.sectionTitle}>Quick Add</Text>
      <View style={styles.quickMealGrid}>
        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((mealType) => (
          <TouchableOpacity
            key={mealType}
            style={styles.quickMealButton}
            onPress={() => navigation.navigate('AddMeal', { mealType })}
          >
            <Text style={styles.quickMealIcon}>
              {mealType === 'Breakfast' ? '🌅' : 
               mealType === 'Lunch' ? '🥗' :
<<<<<<< HEAD
               mealType === 'Dinner' ? '🍽️' : '🍎'}
=======
               mealType === 'Dinner' ? '🍽️' : '🎃'}
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
            </Text>
            <Text style={styles.quickMealText}>{mealType}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading nutrition data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nutrition</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddMeal')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Daily Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.caloriesSummary}>
            <Text style={styles.caloriesNumber}>{Math.round(todayNutrition.totalCalories)}</Text>
            <Text style={styles.caloriesLabel}>calories consumed</Text>
          </View>
        </View>

        {/* Nutrients Breakdown */}
        <View style={styles.nutrientsContainer}>
          <Text style={styles.sectionTitle}>Nutrients</Text>
          <NutrientCard
            title="Protein"
            current={todayNutrition.nutrients.protein}
            target={dailyTargets.protein}
            unit="g"
            color="#FF6B6B"
          />
          <NutrientCard
            title="Carbohydrates"
            current={todayNutrition.nutrients.carbs}
            target={dailyTargets.carbs}
            unit="g"
            color="#4ECDC4"
          />
          <NutrientCard
            title="Healthy Fats"
            current={todayNutrition.nutrients.fat}
            target={dailyTargets.fat}
            unit="g"
            color="#45B7D1"
          />
          <NutrientCard
            title="Fiber"
            current={todayNutrition.nutrients.fiber}
            target={dailyTargets.fiber}
            unit="g"
            color="#96CEB4"
          />
        </View>

        {/* Quick Add Meals */}
        <QuickAddMeal />

        {/* Today's Meals */}
        <View style={styles.mealsContainer}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          {todayNutrition.meals.length === 0 ? (
            <View style={styles.noMealsContainer}>
              <Text style={styles.noMealsText}>No meals logged yet today</Text>
              <Text style={styles.noMealsSubtext}>Tap + Add to log your first meal</Text>
            </View>
          ) : (
            todayNutrition.meals.map((meal, index) => (
              <MealCard key={index} meal={meal} />
            ))
          )}
        </View>

        {/* Weekly Chart */}
        <WeeklyChart />

        {/* Healthy Eating Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Healthy Eating Tips</Text>
          <Text style={styles.tipText}>• Focus on whole, unprocessed foods</Text>
          <Text style={styles.tipText}>• Include a variety of colorful fruits and vegetables</Text>
          <Text style={styles.tipText}>• Stay hydrated throughout the day</Text>
          <Text style={styles.tipText}>• Listen to your body's hunger and fullness cues</Text>
          <Text style={styles.tipText}>• Remember: progress, not perfection</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  summaryContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  caloriesSummary: {
    alignItems: 'center',
  },
  caloriesNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  caloriesLabel: {
    fontSize: 16,
    color: '#666',
  },
  nutrientsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  nutrientCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  nutrientTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  nutrientValues: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 12,
    color: '#666',
  },
  quickMealContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickMealGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickMealButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickMealIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickMealText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  mealsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mealCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  mealTime: {
    fontSize: 14,
    color: '#666',
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  foodName: {
    fontSize: 14,
    color: '#333',
  },
  foodCalories: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  noMealsContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  noMealsText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  noMealsSubtext: {
    fontSize: 14,
    color: '#666',
  },
  chartContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barBackground: {
    width: 20,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  barValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  tipsContainer: {
    backgroundColor: '#E8F5E8',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
  },
  tipText: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default NutritionScreen;