import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import CommentSection from '@/src/features/comments/screens/CommentSection';
import ReviewsContent from '@/src/features/comments/components/Reviews';
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
    tarifas: Tarifa[];
    fotos: Foto[];
    descripcion?: string;
    plazas: any[];
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

const formatHour = (timeString: string) => {
    if (!timeString) return "N/A";
    try {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
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
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
        <View className="flex-row">
            <Text className="text-[#F2BD2B] text-lg">
                {'★'.repeat(fullStars)}
                {hasHalfStar ? '½' : ''}
                {'☆'.repeat(emptyStars)}
            </Text>
        </View>
    );
};

// --- FUNCIÓN PARA OBTENER TODOS LOS DATOS REALES DE LA API - CON DISPONIBILIDAD ---
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
                disponibilidadAutos: 0,
                disponibilidadMotos: 0,
                serviciosActivos: [],
            };
        }

        // 1. IMÁGENES
        const imagenes = data.fotos && data.fotos.length > 0 
            ? data.fotos.map(foto => foto.url)
            : ['https://via.placeholder.com/400x250?text=No+Image'];
        
        const imagenPrincipal = imagenes[0];

        // 2. TARIFAS
        let tarifaAuto = 0;
        let tarifaMoto = 0;

        if (data.tarifas && data.tarifas.length > 0) {
            const tarifaAutoObj = data.tarifas.find(t => t.tipoVehiculoId === 1);
            const tarifaMotoObj = data.tarifas.find(t => t.tipoVehiculoId === 2);
            
            const tarifaAutoPorDesc = tarifaAutoObj || data.tarifas.find(t => 
                t.descripcion.toLowerCase().includes('auto')
            );
            const tarifaMotoPorDesc = tarifaMotoObj || data.tarifas.find(t => 
                t.descripcion.toLowerCase().includes('moto')
            );

            tarifaAuto = tarifaAutoPorDesc ? parseFloat(tarifaAutoPorDesc.precioHora) : 0;
            tarifaMoto = tarifaMotoPorDesc ? parseFloat(tarifaMotoPorDesc.precioHora) : 0;
        }

        // 3. CAPACIDADES TEÓRICAS
        let capacidadAutos = 0;
        let capacidadMotos = 0;

        if (data.capacidades && data.capacidades.length > 0) {
            const capacidadAutoObj = data.capacidades.find(c => c.tipoVehiculoId === 1);
            const capacidadMotoObj = data.capacidades.find(c => c.tipoVehiculoId === 2);
            
            const capacidadAutoPorNombre = capacidadAutoObj || data.capacidades.find(c => 
                c.tipoVehiculo.nombre.toLowerCase().includes('auto')
            );
            const capacidadMotoPorNombre = capacidadMotoObj || data.capacidades.find(c => 
                c.tipoVehiculo.nombre.toLowerCase().includes('moto')
            );

            capacidadAutos = capacidadAutoPorNombre ? capacidadAutoPorNombre.cantidad : 0;
            capacidadMotos = capacidadMotoPorNombre ? capacidadMotoPorNombre.cantidad : 0;
        }

        // 4. DISPONIBILIDAD REAL - CONTAR PLAZAS DISPONIBLES
        let disponibilidadAutos = 0;
        let disponibilidadMotos = 0;

        if (data.plazas && data.plazas.length > 0) {
            // Contar plazas disponibles por tipo
            const plazasAutoDisponibles = data.plazas.filter(plaza => 
                plaza.tipoVehiculoId === 1 && 
                (plaza.estado === 'DISPONIBLE' || plaza.estado === 'libre' || plaza.estado === null)
            );
            
            const plazasMotoDisponibles = data.plazas.filter(plaza => 
                plaza.tipoVehiculoId === 2 && 
                (plaza.estado === 'DISPONIBLE' || plaza.estado === 'libre' || plaza.estado === null)
            );

            disponibilidadAutos = plazasAutoDisponibles.length;
            disponibilidadMotos = plazasMotoDisponibles.length;

            console.log('🔄 Disponibilidad real calculada:', {
                totalPlazasAuto: data.plazas.filter(p => p.tipoVehiculoId === 1).length,
                totalPlazasMoto: data.plazas.filter(p => p.tipoVehiculoId === 2).length,
                disponiblesAuto: disponibilidadAutos,
                disponiblesMoto: disponibilidadMotos
            });
        } else {
            // Si no hay plazas definidas, usar capacidades como disponibilidad
            disponibilidadAutos = capacidadAutos;
            disponibilidadMotos = capacidadMotos;
        }

        // 5. SERVICIOS ACTIVOS
        const serviciosActivos = data.servicios?.filter(s => s.estado) || [];

        console.log('📊 DATOS FINALES - OPCIÓN C:', {
            nombre: data.nombre,
            capacidadAutos,
            capacidadMotos,
            disponibilidadAutos,
            disponibilidadMotos,
            formatoDisplay: {
                autos: `${disponibilidadAutos} / ${capacidadAutos}`,
                motos: `${disponibilidadMotos} / ${capacidadMotos}`
            }
        });

        return {
            imagenes,
            imagenPrincipal,
            tarifaAuto,
            tarifaMoto,
            capacidadAutos,
            capacidadMotos,
            disponibilidadAutos,
            disponibilidadMotos,
            serviciosActivos,
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
                        <Text className="text-sm text-white ml-1">{servicio.servicio.nombre}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

// --- COMPONENTE DETALLE DE CAPACIDADES ACTUALIZADO (OPCIÓN C) ---
const DetalleCapacidades = ({ 
    capacidadAutos, 
    capacidadMotos,
    disponibilidadAutos,
    disponibilidadMotos,
    tarifaAuto,
    tarifaMoto
}: { 
    capacidadAutos: number, 
    capacidadMotos: number,
    disponibilidadAutos: number,
    disponibilidadMotos: number,
    tarifaAuto: number,
    tarifaMoto: number
}) => {
    return (
        <View className="mt-4">
            <Text className="text-xl font-bold text-black mb-3">Detalle de Capacidades</Text>
            
            {/* Capacidad para Autos */}
            <View className="mb-4">
                <Text className="text-lg font-semibold text-black mb-2">
                    Autos ({disponibilidadAutos} / {capacidadAutos} espacios)
                </Text>
                <View className="flex-row items-center bg-[#7BB5CB] p-3 rounded-lg">
                    <FontAwesome5 name="car" size={20} color="#F6EEE4" />
                    <View className="ml-3">
                        <Text className="text-sm text-white font-semibold">
                            Tarifa: {tarifaAuto} Bs/h
                        </Text>
                        <Text className="text-xs text-white mt-1">
                            {disponibilidadAutos} de {capacidadAutos} espacios disponibles
                        </Text>
                    </View>
                </View>
            </View>

            {/* Capacidad para Motos */}
            <View>
                <Text className="text-lg font-semibold text-black mb-2">
                    Motos ({disponibilidadMotos} / {capacidadMotos} espacios)
                </Text>
                <View className="flex-row items-center bg-[#FD721D] p-3 rounded-lg">
                    <FontAwesome5 name="motorcycle" size={20} color="#F6EEE4" />
                    <View className="ml-3">
                        <Text className="text-sm text-white font-semibold">
                            Tarifa: {tarifaMoto} Bs/h
                        </Text>
                        <Text className="text-xs text-white mt-1">
                            {disponibilidadMotos} de {capacidadMotos} espacios disponibles
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

// --- Pantalla Principal ACTUALIZADA (OPCIÓN C) ---
export default function DetalleParqueoScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const parqueoId = Array.isArray(id) ? id[0] : id;

    const [data, setData] = useState<ParqueoDetalleAPI | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const { averageRating, reviewCount } = useParqueoStats(data);
    const { 
        imagenes,
        imagenPrincipal, 
        tarifaAuto, 
        tarifaMoto, 
        capacidadAutos, 
        capacidadMotos, 
        disponibilidadAutos,
        disponibilidadMotos,
        serviciosActivos,
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
                        capacidades: parqueoEncontrado.capacidades?.length || 0,
                        tarifas: parqueoEncontrado.tarifas?.length || 0,
                        horarios: parqueoEncontrado.horarios?.length || 0,
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
            disponibilidadAutos: disponibilidadAutos.toString(),
            disponibilidadMotos: disponibilidadMotos.toString(),
            parqueoLat: data.latitud?.toString() || '-17.3936',
            parqueoLng: data.longitud?.toString() || '-66.1569',
        };

        console.log(`🚀 Navegando a Reserva con datos OPCIÓN C:`, paramsToPass);
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
                <Text className="mt-4 text-base text-black">Cargando información del parqueo...</Text>
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
                        ({reviewCount} {reviewCount === 1 ? 'opinión' : 'opiniones'})
                    </Text>
                    {/* MOSTRAR MODAL DE RESENIAS Y CALIFICACIONES */}
                    <TouchableOpacity onPress={() => setModalVisible(true)} className="mx-20 px-4 rounded-lg py-2 shadow-lg border-2 bg-[#7BB5CB] border-[#7BB5CB] hover:[#FD721D] hover:text-[#7BB5CB]">
                        <Text className="text-white font-semibold">VER RESEÑAS</Text>
                    </TouchableOpacity>
                </View>

                {/* Fila de Acciones */}
                <View className="flex-row justify-between border-b border-gray-300 pb-4 mb-4">
                    <TouchableOpacity className="items-center w-1/5">
                        <Feather name="bookmark" size={24} color="#7BB5CB" />
                        <Text className="text-xs mt-1 text-black">Guardar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="items-center justify-center w-2/5 bg-[#FD721D] rounded-lg py-2 shadow-lg"
                        onPress={handleNavigateToReserva}
                    >
                        <Text className="text-sm font-bold text-white">RESERVAR</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="items-center w-1/5">
                        <Feather name="share-2" size={24} color="#7BB5CB" />
                        <Text className="text-xs mt-1 text-black">Compartir</Text>
                    </TouchableOpacity>

                </View>

                {/* Descripción General */}
                <Text className="text-xl font-bold text-black mb-3">Descripción general</Text>
                <Text className="text-sm text-black mb-4 leading-5">
                    {data.descripcion || "No hay descripción disponible."}
                </Text>

                {/* Galería de Imágenes */}
                <GaleriaImagenes imagenes={imagenes} />

                {/* Capacidades y Tarifas - OPCIÓN C: "disponibles/totales" */}
                <Text className="text-xl font-bold text-black mt-4 mb-3">Capacidades y Tarifas</Text>
                <View className="flex-row flex-wrap justify-between">
                    {/* Auto */}
                    <View className="w-[48%] bg-[#7BB5CB] p-3 rounded-lg mb-2 flex-row items-center shadow-sm">
                        <FontAwesome5 name="car" size={24} color="#F6EEE4" />
                        <View className="ml-3">
                            <Text className="text-xs font-semibold text-white">Auto</Text>
                            <Text className="text-xl font-bold text-white">{disponibilidadAutos} / {capacidadAutos}</Text>
                            <Text className="text-xs text-white">{tarifaAuto} Bs/h</Text>
                        </View>
                    </View>
                    
                    {/* Moto */}
                    <View className="w-[48%] bg-[#FD721D] p-3 rounded-lg mb-2 flex-row items-center shadow-sm">
                        <FontAwesome5 name="motorcycle" size={24} color="#F6EEE4" />
                        <View className="ml-3">
                            <Text className="text-xs font-semibold text-white">Moto</Text>
                            <Text className="text-xl font-bold text-white">{disponibilidadMotos} / {capacidadMotos}</Text>
                            <Text className="text-xs text-white">{tarifaMoto} Bs/h</Text>
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
                        <View key={index} className="flex-row items-center mb-2">
                            <Feather 
                                name="calendar" 
                                size={16} 
                                color={esCerrado ? '#9CA3AF' : '#7BB5CB'} 
                            />
                            <Text className="text-sm text-black ml-3 font-semibold w-24">
                                {day.charAt(0).toUpperCase() + day.slice(1)}:
                            </Text>
                            <Text className={`text-sm ml-2 ${esCerrado ? 'text-gray-500' : 'text-black'}`}>
                                {horarioTexto}
                            </Text>
                        </View>
                    );
                })}

                {/* Detalle de Capacidades (OPCIÓN C) */}
                <DetalleCapacidades 
                    capacidadAutos={capacidadAutos}
                    capacidadMotos={capacidadMotos}
                    disponibilidadAutos={disponibilidadAutos}
                    disponibilidadMotos={disponibilidadMotos}
                    tarifaAuto={tarifaAuto}
                    tarifaMoto={tarifaMoto}
                />

                {/* Espacio al final para mejor scroll */}
                <View className="h-8" />
            </View>
            <CommentSection visible={modalVisible} onClose={() => setModalVisible(false)}>
                <ReviewsContent onClose={() => setModalVisible(false)}/>
            </CommentSection>
        </ScrollView>
    );
}