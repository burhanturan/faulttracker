import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const { theme, actualTheme, setTheme } = useTheme();
    const isDark = actualTheme === 'dark';
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleChangePassword = async () => {
        if (!newPassword) {
            alert('Lütfen yeni bir şifre giriniz');
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('Şifreler eşleşmiyor');
            return;
        }

        try {
            await api.put(`/users/${user?.id}`, { password: newPassword });
            alert('Şifre başarıyla güncellendi');
            setNewPassword('');
            setConfirmPassword('');
            setShowChangePassword(false);
        } catch (error) {
            alert('Şifre güncellenemedi');
        }
    };

    const handleCancelPasswordChange = () => {
        setNewPassword('');
        setConfirmPassword('');
        setShowChangePassword(false);
    };

    return (
        <ScrollView className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-gray-50'}`} contentContainerStyle={{ flexGrow: 1 }}>
            <View className={`flex-1 p-6 items-center`}>
                {/* Profile Icon */}
                <View className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} p-6 rounded-full mb-4 shadow-lg`}>
                    <FontAwesome name="user" size={70} color={isDark ? '#FFD700' : '#EAB308'} />
                </View>

                {/* User Info */}
                <Text className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.fullName}</Text>
                <Text className={`mb-6 capitalize ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{user?.role?.replace('_', ' ')}</Text>

                <View className="w-full">
                    {/* Username Card */}
                    <View className={`p-4 rounded-lg mb-3 ${isDark ? 'bg-[#2C3036]' : 'bg-white border border-gray-200'}`}>
                        <Text className={`text-xs uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>KULLANICI ADI</Text>
                        <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.username}</Text>
                    </View>

                    {/* Email Card */}
                    {user?.email && (
                        <View className={`p-4 rounded-lg mb-3 ${isDark ? 'bg-[#2C3036]' : 'bg-white border border-gray-200'}`}>
                            <Text className={`text-xs uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>E-POSTA</Text>
                            <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.email}</Text>
                        </View>
                    )}

                    {/* Phone Card */}
                    {user?.phone && (
                        <View className={`p-4 rounded-lg mb-3 ${isDark ? 'bg-[#2C3036]' : 'bg-white border border-gray-200'}`}>
                            <Text className={`text-xs uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>TELEFON</Text>
                            <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.phone}</Text>
                        </View>
                    )}

                    {/* Theme Toggle */}
                    <View className={`p-4 rounded-lg mb-3 ${isDark ? 'bg-[#2C3036]' : 'bg-white border border-gray-200'}`}>
                        <Text className={`text-xs uppercase mb-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>TEMA</Text>
                        <View className={`flex-row rounded-lg p-1 ${isDark ? 'bg-[#1F2228]' : 'bg-gray-100'}`}>
                            <TouchableOpacity
                                onPress={() => setTheme('light')}
                                className={`flex-1 py-2 rounded-md items-center ${theme === 'light' ? (isDark ? 'bg-gray-600' : 'bg-white shadow-sm') : ''}`}
                            >
                                <Text className={`font-medium ${theme === 'light' ? (isDark ? 'text-white' : 'text-gray-900') : 'text-gray-500'}`}>Açık</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setTheme('dark')}
                                className={`flex-1 py-2 rounded-md items-center ${theme === 'dark' ? (isDark ? 'bg-gray-600' : 'bg-gray-900 shadow-sm') : ''}`}
                            >
                                <Text className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-500'}`}>Koyu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Password Change Section */}
                    <TouchableOpacity
                        onPress={() => showChangePassword ? handleCancelPasswordChange() : setShowChangePassword(true)}
                        className={`p-4 rounded-lg mb-3 flex-row justify-between items-center ${isDark ? 'bg-[#2C3036]' : 'bg-white border border-gray-200'}`}
                    >
                        <Text className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>Şifre Değiştir</Text>
                        <FontAwesome name={showChangePassword ? "chevron-up" : "chevron-down"} size={14} color={isDark ? "#9CA3AF" : "#6B7280"} />
                    </TouchableOpacity>

                    {showChangePassword && (
                        <View className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-[#2C3036]' : 'bg-white border border-gray-200'}`}>
                            <TextInput
                                placeholder="Yeni Şifre"
                                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                className={`p-3 rounded border mb-3 ${isDark ? 'bg-[#1F2228] border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                            />
                            <TextInput
                                placeholder="Şifreyi Onayla"
                                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                className={`p-3 rounded border mb-3 ${isDark ? 'bg-[#1F2228] border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                            />
                            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                                <Text className="text-red-600 text-xs mb-3">Şifreler eşleşmiyor</Text>
                            )}
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={handleChangePassword}
                                    disabled={!newPassword || newPassword !== confirmPassword}
                                    className={`flex-1 p-3 rounded-lg items-center ${(!newPassword || newPassword !== confirmPassword) ? (isDark ? 'bg-gray-700' : 'bg-gray-300') : (isDark ? 'bg-yellow-500' : 'bg-yellow-500')}`}
                                >
                                    <Text className={`font-bold ${(!newPassword || newPassword !== confirmPassword) ? 'text-gray-500' : 'text-black'}`}>Güncelle</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleCancelPasswordChange} className={`flex-1 p-3 rounded-lg items-center ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                    <Text className={`${isDark ? 'text-gray-300' : 'text-gray-700'} font-bold`}>İptal</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Logout Button */}
                    <TouchableOpacity onPress={signOut} className={`p-4 rounded-lg items-center mt-4 ${isDark ? 'bg-red-900/30 border border-red-900' : 'bg-red-50 border border-red-200'}`}>
                        <Text className="text-red-600 font-bold">Çıkış Yap</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}
