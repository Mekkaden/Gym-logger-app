import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Set } from "../types/workout";
import { Colors } from "../theme/colors";

interface SetRowProps {
  set: Set;
  index: number;
  onRemove: () => void;
}

export function SetRow({ set, index, onRemove }: SetRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.index}>{index + 1}</Text>
      <Text style={styles.details}>
        {set.weight}kg × {set.reps}
        {set.rir !== undefined && ` @ ${set.rir} RIR`}
      </Text>
      <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
        <Text style={styles.removeText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  index: {
    width: 28,
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: "600",
  },
  details: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  removeText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 18,
  },
});
