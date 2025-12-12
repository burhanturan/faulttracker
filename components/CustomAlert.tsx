import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, InteractionManager, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info' | 'confirm' | 'loading';
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
    } else if (type === 'loading') {
        iconColor = isDark ? '#22D3EE' : '#1c4ed8'; // Cyan/Blue
    }

    const handleConfirm = () => {
        onClose();
        // Use InteractionManager to wait for animations to complete on iOS
        InteractionManager.runAfterInteractions(() => {
            setTimeout(() => {
                if (onConfirm) {
                    onConfirm();
                }
            }, 100);
        });
    };

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            onRequestClose={type === 'loading' ? undefined : onClose}
        >
            <View className="flex-1 justify-center items-center bg-black/50 px-4">
                <View className={`w-full max-w-sm p-6 rounded-2xl shadow-xl ${isDark ? 'bg-[#1F2228]' : 'bg-white'}`}>

                    {/* Icon or Loading Spinner */}
                    <View className="items-center mb-4">
                        {type === 'loading' ? (
                            <ActivityIndicator size="large" color={iconColor} />
                        ) : (
                            <FontAwesome name={iconName} size={48} color={iconColor} />
                        )}
                    </View>

                    {/* Title */}
                    <Text className={`text-xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {title}
                    </Text>

                    {/* Message */}
                    <Text className={`text-base text-center mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {message}
                    </Text>

                    {/* Buttons - Not shown for loading type */}
                    {type === 'loading' ? null : type === 'confirm' ? (
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
                                onPress={handleConfirm}
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
                            style={{ backgroundColor: type === 'success' ? '#10B981' : (iconColor === '#EF4444' ? '#EF4444' : '#EAB308') }}
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
