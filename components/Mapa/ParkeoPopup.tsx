import React, { useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
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
    onShowDirections?: (coords: { latitude: number; longitude: number; name: string }) => void;
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
    },
    card: {
        padding: 16,
        marginHorizontal: 24,
        backgroundColor: '#F6EEE4', // Crema fondo
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 50,
        width: '88%'
    },
    closeButton: { position: 'absolute', top: 12, right: 12, padding: 4, zIndex: 10 },
    closeButtonText: { fontSize: 20, fontWeight: 'bold', color: '#000' }, // Negro
    contentRow: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 8 },
    imageContainer: { 
        width: 100, 
        height: 80, 
        backgroundColor: '#B2A83F', // Verde oro
        borderRadius: 8, 
        justifyContent: 'center', 
        alignItems: 'center', 
        overflow: 'hidden', 
        marginRight: 12 
    },
    image: { width: '100%', height: '100%', borderRadius: 8 },
    infoContainer: { flex: 1 },
    nameText: { fontSize: 18, fontWeight: '600', color: '#000', marginBottom: 6 }, // Negro
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    ratingValueText: { fontSize: 12, color: '#000', marginLeft: 6 }, // Negro
    detailsText: { fontSize: 12, color: '#000', marginBottom: 4 }, // Negro
    availabilityTextAvailable: { fontSize: 13, fontWeight: '600', color: '#B2A83F' }, // Verde oro
    availabilityTextFull: { fontSize: 13, fontWeight: '600', color: '#FD721D' }, // Naranja
    buttonsContainer: { flexDirection: 'row', marginTop: 16, gap: 8, justifyContent: 'space-between' },
    buttonBase: { flex: 1, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    buttonPrimary: { backgroundColor: '#FD721D' }, // Naranja (Reservar)
    buttonSecondary: { backgroundColor: '#7BB5CB' }, // Azul (Cómo Llegar)
    buttonText: { color: '#F6EEE4', fontWeight: '600', fontSize: 14 } // Crema en botones
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
        const emptyStars = 5 - Math.max(0, Math.min(5, fullStars));
        return (<Text style={{ color: '#F2BD2B' }}>{'★'.repeat(fullStars)}{'☆'.repeat(emptyStars)}</Text>);
    }, []);

    const handleNavigateToDetails = () => {
        if (typeof details.latitud !== 'number' || typeof details.longitud !== 'number') {
            console.error("ParkeoPopup: Coordenadas inválidas en 'details' para reservar.", details);
            Alert.alert("Error", "Datos de ubicación incompletos para este parqueo.");
            return;
        }

        const tarifaAuto = details.tarifa?.includes('/') ? details.tarifa.split('/')[0].replace('Bs', '').trim() : '7';
        const tarifaMoto = '4';
        const capacidadAutos = '10';
        const capacidadMotos = '5';

        router.push({
            pathname: '/parqueo-detalle/[id]' as any,
            params: {
                id: details.id,
                parqueoNombre: details.nombre,
                tarifaAuto: tarifaAuto,
                tarifaMoto: tarifaMoto,
                capacidadAutos: capacidadAutos,
                capacidadMotos: capacidadMotos,
                parqueoLat: details.latitud.toString(),
                parqueoLng: details.longitud.toString(),
            }
        });
        onClose();
    };

    const handleDirectionsPress = () => {
        if (onShowDirections && typeof details.latitud === 'number' && typeof details.longitud === 'number') {
            console.log(`POPUP: Llamando onShowDirections con: ${details.nombre}, ${details.latitud}, ${details.longitud}`);
            onShowDirections({
                latitude: details.latitud,
                longitude: details.longitud,
                name: details.nombre
            });
            onClose();
        } else if (!onShowDirections) {
            console.warn("POPUP: onShowDirections no fue proporcionado desde Mapa.tsx.");
        } else {
            console.error("POPUP: Faltan coordenadas válidas en 'details' para 'Cómo Llegar'.", details);
            Alert.alert("Error de Datos", "No se pueden obtener las coordenadas de este parqueo.");
        }
    };

    if (!details || typeof details.nombre === 'undefined') {
        console.warn("ParkeoPopup Render: 'details' es undefined o inválido. No renderizando.");
        return (
            <View style={styles.overlay}>
                <View style={[styles.card, { alignItems: 'center', justifyContent: 'center', minHeight: 150 }]}>
                    <ActivityIndicator size="small" color="#FD721D" />
                </View>
            </View>
        );
    }

    const { nombre, rating = 0, disponible, imageUri, horario, tarifa } = details;
    const availabilityText = disponible ? "¡Con espacio!" : "Lleno";
    const detailsText = `Horario: ${horario || 'N/A'} | Tarifa: ${tarifa || 'N/A'}`;

    return (
        <View style={styles.overlay}>
            <View style={styles.card}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>

                <View style={styles.contentRow}>
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: imageUri || 'https://via.placeholder.com/200x160?text=IMG' }} style={styles.image} resizeMode="cover" />
                    </View>
                    <View style={styles.infoContainer}>
                        <Text style={styles.nameText}>{nombre || 'Parqueo'}</Text>
                        <View style={styles.ratingRow}>
                            <RatingStars count={rating} />
                            <Text style={styles.ratingValueText}>({rating.toFixed(1)})</Text>
                        </View>
                        <Text style={styles.detailsText} numberOfLines={2}>{detailsText}</Text>
                        <Text style={disponible ? styles.availabilityTextAvailable : styles.availabilityTextFull}>{availabilityText}</Text>
                    </View>
                </View>

                <View style={styles.buttonsContainer}>
                    <TouchableOpacity onPress={handleNavigateToDetails} style={[styles.buttonBase, styles.buttonPrimary]} activeOpacity={0.8}>
                        <Feather name="calendar" size={18} color="#F6EEE4" />
                        <Text style={styles.buttonText}>Reservar</Text>
                    </TouchableOpacity>

                    {onShowDirections && (
                        <TouchableOpacity onPress={handleDirectionsPress} style={[styles.buttonBase, styles.buttonSecondary]} activeOpacity={0.8}>
                            <Feather name="navigation" size={18} color="#F6EEE4" />
                            <Text style={styles.buttonText}>Cómo Llegar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

export default ParkeoPopup;
