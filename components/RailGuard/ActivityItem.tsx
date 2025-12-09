import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ActivityItemProps {
    user: string;
    action: string;
    time: string;
    icon: LucideIcon;
    iconColor: string;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ user, action, time, icon: Icon, iconColor }) => {
    const { actualTheme } = useTheme();
    const isLight = actualTheme === 'light';

    // Styles derived from the user's provided code:
    // cardBg: isLight ? 'bg-slate-50' : 'bg-[#1a1a1a]'
    // border: isLight ? 'border-slate-200' : 'border-slate-800'
    const containerClasses = isLight
        ? 'bg-slate-50 border-slate-200'
        : 'bg-[#1a1a1a] border-slate-800';

    // iconBg: isLight ? 'bg-slate-200' : 'bg-slate-800'
    const iconBgClasses = isLight
        ? 'bg-slate-200'
        : 'bg-slate-800';

    // textPrimary: isLight ? 'text-slate-900' : 'text-white'
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';

    // textSecondary: isLight ? 'text-slate-600' : 'text-slate-400'
    const textSecondary = isLight ? 'text-slate-600' : 'text-slate-400';

    return (
        <View className={`border rounded-xl p-3 flex-row items-center gap-3 mb-3 ${containerClasses}`}>
            <View className={`w-8 h-8 rounded-lg items-center justify-center ${iconBgClasses}`}>
                <Icon size={16} className={iconColor} color={isLight && iconColor.includes('red') ? '#DC2626' :
                    isLight && iconColor.includes('green') ? '#16A34A' :
                        isLight && iconColor.includes('yellow') ? '#CA8A04' :
                            !isLight && iconColor.includes('red') ? '#F87171' :
                                !isLight && iconColor.includes('green') ? '#4ADE80' :
                                    !isLight && iconColor.includes('yellow') ? '#FACC15' : '#94A3B8'} />
                {/* Note: className text colors don't always apply to SVG props in RN seamlessly without direct 'color' prop usually, 
                     but we try to map the intent. Ideally we pass color directly. 
                     For now, I will use a helper or simple logic to exact color code if needed, 
                     but let's try to match the prop passing style. 
                     Actually standard Lucide-RN takes 'color' prop. 
                     The user code passes 'text-red-600' classes. I'll translate these to hex for the Icon component for safety. 
                  */}
            </View>
            <View className="flex-1">
                <Text className={`${textPrimary} text-sm`}>
                    <Text className={`font-semibold ${textSecondary}`}>{user}</Text> {action}
                </Text>
                <Text className={`${textSecondary} text-xs`}>{time}</Text>
            </View>
        </View>
    );
};
