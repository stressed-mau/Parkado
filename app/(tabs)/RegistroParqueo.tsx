import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { MapPressEvent, Marker } from "react-native-maps";
import { Button } from "react-native-paper";
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
      lunes_a_viernes: { apertura: "", cierre: "" },
      sabado: { apertura: "", cierre: "" },
      domingo: { apertura: "", cierre: "" },
    },
  });

  const [errors, setErrors] = useState<any>({
    nombre: "",
    telefono: "",
    capacidadAutos: "",
    capacidadMotos: "",
    tarifaAutos: "",
    tarifaMotos: "",
    tarifaAutosDia: "",
    tarifaMotosDia: "",
    horarios: {},
  });

  const [licenciaUri, setLicenciaUri] = useState<string | null>(null);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [showPicker, setShowPicker] = useState(false);
  const [pickerInfo, setPickerInfo] = useState<{
    dia: keyof typeof form.horarios;
    tipo: "apertura" | "cierre";
  } | null>(null);

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

  const validateField = (key: string, value: string) => {
    let error = "";
    if (key === "nombre") {
      if (value.length < 3 || value.length > 20)
        error = "El nombre debe tener entre 3 y 20 caracteres.";
    }
    if (key === "telefono") {
      if (!/^\d{8}$/.test(value)) error = "El teléfono debe tener 8 números.";
    }
    if (key === "capacidadAutos" || key === "capacidadMotos") {
      const num = Number(value);
      if (isNaN(num) || num < 1 || num > 200)
        error = "La capacidad debe ser entre 1 y 200.";
    }
    if (
      key === "tarifaAutos" ||
      key === "tarifaMotos" ||
      key === "tarifaAutosDia" ||
      key === "tarifaMotosDia"
    ) {
      const num = Number(value);
      if (isNaN(num) || num < 1 || num > 99)
        error = "La tarifa debe ser entre 1 y 99.";
    }

    setErrors((prev: any) => ({ ...prev, [key]: error }));
  };

  const handleInput = (key: string, value: string) => {
  let newValue = value;

  // Limitar valores máximos
  if (key === "nombre") {
    newValue = value.slice(0, 20); // máximo 20 caracteres
  }
  if (key === "telefono") {
    newValue = value.replace(/\D/g, "").slice(0, 8); // solo números, máximo 8
  }
  if (key === "capacidadAutos" || key === "capacidadMotos") {
    let num = parseInt(value.replace(/\D/g, "")) || 0;
    if (num > 200) num = 200;
    newValue = num.toString();
  }
  if (
    key === "tarifaAutos" ||
    key === "tarifaMotos" ||
    key === "tarifaAutosDia" ||
    key === "tarifaMotosDia"
  ) {
    let num = parseInt(value.replace(/\D/g, "")) || 0;
    if (num > 99) num = 99;
    newValue = num.toString();
  }

  setForm({ ...form, [key]: newValue });
  validateField(key, newValue);
};

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setForm({ ...form, latitud: String(latitude), longitud: String(longitude) });
    setLocation({ latitude, longitude });
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate && pickerInfo) {
      const { dia, tipo } = pickerInfo;
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      const formatted = `${hours}:${minutes}`;

      const newHorarios = {
        ...form.horarios,
        [dia]: { ...form.horarios[dia], [tipo]: formatted },
      };

      // Validar que apertura <= cierre
      const apertura = newHorarios[dia].apertura;
      const cierre = newHorarios[dia].cierre;
      let horarioError = "";
      if (apertura && cierre && apertura > cierre) {
        horarioError = "La hora de apertura no puede ser mayor que la de cierre.";
      }

      setForm({ ...form, horarios: newHorarios });
      setErrors((prev: any) => ({
        ...prev,
        horarios: { ...prev.horarios, [dia]: horarioError },
      }));
    }
    setShowPicker(false);
    setPickerInfo(null);
  };

  const handleSubmit = () => {
    // Validar antes de enviar
    let valid = true;
    Object.entries(form).forEach(([key, value]) => {
      if (typeof value === "string") validateField(key, value);
    });

    Object.values(errors).forEach((err) => {
      if (err) valid = false;
    });

    Object.values(errors.horarios || {}).forEach((err) => {
      if (err) valid = false;
    });

    if (!valid) {
      alert("Corrige los errores antes de enviar.");
      return;
    }

    console.log("Datos completos del estacionamiento:", form);
    alert("Registro enviado ✅");
  };

  const renderPagina1 = () => (
    <ScrollView
      className="flex-1 px-5 py-4"
      style={{ backgroundColor: "#F6EEE4" }}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <Logo />

      <Text
        className="text-2xl font-bold mt-4 mb-4 text-center"
        style={{ color: "#F2BD2B" }}
      >
        REGISTRO DEL ESTACIONAMIENTO
      </Text>

      {[
        ["nombre", "Nombre del estacionamiento"],
        ["telefono", "Teléfono"],
        ["capacidadAutos", "Capacidad total de autos"],
        ["capacidadMotos", "Capacidad total de motos"],
        ["tarifaAutos", "Tarifa de autos por hora"],
        ["tarifaMotos", "Tarifa de motos por hora"],
        ["tarifaAutosDia", "Tarifa de autos por día"],
        ["tarifaMotosDia", "Tarifa de motos por día"],
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
            value={String(form[key as keyof typeof form])}
            onChangeText={(text) => handleInput(key, text)}
            placeholder={label}
            keyboardType={
              key.includes("telefono") ||
              key.includes("capacidad") ||
              key.includes("tarifa")
                ? "numeric"
                : "default"
            }
          />
          {errors[key] ? (
            <Text style={{ color: "red", marginTop: 2 }}>{errors[key]}</Text>
          ) : null}
        </View>
      ))}

      {/* Tipo de lugar */}
      <View className="mb-4">
        <Text className="mb-1 font-medium" style={{ color: "#B2A83F" }}>
          Tipo de lugar*
        </Text>
        <View
          className="rounded-lg overflow-hidden"
          style={{
            borderColor: "#7BB3CD",
            borderWidth: 1,
            backgroundColor: "white",
          }}
        >
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
          Licencia de funcionamiento*
        </Text>
        {licenciaUri ? (
          <View className="relative items-center">
            <Image
              source={{ uri: licenciaUri }}
              className="w-40 h-40 rounded-lg"
            />
            <TouchableOpacity
              className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
              onPress={() => setLicenciaUri(null)}
            >
              <MaterialIcons name="delete" size={22} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            className="border rounded-lg items-center py-3"
            style={{ borderColor: "#7BB3CD", backgroundColor: "white" }}
            onPress={() => pickImage((uri) => setLicenciaUri(uri))}
          >
            <Text className="text-gray-500">Seleccionar archivo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Foto */}
      <View className="mt-6">
        <Text className="mb-2 font-medium" style={{ color: "#B2A83F" }}>
          Foto de referencia*
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
            className="border rounded-lg items-center py-3"
            style={{ borderColor: "#7BB3CD", backgroundColor: "white" }}
            onPress={() => pickImage((uri) => setFotoUri(uri))}
          >
            <Text className="text-gray-500">Seleccionar archivo</Text>
          </TouchableOpacity>
        )}
      </View>

      <Button
        mode="contained"
        onPress={() => setPagina(2)}
        className="mt-8 py-1 rounded-full mb-10"
        style={{ backgroundColor: "#7BB3CD" }}
        labelStyle={{ color: "#F6EEE4", fontWeight: "bold" }}
      >
        Siguiente
      </Button>
    </ScrollView>
  );

  // PÁGINA 2 — Horarios
  const renderPagina2 = () => (
    <ScrollView
      className="flex-1 px-5 py-4"
      style={{ backgroundColor: "#F6EEE4" }}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <Text
        className="text-2xl font-bold mt-4 mb-4 text-center"
        style={{ color: "#F2BD2B" }}
      >
        HORARIOS SEMANALES
      </Text>

      {[
        { dia: "lunes_a_viernes", label: "Lunes a Viernes" },
        { dia: "sabado", label: "Sábado" },
        { dia: "domingo", label: "Domingo" },
      ].map(({ dia, label }) => (
        <View key={dia} className="mb-4">
          <Text
            className="text-lg font-medium mb-2 capitalize"
            style={{ color: "#B2A83F" }}
          >
            {label}
          </Text>
          <View className="flex-row justify-between">
            {["apertura", "cierre"].map((tipo) => (
              <View key={tipo} className="w-[48%]">
                <View
                  className="flex-row items-center border rounded-lg px-3 py-2"
                  style={{
                    borderColor: "#7BB3CD",
                    backgroundColor: "white",
                  }}
                >
                  <TextInput
                    className="flex-1"
                    editable={false}
                    value={
                      form.horarios[dia as keyof typeof form.horarios]?.[
                        tipo as "apertura" | "cierre"
                      ] || ""
                    }
                    placeholder={tipo === "apertura" ? "Ej: 08:00" : "Ej: 22:00"}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setPickerInfo({
                        dia: dia as keyof typeof form.horarios,
                        tipo: tipo as "apertura" | "cierre",
                      });
                      setShowPicker(true);
                    }}
                  >
                    <MaterialIcons name="access-time" size={24} color="#FD721D" />
                  </TouchableOpacity>
                </View>
                {errors.horarios?.[dia] ? (
                  <Text style={{ color: "red", marginTop: 2 }}>
                    {errors.horarios[dia]}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ))}

      {showPicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}

      <View className="flex-row justify-between mt-6">
        <Button
          mode="contained"
          onPress={() => setPagina(1)}
          style={{ backgroundColor: "#FD721D", borderRadius: 50, width: "45%" }}
          labelStyle={{ color: "white" }}
        >
          Atrás
        </Button>

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={{ backgroundColor: "#7BB3CD", borderRadius: 50, width: "45%" }}
          labelStyle={{ color: "white" }}
        >
          Registrar
        </Button>
      </View>
    </ScrollView>
  );

  return pagina === 1 ? renderPagina1() : renderPagina2();
}
