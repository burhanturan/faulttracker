import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ActivityItemProps {
    user: string;
    action: string;
    time: string;
    icon: LucideIcon;
    iconColor: string;
    onPress?: () => void;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ user, action, time, icon: Icon, iconColor, onPress }) => {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    // Dark mode: #1E293B card, #334155 border (matching QuickAction)
    const cardBg = isDark ? '#1E293B' : '#F8FAFC';
    const borderColor = isDark ? '#334155' : '#E2E8F0';
    const iconBg = isDark ? '#334155' : '#E2E8F0';
    const textPrimary = isDark ? '#FFFFFF' : '#1E293B';
    const textSecondary = isDark ? '#94A3B8' : '#64748B';
    const arrowColor = isDark ? '#64748B' : '#94A3B8';

    // Icon colors based on status
    const getIconColor = () => {
        if (iconColor.includes('red')) return isDark ? '#F87171' : '#DC2626';
        if (iconColor.includes('green')) return isDark ? '#4ADE80' : '#16A34A';
        if (iconColor.includes('yellow')) return isDark ? '#FACC15' : '#CA8A04';
        return isDark ? '#94A3B8' : '#64748B';
    };

    const content = (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderColor }]}>
            <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                <Icon size={16} color={getIconColor()} />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.actionText, { color: textPrimary }]}>
                    <Text style={[styles.userName, { color: textSecondary }]}>{user}</Text> {action}
                </Text>
                <Text style={[styles.timeText, { color: textSecondary }]}>{time}</Text>
            </View>
            {onPress && (
                <Text style={[styles.arrow, { color: arrowColor }]}>→</Text>
            )}
        </View>
    );

    if (onPress) {
        return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
    }

    return content;
};

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
    },
    actionText: {
        fontSize: 14,
    },
    userName: {
        fontWeight: '600',
    },
    timeText: {
        fontSize: 12,
        marginTop: 2,
    },
    arrow: {
        fontSize: 18,
    },
});
