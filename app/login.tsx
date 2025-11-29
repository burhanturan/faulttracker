import { FontAwesome } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isChecked, setChecked] = useState(false);
    const { signIn } = useAuth();
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    return (
        <View className="flex-1">
            <LinearGradient
                colors={isDark ? ['#1F2937', '#111827'] : ['#8B0000', '#2F2F2F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-1 justify-center items-center"
            >
                <SafeAreaView className="flex-1 w-full justify-center items-center">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="flex-1 w-full"
                    >
                        <ScrollView
                            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                        >
                            {/* Logo Section */}
                            <View className="items-center mb-8">
                                <View className="flex-row items-center mb-2">
                                    <FontAwesome name="train" size={40} color="white" style={{ marginRight: 10 }} />
                                    <Text className="text-4xl font-bold text-white tracking-wider">FAULT<Text className="text-red-500">TRACKER</Text></Text>
                                </View>
                                <Text className="text-gray-300 text-sm tracking-widest uppercase">Railway Maintenance System</Text>
                            </View>

                            {/* Login Card */}
                            <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} w-full rounded-lg p-8 shadow-2xl`}>
                                <Text className={`text-2xl font-bold text-center mb-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>Log in</Text>

                                {/* Username Input */}
                                <View className="mb-4">
                                    <Text className={`font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Username:</Text>
                                    <View className={`flex-row items-center rounded-md px-4 h-12 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                        <FontAwesome name="user" size={18} color={isDark ? '#9CA3AF' : '#666'} />
                                        <TextInput
                                            className={`flex-1 ml-3 ${isDark ? 'text-white' : 'text-gray-800'}`}
                                            placeholder="Username"
                                            placeholderTextColor={isDark ? '#6B7280' : '#999'}
                                            value={username}
                                            onChangeText={setUsername}
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                {/* Password Input */}
                                <View className="mb-4">
                                    <Text className={`font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Password:</Text>
                                    <View className={`flex-row items-center rounded-md px-4 h-12 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                        <FontAwesome name="lock" size={18} color={isDark ? '#9CA3AF' : '#666'} />
                                        <TextInput
                                            className={`flex-1 ml-3 ${isDark ? 'text-white' : 'text-gray-800'}`}
                                            placeholder="Password"
                                            placeholderTextColor={isDark ? '#6B7280' : '#999'}
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                        />
                                    </View>
                                </View>

                                {/* Remember Me */}
                                <View className="flex-row items-center mb-6">
                                    <Checkbox
                                        value={isChecked}
                                        onValueChange={setChecked}
                                        color={isChecked ? '#B91C1C' : undefined}
                                        style={{ borderRadius: 4 }}
                                    />
                                    <Text className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Remember me</Text>
                                </View>

                                {/* Sign In Button */}
                                <TouchableOpacity
                                    className="bg-red-700 h-12 rounded-md items-center justify-center active:bg-red-800 shadow-md"
                                    onPress={() => signIn(username, password)}
                                >
                                    <Text className="text-white font-bold text-lg uppercase tracking-wide">Sign In</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}
