import { FontAwesome } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isChecked, setChecked] = useState(false);
    const { signIn } = useAuth();

    return (
        <View className="flex-1">
            <LinearGradient
                colors={['#8B0000', '#2F2F2F']} // Deep Red to Dark Grey
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-1 justify-center items-center"
            >
                <SafeAreaView className="flex-1 w-full justify-center items-center">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="w-full items-center px-6"
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
                        <View className="bg-white w-full rounded-lg p-8 shadow-2xl">
                            <Text className="text-2xl font-bold text-center text-gray-800 mb-8">Log in</Text>

                            {/* Username Input */}
                            <View className="mb-4">
                                <Text className="text-gray-600 font-bold mb-2">Username:</Text>
                                <View className="flex-row items-center bg-gray-200 rounded-md px-4 h-12">
                                    <FontAwesome name="user" size={18} color="#666" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-800"
                                        placeholder="Username"
                                        placeholderTextColor="#999"
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            {/* Password Input */}
                            <View className="mb-4">
                                <Text className="text-gray-600 font-bold mb-2">Password:</Text>
                                <View className="flex-row items-center bg-gray-200 rounded-md px-4 h-12">
                                    <FontAwesome name="lock" size={18} color="#666" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-800"
                                        placeholder="Password"
                                        placeholderTextColor="#999"
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
                                <Text className="text-gray-600 ml-2">Remember me</Text>
                            </View>

                            {/* Sign In Button */}
                            <TouchableOpacity
                                className="bg-red-700 h-12 rounded-md items-center justify-center active:bg-red-800 shadow-md"
                                onPress={() => signIn(username, password)}
                            >
                                <Text className="text-white font-bold text-lg uppercase tracking-wide">Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}
