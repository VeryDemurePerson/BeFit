// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc, // 👈 added for saving targets
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from './themes';

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [todayStats, setTodayStats] = useState({
    workouts: 0,
    totalDuration: 0,
    calories: 0,
  });
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeMetric, setActiveMetric] = useState(null); // which stat is opened

  // 👇 NEW: targets stored in state (and Firestore)
  const [targets, setTargets] = useState({
    workoutTarget: 1,
    durationTarget: 45,
    caloriesTarget: 400,
  });

  // 👇 NEW: simple weekly totals for each metric
  const [weeklySummary, setWeeklySummary] = useState({
    workoutsTotal: 0,
    durationTotal: 0,
    caloriesTotal: 0,
  });

  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  // Use state-based targets instead of hardcoded values
  const workoutTarget = targets.workoutTarget || 1;
  const durationTarget = targets.durationTarget || 45;
  const caloriesTarget = targets.caloriesTarget || 400;

  const totalWorkouts = userData?.totalWorkouts || 0;
  const nextMilestone =
    totalWorkouts < 10
      ? 10
      : totalWorkouts < 25
      ? 25
      : totalWorkouts < 50
      ? 50
      : totalWorkouts < 100
      ? 100
      : totalWorkouts + 50;

  const workoutPct = Math.min(
    todayStats.workouts / Math.max(workoutTarget, 1),
    1
  );
  const durationPct = Math.min(
    todayStats.totalDuration / Math.max(durationTarget, 1),
    1
  );
  const caloriesPct = Math.min(
    todayStats.calories / Math.max(caloriesTarget, 1),
    1
  );
  const totalWorkoutsPct = Math.min(
    totalWorkouts / Math.max(nextMilestone, 1),
    1
  );

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      await Promise.all([fetchUserData(), fetchTodayStats(), fetchRecentWorkouts()]);
    } catch (err) {
      console.error('Error fetching home data:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);

        // 👇 pull targets from Firestore if they exist, else fall back
        setTargets({
          workoutTarget: data.workoutTarget || 1,
          durationTarget: data.durationTarget || 45,
          caloriesTarget: data.caloriesTarget || 400,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchTodayStats = async () => {
    try {
      const today = new Date().toDateString();
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('userId', '==', auth.currentUser.uid),
        where('date', '==', today)
      );

      const querySnapshot = await getDocs(workoutsQuery);

      let workoutCount = 0;
      let totalDuration = 0;
      let estimatedCalories = 0;

      querySnapshot.forEach((docSnap) => {
        const workout = docSnap.data();
        workoutCount++;
        const duration = workout.duration || 0;
        totalDuration += duration;
        const caloriesPerMinute =
          workout.type === 'cardio' ? 8 : workout.type === 'strength' ? 6 : 4;
        estimatedCalories += duration * caloriesPerMinute;
      });

      setTodayStats({
        workouts: workoutCount,
        totalDuration,
        calories: estimatedCalories,
      });
    } catch (error) {
      console.error('Error fetching today stats:', error);
    }
  };

  const fetchRecentWorkouts = async () => {
    try {
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('userId', '==', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(workoutsQuery);
      let workoutList = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      workoutList.sort((a, b) => {
        try {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB - dateA;
        } catch {
          return 0;
        }
      });

      // 👇 compute 7-day totals for workouts / duration / calories
      const now = new Date();
      const start = new Date();
      start.setDate(now.getDate() - 6);

      let workoutsTotal = 0;
      let durationTotal = 0;
      let caloriesTotal = 0;

      workoutList.forEach((w) => {
        try {
          const d =
            w.createdAt?.toDate?.() || new Date(w.createdAt || Date.now());
          if (d >= start && d <= now) {
            workoutsTotal++;
            const dur = w.duration || 0;
            durationTotal += dur;
            const caloriesPerMinute =
              w.type === 'cardio' ? 8 : w.type === 'strength' ? 6 : 4;
            caloriesTotal += dur * caloriesPerMinute;
          }
        } catch {
          // ignore bad dates
        }
      });

      setWeeklySummary({
        workoutsTotal,
        durationTotal,
        caloriesTotal,
      });

      setRecentWorkouts(workoutList.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent workouts:', error);
    }
  };

  // 👇 helper to bump targets + save to Firestore
  const updateTarget = (key, delta) => {
    setTargets((prev) => {
      const current = prev[key] || 0;
      const newValue = Math.max(1, current + delta); // never below 1
      const updated = { ...prev, [key]: newValue };

      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, {
          workoutTarget: updated.workoutTarget,
          durationTarget: updated.durationTarget,
          caloriesTarget: updated.caloriesTarget,
        }).catch((err) =>
          console.error('Error saving targets to Firestore:', err)
        );
      }

      return updated;
    });
  };

  /** --- METRIC CARDS --- **/

  // 1) Workouts – row of 3 circles
  const WorkoutsCard = () => {
    const maxDots = 3;
    const filledDots = Math.min(todayStats.workouts, maxDots);
    const dots = Array.from({ length: maxDots });

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setActiveMetric('workouts')}
        style={[
          styles.metricCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.metricHeaderRow}>
          <View>
            <Text style={[styles.metricTitle, { color: colors.text }]}>
              Workouts
            </Text>
            <Text style={[styles.metricSubtitle, { color: colors.subtext }]}>
              Target: {workoutTarget} per day
            </Text>
          </View>
          <View
            style={[
              styles.metricIconBubble,
              { backgroundColor: '#FF7043' },
            ]}
          >
            <FontAwesome5 name="dumbbell" size={18} color="#fff" />
          </View>
        </View>

        <Text style={[styles.metricValue, { color: colors.text }]}>
          {todayStats.workouts}{' '}
          <Text style={[styles.metricUnit, { color: colors.subtext }]}>
            sessions
          </Text>
        </Text>

        <View style={styles.dotsRow}>
          {dots.map((_, index) => {
            const filled = index < filledDots;
            return (
              <View
                key={index}
                style={[
                  styles.workoutDot,
                  {
                    backgroundColor: filled ? '#FF7043' : 'transparent',
                    borderColor: filled ? '#FF7043' : colors.border,
                  },
                ]}
              />
            );
          })}
        </View>

        <Text
          style={[
            styles.metricBarLabel,
            { color: colors.subtext, marginTop: 6 },
          ]}
        >
          {todayStats.workouts >= workoutTarget
            ? 'Daily workout goal reached 🎉'
            : `${todayStats.workouts}/${workoutTarget} completed today`}
        </Text>
      </TouchableOpacity>
    );
  };

  // 2) Duration – 3 clear 15-minute blocks
  const DurationCard = () => {
    const accent = '#FF6B81'; // softer pink/red
    const minutes = todayStats.totalDuration;

    const blockSize = 15;
    const blocks = 3;
    const clampedMinutes = Math.min(minutes, durationTarget);
    const filledBlocks = Math.floor(clampedMinutes / blockSize);
    const partialBlockMinutes = Math.max(
      clampedMinutes - filledBlocks * blockSize,
      0
    );
    const partialPct = partialBlockMinutes / blockSize; // 0 → 1

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setActiveMetric('duration')}
        style={[
          styles.metricCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.metricHeaderRow}>
          <View>
            <Text style={[styles.metricTitle, { color: colors.text }]}>
              Duration
            </Text>
            <Text style={[styles.metricSubtitle, { color: colors.subtext }]}>
              Goal: {durationTarget} min
            </Text>
          </View>
          <View
            style={[
              styles.metricIconBubble,
              { backgroundColor: accent },
            ]}
          >
            <Ionicons name="timer-outline" size={20} color="#fff" />
          </View>
        </View>

        <Text style={[styles.metricValue, { color: colors.text }]}>
          {minutes}{' '}
          <Text style={[styles.metricUnit, { color: colors.subtext }]}>
            min
          </Text>
        </Text>

        {/* 3 x 15-min blocks */}
        <View style={styles.durationBlocksRow}>
          {Array.from({ length: blocks }).map((_, index) => {
            const isFilled = index < filledBlocks;
            const isPartial =
              index === filledBlocks &&
              partialPct > 0 &&
              filledBlocks < blocks;

            return (
              <View
                key={index}
                style={[
                  styles.durationBlock,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                {isFilled && (
                  <View
                    style={[
                      styles.durationBlockFill,
                      { backgroundColor: accent, width: '100%' },
                    ]}
                  />
                )}

                {isPartial && (
                  <View
                    style={[
                      styles.durationBlockFill,
                      {
                        backgroundColor: accent,
                        width: `${partialPct * 100}%`,
                      },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>

        <Text
          style={[
            styles.metricBarLabel,
            { color: colors.subtext, marginTop: 6 },
          ]}
        >
          {minutes >= durationTarget
            ? 'Duration goal reached for today 🎉'
            : `${Math.max(
                durationTarget - minutes,
                0
              )} min left to hit your goal`}
        </Text>
      </TouchableOpacity>
    );
  };

  // 3) Calories – row of flame icons filling up
  const CaloriesCard = () => {
    const steps = 5;
    const filledCount = Math.round((caloriesPct || 0) * steps);
    const flames = Array.from({ length: steps });

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setActiveMetric('calories')}
        style={[
          styles.metricCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.metricHeaderRow}>
          <View>
            <Text style={[styles.metricTitle, { color: colors.text }]}>
              Calories
            </Text>
            <Text style={[styles.metricSubtitle, { color: colors.subtext }]}>
              Target: {caloriesTarget} kcal
            </Text>
          </View>
          <View
            style={[
              styles.metricIconBubble,
              { backgroundColor: '#FF9800' },
            ]}
          >
            <MaterialCommunityIcons name="fire" size={20} color="#fff" />
          </View>
        </View>

        <Text style={[styles.metricValue, { color: colors.text }]}>
          {todayStats.calories}{' '}
          <Text style={[styles.metricUnit, { color: colors.subtext }]}>
            kcal
          </Text>
        </Text>

        <View style={styles.flameRow}>
          {flames.map((_, index) => {
            const filled = index < filledCount;
            return (
              <MaterialCommunityIcons
                key={index}
                name="fire"
                size={24}
                color={filled ? '#FF9800' : colors.border}
                style={{ marginHorizontal: 4 }}
              />
            );
          })}
        </View>

        <Text
          style={[
            styles.metricBarLabel,
            { color: colors.subtext, marginTop: 6 },
          ]}
        >
          {Math.round((caloriesPct || 0) * 100)}% of daily burn target
        </Text>
      </TouchableOpacity>
    );
  };

  // 4) Total workouts – milestone line
  const TotalWorkoutsCard = () => {
    const milestones = [10, 25, 50, 100];
    const pct = Math.round((totalWorkoutsPct || 0) * 100);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setActiveMetric('totalWorkouts')}
        style={[
          styles.metricCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.metricHeaderRow}>
          <View>
            <Text style={[styles.metricTitle, { color: colors.text }]}>
              Total Workouts
            </Text>
            <Text style={[styles.metricSubtitle, { color: colors.subtext }]}>
              Next milestone: {nextMilestone}
            </Text>
          </View>
          <View
            style={[
              styles.metricIconBubble,
              { backgroundColor: '#9C27B0' },
            ]}
          >
            <Ionicons name="trophy-outline" size={20} color="#fff" />
          </View>
        </View>

        <Text style={[styles.metricValue, { color: colors.text }]}>
          {totalWorkouts}{' '}
          <Text style={[styles.metricUnit, { color: colors.subtext }]}>
            all time
          </Text>
        </Text>

        <View style={styles.milestoneLineContainer}>
          <View
            style={[
              styles.milestoneLine,
              { backgroundColor: colors.border },
            ]}
          />
          {milestones.map((m, index) => {
            const achieved = totalWorkouts >= m;
            const position = (index / (milestones.length - 1)) * 100;

            return (
              <View
                key={m}
                style={[
                  styles.milestoneDotWrapper,
                  { left: `${position}%` },
                ]}
              >
                <View
                  style={[
                    styles.milestoneDot,
                    {
                      backgroundColor: achieved ? '#9C27B0' : colors.card,
                      borderColor: achieved ? '#9C27B0' : colors.border,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.milestoneLabel,
                    {
                      color: achieved ? '#9C27B0' : colors.subtext,
                    },
                  ]}
                >
                  {m}
                </Text>
              </View>
            );
          })}
        </View>

        <Text
          style={[
            styles.metricBarLabel,
            { color: colors.subtext, marginTop: 6 },
          ]}
        >
          {pct}% towards {nextMilestone} workouts
        </Text>
      </TouchableOpacity>
    );
  };

  /** --- ACTIONS & RECENT WORKOUTS --- **/

  const ActionButton = ({ title, subtitle, onPress, color, icon }) => {
    const bg = color || colors.accent;

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[
          styles.actionButton,
          {
            backgroundColor: bg, // Button = icon color
            borderColor: bg,
            shadowColor: bg,
          },
        ]}
      >
        <View
          style={[
            styles.actionIconBubble,
            { backgroundColor: 'rgba(255,255,255,0.20)' },
          ]}
        >
          {icon}
        </View>

        <View style={styles.actionTextContainer}>
          <Text
            style={[
              styles.actionButtonTitle,
              { color: '#FFFFFF' },
            ]}
          >
            {title}
          </Text>

          {subtitle ? (
            <Text
              style={[
                styles.actionButtonSubtitle,
                { color: 'rgba(255,255,255,0.9)' },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          style={styles.actionChevron}
          color="rgba(255,255,255,0.9)"
        />
      </TouchableOpacity>
    );
  };

  const RecentWorkoutItem = ({ workout }) => {
    let dateLabel = '';
    try {
      const d =
        workout.createdAt?.toDate?.() ||
        new Date(workout.createdAt || Date.now());
      dateLabel = d.toLocaleDateString();
    } catch {
      dateLabel = '';
    }

    return (
      <View
        style={[
          styles.recentWorkoutItem,
          {
            borderBottomColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
      >
        <View style={styles.recentWorkoutInfo}>
          <Text
            style={[styles.recentWorkoutName, { color: colors.text }]}
          >
            {workout.exercise || 'Workout'}
          </Text>
          <Text
            style={[
              styles.recentWorkoutDetails,
              { color: colors.subtext },
            ]}
          >
            {workout.duration || 0} min • {workout.type || 'general'}
          </Text>
        </View>
        <Text
          style={[styles.recentWorkoutDate, { color: colors.subtext }]}
        >
          {dateLabel}
        </Text>
      </View>
    );
  };

  /** --- METRIC DETAIL MODAL CONTENT --- **/
  const renderMetricDetail = (metric) => {
    switch (metric) {
      case 'workouts': {
        const pct = Math.round(workoutPct * 100);
        return (
          <View>
            <Text style={[styles.metricModalTitle, { color: colors.text }]}>
              Workouts today
            </Text>
            <Text
              style={[styles.metricModalSubtitle, { color: colors.subtext }]}
            >
              You have logged {todayStats.workouts} workout(s) today.
            </Text>

            <View style={styles.detailBarRow}>
              <Text
                style={[styles.detailBarLabel, { color: colors.subtext }]}
              >
                Today vs goal
              </Text>
              <Text
                style={[styles.detailBarValue, { color: colors.text }]}
              >
                {todayStats.workouts}/{workoutTarget}
              </Text>
            </View>

            <View
              style={[
                styles.detailBarBg,
                { backgroundColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.detailBarFill,
                  {
                    width: `${
                      Math.min(Math.max(workoutPct || 0, 0), 1) * 100
                    }%`,
                    backgroundColor: '#FF7043',
                  },
                ]}
              />
            </View>

            {/* 👇 Weekly summary */}
            <Text
              style={[
                styles.metricModalSubtitle,
                { color: colors.subtext, marginTop: 12 },
              ]}
            >
              Last 7 days: {weeklySummary.workoutsTotal} workout(s)
            </Text>

            {/* 👇 Target editor */}
            <View style={styles.targetEditRow}>
              <Text
                style={[styles.detailBarLabel, { color: colors.subtext }]}
              >
                Daily target
              </Text>
              <View style={styles.targetEditButtons}>
                <TouchableOpacity
                  style={[
                    styles.targetButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => updateTarget('workoutTarget', -1)}
                >
                  <Text style={{ color: colors.text }}>-</Text>
                </TouchableOpacity>
                <Text
                  style={[styles.targetValue, { color: colors.text }]}
                >
                  {workoutTarget}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.targetButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => updateTarget('workoutTarget', 1)}
                >
                  <Text style={{ color: colors.text }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      }

      case 'duration': {
        const pct = Math.round(durationPct * 100);
        const blockSize = 15;
        const blocks = 3;
        const minutes = todayStats.totalDuration;
        const clampedMinutes = Math.min(minutes, durationTarget);
        const filledBlocks = Math.floor(clampedMinutes / blockSize);
        const partialBlockMinutes = Math.max(
          clampedMinutes - filledBlocks * blockSize,
          0
        );
        const partialPct = partialBlockMinutes / blockSize;

        return (
          <View>
            <Text style={[styles.metricModalTitle, { color: colors.text }]}>
              Duration
            </Text>
            <Text
              style={[styles.metricModalSubtitle, { color: colors.subtext }]}
            >
              You&apos;ve done {todayStats.totalDuration} minutes today. Goal is{' '}
              {durationTarget} minutes.
            </Text>

            <View style={styles.detailBarRow}>
              <Text
                style={[styles.detailBarLabel, { color: colors.subtext }]}
              >
                Today&apos;s progress
              </Text>
              <Text
                style={[styles.detailBarValue, { color: colors.text }]}
              >
                {pct}%
              </Text>
            </View>

            <View
              style={[
                styles.detailBarBg,
                { backgroundColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.detailBarFill,
                  {
                    width: `${
                      Math.min(Math.max(durationPct || 0, 0), 1) * 100
                    }%`,
                    backgroundColor: '#FF6B81',
                  },
                ]}
              />
            </View>

            <Text
              style={[
                styles.metricModalSubtitle,
                { color: colors.subtext, marginTop: 16 },
              ]}
            >
              Each block below represents a 15-minute chunk.
            </Text>

            <View style={styles.durationBlocksRow}>
              {Array.from({ length: blocks }).map((_, index) => {
                const isFilled = index < filledBlocks;
                const isPartial =
                  index === filledBlocks &&
                  partialPct > 0 &&
                  filledBlocks < blocks;

                return (
                  <View
                    key={index}
                    style={[
                      styles.durationBlock,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                        height: 26,
                      },
                    ]}
                  >
                    {isFilled && (
                      <View
                        style={[
                          styles.durationBlockFill,
                          { backgroundColor: '#FF6B81', width: '100%' },
                        ]}
                      />
                    )}
                    {isPartial && (
                      <View
                        style={[
                          styles.durationBlockFill,
                          {
                            backgroundColor: '#FF6B81',
                            width: `${partialPct * 100}%`,
                          },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>

            {/* weekly summary */}
            <Text
              style={[
                styles.metricModalSubtitle,
                { color: colors.subtext, marginTop: 12 },
              ]}
            >
              Last 7 days: {weeklySummary.durationTotal} min total
            </Text>

            {/* target editor */}
            <View style={styles.targetEditRow}>
              <Text
                style={[styles.detailBarLabel, { color: colors.subtext }]}
              >
                Daily target
              </Text>
              <View style={styles.targetEditButtons}>
                <TouchableOpacity
                  style={[
                    styles.targetButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => updateTarget('durationTarget', -5)}
                >
                  <Text style={{ color: colors.text }}>-5</Text>
                </TouchableOpacity>
                <Text
                  style={[styles.targetValue, { color: colors.text }]}
                >
                  {durationTarget} min
                </Text>
                <TouchableOpacity
                  style={[
                    styles.targetButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => updateTarget('durationTarget', 5)}
                >
                  <Text style={{ color: colors.text }}>+5</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      }

      case 'calories': {
        const pct = Math.round(caloriesPct * 100);

        return (
          <View>
            <Text style={[styles.metricModalTitle, { color: colors.text }]}>
              Calories
            </Text>
            <Text
              style={[styles.metricModalSubtitle, { color: colors.subtext }]}
            >
              Estimated burn of {todayStats.calories} kcal today.
            </Text>

            <View style={styles.detailBarRow}>
              <Text
                style={[styles.detailBarLabel, { color: colors.subtext }]}
              >
                Today vs target
              </Text>
              <Text
                style={[styles.detailBarValue, { color: colors.text }]}
              >
                {pct}%
              </Text>
            </View>

            <View
              style={[
                styles.detailBarBg,
                { backgroundColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.detailBarFill,
                  {
                    width: `${
                      Math.min(Math.max(caloriesPct || 0, 0), 1) * 100
                    }%`,
                    backgroundColor: '#FF9800',
                  },
                ]}
              />
            </View>

            <View style={styles.flameRowLarge}>
              {Array.from({ length: 5 }).map((_, index) => {
                const threshold = ((index + 1) / 5) * 100;
                const filled = pct >= threshold;
                return (
                  <MaterialCommunityIcons
                    key={index}
                    name="fire"
                    size={30}
                    color={filled ? '#FF9800' : colors.border}
                    style={{ marginHorizontal: 4 }}
                  />
                );
              })}
            </View>

            {/* weekly summary */}
            <Text
              style={[
                styles.metricModalSubtitle,
                { color: colors.subtext, marginTop: 12 },
              ]}
            >
              Last 7 days: {Math.round(weeklySummary.caloriesTotal)} kcal
            </Text>

            {/* target editor */}
            <View style={styles.targetEditRow}>
              <Text
                style={[styles.detailBarLabel, { color: colors.subtext }]}
              >
                Daily target
              </Text>
              <View style={styles.targetEditButtons}>
                <TouchableOpacity
                  style={[
                    styles.targetButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => updateTarget('caloriesTarget', -50)}
                >
                  <Text style={{ color: colors.text }}>-50</Text>
                </TouchableOpacity>
                <Text
                  style={[styles.targetValue, { color: colors.text }]}
                >
                  {caloriesTarget} kcal
                </Text>
                <TouchableOpacity
                  style={[
                    styles.targetButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => updateTarget('caloriesTarget', 50)}
                >
                  <Text style={{ color: colors.text }}>+50</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      }

      case 'totalWorkouts': {
        const pct = Math.round(totalWorkoutsPct * 100);
        const milestones = [10, 25, 50, 100];

        return (
          <View>
            <Text style={[styles.metricModalTitle, { color: colors.text }]}>
              Lifetime Workouts
            </Text>
            <Text
              style={[styles.metricModalSubtitle, { color: colors.subtext }]}
            >
              You&apos;ve logged {totalWorkouts} workouts in total.
            </Text>

            <View style={styles.detailBarRow}>
              <Text
                style={[styles.detailBarLabel, { color: colors.subtext }]}
              >
                Next milestone
              </Text>
              <Text
                style={[styles.detailBarValue, { color: colors.text }]}
              >
                {nextMilestone} workouts
              </Text>
            </View>

            <View
              style={[
                styles.detailBarBg,
                { backgroundColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.detailBarFill,
                  {
                    width: `${
                      Math.min(Math.max(totalWorkoutsPct || 0, 0), 1) * 100
                    }%`,
                    backgroundColor: '#9C27B0',
                  },
                ]}
              />
            </View>

            <View style={styles.milestoneList}>
              {milestones.map((m) => {
                const achieved = totalWorkouts >= m;
                return (
                  <View key={m} style={styles.milestoneListItem}>
                    <Ionicons
                      name={
                        achieved ? 'checkmark-circle' : 'radio-button-off'
                      }
                      size={18}
                      color={achieved ? '#9C27B0' : colors.subtext}
                    />
                    <Text
                      style={[
                        styles.milestoneListLabel,
                        {
                          color: achieved ? colors.text : colors.subtext,
                        },
                      ]}
                    >
                      {m} workouts
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        );
      }

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.greeting, { color: colors.text }]}>
            Hello, {userData?.name || userData?.fullName || 'User'} 👋
          </Text>
          <Text style={[styles.date, { color: colors.subtext }]}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* MAIN METRICS – hero section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Today&apos;s Progress
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.subtext }]}>
            Each stat has a simple visual so you can see progress at a glance
          </Text>

          <View style={styles.metricsStack}>
            <WorkoutsCard />
            <DurationCard />
            <CaloriesCard />
            <TotalWorkoutsCard />
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View style={[styles.section, { marginTop: 28 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          <View style={styles.actionGrid}>
            <ActionButton
              title="Log Workout"
              subtitle="Track your exercise"
              onPress={() => navigation.navigate('Workout')}
              color="#FF7043"
              icon={<FontAwesome5 name="dumbbell" size={18} color="#fff" />}
            />
            <ActionButton
              title="View Progress"
              subtitle="Check your stats"
              onPress={() => navigation.navigate('Progress')}
              color="#34C759"
              icon={
                <Ionicons
                  name="stats-chart-outline"
                  size={18}
                  color="#fff"
                />
              }
            />
            <ActionButton
              title="Set Goals"
              subtitle="Plan your fitness"
              onPress={() => navigation.navigate('Goals')}
              color="#9C27B0"
              icon={
                <Ionicons
                  name="flag-outline"
                  size={18}
                  color="#fff"
                />
              }
            />
            <ActionButton
              title="Water Intake"
              subtitle="Stay hydrated"
              onPress={() => navigation.navigate('WaterTracker')}
              color="#29B6F6"
              icon={
                <Ionicons
                  name="water-outline"
                  size={18}
                  color="#fff"
                />
              }
            />
            <ActionButton
              title="Log Food"
              subtitle="Track nutrition"
              onPress={() =>
                navigation.navigate('Nutrition', { screen: 'AddMeal' })
              }
              color="#FF4567"
              icon={
                <MaterialCommunityIcons
                  name="food-apple-outline"
                  size={18}
                  color="#fff"
                />
              }
            />
            <ActionButton
              title="Edit Profile"
              subtitle="Update your info"
              onPress={() => navigation.navigate('EditProfile')}
              color="#6C63FF"
              icon={
                <Ionicons
                  name="person-circle-outline"
                  size={18}
                  color="#fff"
                />
              }
            />
          </View>
        </View>

        {/* RECENT WORKOUTS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Workouts
            </Text>
            {recentWorkouts.length > 0 && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Workout')}
              >
                <Text
                  style={[styles.seeAllText, { color: colors.accent }]}
                >
                  See All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {recentWorkouts.length === 0 ? (
            <View
              style={[
                styles.emptyWorkouts,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.emptyWorkoutsText,
                  { color: colors.subtext },
                ]}
              >
                No workouts yet. Start your fitness journey!
              </Text>
              <TouchableOpacity
                style={[
                  styles.startButton,
                  { backgroundColor: colors.accent },
                ]}
                onPress={() => navigation.navigate('Workout')}
              >
                <Text style={styles.startButtonText}>Log First Workout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.recentWorkoutsList,
                { backgroundColor: colors.card },
              ]}
            >
              {recentWorkouts.map((workout) => (
                <RecentWorkoutItem key={workout.id} workout={workout} />
              ))}
            </View>
          )}
        </View>

        {/* MOTIVATION CARD */}
        <View style={styles.section}>
          <View style={styles.motivationCard}>
            <View style={styles.motivationOverlay} />
            <Text style={styles.motivationQuote}>
              &quot;The only bad workout is the one that didn&apos;t happen.&quot;
            </Text>
            <Text style={styles.motivationAuthor}>- Anonymous</Text>
          </View>
        </View>
      </ScrollView>

      {activeMetric && (
        <View style={styles.metricModalOverlay}>
          <View
            style={[
              styles.metricModalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={styles.metricModalClose}
              onPress={() => setActiveMetric(null)}
            >
              <Ionicons name="close" size={20} color={colors.subtext} />
            </TouchableOpacity>

            {renderMetricDetail(activeMetric)}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 28 },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  greeting: { fontSize: 24, fontWeight: 'bold' },
  date: { fontSize: 16 },

  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  sectionSubtitle: { marginTop: 4, fontSize: 13 },
  seeAllText: { fontSize: 16, fontWeight: '600' },

  metricsStack: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  metricCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  metricSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  metricIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  metricUnit: {
    fontSize: 12,
  },
  metricBarLabel: {
    fontSize: 11,
  },

  // Workouts dots
  dotsRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  workoutDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    marginRight: 8,
  },

  // Duration 3-block UI
  durationBlocksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  durationBlock: {
    flex: 1,
    height: 20,
    borderRadius: 999,
    borderWidth: 1,
    marginHorizontal: 3,
    overflow: 'hidden',
  },
  durationBlockFill: {
    height: '100%',
    borderRadius: 999,
  },

  // Calories flames
  flameRow: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
  },

  // Total workouts milestones
  milestoneLineContainer: {
    marginTop: 12,
    height: 40,
    justifyContent: 'center',
  },
  milestoneLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    top: '50%',
    marginTop: -1,
  },
  milestoneDotWrapper: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    transform: [{ translateX: -8 }],
  },
  milestoneDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  milestoneLabel: {
    fontSize: 10,
    marginTop: 4,
  },

  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginTop: 12,
  },

  actionButton: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2933',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  actionIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionChevron: {
    marginLeft: 4,
  },

  actionButtonTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtonSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },

  emptyWorkouts: {
    padding: 26,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyWorkoutsText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  startButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  startButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },

  recentWorkoutsList: { borderRadius: 10, overflow: 'hidden' },
  recentWorkoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  recentWorkoutInfo: { flex: 1 },
  recentWorkoutName: { fontSize: 16, fontWeight: '600' },
  recentWorkoutDetails: { fontSize: 14 },
  recentWorkoutDate: { fontSize: 12 },

  motivationCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#5A67D8',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 10,
  },
  motivationOverlay: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  motivationQuote: {
    color: 'white',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 5,
  },
  motivationAuthor: { color: 'white', fontSize: 14, opacity: 0.8 },

  metricModalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  metricModalCard: {
    width: '100%',
    maxHeight: '70%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  metricModalClose: {
    alignSelf: 'flex-end',
  },
  metricModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  metricModalSubtitle: {
    fontSize: 13,
    marginTop: 6,
  },
  detailBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 4,
  },
  detailBarLabel: {
    fontSize: 12,
  },
  detailBarValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailBarBg: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  detailBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  flameRowLarge: {
    flexDirection: 'row',
    marginTop: 14,
    justifyContent: 'center',
  },
  milestoneList: {
    marginTop: 14,
  },
  milestoneListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  milestoneListLabel: {
    fontSize: 13,
    marginLeft: 8,
  },

  // 👇 Target editor styles
  targetEditRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetEditButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetValue: {
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeScreen;
