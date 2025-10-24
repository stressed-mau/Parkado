import React, { useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; 

// --- Tipos de Datos (Mantenidos) ---
type Parqueo = { 
    id: string; 
    nombre: string; 
    latitud: number; 
    longitud: number; 
    horario: string; 
    tarifa: string; 
    disponible: boolean; 
    rating: number; 
    imageUri: string;
};

// --- Propiedades del Componente ---
interface ParkeoPopupProps {
    details: Parqueo; 
    onClose: () => void;
}

// ------------------------------------------------------------------
// ESTILOS DE LAYOUT (Estrictamente nativos)
// ------------------------------------------------------------------
const styles = StyleSheet.create({ 
    overlay: {
        ...StyleSheet.absoluteFillObject, 
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 80,
        zIndex: 40,
    }
});
// ------------------------------------------------------------------

const ParkeoPopup: React.FC<ParkeoPopupProps> = ({ details, onClose }) => {
    const router = useRouter(); 
    
    // Función para mostrar estrellas de calificación (simulado)
    const RatingStars = useCallback(({ count }: { count: number }) => {
        const fullStars = Math.floor(count);
        const emptyStars = 5 - fullStars;

        return (
            <Text className="text-yellow-500">
                {'★'.repeat(fullStars) + '☆'.repeat(emptyStars)}
            </Text>
        );
    }, []);


    // ✅ FUNCIÓN DE NAVEGACIÓN (CORREGIDA)
    const handleNavigateToDetails = () => {
        // 🚀 Navega a la ruta dinámica: /parqueo-detalle/[id].tsx
        router.push({
            pathname: '/parqueo-detalle/[id]', // <-- 1. USA LA RUTA LITERAL
            params: { 
                id: details.id,              // <-- 2. EL ID VA DENTRO DE PARAMS
                nombre: details.nombre 
            }
        });
        
        // 3. CIERRA EL POPUP AL NAVEGAR
        onClose(); 
    
    }; // <--- ❗️❗️ ERROR ARREGLADO: LA FUNCIÓN TERMINA AQUÍ ❗️❗️

    
    // --- Mapeo de datos (AHORA ESTÁN EN EL LUGAR CORRECTO) ---
    const name = details.nombre;
    const rating = details.rating || 4;
    const availabilityText = details.disponible ? "¡Disponible ahora!" : "Lleno";
    const imageUri = details.imageUri;
    const detailsText = `Horario: ${details.horario} | Tarifa: ${details.tarifa}`; 
    

    // --- RETURN PRINCIPAL DEL COMPONENTE (AHORA ESTÁ EN EL LUGAR CORRECTO) ---
    return (
        // Contenedor principal del Modal (Fondo oscuro)
        <View style={styles.overlay} className="bg-black/40"> 
            
            {/* Tarjeta Flotante */}
            <View className="p-4 mx-6 bg-white rounded-xl shadow-2xl z-50 w-11/12">
                
                {/* Botón de Cierre */}
                <TouchableOpacity onPress={onClose} className="absolute top-3 right-3 p-1 z-10 active:opacity-70">
                    <Text className="text-xl font-bold text-gray-500">✕</Text>
                </TouchableOpacity>

                {/* Área de Contenido */}
                <View className="flex-row items-start space-x-3 pt-2">
                    {/* Imagen */}
                    <View className="w-20 h-16 bg-gray-200 rounded-lg justify-center items-center overflow-hidden">
                        <Image
                            source={{ uri: imageUri || 'https://via.placeholder.com/100x80?text=IMG' }}
                            className="w-full h-full rounded-lg"
                            resizeMode="cover"
                        />
                    </View>

                    {/* Detalles */}
                    <View className="flex-1">
                        <Text className="text-lg font-bold text-gray-800">{name}</Text>
                        <View className="flex-row items-center my-1">
                            <RatingStars count={rating} />
                            <Text className="text-xs text-gray-500 ml-2">({rating}.0)</Text>
                        </View>
                        <Text className="text-sm text-gray-600">{detailsText}</Text>
                        <Text className={`text-xs mt-1 font-semibold ${details.disponible ? 'text-green-600' : 'text-red-600'}`}>
                            {availabilityText}
                        </Text>
                    </View>

                    {/* Íconos de Acción */}
                    <View className="flex-col space-y-3 pt-1">
                    
                        
                        {/* Ícono de Mapa/Detalles (NAVEGACIÓN INTERNA) */}
                        <TouchableOpacity onPress={handleNavigateToDetails} className="mt-12 p-2 border border-gray-300 rounded-lg active:opacity-70">
                            <Feather name="calendar" size={20} color="#007BFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default ParkeoPopup;