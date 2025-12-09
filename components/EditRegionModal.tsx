import React, { useEffect, useState } from 'react';
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';

type Props = {
    visible: boolean;
    onClose: () => void;
    region: any;
    onUpdate: () => void;
};

export default function EditRegionModal({ visible, onClose, region, onUpdate }: Props) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (region) {
            setName(region.name);
            setDescription(region.description || '');
        }
    }, [region]);

    const handleSave = async () => {
        if (!name) return;
        setLoading(true);
        try {
            await api.put(`/regions/${region.id}`, { name, description });
            Alert.alert('Başarılı', 'Bölge güncellendi');
            onUpdate();
        } catch (e) {
            Alert.alert('Hata', 'Güncelleme başarısız');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
            <View className="flex-1 justify-center items-center bg-black/50 p-4">
                <View className={`w-full max-w-sm rounded-xl p-6 ${isDark ? 'bg-dark-card' : 'bg-white'}`}>
                    <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Bölge Düzenle</Text>

                    <Text className={`font-bold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Bölge Adı</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        className={`p-3 rounded border mb-3 ${isDark ? 'bg-dark-bg text-white border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                    />

                    <Text className={`font-bold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Açıklama</Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        className={`p-3 rounded border mb-4 ${isDark ? 'bg-dark-bg text-white border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                    />

                    <View className="flex-row gap-3">
                        <TouchableOpacity onPress={onClose} className="flex-1 bg-gray-500 p-3 rounded items-center">
                            <Text className="text-white font-bold">İptal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSave} className="flex-1 bg-green-600 p-3 rounded items-center">
                            <Text className="text-white font-bold">{loading ? '...' : 'Kaydet'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
