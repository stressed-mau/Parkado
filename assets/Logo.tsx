import React from "react";
import { Image, View } from "react-native";

export default function Logo() {
  return (
    <View className="flex-row items-center mt-10 ml-5">
      <Image
        source={{
          uri: "https://i.ibb.co/0jGXFZBn/Chat-GPT-Image-7-oct-2025-05-09-19.png",
        }}
        style={{
          width: 120,
          height: 120,
          resizeMode: "contain",
        }}
      />
    </View>
  );
}

