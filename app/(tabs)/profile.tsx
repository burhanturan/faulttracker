import { FontAwesome } from '@expo/vector-icons';
import { useScrollToTop } from '@react-navigation/native';
import { Mail, Moon, Phone, Shield, Sun, User } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { RailGuardHeader } from '../../components/RailGuard/Header';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const { theme, actualTheme, setTheme } = useTheme();
    const isDark = actualTheme === 'dark';
    const ref = useRef(null);
    useScrollToTop(ref);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Theme colors
    const pageBg = isDark ? '#0F172A' : '#FFFFFF';
    const cardBg = isDark ? '#1E293B' : '#F8FAFC';
    const borderColor = isDark ? '#334155' : '#E2E8F0';
    const textPrimary = isDark ? '#FFFFFF' : '#1E293B';
    const textSecondary = isDark ? '#94A3B8' : '#64748B';
    const buttonBg = isDark ? '#22D3EE' : '#1c4ed8';
    const buttonText = isDark ? '#0F172A' : '#FFFFFF';

    const handleChangePassword = async () => {
        if (!newPassword) {
            alert('Lütfen yeni bir şifre giriniz');
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('Şifreler eşleşmiyor');
            return;
        }

        try {
            await api.put(`/users/${user?.id}`, { password: newPassword });
            alert('Şifre başarıyla güncellendi');
            setNewPassword('');
            setConfirmPassword('');
            setShowChangePassword(false);
        } catch (error) {
            alert('Şifre güncellenemedi');
        }
    };

    const handleCancelPasswordChange = () => {
        setNewPassword('');
        setConfirmPassword('');
        setShowChangePassword(false);
    };

    const getRoleDisplay = (role: string) => {
        const roles: { [key: string]: string } = {
            'admin': 'Yönetici',
            'engineer': 'Mühendis',
            'ctc_watchman': 'CTC Nöbetçisi',
            'worker': 'İşçi'
        };
        return roles[role] || role?.replace('_', ' ');
    };

    const getRoleColor = () => {
        if (isDark) return '#22D3EE';
        return '#1c4ed8';
    };

    return (
        <View style={{ flex: 1, backgroundColor: pageBg }}>
            <RailGuardHeader user={user} title="Profil" showSearch={false} showGreeting={true} />
            <ScrollView ref={ref} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Profile Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={[styles.avatarContainer, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                        <User size={48} color={isDark ? '#94A3B8' : '#64748B'} />
                    </View>
                    <Text style={[styles.userName, { color: textPrimary }]}>{user?.fullName}</Text>
                    <View style={[styles.roleTag, { backgroundColor: isDark ? '#22D3EE20' : '#1c4ed820' }]}>
                        <Shield size={14} color={getRoleColor()} />
                        <Text style={[styles.roleText, { color: getRoleColor() }]}>{getRoleDisplay(user?.role || '')}</Text>
                    </View>
                </View>

                {/* Info Cards */}
                <View style={styles.cardsContainer}>

                    {/* Username */}
                    <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: borderColor }]}>
                        <View style={[styles.iconBg, { backgroundColor: isDark ? '#64748B20' : '#E2E8F0' }]}>
                            <User size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoLabel, { color: textSecondary }]}>Kullanıcı Adı</Text>
                            <Text style={[styles.infoValue, { color: textPrimary }]}>{user?.username}</Text>
                        </View>
                    </View>

                    {/* Email */}
                    {user?.email && (
                        <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: borderColor }]}>
                            <View style={[styles.iconBg, { backgroundColor: isDark ? '#64748B20' : '#E2E8F0' }]}>
                                <Mail size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: textSecondary }]}>E-posta</Text>
                                <Text style={[styles.infoValue, { color: textPrimary }]}>{user?.email}</Text>
                            </View>
                        </View>
                    )}

                    {/* Phone */}
                    {user?.phone && (
                        <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: borderColor }]}>
                            <View style={[styles.iconBg, { backgroundColor: isDark ? '#64748B20' : '#E2E8F0' }]}>
                                <Phone size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: textSecondary }]}>Telefon</Text>
                                <Text style={[styles.infoValue, { color: textPrimary }]}>{user?.phone}</Text>
                            </View>
                        </View>
                    )}

                    {/* Theme Toggle */}
                    <View style={[styles.themeCard, { backgroundColor: cardBg, borderColor: borderColor }]}>
                        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Tema</Text>
                        <View style={[styles.themeToggle, { backgroundColor: isDark ? '#0F172A' : '#E2E8F0' }]}>
                            <TouchableOpacity
                                onPress={() => setTheme('light')}
                                style={[
                                    styles.themeOption,
                                    theme === 'light' && { backgroundColor: isDark ? '#334155' : '#FFFFFF' }
                                ]}
                            >
                                <Sun size={18} color={theme === 'light' ? (isDark ? '#FACC15' : '#F59E0B') : textSecondary} />
                                <Text style={[styles.themeText, { color: theme === 'light' ? textPrimary : textSecondary }]}>Açık</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setTheme('dark')}
                                style={[
                                    styles.themeOption,
                                    theme === 'dark' && { backgroundColor: isDark ? '#334155' : '#1E293B' }
                                ]}
                            >
                                <Moon size={18} color={theme === 'dark' ? '#22D3EE' : textSecondary} />
                                <Text style={[styles.themeText, { color: theme === 'dark' ? (isDark ? '#FFFFFF' : '#FFFFFF') : textSecondary }]}>Koyu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Password Change */}
                    <TouchableOpacity
                        onPress={() => showChangePassword ? handleCancelPasswordChange() : setShowChangePassword(true)}
                        style={[styles.infoCard, { backgroundColor: cardBg, borderColor: borderColor }]}
                    >
                        <View style={[styles.iconBg, { backgroundColor: isDark ? '#64748B20' : '#E2E8F0' }]}>
                            <FontAwesome name="lock" size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoValue, { color: textPrimary }]}>Şifre Değiştir</Text>
                        </View>
                        <FontAwesome name={showChangePassword ? "chevron-up" : "chevron-down"} size={14} color={textSecondary} />
                    </TouchableOpacity>

                    {showChangePassword && (
                        <View style={[styles.passwordCard, { backgroundColor: cardBg, borderColor: borderColor }]}>
                            <TextInput
                                placeholder="Yeni Şifre"
                                placeholderTextColor={textSecondary}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                style={[styles.input, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', borderColor: borderColor, color: textPrimary }]}
                            />
                            <TextInput
                                placeholder="Şifreyi Onayla"
                                placeholderTextColor={textSecondary}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                style={[styles.input, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', borderColor: borderColor, color: textPrimary }]}
                            />
                            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                                <Text style={styles.errorText}>Şifreler eşleşmiyor</Text>
                            )}
                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    onPress={handleChangePassword}
                                    disabled={!newPassword || newPassword !== confirmPassword}
                                    style={[styles.button, {
                                        backgroundColor: (!newPassword || newPassword !== confirmPassword) ? '#64748B' : buttonBg,
                                        flex: 1
                                    }]}
                                >
                                    <Text style={[styles.buttonText, { color: buttonText }]}>Güncelle</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleCancelPasswordChange}
                                    style={[styles.button, { backgroundColor: isDark ? '#334155' : '#E2E8F0', flex: 1 }]}
                                >
                                    <Text style={[styles.buttonText, { color: textPrimary }]}>İptal</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Logout Button */}
                    <TouchableOpacity
                        onPress={signOut}
                        style={[styles.logoutButton, {
                            backgroundColor: isDark ? '#7F1D1D20' : '#FEF2F2',
                            borderColor: isDark ? '#7F1D1D' : '#FECACA'
                        }]}
                    >
                        <FontAwesome name="sign-out" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                        <Text style={styles.logoutText}>Çıkış Yap</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    avatarContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    roleTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    roleText: {
        fontSize: 14,
        fontWeight: '600',
    },
    cardsContainer: {
        paddingHorizontal: 16,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    iconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    themeCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    themeToggle: {
        flexDirection: 'row',
        borderRadius: 10,
        padding: 4,
    },
    themeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 8,
    },
    themeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    passwordCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    input: {
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 12,
        fontSize: 15,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginBottom: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 8,
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
    },
});
