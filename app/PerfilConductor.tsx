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

export default function PerfilUsuario({ navigation }) {
  const [usuario, setUsuario] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);

  const colores = {
    azul: "#7BB3CD",
    naranja: "#FD721D",
    crema: "#F6EEE4",
  };

  const BACKEND_BASE = "https://parkado-backend.vercel.app";

  const placeholderLocal =
    "file:///mnt/data/e6160939-b67a-4a41-8e50-9802c507f7e1.png";

  // 🔥 CARGAR ID Y TOKEN DESDE ASYNC_STORAGE
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("userData");
        if (!raw) {
          Alert.alert("Error", "No estás autenticado.");
          return;
        }

        const userData = JSON.parse(raw);

        setUserId(userData.id);
        setToken(userData.token);
      } catch (e) {
        console.error("Error leyendo userData:", e);
      }
    })();
  }, []);

  // 🔥 Cargar datos cuando ya tengamos id y token
  useEffect(() => {
    if (!userId || !token) return;

    async function fetchData() {
      try {
        const USUARIO_API = `${BACKEND_BASE}/api/usuarios/${userId}`;
        const RESERVAS_API = `${BACKEND_BASE}/api/reservas/usuario/${userId}`;

        const [resUser, resReservas] = await Promise.all([
          axios.get(USUARIO_API, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(RESERVAS_API, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setUsuario(resUser.data);

        const array = Array.isArray(resReservas.data)
          ? resReservas.data
          : resReservas.data?.data || [];

        setReservas(array);
      } catch (e) {
        console.log("Error cargando datos:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId, token]);

  // Función para cancelar la reserva y actualizar el estado de la plaza
  const cancelarReserva = async (reservaId, plazaId) => {
    try {
      setLoading(true);

      // Realizamos la solicitud para cancelar la reserva
      await axios.delete(`${BACKEND_BASE}/api/reservas/${reservaId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { usuarioId: userId }
      });

      // Luego, actualizamos el estado de la plaza a "DISPONIBLE"
      await axios.patch(`${BACKEND_BASE}/api/plazas/${plazaId}`, {
        userId: userId,
        estado: "DISPONIBLE"
      });

      // Refrescamos las reservas después de la cancelación
      const RESERVAS_API = `${BACKEND_BASE}/api/reservas/usuario/${userId}`;
      const resReservas = await axios.get(RESERVAS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const array = Array.isArray(resReservas.data)
        ? resReservas.data
        : resReservas.data?.data || [];

      setReservas(array);
      Alert.alert("Éxito", "Reserva cancelada y plaza disponible.");
    } catch (error) {
      console.error("Error al cancelar reserva:", error);
      Alert.alert("Error", "No se pudo cancelar la reserva.");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colores.naranja} />
      </View>
    );

  return (
    <ScrollView
      className="flex-1 px-5 pt-6"
      style={{ backgroundColor: colores.crema }}
    >
      {/* LOGO */}
      <View className="flex-row items-center mb-4">
        <Logo width={85} height={85} />
      </View>

      {/* Nombre */}
      <View className="mb-6">
        <Text className="text-sm text-gray-600">Nombre</Text>
        <Text className="text-xl font-bold">
          {usuario?.nombres} {usuario?.apellidos}
        </Text>
      </View>

      {/* Teléfono */}
      <View className="flex-row items-center mb-4">
        <Text className="text-2xl mr-3">📞</Text>
        <View>
          <Text className="font-semibold text-base">Teléfono</Text>
          <Text className="text-sm">{usuario?.telefono}</Text>
        </View>
      </View>

      {/* Email */}
      <View className="flex-row items-center mb-4">
        <Text className="text-2xl mr-3">✉️</Text>
        <View>
          <Text className="font-semibold text-base">Correo electrónico</Text>
          <Text className="text-sm">{usuario?.correoElectronico}</Text>
        </View>
      </View>

      {/* Título */}
      <Text className="text-lg font-bold mb-2">Historial de reservas</Text>

      {/* Contenedor */}
      <View className="rounded-xl border border-gray-400 bg-white p-3 min-h-[80px]">
        {reservas.length === 0 ? (
          <Text className="text-sm text-gray-600">No hay reservas aún.</Text>
        ) : (
          reservas.map((reserva) => {
            const parqueo = reserva?.plaza?.parqueo || reserva?.parqueo || {};
            const rawImagen =
              parqueo?.fotos?.[0]?.url || placeholderLocal;  // Cambié esto para usar la primera imagen

            const imagenParqueo = resolveImageUrl(
              rawImagen,
              BACKEND_BASE,
              placeholderLocal
            );

            const nombre = parqueo?.nombre || "Nombre no disponible";
            const direccion = parqueo?.direccion || "Ubicación no disponible";
            const nroPlaza =
              reserva?.plaza?.nroPlaza || reserva?.nroPlaza || "N/A";

            const placa =
              reserva?.matriculaVehiculo ||
              reserva?.vehiculo?.placa ||
              reserva?.placa ||
              "N/D";

            const tipoVehiculo = getTipoVehiculo(reserva);

            const desde = reserva?.fechaHoraIni
              ? formatDate(reserva.fechaHoraIni)
              : null;
            const hasta = reserva?.fechaHoraFin
              ? formatDate(reserva.fechaHoraFin)
              : null;

            const plazaId = reserva?.plaza?.id || reserva?.plaza?._id;

            return (
              <View
                key={reserva?.id}
                className="mb-4 rounded-xl border border-gray-300 bg-white"
              >
                <View className="flex-row items-center p-3 bg-gray-100 rounded-xl">
                  <ImageFallback
                    uri={imagenParqueo}
                    placeholderLocal={placeholderLocal}
                  />

                  <View className="flex-1">
                    <Text className="font-bold text-[16px]">{nombre}</Text>
                    <Text className="text-gray-700 text-[13px] mt-[4px]">
                      {direccion}
                    </Text>

                    <Text className="text-[12px] mt-2">
                      <Text className="font-semibold">Plaza:</Text> {nroPlaza}
                    </Text>

                    <Text className="text-[12px] mt-1">
                      <Text className="font-semibold">Placa:</Text> {placa}
                    </Text>

                    <Text className="text-[12px] mt-1">
                      <Text className="font-semibold">Tipo vehículo:</Text>{" "}
                      {tipoVehiculo}
                    </Text>

                    {desde && (
                      <Text className="text-[12px] mt-2">
                        <Text className="font-semibold">Desde:</Text> {desde}
                      </Text>
                    )}

                    {hasta && (
                      <Text className="text-[12px] mt-1">
                        <Text className="font-semibold">Hasta:</Text> {hasta}
                      </Text>
                    )}

                    <TouchableOpacity 
  onPress={() => cancelarReserva(reserva.id, plazaId)} 
  className="mt-3 bg-[#FD721D] text-[#fff]  px-4 py-2 rounded-lg"
>
  <Text className="text-center text-[#fff] font-bold">Cancelar Reserva</Text>
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

/** Normaliza URL */
function resolveImageUrl(url, base, fallback) {
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

/** Imagen con fallback */
function ImageFallback({ uri, placeholderLocal }) {
  const [src, setSrc] = useState(uri);

  return (
    <Image
      source={{ uri: src }}
      className="w-16 h-16 rounded-lg mr-3 bg-gray-300"
      resizeMode="cover"
      onError={() => {
        if (src !== placeholderLocal) setSrc(placeholderLocal);
      }}
    />
  );
}

/** Formato de fecha */
function formatDate(iso) {
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

/** Devuelve "Auto" | "Moto" | "N/D" */
function getTipoVehiculo(reserva) {
  const candidates = [
    reserva?.tipoVehiculo,
    reserva?.vehiculo?.tipoVehiculoId,
    reserva?.vehiculo?.tipo,
    reserva?.vehiculoTipo,
    reserva?.tipoVehiculoId,
  ];

  let raw = candidates.find((c) => c != null);

  if (raw == null) {
    if (reserva?.vehiculo?.tipo?.id) raw = reserva.vehiculo.tipo.id;
    else if (reserva?.tipo?.id) raw = reserva.tipo.id;
  }

  const idNum = Number(raw);

  if (!Number.isNaN(idNum)) {
    if (idNum === 1) return "Auto";
    if (idNum === 2) return "Moto";
  }

  const rawStr = String(raw || "").toLowerCase();
  if (rawStr.includes("auto") || rawStr.includes("car")) return "Auto";
  if (rawStr.includes("moto") || rawStr.includes("motor")) return "Moto";

  return "N/D";
}
