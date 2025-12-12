import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, Globe, Info, Lock, Moon, Shield, Sun, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RailGuardHeader } from '../components/RailGuard/Header';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isDark: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, title, subtitle, onPress, rightElement, isDark }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E2E8F0',
    }}
  >
    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: isDark ? '#334155' : '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
      {icon}
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ color: isDark ? '#FFFFFF' : '#1F2937', fontSize: 16, fontWeight: '600' }}>{title}</Text>
      {subtitle && <Text style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: 13, marginTop: 2 }}>{subtitle}</Text>}
    </View>
    {rightElement || (onPress && <ChevronRight size={20} color={isDark ? '#64748B' : '#9CA3AF'} />)}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { theme, actualTheme, setTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const buttonBg = isDark ? '#22D3EE' : '#1c4ed8';
  const buttonText = isDark ? '#0F172A' : '#FFFFFF';
  const pageBg = isDark ? '#0F172A' : '#F8FAFC';
  const sectionBg = isDark ? '#1E293B' : '#FFFFFF';

  const appVersion = '1.0.0';

  return (
    <View style={{ flex: 1, backgroundColor: pageBg }}>
      {/* Standard RailGuard Header */}
      <RailGuardHeader user={user} title="Ayarlar" showSearch={false} showGreeting={false} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>

        {/* Geri Butonu */}
        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: buttonBg, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}>
            <Text style={{ color: buttonText, fontWeight: 'bold', fontSize: 15 }}>← Geri</Text>
          </TouchableOpacity>
        </View>

        {/* Görünüm Ayarları */}
        <Text style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: 13, fontWeight: '600', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase' }}>Görünüm</Text>

        <View style={{ backgroundColor: sectionBg, borderRadius: 16, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0' }}>
          <SettingItem
            icon={isDark ? <Moon size={22} color="#22D3EE" /> : <Sun size={22} color="#F59E0B" />}
            title="Tema"
            subtitle={theme === 'dark' ? 'Koyu Mod' : theme === 'light' ? 'Açık Mod' : 'Sistem Varsayılanı'}
            isDark={isDark}
            rightElement={
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setTheme('light')}
                  style={{
                    backgroundColor: theme === 'light' ? buttonBg : (isDark ? '#475569' : '#E2E8F0'),
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Sun size={18} color={theme === 'light' ? buttonText : (isDark ? '#94A3B8' : '#64748B')} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setTheme('dark')}
                  style={{
                    backgroundColor: theme === 'dark' ? buttonBg : (isDark ? '#475569' : '#E2E8F0'),
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Moon size={18} color={theme === 'dark' ? buttonText : (isDark ? '#94A3B8' : '#64748B')} />
                </TouchableOpacity>
              </View>
            }
          />
        </View>

        {/* Bildirim Ayarları */}
        <Text style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: 13, fontWeight: '600', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase' }}>Bildirimler</Text>

        <View style={{ backgroundColor: sectionBg, borderRadius: 16, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0' }}>
          <SettingItem
            icon={<Bell size={22} color={isDark ? '#22D3EE' : '#3B82F6'} />}
            title="Bildirimler"
            subtitle="Push bildirimleri al"
            isDark={isDark}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#767577', true: buttonBg }}
                thumbColor={notificationsEnabled ? '#FFFFFF' : '#f4f3f4'}
              />
            }
          />
          <SettingItem
            icon={<Bell size={22} color={isDark ? '#22D3EE' : '#3B82F6'} />}
            title="Ses"
            subtitle="Bildirim sesleri"
            isDark={isDark}
            rightElement={
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: '#767577', true: buttonBg }}
                thumbColor={soundEnabled ? '#FFFFFF' : '#f4f3f4'}
              />
            }
          />
        </View>

        {/* Hesap Ayarları */}
        <Text style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: 13, fontWeight: '600', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase' }}>Hesap</Text>

        <View style={{ backgroundColor: sectionBg, borderRadius: 16, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0' }}>
          <SettingItem
            icon={<User size={22} color={isDark ? '#22D3EE' : '#3B82F6'} />}
            title="Profil"
            subtitle={user?.fullName || 'Profil bilgilerini görüntüle'}
            isDark={isDark}
            onPress={() => router.push('/(tabs)/profile')}
          />
          <SettingItem
            icon={<Lock size={22} color={isDark ? '#22D3EE' : '#3B82F6'} />}
            title="Şifre Değiştir"
            subtitle="Hesap güvenliği"
            isDark={isDark}
            onPress={() => router.push('/(tabs)/profile')}
          />
          <SettingItem
            icon={<Shield size={22} color={isDark ? '#22D3EE' : '#3B82F6'} />}
            title="Gizlilik"
            subtitle="Veri ve gizlilik ayarları"
            isDark={isDark}
            onPress={() => { }}
          />
        </View>

        {/* Uygulama Bilgileri */}
        <Text style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: 13, fontWeight: '600', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase' }}>Uygulama</Text>

        <View style={{ backgroundColor: sectionBg, borderRadius: 16, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0' }}>
          <SettingItem
            icon={<Globe size={22} color={isDark ? '#22D3EE' : '#3B82F6'} />}
            title="Dil"
            subtitle="Türkçe"
            isDark={isDark}
            onPress={() => { }}
          />
          <SettingItem
            icon={<Info size={22} color={isDark ? '#22D3EE' : '#3B82F6'} />}
            title="Hakkında"
            subtitle={`Versiyon ${appVersion}`}
            isDark={isDark}
            onPress={() => { }}
          />
        </View>

        {/* App Info */}
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Text style={{ color: isDark ? '#475569' : '#9CA3AF', fontSize: 13 }}>RailGuard Fault Tracker</Text>
          <Text style={{ color: isDark ? '#475569' : '#9CA3AF', fontSize: 12, marginTop: 4 }}>© 2025 Tüm hakları saklıdır</Text>
          <Text style={{ color: isDark ? '#334155' : '#CBD5E1', fontSize: 11, marginTop: 8 }}>
            Platform: {Platform.OS} | Versiyon: {appVersion}
          </Text>
        </View>

      </ScrollView>

      {/* Tab Bar Style Footer */}
      <View style={{
        backgroundColor: isDark ? '#0F172A' : '#F3F4F6',
        height: 70,
        paddingBottom: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: isDark ? '#374151' : '#E5E7EB',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
      }}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)')}
          style={{ alignItems: 'center', paddingVertical: 8, flex: 1 }}
        >
          <FontAwesome name="home" size={28} color={isDark ? '#64748B' : '#9CA3AF'} style={{ marginBottom: -3 }} />
          <Text style={{ color: isDark ? '#64748B' : '#9CA3AF', fontSize: 10, marginTop: 4 }}>Ana Sayfa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/history')}
          style={{ alignItems: 'center', paddingVertical: 8, flex: 1 }}
        >
          <FontAwesome name="history" size={28} color={isDark ? '#22D3EE' : '#1c4ed8'} style={{ marginBottom: -3 }} />
          <Text style={{ color: isDark ? '#22D3EE' : '#1c4ed8', fontSize: 10, marginTop: 4 }}>Geçmiş</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile')}
          style={{ alignItems: 'center', paddingVertical: 8, flex: 1 }}
        >
          <FontAwesome name="user" size={28} color={isDark ? '#64748B' : '#9CA3AF'} style={{ marginBottom: -3 }} />
          <Text style={{ color: isDark ? '#64748B' : '#9CA3AF', fontSize: 10, marginTop: 4 }}>Profil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
