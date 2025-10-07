import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

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
