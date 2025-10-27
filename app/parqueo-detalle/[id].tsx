import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

// --- TIPOS DE DATOS ---
interface Calificacion { puntuacion: string; comentario: string; }
interface Capacidad { cantidad: number; tipoVehiculo: { nombre: string; }; }
interface Servicio { estado: boolean; servicio: { nombre: string; }; }
interface Horario { diaSemana: string; horaAbrir: string; horaCerrar: string; esCerrado: boolean | null; }
interface ParqueoDetalleAPI {
    id: number;
    nombre: string;
    direccion: string;
    tipoLugar: string;
    latitud: number;
    longitud: number;
    horarios: Horario[];
    calificaciones: Calificacion[];
    capacidades: Capacidad[];
    servicios: Servicio[];
    descripcion?: string;
    imagen_url: string | null;
    tarifa_auto?: number;
    tarifa_moto?: number;
}

const ALL_DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DEFAULT_TARIFA_AUTO = 7.0;
const DEFAULT_TARIFA_MOTO = 4.0;

// --- FUNCIONES AUXILIARES ---
const useParqueoStats = (data: ParqueoDetalleAPI | null) => {
    return useMemo(() => {
        if (!data || !data.calificaciones || data.calificaciones.length === 0) {
            return { averageRating: 0, reviewCount: 0 };
        }
        const totalRating = data.calificaciones.reduce((sum, c) => sum + parseFloat(c.puntuacion), 0);
        const averageRating = totalRating / data.calificaciones.length;
        return {
            averageRating: parseFloat(averageRating.toFixed(1)),
            reviewCount: data.calificaciones.length
        };
    }, [data]);
};

const formatHour = (isoString: string) => {
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
        return "N/A";
    }
};

const RatingStars = ({ rating }: { rating: number }) => {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - Math.ceil(rating);
    return (
        <Text className="text-yellow-500">
            {'★'.repeat(fullStars)}
            {'☆'.repeat(emptyStars)}
        </Text>
    );
};

// --- Pantalla Principal ---
export default function DetalleParqueoScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const parqueoId = Array.isArray(id) ? id[0] : id;

    const [data, setData] = useState<ParqueoDetalleAPI | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { averageRating, reviewCount } = useParqueoStats(data);

    useFocusEffect(
        useCallback(() => {
            console.log("===================================");
            console.log("PANTALLA DETALLE EN FOCO. Buscando ID:", parqueoId);

            setIsLoading(true);
            setError(null);
            setData(null);

            if (!parqueoId) {
                setError("ID del parqueo no encontrado en la URL.");
                setIsLoading(false);
                return;
            }

            const fetchParqueoDetails = async () => {
                try {
                    const url = `https://parkado-backend.vercel.app/api/parqueos/details`;
                    console.log(`HACIENDO FETCH A (API devuelve TODO): ${url}`);
                    const response = await fetch(url);

                    if (!response.ok) {
                        throw new Error(`Error ${response.status}: No se pudo cargar la lista de parqueos.`);
                    }

                    const json: ParqueoDetalleAPI[] = await response.json();

                    const idBuscado = parseInt(parqueoId, 10);
                    const parqueoEncontrado = json.find((parqueo) => parqueo.id === idBuscado);

                    if (!parqueoEncontrado) {
                        throw new Error(`No se encontraron datos para el ID: ${idBuscado} en la lista de la API.`);
                    }

                    console.log(`>>> DATOS ENCONTRADOS: "${parqueoEncontrado.nombre}", ID: ${parqueoEncontrado.id}`);
                    setData(parqueoEncontrado);

                } catch (err: any) {
                    console.error("ERROR DURANTE EL FETCH:", err.message);
                    setError(err.message || "Error de red.");
                } finally {
                    console.log("FETCH FINALIZADO. Ocultando carga.");
                    console.log("===================================");
                    setIsLoading(false);
                }
            };

            fetchParqueoDetails();

        }, [parqueoId])
    );


    // --- FUNCIÓN PARA NAVEGAR A RESERVA ---
    // --- FUNCIÓN PARA NAVEGAR A RESERVA (CON VALIDACIÓN DE COORDENADAS) ---
    const handleNavigateToReserva = () => {
        // 1. Verificar que 'data' existe y tiene coordenadas válidas
        if (!data || typeof data.latitud !== 'number' || typeof data.longitud !== 'number') {
            console.error("handleNavigateToReserva: Faltan datos o coordenadas válidas en 'data'.", data);
            Alert.alert("Error", "No se pueden obtener los datos completos del parqueo para reservar.");
            return; // No continuar si faltan datos
        }

        const capacidadAutos = data.capacidades?.find(c => c.tipoVehiculo.nombre.toLowerCase() === 'autos')?.cantidad || 0;
        const capacidadMotos = data.capacidades?.find(c => c.tipoVehiculo.nombre.toLowerCase() === 'motos')?.cantidad || 0;

        // 2. Preparar parámetros (asegurándonos de convertir a string)
        const paramsToPass = {
            parqueoId: data.id.toString(),
            parqueoNombre: data.nombre || 'Parqueo Desconocido', // Fallback por si acaso
            tarifaAuto: (data.tarifa_auto ?? DEFAULT_TARIFA_AUTO).toString(),
            tarifaMoto: (data.tarifa_moto ?? DEFAULT_TARIFA_MOTO).toString(),
            capacidadAutos: capacidadAutos.toString(),
            capacidadMotos: capacidadMotos.toString(),
            parqueoLat: data.latitud.toString(), // Convertir número a string
            parqueoLng: data.longitud.toString(), // Convertir número a string
        };

        console.log(`[id].tsx: Navegando a Reserva con params:`, paramsToPass);

        // 3. Navegar
        router.push({
            pathname: '/reserva' as any, // Asumiendo que está en app/reserva.tsx
            params: paramsToPass
        });
    };

    // --- Vistas de Carga y Error ---
    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-100 dark:bg-gray-800">
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text className="mt-4 text-base text-gray-600 dark:text-gray-300">Cargando información de parqueo...</Text>
            </View>
         );
    }
    if (error) {
        return (
            <View className="flex-1 items-center justify-center bg-red-50 dark:bg-red-900 p-8">
                <Text className="text-xl font-bold text-red-700 dark:text-red-300 text-center">Error:</Text>
                <Text className="text-base text-red-600 dark:text-red-200 text-center mt-2">{error}</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-6 bg-red-600 px-4 py-2 rounded-lg">
                    <Text className="text-white font-semibold">Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }
    if (!data) {
       return (
            <View className="flex-1 items-center justify-center bg-gray-100 p-8">
                <Text className="text-xl font-bold text-gray-700 text-center">Datos no disponibles.</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-6 bg-gray-500 px-4 py-2 rounded-lg">
                    <Text className="text-white font-semibold">Volver</Text>
                </TouchableOpacity>
            </View>
       );
    }

    // --- Render Principal ---
    return (
        <ScrollView className="flex-1 bg-white dark:bg-gray-900">
            {/* Contenedor de Imagen */}
            <View className="w-full h-64 overflow-hidden relative">
                <Image
                    source={{ uri: data.imagen_url ?? 'https://via.placeholder.com/400x250?text=No+Image' }}
                    className="w-full h-full"
                    resizeMode="cover"
                />
                <TouchableOpacity onPress={() => router.back()} className="absolute top-12 left-4 bg-black/50 p-2 rounded-full active:opacity-70">
                    <Feather name="arrow-left" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Contenido Principal */}
            <View className="p-4">
                {/* Encabezado */}
                <Text className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                    {data.nombre} 
                </Text>
                {/* Dirección */}
                <View className="flex-row items-center mb-1">
                    <Feather name="map-pin" size={16} color="#7BB3CD" />
                    <Text className="text-base text-gray-500 dark:text-gray-400 ml-2"> {data.direccion} ({data.tipoLugar})</Text>
                </View>
                {/* Rating */}
                <View className="flex-row items-center mb-4">
                    <Text className="text-xl font-bold text-gray-800 dark:text-gray-200 mr-2">{averageRating.toFixed(1)} </Text>
                    <RatingStars rating={averageRating} />
                    <Text className="text-sm text-gray-500 ml-2"> ({reviewCount} opiniones)</Text>
                </View>

                {/* Fila de Acciones */}
                <View className="flex-row justify-between border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                     
                    
                    {/* Botón de Guardar */}
                    <TouchableOpacity className="items-center w-1/5 active:opacity-70">
                        <Feather name="bookmark" size={24} color="#007BFF" />
                        <Text className="text-xs text-blue-600 dark:text-blue-400 mt-1">Guardar</Text>
                    </TouchableOpacity>
                    
                    {/* BOTÓN RESERVAR */}
                    <TouchableOpacity 
                        className="items-center justify-center w-[35%] active:opacity-70 bg-green-500 rounded-lg py-2" 
                        onPress={handleNavigateToReserva}
                    >
                        <Text className="text-sm font-bold text-white">RESERVAR</Text>
                    </TouchableOpacity>
                </View>

                 {/* Sección de Descripción General */}
                <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3">Descripción general</Text>
                <Text className="text-base text-gray-700 dark:text-gray-300 mb-4 leading-normal">{data.descripcion || "No hay descripción disponible."}</Text>

                {/* Sección de Horarios */}
                <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3">Horarios de Atención</Text>
                {ALL_DAYS.map((day, index) => {
                    const horarioDia = data.horarios?.find(h => h.diaSemana.toLowerCase() === day);
                    const esCerrado = !horarioDia || horarioDia.esCerrado;
                    const horarioTexto = (horarioDia && !horarioDia.esCerrado)
                        ? `${formatHour(horarioDia.horaAbrir)} - ${formatHour(horarioDia.horaCerrar)}`
                        : 'Cerrado';
                    return (
                        <View key={index} className="flex-row items-center mb-1">
                            <Feather name="calendar" size={16} color={esCerrado ? '#EF4444' : '#10B981'} />
                            <Text className="text-base text-gray-700 dark:text-gray-300 ml-3 font-semibold w-20">{day.charAt(0).toUpperCase() + day.slice(1)}:</Text>
                            <Text className={`text-base ml-2 ${esCerrado ? 'text-red-600 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>{horarioTexto}</Text>
                        </View>
                    );
                })}

                {/* Sección de Capacidades */}
                <Text className="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-3">Capacidades y Espacios</Text>
                <View className="flex-row flex-wrap justify-between">
                    {data.capacidades?.map((c, index) => (
                        <View key={index} className="w-[48%] bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-2 flex-row items-center">
                            <FontAwesome5 name={c.tipoVehiculo.nombre.toLowerCase() === 'motos' ? 'motorcycle' : 'car'} size={24} color="#4F46E5" />
                            <View className="ml-3">
                                <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">{c.tipoVehiculo.nombre}</Text>
                                <Text className="text-xl font-bold text-gray-900 dark:text-white">{c.cantidad}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Sección de Servicios Clave */}
                <Text className="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-3">Servicios Adicionales</Text>
                <View className="flex-row flex-wrap gap-2">
                    {data.servicios?.filter(s => s.estado).map((s, index) => (
                        <View key={index} className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1">
                            <Feather name="check" size={14} color="#10B981" />
                            <Text className="text-sm text-gray-700 dark:text-gray-300 ml-1">{s.servicio.nombre}</Text>
                        </View>
                    ))}
                </View>

                {/* Sección de Descripción Adicional */}
                <Text className="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-3">Información Extra</Text>
                <Text className="text-base text-gray-700 dark:text-gray-300 mb-4 leading-normal">{data.descripcion || "No hay descripción disponible."}</Text>

            </View>
        </ScrollView>
    );
};
