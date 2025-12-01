import { useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api, BASE_URL } from '../../lib/api';

export default function HistoryScreen() {
    const { user } = useAuth();
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            setShowCreateModal(false);
            setSelectedFault(null);
            setIsEditing(false);
            fetchHistory(); // Refresh data on focus
        }, [])
    );

    const navigation = useNavigation();

    useEffect(() => {
        const unsubscribe = (navigation as any).addListener('tabPress', (e: any) => {
            setShowCreateModal(false);
            setSelectedFault(null);
            setIsEditing(false);
        });
        return unsubscribe;
    }, [navigation]);

    // Detail Modal State
    const [selectedFault, setSelectedFault] = useState<any | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        faultDate: '',
        faultTime: '',
        reporterName: '',
        lineInfo: '',
        closureFaultInfo: '',
        solution: '',
        workingPersonnel: '',
        tcddPersonnel: ''
    });
    // Create Closed Fault State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        title: '',
        description: '',
        chiefdomId: '',
        faultDate: '',
        faultTime: '',
        reporterName: '',
        lineInfo: '',
        closureFaultInfo: '',
        solution: '',
        workingPersonnel: '',
        tcddPersonnel: ''
    });

    const fetchHistory = async () => {
        try {
            let endpoint = '/faults';
            if (user?.role === 'worker' && (user as any).chiefdomId) {
                endpoint += `?chiefdomId=${(user as any).chiefdomId}`;
            } else if (user?.role === 'ctc') {
                endpoint += `?reportedById=${user.id}`;
            }

            const data = await api.get(endpoint);
            const closedFaults = data.filter((f: any) => f.status === 'closed');

            // Sort by faultDate and faultTime (Descending - Newest First)
            closedFaults.sort((a: any, b: any) => {
                const parseDate = (dateStr: string, timeStr: string) => {
                    if (!dateStr) return new Date(0);
                    const [day, month, year] = dateStr.split('.');
                    return new Date(`${year}-${month}-${day}T${timeStr || '00:00'}`);
                };

                const dateA = parseDate(a.faultDate, a.faultTime);
                const dateB = parseDate(b.faultDate, b.faultTime);

                return dateB.getTime() - dateA.getTime();
            });

            setHistory(closedFaults);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const openDetails = (fault: any) => {
        setSelectedFault(fault);
        setEditForm({
            faultDate: fault.faultDate || '',
            faultTime: fault.faultTime || '',
            reporterName: fault.reporterName || '',
            lineInfo: fault.lineInfo || '',
            closureFaultInfo: fault.closureFaultInfo || '',
            solution: fault.solution || '',
            workingPersonnel: fault.workingPersonnel || '',
            tcddPersonnel: fault.tcddPersonnel || ''
        });
        setIsEditing(false);
    };

    const handleSaveEdit = async () => {
        if (!selectedFault) return;
        try {
            await api.put(`/faults/${selectedFault.id}`, editForm);
            alert('Arıza başarıyla güncellendi');
            setIsEditing(false);
            setSelectedFault(null);
            fetchHistory();
        } catch (error) {
            alert('Arıza güncellenemedi');
        }
    };

    const canEdit = user?.role === 'admin' || user?.role === 'engineer';

    const [chiefdoms, setChiefdoms] = useState<any[]>([]);

    const fetchChiefdoms = async () => {
        try {
            const data = await api.get('/chiefdoms');
            setChiefdoms(data);
        } catch (error) {
            console.error('Failed to fetch chiefdoms', error);
        }
    };

    useEffect(() => {
        fetchChiefdoms();
        if (user?.role === 'worker' && (user as any).chiefdomId) {
            setCreateForm(prev => ({ ...prev, chiefdomId: (user as any).chiefdomId.toString() }));
        }
    }, [user]);

    const handleCreateClosedFault = async () => {
        if (!createForm.title || !createForm.description || !createForm.chiefdomId) {
            alert('Lütfen Başlık, Açıklama ve Şeflik alanlarını doldurunuz');
            return;
        }

        try {
            await api.post('/faults', {
                ...createForm,
                status: 'closed',
                reportedById: user?.id
            });
            alert('Kapatılmış arıza başarıyla oluşturuldu');
            setShowCreateModal(false);
            setCreateForm({
                title: '',
                description: '',
                chiefdomId: user?.role === 'worker' && (user as any).chiefdomId ? (user as any).chiefdomId.toString() : '',
                faultDate: '',
                faultTime: '',
                reporterName: '',
                lineInfo: '',
                closureFaultInfo: '',
                solution: '',
                workingPersonnel: '',
                tcddPersonnel: ''
            });
            fetchHistory();
        } catch (error) {
            alert('Arıza oluşturulamadı');
        }
    };

    if (selectedFault) {
        return (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'} p-4`} showsHorizontalScrollIndicator={false} contentContainerStyle={{ width: '100%' }}>
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Arıza Detayları</Text>
                        <TouchableOpacity onPress={() => setSelectedFault(null)}>
                            <Text className={`${isDark ? 'text-dark-primary' : 'text-light-primary'} font-bold`}>Kapat</Text>
                        </TouchableOpacity>
                    </View>

                    <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-light-card border-gray-200'} p-4 rounded-xl border mb-4`}>
                        <Text className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedFault.title}</Text>
                        <Text className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{selectedFault.description}</Text>

                        <View className="gap-3">
                            <View>
                                <Text className="font-bold text-gray-500 text-xs">Arıza Tarihi</Text>
                                {isEditing ? (
                                    <TextInput value={editForm.faultDate} onChangeText={t => setEditForm({ ...editForm, faultDate: t })} className={`p-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} />
                                ) : (
                                    <Text className={`${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedFault.faultDate || '-'}</Text>
                                )}
                            </View>
                            <View>
                                <Text className="font-bold text-gray-500 text-xs">Arıza Saati</Text>
                                {isEditing ? (
                                    <TextInput value={editForm.faultTime} onChangeText={t => setEditForm({ ...editForm, faultTime: t })} className={`p-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} />
                                ) : (
                                    <Text className={`${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedFault.faultTime || '-'}</Text>
                                )}
                            </View>
                            <View>
                                <Text className="font-bold text-gray-500 text-xs">Bildiren Kişi</Text>
                                {isEditing ? (
                                    <TextInput value={editForm.reporterName} onChangeText={t => setEditForm({ ...editForm, reporterName: t })} className={`p-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} />
                                ) : (
                                    <Text className={`${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedFault.reporterName || '-'}</Text>
                                )}
                            </View>
                            <View>
                                <Text className="font-bold text-gray-500 text-xs">Hat Bilgisi</Text>
                                {isEditing ? (
                                    <TextInput value={editForm.lineInfo} onChangeText={t => setEditForm({ ...editForm, lineInfo: t })} className={`p-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} />
                                ) : (
                                    <Text className={`${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedFault.lineInfo || '-'}</Text>
                                )}
                            </View>
                            <View>
                                <Text className="font-bold text-gray-500 text-xs">Kapanış Arıza Bilgisi</Text>
                                {isEditing ? (
                                    <TextInput value={editForm.closureFaultInfo} onChangeText={t => setEditForm({ ...editForm, closureFaultInfo: t })} className={`p-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} />
                                ) : (
                                    <Text className={`${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedFault.closureFaultInfo || '-'}</Text>
                                )}
                            </View>
                            <View>
                                <Text className="font-bold text-gray-500 text-xs">Çözüm</Text>
                                {isEditing ? (
                                    <TextInput value={editForm.solution} onChangeText={t => setEditForm({ ...editForm, solution: t })} multiline className={`p-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'} h-20`} textAlignVertical="top" />
                                ) : (
                                    <Text className={`${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedFault.solution || '-'}</Text>
                                )}
                            </View>
                            <View>
                                <Text className="font-bold text-gray-500 text-xs">Çalışan Personel</Text>
                                {isEditing ? (
                                    <TextInput value={editForm.workingPersonnel} onChangeText={t => setEditForm({ ...editForm, workingPersonnel: t })} className={`p-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} />
                                ) : (
                                    <Text className={`${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedFault.workingPersonnel || '-'}</Text>
                                )}
                            </View>
                            <View>
                                <Text className="font-bold text-gray-500 text-xs">TCDD Personeli</Text>
                                {isEditing ? (
                                    <TextInput value={editForm.tcddPersonnel} onChangeText={t => setEditForm({ ...editForm, tcddPersonnel: t })} className={`p-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} />
                                ) : (
                                    <Text className={`${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedFault.tcddPersonnel || '-'}</Text>
                                )}
                            </View>
                            {selectedFault.images && selectedFault.images.length > 0 && (
                                <View>
                                    <Text className="font-bold text-gray-500 text-xs mb-2">Fotoğraflar</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                                        {selectedFault.images.map((img: any, index: number) => (
                                            <Image
                                                key={index}
                                                source={{ uri: `${BASE_URL}${img.url}` }}
                                                className="w-40 h-40 rounded-lg bg-gray-200"
                                                resizeMode="cover"
                                            />
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    </View>

                    {canEdit && (
                        <View className="mb-8">
                            {isEditing ? (
                                <View className="flex-row gap-2">
                                    <TouchableOpacity onPress={handleSaveEdit} className="flex-1 bg-green-600 p-3 rounded items-center"><Text className="text-white font-bold">Değişiklikleri Kaydet</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={() => setIsEditing(false)} className="flex-1 bg-gray-200 p-3 rounded items-center"><Text className="text-gray-600 font-bold">İptal</Text></TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => setIsEditing(true)} className="bg-blue-600 p-3 rounded items-center">
                                    <Text className="text-white font-bold">Düzenle</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    if (showCreateModal) {
        return (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'} p-4`} showsHorizontalScrollIndicator={false} contentContainerStyle={{ width: '100%' }}>
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Yeni Arıza Girişi</Text>
                        <TouchableOpacity onPress={() => setShowCreateModal(false)} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} px-4 py-2 rounded-lg shadow-sm`}>
                            <Text className="text-black font-bold">İptal</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="gap-3 mb-8">
                        <View>
                            <Text className={`font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Arıza Başlığı *</Text>
                            <TextInput value={createForm.title} onChangeText={t => setCreateForm({ ...createForm, title: t })} className={`p-3 rounded border ${isDark ? 'bg-dark-card border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} placeholder="Arıza Başlığı" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                        </View>
                        <View>
                            <Text className={`font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Açıklama *</Text>
                            <TextInput value={createForm.description} onChangeText={t => setCreateForm({ ...createForm, description: t })} multiline className={`p-3 rounded border ${isDark ? 'bg-dark-card border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'} h-20`} textAlignVertical="top" placeholder="Arıza Açıklaması" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                        </View>
                        <View>
                            <Text className={`font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Şeflik *</Text>
                            {user?.role === 'worker' && (user as any).chiefdomId ? (
                                <View className={`p-3 rounded border ${isDark ? 'bg-dark-card border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                                    <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {chiefdoms.find(c => c.id.toString() === (user as any).chiefdomId.toString())?.name || 'Yükleniyor...'}
                                    </Text>
                                </View>
                            ) : (
                                <View className="flex-row flex-wrap gap-2">
                                    {chiefdoms.map(c => (
                                        <TouchableOpacity
                                            key={c.id}
                                            onPress={() => setCreateForm({ ...createForm, chiefdomId: c.id.toString() })}
                                            className={`px-3 py-2 rounded border ${createForm.chiefdomId === c.id.toString() ? 'bg-blue-600 border-blue-600' : isDark ? 'bg-dark-card border-gray-700' : 'bg-white border-gray-200'}`}
                                        >
                                            <Text className={`${createForm.chiefdomId === c.id.toString() ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-600'}`}>{c.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        <Text className={`text-lg font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Kapanış Detayları</Text>

                        <View>
                            <Text className={`font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Arıza Tarihi</Text>
                            <TextInput value={createForm.faultDate} onChangeText={t => setCreateForm({ ...createForm, faultDate: t })} className={`p-3 rounded border ${isDark ? 'bg-dark-card border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} placeholder="GG.AA.YYYY" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                        </View>
                        <View>
                            <Text className={`font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Arıza Saati</Text>
                            <TextInput value={createForm.faultTime} onChangeText={t => setCreateForm({ ...createForm, faultTime: t })} className={`p-3 rounded border ${isDark ? 'bg-dark-card border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} placeholder="SS:DD" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                        </View>
                        <View>
                            <Text className={`font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Bildiren Kişi</Text>
                            <TextInput value={createForm.reporterName} onChangeText={t => setCreateForm({ ...createForm, reporterName: t })} className={`p-3 rounded border ${isDark ? 'bg-dark-card border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                        </View>
                        <View>
                            <Text className={`font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Hat Bilgisi</Text>
                            <TextInput value={createForm.lineInfo} onChangeText={t => setCreateForm({ ...createForm, lineInfo: t })} className={`p-3 rounded border ${isDark ? 'bg-dark-card border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                        </View>
                        <View>
                            <Text className={`font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Arıza Bilgisi</Text>
                            <TextInput value={createForm.closureFaultInfo} onChangeText={t => setCreateForm({ ...createForm, closureFaultInfo: t })} className={`p-3 rounded border ${isDark ? 'bg-dark-card border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                        </View>
                        <View>
                            <Text className={`font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Çözüm</Text>
                            <TextInput value={createForm.solution} onChangeText={t => setCreateForm({ ...createForm, solution: t })} multiline className={`p-3 rounded border ${isDark ? 'bg-dark-card border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'} h-20`} textAlignVertical="top" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                        </View>
                        <View>
                            <Text className={`font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Çalışan Personel</Text>
                            <TextInput value={createForm.workingPersonnel} onChangeText={t => setCreateForm({ ...createForm, workingPersonnel: t })} className={`p-3 rounded border ${isDark ? 'bg-dark-card border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                        </View>
                        <View>
                            <Text className={`font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>TCDD Personeli</Text>
                            <TextInput value={createForm.tcddPersonnel} onChangeText={t => setCreateForm({ ...createForm, tcddPersonnel: t })} className={`p-3 rounded border ${isDark ? 'bg-dark-card border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                        </View>

                        <TouchableOpacity onPress={handleCreateClosedFault} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} p-4 rounded-lg items-center mt-4`}>
                            <Text className={`${isDark ? 'text-black' : 'text-white'} font-bold text-lg`}>Oluştur</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
            <ScrollView
                className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'} p-4`}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ width: '100%' }}
            >
                <View className="mb-4 items-center">
                    <Text className={`text-2xl font-bold mb-2 text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>Arıza Geçmişi</Text>
                    <TouchableOpacity onPress={() => setShowCreateModal(true)} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} px-6 py-3 rounded-lg shadow-md`}>
                        <Text className={`${isDark ? 'text-black' : 'text-white'} font-bold text-base`}>+ Yeni Arıza</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <Text className="text-gray-500">Geçmiş yükleniyor...</Text>
                ) : (
                    <>
                        {history.map((fault) => (
                            <TouchableOpacity key={fault.id} onPress={() => openDetails(fault)}>
                                <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-light-card border-gray-200'} p-4 rounded-lg shadow-sm border mb-3`}>
                                    <View className="flex-row justify-between items-start">
                                        <Text className={`font-bold text-lg flex-1 mr-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{fault.title}</Text>
                                        <View className={`px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                            <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>KAPALI</Text>
                                        </View>
                                    </View>

                                    <Text className="text-gray-600 mt-1 mb-2" numberOfLines={2}>{fault.description}</Text>

                                    <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-100">
                                        <Text className="text-gray-400 text-xs">Tarih: {fault.faultDate || '-'}</Text>
                                        <Text className={`${isDark ? 'text-dark-primary' : 'text-light-primary'} text-xs font-bold`}>Detayları Gör →</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                        {history.length === 0 && (
                            <View className="items-center justify-center py-10">
                                <Text className="text-gray-400 text-lg">Kapatılmış arıza bulunamadı.</Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
