import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, Search, Settings } from 'lucide-react-native';
import React, { useRef } from 'react';
import { Dimensions, Pressable, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
                            <Text className="text-blue-100 text-lg font-medium mt-1">
                                Merhaba, {user?.fullName ?? 'Kullanıcı'}
                            </Text>
                        )}
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
                {showSearch && (
                    <View className="items-center w-full">
                        <LinearGradient
                            colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.15)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ borderRadius: 12, height: 50, width: searchBoxWidth }}
                            className="relative z-50"
                        >
                            <Pressable
                                onPress={() => inputRef.current?.focus()}
                                className="flex-1 flex-row items-center px-4"
                            >
                                <Search size={22} color="#dbeafe" strokeWidth={2.5} style={{ opacity: 0.9 }} />
                                <TextInput
                                    ref={inputRef}
                                    placeholder="Arıza Ara..."
                                    placeholderTextColor="#dbeafe"
                                    className="flex-1 ml-3 text-white font-medium text-lg leading-none"
                                    style={{ paddingVertical: 0, textAlignVertical: 'center' }}
                                    onChangeText={onSearch}
                                    cursorColor="#FFFFFF"
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
