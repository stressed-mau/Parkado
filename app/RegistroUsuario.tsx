import Ionicons from "@expo/vector-icons/Ionicons";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { z } from "zod";

const registerSchema = z.object({
  nombre: z
    .string()
    .min(3, "Debe tener al menos 3 caracteres")
    .max(16, "Máximo 16 caracteres"),
  apellido: z
    .string()
    .min(3, "Debe tener al menos 3 caracteres")
    .max(16, "Máximo 16 caracteres"),
  correo: z.string().email("Correo electrónico inválido"),
  telefono: z
    .string()
    .regex(/^\d{8}$/, "Debe tener 8 dígitos"),
  password: z
    .string()
    .regex(
      /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
      "Debe tener 8 caracteres, una mayúscula y un carácter especial"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Las contraseñas no coinciden",
});

export default function RegisterScreen() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState({
    nombre: false,
    apellido: false,
    correo: false,
    telefono: false,
    password: false,
    confirmPassword: false,
  });

  const [errorNombre, setErrorNombre] = useState("");
  const [errorApellido, setErrorApellido] = useState("");
  const [errorCorreo, setErrorCorreo] = useState("");
  const [errorTelefono, setErrorTelefono] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [errorConfirmPassword, setErrorConfirmPassword] = useState("");

  const [isFormValid, setIsFormValid] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    const hasTouched = Object.values(touched).some(value => value);
    
    if (!hasTouched) {
      return;
    }

    try {
      registerSchema.parse({
        nombre,
        apellido,
        correo,
        telefono,
        password,
        confirmPassword,
      });

      setErrorNombre("");
      setErrorApellido("");
      setErrorCorreo("");
      setErrorTelefono("");
      setErrorPassword("");
      setErrorConfirmPassword("");
      setIsFormValid(true);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = err.flatten().fieldErrors;

        setErrorNombre(touched.nombre ? (errors.nombre?.[0] || "") : "");
        setErrorApellido(touched.apellido ? (errors.apellido?.[0] || "") : "");
        setErrorCorreo(touched.correo ? (errors.correo?.[0] || "") : "");
        setErrorTelefono(touched.telefono ? (errors.telefono?.[0] || "") : "");
        setErrorPassword(touched.password ? (errors.password?.[0] || "") : "");
        setErrorConfirmPassword(touched.confirmPassword ? (errors.confirmPassword?.[0] || "") : "");
      }
      setIsFormValid(false);
    }
  }, [nombre, apellido, correo, telefono, password, confirmPassword, touched]);

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleRegister = async () => {
    setTouched({
      nombre: true,
      apellido: true,
      correo: true,
      telefono: true,
      password: true,
      confirmPassword: true,
    });

    if (!isFormValid) {
      Alert.alert("Error", "Por favor, complete todos los campos correctamente");
      return;
    }

    try {
      const response = await axios.post(
        "https://parkado-backend.vercel.app/api/auth/register",
        {
          nombres: nombre,
          apellidos: apellido,
          correoElectronico: correo,
          password,
          telefono,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      Alert.alert(
        "Registro exitoso",
        response.data.message || "Usuario creado correctamente"
      );

      setNombre("");
      setApellido("");
      setCorreo("");
      setTelefono("");
      setPassword("");
      setConfirmPassword("");
      setTouched({
        nombre: false,
        apellido: false,
        correo: false,
        telefono: false,
        password: false,
        confirmPassword: false,
      });

      setTimeout(() => {
        router.push("/Login");
      }, 1500);
    } catch (error: any) {
      console.error("Error al registrar:", error);
      const msg =
        error.response?.data?.message ||
        "No se pudo completar el registro. Intenta nuevamente.";
      Alert.alert("❌ Error al registrar", msg);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F6EEE4]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <KeyboardAwareScrollView
        className="flex-1 px-6 pt-10"
        enableOnAndroid={true}
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center">
          <Animated.Image 
            source={require("../assets/images/logo.png")}
            style={{
              width: 220,
              height: 150,
              resizeMode: "contain",
              transform: [{ scale: pulseAnim }],
            }}
          />
        </View>

        <Text className="text-2xl font-bold text-center text-gray-800">
          Registro de Usuario
        </Text>

        <View className="mt-8 space-y-4">
          <View>
            <Text className="block text-sm font-medium text-black mb-1">
              Nombre(s)
            </Text>
            <TextInput
              placeholder="Ingrese sus nombres"
              placeholderTextColor="#7BB3CD"
              className="p-3 border border-[#F0E2D1] rounded-lg bg-white text-black focus:border-[#FD721D] focus:border-2"
              value={nombre}
              onChangeText={setNombre}
              onBlur={() => handleBlur('nombre')}
              maxLength={16}
            />
            {errorNombre ? (
              <Text className="text-red-500 text-xs mt-1">{errorNombre}</Text>
            ) : null}
          </View>

          <View>
            <Text className="block text-sm font-medium text-black mb-1">
              Apellido(s)
            </Text>
            <TextInput
              placeholder="Ingrese sus apellidos"
              placeholderTextColor="#7BB3CD"
              className="p-3 border border-[#F0E2D1] rounded-lg bg-white text-black focus:border-[#FD721D] focus:border-2"
              value={apellido}
              onChangeText={setApellido}
              onBlur={() => handleBlur('apellido')}
              maxLength={16}
            />
            {errorApellido ? (
              <Text className="text-red-500 text-xs mt-1">{errorApellido}</Text>
            ) : null}
          </View>

          <View>
            <Text className="block text-sm font-medium text-black mb-1">
              Correo Electrónico
            </Text>
            <TextInput
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#7BB3CD"
              keyboardType="email-address"
              className="p-3 border border-[#F0E2D1] rounded-lg bg-white text-black focus:border-[#FD721D] focus:border-2"
              value={correo}
              onChangeText={setCorreo}
              onBlur={() => handleBlur('correo')}
            />
            {errorCorreo ? (
              <Text className="text-red-500 text-xs mt-1">{errorCorreo}</Text>
            ) : null}
          </View>

          <View>
            <Text className="block text-sm font-medium text-black mb-1">
              Teléfono
            </Text>
            <TextInput
              placeholder="Ej: 71234567"
              placeholderTextColor="#7BB3CD"
              keyboardType="numeric"
              className="p-3 border border-[#F0E2D1] rounded-lg bg-white text-black focus:border-[#FD721D] focus:border-2"
              value={telefono}
              onChangeText={(t) => setTelefono(t.replace(/[^0-9]/g, ""))}
              onBlur={() => handleBlur('telefono')}
              maxLength={8}
            />
            {errorTelefono ? (
              <Text className="text-red-500 text-xs mt-1">{errorTelefono}</Text>
            ) : null}
          </View>

          <View>
            <Text className="block text-sm font-medium text-black mb-1">
              Contraseña
            </Text>
            <View className="flex-row items-center">
              <TextInput
                placeholder="••••••••••••"
                placeholderTextColor="#7BB3CD"
                secureTextEntry={!showPassword}
                className="flex-1 bg-white p-3 rounded-lg border border-[#F0E2D1] focus:border-[#FD721D] focus:border-2"
                value={password}
                onChangeText={setPassword}
                onBlur={() => handleBlur('password')}
              />
              <TouchableOpacity 
                className="flex right-3 inset-y absolute items-center"
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#B2A83F"
                />
              </TouchableOpacity>
            </View>
            {errorPassword ? (
              <Text className="text-red-500 text-xs mt-1">{errorPassword}</Text>
            ) : null}
          </View>

          <View>
            <Text className="block text-sm font-medium text-black mb-1">
              Confirmar Contraseña
            </Text>
            <View className="flex-row items-center">
              <TextInput
                placeholder="••••••••••••"
                placeholderTextColor="#7BB3CD"
                secureTextEntry={!showConfirmPassword}
                className="flex-1 bg-white p-3 rounded-lg border border-[#F0E2D1] focus:border-[#FD721D] focus:border-2"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onBlur={() => handleBlur('confirmPassword')}
              />
              <TouchableOpacity
                className="flex right-3 inset-y absolute items-center"
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#B2A83F"
                />
              </TouchableOpacity>
            </View>
            {errorConfirmPassword ? (
              <Text className="text-red-500 text-xs mt-1">
                {errorConfirmPassword}
              </Text>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          className={`py-3 mt-6 rounded-lg ${
            isFormValid ? "bg-[#FD721D]" : "bg-[#FEB182]"
          }`}
          disabled={!isFormValid}
          onPress={handleRegister}
        >
          <Text className="text-white text-center font-semibold text-lg">
            REGISTRAR
          </Text>
        </TouchableOpacity>

        <View  className="mt-6 flex-row justify-center">
          <Text className="text-center text-[#7BB3CD] font-semibold">
            ¿Ya tienes cuenta?
          </Text>
        <TouchableOpacity
          onPress={() => router.push("/Login")}
        >
            <Text className="text-[#FD721D] font-semibold"> Inicia sesión aquí</Text>
        </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
}