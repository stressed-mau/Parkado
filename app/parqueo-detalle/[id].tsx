import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

// --- TIPOS DE DATOS COMPLETOS ---
interface Calificacion { 
    puntuacion: string; 
    comentario: string; 
}

interface Capacidad { 
    id: number;
    cantidad: number; 
    parqueoId: number;
    tipoVehiculoId: number;
    tipoVehiculo: { 
        id: number;
        nombre: string; 
        descripcion: string;
    }; 
}

interface Servicio { 
    id: number;
    estado: boolean; 
    parqueoId: number;
    servicioId: number;
    servicio: { 
        id: number;
        nombre: string; 
        descripcion: string;
    }; 
}

interface Horario { 
    id: number;
    diaSemana: string; 
    horaAbrir: string; 
    horaCerrar: string; 
    esCerrado: boolean | null; 
    parqueoId: number;
}

interface Tarifa {
    id: number;
    descripcion: string;
    precioHora: string;
    precioDia: string | null;
    estado: string | null;
    parqueoId: number;
    tipoVehiculoId: number;
}

interface Foto {
    id: number;
    url: string;
    parqueoId: number;
}

interface Plaza {
    id: number;
    nroPlaza: string;
    ubicacionPiso: string | null;
    estado: string | null;
    parqueoId: number;
    tipoVehiculoId: number;
}

interface ParqueoDetalleAPI {
    id: number;
    nombre: string;
    direccion: string;
    tipoLugar: string;
    propietarioId: number;
    latitud: number;
    longitud: number;
    horarios: Horario[];
    calificaciones: Calificacion[];
    capacidades: Capacidad[];
    servicios: Servicio[];
    plazas: Plaza[];
    tarifas: Tarifa[];
    fotos: Foto[];
    descripcion?: string;
    // NOTA: La API NO tiene imagen_url, usa el array "fotos"
}

const ALL_DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

// --- FUNCIONES AUXILIARES ---
const useParqueoStats = (data: ParqueoDetalleAPI | null) => {
    return useMemo(() => {
        if (!data?.calificaciones || data.calificaciones.length === 0) {
            return { averageRating: 0, reviewCount: 0 };
        }
        
        const totalRating = data.calificaciones.reduce((sum, c) => {
            const puntuacion = parseFloat(c.puntuacion) || 0;
            return sum + puntuacion;
        }, 0);
        
        const averageRating = totalRating / data.calificaciones.length;
        return {
            averageRating: parseFloat(averageRating.toFixed(1)),
            reviewCount: data.calificaciones.length
        };
    }, [data]);
};

const formatHour = (isoString: string) => {
    if (!isoString) return "N/A";
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString('es-BO', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
        });
    } catch {
        return "N/A";
    }
};

const RatingStars = ({ rating }: { rating: number }) => {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    
    return (
        <View className="flex-row">
            <Text className="text-[#F2BD2B] text-lg">
                {'★'.repeat(fullStars)}
                {'☆'.repeat(emptyStars)}
            </Text>
        </View>
    );
};

// --- FUNCIÓN PARA OBTENER TODOS LOS DATOS REALES DE LA API ---
const useParqueoData = (data: ParqueoDetalleAPI | null) => {
    return useMemo(() => {
        if (!data) {
            return {
                imagenes: [],
                imagenPrincipal: 'https://via.placeholder.com/400x250?text=No+Image',
                tarifaAuto: 0,
                tarifaMoto: 0,
                capacidadAutos: 0,
                capacidadMotos: 0,
                serviciosActivos: [],
                plazasAutos: [],
                plazasMotos: [],
                totalPlazasAutos: 0,
                totalPlazasMotos: 0
            };
        }

        // 1. IMÁGENES - Usar TODAS las fotos del array "fotos"
        const imagenes = data.fotos && data.fotos.length > 0 
            ? data.fotos.map(foto => foto.url)
            : ['https://via.placeholder.com/400x250?text=No+Image'];
        
        const imagenPrincipal = imagenes[0];

        // 2. TARIFAS - Buscar en el array "tarifas"
        const tarifaAutoObj = data.tarifas?.find(t => 
            t.tipoVehiculoId === 1 || t.descripcion.toLowerCase().includes('auto')
        );
        const tarifaMotoObj = data.tarifas?.find(t => 
            t.tipoVehiculoId === 2 || t.descripcion.toLowerCase().includes('moto')
        );

        const tarifaAuto = tarifaAutoObj ? parseFloat(tarifaAutoObj.precioHora) : 0;
        const tarifaMoto = tarifaMotoObj ? parseFloat(tarifaMotoObj.precioHora) : 0;

        // 3. CAPACIDADES - Buscar en el array "capacidades"
        const capacidadAutoObj = data.capacidades?.find(c => 
            c.tipoVehiculoId === 1 || c.tipoVehiculo.nombre.toLowerCase().includes('auto')
        );
        const capacidadMotoObj = data.capacidades?.find(c => 
            c.tipoVehiculoId === 2 || c.tipoVehiculo.nombre.toLowerCase().includes('moto')
        );

        const capacidadAutos = capacidadAutoObj ? capacidadAutoObj.cantidad : 0;
        const capacidadMotos = capacidadMotoObj ? capacidadMotoObj.cantidad : 0;

        // 4. SERVICIOS ACTIVOS - Filtrar servicios con estado true
        const serviciosActivos = data.servicios?.filter(s => s.estado) || [];

        // 5. PLAZAS - Separar por tipo de vehículo
        const plazasAutos = data.plazas?.filter(p => p.tipoVehiculoId === 1) || [];
        const plazasMotos = data.plazas?.filter(p => p.tipoVehiculoId === 2) || [];
        
        const totalPlazasAutos = plazasAutos.length;
        const totalPlazasMotos = plazasMotos.length;

        console.log('📊 DATOS EXTRAÍDOS DE LA API:', {
            nombre: data.nombre,
            imagenesCount: imagenes.length,
            tarifaAuto,
            tarifaMoto,
            capacidadAutos,
            capacidadMotos,
            serviciosActivosCount: serviciosActivos.length,
            plazasAutosCount: totalPlazasAutos,
            plazasMotosCount: totalPlazasMotos,
            servicios: serviciosActivos.map(s => s.servicio.nombre)
        });

        return {
            imagenes,
            imagenPrincipal,
            tarifaAuto,
            tarifaMoto,
            capacidadAutos,
            capacidadMotos,
            serviciosActivos,
            plazasAutos,
            plazasMotos,
            totalPlazasAutos,
            totalPlazasMotos
        };
    }, [data]);
};

// --- COMPONENTE GALERÍA DE IMÁGENES ---
const GaleriaImagenes = ({ imagenes }: { imagenes: string[] }) => {
    if (imagenes.length <= 1) return null;

    return (
        <View className="mt-4">
            <Text className="text-xl font-bold text-black mb-3">Galería de Imágenes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {imagenes.map((url, index) => (
                    <Image
                        key={index}
                        source={{ uri: url }}
                        className="w-32 h-24 rounded-lg mr-2"
                        resizeMode="cover"
                    />
                ))}
            </ScrollView>
        </View>
    );
};

// --- COMPONENTE SERVICIOS ADICIONALES ---
const ServiciosAdicionales = ({ servicios }: { servicios: Servicio[] }) => {
    if (servicios.length === 0) {
        return (
            <View className="mt-4">
                <Text className="text-xl font-bold text-black mb-3">Servicios Adicionales</Text>
                <Text className="text-sm text-black">No hay servicios adicionales disponibles</Text>
            </View>
        );
    }

    return (
        <View className="mt-4">
            <Text className="text-xl font-bold text-black mb-3">Servicios Adicionales</Text>
            <View className="flex-row flex-wrap gap-2">
                {servicios.map((servicio, index) => (
                    <View key={index} className="flex-row items-center bg-[#7BB5CB] rounded-full px-3 py-2">
                        <Feather name="check" size={14} color="#F6EEE4" />
                        <Text className="text-sm text-black ml-1">{servicio.servicio.nombre}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

// --- COMPONENTE DETALLE DE PLAZAS ---
const DetallePlazas = ({ 
    plazasAutos, 
    plazasMotos 
}: { 
    plazasAutos: Plaza[], 
    plazasMotos: Plaza[] 
}) => {
    return (
        <View className="mt-4">
            <Text className="text-xl font-bold text-black mb-3">Detalle de Plazas</Text>
            
            {/* Plazas para Autos */}
            <View className="mb-4">
                <Text className="text-lg font-semibold text-black mb-2">Autos ({plazasAutos.length} plazas)</Text>
                <View className="flex-row flex-wrap gap-2">
                    {plazasAutos.map((plaza, index) => (
                        <View key={index} className="bg-[#7BB5CB] rounded-lg px-3 py-2">
                            <Text className="text-sm text-black font-semibold">{plaza.nroPlaza}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Plazas para Motos */}
            <View>
                <Text className="text-lg font-semibold text-black mb-2">Motos ({plazasMotos.length} plazas)</Text>
                <View className="flex-row flex-wrap gap-2">
                    {plazasMotos.map((plaza, index) => (
                        <View key={index} className="bg-[#FD721D] rounded-lg px-3 py-2">
                            <Text className="text-sm text-white font-semibold">{plaza.nroPlaza}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

// --- Pantalla Principal COMPLETAMENTE CORREGIDA ---
export default function DetalleParqueoScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const parqueoId = Array.isArray(id) ? id[0] : id;

    const [data, setData] = useState<ParqueoDetalleAPI | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { averageRating, reviewCount } = useParqueoStats(data);
    const { 
        imagenes,
        imagenPrincipal, 
        tarifaAuto, 
        tarifaMoto, 
        capacidadAutos, 
        capacidadMotos, 
        serviciosActivos,
        plazasAutos,
        plazasMotos,
        totalPlazasAutos,
        totalPlazasMotos
    } = useParqueoData(data);

    useFocusEffect(
        useCallback(() => {
            console.log("===================================");
            console.log("🔍 PANTALLA DETALLE EN FOCO. Buscando ID:", parqueoId);

            if (!parqueoId) {
                setError("ID del parqueo no encontrado en la URL.");
                setIsLoading(false);
                return;
            }

            const fetchParqueoDetails = async () => {
                setIsLoading(true);
                setError(null);
                
                try {
                    // Usar endpoint de lista completa
                    const url = `https://parkado-backend.vercel.app/api/parqueos/details`;
                    console.log(`🌐 HACIENDO FETCH A: ${url}`);
                    
                    const response = await fetch(url);

                    if (!response.ok) {
                        throw new Error(`Error ${response.status}: No se pudo cargar los datos.`);
                    }

                    const json: ParqueoDetalleAPI[] = await response.json();
                    const idBuscado = parseInt(parqueoId, 10);
                    const parqueoEncontrado = json.find((parqueo) => parqueo.id === idBuscado);

                    if (!parqueoEncontrado) {
                        throw new Error(`No se encontró el parqueo con ID: ${idBuscado}`);
                    }

                    console.log(`✅ DATOS ENCONTRADOS: "${parqueoEncontrado.nombre}"`, {
                        id: parqueoEncontrado.id,
                        fotos: parqueoEncontrado.fotos?.length || 0,
                        servicios: parqueoEncontrado.servicios?.length || 0,
                        capacidades: parqueoEncontrado.capacidades,
                        tarifas: parqueoEncontrado.tarifas,
                        plazas: parqueoEncontrado.plazas?.length || 0
                    });

                    setData(parqueoEncontrado);

                } catch (err: any) {
                    console.error("❌ ERROR DURANTE EL FETCH:", err.message);
                    setError(err.message || "Error de conexión. Verifica tu internet.");
                } finally {
                    setIsLoading(false);
                }
            };

            fetchParqueoDetails();

        }, [parqueoId])
    );

    const handleNavigateToReserva = () => {
        if (!data) {
            Alert.alert("Error", "Datos del parqueo no disponibles.");
            return;
        }

        const paramsToPass = {
            parqueoId: data.id.toString(),
            parqueoNombre: data.nombre || 'Parqueo',
            tarifaAuto: tarifaAuto.toString(),
            tarifaMoto: tarifaMoto.toString(),
            capacidadAutos: capacidadAutos.toString(),
            capacidadMotos: capacidadMotos.toString(),
            parqueoLat: data.latitud?.toString() || '-17.3936',
            parqueoLng: data.longitud?.toString() || '-66.1569',
        };

        console.log(`🚀 Navegando a Reserva con datos REALES:`, paramsToPass);
        router.push({
            pathname: '/reserva' as any,
            params: paramsToPass
        });
    };

    // --- Render condicional ---
    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-[#F6EEE4]">
                <ActivityIndicator size="large" color="#7BB5CB" />
                <Text className="mt-4 text-base text-black">Cargando información...</Text>
            </View>
        );
    }

    if (error || !data) {
        return (
            <View className="flex-1 items-center justify-center bg-[#F6EEE4] p-8">
                <Text className="text-xl font-bold text-[#FD721D] text-center mb-4">
                    {error || "Datos no disponibles"}
                </Text>
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    className="bg-[#FD721D] px-6 py-3 rounded-lg"
                >
                    <Text className="text-white font-semibold">Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // --- Render Principal ---
    return (
        <ScrollView className="flex-1 bg-[#F6EEE4]" showsVerticalScrollIndicator={false}>
            {/* Contenedor de Imagen Principal */}
            <View className="w-full h-64 overflow-hidden relative">
                <Image
                    source={{ uri: imagenPrincipal }}
                    className="w-full h-full"
                    resizeMode="cover"
                />
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    className="absolute top-12 left-4 bg-black/50 p-2 rounded-full"
                >
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
                    <TouchableOpacity className="items-center w-1/5">
                        <Feather name="bookmark" size={24} color="#7BB5CB" />
                        <Text className="text-xs mt-1">Guardar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="items-center justify-center w-2/5 bg-black rounded-lg py-2"
                        onPress={handleNavigateToReserva}
                    >
                        <Text className="text-sm font-bold text-[#F6EEE4]">RESERVAR</Text>
                    </TouchableOpacity>
                </View>

                {/* Descripción General */}
                <Text className="text-xl font-bold text-black mb-3">Descripción general</Text>
                <Text className="text-sm text-black mb-4 leading-5">
                    {data.descripcion || "No hay descripción disponible."}
                </Text>

                {/* Galería de Imágenes */}
                <GaleriaImagenes imagenes={imagenes} />

                {/* Capacidades y Tarifas */}
                <Text className="text-xl font-bold text-black mt-4 mb-3">Capacidades y Tarifas</Text>
                <View className="flex-row flex-wrap justify-between">
                    {/* Auto */}
                    <View className="w-[48%] bg-[#7BB5CB] p-3 rounded-lg mb-2 flex-row items-center">
                        <FontAwesome5 name="car" size={24} color="#F6EEE4" />
                        <View className="ml-3">
                            <Text className="text-xs font-semibold text-black">Auto</Text>
                            <Text className="text-xl font-bold text-black">{capacidadAutos} espacios</Text>
                            <Text className="text-xs text-black">{tarifaAuto} Bs/h</Text>
                        </View>
                    </View>
                    
                    {/* Moto */}
                    <View className="w-[48%] bg-[#7BB5CB] p-3 rounded-lg mb-2 flex-row items-center">
                        <FontAwesome5 name="motorcycle" size={24} color="#F6EEE4" />
                        <View className="ml-3">
                            <Text className="text-xs font-semibold text-black">Moto</Text>
                            <Text className="text-xl font-bold text-black">{capacidadMotos} espacios</Text>
                            <Text className="text-xs text-black">{tarifaMoto} Bs/h</Text>
                        </View>
                    </View>
                </View>

                {/* Servicios Adicionales */}
                <ServiciosAdicionales servicios={serviciosActivos} />

                {/* Horarios */}
                <Text className="text-xl font-bold text-black mt-4 mb-3">Horarios de Atención</Text>
                {ALL_DAYS.map((day, index) => {
                    const horarioDia = data.horarios?.find(h => 
                        h.diaSemana.toLowerCase() === day
                    );
                    const esCerrado = !horarioDia || horarioDia.esCerrado;
                    const horarioTexto = (horarioDia && !horarioDia.esCerrado)
                        ? `${formatHour(horarioDia.horaAbrir)} - ${formatHour(horarioDia.horaCerrar)}`
                        : 'Cerrado';
                    return (
                        <View key={index} className="flex-row items-center mb-1">
                            <Feather name="calendar" size={16} color={esCerrado ? '#5f8b9cff' : '#7bb5cbff'} />
                            <Text className="text-sm text-black ml-3 font-semibold w-20">
                                {day.charAt(0).toUpperCase() + day.slice(1)}:
                            </Text>
                            <Text className={`text-sm ml-2 ${esCerrado ? ' font-bold' : 'text-black'}`}>
                                {horarioTexto}
                            </Text>
                        </View>
                    );
                })}

                {/* Detalle de Plazas */}
                <DetallePlazas 
                    plazasAutos={plazasAutos} 
                    plazasMotos={plazasMotos} 
                />
            </View>
        </ScrollView>
    );
}