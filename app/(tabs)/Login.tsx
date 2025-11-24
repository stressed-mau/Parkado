// app/(tabs)/Login.tsx
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import Logo from "../../assets/Logo";

import PerfilAdministrador from "../PerfilAdministrador";
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

  // mostrar perfil tras login
  const [showPerfil, setShowPerfil] = useState(false);

  // rol en texto (por si lo quieres usar en algún lado)
  const [roleText, setRoleText] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false); // no se usa visualmente, pero lo dejamos

  // mostrar Registro inline
  const [showRegister, setShowRegister] = useState(false);

  // si true ocultamos el botón Cerrar sesión (lo controla otra vista via AsyncStorage)
  const [hideLogout, setHideLogout] = useState<boolean>(false);

  // --------- AUTOLOGIN AL ABRIR LA APP ----------
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("userData");
        if (!raw) return;
        const userData = JSON.parse(raw);

        const id = userData?.id;
        const token = userData?.token ?? null;
        if (!id) return;

        // mostramos el contenedor de perfil
        setShowPerfil(true);

        let roleField: any = extractRoleFromUserData(userData);

        // 1) refrescar perfil
        try {
          const perfilResp = await axios.get(
            `${BACKEND_BASE}/api/usuarios/${id}`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            }
          );

          const perfil = perfilResp?.data;
          if (perfil) {
            userData.profile = perfil;
            const rolFromPerfil =
              perfil?.rol || perfil?.role || perfil?.roles || null;
            if (rolFromPerfil) {
              userData.role = rolFromPerfil;
              roleField = rolFromPerfil;
            }
          }
        } catch (e) {
          console.warn("No se pudo refrescar perfil (no crítico):", e);
        }

        // 2) ROLES DESDE /api/usuarios/:id/roles
        try {
          const rolesResp = await axios.get(
            `${BACKEND_BASE}/api/usuarios/${id}/roles`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            }
          );
          const rolesArr = Array.isArray(rolesResp.data)
            ? rolesResp.data
            : rolesResp.data?.data || [];
          if (rolesArr.length) {
            userData.roles = rolesArr; // [{id, nombre}, ...]
            roleField = rolesArr;
          }
        } catch (e) {
          console.warn("No se pudieron obtener roles vía API (no crítico):", e);
        }

        // si no hay rol todavía, usamos JWT
        if (!roleField) {
          const decoded = decodeJWT(token);
          if (decoded) {
            roleField =
              decoded.role ||
              decoded.rol ||
              decoded.roles ||
              decoded ||
              null;
          }
        }

        const resolvedRole = resolveRoleString(roleField, token);
        setRoleText(resolvedRole);
        setShowRoleModal(true);

        // sincronizamos en storage
        userData.roleText = resolvedRole;
        await AsyncStorage.setItem("userData", JSON.stringify(userData));
      } catch (e) {
        console.warn("Init login check error:", e);
        setShowPerfil(false);
      }
    })();
  }, []);

  // Efecto que revisa la bandera hideLogout en AsyncStorage.
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

    // si el perfil está abierto, chequeamos cada 800ms para detectar cambios rápidos
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

      // 1) perfil completo + rol desde /usuarios/:id
      try {
        if (userData.id) {
          const perfilResp = await axios.get(
            `${BACKEND_BASE}/api/usuarios/${userData.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (perfilResp?.data) {
            userData.profile = perfilResp.data;
            const rolFromPerfil =
              perfilResp.data?.rol ||
              perfilResp.data?.role ||
              perfilResp.data?.roles ||
              null;
            if (rolFromPerfil) {
              userData.role = rolFromPerfil;
            }
          }
        }
      } catch (e) {
        console.warn("No se pudo cargar perfil (no crítico):", e);
      }

      // 2) ROLES DESDE /api/usuarios/:id/roles
      try {
        if (userData.id) {
          const rolesResp = await axios.get(
            `${BACKEND_BASE}/api/usuarios/${userData.id}/roles`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const rolesArr = Array.isArray(rolesResp.data)
            ? rolesResp.data
            : rolesResp.data?.data || [];
          if (rolesArr.length) {
            userData.roles = rolesArr; // [{id, nombre: "OWNER"}, {id, nombre: "CONDUCTOR"}]
          }
        }
      } catch (e) {
        console.warn("No se pudieron obtener roles (no crítico):", e);
      }

      // si aún no tenemos role simple, probamos con lo que venga del login
      if (!userData.role) {
        userData.role =
          response.data?.role || response.data?.user?.role || null;
      }

      // resolvemos el texto de rol a partir de todo lo que tenemos
      const roleFieldFromAll =
        extractRoleFromUserData(userData) ||
        decoded?.role ||
        decoded?.rol ||
        decoded?.roles ||
        decoded ||
        null;

      const resolvedRoleText = resolveRoleString(
        roleFieldFromAll,
        userData.token
      );

      // Guardamos texto de rol (por si quieres usarlo en otras vistas)
      userData.roleText = resolvedRoleText;

      await AsyncStorage.setItem("userData", JSON.stringify(userData));

      setCorreo("");
      setPassword("");

      setShowPerfil(true);
      setRoleText(resolvedRoleText);
      setShowRoleModal(true);
    } catch (err: any) {
      console.error("Error login:", err);
      const msg =
        err.response?.data?.message || err.message || "Error de login";
      Alert.alert("Error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userData");
    setShowPerfil(false);
    setRoleText(null);
    setShowRoleModal(false);
  };

  // ---------------- helpers de roles ----------------

  function extractRoleFromUserData(userData: any) {
    if (!userData) return null;
    if (userData.roles) return userData.roles; // array de /roles
    if (userData.role) return userData.role;
    if (userData.profile?.rol) return userData.profile.rol;
    if (userData.profile?.role) return userData.profile.role;
    if (userData.profile?.roles) return userData.profile.roles;
    return null;
  }

  function resolveRoleString(roleField: any, token?: string | null) {
    if (roleField && typeof roleField === "string") {
      return capitalizeFirst(String(roleField));
    }
    if (Array.isArray(roleField)) {
      for (const item of roleField) {
        if (!item) continue;
        if (typeof item === "string") return capitalizeFirst(item);
        if (
          typeof item === "object" &&
          (item.role || item.name || item.nombre)
        ) {
          return capitalizeFirst(
            String(item.role || item.name || item.nombre)
          );
        }
      }
    }
    if (roleField && typeof roleField === "object") {
      if (roleField.role) return capitalizeFirst(String(roleField.role));
      if (roleField.name) return capitalizeFirst(String(roleField.name));
      if (roleField.nombre) return capitalizeFirst(String(roleField.nombre));
      if ((roleField as any).rol)
        return capitalizeFirst(String((roleField as any).rol));
      return capitalizeFirst(JSON.stringify(roleField));
    }
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded) {
        if (decoded.role) return capitalizeFirst(String(decoded.role));
        if (decoded.rol) return capitalizeFirst(String(decoded.rol));
        if (decoded.roles) {
          if (typeof decoded.roles === "string")
            return capitalizeFirst(decoded.roles);
          if (
            Array.isArray(decoded.roles) &&
            decoded.roles.length
          )
            return capitalizeFirst(String(decoded.roles[0]));
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
        <View
          style={{
            padding: 12,
            backgroundColor: "#F6EEE4",
            alignItems: "center",
          }}
        >
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
            <Text style={{ color: "white", fontWeight: "700" }}>
              Volver al login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Si showPerfil es true — SIEMPRE mostramos PerfilAdministrador
  if (showPerfil) {
    return (
      <View style={{ flex: 1 }}>
        <PerfilAdministrador />

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
              <Text style={{ color: "white", fontWeight: "700" }}>
                Cerrar sesión
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
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

        <Text
          style={{
            fontSize: 28,
            fontWeight: "800",
            textAlign: "center",
            color: "#111827",
            marginBottom: 6,
          }}
        >
          INICIAR SESIÓN
        </Text>
        <Text
          style={{
            textAlign: "center",
            color: "#6B7280",
            marginBottom: 18,
          }}
        >
          Accede a tu cuenta de Parkado
        </Text>

        <View style={{ gap: 16 }}>
          <View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "800",
                color: "#B2A83F",
                marginBottom: 6,
              }}
            >
              CORREO ELECTRÓNICO
            </Text>
            <TextInput
              placeholder="ejemplo@correo.com"
              keyboardType="email-address"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 8,
                padding: 12,
                backgroundColor: "white",
              }}
              value={correo}
              onChangeText={setCorreo}
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "800",
                color: "#B2A83F",
                marginBottom: 6,
              }}
            >
              CONTRASEÑA
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 8,
                backgroundColor: "white",
              }}
            >
              <TextInput
                placeholder="Ingrese su contraseña"
                secureTextEntry={!showPassword}
                style={{ flex: 1, padding: 12 }}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ paddingHorizontal: 12 }}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#B2A83F"
                />
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
          <Text
            style={{ color: "white", fontWeight: "800", fontSize: 16 }}
          >
            {isLoading ? "Ingresando..." : "INGRESAR"}
          </Text>
        </TouchableOpacity>

        {/* Botón que ahora muestra Registro inline */}
        <TouchableOpacity
          onPress={() => setShowRegister(true)}
          style={{ marginTop: 16 }}
        >
          <Text
            style={{
              textAlign: "center",
              color: "#B2A83F",
              fontWeight: "700",
            }}
          >
            ¿No tienes una cuenta? Regístrate
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
