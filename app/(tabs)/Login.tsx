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

/* helper para decodificar JWT (igual que antes) */
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
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

  // chequeo inicial: si ya hay userData en AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("userData");
        if (!raw) return;
        const userData = JSON.parse(raw);
        const roleFromStorage = extractRoleFromUserData(userData);
        const conductor = isRoleConductor(roleFromStorage);
        setIsConductor(conductor);
        setShowPerfil(true);

        // establecer texto de rol y mostrar modal
        const resolvedRole = resolveRoleString(roleFromStorage, userData?.token);
        setRoleText(resolvedRole);
        setShowRoleModal(true);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!correo || !password) {
      Alert.alert("Campos incompletos", "Por favor llena todos los campos.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await axios.post(
        "https://parkado-backend.vercel.app/api/auth/login",
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
          const perfilResp = await axios.get(
            `https://parkado-backend.vercel.app/api/usuarios/${userData.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
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

      // fallback role desde response
      if (!userData.role) {
        userData.role = response.data?.role || response.data?.user?.role || null;
      }

      await AsyncStorage.setItem("userData", JSON.stringify(userData));

      // limpiar inputs
      setCorreo("");
      setPassword("");

      // determinar si es conductor y mostrar perfil inline
      const roleFromAll = extractRoleFromUserData(userData) || decoded || null;
      const conductorFlag = isRoleConductor(roleFromAll);
      setIsConductor(conductorFlag);
      setShowPerfil(true);

      // establecer texto de rol y mostrar modal
      const resolved = resolveRoleString(roleFromAll, userData.token);
      setRoleText(resolved);
      setShowRoleModal(true);
    } catch (err: any) {
      console.error("Error login:", err);
      const msg = err.response?.data?.message || err.message || "Error de login";
      Alert.alert("Error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowLoginAgain = async () => {
    await AsyncStorage.removeItem("userData");
    setShowPerfil(false);
    setIsConductor(null);
    setRoleText(null);
    setShowRoleModal(false);
  };

  // Si showPerfil es true — mostramos el perfil correspondiente (inline)
  if (showPerfil) {
    // mientras no esté resuelto isConductor, mostramos loader
    if (isConductor === null) {
      return (
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: "#F6EEE4" }}>
          <ActivityIndicator size="large" color="#FD721D" />
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        {/* Banner simple con el rol (si lo tenemos) */}
        {roleText ? (
          <View style={{ padding: 10, backgroundColor: "#FFF8E6", alignItems: "center" }}>
            <Text style={{ fontWeight: "700", color: "#7B6B00" }}>Sesión iniciada como: {roleText}</Text>
          </View>
        ) : null}

        {isConductor ? (
          <PerfilConductor />
        ) : (
          <PerfilAdministrador navigation={navigation} />
        )}

        {/* botón pequeño para cerrar sesión */}
        <View style={{ padding: 12 }}>
          <TouchableOpacity
            onPress={handleShowLoginAgain}
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

        {/* Modal que muestra el rol (visible tras login o carga) */}
        <Modal
          visible={showRoleModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowRoleModal(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <View style={{
              width: "85%",
              backgroundColor: "white",
              borderRadius: 12,
              padding: 18,
              alignItems: "center"
            }}>
              <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>Información de sesión</Text>
              <Text style={{ fontSize: 16, marginBottom: 12 }}>Rol: <Text style={{ fontWeight: "700" }}>{roleText ?? "N/D"}</Text></Text>

              <Text style={{ fontSize: 13, color: "#666", textAlign: "center", marginBottom: 16 }}>
                Este modal indica el rol detectado en tu cuenta. Cierra para continuar.
              </Text>

              <Pressable
                onPress={() => setShowRoleModal(false)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  borderRadius: 8,
                  backgroundColor: "#FD721D"
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

  // FORMULARIO DE LOGIN (cuando no hay perfil mostrado)
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F6EEE4]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1 px-6 pt-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-6">
          <Logo />
        </View>

        <Text className="text-2xl font-bold text-center text-gray-800 mb-2">INICIAR SESIÓN</Text>
        <Text className="text-center text-gray-500 mb-6">Accede a tu cuenta de Parkado</Text>

        <View className="space-y-5">
          <View>
            <Text className="text-xs font-bold text-[#B2A83F] mb-1">CORREO ELECTRÓNICO</Text>
            <TextInput
              placeholder="ejemplo@correo.com"
              keyboardType="email-address"
              className="border border-gray-300 rounded-lg p-3 bg-white"
              value={correo}
              onChangeText={setCorreo}
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text className="text-xs font-bold text-[#B2A83F] mb-1">CONTRASEÑA</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white pr-3">
              <TextInput
                placeholder="Ingrese su contraseña"
                secureTextEntry={!showPassword}
                className="flex-1 p-3"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#B2A83F" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          className={`py-3 mt-10 rounded-lg shadow-md ${isLoading ? "bg-gray-400" : "bg-black"}`}
          disabled={isLoading}
          onPress={handleLogin}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {isLoading ? "Ingresando..." : "INGRESAR"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation?.push?.("/RegistroUsuario") ?? null} className="mt-6">
          <Text className="text-center text-[#B2A83F] font-semibold">¿No tienes una cuenta? Regístrate</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* HELPERS */

// extrae rol desde diferentes ubicaciones del userData
function extractRoleFromUserData(userData: any) {
  if (!userData) return null;
  if (userData.role) return userData.role;
  if (userData.roles) return userData.roles;
  if (userData.profile?.rol) return userData.profile.rol;
  if (userData.profile?.role) return userData.profile.role;
  return null;
}

// decide si el role indica que es conductor
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
      if (typeof item === "object" && (item.role || item.name)) {
        const val = (item.role || item.name || "").toString().toLowerCase();
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

// resuelve un string amigable de rol usando posibles fuentes (roleClaims o token)
function resolveRoleString(roleField: any, token?: string | null) {
  // si viene como string simple
  if (roleField && typeof roleField === "string") {
    return capitalizeFirst(String(roleField));
  }
  // si es array -> tomar primer string relevante
  if (Array.isArray(roleField)) {
    for (const item of roleField) {
      if (!item) continue;
      if (typeof item === "string") return capitalizeFirst(item);
      if (typeof item === "object" && (item.role || item.name)) {
        return capitalizeFirst(String(item.role || item.name));
      }
    }
  }
  // si es objeto -> stringify
  if (roleField && typeof roleField === "object") {
    // si tiene propiedades role/name/rol
    if (roleField.role) return capitalizeFirst(String(roleField.role));
    if (roleField.name) return capitalizeFirst(String(roleField.name));
    if ((roleField as any).rol) return capitalizeFirst(String((roleField as any).rol));
    // fallback a representación
    return capitalizeFirst(JSON.stringify(roleField));
  }

  // intentar tokens
  if (token) {
    const decoded = decodeJWT(token);
    if (decoded) {
      // buscar claims que se parezcan a role
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
