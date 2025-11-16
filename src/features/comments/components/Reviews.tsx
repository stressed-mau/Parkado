import React from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  onClose: () => void;
}

export default function ReviewsContent({ onClose }: Props) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      
      {/* HEADER */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-xl font-bold">Reseñas</Text>
        <Ionicons name="close" onPress={onClose} size={25} color="#333" />
      </View>

      {/* Calificación promedio */}
      <View className="flex-row items-center gap-3 my-3">
        <Text className="text-4xl font-bold">4.3</Text>
        <View>
          <Text className="text-yellow-500 text-lg">⭐ ⭐ ⭐ ⭐ ★</Text>
          <Text className="text-gray-500">Basado en 3 reseñas</Text>
        </View>
      </View>

      {/* AGREGAR RESEÑA */}
      <Text className="text-lg font-semibold mt-5">Agregar tu reseña</Text>

      <Text className="mt-2 text-gray-600">Calificación</Text>
      <Text className="text-2xl my-1 text-yellow-500">★ ★ ★ ★ ★</Text>

      <Text className="mt-4 text-gray-600">Comentario</Text>
      <TextInput
        className="border rounded-xl p-3 mt-2 h-28"
        multiline
        placeholder="Comparte tu experiencia..."
      />

      <TouchableOpacity className="bg-orange-400 py-3 rounded-xl mt-4">
        <Text className="text-center text-white font-bold">Publicar reseña</Text>
      </TouchableOpacity>

      <View className="h-[1px] bg-gray-300 my-5" />

      {/* LISTA DE RESEÑAS */}
      <Text className="text-lg font-semibold mb-3">Todas las reseñas</Text>

      {[
        { user: "Carlos M.", fecha: "hace 2 días", rating: 5, comment: "Excelente servicio, muy limpio y seguro." },
        { user: "María G.", fecha: "hace 1 semana", rating: 4, comment: "Buen lugar, pero es un poco caro." },
      ].map((r, i) => (
        <View key={i} className="bg-white p-4 rounded-xl mb-3 border border-gray-200">
          <Text className="font-bold">{r.user}</Text>
          <Text className="text-gray-500">{r.fecha}</Text>
          <Text className="text-yellow-500 text-lg">{"★".repeat(r.rating)}</Text>
          <Text className="mt-1">{r.comment}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
