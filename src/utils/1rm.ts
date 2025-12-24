/**
 * 1RM estimation utilities
 * Using Epley formula: 1RM = weight × (1 + reps/30)
 */

export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  return Math.round(weight * (1 + reps / 30) * 100) / 100;
}

