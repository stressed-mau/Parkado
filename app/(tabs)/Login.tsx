import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import {
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ✅ FUNCIÓN PARA DECODIFICAR JWT
const decodeJWT = (token: string) => {
  try {
    // Un JWT tiene 3 partes: header.payload.signature
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decodificando JWT:', error);
    return null;
  }
};

export default function LoginUsuario() {
  const router = useRouter();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

      console.log("🔍 Respuesta del servidor:", response.data);

      // ✅ EXTRAER DATOS DEL TOKEN JWT
      const token = response.data.token;
      
      if (!token) {
        throw new Error("No se recibió token del servidor");
      }

      // Decodificar el token JWT para obtener el ID del usuario
      const decodedToken = decodeJWT(token);
      console.log("🔍 Token decodificado:", decodedToken);

      if (!decodedToken || !decodedToken.id) {
        throw new Error("No se pudo obtener el ID del usuario del token");
      }

      // ✅ CREAR OBJETO DE USUARIO
      const userData = {
        token: token,
        id: decodedToken.id, // ← ID extraído del token JWT
        email: correo, // Usamos el correo que ingresó el usuario
        nombre: 'Usuario Parkado' // Nombre por defecto
      };

      console.log("✅ Datos del usuario:", userData);

      // ✅ GUARDAR EN ASYNC STORAGE
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      // Verificar que se guardó correctamente
      const storedData = await AsyncStorage.getItem('userData');
      console.log("✅ Verificación - Datos guardados:", storedData);

      Alert.alert(
        "✅ Inicio de sesión exitoso",
        `Bienvenido a Parkado!\nTu ID de usuario es: ${userData.id}`,
         
      );

      console.log("Usuario autenticado y guardado:", userData);

      setCorreo("");
      setPassword("");

    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "No se pudo iniciar sesión. Verifica tus credenciales.";
      Alert.alert("❌ Error", msg);
    } finally {
      setIsLoading(false);
    }
  };

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
        {/* LOGO */}
        <View className="items-center mb-6">
                <Animated.Image 
                source={require("../../assets/images/logo.png")}
                style={{
                    width: 220,
                    height: 220,
                    resizeMode: "contain",
                    marginBottom: 5,
                    transform: [{ scale: pulseAnim }],
                  }}
                />
        </View>

        <Text className="text-5xl font-bold text-center mb-1">
          Bienvenido
        </Text>
        <Text className="text-[#7BB3CD] text-lg text-center mb-8">
          Inicia sesión en tu cuenta
        </Text>

        <View className="space-y-5">
          {/* CORREO */}
          <View>
            <Text className="block text-base font-medium text-black mb-2">
              Correo Electrónico
            </Text>
            <TextInput
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#7BB3CD"
              keyboardType="email-address"
              className="w-full px-4 py-3 border border-[#F0E2D1] rounded-lg bg-white text-black focus:border-[#FD721D] focus:border-2"
              value={correo}
              onChangeText={setCorreo}
              autoCapitalize="none"
            />
          </View>

          {/* CONTRASEÑA */}
          <View>
            <Text className="block text-base font-medium text-black mb-2">
              Contraseña
            </Text>
            <View className="flex-row items-center">
              <TextInput
                placeholder="••••••••••••"
                placeholderTextColor="#7BB3CD"
                secureTextEntry={!showPassword}
                className= "flex-1 bg-white p-3 rounded-lg border border-[#F0E2D1] focus:border-[#FD721D] focus:border-2"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity 
              className="flex right-3 inset-y absolute items-center"
              onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#B2A83F"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* BOTÓN LOGIN */}
        <TouchableOpacity
          className={`py-3 mt-10 rounded-lg shadow-md ${
            isLoading ? "bg-[#FEB182]" : "bg-[#FD721D]"
          }`}
          disabled={isLoading}
          onPress={handleLogin}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {isLoading ? "Ingresando..." : "INGRESAR"}
          </Text>
        </TouchableOpacity>

        {/* LINK A REGISTRO */}
        <View  className="mt-6 flex-row justify-center">
                    <Text className="text-center text-[#7BB3CD] font-semibold">
            ¿No tienes una cuenta?
          </Text>
        <TouchableOpacity
          onPress={() => router.push("/RegistroUsuario")}
        >
            <Text className="text-[#FD721D] font-semibold"> Regístrate aquí</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}