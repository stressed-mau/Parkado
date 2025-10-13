import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';

// --- Tipos de Datos ---
// Este tipo de dato debe coincidir con el que usas en tu pantalla de Mapa
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

const ParkeoPopup: React.FC<ParkeoPopupProps> = ({ details, onClose }) => {

    // ✅ NUEVA FUNCIÓN: Para abrir la app de mapas con la ruta
    const handleGetDirections = () => {
        const destination = `${details.latitud},${details.longitud}`;
        
        // Creamos la URL específica para cada plataforma (iOS o Android)
        const url = Platform.select({
            ios: `http://maps.apple.com/?daddr=${destination}`,
            android: `https://www.google.com/maps/dir/?api=1&destination=${destination}`
        });

        if (url) {
            // Usamos Linking para abrir la URL, lo que abrirá la app de mapas
            Linking.openURL(url).catch(err => console.error("No se pudo abrir la URL", err));
        }
    };

    // --- Lógica de tu componente (sin cambios) ---
    const name = details.nombre;
    const rating = details.rating || 4;
    const address = `Horario: ${details.horario} | Tarifa: ${details.tarifa}`;
    const availabilityText = details.disponible ? "¡Disponible ahora!" : "Lleno";
    const imageUri = details.imageUri;

    const RatingStars = ({ count }: { count: number }) => (
        <Text className="text-yellow-500">
            {'★'.repeat(count) + '☆'.repeat(5 - count)}
        </Text>
    );

    return (
        // Usamos un View normal con position: 'absolute' en lugar del StyleSheet mock
        <View style={styles.overlay}>
            <View className="p-4 mx-6 bg-white rounded-xl shadow-2xl z-50 w-11/12">
                
                <TouchableOpacity onPress={onClose} className="absolute top-3 right-3 p-1 z-10">
                    <Text className="text-xl font-bold text-gray-500">✕</Text>
                </TouchableOpacity>

                <View className="flex-row items-start space-x-3 pt-2">
                    <View className="w-20 h-16 bg-gray-200 rounded-lg justify-center items-center">
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
                        <Text className="text-sm text-gray-600">{address}</Text>
                        <Text className={`text-xs mt-1 font-semibold ${details.disponible ? 'text-green-600' : 'text-red-600'}`}>
                            {availabilityText}
                        </Text>
                    </View>

                    <View className="flex-col space-y-3 pt-1">
                        <TouchableOpacity onPress={() => console.log('Abrir reserva')} className="p-1 border border-gray-300 rounded-lg">
                            <Text className="text-2xl text-blue-600">📅</Text>
                        </TouchableOpacity>
                        
                        {/* ✅ CONECTAMOS LA FUNCIÓN AL BOTÓN */}
                        <TouchableOpacity onPress={handleGetDirections} className="p-1 border border-gray-300 rounded-lg">
                            <Text className="text-2xl text-green-600">🗺️</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

// ✅ ESTILOS CORRECTOS: Usando StyleSheet de React Native
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

export default ParkeoPopup;