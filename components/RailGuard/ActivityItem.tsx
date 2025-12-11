import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
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
    const isLight = actualTheme === 'light';

    const containerClasses = isLight
        ? 'bg-slate-50 border-slate-200'
        : 'bg-[#1a1a1a] border-slate-800';

    const iconBgClasses = isLight
        ? 'bg-slate-200'
        : 'bg-slate-800';

    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-600' : 'text-slate-400';

    const content = (
        <View className={`border rounded-xl p-3 flex-row items-center gap-3 mb-3 ${containerClasses}`}>
            <View className={`w-8 h-8 rounded-lg items-center justify-center ${iconBgClasses}`}>
                <Icon size={16} className={iconColor} color={isLight && iconColor.includes('red') ? '#DC2626' :
                    isLight && iconColor.includes('green') ? '#16A34A' :
                        isLight && iconColor.includes('yellow') ? '#CA8A04' :
                            !isLight && iconColor.includes('red') ? '#F87171' :
                                !isLight && iconColor.includes('green') ? '#4ADE80' :
                                    !isLight && iconColor.includes('yellow') ? '#FACC15' : '#94A3B8'} />
            </View>
            <View className="flex-1">
                <Text className={`${textPrimary} text-sm`}>
                    <Text className={`font-semibold ${textSecondary}`}>{user}</Text> {action}
                </Text>
                <Text className={`${textSecondary} text-xs`}>{time}</Text>
            </View>
            {onPress && (
                <Text className={`${textSecondary} text-lg`}>→</Text>
            )}
        </View>
    );

    if (onPress) {
        return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
    }

    return content;
};
