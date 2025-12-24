# Gym Logger

A production-grade, offline-first gym workout tracking app for Android built with React Native + Expo.

## Features

- **Daily Workout Tracking**: Automatically loads today's workout on launch
- **Exercise Management**: Add/remove exercises and sets
- **Fast Gym Input**: Large buttons for quick weight/reps/RIR entry
- **Exercise History**: View all previous sessions for any exercise
- **1RM Estimation**: Track estimated 1RM over time with graphs
- **Calendar View**: Navigate to past workouts via calendar
- **Workout Summary**: Text summaries with RIR notes

## Tech Stack

- React Native (Expo managed workflow)
- TypeScript
- AsyncStorage for local persistence
- React Navigation for navigation
- React Native Calendars for calendar view

## Installation

```bash
npm install
```

## Running

```bash
# Start Expo
npm start

# Run on Android
npm run android
```

## Architecture

### Data Model
- **Set**: weight (kg), reps, RIR (optional)
- **Exercise**: id (stable UUID), name, sets[]
- **Workout**: date (YYYY-MM-DD), exercises[]

### Storage
- Centralized storage service with error handling
- All operations wrapped in try/catch
- Data merged before saving (never overwrites unrelated days)
- Stable keys: `workout:YYYY-MM-DD`

### Principles
- Offline-first (no backend, no network)
- Never lose user data
- Never crash due to bad input
- Simple, readable code
- Minimal dependencies

## Project Structure

```
src/
  ├── services/
  │   └── storage.ts          # Centralized AsyncStorage wrapper
  ├── types/
  │   └── workout.ts          # TypeScript types
  ├── utils/
  │   ├── date.ts             # Date utilities
  │   ├── validation.ts       # Input validation
  │   ├── uuid.ts             # ID generation
  │   └── 1rm.ts              # 1RM estimation
  ├── screens/
  │   ├── DailyWorkout.tsx    # Main daily workout view
  │   ├── ExerciseDetail.tsx  # Exercise detail (Track/History/Graph)
  │   ├── Calendar.tsx        # Calendar view
  │   └── WorkoutSummary.tsx  # Summary view
  └── components/
      ├── ExerciseCard.tsx
      └── SetRow.tsx
```

