<<<<<<< HEAD
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
=======
import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
>>>>>>> origin/feature/08-Administrar-disponibilidad

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-100">
      <Text className="text-2xl font-bold text-blue-600 mb-4">
        ¡NativeWind funcionando! 🎉
      </Text>

      <TouchableOpacity className="bg-blue-500 px-6 py-3 rounded-2xl shadow">
        <Text className="text-white text-lg font-semibold">
          Presióname 😎
        </Text>
      </TouchableOpacity>
    </View>
  );
}
