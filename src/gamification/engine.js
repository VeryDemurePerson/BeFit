// src/gamification/engine.js
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export const LEVELS = [
  { name: 'Bronze', minXP: 0 },
  { name: 'Silver', minXP: 500 },
  { name: 'Gold', minXP: 1500 },
  { name: 'Platinum', minXP: 4000 },
];

// XP rewards
export const XP_RULES = {
  workout: () => 50,
  water: () => 5,
  meal: () => 15,
};

const userRef = (uid) => doc(db, 'users', uid);

export async function ensureGamification(uid) {
  const ref = userRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      xp: 0,
      levelName: 'Bronze',
      streaks: { workout: 0, meal: 0, water: 0 },
      badges: {},
      lastActivity: {},
      totalWorkouts: 0,
      totalMeals: 0,
      totalWater: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export function levelFromXP(xp) {
  return LEVELS.filter(l => xp >= l.minXP).pop().name;
}

async function updateStreak(uid, cat) {
  const ref = userRef(uid);
  const s = await getDoc(ref);
  const d = s.data() || {};
  const today = new Date().toISOString().split('T')[0];
  const last = d.lastActivity?.[cat];
  let streak = (d.streaks?.[cat] || 0);
  streak = last === today ? streak : (last ? streak + 1 : 1);
  await updateDoc(ref, {
    [`streaks.${cat}`]: streak,
    [`lastActivity.${cat}`]: today,
    updatedAt: serverTimestamp(),
  });
  return streak;
}

async function awardXP(uid, amt) {
  const ref = userRef(uid);
  const s = await getDoc(ref);
  const xp = (s.data()?.xp || 0) + amt;
  const lvl = levelFromXP(xp);
  await updateDoc(ref, { xp, levelName: lvl, updatedAt: serverTimestamp() });
  return { xp, lvl };
}

/* ------------------ BADGE LOGIC ------------------ */
const BADGES = {
  FIRST_WORKOUT: 'First Workout ✅',
  FIRST_MEAL: 'First Meal 🍽️',
  FIRST_WATER: 'First Water 💧',

  HYDRATION_HERO: '3 Glasses of Water 💦',
  WATER_MASTER: '10 Glasses in a Day 🚰',

  DOUBLE_LOG: 'Two Logs in a Row ✌️',
  TRIPLE_LOG: 'Three Logs in a Row 💥',

  EARLY_BIRD: 'Workout Before 7am 🌅',
  NIGHT_OWL: 'Workout After 8pm 🌙',

  STREAK_3: '3-Day Streak 🔥',
  STREAK_7: '7-Day Streak 🏅',

  GOAL_CRUSHER: 'Reached a Goal 🎯',
  QUICK_START: 'Logged Something in First 5 Minutes ⏱️',
  TEST_MASTER: 'Unlocked 5 Badges 🧩',

  PRESENTATION_PRO: 'Unlocked 8 Badges in One Demo 🏆'
};

async function maybeAwardBadges(uid, category) {
  const ref = userRef(uid);
  const s = await getDoc(ref);
  const d = s.data() || {};
  const owned = d.badges || {};
  const toAdd = {};
  const hour = new Date().getHours();

  // First-time badges
  if (category === 'workout' && !owned.FIRST_WORKOUT) toAdd.FIRST_WORKOUT = true;
  if (category === 'meal' && !owned.FIRST_MEAL) toAdd.FIRST_MEAL = true;
  if (category === 'water' && !owned.FIRST_WATER) toAdd.FIRST_WATER = true;

  // Quick demo badges
  if ((d.totalWater || 0) >= 3 && !owned.HYDRATION_HERO) toAdd.HYDRATION_HERO = true;
  if ((d.totalWater || 0) >= 10 && !owned.WATER_MASTER) toAdd.WATER_MASTER = true;

  if ((d.totalWorkouts || 0) >= 2 && !owned.DOUBLE_LOG) toAdd.DOUBLE_LOG = true;
  if ((d.totalWorkouts || 0) >= 3 && !owned.TRIPLE_LOG) toAdd.TRIPLE_LOG = true;

  // Time-based badges
  if (hour < 7 && !owned.EARLY_BIRD) toAdd.EARLY_BIRD = true;
  if (hour >= 20 && !owned.NIGHT_OWL) toAdd.NIGHT_OWL = true;

  // Streak badges
  const w = d.streaks?.workout || 0;
  if (w >= 3 && !owned.STREAK_3) toAdd.STREAK_3 = true;
  if (w >= 7 && !owned.STREAK_7) toAdd.STREAK_7 = true;

  // Quick start badge
  const created = d.createdAt?.toDate ? d.createdAt.toDate() : new Date();
  const minutesSince = (Date.now() - created.getTime()) / 60000;
  if (minutesSince <= 5 && !owned.QUICK_START) toAdd.QUICK_START = true;

  // Meta badges
  const newCount = Object.keys(owned).length + Object.keys(toAdd).length;
  if (newCount >= 5 && !owned.TEST_MASTER) toAdd.TEST_MASTER = true;
  if (newCount >= 8 && !owned.PRESENTATION_PRO) toAdd.PRESENTATION_PRO = true;

  // Apply any new badges
  if (Object.keys(toAdd).length) {
    const patch = {};
    Object.keys(toAdd).forEach(k => patch[`badges.${k}`] = true);
    await updateDoc(ref, patch);
  }
  return Object.keys(toAdd).map(k => BADGES[k]);
}

/* ------------------ TRACKING FUNCTIONS ------------------ */
export async function recordWorkoutGamification(uid) {
  await ensureGamification(uid);
  await updateDoc(userRef(uid), { totalWorkouts: increment(1) });
  const streak = await updateStreak(uid, 'workout');
  await awardXP(uid, XP_RULES.workout());
  await maybeAwardBadges(uid, 'workout');
  return streak;
}

export async function recordMealGamification(uid) {
  await ensureGamification(uid);
  await updateDoc(userRef(uid), { totalMeals: increment(1) });
  await updateStreak(uid, 'meal');
  await awardXP(uid, XP_RULES.meal());
  await maybeAwardBadges(uid, 'meal');
}

export async function recordWaterGamification(uid) {
  await ensureGamification(uid);
  await updateDoc(userRef(uid), { totalWater: increment(1) });
  await updateStreak(uid, 'water');
  await awardXP(uid, XP_RULES.water());
  await maybeAwardBadges(uid, 'water');
}

export async function readGamification(uid) {
  const s = await getDoc(userRef(uid));
  return s.data() || {};
}
