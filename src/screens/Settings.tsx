import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { exportBackup, importBackup } from "../services/backup";
import { Colors } from "../theme/colors";

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const fileUri = await exportBackup();
      if (fileUri) {
        // Try to share the file
        try {
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          if (fileInfo.exists && (await Sharing.isAvailableAsync())) {
            await Sharing.shareAsync(fileUri, {
              mimeType: "application/json",
              dialogTitle: "Share Gym Logger Backup",
            });
            Alert.alert(
              "Backup Created",
              "Backup file created. You can now share it to Google Drive or save it elsewhere."
            );
          } else {
            Alert.alert(
              "Backup Created",
              `Backup file saved to: ${fileUri}\n\nYou can copy this file to Google Drive or another location.`
            );
          }
        } catch (shareError) {
          Alert.alert(
            "Backup Created",
            `Backup file saved to: ${fileUri}\n\nYou can copy this file to Google Drive or another location.`
          );
        }
      }
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      await importBackup();
    } catch (error) {
      console.error("Import error:", error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Backup</Text>
          <Text style={styles.sectionDescription}>
            Your workout data is stored locally on your device. Export backups to keep your data safe.
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.exportButton]}
            onPress={handleExport}
            disabled={exporting}
          >
            <Text style={styles.buttonText}>
              {exporting ? "Exporting..." : "📤 Export Backup"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.importButton]}
            onPress={handleImport}
            disabled={importing}
          >
            <Text style={styles.buttonText}>
              {importing ? "Importing..." : "📥 Restore Backup"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Storage:</Text> Internal device storage (AsyncStorage)
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Backup Format:</Text> JSON file with timestamp
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Data Safety:</Text> All operations are validated and safe
          </Text>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sectionDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
    fontWeight: "500",
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
  },
  exportButton: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accentLight,
  },
  importButton: {
    backgroundColor: Colors.success,
    borderColor: Colors.accentLight,
  },
  buttonText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
    fontWeight: "500",
  },
  infoLabel: {
    fontWeight: "700",
    color: Colors.textPrimary,
  },
});

