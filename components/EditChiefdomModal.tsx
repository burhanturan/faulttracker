import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';

type Props = {
    visible: boolean;
    onClose: () => void;
    chiefdom: any; // The chiefdom object being edited
    regions: any[]; // For hierarchy display/edit
    projects: any[]; // For hierarchy display/edit
    onUpdate: () => void; // Trigger refresh after updates
};

export default function EditChiefdomModal({ visible, onClose, chiefdom, regions, projects, onUpdate }: Props) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    const [activeTab, setActiveTab] = useState<'general' | 'stations' | 'crossings' | 'buildings'>('general');
    const [loading, setLoading] = useState(false);

    // Form States
    const [name, setName] = useState('');
    const [startKm, setStartKm] = useState('');
    const [endKm, setEndKm] = useState('');
    const [selectedRegionId, setSelectedRegionId] = useState<string>('');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');

    // Sub-items states (loaded on open)
    const [stations, setStations] = useState<any[]>([]);
    const [crossings, setCrossings] = useState<any[]>([]);
    const [buildings, setBuildings] = useState<any[]>([]);

    // New item inputs
    const [newStation, setNewStation] = useState({ name: '', km: '' });
    const [newCrossing, setNewCrossing] = useState({ name: '', km: '', type: '' });
    const [newBuilding, setNewBuilding] = useState({ name: '', km: '', type: '' });

    useEffect(() => {
        if (chiefdom) {
            setName(chiefdom.name);
            setStartKm(chiefdom.startKm || '');
            setEndKm(chiefdom.endKm || '');
            setSelectedProjectId(chiefdom.project?.id?.toString() || '');
            // Try to find region from project
            const proj = projects.find(p => p.id === chiefdom.project?.id);
            setSelectedRegionId(proj?.regionId?.toString() || '');

            setStations(chiefdom.stations || []);
            setCrossings(chiefdom.levelCrossings || []);
            setBuildings(chiefdom.technicalBuildings || []);
        }
    }, [chiefdom, projects]);

    const handleSaveGeneral = async () => {
        setLoading(true);
        try {
            await api.put(`/chiefdoms/${chiefdom.id}`, {
                name,
                startKm,
                endKm,
                projectId: selectedProjectId || undefined
            });
            Alert.alert('Başarılı', 'Genel bilgiler güncellendi');
            onUpdate();
        } catch (e) {
            Alert.alert('Hata', 'Güncelleme başarısız');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStation = async () => {
        if (!newStation.name) return;
        try {
            const res = await api.post('/stations', { ...newStation, chiefdomId: chiefdom.id });
            setStations([...stations, res]);
            setNewStation({ name: '', km: '' });
        } catch (e) { Alert.alert('Hata', 'Eklenemedi'); }
    };

    const handleDeleteStation = async (id: number) => {
        try {
            await api.delete(`/stations/${id}`);
            setStations(stations.filter(s => s.id !== id));
        } catch (e) { Alert.alert('Hata', 'Silinemedi'); }
    };

    const handleAddCrossing = async () => {
        if (!newCrossing.name) return;
        try {
            const res = await api.post('/level-crossings', { ...newCrossing, chiefdomId: chiefdom.id });
            setCrossings([...crossings, res]);
            setNewCrossing({ name: '', km: '', type: '' });
        } catch (e) { Alert.alert('Hata', 'Eklenemedi'); }
    };

    const handleDeleteCrossing = async (id: number) => {
        try {
            await api.delete(`/level-crossings/${id}`);
            setCrossings(crossings.filter(c => c.id !== id));
        } catch (e) { Alert.alert('Hata', 'Silinemedi'); }
    };

    const handleAddBuilding = async () => {
        if (!newBuilding.name) return;
        try {
            const res = await api.post('/technical-buildings', { ...newBuilding, chiefdomId: chiefdom.id });
            setBuildings([...buildings, res]);
            setNewBuilding({ name: '', km: '', type: '' });
        } catch (e) { Alert.alert('Hata', 'Eklenemedi'); }
    };

    const handleDeleteBuilding = async (id: number) => {
        try {
            await api.delete(`/technical-buildings/${id}`);
            setBuildings(buildings.filter(b => b.id !== id));
        } catch (e) { Alert.alert('Hata', 'Silinemedi'); }
    };

    const renderTabButton = (key: any, label: string) => (
        <TouchableOpacity
            onPress={() => setActiveTab(key)}
            className={`px-4 py-2 mr-2 rounded-full ${activeTab === key ? 'bg-orange-500' : 'bg-gray-200'}`}
        >
            <Text className={`${activeTab === key ? 'text-white' : 'text-gray-700'} font-bold`}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View className="flex-1 justify-end bg-black/50">
                <View className={`h-[90%] w-full rounded-t-3xl p-4 ${isDark ? 'bg-dark-bg' : 'bg-white'}`}>
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Şeflik Düzenle: {chiefdom?.name}</Text>
                        <TouchableOpacity onPress={onClose} className="bg-gray-200 p-2 rounded-full"><Text>✕</Text></TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 max-h-12">
                        {renderTabButton('general', 'Genel Bilgiler')}
                        {renderTabButton('stations', 'İstasyonlar')}
                        {renderTabButton('crossings', 'Hemzemin Geçitler')}
                        {renderTabButton('buildings', 'Teknik Binalar')}
                    </ScrollView>

                    <ScrollView className="flex-1">
                        {activeTab === 'general' && (
                            <View className="gap-3">
                                <Text className={isDark ? 'text-gray-300' : 'text-gray-600'}>Bağlı Olduğu Bölge</Text>
                                <ScrollView horizontal className="mb-2">
                                    {regions.map(r => (
                                        <TouchableOpacity key={r.id} onPress={() => setSelectedRegionId(r.id.toString())} className={`mr-2 px-3 py-1 rounded border ${selectedRegionId === r.id.toString() ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                            <Text className={selectedRegionId === r.id.toString() ? 'text-white' : (isDark ? 'text-gray-300' : 'text-gray-800')}>{r.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <Text className={isDark ? 'text-gray-300' : 'text-gray-600'}>Bağlı Olduğu Proje</Text>
                                <ScrollView horizontal className="mb-2">
                                    {projects.filter(p => !selectedRegionId || p.regionId?.toString() === selectedRegionId).map(p => (
                                        <TouchableOpacity key={p.id} onPress={() => setSelectedProjectId(p.id.toString())} className={`mr-2 px-3 py-1 rounded border ${selectedProjectId === p.id.toString() ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                            <Text className={selectedProjectId === p.id.toString() ? 'text-white' : (isDark ? 'text-gray-300' : 'text-gray-800')}>{p.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <Text className={isDark ? 'text-gray-300' : 'text-gray-600'}>Şeflik Adı</Text>
                                <TextInput value={name} onChangeText={setName} className={`p-3 rounded border ${isDark ? 'bg-dark-card text-white border-gray-700' : 'bg-gray-50 border-gray-300'}`} />

                                <View className="flex-row gap-2">
                                    <View className="flex-1">
                                        <Text className={isDark ? 'text-gray-300' : 'text-gray-600'}>Başlangıç KM</Text>
                                        <TextInput value={startKm} onChangeText={setStartKm} placeholder="100+500" className={`p-3 rounded border ${isDark ? 'bg-dark-card text-white border-gray-700' : 'bg-gray-50 border-gray-300'}`} placeholderTextColor="#999" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className={isDark ? 'text-gray-300' : 'text-gray-600'}>Bitiş KM</Text>
                                        <TextInput value={endKm} onChangeText={setEndKm} placeholder="150+000" className={`p-3 rounded border ${isDark ? 'bg-dark-card text-white border-gray-700' : 'bg-gray-50 border-gray-300'}`} placeholderTextColor="#999" />
                                    </View>
                                </View>

                                <TouchableOpacity onPress={handleSaveGeneral} className="bg-green-600 p-4 rounded mt-4 items-center">
                                    <Text className="text-white font-bold">{loading ? 'Kaydediliyor...' : 'Genel Bilgileri Kaydet'}</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {activeTab === 'stations' && (
                            <View>
                                <View className="flex-row gap-2 mb-4">
                                    <TextInput placeholder="İstasyon Adı" value={newStation.name} onChangeText={t => setNewStation({ ...newStation, name: t })} className={`flex-1 p-2 rounded border ${isDark ? 'bg-dark-card text-white' : 'bg-white'}`} placeholderTextColor="#999" />
                                    <TextInput placeholder="KM" value={newStation.km} onChangeText={t => setNewStation({ ...newStation, km: t })} className={`w-20 p-2 rounded border ${isDark ? 'bg-dark-card text-white' : 'bg-white'}`} placeholderTextColor="#999" />
                                    <TouchableOpacity onPress={handleAddStation} className="bg-blue-500 justify-center px-4 rounded"><Text className="text-white">+</Text></TouchableOpacity>
                                </View>
                                {stations.map(s => (
                                    <View key={s.id} className={`flex-row justify-between items-center p-3 mb-2 rounded border ${isDark ? 'bg-dark-card border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                        <Text className={isDark ? 'text-white' : 'text-black'}>{s.name} <Text className="text-gray-500">({s.km})</Text></Text>
                                        <TouchableOpacity onPress={() => handleDeleteStation(s.id)}><Text className="text-red-500 font-bold">Sil</Text></TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        {activeTab === 'crossings' && (
                            <View>
                                <View className="gap-2 mb-4 p-2 border rounded border-gray-300">
                                    <TextInput placeholder="Geçit Adı / No" value={newCrossing.name} onChangeText={t => setNewCrossing({ ...newCrossing, name: t })} className={`p-2 rounded border ${isDark ? 'bg-dark-card text-white' : 'bg-white'}`} placeholderTextColor="#999" />
                                    <View className="flex-row gap-2">
                                        <TextInput placeholder="KM" value={newCrossing.km} onChangeText={t => setNewCrossing({ ...newCrossing, km: t })} className={`flex-1 p-2 rounded border ${isDark ? 'bg-dark-card text-white' : 'bg-white'}`} placeholderTextColor="#999" />
                                        <TextInput placeholder="Tip (Bariyerli vb.)" value={newCrossing.type} onChangeText={t => setNewCrossing({ ...newCrossing, type: t })} className={`flex-1 p-2 rounded border ${isDark ? 'bg-dark-card text-white' : 'bg-white'}`} placeholderTextColor="#999" />
                                    </View>
                                    <TouchableOpacity onPress={handleAddCrossing} className="bg-blue-500 p-2 rounded items-center"><Text className="text-white font-bold">Geçit Ekle</Text></TouchableOpacity>
                                </View>
                                {crossings.map(c => (
                                    <View key={c.id} className={`p-3 mb-2 rounded border ${isDark ? 'bg-dark-card border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                        <View className="flex-row justify-between">
                                            <Text className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{c.name}</Text>
                                            <TouchableOpacity onPress={() => handleDeleteCrossing(c.id)}><Text className="text-red-500">Sil</Text></TouchableOpacity>
                                        </View>
                                        <Text className="text-gray-500 text-xs">KM: {c.km} | Tip: {c.type}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {activeTab === 'buildings' && (
                            <View>
                                <View className="gap-2 mb-4 p-2 border rounded border-gray-300">
                                    <TextInput placeholder="Bina Adı (OBS vb.)" value={newBuilding.name} onChangeText={t => setNewBuilding({ ...newBuilding, name: t })} className={`p-2 rounded border ${isDark ? 'bg-dark-card text-white' : 'bg-white'}`} placeholderTextColor="#999" />
                                    <View className="flex-row gap-2">
                                        <TextInput placeholder="KM" value={newBuilding.km} onChangeText={t => setNewBuilding({ ...newBuilding, km: t })} className={`flex-1 p-2 rounded border ${isDark ? 'bg-dark-card text-white' : 'bg-white'}`} placeholderTextColor="#999" />
                                        <TextInput placeholder="Tip" value={newBuilding.type} onChangeText={t => setNewBuilding({ ...newBuilding, type: t })} className={`flex-1 p-2 rounded border ${isDark ? 'bg-dark-card text-white' : 'bg-white'}`} placeholderTextColor="#999" />
                                    </View>
                                    <TouchableOpacity onPress={handleAddBuilding} className="bg-blue-500 p-2 rounded items-center"><Text className="text-white font-bold">Bina Ekle</Text></TouchableOpacity>
                                </View>
                                {buildings.map(b => (
                                    <View key={b.id} className={`p-3 mb-2 rounded border ${isDark ? 'bg-dark-card border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                        <View className="flex-row justify-between">
                                            <Text className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{b.name}</Text>
                                            <TouchableOpacity onPress={() => handleDeleteBuilding(b.id)}><Text className="text-red-500">Sil</Text></TouchableOpacity>
                                        </View>
                                        <Text className="text-gray-500 text-xs">KM: {b.km} | Tip: {b.type}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View className="h-20" />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
