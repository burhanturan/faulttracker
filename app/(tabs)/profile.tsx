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
        <ScrollView className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`} contentContainerStyle={{ flexGrow: 1 }}>
            <View className={`${isDark ? 'bg-dark-card' : 'bg-light-card'} flex-1 p-6 shadow-sm items-center`}>
                <View className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} p-4 rounded-full mb-4`}>
                    <FontAwesome name="user" size={60} color={isDark ? '#FFD700' : '#EAB308'} />
                </View>
                <Text className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>{user?.fullName}</Text>
                <Text className={`mb-6 capitalize ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user?.role?.replace('_', ' ')}</Text>

                <View className="w-full">
                    <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-light-card border-gray-200'} p-4 rounded-lg border mb-4`}>
                        <Text className={`text-xs uppercase mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Kullanıcı Adı</Text>
                        <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{user?.username}</Text>
                    </View>

                    {user?.email && (
                        <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-light-card border-gray-200'} p-4 rounded-lg border mb-4`}>
                            <Text className={`text-xs uppercase mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>E-posta</Text>
                            <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{user?.email}</Text>
                        </View>
                    )}

                    {user?.phone && (
                        <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-light-card border-gray-200'} p-4 rounded-lg border mb-4`}>
                            <Text className={`text-xs uppercase mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Telefon</Text>
                            <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{user?.phone}</Text>
                        </View>
                    )}

                    <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-light-card border-gray-200'} p-4 rounded-lg border mb-4`}>
                        <Text className={`text-xs uppercase mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tema</Text>
                        <View className={`flex-row rounded-lg p-1 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                            <TouchableOpacity
                                onPress={() => setTheme('light')}
                                className={`flex-1 py-2 rounded-md items-center ${theme === 'light' ? 'bg-white shadow-sm' : ''}`}
                            >
                                <Text className={`font-medium ${theme === 'light' ? 'text-black' : 'text-gray-500'}`}>Açık</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setTheme('dark')}
                                className={`flex-1 py-2 rounded-md items-center ${theme === 'dark' ? 'bg-gray-600 shadow-sm' : ''}`}
                            >
                                <Text className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-500'}`}>Koyu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => showChangePassword ? handleCancelPasswordChange() : setShowChangePassword(true)}
                        className={`p-4 rounded-lg mb-3 flex-row justify-between items-center ${showChangePassword ? (isDark ? 'bg-dark-card border-dark-primary' : 'bg-light-card border-light-primary') : (isDark ? 'bg-dark-card border-dark-card' : 'bg-light-card border-gray-200')}`}
                    >
                        <Text className={`${showChangePassword ? (isDark ? 'text-dark-primary' : 'text-light-primary') : (isDark ? 'text-white' : 'text-gray-700')} font-medium`}>Şifre Değiştir</Text>
                        <FontAwesome name={showChangePassword ? "chevron-up" : "chevron-down"} size={14} color={showChangePassword ? (isDark ? "#FFD700" : "#EAB308") : "#6B7280"} />
                    </TouchableOpacity>

                    {showChangePassword && (
                        <View className={`mb-4 p-4 rounded-lg border shadow-sm ${isDark ? 'bg-dark-card border-dark-card' : 'bg-light-card border-gray-200'}`}>
                            <TextInput
                                placeholder="Yeni Şifre"
                                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                className={`p-3 rounded border mb-3 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
                            />
                            <TextInput
                                placeholder="Şifreyi Onayla"
                                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                className={`p-3 rounded border mb-3 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
                            />
                            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                                <Text className="text-red-600 text-xs mb-3">Şifreler eşleşmiyor</Text>
                            )}
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={handleChangePassword}
                                    disabled={!newPassword || newPassword !== confirmPassword}
                                    className={`flex-1 p-3 rounded-lg items-center ${(!newPassword || newPassword !== confirmPassword) ? 'bg-gray-300' : (isDark ? 'bg-dark-primary' : 'bg-light-primary')}`}
                                >
                                    <Text className={`${isDark ? 'text-black' : 'text-white'} font-bold`}>Güncelle</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleCancelPasswordChange} className={`flex-1 p-3 rounded-lg items-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                    <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold`}>İptal</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity onPress={signOut} className={`p-4 rounded-lg border items-center mt-4 ${isDark ? 'bg-red-900/20 border-red-900' : 'bg-red-50 border-red-100'}`}>
                        <Text className="text-red-600 font-bold">Çıkış Yap</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}
