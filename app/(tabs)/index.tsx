
import { useScrollToTop } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from 'expo-router';
import { AlertTriangle, Briefcase, Building2, CheckCircle2, ChevronRight, Clock, Edit2, FolderOpen, MapPin, Plus, Trash2, Users } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CustomAlert from '../../components/CustomAlert';
import EditChiefdomModal from '../../components/EditChiefdomModal';
import EditProjectModal from '../../components/EditProjectModal';
import EditRegionModal from '../../components/EditRegionModal';
import LoadingOverlay from '../../components/LoadingOverlay';
import { ActivityItem } from '../../components/RailGuard/ActivityItem';
import { RailGuardHeader } from '../../components/RailGuard/Header';
import { QuickAction } from '../../components/RailGuard/QuickAction';
import { StatCard } from '../../components/RailGuard/StatCard';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';
// import { QuickAction } ... removing as we deleted the file for now, but Header exists.


// --- Components ---

function DashboardCard({ title, value, color, flex }: { title: string, value: string, color: string, flex?: boolean }) {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  return (
    <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-light-card border-gray-200'} p-6 rounded-xl shadow-sm border ${flex ? 'flex-1' : ''} items-center`}>
      <Text className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm mb-1 text-center`}>{title}</Text>
      <Text className={`text-2xl font-bold ${color.split(' ')[1]} text-center`}>{value}</Text>
    </View>
  );
}

function ActionButtons({ actions }: { actions: string[] }) {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  return (
    <View className="gap-3">
      {actions.map((action, index) => (
        <TouchableOpacity key={index} className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-light-card border-gray-200'} p-4 rounded-xl shadow-sm border flex-row justify-between items-center`}>
          <Text className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} `}>{action}</Text>
          <Text className={`${isDark ? 'text-gray-500' : 'text-gray-400'} `}>→</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// --- Role Dashboards ---

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

function CTCDashboard() {
  const { user } = useAuth();
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  // Theme colors for consistent dark mode styling
  const pageBg = isDark ? '#0F172A' : '#FFFFFF';
  const buttonBg = isDark ? '#22D3EE' : '#1c4ed8';
  const buttonText = isDark ? '#0F172A' : '#FFFFFF';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [faultDate, setFaultDate] = useState('');
  const [faultTime, setFaultTime] = useState('');
  const [chiefdomId, setChiefdomId] = useState('');
  const [chiefdoms, setChiefdoms] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);



  // Default to list view ('all_faults')
  const [view, setView] = useState<'all_faults' | 'history' | 'report_fault'>('all_faults');
  const [allFaults, setAllFaults] = useState<any[]>([]);
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);



  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean, title: string, message: string, type: 'success' | 'error' | 'info' | 'confirm', onConfirm?: () => void }>({
    visible: false, title: '', message: '', type: 'info'
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' | 'confirm' = 'info', onConfirm?: () => void) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.3,
    });

    if (!result.canceled) {
      setSelectedImages(prev => [...prev, ...result.assets].slice(0, 5));
    }
  };

  // Closure Form State
  const [closingFaultId, setClosingFaultId] = useState<string | null>(null);
  const [closureForm, setClosureForm] = useState({
    faultDate: '',
    faultTime: '',
    reporterName: '',
    lineInfo: '',
    faultInfo: '',
    solution: '',
    personnel: '',
    tcddPersonnel: ''
  });

  useEffect(() => {
    Promise.all([
      api.get('/chiefdoms'),
      api.get('/projects')
    ]).then(([chiefdomsData, projectsData]) => {
      setChiefdoms(chiefdomsData);
      setProjects(projectsData);
    }).catch(console.error);
    fetchAllFaults(); // Fetch on mount
  }, []);

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener('tabPress', (e: any) => {
      setView('all_faults');
      setClosingFaultId(null);
      fetchAllFaults();
    });
    return unsubscribe;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      setView('all_faults');
      setClosingFaultId(null);
      fetchAllFaults();
      const now = new Date();
      setFaultDate(now.toLocaleDateString('tr-TR'));
      setFaultTime(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
    }, [])
  );

  const fetchAllFaults = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await api.get('/faults');
      // Sort by newest first
      const sortedData = data.filter((f: any) => f.status === 'open').sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllFaults(sortedData);

      setAllFaults(sortedData);

      //   setView('all_faults'); // Already default
    } catch (error) {
      showAlert('Hata', 'Arızalar alınamadı', 'error');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleCloseFault = async () => {
    if (!closingFaultId) return;

    if (!closureForm.solution || !closureForm.faultDate) {
      showAlert('Eksik Bilgi', 'Lütfen en az Tarih ve Çözüm alanlarını doldurunuz.', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('status', 'closed');
      formData.append('faultDate', closureForm.faultDate);
      formData.append('faultTime', closureForm.faultTime);
      formData.append('reporterName', closureForm.reporterName);
      formData.append('lineInfo', closureForm.lineInfo);
      formData.append('closureFaultInfo', closureForm.faultInfo);
      formData.append('solution', closureForm.solution);
      formData.append('workingPersonnel', closureForm.personnel);
      formData.append('tcddPersonnel', closureForm.tcddPersonnel);

      if (selectedImages.length > 0) {
        for (const image of selectedImages) {
          const filename = image.uri.split('/').pop() || 'image.jpg';
          const type = getMimeType(filename);

          if (Platform.OS === 'web') {
            const response = await fetch(image.uri);
            const blob = await response.blob();
            formData.append('images', blob, filename);
          } else {
            formData.append('images', {
              uri: image.uri,
              type: type,
              name: filename
            } as any);
          }
        }
      }

      await api.put(`/faults/ ${closingFaultId} `, formData, true); // true for multipart
      showAlert('Başarılı', 'Arıza başarıyla kapatıldı!', 'success');
      setClosingFaultId(null);
      setSelectedImages([]);
      setClosureForm({
        faultDate: '',
        faultTime: '',
        reporterName: '',
        lineInfo: '',
        faultInfo: '',
        solution: '',
        personnel: '',
        tcddPersonnel: ''
      });
      fetchAllFaults(); // Refresh list
    } catch (error) {
      showAlert('Hata', 'Arıza kapatılamadı', 'error');
    } finally {
      setLoading(false);
    }
  };


  const openClosureForm = (fault: any) => {
    setClosingFaultId(fault.id.toString());
    const now = new Date();
    setClosureForm({
      faultDate: now.toLocaleDateString('tr-TR'),
      faultTime: now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      reporterName: fault.reportedBy?.fullName || '',
      lineInfo: '',
      faultInfo: fault.description || '',
      solution: '',
      personnel: '',
      tcddPersonnel: ''
    });
  };

  const fetchHistory = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      let endpoint = `/faults?reportedById=${user?.id}`;
      // CTC Watchman should see all history
      if (user?.role === 'ctc_watchman') {
        endpoint = '/faults';
      }
      const data = await api.get(endpoint);
      setHistory(data);
      setView('history');
    } catch (error) {
      showAlert('Hata', 'Geçmiş alınamadı', 'error');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
    const fetchPromise = view === 'history' ? fetchHistory(false) : fetchAllFaults(false);
    await Promise.all([fetchPromise, minDelay]);
    setRefreshing(false);
  }, [view]);

  const handleSubmit = async () => {
    if (!title || !description || !chiefdomId) {
      showAlert('Eksik Bilgi', 'Lütfen tüm alanları doldurunuz', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/faults', {
        title,
        description,
        reporterName,
        faultDate,
        faultTime,
        reportedById: parseInt(user?.id || '0'),
        chiefdomId: parseInt(chiefdomId)
      });
      showAlert('Başarılı', 'Arıza bildirimi oluşturuldu', 'success');
      setTitle('');
      setDescription('');
      setReporterName('');
      setChiefdomId('');
      fetchAllFaults(); // Refresh current list if user goes back
      // Optionally stay on report page or go back. Let's stay and show success.
    } catch (error) {
      showAlert('Hata', 'Arıza bildirilemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'history') {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#F9FAFB' }}>
        <RailGuardHeader user={user} title="Arıza Geçmişi" showSearch={false} showGreeting={true} />
        <ScrollView
          className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'} px-4 py-6`}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : "#1c4ed8"} colors={[isDark ? "#fff" : "#1c4ed8"]} />}
        >
          <View className="gap-4">
            <TouchableOpacity onPress={() => setView('all_faults')} style={{ backgroundColor: '#1c4ed8', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>← Listeye Dön</Text>
            </TouchableOpacity>
            <Text className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'} `}>Arıza Geçmişi</Text>
            {history.map((fault) => (
              <View key={fault.id} className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-4 rounded-lg shadow-sm border mb-2`}>
                <View className="flex-row justify-between items-start">
                  <Text className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'} `}>{fault.title}</Text>
                  <View className={`px-2 py-1 rounded-full ${fault.status === 'open' ? 'bg-red-100' : 'bg-green-100'} `}>
                    <Text className={`text-xs font-bold ${fault.status === 'open' ? 'text-red-800' : 'text-green-800'} `}>{fault.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'} `}>{fault.description}</Text>
                <Text className="text-gray-400 text-xs mt-2">Atanan: {fault.chiefdom?.name || 'Atanmamış'}</Text>
                <Text className="text-gray-400 text-xs">Tarih: {new Date(fault.createdAt).toLocaleDateString()}</Text>
              </View>
            ))}
            {history.length === 0 && <Text className="text-gray-500 text-center mt-4">Henüz arıza bildirilmedi.</Text>}
            <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={closeAlert} onConfirm={alertConfig.onConfirm} />
            <LoadingOverlay visible={loading} message="İşlem yapılıyor..." />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (view === 'all_faults') {
    if (closingFaultId) {
      return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#F9FAFB' }}>
          <RailGuardHeader user={user} title="Arıza Kapat" showSearch={false} showGreeting={false} />
          <ScrollView className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'} px-4 py-6`} contentContainerStyle={{ paddingBottom: 40 }}>
            <View className="flex-1">
              <View className="gap-4 pb-10">
                <TouchableOpacity onPress={() => setClosingFaultId(null)} style={{ backgroundColor: '#1c4ed8', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginBottom: 16 }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>← Listeye Dön</Text>
                </TouchableOpacity>
                <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} `}>Arıza Kaydını Kapat</Text>

                <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-4 rounded-xl shadow-sm border gap-3`}>
                  <View>
                    <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arıza Tarihi</Text>
                    <TextInput value={closureForm.faultDate} onChangeText={t => setClosureForm({ ...closureForm, faultDate: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} placeholder="DD.MM.YYYY" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                  </View>
                  <View>
                    <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arıza Saati</Text>
                    <TextInput value={closureForm.faultTime} onChangeText={t => setClosureForm({ ...closureForm, faultTime: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} placeholder="HH:MM" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                  </View>
                  <View>
                    <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arızayı Bildiren</Text>
                    <TextInput value={closureForm.reporterName} onChangeText={t => setClosureForm({ ...closureForm, reporterName: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} />
                  </View>
                  <View>
                    <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Hat Bilgisi</Text>
                    <TextInput value={closureForm.lineInfo} onChangeText={t => setClosureForm({ ...closureForm, lineInfo: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} />
                  </View>
                  <View>
                    <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arıza Bilgisi</Text>
                    <TextInput value={closureForm.faultInfo} onChangeText={t => setClosureForm({ ...closureForm, faultInfo: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} multiline numberOfLines={3} />
                  </View>
                  <View>
                    <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arıza Çözümü</Text>
                    <TextInput value={closureForm.solution} onChangeText={t => setClosureForm({ ...closureForm, solution: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} multiline numberOfLines={3} placeholder="Yapılan işlemi açıklayınız..." placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                  </View>
                  <View>
                    <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Çalışan Personel</Text>
                    <TextInput value={closureForm.personnel} onChangeText={t => setClosureForm({ ...closureForm, personnel: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} />
                  </View>
                  <View>
                    <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Katılan TCDD Personeli</Text>
                    <TextInput value={closureForm.tcddPersonnel} onChangeText={t => setClosureForm({ ...closureForm, tcddPersonnel: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} />
                  </View>

                  <View>
                    <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-2`}>Fotoğraflar (İsteğe Bağlı, Max 5)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mb-2">
                      {selectedImages.map((img, index) => (
                        <View key={index} className="relative">
                          <Image source={{ uri: img.uri }} className="w-20 h-20 rounded-lg" />
                          <TouchableOpacity onPress={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center z-10 shadow-sm">
                            <Text className="text-white font-bold text-xs">X</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity onPress={pickImages} className={`${isDark ? 'bg-dark-bg border-gray-700' : 'bg-gray-100 border-gray-300'} w-20 h-20 rounded-lg items-center justify-center border border-dashed`}>
                        <Text className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-2xl`}>+</Text>
                      </TouchableOpacity>
                    </ScrollView>
                    <Text className="text-xs text-gray-400">{selectedImages.length} fotoğraf seçildi</Text>
                  </View>

                  <TouchableOpacity onPress={handleCloseFault} style={{ backgroundColor: '#1c4ed8', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Arızayı Kapat ve Kaydet</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={closeAlert} onConfirm={alertConfig.onConfirm} />
              <LoadingOverlay visible={loading} message="Arıza kapatılıyor..." />
            </View>
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#F9FAFB' }}>
        <RailGuardHeader user={user} title="CTC Paneli" showSearch={true} showGreeting={true} />
        <ScrollView
          className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'} px-4 py-6`}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : "#1c4ed8"} colors={[isDark ? "#fff" : "#1c4ed8"]} />}
        >
          <View className="gap-4">
            {/* Helper Action Buttons for Watchman */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
              <TouchableOpacity onPress={() => setView('report_fault')} style={{ flex: 1, backgroundColor: '#1c4ed8', padding: 12, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>+ Arıza Bildir</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => fetchHistory()} style={{ flex: 1, backgroundColor: '#16a34a', padding: 12, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Geçmiş Arızalarım</Text>
              </TouchableOpacity>
            </View>

            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} `}>Tüm Aktif Arızalar</Text>

            {allFaults.map(f => (
              <TouchableOpacity key={f.id} onPress={() => openClosureForm(f)}>
                <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-4 rounded-lg shadow-sm border mb-2`}>
                  <View className="flex-row justify-between items-start">
                    <Text className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'} `}>{f.title}</Text>
                    <View className={`px-2 py-1 rounded-full ${f.status === 'open' ? 'bg-red-100' : 'bg-green-100'} `}>
                      <Text className={`text-xs font-bold ${f.status === 'open' ? 'text-red-800' : 'text-green-800'} `}>{f.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>{f.description}</Text>
                  <Text className="text-gray-400 text-xs mt-2">Atanan: {f.chiefdom?.name || 'Atanmamış'}</Text>
                  <Text className="text-gray-400 text-xs">Bildiren: {f.reportedBy?.fullName}</Text>
                  <Text className="text-gray-400 text-xs">Tarih: {new Date(f.createdAt).toLocaleDateString()}</Text>
                  <Text className={`${isDark ? 'text-dark-primary' : 'text-light-primary'} text-xs mt-2 font-bold`}>Kapatmak için dokunun &gt;</Text>
                </View>
              </TouchableOpacity>
            ))}
            {allFaults.length === 0 && <Text className="text-gray-500 text-center mt-4">Aktif arıza yok.</Text>}
            <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={closeAlert} onConfirm={alertConfig.onConfirm} />
            <LoadingOverlay visible={loading} />
          </View>
        </ScrollView>
      </View >
    );
  }

  if (view === 'report_fault') {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#F9FAFB' }}>
        <RailGuardHeader user={user} title="Arıza Bildir" showSearch={false} showGreeting={false} />
        <ScrollView
          className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'} px-4 py-6`}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : "#1c4ed8"} colors={[isDark ? "#fff" : "#1c4ed8"]} />}
        >
          <View className="gap-6">
            <TouchableOpacity onPress={() => setView('all_faults')} style={{ backgroundColor: '#1c4ed8', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>← Listeye Dön</Text>
            </TouchableOpacity>

            <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border`}>
              <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'} `}>Arıza Bildir</Text>

              <Text className={`font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'} `}>Arıza Başlığı</Text>
              <TextInput
                className={`border rounded-lg p-3 mb-4 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} `}
                placeholder="Örn. A İstasyonu Sinyal Arızası"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={title}
                onChangeText={setTitle}
              />

              <Text className={`font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'} `}>Açıklama</Text>
              <TextInput
                className={`border rounded-lg p-3 mb-4 h-24 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} `}
                placeholder="Sorunu detaylıca açıklayınız..."
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                multiline
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />

              <View className="flex-row gap-2 mb-4">
                <View className="flex-1">
                  <Text className={`font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'} `}>Tarih</Text>
                  <TextInput
                    className={`border rounded-lg p-3 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} `}
                    value={faultDate}
                    onChangeText={setFaultDate}
                    placeholder="GG.AA.YYYY"
                  />
                </View>
                <View className="flex-1">
                  <Text className={`font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'} `}>Saat</Text>
                  <TextInput
                    className={`border rounded-lg p-3 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} `}
                    value={faultTime}
                    onChangeText={setFaultTime}
                    placeholder="SS:DD"
                  />
                </View>
              </View>

              <Text className={`font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'} `}>Bildirilen Personel</Text>
              <TextInput
                className={`border rounded-lg p-3 mb-4 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} `}
                placeholder="Personel Adı Soyadı"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={reporterName}
                onChangeText={setReporterName}
              />

              <Text className={`font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'} `}>Şefliğe Ata</Text>
              <View className="mb-6">
                {projects.map(p => {
                  const projectChiefdoms = chiefdoms.filter(c => c.projectId === p.id);
                  if (projectChiefdoms.length === 0) return null;
                  return (
                    <View key={p.id} className="mb-3">
                      <Text className={`font-bold mb-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} `}>{p.name}</Text>
                      <View className="flex-row gap-2 flex-wrap">
                        {projectChiefdoms.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                          <TouchableOpacity
                            key={c.id}
                            onPress={() => setChiefdomId(c.id.toString())}
                            className={`px-4 py-2 rounded-full border ${chiefdomId === c.id.toString() ? 'bg-red-600 border-red-600' : isDark ? 'bg-dark-bg border-gray-700' : 'bg-white border-gray-300'} `}
                          >
                            <Text className={`${chiefdomId === c.id.toString() ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-600'} `}>{c.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  );
                })}
                {chiefdoms.filter(c => !c.projectId).length > 0 && (
                  <View className="mb-3">
                    <Text className={`font-bold mb-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} `}>Diğer</Text>
                    <View className="flex-row gap-2 flex-wrap">
                      {chiefdoms.filter(c => !c.projectId).sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => setChiefdomId(c.id.toString())}
                          className={`px-4 py-2 rounded-full border ${chiefdomId === c.id.toString() ? 'bg-red-600 border-red-600' : isDark ? 'bg-dark-bg border-gray-700' : 'bg-white border-gray-300'} `}
                        >
                          <Text className={`${chiefdomId === c.id.toString() ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-600'} `}>{c.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={{ backgroundColor: loading ? '#94A3B8' : '#1c4ed8', padding: 16, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Raporu Gönder</Text>
              </TouchableOpacity>
            </View>
            <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={closeAlert} onConfirm={alertConfig.onConfirm} />
            <LoadingOverlay visible={loading} message="Arıza bildiriliyor..." />
          </View>
        </ScrollView>
      </View>
    );
  }

  // Fallback (though view is constrained)
  return null;
}

function AdminDashboard() {
  const { user } = useAuth(); // Get current user
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  // Theme colors for consistent dark mode styling
  const pageBg = isDark ? '#0F172A' : '#FFFFFF';
  const buttonBg = isDark ? '#22D3EE' : '#1c4ed8';
  const buttonText = isDark ? '#0F172A' : '#FFFFFF';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const borderColor = isDark ? '#334155' : '#E5E7EB';

  const [faults, setFaults] = useState<any[]>([]); // Only open faults
  const [allFaults, setAllFaults] = useState<any[]>([]); // All faults for activity feed
  const [masterFaultList, setMasterFaultList] = useState<any[]>([]); // GLOBAL LIST for search (Open + Closed)
  const [chiefdoms, setChiefdoms] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [view, setView] = useState<'overview' | 'users' | 'chiefdoms' | 'faults' | 'create_user' | 'edit_user' | 'projects' | 'regions'>('overview');
  const [error, setError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
    await Promise.all([fetchData(), minDelay]);
    setRefreshing(false);
  }, []);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFaults, setFilteredFaults] = useState<any[]>([]);
  const [faultStatusFilter, setFaultStatusFilter] = useState<'all' | 'open' | 'closed'>('all');

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFaults([]);
      return;
    }
    const query = searchQuery.toLowerCase();

    // Search in MASTER LIST (Open + Closed)
    const results = masterFaultList.filter(f =>
      f.title?.toLowerCase().includes(query) ||
      f.description?.toLowerCase().includes(query) ||
      f.id.toString().includes(query) ||
      f.status?.toLowerCase().includes(query)
    );
    setFilteredFaults(results);
  }, [searchQuery, masterFaultList]);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean, title: string, message: string, type: 'success' | 'error' | 'info' | 'confirm' | 'loading', onConfirm?: () => void }>({
    visible: false, title: '', message: '', type: 'info'
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' | 'confirm' | 'loading' = 'info', onConfirm?: () => void) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.3,
    });

    if (!result.canceled) {
      setSelectedImages(prev => [...prev, ...result.assets].slice(0, 5));
    }
  };

  // Create User Form State
  const [createUserForm, setCreateUserForm] = useState({ username: '', password: '', fullName: '', role: 'worker', chiefdomId: '', email: '', phone: '+90' });

  // Inline Edit State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState({ id: '', username: '', password: '', fullName: '', role: 'worker', chiefdomId: '', email: '', phone: '' });

  // Chiefdom Form State
  const [newChiefdom, setNewChiefdom] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [editingChiefdomId, setEditingChiefdomId] = useState<string | null>(null);
  const [editChiefdomName, setEditChiefdomName] = useState('');

  // Region State
  const [newRegionName, setNewRegionName] = useState('');

  // Modal State
  const [editChiefdomModalVisible, setEditChiefdomModalVisible] = useState(false);
  const [selectedChiefdomForEdit, setSelectedChiefdomForEdit] = useState<any>(null);
  const [newRegionDesc, setNewRegionDesc] = useState('');

  // Project State
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [selectedRegionIdForProject, setSelectedRegionIdForProject] = useState('');

  // Toggles & Edit States
  const [showCreateRegion, setShowCreateRegion] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateChiefdom, setShowCreateChiefdom] = useState(false); // New toggle state
  const [editRegionModalVisible, setEditRegionModalVisible] = useState(false);
  const [selectedRegionForEdit, setSelectedRegionForEdit] = useState<any>(null);
  const [editProjectModalVisible, setEditProjectModalVisible] = useState(false);
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState<any>(null);

  // Closure Form State (Copied from WorkerDashboard)
  const [closingFaultId, setClosingFaultId] = useState<string | null>(null);
  const [closureForm, setClosureForm] = useState({
    faultDate: '',
    faultTime: '',
    reporterName: '',
    lineInfo: '',
    faultInfo: '',
    solution: '',
    personnel: '',
    tcddPersonnel: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener('tabPress', (e: any) => {
      setView('overview');
      setCreateUserForm({ username: '', password: '', fullName: '', role: 'worker', chiefdomId: '', email: '', phone: '+90' });
      setEditingUserId(null);
      setNewChiefdom('');
      setEditingChiefdomId(null);
      setClosingFaultId(null);
    });
    return unsubscribe;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      setView('overview');
      setCreateUserForm({ username: '', password: '', fullName: '', role: 'worker', chiefdomId: '', email: '', phone: '+90' });
      setEditingUserId(null);
      setNewChiefdom('');
      setEditingChiefdomId(null);
      setClosingFaultId(null);
    }, [])
  );

  const fetchData = async () => {
    try {
      const [faultsData, chiefdomsData, usersData, projectsData, regionsData] = await Promise.all([
        api.get('/faults'),
        api.get('/chiefdoms'),
        api.get('/users'),
        api.get('/projects'),
        api.get('/regions')
      ]);
      // Filter for active faults only
      setFaults(faultsData.filter((f: any) => f.status === 'open'));
      // Store all faults sorted by updatedAt (newest activity first) for activity feed
      setAllFaults(faultsData.sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()));
      // Store ALL data for SEARCH (Open + Closed)
      setMasterFaultList(faultsData);
      setChiefdoms(chiefdomsData);
      setUsers(usersData);
      setProjects(projectsData);
      setRegions(regionsData);
      setError(null);
    } catch (error: any) {
      console.error(error);
      setError(error.message || 'Veri yüklenirken bir hata oluştu');
    }
  };

  const handleCloseFault = async () => {
    if (!closingFaultId) return;

    // Basic validation
    if (!closureForm.solution || !closureForm.faultDate) {
      showAlert('Eksik Bilgi', 'Lütfen en az Tarih ve Çözüm alanlarını doldurunuz.', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('status', 'closed');
      formData.append('faultDate', closureForm.faultDate);
      formData.append('faultTime', closureForm.faultTime);
      formData.append('reporterName', closureForm.reporterName);
      formData.append('lineInfo', closureForm.lineInfo);
      formData.append('closureFaultInfo', closureForm.faultInfo);
      formData.append('solution', closureForm.solution);
      formData.append('workingPersonnel', closureForm.personnel);
      formData.append('tcddPersonnel', closureForm.tcddPersonnel);

      if (selectedImages.length > 0) {
        for (const image of selectedImages) {
          const filename = image.uri.split('/').pop() || 'image.jpg';
          const type = getMimeType(filename);

          if (Platform.OS === 'web') {
            const response = await fetch(image.uri);
            const blob = await response.blob();
            formData.append('images', blob, filename);
          } else {
            formData.append('images', {
              uri: image.uri,
              type: type,
              name: filename
            } as any);
          }
        }
      }

      await api.put(`/faults/ ${closingFaultId} `, formData, true); // true for multipart
      showAlert('Başarılı', 'Arıza başarıyla kapatıldı!', 'success');
      setClosingFaultId(null);
      setSelectedImages([]);
      setClosureForm({
        faultDate: '',
        faultTime: '',
        reporterName: '',
        lineInfo: '',
        faultInfo: '',
        solution: '',
        personnel: '',
        tcddPersonnel: ''
      });
      fetchData(); // Refresh list
    } catch (error) {
      showAlert('Hata', 'Arıza kapatılamadı', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openClosureForm = (fault: any) => {
    setClosingFaultId(fault.id.toString());
    const now = new Date();
    setClosureForm({
      faultDate: now.toLocaleDateString('tr-TR'),
      faultTime: now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      reporterName: fault.reportedBy?.fullName || '',
      lineInfo: '',
      faultInfo: fault.description || '',
      solution: '',
      personnel: '',
      tcddPersonnel: ''
    });
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleCreateUser = async () => {
    if (!createUserForm.username || !createUserForm.fullName || !createUserForm.email || !createUserForm.phone || !createUserForm.password) {
      showAlert('Eksik Bilgi', 'Lütfen şifre dahil tüm zorunlu alanları doldurunuz', 'error');
      return;
    }

    // Password validation
    if (createUserForm.password.length < 3) {
      showAlert('Geçersiz Şifre', 'Şifre en az 3 karakter olmalıdır', 'error');
      return;
    }

    if (!validateEmail(createUserForm.email)) {
      showAlert('Geçersiz E-posta', 'Lütfen geçerli bir e-posta adresi giriniz', 'error');
      return;
    }

    if (!createUserForm.phone.startsWith('+90') || createUserForm.phone.length < 13) {
      showAlert('Geçersiz Telefon', 'Telefon numarası +90 ile başlamalıdır', 'error');
      return;
    }

    showAlert('Kullanıcı Oluşturuluyor', 'Lütfen bekleyiniz...', 'loading');
    const startTime = Date.now();
    try {
      await api.post('/users', { ...createUserForm });
      const elapsed = Date.now() - startTime;
      const waitTime = Math.max(500 - elapsed, 0);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      closeAlert();
      setTimeout(() => {
        showAlert('Başarılı', 'Kullanıcı başarıyla oluşturuldu!', 'success');
        setCreateUserForm({ username: '', password: '', fullName: '', role: 'worker', chiefdomId: '', email: '', phone: '+90' });
        fetchData();
      }, 400);
    } catch (error) {
      closeAlert();
      setTimeout(() => showAlert('Hata', 'Kullanıcı oluşturulamadı', 'error'), 400);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName || !newProjectName.trim()) {
      showAlert('Hata', 'Proje adı boş olamaz', 'error');
      return;
    }
    showAlert('Proje Oluşturuluyor', 'Lütfen bekleyiniz...', 'loading');
    const startTime = Date.now();
    try {
      await api.post('/projects', {
        name: newProjectName,
        description: newProjectDesc,
        regionId: selectedRegionIdForProject || undefined
      });
      const elapsed = Date.now() - startTime;
      const waitTime = Math.max(500 - elapsed, 0);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      closeAlert();
      setTimeout(() => {
        showAlert('Başarılı', 'Proje oluşturuldu', 'success');
        setNewProjectName('');
        setNewProjectDesc('');
        fetchData();
      }, 400);
    } catch (error) {
      closeAlert();
      setTimeout(() => showAlert('Hata', 'Proje oluşturulamadı', 'error'), 400);
    }
  };

  const handleCreateRegion = async () => {
    if (!newRegionName || !newRegionName.trim()) {
      showAlert('Hata', 'Bölge adı boş olamaz', 'error');
      return;
    }
    showAlert('Bölge Oluşturuluyor', 'Lütfen bekleyiniz...', 'loading');
    const startTime = Date.now();
    try {
      await api.post('/regions', { name: newRegionName, description: newRegionDesc });
      const elapsed = Date.now() - startTime;
      const waitTime = Math.max(500 - elapsed, 0);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      closeAlert();
      setTimeout(() => {
        showAlert('Başarılı', 'Bölge oluşturuldu', 'success');
        setNewRegionName('');
        setNewRegionDesc('');
        fetchData();
      }, 400);
    } catch (error) {
      closeAlert();
      setTimeout(() => showAlert('Hata', 'Bölge oluşturulamadı', 'error'), 400);
    }
  };


  const handleUpdateUser = async () => {
    if (!editUserForm.username || !editUserForm.fullName || !editUserForm.email || !editUserForm.phone) {
      showAlert('Eksik Bilgi', 'Lütfen tüm zorunlu alanları doldurunuz', 'error');
      return;
    }

    if (!validateEmail(editUserForm.email)) {
      showAlert('Geçersiz E-posta', 'Lütfen geçerli bir e-posta adresi giriniz', 'error');
      return;
    }

    if (!editUserForm.phone.startsWith('+90') || editUserForm.phone.length < 13) {
      showAlert('Geçersiz Telefon', 'Telefon numarası +90 ile başlamalıdır', 'error');
      return;
    }

    // Validate password if user is changing it
    if (editUserForm.password && editUserForm.password.length < 3) {
      showAlert('Geçersiz Şifre', 'Şifre en az 3 karakter olmalıdır', 'error');
      return;
    }

    showAlert('Kullanıcı Güncelleniyor', 'Lütfen bekleyiniz...', 'loading');
    const startTime = Date.now();
    try {
      // Only send password if it's not empty (meaning user wants to change it)
      const updateData: any = { ...editUserForm };
      if (!updateData.password) delete updateData.password;

      await api.put(`/users/${editUserForm.id}`, updateData);
      const elapsed = Date.now() - startTime;
      const waitTime = Math.max(500 - elapsed, 0);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      closeAlert();
      setTimeout(() => {
        showAlert('Başarılı', 'Kullanıcı başarıyla güncellendi', 'success');
        setEditingUserId(null);
        setView('users');
        fetchData();
      }, 400);
    } catch (error) {
      closeAlert();
      setTimeout(() => showAlert('Hata', 'Kullanıcı güncellenemedi', 'error'), 400);
    }
  };

  const handleDeleteUser = (id: string) => {
    showAlert('Kullanıcıyı Sil', 'Bu kullanıcıyı silmek istediğinize emin misiniz?', 'confirm', async () => {
      showAlert('Kullanıcı Siliniyor', 'Lütfen bekleyiniz...', 'loading');
      const startTime = Date.now();
      try {
        await api.delete(`/users/${id}`);
        const elapsed = Date.now() - startTime;
        const waitTime = Math.max(500 - elapsed, 0);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        closeAlert();
        setTimeout(() => {
          showAlert('Başarılı', 'Kullanıcı silindi', 'success');
          fetchData();
        }, 400);
      } catch (error) {
        closeAlert();
        setTimeout(() => showAlert('Hata', 'Kullanıcı silinemedi', 'error'), 400);
      }
    });
  };

  const handleDeleteRegion = (id: string) => {
    showAlert('Bölgeyi Sil', 'Bu bölgeyi silmek istediğinize emin misiniz?', 'confirm', async () => {
      showAlert('Bölge Siliniyor', 'Lütfen bekleyiniz...', 'loading');
      const startTime = Date.now();
      try {
        await api.delete(`/regions/${id}`);
        const elapsed = Date.now() - startTime;
        const waitTime = Math.max(500 - elapsed, 0);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        closeAlert();
        setTimeout(() => {
          showAlert('Başarılı', 'Bölge silindi', 'success');
          fetchData();
        }, 400);
      } catch (error) {
        closeAlert();
        setTimeout(() => showAlert('Hata', 'Bölge silinemedi (Bağlı projeler olabilir)', 'error'), 400);
      }
    });
  };

  const handleDeleteProject = (id: string) => {
    showAlert('Projeyi Sil', 'Bu projeyi silmek istediğinize emin misiniz?', 'confirm', async () => {
      showAlert('Proje Siliniyor', 'Lütfen bekleyiniz...', 'loading');
      const startTime = Date.now();
      try {
        await api.delete(`/projects/${id}`);
        const elapsed = Date.now() - startTime;
        const waitTime = Math.max(500 - elapsed, 0);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        closeAlert();
        setTimeout(() => {
          showAlert('Başarılı', 'Proje silindi', 'success');
          fetchData();
        }, 400);
      } catch (error) {
        closeAlert();
        setTimeout(() => showAlert('Hata', 'Proje silinemedi (Bağlı şeflikler olabilir)', 'error'), 400);
      }
    });
  };

  const startEditing = (user: any) => {
    setEditingUserId(user.id.toString());
    setEditUserForm({
      id: user.id.toString(),
      username: user.username,
      password: '', // Empty by default
      fullName: user.fullName,
      role: user.role,
      chiefdomId: user.chiefdomId ? user.chiefdomId.toString() : '',
      email: user.email || '',
      phone: user.phone || '+90'
    });
    setView('edit_user');
  };

  const cancelEditing = () => {
    setEditingUserId(null);
  };

  const handleCreateChiefdom = async () => {
    if (!newChiefdom || !newChiefdom.trim()) {
      showAlert('Hata', 'Şeflik adı boş olamaz', 'error');
      return;
    }
    showAlert('Şeflik Oluşturuluyor', 'Lütfen bekleyiniz...', 'loading');
    const startTime = Date.now();
    try {
      await api.post('/chiefdoms', {
        name: newChiefdom,
        projectId: selectedProjectId || undefined
      });
      const elapsed = Date.now() - startTime;
      const waitTime = Math.max(500 - elapsed, 0);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      closeAlert();
      setShowCreateChiefdom(false);
      setTimeout(() => {
        showAlert('Başarılı', 'Şeflik oluşturuldu', 'success');
        setNewChiefdom('');
        setSelectedProjectId('');
        fetchData();
      }, 400);
    } catch (error) {
      closeAlert();
      setTimeout(() => showAlert('Hata', 'Şeflik oluşturulamadı', 'error'), 400);
    }
  };

  const handleDeleteChiefdom = (id: string) => {
    showAlert('Şefliği Sil', 'Bu şefliği silmek istediğinize emin misiniz?', 'confirm', async () => {
      showAlert('Şeflik Siliniyor', 'Lütfen bekleyiniz...', 'loading');
      const startTime = Date.now();
      try {
        await api.delete(`/chiefdoms/${id}`);
        const elapsed = Date.now() - startTime;
        const waitTime = Math.max(500 - elapsed, 0);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        closeAlert();
        setTimeout(() => {
          showAlert('Başarılı', 'Şeflik silindi', 'success');
          fetchData();
        }, 400);
      } catch (error) {
        closeAlert();
        setTimeout(() => showAlert('Hata', 'Şeflik silinemedi', 'error'), 400);
      }
    });
  };

  // Removed simple handleUpdateChiefdom as we now use the modal for everything


  // Filter roles based on current user's role
  const availableRoles = ['admin', 'engineer', 'ctc_watchman', 'worker'].filter(role => {
    if (user?.role !== 'admin' && role === 'admin') return false;
    return true;
  });

  const roleLabels: { [key: string]: string } = {
    admin: 'Yönetici',
    engineer: 'Mühendis',
    ctc_watchman: 'CTC Nöbetçisi',
    worker: 'Saha Çalışanı'
  };

  const renderContent = () => {
    if (view === 'overview') {

      // If searching, show results list instead of Dashboard
      if (searchQuery.trim()) {
        return (
          <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <RailGuardHeader user={user} onSearch={setSearchQuery} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <ScrollView
                style={{ flex: 1 }}
                className="pt-4"
                contentContainerStyle={{ paddingHorizontal: 16 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : "#1c4ed8"} colors={[isDark ? "#fff" : "#1c4ed8"]} />}
              >
                <Text className="text-white text-lg font-bold mb-4">Arama Sonuçları ({filteredFaults.length})</Text>
                {filteredFaults.map(f => (
                  <TouchableOpacity key={f.id} onPress={() => { /* Handle detail view later */ }} className="bg-white/10 p-4 rounded-xl mb-3 border border-white/5">
                    <View className="flex-row justify-between">
                      <Text className="text-white font-bold text-base">{f.title}</Text>
                      <View className={`px-2 py-1 rounded-lg ${f.status === 'open' ? 'bg-red-500/20' : 'bg-green-500/20'} `}>
                        <Text className={`${f.status === 'open' ? 'text-red-400' : 'text-green-400'} text-xs font-bold uppercase`}>{f.status}</Text>
                      </View>
                    </View>
                    <Text className="text-gray-400 text-sm mt-1">{f.description}</Text>
                    <Text className="text-gray-500 text-xs mt-2">ID: {f.id} • {new Date(f.createdAt).toLocaleDateString()}</Text>
                  </TouchableOpacity>
                ))}
                {filteredFaults.length === 0 && (
                  <Text className="text-gray-500 text-center mt-10">Sonuç bulunamadı.</Text>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        );
      }

      return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }}>
          <RailGuardHeader user={user} onSearch={setSearchQuery} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView
              style={{ flex: 1 }}
              className="pt-4"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : "#1c4ed8"} colors={[isDark ? "#fff" : "#1c4ed8"]} />}
            >
              {/* Row 1: Açık Arızalar - Full Width */}
              <View className="mb-2">
                <StatCard
                  title="Açık Arızalar"
                  value={faults.filter(f => f.status === 'open').length}
                  icon={AlertTriangle}
                  color="#EF4444"
                  subtitle="Acil Müdahale"
                  fullWidth={true}
                  onPress={() => { setView('faults'); setFaultStatusFilter('open'); }}
                />
              </View>

              {/* Row 2: Çözülenler + İşlemde */}
              <View className="flex-row gap-2 mb-6">
                <StatCard
                  title="Çözülenler"
                  value={allFaults.filter(f => f.status === 'closed').length}
                  icon={CheckCircle2}
                  color="#10B981"
                  subtitle="Toplam Başarı"
                  onPress={() => navigation.navigate('history' as never)}
                />
                <StatCard
                  title="İşlemde"
                  value={faults.filter(f => f.status === 'in_progress').length}
                  icon={Clock}
                  color="#F59E0B"
                  subtitle="Devam Eden"
                />
              </View>

              {/* Quick Navigation / Legacy Cards */}
              <Text style={{ color: isDark ? '#FFFFFF' : '#1F2937', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Hızlı Erişim</Text>
              <View className="flex-row flex-wrap justify-between gap-4">
                <View className="w-[47%]">
                  <QuickAction title="Bölgeler" value={regions.length.toString()} color="purple" icon={MapPin} onPress={() => setView('regions')} />
                </View>
                <View className="w-[47%]">
                  <QuickAction title="Projeler" value={projects.length.toString()} color="orange" icon={FolderOpen} onPress={() => setView('projects')} />
                </View>
                <View className="w-[47%] mt-1">
                  <QuickAction title="Şeflikler" value={chiefdoms.length.toString()} color="green" icon={Building2} onPress={() => setView('chiefdoms')} />
                </View>
                <View className="w-[47%] mt-1">
                  <QuickAction
                    title="Aktif Personel"
                    value={users.filter(u => u.role === 'worker' || u.role === 'maintenance').length.toString()}
                    color="blue"
                    icon={Users}
                    onPress={() => setView('users')}
                  />
                </View>
              </View>

              {/* Recent Activity */}
              <Text style={{ color: isDark ? '#FFFFFF' : '#1F2937', fontSize: 20, fontWeight: 'bold', marginBottom: 16, marginTop: 32 }}>Son Aktiviteler</Text>
              <View className="mb-20">
                {allFaults.slice(0, 5).map((fault) => {
                  const timeAgo = (() => {
                    const now = new Date();
                    // Use updatedAt for activity time (shows when fault was last modified/closed)
                    const activityDate = new Date(fault.updatedAt || fault.createdAt);
                    const diffMs = now.getTime() - activityDate.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);

                    if (diffMins < 60) return `${diffMins} dk önce`;
                    if (diffHours < 24) return `${diffHours} saat önce`;
                    return `${diffDays} gün önce`;
                  })();

                  const roleLabels: { [key: string]: string } = {
                    admin: 'Yönetici',
                    engineer: 'Mühendis',
                    ctc_watchman: 'CTC Nöbetçisi',
                    worker: 'Saha Çalışanı'
                  };

                  const userRole = fault.reportedBy?.role || 'worker';
                  const userName = fault.reportedBy?.fullName || 'Bilinmeyen';
                  const displayName = `${roleLabels[userRole] || userRole} ${userName} `;

                  const icon = fault.status === 'closed' ? CheckCircle2 : (fault.status === 'in_progress' ? Clock : AlertTriangle);
                  const iconColor = fault.status === 'closed' ? 'text-green-600' : (fault.status === 'in_progress' ? 'text-yellow-600' : 'text-red-600');
                  const action = fault.status === 'closed' ? `arıza ${fault.title} tamamlandı` : `arıza ${fault.title} oluşturuldu`;

                  // Navigation handler for activity items
                  const handleActivityPress = () => {
                    if (fault.status === 'closed') {
                      // Navigate to history tab for closed faults
                      navigation.navigate('history' as never);
                    } else {
                      // Navigate to open faults list for open/in_progress faults
                      setFaultStatusFilter('open');
                      setView('faults');
                    }
                  };

                  return (
                    <ActivityItem
                      key={fault.id}
                      user={displayName}
                      action={action}
                      time={timeAgo}
                      icon={icon}
                      iconColor={iconColor}
                      onPress={handleActivityPress}
                    />
                  );
                })}
                {allFaults.length === 0 && (
                  <Text className="text-gray-400 text-center py-4">Henüz aktivite yok</Text>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      );
    }

    // Faults View
    if (view === 'faults') {
      // Show Closure Form if closingFaultId is set
      if (closingFaultId) {
        return (
          <View style={{ flex: 1, backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }}>
            <RailGuardHeader user={user} title="Arıza Kapat" />
            <ScrollView style={{ flex: 1, backgroundColor: isDark ? '#0F172A' : '#F9FAFB' }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}>
              <TouchableOpacity onPress={() => setClosingFaultId(null)} style={{ backgroundColor: '#1c4ed8', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginBottom: 16 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>← Listeye Dön</Text>
              </TouchableOpacity>
              <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Arıza Kaydını Kapat</Text>

              <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-4 rounded-xl shadow-sm border gap-3`}>
                <View>
                  <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arıza Tarihi</Text>
                  <TextInput value={closureForm.faultDate} onChangeText={t => setClosureForm({ ...closureForm, faultDate: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} placeholder="DD.MM.YYYY" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                </View>
                <View>
                  <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arıza Saati</Text>
                  <TextInput value={closureForm.faultTime} onChangeText={t => setClosureForm({ ...closureForm, faultTime: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} placeholder="HH:MM" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                </View>
                <View>
                  <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arızayı Bildiren</Text>
                  <TextInput value={closureForm.reporterName} onChangeText={t => setClosureForm({ ...closureForm, reporterName: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} />
                </View>
                <View>
                  <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Hat Bilgisi</Text>
                  <TextInput value={closureForm.lineInfo} onChangeText={t => setClosureForm({ ...closureForm, lineInfo: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} />
                </View>
                <View>
                  <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arıza Bilgisi</Text>
                  <TextInput value={closureForm.faultInfo} onChangeText={t => setClosureForm({ ...closureForm, faultInfo: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} multiline numberOfLines={3} />
                </View>
                <View>
                  <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arıza Çözümü</Text>
                  <TextInput value={closureForm.solution} onChangeText={t => setClosureForm({ ...closureForm, solution: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} multiline numberOfLines={3} placeholder="Yapılan işlemi açıklayınız..." placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                </View>
                <View>
                  <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Çalışan Personel</Text>
                  <TextInput value={closureForm.personnel} onChangeText={t => setClosureForm({ ...closureForm, personnel: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} />
                </View>
                <View>
                  <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Katılan TCDD Personeli</Text>
                  <TextInput value={closureForm.tcddPersonnel} onChangeText={t => setClosureForm({ ...closureForm, tcddPersonnel: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} />
                </View>

                <View>
                  <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-2`}>Fotoğraflar (İsteğe Bağlı, Max 5)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mb-2">
                    {selectedImages.map((img, index) => (
                      <View key={index} className="relative">
                        <Image source={{ uri: img.uri }} className="w-20 h-20 rounded-lg" />
                        <TouchableOpacity onPress={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center z-10 shadow-sm">
                          <Text className="text-white font-bold text-xs">X</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity onPress={pickImages} className={`${isDark ? 'bg-dark-bg border-gray-700' : 'bg-gray-100 border-gray-300'} w-20 h-20 rounded-lg items-center justify-center border border-dashed`}>
                      <Text className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-2xl`}>+</Text>
                    </TouchableOpacity>
                  </ScrollView>
                  <Text className="text-xs text-gray-400">{selectedImages.length} fotoğraf seçildi</Text>
                </View>

                <TouchableOpacity onPress={handleCloseFault} style={{ backgroundColor: '#1c4ed8', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Arızayı Kapat ve Kaydet</Text>
                </TouchableOpacity>
              </View>
              <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={closeAlert} onConfirm={alertConfig.onConfirm} />
              <LoadingOverlay visible={loading} message="Arıza kapatılıyor..." />
            </ScrollView>
          </View>
        );
      }

      const filteredByStatus = faultStatusFilter === 'all'
        ? allFaults
        : allFaults.filter(f => f.status === faultStatusFilter);

      const statusTitle = faultStatusFilter === 'open'
        ? 'Açık Arızalar'
        : faultStatusFilter === 'closed'
          ? 'Kapatılmış Arızalar'
          : 'Tüm Arızalar';

      return (
        <View style={{ flex: 1, backgroundColor: pageBg }}>
          <RailGuardHeader user={user} title={statusTitle} />
          <ScrollView className="flex-1 pt-4" contentContainerStyle={{ paddingHorizontal: 16 }}>
            <TouchableOpacity onPress={() => { setView('overview'); setFaultStatusFilter('all'); }} style={{ backgroundColor: buttonBg, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ color: buttonText, fontWeight: 'bold' }}>← Geri</Text>
            </TouchableOpacity>

            {filteredByStatus.length === 0 ? (
              <Text className={`text-center py - 8 ${isDark ? 'text-gray-400' : 'text-gray-500'} `}>Arıza bulunamadı</Text>
            ) : (
              filteredByStatus.map(f => (
                <View key={f.id} style={{ backgroundColor: cardBg, borderColor: borderColor, borderWidth: 1, padding: 16, borderRadius: 8, marginBottom: 12 }}>
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'} `}>{f.title}</Text>
                      <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{f.description}</Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${f.status === 'closed' ? 'bg-green-100' :
                      f.status === 'in_progress' ? 'bg-yellow-100' :
                        'bg-red-100'
                      } `}>
                      <Text className={`text-xs font-bold ${f.status === 'closed' ? 'text-green-700' :
                        f.status === 'in_progress' ? 'text-yellow-700' :
                          'text-red-700'
                        } `}>
                        {f.status === 'closed' ? 'Kapalı' : f.status === 'in_progress' ? 'İşlemde' : 'Açık'}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-2 pt-2 border-t border-gray-200">
                    <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} `}>
                      Şeflik: {f.chiefdom?.name || 'Bilinmiyor'}
                    </Text>
                    <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} mt-1`}>
                      Bildiren: {f.reportedBy?.fullName || 'Bilinmiyor'}
                    </Text>
                    <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} mt-1`}>
                      Tarih: {new Date(f.createdAt).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>

                  {f.status === 'open' && (
                    <TouchableOpacity
                      onPress={() => openClosureForm(f)}
                      style={{ marginTop: 12, backgroundColor: buttonBg, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
                    >
                      <Text style={{ color: buttonText, fontWeight: 'bold' }}>Kapat</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      );
    }


    // Users View
    if (view === 'users') {
      return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }}>
          <RailGuardHeader user={user} title="Aktif Personel" />
          <ScrollView className="flex-1 pt-4" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity onPress={() => setView('overview')} style={{ backgroundColor: buttonBg, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: buttonText, fontWeight: 'bold', fontSize: 15 }}>← Geri</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setView('create_user')} style={{ backgroundColor: buttonBg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, gap: 8, shadowColor: buttonBg, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}>
                <Plus size={18} color={buttonText} />
                <Text style={{ color: buttonText, fontWeight: 'bold' }}>Personel Ekle</Text>
              </TouchableOpacity>
            </View>

            {users.map(u => (
              <View key={u.id} style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: borderColor }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: isDark ? 'white' : '#1F2937', fontSize: 16, fontWeight: 'bold' }}>{u.fullName}</Text>
                    <Text style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: 13, marginTop: 4 }}>@{u.username}</Text>
                    <Text style={{ color: isDark ? '#60A5FA' : '#2563EB', fontSize: 12, marginTop: 4, fontWeight: '600' }}>
                      {roleLabels[u.role] || u.role}
                    </Text>
                    {u.chiefdom && (
                      <Text style={{ color: isDark ? '#64748B' : '#9CA3AF', fontSize: 12, marginTop: 2 }}>Şeflik: {u.chiefdom.name}</Text>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => startEditing(u)} style={{ backgroundColor: isDark ? '#334155' : '#E2E8F0', padding: 8, borderRadius: 8 }}>
                      <Text style={{ color: isDark ? '#60A5FA' : '#2563EB', fontSize: 12, fontWeight: '600' }}>Düzenle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteUser(u.id.toString())} style={{ backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2', padding: 8, borderRadius: 8 }}>
                      <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>Sil</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            {users.length === 0 && <Text style={{ color: '#6B7280', textAlign: 'center', marginTop: 20 }}>Kullanıcı bulunamadı.</Text>}
            <LoadingOverlay visible={loading} />
          </ScrollView>
        </View>
      );
    }

    if (view === 'create_user') {
      return (
        <View style={{ flex: 1, backgroundColor: pageBg }}>
          <RailGuardHeader user={user} title="Yeni Kullanıcı Oluştur" />
          <ScrollView className="flex-1 pt-4" contentContainerStyle={{ paddingHorizontal: 16 }}>
            <TouchableOpacity onPress={() => setView('users')} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} self-start px-4 py-2 rounded-lg mb-4 shadow-sm`}>
              <Text className="text-black font-bold">← Geri</Text>
            </TouchableOpacity>

            <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-4 rounded-xl shadow-sm border`}>

              <TextInput placeholder="Kullanıcı Adı" value={createUserForm.username} onChangeText={t => setCreateUserForm({ ...createUserForm, username: t })} className={`p-3 rounded border mb-2 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} `} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
              <TextInput placeholder="Ad Soyad" value={createUserForm.fullName} onChangeText={t => setCreateUserForm({ ...createUserForm, fullName: t })} className={`p-3 rounded border mb-2 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} `} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
              <TextInput placeholder="E-posta" value={createUserForm.email} onChangeText={t => setCreateUserForm({ ...createUserForm, email: t })} keyboardType="email-address" autoCapitalize="none" className={`p-3 rounded border mb-2 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} `} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
              <TextInput placeholder="Telefon (+90...)" value={createUserForm.phone} onChangeText={t => setCreateUserForm({ ...createUserForm, phone: t })} keyboardType="phone-pad" className={`p-3 rounded border mb-2 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} `} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
              <TextInput placeholder="Şifre" value={createUserForm.password} onChangeText={t => setCreateUserForm({ ...createUserForm, password: t })} className={`p-3 rounded border mb-2 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} `} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />

              <Text className={`font-bold mt-2 mb-1 ${isDark ? 'text-gray-300' : 'text-gray-800'} `}>Rol</Text>
              <View className="flex-row gap-2 flex-wrap mb-2">
                {availableRoles.map(r => (
                  <TouchableOpacity key={r} onPress={() => setCreateUserForm({ ...createUserForm, role: r, chiefdomId: '' })} className={`px-3 py-1 rounded-full border ${createUserForm.role === r ? (isDark ? 'bg-dark-primary border-dark-primary' : 'bg-light-primary border-light-primary') : (isDark ? 'bg-dark-bg border-gray-700' : 'bg-white border-gray-300')} `}>
                    <Text className={createUserForm.role === r ? 'text-black font-bold' : (isDark ? 'text-gray-300' : 'text-gray-600')}>{roleLabels[r] || r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {createUserForm.role === 'worker' && (
                <>
                  <Text className={`font-bold mt-2 mb-1 ${isDark ? 'text-gray-300' : 'text-gray-800'} `}>Şeflik Ata</Text>
                  <View className="mb-2">
                    {projects.map(p => {
                      const projectChiefdoms = chiefdoms.filter(c => c.projectId === p.id);
                      if (projectChiefdoms.length === 0) return null;
                      return (
                        <View key={p.id} className="mb-3">
                          <Text className={`font-bold mb-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} `}>{p.name}</Text>
                          <View className="flex-row gap-2 flex-wrap">
                            {projectChiefdoms.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                              <TouchableOpacity key={c.id} onPress={() => setCreateUserForm({ ...createUserForm, chiefdomId: c.id.toString() })} className={`px-3 py-1 rounded-full border ${createUserForm.chiefdomId === c.id.toString() ? (isDark ? 'bg-dark-primary border-dark-primary' : 'bg-light-primary border-light-primary') : (isDark ? 'bg-dark-bg border-gray-700' : 'bg-white border-gray-300')} `}>
                                <Text className={createUserForm.chiefdomId === c.id.toString() ? 'text-black font-bold' : (isDark ? 'text-gray-300' : 'text-gray-600')}>{c.name}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      );
                    })}
                    {chiefdoms.filter(c => !c.projectId).length > 0 && (
                      <View className="mb-3">
                        <Text className={`font-bold mb-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} `}>Diğer</Text>
                        <View className="flex-row gap-2 flex-wrap">
                          {chiefdoms.filter(c => !c.projectId).sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                            <TouchableOpacity key={c.id} onPress={() => setCreateUserForm({ ...createUserForm, chiefdomId: c.id.toString() })} className={`px-3 py-1 rounded-full border ${createUserForm.chiefdomId === c.id.toString() ? (isDark ? 'bg-dark-primary border-dark-primary' : 'bg-light-primary border-light-primary') : (isDark ? 'bg-dark-bg border-gray-700' : 'bg-white border-gray-300')} `}>
                              <Text className={createUserForm.chiefdomId === c.id.toString() ? 'text-black font-bold' : (isDark ? 'text-gray-300' : 'text-gray-600')}>{c.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                </>
              )}

              <TouchableOpacity onPress={handleCreateUser} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} p-3 rounded items-center mt-4`}><Text className={`${isDark ? 'text-black' : 'text-white'} font-bold`}>Kullanıcı Oluştur</Text></TouchableOpacity>
            </View>
            <LoadingOverlay visible={loading} />
          </ScrollView>
        </View>
      );
    }

    if (view === 'edit_user') {
      return (
        <View style={{ flex: 1, backgroundColor: pageBg }}>
          <RailGuardHeader user={user} title="Kullanıcı Düzenle" />
          <ScrollView className="flex-1 pt-4" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
            <TouchableOpacity onPress={() => { setView('users'); setEditingUserId(null); }} style={{ backgroundColor: buttonBg, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 16 }}>
              <Text style={{ color: buttonText, fontWeight: 'bold', fontSize: 15 }}>← Geri</Text>
            </TouchableOpacity>

            <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: borderColor }}>
              <Text style={{ color: isDark ? 'white' : '#1F2937', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Kullanıcı Bilgilerini Düzenle</Text>

              <TextInput
                placeholder="Kullanıcı Adı"
                value={editUserForm.username}
                onChangeText={t => setEditUserForm({ ...editUserForm, username: t })}
                style={{ backgroundColor: isDark ? '#0F172A' : '#F9FAFB', borderWidth: 1, borderColor: isDark ? '#374151' : '#E5E7EB', borderRadius: 12, padding: 12, marginBottom: 12, color: isDark ? 'white' : '#1F2937' }}
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              />

              <TextInput
                placeholder="Ad Soyad"
                value={editUserForm.fullName}
                onChangeText={t => setEditUserForm({ ...editUserForm, fullName: t })}
                style={{ backgroundColor: isDark ? '#0F172A' : '#F9FAFB', borderWidth: 1, borderColor: isDark ? '#374151' : '#E5E7EB', borderRadius: 12, padding: 12, marginBottom: 12, color: isDark ? 'white' : '#1F2937' }}
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              />

              <TextInput
                placeholder="E-posta"
                value={editUserForm.email}
                onChangeText={t => setEditUserForm({ ...editUserForm, email: t })}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ backgroundColor: isDark ? '#0F172A' : '#F9FAFB', borderWidth: 1, borderColor: isDark ? '#374151' : '#E5E7EB', borderRadius: 12, padding: 12, marginBottom: 12, color: isDark ? 'white' : '#1F2937' }}
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              />

              <TextInput
                placeholder="Telefon (+90...)"
                value={editUserForm.phone}
                onChangeText={t => setEditUserForm({ ...editUserForm, phone: t })}
                keyboardType="phone-pad"
                style={{ backgroundColor: isDark ? '#0F172A' : '#F9FAFB', borderWidth: 1, borderColor: isDark ? '#374151' : '#E5E7EB', borderRadius: 12, padding: 12, marginBottom: 12, color: isDark ? 'white' : '#1F2937' }}
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              />

              <TextInput
                placeholder="Yeni Şifre (Boş bırakılırsa değişmez)"
                value={editUserForm.password}
                onChangeText={t => setEditUserForm({ ...editUserForm, password: t })}
                secureTextEntry
                style={{ backgroundColor: isDark ? '#0F172A' : '#F9FAFB', borderWidth: 1, borderColor: isDark ? '#374151' : '#E5E7EB', borderRadius: 12, padding: 12, marginBottom: 16, color: isDark ? 'white' : '#1F2937' }}
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              />

              <Text style={{ color: isDark ? '#94A3B8' : '#6B7280', fontWeight: 'bold', marginBottom: 8 }}>Rol</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {availableRoles.map(r => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setEditUserForm({ ...editUserForm, role: r, chiefdomId: '' })}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: 1,
                      backgroundColor: editUserForm.role === r ? buttonBg : 'transparent',
                      borderColor: editUserForm.role === r ? buttonBg : (isDark ? '#4B5563' : '#D1D5DB')
                    }}
                  >
                    <Text style={{ color: editUserForm.role === r ? buttonText : (isDark ? '#D1D5DB' : '#4B5563'), fontWeight: '600' }}>
                      {roleLabels[r] || r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {editUserForm.role === 'worker' && (
                <>
                  <Text style={{ color: isDark ? '#94A3B8' : '#6B7280', fontWeight: 'bold', marginBottom: 8 }}>Şeflik Ata</Text>
                  <View style={{ marginBottom: 16 }}>
                    {projects.map(p => {
                      const projectChiefdoms = chiefdoms.filter(c => c.projectId === p.id);
                      if (projectChiefdoms.length === 0) return null;
                      return (
                        <View key={p.id} style={{ marginBottom: 12 }}>
                          <Text style={{ color: isDark ? '#64748B' : '#9CA3AF', fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>{p.name}</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {projectChiefdoms.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                              <TouchableOpacity
                                key={c.id}
                                onPress={() => setEditUserForm({ ...editUserForm, chiefdomId: c.id.toString() })}
                                style={{
                                  paddingHorizontal: 12,
                                  paddingVertical: 6,
                                  borderRadius: 16,
                                  borderWidth: 1,
                                  backgroundColor: editUserForm.chiefdomId === c.id.toString() ? buttonBg : 'transparent',
                                  borderColor: editUserForm.chiefdomId === c.id.toString() ? buttonBg : (isDark ? '#4B5563' : '#D1D5DB')
                                }}
                              >
                                <Text style={{ color: editUserForm.chiefdomId === c.id.toString() ? buttonText : (isDark ? '#D1D5DB' : '#4B5563'), fontWeight: '600', fontSize: 13 }}>
                                  {c.name}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}

              <TouchableOpacity
                onPress={handleUpdateUser}
                style={{ backgroundColor: buttonBg, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 }}
              >
                <Text style={{ color: buttonText, fontWeight: 'bold', fontSize: 16 }}>Değişiklikleri Kaydet</Text>
              </TouchableOpacity>
            </View>
            <LoadingOverlay visible={loading} />
          </ScrollView>
        </View>
      );
    }

    if (view === 'projects') {
      return (
        <View style={{ flex: 1, backgroundColor: pageBg }}>
          <RailGuardHeader user={user} title="Projeler" />
          <ScrollView className="flex-1 pt-4" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
            {/* Header Actions */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity onPress={() => setView('overview')} style={{ backgroundColor: buttonBg, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: buttonText, fontWeight: 'bold', fontSize: 15 }}>← Geri</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCreateProject(!showCreateProject)} style={{ backgroundColor: showCreateProject ? (isDark ? '#334155' : '#94A3B8') : buttonBg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2 }}>
                {showCreateProject ? <ChevronRight size={18} color="white" style={{ transform: [{ rotate: '90deg' }] }} /> : <Plus size={18} color={buttonText} />}
                <Text style={{ color: buttonText, fontWeight: 'bold' }}>{showCreateProject ? 'Kapat' : 'Proje Ekle'}</Text>
              </TouchableOpacity>
            </View>

            {showCreateProject && (
              <View style={{ marginBottom: 20, padding: 16, borderRadius: 20, backgroundColor: cardBg, borderColor: borderColor, borderWidth: 1 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 12, fontSize: 16, color: isDark ? 'white' : '#1F2937' }}>Yeni Proje Oluştur</Text>
                <Text style={{ color: isDark ? '#94A3B8' : '#64748B', marginBottom: 8, fontSize: 13, fontWeight: '600' }}>Bağlı Olduğu Bölgeyi Seçin:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {regions.map(r => (
                    <TouchableOpacity key={r.id} onPress={() => setSelectedRegionIdForProject(r.id.toString())} style={{ marginRight: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, backgroundColor: selectedRegionIdForProject === r.id.toString() ? (isDark ? '#3b82f6' : '#2563EB') : 'transparent', borderColor: selectedRegionIdForProject === r.id.toString() ? (isDark ? '#3b82f6' : '#2563EB') : (isDark ? '#4b5563' : '#D1D5DB') }}>
                      <Text style={{ color: selectedRegionIdForProject === r.id.toString() ? 'white' : (isDark ? '#D1D5DB' : '#4B5563'), fontWeight: '600', fontSize: 13 }}>{r.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={{ gap: 12 }}>
                  <View>
                    <TextInput placeholder="Proje Adı (Örn: ISKRA)" value={newProjectName} onChangeText={setNewProjectName} className={`p-3 rounded-xl border ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} `} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                  </View>
                  <View>
                    <TextInput placeholder="Açıklama (Opsiyonel)" value={newProjectDesc} onChangeText={setNewProjectDesc} className={`p-3 rounded-xl border ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} `} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                  </View>
                  <TouchableOpacity onPress={handleCreateProject} style={{ backgroundColor: isDark ? '#22D3EE' : '#0ea5e9', padding: 14, borderRadius: 12, alignItems: 'center' }}>
                    <Text style={{ color: isDark ? '#0F172A' : 'white', fontWeight: 'bold' }}>Proje Oluştur</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? 'white' : '#1F2937' }}>Proje Listesi</Text>
              <View style={{ backgroundColor: isDark ? '#334155' : '#E2E8F0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
                <Text style={{ color: isDark ? '#CBD5E1' : '#64748B', fontWeight: 'bold', fontSize: 12 }}>{projects.length} Proje</Text>
              </View>
            </View>

            {projects.map(p => (
              <View key={p.id} style={{ backgroundColor: cardBg, borderColor: borderColor, borderWidth: 1, padding: 16, borderRadius: 20, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: isDark ? '#334155' : '#F1F5F9', marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDark ? 'white' : '#1F2937', flex: 1 }}>{p.name}</Text>
                    {p.region && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: isDark ? '#1e3a8a30' : '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <MapPin size={12} color={isDark ? '#60a5fa' : '#3b82f6'} />
                        <Text style={{ color: isDark ? '#60a5fa' : '#3b82f6', fontSize: 12, fontWeight: 'bold' }}>{p.region.name}</Text>
                      </View>
                    )}
                  </View>
                  {p.description && <Text style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: 14, fontStyle: 'italic' }}>{p.description}</Text>}
                </View>

                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Building2 size={14} color={isDark ? '#94A3B8' : '#6B7280'} />
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: isDark ? '#94A3B8' : '#6B7280' }}>BAĞLI ŞEFLİKLER</Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {p.chiefdoms && p.chiefdoms.length > 0 ? (
                      p.chiefdoms.sort((a: any, b: any) => a.name.localeCompare(b.name)).map((c: any) => (
                        <View key={c.id} style={{ backgroundColor: isDark ? '#334155' : '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                          <Text style={{ color: isDark ? '#CBD5E1' : '#4B5563', fontSize: 12 }}>{c.name}</Text>
                        </View>
                      ))
                    ) : <Text style={{ color: isDark ? '#64748B' : '#9CA3AF', fontStyle: 'italic', fontSize: 13 }}>Şeflik bulunmuyor</Text>}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedProjectForEdit(p);
                      setEditProjectModalVisible(true);
                    }}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, backgroundColor: isDark ? '#334155' : '#F3F4F6', gap: 8 }}
                  >
                    <Edit2 size={16} color={isDark ? '#E2E8F0' : '#4B5563'} />
                    <Text style={{ color: isDark ? '#E2E8F0' : '#4B5563', fontWeight: 'bold', fontSize: 14 }}>Düzenle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteProject(p.id)}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, backgroundColor: isDark ? '#450a0a' : '#FEF2F2', gap: 8, borderWidth: 1, borderColor: isDark ? '#7f1d1d' : '#FEE2E2' }}
                  >
                    <Trash2 size={16} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 14 }}>Sil</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <LoadingOverlay visible={loading} />
            {editProjectModalVisible && (
              <EditProjectModal
                visible={editProjectModalVisible}
                onClose={() => setEditProjectModalVisible(false)}
                project={selectedProjectForEdit}
                regions={regions}
                onUpdate={() => {
                  fetchData();
                  setEditProjectModalVisible(false);
                }}
              />
            )}
          </ScrollView>
        </View>
      );
    }

    if (view === 'regions') {
      return (
        <View style={{ flex: 1, backgroundColor: pageBg }}>
          <RailGuardHeader user={user} title="Bölgeler" />
          <ScrollView className="flex-1 pt-4" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
            {/* Header Actions */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity onPress={() => setView('overview')} style={{ backgroundColor: buttonBg, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: buttonText, fontWeight: 'bold', fontSize: 15 }}>← Geri</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCreateRegion(!showCreateRegion)} style={{ backgroundColor: showCreateRegion ? (isDark ? '#334155' : '#94A3B8') : buttonBg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2 }}>
                {showCreateRegion ? <ChevronRight size={18} color="white" style={{ transform: [{ rotate: '90deg' }] }} /> : <Plus size={18} color={buttonText} />}
                <Text style={{ color: buttonText, fontWeight: 'bold' }}>{showCreateRegion ? 'Kapat' : 'Bölge Ekle'}</Text>
              </TouchableOpacity>
            </View>

            {showCreateRegion && (
              <View style={{ marginBottom: 20, padding: 16, borderRadius: 20, backgroundColor: cardBg, borderColor: borderColor, borderWidth: 1 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 12, fontSize: 16, color: isDark ? 'white' : '#1F2937' }}>Yeni Bölge Oluştur</Text>
                <View style={{ gap: 12 }}>
                  <View>
                    <TextInput placeholder="Bölge Adı (Örn: 1. Bölge)" value={newRegionName} onChangeText={setNewRegionName} className={`p-3 rounded-xl border ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} `} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                  </View>
                  <View>
                    <TextInput placeholder="Açıklama (Opsiyonel)" value={newRegionDesc} onChangeText={setNewRegionDesc} className={`p-3 rounded-xl border ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} `} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                  </View>
                  <TouchableOpacity onPress={handleCreateRegion} style={{ backgroundColor: isDark ? '#22D3EE' : '#0ea5e9', padding: 14, borderRadius: 12, alignItems: 'center' }}>
                    <Text style={{ color: isDark ? '#0F172A' : 'white', fontWeight: 'bold' }}>Bölge Oluştur</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? 'white' : '#1F2937' }}>Bölge Listesi</Text>
              <View style={{ backgroundColor: isDark ? '#334155' : '#E2E8F0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
                <Text style={{ color: isDark ? '#CBD5E1' : '#64748B', fontWeight: 'bold', fontSize: 12 }}>{regions.length} Bölge</Text>
              </View>
            </View>

            {regions.map(r => (
              <View key={r.id} style={{ backgroundColor: cardBg, borderColor: borderColor, borderWidth: 1, padding: 16, borderRadius: 20, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#1e3a8a30' : '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={20} color={isDark ? '#60a5fa' : '#3b82f6'} />
                    </View>
                    <View>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDark ? 'white' : '#1F2937' }}>{r.name}</Text>
                      {r.description && <Text style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: 12 }}>{r.description}</Text>}
                    </View>
                  </View>
                </View>

                <View style={{ padding: 12, backgroundColor: isDark ? '#0f172a50' : '#F9FAFB', borderRadius: 12, marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: isDark ? '#94A3B8' : '#6B7280', marginBottom: 8, textTransform: 'uppercase' }}>Bağlı Projeler</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {r.projects && r.projects.length > 0 ? (
                      r.projects.sort((a: any, b: any) => a.name.localeCompare(b.name)).map((p: any) => (
                        <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: isDark ? '#334155' : 'white', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: isDark ? '#475569' : '#E5E7EB' }}>
                          <Briefcase size={12} color={isDark ? '#CBD5E1' : '#6B7280'} />
                          <Text style={{ color: isDark ? '#E2E8F0' : '#374151', fontSize: 13, fontWeight: '500' }}>{p.name}</Text>
                        </View>
                      ))
                    ) : <Text style={{ color: isDark ? '#64748B' : '#9CA3AF', fontStyle: 'italic', fontSize: 13 }}>Henüz proje eklenmemiş</Text>}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity onPress={() => { setSelectedRegionForEdit(r); setEditRegionModalVisible(true); }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, backgroundColor: isDark ? '#334155' : '#F3F4F6', gap: 8 }}>
                    <Edit2 size={16} color={isDark ? '#E2E8F0' : '#4B5563'} />
                    <Text style={{ color: isDark ? '#E2E8F0' : '#4B5563', fontWeight: 'bold', fontSize: 14 }}>Düzenle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteRegion(r.id)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, backgroundColor: isDark ? '#450a0a' : '#FEF2F2', gap: 8, borderWidth: 1, borderColor: isDark ? '#7f1d1d' : '#FEE2E2' }}>
                    <Trash2 size={16} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 14 }}>Sil</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <LoadingOverlay visible={loading} />
            {editRegionModalVisible && (
              <EditRegionModal
                visible={editRegionModalVisible}
                onClose={() => setEditRegionModalVisible(false)}
                region={selectedRegionForEdit}
                onUpdate={() => {
                  fetchData();
                  setEditRegionModalVisible(false);
                }}
              />
            )}
          </ScrollView>
        </View>
      );
    }



    if (view === 'chiefdoms') {
      // Helper to render chiefdom list
      const renderChiefdomList = (list: any[]) => (
        list.map(c => (
          <View key={c.id} style={{ backgroundColor: cardBg, borderColor: borderColor, borderWidth: 1, padding: 16, borderRadius: 20, marginBottom: 12, marginLeft: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: isDark ? '#1e3a8a30' : '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={22} color={isDark ? '#60a5fa' : '#3b82f6'} />
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDark ? 'white' : '#1F2937' }}>{c.name}</Text>
                  <Text style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: 13, fontWeight: '500' }}>
                    {users.filter(u => u.chiefdom?.id == c.id).length} Personel
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ padding: 12, backgroundColor: isDark ? '#0f172a50' : '#F9FAFB', borderRadius: 12, marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: isDark ? '#94A3B8' : '#6B7280', marginBottom: 8, textTransform: 'uppercase' }}>Atanan Personel</Text>
              {users.filter(u => u.chiefdom?.id == c.id).length > 0 ? (
                <View style={{ gap: 8 }}>
                  {users.filter(u => u.chiefdom?.id == c.id).map(u => (
                    <View key={u.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: isDark ? '#334155' : '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: isDark ? '#E2E8F0' : '#475569' }}>{u.fullName.charAt(0)}</Text>
                      </View>
                      <Text style={{ color: isDark ? '#E2E8F0' : '#374151', fontSize: 14 }}>{u.fullName}</Text>
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: isDark ? '#334155' : '#E5E7EB' }}>
                        <Text style={{ fontSize: 10, color: isDark ? '#94A3B8' : '#6B7280' }}>{roleLabels[u.role]}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={14} color={isDark ? '#94A3B8' : '#9CA3AF'} />
                  <Text style={{ color: isDark ? '#64748B' : '#9CA3AF', fontStyle: 'italic', fontSize: 13 }}>Henüz personel atanmamış</Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => { setSelectedChiefdomForEdit(c); setEditChiefdomModalVisible(true); }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, backgroundColor: isDark ? '#334155' : '#F3F4F6', gap: 8 }}>
                <Edit2 size={16} color={isDark ? '#E2E8F0' : '#4B5563'} />
                <Text style={{ color: isDark ? '#E2E8F0' : '#4B5563', fontWeight: 'bold', fontSize: 14 }}>Düzenle</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteChiefdom(c.id)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, backgroundColor: isDark ? '#450a0a' : '#FEF2F2', gap: 8, borderWidth: 1, borderColor: isDark ? '#7f1d1d' : '#FEE2E2' }}>
                <Trash2 size={16} color="#EF4444" />
                <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 14 }}>Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      );

      return (
        <View style={{ flex: 1, backgroundColor: pageBg }}>
          <RailGuardHeader user={user} title="Şeflikler" />
          <ScrollView className="flex-1 pt-4" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
            {/* Header Actions */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity onPress={() => setView('overview')} style={{ backgroundColor: buttonBg, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: buttonText, fontWeight: 'bold', fontSize: 15 }}>← Geri</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCreateChiefdom(!showCreateChiefdom)} style={{ backgroundColor: showCreateChiefdom ? (isDark ? '#334155' : '#94A3B8') : buttonBg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2 }}>
                {showCreateChiefdom ? <ChevronRight size={18} color="white" style={{ transform: [{ rotate: '90deg' }] }} /> : <Plus size={18} color={buttonText} />}
                <Text style={{ color: buttonText, fontWeight: 'bold' }}>{showCreateChiefdom ? 'Kapat' : 'Şeflik Ekle'}</Text>
              </TouchableOpacity>
            </View>

            {showCreateChiefdom && (
              <View style={{ marginBottom: 20, padding: 16, borderRadius: 20, backgroundColor: cardBg, borderColor: borderColor, borderWidth: 1 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 12, fontSize: 16, color: isDark ? 'white' : '#1F2937' }}>Yeni Şeflik Oluştur</Text>
                <Text style={{ color: isDark ? '#94A3B8' : '#64748B', marginBottom: 8, fontSize: 13, fontWeight: '600' }}>Bağlı Olduğu Projeyi Seçin:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {projects.map(p => (
                    <TouchableOpacity key={p.id} onPress={() => setSelectedProjectId(p.id.toString())} style={{ marginRight: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, backgroundColor: selectedProjectId === p.id.toString() ? (isDark ? '#3b82f6' : '#2563EB') : 'transparent', borderColor: selectedProjectId === p.id.toString() ? (isDark ? '#3b82f6' : '#2563EB') : (isDark ? '#4b5563' : '#D1D5DB') }}>
                      <Text style={{ color: selectedProjectId === p.id.toString() ? 'white' : (isDark ? '#D1D5DB' : '#4B5563'), fontWeight: '600', fontSize: 13 }}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={{ gap: 12 }}>
                  <View>
                    <TextInput placeholder="Yeni Şeflik Adı" value={newChiefdom} onChangeText={setNewChiefdom} className={`p-3 rounded-xl border ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'} `} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                  </View>
                  <TouchableOpacity onPress={handleCreateChiefdom} style={{ backgroundColor: isDark ? '#22D3EE' : '#0ea5e9', padding: 14, borderRadius: 12, alignItems: 'center' }}>
                    <Text style={{ color: isDark ? '#0F172A' : 'white', fontWeight: 'bold' }}>Şeflik Oluştur</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
            }

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontWeight: 'bold', color: isDark ? '#94A3B8' : '#6B7280', marginBottom: 8 }}>Filtrele:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  onPress={() => setSelectedProjectId('')}
                  style={{ marginRight: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, backgroundColor: selectedProjectId === '' ? (isDark ? '#f97316' : '#ea580c') : 'transparent', borderColor: selectedProjectId === '' ? (isDark ? '#f97316' : '#ea580c') : (isDark ? '#4b5563' : '#D1D5DB') }}
                >
                  <Text style={{ color: selectedProjectId === '' ? 'white' : (isDark ? '#D1D5DB' : '#4B5563'), fontWeight: 'bold', fontSize: 13 }}>Tüm Şeflikler</Text>
                </TouchableOpacity>
                {projects.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setSelectedProjectId(p.id.toString())}
                    style={{ marginRight: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, backgroundColor: selectedProjectId === p.id.toString() ? (isDark ? '#f97316' : '#ea580c') : 'transparent', borderColor: selectedProjectId === p.id.toString() ? (isDark ? '#f97316' : '#ea580c') : (isDark ? '#4b5563' : '#D1D5DB') }}
                  >
                    <Text style={{ color: selectedProjectId === p.id.toString() ? 'white' : (isDark ? '#D1D5DB' : '#4B5563'), fontWeight: 'bold', fontSize: 13 }}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* List Rendering Logic */}
            {
              selectedProjectId ? (
                // Single Project View
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? 'white' : '#1F2937' }}>
                      {projects.find(p => p.id.toString() === selectedProjectId)?.name || 'Proje'} Şeflikleri
                    </Text>
                  </View>
                  {renderChiefdomList(chiefdoms.filter(c => c.projectId?.toString() === selectedProjectId))}
                  {chiefdoms.filter(c => c.projectId?.toString() === selectedProjectId).length === 0 && (
                    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                      <Building2 size={64} color={isDark ? '#334155' : '#E2E8F0'} style={{ marginBottom: 16 }} />
                      <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 16 }}>Bu projeye ait şeflik bulunamadı.</Text>
                    </View>
                  )}
                </View>
              ) : (
                // All Projects Grouped View
                <View style={{ gap: 24 }}>
                  {projects.map(p => {
                    const projectChiefdoms = chiefdoms.filter(c => c.projectId === p.id);
                    if (projectChiefdoms.length === 0) return null;
                    return (
                      <View key={p.id}>
                        <View style={{ backgroundColor: isDark ? '#1e293b' : '#E5E7EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 }}>
                          <Text style={{ fontWeight: 'bold', color: isDark ? 'white' : '#1F2937' }}>{p.name}</Text>
                        </View>
                        {renderChiefdomList(projectChiefdoms)}
                      </View>
                    );
                  })}
                  {chiefdoms.filter(c => !c.projectId).length > 0 && (
                    <View>
                      <View style={{ backgroundColor: isDark ? '#1e293b' : '#E5E7EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 }}>
                        <Text style={{ fontWeight: 'bold', color: isDark ? 'white' : '#1F2937' }}>Atanmamış Şeflikler</Text>
                      </View>
                      {renderChiefdomList(chiefdoms.filter(c => !c.projectId))}
                    </View>
                  )}
                </View>
              )
            }
            <LoadingOverlay visible={loading} />
            {
              editChiefdomModalVisible && (
                <EditChiefdomModal
                  visible={editChiefdomModalVisible}
                  onClose={() => setEditChiefdomModalVisible(false)}
                  chiefdom={selectedChiefdomForEdit}
                  regions={regions}
                  projects={projects}
                  onUpdate={() => {
                    fetchData();
                    setEditChiefdomModalVisible(false);
                  }}
                />
              )
            }
          </ScrollView >
        </View >
      );
    }

    if (view === 'faults') {
      if (closingFaultId) {
        return (
          <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 24, backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }}>
            <View className="gap-4 pb-10">
              <TouchableOpacity onPress={() => setClosingFaultId(null)} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} self-start px-4 py-2 rounded-lg mb-4 shadow-sm`}>
                <Text className="text-black font-bold">← Listeye Dön</Text>
              </TouchableOpacity>
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} `}>Arıza Kaydını Kapat</Text>

              <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-4 rounded-xl shadow-sm border gap-3`}>
                <View>
                  <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arıza Tarihi</Text>
                  <TextInput value={closureForm.faultDate} onChangeText={t => setClosureForm({ ...closureForm, faultDate: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} placeholder="DD.MM.YYYY" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                </View>
                <View>
                  <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arıza Saati</Text>
                  <TextInput value={closureForm.faultTime} onChangeText={t => setClosureForm({ ...closureForm, faultTime: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} placeholder="HH:MM" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                </View>
                <View>
                  <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arızayı Bildiren</Text>
                  <TextInput value={closureForm.reporterName} onChangeText={t => setClosureForm({ ...closureForm, reporterName: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} />
                </View>
                <View>
                  <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Hat Bilgisi</Text>
                  <TextInput value={closureForm.lineInfo} onChangeText={t => setClosureForm({ ...closureForm, lineInfo: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} />
                </View>
                <View>
                  <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arıza Bilgisi</Text>
                  <TextInput value={closureForm.faultInfo} onChangeText={t => setClosureForm({ ...closureForm, faultInfo: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} multiline numberOfLines={3} />
                </View>
                <View>
                  <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arıza Çözümü</Text>
                  <TextInput value={closureForm.solution} onChangeText={t => setClosureForm({ ...closureForm, solution: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} multiline numberOfLines={3} placeholder="Yapılan işlemi açıklayınız..." placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                </View>
                <View>
                  <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Çalışan Personel</Text>
                  <TextInput value={closureForm.personnel} onChangeText={t => setClosureForm({ ...closureForm, personnel: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} />
                </View>
                <View>
                  <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Katılan TCDD Personeli</Text>
                  <TextInput value={closureForm.tcddPersonnel} onChangeText={t => setClosureForm({ ...closureForm, tcddPersonnel: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} />
                </View>

                <View>
                  <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-2`}>Fotoğraflar (İsteğe Bağlı, Max 5)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mb-2">
                    {selectedImages.map((img, index) => (
                      <View key={index} className="relative">
                        <Image source={{ uri: img.uri }} className="w-20 h-20 rounded-lg" />
                        <TouchableOpacity onPress={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center z-10 shadow-sm">
                          <Text className="text-white font-bold text-xs">X</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity onPress={pickImages} className={`${isDark ? 'bg-dark-bg border-gray-700' : 'bg-gray-100 border-gray-300'} w-20 h-20 rounded-lg items-center justify-center border border-dashed`}>
                      <Text className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-2xl`}>+</Text>
                    </TouchableOpacity>
                  </ScrollView>
                  <Text className="text-xs text-gray-400">{selectedImages.length} fotoğraf seçildi</Text>
                </View>

                <TouchableOpacity onPress={handleCloseFault} style={{ backgroundColor: '#1c4ed8', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Arızayı Kapat ve Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
            <LoadingOverlay visible={loading} message="Arıza kapatılıyor..." />
          </View >
        );
      }

      return (
        <View className="gap-4">
          <TouchableOpacity onPress={() => setView('overview')} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} self-start px-4 py-2 rounded-lg mb-4 shadow-sm`}>
            <Text className="text-black font-bold">← Geri</Text>
          </TouchableOpacity>
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} `}>Aktif Arızalar</Text>

          {faults.map(f => (
            <TouchableOpacity key={f.id} onPress={() => openClosureForm(f)}>
              <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-4 rounded-lg shadow-sm border mb-2`}>
                <View className="flex-row justify-between items-start">
                  <Text className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'} `}>{f.title}</Text>
                  <View className={`px-2 py-1 rounded-full ${f.status === 'open' ? 'bg-red-100' : 'bg-green-100'} `}>
                    <Text className={`text-xs font-bold ${f.status === 'open' ? 'text-red-800' : 'text-green-800'} `}>{f.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>{f.description}</Text>
                <Text className="text-gray-400 text-xs mt-2">Atanan: {f.chiefdom?.name || 'Atanmamış'}</Text>
                <Text className="text-gray-400 text-xs">Bildiren: {f.reportedBy?.fullName}</Text>
                <Text className="text-gray-400 text-xs">Tarih: {new Date(f.createdAt).toLocaleDateString()}</Text>
                <Text className={`${isDark ? 'text-dark-primary' : 'text-light-primary'} text-xs mt-2 font-bold`}>Kapatmak için dokunun &gt;</Text>
              </View>
            </TouchableOpacity>
          ))}
          {faults.length === 0 && <Text className="text-gray-500 text-center mt-4">Aktif arıza yok.</Text>}
          <LoadingOverlay visible={loading} />
        </View>
      );
    }

    return (
      <View className="gap-4">
        {error && (
          <View className="bg-red-100 p-4 rounded-lg mb-4">
            <Text className="text-red-800 font-bold">Hata: {error}</Text>
            <Text className="text-red-600 text-xs mt-1">Lütfen internet bağlantınızı ve sunucunun çalıştığını kontrol edin.</Text>
          </View>
        )}
        <DashboardCard title="Sistem Genel Bakış" value="Tüm Sistemler Normal" color="bg-green-100 text-green-800" />

        <TouchableOpacity onPress={() => setView('faults')}>
          <DashboardCard title="Aktif Arızalar" value={faults.length.toString()} color="bg-red-100 text-red-800" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setView('regions')}>
          <DashboardCard title="Bölgeler" value={regions.length.toString()} color="bg-purple-100 text-purple-800" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setView('projects')}>
          <DashboardCard title="Projeler" value={projects.length.toString()} color="bg-orange-100 text-orange-800" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setView('chiefdoms')}>
          <DashboardCard title="Şeflikler" value={chiefdoms.length.toString()} color="bg-blue-100 text-blue-800" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setView('users')}>
          <DashboardCard title="Kullanıcılar" value={users.length.toString()} color="bg-purple-100 text-purple-800" />
        </TouchableOpacity>
        <LoadingOverlay visible={loading} />
      </View>
    );
  };

  return (
    <>
      {renderContent()}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={closeAlert}
        onConfirm={alertConfig.onConfirm}
      />
    </>
  );
}



function EngineerDashboard() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <RailGuardHeader user={user} title="Mühendis Paneli" showSearch={true} showGreeting={true} />
      <ScrollView
        className="flex-1 bg-white px-4 py-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1c4ed8" colors={["#1c4ed8"]} />}
      >
        <View className="gap-4">
          <DashboardCard title="Atanan Görevler" value="3" color="bg-orange-100 text-orange-800" />
          <ActionButtons actions={['Görevlerimi Görüntüle', 'Durum Güncelle', 'Geçmiş']} />
        </View>
      </ScrollView>
    </View>

  );
}

function WorkerDashboard() {
  const { user } = useAuth();
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  const [faults, setFaults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImages(prev => [...prev, ...result.assets].slice(0, 5));
    }
  };

  // Closure Form State
  const [closingFaultId, setClosingFaultId] = useState<string | null>(null);
  const [closureForm, setClosureForm] = useState({
    faultDate: '',
    faultTime: '',
    reporterName: '',
    lineInfo: '',
    faultInfo: '',
    solution: '',
    personnel: '',
    tcddPersonnel: ''
  });

  useEffect(() => {
    fetchFaults();
  }, [user]);

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener('tabPress', (e: any) => {
      setClosingFaultId(null);
    });
    return unsubscribe;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      setClosingFaultId(null);
    }, [])
  );

  const fetchFaults = (showLoader = true) => {
    if (user && (user as any).chiefdomId) {
      if (showLoader) setLoading(true);
      return api.get(`/faults?chiefdomId=${(user as any).chiefdomId}`)
        .then(data => {
          // Filter for active faults only
          setFaults(data.filter((f: any) => f.status === 'open'));
          if (showLoader) setLoading(false);
          setError(null);
        })
        .catch(err => {
          console.error(err);
          setError('Arızalar yüklenemedi');
          if (showLoader) setLoading(false);
        });
    } else {
      // Logic for generic workers (if any) or shared logic
      if (showLoader) setLoading(false);
      return Promise.resolve();
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
    await Promise.all([fetchFaults(false), minDelay]);
    setRefreshing(false);
  }, [user]);

  const handleCloseFault = async () => {
    if (!closingFaultId) return;

    // Basic validation - ensure at least some fields are filled
    if (!closureForm.solution || !closureForm.faultDate) {
      alert('Lütfen en az Tarih ve Çözüm alanlarını doldurunuz.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('status', 'closed');
      formData.append('faultDate', closureForm.faultDate);
      formData.append('faultTime', closureForm.faultTime);
      formData.append('reporterName', closureForm.reporterName);
      formData.append('lineInfo', closureForm.lineInfo);
      formData.append('closureFaultInfo', closureForm.faultInfo);
      formData.append('solution', closureForm.solution);
      formData.append('workingPersonnel', closureForm.personnel);
      formData.append('tcddPersonnel', closureForm.tcddPersonnel);

      selectedImages.forEach((image, index) => {
        formData.append('images', {
          uri: image.uri,
          type: 'image/jpeg', // Adjust based on actual type if needed
          name: `image_${index}.jpg`
        } as any);
      });

      await api.put(`/faults/ ${closingFaultId} `, formData, true); // true for multipart
      alert('Arıza başarıyla kapatıldı!');
      setClosingFaultId(null);
      setSelectedImages([]);
      setClosureForm({
        faultDate: '',
        faultTime: '',
        reporterName: '',
        lineInfo: '',
        faultInfo: '',
        solution: '',
        personnel: '',
        tcddPersonnel: ''
      });
      fetchFaults();
    } catch (error) {
      alert('Arıza kapatılamadı');
    } finally {
      setLoading(false);
    }
  };

  const openClosureForm = (fault: any) => {
    setClosingFaultId(fault.id.toString());
    // Pre-fill date/time if needed, or leave blank
    const now = new Date();
    setClosureForm({
      faultDate: now.toLocaleDateString('tr-TR'),
      faultTime: now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      reporterName: fault.reportedBy?.fullName || '',
      lineInfo: '',
      faultInfo: fault.description || '',
      solution: '',
      personnel: '',
      tcddPersonnel: ''
    });
  };

  if (closingFaultId) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24, paddingBottom: 40 }}>
        <View className="gap-4 pb-10">
          <TouchableOpacity onPress={() => setClosingFaultId(null)} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} self-start px-4 py-2 rounded-lg mb-4 shadow-sm`}>
            <Text className="text-black font-bold">← Arızalara Dön</Text>
          </TouchableOpacity>
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} `}>Arıza Kaydını Kapat</Text>

          <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-4 rounded-xl shadow-sm border gap-3`}>
            <View>
              <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arıza Tarihi</Text>
              <TextInput value={closureForm.faultDate} onChangeText={t => setClosureForm({ ...closureForm, faultDate: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} placeholder="DD.MM.YYYY" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
            </View>
            <View>
              <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arıza Saati</Text>
              <TextInput value={closureForm.faultTime} onChangeText={t => setClosureForm({ ...closureForm, faultTime: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} placeholder="HH:MM" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
            </View>
            <View>
              <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arızayı Bildiren</Text>
              <TextInput value={closureForm.reporterName} onChangeText={t => setClosureForm({ ...closureForm, reporterName: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} />
            </View>
            <View>
              <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Hat Bilgisi</Text>
              <TextInput value={closureForm.lineInfo} onChangeText={t => setClosureForm({ ...closureForm, lineInfo: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} />
            </View>
            <View>
              <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arıza Bilgisi</Text>
              <TextInput value={closureForm.faultInfo} onChangeText={t => setClosureForm({ ...closureForm, faultInfo: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} multiline numberOfLines={3} />
            </View>
            <View>
              <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Arıza Çözümü</Text>
              <TextInput value={closureForm.solution} onChangeText={t => setClosureForm({ ...closureForm, solution: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} multiline numberOfLines={3} placeholder="Yapılan işlemi açıklayınız..." placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
            </View>
            <View>
              <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Çalışan Personel</Text>
              <TextInput value={closureForm.personnel} onChangeText={t => setClosureForm({ ...closureForm, personnel: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} />
            </View>
            <View>
              <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-1`}>Katılan TCDD Personeli</Text>
              <TextInput value={closureForm.tcddPersonnel} onChangeText={t => setClosureForm({ ...closureForm, tcddPersonnel: t })} className={`${isDark ? 'bg-dark-bg text-white border-dark-card' : 'bg-gray-50 text-gray-800 border-gray-200'} p-3 rounded border`} />
            </View>

            <View>
              <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold mb-2`}>Fotoğraflar (İsteğe Bağlı, Max 5)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mb-2">
                {selectedImages.map((img, index) => (
                  <View key={index} className="relative">
                    <Image source={{ uri: img.uri }} className="w-20 h-20 rounded-lg" />
                    <TouchableOpacity onPress={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center z-10 shadow-sm">
                      <Text className="text-white font-bold text-xs">X</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity onPress={pickImages} className={`${isDark ? 'bg-dark-bg border-gray-700' : 'bg-gray-100 border-gray-300'} w-20 h-20 rounded-lg items-center justify-center border border-dashed`}>
                  <Text className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-2xl`}>+</Text>
                </TouchableOpacity>
              </ScrollView>
              <Text className="text-xs text-gray-400">{selectedImages.length} fotoğraf seçildi</Text>
            </View>

            <TouchableOpacity onPress={handleCloseFault} style={{ backgroundColor: '#1c4ed8', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Arızayı Kapat ve Kaydet</Text>
            </TouchableOpacity>

          </View>
          <LoadingOverlay visible={loading} message="Arıza kapatılıyor..." />
        </View>
      </ScrollView>
    );
  }


  // Main Worker View
  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#F9FAFB' }}>
      <RailGuardHeader user={user} title="Personel Paneli" showSearch={true} showGreeting={true} />
      <ScrollView
        className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'} px-4 py-6`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : "#1c4ed8"} colors={[isDark ? "#fff" : "#1c4ed8"]} />}
      >
        <View className="gap-4">
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} `}>Atanan Arızalar</Text>
          {faults.map(f => (
            <TouchableOpacity key={f.id} onPress={() => openClosureForm(f)}>
              <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-4 rounded-lg shadow-sm border mb-2`}>
                <Text className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{f.title}</Text>
                <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>{f.description}</Text>
                <Text className={`${isDark ? 'text-dark-primary' : 'text-light-primary'} text-xs mt-2 font-bold`}>Kapatmak için dokunun &gt;</Text>
              </View>
            </TouchableOpacity>
          ))}
          {faults.length === 0 && <LoadingOverlay visible={loading} />}
          {faults.length === 0 && !loading && <Text className="text-gray-500 text-center">Atanan arıza yok.</Text>}
        </View>
      </ScrollView>
    </View>
  );
}

// --- Main Dashboard ---

export default function Dashboard() {
  const { user } = useAuth();
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  const ref = useRef(null);
  useScrollToTop(ref);

  const renderContent = () => {
    switch (user?.role) {
      case 'admin': return <AdminDashboard />;
      case 'ctc_watchman': return <CTCDashboard />;
      case 'engineer': return <AdminDashboard />; // Engineers now use AdminDashboard
      case 'worker': return <WorkerDashboard />;
      default: return <Text>Unknown Role</Text>;
    }
  };



  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#F9FAFB' }}>
      {renderContent()}
    </View>
  );
}
