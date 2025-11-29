import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';

// --- Components ---

function DashboardCard({ title, value, color, flex }: { title: string, value: string, color: string, flex?: boolean }) {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  return (
    <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border ${flex ? 'flex-1' : ''}`}>
      <Text className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm mb-1`}>{title}</Text>
      <Text className={`text-2xl font-bold ${color.split(' ')[1]}`}>{value}</Text>
    </View>
  );
}

function ActionButtons({ actions }: { actions: string[] }) {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  return (
    <View className="gap-3">
      {actions.map((action, index) => (
        <TouchableOpacity key={index} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-4 rounded-xl shadow-sm border flex-row justify-between items-center`}>
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [chiefdomId, setChiefdomId] = useState('');
  const [chiefdoms, setChiefdoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [viewingHistory, setViewingHistory] = useState(false);

  useEffect(() => {
    api.get('/chiefdoms').then(setChiefdoms).catch(console.error);
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await api.get(`/faults?reportedById=${user?.id}`);
      setHistory(data);
      setViewingHistory(true);
    } catch (error) {
      alert('Failed to fetch history');
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !chiefdomId) {
      alert('Please fill all fields');
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
      alert('Fault reported successfully!');
      setTitle('');
      setDescription('');
      setChiefdomId('');
    } catch (error) {
      alert('Failed to report fault');
    } finally {
      setLoading(false);
    }
  };

  if (viewingHistory) {
    return (
      <View className="gap-4">
        <TouchableOpacity onPress={() => setViewingHistory(false)} className="mb-2">
          <Text className="text-blue-600 font-bold">← Back to Report Form</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800 mb-2">My Reported Faults</Text>
        {history.map((fault) => (
          <View key={fault.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-2">
            <View className="flex-row justify-between items-start">
              <Text className="font-bold text-gray-800 text-lg">{fault.title}</Text>
              <View className={`px-2 py-1 rounded-full ${fault.status === 'open' ? 'bg-red-100' : 'bg-green-100'}`}>
                <Text className={`text-xs font-bold ${fault.status === 'open' ? 'text-red-800' : 'text-green-800'}`}>{fault.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text className="text-gray-600 mt-1">{fault.description}</Text>
            <Text className="text-gray-400 text-xs mt-2">Assigned to: {fault.chiefdom?.name || 'Unassigned'}</Text>
            <Text className="text-gray-400 text-xs">Date: {new Date(fault.createdAt).toLocaleDateString()}</Text>
          </View>
        ))}
        {history.length === 0 && <Text className="text-gray-500 text-center mt-4">No faults reported yet.</Text>}
      </View>
    );
  }

  return (
    <View className="gap-6">
      <View className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <Text className="text-xl font-bold text-gray-800 mb-4">Report a Fault</Text>

        <Text className="text-gray-600 font-bold mb-2">Fault Title</Text>
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4"
          placeholder="e.g. Signal Failure at Station A"
          value={title}
          onChangeText={setTitle}
        />

        <Text className="text-gray-600 font-bold mb-2">Explanation</Text>
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 h-24"
          placeholder="Describe the issue in detail..."
          multiline
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />

        <Text className="text-gray-600 font-bold mb-2">Assign To Chiefdom</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {chiefdoms.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setChiefdomId(c.id.toString())}
              className={`px-4 py-2 rounded-full border ${chiefdomId === c.id.toString() ? 'bg-red-600 border-red-600' : 'bg-white border-gray-300'}`}
            >
              <Text className={`${chiefdomId === c.id.toString() ? 'text-white' : 'text-gray-600'}`}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className={`bg-red-700 p-4 rounded-xl items-center ${loading ? 'opacity-50' : ''}`}
        >
          <Text className="text-white font-bold text-lg">Submit Report</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={fetchHistory}>
        <DashboardCard title="My Reports" value="View History" color="bg-gray-100 text-gray-800" />
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

  useEffect(() => {
    fetchData();
  }, []);

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

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleCreateUser = async () => {
    if (!createUserForm.username || !createUserForm.fullName || !createUserForm.email || !createUserForm.phone || !createUserForm.password) {
      alert('Please fill all required fields, including password');
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
      alert('User created successfully!');
      setCreateUserForm({ username: '', password: '', fullName: '', role: 'worker', chiefdomId: '', email: '', phone: '+90' });
      fetchData();
    } catch (error) {
      alert('Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    if (!editUserForm.username || !editUserForm.fullName || !editUserForm.email || !editUserForm.phone) {
      alert('Please fill all required fields');
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
      alert('User updated successfully');
      setEditingUserId(null);
      fetchData();
    } catch (error) {
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      alert('User deleted');
      fetchData();
    } catch (error) {
      alert('Failed to delete user');
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
      alert('Chiefdom created');
      setNewChiefdom('');
      fetchData();
    } catch (error) {
      alert('Failed to create chiefdom');
    }
  };

  const handleDeleteChiefdom = async (id: string) => {
    try {
      await api.delete(`/chiefdoms/${id}`);
      alert('Chiefdom deleted');
      fetchData();
    } catch (error) {
      alert('Failed to delete chiefdom');
    }
  };

  const handleUpdateChiefdom = async () => {
    if (!editChiefdomName) return;
    try {
      await api.put(`/chiefdoms/${editingChiefdomId}`, { name: editChiefdomName });
      alert('Chiefdom updated');
      setEditingChiefdomId(null);
      fetchData();
    } catch (error) {
      alert('Failed to update chiefdom');
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
        <TouchableOpacity onPress={() => setView('overview')}><Text className="text-blue-600 font-bold">← Back</Text></TouchableOpacity>

        {/* Create User Form */}
        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <Text className="text-xl font-bold mb-4">Create New User</Text>

          <TextInput placeholder="Username" value={createUserForm.username} onChangeText={t => setCreateUserForm({ ...createUserForm, username: t })} className="bg-gray-50 p-3 rounded border border-gray-200 mb-2" />
          <TextInput placeholder="Full Name" value={createUserForm.fullName} onChangeText={t => setCreateUserForm({ ...createUserForm, fullName: t })} className="bg-gray-50 p-3 rounded border border-gray-200 mb-2" />
          <TextInput placeholder="Email" value={createUserForm.email} onChangeText={t => setCreateUserForm({ ...createUserForm, email: t })} keyboardType="email-address" autoCapitalize="none" className="bg-gray-50 p-3 rounded border border-gray-200 mb-2" />
          <TextInput placeholder="Phone (+90...)" value={createUserForm.phone} onChangeText={t => setCreateUserForm({ ...createUserForm, phone: t })} keyboardType="phone-pad" className="bg-gray-50 p-3 rounded border border-gray-200 mb-2" />
          <TextInput placeholder="Password" value={createUserForm.password} onChangeText={t => setCreateUserForm({ ...createUserForm, password: t })} className="bg-gray-50 p-3 rounded border border-gray-200 mb-2" />

          <Text className="font-bold mt-2 mb-1">Role</Text>
          <View className="flex-row gap-2 flex-wrap mb-2">
            {availableRoles.map(r => (
              <TouchableOpacity key={r} onPress={() => setCreateUserForm({ ...createUserForm, role: r, chiefdomId: '' })} className={`px-3 py-1 rounded-full border ${createUserForm.role === r ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                <Text className={createUserForm.role === r ? 'text-white' : 'text-gray-600'}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {createUserForm.role === 'worker' && (
            <>
              <Text className="font-bold mt-2 mb-1">Assign Chiefdom</Text>
              <View className="flex-row gap-2 flex-wrap mb-2">
                {chiefdoms.map(c => (
                  <TouchableOpacity key={c.id} onPress={() => setCreateUserForm({ ...createUserForm, chiefdomId: c.id.toString() })} className={`px-3 py-1 rounded-full border ${createUserForm.chiefdomId === c.id.toString() ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                    <Text className={createUserForm.chiefdomId === c.id.toString() ? 'text-white' : 'text-gray-600'}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity onPress={handleCreateUser} className="bg-blue-600 p-3 rounded items-center mt-4"><Text className="text-white font-bold">Create User</Text></TouchableOpacity>
        </View>

        <Text className="text-xl font-bold mt-4">Existing Users</Text>
        {users.map(u => (
          <View key={u.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-2">
            {editingUserId === u.id.toString() ? (
              // Inline Edit Form
              <View>
                <Text className="font-bold mb-2 text-blue-600">Editing: {u.username}</Text>
                <TextInput placeholder="Username" value={editUserForm.username} onChangeText={t => setEditUserForm({ ...editUserForm, username: t })} className="bg-gray-50 p-2 rounded border border-gray-200 mb-2" />
                <TextInput placeholder="Full Name" value={editUserForm.fullName} onChangeText={t => setEditUserForm({ ...editUserForm, fullName: t })} className="bg-gray-50 p-2 rounded border border-gray-200 mb-2" />
                <TextInput placeholder="Email" value={editUserForm.email} onChangeText={t => setEditUserForm({ ...editUserForm, email: t })} className="bg-gray-50 p-2 rounded border border-gray-200 mb-2" />
                <TextInput placeholder="Phone" value={editUserForm.phone} onChangeText={t => setEditUserForm({ ...editUserForm, phone: t })} className="bg-gray-50 p-2 rounded border border-gray-200 mb-2" />
                <TextInput placeholder="New Password (leave empty to keep)" value={editUserForm.password} onChangeText={t => setEditUserForm({ ...editUserForm, password: t })} className="bg-gray-50 p-2 rounded border border-gray-200 mb-2" />

                <Text className="font-bold mt-1 mb-1">Role</Text>
                <View className="flex-row gap-2 flex-wrap mb-2">
                  {availableRoles.map(r => (
                    <TouchableOpacity key={r} onPress={() => setEditUserForm({ ...editUserForm, role: r, chiefdomId: '' })} className={`px-2 py-1 rounded-full border ${editUserForm.role === r ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                      <Text className={`text-xs ${editUserForm.role === r ? 'text-white' : 'text-gray-600'}`}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {editUserForm.role === 'worker' && (
                  <>
                    <Text className="font-bold mt-1 mb-1">Assign Chiefdom</Text>
                    <View className="flex-row gap-2 flex-wrap mb-2">
                      {chiefdoms.map(c => (
                        <TouchableOpacity key={c.id} onPress={() => setEditUserForm({ ...editUserForm, chiefdomId: c.id.toString() })} className={`px-2 py-1 rounded-full border ${editUserForm.chiefdomId === c.id.toString() ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                          <Text className={`text-xs ${editUserForm.chiefdomId === c.id.toString() ? 'text-white' : 'text-gray-600'}`}>{c.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <View className="flex-row gap-2 mt-2">
                  <TouchableOpacity onPress={handleUpdateUser} className="flex-1 bg-green-600 p-2 rounded items-center"><Text className="text-white font-bold">Save</Text></TouchableOpacity>
                  <TouchableOpacity onPress={cancelEditing} className="flex-1 bg-gray-200 p-2 rounded items-center"><Text className="text-gray-600 font-bold">Cancel</Text></TouchableOpacity>
                </View>
              </View>
            ) : (
              // Normal View
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="font-bold text-gray-800">{u.fullName} ({u.username})</Text>
                  <Text className="text-gray-500 text-xs">{u.role} {u.chiefdom ? `- ${u.chiefdom.name}` : ''}</Text>
                  <Text className="text-gray-400 text-xs">{u.email} | {u.phone}</Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity onPress={() => startEditing(u)} className="bg-blue-100 px-3 py-1 rounded"><Text className="text-blue-600">Edit</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteUser(u.id)} className="bg-red-100 px-3 py-1 rounded"><Text className="text-red-600">Delete</Text></TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}
        {users.length === 0 && <Text className="text-gray-500 text-center mt-4">No users found.</Text>}
      </View>
    );
  }

  if (view === 'chiefdoms') {
    return (
      <View className="gap-4">
        <TouchableOpacity onPress={() => setView('overview')}><Text className="text-blue-600 font-bold">← Back</Text></TouchableOpacity>
        <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Manage Chiefdoms</Text>

        <View className="flex-row gap-2">
          <TextInput placeholder="New Chiefdom Name" value={newChiefdom} onChangeText={setNewChiefdom} className="flex-1 bg-white p-3 rounded border border-gray-200" />
          <TouchableOpacity onPress={handleCreateChiefdom} className="bg-green-600 p-3 rounded justify-center"><Text className="text-white font-bold">Add</Text></TouchableOpacity>
        </View>

        {chiefdoms.map(c => (
          <View key={c.id} className="bg-white p-4 rounded border border-gray-100 mb-2">
            <View className="flex-row justify-between items-center mb-2">
              {editingChiefdomId === c.id.toString() ? (
                <View className="flex-1 flex-row gap-2">
                  <TextInput
                    value={editChiefdomName}
                    onChangeText={setEditChiefdomName}
                    className="flex-1 bg-gray-50 p-2 rounded border border-gray-200"
                  />
                  <TouchableOpacity onPress={handleUpdateChiefdom} className="bg-green-600 px-3 py-2 rounded justify-center"><Text className="text-white font-bold">Save</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingChiefdomId(null)} className="bg-gray-200 px-3 py-2 rounded justify-center"><Text className="text-gray-600 font-bold">Cancel</Text></TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text className="font-bold text-lg">{c.name}</Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => {
                        setEditingChiefdomId(c.id.toString());
                        setEditChiefdomName(c.name);
                      }}
                      className="bg-blue-100 px-3 py-1 rounded"
                    >
                      <Text className="text-blue-600">Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteChiefdom(c.id)} className="bg-red-100 px-3 py-1 rounded"><Text className="text-red-600">Delete</Text></TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {/* Workers List */}
            <View className="pl-2 border-l-2 border-gray-200">
              <Text className="text-xs text-gray-500 font-bold mb-1">Assigned Workers:</Text>
              {users.filter(u => u.chiefdomId === c.id).length > 0 ? (
                <View className="gap-1">
                  {users.filter(u => u.chiefdomId === c.id).map(u => (
                    <Text key={u.id} className="text-gray-600 text-sm">• {u.fullName} <Text className="text-gray-400 text-xs">({u.role})</Text></Text>
                  ))}
                </View>
              ) : (
                <Text className="text-gray-400 text-xs italic">No workers assigned</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  }



  if (view === 'faults') {
    return (
      <View className="gap-4">
        <TouchableOpacity onPress={() => setView('overview')}><Text className="text-blue-600 font-bold">← Back</Text></TouchableOpacity>
        <Text className="text-xl font-bold">Active Faults</Text>

        {faults.map(f => (
          <View key={f.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-2">
            <View className="flex-row justify-between items-start">
              <Text className="font-bold text-gray-800 text-lg">{f.title}</Text>
              <View className={`px-2 py-1 rounded-full ${f.status === 'open' ? 'bg-red-100' : 'bg-green-100'}`}>
                <Text className={`text-xs font-bold ${f.status === 'open' ? 'text-red-800' : 'text-green-800'}`}>{f.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text className="text-gray-600 mt-1">{f.description}</Text>
            <Text className="text-gray-400 text-xs mt-2">Assigned to: {f.chiefdom?.name || 'Unassigned'}</Text>
            <Text className="text-gray-400 text-xs">Reported by: {f.reportedBy?.fullName}</Text>
            <Text className="text-gray-400 text-xs">Date: {new Date(f.createdAt).toLocaleDateString()}</Text>
          </View>
        ))}
        {faults.length === 0 && <Text className="text-gray-500 text-center mt-4">No active faults.</Text>}
      </View>
    );
  }

  return (
    <View className="gap-4">
      <DashboardCard title="System Overview" value="All Systems Normal" color="bg-green-100 text-green-800" />
      <View className="flex-row gap-4">
        <TouchableOpacity onPress={() => setView('faults')} className="flex-1">
          <DashboardCard title="Active Faults" value={faults.length.toString()} color="bg-red-100 text-red-800" flex />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView('chiefdoms')} className="flex-1">
          <DashboardCard title="Chiefdoms" value={chiefdoms.length.toString()} color="bg-blue-100 text-blue-800" flex />
        </TouchableOpacity>
      </View>

      <Text className="font-bold text-gray-500 mt-4">Admin Actions</Text>
      <TouchableOpacity onPress={() => setView('users')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-row justify-between items-center">
        <Text className="font-medium text-gray-700">Manage Users</Text>
        <Text className="text-gray-400">→</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setView('chiefdoms')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-row justify-between items-center">
        <Text className="font-medium text-gray-700">Manage Chiefdoms</Text>
        <Text className="text-gray-400">→</Text>
      </TouchableOpacity>
    </View>
  );
}

function EngineerDashboard() {
  return (
    <View className="gap-4">
      <DashboardCard title="Assigned Tasks" value="3" color="bg-orange-100 text-orange-800" />
      <ActionButtons actions={['View My Tasks', 'Update Status', 'History']} />
    </View>
  );
}

function WorkerDashboard() {
  const { user } = useAuth();
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
      alert('Please fill in at least the Date and Solution.');
      return;
    }

    try {
      await api.put(`/faults/${closingFaultId}`, {
        ...closureForm,
        status: 'closed'
      });
      alert('Fault closed successfully!');
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
      alert('Failed to close fault');
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
          <TouchableOpacity onPress={() => setClosingFaultId(null)} className="mb-2">
            <Text className="text-blue-600 font-bold">← Back to Faults</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Close Fault Report</Text>

          <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-3">
            <View>
              <Text className="text-gray-600 font-bold mb-1">Arıza Tarihi</Text>
              <TextInput value={closureForm.faultDate} onChangeText={t => setClosureForm({ ...closureForm, faultDate: t })} className="bg-gray-50 p-3 rounded border border-gray-200" placeholder="DD.MM.YYYY" />
            </View>
            <View>
              <Text className="text-gray-600 font-bold mb-1">Arıza Saati</Text>
              <TextInput value={closureForm.faultTime} onChangeText={t => setClosureForm({ ...closureForm, faultTime: t })} className="bg-gray-50 p-3 rounded border border-gray-200" placeholder="HH:MM" />
            </View>
            <View>
              <Text className="text-gray-600 font-bold mb-1">Arızayı Bildiren</Text>
              <TextInput value={closureForm.reporterName} onChangeText={t => setClosureForm({ ...closureForm, reporterName: t })} className="bg-gray-50 p-3 rounded border border-gray-200" />
            </View>
            <View>
              <Text className="text-gray-600 font-bold mb-1">Hat Bilgisi</Text>
              <TextInput value={closureForm.lineInfo} onChangeText={t => setClosureForm({ ...closureForm, lineInfo: t })} className="bg-gray-50 p-3 rounded border border-gray-200" />
            </View>
            <View>
              <Text className="text-gray-600 font-bold mb-1">Arıza Bilgisi</Text>
              <TextInput value={closureForm.faultInfo} onChangeText={t => setClosureForm({ ...closureForm, faultInfo: t })} className="bg-gray-50 p-3 rounded border border-gray-200" multiline numberOfLines={3} />
            </View>
            <View>
              <Text className="text-gray-600 font-bold mb-1">Arıza Çözümü</Text>
              <TextInput value={closureForm.solution} onChangeText={t => setClosureForm({ ...closureForm, solution: t })} className="bg-gray-50 p-3 rounded border border-gray-200" multiline numberOfLines={3} placeholder="Yapılan işlemi açıklayınız..." />
            </View>
            <View>
              <Text className="text-gray-600 font-bold mb-1">Çalışan Personel</Text>
              <TextInput value={closureForm.personnel} onChangeText={t => setClosureForm({ ...closureForm, personnel: t })} className="bg-gray-50 p-3 rounded border border-gray-200" />
            </View>
            <View>
              <Text className="text-gray-600 font-bold mb-1">Katılan TCDD Personeli</Text>
              <TextInput value={closureForm.tcddPersonnel} onChangeText={t => setClosureForm({ ...closureForm, tcddPersonnel: t })} className="bg-gray-50 p-3 rounded border border-gray-200" />
            </View>

            <TouchableOpacity onPress={handleCloseFault} className="bg-green-600 p-4 rounded-xl items-center mt-4">
              <Text className="text-white font-bold text-lg">Close Fault & Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <DashboardCard title="Chiefdom Faults" value={faults.length.toString()} color="bg-orange-100 text-orange-800" />

      <Text className="text-xl font-bold text-gray-800">Faults in My Chiefdom</Text>

      {loading ? (
        <Text className="text-gray-500">Loading faults...</Text>
      ) : (
        <>
          {faults.map((fault) => (
            <TouchableOpacity key={fault.id} onPress={() => openClosureForm(fault)} disabled={fault.status === 'closed'}>
              <View className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-2 ${fault.status === 'closed' ? 'opacity-60' : ''}`}>
                <View className="flex-row justify-between items-start">
                  <Text className="font-bold text-gray-800 text-lg">{fault.title}</Text>
                  <View className={`px-2 py-1 rounded-full ${fault.status === 'open' ? 'bg-red-100' : 'bg-green-100'}`}>
                    <Text className={`text-xs font-bold ${fault.status === 'open' ? 'text-red-800' : 'text-green-800'}`}>{fault.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text className="text-gray-600 mt-1">{fault.description}</Text>
                <Text className="text-gray-400 text-xs mt-2">Reported by: {fault.reportedBy?.fullName || 'Unknown'}</Text>
                <Text className="text-gray-400 text-xs">Date: {new Date(fault.createdAt).toLocaleDateString()}</Text>
                {fault.status !== 'closed' && <Text className="text-blue-600 text-xs mt-2 font-bold">Tap to Close &gt;</Text>}
              </View>
            </TouchableOpacity>
          ))}
          {faults.length === 0 && <Text className="text-gray-500 text-center mt-4">No faults assigned to your chiefdom.</Text>}
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
      <ScrollView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} showsHorizontalScrollIndicator={false} contentContainerStyle={{ width: '100%' }}>
        <View className="px-4 py-6">
          {renderContent()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
