
import React, { useState, useEffect } from 'react';
import React, { useState, useEffect } from "react";

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const { width: screenWidth } = Dimensions.get('window');

const { width: screenWidth } = Dimensions.get("window");

import { useTheme } from "./ThemeContext";
import { lightTheme, darkTheme } from "./themes";


const ProgressScreen = () => {
  const { theme } = useTheme();
  const colors = theme === "light" ? lightTheme : darkTheme;

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalDuration: 0,
    averageDuration: 0,
    mostFrequentType: '',
    thisWeekWorkouts: 0,
    lastWeekWorkouts: 0,
    workoutsByType: {},
    weeklyProgress: [],
    dailyAverage: []
  });

  useEffect(() => {
    fetchProgressData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProgressData();
    setRefreshing(false);
  };

  const fetchProgressData = async () => {
    try {
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('userId', '==', auth.currentUser.uid)
      );
      
      const querySnapshot = await getDocs(workoutsQuery);
      const workoutList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      
      workoutList.sort((a, b) => {
        try {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || Date.now());
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || Date.now());
          return dateB - dateA;
        } catch (error) {
          console.warn('Error sorting workout dates:', error);
          return 0;
        }
      });
      
      setWorkouts(workoutList);
      calculateStats(workoutList);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (workoutList) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    // Basic stats
    const totalWorkouts = workoutList.length;
    const totalDuration = workoutList.reduce((sum, w) => sum + (w.duration || 0), 0);
    const averageDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;
    
    // This week vs last week
    const thisWeekWorkouts = workoutList.filter(w => {
      try {
        const date = w.createdAt?.toDate?.() || new Date(w.createdAt || Date.now());
      try {
        const date =
          w.createdAt?.toDate?.() || new Date(w.createdAt || Date.now());
        return date >= oneWeekAgo;
      } catch (error) {
        return false;
      }

      const date =
        w.createdAt?.toDate?.() || new Date(w.createdAt || Date.now());
      return date >= oneWeekAgo;

    }).length;
    
    const lastWeekWorkouts = workoutList.filter(w => {
      try {
        const date = w.createdAt?.toDate?.() || new Date(w.createdAt || Date.now());
      try {
        const date =
          w.createdAt?.toDate?.() || new Date(w.createdAt || Date.now());
        return date >= twoWeeksAgo && date < oneWeekAgo;
      } catch (error) {
        return false;
      }

      const date =
        w.createdAt?.toDate?.() || new Date(w.createdAt || Date.now());
      return date >= twoWeeksAgo && date < oneWeekAgo;

    }).length;
    
    // Workouts by type
    const workoutsByType = workoutList.reduce((acc, workout) => {
      const type = workout.type || 'general';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    const mostFrequentType = Object.keys(workoutsByType).length > 0
      ? Object.keys(workoutsByType).reduce((a, b) => 
          workoutsByType[a] > workoutsByType[b] ? a : b, 'general'
        )
      : 'none';
    
    // Weekly progress (last 8 weeks)

    const weeklyProgress = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const weekWorkouts = workoutList.filter(w => {
        try {
          const date = w.createdAt?.toDate?.() || new Date(w.createdAt || Date.now());
          return date >= weekStart && date < weekEnd;
        } catch (error) {
          return false;
        }
      });
      
      weeklyProgress.push({
        week: `W${8-i}`,
        workouts: weekWorkouts.length,
        duration: weekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0)
      });
    }
    
    // Daily average for current week
    const dailyAverage = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    days.forEach((day, index) => {
      const dayWorkouts = workoutList.filter(w => {
        try {
          const date = w.createdAt?.toDate?.() || new Date(w.createdAt || Date.now());
      weeklyProgress.push({
        week: `W${8 - i}`,
        workouts: weekWorkouts.length,
        duration: weekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
      });
    }

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dailyAverage = days.map((day, index) => {
      const dayWorkouts = workoutList.filter((w) => {

        try {
          const date =
            w.createdAt?.toDate?.() || new Date(w.createdAt || Date.now());

          const dayOfWeek = date.getDay();
          const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          return adjustedDay === index && date >= oneWeekAgo;
        } catch (error) {
          return false;
        }
      });
      
      dailyAverage.push({
        day,
        count: dayWorkouts.length
      });
    });
    
      });
      return { day, count: dayWorkouts.length };
    });


    setStats({
      totalWorkouts,
      totalDuration,
      averageDuration,
      mostFrequentType,
      thisWeekWorkouts,
      lastWeekWorkouts,
      workoutsByType,
      weeklyProgress,
      dailyAverage
    });
  };

  const StatCard = ({ title, value, subtitle, color = '#007AFF', trend }) => (
  const StatCard = ({ title, value, subtitle, color = "#007AFF", trend }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}

  const StatCard = ({ title, value, subtitle, color = colors.accent, trend }) => (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.card, borderLeftColor: color, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.statTitle, { color: colors.subtext }]}>{title}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { color: colors.subtext }]}>
          {subtitle}
        </Text>
      )}

      {trend !== undefined && (
        <Text style={[styles.trend, { color: trend > 0 ? '#4CAF50' : trend < 0 ? '#F44336' : '#666' }]}>
          {trend > 0 ? '↗️' : trend < 0 ? '↘️' : '→'} {Math.abs(trend)}
        </Text>
      )}
    </View>
  );

  const SimpleChart = ({ data, title }) => {
    const maxValue = Math.max(...data.map(item => item.count || item.workouts || 1));
    

    const maxValue = Math.max(...data.map((item) => item.count || item.workouts || 1));

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>{title}</Text>
        <View style={styles.barsContainer}>
          {data.map((item, index) => {
            const value = item.count || item.workouts || 0;
            const height = maxValue > 0 ? (value / maxValue) * 80 : 0;
            
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barBackground}>
                  <View 
            return (
              <View key={index} style={styles.barContainer}>
                <View style={[styles.barBackground, { backgroundColor: colors.border }]}>
                  <View

                    style={[
                      styles.bar,
                      {
                        height: `${height}%`,
                        backgroundColor: value > 0 ? colors.accent : colors.border,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: colors.subtext }]}>
                  {item.day || item.week}
                </Text>
                <Text style={[styles.barValue, { color: colors.text }]}>{value}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>Loading progress data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const weeklyTrend = stats.thisWeekWorkouts - stats.lastWeekWorkouts;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Progress</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
      >
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Workouts"
            value={stats.totalWorkouts}
            subtitle="all time"
            color="#FF6B6B"
          />
          <StatCard
            title="This Week"
            value={stats.thisWeekWorkouts}
            subtitle="workouts"
            color="#4ECDC4"
            trend={weeklyTrend}
          />
          <StatCard
            title="Total Hours"
            value={Math.round(stats.totalDuration / 60 * 10) / 10}
            subtitle="exercised"
            color="#45B7D1"
          />
          <StatCard
            title="Avg Duration"
            value={stats.averageDuration}
            subtitle="minutes"
            color="#96CEB4"
          />
        </View>

        {/* Favorite Workout Type */}
        {stats.mostFrequentType && stats.mostFrequentType !== 'none' && (
          <View style={styles.favoriteContainer}>
            <Text style={styles.favoriteTitle}>Your Favorite Workout</Text>
            <Text style={styles.favoriteType}>
              {stats.mostFrequentType.charAt(0).toUpperCase() + stats.mostFrequentType.slice(1)}

          <StatCard title="Total Workouts" value={stats.totalWorkouts} subtitle="all time" color="#FF6B6B" />
          <StatCard title="This Week" value={stats.thisWeekWorkouts} subtitle="workouts" color="#4ECDC4" trend={weeklyTrend} />
          <StatCard title="Total Hours" value={Math.round((stats.totalDuration / 60) * 10) / 10} subtitle="exercised" color="#45B7D1" />
          <StatCard title="Avg Duration" value={stats.averageDuration} subtitle="minutes" color="#96CEB4" />
        </View>

        {stats.mostFrequentType && stats.mostFrequentType !== "none" && (
          <View style={[styles.favoriteContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.favoriteTitle, { color: colors.subtext }]}>Your Favorite Workout</Text>
            <Text style={[styles.favoriteType, { color: colors.accent }]}>
              {stats.mostFrequentType.charAt(0).toUpperCase() + stats.mostFrequentType.slice(1)}

            </Text>
            <Text style={[styles.favoriteCount, { color: colors.subtext }]}>
              {stats.workoutsByType[stats.mostFrequentType]} sessions
            </Text>
          </View>
        )}

        {stats.totalWorkouts > 0 ? (
          <>
            <SimpleChart 
              data={stats.weeklyProgress} 
              title="Weekly Workout Frequency"
            />
            <SimpleChart 
              data={stats.dailyAverage} 
              title="This Week's Daily Activity"
            />

            <SimpleChart data={stats.weeklyProgress} title="Weekly Workout Frequency" />
            <SimpleChart data={stats.dailyAverage} title="This Week's Daily Activity" />

          </>
        ) : (
          <View style={[styles.noDataContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.noDataIcon}>📊</Text>
            <Text style={styles.noDataTitle}>No Progress Data Yet</Text>
            <Text style={styles.noDataText}>
              Complete a few workouts to see your progress charts and statistics!

            <Text style={[styles.noDataTitle, { color: colors.text }]}>No Progress Data Yet</Text>
            <Text style={[styles.noDataText, { color: colors.subtext }]}>
              Complete a few workouts to see your progress charts and statistics!

            </Text>
          </View>
        )}

        <View style={[styles.achievementsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.achievementsTitle, { color: colors.text }]}>🏆 Achievements</Text>
          {stats.totalWorkouts >= 1 && <Text style={[styles.achievement, { color: "#4CAF50" }]}>✅ First Workout Completed</Text>}
          {stats.totalWorkouts >= 5 && <Text style={[styles.achievement, { color: "#4CAF50" }]}>✅ 5 Workouts Milestone</Text>}
          {stats.totalWorkouts >= 10 && <Text style={[styles.achievement, { color: "#4CAF50" }]}>✅ 10 Workouts Milestone</Text>}
          {stats.thisWeekWorkouts >= 3 && <Text style={[styles.achievement, { color: "#4CAF50" }]}>✅ 3 Workouts This Week</Text>}
          {stats.totalDuration >= 60 && <Text style={[styles.achievement, { color: "#4CAF50" }]}>✅ 1 Hour Total Exercise</Text>}
          {stats.totalDuration >= 300 && <Text style={[styles.achievement, { color: "#4CAF50" }]}>✅ 5 Hours Total Exercise</Text>}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
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
  },
  title: { fontSize: 24, fontWeight: "bold" },
  content: { flex: 1 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 20, justifyContent: "space-between" },
  statCard: {
    padding: 15,
    borderRadius: 8,
    width: "48%",
    marginBottom: 15,
    borderWidth: 1,
    borderLeftWidth: 4,
    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  trend: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
  },
  favoriteContainer: {
    backgroundColor: 'white',
  },
  statTitle: { fontSize: 14, marginBottom: 5 },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statSubtitle: { fontSize: 12, marginTop: 2 },
  trend: { fontSize: 12, fontWeight: "600", marginTop: 5 },
  favoriteContainer: {

    backgroundColor: "white",

    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  favoriteType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  favoriteCount: {
    fontSize: 14,
    color: '#666',
  },
  chartContainer: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
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
  noDataContainer: {
    alignItems: 'center',
    padding: 40,
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  noDataIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  achievementsContainer: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  achievement: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 8,
    fontWeight: '500',
  },
});

export default ProgressScreen;
  },
  favoriteTitle: { fontSize: 16, marginBottom: 10 },
  favoriteType: { fontSize: 24, fontWeight: "bold", marginBottom: 5 },
  favoriteCount: { fontSize: 14 },
  chartContainer: { margin: 20, marginTop: 0, borderRadius: 8, padding: 15, borderWidth: 1 },
  chartTitle: { fontSize: 16, fontWeight: "600", marginBottom: 15, textAlign: "center" },
  barsContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 100 },
  barContainer: { alignItems: "center", flex: 1 },
  barBackground: { width: 20, height: 80, borderRadius: 4, justifyContent: "flex-end", marginBottom: 8 },
  bar: { width: "100%", borderRadius: 4, minHeight: 2 },
  barLabel: { fontSize: 12, marginBottom: 2 },
  barValue: { fontSize: 10, fontWeight: "bold" },
  noDataContainer: { alignItems: "center", padding: 40, margin: 20, borderRadius: 8, borderWidth: 1 },
  noDataIcon: { fontSize: 48, marginBottom: 15 },
  noDataTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  noDataText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  achievementsContainer: { margin: 20, marginTop: 0, padding: 20, borderRadius: 8, borderWidth: 1 },
  achievementsTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  achievement: { fontSize: 14, marginBottom: 8, fontWeight: "500" },
});

export default ProgressScreen;

