import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Button } from "react-native-paper";

export default function RegistroEstacionamiento() {
  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    capacidadAutos: "",
    capacidadMotos: "",
    apertura: "",
    cierre: "",
    tarifaAutos: "",
    tarifaMotos: "",
    nit: "",
  });

  const [licenciaUri, setLicenciaUri] = useState<string | null>(null);
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  const pickImage = async (setUri: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setUri(result.assets[0].uri);
    }
  };

  const handleInput = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = () => {
    console.log("Datos del estacionamiento:", form);
    console.log("Licencia:", licenciaUri);
    console.log("Foto:", fotoUri);
    alert("Registro enviado ✅");
  };

  return (
    <ScrollView className="flex-1 bg-white px-5 py-4">
      <Text className="text-xl font-bold mb-4 text-center">
        REGISTRO DEL ESTACIONAMIENTO
      </Text>

      {/* Campos de texto */}
      {[
        ["nombre", "Nombre del estacionamiento*"],
        ["direccion", "Dirección*"],
        ["telefono", "Teléfono*"],
        ["capacidadAutos", "Capacidad total de autos*"],
        ["capacidadMotos", "Capacidad total de motos*"],
        ["tarifaAutos", "Tarifa de autos*"],
        ["tarifaMotos", "Tarifa de motos*"],
        ["nit", "NIT*"],
      ].map(([key, label]) => (
        <View key={key} className="mb-4">
          <Text className="text-gray-700 mb-1">{label}</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2"
            value={form[key as keyof typeof form]}
            onChangeText={(text) => handleInput(key, text)}
            placeholder={label}
          />
        </View>
      ))}

      {/* Selección de horas */}
      <View className="flex-row justify-between">
        <View className="w-[48%]">
          <Text className="text-gray-700 mb-1">Horario de apertura*</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Ej: 08:00"
            value={form.apertura}
            onChangeText={(text) => handleInput("apertura", text)}
          />
        </View>
        <View className="w-[48%]">
          <Text className="text-gray-700 mb-1">Horario de cierre*</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Ej: 22:00"
            value={form.cierre}
            onChangeText={(text) => handleInput("cierre", text)}
          />
        </View>
      </View>

      {/* Licencia */}
      <View className="mt-6">
        <Text className="text-gray-700 mb-2">Licencia de funcionamiento*</Text>
        <TouchableOpacity
          className="border border-gray-300 rounded-lg items-center py-3"
          onPress={() => pickImage((uri) => setLicenciaUri(uri))}
        >
          {licenciaUri ? (
            <Image source={{ uri: licenciaUri }} className="w-40 h-40 rounded-lg" />
          ) : (
            <Text className="text-gray-500">Seleccionar archivo</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Foto de referencia */}
      <View className="mt-6">
        <Text className="text-gray-700 mb-2">Foto de referencia*</Text>
        <TouchableOpacity
          className="border border-gray-300 rounded-lg items-center py-3"
          onPress={() => pickImage((uri) => setFotoUri(uri))}
        >
          {fotoUri ? (
            <Image source={{ uri: fotoUri }} className="w-40 h-40 rounded-lg" />
          ) : (
            <Text className="text-gray-500">Seleccionar archivo</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Botón de registro */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        className="mt-8 bg-black py-1 rounded-full"
      >
        Registrar
      </Button>
    </ScrollView>
  );
}
