import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from "react-native";
import { Colors } from "../theme/colors";

interface RestTimerProps {
  onComplete?: () => void;
}

export function RestTimer({ onComplete }: RestTimerProps) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && !isPaused && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            // Vibrate on completion
            Vibration.vibrate([0, 500, 100, 500]);
            if (onComplete) {
              onComplete();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, seconds, onComplete]);

  const startTimer = (duration: number) => {
    setSeconds(duration);
    setIsRunning(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsPaused(true);
    setIsRunning(false);
  };

  const resumeTimer = () => {
    setIsPaused(false);
    setIsRunning(true);
  };

  const resetTimer = () => {
    setSeconds(0);
    setIsRunning(false);
    setIsPaused(false);
  };

  const stopTimer = () => {
    setSeconds(0);
    setIsRunning(false);
    setIsPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    return `${secs}s`;
  };

  const isActive = seconds > 0 && (isRunning || isPaused);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>REST TIMER</Text>
      
      {!isActive ? (
        <View style={styles.presetContainer}>
          <TouchableOpacity
            style={styles.presetButton}
            onPress={() => startTimer(30)}
          >
            <Text style={styles.presetText}>30s</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.presetButton}
            onPress={() => startTimer(60)}
          >
            <Text style={styles.presetText}>60s</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.presetButton}
            onPress={() => startTimer(90)}
          >
            <Text style={styles.presetText}>90s</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.presetButton}
            onPress={() => startTimer(120)}
          >
            <Text style={styles.presetText}>120s</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.timerDisplay}>
            <Text style={[
              styles.timerText,
              seconds <= 10 && styles.timerTextWarning
            ]}>
              {formatTime(seconds)}
            </Text>
          </View>
          
          <View style={styles.controlsContainer}>
            {isPaused ? (
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
  presetContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 8,
  },
  presetButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 8,
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

