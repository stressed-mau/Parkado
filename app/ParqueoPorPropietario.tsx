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
import DashboardParqueo from "./Dashboard";
import AdminParqueo from "./AdminParqueo";
import EditarEstacionamiento from "./EditarParqueo";
import RegistrarParqueo from "./RegistroParqueo";
import { useMapa } from "../hooks/useMapa";

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
  const { reloadParqueos } = useMapa();

  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedParqueoId, setSelectedParqueoId] = useState<number | null>(null);
  const [showParqueoDetalle, setShowParqueoDetalle] = useState(false);
  const [showEditarParqueo, setShowEditarParqueo] = useState(false);
  const [showRegistrarParqueo, setShowRegistrarParqueo] = useState(false);

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

      const updatedParqueos = parqueos.filter((p) => p.id !== parqueoId);
      setParqueos(updatedParqueos);

      await reloadParqueos();

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
    return (
      <EditarEstacionamiento
        route={{ params: { id: selectedParqueoId } }}
        onClose={() => setShowEditarParqueo(false)}
      />
    );
  }

  if (showRegistrarParqueo) {
    return <RegistrarParqueo onClose={() => setShowRegistrarParqueo(false)} />;
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
    <ScrollView
      style={{ flex: 1, backgroundColor: colores.crema }}
      contentContainerStyle={{ padding: 16 }}
    >
      {/* HEADER NUEVO */}
      <View style={styles.headerContainer}>
        {onClose ? (
          <TouchableOpacity onPress={onClose} style={styles.headerBackBtn}>
            <MaterialCommunityIcons name="arrow-left" size={26} color="#111" />
          </TouchableOpacity>
        ) : null}

        <Logo width={72} height={72} />

        <Text style={styles.headerTitle}>Panel Administrador</Text>
        <Text style={styles.headerSubtitle}>Tus parqueos</Text>
      </View>

      {parqueos.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Text style={{ color: "#6B7280" }}>No tienes parqueos registrados aún.</Text>
        </View>
      ) : (
        parqueos.map((p) => {
          const rawImagen =
            p?.foto ??
            p?.imagen ??
            p?.imagenUrl ??
            (Array.isArray(p?.fotos) ? p.fotos : null);
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
                        setShowEditarParqueo(true);
                      }}
                      style={styles.iconBtnBlue}
                    >
                      <MaterialCommunityIcons name="pencil" size={20} color={colores.azul} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setSelectedParqueoId(p?.id ?? null);
                        setShowDashboard(true);
                      }}
                      style={[styles.iconBtn, { borderColor: colores.azul, marginLeft: 8 }]}
                    >
                      <MaterialCommunityIcons name="chart-bar" size={20} color={colores.azul} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setSelectedParqueoId(p?.id ?? null);
                        setShowParqueoDetalle(true);
                      }}
                      style={[styles.iconBtn, { borderColor: colores.azul, marginLeft: 8 }]}
                    >
                      <MaterialCommunityIcons name="cog-outline" size={20} color={colores.azul} />
                    </TouchableOpacity>

                    <View style={{ flex: 1 }} />

                    <TouchableOpacity
                      onPress={() => eliminarParqueo(p.id)}
                      style={[styles.iconBtn, { borderColor: colores.naranja }]}
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={20}
                        color={colores.naranja}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        })
      )}

      {/* BOTÓN FINAL — ABAJO DE TODO */}
      <View
        style={{
          marginTop: 24,
          marginBottom: 8,
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => setShowRegistrarParqueo(true)}
          style={{
            backgroundColor: colores.azul,
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 999,
            elevation: 2,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>
            Registrar parqueo
          </Text>
        </TouchableOpacity>
      </View>
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
    <View
      style={{
        width: 80,
        height: 80,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "#f2f2f2",
      }}
    >
      {loading && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator />
        </View>
      )}

      {src ? (
        <Image
          source={isLocalAsset ? src : buildSource(src)}
          style={{ width: 80, height: 80 }}
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

  /* NUEVOS ESTILOS HEADER */
  headerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 30, // lo baja un poco de la barra de estado
    marginBottom: 18,
  },
  headerBackBtn: {
    position: "absolute",
    left: 0,
    top: 34,
    padding: 4,
  },
  headerTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "800",
    color: colores.azul,
  },
  headerSubtitle: {
    marginTop: 2,
    color: "#6B7280",
  },
});
