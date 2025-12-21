// screens/PerfilAdministrador.tsx
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
  StyleSheet,
  ImageSourcePropType,
} from "react-native";
import Logo from "../assets/Logo";
import ParqueoPorPropietario from "../app/ParqueoPorPropietario";

const BACKEND_BASE = "https://parkado-backend.vercel.app";
const placeholderRemote =
  "https://via.placeholder.com/150?text=Sin+imagen";

export default function PerfilAdministrador() {
  const [usuario, setUsuario] = useState<any>(null);
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
const [mostrarHistorial, setMostrarHistorial] = useState(false);

  const [showParqueosOwnerView, setShowParqueosOwnerView] = useState(false);

  // 👇 BANDERA: true si el usuario es CONDUCTOR
  const [esConductor, setEsConductor] = useState<boolean | null>(null);

  const colores = {
    azul: "#7BB3CD",
    naranja: "#FD721D",
    crema: "#F6EEE4",
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setLoading(true);
        const raw = await AsyncStorage.getItem("userData");
        if (!raw) {
          if (!mounted) return;
          Alert.alert("No autenticado", "Inicia sesión para ver tu perfil.");
          setLoading(false);
          return;
        }

        const userData = JSON.parse(raw);
        const id = userData?.id;
        const storedToken = userData?.token ?? null;

        if (!id) {
          Alert.alert("Error", "ID de usuario no encontrado en storage.");
          setLoading(false);
          return;
        }

        if (mounted) {
          setUserId(id);
          setToken(storedToken);
        }

        // 1) perfil
        try {
          const perfilResp = await axios.get(
            `${BACKEND_BASE}/api/usuarios/${id}`,
            {
              headers: storedToken
                ? { Authorization: `Bearer ${storedToken}` }
                : undefined,
            }
          );
          if (perfilResp?.data && mounted) {
            const perfil = perfilResp.data;
            setUsuario(perfil);

            // 🔍 detectar rol con la misma lógica que en Login
            const roleField =
              perfil?.rol ??
              perfil?.role ??
              perfil?.roles ??
              userData?.role ??
              userData?.roles ??
              null;

            const esCond = isRoleConductor(roleField);
            setEsConductor(esCond);
          }
        } catch (e) {
          console.warn("No se pudo obtener perfil (no crítico)", e);
        }

        // 2) reservas
        try {
          const reservasResp = await axios.get(
            `${BACKEND_BASE}/api/reservas/usuario/${id}`,
            {
              headers: storedToken
                ? { Authorization: `Bearer ${storedToken}` }
                : undefined,
            }
          );
          const arr = Array.isArray(reservasResp.data)
            ? reservasResp.data
            : reservasResp.data?.data || [];
          if (mounted) setReservas(arr);
        } catch (e) {
          console.warn("No se pudieron cargar reservas", e);
        }
      } catch (e) {
        console.error("Error init PerfilAdministrador:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  // cancelar reserva + actualizar plaza
  const cancelarReserva = async (reservaId: any, plazaId: any) => {
    try {
      if (!userId || !token) {
        Alert.alert(
          "Error",
          "No se encontró información de usuario para cancelar."
        );
        return;
      }

      if (!plazaId) {
        Alert.alert("Error", "No se encontró la plaza asociada. Imposible cancelar.");
        return;
      }

      setLoading(true);

      await axios.delete(`${BACKEND_BASE}/api/reservas/${reservaId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { usuarioId: userId },
      });

      await axios.patch(`${BACKEND_BASE}/api/plazas/${plazaId}`, {
        userId: userId,
        estado: "DISPONIBLE",
      });

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

  // vista inline de parqueos del owner
  if (showParqueosOwnerView) {
    return (
      <ParqueoPorPropietario
        ownerId={usuario?.id ?? userId ?? 2}
        onClose={() => setShowParqueosOwnerView(false)}
        placeholderRemote={placeholderRemote}
      />
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colores.crema }]}>
        <ActivityIndicator size="large" color={colores.naranja} />
      </View>
    );
  }

  // filtramos reservas que NO tengan parqueo con nombre válido
const ahora = new Date();

// 1️⃣ Filtramos reservas válidas (con parqueo)
const reservasFiltradas = reservas.filter((r) => {
  const parqueo = r?.plaza?.parqueo || r?.parqueo || null;
  if (!parqueo) return false;
  const nombre = parqueo?.nombre;
  if (!nombre || nombre.trim().length === 0) return false;
  return true;
});

// 2️⃣ Reservas ACTIVAS
const reservasActivas = reservasFiltradas.filter((r) => {
  if (!r?.fechaHoraFin) return true;
  return new Date(r.fechaHoraFin).getTime() >= ahora.getTime();
});

// 3️⃣ Historial
const reservasHistorial = reservasFiltradas.filter((r) => {
  if (!r?.fechaHoraFin) return false;
  return new Date(r.fechaHoraFin).getTime() < ahora.getTime();
});

const renderReserva = (r: any) => {
  const parqueo = r?.plaza?.parqueo || r?.parqueo || null;
  if (!parqueo) return null;

  const ahora = new Date();
  const fechaFinReserva = r?.fechaHoraFin
    ? new Date(r.fechaHoraFin)
    : null;

  const reservaExpirada =
    fechaFinReserva !== null &&
    fechaFinReserva.getTime() < ahora.getTime();

  const imagen = resolveImageUrl(
    parqueo?.fotos || parqueo?.foto,
    BACKEND_BASE,
    placeholderRemote
  );

  return (
    <View key={r.id} style={styles.card}>
      <View style={styles.cardRow}>
        <ImageFallback
          uri={imagen}
          placeholderRemote={placeholderRemote}
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>
            {parqueo.nombre}
          </Text>

          <Text style={styles.cardSubtitle}>
            {parqueo.direccion || "Dirección no disponible"}
          </Text>

          <Text style={styles.cardSmall}>
            <Text style={{ fontWeight: "700" }}>Plaza:</Text>{" "}
            {r?.plaza?.nroPlaza || "N/A"}
          </Text>

          <Text style={styles.cardSmall}>
            <Text style={{ fontWeight: "700" }}>Desde:</Text>{" "}
            {formatDate(r.fechaHoraIni)}
          </Text>

          <Text style={styles.cardSmall}>
            <Text style={{ fontWeight: "700" }}>Hasta:</Text>{" "}
            {formatDate(r.fechaHoraFin)}
          </Text>

          {/* 🔥 BOTÓN CANCELAR SOLO SI NO ESTÁ EXPIRADA */}
          {!reservaExpirada && (
            <TouchableOpacity
              onPress={() =>
                cancelarReserva(r.id, r?.plaza?.id)
              }
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>
                Cancelar Reserva
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};


  return (
    <ScrollView style={[styles.container, { backgroundColor: colores.crema }]}>
      <View style={styles.header}>
  <View style={styles.logoContainer}>
    <Logo />
  </View>
</View>


      <View style={styles.infoBlock}>
        <Text style={styles.label}>Nombre</Text>
        <Text style={styles.name}>
          {usuario?.nombres || usuario?.name || "Nombre no disponible"}
        </Text>

        <View style={styles.row}>
          <Text style={styles.icon}>📞</Text>
          <View>
            <Text style={styles.smallLabel}>Teléfono</Text>
            <Text style={styles.text}>{usuario?.telefono || "N/D"}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.icon}>✉️</Text>
          <View>
            <Text style={styles.smallLabel}>Correo electrónico</Text>
            <Text style={styles.text}>
              {usuario?.correoElectronico || usuario?.email || "N/D"}
            </Text>
          </View>
        </View>
      </View>

      {/* 🔥 Botón Administrar parqueos: SOLO si NO es conductor */}
      {esConductor === false && (
        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => setShowParqueosOwnerView(true)}
        >
          <Text style={styles.manageText}>Administrar parqueos</Text>
        </TouchableOpacity>
      )}

      

      {/* Lista de reservas (usamos reservasFiltradas) */}
      <View style={styles.listContainer}>
        <View style={{ paddingHorizontal: 18, marginTop: 8 }}>
  <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>
    Reservas activas
  </Text>
</View>

<View style={styles.listContainer}>
  {reservasActivas.length === 0 ? (
    <View style={styles.card}>
      <Text style={{ color: "#666" }}>
        No tienes reservas activas.
      </Text>
    </View>
  ) : (
    reservasActivas.map((r) => renderReserva(r))
  )}
</View>

<View style={{ paddingHorizontal: 18, marginTop: 12 }}>
  <TouchableOpacity
    onPress={() => setMostrarHistorial(!mostrarHistorial)}
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
    }}
  >
    <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>
      Historial de reservas
    </Text>
    <Text style={{ fontSize: 18 }}>
      {mostrarHistorial ? "▲" : "▼"}
    </Text>
  </TouchableOpacity>
</View>

{mostrarHistorial && (
  <View style={styles.listContainer}>
    {reservasHistorial.length === 0 ? (
      <View style={styles.card}>
        <Text style={{ color: "#666" }}>
          No hay reservas anteriores.
        </Text>
      </View>
    ) : (
      reservasHistorial.map((r) => renderReserva(r))
    )}
  </View>
)}

      </View>
    </ScrollView>
  );
}

/* ====== helpers de rol (misma idea que en Login) ====== */
function isRoleConductor(roleField: any): boolean {
  if (!roleField) return false;

  const includesConductor = (val: string) => {
    const v = val.toLowerCase();
    return (
      v.includes("conductor") ||
      v.includes("chofer") ||
      v.includes("driver")
    );
  };

  if (typeof roleField === "string") {
    return includesConductor(roleField);
  }

  if (Array.isArray(roleField)) {
    return roleField.some((item) => {
      if (!item) return false;
      if (typeof item === "string") return includesConductor(item);
      if (typeof item === "object") {
        const label =
          item.nombre ||
          item.name ||
          item.role ||
          item.rol ||
          JSON.stringify(item);
        return includesConductor(String(label));
      }
      return false;
    });
  }

  if (typeof roleField === "object") {
    const label =
      roleField.nombre ||
      roleField.name ||
      roleField.role ||
      roleField.rol ||
      JSON.stringify(roleField);
    return includesConductor(String(label));
  }

  return false;
}

/* helpers: misma lógica que en ParqueoPorPropietario */
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

/* ImageFallback reutilizable */
function ImageFallback({ uri, placeholderRemote }: any) {
  const normalize = (u: any) => {
    if (!u) return null;
    if (Array.isArray(u)) return u.find(Boolean) || null;
    if (typeof u === "object") return u.url || u.uri || u.path || u.filename || null;
    return String(u);
  };

  const initial = normalize(uri) || placeholderRemote || null;
  const [src, setSrc] = React.useState<string | number | null>(initial);
  const [loading, setLoading] = React.useState<boolean>(Boolean(initial));

  React.useEffect(() => {
    const next = normalize(uri) || placeholderRemote || null;
    setLoading(Boolean(next));
    setSrc(next);
  }, [uri, placeholderRemote]);

  const buildSource = (u: string | number | null): ImageSourcePropType => {
    // Siempre devolvemos algo válido (number para local assets o {uri: string})
    if (!u) {
      return { uri: placeholderRemote };
    }
    if (typeof u === "number") return u as any;
    return { uri: String(u) };
  };

  const imgSource = buildSource(src);

  return (
    <View
      style={{
        width: 64,
        height: 64,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "#f2f2f2",
        marginRight: 12,
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

      {imgSource ? (
        <Image
          source={imgSource}
          style={{ width: 64, height: 64 }}
          resizeMode="cover"
          onLoad={() => setLoading(false)}
          onError={() => {
            if (placeholderRemote && src !== placeholderRemote) {
              setSrc(placeholderRemote);
              setLoading(true);
            } else {
              setSrc(null);
              setLoading(false);
            }
          }}
        />
      ) : (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontSize: 24 }}>📷</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
  padding: 16,
  alignItems: "center",
  justifyContent: "center",
},
logoContainer: {
  width: 64,
  height: 120,
  alignItems: "center",
  justifyContent: "center",
},

  infoBlock: { paddingHorizontal: 18, paddingBottom: 8 },
  label: { color: "#6B7280", fontSize: 14, marginBottom: 6 },
  name: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 12,
    color: "#111827",
  },
  row: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  icon: { fontSize: 22, marginRight: 10 },
  smallLabel: { fontWeight: "700" },
  text: { color: "#374151" },

  manageButton: {
    marginHorizontal: 40,
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: "center",
    borderColor: "#7EE0B6",
    borderWidth: 0.5,
    elevation: 1,
    shadowColor: "#00000010",
    marginBottom: 12,
  },
  manageText: { color: "#111827", fontWeight: "700", fontSize: 16 },

  listContainer: { paddingHorizontal: 18, paddingBottom: 40 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },
  cardRow: { flexDirection: "row", alignItems: "center" },
  cardTitle: { fontWeight: "800", fontSize: 16 },
  cardSubtitle: { color: "#6B7280", marginTop: 4 },
  cardSmall: { color: "#374151", marginTop: 6 },

  cancelButton: {
    backgroundColor: "#FD721D",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  cancelText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },
});
