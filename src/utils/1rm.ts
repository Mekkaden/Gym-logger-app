export function estimate1RM(weight: number, reps: number, rir: number = 0): number {
  if (weight <= 0 || reps <= 0) return 0;
  // Effective Reps = Reps + RIR (Potential Reps)
  // Epley Formula with potential reps
  return Math.round(weight * (1 + (reps + rir) / 30) * 100) / 100;
}
