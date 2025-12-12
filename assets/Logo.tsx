import React from "react";
import { Image, View } from "react-native";

export default function Logo() {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Image
        source={{
          uri: "https://i.ibb.co/0jGXFZBn/Chat-GPT-Image-7-oct-2025-05-09-19.png",
        }}
        style={{
          width: 120,       // tamaño base
          height: 120,
          transform: [{ scale: 1.7 }], // escala visual (no empuja layout)
        }}
      />
    </View>
  );
}
