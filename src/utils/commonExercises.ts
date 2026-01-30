import { ExerciseCategory } from "../types/workout";

export interface ExerciseDefinition {
  name: string;
  category: ExerciseCategory;
}

export const COMMON_EXERCISES: ExerciseDefinition[] = [
  // CHEST
  { name: "Bench Press (Barbell)", category: "Chest" },
  { name: "Bench Press (Dumbbell)", category: "Chest" },
  { name: "Incline Bench Press (Barbell)", category: "Chest" },
  { name: "Incline Bench Press (Dumbbell)", category: "Chest" },
  { name: "Decline Bench Press", category: "Chest" },
  { name: "Chest Fly (Dumbbell)", category: "Chest" },
  { name: "Chest Fly (Cable)", category: "Chest" },
  { name: "Chest Press (Machine)", category: "Chest" },
  { name: "Push Ups", category: "Chest" },
  { name: "Dips (Chest Focus)", category: "Chest" },
  { name: "Landmine Press", category: "Chest" },
  { name: "Pec Deck / Machine Fly", category: "Chest" },
  { name: "Pullover (Dumbbell)", category: "Chest" },

  // BACK
  { name: "Deadlift (Conventional)", category: "Back" },
  { name: "Deadlift (Sumo)", category: "Back" },
  { name: "Pull Ups", category: "Back" },
  { name: "Chin Ups", category: "Back" },
  { name: "Lat Pulldown (Wide Grip)", category: "Back" },
  { name: "Lat Pulldown (Close Grip)", category: "Back" },
  { name: "Barbell Row", category: "Back" },
  { name: "Pendlay Row", category: "Back" },
  { name: "Dumbbell Row", category: "Back" },
  { name: "Cable Row (Seated)", category: "Back" },
  { name: "T-Bar Row", category: "Back" },
  { name: "Face Pulls", category: "Back" },
  { name: "Shrugs (Barbell)", category: "Back" },
  { name: "Shrugs (Dumbbell)", category: "Back" },
  { name: "Rack Pulls", category: "Back" },
  { name: "Good Mornings", category: "Back" },
  { name: "Back Extensions", category: "Back" },

  // LEGS
  { name: "Squat (Barbell High Bar)", category: "Legs" },
  { name: "Squat (Barbell Low Bar)", category: "Legs" },
  { name: "Front Squat", category: "Legs" },
  { name: "Goblet Squat", category: "Legs" },
  { name: "Leg Press", category: "Legs" },
  { name: "Hack Squat", category: "Legs" },
  { name: "Lunges (Walking)", category: "Legs" },
  { name: "Lunges (Reverse)", category: "Legs" },
  { name: "Bulgarian Split Squat", category: "Legs" },
  { name: "Romanian Deadlift (Barbell)", category: "Legs" },
  { name: "Romanian Deadlift (Dumbbell)", category: "Legs" },
  { name: "Leg Extension", category: "Legs" },
  { name: "Leg Curl (Seated)", category: "Legs" },
  { name: "Leg Curl (Lying)", category: "Legs" },
  { name: "Calf Raise (Standing)", category: "Legs" },
  { name: "Calf Raise (Seated)", category: "Legs" },
  { name: "Hip Thrust", category: "Legs" },
  { name: "Glute Bridge", category: "Legs" },

  // SHOULDERS
  { name: "Overhead Press (Barbell)", category: "Shoulders" },
  { name: "Overhead Press (Dumbbell)", category: "Shoulders" },
  { name: "Arnold Press", category: "Shoulders" },
  { name: "Lateral Raise (Dumbbell)", category: "Shoulders" },
  { name: "Lateral Raise (Cable)", category: "Shoulders" },
  { name: "Front Raise", category: "Shoulders" },
  { name: "Rear Delt Fly (Dumbbell)", category: "Shoulders" },
  { name: "Rear Delt Fly (Machine)", category: "Shoulders" },
  { name: "Upright Row", category: "Shoulders" },
  { name: "Egyptian Lateral Raise", category: "Shoulders" },

  // ARMS
  { name: "Bicep Curl (Barbell)", category: "Arms" },
  { name: "Bicep Curl (Dumbbell)", category: "Arms" },
  { name: "Hammer Curl", category: "Arms" },
  { name: "Preacher Curl", category: "Arms" },
  { name: "Cable Curl", category: "Arms" },
  { name: "Tricep Extension (Cable)", category: "Arms" },
  { name: "Tricep Extension (Overhead)", category: "Arms" },
  { name: "Skullcrushers", category: "Arms" },
  { name: "Close Grip Bench Press", category: "Arms" },
  { name: "Dips (Tricep Focus)", category: "Arms" },

  // CORE
  { name: "Plank", category: "Core" },
  { name: "Crunches", category: "Core" },
  { name: "Leg Raises (Hanging)", category: "Core" },
  { name: "Leg Raises (Lying)", category: "Core" },
  { name: "Russian Twists", category: "Core" },
  { name: "Ab Wheel Rollout", category: "Core" },
  { name: "Cable Woodchoppers", category: "Core" },

  // CARDIO
  { name: "Running (Treadmill)", category: "Cardio" },
  { name: "Running (Outdoors)", category: "Cardio" },
  { name: "Cycling", category: "Cardio" },
  { name: "Rowing Machine", category: "Cardio" },
  { name: "Jump Rope", category: "Cardio" },
  { name: "Elliptical", category: "Cardio" },

  // OLYMPIC / OTHER
  { name: "Clean and Jerk", category: "Other" },
  { name: "Snatch", category: "Other" },
  { name: "Power Clean", category: "Other" },
  { name: "Farmer's Walk", category: "Other" },
];
