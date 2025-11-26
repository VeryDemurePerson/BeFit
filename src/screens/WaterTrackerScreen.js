
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const { width: screenWidth } = Dimensions.get('window');

const WaterTrackerScreen = () => {
  const [todayWater, setTodayWater] = useState(0);
  const [dailyGoal] = useState(8); // 8 glasses per day
  const [weeklyHistory, setWeeklyHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWaterData();
  }, []);

  const fetchWaterData = async () => {
    try {
      await fetchTodayWater();
      await fetchWeeklyHistory();
    } catch (error) {
      console.error('Error fetching water data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayWater = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const waterDoc = await getDoc(doc(db, 'water_intake', `${auth.currentUser.uid}_${today}`));

      const waterDoc = await getDoc(doc(db, 'water_intake', `${auth.currentUser.uid}_${today}`));

      
      if (waterDoc.exists()) {
        setTodayWater(waterDoc.data().glasses || 0);
      } else {
        setTodayWater(0);
      }
    } catch (error) {
      console.error('Error fetching today water:', error);
    }
  };

  
  const fetchWeeklyHistory = async () => {
    try {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);

      const startDate = sevenDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      
      const dateMap = new Map();
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        dateMap.set(dateString, {
          date: dateString,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          glasses: 0
        });
      }

      
      const q = query(
        collection(db, 'water_intake'),
        where('userId', '==', auth.currentUser.uid),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
      const querySnapshot = await getDocs(q);

      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (dateMap.has(data.date)) {
          dateMap.get(data.date).glasses = data.glasses;
        }
      });
      
    
      const history = Array.from(dateMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
      setWeeklyHistory(history);

    } catch (error) {
      console.error('Error fetching weekly history:', error);
    }
  };

  const addWaterGlass = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const waterDocRef = doc(db, 'water_intake', `${auth.currentUser.uid}_${today}`);

      const waterDocRef = doc(db, 'water_intake', `${auth.currentUser.uid}_${today}`);

      
      const newGlassCount = todayWater + 1;
      
      await setDoc(waterDocRef, {
        userId: auth.currentUser.uid,
        date: today,
        glasses: newGlassCount,
        updatedAt: new Date()
      }, { merge: true }); 
      
      setTodayWater(newGlassCount);
      
      // Update today's entry in weekly history
      setWeeklyHistory(prev => 
        prev.map(day => 
          day.date === today 
            ? { ...day, glasses: newGlassCount }
            : day
        )
      );
      
      // Show encouraging message
      if (newGlassCount >= dailyGoal) {
        Alert.alert('Congratulations! 🎉', `You've reached your daily water goal of ${dailyGoal} glasses!`);
      } else {
        const remaining = dailyGoal - newGlassCount;
        Alert.alert('Great job! 💧', `Glass added! ${remaining} more to reach your daily goal.`);

        Alert.alert('Congratulations! 🎉', `You've reached your daily water goal of ${dailyGoal} glasses!`);
      } else {
        const remaining = dailyGoal - newGlassCount;
        Alert.alert('Great job! 💧', `Glass added! ${remaining} more to reach your daily goal.`);

      }
    } catch (error) {
      console.error('Error adding water glass:', error);
      Alert.alert('Error', 'Failed to add water glass. Please try again.');
    }
  };

  const removeWaterGlass = async () => {
    if (todayWater <= 0) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];

      const waterDocRef = doc(db, 'water_intake', `${auth.currentUser.uid}_${today}`);

      
      const newGlassCount = todayWater - 1;
      
      await setDoc(waterDocRef, {
        userId: auth.currentUser.uid,
        date: today,
        glasses: newGlassCount,
        updatedAt: new Date()
      }, { merge: true }); 
      
      setTodayWater(newGlassCount);
      
      // Update today's entry in weekly history
      setWeeklyHistory(prev => 
        prev.map(day => 
          day.date === today 
            ? { ...day, glasses: newGlassCount }
            : day
        )
      );
      
    } catch (error) {
      console.error('Error removing water glass:', error);
      Alert.alert('Error', 'Failed to remove water glass. Please try again.');
    }
  };


  const getProgressPercentage = () => {
    return Math.min(Math.round((todayWater / dailyGoal) * 100), 100);
  };

  const WaterGlassDisplay = () => {
    const glasses = [];
    for (let i = 0; i < dailyGoal; i++) {
      glasses.push(
        <View key={i} style={styles.glassContainer}>
          <Text style={[styles.glassIcon, i < todayWater && styles.filledGlass]}>
            💧
          </Text>
        </View>
      );
    }
    return <View style={styles.glassesGrid}>{glasses}</View>;
  };

  const WeeklyChart = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>This Week's Progress</Text>
      <View style={styles.barsContainer}>
        {weeklyHistory.map((day, index) => (
          <View key={index} style={styles.barContainer}>
            <View style={styles.barBackground}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: `${Math.min((day.glasses / dailyGoal) * 100, 100)}%`,

                    height: `${Math.min((day.glasses / dailyGoal) * 100, 100)}`%,

                    backgroundColor: day.glasses >= dailyGoal ? '#4CAF50' : '#2196F3'
                  }
                ]} 
              />
            </View>
            <Text style={styles.barLabel}>{day.dayName}</Text>
            <Text style={styles.barValue}>{day.glasses}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const StatCard = ({ title, value, subtitle, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
    
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading water data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const weeklyTotal = weeklyHistory.reduce((sum, day) => sum + day.glasses, 0);
  const weeklyAverage = weeklyHistory.length > 0 ? Math.round(weeklyTotal / weeklyHistory.length * 10) / 10 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Water Tracker</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Today's Progress */}
        <View style={styles.todayContainer}>
          <Text style={styles.todayTitle}>Today's Hydration</Text>
          
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {todayWater} / {dailyGoal} glasses
            </Text>
            <Text style={styles.progressPercentage}>
              {getProgressPercentage()}% of daily goal
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View 
              style={[styles.progressBar, { width: `${getProgressPercentage()}%` }]} 

              style={[styles.progressBar, { width: `${getProgressPercentage()}`% }]} 

            />
          </View>

          <WaterGlassDisplay />

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={addWaterGlass}
            >
              <Text style={styles.addButtonText}>+ Add Glass</Text>
            </TouchableOpacity>
            
            {todayWater > 0 && (
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={removeWaterGlass}
              >
                <Text style={styles.removeButtonText}>- Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Today"
            value={todayWater}
            subtitle="glasses"
            color="#2196F3"
          />
          <StatCard
            title="Weekly Total"
            value={weeklyTotal}
            subtitle="glasses"
            color="#4CAF50"
          />
          <StatCard
            title="Daily Average"
            value={weeklyAverage}
            subtitle="this week"
            color="#FF9800"
          />
          <StatCard
            title="Goal Progress"
            value={`${getProgressPercentage()}%`}
            subtitle="today"
            color="#9C27B0"
          />
        </View>

        {/* Weekly Chart */}
        <WeeklyChart />

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Hydration Tips</Text>
          <Text style={styles.tipText}>• Drink a glass when you wake up</Text>
          <Text style={styles.tipText}>• Keep a water bottle at your desk</Text>
          <Text style={styles.tipText}>• Set hourly reminders</Text>
          <Text style={styles.tipText}>• Drink before, during, and after workouts</Text>
          <Text style={styles.tipText}>• Add lemon or cucumber for flavor</Text>
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
  content: {
    flex: 1,
  },
  todayContainer: {
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
  todayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  progressPercentage: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 5,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 5,
  },
  glassesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  glassContainer: {
    margin: 5,
  },
  glassIcon: {
    fontSize: 24,
    opacity: 0.3,
  },
  filledGlass: {
    opacity: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    width: '48%',
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
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
    fontSize: 12,
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

export default WaterTrackerScreen;