import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: string; // Hex color for icon
    onPress?: () => void;
    subtitle?: string;
    fullWidth?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, onPress, subtitle, fullWidth }) => {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    // Icon background: light version of the color (15% opacity)
    const iconBgColor = color + '26';

    // Dark mode colors
    const cardBg = isDark ? '#1E293B' : '#EFF3F8';
    const borderColor = isDark ? '#334155' : '#E5E7EB';
    const valueColor = isDark ? '#FFFFFF' : '#1F2937';
    const titleColor = isDark ? '#94A3B8' : '#374151';
    const subtitleColor = isDark ? '#64748B' : '#6B7280';

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.cardContainer, fullWidth && styles.fullWidth]}
            disabled={!onPress}
        >
            <View style={[
                styles.card,
                fullWidth && styles.cardFullWidth,
                { backgroundColor: cardBg, borderColor: borderColor }
            ]}>
                {/* Subtle accent glow */}
                <View style={[styles.accentGlow, { backgroundColor: color }]} />

                {/* Icon Container */}
                <View style={[styles.iconContainer, fullWidth && styles.iconContainerLarge, { backgroundColor: iconBgColor }]}>
                    <Icon size={fullWidth ? 36 : 28} color={color} />
                </View>

                {/* Text Content */}
                <View style={styles.textContainer}>
                    <Text style={[styles.value, fullWidth && styles.valueLarge, { color: valueColor }]}>{value}</Text>
                    <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>{title}</Text>
                    {subtitle && (
                        <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={1}>{subtitle}</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        width: '48%',
        marginBottom: 16,
    },
    fullWidth: {
        width: '100%',
    },
    card: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 16,
        overflow: 'hidden',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardFullWidth: {
        height: 110,
    },
    accentGlow: {
        position: 'absolute',
        right: -24,
        top: -24,
        width: 112,
        height: 112,
        borderRadius: 56,
        opacity: 0.08,
    },
    iconContainer: {
        padding: 12,
        borderRadius: 12,
    },
    iconContainerLarge: {
        padding: 16,
    },
    textContainer: {
        justifyContent: 'center',
    },
    value: {
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    valueLarge: {
        fontSize: 36,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        marginTop: 2,
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '500',
    },
});
