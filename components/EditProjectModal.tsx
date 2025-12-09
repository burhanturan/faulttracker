import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';

type Props = {
    visible: boolean;
    onClose: () => void;
    project: any;
    regions: any[];
    onUpdate: () => void;
};

export default function EditProjectModal({ visible, onClose, project, regions, onUpdate }: Props) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedRegionId, setSelectedRegionId] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (project) {
            setName(project.name);
            setDescription(project.description || '');
            setSelectedRegionId(project.regionId?.toString() || '');
        }
    }, [project]);

    const handleSave = async () => {
        if (!name) return;
        setLoading(true);
        try {
            await api.put(`/projects/${project.id}`, {
                name,
                description,
                regionId: selectedRegionId || undefined
            });
            Alert.alert('Başarılı', 'Proje güncellendi');
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
                    <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Proje Düzenle</Text>

                    <Text className={`font-bold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Proje Adı</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        className={`p-3 rounded border mb-3 ${isDark ? 'bg-dark-bg text-white border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                    />

                    <Text className={`font-bold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Açıklama</Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        className={`p-3 rounded border mb-3 ${isDark ? 'bg-dark-bg text-white border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                    />

                    <Text className={`font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Bağlı Olduğu Bölge</Text>
                    <ScrollView horizontal className="mb-4 max-h-12" showsHorizontalScrollIndicator={false}>
                        {regions.map(r => (
                            <TouchableOpacity
                                key={r.id}
                                onPress={() => setSelectedRegionId(r.id.toString())}
                                className={`mr-2 px-3 py-2 rounded border ${selectedRegionId === r.id.toString() ? 'bg-blue-500 border-blue-500' : (isDark ? 'border-gray-600' : 'border-gray-300')}`}
                            >
                                <Text className={selectedRegionId === r.id.toString() ? 'text-white font-bold' : (isDark ? 'text-gray-300' : 'text-gray-800')}>{r.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

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
