import React from "react";
import { Image, Text, View } from "react-native";

export default function Logo() {
  return (
    <View className="items-center justify-center">
      <Image
        source={{
          uri: "https://i.ibb.co/0jGXFZBn/Chat-GPT-Image-7-oct-2025-05-09-19.png",
        }}
        style={{ width: 120, height: 120, resizeMode: "contain" }}
      />
      <Text className="mt-2 text-lg font-semibold text-gray-700">
        Mi Empresa
      </Text>
    </View>
  );
}
