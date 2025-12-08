import { useScrollToTop } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CustomAlert from '../../components/CustomAlert';
import EditChiefdomModal from '../../components/EditChiefdomModal';
import LoadingOverlay from '../../components/LoadingOverlay';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';

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
          <Text className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{action}</Text>
          <Text className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>→</Text>
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [faultDate, setFaultDate] = useState('');
  const [faultTime, setFaultTime] = useState('');
  const [chiefdomId, setChiefdomId] = useState('');
  const [chiefdoms, setChiefdoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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
    api.get('/chiefdoms').then(setChiefdoms).catch(console.error);
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

  const fetchAllFaults = async () => {
    try {
      setLoading(true);
      const data = await api.get('/faults');
      // Sort by newest first
      const sortedData = data.filter((f: any) => f.status === 'open').sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllFaults(sortedData);
      //   setView('all_faults'); // Already default
    } catch (error) {
      showAlert('Hata', 'Arızalar alınamadı', 'error');
    } finally {
      setLoading(false);
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

      await api.put(`/faults/${closingFaultId}`, formData, true); // true for multipart
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

  const fetchHistory = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

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
      <View className="gap-4">
        <TouchableOpacity onPress={() => setView('all_faults')} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} self-start px-4 py-2 rounded-lg mb-4 shadow-sm`}>
          <Text className="text-black font-bold">← Listeye Dön</Text>
        </TouchableOpacity>
        <Text className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Arıza Geçmişi</Text>
        {history.map((fault) => (
          <View key={fault.id} className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-4 rounded-lg shadow-sm border mb-2`}>
            <View className="flex-row justify-between items-start">
              <Text className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{fault.title}</Text>
              <View className={`px-2 py-1 rounded-full ${fault.status === 'open' ? 'bg-red-100' : 'bg-green-100'}`}>
                <Text className={`text-xs font-bold ${fault.status === 'open' ? 'text-red-800' : 'text-green-800'}`}>{fault.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{fault.description}</Text>
            <Text className="text-gray-400 text-xs mt-2">Atanan: {fault.chiefdom?.name || 'Atanmamış'}</Text>
            <Text className="text-gray-400 text-xs">Tarih: {new Date(fault.createdAt).toLocaleDateString()}</Text>
          </View>
        ))}
        {history.length === 0 && <Text className="text-gray-500 text-center mt-4">Henüz arıza bildirilmedi.</Text>}
        <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={closeAlert} onConfirm={alertConfig.onConfirm} />
        <LoadingOverlay visible={loading} message="İşlem yapılıyor..." />
      </View>
    );
  }

  if (view === 'all_faults') {
    if (closingFaultId) {
      return (
        <View className="flex-1">
          <View className="gap-4 pb-10">
            <TouchableOpacity onPress={() => setClosingFaultId(null)} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} self-start px-4 py-2 rounded-lg mb-4 shadow-sm`}>
              <Text className="text-black font-bold">← Listeye Dön</Text>
            </TouchableOpacity>
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Arıza Kaydını Kapat</Text>

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

              <TouchableOpacity onPress={handleCloseFault} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} p-4 rounded-xl items-center mt-4`}>
                <Text className={`${isDark ? 'text-black' : 'text-black'} font-bold text-lg`}>Arızayı Kapat ve Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
          <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={closeAlert} onConfirm={alertConfig.onConfirm} />
          <LoadingOverlay visible={loading} message="Arıza kapatılıyor..." />
        </View>
      );
    }

    return (
      <View className="gap-4">
        {/* Helper Action Buttons for Watchman */}
        <View className="flex-row gap-3 mb-2">
          <TouchableOpacity onPress={() => setView('report_fault')} className="flex-1 bg-yellow-400 p-3 rounded-lg items-center shadow-sm">
            <Text className="text-black font-bold">+ Arıza Bildir</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={fetchHistory} className="flex-1 bg-yellow-400 p-3 rounded-lg items-center shadow-sm">
            <Text className="text-black font-bold">Geçmiş Arızalarım</Text>
          </TouchableOpacity>
        </View>

        <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Tüm Aktif Arızalar</Text>

        {allFaults.map(f => (
          <TouchableOpacity key={f.id} onPress={() => openClosureForm(f)}>
            <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-4 rounded-lg shadow-sm border mb-2`}>
              <View className="flex-row justify-between items-start">
                <Text className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{f.title}</Text>
                <View className={`px-2 py-1 rounded-full ${f.status === 'open' ? 'bg-red-100' : 'bg-green-100'}`}>
                  <Text className={`text-xs font-bold ${f.status === 'open' ? 'text-red-800' : 'text-green-800'}`}>{f.status.toUpperCase()}</Text>
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
    );
  }

  if (view === 'report_fault') {
    return (
      <View className="gap-6">
        <TouchableOpacity onPress={() => setView('all_faults')} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} self-start px-4 py-2 rounded-lg mb-4 shadow-sm`}>
          <Text className="text-black font-bold">← Listeye Dön</Text>
        </TouchableOpacity>

        <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border`}>
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Arıza Bildir</Text>

          <Text className={`font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Arıza Başlığı</Text>
          <TextInput
            className={`border rounded-lg p-3 mb-4 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
            placeholder="Örn. A İstasyonu Sinyal Arızası"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={title}
            onChangeText={setTitle}
          />

          <Text className={`font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Açıklama</Text>
          <TextInput
            className={`border rounded-lg p-3 mb-4 h-24 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
            placeholder="Sorunu detaylıca açıklayınız..."
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />

          <View className="flex-row gap-2 mb-4">
            <View className="flex-1">
              <Text className={`font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Tarih</Text>
              <TextInput
                className={`border rounded-lg p-3 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                value={faultDate}
                onChangeText={setFaultDate}
                placeholder="GG.AA.YYYY"
              />
            </View>
            <View className="flex-1">
              <Text className={`font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Saat</Text>
              <TextInput
                className={`border rounded-lg p-3 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                value={faultTime}
                onChangeText={setFaultTime}
                placeholder="SS:DD"
              />
            </View>
          </View>

          <Text className={`font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Bildirilen Personel</Text>
          <TextInput
            className={`border rounded-lg p-3 mb-4 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
            placeholder="Personel Adı Soyadı"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={reporterName}
            onChangeText={setReporterName}
          />

          <Text className={`font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Şefliğe Ata</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {chiefdoms.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setChiefdomId(c.id.toString())}
                className={`px-4 py-2 rounded-full border ${chiefdomId === c.id.toString() ? 'bg-red-600 border-red-600' : isDark ? 'bg-dark-bg border-gray-700' : 'bg-white border-gray-300'}`}
              >
                <Text className={`${chiefdomId === c.id.toString() ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-600'}`}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} p-4 rounded-xl items-center ${loading ? 'opacity-50' : ''}`}
          >
            <Text className={`${isDark ? 'text-black' : 'text-white'} font-bold text-lg`}>Raporu Gönder</Text>
          </TouchableOpacity>
        </View>
        <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={closeAlert} onConfirm={alertConfig.onConfirm} />
        <LoadingOverlay visible={loading} message="Arıza bildiriliyor..." />
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
  const [faults, setFaults] = useState<any[]>([]);
  const [chiefdoms, setChiefdoms] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [view, setView] = useState<'overview' | 'users' | 'chiefdoms' | 'faults' | 'create_user' | 'projects' | 'regions'>('overview');
  const [error, setError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loading, setLoading] = useState(false);

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

      await api.put(`/faults/${closingFaultId}`, formData, true); // true for multipart
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

    setLoading(true);
    try {
      await api.post('/users', { ...createUserForm });
      showAlert('Başarılı', 'Kullanıcı başarıyla oluşturuldu!', 'success');
      setCreateUserForm({ username: '', password: '', fullName: '', role: 'worker', chiefdomId: '', email: '', phone: '+90' });
      fetchData();
    } catch (error) {
      showAlert('Hata', 'Kullanıcı oluşturulamadı', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName) return;
    setLoading(true);
    try {
      await api.post('/projects', {
        name: newProjectName,
        description: newProjectDesc,
        regionId: selectedRegionIdForProject || undefined
      });
      showAlert('Başarılı', 'Proje oluşturuldu', 'success');
      setNewProjectName('');
      setNewProjectDesc('');
      fetchData();
    } catch (error) {
      showAlert('Hata', 'Proje oluşturulamadı', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRegion = async () => {
    if (!newRegionName) return;
    setLoading(true);
    try {
      await api.post('/regions', { name: newRegionName, description: newRegionDesc });
      showAlert('Başarılı', 'Bölge oluşturuldu', 'success');
      setNewRegionName('');
      setNewRegionDesc('');
      fetchData();
    } catch (error) {
      showAlert('Hata', 'Bölge oluşturulamadı', 'error');
    } finally {
      setLoading(false);
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

    setLoading(true);
    try {
      // Only send password if it's not empty (meaning user wants to change it)
      const updateData: any = { ...editUserForm };
      if (!updateData.password) delete updateData.password;

      await api.put(`/users/${editUserForm.id}`, updateData);
      showAlert('Başarılı', 'Kullanıcı başarıyla güncellendi', 'success');
      setEditingUserId(null);
      fetchData();
    } catch (error) {
      showAlert('Hata', 'Kullanıcı güncellenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (id: string) => {
    showAlert('Kullanıcıyı Sil', 'Bu kullanıcıyı silmek istediğinize emin misiniz?', 'confirm', async () => {
      setLoading(true);
      try {
        await api.delete(`/users/${id}`);
        showAlert('Başarılı', 'Kullanıcı silindi', 'success');
        fetchData();
      } catch (error) {
        showAlert('Hata', 'Kullanıcı silinemedi', 'error');
      } finally {
        setLoading(false);
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
  };

  const cancelEditing = () => {
    setEditingUserId(null);
  };

  const handleCreateChiefdom = async () => {
    setLoading(true);
    try {
      await api.post('/chiefdoms', {
        name: newChiefdom,
        projectId: selectedProjectId || undefined
      });
      showAlert('Başarılı', 'Şeflik oluşturuldu', 'success');
      setNewChiefdom('');
      setSelectedProjectId('');
      fetchData();
    } catch (error) {
      showAlert('Hata', 'Şeflik oluşturulamadı', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChiefdom = (id: string) => {
    showAlert('Şefliği Sil', 'Bu şefliği silmek istediğinize emin misiniz?', 'confirm', async () => {
      setLoading(true);
      try {
        await api.delete(`/chiefdoms/${id}`);
        showAlert('Başarılı', 'Şeflik silindi', 'success');
        fetchData();
      } catch (error) {
        showAlert('Hata', 'Şeflik silinemedi', 'error');
      } finally {
        setLoading(false);
      }
    });
  };

  // Removed simple handleUpdateChiefdom as we now use the modal for everything


  // Filter roles based on current user's role
  const availableRoles = ['admin', 'engineer', 'ctc', 'ctc_watchman', 'worker'].filter(role => {
    if (user?.role !== 'admin' && role === 'admin') return false;
    return true;
  });

  const renderContent = () => {
    if (view === 'users') {
      return (
        <View className="gap-4">
          <TouchableOpacity onPress={() => setView('overview')} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} self-start px-4 py-2 rounded-lg mb-4 shadow-sm`}>
            <Text className="text-black font-bold">← Geri</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setView('create_user')} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} p-4 rounded-xl items-center mb-4 shadow-sm`}>
            <Text className={`${isDark ? 'text-black' : 'text-white'} font-bold text-lg`}>+ Yeni Kullanıcı Oluştur</Text>
          </TouchableOpacity>

          <Text className={`text-xl font-bold mt-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Mevcut Kullanıcılar</Text>
          {users.map(u => (
            <View key={u.id} className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-4 rounded-lg shadow-sm border mb-2`}>
              {editingUserId === u.id.toString() ? (
                <View>
                  <Text className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-tcdd-navy'}`}>Düzenleniyor: {u.username}</Text>
                  <TextInput placeholder="Kullanıcı Adı" value={editUserForm.username} onChangeText={t => setEditUserForm({ ...editUserForm, username: t })} className={`p-2 rounded border mb-2 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                  <TextInput placeholder="Ad Soyad" value={editUserForm.fullName} onChangeText={t => setEditUserForm({ ...editUserForm, fullName: t })} className={`p-2 rounded border mb-2 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                  <TextInput placeholder="E-posta" value={editUserForm.email} onChangeText={t => setEditUserForm({ ...editUserForm, email: t })} className={`p-2 rounded border mb-2 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                  <TextInput placeholder="Telefon" value={editUserForm.phone} onChangeText={t => setEditUserForm({ ...editUserForm, phone: t })} className={`p-2 rounded border mb-2 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                  <TextInput placeholder="Yeni Şifre (değiştirmek istemiyorsanız boş bırakın)" value={editUserForm.password} onChangeText={t => setEditUserForm({ ...editUserForm, password: t })} className={`p-2 rounded border mb-2 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />

                  <Text className="font-bold mt-1 mb-1">Rol</Text>
                  <View className="flex-row gap-2 flex-wrap mb-2">
                    {availableRoles.map(r => (
                      <TouchableOpacity key={r} onPress={() => setEditUserForm({ ...editUserForm, role: r, chiefdomId: '' })} className={`px-2 py-1 rounded-full border ${editUserForm.role === r ? (isDark ? 'bg-dark-primary border-dark-primary' : 'bg-light-primary border-light-primary') : (isDark ? 'bg-dark-bg border-gray-700' : 'bg-white border-gray-300')}`}>
                        <Text className={`text-xs ${editUserForm.role === r ? 'text-black font-bold' : (isDark ? 'text-gray-300' : 'text-gray-600')}`}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {editUserForm.role === 'worker' && (
                    <>
                      <Text className="font-bold mt-1 mb-1">Şeflik Ata</Text>
                      <View className="flex-row gap-2 flex-wrap mb-2">
                        {chiefdoms.map(c => (
                          <TouchableOpacity key={c.id} onPress={() => setEditUserForm({ ...editUserForm, chiefdomId: c.id.toString() })} className={`px-2 py-1 rounded-full border ${editUserForm.chiefdomId === c.id.toString() ? (isDark ? 'bg-dark-primary border-dark-primary' : 'bg-light-primary border-light-primary') : (isDark ? 'bg-dark-bg border-gray-700' : 'bg-white border-gray-300')}`}>
                            <Text className={`text-xs ${editUserForm.chiefdomId === c.id.toString() ? 'text-black font-bold' : (isDark ? 'text-gray-300' : 'text-gray-600')}`}>{c.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}

                  <View className="flex-row gap-2 mt-2">
                    <TouchableOpacity onPress={handleUpdateUser} className="flex-1 bg-green-600 p-2 rounded items-center"><Text className="text-white font-bold">Kaydet</Text></TouchableOpacity>
                    <TouchableOpacity onPress={cancelEditing} className="flex-1 bg-gray-200 p-2 rounded items-center"><Text className="text-gray-600 font-bold">İptal</Text></TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <View className="mb-3">
                    <Text className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{u.fullName} ({u.username})</Text>
                    <Text className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs`}>{u.role} {u.chiefdom ? `- ${u.chiefdom.name}` : ''}</Text>
                    <Text className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs`}>{u.email} | {u.phone}</Text>
                  </View>
                  <View className="flex-row gap-3">
                    <TouchableOpacity onPress={() => startEditing(u)} className="flex-1 bg-blue-100 py-2 rounded-lg items-center justify-center">
                      <Text className="text-tcdd-navy font-bold">Düzenle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteUser(u.id)} className="flex-1 bg-red-100 py-2 rounded-lg items-center justify-center">
                      <Text className="text-red-600 font-bold">Sil</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
          {users.length === 0 && <Text className="text-gray-500 text-center mt-4">Kullanıcı bulunamadı.</Text>}
          <LoadingOverlay visible={loading} />
        </View>
      );
    }

    if (view === 'create_user') {
      return (
        <View className="gap-4">
          <TouchableOpacity onPress={() => setView('users')} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} self-start px-4 py-2 rounded-lg mb-4 shadow-sm`}>
            <Text className="text-black font-bold">← Geri</Text>
          </TouchableOpacity>

          <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-4 rounded-xl shadow-sm border`}>
            <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Yeni Kullanıcı Oluştur</Text>

            <TextInput placeholder="Kullanıcı Adı" value={createUserForm.username} onChangeText={t => setCreateUserForm({ ...createUserForm, username: t })} className={`p-3 rounded border mb-2 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
            <TextInput placeholder="Ad Soyad" value={createUserForm.fullName} onChangeText={t => setCreateUserForm({ ...createUserForm, fullName: t })} className={`p-3 rounded border mb-2 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
            <TextInput placeholder="E-posta" value={createUserForm.email} onChangeText={t => setCreateUserForm({ ...createUserForm, email: t })} keyboardType="email-address" autoCapitalize="none" className={`p-3 rounded border mb-2 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
            <TextInput placeholder="Telefon (+90...)" value={createUserForm.phone} onChangeText={t => setCreateUserForm({ ...createUserForm, phone: t })} keyboardType="phone-pad" className={`p-3 rounded border mb-2 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
            <TextInput placeholder="Şifre" value={createUserForm.password} onChangeText={t => setCreateUserForm({ ...createUserForm, password: t })} className={`p-3 rounded border mb-2 ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />

            <Text className={`font-bold mt-2 mb-1 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>Rol</Text>
            <View className="flex-row gap-2 flex-wrap mb-2">
              {availableRoles.map(r => (
                <TouchableOpacity key={r} onPress={() => setCreateUserForm({ ...createUserForm, role: r, chiefdomId: '' })} className={`px-3 py-1 rounded-full border ${createUserForm.role === r ? (isDark ? 'bg-dark-primary border-dark-primary' : 'bg-light-primary border-light-primary') : (isDark ? 'bg-dark-bg border-gray-700' : 'bg-white border-gray-300')}`}>
                  <Text className={createUserForm.role === r ? 'text-black font-bold' : (isDark ? 'text-gray-300' : 'text-gray-600')}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {createUserForm.role === 'worker' && (
              <>
                <Text className={`font-bold mt-2 mb-1 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>Şeflik Ata</Text>
                <View className="flex-row gap-2 flex-wrap mb-2">
                  {chiefdoms.map(c => (
                    <TouchableOpacity key={c.id} onPress={() => setCreateUserForm({ ...createUserForm, chiefdomId: c.id.toString() })} className={`px-3 py-1 rounded-full border ${createUserForm.chiefdomId === c.id.toString() ? (isDark ? 'bg-dark-primary border-dark-primary' : 'bg-light-primary border-light-primary') : (isDark ? 'bg-dark-bg border-gray-700' : 'bg-white border-gray-300')}`}>
                      <Text className={createUserForm.chiefdomId === c.id.toString() ? 'text-black font-bold' : (isDark ? 'text-gray-300' : 'text-gray-600')}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity onPress={handleCreateUser} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} p-3 rounded items-center mt-4`}><Text className={`${isDark ? 'text-black' : 'text-white'} font-bold`}>Kullanıcı Oluştur</Text></TouchableOpacity>
          </View>
          <LoadingOverlay visible={loading} />
        </View>
      );
    }

    if (view === 'projects') {
      return (
        <View className="gap-4">
          <TouchableOpacity onPress={() => setView('overview')} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} self-start px-4 py-2 rounded-lg mb-4 shadow-sm`}>
            <Text className="text-black font-bold">← Geri</Text>
          </TouchableOpacity>
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Projeleri Yönet</Text>

          <View className="mb-4 gap-2">
            <Text className={isDark ? 'text-gray-300' : 'text-gray-600'}>Bağlı Olduğu Bölgeyi Seçin:</Text>
            <ScrollView horizontal>
              {regions.map(r => (
                <TouchableOpacity key={r.id} onPress={() => setSelectedRegionIdForProject(r.id.toString())} className={`mr-2 px-3 py-1 rounded border ${selectedRegionIdForProject === r.id.toString() ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                  <Text className={selectedRegionIdForProject === r.id.toString() ? 'text-white' : (isDark ? 'text-gray-300' : 'text-gray-800')}>{r.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View className="flex-row gap-2 mt-2">
              <View className="flex-1 gap-2">
                <TextInput placeholder="Proje Adı (Örn: ISKRA)" value={newProjectName} onChangeText={setNewProjectName} className={`p-3 rounded border ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
                <TextInput placeholder="Açıklama (Opsiyonel)" value={newProjectDesc} onChangeText={setNewProjectDesc} className={`p-3 rounded border ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
              </View>
              <TouchableOpacity onPress={handleCreateProject} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} p-2 rounded justify-center items-center w-20`}>
                <Text className="text-black font-bold">Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>

          {projects.map(p => (
            <View key={p.id} className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-4 rounded border mb-2`}>
              <Text className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{p.name}</Text>
              {p.region && <Text className="text-blue-500 text-xs">{p.region.name}</Text>}
              {p.description && <Text className="text-gray-500 text-xs italic">{p.description}</Text>}
              <Text className="text-gray-500 text-xs mt-1">{p.chiefdoms?.length || 0} Şeflik</Text>
            </View>
          ))}
          <LoadingOverlay visible={loading} />
        </View>
      );
    }

    if (view === 'regions') {
      return (
        <View className="gap-4">
          <TouchableOpacity onPress={() => setView('overview')} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} self-start px-4 py-2 rounded-lg mb-4 shadow-sm`}>
            <Text className="text-black font-bold">← Geri</Text>
          </TouchableOpacity>
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Bölgeleri Yönet</Text>

          <View className="flex-row gap-2 mb-4">
            <View className="flex-1 gap-2">
              <TextInput placeholder="Bölge Adı (Örn: 1. Bölge)" value={newRegionName} onChangeText={setNewRegionName} className={`p-3 rounded border ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
              <TextInput placeholder="Açıklama (Opsiyonel)" value={newRegionDesc} onChangeText={setNewRegionDesc} className={`p-3 rounded border ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
            </View>
            <TouchableOpacity onPress={handleCreateRegion} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} p-3 rounded justify-center`}><Text className="text-black font-bold">Ekle</Text></TouchableOpacity>
          </View>

          {regions.map(r => (
            <View key={r.id} className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-4 rounded border mb-2`}>
              <Text className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{r.name}</Text>
              {r.description && <Text className="text-gray-500 text-xs italic">{r.description}</Text>}
              <Text className="text-gray-500 text-xs mt-1">{r.projects?.length || 0} Proje</Text>
            </View>
          ))}
          <LoadingOverlay visible={loading} />
        </View>
      );
    }



    if (view === 'chiefdoms') {
      return (
        <View className="gap-4">
          <TouchableOpacity onPress={() => setView('overview')} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} self-start px-4 py-2 rounded-lg mb-4 shadow-sm`}>
            <Text className="text-black font-bold">← Geri</Text>
          </TouchableOpacity>
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Şeflikleri Yönet</Text>

          <View className="flex-col gap-2 mb-4">
            <View className="flex-row gap-2">
              {projects.map(p => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setSelectedProjectId(p.id.toString())}
                  className={`px-4 py-2 rounded-full border ${selectedProjectId === p.id.toString() ? 'bg-orange-500 border-orange-500' : isDark ? 'bg-dark-bg border-gray-700' : 'bg-gray-100 border-gray-300'}`}
                >
                  <Text className={`${selectedProjectId === p.id.toString() ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-600'}`}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row gap-2">
              <TextInput placeholder="Yeni Şeflik Adı" value={newChiefdom} onChangeText={setNewChiefdom} className={`flex-1 p-3 rounded border ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
              <TouchableOpacity onPress={handleCreateChiefdom} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} p-3 rounded justify-center`}><Text className="text-black font-bold">Ekle</Text></TouchableOpacity>
            </View>
          </View>

          {chiefdoms.map(c => (
            <View key={c.id} className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-4 rounded border mb-2`}>
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-1">
                  <Text className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{c.name}</Text>
                  {c.project && <Text className="text-xs font-bold text-orange-500 mb-2">{c.project.name}</Text>}
                  {!c.project && <Text className="text-xs font-bold text-gray-400 mb-2">Projesiz</Text>}

                  <View className="pl-2 border-l-2 border-gray-200 mb-4">
                    <Text className="text-xs text-gray-500 font-bold mb-1">Atanan Çalışanlar:</Text>
                    {users.filter(u => u.chiefdom?.id == c.id).length > 0 ? (
                      <View className="gap-1">
                        {users.filter(u => u.chiefdom?.id == c.id).map(u => (
                          <Text key={u.id} className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm`}>• {u.fullName} <Text className="text-gray-400 text-xs">({u.role})</Text></Text>
                        ))}
                      </View>
                    ) : (
                      <Text className="text-gray-400 text-xs italic">Çalışan atanmadı</Text>
                    )}
                  </View>

                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedChiefdomForEdit(c);
                        setEditChiefdomModalVisible(true);
                      }}
                      className="flex-1 bg-blue-100 py-2 rounded-lg items-center justify-center"
                    >
                      <Text className="text-tcdd-navy font-bold">Düzenle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteChiefdom(c.id)} className="flex-1 bg-red-100 py-2 rounded-lg items-center justify-center">
                      <Text className="text-red-600 font-bold">Sil</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
          <LoadingOverlay visible={loading} />
          {editChiefdomModalVisible && (
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
          )}
        </View>
      );
    }

    if (view === 'faults') {
      if (closingFaultId) {
        return (
          <View className="flex-1">
            <View className="gap-4 pb-10">
              <TouchableOpacity onPress={() => setClosingFaultId(null)} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} self-start px-4 py-2 rounded-lg mb-4 shadow-sm`}>
                <Text className="text-black font-bold">← Listeye Dön</Text>
              </TouchableOpacity>
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Arıza Kaydını Kapat</Text>

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

                <TouchableOpacity onPress={handleCloseFault} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} p-4 rounded-xl items-center mt-4`}>
                  <Text className={`${isDark ? 'text-black' : 'text-black'} font-bold text-lg`}>Arızayı Kapat ve Kaydet</Text>
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
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Aktif Arızalar</Text>

          {faults.map(f => (
            <TouchableOpacity key={f.id} onPress={() => openClosureForm(f)}>
              <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-4 rounded-lg shadow-sm border mb-2`}>
                <View className="flex-row justify-between items-start">
                  <Text className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{f.title}</Text>
                  <View className={`px-2 py-1 rounded-full ${f.status === 'open' ? 'bg-red-100' : 'bg-green-100'}`}>
                    <Text className={`text-xs font-bold ${f.status === 'open' ? 'text-red-800' : 'text-green-800'}`}>{f.status.toUpperCase()}</Text>
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
      <View className="gap-4">
        {renderContent()}
      </View>
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
  return (
    <View className="gap-4">
      <DashboardCard title="Atanan Görevler" value="3" color="bg-orange-100 text-orange-800" />
      <ActionButtons actions={['Görevlerimi Görüntüle', 'Durum Güncelle', 'Geçmiş']} />
    </View>
  );
}

function WorkerDashboard() {
  const { user } = useAuth();
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  const [faults, setFaults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchFaults = () => {
    if (user && (user as any).chiefdomId) {
      setLoading(true);
      api.get(`/faults?chiefdomId=${(user as any).chiefdomId}`)
        .then(data => {
          // Filter for active faults only
          setFaults(data.filter((f: any) => f.status === 'open'));
          setLoading(false);
          setError(null);
        })
        .catch(err => {
          console.error(err);
          setError('Arızalar yüklenemedi');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  };

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

      await api.put(`/faults/${closingFaultId}`, formData, true); // true for multipart
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
      <View className="flex-1">
        <View className="gap-4 pb-10">
          <TouchableOpacity onPress={() => setClosingFaultId(null)} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} self-start px-4 py-2 rounded-lg mb-4 shadow-sm`}>
            <Text className="text-black font-bold">← Arızalara Dön</Text>
          </TouchableOpacity>
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Arıza Kaydını Kapat</Text>

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

            <TouchableOpacity onPress={handleCloseFault} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} p-4 rounded-xl items-center mt-4`}>
              <Text className={`${isDark ? 'text-black' : 'text-black'} font-bold text-lg`}>Arızayı Kapat ve Kaydet</Text>
            </TouchableOpacity>

          </View>
          <LoadingOverlay visible={loading} message="Arıza kapatılıyor..." />
        </View>
      </View >
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
      <DashboardCard title="Şeflik Arızaları" value={faults.length.toString()} color={`${isDark ? 'bg-dark-card text-dark-primary' : 'bg-light-card text-light-primary'}`} />

      <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Şefliğimdeki Arızalar</Text>

      {loading ? (
        <Text className="text-gray-500">Arızalar yükleniyor...</Text>
      ) : (
        <>
          {faults.map((fault) => (
            <TouchableOpacity key={fault.id} onPress={() => openClosureForm(fault)} disabled={fault.status === 'closed'}>
              <View className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-light-card border-gray-200'} p-4 rounded-lg shadow-sm border mb-2 ${fault.status === 'closed' ? 'opacity-60' : ''}`}>
                <View className="flex-row justify-between items-start">
                  <Text className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{fault.title}</Text>
                  <View className={`px-2 py-1 rounded-full ${fault.status === 'open' ? 'bg-red-100' : 'bg-green-100'}`}>
                    <Text className={`text-xs font-bold ${fault.status === 'open' ? 'text-red-800' : 'text-green-800'}`}>{fault.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{fault.description}</Text>
                <Text className="text-gray-400 text-xs mt-2">Bildiren: {fault.reportedBy?.fullName || 'Bilinmiyor'}</Text>
                <Text className="text-gray-400 text-xs">Tarih: {new Date(fault.createdAt).toLocaleDateString()}</Text>
                {fault.status !== 'closed' && <Text className={`${isDark ? 'text-dark-primary' : 'text-light-primary'} text-xs mt-2 font-bold`}>Kapatmak için dokunun &gt;</Text>}
              </View>
            </TouchableOpacity>
          ))}
          {faults.length === 0 && <Text className="text-gray-500 text-center mt-4">Şefliğinize atanmış arıza yok.</Text>}
        </>
      )}
      <LoadingOverlay visible={loading} />
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView ref={ref} className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`} showsHorizontalScrollIndicator={false} contentContainerStyle={{ width: '100%' }}>
        <View className="px-4 py-6">
          {renderContent()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
