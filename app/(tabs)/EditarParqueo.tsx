// EditarEstacionamiento.tsx
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
  ActivityIndicator,
} from "react-native";
import MapView, { MapPressEvent, Marker } from "react-native-maps";
import { Button, Checkbox } from "react-native-paper";
import Logo from "../../assets/Logo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

/* =======================
   HELPERS FECHAS / HORAS
   ======================= */

/** ISO ("1970-01-01T12:00:00.000Z" o "2025-11-01T14:00:00") -> "HH:MM" */
const isoToTime = (value: string | null | undefined, fallback: string = "08:00"): string => {
  if (!value) return fallback;

  // Si ya viene en formato "HH:MM"
  if (/^\d{2}:\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (isNaN(date.getTime())) return fallback;

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

/**
 * "HH:MM" -> ISO-8601.
 * Para horarios de parqueo usamos una fecha fija (1970-01-01) como en la BD.
 * Resultado: "1970-01-01THH:MM:00"
 */
const timeToIsoHorario = (time: string): string => {
  const [hRaw, mRaw] = time.split(":");
  const h = Number(hRaw ?? 0);
  const m = Number(mRaw ?? 0);
  const d = new Date(Date.UTC(1970, 0, 1, h, m, 0));
  // "1970-01-01T12:00:00.000Z" -> "1970-01-01T12:00:00"
  return d.toISOString().split(".")[0];
};

/**
 * Para RESERVAS (no para horarios de parqueo):
 * Combina una fecha (YYYY-MM-DD) + hora ("HH:MM") en un ISO futuro.
 * (Te dejo el helper por si lo quieres usar en tu hook de reservas).
 */
export const buildFutureIso = (datePart: string, time: string): string => {
  const [year, month, day] = datePart.split("-").map(Number);
  const [hRaw, mRaw] = time.split(":");
  const h = Number(hRaw ?? 0);
  const m = Number(mRaw ?? 0);

  const d = new Date(year, (month ?? 1) - 1, day ?? 1, h, m, 0, 0);
  const now = new Date();
  if (d <= now) {
    // si te exige "en el futuro", lo subimos un día
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().split(".")[0]; // "YYYY-MM-DDTHH:MM:SS"
};

/* =======================
   COMPONENTE
   ======================= */

export default function EditarEstacionamiento({ route, navigation }: any) {
  // si no hay route.params.parqueoId, usar 1 para pruebas
  const parqueoId = route?.params?.parqueoId ?? 1;
  console.log("EditarEstacionamiento: cargando parqueoId =", parqueoId);

  const [pagina, setPagina] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [form, setForm] = useState<any>({
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
  const [fotosExistentes, setFotosExistentes] = useState<Array<{ url: string; id?: string }>>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<number[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerInfo, setPickerInfo] = useState<{ dia: string; tipo: "apertura" | "cierre" } | null>(
    null
  );
  const [tempTime, setTempTime] = useState<Date>(new Date());

  const serviciosDisponibles = [
    { id: 1, nombre: "Lavado de autos" },
    { id: 2, nombre: "Inflado de llantas" },
  ];

  const diasSemana = [
    { key: "lunes", label: "Lunes" },
    { key: "martes", label: "Martes" },
    { key: "miercoles", label: "Miércoles" },
    { key: "jueves", label: "Jueves" },
    { key: "viernes", label: "Viernes" },
    { key: "sabado", label: "Sábado" },
    { key: "domingo", label: "Domingo" },
  ];

  /* -------------------------
     Permisos y ubicación inicial
     ------------------------- */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        setForm((f: any) => ({
          ...f,
          latitud: f.latitud || String(loc.coords.latitude),
          longitud: f.longitud || String(loc.coords.longitude),
        }));
      }
    })();
  }, []);

  /* -------------------------
     Cargar parqueo existente (GET)
     ------------------------- */
  useEffect(() => {
    if (!parqueoId) return;
    fetchParqueo(parqueoId);
  }, [parqueoId]);

  const fetchParqueo = async (id: number) => {
    try {
      setIsFetching(true);
      const res = await fetch(`https://parkado-backend.vercel.app/api/parqueos/${id}`);
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Error al obtener parqueo: ${res.status} ${txt}`);
      }
      const detalle = (await res.json()) as any;

      // Capacidades
      const capacidadAutosObj = (detalle.capacidades || []).find((c: any) => c.tipoVehiculoId === 1);
      const capacidadMotosObj = (detalle.capacidades || []).find((c: any) => c.tipoVehiculoId === 2);

      // Tarifas
      const tarifaAutoObj = (detalle.tarifas || []).find(
        (t: any) => t.tipoVehiculoId === 1 && t.descripcion?.toLowerCase().includes("hora")
      );
      const tarifaMotoObj = (detalle.tarifas || []).find(
        (t: any) => t.tipoVehiculoId === 2 && t.descripcion?.toLowerCase().includes("hora")
      );
      const tarifaAutoDiaObj = (detalle.tarifas || []).find(
        (t: any) =>
          t.tipoVehiculoId === 1 &&
          (t.descripcion?.toLowerCase().includes("día") ||
            t.descripcion?.toLowerCase().includes("dia"))
      );
      const tarifaMotoDiaObj = (detalle.tarifas || []).find(
        (t: any) =>
          t.tipoVehiculoId === 2 &&
          (t.descripcion?.toLowerCase().includes("día") ||
            t.descripcion?.toLowerCase().includes("dia"))
      );

      // Horarios desde backend (ISO -> "HH:MM")
      const horariosBackend = detalle.horarios || [];
      const horariosLocal: any = { ...form.horarios }; // defaults

      horariosBackend.forEach((h: any) => {
        const diaKey = (() => {
          const ds = String(h.diaSemana || "").toLowerCase();
          if (ds.includes("lunes")) return "lunes";
          if (ds.includes("martes")) return "martes";
          if (ds.includes("miercoles") || ds.includes("miércoles")) return "miercoles";
          if (ds.includes("jueves")) return "jueves";
          if (ds.includes("viernes")) return "viernes";
          if (ds.includes("sabado") || ds.includes("sábado")) return "sabado";
          if (ds.includes("domingo")) return "domingo";
          return null;
        })();
        if (!diaKey) return;
        horariosLocal[diaKey] = {
          abierto: !h.esCerrado && (h.horaAbrir || h.horaCerrar),
          apertura: h.esCerrado ? "00:00" : isoToTime(h.horaAbrir, "08:00"),
          cierre: h.esCerrado ? "00:00" : isoToTime(h.horaCerrar, "18:00"),
        };
      });

      const fotos = Array.isArray(detalle.fotos)
        ? detalle.fotos.map((f: any) => ({ url: f.url }))
        : [];

      const serviciosAsociados = Array.isArray(detalle.serviciosAsociados)
        ? detalle.serviciosAsociados.map(Number)
        : [];

      const licenciaUrl = detalle.licenciaUrl ?? null;

      setForm((prev: any) => ({
        ...prev,
        nombre: detalle.nombre ?? prev.nombre,
        telefono: detalle.telefono ?? prev.telefono ?? "",
        capacidadAutos: capacidadAutosObj ? String(capacidadAutosObj.cantidad) : prev.capacidadAutos,
        capacidadMotos: capacidadMotosObj ? String(capacidadMotosObj.cantidad) : prev.capacidadMotos,
        tarifaAutos: tarifaAutoObj
          ? String(tarifaAutoObj.precioHora ?? tarifaAutoObj.precio)
          : prev.tarifaAutos,
        tarifaMotos: tarifaMotoObj
          ? String(tarifaMotoObj.precioHora ?? tarifaMotoObj.precio)
          : prev.tarifaMotos,
        tarifaAutosDia: tarifaAutoDiaObj
          ? String(tarifaAutoDiaObj.precioDia ?? tarifaAutoDiaObj.precio ?? "")
          : prev.tarifaAutosDia,
        tarifaMotosDia: tarifaMotoDiaObj
          ? String(tarifaMotoDiaObj.precioDia ?? tarifaMotoDiaObj.precio ?? "")
          : prev.tarifaMotosDia,
        tipoLugar: detalle.tipoLugar ?? prev.tipoLugar,
        latitud: detalle.latitud != null ? String(detalle.latitud) : prev.latitud,
        longitud: detalle.longitud != null ? String(detalle.longitud) : prev.longitud,
        horarios: horariosLocal,
      }));

      if (detalle.latitud != null && detalle.longitud != null) {
        setLocation({ latitude: Number(detalle.latitud), longitude: Number(detalle.longitud) });
      }

      setFotosExistentes(fotos);
      setServiciosSeleccionados(serviciosAsociados);
      if (licenciaUrl) setLicenciaUri(licenciaUrl);
    } catch (err: any) {
      console.error("Error al traer parqueo:", err);
      Alert.alert("Error", "No se pudo cargar la información del parqueo.");
    } finally {
      setIsFetching(false);
    }
  };

  /* -------------------------
     Imágenes
     ------------------------- */
  const pickImage = async (setUri: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setUri(result.assets[0].uri);
  };

  /* -------------------------
     Inputs generales
     ------------------------- */
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

  /* -------------------------
     Horarios
     ------------------------- */
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);

    if (selectedDate && pickerInfo) {
      const { dia, tipo } = pickerInfo;
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      const formattedTime = `${hours}:${minutes}`;

      setForm((prev: any) => ({
        ...prev,
        horarios: {
          ...prev.horarios,
          [dia]: {
            ...prev.horarios[dia],
            [tipo]: formattedTime,
          },
        },
      }));
    }
  };

  const openTimePicker = (dia: string, tipo: "apertura" | "cierre", currentTime: string) => {
    const [hours, minutes] = currentTime.split(":").map(Number);
    const date = new Date();
    date.setHours(hours || 0, minutes || 0, 0, 0);

    setTempTime(date);
    setPickerInfo({ dia, tipo });
    setShowPicker(true);
  };

  /* -------------------------
     Cloudinary
     ------------------------- */
  const uploadToCloudinary = async (uri: string) => {
    try {
      const formData = new FormData();

      const fileType = uri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

      formData.append("file", {
        uri,
        type: fileType,
        name: `upload_${Date.now()}.${fileType === "image/png" ? "png" : "jpg"}`,
      } as any);

      formData.append("upload_preset", "Parkado");
      formData.append("cloud_name", "dthb7c50y");

      const response = await fetch(`https://api.cloudinary.com/v1_1/dthb7c50y/image/upload`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Cloudinary error text:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  /* -------------------------
     Guardar cambios (PATCH) — aquí usamos timeToIsoHorario
     ------------------------- */
  const handleUpdate = async () => {
    try {
      if (!parqueoId) {
        Alert.alert("Error", "ID de parqueo no proporcionado.");
        return;
      }

      if (!form.nombre.trim() || !form.latitud || !form.longitud) {
        Alert.alert("Campos incompletos", "Por favor completa los campos obligatorios.");
        return;
      }

      setIsLoading(true);

      const uploadedUrls: string[] = [];

      if (fotoUri && !fotoUri.startsWith("http")) {
        const url = await uploadToCloudinary(fotoUri);
        if (url) uploadedUrls.push(url);
        else {
          Alert.alert("Error", "No se pudo subir la foto de referencia.");
          setIsLoading(false);
          return;
        }
      }

      if (licenciaUri && !licenciaUri.startsWith("http")) {
        const url = await uploadToCloudinary(licenciaUri);
        if (url) {
          uploadedUrls.push(url);
          setLicenciaUri(url);
        } else {
          Alert.alert("Error", "No se pudo subir la licencia.");
          setIsLoading(false);
          return;
        }
      }

      const fotosFinales = [
        ...fotosExistentes.map((f) => ({ url: f.url })),
        ...uploadedUrls.map((u) => ({ url: u })),
      ];

      // Horarios para backend: "HH:MM" -> ISO "1970-01-01THH:MM:SS"
      const horariosParaBackend = diasSemana.map(({ key, label }) => {
        const horario = form.horarios[key];
        return {
          diaSemana: label,
          horaAbrir: horario.abierto ? timeToIsoHorario(horario.apertura) : null,
          horaCerrar: horario.abierto ? timeToIsoHorario(horario.cierre) : null,
          esCerrado: !horario.abierto,
        };
      });

      const body = {
        nombre: form.nombre.trim(),
        direccion: form.direccion ?? "Dirección seleccionada en mapa",
        tipoLugar: form.tipoLugar === "un_piso" ? "Un Piso" : "Edificio",
        propietarioId: form.propietarioId ?? 2,
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
        fotos: fotosFinales,
        licenciaUrl: licenciaUri && licenciaUri.startsWith("http") ? licenciaUri : undefined,
      };

      console.log("PATCH body:", body);

      const response = await fetch(
        `https://parkado-backend.vercel.app/api/parqueos/${parqueoId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json().catch(() => null);

      if (response.ok) {
        Alert.alert("✅ Éxito", "Parqueo actualizado correctamente.", [
          {
            text: "OK",
            onPress: () => {
              navigation?.goBack?.();
            },
          },
        ]);
      } else {
        console.error("Server error al actualizar:", data);
        Alert.alert("Error", data?.message || "No se pudo actualizar el parqueo.");
      }
    } catch (error) {
      console.error("Error al actualizar parqueo:", error);
      Alert.alert("Error", "Ocurrió un problema al actualizar. Verifica tu conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  const removeExistingPhoto = (index: number) => {
    setFotosExistentes((prev) => prev.filter((_, i) => i !== index));
  };

  /* =======================
     UI
     ======================= */

  const renderPagina1 = () => (
    <ScrollView className="flex-1 px-5 py-4" style={{ backgroundColor: "#F6EEE4" }}>
      <Logo />
      <Text className="text-2xl font-bold text-center mb-4" style={{ color: "#F2BD2B" }}>
        EDITAR ESTACIONAMIENTO
      </Text>

      {isFetching ? (
        <View className="items-center my-6">
          <ActivityIndicator size="large" color="#7BB3CD" />
          <Text className="mt-2 text-gray-600">Cargando datos...</Text>
        </View>
      ) : (
        <>
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
                value={String(form[key])}
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
            {serviciosDisponibles.map((serv) => (
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
              <Picker selectedValue={form.tipoLugar} onValueChange={(value) => handleInput("tipoLugar", value)}>
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
              {location ? (
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
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className="text-gray-500">Cargando mapa...</Text>
                </View>
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

          {/* Fotos existentes */}
          <View className="mt-6">
            <Text className="mb-2 font-medium" style={{ color: "#B2A83F" }}>
              Fotos existentes
            </Text>
            <View className="flex-row flex-wrap">
              {fotosExistentes.length === 0 && (
                <Text className="text-sm text-gray-500">No hay fotos</Text>
              )}
              {fotosExistentes.map((f, index) => (
                <View key={index} className="mr-3 mb-3 items-center">
                  <Image source={{ uri: f.url }} className="w-28 h-28 rounded-lg" />
                  <TouchableOpacity
                    className="mt-1 bg-red-500 rounded-full p-1"
                    onPress={() =>
                      Alert.alert("Eliminar foto", "¿Deseas eliminar esta foto localmente?", [
                        { text: "Cancelar" },
                        { text: "Eliminar", onPress: () => removeExistingPhoto(index) },
                      ])
                    }
                  >
                    <MaterialIcons name="delete" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Foto nueva */}
          <View className="mt-6">
            <Text className="mb-2 font-medium" style={{ color: "#B2A83F" }}>
              Agregar foto de referencia
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
        </>
      )}
    </ScrollView>
  );

  const renderPagina2 = () => (
    <ScrollView contentInsetAdjustmentBehavior="automatic"
 className="flex-1 px-5 py-4" style={{ backgroundColor: "#F6EEE4" }}>
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
        const horario = form.horarios[key];

        return (
          <View key={key} className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-semibold capitalize" style={{ color: "#B2A83F" }}>
                {label}
              </Text>
              <View className="flex-row items-center">
                <Text
                  className={`text-sm mr-2 ${
                    horario.abierto ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {horario.abierto ? "Abierto" : "Cerrado"}
                </Text>
                <Switch
                  value={horario.abierto}
                  onValueChange={() =>
                    setForm((prev: any) => ({
                      ...prev,
                      horarios: {
                        ...prev.horarios,
                        [key]: {
                          ...prev.horarios[key],
                          abierto: !prev.horarios[key].abierto,
                        },
                      },
                    }))
                  }
                  thumbColor={horario.abierto ? "#7BB3CD" : "#f4f3f4"}
                  trackColor={{ false: "#767577", true: "#81b0ff" }}
                />
              </View>
            </View>

            {horario.abierto ? (
              <View className="flex-row justify-between">
                <TouchableOpacity
                  className="flex-row items-center justify-between border rounded-lg px-4 py-3 bg-blue-50 w-[48%]"
                  style={{ borderColor: "#7BB3CD" }}
                  onPress={() => openTimePicker(key, "apertura", horario.apertura)}
                >
                  <View className="flex-row items-center">
                    <MaterialIcons name="schedule" size={20} color="#7BB3CD" />
                    <Text className="ml-2 font-medium">Apertura  </Text>
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
            ) : (
              <View className="bg-gray-100 rounded-lg py-3 px-4">
                <Text className="text-gray-500 text-center italic">
                  Cerrado todo el día
                </Text>
              </View>
            )}
          </View>
        );
      })}

      {/* Resumen */}
      <View className="bg-white rounded-lg p-4 mt-4 border border-gray-200">
        <Text
          className="text-lg font-semibold mb-2 text-center"
          style={{ color: "#B2A83F" }}
        >
          Resumen de Horarios
        </Text>
        {diasSemana.map(({ key, label }) => {
          const horario = form.horarios[key];
          return (
            <View key={key} className="flex-row justify-between py-1">
              <Text className="capitalize font-medium">{label}:</Text>
              <Text
                className={horario.abierto ? "text-green-600" : "text-red-600"}
              >
                {horario.abierto
                  ? `${horario.apertura} - ${horario.cierre}`
                  : "Cerrado"}
              </Text>
            </View>
          );
        })}
      </View>

      <View className="flex-row justify-between mt-8 mb-10">
        <Button
          mode="outlined"
          onPress={() => setPagina(1)}
          style={{ borderColor: "#FD721D", borderRadius: 50, width: "48%" }}
          labelStyle={{ color: "#FD721D", fontWeight: "bold" }}
        >
          ← Atrás
        </Button>

        <Button
          mode="contained"
          onPress={handleUpdate}
          style={{ backgroundColor: "#7BB3CD", borderRadius: 50, width: "48%" }}
          labelStyle={{ fontWeight: "bold" }}
          loading={isLoading}
        >
          {isLoading ? "Guardando..." : "✅ Guardar cambios"}
        </Button>
      </View>
    </ScrollView>
  );

  return <View className="flex-1">{pagina === 1 ? renderPagina1() : renderPagina2()}</View>;
}
