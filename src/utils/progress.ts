/**
 * Progress calculation utilities
 */

import { Workout, Exercise } from "../types/workout";

/**
 * Calculate daily progress percentage
 * Based on completed sets vs planned sets
 */
export function calculateDailyProgress(workout: Workout | null): number {
  if (!workout || workout.exercises.length === 0) {
    return 0;
  }

  let totalPlanned = 0;
  let totalCompleted = 0;

  workout.exercises.forEach((exercise) => {
    const planned = exercise.targetSets || exercise.sets.length || 0;
    const completed = exercise.sets.length;

    totalPlanned += planned;
    totalCompleted += completed;
  });

  if (totalPlanned === 0) {
    // If no planned sets, use exercises as progress indicator
    return workout.exercises.length > 0 ? 10 : 0;
  }

  const percentage = Math.min(100, Math.round((totalCompleted / totalPlanned) * 100));
  return percentage;
}

/**
 * Get progress color based on percentage
 */
export function getProgressColor(percentage: number): string {
  if (percentage >= 90) return "#006400"; // Dark green
  if (percentage >= 50) return "#8B4513"; // Dark brown/orange
  return "#8B0000"; // Deep red
}

