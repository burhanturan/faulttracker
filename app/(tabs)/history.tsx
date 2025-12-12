import { useFocusEffect, useNavigation, useScrollToTop } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { Building2, Calendar, CheckCircle2, Clock, FileX2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CustomAlert from '../../components/CustomAlert';
import LoadingOverlay from '../../components/LoadingOverlay';
import { RailGuardHeader } from '../../components/RailGuard/Header';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';

export default function HistoryScreen() {
    const { user } = useAuth();
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';
    const ref = useRef(null);
    useScrollToTop(ref);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredHistory = history.filter(fault => {
        const query = searchQuery.toLowerCase();
        return (
            fault.title?.toLowerCase().includes(query) ||
            fault.description?.toLowerCase().includes(query) ||
            fault.id?.toString().includes(query)
        );
    });

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
        tcddPersonnel: '',
        images: [] as any[],
        newImages: [] as string[]
    });
    // Full-screen image preview state
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
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
    const [images, setImages] = useState<string[]>([]);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'info' | 'confirm' | 'loading';
        onConfirm?: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'info'
    });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' | 'confirm' | 'loading' = 'info', onConfirm?: () => void) => {
        setAlertConfig({ visible: true, title, message, type, onConfirm });
    };

    const closeAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

    const getCurrentDate = () => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const getCurrentTime = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const openCreateModal = () => {
        setCreateForm(prev => ({
            ...prev,
            faultDate: getCurrentDate(),
            faultTime: getCurrentTime()
        }));
        setImages([]);
        setShowCreateModal(true);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.7,
        });

        if (!result.canceled) {
            setImages([...images, result.assets[0].uri]);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const fetchHistory = async () => {
        try {
            let endpoint = '/faults';
            if (user?.role === 'worker' && (user as any).chiefdomId) {
                endpoint += `?chiefdomId=${(user as any).chiefdomId}`;
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

    const getMimeType = (filename: string) => {
        const extension = filename.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'gif':
                return 'image/gif';
            case 'webp':
                return 'image/webp';
            default:
                return 'image/jpeg';
        }
    };

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
            tcddPersonnel: fault.tcddPersonnel || '',
            images: fault.images || [],
            newImages: []
        });
        setIsEditing(false);
    };

    const handleUpdate = async () => {
        if (!selectedFault) return;

        showAlert('Arıza Güncelleniyor', 'Lütfen bekleyiniz...', 'loading');
        const startTime = Date.now();
        try {
            const formData = new FormData();
            // Add all text fields
            Object.keys(editForm).forEach(key => {
                if (key !== 'images' && key !== 'newImages') {
                    formData.append(key, (editForm as any)[key]);
                }
            });

            // Add new images
            if (editForm.newImages && editForm.newImages.length > 0) {
                for (const uri of editForm.newImages) {
                    const filename = uri.split('/').pop() || 'image.jpg';
                    const type = getMimeType(filename);

                    if (Platform.OS === 'web') {
                        const response = await fetch(uri);
                        const blob = await response.blob();
                        formData.append('files', blob, filename);
                    } else {
                        formData.append('files', { uri, name: filename, type } as any);
                    }
                }
            }

            await api.put(`/faults/${selectedFault.id}`, formData, true);
            const elapsed = Date.now() - startTime;
            const waitTime = Math.max(500 - elapsed, 0);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            closeAlert();
            setTimeout(() => {
                showAlert('Başarılı', 'Arıza başarıyla güncellendi', 'success');
                setIsEditing(false);
                setSelectedFault(null);
                fetchHistory();
            }, 100);
        } catch (error) {
            console.error(error);
            closeAlert();
            setTimeout(() => showAlert('Hata', 'Arıza güncellenemedi', 'error'), 100);
        }
    };

    const handleDeleteFault = (id: number) => {
        showAlert('Arızayı Sil', 'Bu arıza kaydını silmek istediğinize emin misiniz?', 'confirm', async () => {
            try {
                setLoading(true); // Start loading
                await api.delete(`/faults/${id}`);
                showAlert('Başarılı', 'Arıza silindi', 'success');
                setSelectedFault(null);
                fetchHistory();
            } catch (error) {
                showAlert('Hata', 'Güncelleme başarısız', 'error');
            } finally {
                setLoading(false); // End loading
            }
        });
    };

    const handleDeleteImage = async (imageId: number) => {
        try {
            setLoading(true); // Start loading
            await api.delete(`/faults/images/${imageId}`);
            // Remove from local state
            setEditForm(prev => ({
                ...prev,
                images: prev.images.filter((img: any) => img.id !== imageId)
            }));
            showAlert('Başarılı', 'Fotoğraf silindi', 'success');
        } catch (error) {
            showAlert('Hata', 'Kayıt oluşturulamadı', 'error');
        } finally {
            setLoading(false); // End loading
        }
    };

    const pickNewImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.7,
        });

        if (!result.canceled) {
            setEditForm(prev => ({
                ...prev,
                newImages: [...(prev.newImages || []), result.assets[0].uri]
            }));
        }
    };

    const removeNewImage = (index: number) => {
        setEditForm(prev => ({
            ...prev,
            newImages: (prev.newImages || []).filter((_, i) => i !== index)
        }));
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
            showAlert('Eksik Bilgi', 'Lütfen Başlık, Açıklama ve Şeflik alanlarını doldurunuz', 'error');
            return;
        }

        try {
            setLoading(true); // Start loading
            const formData = new FormData();
            formData.append('title', createForm.title);
            formData.append('description', createForm.description);
            formData.append('chiefdomId', createForm.chiefdomId);
            formData.append('status', 'closed');
            if (user?.id) formData.append('reportedById', user.id.toString());

            // Closure fields
            formData.append('faultDate', createForm.faultDate);
            formData.append('faultTime', createForm.faultTime);
            formData.append('reporterName', createForm.reporterName);
            formData.append('lineInfo', createForm.lineInfo);
            formData.append('closureFaultInfo', createForm.closureFaultInfo);
            formData.append('solution', createForm.solution);
            formData.append('workingPersonnel', createForm.workingPersonnel);
            formData.append('tcddPersonnel', createForm.tcddPersonnel);

            // Images
            for (const uri of images) {
                const filename = uri.split('/').pop() || 'image.jpg';
                const type = getMimeType(filename);

                if (Platform.OS === 'web') {
                    const response = await fetch(uri);
                    const blob = await response.blob();
                    formData.append('files', blob, filename);
                } else {
                    formData.append('files', { uri, name: filename, type } as any);
                }
            }

            await api.post('/faults', formData, true); // true for isMultipart
            showAlert('Başarılı', 'Kapatılmış arıza başarıyla oluşturuldu', 'success');
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
            setImages([]);
            fetchHistory();
        } catch (error) {
            console.error(error);
            showAlert('Hata', 'Arıza oluşturulamadı', 'error');
        } finally {
            setLoading(false); // End loading
        }
    };

    if (selectedFault) {
        return (
            <View className="flex-1" style={{ backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }}>
                <RailGuardHeader user={user} title="Arıza Detayları" showSearch={false} showGreeting={false} />
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <ScrollView className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'} p-4`} showsHorizontalScrollIndicator={false} contentContainerStyle={{ width: '100%' }}>
                        {/* Hero Section - Title & Description */}
                        <View style={{
                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                            borderRadius: 20,
                            marginBottom: 16,
                            padding: 20,
                            shadowColor: isDark ? '#000' : '#64748B',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: isDark ? 0.3 : 0.1,
                            shadowRadius: 12,
                            elevation: 5,
                            borderLeftWidth: 4,
                            borderLeftColor: isDark ? '#22D3EE' : '#3B82F6',
                        }}>
                            {/* Chiefdom Badge */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                    backgroundColor: isDark ? 'rgba(34, 211, 238, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 20,
                                }}>
                                    <Building2 size={14} color={isDark ? '#22D3EE' : '#3B82F6'} />
                                    <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#22D3EE' : '#3B82F6' }}>
                                        {selectedFault.chiefdom?.name || 'Şeflik Belirtilmemiş'}
                                    </Text>
                                </View>
                            </View>

                            <Text style={{ fontSize: 22, fontWeight: '700', color: isDark ? '#F1F5F9' : '#1E293B', marginBottom: 10 }}>
                                {selectedFault.title}
                            </Text>
                            <Text style={{ fontSize: 15, color: isDark ? '#94A3B8' : '#64748B', lineHeight: 22 }}>
                                {selectedFault.description}
                            </Text>
                        </View>

                        {/* Date & Time Row - 2 Column Grid */}
                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                            <View style={{
                                flex: 1,
                                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                borderRadius: 16,
                                padding: 16,
                                shadowColor: isDark ? '#000' : '#64748B',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 8,
                                elevation: 3,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <Calendar size={16} color={isDark ? '#22D3EE' : '#3B82F6'} />
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#64748B' : '#94A3B8' }}>Arıza Tarihi</Text>
                                </View>
                                {isEditing ? (
                                    <TextInput value={editForm.faultDate} onChangeText={t => setEditForm({ ...editForm, faultDate: t })} style={{ padding: 10, borderRadius: 8, borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0', backgroundColor: isDark ? '#0F172A' : '#F8FAFC', color: isDark ? '#F1F5F9' : '#1E293B', fontSize: 16 }} />
                                ) : (
                                    <Text style={{ fontSize: 18, fontWeight: '600', color: isDark ? '#F1F5F9' : '#1E293B' }}>{selectedFault.faultDate || '-'}</Text>
                                )}
                            </View>
                            <View style={{
                                flex: 1,
                                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                borderRadius: 16,
                                padding: 16,
                                shadowColor: isDark ? '#000' : '#64748B',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 8,
                                elevation: 3,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <Clock size={16} color={isDark ? '#22D3EE' : '#3B82F6'} />
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#64748B' : '#94A3B8' }}>Arıza Saati</Text>
                                </View>
                                {isEditing ? (
                                    <TextInput value={editForm.faultTime} onChangeText={t => setEditForm({ ...editForm, faultTime: t })} style={{ padding: 10, borderRadius: 8, borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0', backgroundColor: isDark ? '#0F172A' : '#F8FAFC', color: isDark ? '#F1F5F9' : '#1E293B', fontSize: 16 }} />
                                ) : (
                                    <Text style={{ fontSize: 18, fontWeight: '600', color: isDark ? '#F1F5F9' : '#1E293B' }}>{selectedFault.faultTime || '-'}</Text>
                                )}
                            </View>
                        </View>

                        {/* Detail Info Cards */}
                        <View style={{
                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                            borderRadius: 20,
                            marginBottom: 16,
                            padding: 20,
                            shadowColor: isDark ? '#000' : '#64748B',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: isDark ? 0.3 : 0.1,
                            shadowRadius: 12,
                            elevation: 5,
                        }}>
                            {/* Bildiren Kişi */}
                            <View style={{ marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isDark ? 'rgba(34, 211, 238, 0.15)' : 'rgba(59, 130, 246, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 14 }}>👤</Text>
                                    </View>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#64748B' : '#94A3B8' }}>Bildiren Kişi</Text>
                                </View>
                                {isEditing ? (
                                    <TextInput value={editForm.reporterName} onChangeText={t => setEditForm({ ...editForm, reporterName: t })} style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0', backgroundColor: isDark ? '#0F172A' : '#F8FAFC', color: isDark ? '#F1F5F9' : '#1E293B', fontSize: 16 }} />
                                ) : (
                                    <Text style={{ fontSize: 16, fontWeight: '500', color: isDark ? '#F1F5F9' : '#1E293B', marginLeft: 36 }}>{selectedFault.reporterName || '-'}</Text>
                                )}
                            </View>

                            {/* Hat Bilgisi */}
                            <View style={{ marginBottom: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isDark ? 'rgba(34, 211, 238, 0.15)' : 'rgba(59, 130, 246, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 14 }}>🛤️</Text>
                                    </View>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#64748B' : '#94A3B8' }}>Hat Bilgisi</Text>
                                </View>
                                {isEditing ? (
                                    <TextInput value={editForm.lineInfo} onChangeText={t => setEditForm({ ...editForm, lineInfo: t })} style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0', backgroundColor: isDark ? '#0F172A' : '#F8FAFC', color: isDark ? '#F1F5F9' : '#1E293B', fontSize: 16 }} />
                                ) : (
                                    <Text style={{ fontSize: 16, fontWeight: '500', color: isDark ? '#F1F5F9' : '#1E293B', marginLeft: 36 }}>{selectedFault.lineInfo || '-'}</Text>
                                )}
                            </View>

                            {/* Kapanış Arıza Bilgisi */}
                            <View style={{ marginBottom: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isDark ? 'rgba(34, 211, 238, 0.15)' : 'rgba(59, 130, 246, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 14 }}>⚠️</Text>
                                    </View>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#64748B' : '#94A3B8' }}>Kapanış Arıza Bilgisi</Text>
                                </View>
                                {isEditing ? (
                                    <TextInput value={editForm.closureFaultInfo} onChangeText={t => setEditForm({ ...editForm, closureFaultInfo: t })} style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0', backgroundColor: isDark ? '#0F172A' : '#F8FAFC', color: isDark ? '#F1F5F9' : '#1E293B', fontSize: 16 }} />
                                ) : (
                                    <Text style={{ fontSize: 16, fontWeight: '500', color: isDark ? '#F1F5F9' : '#1E293B', marginLeft: 36 }}>{selectedFault.closureFaultInfo || '-'}</Text>
                                )}
                            </View>

                            {/* Çözüm */}
                            <View style={{ marginBottom: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 14 }}>✅</Text>
                                    </View>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#64748B' : '#94A3B8' }}>Çözüm</Text>
                                </View>
                                {isEditing ? (
                                    <TextInput value={editForm.solution} onChangeText={t => setEditForm({ ...editForm, solution: t })} multiline style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0', backgroundColor: isDark ? '#0F172A' : '#F8FAFC', color: isDark ? '#F1F5F9' : '#1E293B', fontSize: 16, minHeight: 80, textAlignVertical: 'top' }} />
                                ) : (
                                    <Text style={{ fontSize: 16, fontWeight: '500', color: isDark ? '#F1F5F9' : '#1E293B', marginLeft: 36, lineHeight: 24 }}>{selectedFault.solution || '-'}</Text>
                                )}
                            </View>

                            {/* Personnel Row - 2 Column */}
                            <View style={{ flexDirection: 'row', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)' }}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                        <Text style={{ fontSize: 14 }}>👷</Text>
                                        <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#64748B' : '#94A3B8' }}>Çalışan Personel</Text>
                                    </View>
                                    {isEditing ? (
                                        <TextInput value={editForm.workingPersonnel} onChangeText={t => setEditForm({ ...editForm, workingPersonnel: t })} style={{ padding: 10, borderRadius: 8, borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0', backgroundColor: isDark ? '#0F172A' : '#F8FAFC', color: isDark ? '#F1F5F9' : '#1E293B', fontSize: 14 }} />
                                    ) : (
                                        <Text style={{ fontSize: 15, fontWeight: '500', color: isDark ? '#F1F5F9' : '#1E293B' }}>{selectedFault.workingPersonnel || '-'}</Text>
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                        <Text style={{ fontSize: 14 }}>🏢</Text>
                                        <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#64748B' : '#94A3B8' }}>TCDD Personeli</Text>
                                    </View>
                                    {isEditing ? (
                                        <TextInput value={editForm.tcddPersonnel} onChangeText={t => setEditForm({ ...editForm, tcddPersonnel: t })} style={{ padding: 10, borderRadius: 8, borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0', backgroundColor: isDark ? '#0F172A' : '#F8FAFC', color: isDark ? '#F1F5F9' : '#1E293B', fontSize: 14 }} />
                                    ) : (
                                        <Text style={{ fontSize: 15, fontWeight: '500', color: isDark ? '#F1F5F9' : '#1E293B' }}>{selectedFault.tcddPersonnel || '-'}</Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Image Management in Edit Mode */}
                        {isEditing && (
                            <View style={{
                                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                borderRadius: 20,
                                marginBottom: 16,
                                padding: 20,
                                shadowColor: isDark ? '#000' : '#64748B',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: isDark ? 0.3 : 0.1,
                                shadowRadius: 12,
                                elevation: 5,
                            }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#64748B' : '#94A3B8', marginBottom: 12 }}>📷 Mevcut Fotoğraflar</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                                    {editForm.images && editForm.images.map((img: any, index: number) => (
                                        <View key={index} style={{ marginRight: 12, position: 'relative' }}>
                                            <Image source={{ uri: img.url }} style={{ width: 100, height: 100, borderRadius: 12, backgroundColor: isDark ? '#334155' : '#E2E8F0' }} />
                                            <TouchableOpacity onPress={() => handleDeleteImage(img.id)} style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#EF4444', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    {(!editForm.images || editForm.images.length === 0) && (
                                        <Text style={{ color: isDark ? '#64748B' : '#94A3B8', fontStyle: 'italic' }}>Fotoğraf yok</Text>
                                    )}
                                </ScrollView>

                                <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#64748B' : '#94A3B8', marginBottom: 12 }}>➕ Yeni Fotoğraf Ekle</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {editForm.newImages && editForm.newImages.map((uri: string, index: number) => (
                                        <View key={index} style={{ marginRight: 12, position: 'relative' }}>
                                            <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 12, backgroundColor: isDark ? '#334155' : '#E2E8F0' }} />
                                            <TouchableOpacity onPress={() => removeNewImage(index)} style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#EF4444', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    <TouchableOpacity onPress={pickNewImage} style={{ width: 100, height: 100, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: isDark ? '#475569' : '#CBD5E1', backgroundColor: isDark ? '#0F172A' : '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 32, color: isDark ? '#64748B' : '#94A3B8' }}>+</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        )}

                        {/* Photo Gallery - View Mode */}
                        {!isEditing && selectedFault.images && selectedFault.images.length > 0 && (
                            <View style={{
                                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                borderRadius: 20,
                                marginBottom: 16,
                                padding: 20,
                                shadowColor: isDark ? '#000' : '#64748B',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: isDark ? 0.3 : 0.1,
                                shadowRadius: 12,
                                elevation: 5,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={{ fontSize: 18 }}>📷</Text>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#F1F5F9' : '#1E293B' }}>Fotoğraflar</Text>
                                    </View>
                                    <View style={{ backgroundColor: isDark ? 'rgba(34, 211, 238, 0.15)' : 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#22D3EE' : '#3B82F6' }}>{selectedFault.images.length} Fotoğraf</Text>
                                    </View>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ marginHorizontal: -4 }}>
                                    {selectedFault.images.map((img: any, index: number) => (
                                        <TouchableOpacity key={index} onPress={() => setFullScreenImage(img.url)} activeOpacity={0.8} style={{ marginHorizontal: 4 }}>
                                            <Image
                                                source={{ uri: img.url }}
                                                style={{ width: 160, height: 160, borderRadius: 16, backgroundColor: isDark ? '#334155' : '#E2E8F0' }}
                                                resizeMode="cover"
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <Text style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: isDark ? '#64748B' : '#94A3B8' }}>👆 Büyütmek için fotoğrafa dokun</Text>
                            </View>
                        )}

                        {/* Full-screen Image Modal */}
                        <Modal visible={!!fullScreenImage} transparent animationType="fade" onRequestClose={() => setFullScreenImage(null)}>
                            <TouchableOpacity
                                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}
                                activeOpacity={1}
                                onPress={() => setFullScreenImage(null)}
                            >
                                <TouchableOpacity activeOpacity={1} style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }} onPress={() => setFullScreenImage(null)}>
                                    <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>×</Text>
                                </TouchableOpacity>
                                {fullScreenImage && (
                                    <Image
                                        source={{ uri: fullScreenImage }}
                                        style={{ width: '95%', height: '80%' }}
                                        resizeMode="contain"
                                    />
                                )}
                            </TouchableOpacity>
                        </Modal>

                        {/* Spacer for buttons */}
                        <View style={{ height: 20 }} />

                        {/* Copy Button - Available to all users */}
                        {!isEditing && (
                            <TouchableOpacity
                                onPress={async () => {
                                    const text = `Arıza Tarihi: ${selectedFault.faultDate || '-'}
Arıza Saati: ${selectedFault.faultTime || '-'}
Arızayı Bildiren: ${selectedFault.reporterName || '-'}
Hat Bilgisi: ${selectedFault.lineInfo || '-'}
Arıza Bilgisi: ${selectedFault.closureFaultInfo || '-'}
Arıza Çözümü: ${selectedFault.solution || '-'}
Çalışan Personel: ${selectedFault.workingPersonnel || '-'}
Katılan TCDD Personeli: ${selectedFault.tcddPersonnel || '-'}`;
                                    await Clipboard.setStringAsync(text);
                                    showAlert('Kopyalandı', 'Arıza bilgileri panoya kopyalandı', 'success');
                                }}
                                style={{
                                    backgroundColor: isDark ? '#059669' : '#10B981',
                                    padding: 14,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    marginBottom: 12,
                                }}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Kopyala</Text>
                            </TouchableOpacity>
                        )}

                        {/* Edit & Delete Buttons - Only for canEdit users */}
                        {canEdit && !isEditing && (
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                                <TouchableOpacity onPress={() => setIsEditing(true)} style={{ flex: 1, backgroundColor: isDark ? '#22D3EE' : '#3B82F6', padding: 14, borderRadius: 12, alignItems: 'center' }}>
                                    <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Düzenle</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteFault(selectedFault.id)} style={{ flex: 1, backgroundColor: '#EF4444', padding: 14, borderRadius: 12, alignItems: 'center' }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Sil</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Edit Mode Buttons */}
                        {canEdit && isEditing && (
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                                <TouchableOpacity onPress={handleUpdate} style={{ flex: 1, backgroundColor: '#22C55E', padding: 14, borderRadius: 12, alignItems: 'center' }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Kaydet</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setIsEditing(false)} style={{ flex: 1, backgroundColor: isDark ? '#475569' : '#E2E8F0', padding: 14, borderRadius: 12, alignItems: 'center' }}>
                                    <Text style={{ color: isDark ? '#F1F5F9' : '#64748B', fontWeight: 'bold', fontSize: 16 }}>İptal</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>

                    <CustomAlert
                        visible={alertConfig.visible}
                        title={alertConfig.title}
                        message={alertConfig.message}
                        type={alertConfig.type}
                        onClose={closeAlert}
                        onConfirm={alertConfig.onConfirm}
                    />
                    <LoadingOverlay visible={loading && !refreshing} message="İşlem yapılıyor..." />
                </KeyboardAvoidingView >
            </View >
        );
    }

    if (showCreateModal) {
        return (
            <View className="flex-1" style={{ backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }}>
                <RailGuardHeader user={user} title="Yeni Arıza Girişi" showSearch={false} showGreeting={false} />
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <ScrollView className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'} p-4`} showsHorizontalScrollIndicator={false} contentContainerStyle={{ width: '100%' }}>
                        <View className="flex-row justify-between items-center mb-4">
                            <TouchableOpacity onPress={() => setShowCreateModal(false)} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} px-4 py-2 rounded-lg shadow-sm mb-4`}>
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
                                <Text className={`font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Fotoğraflar</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mb-2">
                                    {images.map((uri, index) => (
                                        <View key={index} className="relative">
                                            <Image source={{ uri }} className="w-20 h-20 rounded-lg bg-gray-200" />
                                            <TouchableOpacity onPress={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center">
                                                <Text className="text-white font-bold">X</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    <TouchableOpacity onPress={pickImage} className={`w-20 h-20 rounded-lg items-center justify-center border-2 border-dashed ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
                                        <Text className={`text-2xl ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>+</Text>
                                    </TouchableOpacity>
                                </ScrollView>
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

                    <CustomAlert
                        visible={alertConfig.visible}
                        title={alertConfig.title}
                        message={alertConfig.message}
                        type={alertConfig.type}
                        onClose={closeAlert}
                        onConfirm={alertConfig.onConfirm}
                    />
                    <LoadingOverlay visible={loading && !refreshing} message="İşlem yapılıyor..." />
                </KeyboardAvoidingView >
            </View>
        );
    }

    return (
        <View className="flex-1" style={{ backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }}>
            <RailGuardHeader user={user} title="Geçmiş Arızalar" showSearch={true} showGreeting={true} onSearch={setSearchQuery} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView
                    ref={ref}
                    className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'} p-4`}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ width: '100%' }}
                >
                    {/* Header Actions */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: isDark ? '#22D3EE' : '#1c4ed8', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>← Geri</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={openCreateModal} style={{ backgroundColor: isDark ? '#22D3EE' : '#1c4ed8', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>+ Yeni Arıza</Text>
                        </TouchableOpacity>
                    </View>

                    {loading && !refreshing ? (
                        <Text className="text-gray-500">Geçmiş yükleniyor...</Text>
                    ) : (
                        <>
                            {filteredHistory.map((fault, index) => (
                                <TouchableOpacity
                                    key={fault.id}
                                    onPress={() => openDetails(fault)}
                                    activeOpacity={0.7}
                                    style={{ transform: [{ scale: 1 }] }}
                                >
                                    <View style={{
                                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                        borderRadius: 16,
                                        marginBottom: 14,
                                        shadowColor: isDark ? '#000' : '#64748B',
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: isDark ? 0.3 : 0.1,
                                        shadowRadius: 12,
                                        elevation: 5,
                                        overflow: 'hidden',
                                    }}>
                                        {/* Left Accent Bar */}
                                        <View style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: 4,
                                            backgroundColor: isDark ? '#22D3EE' : '#3B82F6',
                                            borderTopLeftRadius: 16,
                                            borderBottomLeftRadius: 16,
                                        }} />

                                        <View style={{ padding: 16, paddingLeft: 20 }}>
                                            {/* Row 1: Chiefdom + Status Badge */}
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <Building2 size={14} color={isDark ? '#22D3EE' : '#3B82F6'} />
                                                    <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#22D3EE' : '#3B82F6' }}>
                                                        {fault.chiefdom?.name || 'Şeflik Belirtilmemiş'}
                                                    </Text>
                                                </View>
                                                <View style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
                                                    paddingHorizontal: 10,
                                                    paddingVertical: 4,
                                                    borderRadius: 20,
                                                    borderWidth: 1,
                                                    borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
                                                }}>
                                                    <CheckCircle2 size={12} color="#22C55E" />
                                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#22C55E' }}>KAPALI</Text>
                                                </View>
                                            </View>

                                            {/* Row 2: Fault Title */}
                                            <Text style={{
                                                fontSize: 17,
                                                fontWeight: '700',
                                                color: isDark ? '#F1F5F9' : '#1E293B',
                                                marginBottom: 12,
                                                lineHeight: 24,
                                            }}>
                                                {fault.title}
                                            </Text>

                                            {/* Row 3: Date + Time */}
                                            <View style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                paddingTop: 12,
                                                borderTopWidth: 1,
                                                borderTopColor: isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(148, 163, 184, 0.2)'
                                            }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                        <Calendar size={13} color={isDark ? '#64748B' : '#94A3B8'} />
                                                        <Text style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#64748B' }}>
                                                            {fault.faultDate || '-'}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                        <Clock size={13} color={isDark ? '#64748B' : '#94A3B8'} />
                                                        <Text style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#64748B' }}>
                                                            {fault.faultTime || '-'}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#22D3EE' : '#3B82F6' }}>
                                                    Detaylar →
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            {filteredHistory.length === 0 && (
                                <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
                                    <View style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 40,
                                        backgroundColor: isDark ? 'rgba(100, 116, 139, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: 16,
                                    }}>
                                        <FileX2 size={36} color={isDark ? '#64748B' : '#94A3B8'} />
                                    </View>
                                    <Text style={{ fontSize: 18, fontWeight: '600', color: isDark ? '#94A3B8' : '#64748B', marginBottom: 6 }}>
                                        Arıza Bulunamadı
                                    </Text>
                                    <Text style={{ fontSize: 14, color: isDark ? '#64748B' : '#94A3B8', textAlign: 'center' }}>
                                        {searchQuery ? 'Arama kriterlerine uygun arıza yok' : 'Henüz kapatılmış arıza kaydı yok'}
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
                <CustomAlert
                    visible={alertConfig.visible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                    onClose={closeAlert}
                    onConfirm={alertConfig.onConfirm}
                />
                <LoadingOverlay visible={loading && !refreshing} message="İşlem yapılıyor..." />
            </KeyboardAvoidingView>
        </View >
    );
}
