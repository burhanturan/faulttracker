import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info' | 'confirm';
    onClose: () => void;
    onConfirm?: () => void;
}

export default function CustomAlert({ visible, title, message, type = 'info', onClose, onConfirm }: CustomAlertProps) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    if (!visible) return null;

    let iconName: keyof typeof FontAwesome.glyphMap = 'info-circle';
    let iconColor = '#3B82F6'; // Blue

    if (type === 'success') {
        iconName = 'check-circle';
        iconColor = '#10B981'; // Green
    } else if (type === 'error') {
        iconName = 'times-circle';
        iconColor = '#EF4444'; // Red
    } else if (type === 'info') {
        iconName = 'info-circle';
        iconColor = '#EAB308'; // Gold/Yellow
    } else if (type === 'confirm') {
        iconName = 'question-circle';
        iconColor = '#F59E0B'; // Orange
    }

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black/50 px-4">
                <View className={`w-full max-w-sm p-6 rounded-2xl shadow-xl ${isDark ? 'bg-[#1F2228]' : 'bg-white'}`}>

                    {/* Icon */}
                    <View className="items-center mb-4">
                        <FontAwesome name={iconName} size={48} color={iconColor} />
                    </View>

                    {/* Title */}
                    <Text className={`text-xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {title}
                    </Text>

                    {/* Message */}
                    <Text className={`text-base text-center mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {message}
                    </Text>

                    {/* Buttons */}
                    {type === 'confirm' ? (
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={onClose}
                                className={`flex-1 py-3 rounded-xl items-center ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
                            >
                                <Text className={`font-bold text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    İptal
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    if (onConfirm) onConfirm();
                                    onClose();
                                }}
                                className="flex-1 py-3 rounded-xl items-center bg-red-600"
                            >
                                <Text className="text-white font-bold text-lg">
                                    Sil
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={onClose}
                            className={`w-full py-3 rounded-xl items-center`}
                            style={{ backgroundColor: iconColor === '#EF4444' ? '#EF4444' : '#EAB308' }}
                        >
                            <Text className="text-white font-bold text-lg">
                                Tamam
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}
