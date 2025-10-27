import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Logo from "../assets/Logo";

export default function LoginUsuario() {
  const router = useRouter();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      Alert.alert(
        "✅ Inicio de sesión exitoso",
        response.data.message || "Bienvenido a Parkado"
      );

      console.log("Usuario autenticado:", response.data);

      setCorreo("");
      setPassword("");

      // Redirigir después de iniciar sesión
      // router.replace("/(tabs)/Home");
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);
      const msg =
        error.response?.data?.message ||
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
          <Logo />
        </View>

        <Text className="text-2xl font-bold text-center text-gray-800 mb-2">
          INICIAR SESIÓN
        </Text>
        <Text className="text-center text-gray-500 mb-6">
          Accede a tu cuenta de Parkado
        </Text>

        <View className="space-y-5">
          {/* CORREO */}
          <View>
            <Text className="text-xs font-bold text-[#B2A83F] mb-1">
              CORREO ELECTRÓNICO
            </Text>
            <TextInput
              placeholder="ejemplo@correo.com"
              keyboardType="email-address"
              className="border border-gray-300 rounded-lg p-3 bg-white"
              value={correo}
              onChangeText={setCorreo}
              autoCapitalize="none"
            />
          </View>

          {/* CONTRASEÑA */}
          <View>
            <Text className="text-xs font-bold text-[#B2A83F] mb-1">
              CONTRASEÑA
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white pr-3">
              <TextInput
                placeholder="Ingrese su contraseña"
                secureTextEntry={!showPassword}
                className="flex-1 p-3"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
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
            isLoading ? "bg-gray-400" : "bg-black"
          }`}
          disabled={isLoading}
          onPress={handleLogin}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {isLoading ? "Ingresando..." : "INGRESAR"}
          </Text>
        </TouchableOpacity>

        {/* LINK A REGISTRO */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/RegistroUsuario")}
          className="mt-6"
        >
          <Text className="text-center text-[#B2A83F] font-semibold">
            ¿No tienes una cuenta? Regístrate
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}