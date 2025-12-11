import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white p-4 pt-12">
      <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-6">
        <ArrowLeft color="#1c4ed8" size={24} />
        <Text className="text-blue-800 text-xl font-bold ml-2">Ayarlar</Text>
      </TouchableOpacity>
      
      <View className="bg-gray-100 p-4 rounded-xl border border-gray-200">
        <Text className="text-gray-600 text-center">Profil ve Ayarlar burada olacak.</Text>
      </View>
    </View>
  );
}
