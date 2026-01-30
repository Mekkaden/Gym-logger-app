import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    StatusBar,
} from "react-native";
import { Colors } from "../theme/colors";
import { getAllWorkouts } from "../services/storage";
import { formatDate, parseDate, getRelativeDateLabel } from "../utils/date";
import { Workout } from "../types/workout";

interface CalendarViewProps {
    onDateSelect: (date: string) => void;
    onClose: () => void;
}

export function CalendarView({ onDateSelect, onClose }: CalendarViewProps) {
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const all = await getAllWorkouts();
        setWorkouts(all);
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        return days;
    };

    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay(); // 0 = Sunday
    };

    const changeMonth = (dir: -1 | 1) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + dir);
        setCurrentMonth(newDate);
    };

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth); // 0-6
        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }

        // Days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            const dateStr = formatDate(dateObj);

            const workoutForDay = workouts.find(w => w.date === dateStr);
            const hasWorkout = !!workoutForDay;
            const isToday = dateStr === formatDate(new Date());

            // Simple category color coding (first exercise category)
            let dotColor = Colors.accent;
            if (hasWorkout && workoutForDay.exercises.length > 0) {
                const cat = workoutForDay.exercises[0].category;
                if (cat === 'Legs') dotColor = '#E74C3C'; // Red
                if (cat === 'Back') dotColor = '#3498DB'; // Blue
                if (cat === 'Chest') dotColor = '#F1C40F'; // Yellow
                // Default/Accent for others
            }

            days.push(
                <TouchableOpacity
                    key={dateStr}
                    style={[
                        styles.dayCell,
                        hasWorkout && styles.dayCellActive,
                        isToday && styles.dayCellToday
                    ]}
                    onPress={() => onDateSelect(dateStr)}
                >
                    <Text style={[
                        styles.dayText,
                        isToday && styles.dayTextToday,
                        hasWorkout && styles.dayTextActive
                    ]}>{i}</Text>

                    {hasWorkout && (
                        <View style={[styles.workoutDot, { backgroundColor: dotColor }]} />
                    )}

                    {hasWorkout && workoutForDay.split && (
                        <Text style={styles.splitLabel} numberOfLines={1}>
                            {workoutForDay.split.substring(0, 4)}
                        </Text>
                    )}
                </TouchableOpacity>
            );
        }

        return days;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.title}>CALENDAR</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.monthNav}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
                    <Text style={styles.navText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.monthTitle}>
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
                    <Text style={styles.navText}>›</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.weekHeader}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <Text key={i} style={styles.weekDayText}>{d}</Text>
                ))}
            </View>

            <ScrollView style={styles.gridScroll}>
                <View style={styles.grid}>
                    {renderCalendarGrid()}
                </View>

                <View style={styles.legend}>
                    <Text style={styles.legendTitle}>Recent History</Text>
                    {workouts.slice(0, 5).map(w => (
                        <TouchableOpacity key={w.date} style={styles.historyRow} onPress={() => onDateSelect(w.date)}>
                            <Text style={styles.historyDate}>{getRelativeDateLabel(w.date)}</Text>
                            <Text style={styles.historySplit}>{w.split || "Workout"}</Text>
                            <Text style={styles.historyCount}>{w.exercises.length} Exercises</Text>
                        </TouchableOpacity>
                    ))}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 16 : 16,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        fontSize: 24,
        color: Colors.textSecondary,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
        letterSpacing: 1,
    },
    monthNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    navBtn: {
        padding: 10,
    },
    navText: {
        fontSize: 24,
        color: Colors.accent,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    weekHeader: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        marginBottom: 8,
    },
    weekDayText: {
        flex: 1,
        textAlign: 'center',
        color: Colors.textTertiary,
        fontSize: 12,
        fontWeight: '700',
    },
    gridScroll: {
        flex: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 8,
    },
    dayCell: {
        width: '14.28%', // 100% / 7
        aspectRatio: 0.8,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 8,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    dayCellToday: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    dayCellActive: {
        // maybe highlight background slightly?
    },
    dayText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    dayTextToday: {
        color: Colors.accent,
        fontWeight: '700',
    },
    dayTextActive: {
        color: Colors.textPrimary,
        fontWeight: '700',
    },
    workoutDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.accent,
        marginTop: 4,
    },
    splitLabel: {
        fontSize: 8,
        color: Colors.textTertiary,
        marginTop: 2,
        textTransform: 'uppercase',
    },
    legend: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        marginTop: 16,
    },
    legendTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    historyDate: {
        color: Colors.textPrimary,
        fontSize: 14,
        flex: 1,
    },
    historySplit: {
        color: Colors.accent,
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
    },
    historyCount: {
        color: Colors.textTertiary,
        fontSize: 12,
        flex: 1,
        textAlign: 'right',
    }
});
