import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import CustomAlert from './CustomAlert';

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
    const [alertConfig, setAlertConfig] = useState<{ visible: boolean, title: string, message: string, type: 'success' | 'error' | 'info' | 'loading' }>({
        visible: false, title: '', message: '', type: 'info'
    });

    useEffect(() => {
        if (project) {
            setName(project.name);
            setDescription(project.description || '');
            setSelectedRegionId(project.regionId?.toString() || '');
        }
    }, [project]);

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' | 'loading') => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const closeAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

    const handleSave = async () => {
        if (!name) return;
        showAlert('Proje Güncelleniyor', 'Lütfen bekleyiniz...', 'loading');
        const startTime = Date.now();
        try {
            await api.put(`/projects/${project.id}`, {
                name,
                description,
                regionId: selectedRegionId || undefined
            });
            const elapsed = Date.now() - startTime;
            const waitTime = Math.max(500 - elapsed, 0);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            closeAlert();
            setTimeout(() => {
                showAlert('Başarılı', 'Proje güncellendi', 'success');
            }, 100);
        } catch (e) {
            closeAlert();
            setTimeout(() => showAlert('Hata', 'Güncelleme başarısız', 'error'), 100);
        }
    };

    const handleSuccessClose = () => {
        closeAlert();
        onUpdate();
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
                            <Text className="text-white font-bold">Kaydet</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={alertConfig.type === 'success' ? handleSuccessClose : closeAlert}
            />
        </Modal>
    );
}
