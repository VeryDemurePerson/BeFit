<<<<<<< HEAD

import React, { useState, useEffect } from 'react';
=======
import React, { useState, useEffect } from "react";
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
<<<<<<< HEAD
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const { width: screenWidth } = Dimensions.get('window');
=======
} from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../services/firebase";

const { width: screenWidth } = Dimensions.get("window");
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c

const ProgressScreen = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalDuration: 0,
    averageDuration: 0,
<<<<<<< HEAD
    mostFrequentType: '',
=======
    mostFrequentType: "",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    thisWeekWorkouts: 0,
    lastWeekWorkouts: 0,
    workoutsByType: {},
    weeklyProgress: [],
<<<<<<< HEAD
    dailyAverage: []
=======
    dailyAverage: [],
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
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
<<<<<<< HEAD
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
=======
        collection(db, "workouts"),
        where("userId", "==", auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(workoutsQuery);
      const workoutList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      workoutList.sort((a, b) => {
        try {
          const dateA =
            a.createdAt?.toDate?.() || new Date(a.createdAt || Date.now());
          const dateB =
            b.createdAt?.toDate?.() || new Date(b.createdAt || Date.now());
          return dateB - dateA;
        } catch (error) {
          console.warn("Error sorting workout dates:", error);
          return 0;
        }
      });

      setWorkouts(workoutList);
      calculateStats(workoutList);
    } catch (error) {
      console.error("Error fetching progress data:", error);
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (workoutList) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
<<<<<<< HEAD
    
    // Basic stats
    const totalWorkouts = workoutList.length;
    const totalDuration = workoutList.reduce((sum, w) => sum + (w.duration || 0), 0);
    const averageDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;
    
    // This week vs last week
    const thisWeekWorkouts = workoutList.filter(w => {
      try {
        const date = w.createdAt?.toDate?.() || new Date(w.createdAt || Date.now());
=======

    // Basic stats
    const totalWorkouts = workoutList.length;
    const totalDuration = workoutList.reduce(
      (sum, w) => sum + (w.duration || 0),
      0
    );
    const averageDuration =
      totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;

    // This week vs last week
    const thisWeekWorkouts = workoutList.filter((w) => {
      try {
        const date =
          w.createdAt?.toDate?.() || new Date(w.createdAt || Date.now());
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
        return date >= oneWeekAgo;
      } catch (error) {
        return false;
      }
    }).length;
<<<<<<< HEAD
    
    const lastWeekWorkouts = workoutList.filter(w => {
      try {
        const date = w.createdAt?.toDate?.() || new Date(w.createdAt || Date.now());
=======

    const lastWeekWorkouts = workoutList.filter((w) => {
      try {
        const date =
          w.createdAt?.toDate?.() || new Date(w.createdAt || Date.now());
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
        return date >= twoWeeksAgo && date < oneWeekAgo;
      } catch (error) {
        return false;
      }
    }).length;
<<<<<<< HEAD
    
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
    
=======

    // Workouts by type
    const workoutsByType = workoutList.reduce((acc, workout) => {
      const type = workout.type || "general";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const mostFrequentType =
      Object.keys(workoutsByType).length > 0
        ? Object.keys(workoutsByType).reduce(
            (a, b) => (workoutsByType[a] > workoutsByType[b] ? a : b),
            "general"
          )
        : "none";

>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    // Weekly progress (last 8 weeks)
    const weeklyProgress = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
<<<<<<< HEAD
      
      const weekWorkouts = workoutList.filter(w => {
        try {
          const date = w.createdAt?.toDate?.() || new Date(w.createdAt || Date.now());
=======

      const weekWorkouts = workoutList.filter((w) => {
        try {
          const date =
            w.createdAt?.toDate?.() || new Date(w.createdAt || Date.now());
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
          return date >= weekStart && date < weekEnd;
        } catch (error) {
          return false;
        }
      });
<<<<<<< HEAD
      
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
=======

      weeklyProgress.push({
        week: `W${8-i}`,
        workouts: weekWorkouts.length,
        duration: weekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
      });
    }

    // Daily average for current week
    const dailyAverage = [];
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    days.forEach((day, index) => {
      const dayWorkouts = workoutList.filter((w) => {
        try {
          const date =
            w.createdAt?.toDate?.() || new Date(w.createdAt || Date.now());
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
          const dayOfWeek = date.getDay();
          const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          return adjustedDay === index && date >= oneWeekAgo;
        } catch (error) {
          return false;
        }
      });
<<<<<<< HEAD
      
      dailyAverage.push({
        day,
        count: dayWorkouts.length
      });
    });
    
=======

      dailyAverage.push({
        day,
        count: dayWorkouts.length,
      });
    });

>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    setStats({
      totalWorkouts,
      totalDuration,
      averageDuration,
      mostFrequentType,
      thisWeekWorkouts,
      lastWeekWorkouts,
      workoutsByType,
      weeklyProgress,
<<<<<<< HEAD
      dailyAverage
    });
  };

  const StatCard = ({ title, value, subtitle, color = '#007AFF', trend }) => (
=======
      dailyAverage,
    });
  };

  const StatCard = ({ title, value, subtitle, color = "#007AFF", trend }) => (
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      {trend !== undefined && (
<<<<<<< HEAD
        <Text style={[styles.trend, { color: trend > 0 ? '#4CAF50' : trend < 0 ? '#F44336' : '#666' }]}>
          {trend > 0 ? '↗️' : trend < 0 ? '↘️' : '→'} {Math.abs(trend)}
=======
        <Text
          style={[
            styles.trend,
            { color: trend > 0 ? "#4CAF50" : trend < 0 ? "#F44336" : "#666" },
          ]}
        >
          {trend > 0 ? "↗️" : trend < 0 ? "↘️" : "→"} {Math.abs(trend)}
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
        </Text>
      )}
    </View>
  );

  const SimpleChart = ({ data, title }) => {
<<<<<<< HEAD
    const maxValue = Math.max(...data.map(item => item.count || item.workouts || 1));
    
=======
    const maxValue = Math.max(
      ...data.map((item) => item.count || item.workouts || 1)
    );

>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.barsContainer}>
          {data.map((item, index) => {
            const value = item.count || item.workouts || 0;
            const height = maxValue > 0 ? (value / maxValue) * 80 : 0;
<<<<<<< HEAD
            
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barBackground}>
                  <View 
=======

            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barBackground}>
                  <View
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
                    style={[
                      styles.bar, 
                      { 
                        height: `${height}%`,
                        backgroundColor: value > 0 ? '#007AFF' : '#E0E0E0'
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.barLabel}>{item.day || item.week}</Text>
                <Text style={styles.barValue}>{value}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading progress data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const weeklyTrend = stats.thisWeekWorkouts - stats.lastWeekWorkouts;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
      </View>

<<<<<<< HEAD
      <ScrollView 
=======
      <ScrollView
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overview Stats */}
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
<<<<<<< HEAD
            value={Math.round(stats.totalDuration / 60 * 10) / 10}
=======
            value={Math.round((stats.totalDuration / 60) * 10) / 10}
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
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
<<<<<<< HEAD
        {stats.mostFrequentType && stats.mostFrequentType !== 'none' && (
          <View style={styles.favoriteContainer}>
            <Text style={styles.favoriteTitle}>Your Favorite Workout</Text>
            <Text style={styles.favoriteType}>
              {stats.mostFrequentType.charAt(0).toUpperCase() + stats.mostFrequentType.slice(1)}
=======
        {stats.mostFrequentType && stats.mostFrequentType !== "none" && (
          <View style={styles.favoriteContainer}>
            <Text style={styles.favoriteTitle}>Your Favorite Workout</Text>
            <Text style={styles.favoriteType}>
              {stats.mostFrequentType.charAt(0).toUpperCase() +
                stats.mostFrequentType.slice(1)}
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
            </Text>
            <Text style={styles.favoriteCount}>
              {stats.workoutsByType[stats.mostFrequentType]} sessions
            </Text>
          </View>
        )}

        {/* Charts */}
        {stats.totalWorkouts > 0 ? (
          <>
<<<<<<< HEAD
            <SimpleChart 
              data={stats.weeklyProgress} 
              title="Weekly Workout Frequency"
            />
            <SimpleChart 
              data={stats.dailyAverage} 
=======
            <SimpleChart
              data={stats.weeklyProgress}
              title="Weekly Workout Frequency"
            />
            <SimpleChart
              data={stats.dailyAverage}
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
              title="This Week's Daily Activity"
            />
          </>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataIcon}>📊</Text>
            <Text style={styles.noDataTitle}>No Progress Data Yet</Text>
            <Text style={styles.noDataText}>
<<<<<<< HEAD
              Complete a few workouts to see your progress charts and statistics!
=======
              Complete a few workouts to see your progress charts and
              statistics!
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
            </Text>
          </View>
        )}

        {/* Achievements Section */}
        <View style={styles.achievementsContainer}>
          <Text style={styles.achievementsTitle}>🏆 Achievements</Text>
          {stats.totalWorkouts >= 1 && (
            <Text style={styles.achievement}>✅ First Workout Completed</Text>
          )}
          {stats.totalWorkouts >= 5 && (
            <Text style={styles.achievement}>✅ 5 Workouts Milestone</Text>
          )}
          {stats.totalWorkouts >= 10 && (
            <Text style={styles.achievement}>✅ 10 Workouts Milestone</Text>
          )}
          {stats.thisWeekWorkouts >= 3 && (
            <Text style={styles.achievement}>✅ 3 Workouts This Week</Text>
          )}
          {stats.totalDuration >= 60 && (
            <Text style={styles.achievement}>✅ 1 Hour Total Exercise</Text>
          )}
          {stats.totalDuration >= 300 && (
            <Text style={styles.achievement}>✅ 5 Hours Total Exercise</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
<<<<<<< HEAD
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
=======
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
<<<<<<< HEAD
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
=======
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
  },
  content: {
    flex: 1,
  },
  statsGrid: {
<<<<<<< HEAD
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
=======
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    width: "48%",
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: "#000",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
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
<<<<<<< HEAD
    color: '#666',
=======
    color: "#666",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
<<<<<<< HEAD
    fontWeight: 'bold',
    color: '#333',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
=======
    fontWeight: "bold",
    color: "#333",
  },
  statSubtitle: {
    fontSize: 12,
    color: "#999",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    marginTop: 2,
  },
  trend: {
    fontSize: 12,
<<<<<<< HEAD
    fontWeight: '600',
    marginTop: 5,
  },
  favoriteContainer: {
    backgroundColor: 'white',
=======
    fontWeight: "600",
    marginTop: 5,
  },
  favoriteContainer: {
    backgroundColor: "white",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 8,
<<<<<<< HEAD
    alignItems: 'center',
    shadowColor: '#000',
=======
    alignItems: "center",
    shadowColor: "#000",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
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
<<<<<<< HEAD
    color: '#666',
=======
    color: "#666",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    marginBottom: 10,
  },
  favoriteType: {
    fontSize: 24,
<<<<<<< HEAD
    fontWeight: 'bold',
    color: '#007AFF',
=======
    fontWeight: "bold",
    color: "#007AFF",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    marginBottom: 5,
  },
  favoriteCount: {
    fontSize: 14,
<<<<<<< HEAD
    color: '#666',
  },
  chartContainer: {
    backgroundColor: 'white',
=======
    color: "#666",
  },
  chartContainer: {
    backgroundColor: "white",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    margin: 20,
    marginTop: 0,
    borderRadius: 8,
    padding: 15,
<<<<<<< HEAD
    shadowColor: '#000',
=======
    shadowColor: "#000",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
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
<<<<<<< HEAD
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
=======
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  barsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
  },
  barContainer: {
    alignItems: "center",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    flex: 1,
  },
  barBackground: {
    width: 20,
    height: 80,
<<<<<<< HEAD
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
=======
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  bar: {
    width: "100%",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    borderRadius: 4,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 12,
<<<<<<< HEAD
    color: '#666',
=======
    color: "#666",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    marginBottom: 2,
  },
  barValue: {
    fontSize: 10,
<<<<<<< HEAD
    fontWeight: 'bold',
    color: '#333',
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 40,
    margin: 20,
    backgroundColor: 'white',
=======
    fontWeight: "bold",
    color: "#333",
  },
  noDataContainer: {
    alignItems: "center",
    padding: 40,
    margin: 20,
    backgroundColor: "white",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    borderRadius: 8,
  },
  noDataIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  noDataTitle: {
    fontSize: 18,
<<<<<<< HEAD
    fontWeight: 'bold',
    color: '#333',
=======
    fontWeight: "bold",
    color: "#333",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    marginBottom: 10,
  },
  noDataText: {
    fontSize: 14,
<<<<<<< HEAD
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  achievementsContainer: {
    backgroundColor: 'white',
=======
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  achievementsContainer: {
    backgroundColor: "white",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 8,
<<<<<<< HEAD
    shadowColor: '#000',
=======
    shadowColor: "#000",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
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
<<<<<<< HEAD
    fontWeight: 'bold',
    color: '#333',
=======
    fontWeight: "bold",
    color: "#333",
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
    marginBottom: 15,
  },
  achievement: {
    fontSize: 14,
<<<<<<< HEAD
    color: '#4CAF50',
    marginBottom: 8,
    fontWeight: '500',
  },
});

export default ProgressScreen;
=======
    color: "#4CAF50",
    marginBottom: 8,
    fontWeight: "500",
  },
});

export default ProgressScreen;
>>>>>>> 1f5dd7e3c2b0583593212ad311a379d4a0f7892c
