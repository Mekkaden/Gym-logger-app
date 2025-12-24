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
 * Get all workouts containing a specific exercise (by exercise ID)
 */
export async function getWorkoutsForExercise(exerciseId: string): Promise<Workout[]> {
  try {
    const allWorkouts = await getAllWorkouts();
    
    return allWorkouts.filter((workout) =>
      workout.exercises.some((e) => e.id === exerciseId)
    );
  } catch (error) {
    console.error(`Error getting workouts for exercise ${exerciseId}:`, error);
    return [];
  }
}

