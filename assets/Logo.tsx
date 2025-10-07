import React from "react";
import { Image, View } from "react-native";

export default function Logo() {
  return (
    <View
      style={{
        alignItems: "flex-start",  // Alinea el logo a la izquierda
        justifyContent: "flex-start",
        marginLeft: 20,            // Ajusta margen izquierdo
        marginTop: 30,             // Ajusta margen superior
      }}
    >
      <Image
        source={{
          uri: "https://i.ibb.co/0jGXFZBn/Chat-GPT-Image-7-oct-2025-05-09-19.png",
        }}
        style={{
          width: 250,             // Más grande
          height: 250,
          resizeMode: "contain",
        }}
      />
    </View>
  );
}
