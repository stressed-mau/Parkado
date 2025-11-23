import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Logo from "../assets/Logo";
import DashboardParqueo from "./Dashboard"; // importamos el dashboard inline
import AdminParqueo from "./AdminParqueo"; // Cambio de ParqueoDetalle a AdminParqueo
import EditarEstacionamiento from "./EditarParqueo"; // Importamos el componente de edición inline
import { useMapa } from '../hooks/useMapa'; // Asegúrate de tener esta función exportada correctamente

const BACKEND_BASE = "https://parkado-backend.vercel.app";
const colores = {
  azul: "#7BB3CD",
  naranja: "#FD721D",
  crema: "#F6EEE4",
  amarillo: "#F2BD2B",
};

type Props = {
  ownerId?: number;
  onClose?: () => void;
  placeholderRemote?: string;
};

export default function ParqueoPorPropietario({
  ownerId = 2,
  onClose,
  placeholderRemote = "https://via.placeholder.com/150?text=No+image",
}: Props) {
  const [parqueos, setParqueos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API = `${BACKEND_BASE}/api/parqueos/owner/${ownerId}`;

  // Mostrar dashboard inline para un parqueo seleccionado
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedParqueoId, setSelectedParqueoId] = useState<number | null>(null);

  // Mostrar detalle (admin) inline para un parqueo seleccionado
  const [showParqueoDetalle, setShowParqueoDetalle] = useState(false);
  const [showEditarParqueo, setShowEditarParqueo] = useState(false); // Nuevo estado para editar inline

  // Llamada a la función useMapa para obtener la función de recarga
  const { reloadParqueos } = useMapa(); // Asume que useMapa tiene reloadParqueos

  useEffect(() => {
    let mounted = true;

    // Al entrar: ocultar el botón Cerrar sesión en el resto de la app
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
      // Al salir: restaurar visibilidad del botón Cerrar sesión
      AsyncStorage.removeItem("hideLogout").catch(() => {});
    };
  }, [API]);

  const eliminarParqueo = async (parqueoId: number) => {
    if (!ownerId) {
      Alert.alert("Error", "No se pudo obtener el ownerId.");
      return;
    }

    try {
      setLoading(true);

      // Llamada a la API DELETE
      await axios.delete(`${BACKEND_BASE}/api/parqueos/${parqueoId}`, {
        headers: { Authorization: `Bearer ${ownerId}` },
        data: { userId: ownerId }, // Usamos ownerId en lugar de userId
      });

      // Actualizar la lista de parqueos después de la eliminación
      const updatedParqueos = parqueos.filter((p) => p.id !== parqueoId);
      setParqueos(updatedParqueos);

      // Recargar el mapa para reflejar los cambios
      await reloadParqueos(); // Recarga los parqueos desde la API

      Alert.alert("Éxito", "Parqueo eliminado correctamente.");
    } catch (error) {
      console.error("Error al eliminar parqueo:", error);
      Alert.alert("Error", "No se pudo eliminar el parqueo.");
    } finally {
      setLoading(false);
    }
  };

  // Si el usuario abrió el dashboard para un parqueo seleccionado, renderizamos esa vista inline
  if (showDashboard && selectedParqueoId !== null) {
    return (
      <DashboardParqueo
        parqueoId={selectedParqueoId}
        onClose={() => {
          // volver a la lista de parqueos
          setShowDashboard(false);
          setSelectedParqueoId(null);
        }}
      />
    );
  }

  // Si el usuario abrió el detalle (admin) para un parqueo seleccionado, renderizamos esa vista inline
  if (showParqueoDetalle && selectedParqueoId !== null) {
    return (
      <AdminParqueo // Aquí hemos cambiado ParqueoDetalle por AdminParqueo
        parqueoId={selectedParqueoId}
        onClose={() => {
          // volver a la lista de parqueos
          setShowParqueoDetalle(false);
          setSelectedParqueoId(null);
        }}
      />
    );
  }

  // Si el usuario quiere editar el parqueo inline, mostramos el componente de edición
  if (showEditarParqueo && selectedParqueoId !== null) {
    return (
      <EditarEstacionamiento
        route={{ params: { id: selectedParqueoId } }} // Pasamos la id del parqueo al editar
        onClose={() => setShowEditarParqueo(false)} // Función para cerrar la vista de edición
      />
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colores.crema }]}>
        <ActivityIndicator size="large" color={colores.naranja} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colores.crema, padding: 16 }]}>
        <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
        <TouchableOpacity onPress={() => onClose?.()} style={styles.backButton}>
          <Text style={{ color: "white", fontWeight: "700" }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colores.crema }} contentContainerStyle={{ padding: 16 }}>
      {/* header con posible boton cerrar (onClose) */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        {onClose ? (
          <TouchableOpacity onPress={onClose} style={{ marginRight: 10 }}>
            <MaterialCommunityIcons name="arrow-left" size={26} color="#111" />
          </TouchableOpacity>
        ) : null}
        <Logo width={64} height={64} />
        <View style={{ marginLeft: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colores.azul }}>Panel Administrador</Text>
          <Text style={{ color: "#6B7280" }}>Tus parqueos</Text>
        </View>
      </View>

      {parqueos.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Text style={{ color: "#6B7280" }}>No tienes parqueos registrados aún.</Text>
        </View>
      ) : (
        parqueos.map((p) => {
          const rawImagen = p?.foto ?? p?.imagen ?? p?.imagenUrl ?? (Array.isArray(p?.fotos) ? p.fotos : null);
          const imagen = resolveImageUrl(rawImagen, BACKEND_BASE, placeholderRemote);
          const nombre = p?.nombre || "Nombre parqueo";
          const direccion = p?.direccion || p?.ubicacion || "Dirección no disponible";

          return (
            <View key={p.id ?? `${nombre}-${Math.random()}`} style={styles.card}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ImageFallback uri={imagen} placeholderRemote={placeholderRemote} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontWeight: "800", fontSize: 16 }}>{nombre}</Text>
                  <Text style={{ color: "#6B7280", marginTop: 4 }}>{direccion}</Text>

                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedParqueoId(p?.id ?? null);
                        setShowEditarParqueo(true); // Mostrar formulario de edición inline
                      }}
                      style={styles.iconBtnBlue}
                    >
                      <MaterialCommunityIcons name="pencil" size={20} color={colores.azul} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        // Aquí abrimos el dashboard inline pasando el id del parqueo
                        setSelectedParqueoId(p?.id ?? null);
                        setShowDashboard(true);
                      }}
                      style={[styles.iconBtn, { borderColor: colores.azul, marginLeft: 8 }]}
                      accessibilityLabel={`Ir al dashboard de ${nombre}`}
                    >
                      <MaterialCommunityIcons name="chart-bar" size={20} color={colores.azul} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        // <-- AQUÍ: abrimos AdminParqueo inline (admin) con la id correspondiente
                        setSelectedParqueoId(p?.id ?? null);
                        setShowParqueoDetalle(true);
                      }}
                      style={[styles.iconBtn, { borderColor: colores.azul, marginLeft: 8 }]}
                      accessibilityLabel={`Administrar ${nombre}`}
                    >
                      <MaterialCommunityIcons name="cog-outline" size={20} color={colores.azul} />
                    </TouchableOpacity>

                    <View style={{ flex: 1 }} />

                    <TouchableOpacity
                      onPress={() => eliminarParqueo(p.id)} // Eliminar parqueo
                      style={[styles.iconBtn, { borderColor: colores.naranja }]}
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
    <View style={{ width: 80, height: 80, borderRadius: 8, overflow: "hidden", backgroundColor: "#f2f2f2" }}>
      {loading && (
        <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      )}

      {src ? (
        <Image
          source={isLocalAsset ? src : buildSource(src)}
          style={{ width: 80, height: 80 }}
          resizeMode="cover"
          onLoad={() => { setLoading(false); setErrored(false); }}
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
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 24 }}>📷</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },
  backButton: {
    marginTop: 12,
    backgroundColor: colores.azul,
    padding: 10,
    borderRadius: 8,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colores.azul,
    backgroundColor: "#fff",
  },
  iconBtnBlue: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colores.azul,
    backgroundColor: "#fff",
  },
});
