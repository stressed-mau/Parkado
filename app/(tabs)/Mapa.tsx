import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
// CAMBIO: Importamos 'Region' directamente para evitar duplicados
import MapView, { Region, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import ParkeoPopup from '../../components/Mapa/ParkeoPopup'; 
import axios from 'axios';

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

// --- Componente Principal ---
export default function Mapa() {
    const mapRef = useRef<MapView | null>(null);
    const [region, setRegion] = useState<Region | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [selectedParking, setSelectedParking] = useState<ParqueoParaVista | null>(null);
    const [parqueos, setParqueos] = useState<ParqueoParaVista[]>([]);
    const [isLoadingApi, setIsLoadingApi] = useState(true);

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

    // useEffect para llamar a la API y transformar los datos
    useEffect(() => {
        const fetchAndTransformParqueos = async () => {
            try {
                const response = await axios.get<ParqueoApi[]>(API_URL);
                const datosTransformados = response.data.map((p): ParqueoParaVista => {
                    // Lógica para calcular rating promedio
                    const totalPuntuacion = p.calificaciones.reduce((sum, cal) => sum + parseInt(cal.puntuacion, 10), 0);
                    const ratingPromedio = p.calificaciones.length > 0 ? totalPuntuacion / p.calificaciones.length : 0;
                    
                    // Lógica para formatear un horario simple
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
                        tarifa: '7 Bs/h', // Valor por defecto
                        disponible: true, // Asumimos que están disponibles
                    };
                });
                setParqueos(datosTransformados);
            } catch (error) {
                // Si la API falla, actualizamos el mensaje de error
                setErrorMsg("Error al conectar con el servidor de parqueos.");
                console.error(error);
            } finally {
                // Avisamos que la carga de la API terminó
                setIsLoadingApi(false);
            }
        };

        fetchAndTransformParqueos();
    }, []); // El array vacío asegura que se llame solo una vez

    // --- Funciones de Interacción ---
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
        mapRef.current?.animateToRegion({
            latitude: parqueo.latitud,
            longitude: parqueo.longitud,
            latitudeDelta: region?.latitudeDelta || INITIAL_DELTA,
            longitudeDelta: region?.longitudeDelta || INITIAL_DELTA,
        }, 500);
    };

    const handleCloseCard = () => {
        setSelectedParking(null);
    };

    // --- Vistas de Carga y Error ---
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
                    {parqueos.map((parqueo) => (
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

            {/* Controles de Zoom */}
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
            
            {/* Popup de Información del Parqueo */}
            {selectedParking && (
                <ParkeoPopup 
                    details={selectedParking}
                    onClose={handleCloseCard} 
                />
            )}
        </View>
    );
}