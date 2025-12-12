import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, Search, Settings } from 'lucide-react-native';
import React, { useRef } from 'react';
import { Dimensions, Pressable, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
    user: any;
    onSearch?: (text: string) => void;
    title?: string;
    showSearch?: boolean;
    showGreeting?: boolean;
}

export const RailGuardHeader: React.FC<HeaderProps> = ({ user, onSearch, title, showSearch = true, showGreeting = true }) => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const screenWidth = Dimensions.get('window').width;
    const searchBoxWidth = screenWidth - 48; // 24px padding on each side
    const inputRef = useRef<TextInput>(null);
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    // Dark mode: Navy gradient, Light mode: Blue gradient
    const gradientColors: readonly [string, string, ...string[]] = isDark
        ? ['#0F172A', '#1E293B', '#1E293B'] as const
        : ['#1e40af', '#1c4ed8', '#2563eb'] as const;

    const searchBgColors: readonly [string, string, ...string[]] = isDark
        ? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'] as const
        : ['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.15)'] as const;

    const iconBgColor = isDark ? 'rgba(100, 116, 139, 0.3)' : 'rgba(59, 130, 246, 0.4)';
    const subtitleColor = isDark ? '#94A3B8' : '#dbeafe';

    return (
        <LinearGradient
            colors={gradientColors}
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
                paddingTop: insets.top + 15,
                paddingBottom: 24,
                alignSelf: 'stretch',
            }}
        >
            <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent={true}
            />

            <View className="px-6 pt-6">
                {/* Top Row: Title & Actions */}
                <View className="flex-row justify-between items-start mb-6">
                    <View className="mt-1 flex-1">
                        <Text className="text-white text-3xl font-bold tracking-tight leading-tight">{title || 'Admin Paneli'}</Text>
                        {showGreeting && (
                            <Text style={{ color: subtitleColor, fontSize: 18, fontWeight: '500', marginTop: 4 }}>
                                Merhaba, {user?.fullName ?? 'Kullanıcı'}
                            </Text>
                        )}
                    </View>
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            style={{ backgroundColor: iconBgColor, width: 52, height: 52 }}
                            className="rounded-2xl justify-center items-center backdrop-blur-md"
                            onPress={() => router.push('/settings')}
                        >
                            <Settings size={26} color="white" strokeWidth={2} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ backgroundColor: iconBgColor, width: 52, height: 52 }}
                            className="rounded-2xl justify-center items-center backdrop-blur-md relative"
                        >
                            <Bell size={26} color="white" strokeWidth={2} />
                            <View style={{ position: 'absolute', top: 14, right: 16, width: 10, height: 10, backgroundColor: '#EF4444', borderRadius: 5, borderWidth: 2, borderColor: isDark ? '#1E293B' : '#1e40af' }} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar with Gradient */}
                {showSearch && (
                    <View className="items-center w-full">
                        <LinearGradient
                            colors={searchBgColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ borderRadius: 12, height: 50, width: searchBoxWidth }}
                            className="relative z-50"
                        >
                            <Pressable
                                onPress={() => inputRef.current?.focus()}
                                className="flex-1 flex-row items-center px-4"
                            >
                                <Search size={22} color={isDark ? '#64748B' : '#93C5FD'} strokeWidth={2.5} style={{ opacity: 0.8 }} />
                                <TextInput
                                    ref={inputRef}
                                    placeholder="Arıza Ara..."
                                    placeholderTextColor={isDark ? '#475569' : 'rgba(255, 255, 255, 0.5)'}
                                    className="flex-1 ml-3 text-white font-medium text-lg leading-none"
                                    style={{ paddingVertical: 0, textAlignVertical: 'center' }}
                                    onChangeText={onSearch}
                                    cursorColor={isDark ? '#22D3EE' : '#FFFFFF'}
                                    selectionColor={isDark ? '#22D3EE' : '#93C5FD'}
                                    autoCorrect={false}
                                />
                            </Pressable>
                        </LinearGradient>
                    </View>
                )}
            </View>
        </LinearGradient>
    );
};
