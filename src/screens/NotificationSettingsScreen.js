import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NotificationService from "../services/NotificationService";

const NotificationSettingsScreen = () => {
  const [workoutEnabled, setWorkoutEnabled] = useState(true);
  const [workoutTime, setWorkoutTime] = useState(new Date());
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);

  const [hydrationEnabled, setHydrationEnabled] = useState(true);
  const [hydrationInterval, setHydrationInterval] = useState(2);

  const [streakEnabled, setStreakEnabled] = useState(true);
  const [goalEnabled, setGoalEnabled] = useState(true);
  const [progressEnabled, setProgressEnabled] = useState(true);

  const [mealReminders, setMealReminders] = useState({
    breakfast: { enabled: false, time: new Date(2024, 0, 1, 8, 0) },
    lunch: { enabled: false, time: new Date(2024, 0, 1, 12, 0) },
    dinner: { enabled: false, time: new Date(2024, 0, 1, 18, 0) },
  });
  const [showMealPicker, setShowMealPicker] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem("notification_settings");
      if (settings) {
        const parsed = JSON.parse(settings);
        setWorkoutEnabled(parsed.workoutEnabled ?? true);
        setHydrationEnabled(parsed.hydrationEnabled ?? true);
        setStreakEnabled(parsed.streakEnabled ?? true);
        setGoalEnabled(parsed.goalEnabled ?? true);
        setProgressEnabled(parsed.progressEnabled ?? true);
        setHydrationInterval(parsed.hydrationInterval ?? 2);

        if (parsed.workoutTime) {
          setWorkoutTime(new Date(parsed.workoutTime));
        }

        if (parsed.mealReminders) {
          setMealReminders(parsed.mealReminders);
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSettings = async (updates) => {
    try {
      const currentSettings = {
        workoutEnabled,
        hydrationEnabled,
        streakEnabled,
        goalEnabled,
        progressEnabled,
        hydrationInterval,
        workoutTime: workoutTime.toISOString(),
        mealReminders,
        ...updates,
      };
      await AsyncStorage.setItem(
        "notification_settings",
        JSON.stringify(currentSettings)
      );
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const handleWorkoutToggle = async (value) => {
    setWorkoutEnabled(value);
    await saveSettings({ workoutEnabled: value });

    if (value) {
      await NotificationService.scheduleWorkoutReminder(
        workoutTime.getHours(),
        workoutTime.getMinutes()
      );
    } else {
      await NotificationService.cancelAllNotifications();
      // Re-enable other active notifications
      if (hydrationEnabled) {
        await NotificationService.scheduleHydrationReminders(
          8,
          22,
          hydrationInterval
        );
      }
    }
  };

  const handleWorkoutTimeChange = async (event, selectedTime) => {
    setShowWorkoutPicker(Platform.OS === "ios");

    if (selectedTime) {
      setWorkoutTime(selectedTime);
      await saveSettings({ workoutTime: selectedTime.toISOString() });

      if (workoutEnabled) {
        await NotificationService.scheduleWorkoutReminder(
          selectedTime.getHours(),
          selectedTime.getMinutes()
        );
      }
    }
  };

  const handleHydrationToggle = async (value) => {
    setHydrationEnabled(value);
    await saveSettings({ hydrationEnabled: value });

    if (value) {
      await NotificationService.scheduleHydrationReminders(
        8,
        22,
        hydrationInterval
      );
    }
  };

  const handleHydrationIntervalChange = async (interval) => {
    setHydrationInterval(interval);
    await saveSettings({ hydrationInterval: interval });

    if (hydrationEnabled) {
      await NotificationService.scheduleHydrationReminders(8, 22, interval);
    }
  };

  const handleMealToggle = async (mealType, value) => {
    const updated = {
      ...mealReminders,
      [mealType]: { ...mealReminders[mealType], enabled: value },
    };
    setMealReminders(updated);
    await saveSettings({ mealReminders: updated });

    if (value) {
      const time = updated[mealType].time;
      await NotificationService.scheduleMealReminder(
        mealType,
        time.getHours(),
        time.getMinutes()
      );
    }
  };

  const handleMealTimeChange = async (mealType, event, selectedTime) => {
    setShowMealPicker(null);

    if (selectedTime) {
      const updated = {
        ...mealReminders,
        [mealType]: { ...mealReminders[mealType], time: selectedTime },
      };
      setMealReminders(updated);
      await saveSettings({ mealReminders: updated });

      if (updated[mealType].enabled) {
        await NotificationService.scheduleMealReminder(
          mealType,
          selectedTime.getHours(),
          selectedTime.getMinutes()
        );
      }
    }
  };

  const SettingRow = ({
    title,
    description,
    value,
    onValueChange,
    showTime,
    onTimePress,
  }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
        {showTime && (
          <TouchableOpacity onPress={onTimePress} style={styles.timeButton}>
            <Text style={styles.timeText}>
              {showTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#767577", true: "#4CAF50" }}
        thumbColor={value ? "#fff" : "#f4f3f4"}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💪 Workout Reminders</Text>
        <SettingRow
          title="Daily Workout Reminder"
          description="Get notified at your preferred time"
          value={workoutEnabled}
          onValueChange={handleWorkoutToggle}
          showTime={workoutEnabled ? workoutTime : null}
          onTimePress={() => setShowWorkoutPicker(true)}
        />

        {showWorkoutPicker && (
          <DateTimePicker
            value={workoutTime}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={handleWorkoutTimeChange}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💧 Hydration Reminders</Text>
        <SettingRow
          title="Hydration Notifications"
          description="Regular reminders to stay hydrated"
          value={hydrationEnabled}
          onValueChange={handleHydrationToggle}
        />

        {hydrationEnabled && (
          <View style={styles.intervalContainer}>
            <Text style={styles.intervalLabel}>Reminder Interval</Text>
            <View style={styles.intervalButtons}>
              {[1, 2, 3, 4].map((interval) => (
                <TouchableOpacity
                  key={interval}
                  style={[
                    styles.intervalButton,
                    hydrationInterval === interval &&
                      styles.intervalButtonActive,
                  ]}
                  onPress={() => handleHydrationIntervalChange(interval)}
                >
                  <Text
                    style={[
                      styles.intervalButtonText,
                      hydrationInterval === interval &&
                        styles.intervalButtonTextActive,
                    ]}
                  >
                    {interval}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🍽️ Meal Reminders</Text>

        {Object.entries(mealReminders).map(([mealType, meal]) => (
          <View key={mealType}>
            <SettingRow
              title={`${
                mealType.charAt(0).toUpperCase() + mealType.slice(1)
              } Reminder`}
              value={meal.enabled}
              onValueChange={(value) => handleMealToggle(mealType, value)}
              showTime={meal.enabled ? meal.time : null}
              onTimePress={() => setShowMealPicker(mealType)}
            />

            {showMealPicker === mealType && (
              <DateTimePicker
                value={meal.time}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={(event, time) =>
                  handleMealTimeChange(mealType, event, time)
                }
              />
            )}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Motivation & Progress</Text>
        <SettingRow
          title="Streak Alerts"
          description="Don't break your workout streak!"
          value={streakEnabled}
          onValueChange={(value) => {
            setStreakEnabled(value);
            saveSettings({ streakEnabled: value });
          }}
        />
        <SettingRow
          title="Goal Achievements"
          description="Celebrate when you reach your goals"
          value={goalEnabled}
          onValueChange={(value) => {
            setGoalEnabled(value);
            saveSettings({ goalEnabled: value });
          }}
        />
        <SettingRow
          title="Progress Milestones"
          description="Track important fitness milestones"
          value={progressEnabled}
          onValueChange={(value) => {
            setProgressEnabled(value);
            saveSettings({ progressEnabled: value });
          }}
        />
      </View>

      <TouchableOpacity
        style={styles.testButton}
        onPress={async () => {
          await NotificationService.sendProgressMilestone(
            "Test notification! Your settings are working perfectly. 🎉"
          );
        }}
      >
        <Text style={styles.testButtonText}>Send Test Notification</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  section: {
    backgroundColor: "#fff",
    marginVertical: 8,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: "#666",
  },
  timeButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#4CAF50",
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  timeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  intervalContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  intervalLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  intervalButtons: {
    flexDirection: "row",
    gap: 8,
  },
  intervalButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  intervalButtonActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#45a049",
  },
  intervalButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  intervalButtonTextActive: {
    color: "#fff",
  },
  testButton: {
    backgroundColor: "#2196F3",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  testButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default NotificationSettingsScreen;
