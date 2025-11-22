// components/StarRating.tsx
import React from "react";
import { View, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";

interface StarRatingProps {
  rating: number;           // valor entre 0 y 5
  size?: number;            // tamaño de estrellas
  interactive?: boolean;    // si permite clics
  onRatingChange?: (n: number) => void; // callback solo si es interactivo
}

export default function StarRating({
  rating,
  size = 18,
  interactive = false,
  onRatingChange,
}: StarRatingProps) {
  return (
    <View style={{ flexDirection: "row" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          disabled={!interactive}
          onPress={() => interactive && onRatingChange?.(star)}
          style={{ marginHorizontal: 2 }}
        >
          <AntDesign
            name="star"
            size={size}
            fill={star <= rating ? "#FFD700" : "transparent"}
            color={star <= rating ? "#FFD700" : "#D1D5DB"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}