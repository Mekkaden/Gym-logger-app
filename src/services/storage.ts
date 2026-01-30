/**
 * Centralized storage service
 * All reads/writes wrapped in try/catch
 * Always merge existing data before saving
 * Never overwrite unrelated days
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Workout, Exercise, Set, WORKOUT_KEY_PREFIX } from "../types/workout";
import { formatDate, isValidDateString } from "../utils/date";
import { validateWeight, validateReps, validateRIR, validateExerciseName } from "../utils/validation";

/**
 * Get storage key for a workout date
 */
function getWorkoutKey(date: string): string {
  if (!isValidDateString(date)) {
    throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
  }
  return `${WORKOUT_KEY_PREFIX}${date}`;
}

/**
 * Load workout for a specific date
 * Returns null if no workout exists
 */
export async function loadWorkout(date: string): Promise<Workout | null> {
  try {
    const key = getWorkoutKey(date);
    const data = await AsyncStorage.getItem(key);

    if (!data) {
      return null;
    }

    const workout: Workout = JSON.parse(data);

    // Validate structure
    if (!workout.date || !Array.isArray(workout.exercises)) {
      console.warn(`Invalid workout data for ${date}, returning null`);
      return null;
    }

    return workout;
  } catch (error) {
    console.error(`Error loading workout for ${date}:`, error);
    return null; // Fail gracefully
  }
}

/**
 * Save workout for a specific date
 * Merges with existing data if present
 */
export async function saveWorkout(workout: Workout): Promise<boolean> {
  try {
    // Validate date format
    if (!isValidDateString(workout.date)) {
      throw new Error(`Invalid date format: ${workout.date}`);
    }

    // Load existing workout to merge
    const existing = await loadWorkout(workout.date);

    // Merge: use new workout data, but preserve date
    const merged: Workout = {
      date: workout.date,
      exercises: workout.exercises || [],
    };

    // Validate exercises structure
    if (!Array.isArray(merged.exercises)) {
      merged.exercises = [];
    }

    const key = getWorkoutKey(workout.date);
    await AsyncStorage.setItem(key, JSON.stringify(merged));

    return true;
  } catch (error) {
    console.error(`Error saving workout for ${workout.date}:`, error);
    return false; // Fail gracefully
  }
}

/**
 * Create or update an exercise in a workout
 */
export async function saveExercise(date: string, exercise: Exercise): Promise<boolean> {
  try {
    const workout = await loadWorkout(date);

    const updated: Workout = workout || {
      date,
      exercises: [],
    };

    // Find existing exercise index
    const index = updated.exercises.findIndex((e) => e.id === exercise.id);

    if (index >= 0) {
      // Update existing
      updated.exercises[index] = exercise;
    } else {
      // Add new
      updated.exercises.push(exercise);
    }

    return await saveWorkout(updated);
  } catch (error) {
    console.error(`Error saving exercise for ${date}:`, error);
    return false;
  }
}

/**
 * Remove an exercise from a workout
 */
export async function removeExercise(date: string, exerciseId: string): Promise<boolean> {
  try {
    const workout = await loadWorkout(date);

    if (!workout) {
      return true; // Nothing to remove
    }

    workout.exercises = workout.exercises.filter((e) => e.id !== exerciseId);

    return await saveWorkout(workout);
  } catch (error) {
    console.error(`Error removing exercise for ${date}:`, error);
    return false;
  }
}

/**
 * Get all workout dates (for calendar view)
 */
export async function getAllWorkoutDates(): Promise<string[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const workoutKeys = keys.filter((key) => key.startsWith(WORKOUT_KEY_PREFIX));

    return workoutKeys.map((key) => key.replace(WORKOUT_KEY_PREFIX, ""));
  } catch (error) {
    console.error("Error getting workout dates:", error);
    return [];
  }
}

/**
 * Get all workouts (for history views)
 */
export async function getAllWorkouts(): Promise<Workout[]> {
  try {
    const dates = await getAllWorkoutDates();
    const workouts: Workout[] = [];

    for (const date of dates) {
      const workout = await loadWorkout(date);
      if (workout) {
        workouts.push(workout);
      }
    }

    return workouts.sort((a, b) => b.date.localeCompare(a.date)); // Most recent first
  } catch (error) {
    console.error("Error getting all workouts:", error);
    return [];
  }
}

/**
 * Get all sets for an exercise, flattened and sorted by date (descending)
 * Used for History view and PR calculations
 * USES EXERCISE NAME for global lookup (IDs are session-specific)
 */
export async function getAllSetsForExercise(exerciseName: string): Promise<Array<{ date: string; set: Set }>> {
  try {
    const workouts = await getAllWorkouts();

    const allSets: Array<{ date: string; set: Set }> = [];

    workouts.forEach(workout => {
      // Find ALL instances of this exercise in the workout (though usually 1)
      const exercises = workout.exercises.filter(e => e.name === exerciseName);

      exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          allSets.push({
            date: workout.date,
            set: set
          });
        });
      });
    });

    // Sort by date desc
    return allSets.sort((a, b) => b.date.localeCompare(a.date));

  } catch (error) {
    console.error(`Error getting all sets for exercise ${exerciseName}:`, error);
    return [];
  }
}


// Custom Exercises Key
export const CUSTOM_EXERCISES_KEY = "settings:custom_exercises";

export async function getCustomExercises(): Promise<Exercise[]> {
  try {
    const data = await AsyncStorage.getItem(CUSTOM_EXERCISES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting custom exercises:", error);
    return [];
  }
}

export async function saveCustomExercise(exercise: Exercise): Promise<boolean> {
  try {
    const current = await getCustomExercises();
    // Check if exists
    if (current.some(e => e.name.toLowerCase() === exercise.name.toLowerCase())) {
      return true; // Already exists
    }
    const updated = [...current, exercise];
    await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error("Error saving custom exercise:", error);
    return false;
  }
}

export async function checkPR(exerciseName: string, weight: number, reps: number, rir?: number): Promise<boolean> {
  try {
    const workouts = await getAllWorkouts();

    const currentRIR = rir || 0;

    // Track the best historical performance
    let bestWeight = 0;
    let bestReps = 0;
    let bestRIR = 0;
    let hasHistory = false;

    // Find the best historical performance for this exercise
    for (const workout of workouts) {
      for (const ex of workout.exercises) {
        if (ex.name === exerciseName) {
          for (const set of ex.sets) {
            hasHistory = true;
            const setRIR = set.rir || 0;

            // Check if this historical set is better than our current best
            if (set.weight > bestWeight) {
              bestWeight = set.weight;
              bestReps = set.reps;
              bestRIR = setRIR;
            } else if (set.weight === bestWeight && set.reps > bestReps) {
              bestReps = set.reps;
              bestRIR = setRIR;
            } else if (set.weight === bestWeight && set.reps === bestReps && setRIR > bestRIR) {
              bestRIR = setRIR;
            }
          }
        }
      }
    }

    // If no history, it's a PR
    if (!hasHistory) {
      return true;
    }

    // Compare current set against best historical performance
    // Using EXACT logic provided by user:
    if (weight > bestWeight) return true;
    if (weight === bestWeight && reps > bestReps) return true;
    if (weight === bestWeight && reps === bestReps && currentRIR > bestRIR) return true;

    return false;

  } catch (error) {
    return false;
  }
}

/**
 * Get the most recent workout before the given date
 */
export async function getLastWorkout(beforeDate: string): Promise<Workout | null> {
  try {
    const allDates = await getAllWorkoutDates();
    // Filter dates strictly before the target date
    const previousDates = allDates.filter(d => d < beforeDate);

    if (previousDates.length === 0) {
      return null;
    }

    // Sort descending (latest first)
    previousDates.sort((a, b) => b.localeCompare(a));

    // Load the most recent one
    return await loadWorkout(previousDates[0]);
  } catch (error) {
    console.error(`Error getting last workout before ${beforeDate}:`, error);
    return null;
  }
}

/**
 * Copy workout content from source date to target date
 */
export async function copyWorkout(sourceDate: string, targetDate: string): Promise<boolean> {
  try {
    const sourceWorkout = await loadWorkout(sourceDate);
    if (!sourceWorkout) {
      throw new Error(`No workout found for ${sourceDate}`);
    }

    // Create new exercises with NEW IDs to ensure deep copy
    // We do NOT copy the sets, only the exercises structure, per typical "Copy Previous" behavior
    // OR, often users want to see previous sets to beat them?
    // Request implementation: "Duplicate the most recent previous day's workout into the current day."
    // Usually this means copying the exercises and sets exactly so they can edit.

    const newExercises = sourceWorkout.exercises.map(ex => ({
      ...ex,
      id: require("../utils/uuid").generateId(),
      sets: ex.sets.map(s => ({
        ...s,
        isPR: false // Reset PR flag, these serve as templates for today
      })),
    }));

    const newWorkout: Workout = {
      date: targetDate,
      exercises: newExercises,
    };

    return await saveWorkout(newWorkout);
  } catch (error) {
    console.error(`Error copying workout from ${sourceDate} to ${targetDate}:`, error);
    return false;
  }
}
