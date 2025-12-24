/**
 * Input validation utilities
 * Never crash due to bad input
 */

/**
 * Validate and sanitize weight input (kg)
 * Returns valid number or null if invalid
 */
export function validateWeight(input: string | number): number | null {
  const num = typeof input === "string" ? parseFloat(input) : input;
  if (isNaN(num) || num < 0 || num > 1000) {
    return null;
  }
  return Math.round(num * 100) / 100; // Round to 2 decimals
}

/**
 * Validate and sanitize reps input
 * Returns valid number or null if invalid
 */
export function validateReps(input: string | number): number | null {
  const num = typeof input === "string" ? parseInt(input, 10) : input;
  if (isNaN(num) || num < 1 || num > 1000) {
    return null;
  }
  return num;
}

/**
 * Validate and sanitize RIR input (Reps in Reserve)
 * Returns valid number or null if invalid
 */
export function validateRIR(input: string | number): number | null {
  const num = typeof input === "string" ? parseInt(input, 10) : input;
  if (isNaN(num) || num < 0 || num > 10) {
    return null;
  }
  return num;
}

/**
 * Validate exercise name (non-empty string, max 100 chars)
 */
export function validateExerciseName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 100) {
    return null;
  }
  return trimmed;
}

