import { useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

function CTCDashboard() {
  const { user } = useAuth();
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [chiefdomId, setChiefdomId] = useState('');
  const [chiefdoms, setChiefdoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Unified View State
  const [view, setView] = useState<'overview' | 'history' | 'all_faults' | 'report_fault'>('overview');
  const [allFaults, setAllFaults] = useState<any[]>([]);

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
  }, []);

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener('tabPress', (e: any) => {
      setView('overview');
      setClosingFaultId(null);
    });
    return unsubscribe;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      setView('overview');
      setClosingFaultId(null);
    }, [])
  );

  const fetchAllFaults = async () => {
    try {
      const data = await api.get('/faults');
      setAllFaults(data.filter((f: any) => f.status === 'open'));
      setView('all_faults');
    } catch (error) {
      alert('Arızalar alınamadı');
    }
  };

  const handleCloseFault = async () => {
    if (!closingFaultId) return;

    if (!closureForm.solution || !closureForm.faultDate) {
      alert('Lütfen en az Tarih ve Çözüm alanlarını doldurunuz.');
      return;
    }

    try {
      await api.put(`/faults/${closingFaultId}`, {
        ...closureForm,
        status: 'closed'
      });
      alert('Arıza başarıyla kapatıldı!');
      setClosingFaultId(null);
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
      alert('Arıza kapatılamadı');
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
      const data = await api.get(`/faults?reportedById=${user?.id}`);
      setHistory(data);
      setView('history');
    } catch (error) {
      alert('Geçmiş alınamadı');
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !chiefdomId) {
      alert('Lütfen tüm alanları doldurunuz');
      return;
    }
    setLoading(true);
    try {
      await api.post('/faults', {
        title,
        description,
        reportedById: parseInt(user?.id || '0'),
        chiefdomId: parseInt(chiefdomId)
      });
      alert('Arıza bildirimi oluşturuldu');
      setTitle('');
      setDescription('');
      setChiefdomId('');
    } catch (error) {
      alert('Arıza bildirilemedi');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'history') {
    return (
      <View className="gap-4">
        <TouchableOpacity onPress={() => setView('overview')} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} self-start px-4 py-2 rounded-lg mb-4 shadow-sm`}>
          <Text className="text-black font-bold">← Rapor Formuna Dön</Text>
        </TouchableOpacity>
        <Text className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Bildirdiğim Arızalar</Text>
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

              <TouchableOpacity onPress={handleCloseFault} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} p-4 rounded-xl items-center mt-4`}>
                <Text className={`${isDark ? 'text-black' : 'text-black'} font-bold text-lg`}>Arızayı Kapat ve Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View className="gap-4">
        <TouchableOpacity onPress={() => setView('overview')} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} self-start px-4 py-2 rounded-lg mb-4 shadow-sm`}>
          <Text className="text-black font-bold">← Geri</Text>
        </TouchableOpacity>
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
      </View>
    );
  }

  if (view === 'report_fault') {
    return (
      <View className="gap-6">
        <TouchableOpacity onPress={() => setView('overview')} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} self-start px-4 py-2 rounded-lg mb-4 shadow-sm`}>
          <Text className="text-black font-bold">← Geri</Text>
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
      </View>
    );
  }

  return (
    <View className="gap-6">
      <TouchableOpacity onPress={() => setView('report_fault')}>
        <DashboardCard title="Yeni Arıza" value="Arıza Bildir" color="bg-blue-100 text-blue-800" />
      </TouchableOpacity>

      <TouchableOpacity onPress={fetchHistory}>
        <DashboardCard title="Raporlarım" value="Geçmişi Görüntüle" color={`${isDark ? 'bg-dark-card text-dark-primary' : 'bg-gray-100 text-gray-800'}`} />
      </TouchableOpacity>

      <TouchableOpacity onPress={fetchAllFaults}>
        <DashboardCard title="Tüm Arızalar" value="Aktif Arızaları Yönet" color="bg-red-100 text-red-800" />
      </TouchableOpacity>
    </View>
  );
}

function AdminDashboard() {
  const { user } = useAuth(); // Get current user
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  const [faults, setFaults] = useState<any[]>([]);
  const [chiefdoms, setChiefdoms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [view, setView] = useState<'overview' | 'users' | 'chiefdoms' | 'faults'>('overview');

  // Create User Form State
  const [createUserForm, setCreateUserForm] = useState({ username: '', password: '', fullName: '', role: 'worker', chiefdomId: '', email: '', phone: '+90' });

  // Inline Edit State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState({ id: '', username: '', password: '', fullName: '', role: 'worker', chiefdomId: '', email: '', phone: '' });

  // Chiefdom Form State
  const [newChiefdom, setNewChiefdom] = useState('');
  const [editingChiefdomId, setEditingChiefdomId] = useState<string | null>(null);
  const [editChiefdomName, setEditChiefdomName] = useState('');

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
      const [faultsData, chiefdomsData, usersData] = await Promise.all([
        api.get('/faults'),
        api.get('/chiefdoms'),
        api.get('/users')
      ]);
      // Filter for active faults only
      setFaults(faultsData.filter((f: any) => f.status === 'open'));
      setChiefdoms(chiefdomsData);
      setUsers(usersData);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCloseFault = async () => {
    if (!closingFaultId) return;

    // Basic validation
    if (!closureForm.solution || !closureForm.faultDate) {
      alert('Lütfen en az Tarih ve Çözüm alanlarını doldurunuz.');
      return;
    }

    try {
      await api.put(`/faults/${closingFaultId}`, {
        ...closureForm,
        status: 'closed'
      });
      alert('Arıza başarıyla kapatıldı!');
      setClosingFaultId(null);
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
      alert('Arıza kapatılamadı');
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
      alert('Lütfen şifre dahil tüm zorunlu alanları doldurunuz');
      return;
    }

    if (!validateEmail(createUserForm.email)) {
      alert('Invalid email address');
      return;
    }

    if (!createUserForm.phone.startsWith('+90') || createUserForm.phone.length < 13) {
      alert('Phone number must start with +90 and be valid');
      return;
    }

    try {
      await api.post('/users', { ...createUserForm });
      alert('Kullanıcı başarıyla oluşturuldu!');
      setCreateUserForm({ username: '', password: '', fullName: '', role: 'worker', chiefdomId: '', email: '', phone: '+90' });
      fetchData();
    } catch (error) {
      alert('Kullanıcı oluşturulamadı');
    }
  };

  const handleUpdateUser = async () => {
    if (!editUserForm.username || !editUserForm.fullName || !editUserForm.email || !editUserForm.phone) {
      alert('Lütfen tüm zorunlu alanları doldurunuz');
      return;
    }

    if (!validateEmail(editUserForm.email)) {
      alert('Invalid email address');
      return;
    }

    if (!editUserForm.phone.startsWith('+90') || editUserForm.phone.length < 13) {
      alert('Phone number must start with +90 and be valid');
      return;
    }

    try {
      // Only send password if it's not empty (meaning user wants to change it)
      const updateData: any = { ...editUserForm };
      if (!updateData.password) delete updateData.password;

      await api.put(`/users/${editUserForm.id}`, updateData);
      alert('Kullanıcı başarıyla güncellendi');
      setEditingUserId(null);
      fetchData();
    } catch (error) {
      alert('Kullanıcı güncellenemedi');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      alert('Kullanıcı silindi');
      fetchData();
    } catch (error) {
      alert('Kullanıcı silinemedi');
    }
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
    try {
      await api.post('/chiefdoms', { name: newChiefdom });
      alert('Şeflik oluşturuldu');
      setNewChiefdom('');
      fetchData();
    } catch (error) {
      alert('Şeflik oluşturulamadı');
    }
  };

  const handleDeleteChiefdom = async (id: string) => {
    try {
      await api.delete(`/chiefdoms/${id}`);
      alert('Şeflik silindi');
      fetchData();
    } catch (error) {
      alert('Şeflik silinemedi');
    }
  };

  const handleUpdateChiefdom = async () => {
    if (!editChiefdomName) return;
    try {
      await api.put(`/chiefdoms/${editingChiefdomId}`, { name: editChiefdomName });
      alert('Şeflik güncellendi');
      setEditingChiefdomId(null);
      fetchData();
    } catch (error) {
      alert('Şeflik güncellenemedi');
    }
  };

  // Filter roles based on current user's role
  const availableRoles = ['admin', 'engineer', 'ctc', 'ctc_watchman', 'worker'].filter(role => {
    if (user?.role !== 'admin' && role === 'admin') return false;
    return true;
  });

  if (view === 'users') {
    return (
      <View className="gap-4">
        <TouchableOpacity onPress={() => setView('overview')} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} self-start px-4 py-2 rounded-lg mb-4 shadow-sm`}>
          <Text className="text-black font-bold">← Geri</Text>
        </TouchableOpacity>

        {/* Create User Form */}
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

        <Text className={`text-xl font-bold mt-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Mevcut Kullanıcılar</Text>
        {users.map(u => (
          <View key={u.id} className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-4 rounded-lg shadow-sm border mb-2`}>
            {editingUserId === u.id.toString() ? (
              // Inline Edit Form
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
              // Normal View
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

        <View className="flex-row gap-2">
          <TextInput placeholder="Yeni Şeflik Adı" value={newChiefdom} onChangeText={setNewChiefdom} className={`flex-1 p-3 rounded border ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} />
          <TouchableOpacity onPress={handleCreateChiefdom} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} p-3 rounded justify-center`}><Text className="text-black font-bold">Ekle</Text></TouchableOpacity>
        </View>

        {chiefdoms.map(c => (
          <View key={c.id} className={`${isDark ? 'bg-dark-card border-dark-card' : 'bg-white border-gray-100'} p-4 rounded border mb-2`}>
            <View className="flex-row justify-between items-center mb-2">
              {editingChiefdomId === c.id.toString() ? (
                <View className="flex-1 flex-row gap-2">
                  <TextInput
                    value={editChiefdomName}
                    onChangeText={setEditChiefdomName}
                    className={`flex-1 p-2 rounded border ${isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  />
                  <TouchableOpacity onPress={handleUpdateChiefdom} className="bg-green-600 px-3 py-2 rounded justify-center"><Text className="text-white font-bold">Kaydet</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingChiefdomId(null)} className="bg-gray-200 px-3 py-2 rounded justify-center"><Text className="text-gray-600 font-bold">İptal</Text></TouchableOpacity>
                </View>
              ) : (
                <View className="flex-1">
                  <Text className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{c.name}</Text>

                  {/* Workers List */}
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
                        setEditingChiefdomId(c.id.toString());
                        setEditChiefdomName(c.name);
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
              )}
            </View>

          </View>
        ))}
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

              <TouchableOpacity onPress={handleCloseFault} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} p-4 rounded-xl items-center mt-4`}>
                <Text className={`${isDark ? 'text-black' : 'text-black'} font-bold text-lg`}>Arızayı Kapat ve Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
      </View>
    );
  }

  return (
    <View className="gap-4">
      <DashboardCard title="Sistem Genel Bakış" value="Tüm Sistemler Normal" color="bg-green-100 text-green-800" />

      <TouchableOpacity onPress={() => setView('faults')}>
        <DashboardCard title="Aktif Arızalar" value={faults.length.toString()} color="bg-red-100 text-red-800" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setView('chiefdoms')}>
        <DashboardCard title="Şeflikler" value={chiefdoms.length.toString()} color="bg-blue-100 text-blue-800" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setView('users')}>
        <DashboardCard title="Kullanıcılar" value={users.length.toString()} color="bg-purple-100 text-purple-800" />
      </TouchableOpacity>
    </View>
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
        })
        .catch(err => {
          console.error(err);
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

    try {
      await api.put(`/faults/${closingFaultId}`, {
        ...closureForm,
        status: 'closed'
      });
      alert('Arıza başarıyla kapatıldı!');
      setClosingFaultId(null);
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

            <TouchableOpacity onPress={handleCloseFault} className={`${isDark ? 'bg-dark-primary' : 'bg-light-primary'} p-4 rounded-xl items-center mt-4`}>
              <Text className={`${isDark ? 'text-black' : 'text-black'} font-bold text-lg`}>Arızayı Kapat ve Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-4">
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
    </View>
  );
}

// --- Main Dashboard ---

export default function Dashboard() {
  const { user } = useAuth();
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  const renderContent = () => {
    switch (user?.role) {
      case 'admin': return <AdminDashboard />;
      case 'ctc': return <CTCDashboard />;
      case 'ctc_watchman': return <CTCDashboard />;
      case 'engineer': return <AdminDashboard />; // Engineers now use AdminDashboard
      case 'worker': return <WorkerDashboard />;
      default: return <Text>Unknown Role</Text>;
    }
  };



  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`} showsHorizontalScrollIndicator={false} contentContainerStyle={{ width: '100%' }}>
        <View className="px-4 py-6">
          {renderContent()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
