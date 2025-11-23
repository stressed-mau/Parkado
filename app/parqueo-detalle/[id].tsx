// app/parqueo-detalle/[id].tsx
import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import ReviewsModal from "@/components/Comment/Reviews";

/* ============================
   INTERFACES
   (mantengo las mínimas necesarias)
============================ */
interface Calificacion { puntuacion: string; comentario: string; }
interface Capacidad { id: number; cantidad: number; tipoVehiculoId: number; tipoVehiculo: { nombre: string }; }
interface Servicio { estado: boolean; servicio: { nombre: string }; }
interface Horario { diaSemana: string; horaAbrir: string; horaCerrar: string; esCerrado: boolean; }
interface Tarifa { tipoVehiculoId: number; precioHora: string; descripcion: string; }
interface Foto { url: string }
interface ParqueoDetalleAPI {
  id: number;
  nombre: string;
  direccion: string;
  tipoLugar: string;
  latitud: number;
  longitud: number;
  capacidades: Capacidad[];
  tarifas: Tarifa[];
  horarios: Horario[];
  calificaciones: Calificacion[];
  servicios: Servicio[];
  fotos: Foto[];
  descripcion?: string;
  plazas: any[];
}

const ALL_DAYS = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"];

/* ============================
   HELPERS
============================ */
const formatHour = (t: string) => {
  if (!t) return "N/A";

  // Convertir el valor ISO-8601 a un objeto Date
  const date = new Date(t);

  // Verificar si la conversión fue exitosa
  if (isNaN(date.getTime())) {
    return "N/A"; // Si la fecha es inválida, devolver "N/A"
  }

  // Sumar 4 horas (en milisegundos)
  date.setHours(date.getHours() + 4);

  // Extraer las horas y minutos
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Ajustar el formato a 12 horas
  const hour12 = hours % 12 || 12;
  const period = hours >= 12 ? 'PM' : 'AM';

  // Retornar el formato de hora con minutos
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
};



const RatingStars = ({ rating }: { rating: number }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <Text style={{ color: '#F2BD2B', fontSize: 18 }}>
      {"★".repeat(full)}{half ? "½" : ""}{"☆".repeat(empty)}
    </Text>
  );
};

/* ============================
   NORMALIZACIÓN DE DATOS
============================ */
const useParqueoStats = (d: ParqueoDetalleAPI | null) => useMemo(() => {
  if (!d?.calificaciones?.length) return { average: 0, count: 0 };
  const sum = d.calificaciones.reduce((a, c) => a + (parseFloat(c.puntuacion as any) || 0), 0);
  return { average: +(sum / d.calificaciones.length).toFixed(1), count: d.calificaciones.length };
}, [d]);

const useParqueoData = (d: ParqueoDetalleAPI | null) => useMemo(() => {
  if (!d) return {
    imagenes: [] as string[],
    img: 'https://via.placeholder.com/400x250?text=No+Image',
    tarifaAuto: 0, tarifaMoto: 0,
    autoCap: 0, motoCap: 0,
    autoDisp: 0, motoDisp: 0,
    servicios: [] as Servicio[]
  };

  const imagenes = d.fotos?.length ? d.fotos.map(f => f.url) : ['https://via.placeholder.com/400x250?text=No+Image'];
  const img = imagenes[0];

  const tarifaAutoObj = d.tarifas?.find(t => t.tipoVehiculoId === 1) ?? d.tarifas?.find(t => (t.descripcion || '').toLowerCase().includes('auto'));
  const tarifaMotoObj = d.tarifas?.find(t => t.tipoVehiculoId === 2) ?? d.tarifas?.find(t => (t.descripcion || '').toLowerCase().includes('moto'));

  const capAutoObj = d.capacidades?.find(c => c.tipoVehiculoId === 1);
  const capMotoObj = d.capacidades?.find(c => c.tipoVehiculoId === 2);

  const autoDisp = Array.isArray(d.plazas) ? d.plazas.filter((p: any) => p.tipoVehiculoId === 1 && (!p.estado || p.estado === 'DISPONIBLE' || p.estado === 'libre')).length : (capAutoObj?.cantidad || 0);
  const motoDisp = Array.isArray(d.plazas) ? d.plazas.filter((p: any) => p.tipoVehiculoId === 2 && (!p.estado || p.estado === 'DISPONIBLE' || p.estado === 'libre')).length : (capMotoObj?.cantidad || 0);

  return {
    imagenes,
    img,
    tarifaAuto: tarifaAutoObj ? Number(tarifaAutoObj.precioHora) || 0 : 0,
    tarifaMoto: tarifaMotoObj ? Number(tarifaMotoObj.precioHora) || 0 : 0,
    autoCap: capAutoObj?.cantidad || 0,
    motoCap: capMotoObj?.cantidad || 0,
    autoDisp,
    motoDisp,
    servicios: d.servicios?.filter(s => s.estado) || []
  };
}, [d]);

/* ============================
   COMPONENTE PRINCIPAL
============================ */
export default function DetalleParqueoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const parqueoId = Array.isArray(id) ? id[0] : id;

  const [data, setData] = useState<ParqueoDetalleAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalReviews, setModalReviews] = useState(false);
  const [modalImage, setModalImage] = useState(false);

  const { average, count } = useParqueoStats(data);
  const {
    imagenes, img, tarifaAuto, tarifaMoto,
    autoCap, motoCap, autoDisp, motoDisp, servicios
  } = useParqueoData(data);

  /* FETCH de detalles (usa el endpoint que tenías) */
  useFocusEffect(useCallback(() => {
    if (!parqueoId) { setError("ID del parqueo no encontrado en la URL."); setLoading(false); return; }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `https://parkado-backend.vercel.app/api/parqueos/details`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error ${response.status}: No se pudo cargar los datos.`);
        const json: ParqueoDetalleAPI[] = await response.json();
        const idBuscado = parseInt(parqueoId as string, 10);
        const found = json.find(p => p.id === idBuscado);
        if (!found) throw new Error(`No se encontró el parqueo con ID: ${idBuscado}`);
        setData(found);
      } catch (e: any) {
        console.error("❌ ERROR DURANTE EL FETCH:", e);
        setError(e.message || "Error de conexión. Verifica tu internet.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [parqueoId]));

  /* Navegar a reserva */
  const handleNavigateToReserva = () => {
    if (!data) { Alert.alert("Error", "Datos del parqueo no disponibles."); return; }
    router.push({
      pathname: '/reserva' as any,
      params: {
        parqueoId: data.id.toString(),
        parqueoNombre: data.nombre || 'Parqueo',
        tarifaAuto: tarifaAuto.toString(),
        tarifaMoto: tarifaMoto.toString(),
        capacidadAutos: autoCap.toString(),
        capacidadMotos: motoCap.toString(),
        disponibilidadAutos: autoDisp.toString(),
        disponibilidadMotos: motoDisp.toString(),
        parqueoLat: data.latitud?.toString() || '-17.3936',
        parqueoLng: data.longitud?.toString() || '-66.1569',
      }
    });
  };

  /* Renders */
  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6EEE4' }}>
      <ActivityIndicator size="large" color="#7BB5CB" />
      <Text style={{ marginTop: 12, color: '#000' }}>Cargando información del parqueo...</Text>
    </View>
  );

  if (error || !data) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#F6EEE4' }}>
      <Text style={{ color: '#FD721D', fontWeight: '700', fontSize: 18, textAlign: 'center', marginBottom: 12 }}>{error || "Datos no disponibles"}</Text>
      <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: '#FD721D', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 }}>
        <Text style={{ color: 'white', fontWeight: '700' }}>Volver</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F6EEE4' }}>
      {/* Imagen principal clickeable */}
      <TouchableOpacity onPress={() => setModalImage(true)} activeOpacity={0.9}>
        <Image source={{ uri: img }} style={{ width: '100%', height: 256 }} resizeMode="cover" />
      </TouchableOpacity>

      <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Título */}
        <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 6 }}>{data.nombre}</Text>

        {/* Dirección */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Feather name="map-pin" size={16} color="#7BB5CB" />
          <Text style={{ marginLeft: 8, color: '#000' }}>{data.direccion} {data.tipoLugar ? `(${data.tipoLugar})` : ''}</Text>
        </View>

        {/* Rating */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', marginRight: 8 }}>{(average || 0).toFixed(1)}</Text>
          <RatingStars rating={average || 0} />
          <Text style={{ marginLeft: 8, color: '#000' }}>({count} {count === 1 ? 'opinión' : 'opiniones'})</Text>
        </View>

        {/* Botones: Reservar + Ver Reseñas */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <TouchableOpacity
            onPress={handleNavigateToReserva}
            style={{ width: '48%', backgroundColor: '#FD721D', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>RESERVAR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setModalReviews(true)}
            style={{ width: '48%', backgroundColor: '#7BB5CB', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>VER RESEÑAS</Text>
          </TouchableOpacity>
        </View>

        {/* Galería */}
        {imagenes && imagenes.length > 1 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Galería</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {imagenes.map((u, i) => (
                <TouchableOpacity key={i} onPress={() => setModalImage(true)}>
                  <Image source={{ uri: u }} style={{ width: 128, height: 80, borderRadius: 8, marginRight: 8 }} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Capacidades y tarifas */}
        <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 8, marginBottom: 8 }}>Capacidades y Tarifas</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ width: '48%', backgroundColor: '#7BB5CB', padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesome5 name="car" size={24} color="#F6EEE4" />
            <View style={{ marginLeft: 12 }}>
              <Text style={{ color: 'white', fontWeight: '700' }}>{autoDisp}/{autoCap} Autos</Text>
              <Text style={{ color: 'white' }}>{tarifaAuto} Bs/h</Text>
            </View>
          </View>

          <View style={{ width: '48%', backgroundColor: '#FD721D', padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesome5 name="motorcycle" size={24} color="#F6EEE4" />
            <View style={{ marginLeft: 12 }}>
              <Text style={{ color: 'white', fontWeight: '700' }}>{motoDisp}/{motoCap} Motos</Text>
              <Text style={{ color: 'white' }}>{tarifaMoto} Bs/h</Text>
            </View>
          </View>
        </View>

        {/* Horarios */}
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Horarios de Atención</Text>
        {ALL_DAYS.map((day) => {
          const horarioDia = data.horarios?.find(h => h.diaSemana.toLowerCase() === day);
          const esCerrado = !horarioDia || horarioDia.esCerrado;
          const horarioTexto = (horarioDia && !horarioDia.esCerrado)
            ? `${formatHour(horarioDia.horaAbrir)} - ${formatHour(horarioDia.horaCerrar)}`
            : 'Cerrado';
          return (
            <View key={day} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Feather name="calendar" size={16} color={esCerrado ? '#9CA3AF' : '#7BB5CB'} />
              <Text style={{ marginLeft: 8, width: 100, fontWeight: '700' }}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
              <Text style={{ marginLeft: 8, color: esCerrado ? '#9CA3AF' : '#000' }}>{horarioTexto}</Text>
            </View>
          );
        })}

        {/* Servicios */}
        <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 8 }}>Servicios</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {servicios.map((s, i) => (
            <View key={i} style={{ backgroundColor: '#7BB5CB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginRight: 8, marginBottom: 8 }}>
              <Text style={{ color: 'white' }}>{s.servicio.nombre}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Reviews Modal */}
      <ReviewsModal
        visible={modalReviews}
        onClose={() => setModalReviews(false)}
        parqueoId={parseInt(parqueoId || '0')}
      />

      {/* Imagen fullscreen modal */}
      <Modal visible={modalImage} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setModalImage(false)}
        >
          <Image source={{ uri: img }} style={{ width: '90%', height: '75%' }} resizeMode="contain" />
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
