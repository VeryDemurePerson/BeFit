// src/gamification/AchievementsPanel.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Simple helper: we treat 0–4000 XP as the full bar
 * since Platinum unlocks at 4000 XP in engine.js.
 */
function getXPProgress(xp) {
  const maxXP = 4000;
  const safeXP = Math.max(0, xp || 0);
  const percent = Math.min((safeXP / maxXP) * 100, 100);
  return Math.round(percent);
}

/**
 * Compact header-style panel for the Achievements screen.
 * Shows:
 *  - Level & XP
 *  - XP progress bar
 *  - Streak highlights
 *  - A quick row of recently unlocked badges
 */
const AchievementsPanel = ({ levelName, xp, streaks = {}, badges = {}, colors }) => {
  const totalXP = xp || 0;
  const currentLevel = levelName || 'Bronze';
  const workoutStreak = streaks.workout || 0;
  const waterStreak = streaks.water || 0;
  const nutritionStreak = streaks.nutrition || 0;

  const badgeKeys = Object.keys(badges).filter((k) => badges[k]);
  const limitedBadges = badgeKeys.slice(0, 6);

  const accent = colors.accent || '#6366F1';
  const cardBg = colors.card;
  const border = colors.border;
  const text = colors.text;
  const subtext = colors.subtext;

  const xpPercent = getXPProgress(totalXP);

  return (
    <View style={[styles.container, { backgroundColor: cardBg, borderColor: border }]}>
      {/* Level + XP row */}
      <View style={styles.levelRow}>
        <View style={styles.levelLeft}>
          <View style={[styles.levelIcon, { backgroundColor: accent + '22' }]}>
            <MaterialCommunityIcons name="medal-outline" size={22} color={accent} />
          </View>
          <View>
            <Text style={[styles.levelLabel, { color: subtext }]}>Current level</Text>
            <Text style={[styles.levelName, { color: text }]}>{currentLevel}</Text>
          </View>
        </View>
        <View style={styles.xpRight}>
          <Text style={[styles.xpLabel, { color: subtext }]}>Total XP</Text>
          <Text style={[styles.xpValue, { color: text }]}>{totalXP}</Text>
        </View>
      </View>

      {/* XP progress bar */}
      <View style={styles.xpBarWrapper}>
        <View style={[styles.xpBarTrack, { backgroundColor: border }]}>
          <View
            style={[
              styles.xpBarFill,
              {
                width: `${xpPercent}%`,
                backgroundColor: accent,
              },
            ]}
          />
        </View>
        <Text style={[styles.xpBarText, { color: subtext }]}>
          {xpPercent}% of path to Platinum (4000 XP)
        </Text>
      </View>

      {/* Streaks */}
      <View style={styles.streakRow}>
        <StreakPill
          label="Workout streak"
          value={workoutStreak}
          icon="arm-flex"
          colors={{ text, subtext, accent }}
        />
        <StreakPill
          label="Water streak"
          value={waterStreak}
          icon="cup-water"
          colors={{ text, subtext, accent }}
        />
        <StreakPill
          label="Nutrition streak"
          value={nutritionStreak}
          icon="food-apple-outline"
          colors={{ text, subtext, accent }}
        />
      </View>

      {/* Badges row */}
      <View style={styles.badgesSection}>
        <View style={styles.badgesHeader}>
          <Text style={[styles.badgesTitle, { color: text }]}>Recent badges</Text>
          <Text style={[styles.badgesCount, { color: subtext }]}>
            {badgeKeys.length} total
          </Text>
        </View>

        {badgeKeys.length === 0 ? (
          <Text style={[styles.noBadge, { color: subtext }]}>
            Start logging workouts, meals or water to unlock your first badge.
          </Text>
        ) : (
          <View style={styles.badgesRow}>
            {limitedBadges.map((key) => (
              <View key={key} style={[styles.badgeChip, { borderColor: accent + '55' }]}>
                <MaterialCommunityIcons
                  name="trophy-outline"
                  size={16}
                  color={accent}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.badgeText, { color: text }]} numberOfLines={1}>
                  {key.replace(/_/g, ' ')}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const StreakPill = ({ label, value, icon, colors }) => {
  const { text, subtext, accent } = colors;

  return (
    <View style={[styles.streakPill, { borderColor: accent + '55' }]}>
      <View style={styles.streakIconWrapper}>
        <MaterialCommunityIcons name={icon} size={18} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.streakLabel, { color: subtext }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.streakValue, { color: text }]}>{value} days</Text>
      </View>
    </View>
  );
};

export default AchievementsPanel;

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginTop: 16,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  levelLabel: {
    fontSize: 11,
  },
  levelName: {
    fontSize: 18,
    fontWeight: '700',
  },
  xpRight: {
    alignItems: 'flex-end',
  },
  xpLabel: {
    fontSize: 11,
  },
  xpValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  xpBarWrapper: {
    marginTop: 10,
  },
  xpBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  xpBarText: {
    marginTop: 4,
    fontSize: 11,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  streakPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginHorizontal: 2,
  },
  streakIconWrapper: {
    marginRight: 6,
  },
  streakLabel: {
    fontSize: 11,
  },
  streakValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  badgesSection: {
    marginTop: 12,
  },
  badgesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgesTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  badgesCount: {
    fontSize: 11,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
    maxWidth: '48%',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  noBadge: {
    fontSize: 12,
    marginTop: 4,
  },
});
