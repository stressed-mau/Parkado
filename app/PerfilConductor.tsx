import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Logo from "../assets/Logo";

export default function PerfilUsuario() {
  const id = 17;
  const [usuario, setUsuario] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  const colores = {
    azul: "#7BB3CD",
    naranja: "#FD721D",
    crema: "#F6EEE4",
  };

  const BACKEND_BASE = "https://parkado-backend.vercel.app";

  const placeholderLocal =
    "file:///mnt/data/e6160939-b67a-4a41-8e50-9802c507f7e1.png";

  const USUARIO_API = `${BACKEND_BASE}/api/usuarios/${id}`;
  const RESERVAS_API = `${BACKEND_BASE}/api/reservas/usuario/${id}`;

  useEffect(() => {
    async function fetchData() {
      try {
        const [resUser, resReservas] = await Promise.all([
          axios.get(USUARIO_API),
          axios.get(RESERVAS_API),
        ]);

        setUsuario(resUser.data);

        const array = Array.isArray(resReservas.data)
          ? resReservas.data
          : resReservas.data?.data || [];

        setReservas(array);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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

      {/* Botón editar */}
      <TouchableOpacity
        className="flex-row items-center justify-center py-3 rounded-xl mb-6"
        style={{ backgroundColor: colores.azul }}
      >
        <Text className="text-white font-semibold text-lg">Editar perfil</Text>
      </TouchableOpacity>

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
              parqueo?.foto ||
              parqueo?.imagen ||
              parqueo?.imagenUrl ||
              parqueo?.fotos?.[0] ||
              null;

            const imagenParqueo = resolveImageUrl(
              rawImagen,
              BACKEND_BASE,
              placeholderLocal
            );

            const nombre = parqueo?.nombre || "Nombre no disponible";
            const direccion = parqueo?.direccion || "Ubicación no disponible";
            const nroPlaza = reserva?.plaza?.nroPlaza || reserva?.nroPlaza || "N/A";

            // PLACA
            const placa =
              reserva?.matriculaVehiculo ||
              reserva?.vehiculo?.placa ||
              reserva?.placa ||
              "N/D";

            // 🔥 TIPO VEHÍCULO: usa helper robusto
            const tipoVehiculo = getTipoVehiculo(reserva);

            const desde = reserva?.fechaHoraIni
              ? formatDate(reserva.fechaHoraIni)
              : null;
            const hasta = reserva?.fechaHoraFin
              ? formatDate(reserva.fechaHoraFin)
              : null;

            const key = reserva?.id || reserva?._id || Math.random().toString();

            return (
              <View
                key={key}
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

/** Devuelve "Auto" | "Moto" | "N/D" a partir de la reserva/vehículo */
function getTipoVehiculo(reserva) {
  // intenta varias rutas donde la API podría devolver el id
  const candidates = [
    reserva?.tipoVehiculo,
    reserva?.vehiculo?.tipoVehiculoId,
    reserva?.vehiculo?.tipo,
    reserva?.vehiculoTipo,
    reserva?.tipoVehiculoId,
  ];

  // toma el primero no nulo/undefined
  let raw = candidates.find((c) => c !== undefined && c !== null);

  // si sigue undefined, intenta campos con strings (por si viene anidado distinto)
  if (raw === undefined || raw === null) {
    // por si acaso la API en vez del id devuelve un objeto con id: { id: 1 }
    if (reserva?.vehiculo?.tipo?.id) raw = reserva.vehiculo.tipo.id;
    else if (reserva?.tipo?.id) raw = reserva.tipo.id;
  }

  // fuerza número (si viene "1" o "2")
  const idNum = Number(raw);

  if (!Number.isNaN(idNum)) {
    if (idNum === 1) return "Auto";
    if (idNum === 2) return "Moto";
  }

  // por último, si la API devuelve palabras en texto
  const rawStr = String(raw || "").toLowerCase();
  if (rawStr.includes("auto") || rawStr.includes("car")) return "Auto";
  if (rawStr.includes("moto") || rawStr.includes("motor")) return "Moto";

  return "N/D";
}