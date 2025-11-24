import { useState, useEffect } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

const defaultImagen = "https://via.placeholder.com/200x200.png?text=Parqueo";

export default function ReservaItem({ reserva, cancelarReserva }) {
  const parqueo = reserva?.plaza?.parqueo || {};
  const fotos = parqueo?.fotos || [];

  const [imagen, setImagen] = useState(defaultImagen);

  // 🔥 CORRECCIÓN: actualizar imagen cuando lleguen las fotos desde el backend
  useEffect(() => {
    if (fotos.length > 0 && fotos[0].url) {
      console.log("📸 Usando imagen:", fotos[0].url);
      setImagen(fotos[0].url);
    } else {
      console.log("⚠️ No hay fotos, usando default");
      setImagen(defaultImagen);
    }
  }, [fotos]);

  const onError = () => {
    console.log("❌ Error cargando imagen, fallback:", imagen);
    setImagen(defaultImagen);
  };

  return (
    <View className="mb-4 rounded-xl border border-gray-300 bg-white">
      <View className="flex-row items-center p-3 bg-gray-100 rounded-xl">

        <Image
          source={{ uri: imagen }}
          style={{
            width: 120,
            height: 120,
            borderRadius: 10,
            backgroundColor: "#ccc",
            marginRight: 12
          }}
          resizeMode="cover"
          onError={onError}
        />

        <View className="flex-1">
          <Text className="font-bold text-[16px]">{parqueo?.nombre}</Text>

          <Text className="text-gray-700 text-[13px] mt-[4px]">
            {parqueo?.direccion}
          </Text>

          <Text className="text-[12px] mt-2">
            <Text className="font-semibold">Plaza:</Text> {reserva?.plaza?.nroPlaza}
          </Text>

          <Text className="text-[12px] mt-1">
            <Text className="font-semibold">Matrícula:</Text> {reserva?.matriculaVehiculo}
          </Text>

          <TouchableOpacity
            onPress={() => cancelarReserva(reserva.id, reserva?.plaza?.id)}
            className="mt-3 bg-[#FD721D] px-4 py-2 rounded-lg"
          >
            <Text className="text-center text-white font-bold">
              Cancelar Reserva
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}