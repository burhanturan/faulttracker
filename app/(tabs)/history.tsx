import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';

export default function HistoryScreen() {
    const { user } = useAuth();
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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
            alert('Fault updated successfully');
            setIsEditing(false);
            setSelectedFault(null);
            fetchHistory();
        } catch (error) {
            alert('Failed to update fault');
        }
    };

    const canEdit = user?.role === 'admin' || user?.role === 'engineer';

    if (selectedFault) {
        return (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'} p-4`} showsHorizontalScrollIndicator={false} contentContainerStyle={{ width: '100%' }}>
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Fault Details</Text>
                        <TouchableOpacity onPress={() => setSelectedFault(null)}>
                            <Text className="text-blue-600 font-bold">Close</Text>
                        </TouchableOpacity>
                    </View>

                    <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'} p-4 rounded-xl border mb-4`}>
                        <Text className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedFault.title}</Text>
                        <Text className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{selectedFault.description}</Text>

                        <View className="gap-3">
                            <View>
                                <Text className="font-bold text-gray-500 text-xs">Arıza Tarihi</Text>
                                {isEditing ? (
                                    <TextInput value={editForm.faultDate} onChangeText={t => setEditForm({ ...editForm, faultDate: t })} className="bg-white p-2 rounded border border-gray-200" />
                                ) : (
                                    <Text className="text-gray-800">{selectedFault.faultDate || '-'}</Text>
                                )}
                            </View>
                            <View>
                                <Text className="font-bold text-gray-500 text-xs">Arıza Saati</Text>
                                {isEditing ? (
                                    <TextInput value={editForm.faultTime} onChangeText={t => setEditForm({ ...editForm, faultTime: t })} className="bg-white p-2 rounded border border-gray-200" />
                                ) : (
                                    <Text className="text-gray-800">{selectedFault.faultTime || '-'}</Text>
                                )}
                            </View>
                            <View>
                                <Text className="font-bold text-gray-500 text-xs">Arızayı Bildiren</Text>
                                {isEditing ? (
                                    <TextInput value={editForm.reporterName} onChangeText={t => setEditForm({ ...editForm, reporterName: t })} className="bg-white p-2 rounded border border-gray-200" />
                                ) : (
                                    <Text className="text-gray-800">{selectedFault.reporterName || '-'}</Text>
                                )}
                            </View>
                            <View>
                                <Text className="font-bold text-gray-500 text-xs">Hat Bilgisi</Text>
                                {isEditing ? (
                                    <TextInput value={editForm.lineInfo} onChangeText={t => setEditForm({ ...editForm, lineInfo: t })} className="bg-white p-2 rounded border border-gray-200" />
                                ) : (
                                    <Text className="text-gray-800">{selectedFault.lineInfo || '-'}</Text>
                                )}
                            </View>
                            <View>
                                <Text className="font-bold text-gray-500 text-xs">Arıza Bilgisi</Text>
                                {isEditing ? (
                                    <TextInput value={editForm.closureFaultInfo} onChangeText={t => setEditForm({ ...editForm, closureFaultInfo: t })} className="bg-white p-2 rounded border border-gray-200" />
                                ) : (
                                    <Text className="text-gray-800">{selectedFault.closureFaultInfo || '-'}</Text>
                                )}
                            </View>
                            <View>
                                <Text className="font-bold text-gray-500 text-xs">Arıza Çözümü</Text>
                                {isEditing ? (
                                    <TextInput value={editForm.solution} onChangeText={t => setEditForm({ ...editForm, solution: t })} multiline className="bg-white p-2 rounded border border-gray-200 h-20" textAlignVertical="top" />
                                ) : (
                                    <Text className="text-gray-800">{selectedFault.solution || '-'}</Text>
                                )}
                            </View>
                            <View>
                                <Text className="font-bold text-gray-500 text-xs">Çalışan Personel</Text>
                                {isEditing ? (
                                    <TextInput value={editForm.workingPersonnel} onChangeText={t => setEditForm({ ...editForm, workingPersonnel: t })} className="bg-white p-2 rounded border border-gray-200" />
                                ) : (
                                    <Text className="text-gray-800">{selectedFault.workingPersonnel || '-'}</Text>
                                )}
                            </View>
                            <View>
                                <Text className="font-bold text-gray-500 text-xs">Katılan TCDD Personeli</Text>
                                {isEditing ? (
                                    <TextInput value={editForm.tcddPersonnel} onChangeText={t => setEditForm({ ...editForm, tcddPersonnel: t })} className="bg-white p-2 rounded border border-gray-200" />
                                ) : (
                                    <Text className="text-gray-800">{selectedFault.tcddPersonnel || '-'}</Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {canEdit && (
                        <View className="mb-8">
                            {isEditing ? (
                                <View className="flex-row gap-2">
                                    <TouchableOpacity onPress={handleSaveEdit} className="flex-1 bg-green-600 p-3 rounded items-center"><Text className="text-white font-bold">Save Changes</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={() => setIsEditing(false)} className="flex-1 bg-gray-200 p-3 rounded items-center"><Text className="text-gray-600 font-bold">Cancel</Text></TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => setIsEditing(true)} className="bg-blue-600 p-3 rounded items-center">
                                    <Text className="text-white font-bold">Edit Details</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
            <ScrollView
                className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-4`}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ width: '100%' }}
            >
                <Text className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Fault History</Text>

                {loading ? (
                    <Text className="text-gray-500">Loading history...</Text>
                ) : (
                    <>
                        {history.map((fault) => (
                            <TouchableOpacity key={fault.id} onPress={() => openDetails(fault)}>
                                <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-4 rounded-lg shadow-sm border mb-3`}>
                                    <View className="flex-row justify-between items-start">
                                        <Text className={`font-bold text-lg flex-1 mr-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{fault.title}</Text>
                                        <View className={`px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                            <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>CLOSED</Text>
                                        </View>
                                    </View>

                                    <Text className="text-gray-600 mt-1 mb-2" numberOfLines={2}>{fault.description}</Text>

                                    <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-100">
                                        <Text className="text-gray-400 text-xs">Date: {fault.faultDate || '-'}</Text>
                                        <Text className="text-blue-600 text-xs font-bold">View Details →</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                        {history.length === 0 && (
                            <View className="items-center justify-center py-10">
                                <Text className="text-gray-400 text-lg">No closed faults found.</Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
