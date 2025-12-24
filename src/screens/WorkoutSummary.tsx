import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { loadWorkout } from "../services/storage";
import { Workout } from "../types/workout";
import { formatDate, parseDate } from "../utils/date";
import { Colors } from "../theme/colors";

interface WorkoutSummaryProps {
  date: string;
  onBack: () => void;
}

export function WorkoutSummary({ date, onBack }: WorkoutSummaryProps) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, [date]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await loadWorkout(date);
      setWorkout(data);
    } catch (error) {
      console.error("Error loading summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = (): string => {
    if (!workout || workout.exercises.length === 0) {
      return "No workout recorded for this day.";
    }

    const lines: string[] = [];
    
    workout.exercises.forEach((exercise) => {
      if (exercise.sets.length === 0) {
        lines.push(`${exercise.name} - No sets`);
        return;
      }

      // Find sets with RIR
      const setsWithRIR = exercise.sets.filter((set) => set.rir !== undefined);
      
      if (setsWithRIR.length > 0) {
        // Show RIR notes
        const rirNotes = setsWithRIR.map((set) => {
          const setInfo = `${set.weight}kg × ${set.reps}`;
          return `${setInfo} @ ${set.rir} RIR`;
        });
        lines.push(`${exercise.name} - ${rirNotes.join(", ")}`);
      } else {
        // Just show exercise name and set count
        const setCount = exercise.sets.length;
        lines.push(`${exercise.name} - ${setCount} set${setCount !== 1 ? "s" : ""}`);
      }
    });

    return lines.join("\n");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Summary</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const dateObj = parseDate(date);
  const summaryText = generateSummary();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Summary</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.dateText}>{formatDate(dateObj)}</Text>
          <Text style={styles.summaryText}>{summaryText}</Text>
        </View>

        {workout && workout.exercises.length > 0 && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Exercise Details</Text>
            {workout.exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseDetail}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                {exercise.sets.length === 0 ? (
                  <Text style={styles.emptySets}>No sets</Text>
                ) : (
                  exercise.sets.map((set, index) => (
                    <View key={index} style={styles.setDetail}>
                      <Text style={styles.setText}>
                        Set {index + 1}: {set.weight}kg × {set.reps}
                        {set.rir !== undefined && ` @ ${set.rir} RIR`}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontWeight: "500",
  },
  detailsCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  exerciseDetail: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  emptySets: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontStyle: "italic",
  },
  setDetail: {
    marginBottom: 4,
  },
  setText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
});

