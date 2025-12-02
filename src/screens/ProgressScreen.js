// src/screens/ProgressScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../services/firebase";
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
    mostFrequentType: "",
    thisWeekWorkouts: 0,
    lastWeekWorkouts: 0,
    workoutsByType: {},
    weeklyProgress: [],
    dailyAverage: [],
  });

  useEffect(() => {
    fetchProgressData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProgressData();
    setRefreshing(false);
  };

  const parseDate = (createdAt) => {
    try {
      if (createdAt?.toDate) return createdAt.toDate();
      return new Date(createdAt || Date.now());
    } catch (e) {
      return new Date();
    }
  };

  const fetchProgressData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setWorkouts([]);
        setStats((prev) => ({ ...prev, totalWorkouts: 0 }));
        return;
      }

      const q = query(
        collection(db, "workouts"),
        where("userId", "==", user.uid)
      );
      const snap = await getDocs(q);

      const workoutList = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Sort newest first
      workoutList.sort(
        (a, b) => parseDate(b.createdAt) - parseDate(a.createdAt)
      );

      setWorkouts(workoutList);
      calculateStats(workoutList);
    } catch (error) {
      console.error("Error fetching progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (workoutList) => {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);

    const totalWorkouts = workoutList.length;
    const totalDuration = workoutList.reduce(
      (sum, w) => sum + (w.duration || 0),
      0
    );
    const averageDuration =
      totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;

    // This week & last week
    const thisWeekWorkouts = workoutList.filter((w) => {
      const d = parseDate(w.createdAt);
      return d >= oneWeekAgo;
    }).length;

    const lastWeekWorkouts = workoutList.filter((w) => {
      const d = parseDate(w.createdAt);
      return d >= twoWeeksAgo && d < oneWeekAgo;
    }).length;

    // Workouts by type
    const workoutsByType = workoutList.reduce((acc, workout) => {
      const type = workout.type || "general";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const mostFrequentType =
      Object.keys(workoutsByType).length > 0
        ? Object.keys(workoutsByType).reduce((a, b) =>
            workoutsByType[a] > workoutsByType[b] ? a : b
          )
        : "none";

    // Weekly progress (last 8 weeks)
    const weeklyProgress = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekWorkouts = workoutList.filter((w) => {
        const d = parseDate(w.createdAt);
        return d >= weekStart && d < weekEnd;
      });

      weeklyProgress.push({
        week: `W${8 - i}`,
        workouts: weekWorkouts.length,
        duration: weekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
      });
    }

    // Daily average this week (Mon–Sun)
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dailyAverage = dayLabels.map((dayLabel, index) => {
      const dayWorkouts = workoutList.filter((w) => {
        const d = parseDate(w.createdAt);
        // Convert JS day (0=Sun) to index (0=Mon)
        const dow = d.getDay(); // 0..6
        const adjusted = dow === 0 ? 6 : dow - 1;
        return adjusted === index && d >= oneWeekAgo;
      });
      return {
        day: dayLabel,
        count: dayWorkouts.length,
      };
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
      dailyAverage,
    });
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    color = colors.accent,
    trend,
  }) => (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.card,
          borderLeftColor: color,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.statTitle, { color: colors.subtext }]}>{title}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { color: colors.subtext }]}>
          {subtitle}
        </Text>
      )}
      {typeof trend === "number" && (
        <Text
          style={[
            styles.trend,
            {
              color:
                trend > 0 ? "#4CAF50" : trend < 0 ? "#F44336" : colors.subtext,
            },
          ]}
        >
          {trend > 0 ? "↗️" : trend < 0 ? "↘️" : "→"} {Math.abs(trend)}
        </Text>
      )}
    </View>
  );

  const SimpleChart = ({ data, title }) => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(
      ...data.map((item) => item.count || item.workouts || 0),
      1
    );

    return (
      <View
        style={[
          styles.chartContainer,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.chartTitle, { color: colors.text }]}>{title}</Text>
        <View style={styles.barsContainer}>
          {data.map((item, index) => {
            const value = item.count || item.workouts || 0;
            const barHeight = maxValue > 0 ? (value / maxValue) * 80 : 0;

            return (
              <View key={index} style={styles.barContainer}>
                <View
                  style={[
                    styles.barBackground,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor:
                          value > 0 ? colors.accent : colors.border,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: colors.subtext }]}>
                  {item.day || item.week}
                </Text>
                <Text style={[styles.barValue, { color: colors.text }]}>
                  {value}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ color: colors.text, marginTop: 8 }}>
            Loading progress data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const weeklyTrend = stats.thisWeekWorkouts - stats.lastWeekWorkouts;
  const totalHours = Math.round((stats.totalDuration / 60) * 10) / 10;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Progress</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
          />
        }
      >
        {/* Stat cards */}
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
            value={totalHours}
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

        {/* Favorite workout type */}
        {stats.mostFrequentType && stats.mostFrequentType !== "none" && (
          <View
            style={[
              styles.favoriteContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.favoriteTitle, { color: colors.subtext }]}>
              Your Favorite Workout
            </Text>
            <Text style={[styles.favoriteType, { color: colors.accent }]}>
              {stats.mostFrequentType.charAt(0).toUpperCase() +
                stats.mostFrequentType.slice(1)}
            </Text>
            <Text style={[styles.favoriteCount, { color: colors.subtext }]}>
              {stats.workoutsByType[stats.mostFrequentType]} sessions
            </Text>
          </View>
        )}

        {/* Charts or empty state */}
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
          </>
        ) : (
          <View
            style={[
              styles.noDataContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={styles.noDataIcon}>📊</Text>
            <Text style={[styles.noDataTitle, { color: colors.text }]}>
              No Progress Data Yet
            </Text>
            <Text style={[styles.noDataText, { color: colors.subtext }]}>
              Complete a few workouts to see your progress charts and
              statistics!
            </Text>
          </View>
        )}

        {/* Achievements */}
        <View
          style={[
            styles.achievementsContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.achievementsTitle, { color: colors.text }]}>
            🏆 Achievements
          </Text>
          {stats.totalWorkouts >= 1 && (
            <Text style={[styles.achievement, { color: "#4CAF50" }]}>
              ✅ First Workout Completed
            </Text>
          )}
          {stats.totalWorkouts >= 5 && (
            <Text style={[styles.achievement, { color: "#4CAF50" }]}>
              ✅ 5 Workouts Milestone
            </Text>
          )}
          {stats.totalWorkouts >= 10 && (
            <Text style={[styles.achievement, { color: "#4CAF50" }]}>
              ✅ 10 Workouts Milestone
            </Text>
          )}
          {stats.thisWeekWorkouts >= 3 && (
            <Text style={[styles.achievement, { color: "#4CAF50" }]}>
              ✅ 3 Workouts This Week
            </Text>
          )}
          {stats.totalDuration >= 60 && (
            <Text style={[styles.achievement, { color: "#4CAF50" }]}>
              ✅ 1 Hour Total Exercise
            </Text>
          )}
          {stats.totalDuration >= 300 && (
            <Text style={[styles.achievement, { color: "#4CAF50" }]}>
              ✅ 5 Hours Total Exercise
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    justifyContent: "space-between",
  },
  statCard: {
    padding: 15,
    borderRadius: 10,
    width: "48%",
    marginBottom: 15,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  statTitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  statSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  trend: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
  favoriteContainer: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  favoriteTitle: {
    fontSize: 15,
    marginBottom: 8,
  },
  favoriteType: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  favoriteCount: {
    fontSize: 13,
  },
  chartContainer: {
    margin: 20,
    marginTop: 0,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 14,
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
    flex: 1,
  },
  barBackground: {
    width: 20,
    height: 80,
    borderRadius: 4,
    justifyContent: "flex-end",
    marginBottom: 6,
  },
  bar: {
    width: "100%",
    borderRadius: 4,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  barValue: {
    fontSize: 10,
    fontWeight: "600",
  },
  noDataContainer: {
    alignItems: "center",
    padding: 32,
    margin: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  noDataIcon: {
    fontSize: 42,
    marginBottom: 10,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  noDataText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  achievementsContainer: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  achievement: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "500",
  },
});

export default ProgressScreen;
