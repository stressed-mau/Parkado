import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

// --- TIPOS DE DATOS (Mantenidos) ---
interface Calificacion { puntuacion: string; comentario: string; }
interface Capacidad { cantidad: number; tipoVehiculo: { nombre: string; }; }
interface Servicio { estado: boolean; servicio: { nombre: string; }; }
interface Horario { diaSemana: string; horaAbrir: string; horaCerrar: string; esCerrado: boolean | null; }
interface ParqueoDetalleAPI {
    id: number;
    nombre: string;
    direccion: string;
    tipoLugar: string;
    latitud: number; // Necesitamos esto
    longitud: number; // Necesitamos esto
    horarios: Horario[];
    calificaciones: Calificacion[];
    capacidades: Capacidad[];
    servicios: Servicio[];
    descripcion?: string; 
    imagen_url: string | null; 
}

const ALL_DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

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
    const { id } = useLocalSearchParams(); // Solo necesitamos el ID
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

    // =========================================================
    //  FUNCIÓN PARA ENVIAR INDICACIONES AL MAPA
    // =========================================================
    const handleGetDirections = () => {
        if (!data) return; // No hace nada si no hay datos

        console.log(`Solicitando ruta para: ${data.nombre} (ID: ${data.id})`);
        
        // Navegamos a la pantalla del Mapa
        // y le pasamos las coordenadas de destino como parámetros.
        router.push({
            pathname: '/(tabs)/Mapa', // Esta es la ruta a tu tab de Mapa
            params: {
              destLat: data.latitud,
              destLng: data.longitud,
              destNombre: data.nombre,
            }
        });
    };
    // =========================================================

    // --- Vistas de Carga y Error ---
    if (isLoading) { 
        return (
            <View className="flex-1 items-center justify-center bg-gray-100 dark:bg-gray-800">
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text className="mt-4 text-base text-gray-600 dark:text-gray-300">Buscando parqueo (ID: {parqueoId})...</Text>
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
    
    // --- Render Principal (Solo si tenemos datos) ---
    
    const getCapacidad = (tipo: string) => {
        const capacidadObj = data.capacidades?.find(c => c.tipoVehiculo.nombre.toLowerCase() === tipo.toLowerCase());
        return capacidadObj?.cantidad || 0;
    };
    

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
                <View className="absolute bottom-4 right-4 bg-black/50 p-2 rounded-full">
                    <Text className="text-white font-semibold">Ver fotos</Text>
                </View>
            </View>

            {/* Contenido Principal de la Tarjeta */}
            <View className="p-4">
                {/* Encabezado Principal */}
                <Text className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                    {data.nombre} (ID: {data.id}) 
                </Text>
                
                {/* Dirección */}
                <View className="flex-row items-center mb-1">
                    <Feather name="map-pin" size={16} color="#7BB3CD" />
                    <Text className="text-base text-gray-500 dark:text-gray-400 ml-2">
                        {data.direccion} ({data.tipoLugar})
                    </Text>
                </View>

                {/* Rating y Lugar de Interés */}
                <View className="flex-row items-center mb-4">
                    <Text className="text-xl font-bold text-gray-800 dark:text-gray-200 mr-2">
                        {averageRating.toFixed(1)}
                    </Text>
                    <RatingStars rating={averageRating} />
                    <Text className="text-sm text-gray-500 ml-2">({reviewCount} opiniones)</Text>
                    <Text className="text-sm text-green-600 ml-4">· Zona de Reserva</Text>
                </View>
                
                {/* Fila de Acciones */}
                <View className="flex-row justify-between border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                    
                    {/* Botón de Indicaciones */}
                    <TouchableOpacity onPress={handleGetDirections} className="items-center w-1/5 active:opacity-70">
                        <Feather name="navigation" size={24} color="#007BFF" />
                        <Text className="text-xs text-blue-600 dark:text-blue-400 mt-1">Indicaciones</Text>
                    </TouchableOpacity>

                    {/* Botón de Guardar */}
                    <TouchableOpacity className="items-center w-1/5 active:opacity-70">
                        <Feather name="bookmark" size={24} color="#007BFF" />
                        <Text className="text-xs text-blue-600 dark:text-blue-400 mt-1">Guardar</Text>
                    </TouchableOpacity>
                    
                    {/* Botón de Reserva */}
                    <TouchableOpacity className="items-center w-1/5 active:opacity-70 bg-green-500 rounded-lg">
                        <Text className="pt-3 text-sm font-bold text-white">RESERVAR</Text>
                    </TouchableOpacity>
                </View>

                {/* Sección de Descripción General */}
                <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Descripción general
                </Text>
                <Text className="text-base text-gray-700 dark:text-gray-300 mb-4">
                    {data.descripcion || "No hay descripción disponible."}
                </Text>
                
                {/* Sección de Horarios */}
                <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Horarios de Atención
                </Text>
                {ALL_DAYS.map((day, index) => { 
                    const horarioDia = data.horarios?.find(h => h.diaSemana.toLowerCase() === day);
                    const esCerrado = !horarioDia || horarioDia.esCerrado;
                    const horarioTexto = (horarioDia && !horarioDia.esCerrado) 
                        ? `${formatHour(horarioDia.horaAbrir)} - ${formatHour(horarioDia.horaCerrar)}`
                        : 'Cerrado';
                    
                    return (
                        <View key={index} style={styles.dataRow} className="mb-1">
                            <Feather name="calendar" size={16} color={esCerrado ? '#EF4444' : '#10B981'} />
                            <Text className="text-base text-gray-700 dark:text-gray-300 ml-3 font-semibold w-20">
                                {day.charAt(0).toUpperCase() + day.slice(1)}:
                            </Text>
                            <Text className={`text-base ml-2 ${esCerrado ? 'text-red-600 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                                {horarioTexto}
                            </Text>
                        </View>
                    );
                })}
                
                {/* Sección de Capacidades */}
                <Text className="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-3">
                    Capacidades y Espacios
                </Text>
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
                <Text className="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-3">
                    Servicios Adicionales
                </Text>
                <View className="flex-row flex-wrap">
                    {data.servicios?.filter(s => s.estado).map((s, index) => (
                        <View key={index} className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 mr-2 mb-2">
                            <Feather name="check" size={14} color="#10B981" />
                            <Text className="text-sm text-gray-700 dark:text-gray-300 ml-1">{s.servicio.nombre}</Text>
                        </View>
                    ))}
                </View>
                
                {/* Sección de Descripción Adicional */}
                <Text className="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-3">
                    Información Extra
                </Text>
                <Text className="text-base text-gray-700 dark:text-gray-300 mb-4">
                    {data.descripcion || "No hay descripción disponible."}
                </Text>

            </View>
        </ScrollView>
    );
};

// Estilos Nativos Mínimos
const styles = StyleSheet.create({
    dataRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});