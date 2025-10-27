import React, { useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; 

type Parqueo = { 
    id: string; 
    nombre: string; 
    horario: string;
    tarifa: string;
    disponible: boolean; 
    rating: number; 
    imageUri: string;
    latitud: number;
    longitud: number;
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
            <Text style={{ color: '#F9B928' }}>
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

    const handleDirectionsPress = () => {
        if (onShowDirections) {
            onShowDirections();
            onClose();
        }
    };

    const name = details.nombre;
    const rating = details.rating || 4;
    const availabilityText = details.disponible ? "¡Disponible ahora!" : "Lleno";
    const imageUri = details.imageUri; // 🔧 Ya viene de la BD desde Mapa.tsx
    const detailsText = `Horario: ${details.horario} | Tarifa: ${details.tarifa}`; 

    return (
        <View style={styles.overlay}> 
            <View style={{ 
                padding: 16, 
                marginHorizontal: 24, 
                backgroundColor: '#F6EEE4', 
                borderRadius: 12, 
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 8,
                zIndex: 50,
                width: '88%'
            }}>
                {/* Botón de cierre */}
                <TouchableOpacity 
                    onPress={onClose} 
                    style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        padding: 4,
                        zIndex: 10
                    }}
                    activeOpacity={0.7}
                >
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#626C7C' }}>✕</Text>
                </TouchableOpacity>

                {/* Contenido principal */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingTop: 8 }}>
                    {/* Imagen más grande */}
                    <View style={{
                        width: 100,
                        height: 80,
                        backgroundColor: '#E3E5E5',
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                        marginRight: 12
                    }}>
                        <Image
                            source={{ uri: imageUri || 'https://via.placeholder.com/200x160?text=Sin+Imagen' }}
                            style={{ width: '100%', height: '100%', borderRadius: 8 }}
                            resizeMode="cover"
                        />
                    </View>

                    {/* Info del parqueo */}
                    <View style={{ flex: 1 }}>
                        <Text style={{ 
                            fontSize: 18, 
                            fontWeight: '600', 
                            color: '#13343B',
                            marginBottom: 6
                        }}>
                            {name}
                        </Text>
                        
                        {/* Rating */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <RatingStars count={rating} />
                            <Text style={{ fontSize: 12, color: '#626C7C', marginLeft: 6 }}>
                                ({rating}.0)
                            </Text>
                        </View>
                        
                        {/* Detalles */}
                        <Text 
                            style={{ fontSize: 12, color: '#626C7C', marginBottom: 4 }}
                            numberOfLines={2}
                        >
                            {detailsText}
                        </Text>
                        
                        {/* Estado de disponibilidad */}
                        <Text style={{ 
                            fontSize: 13, 
                            fontWeight: '600',
                            color: details.disponible ? '#32B8C6' : '#ED213A'
                        }}>
                            {availabilityText}
                        </Text>
                    </View>
                </View>

                {/* 🆕 BOTONES ABAJO - BIEN ORGANIZADOS */}
                <View style={{ 
                    flexDirection: 'row', 
                    marginTop: 16, 
                    gap: 8,
                    justifyContent: 'space-between'
                }}>
                    {/* Botón Reservar */}
                    <TouchableOpacity 
                        onPress={handleNavigateToDetails}
                        style={{
                            flex: 1,
                            paddingVertical: 10,
                            borderRadius: 8,
                            backgroundColor: '#FD721D',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                        }}
                        activeOpacity={0.8}
                    >
                        <Feather name="calendar" size={18} color="#FCFCF9" />
                        <Text style={{ 
                            color: '#FCFCF9', 
                            fontWeight: '600', 
                            fontSize: 14 
                        }}>
                            Reservar
                        </Text>
                    </TouchableOpacity>

                    {/* Botón Cómo Llegar */}
                    {onShowDirections && (
                        <TouchableOpacity 
                            onPress={handleDirectionsPress}
                            style={{
                                flex: 1,
                                paddingVertical: 10,
                                borderRadius: 8,
                                backgroundColor: '#32B8C6',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6
                            }}
                            activeOpacity={0.8}
                        >
                            <Feather name="navigation" size={18} color="#FCFCF9" />
                            <Text style={{ 
                                color: '#FCFCF9', 
                                fontWeight: '600', 
                                fontSize: 14 
                            }}>
                                Cómo Llegar
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

export default ParkeoPopup;
