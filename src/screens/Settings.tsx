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
import { getAvailableSplits, saveAvailableSplits, getSplitTemplates, saveSplitTemplates } from "../services/storage";
import { TextInput, Modal } from "react-native";
import { SplitTemplate } from "../types/workout";
import { ExerciseSearch } from "../components/ExerciseSearch";

interface SettingsProps {
  onBack: () => void;
}

function TemplateManager() {
  const [templates, setTemplates] = useState<SplitTemplate[]>([]);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<SplitTemplate | null>(null);
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);

  React.useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      // First ensure default splits exist as templates if not already
      const defaults = await getAvailableSplits();
      const existing = await getSplitTemplates();

      // Merge defaults if they don't exist in templates
      // (This is a simplified migration strategy)
      const merged = [...existing];
      for (const def of defaults) {
        if (!merged.find(t => t.name === def)) {
          merged.push({ name: def, exercises: [] });
        }
      }

      setTemplates(merged);
      setLoading(false);

      // Sync back to available splits (legacy support)
      await saveAvailableSplits(merged.map(t => t.name));
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleAddTemplate = async () => {
    if (!newTemplateName.trim()) return;
    if (templates.find(t => t.name.toLowerCase() === newTemplateName.trim().toLowerCase())) {
      setNewTemplateName("");
      return;
    }

    const newTemplate: SplitTemplate = {
      name: newTemplateName.trim(),
      exercises: []
    };

    const updated = [...templates, newTemplate];
    await saveTemplates(updated);
    setNewTemplateName("");
  };

  const handleRemoveTemplate = async (name: string) => {
    Alert.alert("Delete Split", `Delete "${name}" and its template?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          const updated = templates.filter((t) => t.name !== name);
          await saveTemplates(updated);
        }
      }
    ]);
  };

  const saveTemplates = async (updated: SplitTemplate[]) => {
    setTemplates(updated);
    await saveSplitTemplates(updated);
    // Keep legacy splits in sync
    await saveAvailableSplits(updated.map(t => t.name));
  };

  const handleEditTemplate = (template: SplitTemplate) => {
    setEditingTemplate({ ...template });
  };

  const saveEditingTemplate = async () => {
    if (!editingTemplate) return;
    const updated = templates.map(t => t.name === editingTemplate.name ? editingTemplate : t);
    await saveTemplates(updated);
    setEditingTemplate(null);
  };

  const addExerciseToTemplate = (exerciseName: string) => {
    if (!editingTemplate) return;
    if (editingTemplate.exercises.includes(exerciseName)) return;

    setEditingTemplate({
      ...editingTemplate,
      exercises: [...editingTemplate.exercises, exerciseName]
    });
    // Don't close search, allow multiple adds
  };

  const removeExerciseFromTemplate = (exerciseName: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      exercises: editingTemplate.exercises.filter(e => e !== exerciseName)
    });
  };

  if (loading) return <Text style={styles.loadingText}>Loading templates...</Text>;

  return (
    <View style={styles.splitManager}>
      {/* List of Templates */}
      <View style={styles.tagContainer}>
        {templates.map((template) => (
          <TouchableOpacity
            key={template.name}
            style={styles.templateCard}
            onPress={() => handleEditTemplate(template)}
          >
            <View style={styles.templateHeader}>
              <Text style={styles.templateName}>{template.name}</Text>
              <TouchableOpacity onPress={() => handleRemoveTemplate(template.name)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.tagRemove}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.templateCount}>
              {template.exercises.length} exercises
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add New Template */}
      <View style={styles.addSplitRow}>
        <TextInput
          style={styles.splitInput}
          placeholder="New split name (e.g. Chest Day)..."
          placeholderTextColor={Colors.textTertiary}
          value={newTemplateName}
          onChangeText={setNewTemplateName}
          maxLength={20}
        />
        <TouchableOpacity
          style={[styles.addSplitButton, !newTemplateName.trim() && styles.disabledButton]}
          onPress={handleAddTemplate}
          disabled={!newTemplateName.trim()}
        >
          <Text style={styles.addSplitText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Template Modal */}
      <Modal
        visible={!!editingTemplate}
        animationType="slide"
        onRequestClose={() => setEditingTemplate(null)}
      >
        <View style={styles.editorContainer}>
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setEditingTemplate(null)} style={styles.backButton}>
              <Text style={styles.backText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>Editing {editingTemplate?.name}</Text>
            <TouchableOpacity onPress={saveEditingTemplate} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.sectionDescription}>
              Exercises in this split will be auto-loaded when you start a workout.
            </Text>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowExerciseSearch(true)}
            >
              <Text style={styles.addButtonText}>+ Add Exercise to Template</Text>
            </TouchableOpacity>

            <View style={styles.editorList}>
              {editingTemplate?.exercises.length === 0 ? (
                <Text style={styles.emptyText}>No exercises in template yet.</Text>
              ) : (
                editingTemplate?.exercises.map((ex, idx) => (
                  <View key={idx} style={styles.editorRow}>
                    <Text style={styles.editorRowText}>{ex}</Text>
                    <TouchableOpacity onPress={() => removeExerciseFromTemplate(ex)}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {showExerciseSearch && (
              <View style={styles.searchContainer}>
                <ExerciseSearch
                  onSelect={addExerciseToTemplate}
                  onClose={() => setShowExerciseSearch(false)}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
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
          <Text style={styles.sectionTitle}>Workout Splits</Text>
          <Text style={styles.sectionDescription}>
            Customize your workout split labels (e.g., Push, Pull, Legs).
          </Text>
          <TemplateManager />
        </View>

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
  splitManager: {
    gap: 12,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.accent,
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  tagRemove: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "700",
  },
  addSplitRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  splitInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  addSplitButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  addSplitText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontStyle: "italic",
    fontSize: 12,
  },
  templateCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  templateCount: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  editorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  editorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addButtonText: {
    color: Colors.accent,
    fontWeight: '600',
  },
  editorList: {
    gap: 8,
  },
  editorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editorRowText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  removeText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 20,
  },
  searchContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
  }
});

