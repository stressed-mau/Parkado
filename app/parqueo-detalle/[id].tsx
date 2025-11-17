import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Modal, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

// Hooks y tipos
import useParqueoDetalle, { formatHour } from '../../hooks/useParqueoDetalle';
import {
    RatingStarsProps,
    GaleriaImagenesProps,
    ServiciosAdicionalesProps,
    DetalleCapacidadesProps,
    ALL_DAYS
} from '../../types/detalle';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// --- COMPONENTES AUXILIARES ACTUALIZADOS ---

const RatingStars = ({ rating }: RatingStarsProps) => {
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

// ✅ NUEVO: Modal para visualización de imágenes
const ImageModal = ({ 
    visible, 
    images, 
    currentIndex, 
    onClose, 
    onNext, 
    onPrev 
}: {
    visible: boolean;
    images: string[];
    currentIndex: number;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
}) => {
    if (!visible || !images.length) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            statusBarTranslucent={true}
        >
            <View className="flex-1 bg-black/95 justify-center items-center">
                {/* Botón cerrar */}
                <TouchableOpacity 
                    onPress={onClose}
                    className="absolute top-16 right-6 z-20 bg-black/50 p-3 rounded-full"
                >
                    <Feather name="x" size={24} color="white" />
                </TouchableOpacity>

                {/* Contador de imágenes */}
                <View className="absolute top-16 left-6 z-20 bg-black/50 px-3 py-1 rounded-full">
                    <Text className="text-white text-sm font-medium">
                        {currentIndex + 1} / {images.length}
                    </Text>
                </View>

                {/* Imagen principal */}
                <View className="w-full h-3/4 justify-center items-center">
                    <Image
                        source={{ uri: images[currentIndex] }}
                        className="w-full h-full"
                        resizeMode="contain"
                    />
                </View>

                {/* Botones de navegación */}
                {images.length > 1 && (
                    <View className="absolute bottom-8 flex-row justify-between w-full px-8">
                        {/* Botón anterior */}
                        <TouchableOpacity 
                            onPress={onPrev}
                            className="bg-black/50 p-4 rounded-full"
                            disabled={currentIndex === 0}
                        >
                            <Feather 
                                name="chevron-left" 
                                size={24} 
                                color={currentIndex === 0 ? '#666' : 'white'} 
                            />
                        </TouchableOpacity>

                        {/* Botón siguiente */}
                        <TouchableOpacity 
                            onPress={onNext}
                            className="bg-black/50 p-4 rounded-full"
                            disabled={currentIndex === images.length - 1}
                        >
                            <Feather 
                                name="chevron-right" 
                                size={24} 
                                color={currentIndex === images.length - 1 ? '#666' : 'white'} 
                            />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Indicadores de posición (dots) */}
                {images.length > 1 && (
                    <View className="absolute bottom-4 flex-row space-x-2">
                        {images.map((_, index) => (
                            <View
                                key={index}
                                className={`w-2 h-2 rounded-full ${
                                    index === currentIndex ? 'bg-white' : 'bg-gray-500'
                                }`}
                            />
                        ))}
                    </View>
                )}
            </View>
        </Modal>
    );
};

// ✅ ACTUALIZADO: Galería de imágenes con funcionalidad de zoom
const GaleriaImagenes = ({ imagenes }: GaleriaImagenesProps) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!imagenes || imagenes.length === 0) return null;

    const openImage = (index: number) => {
        setCurrentImageIndex(index);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
    };

    const nextImage = () => {
        setCurrentImageIndex(prev => 
            prev === imagenes.length - 1 ? 0 : prev + 1
        );
    };

    const prevImage = () => {
        setCurrentImageIndex(prev => 
            prev === 0 ? imagenes.length - 1 : prev - 1
        );
    };

    return (
        <View className="mt-4">
            <Text className="text-xl font-bold text-black mb-3">Galería de Imágenes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {imagenes.map((url, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => openImage(index)}
                        activeOpacity={0.7}
                        className="mr-2 relative"
                    >
                        <Image
                            source={{ uri: url }}
                            className="w-32 h-24 rounded-lg"
                            resizeMode="cover"
                        />
                        {/* Icono de zoom en miniatura */}
                        <View className="absolute top-1 right-1 bg-black/50 p-1 rounded">
                            <Feather name="zoom-in" size={12} color="white" />
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Modal de imagen ampliada */}
            <ImageModal
                visible={modalVisible}
                images={imagenes}
                currentIndex={currentImageIndex}
                onClose={closeModal}
                onNext={nextImage}
                onPrev={prevImage}
            />
        </View>
    );
};

const ServiciosAdicionales = ({ servicios }: ServiciosAdicionalesProps) => {
    if (!servicios || servicios.length === 0) {
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
                        <Text className="text-sm text-white ml-1">
                            {typeof servicio === 'string' ? servicio : servicio.nombre || servicio.servicio?.nombre}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const DetalleCapacidades = ({ 
    capacidadAutos, 
    capacidadMotos,
    disponibilidadAutos,
    disponibilidadMotos,
    tarifaAuto,
    tarifaMoto
}: DetalleCapacidadesProps) => {
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

// --- COMPONENTE PRINCIPAL CORREGIDO ---
export default function DetalleParqueoScreen() {
    const router = useRouter();
    const {
        data,
        isLoading,
        error,
        stats,
        processedData,
        handleNavigateToReserva,
        refetch
    } = useParqueoDetalle();

    const [mainImageModalVisible, setMainImageModalVisible] = useState(false);

    const handleReservaPress = () => {
        if (!data?.id) {
            Alert.alert('Error', 'No se pudo obtener la información del parqueo');
            return;
        }

        handleNavigateToReserva({
            parqueoId: data.id.toString(),
            parqueoNombre: data.nombre || 'Parqueo'
        });
    };

    const openMainImageModal = () => {
        if (processedData?.imagenPrincipal) {
            setMainImageModalVisible(true);
        }
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
                <TouchableOpacity 
                    onPress={refetch}
                    className="bg-[#7BB5CB] px-6 py-3 rounded-lg mt-3"
                >
                    <Text className="text-white font-semibold">Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ✅ CORREGIDO: Usar valores directamente desde processedData (ya deberían ser números)
    const {
        imagenPrincipal = 'https://via.placeholder.com/300x200?text=Imagen+No+Disponible',
        imagenes = [],
        serviciosActivos = [],
        capacidadAutos = 0,
        capacidadMotos = 0,
        disponibilidadAutos = 0,
        disponibilidadMotos = 0,
        tarifaAuto = 0, // ✅ Ya es número según tus tipos
        tarifaMoto = 0  // ✅ Ya es número según tus tipos
    } = processedData || {};

    const horarios = data.horarios || [];
    const allImages = [imagenPrincipal, ...imagenes.filter(img => img !== imagenPrincipal)];

    return (
        <ScrollView className="flex-1 bg-[#F6EEE4]" showsVerticalScrollIndicator={false}>
            {/* Contenedor de Imagen Principal */}
            <View className="w-full h-64 overflow-hidden relative">
                <TouchableOpacity 
                    onPress={openMainImageModal}
                    activeOpacity={0.9}
                    disabled={!imagenPrincipal}
                >
                    <Image
                        source={{ uri: imagenPrincipal }}
                        className="w-full h-full"
                        resizeMode="cover"
                        defaultSource={{ uri: 'https://via.placeholder.com/300x200?text=Imagen+No+Disponible' }}
                    />
                    <View className="absolute bottom-3 right-3 bg-black/50 p-2 rounded-full">
                        <Feather name="zoom-in" size={20} color="white" />
                    </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    className="absolute top-12 left-4 bg-black/50 p-2 rounded-full"
                >
                    <Feather name="arrow-left" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ImageModal
                visible={mainImageModalVisible}
                images={allImages}
                currentIndex={0}
                onClose={() => setMainImageModalVisible(false)}
                onNext={() => {}}
                onPrev={() => {}}
            />

            {/* Contenido Principal */}
            <View className="p-4">
                {/* Encabezado */}
                <Text className="text-3xl font-bold text-black mb-1">
                    {data.nombre || 'Parqueo Sin Nombre'}
                </Text>
                
                {/* Dirección */}
                <View className="flex-row items-center mb-1">
                    <Feather name="map-pin" size={16} color="#7BB5CB" />
                    <Text className="text-sm text-black ml-2 flex-1">
                        {data.direccion || 'Dirección no disponible'} 
                        {data.tipoLugar && ` (${data.tipoLugar})`}
                    </Text>
                </View>
                
                {/* Rating */}
                <View className="flex-row items-center mb-4">
                    <Text className="text-xl font-bold text-black mr-2">
                        {stats?.averageRating?.toFixed(1) || '0.0'}
                    </Text>
                    <RatingStars rating={stats?.averageRating || 0} />
                    <Text className="text-xs text-black ml-2">
                        ({stats?.reviewCount || 0} {stats?.reviewCount === 1 ? 'opinión' : 'opiniones'})
                    </Text>
                </View>

                {/* Fila de Acciones */}
                <View className="flex-row justify-between border-b border-gray-300 pb-4 mb-4">
                    <TouchableOpacity
                        className="items-center justify-center w-2/5 bg-[#FD721D] rounded-lg py-2 shadow-lg"
                        onPress={handleReservaPress}
                        disabled={!data.id}
                    >
                        <Text className="text-sm font-bold text-white">RESERVAR</Text>
                    </TouchableOpacity>
                </View>

                {/* Galería de Imágenes */}
                <GaleriaImagenes imagenes={imagenes} />

                {/* Capacidades y Tarifas */}
                <Text className="text-xl font-bold text-black mt-4 mb-3">Capacidades y Tarifas</Text>
                <View className="flex-row flex-wrap justify-between">
                    {/* Auto */}
                    <View className="w-[48%] bg-[#7BB5CB] p-3 rounded-lg mb-2 flex-row items-center shadow-sm">
                        <FontAwesome5 name="car" size={24} color="#F6EEE4" />
                        <View className="ml-3">
                            <Text className="text-xs font-semibold text-white">Auto</Text>
                            <Text className="text-xl font-bold text-white">
                                {disponibilidadAutos} / {capacidadAutos}
                            </Text>
                            {/* ✅ Usar tarifaAuto directamente (ya es número) */}
                            <Text className="text-xs text-white">{tarifaAuto.toFixed(2)} Bs/h</Text>
                        </View>
                    </View>
                    
                    {/* Moto */}
                    <View className="w-[48%] bg-[#FD721D] p-3 rounded-lg mb-2 flex-row items-center shadow-sm">
                        <FontAwesome5 name="motorcycle" size={24} color="#F6EEE4" />
                        <View className="ml-3">
                            <Text className="text-xs font-semibold text-white">Moto</Text>
                            <Text className="text-xl font-bold text-white">
                                {disponibilidadMotos} / {capacidadMotos}
                            </Text>
                            {/* ✅ Usar tarifaMoto directamente (ya es número) */}
                            <Text className="text-xs text-white">{tarifaMoto.toFixed(2)} Bs/h</Text>
                        </View>
                    </View>
                </View>

                {/* Servicios Adicionales */}
                <ServiciosAdicionales servicios={serviciosActivos} />

                {/* Horarios */}
                <Text className="text-xl font-bold text-black mt-4 mb-3">Horarios de Atención</Text>
                {ALL_DAYS.map((day, index) => {
                    const horarioDia = horarios.find(h => 
                        h.diaSemana?.toLowerCase() === day.toLowerCase()
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

                {/* ✅ Pasar tarifas directamente (ya son números) */}
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
        </ScrollView>
    );
}