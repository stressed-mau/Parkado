import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
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
        <Text className="text-[#F2BD2B]">
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

    const handleNavigateToReserva = () => {
        if (!data || typeof data.latitud !== 'number' || typeof data.longitud !== 'number') {
            console.error("handleNavigateToReserva: Faltan datos o coordenadas válidas en 'data'.", data);
            Alert.alert("Error", "No se pueden obtener los datos completos del parqueo para reservar.");
            return;
        }

        const capacidadAutos = data.capacidades?.find(c => c.tipoVehiculo.nombre.toLowerCase() === 'autos')?.cantidad || 0;
        const capacidadMotos = data.capacidades?.find(c => c.tipoVehiculo.nombre.toLowerCase() === 'motos')?.cantidad || 0;

        const paramsToPass = {
            parqueoId: data.id.toString(),
            parqueoNombre: data.nombre || 'Parqueo Desconocido',
            tarifaAuto: (data.tarifa_auto ?? DEFAULT_TARIFA_AUTO).toString(),
            tarifaMoto: (data.tarifa_moto ?? DEFAULT_TARIFA_MOTO).toString(),
            capacidadAutos: capacidadAutos.toString(),
            capacidadMotos: capacidadMotos.toString(),
            parqueoLat: data.latitud.toString(),
            parqueoLng: data.longitud.toString(),
        };

        console.log(`[id].tsx: Navegando a Reserva con params:`, paramsToPass);

        router.push({
            pathname: '/reserva' as any,
            params: paramsToPass
        });
    };

    // --- Vistas de Carga y Error ---
    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-[#F6EEE4]">
                <ActivityIndicator size="large" color="#FD721D" />
                <Text className="mt-4 text-base text-black">Cargando información de parqueo...</Text>
            </View>
        );
    }
    if (error) {
        return (
            <View className="flex-1 items-center justify-center bg-[#F6EEE4] p-8">
                <Text className="text-xl font-bold text-[#FD721D] text-center">Error:</Text>
                <Text className="text-base text-black text-center mt-2">{error}</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-6 bg-[#FD721D] px-4 py-2 rounded-lg">
                    <Text className="text-[#F6EEE4] font-semibold">Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }
    if (!data) {
        return (
            <View className="flex-1 items-center justify-center bg-[#F6EEE4] p-8">
                <Text className="text-xl font-bold text-black text-center">Datos no disponibles.</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-6 bg-[#7BB5CB] px-4 py-2 rounded-lg">
                    <Text className="text-[#F6EEE4] font-semibold">Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // --- Render Principal ---
    return (
        <ScrollView className="flex-1 bg-[#F6EEE4]">
            {/* Contenedor de Imagen */}
            <View className="w-full h-64 overflow-hidden relative">
                <Image
                    source={{ uri: data.imagen_url ?? 'https://via.placeholder.com/400x250?text=No+Image' }}
                    className="w-full h-full"
                    resizeMode="cover"
                />
                <TouchableOpacity onPress={() => router.back()} className="absolute top-12 left-4 bg-black/50 p-2 rounded-full">
                    <Feather name="arrow-left" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Contenido Principal */}
            <View className="p-4">
                {/* Encabezado */}
                <Text className="text-3xl font-bold text-black mb-1">
                    {data.nombre}
                </Text>
                {/* Dirección */}
                <View className="flex-row items-center mb-1">
                    <Feather name="map-pin" size={16} color="#7BB5CB" />
                    <Text className="text-sm text-black ml-2">
                        {data.direccion} ({data.tipoLugar})
                    </Text>
                </View>
                {/* Rating */}
                <View className="flex-row items-center mb-4">
                    <Text className="text-xl font-bold text-black mr-2">
                        {averageRating.toFixed(1)}
                    </Text>
                    <RatingStars rating={averageRating} />
                    <Text className="text-xs text-black ml-2">
                        ({reviewCount} opiniones)
                    </Text>
                </View>

                {/* Fila de Acciones */}
                <View className="flex-row justify-between border-b border-black pb-4 mb-4">
                    {/* Botón de Guardar */}
                    <TouchableOpacity className="items-center w-1/5">
                        <Feather name="bookmark" size={24} color="#FD721D" />
                        <Text className="text-xs text-[#FD721D] mt-1">Guardar</Text>
                    </TouchableOpacity>

                    {/* BOTÓN RESERVAR */}
                    <TouchableOpacity
                        className="items-center justify-center w-2/5 bg-[#FD721D] rounded-lg py-2"
                        onPress={handleNavigateToReserva}
                    >
                        <Text className="text-sm font-bold text-[#F6EEE4]">RESERVAR</Text>
                    </TouchableOpacity>
                </View>

                {/* Sección de Descripción General */}
                <Text className="text-xl font-bold text-black mb-3">Descripción general</Text>
                <Text className="text-sm text-black mb-4 leading-5">
                    {data.descripcion || "No hay descripción disponible."}
                </Text>

                {/* Sección de Horarios */}
                <Text className="text-xl font-bold text-black mb-3">Horarios de Atención</Text>
                {ALL_DAYS.map((day, index) => {
                    const horarioDia = data.horarios?.find(h => h.diaSemana.toLowerCase() === day);
                    const esCerrado = !horarioDia || horarioDia.esCerrado;
                    const horarioTexto = (horarioDia && !horarioDia.esCerrado)
                        ? `${formatHour(horarioDia.horaAbrir)} - ${formatHour(horarioDia.horaCerrar)}`
                        : 'Cerrado';
                    return (
                        <View key={index} className="flex-row items-center mb-1">
                            <Feather name="calendar" size={16} color={esCerrado ? '#FD721D' : '#FD721D'} />
                            <Text className="text-sm text-black ml-3 font-semibold w-20">
                                {day.charAt(0).toUpperCase() + day.slice(1)}:
                            </Text>
                            <Text className={`text-sm ml-2 ${esCerrado ? ' font-bold' : 'text-black'}`}>
                                {horarioTexto}
                            </Text>
                        </View>
                    );
                })}

                {/* Sección de Capacidades */}
                <Text className="text-xl font-bold text-black mt-4 mb-3">Capacidades y Espacios</Text>
                <View className="flex-row flex-wrap justify-between">
                    {data.capacidades?.map((c, index) => (
                        <View key={index} className="w-[48%] bg-[#7BB5CB] p-3 rounded-lg mb-2 flex-row items-center">
                            <FontAwesome5 name={c.tipoVehiculo.nombre.toLowerCase() === 'motos' ? 'motorcycle' : 'car'} size={24} color="#F6EEE4" />
                            <View className="ml-3">
                                <Text className="text-xs font-semibold text-black">{c.tipoVehiculo.nombre}</Text>
                                <Text className="text-xl font-bold text-black">{c.cantidad}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Sección de Servicios Clave */}
                <Text className="text-xl font-bold text-black mt-4 mb-3">Servicios Adicionales</Text>
                <View className="flex-row flex-wrap gap-2">
                    {data.servicios?.filter(s => s.estado).map((s, index) => (
                        <View key={index} className="flex-row items-center bg-[#7BB5CB] rounded-full px-3 py-1">
                            <Feather name="check" size={14} color="#F6EEE4" />
                            <Text className="text-sm text-black ml-1">{s.servicio.nombre}</Text>
                        </View>
                    ))}
                </View>

                {/* Sección de Información Extra */}
                <Text className="text-xl font-bold text-black mt-4 mb-3">Información Extra</Text>
                <Text className="text-sm text-black mb-4 leading-5">
                    {data.descripcion || "No hay descripción disponible."}
                </Text>
            </View>
        </ScrollView>
    );
}
