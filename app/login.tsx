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

    // Theme colors matching the app
    const colors = {
        // Background gradient
        gradientStart: isDark ? '#0F172A' : '#F8FAFC',
        gradientEnd: isDark ? '#1E293B' : '#E2E8F0',
        // Card
        cardBg: isDark ? '#1E293B' : '#FFFFFF',
        cardBorder: isDark ? '#334155' : '#E2E8F0',
        // Text
        textPrimary: isDark ? '#FFFFFF' : '#1F2937',
        textSecondary: isDark ? '#94A3B8' : '#6B7280',
        textMuted: isDark ? '#64748B' : '#9CA3AF',
        // Input
        inputBg: isDark ? '#0F172A' : '#F3F4F6',
        inputBorder: isDark ? '#334155' : '#E2E8F0',
        inputIcon: isDark ? '#64748B' : '#9CA3AF',
        inputPlaceholder: isDark ? '#475569' : '#9CA3AF',
        // Button
        buttonBg: isDark ? '#22D3EE' : '#1c4ed8',
        buttonText: isDark ? '#0F172A' : '#FFFFFF',
        // Accent
        accent: isDark ? '#22D3EE' : '#1c4ed8',
        // Checkbox
        checkboxColor: isDark ? '#22D3EE' : '#1c4ed8',
    };

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
                colors={[colors.gradientStart, colors.gradientEnd]}
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
                            <View style={{ alignItems: 'center', marginBottom: 32 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <FontAwesome name="train" size={40} color={colors.accent} style={{ marginRight: 10 }} />
                                    <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.textPrimary, letterSpacing: 2 }}>
                                        FAULT<Text style={{ color: colors.accent }}>TRACKER</Text>
                                    </Text>
                                </View>
                                <Text style={{ color: colors.textSecondary, fontSize: 12, letterSpacing: 3, textTransform: 'uppercase' }}>
                                    Demiryolu Bakım Sistemi
                                </Text>
                            </View>

                            {/* Login Card */}
                            <View style={{
                                backgroundColor: colors.cardBg,
                                width: '100%',
                                borderRadius: 16,
                                padding: 32,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 10 },
                                shadowOpacity: isDark ? 0.5 : 0.15,
                                shadowRadius: 20,
                                elevation: 10,
                                borderWidth: 1,
                                borderColor: colors.cardBorder,
                            }}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 32, color: colors.textPrimary }}>
                                    Giriş Yap
                                </Text>

                                {/* Username Input */}
                                <View style={{ marginBottom: 16 }}>
                                    <Text style={{ fontWeight: '600', marginBottom: 8, color: colors.textSecondary }}>Kullanıcı Adı:</Text>
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        borderRadius: 12,
                                        paddingHorizontal: 16,
                                        height: 52,
                                        backgroundColor: colors.inputBg,
                                        borderWidth: 1,
                                        borderColor: colors.inputBorder,
                                    }}>
                                        <FontAwesome name="user" size={18} color={colors.inputIcon} />
                                        <TextInput
                                            style={{ flex: 1, marginLeft: 12, color: colors.textPrimary, fontSize: 16 }}
                                            placeholder="Kullanıcı Adı"
                                            placeholderTextColor={colors.inputPlaceholder}
                                            value={username}
                                            onChangeText={setUsername}
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                {/* Password Input */}
                                <View style={{ marginBottom: 16 }}>
                                    <Text style={{ fontWeight: '600', marginBottom: 8, color: colors.textSecondary }}>Şifre:</Text>
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        borderRadius: 12,
                                        paddingHorizontal: 16,
                                        height: 52,
                                        backgroundColor: colors.inputBg,
                                        borderWidth: 1,
                                        borderColor: colors.inputBorder,
                                    }}>
                                        <FontAwesome name="lock" size={18} color={colors.inputIcon} />
                                        <TextInput
                                            style={{ flex: 1, marginLeft: 12, color: colors.textPrimary, fontSize: 16 }}
                                            placeholder="Şifre"
                                            placeholderTextColor={colors.inputPlaceholder}
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                        />
                                    </View>
                                </View>

                                {/* Remember Me */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                                    <Checkbox
                                        value={isChecked}
                                        onValueChange={setChecked}
                                        color={isChecked ? colors.checkboxColor : undefined}
                                        style={{ borderRadius: 4, width: 20, height: 20 }}
                                    />
                                    <Text style={{ marginLeft: 10, color: colors.textSecondary }}>Beni Hatırla</Text>
                                </View>

                                {/* Sign In Button */}
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: colors.buttonBg,
                                        height: 52,
                                        borderRadius: 12,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        shadowColor: colors.buttonBg,
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 8,
                                        elevation: 5,
                                    }}
                                    onPress={handleLogin}
                                >
                                    <Text style={{ color: colors.buttonText, fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
                                        Giriş Yap
                                    </Text>
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
