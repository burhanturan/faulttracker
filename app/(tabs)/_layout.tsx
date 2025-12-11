import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import Colors from '@/constants/Colors';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

import { useRouter } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

function HeaderProfileButton() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const { theme, setTheme } = useTheme();

  const handleProfileSettings = () => {
    setShowMenu(false);
    router.push('/(tabs)/profile');
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowMenu(false);
    setShowLogoutConfirm(false);
    signOut();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setShowMenu(true)} style={{ marginRight: 15 }}>
        <FontAwesome name="user-circle" size={28} color={theme === 'dark' ? '#FFD700' : '#374151'} />
      </TouchableOpacity>

      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowMenu(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={[styles.dropdownMenu, theme === 'dark' && { backgroundColor: '#1E1E1E' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB' }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: theme === 'dark' ? '#FFFFFF' : '#374151' }}>Menü</Text>
                <TouchableOpacity onPress={() => setShowMenu(false)}>
                  <FontAwesome name="times" size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.menuItem} onPress={handleProfileSettings}>
                <FontAwesome name="user" size={20} color={theme === 'dark' ? '#FFFFFF' : '#374151'} style={{ marginRight: 12 }} />
                <Text style={[styles.menuText, theme === 'dark' && { color: '#FFFFFF' }]}>Profil Ayarları</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Theme Selection */}
              <View style={styles.themeSection}>
                <Text style={styles.sectionTitle}>Tema</Text>
                <View style={styles.themeOptions}>
                  <TouchableOpacity
                    style={[styles.themeButton, theme === 'light' && { backgroundColor: '#FEF3C7', borderColor: '#EAB308' }]}
                    onPress={() => handleThemeChange('light')}
                  >
                    <FontAwesome name="sun-o" size={18} color={theme === 'light' ? '#B45309' : '#6B7280'} />
                    <Text style={[styles.themeButtonText, theme === 'light' && { color: '#B45309', fontWeight: 'bold' }]}>Açık</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.themeButton, theme === 'dark' && { backgroundColor: '#FFD700', borderColor: '#FFD700' }]}
                    onPress={() => handleThemeChange('dark')}
                  >
                    <FontAwesome name="moon-o" size={18} color={theme === 'dark' ? '#000000' : '#6B7280'} />
                    <Text style={[styles.themeButtonText, theme === 'dark' && { color: '#000000', fontWeight: 'bold' }]}>Koyu</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              {!showLogoutConfirm ? (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <FontAwesome name="sign-out" size={20} color="#DC2626" style={{ marginRight: 12 }} />
                  <Text style={[styles.menuText, { color: '#DC2626' }]}>Çıkış Yap</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ padding: 16, backgroundColor: theme === 'dark' ? '#374151' : '#FEF2F2', borderRadius: 8, marginTop: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme === 'dark' ? '#FFFFFF' : '#374151', marginBottom: 8 }}>
                    Çıkış yapmak istediğinize emin misiniz?
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={cancelLogout}
                      style={{ flex: 1, backgroundColor: theme === 'dark' ? '#4B5563' : '#E5E7EB', paddingVertical: 10, borderRadius: 6, alignItems: 'center' }}
                    >
                      <Text style={{ color: theme === 'dark' ? '#FFFFFF' : '#374151', fontWeight: '600' }}>İptal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={confirmLogout}
                      style={{ flex: 1, backgroundColor: '#DC2626', paddingVertical: 10, borderRadius: 6, alignItems: 'center' }}
                    >
                      <Text style={{ color: 'white', fontWeight: '600' }}>Çıkış</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 10,
  },
  dropdownMenu: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  themeSection: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 6,
  },
  themeButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1B3A6B',
  },
  themeButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  themeButtonTextActive: {
    color: '#1B3A6B',
    fontWeight: '600',
  },
});

export default function TabLayout() {
  const { actualTheme } = useTheme();
  const colorScheme = actualTheme;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].tabBarBackground,
          borderTopColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB',
        },
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].headerBackground,
        },
        headerTintColor: Colors[colorScheme ?? 'light'].headerText,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Geçmiş',
          tabBarIcon: ({ color }) => <TabBarIcon name="history" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
