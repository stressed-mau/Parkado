import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Region, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
// ❌ Reemplazamos ParkeoCard por ParkeoPopup
// ✅ 1. IMPORTAR EL NUEVO POPUP
import ParkeoPopup from '../../components/Mapa/ParkeoPopup'; 

// --- Tipos de Datos (Añadimos Rating e Imagen) ---
type Parqueo = { 
    id: string; 
    nombre: string; 
    latitud: number; 
    longitud: number; 
    horario: string; 
    tarifa: string; 
    disponible: boolean; 
    // ✅ Propiedades adicionales requeridas por ParkeoPopup
    rating: number; 
    imageUri: string;
};

type RegionState = { 
    latitude: number; 
    longitude: number; 
    latitudeDelta: number; 
    longitudeDelta: number; 
};

const INITIAL_DELTA = 0.04;

// --- Datos Mock (ACTUALIZADOS con Rating e Image) ---
const MOCK_PARQUEOS: Parqueo[] = [
    { id: 'p1', nombre: 'Central Parking', latitud: -17.3942, longitud: -66.1578, horario: 'L-D: 8:00 - 22:00', tarifa: '5 Bs/h', disponible: true, rating: 4, imageUri: 'https://picsum.photos/seed/p1/100/80' },
    { id: 'p2', nombre: 'Parqueo El Prado (Lleno)', latitud: -17.3915, longitud: -66.1601, horario: 'L-V: 9:00 - 18:00', tarifa: '8 Bs/h', disponible: false, rating: 3, imageUri: 'https://picsum.photos/seed/p2/100/80' },
    { id: 'p4', nombre: 'Terminal Sur', latitud: -17.3990, longitud: -66.1625, horario: '24/7', tarifa: '6 Bs/h', disponible: true, rating: 5, imageUri: 'https://picsum.photos/seed/p4/100/80' },
    { id: 'p5', nombre: 'Supermercado H', latitud: -17.3955, longitud: -66.1650, horario: 'L-S: 8:00 - 21:00', tarifa: '7 Bs/h', disponible: false, rating: 2, imageUri: 'https://picsum.photos/seed/p5/100/80' },
];

// --- Componente Principal ---
export default function Mapa() {
    const mapRef = useRef<MapView | null>(null);
    const [region, setRegion] = useState<RegionState | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [selectedParking, setSelectedParking] = useState<Parqueo | null>(null);

    useEffect(() => {
        // ... Lógica de obtención de ubicación (sin cambios)
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permiso para acceder a la ubicación denegado.');
                    return;
                }
                const location = await Location.getCurrentPositionAsync({});
                setRegion({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: INITIAL_DELTA,
                    longitudeDelta: INITIAL_DELTA,
                });
            } catch {
                setErrorMsg('Error al obtener la ubicación.');
            }
        })();
    }, []);

    const handleZoom = (factor: number) => {
        if (!region) return;
        const newRegion: Region = {
            ...region,
            latitudeDelta: region.latitudeDelta * factor,
            longitudeDelta: region.longitudeDelta * factor,
        };
        mapRef.current?.animateToRegion(newRegion, 300);
        setRegion(newRegion);
    };

    const handleMarkerPress = (parqueo: Parqueo) => {
        setSelectedParking(parqueo);
        mapRef.current?.animateToRegion({
            latitude: parqueo.latitud,
            longitude: parqueo.longitud,
            latitudeDelta: region?.latitudeDelta || INITIAL_DELTA,
            longitudeDelta: region?.longitudeDelta || INITIAL_DELTA,
        }, 500);
    };

    // FUNCIÓN DE CIERRE DE POPUP (Nombre de la función sin cambios)
    const handleCloseCard = () => {
        setSelectedParking(null);
    };

    // --- Vistas de Carga/Error (sin cambios) ---
    if (errorMsg || !region) {
        if (errorMsg) {
            return (
                <View className="flex-1 items-center justify-center bg-red-50 p-4">
                    <Text className="text-lg font-bold text-red-700 text-center">{errorMsg}</Text>
                </View>
            );
        }
        return (
            <View className="flex-1 items-center justify-center bg-gray-100">
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text className="mt-2 text-base text-gray-500">Cargando mapa...</Text>
            </View>
        );
    }

    // --- Render Principal ---
    return (
        <View className="flex-1"> 
            
            <View style={StyleSheet.absoluteFillObject}> 
                <MapView
                    ref={mapRef}
                    className="flex-1" 
                    region={region}
                    showsUserLocation
                    onRegionChangeComplete={setRegion}
                    onPress={handleCloseCard} 
                >
                    {MOCK_PARQUEOS.map((parqueo) => (
                        <Marker
                            key={parqueo.id}
                            coordinate={{ latitude: parqueo.latitud, longitude: parqueo.longitud }}
                            title={parqueo.nombre}
                            pinColor={parqueo.disponible ? 'green' : 'red'}
                            onPress={() => handleMarkerPress(parqueo)}
                        />
                    ))}
                </MapView>
            </View>

            {/* CONTROLES DE ZOOM (sin cambios) */}
            <View 
                className="absolute bottom-6 right-6 z-50 flex-col space-y-3"
                style={{ elevation: 50 }} 
            >
                <TouchableOpacity onPress={() => handleZoom(0.8)} className="w-14 h-14 bg-white rounded-full items-center justify-center shadow-lg active:bg-gray-200">
                    <Feather name="plus" size={28} color="#4b5563" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleZoom(1.25)} className="w-14 h-14 bg-white rounded-full items-center justify-center shadow-lg active:bg-gray-200">
                    <Feather name="minus" size={28} color="#4b5563" />
                </TouchableOpacity>
            </View>
            
            {/* ✅ 4. RENDERIZADO CONDICIONAL DEL POPUP */}
            {selectedParking && (
                <ParkeoPopup 
                    details={selectedParking} // Le pasamos el parqueo seleccionado como 'details'
                    onClose={handleCloseCard} 
                />
            )}
        </View>
    );
}