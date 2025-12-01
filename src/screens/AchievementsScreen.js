// src/screens/AchievementsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';

import { readGamification } from '../gamification/engine';
import AchievementsPanel from '../gamification/AchievementsPanel';
import { auth } from '../services/firebase';

import { useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from './themes';

/**
 * Master list of ALL achievements the app supports.
 * key MUST match the badge key stored in Firestore (engine.js).
 */
const ALL_ACHIEVEMENTS = [
  // Onboarding / meta
  {
    key: 'QUICK_START',
    name: 'Quick Start',
    description: 'Complete an activity shortly after creating your account.',
    icon: 'rocket-launch-outline',
    theme: 'special',
  },
  {
    key: 'TEST_MASTER',
    name: 'Badge Collector',
    description: 'Unlock at least 5 different badges.',
    icon: 'star-circle-outline',
    theme: 'special',
  },

  // Level-based
  {
    key: 'LEVEL_BRONZE',
    name: 'Bronze Level',
    description: 'Reach Bronze level.',
    icon: 'medal-outline',
    theme: 'level',
  },
  {
    key: 'LEVEL_SILVER',
    name: 'Silver Level',
    description: 'Reach Silver level (500+ XP).',
    icon: 'medal',
    theme: 'level',
  },
  {
    key: 'LEVEL_GOLD',
    name: 'Gold Level',
    description: 'Reach Gold level (1500+ XP).',
    icon: 'crown-outline',
    theme: 'level',
  },
  {
    key: 'LEVEL_PLATINUM',
    name: 'Platinum Level',
    description: 'Reach Platinum level (4000+ XP).',
    icon: 'crown',
    theme: 'level',
  },

  // Workouts
  {
    key: 'FIRST_WORKOUT',
    name: 'First Rep',
    description: 'Complete your first workout.',
    icon: 'dumbbell',
    theme: 'workout',
  },
  {
    key: 'FIVE_WORKOUTS',
    name: 'Getting Consistent',
    description: 'Complete 5 workouts in total.',
    icon: 'run-fast',
    theme: 'workout',
  },
  {
    key: 'TEN_WORKOUTS',
    name: 'Double Digits',
    description: 'Complete 10 workouts in total.',
    icon: 'arm-flex-outline',
    theme: 'workout',
  },
  {
    key: 'TWENTY_WORKOUTS',
    name: 'Training Habit',
    description: 'Complete 20 workouts in total.',
    icon: 'weight-lifter',
    theme: 'workout',
  },
  {
    key: 'FIFTY_WORKOUTS',
    name: 'Gym Regular',
    description: 'Complete 50 workouts in total.',
    icon: 'lightning-bolt-outline',
    theme: 'workout',
  },
  {
    key: 'HUNDRED_WORKOUTS',
    name: 'BeFit Legend',
    description: 'Complete 100 workouts in total.',
    icon: 'trophy-outline',
    theme: 'workout',
  },

  // Workout streaks
  {
    key: 'STREAK_1',
    name: 'Day One',
    description: 'Complete a workout today.',
    icon: 'calendar-check-outline',
    theme: 'streak',
  },
  {
    key: 'STREAK_3',
    name: '3-Day Streak',
    description: 'Work out 3 days in a row.',
    icon: 'fire',
    theme: 'streak',
  },
  {
    key: 'STREAK_7',
    name: '1-Week Streak',
    description: 'Work out 7 days in a row.',
    icon: 'fire-circle',
    theme: 'streak',
  },
  {
    key: 'STREAK_14',
    name: '2-Week Streak',
    description: 'Work out 14 days in a row.',
    icon: 'shield-fire',
    theme: 'streak',
  },
  {
    key: 'STREAK_30',
    name: '30-Day Streak',
    description: 'Work out 30 days in a row.',
    icon: 'crown-circle-outline',
    theme: 'streak',
  },

  // Hydration
  {
    key: 'FIRST_WATER',
    name: 'First Sip',
    description: 'Log your first glass of water.',
    icon: 'cup-water',
    theme: 'water',
  },
  {
    key: 'FIVE_WATER_GOALS',
    name: 'Hydration Hero',
    description: 'Hit your water goal on 5 different days.',
    icon: 'water',
    theme: 'water',
  },
  {
    key: 'THIRTY_WATER_GOALS',
    name: 'Hydration Master',
    description: 'Hit your water goal on 30 different days.',
    icon: 'water-circle',
    theme: 'water',
  },
  {
    key: 'HYDRATION_STREAK_7',
    name: '7-Day Hydration Streak',
    description: 'Reach a 7-day water streak.',
    icon: 'weather-rainy',
    theme: 'water',
  },

  // Nutrition
  {
    key: 'FIRST_MEAL',
    name: 'Mindful Meal',
    description: 'Log your first meal.',
    icon: 'food-apple-outline',
    theme: 'nutrition',
  },
  {
    key: 'FIVE_MEAL_DAYS',
    name: 'Balanced Week',
    description: 'Log meals on 10 different days.',
    icon: 'food',
    theme: 'nutrition',
  },
  {
    key: 'TWENTY_MEAL_DAYS',
    name: 'Meal Planner',
    description: 'Log meals on 30 different days.',
    icon: 'food-steak',
    theme: 'nutrition',
  },

  // AI Coach
  {
    key: 'AI_FIRST_CHAT',
    name: 'Met the Coach',
    description: 'Use the AI coach for the first time.',
    icon: 'robot-outline',
    theme: 'ai',
  },
  {
    key: 'AI_TEN_CHATS',
    name: 'AI Power User',
    description: 'Have 10 conversations with the AI coach.',
    icon: 'robot-happy-outline',
    theme: 'ai',
  },
];

const AchievementsScreen = () => {
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  const [loading, setLoading] = useState(true);
  const [gamification, setGamification] = useState(null);
  const [showAllModal, setShowAllModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setGamification(null);
          return;
        }
        const data = await readGamification(user.uid);
        setGamification(data);

        const unlocked = Object.keys(data.badges || {}).filter((k) => data.badges[k]);
        if (unlocked.length > 0) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3500);
        }
      } catch (err) {
        console.error('Error loading gamification', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.subtext }]}>
            Loading achievements...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const xp = gamification?.xp || 0;
  const levelName = gamification?.levelName || 'Bronze';
  const streaks = gamification?.streaks || {};
  const badges = gamification?.badges || {};

  const unlockedKeys = Object.keys(badges).filter((k) => badges[k]);
  const unlocked = ALL_ACHIEVEMENTS.filter((a) => unlockedKeys.includes(a.key));

  const renderAchievementRow = (a, isUnlocked) => {
    const iconColor = isUnlocked ? getThemeColor(a.theme, colors) : colors.border;
    const bgColor = isUnlocked ? getThemeBg(a.theme, colors) : colors.background;
    const textColor = isUnlocked ? colors.text : colors.subtext;

    return (
      <View
        key={a.key}
        style={[
          styles.achievementRow,
          {
            backgroundColor: bgColor,
            borderColor: isUnlocked ? iconColor : colors.border,
            opacity: isUnlocked ? 1 : 0.5,
          },
        ]}
      >
        <View style={styles.achievementIconWrapper}>
          <MaterialCommunityIcons
            name={a.icon}
            size={24}
            color={iconColor}
          />
          {!isUnlocked && (
            <View style={styles.lockBadge}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={14}
                color={colors.subtext}
              />
            </View>
          )}
        </View>
        <View style={styles.achievementText}>
          <Text style={[styles.achievementName, { color: textColor }]}>
            {a.name}
          </Text>
          <Text style={[styles.achievementDescription, { color: colors.subtext }]}>
            {a.description}
          </Text>
          <Text style={[styles.achievementTag, { color: iconColor }]}>
            {isUnlocked ? 'Unlocked' : 'Locked / not yet earned'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {showConfetti && (
        <ConfettiCannon
          count={120}
          origin={{ x: 0, y: 0 }}
          fadeOut
        />
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Achievements</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            Track your badges, streaks and levels.
          </Text>
        </View>

        {/* Top panel (level, XP bar, streaks, recent badges) */}
        <AchievementsPanel
          levelName={levelName}
          xp={xp}
          streaks={streaks}
          badges={badges}
          colors={colors}
        />

        {/* Unlocked section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Unlocked</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.subtext }]}>
              {unlocked.length} / {ALL_ACHIEVEMENTS.length} badges
            </Text>
          </View>

          {unlocked.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Text style={[styles.emptyEmoji, { color: colors.subtext }]}>✨</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No badges yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.subtext }]}>
                Complete workouts, log meals or track water to unlock your first
                achievement.
              </Text>
            </View>
          ) : (
            <View>{unlocked.map((a) => renderAchievementRow(a, true))}</View>
          )}
        </View>

        {/* Button to view ALL achievements (with locked ones) */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.allButton, { backgroundColor: colors.accent }]}
            onPress={() => setShowAllModal(true)}
            activeOpacity={0.9}
          >
            <MaterialCommunityIcons
              name="trophy-outline"
              size={18}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.allButtonText}>View all achievements & badges</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal: show ALL achievements (unlocked + locked) */}
      <Modal
        visible={showAllModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAllModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <View className="modalHeader" style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                All Achievements
              </Text>
              <TouchableOpacity onPress={() => setShowAllModal(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={colors.subtext}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: '80%' }}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {ALL_ACHIEVEMENTS.map((a) =>
                renderAchievementRow(a, unlockedKeys.includes(a.key)),
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

function getThemeColor(theme, colors) {
  switch (theme) {
    case 'workout':
      return '#F97316'; // orange
    case 'streak':
      return '#F59E0B'; // amber
    case 'water':
      return '#3B82F6'; // blue
    case 'nutrition':
      return '#22C55E'; // green
    case 'ai':
      return '#A855F7'; // purple
    case 'level':
      return '#EAB308'; // gold
    case 'special':
      return colors.accent;
    default:
      return colors.accent;
  }
}

function getThemeBg(theme, colors) {
  const base = getThemeColor(theme, colors);
  return base + '22';
}

export default AchievementsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  headerRow: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  section: {
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  achievementRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  achievementIconWrapper: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementText: {
    flex: 1,
  },
  achievementName: {
    fontSize: 15,
    fontWeight: '600',
  },
  achievementDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  achievementTag: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
  },
  lockBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: '#00000011',
    borderRadius: 999,
    padding: 2,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  allButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingVertical: 10,
  },
  allButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    margin: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
});
