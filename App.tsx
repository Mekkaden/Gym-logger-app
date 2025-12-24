import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DailyWorkout } from "./src/screens/DailyWorkout";
import { ExerciseDetail } from "./src/screens/ExerciseDetail";
import { CalendarView } from "./src/screens/Calendar";
import { WorkoutSummary } from "./src/screens/WorkoutSummary";
import { Settings } from "./src/screens/Settings";
import { Exercise } from "./src/types/workout";
import { getTodayDate } from "./src/utils/date";

export type RootStackParamList = {
  DailyWorkout: { date?: string };
  ExerciseDetail: { exercise: Exercise; date: string };
  Calendar: undefined;
  WorkoutSummary: { date: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [currentDate, setCurrentDate] = useState<string>(getTodayDate());

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="DailyWorkout"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="DailyWorkout">
            {(props) => (
              <DailyWorkout
                {...props}
                date={currentDate}
                navigation={props.navigation}
                onExercisePress={(exercise, date) => {
                  props.navigation.navigate("ExerciseDetail", { exercise, date });
                }}
                onDateChange={(date) => {
                  setCurrentDate(date);
                }}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="ExerciseDetail">
            {(props) => (
              <ExerciseDetail
                {...props.route.params}
                onBack={() => props.navigation.goBack()}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Calendar">
            {(props) => (
              <CalendarView
                onDateSelect={(date) => {
                  setCurrentDate(date);
                  props.navigation.navigate("DailyWorkout", { date });
                }}
                onBack={() => props.navigation.goBack()}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="WorkoutSummary">
            {(props) => (
              <WorkoutSummary
                {...props.route.params}
                onBack={() => props.navigation.goBack()}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Settings">
            {(props) => (
              <Settings
                onBack={() => props.navigation.goBack()}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

