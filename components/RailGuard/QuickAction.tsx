import { ArrowRight } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface QuickActionProps {
    title: string;
    value: string;
    color: string;
    onPress?: () => void;
}

export const QuickAction: React.FC<QuickActionProps> = ({ title, value, color, onPress }) => {
    const getColors = () => {
        if (color.includes('purple')) return { bg: 'bg-purple-100', text: 'text-purple-800' };
        if (color.includes('orange')) return { bg: 'bg-orange-100', text: 'text-orange-800' };
        if (color.includes('green')) return { bg: 'bg-emerald-100', text: 'text-emerald-800' };
        if (color.includes('blue')) return { bg: 'bg-blue-100', text: 'text-blue-800' };
        return { bg: 'bg-gray-100', text: 'text-gray-800' };
    };

    const { bg, text } = getColors();

    return (
        <TouchableOpacity
            onPress={onPress}
            className={`${bg} p-5 rounded-2xl flex-1 justify-between min-h-[120px]`}
        >
            <View>
                <Text className={`${text} text-3xl font-bold mb-1`}>{value}</Text>
                <Text className={`${text} font-medium opacity-80`}>{title}</Text>
            </View>
            <View className="self-end bg-white/30 p-2 rounded-full">
                <ArrowRight size={16} color={color.includes('text-white') ? 'white' : 'black'} className="opacity-50" />
            </View>
        </TouchableOpacity>
    );
};
