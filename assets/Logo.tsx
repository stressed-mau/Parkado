import React from "react";
import { Image, View } from "react-native";

export default function Logo() {
  return (
    <View
      className="absolute top-10 left-5 z-50" // 👈 Fijo arriba a la izquierda
    >
      <Image
        source={{
          uri: "https://i.ibb.co/0jGXFZBn/Chat-GPT-Image-7-oct-2025-05-09-19.png",
        }}
        style={{
          width: 200,
          height: 120,
          resizeMode: "contain",
        }}
      />
    </View>
  );
}
