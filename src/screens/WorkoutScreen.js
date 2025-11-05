// src/screens/WorkoutScreen.js - Updated with Edit/Delete functionality
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useFocusEffect } from "@react-navigation/native";
import NotificationService from "../services/NotificationService";

// In your complete workout function:
const completeWorkout = async () => {
  // Your existing code for completing workout...

  // ADD THIS:
  const streak = await NotificationService.updateWorkoutStreak();
  console.log(`Streak: ${streak} days`);
};

const WorkoutScreen = ({ navigation }) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh workouts when screen comes into focus (after adding/editing a workout)
  useFocusEffect(
    React.useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const workoutsQuery = query(
        collection(db, "workouts"),
        where("userId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(workoutsQuery);

      const workoutList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort in JavaScript instead of Firestore
      workoutList.sort((a, b) => {
        const dateA =
          a.createdAt?.toDate?.() || new Date(a.createdAt || Date.now());
        const dateB =
          b.createdAt?.toDate?.() || new Date(b.createdAt || Date.now());
        return dateB - dateA; // Most recent first
      });

      setWorkouts(workoutList);
    } catch (error) {
      console.error("Error fetching workouts:", error);
      Alert.alert("Error", "Failed to load workouts");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkouts();
    setRefreshing(false);
  };

  const navigateToAddWorkout = () => {
    navigation.navigate("AddWorkout");
  };

  const navigateToEditWorkout = (workout) => {
    navigation.navigate("EditWorkout", { mode: "edit", workout });
  };

  const deleteWorkout = (workout) => {
    Alert.alert(
      "Delete Workout",
      `Are you sure you want to delete "${workout.exercise}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "workouts", workout.id));
              Alert.alert("Success", "Workout deleted successfully!");
              fetchWorkouts(); // Refresh the list
            } catch (error) {
              console.error("Error deleting workout:", error);
              Alert.alert("Error", "Failed to delete workout");
            }
          },
        },
      ]
    );
  };

  const getWorkoutTypeColor = (type) => {
    switch (type) {
      case "strength":
        return "#FF6B6B";
      case "cardio":
        return "#4ECDC4";
      case "flexibility":
        return "#45B7D1";
      default:
        return "#007AFF";
    }
  };

  const renderWorkoutDetails = (workout) => {
    const details = [];

    // Always show duration
    details.push(
      <View key="duration" style={styles.workoutDetailItem}>
        <Text style={styles.workoutDetailLabel}>Duration:</Text>
        <Text style={styles.workoutDetailValue}>{workout.duration} min</Text>
      </View>
    );

    // Show detected fields from dynamic form
    if (workout.detectedFields) {
      Object.entries(workout.detectedFields).forEach(([field, value]) => {
        if (value !== null && value !== undefined) {
          const label = field
            .replace("_", " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
          let displayValue = value;

          // Add appropriate units based on field type
          if (field === "distance") displayValue += " km";
          else if (field === "pace") displayValue += " min/km";
          else if (field === "speed") displayValue += " km/h";
          else if (field === "calories") displayValue += " kcal";
          else if (field === "weight") displayValue += " kg";
          else if (field === "sets") displayValue += " sets";
          else if (field === "reps") displayValue += " reps";
          else if (field === "steps") displayValue += " steps";
          else if (field === "strokes") displayValue += " strokes";
          else if (field === "hold_time") displayValue += " sec";
          else if (field === "poses") displayValue += " poses";
          else if (field === "muscle_groups") displayValue += " groups";
          else if (field === "points") displayValue += " pts";
          else if (field === "goals") displayValue += " goals";
          else if (field === "assists") displayValue += " assists";

          details.push(
            <View key={field} style={styles.workoutDetailItem}>
              <Text style={styles.workoutDetailLabel}>{label}:</Text>
              <Text style={styles.workoutDetailValue}>{displayValue}</Text>
            </View>
          );
        }
      });
    }

    // Legacy fields support (for old workouts)
    if (workout.sets && !workout.detectedFields?.sets) {
      details.push(
        <View key="sets" style={styles.workoutDetailItem}>
          <Text style={styles.workoutDetailLabel}>Sets:</Text>
          <Text style={styles.workoutDetailValue}>{workout.sets}</Text>
        </View>
      );
    }

    if (workout.reps && !workout.detectedFields?.reps) {
      details.push(
        <View key="reps" style={styles.workoutDetailItem}>
          <Text style={styles.workoutDetailLabel}>Reps:</Text>
          <Text style={styles.workoutDetailValue}>{workout.reps}</Text>
        </View>
      );
    }

    if (workout.weight && !workout.detectedFields?.weight) {
      details.push(
        <View key="weight" style={styles.workoutDetailItem}>
          <Text style={styles.workoutDetailLabel}>Weight:</Text>
          <Text style={styles.workoutDetailValue}>{workout.weight} kg</Text>
        </View>
      );
    }

    return details;
  };

  const WorkoutCard = ({ workout }) => {
    // Safe date handling
    const workoutDate = workout.createdAt?.toDate?.()
      ? new Date(workout.createdAt.toDate())
      : new Date(workout.createdAt || Date.now());

    return (
      <View style={styles.workoutCard}>
        <View style={styles.workoutHeader}>
          <Text style={styles.workoutExercise}>{workout.exercise}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigateToEditWorkout(workout)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteWorkout(workout)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.workoutSubHeader}>
          <View
            style={[
              styles.workoutTypeBadge,
              { backgroundColor: getWorkoutTypeColor(workout.type) },
            ]}
          >
            <Text style={styles.workoutType}>{workout.type}</Text>
          </View>
          {/* Show additional badge if workout has special fields */}
          {workout.detectedFields &&
            Object.keys(workout.detectedFields).length > 0 && (
              <View style={styles.smartBadge}>
                <Text style={styles.smartBadgeText}>SMART</Text>
              </View>
            )}
        </View>

        <View style={styles.workoutDetails}>
          {renderWorkoutDetails(workout)}
        </View>

        {workout.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.workoutNotes}>{workout.notes}</Text>
          </View>
        )}

        <Text style={styles.workoutDate}>
          {workoutDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {workout.updatedAt && " (edited)"}
        </Text>
      </View>
    );
  };

  const WorkoutStats = () => {
    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce(
      (sum, workout) => sum + (workout.duration || 0),
      0
    );

    const thisWeek = workouts.filter((workout) => {
      try {
        const workoutDate = workout.createdAt?.toDate?.()
          ? new Date(workout.createdAt.toDate())
          : new Date(workout.createdAt || Date.now());
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return workoutDate >= weekAgo;
      } catch (error) {
        console.warn("Error calculating workout date:", error);
        return false;
      }
    }).length;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalWorkouts}</Text>
          <Text style={styles.statLabel}>Total Workouts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {Math.round((totalDuration / 60) * 10) / 10}
          </Text>
          <Text style={styles.statLabel}>Hours Trained</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{thisWeek}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workouts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={navigateToAddWorkout}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Section */}
        {workouts.length > 0 && <WorkoutStats />}

        {/* Workouts List */}
        <View style={styles.workoutsList}>
          {workouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>💪</Text>
              <Text style={styles.emptyStateTitle}>No workouts yet</Text>
              <Text style={styles.emptyStateText}>
                Start your fitness journey by logging your first workout!
              </Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={navigateToAddWorkout}
              >
                <Text style={styles.startButtonText}>Log First Workout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            workouts.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    margin: 20,
    borderRadius: 8,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  workoutsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  workoutCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  workoutExercise: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  workoutSubHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  workoutTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workoutType: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  smartBadge: {
    backgroundColor: "#FF9500",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  smartBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  workoutDuration: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  workoutDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
    gap: 8,
  },
  workoutDetailItem: {
    flexDirection: "row",
    marginRight: 15,
    marginBottom: 4,
    minWidth: 80,
  },
  workoutDetailLabel: {
    color: "#666",
    fontSize: 14,
    marginRight: 5,
  },
  workoutDetailValue: {
    color: "#333",
    fontSize: 14,
    fontWeight: "600",
  },
  notesContainer: {
    marginBottom: 8,
  },
  workoutNotes: {
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
  },
  workoutDate: {
    color: "#999",
    fontSize: 12,
    textAlign: "right",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default WorkoutScreen;
