import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, Search, Settings } from 'lucide-react-native';
import React from 'react';
import { StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
    user: any;
    onSearch?: (text: string) => void;
    title?: string;
}

export const RailGuardHeader: React.FC<HeaderProps> = ({ user, onSearch, title }) => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    // With opaque status bar, we don't need top inset padding for the view itself, 
    // but typically we might want a little top breathing room if standard padding isn't enough.
    // However, the design shows content starting normally. 
    // removing the large insets.top padding.

    return (
        <LinearGradient
            colors={['#1e40af', '#1c4ed8', '#2563eb']} // Blue gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
                borderBottomRightRadius: 0,
                borderBottomLeftRadius: 0,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 10,
                zIndex: 50,
                paddingBottom: 24,
                alignSelf: 'stretch',
                marginHorizontal: -16,
            }}
        >
            {/* Set background color explicitly to match header. Translucent false means view starts below it. */}
            <StatusBar
                barStyle="light-content"
                backgroundColor="#1c4ed8"
                translucent={false}
            />

            <View className="px-6 pt-6">
                {/* Top Row: Title & Actions */}
                <View className="flex-row justify-between items-start mb-8">
                    <View className="mt-1">
                        <Text className="text-white text-3xl font-bold tracking-tight leading-tight">{title || 'Admin Paneli'}</Text>
                        <Text className="text-blue-100 text-lg font-medium mt-1">Merhaba, {user?.fullName || 'Chief Engineer'}</Text>
                    </View>
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            style={{ backgroundColor: 'rgba(59, 130, 246, 0.4)', width: 52, height: 52 }}
                            className="rounded-2xl justify-center items-center backdrop-blur-md"
                            onPress={() => router.push('/settings')}
                        >
                            <Settings size={26} color="white" strokeWidth={2} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ backgroundColor: 'rgba(59, 130, 246, 0.4)', width: 52, height: 52 }}
                            className="rounded-2xl justify-center items-center backdrop-blur-md relative"
                        >
                            <Bell size={26} color="white" strokeWidth={2} />
                            <View className="absolute top-3.5 right-4 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-blue-700" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar with Gradient */}
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ borderRadius: 999 }}
                    className="flex-row items-center px-4 py-2.5"
                >
                    <Search size={20} color="#dbeafe" strokeWidth={2.5} />
                    <TextInput
                        placeholder="Ara..."
                        placeholderTextColor="#dbeafe"
                        className="flex-1 ml-3 text-white font-medium text-base"
                        onChangeText={onSearch}
                    />
                </LinearGradient>
            </View>
        </LinearGradient>
    );
};
