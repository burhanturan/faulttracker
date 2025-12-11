import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    // Icon background: light version of the color (15% opacity)
    const iconBgColor = color + '26';

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.cardContainer, fullWidth && styles.fullWidth]}
            disabled={!onPress}
        >
            <View style={[styles.card, fullWidth && styles.cardFullWidth]}>
                {/* Subtle accent glow */}
                <View style={[styles.accentGlow, { backgroundColor: color }]} />

                {/* Icon Container */}
                <View style={[styles.iconContainer, fullWidth && styles.iconContainerLarge, { backgroundColor: iconBgColor }]}>
                    <Icon size={fullWidth ? 36 : 28} color={color} />
                </View>

                {/* Text Content */}
                <View style={styles.textContainer}>
                    <Text style={[styles.value, fullWidth && styles.valueLarge]}>{value}</Text>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    {subtitle && (
                        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
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
        backgroundColor: '#EFF3F8',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
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
        color: '#1F2937',
        letterSpacing: -0.5,
    },
    valueLarge: {
        fontSize: 36,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginTop: 2,
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6B7280',
    },
});


