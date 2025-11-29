import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
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
    console.log('Logout button clicked!');
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    console.log('Logout confirmed, calling signOut...');
    setShowMenu(false);
    setShowLogoutConfirm(false);
    signOut();
  };

  const cancelLogout = () => {
    console.log('Logout cancelled');
    setShowLogoutConfirm(false);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setShowMenu(true)} style={{ marginRight: 15 }}>
        <FontAwesome name="user-circle" size={28} color={theme === 'dark' ? '#FFFFFF' : '#374151'} />
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
            <View style={styles.dropdownMenu}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>Menu</Text>
                <TouchableOpacity onPress={() => setShowMenu(false)}>
                  <FontAwesome name="times" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.menuItem} onPress={handleProfileSettings}>
                <FontAwesome name="user" size={20} color="#374151" style={{ marginRight: 12 }} />
                <Text style={styles.menuText}>Profile Settings</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Theme Selection */}
              <View style={styles.themeSection}>
                <Text style={styles.sectionTitle}>Theme</Text>
                <View style={styles.themeOptions}>
                  <TouchableOpacity
                    style={[styles.themeButton, theme === 'light' && styles.themeButtonActive]}
                    onPress={() => handleThemeChange('light')}
                  >
                    <FontAwesome name="sun-o" size={18} color={theme === 'light' ? '#2563EB' : '#6B7280'} />
                    <Text style={[styles.themeButtonText, theme === 'light' && styles.themeButtonTextActive]}>Light</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.themeButton, theme === 'dark' && styles.themeButtonActive]}
                    onPress={() => handleThemeChange('dark')}
                  >
                    <FontAwesome name="moon-o" size={18} color={theme === 'dark' ? '#2563EB' : '#6B7280'} />
                    <Text style={[styles.themeButtonText, theme === 'dark' && styles.themeButtonTextActive]}>Dark</Text>
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
                  <Text style={[styles.menuText, { color: '#DC2626' }]}>Logout</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ padding: 16, backgroundColor: '#FEF2F2', borderRadius: 8, marginTop: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                    Are you sure you want to logout?
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={cancelLogout}
                      style={{ flex: 1, backgroundColor: '#E5E7EB', paddingVertical: 10, borderRadius: 6, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#374151', fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={confirmLogout}
                      style={{ flex: 1, backgroundColor: '#DC2626', paddingVertical: 10, borderRadius: 6, alignItems: 'center' }}
                    >
                      <Text style={{ color: 'white', fontWeight: '600' }}>Logout</Text>
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
    borderColor: '#2563EB',
  },
  themeButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  themeButtonTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
});

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerShown: true,
          headerRight: () => <HeaderProfileButton />,
          headerTitleAlign: 'center',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <TabBarIcon name="history" color={color} />,
          headerShown: true,
          headerRight: () => <HeaderProfileButton />,
          headerTitleAlign: 'center',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
