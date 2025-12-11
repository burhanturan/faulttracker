import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface QuickActionProps {
    title: string;
    value: string;
    color: string;
    icon?: LucideIcon;
    onPress?: () => void;
}

export const QuickAction: React.FC<QuickActionProps> = ({ title, value, color, icon: Icon, onPress }) => {
    const getColors = () => {
        if (color.includes('purple')) return { bg: '#F3E8FF', iconBg: '#E9D5FF', iconColor: '#7C3AED', textColor: '#6B21A8' };
        if (color.includes('orange')) return { bg: '#FFF7ED', iconBg: '#FFEDD5', iconColor: '#EA580C', textColor: '#C2410C' };
        if (color.includes('green')) return { bg: '#ECFDF5', iconBg: '#D1FAE5', iconColor: '#059669', textColor: '#047857' };
        if (color.includes('blue')) return { bg: '#EFF6FF', iconBg: '#DBEAFE', iconColor: '#2563EB', textColor: '#1D4ED8' };
        return { bg: '#F9FAFB', iconBg: '#F3F4F6', iconColor: '#374151', textColor: '#1F2937' };
    };

    const { bg, iconBg, iconColor, textColor } = getColors();

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.card, { backgroundColor: bg }]}
        >
            {/* Icon */}
            {Icon && (
                <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                    <Icon size={22} color={iconColor} />
                </View>
            )}
            {/* Text Content */}
            <View style={styles.textContainer}>
                <Text style={[styles.value, { color: textColor }]}>{value}</Text>
                <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>{title}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        gap: 12,
        minHeight: 80,
        flex: 1,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    iconContainer: {
        padding: 10,
        borderRadius: 12,
    },
    textContainer: {
        flex: 1,
    },
    value: {
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 32,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.85,
    },
});
