import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Exercise } from "../types/workout";
import { Colors } from "../theme/colors";

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: () => void;
  onRemove: () => void;
}

export function ExerciseCard({ exercise, onPress, onRemove }: ExerciseCardProps) {
  const totalSets = exercise.sets.length;
  const hasRIR = exercise.sets.some((set) => set.rir !== undefined);
  const hasNotes = exercise.notes && exercise.notes.trim().length > 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.name}>{exercise.name.toUpperCase()}</Text>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={styles.removeButton}
        >
          <Text style={styles.removeText}>×</Text>
        </TouchableOpacity>
      </View>
      
      {hasNotes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText} numberOfLines={2}>{exercise.notes}</Text>
        </View>
      )}
      
      <View style={styles.setsContainer}>
        {exercise.sets.length === 0 ? (
          <Text style={styles.emptyText}>NO SETS YET</Text>
        ) : (
          exercise.sets.map((set, index) => (
            <View key={index} style={styles.setRow}>
              <Text style={styles.setIndex}>{index + 1}</Text>
              <Text style={styles.setText}>
                {set.weight}kg × {set.reps}
                {set.rir !== undefined && ` @ ${set.rir} RIR`}
              </Text>
            </View>
          ))
        )}
      </View>
      
      <Text style={styles.footer}>
        {totalSets} SET{totalSets !== 1 ? "S" : ""}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
    letterSpacing: 0.5,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  removeText: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 20,
  },
  notesContainer: {
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 2,
    borderLeftColor: Colors.accent,
  },
  notesText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: "italic",
    lineHeight: 16,
  },
  setsContainer: {
    marginBottom: 8,
  },
  setRow: {
    flexDirection: "row",
    paddingVertical: 6,
    alignItems: "center",
  },
  setIndex: {
    width: 24,
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textTertiary,
    marginRight: 8,
  },
  setText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontStyle: "italic",
    letterSpacing: 0.5,
  },
  footer: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 4,
    fontWeight: "600",
    letterSpacing: 1,
  },
});
