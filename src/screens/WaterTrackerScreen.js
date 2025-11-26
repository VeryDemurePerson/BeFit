// src/screens/WaterTrackerScreen.js

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from './themes';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WaterTrackerScreen() {
  const { theme } = useTheme();
  const themeColors = theme === 'light' ? lightTheme : darkTheme;

  const [dailyGoal, setDailyGoal] = useState(8); // glasses per day
  const [todayGlasses, setTodayGlasses] = useState(3);

  const [weekData, setWeekData] = useState([
    { label: 'Mon', glasses: 6 },
    { label: 'Tue', glasses: 8 },
    { label: 'Wed', glasses: 4 },
    { label: 'Thu', glasses: 7 },
    { label: 'Fri', glasses: 5 },
    { label: 'Sat', glasses: 9 },
    { label: 'Sun', glasses: 3 },
  ]);

  const todayLabel = useMemo(() => {
    const jsDay = new Date().getDay(); // 0=Sun..6=Sat
    if (jsDay === 0) return 'Sun';
    return WEEK_DAYS[jsDay - 1];
  }, []);

  const todayPercent = useMemo(() => {
    if (dailyGoal <= 0) return 0;
    return Math.min((todayGlasses / dailyGoal) * 100, 150);
  }, [todayGlasses, dailyGoal]);

  function updateTodayGlasses(delta) {
    setTodayGlasses((prev) => {
      const next = Math.max(0, prev + delta);

      setWeekData((current) =>
        current.map((day) =>
          day.label === todayLabel ? { ...day, glasses: next } : day
        )
      );

      return next;
    });
  }

  function updateGoal(delta) {
    setDailyGoal((prev) => {
      const next = Math.max(1, prev + delta);
      return next;
    });
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: themeColors.background,
      }}
    >
      {/* 🔴 This wrapper is what actually pushes everything down */}
      <View style={{ flex: 1, paddingTop: 32 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.title, { color: themeColors.text }]}>
                  Water tracker
                </Text>
                <Text style={[styles.subtitle, { color: themeColors.subtext }]}>
                  Stay hydrated and hit your daily goal.
                </Text>
              </View>
              <Ionicons
                name="water-outline"
                size={26}
                color={themeColors.accent}
              />
            </View>

            {/* Today card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                  Today • {todayLabel}
                </Text>
                <View
                  style={[
                    styles.tag,
                    { backgroundColor: themeColors.accentSoft },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={themeColors.accent}
                  />
                  <Text
                    style={[
                      styles.tagText,
                      { color: themeColors.accent },
                    ]}
                  >
                    Goal: {dailyGoal} glasses
                  </Text>
                </View>
              </View>

              <View style={styles.todayRow}>
                <View style={styles.todayLeft}>
                  <Text
                    style={[
                      styles.todayCount,
                      { color: themeColors.text },
                    ]}
                  >
                    {todayGlasses}
                  </Text>
                  <Text
                    style={[
                      styles.todayLabel,
                      { color: themeColors.subtext },
                    ]}
                  >
                    glasses logged
                  </Text>

                  <Text
                    style={[
                      styles.todayPercent,
                      { color: themeColors.accent },
                    ]}
                  >
                    {dailyGoal > 0
                      ? `${Math.round(
                          (todayGlasses / dailyGoal) * 100
                        )}% of goal`
                      : 'No goal set'}
                  </Text>
                </View>

                <View style={styles.todayControls}>
                  <TouchableOpacity
                    style={[
                      styles.circleButton,
                      { borderColor: themeColors.border },
                    ]}
                    onPress={() => updateTodayGlasses(-1)}
                  >
                    <Ionicons
                      name="remove-outline"
                      size={20}
                      color={themeColors.text}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.circleButton,
                      { backgroundColor: themeColors.accent, borderWidth: 0 },
                    ]}
                    onPress={() => updateTodayGlasses(1)}
                  >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Progress bar */}
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: themeColors.accentSoft },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${todayPercent}%`,
                      backgroundColor:
                        todayGlasses >= dailyGoal
                          ? themeColors.success
                          : themeColors.accent,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Goal card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                  Daily goal
                </Text>
              </View>

              <View style={styles.goalRow}>
                <TouchableOpacity
                  style={[
                    styles.goalButton,
                    { borderColor: themeColors.border },
                  ]}
                  onPress={() => updateGoal(-1)}
                >
                  <Ionicons
                    name="remove-outline"
                    size={20}
                    color={themeColors.text}
                  />
                </TouchableOpacity>
                <View style={styles.goalCenter}>
                  <Text
                    style={[
                      styles.goalValue,
                      { color: themeColors.text },
                    ]}
                  >
                    {dailyGoal}
                  </Text>
                  <Text
                    style={[
                      styles.goalLabel,
                      { color: themeColors.subtext },
                    ]}
                  >
                    glasses per day
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.goalButton,
                    { borderColor: themeColors.border },
                  ]}
                  onPress={() => updateGoal(1)}
                >
                  <Ionicons
                    name="add-outline"
                    size={20}
                    color={themeColors.text}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Weekly chart */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                  Weekly overview
                </Text>
                <Text
                  style={[
                    styles.cardSub,
                    { color: themeColors.subtext },
                  ]}
                >
                  Goal: {dailyGoal} glasses/day
                </Text>
              </View>

              <View style={styles.chartRow}>
                {weekData.map((day) => (
                  <View key={day.label} style={styles.chartColumn}>
                    <View
                      style={[
                        styles.chartBarTrack,
                        { backgroundColor: themeColors.accentSoft },
                      ]}
                    >
                      <View
                        style={[
                          styles.chartBarFill,
                          {
                            height: `${Math.min(
                              (day.glasses / dailyGoal) * 100,
                              100
                            )}%`,
                            backgroundColor:
                              day.glasses >= dailyGoal
                                ? themeColors.success
                                : themeColors.accent,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.chartLabel,
                        { color: themeColors.subtext },
                      ]}
                    >
                      {day.label}
                    </Text>
                    <Text
                      style={[
                        styles.chartValue,
                        {
                          color:
                            day.label === todayLabel
                              ? themeColors.accent
                              : themeColors.subtext,
                        },
                      ]}
                    >
                      {day.glasses}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 0, // we now use outer paddingTop: 32
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardSub: {
    fontSize: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 11,
    marginLeft: 4,
  },
  todayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayLeft: {
    flex: 1,
  },
  todayCount: {
    fontSize: 32,
    fontWeight: '700',
  },
  todayLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  todayPercent: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
  },
  todayControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCenter: {
    alignItems: 'center',
  },
  goalValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  goalLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarTrack: {
    width: 18,
    height: 80,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 999,
  },
  chartLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  chartValue: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
});
