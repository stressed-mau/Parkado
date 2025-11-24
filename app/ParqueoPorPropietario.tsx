import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Logo from "../assets/Logo";
import { useMapa } from "../hooks/useMapa";
import AdminParqueo from "./AdminParqueo";
import DashboardParqueo from "./Dashboard";
import EditarEstacionamiento from "./EditarParqueo";
import RegistrarParqueo from "./RegistroParqueo";

const BACKEND_BASE = "https://parkado-backend.vercel.app";
const colores = {
  azul: "#7BB3CD",
  naranja: "#FD721D",
  crema: "#F6EEE4",
};

type Props = {
  ownerId?: number;
  onClose?: () => void;
  placeholderRemote?: string;
};

export default function ParqueoPorPropietario({
  ownerId = 2,
  onClose,
  placeholderRemote = "/mnt/data/50899fe3-5726-4356-bb3a-63fbda202474.png",
}: Props) {
  const [parqueos, setParqueos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API = `${BACKEND_BASE}/api/parqueos/owner/${ownerId}`;

  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedParqueoId, setSelectedParqueoId] = useState<number | null>(null);
  const [showParqueoDetalle, setShowParqueoDetalle] = useState(false);
  const [showEditarParqueo, setShowEditarParqueo] = useState(false);
  const [showRegistrarParqueo, setShowRegistrarParqueo] = useState(false);

  const { reloadParqueos } = useMapa();

  useEffect(() => {
    let mounted = true;
    AsyncStorage.setItem("hideLogout", "true").catch(() => {});

    const fetchParqueos = async () => {
      try {
        const res = await axios.get(API);
        if (!mounted) return;
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setParqueos(data);
      } catch (e) {
        console.error("Error fetching parqueos owner:", e);
        if (mounted) setError("No se pudieron cargar los parqueos.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchParqueos();

    return () => {
      mounted = false;
      AsyncStorage.removeItem("hideLogout").catch(() => {});
    };
  }, [API]);

  const confirmarEliminar = (parqueoId: number, nombre?: string) => {
    Alert.alert(
      `Eliminar parqueo`,
      `¿Estás seguro que quieres eliminar "${nombre ?? "este parqueo"}"? Esta acción no se puede deshacer.`,
      [
        { text: "No", style: "cancel" },
        { text: "Sí, eliminar", style: "destructive", onPress: () => eliminarParqueo(parqueoId) },
      ],
      { cancelable: true }
    );
  };

  const eliminarParqueo = async (parqueoId: number) => {
    if (!ownerId) {
      Alert.alert("Error", "No se pudo obtener el ownerId.");
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${BACKEND_BASE}/api/parqueos/${parqueoId}`, {
        headers: { Authorization: `Bearer ${ownerId}` },
        data: { userId: ownerId },
      });

      setParqueos((prev) => prev.filter((p) => p.id !== parqueoId));

      try {
        if (typeof reloadParqueos === "function") await reloadParqueos();
      } catch (err) {
        console.warn("reloadParqueos falló:", err);
      }

      Alert.alert("Éxito", "Parqueo eliminado correctamente.");
    } catch (error) {
      console.error("Error al eliminar parqueo:", error);
      Alert.alert("Error", "No se pudo eliminar el parqueo.");
    } finally {
      setLoading(false);
    }
  };

  if (showDashboard && selectedParqueoId !== null) {
    return (
      <DashboardParqueo
        parqueoId={selectedParqueoId}
        onClose={() => {
          setShowDashboard(false);
          setSelectedParqueoId(null);
        }}
      />
    );
  }

  if (showParqueoDetalle && selectedParqueoId !== null) {
    return (
      <AdminParqueo
        parqueoId={selectedParqueoId}
        onClose={() => {
          setShowParqueoDetalle(false);
          setSelectedParqueoId(null);
        }}
      />
    );
  }

  if (showEditarParqueo && selectedParqueoId !== null) {
    return <EditarEstacionamiento route={{ params: { id: selectedParqueoId } }} onClose={() => setShowEditarParqueo(false)} />;
  }

  if (showRegistrarParqueo) {
    return <RegistrarParqueo onClose={() => setShowRegistrarParqueo(false)} />;
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colores.crema }}>
        <ActivityIndicator size="large" color={colores.naranja} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4" style={{ backgroundColor: colores.crema }}>
        <Text className="text-red-500 text-center">{error}</Text>
        <TouchableOpacity onPress={() => onClose?.()} className="mt-3 bg-[#7BB3CD] px-4 py-2 rounded-md">
          <Text className="text-white font-bold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colores.crema }} contentContainerStyle={{ padding: 16 }}>
      {/* ---------- HEADER FIX: centro absoluto para evitar solape ---------- */}
      {/* ---------- HEADER: logo -> título -> botón (vertical) ---------- */}
<View className="mb-4">
  {/* Row superior: back icon (alineado a la izquierda) */}
  <View className="flex-row items-center">
    {onClose ? (
      <TouchableOpacity onPress={onClose} className="mr-2">
        <MaterialCommunityIcons name="arrow-left" size={26} color="#111" />
      </TouchableOpacity>
    ) : null}
  </View>

  {/* Logo centrado en su propia línea */}
  <View className="items-center mt-1">
    {/* Reducimos tamaño del logo para que no empuje */}
    <View className="w-14 h-14">
      <Logo width={56} height={56} />
    </View>
  </View>

  {/* Título y subtítulo centrados (su propia línea) */}
  <View className="items-center mt-2">
    <Text
      className="text-[#7BB3CD] font-extrabold text-lg"
      numberOfLines={1}
      ellipsizeMode="tail"
      style={{ maxWidth: 260 }}
    >
      Panel Administrador
    </Text>
    <Text className="text-gray-400">Tus parqueos</Text>
  </View>

  {/* Botón Registrar debajo del título (centrado). Cámbialo a right-align si lo prefieres */}
  <View className="items-center mt-3">
    <TouchableOpacity
      onPress={() => setShowRegistrarParqueo(true)}
      className="bg-[#7BB3CD] px-4 py-2 rounded-md"
      accessibilityLabel="Registrar parqueo"
    >
      <Text className="text-white font-bold">Registrar</Text>
    </TouchableOpacity>
  </View>
</View>


      {/* ---------- CONTENIDO ---------- */}
      {parqueos.length === 0 ? (
        <View className="items-center mt-5">
          <Text className="text-gray-400">No tienes parqueos registrados aún.</Text>
        </View>
      ) : (
        parqueos.map((p) => {
          const rawImagen =
            p?.foto ?? p?.imagen ?? p?.imagenUrl ?? (Array.isArray(p?.fotos) ? p.fotos : null);
          const imagen = resolveImageUrl(rawImagen, BACKEND_BASE, placeholderRemote);
          const nombre = p?.nombre || "Nombre parqueo";
          const direccion = p?.direccion || p?.ubicacion || "Dirección no disponible";

          return (
            <View key={p.id ?? `${nombre}-${Math.random()}`} className="mb-3 rounded-xl p-3 bg-white border border-gray-200">
              <View className="flex-row items-center">
                <ImageFallback uri={imagen} placeholderRemote={placeholderRemote} />
                <View className="flex-1 ml-3">
                  <Text className="font-extrabold text-base">{nombre}</Text>
                  <Text className="text-gray-400 mt-1">{direccion}</Text>

                  <View className="flex-row items-center mt-3">
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedParqueoId(p?.id ?? null);
                        setShowEditarParqueo(true);
                      }}
                      className="p-2 rounded-lg border border-[#7BB3CD] bg-white"
                    >
                      <MaterialCommunityIcons name="pencil" size={20} color={colores.azul} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setSelectedParqueoId(p?.id ?? null);
                        setShowDashboard(true);
                      }}
                      className="p-2 rounded-lg border border-[#7BB3CD] bg-white ml-2"
                      accessibilityLabel={`Ir al dashboard de ${nombre}`}
                    >
                      <MaterialCommunityIcons name="chart-bar" size={20} color={colores.azul} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setSelectedParqueoId(p?.id ?? null);
                        setShowParqueoDetalle(true);
                      }}
                      className="p-2 rounded-lg border border-[#7BB3CD] bg-white ml-2"
                      accessibilityLabel={`Administrar ${nombre}`}
                    >
                      <MaterialCommunityIcons name="cog-outline" size={20} color={colores.azul} />
                    </TouchableOpacity>

                    <View className="flex-1" />

                    <TouchableOpacity
                      onPress={() => confirmarEliminar(p.id, nombre)}
                      className="p-2 rounded-lg border border-[#FD721D] bg-white"
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color={colores.naranja} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

/* helpers */
function resolveImageUrl(raw: any, backendBase: string, placeholder: string) {
  if (!raw) return placeholder;
  if (Array.isArray(raw)) {
    const first = raw.find(Boolean);
    return resolveImageUrl(first, backendBase, placeholder);
  }
  if (typeof raw === "object" && raw !== null) {
    const possible = raw.url || raw.uri || raw.path || raw.filename;
    return resolveImageUrl(possible, backendBase, placeholder);
  }
  const trimmed = String(raw).trim();
  if (!trimmed) return placeholder;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("file://")
  ) {
    return trimmed;
  }
  const sep = trimmed.startsWith("/") ? "" : "/";
  return `${backendBase}${sep}${trimmed}`;
}

/* ImageFallback */
function ImageFallback({ uri, placeholderRemote }: any) {
  const normalize = (u: any) => {
    if (!u) return null;
    if (Array.isArray(u)) return u.find(Boolean) || null;
    if (typeof u === "object") return u.url || u.uri || null;
    return String(u);
  };

  const initial = normalize(uri) || placeholderRemote || null;
  const [src, setSrc] = useState<any>(initial);
  const [loading, setLoading] = useState(Boolean(initial));
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    const next = normalize(uri) || placeholderRemote || null;
    setErrored(false);
    setLoading(Boolean(next));
    setSrc(next);
  }, [uri, placeholderRemote]);

  const buildSource = (u: any) => {
    if (!u) return null;
    if (typeof u === "number") return u;
    return { uri: String(u) };
  };

  const isLocalAsset = typeof src === "number";

  return (
    <View className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
      {loading && (
        <View className="absolute inset-0 items-center justify-center">
          <ActivityIndicator />
        </View>
      )}

      {src ? (
        <Image
          source={isLocalAsset ? src : buildSource(src)}
          className="w-20 h-20"
          resizeMode="cover"
          onLoad={() => {
            setLoading(false);
            setErrored(false);
          }}
          onError={(e) => {
            console.warn("[ImageFallback] onError for", src, e?.nativeEvent ?? e);
            setLoading(false);
            setErrored(true);
            if (placeholderRemote && src !== placeholderRemote) {
              setSrc(placeholderRemote);
              setLoading(true);
              return;
            }
            setSrc(null);
          }}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-2xl">📷</Text>
        </View>
      )}
    </View>
  );
}
