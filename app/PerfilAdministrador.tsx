// app/PerfilAdministrador.tsx
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Logo from "../assets/Logo";

export default function PerfilAdministrador({ navigation }: any) {
  const [usuario, setUsuario] = useState<any>(null);
  const [parqueos, setParqueos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const colores = {
    azul: "#7BB3CD",
    naranja: "#FD721D",
    crema: "#F6EEE4",
  };

  const BACKEND_BASE = "https://parkado-backend.vercel.app";
  // placeholder local — archivo subido al contenedor (ruta en tu historial)
  const placeholderLocal = "file:///mnt/data/fa223f71-35a3-45cb-bf93-68ab68bf477e.png";

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const raw = await AsyncStorage.getItem("userData");
        if (!raw) {
          Alert.alert("No autenticado", "Por favor inicia sesión.");
          setLoading(false);
          return;
        }

        const userData = JSON.parse(raw);
        const ownerId = userData?.id;
        const token = userData?.token;

        if (!ownerId) {
          Alert.alert("Error", "No se encontró el ID del propietario.");
          setLoading(false);
          return;
        }

        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        // trae info del usuario (propietario) y sus parqueos
        const [resUser, resParqueos] = await Promise.all([
          axios.get(`${BACKEND_BASE}/api/usuarios/${ownerId}`, { headers }),
          axios.get(`${BACKEND_BASE}/api/parqueos/owner/${ownerId}`, { headers }),
        ]);

        if (!mounted) return;
        setUsuario(resUser.data);

        const arr = Array.isArray(resParqueos.data)
          ? resParqueos.data
          : resParqueos.data?.data || [];
        setParqueos(arr);
      } catch (e) {
        console.error("Error cargando PerfilAdministrador:", e);
        Alert.alert("Error", "No se pudo cargar los datos. Reintenta más tarde.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  function navigateOrAlert(routeName: string, params?: any) {
    if (navigation && typeof navigation.navigate === "function") {
      navigation.navigate(routeName, params);
    } else {
      Alert.alert(
        "Navegar a:",
        `Implementa navigation.navigate('${routeName}') para abrir esta pantalla.${params ? "\nParams: " + JSON.stringify(params) : ""
        }`
      );
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colores.crema }}>
        <ActivityIndicator size="large" color={colores.naranja} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-5 pt-6" style={{ backgroundColor: colores.crema }}>
      {/* Header: logo + título debajo */}
      <View className="items-center mb-6">
        <Logo width={85} height={85} />
        <Text className="text-xl font-bold mt-3" style={{ color: colores.azul }}>
          Panel Administrador
        </Text>
        <Text className="text-sm text-gray-600">Gestiona tus parqueos</Text>
      </View>

      {/* Datos del propietario */}
      <View className="mb-6 rounded-xl border border-gray-300 bg-white p-4">
        <Text className="text-sm text-gray-500">Nombre</Text>
        <Text className="text-lg font-bold mb-2">
          {usuario?.nombres} {usuario?.apellidos}
        </Text>

        <View className="flex-row items-center mb-1">
          <Text className="text-2xl mr-3">📞</Text>
          <View>
            <Text className="font-semibold text-base">Teléfono</Text>
            <Text className="text-sm">{usuario?.telefono ?? "N/D"}</Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <Text className="text-2xl mr-3">✉️</Text>
          <View>
            <Text className="font-semibold text-base">Correo</Text>
            <Text className="text-sm">{usuario?.correoElectronico ?? "N/D"}</Text>
          </View>
        </View>
      </View>

      {/* Botones de navegación */}
      <View className="mb-6 flex-row justify-between">
        <TouchableOpacity
          className="flex-1 mr-2 rounded-xl py-3 items-center"
          style={{ backgroundColor: colores.azul }}
          onPress={() => navigateOrAlert("RegistrarParqueo")}
        >
          <Text className="text-white font-semibold">Registrar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 mx-2 rounded-xl py-3 items-center"
          style={{ backgroundColor: colores.naranja }}
          onPress={() => navigateOrAlert("DashboardPropietario", { propietarioId: usuario?.id })}
        >
          <Text className="text-white font-semibold">Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 ml-2 rounded-xl py-3 items-center"
          style={{ backgroundColor: colores.crema, borderWidth: 1, borderColor: "#D1D5DB" }}
          onPress={() => navigateOrAlert("MisParqueos", { propietarioId: usuario?.id })}
        >
          <Text className="text-gray-800 font-semibold">Mis parqueos</Text>
        </TouchableOpacity>
      </View>

      {/* Resumen rápido de parqueos */}
      <View className="mb-4 rounded-xl border border-gray-300 bg-white p-3">
        <Text className="font-semibold text-gray-700 mb-2">Tus parqueos</Text>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-14 h-14 rounded-md bg-gray-100 items-center justify-center mr-3">
              <Text className="text-2xl">📍</Text>
            </View>
            <View>
              <Text className="font-semibold text-gray-800">{parqueos.length}</Text>
              <Text className="text-sm text-gray-500">Parqueos registrados</Text>
            </View>
          </View>

          <TouchableOpacity
            className="px-3 py-2 rounded-md bg-gray-50 border"
            onPress={() => navigateOrAlert("MisParqueos", { propietarioId: usuario?.id })}
          >
            <Text className="text-sm font-semibold">Ver todos</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Listado breve de parqueos (mini tarjetas) */}
      <View className="mb-8">
        {parqueos.length === 0 ? (
          <Text className="text-sm text-gray-600">No hay parqueos registrados.</Text>
        ) : (
          parqueos.map((p) => {
            const rawImagen = p?.foto || p?.imagen || p?.imagenUrl || (Array.isArray(p?.fotos) ? p.fotos[0] : null) || null;
            const imagen = resolveImageUrl(rawImagen, BACKEND_BASE, placeholderLocal);
            const nombre = p?.nombre || "Sin nombre";
            const direccion = p?.direccion || "Dirección no disponible";

            return (
              <View key={p.id} className="mb-4 rounded-xl bg-white overflow-hidden border border-gray-200">
                <View className="flex-row items-center p-3 bg-gray-50">
                  <Image
                    source={{ uri: imagen }}
                    className="w-16 h-16 rounded-lg mr-3 bg-gray-200"
                    resizeMode="cover"
                    onError={() => {}}
                  />

                  <View className="flex-1">
                    <Text className="font-bold text-[16px]">{nombre}</Text>
                    <Text className="text-sm text-gray-700 mt-1">{direccion}</Text>
                  </View>

                  <View className="ml-3">
                    <TouchableOpacity
                      className="mb-2 p-2 rounded-md bg-white border"
                      onPress={() => navigateOrAlert("EditarParqueo", { parqueoId: p.id })}
                    >
                      <Text className="text-lg">✏️</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="p-2 rounded-md bg-white border"
                      onPress={() => navigateOrAlert("DashboardParqueo", { parqueoId: p.id })}
                    >
                      <Text className="text-lg">📊</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

/* HELPERS */
function resolveImageUrl(url: any, base: string, fallback: string) {
  if (!url) return fallback;
  const uri = String(url).trim();
  if (
    uri.startsWith("http://") ||
    uri.startsWith("https://") ||
    uri.startsWith("data:") ||
    uri.startsWith("file://")
  ) {
    return uri;
  }
  const sep = uri.startsWith("/") ? "" : "/";
  return `${base}${sep}${uri}`;
}

function formatDate(iso: any) {
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yy} ${hh}:${mi}`;
  } catch {
    return iso;
  }
}
