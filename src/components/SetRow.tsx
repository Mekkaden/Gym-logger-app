import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Set } from "../types/workout";
import { Colors } from "../theme/colors";

interface SetRowProps {
  set: Set;
  index: number;
  onRemove: () => void;
  onPress?: () => void;
}

export function SetRow({ set, index, onRemove, onPress }: SetRowProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        <Text style={styles.index}>{index + 1}</Text>
        <Text style={styles.details}>
          <Text style={styles.weight}>{set.weight}kg</Text>
          <Text style={styles.separator}> × </Text>
          <Text style={styles.reps}>{set.reps}</Text>
          {set.rir !== undefined && (
            <Text style={styles.rir}> @ {set.rir} RIR</Text>
          )}
          {set.isPR && <Text style={styles.prIcon}> 🏆</Text>}
        </Text>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
        <Text style={styles.removeIcon}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  leftContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  index: {
    width: 24,
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: "600",
    marginRight: 8,
  },
  details: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  weight: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  separator: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginHorizontal: 4,
  },
  reps: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  rir: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
    fontStyle: "italic",
  },
  prIcon: {
    fontSize: 12,
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
  removeIcon: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 18,
  },
});
