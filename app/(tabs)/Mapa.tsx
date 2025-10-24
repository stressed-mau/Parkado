import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import MapView, { Region, Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import ParkeoPopup from '../../components/Mapa/ParkeoPopup'; 
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router'; // 🆕 Importamos para recibir parámetros

type ParqueoParaVista = { 
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

type CalificacionApi = {
    puntuacion: string;
};

type HorarioApi = {
    diaSemana: string;
    horaAbrir: string;
    horaCerrar: string;
};

type ParqueoApi = {
    id: number;
    nombre: string;
    direccion: string;
    latitud: number;
    longitud: number;
    horarios: HorarioApi[];
    calificaciones: CalificacionApi[];
};

const API_URL = 'https://parkado-backend.vercel.app/api/parqueos/details';
const INITIAL_DELTA = 0.04;

export default function Mapa() {
    // 🆕 Recibimos parámetros de navegación
    const params = useLocalSearchParams<{
        targetLat?: string;
        targetLng?: string;
        targetName?: string;
        showRoute?: string;
    }>();

    const mapRef = useRef<MapView | null>(null);
    const [region, setRegion] = useState<Region | null>(null);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [selectedParking, setSelectedParking] = useState<ParqueoParaVista | null>(null);
    const [parqueos, setParqueos] = useState<ParqueoParaVista[]>([]);
    const [isLoadingApi, setIsLoadingApi] = useState(true);
    
    const [showDirections, setShowDirections] = useState(false);
    const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);

    // useEffect para obtener la ubicación del usuario
    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permiso para acceder a la ubicación denegado.');
                    return;
                }
                const location = await Location.getCurrentPositionAsync({});
                const userCoords = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };
                setUserLocation(userCoords);
                setRegion({
                    ...userCoords,
                    latitudeDelta: INITIAL_DELTA,
                    longitudeDelta: INITIAL_DELTA,
                });
            } catch {
                setErrorMsg('Error al obtener la ubicación.');
            }
        })();
    }, []);

    // useEffect para llamar a la API y transformar los datos
    useEffect(() => {
        const fetchAndTransformParqueos = async () => {
            try {
                const response = await axios.get<ParqueoApi[]>(API_URL);
                const datosTransformados = response.data.map((p): ParqueoParaVista => {
                    const totalPuntuacion = p.calificaciones.reduce((sum, cal) => sum + parseInt(cal.puntuacion, 10), 0);
                    const ratingPromedio = p.calificaciones.length > 0 ? totalPuntuacion / p.calificaciones.length : 0;
                    
                    const primerHorario = p.horarios[0];
                    const horarioStr = primerHorario ? `${primerHorario.diaSemana}: ${new Date(primerHorario.horaAbrir).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(primerHorario.horaCerrar).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'No disponible';

                    return {
                        id: p.id.toString(),
                        nombre: p.nombre,
                        latitud: p.latitud + (Math.random() - 0.5) * 0.0001,
                        longitud: p.longitud + (Math.random() - 0.5) * 0.0001,
                        rating: parseFloat(ratingPromedio.toFixed(1)),
                        imageUri: `https://picsum.photos/seed/${p.id}/100/80`,
                        horario: horarioStr,
                        tarifa: '7 Bs/h',
                        disponible: true,
                    };
                });
                setParqueos(datosTransformados);
            } catch (error) {
                setErrorMsg("Error al conectar con el servidor de parqueos.");
                console.error(error);
            } finally {
                setIsLoadingApi(false);
            }
        };

        fetchAndTransformParqueos();
    }, []);

    // 🆕 useEffect para manejar navegación desde otra pantalla
    useEffect(() => {
        if (params.targetLat && params.targetLng && params.showRoute === 'true' && userLocation) {
            const targetLocation = {
                latitude: parseFloat(params.targetLat),
                longitude: parseFloat(params.targetLng)
            };

            // Buscar el parqueo en la lista
            const parqueo = parqueos.find(
                p => Math.abs(p.latitud - targetLocation.latitude) < 0.001 && 
                     Math.abs(p.longitud - targetLocation.longitude) < 0.001
            );

            if (parqueo) {
                setSelectedParking(parqueo);
                // Trazar ruta automáticamente
                fetchRoute(userLocation, targetLocation);
                // Ajustar vista del mapa
                mapRef.current?.fitToCoordinates(
                    [userLocation, targetLocation],
                    { edgePadding: { top: 100, right: 50, bottom: 300, left: 50 }, animated: true }
                );
            }
        }
    }, [params, userLocation, parqueos]);

    // Función para obtener ruta con OSRM (sin API Key)
    const fetchRoute = async (origin: { latitude: number; longitude: number }, destination: { latitude: number; longitude: number }) => {
        setIsLoadingRoute(true);
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
            const response = await axios.get(url);
            const coordinates = response.data.routes[0].geometry.coordinates.map((coord: number[]) => ({
                latitude: coord[1],
                longitude: coord[0]
            }));
            setRouteCoordinates(coordinates);
            setShowDirections(true);
        } catch (error: any) {
            console.error('Error obteniendo ruta:', error.response?.data || error.message);
            Alert.alert('Error', 'No se pudo trazar la ruta. Verifica tu conexión.');
            setShowDirections(false);
        } finally {
            setIsLoadingRoute(false);
        }
    };

    const handleZoom = (factor: number) => {
        if (!region) return;
        const newRegion: Region = {
            ...region,
            latitudeDelta: region.latitudeDelta * factor,
            longitudeDelta: region.longitudeDelta * factor,
        };
        mapRef.current?.animateToRegion(newRegion, 300);
    };

    const handleMarkerPress = (parqueo: ParqueoParaVista) => {
        setSelectedParking(parqueo);
        setShowDirections(false);
        setRouteCoordinates([]);
        mapRef.current?.animateToRegion({
            latitude: parqueo.latitud,
            longitude: parqueo.longitud,
            latitudeDelta: region?.latitudeDelta || INITIAL_DELTA,
            longitudeDelta: region?.longitudeDelta || INITIAL_DELTA,
        }, 500);
    };

    const handleCloseCard = () => {
        setSelectedParking(null);
        setShowDirections(false);
        setRouteCoordinates([]);
    };

    const handleShowDirections = () => {
        if (selectedParking && userLocation) {
            fetchRoute(userLocation, { 
                latitude: selectedParking.latitud, 
                longitude: selectedParking.longitud 
            });
            
            mapRef.current?.fitToCoordinates(
                [userLocation, { latitude: selectedParking.latitud, longitude: selectedParking.longitud }],
                { edgePadding: { top: 100, right: 50, bottom: 300, left: 50 }, animated: true }
            );
        }
    };

    if (errorMsg) {
        return (
            <View className="flex-1 items-center justify-center bg-red-50 p-4">
                <Text className="text-lg font-bold text-red-700 text-center">{errorMsg}</Text>
            </View>
        );
    }

    if (!region || isLoadingApi) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-100">
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text className="mt-2 text-base text-gray-500">Cargando mapa y parqueos...</Text>
            </View>
        );
    }

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
                    {parqueos.map((parqueo) => (
                        <Marker
                            key={parqueo.id}
                            coordinate={{ latitude: parqueo.latitud, longitude: parqueo.longitud }}
                            title={parqueo.nombre}
                            pinColor={parqueo.disponible ? 'green' : 'red'}
                            onPress={() => handleMarkerPress(parqueo)}
                        />
                    ))}

                    {showDirections && routeCoordinates.length > 0 && (
                        <Polyline
                            coordinates={routeCoordinates}
                            strokeWidth={4}
                            strokeColor="#4F46E5"
                        />
                    )}
                </MapView>
            </View>

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
            
            {selectedParking && (
                <ParkeoPopup 
                    details={selectedParking}
                    onClose={handleCloseCard}
                    onShowDirections={handleShowDirections}
                    showingDirections={showDirections || isLoadingRoute}
                />
            )}

            {isLoadingRoute && (
                <View className="absolute top-20 self-center bg-white px-4 py-2 rounded-full shadow-lg flex-row items-center">
                    <ActivityIndicator size="small" color="#4F46E5" />
                    <Text className="text-sm text-gray-600 ml-2">Calculando ruta...</Text>
                </View>
            )}
        </View>
    );
}
