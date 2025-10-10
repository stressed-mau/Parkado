import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import MapView, { MapPressEvent, Marker } from "react-native-maps";
import { Button } from "react-native-paper";
import Logo from "../../assets/Logo";

export default function RegistroEstacionamiento() {
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    capacidadAutos: "",
    capacidadMotos: "",
    tarifaAutos: "",
    tarifaMotos: "",
    nit: "",
    latitud: "",
    longitud: "",
    apertura: "",
    cierre: "",
  });

  const [licenciaUri, setLicenciaUri] = useState<string | null>(null);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Estados para el selector de hora
  const [showPicker, setShowPicker] = useState(false);
  const [pickerType, setPickerType] = useState<"apertura" | "cierre" | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    })();
  }, []);

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

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setForm({ ...form, latitud: String(latitude), longitud: String(longitude) });
    setLocation({ latitude, longitude });
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate && pickerType) {
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      const formattedTime = `${hours}:${minutes}`;
      setForm({ ...form, [pickerType]: formattedTime });
    }
    setShowPicker(false);
    setPickerType(null);
  };

  const handleSubmit = () => {
    console.log("Datos del estacionamiento:", form);
    alert("Registro enviado ✅");
  };

  return (
    <ScrollView className="flex-1 px-5 py-4" style={{ backgroundColor: "#F6EEE4" }}>
      <Logo />

      <Text
        className="text-2xl font-bold mt-4 mb-4 text-center"
        style={{ color: "#F2BD2B" }}
      >
        REGISTRO DEL ESTACIONAMIENTO
      </Text>

      {/* Campos principales */}
      {[
        ["nombre", "Nombre del estacionamiento*"],
        ["telefono", "Teléfono*"],
        ["capacidadAutos", "Capacidad total de autos*"],
        ["capacidadMotos", "Capacidad total de motos*"],
        ["tarifaAutos", "Tarifa de autos*"],
        ["tarifaMotos", "Tarifa de motos*"],
        ["nit", "NIT*"],
      ].map(([key, label]) => (
        <View key={key} className="mb-4">
          <Text className="mb-1 font-medium" style={{ color: "#B2A83F" }}>
            {label}
          </Text>
          <TextInput
            className="rounded-lg px-3 py-2"
            style={{
              borderColor: "#7BB3CD",
              borderWidth: 1,
              backgroundColor: "white",
            }}
            value={form[key as keyof typeof form]}
            onChangeText={(text) => handleInput(key, text)}
            placeholder={label}
          />
        </View>
      ))}

      {/* 🗺️ Mapa para dirección */}
      <View className="mb-4">
        <Text className="mb-2 font-medium" style={{ color: "#B2A83F" }}>
          Dirección (selecciona en el mapa)
        </Text>
        <View style={{ height: 250, borderRadius: 10, overflow: "hidden" }}>
          {location && (
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              onPress={handleMapPress}
            >
              {location && <Marker coordinate={location} />}
            </MapView>
          )}
        </View>
        {form.latitud && (
          <Text className="text-gray-700 mt-2 text-sm">
            📍 Latitud: {form.latitud} | Longitud: {form.longitud}
          </Text>
        )}
      </View>

      {/* 🕒 Horarios con icono de reloj */}
      <View className="flex-row justify-between">
        <View className="w-[48%]">
          <Text className="mb-1 font-medium" style={{ color: "#B2A83F" }}>
            Horario de apertura*
          </Text>
          <View className="flex-row items-center border rounded-lg px-3 py-2" style={{ borderColor: "#7BB3CD", backgroundColor: "white" }}>
            <TextInput
              className="flex-1"
              editable={false}
              value={form.apertura}
              placeholder="Ej: 08:00"
            />
            <TouchableOpacity onPress={() => { setPickerType("apertura"); setShowPicker(true); }}>
              <MaterialIcons name="access-time" size={24} color="#FD721D" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="w-[48%]">
          <Text className="mb-1 font-medium" style={{ color: "#B2A83F" }}>
            Horario de cierre*
          </Text>
          <View className="flex-row items-center border rounded-lg px-3 py-2" style={{ borderColor: "#7BB3CD", backgroundColor: "white" }}>
            <TextInput
              className="flex-1"
              editable={false}
              value={form.cierre}
              placeholder="Ej: 22:00"
            />
            <TouchableOpacity onPress={() => { setPickerType("cierre"); setShowPicker(true); }}>
              <MaterialIcons name="access-time" size={24} color="#FD721D" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showPicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {/* Licencia */}
      <View className="mt-6">
        <Text className="mb-2 font-medium" style={{ color: "#B2A83F" }}>
          Licencia de funcionamiento*
        </Text>
        <TouchableOpacity
          className="border rounded-lg items-center py-3"
          style={{ borderColor: "#7BB3CD", backgroundColor: "white" }}
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
        <Text className="mb-2 font-medium" style={{ color: "#B2A83F" }}>
          Foto de referencia*
        </Text>
        <TouchableOpacity
          className="border rounded-lg items-center py-3"
          style={{ borderColor: "#7BB3CD", backgroundColor: "white" }}
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
        className="mt-8 py-1 rounded-full"
        style={{ backgroundColor: "#7BB3CD" }}
        labelStyle={{ color: "#F6EEE4", fontWeight: "bold" }}
      >
        Registrar
      </Button>
    <ScrollView
  className="flex-1 px-5 py-4"
  style={{ backgroundColor: "#F6EEE4" }}
  contentContainerStyle={{ paddingBottom: 40 }} // 👈 agrega esto
  >

  );
}
