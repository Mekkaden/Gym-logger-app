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
import { getCustomExercises, saveCustomExercise } from "../services/storage";
import { Exercise } from "../types/workout";

interface ExerciseSearchProps {
  onSelect: (exerciseName: string) => void;
  onClose?: () => void;
}

// Helper type for the list items
interface SearchItem {
  name: string;
  category: string;
}

export function ExerciseSearch({ onSelect, onClose }: ExerciseSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [customExercises, setCustomExercises] = useState<SearchItem[]>([]);

  React.useEffect(() => {
    loadCustom();
  }, []);

  const loadCustom = async () => {
    const loaded = await getCustomExercises();
    // Convert to simple SearchItem format
    const formatted = loaded.map(e => ({ name: e.name, category: e.category || 'Custom' }));
    setCustomExercises(formatted);
  };

  const allExercises = useMemo(() => {
    // Merge common and custom, removing duplicates by name
    const combined = [...customExercises, ...COMMON_EXERCISES];
    // Quick dedup
    const seen = new Set();
    return combined.filter(el => {
      const duplicate = seen.has(el.name.toLowerCase());
      seen.add(el.name.toLowerCase());
      return !duplicate;
    });
  }, [customExercises]);

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) {
      return allExercises.slice(0, 50);
    }
    const query = searchQuery.toLowerCase();
    return allExercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(query) ||
      exercise.category.toLowerCase().includes(query)
    );
  }, [searchQuery, allExercises]);

  const handleCustomAdd = async () => {
    const name = searchQuery.trim();
    if (!name) return;

    // Save to global list
    // We don't have category picker yet for custom, default to 'Other' or 'Custom'
    // The user requirement says "permanently saved". 
    // Ideally we'd ask for category, but for now we just save.

    await saveCustomExercise({
      id: "placeholder", // ID generated on use
      name: name,
      sets: [],
      category: "Other"
    });

    onSelect(name);
    setSearchQuery("");
  };

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
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.exerciseItem}
            onPress={() => {
              onSelect(item.name); // We pass just the name back to keep it simple for now, or could pass category too
              setSearchQuery("");
            }}
          >
            <View>
              <Text style={styles.exerciseText}>{item.name}</Text>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={() =>
          searchQuery.length > 0 && !filteredExercises.some(e => e.name.toLowerCase() === searchQuery.toLowerCase()) ? (
            <TouchableOpacity
              style={[styles.exerciseItem, { borderBottomWidth: 0, marginTop: 8 }]}
              onPress={handleCustomAdd}
            >
              <Text style={[styles.exerciseText, { color: Colors.accent }]}>
                + Add "{searchQuery}" to Library
              </Text>
            </TouchableOpacity>
          ) : null
        }
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
  categoryText: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 2,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

