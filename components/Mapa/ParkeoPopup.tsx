import React, { useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; 

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

interface ParkeoPopupProps {
    details: Parqueo; 
    onClose: () => void;
    onShowDirections?: () => void;
    showingDirections?: boolean;
}

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

const ParkeoPopup: React.FC<ParkeoPopupProps> = ({ 
    details, 
    onClose,
    onShowDirections,
    showingDirections = false
}) => {
    const router = useRouter(); 
    
    const RatingStars = useCallback(({ count }: { count: number }) => {
        const fullStars = Math.floor(count);
        const emptyStars = 5 - fullStars;

        return (
            <Text className="text-yellow-500">
                {'★'.repeat(fullStars) + '☆'.repeat(emptyStars)}
            </Text>
        );
    }, []);

    const handleNavigateToDetails = () => {
        router.push({
            pathname: '/parqueo-detalle/[id]',
            params: { 
                id: details.id,
                nombre: details.nombre 
            }
        });
        onClose(); 
    };

    // 🆕 Nueva función para manejar el botón de direcciones
    const handleDirectionsPress = () => {
        if (onShowDirections) {
            onShowDirections(); // Llama a la función para mostrar la ruta
            onClose(); // Cierra el modal
        }
    };

    const name = details.nombre;
    const rating = details.rating || 4;
    const availabilityText = details.disponible ? "¡Disponible ahora!" : "Lleno";
    const imageUri = details.imageUri;
    const detailsText = `Horario: ${details.horario} | Tarifa: ${details.tarifa}`; 

    return (
        <View style={styles.overlay} className="bg-black/40"> 
            <View className="p-4 mx-6 bg-white rounded-xl shadow-2xl z-50 w-11/12">
                <TouchableOpacity onPress={onClose} className="absolute top-3 right-3 p-1 z-10 active:opacity-70">
                    <Text className="text-xl font-bold text-gray-500">✕</Text>
                </TouchableOpacity>

                <View className="flex-row items-start space-x-3 pt-2">
                    <View className="w-20 h-16 bg-gray-200 rounded-lg justify-center items-center overflow-hidden">
                        <Image
                            source={{ uri: imageUri || 'https://via.placeholder.com/100x80?text=IMG' }}
                            className="w-full h-full rounded-lg"
                            resizeMode="cover"
                        />
                    </View>

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

                    <View className="flex-col space-y-3 pt-1">
                        <TouchableOpacity onPress={handleNavigateToDetails} className="mt-12 p-2 border border-gray-300 rounded-lg active:opacity-70">
                            <Feather name="calendar" size={20} color="#007BFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 🆕 BOTÓN DE INDICACIONES - MÁS PEQUEÑO Y CIERRA EL MODAL */}
                {onShowDirections && (
                    <TouchableOpacity 
                        onPress={handleDirectionsPress} // 🔧 Usa la nueva función
                        className="mt-3 py-2 px-4 rounded-lg flex-row items-center justify-center gap-2 bg-blue-600" // 🔧 Padding reducido
                        activeOpacity={0.7}
                    >
                        <Feather name="navigation" size={16} color="white" />
                        <Text className="text-white font-semibold text-xs">
                            Cómo Llegar
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default ParkeoPopup;
