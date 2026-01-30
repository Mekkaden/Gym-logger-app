import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Vibration, AppState, AppStateStatus, TextInput } from "react-native";
import { Colors } from "../theme/colors";

interface RestTimerProps {
  onComplete?: () => void;
}

export function RestTimer({ onComplete }: RestTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Store the timestamp when the timer should end
  const endTimeRef = useRef<number | null>(null);
  // Store the timestamp when paused, to calculate remaining time on resume
  const pausedTimeRef = useRef<number | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription.remove();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        if (!endTimeRef.current) return;

        const now = Date.now();
        const left = Math.ceil((endTimeRef.current - now) / 1000);

        if (left <= 0) {
          completeTimer();
        } else {
          setRemainingSeconds(left);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, remainingSeconds]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === "active") {
      // App came to foreground
      if (isRunning && endTimeRef.current) {
        const now = Date.now();
        const left = Math.ceil((endTimeRef.current - now) / 1000);
        if (left <= 0) {
          // We missed the end while backgrounded
          completeTimer();
        } else {
          setRemainingSeconds(left);
        }
      }
    }
    appState.current = nextAppState;
  };

  const completeTimer = () => {
    setRemainingSeconds(0);
    setIsRunning(false);
    endTimeRef.current = null;
    Vibration.vibrate([0, 500, 100, 500]);
    if (onComplete) onComplete();
  };

  const startTimer = (duration: number) => {
    const now = Date.now();
    endTimeRef.current = now + duration * 1000;
    setRemainingSeconds(duration);
    setIsRunning(true);
    pausedTimeRef.current = null;
  };

  const pauseTimer = () => {
    if (!endTimeRef.current) return;
    const now = Date.now();
    // Calculate how much time was left
    const left = Math.ceil((endTimeRef.current - now) / 1000);
    setRemainingSeconds(left > 0 ? left : 0);
    setIsRunning(false);
    pausedTimeRef.current = now; // Not strictly needed with this logic but good for debug
    endTimeRef.current = null; // Clear target as we are not running
  };

  const resumeTimer = () => {
    if (remainingSeconds <= 0) return;
    const now = Date.now();
    endTimeRef.current = now + remainingSeconds * 1000;
    setIsRunning(true);
  };

  const resetTimer = () => {
    setRemainingSeconds(0);
    setIsRunning(false);
    endTimeRef.current = null;
  };

  const stopTimer = () => {
    resetTimer();
  };

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    return `${secs}s`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>REST TIMER</Text>

      {remainingSeconds === 0 && !isRunning ? (
        <View style={styles.setupContainer}>
          <View style={styles.presetGrid}>
            {[60, 90, 120, 170, 180, 240].map((time) => (
              <TouchableOpacity
                key={time}
                style={styles.presetButton}
                onPress={() => startTimer(time)}
              >
                <Text style={styles.presetText}>{time}s</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customInputContainer}>
            <TextInput
              style={styles.customInput}
              placeholder="Custom (sec)"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="number-pad"
              onSubmitEditing={(e) => {
                const val = parseInt(e.nativeEvent.text, 10);
                if (val > 0) startTimer(val);
              }}
            />
          </View>
        </View>
      ) : (
        <>
          <View style={styles.timerDisplay}>
            <Text style={[
              styles.timerText,
              remainingSeconds <= 10 && styles.timerTextWarning
            ]}>
              {formatTime(remainingSeconds)}
            </Text>
          </View>

          <View style={styles.controlsContainer}>
            {!isRunning ? (
              <TouchableOpacity
                style={[styles.controlButton, styles.resumeButton]}
                onPress={resumeTimer}
              >
                <Text style={styles.controlButtonText}>▶ Resume</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.controlButton, styles.pauseButton]}
                onPress={pauseTimer}
              >
                <Text style={styles.controlButtonText}>⏸ Pause</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.controlButton, styles.resetButton]}
              onPress={resetTimer}
            >
              <Text style={styles.controlButtonText}>↻ Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.stopButton]}
              onPress={stopTimer}
            >
              <Text style={styles.controlButtonText}>⏹ Stop</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 12,
    textAlign: "center",
  },
  setupContainer: {
    gap: 12,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  presetButton: {
    minWidth: '30%',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  presetText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  customInputContainer: {
    marginTop: 4,
  },
  customInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    padding: 10,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontSize: 14,
  },
  timerDisplay: {
    alignItems: "center",
    marginVertical: 16,
    paddingVertical: 20,
  },
  timerText: {
    fontSize: 64,
    fontWeight: "900",
    color: Colors.accent,
    letterSpacing: -2,
  },
  timerTextWarning: {
    color: Colors.accentLight,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 8,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  pauseButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resumeButton: {
    backgroundColor: Colors.accentMuted,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  resetButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stopButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
});

