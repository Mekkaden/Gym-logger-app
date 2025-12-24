import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { Exercise, Set, Workout } from "../types/workout";
import { loadWorkout, saveExercise, getWorkoutsForExercise } from "../services/storage";
import { validateWeight, validateReps, validateRIR } from "../utils/validation";
import { SetRow } from "../components/SetRow";
import { RestTimer } from "../components/RestTimer";
import { formatDate, parseDate } from "../utils/date";
import { estimate1RM } from "../utils/1rm";
import { Colors } from "../theme/colors";
import Svg, { Polyline, Circle } from "react-native-svg";

interface ExerciseDetailProps {
  exercise: Exercise;
  date: string;
  onBack: () => void;
}

type Tab = "track" | "history" | "graph";

export function ExerciseDetail({ exercise, date, onBack }: ExerciseDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>("track");
  const [currentExercise, setCurrentExercise] = useState<Exercise>(exercise);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rir, setRIR] = useState("");
  const [notes, setNotes] = useState(exercise.notes || "");
  const [historyWorkouts, setHistoryWorkouts] = useState<Workout[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [graphTimeFilter, setGraphTimeFilter] = useState<"1m" | "3m" | "6m" | "1y" | "all">("all");

  useEffect(() => {
    loadExerciseData();
  }, [exercise.id, date]);

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab, exercise.id]);

  useEffect(() => {
    if (activeTab === "graph") {
      loadHistory();
    }
  }, [activeTab, exercise.id, graphTimeFilter]);

  const loadExerciseData = async () => {
    const workout = await loadWorkout(date);
    if (workout) {
      const found = workout.exercises.find((e) => e.id === exercise.id);
      if (found) {
        setCurrentExercise(found);
        setNotes(found.notes || "");
      }
    }
  };

  const handleSaveNotes = async () => {
    const updatedExercise: Exercise = {
      ...currentExercise,
      notes: notes.trim(),
    };
    const success = await saveExercise(date, updatedExercise);
    if (success) {
      setCurrentExercise(updatedExercise);
    }
  };

  const handleAddSet = async () => {
    const validWeight = validateWeight(weight);
    const validReps = validateReps(reps);
    const validRIR = rir.trim() ? validateRIR(rir) : undefined;

    if (validWeight === null) {
      Alert.alert("Invalid Input", "Please enter a valid weight (0-1000 kg)");
      return;
    }

    if (validReps === null) {
      Alert.alert("Invalid Input", "Please enter valid reps (1-1000)");
      return;
    }

    if (rir.trim() && validRIR === null) {
      Alert.alert("Invalid Input", "RIR must be between 0 and 10");
      return;
    }

    const newSet: Set = {
      weight: validWeight,
      reps: validReps,
      rir: validRIR,
    };

    const updatedExercise: Exercise = {
      ...currentExercise,
      sets: [...currentExercise.sets, newSet],
    };

    const success = await saveExercise(date, updatedExercise);
    if (success) {
      setCurrentExercise(updatedExercise);
      setWeight("");
      setReps("");
      setRIR("");
      // Auto-save notes if changed
      if (notes.trim() !== (currentExercise.notes || "")) {
        handleSaveNotes();
      }
    } else {
      Alert.alert("Error", "Failed to save set");
    }
  };

  const handleRemoveSet = async (index: number) => {
    const updatedSets = currentExercise.sets.filter((_, i) => i !== index);
    const updatedExercise: Exercise = {
      ...currentExercise,
      sets: updatedSets,
    };

    const success = await saveExercise(date, updatedExercise);
    if (success) {
      setCurrentExercise(updatedExercise);
    } else {
      Alert.alert("Error", "Failed to remove set");
    }
  };

  const handleClear = () => {
    Alert.alert(
      "Clear All Sets",
      "Are you sure you want to clear all sets?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            const updatedExercise: Exercise = {
              ...currentExercise,
              sets: [],
            };
            const success = await saveExercise(date, updatedExercise);
            if (success) {
              setCurrentExercise(updatedExercise);
            }
          },
        },
      ]
    );
  };

  const adjustWeight = (delta: number) => {
    const current = parseFloat(weight) || 0;
    const newWeight = Math.max(0, current + delta);
    setWeight(newWeight.toString());
  };

  const adjustReps = (delta: number) => {
    const current = parseInt(reps, 10) || 0;
    const newReps = Math.max(1, current + delta);
    setReps(newReps.toString());
  };

  const adjustRIR = (delta: number) => {
    const current = parseInt(rir, 10) || 0;
    const newRIR = Math.max(0, Math.min(10, current + delta));
    setRIR(newRIR.toString());
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const workouts = await getWorkoutsForExercise(exercise.id);
      // Sort by date descending (most recent first)
      workouts.sort((a, b) => b.date.localeCompare(a.date));
      setHistoryWorkouts(workouts);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const renderHistorySession = (workout: Workout) => {
    const exerciseData = workout.exercises.find((e) => e.id === exercise.id);
    if (!exerciseData || exerciseData.sets.length === 0) return null;

    const dateObj = parseDate(workout.date);
    const isToday = workout.date === date;

    return (
      <View key={workout.date} style={styles.historySession}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyDate}>
            {isToday ? "Today" : formatDate(dateObj)}
          </Text>
          <Text style={styles.historySetCount}>
            {exerciseData.sets.length} set{exerciseData.sets.length !== 1 ? "s" : ""}
          </Text>
        </View>
        {exerciseData.sets.map((set, index) => (
          <View key={index} style={styles.historySet}>
            <Text style={styles.historySetText}>
              {set.weight}kg × {set.reps}
              {set.rir !== undefined && ` @ ${set.rir} RIR`}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const getGraphData = () => {
    const now = new Date();
    const filterDate = new Date();
    
    switch (graphTimeFilter) {
      case "1m":
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case "3m":
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case "6m":
        filterDate.setMonth(now.getMonth() - 6);
        break;
      case "1y":
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      case "all":
        filterDate.setFullYear(2000); // Very old date
        break;
    }

    const filtered = historyWorkouts.filter((w) => {
      const workoutDate = parseDate(w.date);
      return workoutDate >= filterDate;
    });

    const dataPoints: Array<{ date: Date; max1RM: number }> = [];

    filtered.forEach((workout) => {
      const exerciseData = workout.exercises.find((e) => e.id === exercise.id);
      if (!exerciseData || exerciseData.sets.length === 0) return;

      // Find max 1RM for this session
      let max1RM = 0;
      exerciseData.sets.forEach((set) => {
        const rm = estimate1RM(set.weight, set.reps);
        if (rm > max1RM) {
          max1RM = rm;
        }
      });

      if (max1RM > 0) {
        dataPoints.push({
          date: parseDate(workout.date),
          max1RM,
        });
      }
    });

    // Sort by date ascending
    dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());

    return dataPoints;
  };

  const renderGraph = () => {
    const dataPoints = getGraphData();

    if (dataPoints.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No data to display</Text>
        </View>
      );
    }

    const chartWidth = 300;
    const chartHeight = 200;
    const padding = 40;

    const max1RM = Math.max(...dataPoints.map((d) => d.max1RM));
    const min1RM = Math.min(...dataPoints.map((d) => d.max1RM));
    const range = max1RM - min1RM || 1; // Avoid division by zero
    const divisor = dataPoints.length > 1 ? dataPoints.length - 1 : 1; // Avoid division by zero

    const points = dataPoints.map((point, index) => {
      const x = padding + (index / divisor) * (chartWidth - 2 * padding);
      const y = chartHeight - padding - ((point.max1RM - min1RM) / range) * (chartHeight - 2 * padding);
      return `${x},${y}`;
    }).join(" ");

    return (
      <View style={styles.graphContainer}>
        <View style={styles.graphHeader}>
          <Text style={styles.graphTitle}>Estimated 1RM</Text>
          <Text style={styles.graphSubtitle}>
            Max: {max1RM.toFixed(1)}kg | Min: {min1RM.toFixed(1)}kg
          </Text>
        </View>
        <View style={styles.chartContainer}>
          <Svg width={chartWidth} height={chartHeight}>
            <Polyline
              points={points}
              fill="none"
              stroke={Colors.accent}
              strokeWidth="2"
            />
            {dataPoints.map((point, index) => {
              const x = padding + (index / (dataPoints.length - 1 || 1)) * (chartWidth - 2 * padding);
              const y = chartHeight - padding - ((point.max1RM - min1RM) / range) * (chartHeight - 2 * padding);
              return (
                <Circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={Colors.accent}
                />
              );
            })}
          </Svg>
        </View>
        <View style={styles.graphDataList}>
          {dataPoints.map((point, index) => (
            <View key={index} style={styles.graphDataPoint}>
              <Text style={styles.graphDataDate}>{formatDate(point.date)}</Text>
              <Text style={styles.graphDataValue}>{point.max1RM.toFixed(1)}kg</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{currentExercise.name}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "track" && styles.activeTab]}
          onPress={() => setActiveTab("track")}
        >
          <Text style={[styles.tabText, activeTab === "track" && styles.activeTabText]}>
            Track
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
          onPress={() => setActiveTab("history")}
        >
          <Text style={[styles.tabText, activeTab === "history" && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "graph" && styles.activeTab]}
          onPress={() => setActiveTab("graph")}
        >
          <Text style={[styles.tabText, activeTab === "graph" && styles.activeTabText]}>
            Graph
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "track" && (
        <ScrollView style={styles.content}>
          <View style={styles.inputSection}>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Weight (kg)</Text>
              <View style={styles.inputControls}>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustWeight(-5)}
                >
                  <Text style={styles.adjustButtonText}>-5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustWeight(-2.5)}
                >
                  <Text style={styles.adjustButtonText}>-2.5</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustWeight(2.5)}
                >
                  <Text style={styles.adjustButtonText}>+2.5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustWeight(5)}
                >
                  <Text style={styles.adjustButtonText}>+5</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>Reps</Text>
              <View style={styles.inputControls}>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustReps(-5)}
                >
                  <Text style={styles.adjustButtonText}>-5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustReps(-1)}
                >
                  <Text style={styles.adjustButtonText}>-1</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  value={reps}
                  onChangeText={setReps}
                  placeholder="0"
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustReps(1)}
                >
                  <Text style={styles.adjustButtonText}>+1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustReps(5)}
                >
                  <Text style={styles.adjustButtonText}>+5</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>RIR (optional)</Text>
              <View style={styles.inputControls}>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustRIR(-1)}
                >
                  <Text style={styles.adjustButtonText}>-1</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  value={rir}
                  onChangeText={setRIR}
                  placeholder="0"
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustRIR(1)}
                >
                  <Text style={styles.adjustButtonText}>+1</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleAddSet}
              >
                <Text style={styles.saveButtonText}>SAVE SET</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.clearButton]}
                onPress={handleClear}
              >
                <Text style={styles.clearButtonText}>CLEAR ALL</Text>
              </TouchableOpacity>
            </View>
          </View>

          <RestTimer />

          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>NOTES</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Form cues, PRs, pain, mindset..."
              placeholderTextColor={Colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              onBlur={handleSaveNotes}
            />
            <Text style={styles.notesHint}>Auto-saves when you leave this field</Text>
          </View>

          <View style={styles.setsSection}>
            <Text style={styles.sectionTitle}>Today's Sets</Text>
            {currentExercise.sets.length === 0 ? (
              <Text style={styles.emptyText}>No sets recorded yet</Text>
            ) : (
              currentExercise.sets.map((set, index) => (
                <SetRow
                  key={index}
                  set={set}
                  index={index}
                  onRemove={() => handleRemoveSet(index)}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}

      {activeTab === "history" && (
        <ScrollView style={styles.content}>
          {loadingHistory ? (
            <View style={styles.centerContainer}>
              <Text style={styles.loadingText}>Loading history...</Text>
            </View>
          ) : historyWorkouts.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No previous sessions found</Text>
            </View>
          ) : (
            <View style={styles.historyContainer}>
              {historyWorkouts.map((workout) => renderHistorySession(workout))}
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === "graph" && (
        <ScrollView style={styles.content}>
          {loadingHistory ? (
            <View style={styles.centerContainer}>
              <Text style={styles.loadingText}>Loading graph data...</Text>
            </View>
          ) : (
            <>
              <View style={styles.timeFilterContainer}>
                {(["1m", "3m", "6m", "1y", "all"] as const).map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.timeFilterButton,
                      graphTimeFilter === filter && styles.timeFilterButtonActive,
                    ]}
                    onPress={() => setGraphTimeFilter(filter)}
                  >
                    <Text
                      style={[
                        styles.timeFilterText,
                        graphTimeFilter === filter && styles.timeFilterTextActive,
                      ]}
                    >
                      {filter === "all" ? "All" : filter.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {renderGraph()}
            </>
          )}
        </ScrollView>
      )}
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
  tabs: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent,
  },
  tabText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: Colors.accent,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  inputSection: {
    backgroundColor: Colors.card,
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputRow: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 1,
  },
  inputControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  adjustButton: {
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 6,
    minWidth: 56,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adjustButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    padding: 12,
    fontSize: 18,
    textAlign: "center",
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: Colors.accent,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  saveButtonText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  clearButton: {
    backgroundColor: Colors.error,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  clearButtonText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  notesSection: {
    backgroundColor: Colors.card,
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    padding: 12,
    fontSize: 13,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    minHeight: 80,
    textAlignVertical: "top",
  },
  notesHint: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 6,
    fontStyle: "italic",
  },
  setsSection: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 1,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontStyle: "italic",
    textAlign: "center",
    padding: 32,
    letterSpacing: 0.5,
  },
  comingSoon: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  historyContainer: {
    padding: 16,
  },
  historySession: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  historySetCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  historySet: {
    paddingVertical: 6,
  },
  historySetText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  timeFilterContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  timeFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeFilterButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accentLight,
  },
  timeFilterText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  timeFilterTextActive: {
    color: Colors.textPrimary,
  },
  graphContainer: {
    backgroundColor: Colors.card,
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  graphHeader: {
    marginBottom: 16,
  },
  graphTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  graphSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  chartContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  graphDataList: {
    marginTop: 16,
  },
  graphDataPoint: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  graphDataDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  graphDataValue: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
});

