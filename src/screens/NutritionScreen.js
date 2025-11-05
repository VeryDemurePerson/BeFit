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
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from './themes';

const NutritionScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  const [todayNutrition, setTodayNutrition] = useState({
    meals: [],
    totalCalories: 0,
    nutrients: { protein: 0, carbs: 0, fat: 0, fiber: 0 },
  });
  const [weeklyHistory, setWeeklyHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const dailyTargets = { calories: 2000, protein: 150, carbs: 250, fat: 65, fiber: 25 };

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
      Alert.alert('Error', 'Failed to load nutrition data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayNutrition = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const nutritionDoc = await getDoc(doc(db, 'nutrition', `${auth.currentUser.uid}_${today}`));
      setTodayNutrition(
        nutritionDoc.exists()
          ? nutritionDoc.data()
          : { meals: [], totalCalories: 0, nutrients: { protein: 0, carbs: 0, fat: 0, fiber: 0 } }
      );
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
        const nutritionDoc = await getDoc(doc(db, 'nutrition', `${auth.currentUser.uid}_${dateString}`));
        weeklyData.push({
          date: dateString,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          calories: nutritionDoc.exists() ? nutritionDoc.data().totalCalories || 0 : 0,
        });
      }
      setWeeklyHistory(weeklyData);
    } catch (error) {
      console.error('Error fetching weekly history:', error);
    }
  };

  const NutrientCard = ({ title, current, target, unit, color }) => {
    const percentage = Math.min((current / target) * 100, 100);
    return (
      <View style={[styles.nutrientCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.nutrientHeader}>
          <Text style={[styles.nutrientTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.nutrientValues, { color: colors.subtext }]}>
            {Math.round(current)}/{target}{unit}
          </Text>
        </View>
        <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
          <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
        <Text style={[styles.percentageText, { color: colors.subtext }]}>
          {Math.round(percentage)}% of target
        </Text>
      </View>
    );
  };

  const MealCard = ({ meal }) => (
    <View style={[styles.mealCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.mealHeader}>
        <Text style={[styles.mealType, { color: colors.text }]}>{meal.type}</Text>
        <Text style={[styles.mealTime, { color: colors.subtext }]}>{meal.time}</Text>
      </View>
      {meal.foods.map((food, index) => (
        <View key={index} style={styles.foodItem}>
          <Text style={[styles.foodName, { color: colors.text }]}>{food.name}</Text>
          <Text style={[styles.foodCalories, { color: colors.subtext }]}>{food.calories} cal</Text>
        </View>
      ))}
    </View>
  );

  const WeeklyChart = () => (
    <View style={[styles.chartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.chartTitle, { color: colors.text }]}>Weekly Calorie Intake</Text>
      <View style={styles.barsContainer}>
        {weeklyHistory.map((day, index) => (
          <View key={index} style={styles.barContainer}>
            <View style={[styles.barBackground, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${Math.min((day.calories / dailyTargets.calories) * 100, 100)}%`,
                    backgroundColor:
                      day.calories >= dailyTargets.calories * 0.8 ? '#4CAF50' : colors.accent,
                  },
                ]}
              />
            </View>
            <Text style={[styles.barLabel, { color: colors.subtext }]}>{day.dayName}</Text>
            <Text style={[styles.barValue, { color: colors.text }]}>{day.calories}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const QuickAddMeal = () => (
    <View style={styles.quickMealContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Add</Text>
      <View style={styles.quickMealGrid}>
        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((mealType) => (
          <TouchableOpacity
            key={mealType}
            style={[styles.quickMealButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('AddMeal', { mealType })}
          >
            <Text style={styles.quickMealIcon}>
              {mealType === 'Breakfast' ? '🌅' : mealType === 'Lunch' ? '🥗' : mealType === 'Dinner' ? '🍽️' : '🎃'}
            </Text>
            <Text style={[styles.quickMealText, { color: colors.text }]}>{mealType}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>Loading nutrition data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Nutrition</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('AddMeal')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        {/* Daily Summary */}
        <View style={[styles.summaryContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Summary</Text>
          <View style={styles.caloriesSummary}>
            <Text style={[styles.caloriesNumber, { color: colors.accent }]}>
              {Math.round(todayNutrition.totalCalories)}
            </Text>
            <Text style={[styles.caloriesLabel, { color: colors.subtext }]}>calories consumed</Text>
          </View>
        </View>

        {/* Nutrients */}
        <View style={styles.nutrientsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Nutrients</Text>
          <NutrientCard title="Protein" current={todayNutrition.nutrients.protein} target={dailyTargets.protein} unit="g" color="#FF6B6B" />
          <NutrientCard title="Carbohydrates" current={todayNutrition.nutrients.carbs} target={dailyTargets.carbs} unit="g" color="#4ECDC4" />
          <NutrientCard title="Healthy Fats" current={todayNutrition.nutrients.fat} target={dailyTargets.fat} unit="g" color="#45B7D1" />
          <NutrientCard title="Fiber" current={todayNutrition.nutrients.fiber} target={dailyTargets.fiber} unit="g" color="#96CEB4" />
        </View>

        <QuickAddMeal />

        <View style={styles.mealsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Meals</Text>
          {todayNutrition.meals.length === 0 ? (
            <View style={[styles.noMealsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.noMealsText, { color: colors.text }]}>No meals logged yet today</Text>
              <Text style={[styles.noMealsSubtext, { color: colors.subtext }]}>Tap + Add to log your first meal</Text>
            </View>
          ) : (
            todayNutrition.meals.map((meal, index) => <MealCard key={index} meal={meal} />)
          )}
        </View>

        <WeeklyChart />

        <View style={[styles.tipsContainer, { backgroundColor: theme === 'light' ? '#E8F5E8' : '#1B3720' }]}>
          <Text style={[styles.tipsTitle, { color: '#4CAF50' }]}>Healthy Eating Tips</Text>
          <Text style={[styles.tipText, { color: '#4CAF50' }]}>• Focus on whole, unprocessed foods</Text>
          <Text style={[styles.tipText, { color: '#4CAF50' }]}>• Include colorful fruits & veggies</Text>
          <Text style={[styles.tipText, { color: '#4CAF50' }]}>• Stay hydrated throughout the day</Text>
          <Text style={[styles.tipText, { color: '#4CAF50' }]}>• Listen to hunger and fullness cues</Text>
          <Text style={[styles.tipText, { color: '#4CAF50' }]}>• Remember: progress, not perfection</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  addButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  content: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  summaryContainer: { margin: 20, padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  caloriesSummary: { alignItems: 'center' },
  caloriesNumber: { fontSize: 36, fontWeight: 'bold', marginBottom: 5 },
  caloriesLabel: { fontSize: 16 },
  nutrientsContainer: { paddingHorizontal: 20, marginBottom: 20 },
  nutrientCard: { padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1 },
  nutrientHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  nutrientTitle: { fontSize: 16, fontWeight: '600' },
  nutrientValues: { fontSize: 14, fontWeight: '500' },
  progressBarContainer: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 5 },
  progressBar: { height: '100%', borderRadius: 3 },
  percentageText: { fontSize: 12 },
  quickMealContainer: { paddingHorizontal: 20, marginBottom: 20 },
  quickMealGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  quickMealButton: { padding: 15, borderRadius: 8, alignItems: 'center', flex: 1, marginHorizontal: 5, borderWidth: 1 },
  quickMealIcon: { fontSize: 24, marginBottom: 8 },
  quickMealText: { fontSize: 12, fontWeight: '600' },
  mealsContainer: { paddingHorizontal: 20, marginBottom: 20 },
  mealCard: { padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  mealType: { fontSize: 16, fontWeight: '600' },
  mealTime: { fontSize: 14 },
  foodItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  foodName: { fontSize: 14 },
  foodCalories: { fontSize: 14, fontWeight: '500' },
  noMealsContainer: { padding: 30, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  noMealsText: { fontSize: 16, marginBottom: 5 },
  noMealsSubtext: { fontSize: 14 },
  chartContainer: { margin: 20, padding: 20, borderRadius: 12, borderWidth: 1 },
  chartTitle: { fontSize: 16, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
  barsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  barContainer: { alignItems: 'center', flex: 1 },
  barBackground: { width: 20, height: 80, borderRadius: 4, justifyContent: 'flex-end', marginBottom: 8 },
  bar: { width: '100%', borderRadius: 4, minHeight: 2 },
  barLabel: { fontSize: 12, marginBottom: 2 },
  barValue: { fontSize: 10, fontWeight: 'bold' },
  tipsContainer: { margin: 20, marginTop: 0, padding: 20, borderRadius: 12 },
  tipsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  tipText: { fontSize: 14, marginBottom: 8, lineHeight: 20 },
});

export default NutritionScreen;
