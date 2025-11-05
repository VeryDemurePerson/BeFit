// src/screens/GoalsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from './themes';

const GoalsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;
  const [goals, setGoals] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setGoals(userData.goals || {});
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch goals');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, []);

  const SectionCard = ({ title, icon, type, currentValue, description }) => (
    <View
      style={[
        styles.section,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionIcon]}>{icon}</Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      </View>

      <Text style={[styles.sectionDesc, { color: colors.subtext }]}>{description}</Text>

      <View style={styles.valueRow}>
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Current Goal:</Text>
        <Text style={[styles.sectionValue, { color: colors.accent }]}>
          {currentValue ?? '-'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.editButton, { backgroundColor: colors.accent }]}
        onPress={() =>
          navigation.navigate('EditGoal', {
            goalType: type,
            currentValue: currentValue || 0,
          })
        }
      >
        <Text style={styles.editButtonText}>Edit Goal</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ color: colors.text, marginTop: 10 }}>Loading goals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.mainTitle, { color: colors.text }]}>Your Goals</Text>

        {/* Weekly Workouts */}
        <SectionCard
          title="Weekly Workouts"
          icon="🏋️‍♂️"
          type="weeklyWorkouts"
          currentValue={goals.weeklyWorkouts}
          description="Set how many workouts you want to complete each week."
        />

        {/* Weekly Duration */}
        <SectionCard
          title="Weekly Minutes"
          icon="⏱️"
          type="weeklyDuration"
          currentValue={goals.weeklyDuration}
          description="Track total minutes of exercise per week (cardio, strength, etc)."
        />

        {/* Daily Water */}
        <SectionCard
          title="Daily Water (glasses)"
          icon="💧"
          type="dailyWater"
          currentValue={goals.dailyWater}
          description="Stay hydrated! Set how many glasses of water you aim to drink per day."
        />

        {/* Monthly Workouts */}
        <SectionCard
          title="Monthly Workouts"
          icon="📅"
          type="monthlyWorkouts"
          currentValue={goals.monthlyWorkouts}
          description="Track how many total workouts you want to complete in a month."
        />

        {/* Motivation Tips */}
        <View
          style={[
            styles.tipsContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.tipsTitle, { color: colors.accent }]}>💡 Tips</Text>
          <Text style={[styles.tipText, { color: colors.text }]}>
            • Keep your goals realistic and achievable.
          </Text>
          <Text style={[styles.tipText, { color: colors.text }]}>
            • Adjust them as you improve each week.
          </Text>
          <Text style={[styles.tipText, { color: colors.text }]}>
            • Consistency beats intensity — small steps add up!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionIcon: { fontSize: 36, marginRight: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  sectionDesc: { fontSize: 14, marginBottom: 10 },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionLabel: { fontSize: 16, fontWeight: '600' },
  sectionValue: { fontSize: 20, fontWeight: 'bold' },
  editButton: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  tipsContainer: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  tipsTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  tipText: { fontSize: 14, lineHeight: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default GoalsScreen;
