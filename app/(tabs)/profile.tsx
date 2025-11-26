import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleChangePassword = async () => {
        if (!newPassword) {
            alert('Please enter a new password');
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            await api.put(`/users/${user?.id}`, { password: newPassword });
            alert('Password updated successfully');
            setNewPassword('');
            setConfirmPassword('');
            setShowChangePassword(false);
        } catch (error) {
            alert('Failed to update password');
        }
    };

    const handleCancelPasswordChange = () => {
        setNewPassword('');
        setConfirmPassword('');
        setShowChangePassword(false);
    };

    return (
        <ScrollView className="flex-1 bg-gray-50">
            <View className="bg-white p-6 pt-12 shadow-sm mb-6 items-center">
                <View className="bg-gray-100 p-4 rounded-full mb-4">
                    <FontAwesome name="user" size={60} color="#4B5563" />
                </View>
                <Text className="text-2xl font-bold text-gray-800 mb-1">{user?.fullName}</Text>
                <Text className="text-gray-500 mb-6 capitalize">{user?.role?.replace('_', ' ')}</Text>

                <View className="w-full">
                    <View className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                        <Text className="text-gray-500 text-xs uppercase mb-1">Username</Text>
                        <Text className="text-gray-800 font-medium">{user?.username}</Text>
                    </View>

                    {user?.email && (
                        <View className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                            <Text className="text-gray-500 text-xs uppercase mb-1">Email</Text>
                            <Text className="text-gray-800 font-medium">{user?.email}</Text>
                        </View>
                    )}

                    {user?.phone && (
                        <View className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                            <Text className="text-gray-500 text-xs uppercase mb-1">Phone</Text>
                            <Text className="text-gray-800 font-medium">{user?.phone}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={() => showChangePassword ? handleCancelPasswordChange() : setShowChangePassword(true)}
                        className={`p-4 rounded-lg mb-3 flex-row justify-between items-center ${showChangePassword ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'}`}
                    >
                        <Text className={`${showChangePassword ? 'text-blue-600' : 'text-gray-700'} font-medium`}>Change Password</Text>
                        <FontAwesome name={showChangePassword ? "chevron-up" : "chevron-down"} size={14} color={showChangePassword ? "#2563EB" : "#6B7280"} />
                    </TouchableOpacity>

                    {showChangePassword && (
                        <View className="mb-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <TextInput
                                placeholder="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                className="bg-gray-50 p-3 rounded border border-gray-200 mb-3"
                            />
                            <TextInput
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                className="bg-gray-50 p-3 rounded border border-gray-200 mb-3"
                            />
                            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                                <Text className="text-red-600 text-xs mb-3">Passwords do not match</Text>
                            )}
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={handleChangePassword}
                                    disabled={!newPassword || newPassword !== confirmPassword}
                                    className={`flex-1 p-3 rounded-lg items-center ${(!newPassword || newPassword !== confirmPassword) ? 'bg-gray-300' : 'bg-blue-600'}`}
                                >
                                    <Text className="text-white font-bold">Update</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleCancelPasswordChange} className="flex-1 bg-gray-100 p-3 rounded-lg items-center">
                                    <Text className="text-gray-600 font-bold">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity onPress={signOut} className="bg-red-50 p-4 rounded-lg border border-red-100 items-center mt-4">
                        <Text className="text-red-600 font-bold">Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}
