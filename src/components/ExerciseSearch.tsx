import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { COMMON_EXERCISES } from "../utils/commonExercises";
import { Colors } from "../theme/colors";

interface ExerciseSearchProps {
  onSelect: (exerciseName: string) => void;
  onClose?: () => void;
}

export function ExerciseSearch({ onSelect, onClose }: ExerciseSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) {
      return COMMON_EXERCISES.slice(0, 10); // Show first 10 when no search
    }
    const query = searchQuery.toLowerCase();
    return COMMON_EXERCISES.filter((exercise) =>
      exercise.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>QUICK ADD EXERCISE</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <TextInput
        style={styles.searchInput}
        placeholder="Search exercises..."
        placeholderTextColor={Colors.textTertiary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoFocus
      />

      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.exerciseItem}
            onPress={() => {
              onSelect(item);
              setSearchQuery("");
            }}
          >
            <Text style={styles.exerciseText}>{item}</Text>
          </TouchableOpacity>
        )}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 300,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 1.5,
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  list: {
    maxHeight: 200,
  },
  exerciseItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  exerciseText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
});

