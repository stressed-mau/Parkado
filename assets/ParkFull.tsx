import React from "react";
import { Image, View } from "react-native";

export default function Logo() {
  return (
    <View className="flex-row items-center mt-10 ml-5">
      <Image
        source={{
          uri: "https://i.ibb.co/bj78fXYD/logo.png",
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
