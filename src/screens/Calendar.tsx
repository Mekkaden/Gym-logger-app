import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { getAllWorkoutDates } from "../services/storage";
import { formatDate } from "../utils/date";
import { Colors } from "../theme/colors";

interface CalendarProps {
  onDateSelect: (date: string) => void;
  onBack: () => void;
}

export function CalendarView({ onDateSelect, onBack }: CalendarProps) {
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [totalWorkouts, setTotalWorkouts] = useState(0);

  useEffect(() => {
    loadWorkoutDates();
  }, []);

  const loadWorkoutDates = async () => {
    try {
      const dates = await getAllWorkoutDates();
      setWorkoutDates(new Set(dates));
      setTotalWorkouts(dates.length);
    } catch (error) {
      console.error("Error loading workout dates:", error);
    }
  };

  const handleDayPress = (day: DateData) => {
    const dateString = day.dateString;
    setSelectedDate(dateString);
    onDateSelect(dateString);
  };

  const markedDates: Record<string, any> = {};
  
  workoutDates.forEach((date) => {
    markedDates[date] = {
      marked: true,
      dotColor: Colors.accent,
      selected: selectedDate === date,
      selectedColor: Colors.accent,
    };
  });

  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: Colors.accent,
    };
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Calendar</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Total Workouts: <Text style={styles.statsNumber}>{totalWorkouts}</Text>
        </Text>
      </View>

      <Calendar
        onDayPress={handleDayPress}
        markedDates={markedDates}
        theme={{
          backgroundColor: Colors.card,
          calendarBackground: Colors.card,
          textSectionTitleColor: Colors.textSecondary,
          selectedDayBackgroundColor: Colors.accent,
          selectedDayTextColor: Colors.textPrimary,
          todayTextColor: Colors.accent,
          dayTextColor: Colors.textPrimary,
          textDisabledColor: Colors.textTertiary,
          dotColor: Colors.accent,
          selectedDotColor: Colors.textPrimary,
          arrowColor: Colors.accent,
          monthTextColor: Colors.textPrimary,
          indicatorColor: Colors.accent,
          textDayFontWeight: "500",
          textMonthFontWeight: "700",
          textDayHeaderFontWeight: "600",
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
        }}
        style={styles.calendar}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
          <Text style={styles.legendText}>Workout day</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 60,
  },
  statsContainer: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },
  statsNumber: {
    fontWeight: "700",
    color: Colors.accent,
  },
  calendar: {
    backgroundColor: Colors.card,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  legend: {
    backgroundColor: Colors.card,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
});

