import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { ExerciseCard } from "../components/ExerciseCard";
import { RestTimer } from "../components/RestTimer";
import { ExerciseSearch } from "../components/ExerciseSearch";
import { loadWorkout, saveWorkout, saveExercise, removeExercise } from "../services/storage";
import { getTodayDate, formatDate } from "../utils/date";
import { generateId } from "../utils/uuid";
import { Workout, Exercise } from "../types/workout";
import { COMMON_EXERCISES } from "../utils/commonExercises";
import { Colors } from "../theme/colors";
import { calculateDailyProgress, getProgressColor } from "../utils/progress";

interface DailyWorkoutProps {
  date?: string;
  onExercisePress: (exercise: Exercise, date: string) => void;
  onDateChange?: (date: string) => void;
  navigation?: any;
}

export function DailyWorkout({ date, onExercisePress, onDateChange, navigation }: DailyWorkoutProps) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [selectedCommonExercise, setSelectedCommonExercise] = useState<string>("");
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const currentDate = date || getTodayDate();
  const progress = calculateDailyProgress(workout);

  useEffect(() => {
    loadWorkoutData();
  }, [currentDate]);

  const loadWorkoutData = async () => {
    setLoading(true);
    try {
      let data = await loadWorkout(currentDate);
      
      if (!data) {
        data = {
          date: currentDate,
          exercises: [],
        };
        await saveWorkout(data);
      }
      
      setWorkout(data);
      
      if (onDateChange) {
        onDateChange(currentDate);
      }
    } catch (error) {
      console.error("Error loading workout:", error);
      Alert.alert("Error", "Failed to load workout");
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = async (exerciseName?: string) => {
    let name = exerciseName || "";
    
    if (!name) {
      if (useCustomInput) {
        name = newExerciseName.trim();
      } else {
        name = selectedCommonExercise;
      }
    }
    
    if (!name) {
      Alert.alert("Error", "Please select or enter an exercise name");
      return;
    }

    if (!workout) return;

    const newExercise: Exercise = {
      id: generateId(),
      name: name,
      sets: [],
    };

    const success = await saveExercise(currentDate, newExercise);
    if (success) {
      setWorkout({
        ...workout,
        exercises: [...workout.exercises, newExercise],
      });
      setNewExerciseName("");
      setSelectedCommonExercise("");
      setUseCustomInput(false);
      setShowAddExercise(false);
      setShowSearch(false);
    } else {
      Alert.alert("Error", "Failed to save exercise");
    }
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    Alert.alert(
      "Remove Exercise",
      "Are you sure you want to remove this exercise?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const success = await removeExercise(currentDate, exerciseId);
            if (success && workout) {
              setWorkout({
                ...workout,
                exercises: workout.exercises.filter((e) => e.id !== exerciseId),
              });
            } else {
              Alert.alert("Error", "Failed to remove exercise");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load workout</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(new Date(currentDate))}</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progress}%`, backgroundColor: getProgressColor(progress) }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{progress}%</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            {navigation && (
              <>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => navigation.navigate("Calendar")}
                >
                  <Text style={styles.navButtonText}>📅</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => navigation.navigate("WorkoutSummary", { date: currentDate })}
                >
                  <Text style={styles.navButtonText}>📊</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => navigation.navigate("Settings")}
                >
                  <Text style={styles.navButtonText}>⚙️</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowSearch(!showSearch)}
        >
          <Text style={styles.addButtonText}>+ ADD EXERCISE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {showSearch && (
          <ExerciseSearch
            onSelect={(name) => handleAddExercise(name)}
            onClose={() => setShowSearch(false)}
          />
        )}

        <RestTimer />

        {workout.exercises.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>NO EXERCISES YET</Text>
            <Text style={styles.emptySubtext}>Tap "+ ADD EXERCISE" to get started</Text>
          </View>
        ) : (
          workout.exercises.map((item) => (
            <ExerciseCard
              key={item.id}
              exercise={item}
              onPress={() => onExercisePress(item, currentDate)}
              onRemove={() => handleRemoveExercise(item.id)}
            />
          ))
        )}
      </ScrollView>

      <Modal
        visible={showAddExercise}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAddExercise(false);
          setNewExerciseName("");
          setSelectedCommonExercise("");
          setUseCustomInput(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ADD EXERCISE</Text>
            
            <View style={styles.inputModeToggle}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  !useCustomInput && styles.modeButtonActive,
                ]}
                onPress={() => setUseCustomInput(false)}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    !useCustomInput && styles.modeButtonTextActive,
                  ]}
                >
                  SELECT
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  useCustomInput && styles.modeButtonActive,
                ]}
                onPress={() => setUseCustomInput(true)}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    useCustomInput && styles.modeButtonTextActive,
                  ]}
                >
                  CUSTOM
                </Text>
              </TouchableOpacity>
            </View>

            {useCustomInput ? (
              <TextInput
                style={styles.input}
                placeholder="Enter exercise name"
                placeholderTextColor={Colors.textTertiary}
                value={newExerciseName}
                onChangeText={setNewExerciseName}
                autoFocus
                onSubmitEditing={() => handleAddExercise()}
              />
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedCommonExercise}
                  onValueChange={(itemValue) => setSelectedCommonExercise(itemValue)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select an exercise..." value="" />
                  {COMMON_EXERCISES.map((exercise) => (
                    <Picker.Item key={exercise} label={exercise} value={exercise} />
                  ))}
                </Picker>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddExercise(false);
                  setNewExerciseName("");
                  setSelectedCommonExercise("");
                  setUseCustomInput(false);
                }}
              >
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => handleAddExercise()}
              >
                <Text style={styles.saveButtonText}>ADD</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  dateContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.textPrimary,
    flex: 1,
    letterSpacing: 1,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.card,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    minWidth: 40,
    textAlign: "right",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navButtonText: {
    fontSize: 18,
  },
  addButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  addButtonText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    minHeight: 200,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: "600",
    letterSpacing: 1,
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 32,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
    marginTop: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 16,
    letterSpacing: 1,
  },
  inputModeToggle: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: Colors.card,
    borderRadius: 6,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: Colors.accent,
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  modeButtonTextActive: {
    color: Colors.textPrimary,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    marginBottom: 16,
    maxHeight: 200,
    overflow: "hidden",
    backgroundColor: Colors.card,
  },
  picker: {
    width: "100%",
    height: 200,
    backgroundColor: Colors.card,
  },
  pickerItem: {
    fontSize: 14,
    height: 50,
    color: Colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: Colors.card,
    color: Colors.textPrimary,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  saveButtonText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
