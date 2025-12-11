import { FontAwesome } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlert from '../components/CustomAlert';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isChecked, setChecked] = useState(false);
    const { signIn } = useAuth();
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState<{ visible: boolean, title: string, message: string, type: 'success' | 'error' | 'info' | 'confirm', onConfirm?: () => void }>({
        visible: false, title: '', message: '', type: 'info'
    });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' | 'confirm' = 'info', onConfirm?: () => void) => {
        setAlertConfig({ visible: true, title, message, type, onConfirm });
    };

    const closeAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

    const handleLogin = async () => {
        if (!username || !password) {
            showAlert('Eksik Bilgi', 'Lütfen kullanıcı adı ve şifrenizi giriniz.', 'error');
            return;
        }

        try {
            await signIn(username, password);
        } catch (error) {
            showAlert('Giriş Başarısız', 'Kullanıcı adı veya şifre hatalı.', 'error');
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <LinearGradient
                colors={isDark ? ['#1E1E1E', '#121212'] : ['#F3F4F6', '#E5E7EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            >
                <SafeAreaView style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1, width: '100%' }}
                    >
                        <ScrollView
                            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                        >
                            {/* Logo Section */}
                            <View className="items-center mb-8">
                                <View className="flex-row items-center mb-2">
                                    <FontAwesome name="train" size={40} color={isDark ? "white" : "#EAB308"} style={{ marginRight: 10 }} />
                                    <Text className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} tracking-wider`}>FAULT<Text className={isDark ? "text-red-500" : "text-yellow-500"}>TRACKER</Text></Text>
                                </View>
                                <Text className={`${isDark ? 'text-gray-300' : 'text-gray-500'} text-sm tracking-widest uppercase`}>Demiryolu Bakım Sistemi</Text>
                            </View>

                            {/* Login Card */}
                            <View className={`${isDark ? 'bg-dark-card' : 'bg-white'} w-full rounded-lg p-8 shadow-2xl`}>
                                <Text className={`text-2xl font-bold text-center mb-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>Giriş Yap</Text>

                                {/* Username Input */}
                                <View className="mb-4">
                                    <Text className={`font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Kullanıcı Adı:</Text>
                                    <View className={`flex-row items-center rounded-md px-4 h-12 ${isDark ? 'bg-dark-bg' : 'bg-gray-100'}`}>
                                        <FontAwesome name="user" size={18} color={isDark ? '#9CA3AF' : '#666'} />
                                        <TextInput
                                            className={`flex-1 ml-3 ${isDark ? 'text-white' : 'text-gray-800'}`}
                                            placeholder="Kullanıcı Adı"
                                            placeholderTextColor={isDark ? '#6B7280' : '#999'}
                                            value={username}
                                            onChangeText={setUsername}
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                {/* Password Input */}
                                <View className="mb-4">
                                    <Text className={`font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Şifre:</Text>
                                    <View className={`flex-row items-center rounded-md px-4 h-12 ${isDark ? 'bg-dark-bg' : 'bg-gray-100'}`}>
                                        <FontAwesome name="lock" size={18} color={isDark ? '#9CA3AF' : '#666'} />
                                        <TextInput
                                            className={`flex-1 ml-3 ${isDark ? 'text-white' : 'text-gray-800'}`}
                                            placeholder="Şifre"
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
                                        color={isChecked ? (isDark ? '#B91C1C' : '#EAB308') : undefined}
                                        style={{ borderRadius: 4 }}
                                    />
                                    <Text className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Beni Hatırla</Text>
                                </View>

                                {/* Sign In Button */}
                                <TouchableOpacity
                                    className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} h-12 rounded-md items-center justify-center active:opacity-90 shadow-md`}
                                    onPress={handleLogin}
                                >
                                    <Text className={`${isDark ? 'text-black' : 'text-white'} font-bold text-lg uppercase tracking-wide`}>Giriş Yap</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </LinearGradient>
            <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={closeAlert} onConfirm={alertConfig.onConfirm} />
        </View>
    );
}
