import axios from "axios";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ImageSourcePropType,
} from "react-native";
import Logo from "../assets/Logo";

// 📌 TIPADO DEL BACKEND
interface DashboardData {
  ingresosUltimos30d: number;
  reservasUltimos30d: number;
  ratingPromedio: number | null;
  plazasTotales: number;
  plazasOcupadasAhora: number;
  tasaOcupacion: string | number;
}

// 📌 TIPADO DE PROPS
interface DashboardParqueoProps {
  parqueoId: number;
  parqueoNombre?: string | null;
  onClose: () => void;
}

export default function DashboardParqueo({
  parqueoId = 1,
   parqueoNombre,
  onClose,
}: DashboardParqueoProps) {
  const BACKEND_BASE = "https://parkado-backend.vercel.app";
  const DASH_API = `${BACKEND_BASE}/api/dashboard/parqueo/${parqueoId}`;

  const colores = {
    azul: "#7BB3CD",
    naranja: "#FD721D",
    amarillo: "#F2BD2B",
    crema: "#F6EEE4",
  };

  // 📌 TIPAR ESTADOS CORRECTAMENTE
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logoLocalUri =
    "https://via.placeholder.com/120?text=Logo"; // No uses file:/// en producción

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await axios.get(DASH_API);
        if (!mounted) return;
        setDashboard(res.data as DashboardData);
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
      <View style={{ flex: 1, backgroundColor: colores.crema, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colores.naranja} />
      </View>
    );
  }

  if (error || !dashboard) {
    return (
      <View style={{ flex: 1, backgroundColor: colores.crema, justifyContent: "center", alignItems: "center", padding: 16 }}>
        <Text style={{ color: "red", fontSize: 16, marginBottom: 10 }}>{error}</Text>

        <TouchableOpacity
          onPress={onClose}
          style={{ backgroundColor: colores.azul, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10 }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 📌 Desestructuración con tipos seguros
  const {
    ingresosUltimos30d,
    reservasUltimos30d,
    ratingPromedio,
    plazasTotales,
    plazasOcupadasAhora,
    tasaOcupacion,
  } = dashboard;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colores.crema, padding: 16, marginBottom:0 }}>
      {/* Botón Volver */}
<TouchableOpacity
  onPress={onClose}
  style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
>
  <MaterialCommunityIcons
    name="arrow-left-circle"
    size={26}
    color="#1f2937"
    style={{ marginRight: 6 }}
  />
  <Text style={{ fontWeight: "700", fontSize: 16 }}>
    Volver
  </Text>
</TouchableOpacity>


      <View style={{ alignItems: "center", marginBottom: 5 }}>
  {/* Logo centrado */}
  <View
    style={{
      width: 80,
      height: 80,
      justifyContent: "center",
      alignItems: "center",
     
    }}
  >
    <Logo />
  </View>

  {/* Imagen secundaria (opcional) */}
  <Image
    source={{ uri: logoLocalUri }}
    style={{ width: 100, height: 20, borderRadius: 10 }}
    resizeMode="cover"
  />


        <Text style={{ fontSize: 22, fontWeight: "700", color: colores.azul }}>
  Dashboard — {parqueoNombre || `Parqueo #${parqueoId}`}
</Text>

        <Text style={{ color: "#6B7280" }}>Métricas últimos 30 días</Text>
      </View>

      {/* Bloque Resumen */}
      <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#374151", marginBottom: 10 }}>
          Resumen
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {/* Ingresos */}
          <View style={{ flex: 1, marginRight: 6, padding: 12, borderRadius: 10, backgroundColor: "#f7faf9" }}>
            <Text style={{ color: "#6B7280" }}>Ingresos (30d)</Text>
            <Text style={{ fontSize: 22, fontWeight: "700", marginTop: 5 }}>
              Bs {ingresosUltimos30d.toLocaleString()}
            </Text>
          </View>

          {/* Reservas */}
          <View style={{ flex: 1, marginLeft: 6, padding: 12, borderRadius: 10, backgroundColor: "#f7faf9" }}>
            <Text style={{ color: "#6B7280" }}>Reservas (30d)</Text>
            <Text style={{ fontSize: 22, fontWeight: "700", marginTop: 5 }}>
              {reservasUltimos30d}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
          {/* Rating */}
          <View style={{ flex: 1, marginRight: 6, padding: 12, borderRadius: 10, backgroundColor: "#f7faf9" }}>
            <Text style={{ color: "#6B7280" }}>Rating promedio</Text>
            <Text style={{ fontSize: 22, fontWeight: "700", marginTop: 5 }}>
              {ratingPromedio !== null ? ratingPromedio.toFixed(1) : "N/D"}
            </Text>
          </View>

          {/* Ocupación */}
          <View style={{ flex: 1, marginLeft: 6, padding: 12, borderRadius: 10, backgroundColor: "#f7faf9" }}>
            <Text style={{ color: "#6B7280" }}>Tasa ocupación</Text>
            <Text style={{ fontSize: 22, fontWeight: "700", marginTop: 5 }}>
              {String(tasaOcupacion)}
            </Text>
          </View>
        </View>
      </View>

      {/* Estado de plazas */}
      <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16 }}>
        <Text style={{ fontWeight: "700", marginBottom: 12, color: "#374151" }}>
          Estado actual
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {/* Totales */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 48, height: 48, backgroundColor: "#f3f4f6", borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 10 }}>
              <Text style={{ fontSize: 24 }}>🚗</Text>
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "700" }}>{plazasTotales}</Text>
              <Text style={{ color: "#6B7280" }}>Plazas totales</Text>
            </View>
          </View>

          {/* Ocupadas */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 48, height: 48, backgroundColor: "#f3f4f6", borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 10 }}>
              <Text style={{ fontSize: 24 }}>📌</Text>
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "700" }}>{plazasOcupadasAhora}</Text>
              <Text style={{ color: "#6B7280" }}>Ocupadas ahora</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
