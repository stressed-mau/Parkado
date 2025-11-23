import Ionicons from "@expo/vector-icons/Ionicons";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { z } from "zod";
import Logo from "../assets/Logo";
import GenericModal from "../app/modal"; // 👈 Importa tu modal

type Props = {
  onClose?: () => void;
  onRegistered?: (data: any) => void; // opcional: para autologin si quisieras
};

// === SCHEMA DE VALIDACIÓN ===
const registerSchema = z
  .object({
    nombre: z.string().min(3, "Debe tener al menos 3 caracteres").max(16, "Máximo 16 caracteres"),
    apellido: z.string().min(3, "Debe tener al menos 3 caracteres").max(16, "Máximo 16 caracteres"),
    correo: z.string().email("Correo electrónico inválido"),
    telefono: z.string().regex(/^\d{8}$/, "Debe tener 8 dígitos"),
    password: z.string().regex(
      /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?\":{}|<>]).{8,}$/,
      "Debe tener 8 caracteres, una mayúscula y un carácter especial"
    ),
    confirmPassword: z.string(),
    rolId: z.number().min(1).max(2, "Rol inválido"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

export default function RegisterScreen({ onClose, onRegistered }: Props) {
  const router = useRouter();

  // === Estados ===
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rolId, setRolId] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Errores
  const [errorNombre, setErrorNombre] = useState("");
  const [errorApellido, setErrorApellido] = useState("");
  const [errorCorreo, setErrorCorreo] = useState("");
  const [errorTelefono, setErrorTelefono] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [errorConfirmPassword, setErrorConfirmPassword] = useState("");
  const [errorRol, setErrorRol] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  // Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // === Validaciones con Zod ===
  useEffect(() => {
    try {
      registerSchema.parse({
        nombre,
        apellido,
        correo,
        telefono,
        password,
        confirmPassword,
        rolId,
      });
      setErrorNombre("");
      setErrorApellido("");
      setErrorCorreo("");
      setErrorTelefono("");
      setErrorPassword("");
      setErrorConfirmPassword("");
      setErrorRol("");
      setIsFormValid(true);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = err.flatten().fieldErrors;
        setErrorNombre(errors.nombre?.[0] || "");
        setErrorApellido(errors.apellido?.[0] || "");
        setErrorCorreo(errors.correo?.[0] || "");
        setErrorTelefono(errors.telefono?.[0] || "");
        setErrorPassword(errors.password?.[0] || "");
        setErrorConfirmPassword(errors.confirmPassword?.[0] || "");
        setErrorRol(errors.rolId?.[0] || "");
      }
      setIsFormValid(false);
    }
  }, [nombre, apellido, correo, telefono, password, confirmPassword, rolId]);

  // === Registro ===
  const handleRegister = async () => {
    try {
      const response = await axios.post(
        "https://parkado-backend.vercel.app/api/auth/register",
        {
          nombres: nombre,
          apellidos: apellido,
          correoElectronico: correo,
          password,
          telefono,
          rolId,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      // ✅ Mostrar modal de éxito
      setModalMessage(response.data?.message || "Usuario creado correctamente");
      setShowSuccessModal(true);

      // si el backend devuelve datos útiles (ej token), notificar al padre
      if (onRegistered) {
        try {
          onRegistered(response.data);
        } catch {
          // ignore
        }
      }

      // Reset form
      setNombre("");
      setApellido("");
      setCorreo("");
      setTelefono("");
      setPassword("");
      setConfirmPassword("");
      setRolId(1);
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "No se pudo completar el registro. Intenta nuevamente.";
      setModalMessage(msg);
      setShowSuccessModal(true);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);

    // si mensaje indica éxito, volvemos al login
    // preferimos onClose (flujo inline), y solo si no existe usamos router.push como fallback
    if (modalMessage.toLowerCase().includes("correct") || modalMessage.toLowerCase().includes("éxito") || modalMessage.toLowerCase().includes("correctamente")) {
      if (onClose) {
        try {
          onClose();
          return;
        } catch {
          // continue to fallback
        }
      }
      // fallback: navegación normal si no hay onClose
      try {
        router.push("/(tabs)/Login");
      } catch (e) {
        console.warn("No se pudo navegar a Login (fallback):", e);
      }
    }
  };

  return (
    <>
      <KeyboardAwareScrollView
        className="flex-1 bg-[#F6EEE4] px-6 pt-10"
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === "ios" ? 100 : 150}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}
      >
        <View className="items-center mb-6">
          <Logo />
        </View>

        <Text className="text-2xl font-bold text-center text-gray-800">
          REGISTRO DE USUARIO
        </Text>

        <View className="mt-8 space-y-4">
          {/* === CAMPOS === */}
          <View>
            <Text className="text-xs font-bold text-[#B2A83F] mb-1">NOMBRE(S)</Text>
            <TextInput
              placeholder="Ingrese sus nombres"
              className="border border-gray-300 rounded-lg p-3 bg-white"
              value={nombre}
              onChangeText={setNombre}
              maxLength={16}
            />
            {errorNombre ? <Text className="text-red-500 text-xs mt-1">{errorNombre}</Text> : null}
          </View>

          <View>
            <Text className="text-xs font-bold text-[#B2A83F] mb-1">APELLIDO(S)</Text>
            <TextInput
              placeholder="Ingrese sus apellidos"
              className="border border-gray-300 rounded-lg p-3 bg-white"
              value={apellido}
              onChangeText={setApellido}
              maxLength={16}
            />
            {errorApellido ? <Text className="text-red-500 text-xs mt-1">{errorApellido}</Text> : null}
          </View>

          <View>
            <Text className="text-xs font-bold text-[#B2A83F] mb-1">CORREO ELECTRÓNICO</Text>
            <TextInput
              placeholder="ejemplo@correo.com"
              keyboardType="email-address"
              className="border border-gray-300 rounded-lg p-3 bg-white"
              value={correo}
              onChangeText={setCorreo}
            />
            {errorCorreo ? <Text className="text-red-500 text-xs mt-1">{errorCorreo}</Text> : null}
          </View>

          <View>
            <Text className="text-xs font-bold text-[#B2A83F] mb-1">TELÉFONO</Text>
            <TextInput
              placeholder="Ej: 71234567"
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg p-3 bg-white"
              value={telefono}
              onChangeText={(t) => setTelefono(t.replace(/[^0-9]/g, ""))}
              maxLength={8}
            />
            {errorTelefono ? <Text className="text-red-500 text-xs mt-1">{errorTelefono}</Text> : null}
          </View>

          <View>
            <Text className="text-xs font-bold text-[#B2A83F] mb-1">ROL</Text>
            <View className="border border-gray-300 rounded-lg bg-white">
              <Picker selectedValue={rolId} onValueChange={(value) => setRolId(value)}>
                <Picker.Item label="Conductor" value={1} />
                <Picker.Item label="Administrador del parqueo" value={2} />
              </Picker>
            </View>
            {errorRol ? <Text className="text-red-500 text-xs mt-1">{errorRol}</Text> : null}
          </View>

          <View>
            <Text className="text-xs font-bold text-[#B2A83F] mb-1">CONTRASEÑA</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white px-3">
              <TextInput
                placeholder="Ingrese su contraseña"
                secureTextEntry={!showPassword}
                className="flex-1 p-3"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="gray" />
              </TouchableOpacity>
            </View>
            {errorPassword ? <Text className="text-red-500 text-xs mt-1">{errorPassword}</Text> : null}
          </View>

          <View>
            <Text className="text-xs font-bold text-[#B2A83F] mb-1">CONFIRMAR CONTRASEÑA</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white px-3">
              <TextInput
                placeholder="Repita su contraseña"
                secureTextEntry={!showConfirmPassword}
                className="flex-1 p-3"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={22}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
            {errorConfirmPassword ? <Text className="text-red-500 text-xs mt-1">{errorConfirmPassword}</Text> : null}
          </View>
        </View>

        {/* === BOTÓN REGISTRAR === */}
        <TouchableOpacity
          className={`py-3 mt-8 mb-10 rounded-lg ${isFormValid ? "bg-black" : "bg-gray-400"}`}
          disabled={!isFormValid}
          onPress={handleRegister}
        >
          <Text className="text-white text-center font-semibold text-lg">
            REGISTRAR
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      {/* === MODAL DE ÉXITO / ERROR === */}
      <GenericModal
        visible={showSuccessModal}
        onClose={handleModalClose}
        title="Registro de usuario"
      >
        <Text className="text-gray-700 text-center">{modalMessage}</Text>
        <TouchableOpacity
          onPress={handleModalClose}
          className="mt-6 bg-black py-2 rounded-lg"
        >
          <Text className="text-white text-center font-semibold">Aceptar</Text>
        </TouchableOpacity>
      </GenericModal>
    </>
  );
}
