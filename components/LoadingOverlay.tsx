import React from 'react';
import { ActivityIndicator, Modal, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface LoadingOverlayProps {
    visible: boolean;
    message?: string;
}

export default function LoadingOverlay({ visible, message = 'İşlem yapılıyor, lütfen bekleyiniz...' }: LoadingOverlayProps) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    return (
        <Modal transparent animationType="fade" visible={visible}>
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white'} p-6 rounded-2xl items-center shadow-xl border w-4/5 max-w-sm`}>
                    <ActivityIndicator size="large" color={isDark ? '#EAB308' : '#000'} className="mb-4" />
                    <Text className={`${isDark ? 'text-white' : 'text-gray-800'} text-center font-bold text-lg mb-2`}>
                        Lütfen Bekleyiniz
                    </Text>
                    <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-center`}>
                        {message}
                    </Text>
                </View>
            </View>
        </Modal>
    );
}
