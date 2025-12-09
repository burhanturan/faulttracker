import { LinearGradient } from 'expo-linear-gradient';
import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: string; // Hex color for icon and gradient accent
    onPress?: () => void;
    subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, onPress, subtitle }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="w-[48%] mb-4"
            disabled={!onPress}
        >
            <View
                style={{ backgroundColor: '#EFF3F8' }}
                className="rounded-2xl p-4 border border-gray-200 h-[150px] justify-between relative overflow-hidden shadow-sm"
            >
                {/* Subtle accent glow */}
                <View
                    style={{ backgroundColor: color, opacity: 0.05 }}
                    className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl"
                />

                <View className="flex-row justify-between items-start">
                    <View className="p-2.5 rounded-xl bg-white/80 border border-gray-200">
                        <Icon size={22} color={color} />
                    </View>
                </View>

                <View>
                    <Text className="text-3xl font-bold text-gray-900 tracking-tight">{value}</Text>
                    <Text className="text-gray-600 text-sm font-medium mt-1">{title}</Text>
                    {subtitle && (
                        <Text className="text-gray-500 text-xs mt-1">{subtitle}</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};
