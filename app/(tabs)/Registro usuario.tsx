import React from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import Logo from "../../assets/Logo";



export default function RegisterScreen() {
  return (
    <ScrollView className="flex-1 bg-[#F6EEE4] px-6 pt-10">
      {/* Logo centrado arriba */}
      <Logo />

      <Text className="text-2xl font-bold text-center text-gray-800 mt-6">
        REGISTRO DE USUARIO
      </Text>

      <View className="mt-8 space-y-4">
        <TextInput
          placeholder="NOMBRE"
          className="border border-gray-300 rounded-lg p-3"
        />
        <TextInput
          placeholder="CONTRASEÑA"
          secureTextEntry
          className="border border-gray-300 rounded-lg p-3"
        />
        <TextInput
          placeholder="CONFIRMAR CONTRASEÑA"
          secureTextEntry
          className="border border-gray-300 rounded-lg p-3"
        />
        <TextInput
          placeholder="E-MAIL"
          keyboardType="email-address"
          className="border border-gray-300 rounded-lg p-3"
        />
        <TextInput
          placeholder="CI"
          keyboardType="numeric"
          className="border border-gray-300 rounded-lg p-3"
        />
      </View>

      <TouchableOpacity className="bg-black py-3 mt-8 rounded-lg">
        <Text className="text-white text-center font-semibold text-lg">
          REGISTRAR
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
