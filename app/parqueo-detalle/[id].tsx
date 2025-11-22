import axios from "axios";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function PerfilUsuario() {
  // Probando con ID fijo
  const id = 1;

  const [usuario, setUsuario] = useState(null);
  const [parqueos, setParqueos] = useState([]);
  const [loading, setLoading] = useState(true);

  const colores = {
    azul: "#7BB3CD",
    naranja: "#FD721D",
    amarillo: "#F2BD2B",
    oliva: "#B2A83F",
    crema: "#F6EEE4",
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const resUser = await axios.get(`https://parkado-backend.vercel.app/api/usuarios/${id}`);
        const resParqueos = await axios.get(
          `https://parkado-backend.vercel.app/api/reservas/usuario/${id}`
        );

        setUsuario(resUser.data);
        setParqueos(resParqueos.data);
      } catch (error) {
        console.log("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colores.naranja} />
        <Text className="mt-4">Cargando...</Text>
      </View>
    );
  }

  if (!usuario) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-600 text-lg font-semibold">
          No se pudo cargar el usuario.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4" style={{ backgroundColor: colores.crema }}>
      <View className="items-center mb-6">
        <View className="w-24 h-24 rounded-full bg-gray-300 mb-3" />
        <Text className="text-xl font-bold">
          {usuario?.nombres} {usuario?.apellidos}
        </Text>
      </View>

      <View className="mb-4">
        <Text className="text-lg font-semibold">Phone no.</Text>
        <Text className="text-base">{usuario?.telefono}</Text>
      </View>

      <View className="mb-4">
        <Text className="text-lg font-semibold">E-Mail</Text>
        <Text className="text-base">{usuario?.correoElectronico}</Text>
      </View>

      <TouchableOpacity
        className="p-3 rounded-xl mb-6 items-center"
        style={{ backgroundColor: colores.azul }}
      >
        <Text className="text-white font-semibold">Editar perfil</Text>
      </TouchableOpacity>

      <Text className="text-lg font-bold mb-2">Parqueos visitados</Text>

      <View className="rounded-xl border p-3 border-gray-400">
        {parqueos.length === 0 && (
          <Text className="text-gray-600 italic">No tienes parqueos registrados.</Text>
        )}

        {parqueos.map((p) => (
          <View
            key={p.id}
            className="flex-row items-center p-3 mb-3 rounded-xl"
            style={{ backgroundColor: colores.amarillo }}
          >
            <View className="w-16 h-16 bg-gray-200 rounded-lg mr-3" />

            <View>
              <Text className="font-semibold text-base">{p.parqueo?.nombre}</Text>
              <Text className="text-sm">{p.parqueo?.direccion}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
