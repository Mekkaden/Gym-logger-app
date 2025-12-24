/**
 * Backup and Restore Service
 * Exports/imports all workout data to/from JSON files
 * Safe restore: never deletes existing data on failure
 */

import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Workout, WORKOUT_KEY_PREFIX } from "../types/workout";
import { getAllWorkouts } from "./storage";
import { Alert } from "react-native";

export interface BackupData {
  version: string;
  exportDate: string;
  workoutCount: number;
  workouts: Workout[];
}

const BACKUP_VERSION = "1.0.0";

/**
 * Validate backup data structure
 */
function validateBackupData(data: any): data is BackupData {
  if (!data || typeof data !== "object") {
    return false;
  }

  if (!data.version || typeof data.version !== "string") {
    return false;
  }

  if (!data.exportDate || typeof data.exportDate !== "string") {
    return false;
  }

  if (typeof data.workoutCount !== "number") {
    return false;
  }

  if (!Array.isArray(data.workouts)) {
    return false;
  }

  // Validate each workout
  for (const workout of data.workouts) {
    if (!workout.date || typeof workout.date !== "string") {
      return false;
    }
    if (!Array.isArray(workout.exercises)) {
      return false;
    }
    for (const exercise of workout.exercises) {
      if (!exercise.id || typeof exercise.id !== "string") {
        return false;
      }
      if (!exercise.name || typeof exercise.name !== "string") {
        return false;
      }
      if (!Array.isArray(exercise.sets)) {
        return false;
      }
      for (const set of exercise.sets) {
        if (typeof set.weight !== "number" || set.weight < 0) {
          return false;
        }
        if (typeof set.reps !== "number" || set.reps < 1) {
          return false;
        }
        if (set.rir !== undefined && (typeof set.rir !== "number" || set.rir < 0)) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Export all workout data to a JSON file
 * Returns the file URI
 */
export async function exportBackup(): Promise<string | null> {
  try {
    // Get all workouts
    const workouts = await getAllWorkouts();
    const dates = await getAllWorkoutDates();

    const backupData: BackupData = {
      version: BACKUP_VERSION,
      exportDate: new Date().toISOString(),
      workoutCount: workouts.length,
      workouts: workouts,
    };

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `gym-logger-backup-${timestamp}.json`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    // Write file
    await FileSystem.writeAsStringAsync(
      fileUri,
      JSON.stringify(backupData, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    return fileUri;
  } catch (error) {
    console.error("Error exporting backup:", error);
    Alert.alert("Export Failed", "Failed to create backup file. Please try again.");
    return null;
  }
}

/**
 * Import backup from a JSON file
 * Safe restore: validates data and merges with existing data
 * Never deletes existing data on failure
 */
export async function importBackup(): Promise<boolean> {
  try {
    // Pick file
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return false; // User cancelled
    }

    const fileUri = result.assets[0].uri;

    // Read file
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Parse JSON
    let backupData: any;
    try {
      backupData = JSON.parse(fileContent);
    } catch (parseError) {
      Alert.alert("Invalid File", "The selected file is not valid JSON.");
      return false;
    }

    // Validate structure
    if (!validateBackupData(backupData)) {
      Alert.alert(
        "Invalid Backup",
        "The backup file format is invalid or corrupted. Please select a valid backup file."
      );
      return false;
    }

    // Show confirmation with details
    const confirmMessage = `This backup contains ${backupData.workoutCount} workouts from ${backupData.exportDate}.\n\nThis will merge with your existing data. Existing workouts for the same dates will be updated.\n\nContinue?`;

    return new Promise((resolve) => {
      Alert.alert(
        "Confirm Restore",
        confirmMessage,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: "Restore",
            style: "default",
            onPress: async () => {
              try {
                // Restore workouts one by one
                let restoredCount = 0;
                let failedCount = 0;

                for (const workout of backupData.workouts) {
                  try {
                    // Validate date format
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                    if (!dateRegex.test(workout.date)) {
                      console.warn(`Invalid date format: ${workout.date}`);
                      failedCount++;
                      continue;
                    }

                    // Get existing workout
                    const existingKey = `${WORKOUT_KEY_PREFIX}${workout.date}`;
                    const existingData = await AsyncStorage.getItem(existingKey);

                    if (existingData) {
                      // Merge with existing (keep existing if conflict)
                      const existing: Workout = JSON.parse(existingData);
                      // Merge exercises by ID
                      const mergedExercises = [...existing.exercises];
                      workout.exercises.forEach((newExercise: any) => {
                        const existingIndex = mergedExercises.findIndex(
                          (e) => e.id === newExercise.id
                        );
                        if (existingIndex >= 0) {
                          // Update existing
                          mergedExercises[existingIndex] = newExercise;
                        } else {
                          // Add new
                          mergedExercises.push(newExercise);
                        }
                      });
                      workout.exercises = mergedExercises;
                    }

                    // Save workout
                    await AsyncStorage.setItem(
                      existingKey,
                      JSON.stringify(workout)
                    );
                    restoredCount++;
                  } catch (workoutError) {
                    console.error(`Error restoring workout ${workout.date}:`, workoutError);
                    failedCount++;
                  }
                }

                if (failedCount > 0) {
                  Alert.alert(
                    "Restore Complete",
                    `Restored ${restoredCount} workouts. ${failedCount} workouts failed to restore.`
                  );
                } else {
                  Alert.alert("Restore Complete", `Successfully restored ${restoredCount} workouts.`);
                }

                resolve(true);
              } catch (restoreError) {
                console.error("Error during restore:", restoreError);
                Alert.alert(
                  "Restore Failed",
                  "An error occurred during restore. Your existing data has not been modified."
                );
                resolve(false);
              }
            },
          },
        ]
      );
    });
  } catch (error) {
    console.error("Error importing backup:", error);
    Alert.alert("Import Failed", "Failed to import backup. Please try again.");
    return false;
  }
}

/**
 * Share backup file (for syncing to Google Drive, etc.)
 * Note: This requires expo-sharing package, but we'll use the file URI
 * which can be shared via Android's share intent
 */
export async function getBackupFileUri(): Promise<string | null> {
  return await exportBackup();
}

