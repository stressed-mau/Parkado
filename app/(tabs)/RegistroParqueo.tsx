import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { MapPressEvent, Marker } from "react-native-maps";
import { Button, Checkbox } from "react-native-paper";
import Logo from "../../assets/Logo";

export default function RegistroEstacionamiento() {
  const [pagina, setPagina] = useState(1);

  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    capacidadAutos: "",
    capacidadMotos: "",
    tarifaAutos: "",
    tarifaMotos: "",
    tarifaAutosDia: "",
    tarifaMotosDia: "",
    tipoLugar: "",
    latitud: "",
    longitud: "",
    horarios: {
      lunes: { abierto: true, apertura: "08:00", cierre: "22:00" },
      martes: { abierto: true, apertura: "08:00", cierre: "22:00" },
      miercoles: { abierto: true, apertura: "08:00", cierre: "22:00" },
      jueves: { abierto: true, apertura: "08:00", cierre: "22:00" },
      viernes: { abierto: true, apertura: "08:00", cierre: "22:00" },
      sabado: { abierto: true, apertura: "09:00", cierre: "20:00" },
      domingo: { abierto: false, apertura: "00:00", cierre: "00:00" },
    },
  });

  const [errors, setErrors] = useState<any>({});
  const [licenciaUri, setLicenciaUri] = useState<string | null>(null);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const [showPicker, setShowPicker] = useState(false);
  const [pickerInfo, setPickerInfo] = useState<{ dia: string; tipo: "apertura" | "cierre" } | null>(
    null
  );
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const diasSemana = [
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
    "domingo",
  ];

  // -------------------------
  // Permisos de ubicación
  // -------------------------
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        setForm((f) => ({
          ...f,
          latitud: String(loc.coords.latitude),
          longitud: String(loc.coords.longitude),
        }));
      }
    })();
  }, []);

  // -------------------------
  // Funciones auxiliares
  // -------------------------
  const pickImage = async (setUri: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setUri(result.assets[0].uri);
  };

  const handleInput = (key: string, value: string) => {
    let newValue = value;
    if (key === "telefono") newValue = value.replace(/\D/g, "").slice(0, 8);
    setForm({ ...form, [key]: newValue });
  };

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocation({ latitude, longitude });
    setForm({
      ...form,
      latitud: String(latitude),
      longitud: String(longitude),
    });
  };

  const handleSubmit = () => {
    console.log("Datos finales:", form);
    Alert.alert("Registro enviado ✅", "Tu estacionamiento fue registrado correctamente.");
  };

  // -------------------------
  // PÁGINA 1 — Datos generales
  // -------------------------
  const renderPagina1 = () => (
    <ScrollView className="flex-1 px-5 py-4" style={{ backgroundColor: "#F6EEE4" }}>
      <Logo />
      <Text className="text-2xl font-bold text-center mb-4" style={{ color: "#F2BD2B" }}>
        REGISTRO DEL ESTACIONAMIENTO
      </Text>

      {[
        ["nombre", "Nombre del estacionamiento"],
        ["telefono", "Teléfono"],
        ["capacidadAutos", "Capacidad total de autos"],
        ["capacidadMotos", "Capacidad total de motos"],
        ["tarifaAutos", "Tarifa autos/hora"],
        ["tarifaMotos", "Tarifa motos/hora"],
        ["tarifaAutosDia", "Tarifa autos/día"],
        ["tarifaMotosDia", "Tarifa motos/día"],
      ].map(([key, label]) => (
        <View key={key} className="mb-4">
          <Text className="mb-1 font-medium" style={{ color: "#B2A83F" }}>
            {label}
          </Text>
          <TextInput
            className="rounded-lg px-3 py-2 bg-white border border-[#7BB3CD]"
            value={String(form[key as keyof typeof form])}
            onChangeText={(text) => handleInput(key, text)}
            placeholder={label}
            keyboardType="numeric"
          />
        </View>
      ))}

      {/* Tipo de lugar */}
      <View className="mb-4">
        <Text className="mb-1 font-medium" style={{ color: "#B2A83F" }}>
          Tipo de lugar
        </Text>
        <View className="rounded-lg border border-[#7BB3CD] bg-white">
          <Picker
            selectedValue={form.tipoLugar}
            onValueChange={(value) => handleInput("tipoLugar", value)}
          >
            <Picker.Item label="Selecciona una opción" value="" />
            <Picker.Item label="Un solo piso" value="un_piso" />
            <Picker.Item label="Edificio" value="edificio" />
          </Picker>
        </View>
      </View>

      {/* Mapa */}
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
              <Marker coordinate={location} />
            </MapView>
          )}
        </View>
        {form.latitud && (
          <Text className="text-gray-700 mt-2 text-sm">
            📍 Latitud: {form.latitud} | Longitud: {form.longitud}
          </Text>
        )}
      </View>

      {/* Licencia */}
      <View className="mt-6">
        <Text className="mb-2 font-medium" style={{ color: "#B2A83F" }}>
          Licencia de funcionamiento
        </Text>
        {licenciaUri ? (
          <View className="relative items-center">
            <Image source={{ uri: licenciaUri }} className="w-40 h-40 rounded-lg" />
            <TouchableOpacity
              className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
              onPress={() => setLicenciaUri(null)}
            >
              <MaterialIcons name="delete" size={22} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            className="border rounded-lg items-center py-3 bg-white"
            style={{ borderColor: "#7BB3CD" }}
            onPress={() => pickImage((uri) => setLicenciaUri(uri))}
          >
            <Text className="text-gray-500">Seleccionar archivo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Foto */}
      <View className="mt-6">
        <Text className="mb-2 font-medium" style={{ color: "#B2A83F" }}>
          Foto de referencia
        </Text>
        {fotoUri ? (
          <View className="relative items-center">
            <Image source={{ uri: fotoUri }} className="w-40 h-40 rounded-lg" />
            <TouchableOpacity
              className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
              onPress={() => setFotoUri(null)}
            >
              <MaterialIcons name="delete" size={22} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            className="border rounded-lg items-center py-3 bg-white"
            style={{ borderColor: "#7BB3CD" }}
            onPress={() => pickImage((uri) => setFotoUri(uri))}
          >
            <Text className="text-gray-500">Seleccionar archivo</Text>
          </TouchableOpacity>
        )}
      </View>

      <Button
        mode="contained"
        onPress={() => setPagina(2)}
        style={{ backgroundColor: "#7BB3CD", borderRadius: 50, marginTop: 30 }}
      >
        Siguiente
      </Button>
    </ScrollView>
  );

  // -------------------------
  // PÁGINA 2 — Horarios mejorada
  // -------------------------
  const renderPagina2 = () => (
    <ScrollView className="flex-1 px-5 py-4" style={{ backgroundColor: "#F6EEE4" }}>
      <Text className="text-2xl font-bold text-center mb-4" style={{ color: "#F2BD2B" }}>
        HORARIOS SEMANALES
      </Text>

      <Text className="text-sm mb-2 text-gray-600">
        Selecciona los días para aplicar el mismo horario:
      </Text>

      <View className="flex-row flex-wrap mb-4">
        {diasSemana.map((dia) => (
          <View key={dia} className="flex-row items-center mr-4 mb-2">
            <Checkbox
              status={selectedDays.includes(dia) ? "checked" : "unchecked"}
              onPress={() =>
                setSelectedDays((prev) =>
                  prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
                )
              }
            />
            <Text className="capitalize">{dia}</Text>
          </View>
        ))}
      </View>

      {showPicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour
          display="default"
          onChange={(e, date) => {
            if (date && pickerInfo) {
              const { dia, tipo } = pickerInfo;
              const formatted = date.toTimeString().slice(0, 5);
              setForm((prev) => ({
                ...prev,
                horarios: {
                  ...prev.horarios,
                  [dia]: { ...prev.horarios[dia], [tipo]: formatted },
                },
              }));
            }
            setShowPicker(false);
          }}
        />
      )}

      {diasSemana.map((dia) => (
        <View key={dia} className="border-b border-gray-300 py-3">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="capitalize font-medium" style={{ color: "#B2A83F" }}>
              {dia}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-sm mr-2">Abierto</Text>
              <Switch
                value={form.horarios[dia].abierto}
                onValueChange={() =>
                  setForm((prev) => ({
                    ...prev,
                    horarios: {
                      ...prev.horarios,
                      [dia]: { ...prev.horarios[dia], abierto: !prev.horarios[dia].abierto },
                    },
                  }))
                }
                thumbColor={form.horarios[dia].abierto ? "#7BB3CD" : "#ccc"}
              />
            </View>
          </View>

          {form.horarios[dia].abierto && (
            <View className="flex-row justify-between mt-2">
              {["apertura", "cierre"].map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  className="flex-row items-center border rounded-lg px-3 py-2 bg-white w-[48%]"
                  style={{ borderColor: "#7BB3CD" }}
                  onPress={() => {
                    setPickerInfo({ dia, tipo: tipo as "apertura" | "cierre" });
                    setShowPicker(true);
                  }}
                >
                  <MaterialIcons name="access-time" size={20} color="#FD721D" />
                  <Text className="ml-2">
                    {form.horarios[dia][tipo as "apertura" | "cierre"]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}

      <View className="flex-row justify-between mt-6 mb-10">
        <Button
          mode="contained"
          onPress={() => setPagina(1)}
          style={{ backgroundColor: "#FD721D", borderRadius: 50, width: "45%" }}
        >
          Atrás
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={{ backgroundColor: "#7BB3CD", borderRadius: 50, width: "45%" }}
        >
          Registrar
        </Button>
      </View>
    </ScrollView>
  );

 
  return pagina === 1 ? renderPagina1() : renderPagina2();
}
