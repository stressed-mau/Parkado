// screens/EditarParqueo.tsx
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  Platform,
  DeviceEventEmitter,
  ActivityIndicator,
} from "react-native";
import MapView, { MapPressEvent, Marker } from "react-native-maps";
import { Button, Checkbox } from "react-native-paper";
import Logo from "../assets/Logo";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface RouteParams {
  id: number;
}

interface Props {
  route: { params: RouteParams };
  onClose?: () => void;
}

export default function EditarParqueo({ route, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [pagina, setPagina] = useState(1);

  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
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
  const [pickerInfo, setPickerInfo] = useState<{ dia: string; tipo: "apertura" | "cierre" } | null>(null);
  const [tempTime, setTempTime] = useState<Date>(new Date());
  const [fotosExistentes, setFotosExistentes] = useState<string[]>([]);

  const diasSemana = [
    { key: "lunes", label: "Lunes" },
    { key: "martes", label: "Martes" },
    { key: "miercoles", label: "Miércoles" },
    { key: "jueves", label: "Jueves" },
    { key: "viernes", label: "Viernes" },
    { key: "sabado", label: "Sábado" },
    { key: "domingo", label: "Domingo" },
  ];

  // Cargar datos del parqueo existente
  useEffect(() => {
    cargarDatosParqueo();
  }, [id]);

  const cargarDatosParqueo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://parkado-backend.vercel.app/api/parqueos/${id}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Mapear datos del API al formulario
      setForm({
        nombre: data.nombre || "",
        telefono: "", // lo quitaste, lo dejamos vacío intencionalmente
        direccion: data.direccion || "",
        capacidadAutos: data.capacidades?.find((c: any) => c.tipoVehiculoId === 1)?.cantidad?.toString() || "",
        capacidadMotos: data.capacidades?.find((c: any) => c.tipoVehiculoId === 2)?.cantidad?.toString() || "",
        tarifaAutos: data.tarifas?.find((t: any) => t.tipoVehiculoId === 1 && String(t.descripcion || "").toLowerCase().includes("hora"))?.precioHora?.toString() || "",
        tarifaMotos: data.tarifas?.find((t: any) => t.tipoVehiculoId === 2 && String(t.descripcion || "").toLowerCase().includes("hora"))?.precioHora?.toString() || "",
        tarifaAutosDia: data.tarifas?.find((t: any) => t.tipoVehiculoId === 1 && String(t.descripcion || "").toLowerCase().includes("día"))?.precioHora?.toString() || "",
        tarifaMotosDia: data.tarifas?.find((t: any) => t.tipoVehiculoId === 2 && String(t.descripcion || "").toLowerCase().includes("día"))?.precioHora?.toString() || "",
        tipoLugar: (data.tipoLugar || (data.tipolugar ?? "")).toString().toLowerCase() === "lote" ? "un_piso" : ((data.tipoLugar || data.tipolugar) ? "edificio" : ""),
        latitud: data.latitud?.toString() || "",
        longitud: data.longitud?.toString() || "",
        horarios: mapearHorariosAPI(data.horarios || []),
      });

      // Servicios seleccionados
      if (data.servicios) {
        const serviciosIds = data.servicios.map((s: any) => s.servicioId).filter(Boolean);
        setServiciosSeleccionados(serviciosIds);
      }

      // Fotos existentes
      if (data.fotos && data.fotos.length > 0) {
        const urls = data.fotos.map((f: any) => f.url);
        setFotosExistentes(urls);

        // Foto principal (por convención la primera)
        if (data.fotos[0]?.url) {
          setFotoUri(data.fotos[0].url);
        }

        // --- NUEVO: intentar detectar licencia ---
        // 1) buscar en la URL palabras clave tipo 'licencia', 'license', 'permiso'
        // 2) si no hay coincidencia, usar el segundo elemento (index 1) si existe
        const licenciaPattern = /licen(cia|se)|permiso|license/i;
        let licenciaFound: string | null = null;

        for (const f of data.fotos) {
          if (f?.url && licenciaPattern.test(f.url)) {
            licenciaFound = f.url;
            break;
          }
        }

        if (!licenciaFound) {
          // fallback: si hay más de 1 foto, asumir que la segunda es la licencia
          if (data.fotos[1]?.url) licenciaFound = data.fotos[1].url;
        }

        if (licenciaFound) {
          console.log("✅ Licencia detectada y asignada:", licenciaFound);
          setLicenciaUri(licenciaFound);
        } else {
          console.log("⚠️ No se detectó una licencia en data.fotos (se usarán archivos locales si el usuario sube)");
          setLicenciaUri(null);
        }
      }

      // Ubicación en mapa
      if (data.latitud && data.longitud) {
        setLocation({
          latitude: parseFloat(data.latitud),
          longitude: parseFloat(data.longitud),
        });
      }

    } catch (error) {
      console.error("Error cargando datos del parqueo:", error);
      Alert.alert("Error", "No se pudieron cargar los datos del parqueo.");
    } finally {
      setLoading(false);
    }
  };

  const mapearHorariosAPI = (horariosAPI: any[]) => {
    const horariosBase = {
      lunes: { abierto: true, apertura: "08:00", cierre: "18:00" },
      martes: { abierto: true, apertura: "08:00", cierre: "18:00" },
      miercoles: { abierto: true, apertura: "08:00", cierre: "18:00" },
      jueves: { abierto: true, apertura: "08:00", cierre: "18:00" },
      viernes: { abierto: true, apertura: "08:00", cierre: "18:00" },
      sabado: { abierto: true, apertura: "09:00", cierre: "14:00" },
      domingo: { abierto: false, apertura: "00:00", cierre: "00:00" },
    };

    horariosAPI.forEach((horario) => {
      const diaMap: { [key: string]: string } = {
        "LUNES": "lunes",
        "MARTES": "martes",
        "MIERCOLES": "miercoles",
        "MIÉRCOLES": "miercoles",
        "JUEVES": "jueves",
        "VIERNES": "viernes",
        "SABADO": "sabado",
        "SÁBADO": "sabado",
        "DOMINGO": "domingo"
      };

      const diaKey = diaMap[String(horario.diaSemana || "").toUpperCase()];
      if (diaKey) {
        horariosBase[diaKey as keyof typeof horariosBase] = {
          abierto: !horario.esCerrado,
          apertura: horario.horaAbrir ? formatTimeFromAPI(horario.horaAbrir) : "08:00",
          cierre: horario.horaCerrar ? formatTimeFromAPI(horario.horaCerrar) : "18:00",
        };
      }
    });

    return horariosBase;
  };

  const formatTimeFromAPI = (timeString: string) => {
    if (!timeString) return "08:00";
    try {
      const date = new Date(timeString);
      return date.toTimeString().slice(0, 5);
    } catch {
      return "08:00";
    }
  };

  // Obtener permisos y coords iniciales
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted" && !location) {
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
      } catch (e) {
        console.warn("No se pudo obtener ubicación inicial:", e);
      }
    })();
  }, []);

  // Pick image
  const pickImage = async (setUri: (uri: string | null) => void) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled) setUri(result.assets[0].uri);
    } catch (e) {
      console.error("Error pick image:", e);
      Alert.alert("Error", "No se pudo seleccionar la imagen.");
    }
  };

  // Manejo de inputs con validaciones
  const handleInput = (key: string, value: string) => {
    let newValue = value;

    // Nombre: sin caracteres especiales, máximo 16 caracteres.
    if (key === "nombre") {
      const cleaned = newValue.replace(/[^\p{L}\p{N} ]/gu, "");
      newValue = cleaned.slice(0, 16);
    }

    // Teléfono: sólo dígitos y máximo 8
    if (key === "telefono") {
      newValue = value.replace(/\D/g, "").slice(0, 8);
    }

    // Capacidades: sólo dígitos, máximo 2 caracteres (0-99)
    if (key === "capacidadAutos" || key === "capacidadMotos") {
      newValue = value.replace(/\D/g, "").slice(0, 2);
    }

    // Tarifas: sólo dígitos, máximo 2 caracteres (0-99)
    if (
      key === "tarifaAutos" ||
      key === "tarifaMotos" ||
      key === "tarifaAutosDia" ||
      key === "tarifaMotosDia"
    ) {
      newValue = value.replace(/\D/g, "").slice(0, 2);
    }

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

  // Horarios picker
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (!pickerInfo) {
      setShowPicker(false);
      return;
    }

    if (Platform.OS === "android") {
      if (event?.type === "dismissed") {
        setShowPicker(false);
        setPickerInfo(null);
        return;
      }
    }

    const date = selectedDate || tempTime;
    if (!date) {
      setShowPicker(false);
      setPickerInfo(null);
      return;
    }

    const { dia, tipo } = pickerInfo;
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const formattedTime = `${hours}:${minutes}`;

    setForm((prev) => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [dia]: {
          ...prev.horarios[dia as keyof typeof prev.horarios],
          [tipo]: formattedTime,
        },
      },
    }));

    setShowPicker(false);
    setPickerInfo(null);
  };

  const openTimePicker = (dia: string, tipo: "apertura" | "cierre", currentTime: string) => {
    const [hours, minutes] = currentTime.split(":").map(Number);
    const date = new Date();
    date.setHours(isNaN(hours) ? 0 : hours, isNaN(minutes) ? 0 : minutes, 0, 0);

    setTempTime(date);
    setPickerInfo({ dia, tipo });
    setShowPicker(true);
  };

  // Upload Cloudinary
  const uploadToCloudinary = async (uri: string) => {
    try {
      // Si la URI ya es una URL de Cloudinary, no subir de nuevo
      if (uri.includes('cloudinary.com')) {
        return uri;
      }

      const formData = new FormData();
      const fileType = uri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

      formData.append("file", {
        uri,
        type: fileType,
        name: `upload_${Date.now()}.${fileType === "image/png" ? "png" : "jpg"}`,
      } as any);

      formData.append("upload_preset", "Parkado");
      formData.append("cloud_name", "dthb7c50y");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dthb7c50y/image/upload`,
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const txt = await response.text();
        console.error("Cloudinary error:", txt);
        return null;
      }
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading to cloudinary:", error);
      return null;
    }
  };

  // Leer usuario actual
  const obtenerUsuarioActual = async () => {
    try {
      const data = await AsyncStorage.getItem("userData");
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      console.error("Error leyendo userData:", e);
      return null;
    }
  };

  // Validaciones antes de enviar
  const validarAntesDeEnviar = () => {
    const nombre = (form.nombre || "").trim();
    if (!nombre) {
      Alert.alert("Nombre requerido", "Ingresa el nombre del estacionamiento.");
      return false;
    }
    if (nombre.length > 16) {
      Alert.alert("Nombre inválido", "El nombre debe tener máximo 16 caracteres.");
      return false;
    }
    const nombreValido = /^[\p{L}\p{N} ]+$/u.test(nombre);
    if (!nombreValido) {
      Alert.alert("Nombre inválido", "El nombre no debe contener caracteres especiales.");
      return false;
    }

    if (!form.latitud || !form.longitud) {
      Alert.alert("Ubicación requerida", "Selecciona la ubicación en el mapa.");
      return false;
    }

    const camposCapacidad = ["capacidadAutos", "capacidadMotos"] as const;
    for (const key of camposCapacidad) {
      const val = (form as any)[key];
      if (val && !/^\d{1,2}$/.test(val)) {
        Alert.alert("Capacidad inválida", "Las capacidades deben ser números entre 0 y 99.");
        return false;
      }
    }

    const camposTarifa = ["tarifaAutos", "tarifaMotos", "tarifaAutosDia", "tarifaMotosDia"] as const;
    for (const key of camposTarifa) {
      const val = (form as any)[key];
      if (val && !/^\d{1,2}$/.test(val)) {
        Alert.alert("Tarifa inválida", "Las tarifas deben ser números enteros entre 0 y 99 (Bs).");
        return false;
      }
    }

    if (!form.tipoLugar) {
      Alert.alert("Tipo de lugar", "Selecciona el tipo de lugar.");
      return false;
    }

    if (!fotoUri) {
      Alert.alert("Falta foto", "Selecciona una foto de referencia.");
      return false;
    }

    return true;
  };

  // Actualizar parqueo
  const handleUpdate = async () => {
    try {
      if (!validarAntesDeEnviar()) return;

      setUpdating(true);

      const usuario = await obtenerUsuarioActual();
      if (!usuario || !usuario.id) {
        Alert.alert("Error", "Usuario no autenticado. Inicia sesión para actualizar el parqueo.");
        return;
      }
      const propietarioIdReal = usuario.id;

      // Subir imágenes si son nuevas
      const urlsFotos: string[] = [];
      if (fotoUri) {
        const u = await uploadToCloudinary(fotoUri);
        if (u) urlsFotos.push(u);
        else {
          Alert.alert("Error", "No se pudo subir la foto de referencia.");
          return;
        }
      }
      if (licenciaUri) {
        const u = await uploadToCloudinary(licenciaUri);
        if (u) urlsFotos.push(u);
      }

      // Conservar fotos existentes que no se hayan cambiado
      const fotosParaConservar = fotosExistentes.filter(url => 
        url !== fotoUri && !urlsFotos.includes(url)
      );
      const todasLasFotos = [...fotosParaConservar, ...urlsFotos];

      const horariosParaBackend = diasSemana.map(({ key, label }) => {
        const horario = form.horarios[key as keyof typeof form.horarios];
        return {
          diaSemana: label.toUpperCase(),
          horaAbrir: horario.abierto ? horario.apertura : "00:00",
          horaCerrar: horario.abierto ? horario.cierre : "00:00",
          esCerrado: !horario.abierto,
        };
      });

      const body = {
        userId: propietarioIdReal, // Requerido para autorización según la API
        nombre: form.nombre.trim(),
        direccion: (form.direccion || "").trim(),
        tipoLugar: form.tipoLugar === "un_piso" ? "Un Piso" : "Edificio",
        latitud: parseFloat(form.latitud),
        longitud: parseFloat(form.longitud),
        capacidades: [
          { cantidad: parseInt(form.capacidadAutos) || 0, tipoVehiculoId: 1 },
          { cantidad: parseInt(form.capacidadMotos) || 0, tipoVehiculoId: 2 },
        ],
        serviciosAsociados: serviciosSeleccionados,
        tarifas: [
          { descripcion: "Hora Auto", precioHora: parseFloat(form.tarifaAutos) || 0, tipoVehiculoId: 1 },
          { descripcion: "Hora Moto", precioHora: parseFloat(form.tarifaMotos) || 0, tipoVehiculoId: 2 },
          { descripcion: "Día Auto", precioHora: parseFloat(form.tarifaAutosDia) || 0, tipoVehiculoId: 1 },
          { descripcion: "Día Moto", precioHora: parseFloat(form.tarifaMotosDia) || 0, tipoVehiculoId: 2 },
        ],
        horarios: horariosParaBackend,
        fotos: todasLasFotos.map((url) => ({ url })),
      };

      console.log("Actualizando parqueo:", JSON.stringify(body, null, 2));

      const response = await fetch(`https://parkado-backend.vercel.app/api/parqueos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("✅ Éxito", "Parqueo actualizado correctamente.");
        
        // Emitir evento para recargar datos
        try {
          DeviceEventEmitter.emit("parqueoUpdated");
        } catch (e) {
          console.warn("Error emitiendo evento parqueoUpdated", e);
        }
        
        // Cerrar la vista de edición
        if (onClose) {
          onClose();
        }
      } else {
        console.error("Respuesta error del servidor:", data);
        Alert.alert("❌ Error", data.message || "No se pudo actualizar el parqueo.");
      }
    } catch (error) {
      console.error("Error general al actualizar:", error);
      Alert.alert(
        "Error de conexión",
        "Ocurrió un problema al actualizar el formulario. Verifica tu conexión a internet."
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: "#F6EEE4" }}>
        <ActivityIndicator size="large" color="#7BB3CD" />
        <Text className="mt-4 text-lg">Cargando datos del parqueo...</Text>
      </View>
    );
  }

  // Página 1
  const renderPagina1 = () => (
    <ScrollView
      className="flex-1 px-5 py-4"
      style={{ backgroundColor: "#F6EEE4" }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 6 }}
      keyboardShouldPersistTaps="handled"
    >

{/* 🔙 BOTÓN VOLVER (si viene onClose) */}
{onClose && (
  <TouchableOpacity
    onPress={onClose}
    style={{
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      marginBottom: 20,
    }}
  >
    <MaterialCommunityIcons
      name="arrow-left-circle"
      size={26}
      color="#1f2937"
      style={{ marginRight: 6 }}
    />
    <Text style={{ fontWeight: "700", fontSize: 16 }}>
      Volver
    </Text>
  </TouchableOpacity>
)}


      <Logo />
      <Text className="text-2xl font-bold text-center mb-4" style={{ color: "#F2BD2B" }}>
        EDITAR ESTACIONAMIENTO
      </Text>

{/* Botón Volver */}
    

      {/* Nombre */}
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
          maxLength={16}
        />
        <Text className="text-sm text-gray-500 mt-1">Máx. 16 caracteres. Sin símbolos especiales.</Text>
      </View>

      {/* Dirección manual */}
      <View className="mb-4">
        <Text className="mb-1 font-medium" style={{ color: "#B2A83F" }}>
          Dirección (manual)
        </Text>
        <TextInput
          className="rounded-lg px-3 py-2 bg-white border border-[#7BB3CD]"
          value={form.direccion}
          onChangeText={(text) => handleInput("direccion", text)}
          placeholder="Ej: Calle 1 #123"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Tel/Capacidades/Tarifas */}
      {[
        
        ["capacidadAutos", "Capacidad total de autos", "numeric"],
        ["capacidadMotos", "Capacidad total de motos", "numeric"],
        ["tarifaAutos", "Tarifa autos/hora (Bs)", "numeric"],
        ["tarifaMotos", "Tarifa motos/hora (Bs)", "numeric"],
        ["tarifaAutosDia", "Tarifa autos/día (Bs)", "numeric"],
        ["tarifaMotosDia", "Tarifa motos/día (Bs)", "numeric"],
      ].map(([key, label, keyboardType]) => (
        <View key={key} className="mb-4">
          <Text className="mb-1 font-medium" style={{ color: "#B2A83F" }}>
            {label}
          </Text>
          <TextInput
            className="rounded-lg px-3 py-2 bg-white border border-[#7BB3CD]"
            value={String((form as any)[key])}
            onChangeText={(text) => handleInput(key, text)}
            placeholder={label}
            placeholderTextColor="#9CA3AF"
            keyboardType={keyboardType as any}
            maxLength={key.startsWith("tarifa") || key.startsWith("capacidad") ? 2 : undefined}
          />
        </View>
      ))}

      {/* Servicios */}
      <View className="mb-4 mt-2">
        <Text className="mb-2 font-medium" style={{ color: "#B2A83F" }}>
          Servicios Asociados
        </Text>
        {[{ id: 1, nombre: "Lavado de autos" }, { id: 2, nombre: "Inflado de llantas" }].map((serv) => (
          <View key={serv.id} className="flex-row items-center mb-1">
            <Checkbox
              status={serviciosSeleccionados.includes(serv.id) ? "checked" : "unchecked"}
              onPress={() =>
                setServiciosSeleccionados((prev) =>
                  prev.includes(serv.id) ? prev.filter((s) => s !== serv.id) : [...prev, serv.id]
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
          Licencia de funcionamiento (opcional)
        </Text>
        {licenciaUri ? (
          <View className="relative items-center">
            <Image source={{ uri: licenciaUri }} style={{ width: 160, height: 160 }} />
            <TouchableOpacity
              style={{ position: "absolute", top: 6, right: 6, backgroundColor: "#f44336", borderRadius: 20, padding: 6 }}
              onPress={() => setLicenciaUri(null)}
            >
              <MaterialIcons name="delete" size={18} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={{ borderWidth: 1, borderColor: "#7BB3CD", borderRadius: 8, paddingVertical: 12, alignItems: "center", backgroundColor: "white" }}
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
            <Image source={{ uri: fotoUri }} style={{ width: 160, height: 160 }} />
            <TouchableOpacity
              style={{ position: "absolute", top: 6, right: 6, backgroundColor: "#f44336", borderRadius: 20, padding: 6 }}
              onPress={() => setFotoUri(null)}
            >
              <MaterialIcons name="delete" size={18} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={{ borderWidth: 1, borderColor: "#7BB3CD", borderRadius: 8, paddingVertical: 12, alignItems: "center", backgroundColor: "white" }}
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

      <View style={{ marginTop: 30, marginBottom: Math.max(6, insets.bottom) }}>
        <Button
          mode="contained"
          onPress={() => setPagina(2)}
          style={{ backgroundColor: "#7BB3CD", borderRadius: 50 }}
          labelStyle={{ fontSize: 16, fontWeight: "bold" }}
        >
          Siguiente → Horarios
        </Button>
      </View>
    </ScrollView>
  );

  // Página 2 — Horarios
  const renderPagina2 = () => (
    <ScrollView
      className="flex-1 px-5 py-8"
      style={{ backgroundColor: "#F6EEE4" }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 6 }}
      keyboardShouldPersistTaps="handled"
    >
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
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleTimeChange}
        />
      )}

      {diasSemana.map(({ key, label }) => {
        const horario = form.horarios[key as keyof typeof form.horarios];

        return (
          <View key={key} style={{ backgroundColor: "white", borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#B2A83F" }}>{label}</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ marginRight: 8, color: horario.abierto ? "#16a34a" : "#dc2626" }}>{horario.abierto ? "Abierto" : "Cerrado"}</Text>
                <Switch
                  value={horario.abierto}
                  onValueChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      horarios: {
                        ...prev.horarios,
                        [key]: {
                          ...prev.horarios[key as keyof typeof prev.horarios],
                          abierto: !prev.horarios[key as keyof typeof prev.horarios].abierto,
                        },
                      },
                    }))
                  }
                  thumbColor={horario.abierto ? "#7BB3CD" : "#f4f3f4"}
                />
              </View>
            </View>

            {horario.abierto ? (
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <TouchableOpacity onPress={() => openTimePicker(key, "apertura", horario.apertura)} style={{ width: "48%", padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "#7BB3CD", backgroundColor: "#EFF9FB" }}>
                  <Text style={{ fontWeight: "600" }}>Apertura</Text>
                  <Text style={{ marginTop: 6, fontSize: 16 }}>{horario.apertura}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => openTimePicker(key, "cierre", horario.cierre)} style={{ width: "48%", padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "#FD721D", backgroundColor: "#FFF7ED" }}>
                  <Text style={{ fontWeight: "600" }}>Cierre</Text>
                  <Text style={{ marginTop: 6, fontSize: 16 }}>{horario.cierre}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ textAlign: "center", color: "#6b7280" }}>Cerrado todo el día</Text>
            )}
          </View>
        );
      })}

      {/* Resumen */}
      <View style={{ backgroundColor: "white", borderRadius: 10, padding: 12, marginTop: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", textAlign: "center", color: "#B2A83F", marginBottom: 8 }}>Resumen de Horarios</Text>
        {diasSemana.map(({ key, label }) => {
          const horario = form.horarios[key as keyof typeof form.horarios];
          return (
            <View key={key} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }}>
              <Text style={{ textTransform: "capitalize" }}>{label}:</Text>
              <Text style={{ color: horario.abierto ? "#16a34a" : "#dc2626" }}>
                {horario.abierto ? `${horario.apertura} - ${horario.cierre}` : "Cerrado"}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16, marginBottom: Math.max(6, insets.bottom) }}>
        <Button 
          mode="outlined" 
          onPress={() => setPagina(1)} 
          style={{ borderColor: "#7BB3CD", width: "48%" }} 
          labelStyle={{ color: "#7BB3CD" }}
        >
          Atrás
        </Button>

        <Button 
          mode="contained" 
          onPress={handleUpdate} 
          style={{ backgroundColor: "#7BB3CD", width: "48%" }}
          loading={updating}
          disabled={updating}
        >
          {updating ? "Actualizando..." : "Actualizar"}
        </Button>
      </View>
    </ScrollView>
  );

  return <View style={{ flex: 1 }}>{pagina === 1 ? renderPagina1() : renderPagina2()}</View>;
}
