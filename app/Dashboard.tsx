import axios from "axios";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Logo from "../assets/Logo"; // si lo tienes, lo mostramos; si no, el logoLocalUri

export default function DashboardParqueo({ parqueoId = 1, onClose }) {
  // AHORA usa el parqueoId recibido

  const BACKEND_BASE = "https://parkado-backend.vercel.app";
  const DASH_API = `${BACKEND_BASE}/api/dashboard/parqueo/${parqueoId}`;

  const colores = {
    azul: "#7BB3CD",
    naranja: "#FD721D",
    amarillo: "#F2BD2B",
    oliva: "#B2A83F",
    crema: "#F6EEE4",
  };

  const logoLocalUri = "file:///mnt/data/fa223f71-35a3-45cb-bf93-68ab68bf477e.png";

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await axios.get(DASH_API);
        if (!mounted) return;
        setDashboard(res.data);
      } catch (e) {
        console.log("Error fetching dashboard:", e);
        if (mounted) setError("No se pudo cargar el dashboard.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colores.crema }}>
        <ActivityIndicator size="large" color={colores.naranja} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colores.crema }}>
        <Text className="text-red-600">{error}</Text>
      </View>
    );
  }

  const ingresos = dashboard?.ingresosUltimos30d ?? 0;
  const reservas = dashboard?.reservasUltimos30d ?? 0;
  const rating = dashboard?.ratingPromedio ?? null;
  const plazasTotales = dashboard?.plazasTotales ?? 0;
  const plazasOcupadas = dashboard?.plazasOcupadasAhora ?? 0;
  const tasa = dashboard?.tasaOcupacion ??
    `${plazasTotales ? ((plazasOcupadas / plazasTotales) * 100).toFixed(1) + "%" : "0%"}`;

  return (
    <ScrollView className="flex-1 px-4 py-6" style={{ backgroundColor: colores.crema }}>
      
      {/* 🔙 BOTÓN REGRESAR */}
      <TouchableOpacity
        onPress={() => onClose?.()}
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
      >
        <Text style={{ fontSize: 26, marginRight: 6 }}>⬅️</Text>
        <Text style={{ fontWeight: "700", fontSize: 16 }}>Volver</Text>
      </TouchableOpacity>

      {/* HEADER */}
      <View className="items-center mb-6">
        <View className="flex-row items-center">
          <Logo width={72} height={72} />
          <Image
            source={{ uri: logoLocalUri }}
            className="w-14 h-14 rounded-full ml-3"
            resizeMode="cover"
          />
        </View>

        <Text className="text-2xl font-bold mt-3" style={{ color: colores.azul }}>
          Dashboard — Parqueo #{parqueoId}
        </Text>
        <Text className="text-sm text-gray-600">Métricas últimos 30 días y estado actual</Text>
      </View>

      {/* TARJETA RESUMEN */}
      <View className="mb-4 rounded-2xl p-4" style={{ backgroundColor: "#ffffff", shadowColor: "#00000020", shadowOpacity: 0.12, shadowRadius: 8 }}>
        <Text className="text-base font-semibold text-gray-700 mb-2">Resumen</Text>

        <View className="flex-row justify-between">
          <View className="flex-1 mr-2 rounded-xl p-3" style={{ backgroundColor: "#f7faf9" }}>
            <Text className="text-sm text-gray-500">Ingresos (30d)</Text>
            <Text className="text-xl font-bold mt-2">Bs {Number(ingresos).toLocaleString()}</Text>
          </View>

          <View className="flex-1 ml-2 rounded-xl p-3" style={{ backgroundColor: "#f7faf9" }}>
            <Text className="text-sm text-gray-500">Reservas (30d)</Text>
            <Text className="text-xl font-bold mt-2">{reservas}</Text>
          </View>
        </View>

        <View className="flex-row justify-between mt-3">
          <View className="flex-1 mr-2 rounded-xl p-3" style={{ backgroundColor: "#f7faf9" }}>
            <Text className="text-sm text-gray-500">Rating promedio</Text>
            <Text className="text-xl font-bold mt-2">
              {rating !== null ? rating.toFixed(1) : "N/D"}
            </Text>
          </View>

          <View className="flex-1 ml-2 rounded-xl p-3" style={{ backgroundColor: "#f7faf9" }}>
            <Text className="text-sm text-gray-500">Tasa ocupación</Text>
            <Text className="text-xl font-bold mt-2">{tasa}</Text>
          </View>
        </View>
      </View>

      {/* TARJETAS DETALLE */}
      <View className="mb-4 rounded-xl p-4" style={{ backgroundColor: "#fff" }}>
        <Text className="font-semibold text-gray-700 mb-3">Estado de plazas</Text>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-md bg-gray-100 items-center justify-center mr-3">
              <Text className="text-xl">🚗</Text>
            </View>
            <View>
              <Text className="font-semibold text-gray-800">{plazasTotales}</Text>
              <Text className="text-sm text-gray-500">Plazas totales</Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-md bg-gray-100 items-center justify-center mr-3">
              <Text className="text-xl">📌</Text>
            </View>
            <View>
              <Text className="font-semibold text-gray-800">{plazasOcupadas}</Text>
              <Text className="text-sm text-gray-500">Plazas ocupadas ahora</Text>
            </View>
          </View>
        </View>
      </View>
{/*
       
      <View className="mb-6 flex-row justify-between">
        <TouchableOpacity className="flex-1 mr-2 rounded-lg p-3 items-center" style={{ backgroundColor: colores.azul }}>
          <Text className="text-white font-semibold">Ver reservas</Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-1 ml-2 rounded-lg p-3 items-center" style={{ backgroundColor: colores.amarillo }}>
          <Text className="text-white font-semibold">Ver calificaciones</Text>
        </TouchableOpacity>
      </View> */}
    </ScrollView>
  );
}
