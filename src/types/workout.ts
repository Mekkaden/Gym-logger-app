/**
 * Core data types for the workout tracking app
 * Simple, stable, predictable structures
 */

export interface Set {
  weight: number; // kg
  reps: number;
  rir?: number; // Reps in Reserve (optional)
}

export interface Exercise {
  id: string; // Stable UUID
  name: string;
  sets: Set[];
  notes?: string; // Comments/notes for the exercise
  targetSets?: number; // Planned sets for progress tracking
}

export interface Workout {
  date: string; // YYYY-MM-DD format
  exercises: Exercise[];
}

/**
 * Storage key format: "workout:YYYY-MM-DD"
 */
export const WORKOUT_KEY_PREFIX = "workout:";

