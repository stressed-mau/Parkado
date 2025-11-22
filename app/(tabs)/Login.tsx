// app/(tabs)/Login.tsx
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import Logo from "../../assets/Logo";

// Componentes de perfil (renderizados inline)
import PerfilConductor from "../PerfilConductor";
import PerfilAdministrador from "../PerfilAdministrador";
// IMPORTA el componente de registro para renderizar inline
import RegistroUsuario from "../RegistroUsuario";

/* BACKEND */
const BACKEND_BASE = "https://parkado-backend.vercel.app";

/* helper para decodificar JWT (robusto) */
const decodeJWT = (token: string | null) => {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    if (typeof atob === "function") {
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    }

    if (typeof Buffer !== "undefined") {
      const decoded = Buffer.from(base64, "base64").toString("utf8");
      return JSON.parse(decoded);
    }

    if (typeof (globalThis as any).atob === "function") {
      const jsonPayload = decodeURIComponent(
        (globalThis as any)
          .atob(base64)
          .split("")
          .map((c: any) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    }

    return null;
  } catch (error) {
    console.error("Error decodificando JWT:", error);
    return null;
  }
};

export default function LoginUsuario({ navigation }: any) {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // control para mostrar perfil tras login
  const [showPerfil, setShowPerfil] = useState(false);
  // true si es conductor
  const [isConductor, setIsConductor] = useState<boolean | null>(null);

  // rol en texto (para modal / banner)
  const [roleText, setRoleText] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // mostrar Registro inline en lugar de navigation
  const [showRegister, setShowRegister] = useState(false);

  // --- nuevo estado: si true ocultamos el botón Cerrar sesión ---
  const [hideLogout, setHideLogout] = useState<boolean>(false);

  // chequeo inicial: si ya hay userData en AsyncStorage -> intentar resolver roles via API
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("userData");
        if (!raw) return;
        const userData = JSON.parse(raw);

        // mostrar loader mientras resolvemos
        setShowPerfil(true);
        setIsConductor(null);

        // preferimos obtener roles desde la API con id + token
        const id = userData?.id;
        const token = userData?.token ?? null;

        const rolesFromApi = await fetchRolesFromApi(id, token);
        if (rolesFromApi) {
          const conductor = rolesIncludeConductor(rolesFromApi);
          setIsConductor(conductor);
          setRoleText(makeRoleString(rolesFromApi));
          setShowRoleModal(true);
          return;
        }

        // fallback: intentar role desde userData (local)
        const roleFromStorage = extractRoleFromUserData(userData);
        const conductor = isRoleConductor(roleFromStorage);
        setIsConductor(conductor);
        const resolvedRole = resolveRoleString(roleFromStorage, userData?.token);
        setRoleText(resolvedRole);
        setShowRoleModal(true);
      } catch (e) {
        console.warn("Init login check error:", e);
        setShowPerfil(false);
      }
    })();
  }, []);

  // Efecto que revisa la bandera hideLogout en AsyncStorage.
  // Lo hacemos inicialmente y también mientras el perfil está visible comprobamos periódicamente
  useEffect(() => {
    let mounted = true;
    let interval: any = null;

    const checkFlag = async () => {
      try {
        const v = await AsyncStorage.getItem("hideLogout");
        if (!mounted) return;
        setHideLogout(!!v);
      } catch (e) {
        // ignore
      }
    };

    // check inicial
    checkFlag();

    // si el perfil está abierto, chequeamos cada 800ms para detectar cambios rápidos (entra/sale vista propietario)
    if (showPerfil) {
      interval = setInterval(checkFlag, 800);
    }

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, [showPerfil]);

  const handleLogin = async () => {
    if (!correo || !password) {
      Alert.alert("Campos incompletos", "Por favor llena todos los campos.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await axios.post(
        `${BACKEND_BASE}/api/auth/login`,
        {
          correoElectronico: correo,
          password: password,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const token = response.data?.token;
      if (!token) throw new Error("No se recibió token del servidor");

      const decoded = decodeJWT(token);

      const userData: any = {
        token,
        id: decoded?.id ?? decoded?.sub ?? response.data?.user?.id ?? null,
        email: correo,
      };

      // intentamos obtener perfil completo
      try {
        if (userData.id) {
          const perfilResp = await axios.get(`${BACKEND_BASE}/api/usuarios/${userData.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (perfilResp?.data) {
            userData.profile = perfilResp.data;
            userData.role =
              perfilResp.data?.rol ||
              perfilResp.data?.role ||
              perfilResp.data?.roles ||
              userData.role;
          }
        }
      } catch (e) {
        console.warn("No se pudo cargar perfil (no crítico):", e);
      }

      if (!userData.role) {
        userData.role = response.data?.role || response.data?.user?.role || null;
      }

      await AsyncStorage.setItem("userData", JSON.stringify(userData));

      setCorreo("");
      setPassword("");

      // Determinar roles VIA API (preferible)
      let conductorFlag: boolean | null = null;
      let resolvedRoleText: string | null = null;
      try {
        if (userData.id) {
          const rolesApi = await fetchRolesFromApi(userData.id, userData.token);
          if (rolesApi) {
            conductorFlag = rolesIncludeConductor(rolesApi);
            resolvedRoleText = makeRoleString(rolesApi);
          }
        }
      } catch (e) {
        console.warn("No se pudieron obtener roles vía API tras login (no crítico):", e);
      }

      if (conductorFlag === null) {
        const roleFromAll = extractRoleFromUserData(userData) || decoded || null;
        conductorFlag = isRoleConductor(roleFromAll);
        resolvedRoleText = resolveRoleString(roleFromAll, userData.token);
      }

      setIsConductor(conductorFlag);
      setShowPerfil(true);
      setRoleText(resolvedRoleText);
      setShowRoleModal(true);
    } catch (err: any) {
      console.error("Error login:", err);
      const msg = err.response?.data?.message || err.message || "Error de login";
      Alert.alert("Error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userData");
    setShowPerfil(false);
    setIsConductor(null);
    setRoleText(null);
    setShowRoleModal(false);
  };

  // ---------------- helpers de roles / API ----------------

  async function fetchRolesFromApi(id: any, token: string | null) {
    if (!id) return null;
    try {
      const resp = await axios.get(`${BACKEND_BASE}/api/usuarios/${id}/roles`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = resp?.data;
      const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : null;
      if (!arr) return null;
      return arr;
    } catch (e) {
      console.warn("Error fetchRolesFromApi:", e);
      return null;
    }
  }

  function rolesIncludeConductor(roles: any): boolean {
    if (!roles) return false;
    if (typeof roles === "string") {
      const r = roles.toLowerCase();
      return r.includes("conductor") || r.includes("driver") || r.includes("chofer");
    }
    if (Array.isArray(roles)) {
      return roles.some((item) => {
        if (!item) return false;
        if (typeof item === "string") {
          const v = item.toLowerCase();
          return v.includes("conductor") || v.includes("driver") || v.includes("chofer");
        }
        if (typeof item === "object") {
          const candidate =
            String(item?.nombre || item?.name || item?.role || item?.rol || JSON.stringify(item)).toLowerCase();
          return candidate.includes("conductor") || candidate.includes("driver") || candidate.includes("chofer");
        }
        return false;
      });
    }
    if (typeof roles === "object") {
      const val = JSON.stringify(roles).toLowerCase();
      return val.includes("conductor") || val.includes("driver") || val.includes("chofer");
    }
    return false;
  }

  function makeRoleString(roles: any) {
    if (!roles) return "usuario";
    if (typeof roles === "string") return capitalizeFirst(roles);
    if (Array.isArray(roles)) {
      for (const item of roles) {
        const candidate = (item?.nombre || item?.name || item || "").toString();
        if (candidate.toUpperCase().includes("CONDUCTOR")) return "Conductor";
      }
      for (const item of roles) {
        const candidate = (item?.nombre || item?.name || item || "").toString();
        if (candidate) return capitalizeFirst(candidate);
      }
      return "usuario";
    }
    if (typeof roles === "object") {
      const label = roles?.nombre || roles?.name || roles?.role || roles?.rol;
      if (label) return capitalizeFirst(String(label));
      return capitalizeFirst(JSON.stringify(roles));
    }
    return "usuario";
  }

  function extractRoleFromUserData(userData: any) {
    if (!userData) return null;
    if (userData.role) return userData.role;
    if (userData.roles) return userData.roles;
    if (userData.profile?.rol) return userData.profile.rol;
    if (userData.profile?.role) return userData.profile.role;
    return null;
  }

  function isRoleConductor(role: any) {
    if (!role) return false;
    if (typeof role === "string") {
      const r = role.toLowerCase();
      return r.includes("conductor") || r.includes("chofer") || r.includes("driver");
    }
    if (Array.isArray(role)) {
      return role.some((item) => {
        if (!item) return false;
        if (typeof item === "string") {
          const v = item.toLowerCase();
          return v.includes("conductor") || v.includes("chofer") || v.includes("driver");
        }
        if (typeof item === "object" && (item.role || item.name || item.nombre)) {
          const val = (item.role || item.name || item.nombre || "").toString().toLowerCase();
          return val.includes("conductor") || val.includes("chofer") || val.includes("driver");
        }
        return false;
      });
    }
    if (typeof role === "object") {
      const val = JSON.stringify(role).toLowerCase();
      return val.includes("conductor") || val.includes("chofer") || val.includes("driver");
    }
    return false;
  }

  function resolveRoleString(roleField: any, token?: string | null) {
    if (roleField && typeof roleField === "string") {
      return capitalizeFirst(String(roleField));
    }
    if (Array.isArray(roleField)) {
      for (const item of roleField) {
        if (!item) continue;
        if (typeof item === "string") return capitalizeFirst(item);
        if (typeof item === "object" && (item.role || item.name || item.nombre)) {
          return capitalizeFirst(String(item.role || item.name || item.nombre));
        }
      }
    }
    if (roleField && typeof roleField === "object") {
      if (roleField.role) return capitalizeFirst(String(roleField.role));
      if (roleField.name) return capitalizeFirst(String(roleField.name));
      if (roleField.nombre) return capitalizeFirst(String(roleField.nombre));
      if ((roleField as any).rol) return capitalizeFirst(String((roleField as any).rol));
      return capitalizeFirst(JSON.stringify(roleField));
    }
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded) {
        if (decoded.role) return capitalizeFirst(String(decoded.role));
        if (decoded.rol) return capitalizeFirst(String(decoded.rol));
        if (decoded.roles) {
          if (typeof decoded.roles === "string") return capitalizeFirst(decoded.roles);
          if (Array.isArray(decoded.roles) && decoded.roles.length) return capitalizeFirst(String(decoded.roles[0]));
        }
      }
    }
    return "usuario";
  }

  function capitalizeFirst(s: string) {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // -------------------------------------------------------

  // Si queremos mostrar el formulario de Registro inline:
  if (showRegister) {
    return (
      <View style={{ flex: 1 }}>
        {/* Header pequeño */}
        <View style={{ padding: 12, backgroundColor: "#F6EEE4", alignItems: "center" }}>
          <Text style={{ fontWeight: "800", fontSize: 18 }}>Registro</Text>
        </View>

        {/* Renderiza tu componente de registro. Le paso onClose por si quieres usarlo ahí */}
        <View style={{ flex: 1 }}>
          <RegistroUsuario onClose={() => setShowRegister(false)} />
        </View>

        {/* Botón para volver al login */}
        <View style={{ padding: 12 }}>
          <TouchableOpacity
            onPress={() => setShowRegister(false)}
            style={{
              backgroundColor: "#111827",
              padding: 12,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>Volver al login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Si showPerfil es true — mostramos el perfil correspondiente (inline)
  if (showPerfil) {
    if (isConductor === null) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F6EEE4" }}>
          <ActivityIndicator size="large" color="#FD721D" />
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        {roleText ? (
          <View style={{ padding: 10, backgroundColor: "#FFF8E6", alignItems: "center" }}>
            <Text style={{ fontWeight: "700", color: "#7B6B00" }}>Sesión iniciada como: {roleText}</Text>
          </View>
        ) : null}

        {isConductor ? <PerfilConductor /> : <PerfilAdministrador />}

        {/* Mostrar Cerrar sesión SOLO si hideLogout === false */}
        {!hideLogout ? (
          <View style={{ padding: 12 }}>
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                backgroundColor: "#FD721D",
                padding: 12,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Modal
          visible={showRoleModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowRoleModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: "85%",
                backgroundColor: "white",
                borderRadius: 12,
                padding: 18,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>Información de sesión</Text>
              <Text style={{ fontSize: 16, marginBottom: 12 }}>
                Rol: <Text style={{ fontWeight: "700" }}>{roleText ?? "N/D"}</Text>
              </Text>

              <Text style={{ fontSize: 13, color: "#666", textAlign: "center", marginBottom: 16 }}>
                Este modal indica el rol detectado en tu cuenta. Cierra para continuar.
              </Text>

              <Pressable
                onPress={() => setShowRoleModal(false)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  borderRadius: 8,
                  backgroundColor: "#FD721D",
                }}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // FORMULARIO DE LOGIN (cuando no hay perfil ni registro mostrado)
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F6EEE4" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <Logo />
        </View>

        <Text style={{ fontSize: 28, fontWeight: "800", textAlign: "center", color: "#111827", marginBottom: 6 }}>
          INICIAR SESIÓN
        </Text>
        <Text style={{ textAlign: "center", color: "#6B7280", marginBottom: 18 }}>Accede a tu cuenta de Parkado</Text>

        <View style={{ gap: 16 }}>
          <View>
            <Text style={{ fontSize: 12, fontWeight: "800", color: "#B2A83F", marginBottom: 6 }}>CORREO ELECTRÓNICO</Text>
            <TextInput
              placeholder="ejemplo@correo.com"
              keyboardType="email-address"
              style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, padding: 12, backgroundColor: "white" }}
              value={correo}
              onChangeText={setCorreo}
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text style={{ fontSize: 12, fontWeight: "800", color: "#B2A83F", marginBottom: 6 }}>CONTRASEÑA</Text>
            <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, backgroundColor: "white" }}>
              <TextInput
                placeholder="Ingrese su contraseña"
                secureTextEntry={!showPassword}
                style={{ flex: 1, padding: 12 }}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 12 }}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#B2A83F" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={{
            paddingVertical: 14,
            marginTop: 24,
            borderRadius: 10,
            backgroundColor: isLoading ? "#9CA3AF" : "#111827",
            alignItems: "center",
          }}
          disabled={isLoading}
          onPress={handleLogin}
        >
          <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>
            {isLoading ? "Ingresando..." : "INGRESAR"}
          </Text>
        </TouchableOpacity>

        {/* Botón que ahora muestra Registro inline */}
        <TouchableOpacity onPress={() => setShowRegister(true)} style={{ marginTop: 16 }}>
          <Text style={{ textAlign: "center", color: "#B2A83F", fontWeight: "700" }}>
            ¿No tienes una cuenta? Regístrate
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
