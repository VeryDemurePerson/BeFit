// src/gamification/AchievementsPanel.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AchievementsPanel = ({ levelName, xp, streaks, badges, colors }) => {
  const badgeList = badges ? Object.keys(badges) : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>🏆 Achievements</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>
        Level: {levelName || 'Bronze'} | XP: {xp || 0}
      </Text>

      <View style={styles.streaks}>
        <Text style={[styles.streak, { color: colors.text }]}>
          🔥 Workout Streak: {streaks?.workout || 0}
        </Text>
        <Text style={[styles.streak, { color: colors.text }]}>
          💧 Water Streak: {streaks?.water || 0}
        </Text>
        <Text style={[styles.streak, { color: colors.text }]}>
          🥗 Meal Streak: {streaks?.meal || 0}
        </Text>
      </View>

      {badgeList.length > 0 ? (
        <View style={styles.badges}>
          <Text style={[styles.badgesTitle, { color: colors.text }]}>Unlocked Badges:</Text>
          {badgeList.map((b) => (
            <Text key={b} style={[styles.badge, { color: colors.text }]}>• {b}</Text>
          ))}
        </View>
      ) : (
        <Text style={[styles.noBadge, { color: colors.subtext }]}>
          No badges yet — log your first workout or meal!
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 10 },
  streaks: { marginBottom: 10 },
  streak: { fontSize: 14 },
  badges: { marginTop: 10 },
  badgesTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  badge: { fontSize: 14, marginVertical: 1 },
  noBadge: { fontSize: 14, fontStyle: 'italic' },
});

export default AchievementsPanel;
