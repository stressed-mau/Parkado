import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { MotiView } from "moti";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  const features = [
    { id: 1, title: "Animaciones", icon: "activity", color: "text-blue-400" },
    { id: 2, title: "Tailwind Dinámico", icon: "wind", color: "text-green-400" },
    { id: 3, title: "Modo Oscuro", icon: "moon", color: "text-yellow-400" },
  ];

  return (
    <SafeAreaView className={darkMode ? "flex-1 bg-gray-900" : "flex-1 bg-gray-100"}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text
          className={`text-3xl font-extrabold mb-6 ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          🚀 Demo de NativeWind + TypeScript
        </Text>

        {features.map((item, index) => (
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: index * 200 }}
            key={item.id}
            className={`mb-4 p-4 rounded-2xl flex-row items-center ${
              darkMode ? "bg-gray-800" : "bg-white"
            } shadow`}
          >
            <Feather name={item.icon as any} size={28} className={`${item.color} mr-3`} />
            <Text
              className={`text-lg font-semibold ${
                darkMode ? "text-gray-200" : "text-gray-800"
              }`}
            >
              {item.title}
            </Text>
          </MotiView>
        ))}

        <TouchableOpacity
          onPress={() => setDarkMode(!darkMode)}
          className={`mt-8 p-4 rounded-xl ${
            darkMode ? "bg-indigo-500" : "bg-indigo-600"
          }`}
        >
          <Text className="text-white text-center font-bold text-lg">
            Cambiar a {darkMode ? "Modo Claro 🌞" : "Modo Oscuro 🌙"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
