import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Logo from "../../assets/Logo";

export default function RegisterScreen() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorNombre, setErrorNombre] = useState("");
  const [errorApellido, setErrorApellido] = useState("");
  const [errorCorreo, setErrorCorreo] = useState("");
  const [errorTelefono, setErrorTelefono] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [errorConfirmPassword, setErrorConfirmPassword] = useState("");

  const [isFormValid, setIsFormValid] = useState(false);

  // Validar nombre
  const handleNombreChange = (text: string) => {
    setNombre(text);
    if (text.length < 3) {
      setErrorNombre("Debe tener al menos 3 caracteres");
    } else if (text.length > 16) {
      setErrorNombre("Máximo 16 caracteres");
    } else {
      setErrorNombre("");
    }
  };

  // Validar apellido
  const handleApellidoChange = (text: string) => {
    setApellido(text);
    if (text.length < 3) {
      setErrorApellido("Debe tener al menos 3 caracteres");
    } else if (text.length > 16) {
      setErrorApellido("Máximo 16 caracteres");
    } else {
      setErrorApellido("");
    }
  };

  // Validar correo
  const handleCorreoChange = (text: string) => {
    setCorreo(text);
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoRegex.test(text)) {
      setErrorCorreo("Correo electrónico inválido");
    } else {
      setErrorCorreo("");
    }
  };

  // Validar teléfono (8 dígitos)
  const handleTelefonoChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, "");
    setTelefono(numeric);
    if (numeric.length === 0) {
      setErrorTelefono("Ingrese un número válido");
    } else if (numeric.length > 8) {
      setErrorTelefono("Máximo 8 dígitos");
    } else if (numeric.length < 8) {
      setErrorTelefono("Debe tener 8 dígitos");
    } else {
      setErrorTelefono("");
    }
  };

  // Validar contraseña
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(text)) {
      setErrorPassword(
        "Debe tener 8 caracteres, una mayúscula y un carácter especial"
      );
    } else {
      setErrorPassword("");
    }

    if (confirmPassword && text !== confirmPassword) {
      setErrorConfirmPassword("Las contraseñas no coinciden");
    } else {
      setErrorConfirmPassword("");
    }
  };

  // Validar confirmación
  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (text !== password) {
      setErrorConfirmPassword("Las contraseñas no coinciden");
    } else {
      setErrorConfirmPassword("");
    }
  };

  // Verificar si el formulario completo es válido
  useEffect(() => {
    if (
      nombre &&
      apellido &&
      correo &&
      telefono &&
      password &&
      confirmPassword &&
      !errorNombre &&
      !errorApellido &&
      !errorCorreo &&
      !errorTelefono &&
      !errorPassword &&
      !errorConfirmPassword
    ) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [
    nombre,
    apellido,
    correo,
    telefono,
    password,
    confirmPassword,
    errorNombre,
    errorApellido,
    errorCorreo,
    errorTelefono,
    errorPassword,
    errorConfirmPassword,
  ]);

  const handleRegister = () => {
    alert("✅ Registro exitoso");
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
        {/* Logo */}
        <View className="items-center mb-6">
          <Logo />
        </View>

        <Text className="text-2xl font-bold text-center text-gray-800">
          REGISTRO DE USUARIO
        </Text>

        <View className="mt-8 space-y-4">
          {/* Nombre */}
          <View>
            <Text className="text-xs font-bold text-[#B2A83F] mb-1">
              NOMBRE(S)
            </Text>
            <TextInput
              placeholder="Ingrese sus nombres"
              className="border border-gray-300 rounded-lg p-3 bg-white"
              value={nombre}
              onChangeText={handleNombreChange}
              maxLength={16}
            />
            {errorNombre ? (
              <Text className="text-red-500 text-xs mt-1">{errorNombre}</Text>
            ) : null}
          </View>

          {/* Apellido */}
          <View>
            <Text className="text-xs font-bold text-[#B2A83F] mb-1">
              APELLIDO(S)
            </Text>
            <TextInput
              placeholder="Ingrese sus apellidos"
              className="border border-gray-300 rounded-lg p-3 bg-white"
              value={apellido}
              onChangeText={handleApellidoChange}
              maxLength={16}
            />
            {errorApellido ? (
              <Text className="text-red-500 text-xs mt-1">{errorApellido}</Text>
            ) : null}
          </View>

          {/* Correo */}
          <View>
            <Text className="text-xs font-bold text-[#B2A83F] mb-1">
              CORREO ELECTRÓNICO
            </Text>
            <TextInput
              placeholder="ejemplo@correo.com"
              keyboardType="email-address"
              className="border border-gray-300 rounded-lg p-3 bg-white"
              value={correo}
              onChangeText={handleCorreoChange}
            />
            {errorCorreo ? (
              <Text className="text-red-500 text-xs mt-1">{errorCorreo}</Text>
            ) : null}
          </View>

          {/* Teléfono */}
          <View>
            <Text className="text-xs font-bold text-[#B2A83F] mb-1">
              TELÉFONO
            </Text>
            <TextInput
              placeholder="Ej: 71234567"
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg p-3 bg-white"
              value={telefono}
              onChangeText={handleTelefonoChange}
              maxLength={8}
            />
            {errorTelefono ? (
              <Text className="text-red-500 text-xs mt-1">{errorTelefono}</Text>
            ) : null}
          </View>

          {/* Contraseña */}
          <View>
            <Text className="text-xs font-bold text-[#B2A83F] mb-1">
              CONTRASEÑA
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white px-3">
              <TextInput
                placeholder="Ingrese su contraseña"
                secureTextEntry={!showPassword}
                className="flex-1 p-3"
                value={password}
                onChangeText={handlePasswordChange}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
            {errorPassword ? (
              <Text className="text-red-500 text-xs mt-1">{errorPassword}</Text>
            ) : null}
          </View>

          {/* Confirmar Contraseña */}
          <View>
            <Text className="text-xs font-bold text-[#B2A83F] mb-1">
              CONFIRMAR CONTRASEÑA
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white px-3">
              <TextInput
                placeholder="Repita su contraseña"
                secureTextEntry={!showConfirmPassword}
                className="flex-1 p-3"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={22}
                  color="gray"
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

        {/* Botón de registro */}
        <TouchableOpacity
          className={`py-3 mt-8 rounded-lg ${
            isFormValid ? "bg-black" : "bg-gray-400"
          }`}
          disabled={!isFormValid}
          onPress={handleRegister}
        >
          <Text className="text-white text-center font-semibold text-lg">
            REGISTRAR
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
