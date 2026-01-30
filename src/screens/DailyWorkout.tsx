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
  Platform,
  StatusBar,
} from "react-native";
import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { ExerciseCard } from "../components/ExerciseCard";
import { RestTimer } from "../components/RestTimer";
import { ExerciseSearch } from "../components/ExerciseSearch";
import { CalendarView } from "./CalendarView";
import { loadWorkout, saveWorkout, saveExercise, removeExercise, copyWorkout, getLastWorkout } from "../services/storage";
import { getTodayDate, getRelativeDateLabel, formatDate, parseDate } from "../utils/date";
import { generateId } from "../utils/uuid";
import { Workout, Exercise } from "../types/workout";
import { COMMON_EXERCISES } from "../utils/commonExercises";
import { Colors } from "../theme/colors";

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

  const [currentDate, setCurrentDate] = useState(date || getTodayDate());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCopyPicker, setShowCopyPicker] = useState(false);

  const touchX = React.useRef(0);

  useEffect(() => {
    if (date && date !== currentDate) {
      setCurrentDate(date);
    }
  }, [date]);

  // Use useFocusEffect to reload data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadWorkoutData();
    }, [currentDate])
  );

  // We also keep the useEffect for currentDate changes if they happen while focused
  // purely to ensure we catch date changes if they don't trigger focus (e.g. internal state)
  // But useFocusEffect handles the "Back" navigation case.

  // OPTIMISTIC UI: Reload workout data whenever currentDate changes
  useEffect(() => {
    loadWorkoutData();
  }, [currentDate]);

  const loadWorkoutData = async () => {
    setLoading(true);
    try {
      let data = await loadWorkout(currentDate);

      // If no data exists, we don't auto-create it immediately unless the user adds something
      // But for UI consistency we set a blank workout object in state with Today's date
      // This allows the "Copy Previous" button to be shown on empty days
      if (!data) {
        data = {
          date: currentDate,
          exercises: [],
        };
        // We do typically save it to "initialize" the day in storage to be safe, 
        // ensuring the date key exists, but strictly optional if we handle nulls well.
        // Current logic was:
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

  const handleDateNavigate = (direction: -1 | 1) => {
    const dateObj = parseDate(currentDate);
    dateObj.setDate(dateObj.getDate() + direction);
    const newDate = formatDate(dateObj);

    // OPTIMISTIC UPDATE: Change date immediately for snappy UI
    // The useEffect will trigger loadWorkoutData automatically
    setCurrentDate(newDate);
  };

  const handleCopyPrevious = () => {
    // Show picker instead of automatic copy based on user request
    setShowCopyPicker(true);
  };

  const handleCopyFromDate = async (sourceDate: string) => {
    setLoading(true);
    try {
      if (sourceDate === currentDate) {
        Alert.alert("Invalid", "Cannot copy from the same day");
        setLoading(false);
        return;
      }

      const success = await copyWorkout(sourceDate, currentDate);
      if (success) {
        await loadWorkoutData();
        Alert.alert("Success", `Copied workout from ${getRelativeDateLabel(sourceDate)}`);
        setShowCopyPicker(false);
      } else {
        Alert.alert("Error", "Failed to copy workout from " + sourceDate);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to copy workout");
    } finally {
      setLoading(false);
    }
  };

  const handleMoveExercise = async (index: number, direction: -1 | 1) => {
    if (!workout) return;

    // Check bounds
    if (index + direction < 0 || index + direction >= workout.exercises.length) return;

    const newExercises = [...workout.exercises];
    // Swap
    const temp = newExercises[index];
    newExercises[index] = newExercises[index + direction];
    newExercises[index + direction] = temp;

    // Updates local state immediately for responsiveness
    const updated = { ...workout, exercises: newExercises };
    setWorkout(updated);

    // Save
    await saveWorkout(updated);
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
          <TouchableOpacity
            style={styles.dateNavButton}
            onPress={() => handleDateNavigate(-1)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.dateNavText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{getRelativeDateLabel(currentDate).toUpperCase()}</Text>
            <Text style={styles.fullDateText}>{parseDate(currentDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
          </View>

          <TouchableOpacity
            style={styles.dateNavButton}
            onPress={() => handleDateNavigate(1)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.dateNavText}>›</Text>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            {navigation && (
              <>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => setShowCalendar(true)}
                >
                  <Text style={styles.navButtonText}>📅</Text>
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

      <View
        style={styles.content}
        onTouchStart={e => touchX.current = e.nativeEvent.pageX}
        onTouchEnd={e => {
          if (touchX.current - e.nativeEvent.pageX > 50) handleDateNavigate(1);
          if (e.nativeEvent.pageX - touchX.current > 50) handleDateNavigate(-1);
        }}
      >
        {showSearch ? (
          <View style={styles.searchContainer}>
            <ExerciseSearch
              onSelect={(name) => handleAddExercise(name)}
              onClose={() => setShowSearch(false)}
            />
          </View>
        ) : (
          <FlatList
            data={workout.exercises}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.contentContainer}
            renderItem={({ item, index }) => (
              <ExerciseCard
                exercise={item}
                onPress={() => onExercisePress(item, currentDate)}
                onRemove={() => handleRemoveExercise(item.id)}
                onMoveUp={index > 0 ? () => handleMoveExercise(index, -1) : undefined}
                onMoveDown={index < workout.exercises.length - 1 ? () => handleMoveExercise(index, 1) : undefined}
              />
            )}
            ListHeaderComponent={<RestTimer />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>NO EXERCISES YET</Text>
                <View style={styles.emptyActions}>
                  <TouchableOpacity
                    style={styles.emptyActionButton}
                    onPress={() => setShowSearch(true)}
                  >
                    <Text style={styles.emptyActionText}>+ Add Exercise</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.emptyActionButton}
                    onPress={handleCopyPrevious}
                  >
                    <Text style={styles.emptyActionText}>📋 Copy Workout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
          />
        )}
      </View>

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
                    <Picker.Item key={exercise.name} label={exercise.name} value={exercise.name} />
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


      <Modal
        visible={showCalendar}
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <CalendarView
          onClose={() => setShowCalendar(false)}
          onDateSelect={(date) => {
            setShowCalendar(false);
            if (onDateChange) onDateChange(date);
          }}
        />
      </Modal>

      <Modal
        visible={showCopyPicker}
        animationType="slide"
        onRequestClose={() => setShowCopyPicker(false)}
      >
        <CalendarView
          onClose={() => setShowCopyPicker(false)}
          onDateSelect={(date) => {
            // Confirm copy
            Alert.alert(
              "Copy Workout",
              "Copy workout from " + getRelativeDateLabel(date) + " to today?",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Copy", onPress: () => handleCopyFromDate(date) }
              ]
            );
          }}
        />
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
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 16 : 16,
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
    alignItems: "center", // Center align
  },
  dateText: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.textPrimary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  fullDateText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
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
  dateNavButton: {
    padding: 8,
    width: 32,
    alignItems: 'center',
  },
  dateNavText: {
    fontSize: 24,
    color: Colors.accent,
    fontWeight: '300',
    lineHeight: 28,
  },
  splitBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.card,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  splitText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  emptyActions: {
    width: '100%',
    gap: 12,
    marginTop: 24,
  },
  emptyActionButton: {
    backgroundColor: Colors.card,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  splitPickerContent: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    alignSelf: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  splitList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  splitItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  splitItemActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  splitItemText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  splitItemTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  searchContainer: {
    padding: 16,
    width: '100%',
  },
});
