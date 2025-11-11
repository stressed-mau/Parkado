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
      lunes: { abierto: true, apertura: "08:00", cierre: "18:00" },
      martes: { abierto: true, apertura: "08:00", cierre: "18:00" },
      miercoles: { abierto: true, apertura: "08:00", cierre: "18:00" },
      jueves: { abierto: true, apertura: "08:00", cierre: "18:00" },
      viernes: { abierto: true, apertura: "08:00", cierre: "18:00" },
      sabado: { abierto: true, apertura: "09:00", cierre: "14:00" },
      domingo: { abierto: false, apertura: "00:00", cierre: "00:00" },
    },
  });

  const [licenciaUri, setLicenciaUri] = useState<string | null>(null);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<number[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerInfo, setPickerInfo] = useState<{ dia: string; tipo: "apertura" | "cierre" } | null>(
    null
  );
  const [tempTime, setTempTime] = useState<Date>(new Date());

  const diasSemana = [
    { key: "lunes", label: "Lunes" },
    { key: "martes", label: "Martes" },
    { key: "miercoles", label: "Miércoles" },
    { key: "jueves", label: "Jueves" },
    { key: "viernes", label: "Viernes" },
    { key: "sabado", label: "Sábado" },
    { key: "domingo", label: "Domingo" },
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

  // -------------------------
  // Manejo de horarios - CORREGIDO
  // -------------------------
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    
    if (selectedDate && pickerInfo) {
      const { dia, tipo } = pickerInfo;
      // Formatear la hora correctamente en formato 24h
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`;
      
      setForm((prev) => ({
        ...prev,
        horarios: {
          ...prev.horarios,
          [dia]: { 
            ...prev.horarios[dia as keyof typeof prev.horarios], 
            [tipo]: formattedTime 
          },
        },
      }));
    }
  };

  const openTimePicker = (dia: string, tipo: "apertura" | "cierre", currentTime: string) => {
    const [hours, minutes] = currentTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    setTempTime(date);
    setPickerInfo({ dia, tipo });
    setShowPicker(true);
  };

  // -------------------------
  // Subida a Cloudinary - CORREGIDA
  // -------------------------
  const uploadToCloudinary = async (uri: string) => {
    try {
      const formData = new FormData();
      
      // Obtener el tipo MIME correcto basado en la extensión del archivo
      const fileType = uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      
      formData.append('file', {
        uri,
        type: fileType,
        name: `upload_${Date.now()}.${fileType === 'image/png' ? 'png' : 'jpg'}`,
      } as any);
      
      formData.append('upload_preset', 'Parkado'); // ⚠️ cambia por tu preset
      formData.append('cloud_name', 'dthb7c50y'); // ⚠️ cambia por tu cloud name

      console.log('Subiendo imagen a Cloudinary...');
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dthb7c50y/image/upload`, // ⚠️ cambia por tu cloud name
        {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Imagen subida exitosamente:', data.secure_url);
      return data.secure_url;
    } catch (error) {
      console.error('Error detallado al subir imagen:', error);
      return null;
    }
  };

  // -------------------------
  // Envío del formulario - CORREGIDO
  // -------------------------
  const handleSubmit = async () => {
    try {
      // Validaciones básicas
      if (!form.nombre.trim() || !form.latitud || !form.longitud) {
        Alert.alert("Campos incompletos", "Por favor completa todos los campos obligatorios.");
        return;
      }

      console.log("Iniciando envío del formulario...");

      // Subir imágenes
      const urlsFotos: string[] = [];
      
      if (fotoUri) {
        console.log("Subiendo foto de referencia...");
        const fotoUrl = await uploadToCloudinary(fotoUri);
        if (fotoUrl) {
          urlsFotos.push(fotoUrl);
          console.log("✅ Foto subida:", fotoUrl);
        } else {
          console.error("❌ Error al subir foto de referencia");
          Alert.alert("Error", "No se pudo subir la foto de referencia");
          return;
        }
      }

      if (licenciaUri) {
        console.log("Subiendo licencia...");
        const licenciaUrl = await uploadToCloudinary(licenciaUri);
        if (licenciaUrl) {
          urlsFotos.push(licenciaUrl);
          console.log("✅ Licencia subida:", licenciaUrl);
        } else {
          console.error("❌ Error al subir licencia");
          Alert.alert("Error", "No se pudo subir la licencia de funcionamiento");
          return;
        }
      }

      // CORRECCIÓN CRÍTICA: Formato de horarios para el backend
      const horariosParaBackend = diasSemana.map(({ key, label }) => {
        const horario = form.horarios[key as keyof typeof form.horarios];
        return {
          diaSemana: label.toUpperCase(), // "LUNES", "MARTES", etc.
          horaAbrir: horario.abierto ? horario.apertura : "00:00",
          horaCerrar: horario.abierto ? horario.cierre : "00:00",
          esCerrado: !horario.abierto,
        };
      });

      // Construir body corregido
      const body = {
        nombre: form.nombre.trim(),
        direccion: "Dirección seleccionada en mapa", // Puedes mejorar esto después
        tipoLugar: form.tipoLugar === "un_piso" ? "Un Piso" : "Edificio",
        propietarioId: 2, // ⚠️ Esto debería venir de la autenticación
        latitud: parseFloat(form.latitud),
        longitud: parseFloat(form.longitud),
        capacidades: [
          { 
            cantidad: parseInt(form.capacidadAutos) || 0, 
            tipoVehiculoId: 1 
          },
          { 
            cantidad: parseInt(form.capacidadMotos) || 0, 
            tipoVehiculoId: 2 
          },
        ],
        serviciosAsociados: serviciosSeleccionados,
        tarifas: [
          { 
            descripcion: "Hora Auto", 
            precioHora: parseFloat(form.tarifaAutos) || 0, 
            tipoVehiculoId: 1 
          },
          { 
            descripcion: "Hora Moto", 
            precioHora: parseFloat(form.tarifaMotos) || 0, 
            tipoVehiculoId: 2 
          },
          { 
            descripcion: "Día Auto", 
            precioHora: parseFloat(form.tarifaAutosDia) || 0, 
            tipoVehiculoId: 1 
          },
          { 
            descripcion: "Día Moto", 
            precioHora: parseFloat(form.tarifaMotosDia) || 0, 
            tipoVehiculoId: 2 
          },
        ],
        horarios: horariosParaBackend, // Usar el formato corregido
        fotos: urlsFotos.map((url) => ({ url })),
      };

      console.log("Datos a enviar:", JSON.stringify(body, null, 2));

      const response = await fetch(
        "https://parkado-backend.vercel.app/api/parqueos/complete",
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "✅ Éxito", 
          "Parqueo registrado correctamente.",
          [{ text: "OK", onPress: () => console.log("Registro completado") }]
        );
        console.log("✅ Respuesta del servidor:", data);
        
        // Opcional: Resetear el formulario
        setPagina(1);
        
      } else {
        console.error("❌ Error del servidor:", data);
        Alert.alert(
          "❌ Error", 
          data.message || "No se pudo registrar el parqueo. Verifica los datos."
        );
      }
    } catch (error) {
      console.error("❌ Error general:", error);
      Alert.alert(
        "Error de conexión", 
        "Ocurrió un problema al enviar el formulario. Verifica tu conexión a internet."
      );
    }
  };

  // -------------------------
  // Página 1 — Datos Generales
  // -------------------------
  const renderPagina1 = () => (
    <ScrollView className="flex-1 px-5 py-4" style={{ backgroundColor: "#F6EEE4" }}>
      <Logo />
      <Text className="text-2xl font-bold text-center mb-4" style={{ color: "#F2BD2B" }}>
        REGISTRO DEL ESTACIONAMIENTO
      </Text>

      {/* Campo NOMBRE */}
      <View className="mb-4">
        <Text className="mb-1 font-medium" style={{ color: "#B2A83F" }}>
          Nombre del estacionamiento *
        </Text>
        <TextInput
          className="rounded-lg px-3 py-2 bg-white border border-[#7BB3CD]"
          value={form.nombre}
          onChangeText={(text) => handleInput("nombre", text)}
          placeholder="Ingresa el nombre del estacionamiento"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {[
        ["telefono", "Teléfono", "phone-pad"],
        ["capacidadAutos", "Capacidad total de autos", "numeric"],
        ["capacidadMotos", "Capacidad total de motos", "numeric"],
        ["tarifaAutos", "Tarifa autos/hora (Bs)", "decimal-pad"],
        ["tarifaMotos", "Tarifa motos/hora (Bs)", "decimal-pad"],
        ["tarifaAutosDia", "Tarifa autos/día (Bs)", "decimal-pad"],
        ["tarifaMotosDia", "Tarifa motos/día (Bs)", "decimal-pad"],
      ].map(([key, label, keyboardType]) => (
        <View key={key} className="mb-4">
          <Text className="mb-1 font-medium" style={{ color: "#B2A83F" }}>
            {label}
          </Text>
          <TextInput
            className="rounded-lg px-3 py-2 bg-white border border-[#7BB3CD]"
            value={String(form[key as keyof typeof form])}
            onChangeText={(text) => handleInput(key, text)}
            placeholder={label}
            placeholderTextColor="#9CA3AF"
            keyboardType={keyboardType as any}
          />
        </View>
      ))}

      {/* Servicios */}
      <View className="mb-4 mt-2">
        <Text className="mb-2 font-medium" style={{ color: "#B2A83F" }}>
          Servicios Asociados
        </Text>
        {[
          { id: 1, nombre: "Lavado de autos" },
          { id: 2, nombre: "Inflado de llantas" },
        ].map((serv) => (
          <View key={serv.id} className="flex-row items-center mb-1">
            <Checkbox
              status={serviciosSeleccionados.includes(serv.id) ? "checked" : "unchecked"}
              onPress={() =>
                setServiciosSeleccionados((prev) =>
                  prev.includes(serv.id)
                    ? prev.filter((s) => s !== serv.id)
                    : [...prev, serv.id]
                )
              }
              color="#7BB3CD"
            />
            <Text className="text-gray-700">{serv.nombre}</Text>
          </View>
        ))}
      </View>

      {/* Tipo de lugar */}
      <View className="mb-4">
        <Text className="mb-1 font-medium" style={{ color: "#B2A83F" }}>
          Tipo de lugar *
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
          Ubicación (selecciona en el mapa) *
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
          Licencia de funcionamiento *
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
            <MaterialIcons name="add-photo-alternate" size={24} color="#7BB3CD" />
            <Text className="text-gray-500 mt-1">Seleccionar archivo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Foto */}
      <View className="mt-6">
        <Text className="mb-2 font-medium" style={{ color: "#B2A83F" }}>
          Foto de referencia *
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
            <MaterialIcons name="add-a-photo" size={24} color="#7BB3CD" />
            <Text className="text-gray-500 mt-1">Seleccionar archivo</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text className="text-sm text-gray-500 mt-4 text-center">
        * Campos obligatorios
      </Text>

      <Button
        mode="contained"
        onPress={() => setPagina(2)}
        style={{ backgroundColor: "#7BB3CD", borderRadius: 50, marginTop: 30 }}
        labelStyle={{ fontSize: 16, fontWeight: "bold" }}
      >
        Siguiente → Horarios
      </Button>
    </ScrollView>
  );

  // -------------------------
  // Página 2 — Horarios - COMPLETAMENTE CORREGIDA
  // -------------------------
  const renderPagina2 = () => (
    <ScrollView className="flex-1 px-5 py-4" style={{ backgroundColor: "#F6EEE4" }}>
      <Text className="text-2xl font-bold text-center mb-6" style={{ color: "#F2BD2B" }}>
        HORARIOS DE ATENCIÓN
      </Text>

      <Text className="text-sm text-gray-600 text-center mb-6">
        Establece los horarios en que tu estacionamiento estará abierto
      </Text>

      {showPicker && pickerInfo && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={handleTimeChange}
        />
      )}

      {diasSemana.map(({ key, label }) => {
        const horario = form.horarios[key as keyof typeof form.horarios];
        
        return (
          <View key={key} className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-semibold capitalize" style={{ color: "#B2A83F" }}>
                {label}
              </Text>
              <View className="flex-row items-center">
                <Text className={`text-sm mr-2 ${horario.abierto ? 'text-green-600' : 'text-red-600'}`}>
                  {horario.abierto ? 'Abierto' : 'Cerrado'}
                </Text>
                <Switch
                  value={horario.abierto}
                  onValueChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      horarios: {
                        ...prev.horarios,
                        [key]: { 
                          ...prev.horarios[key as keyof typeof prev.horarios], 
                          abierto: !prev.horarios[key as keyof typeof prev.horarios].abierto 
                        },
                      },
                    }))
                  }
                  thumbColor={horario.abierto ? "#7BB3CD" : "#f4f3f4"}
                  trackColor={{ false: "#767577", true: "#81b0ff" }}
                />
              </View>
            </View>

            {horario.abierto && (
              <View className="flex-row justify-between">
                <TouchableOpacity
                  className="flex-row items-center justify-between border rounded-lg px-4 py-3 bg-blue-50 w-[48%]"
                  style={{ borderColor: "#7BB3CD" }}
                  onPress={() => openTimePicker(key, "apertura", horario.apertura)}
                >
                  <View className="flex-row items-center">
                    <MaterialIcons name="schedule" size={20} color="#7BB3CD" />
                    <Text className="ml-2 font-medium">Apertura</Text>
                  </View>
                  <Text className="font-bold text-lg">{horario.apertura}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center justify-between border rounded-lg px-4 py-3 bg-orange-50 w-[48%]"
                  style={{ borderColor: "#FD721D" }}
                  onPress={() => openTimePicker(key, "cierre", horario.cierre)}
                >
                  <View className="flex-row items-center">
                    <MaterialIcons name="access-time" size={20} color="#FD721D" />
                    <Text className="ml-2 font-medium">Cierre</Text>
                  </View>
                  <Text className="font-bold text-lg">{horario.cierre}</Text>
                </TouchableOpacity>
              </View>
            )}

            {!horario.abierto && (
              <View className="bg-gray-100 rounded-lg py-3 px-4">
                <Text className="text-gray-500 text-center italic">
                  Cerrado todo el día
                </Text>
              </View>
            )}
          </View>
        );
      })}

      {/* Resumen de horarios */}
      <View className="bg-white rounded-lg p-4 mt-4 border border-gray-200">
        <Text className="text-lg font-semibold mb-2 text-center" style={{ color: "#B2A83F" }}>
          Resumen de Horarios
        </Text>
        {diasSemana.map(({ key, label }) => {
          const horario = form.horarios[key as keyof typeof form.horarios];
          return (
            <View key={key} className="flex-row justify-between py-1">
              <Text className="capitalize font-medium">{label}:</Text>
              <Text className={horario.abierto ? "text-green-600" : "text-red-600"}>
                {horario.abierto ? `${horario.apertura} - ${horario.cierre}` : 'Cerrado'}
              </Text>
            </View>
          );
        })}
      </View>

      <View className="flex-row justify-between mt-8 mb-10">
        <Button
          mode="outlined"
          onPress={() => setPagina(1)}
          style={{ 
            borderColor: "#FD721D", 
            borderRadius: 50,
            width: '48%'
          }}
          labelStyle={{ color: "#FD721D", fontWeight: "bold" }}
        >
          ← Atrás
        </Button>

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={{ 
            backgroundColor: "#7BB3CD", 
            borderRadius: 50,
            width: '48%'
          }}
          labelStyle={{ fontWeight: "bold" }}
        >
          ✅ Enviar
        </Button>
      </View>
    </ScrollView>
  );

  return <View className="flex-1">{pagina === 1 ? renderPagina1() : renderPagina2()}</View>;
}