import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// no more useRouter
import ParqueoPorPropietario from "../app/ParqueoPorPropietario"; // componente externo que muestra parqueos del owner
import Logo from "../assets/Logo";

const BACKEND_BASE = "https://parkado-backend.vercel.app";
const placeholderLocal = "file:///mnt/data/e6160939-b67a-4a41-8e50-9802c507f7e1.png";

export default function PerfilAdministrador() {
  // estado perfil
  const [usuario, setUsuario] = useState<any>(null);
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // control para mostrar vista inline de parqueos del propietario
  const [showParqueosOwnerView, setShowParqueosOwnerView] = useState(false);

  // colores (coherentes con tu app)
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
        const token = userData?.token;

        if (!id) {
          Alert.alert("Error", "ID de usuario no encontrado en storage.");
          setLoading(false);
          return;
        }

        // 1) perfil
        try {
          const perfilResp = await axios.get(`${BACKEND_BASE}/api/usuarios/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (perfilResp?.data && mounted) setUsuario(perfilResp.data);
        } catch (e) {
          console.warn("No se pudo obtener perfil (no crítico)", e);
        }

        // 2) reservas (para mostrar abajo)
        try {
          const reservasResp = await axios.get(`${BACKEND_BASE}/api/reservas/usuario/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          const arr = Array.isArray(reservasResp.data) ? reservasResp.data : reservasResp.data?.data || [];
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

  // logout SIEMPRE visible
  const handleLogout = async () => {
    await AsyncStorage.removeItem("userData");
    Alert.alert("Sesión cerrada", "Has salido de tu cuenta.");
    setUsuario(null);
    setReservas([]);
    global.location?.reload?.();
  };

  // Función para cancelar la reserva y actualizar el estado de la plaza
  const cancelarReserva = async (reservaId, plazaId) => {
    try {
      setLoading(true);

      // Realizamos la solicitud para cancelar la reserva
      await axios.delete(`${BACKEND_BASE}/api/reservas/${reservaId}`, {
        headers: { Authorization: `Bearer ${usuario.token}` },
        data: { usuarioId: usuario.id }
      });

      // Luego, actualizamos el estado de la plaza a "DISPONIBLE"
      await axios.patch(`${BACKEND_BASE}/api/plazas/${plazaId}`, {
        userId: usuario.id,
        estado: "DISPONIBLE"
      });

      // Refrescamos las reservas después de la cancelación
      const RESERVAS_API = `${BACKEND_BASE}/api/reservas/usuario/${usuario.id}`;
      const resReservas = await axios.get(RESERVAS_API, {
        headers: { Authorization: `Bearer ${usuario.token}` },
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

  // Si el usuario pulsó "Administrar parqueos", mostramos la vista externa inline
  if (showParqueosOwnerView) {
    return (
      <ParqueoPorPropietario
        ownerId={usuario?.id ?? 2}
        onClose={() => setShowParqueosOwnerView(false)}
        placeholderRemote={placeholderLocal || undefined}
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: colores.crema }]}>
      <View style={styles.header}>
        <Logo width={64} height={64} />
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
            <Text style={styles.text}>{usuario?.correoElectronico || usuario?.email || "N/D"}</Text>
          </View>
        </View>
      </View>

      {/* Botón Administrar parqueos (ahora muestra inline la vista Parc. por propietario) */}
      <TouchableOpacity
        style={[styles.manageButton]}
        onPress={() => {
          setShowParqueosOwnerView(true);
        }}
      >
        <Text style={styles.manageText}>Administrar parqueos</Text>
      </TouchableOpacity>

      {/* Lista de reservas / tarjetas */}
      <View style={styles.listContainer}>
        {reservas.length === 0 ? (
          <View style={styles.card}>
            <Text style={{ color: "#666" }}>No hay reservas activas.</Text>
          </View>
        ) : (
          reservas.map((r) => {
            const parqueo = r?.plaza?.parqueo || r?.parqueo || null;
            const rawImagen =
              parqueo?.foto || parqueo?.imagen || parqueo?.imagenUrl || parqueo?.fotos?.[0] || null;
            const imagen = resolveImageUrl(rawImagen, BACKEND_BASE, placeholderLocal);
            const nombre = parqueo?.nombre || "Borrón la base";
            const direccion = parqueo?.direccion || "Dirección seleccionada en mapa";
            const nroPlaza = r?.plaza?.nroPlaza || r?.nroPlaza || "N/A";
            const matricula = r?.matriculaVehiculo || r?.vehiculo?.placa || "N/D";
            const desde = r?.fechaHoraIni ? formatDate(r.fechaHoraIni) : "--";
            const hasta = r?.fechaHoraFin ? formatDate(r.fechaHoraFin) : "--";
            const key = r?.id || r?._id || Math.random().toString();

            return (
              <View key={key} style={styles.card}>
                <View style={styles.cardRow}>
                  <Image
                    source={{ uri: imagen }}
                    style={styles.cardImage}
                    resizeMode="cover"
                    onError={() => {}}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{nombre}</Text>
                    <Text style={styles.cardSubtitle}>{direccion}</Text>

                    <Text style={styles.cardSmall}><Text style={{ fontWeight: "700" }}>Plaza:</Text> {nroPlaza}</Text>
                    <Text style={styles.cardSmall}><Text style={{ fontWeight: "700" }}>Matrícula:</Text> {matricula}</Text>
                    <Text style={styles.cardSmall}><Text style={{ fontWeight: "700" }}>Desde:</Text> {desde}</Text>
                    <Text style={styles.cardSmall}><Text style={{ fontWeight: "700" }}>Hasta:</Text> {hasta}</Text>
                    <TouchableOpacity
                      onPress={() => cancelarReserva(r?.id, r?.plaza?.id)}
                      style={styles.cancelButton}
                    >
                      <Text style={styles.cancelText}>Cancelar Reserva</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* botón cerrar sesion SIEMPRE visible */}
      <TouchableOpacity
        onPress={handleLogout}
        style={{
          backgroundColor: "#FD721D",
          marginHorizontal: 40,
          marginTop: 20,
          marginBottom: 40,
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>
          Cerrar sesión
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

/* helpers */
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 18 },
  infoBlock: { paddingHorizontal: 18, paddingBottom: 8 },
  label: { color: "#6B7280", fontSize: 14, marginBottom: 6 },
  name: { fontSize: 26, fontWeight: "800", marginBottom: 12, color: "#111827" },
  row: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  icon: { fontSize: 22, marginRight: 10 },
  smallLabel: { fontWeight: "700" },
  text: { color: "#374151" },

  bigButton: {
    marginHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 10,
  },
  bigButtonText: { color: "white", fontSize: 18, fontWeight: "800" },

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
  cardImage: { width: 64, height: 64, borderRadius: 8, marginRight: 12, backgroundColor: "#f2f2f2" },
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