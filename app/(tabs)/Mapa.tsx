// Archivo: app/(tabs)/Mapa.tsx (Versión Final CORREGIDA con OSRM y Flujo de Pago)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Image, Platform } from 'react-native'; // Añadimos Platform
import MapView, { Region, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'; // Añadimos useRouter por si acaso
import ParkeoPopup from '../../components/Mapa/ParkeoPopup';
import axios from 'axios';

// --- TIPOS ---
type ParqueoParaVista = {
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
type Coords = { latitude: number; longitude: number; };

// --- CONSTANTES ---
const API_URL = 'https://parkado-backend.vercel.app/api/parqueos/details';
const INITIAL_DELTA = 0.04;
const OSRM_API_URL = 'http://router.project-osrm.org/route/v1/driving/';
const COCHABAMBA_REGION = { latitude: -17.3936, longitude: -66.1569, latitudeDelta: INITIAL_DELTA, longitudeDelta: INITIAL_DELTA };
const MARKER_DISPONIBLE = 'https://i.ibb.co/GfhsxmpT/parkeo-disponible.png';
const MARKER_LLENO = 'https://i.ibb.co/bj78fXYD/parkeo-lleno.png';

// --- Componente Principal ---
export default function Mapa() {
    const params = useLocalSearchParams<{ destLat?: string; destLng?: string; destNombre?: string; }>();
    const router = useRouter(); // Añadimos router por si necesitamos navegar en errores
    const mapRef = useRef<MapView | null>(null);

    // --- Estados ---
    const [region, setRegion] = useState<Region | null>(COCHABAMBA_REGION);
    const [userLocation, setUserLocation] = useState<Coords | null>(null); // Tu ubicación
    const [errorMsg, setErrorMsg] = useState<string | null>(null); // Errores generales
    const [selectedParking, setSelectedParking] = useState<ParqueoParaVista | null>(null); // Popup
    const [parqueos, setParqueos] = useState<ParqueoParaVista[]>([]); // Lista de parqueos
    const [isLoadingApi, setIsLoadingApi] = useState(true); // Carga API parqueos
    const [isLocationLoading, setIsLocationLoading] = useState(true); // Carga ubicación inicial
    // Ruta
    const [destination, setDestination] = useState<Coords | null>(null); // Destino de la ruta
    const [destinationName, setDestinationName] = useState<string | null>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<Coords[]>([]);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false); // Carga OSRM

    // ------------------------------------
    // EFECTO 1: Permisos y Ubicación Inicial
    // ------------------------------------
    useEffect(() => {
        let isMounted = true;
        (async () => {
            setIsLocationLoading(true);
            setErrorMsg(null);
            console.log("MAPA (Efecto 1): Verificando permisos...");
            try {
                let { status } = await Location.getForegroundPermissionsAsync();
                if (status !== 'granted') status = (await Location.requestForegroundPermissionsAsync()).status;
                if (status !== 'granted') {
                    if (isMounted) setErrorMsg('Permiso de ubicación denegado.');
                    console.error("MAPA (Efecto 1): Permiso denegado.");
                    return;
                }
                console.log("MAPA (Efecto 1): Obteniendo ubicación...");
                const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                const coords: Coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
                if (isMounted) {
                    console.log("MAPA (Efecto 1): Ubicación obtenida:", coords);
                    setUserLocation(coords);
                    // Solo centrar si el mapa no se ha movido
                    if (mapRef.current && region?.latitude === COCHABAMBA_REGION.latitude) {
                       console.log("MAPA (Efecto 1): Centrando mapa en ubicación inicial.");
                       setRegion({ ...coords, latitudeDelta: INITIAL_DELTA, longitudeDelta: INITIAL_DELTA });
                    //    mapRef.current.animateToRegion({ ...coords, latitudeDelta: INITIAL_DELTA, longitudeDelta: INITIAL_DELTA }, 500);
                    }
                }
            } catch (error: any) {
                console.error("MAPA (Efecto 1): Error:", error.message);
                if (isMounted) setErrorMsg('Error al obtener la ubicación.');
            } finally {
                 if (isMounted) setIsLocationLoading(false);
            }
        })();
        return () => { isMounted = false };
    }, []); // Solo al montar

    // ------------------------------------
    // EFECTO 2: Cargar Parqueos (con validación)
    // ------------------------------------
    useEffect(() => {
         let isMounted = true;
         const fetchAndTransformParqueos = async () => { /* ... (igual que antes, ya validaba coords) ... */
             setIsLoadingApi(true);
             console.log("MAPA (Efecto 2): Cargando parqueos...");
             try {
                const response = await axios.get<any[]>(API_URL);
                const datosTransformados = response.data
                    .map((p): ParqueoParaVista | null => {
                        let latitud: number | undefined; let longitud: number | undefined;
                        if (typeof p.latitud === 'number' && typeof p.longitud === 'number') {
                            latitud = p.latitud; longitud = p.longitud;
                        } else if (p.plazas?.[0] && typeof p.plazas[0].latitud === 'number' && typeof p.plazas[0].longitud === 'number') {
                            latitud = p.plazas[0].latitud; longitud = p.plazas[0].longitud;
                        }
                        if (typeof latitud !== 'number' || typeof longitud !== 'number') return null; // Descartar

                        const totalPuntuacion = (p.calificaciones || []).reduce((sum: number, cal: any) => sum + parseInt(cal.puntuacion || '0', 10), 0);
                        const ratingPromedio = (p.calificaciones || []).length > 0 ? totalPuntuacion / p.calificaciones.length : 0;
                        const primerHorario = (p.horarios || [])[0];
                        let horarioStr = 'No disponible';
                         if (primerHorario?.horaAbrir && primerHorario?.horaCerrar) {
                             try { horarioStr = `${primerHorario.diaSemana}: ${new Date(primerHorario.horaAbrir).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(primerHorario.horaCerrar).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`; } catch (e) {}
                        }
                        const capacidadTotal = (p.capacidades || []).reduce((sum: number, c: any) => sum + (c.cantidad || 0), 0);
                        const disponible = capacidadTotal > 0;

                        return { id: String(p.id), nombre: p.nombre || '?', latitud, longitud, rating: parseFloat(ratingPromedio.toFixed(1)), imageUri: p.imagen_url || `https://picsum.photos/seed/${p.id}/100/80`, horario: horarioStr, tarifa: '7 Bs/h', disponible };
                    })
                    .filter((p): p is ParqueoParaVista => p !== null);

                if (isMounted) {
                    setParqueos(datosTransformados);
                    console.log(`MAPA (Efecto 2): ${datosTransformados.length} parqueos VÁLIDOS cargados.`);
                }
            } catch (error: any) {
                console.error("MAPA (Efecto 2): Error:", error.message);
                if (isMounted) setErrorMsg("Error al conectar con el servidor.");
            } finally {
                if (isMounted) setIsLoadingApi(false);
            }
        };
        fetchAndTransformParqueos();
        return () => { isMounted = false };
    }, []);

    // ------------------------------------
// EFECTO 3: Manejar Ruta (OSRM) - CORREGIDO PARA ESPERAR userLocation
// ------------------------------------
useEffect(() => {
    const { destLat, destLng, destNombre } = params;

    // Solo intenta trazar ruta si tenemos TODO (parámetros y userLocation)
    if (destLat && destLng && destNombre && userLocation) {
        const destCoords: Coords = { latitude: parseFloat(destLat), longitude: parseFloat(destLng) };

        // Si ya se mostró destino evita recomputar
        if (destination?.latitude === destCoords.latitude && destination?.longitude === destCoords.longitude) {
            params.destLat = undefined; params.destLng = undefined; params.destNombre = undefined;
            return;
        }

        setDestination(destCoords);
        setDestinationName(destNombre);
        setSelectedParking(null);
        setRouteCoordinates([]);
        params.destLat = undefined; params.destLng = undefined; params.destNombre = undefined;

        const fetchRouteOSRM = async () => {
            setIsLoadingRoute(true);
            try {
                const url = `${OSRM_API_URL}${userLocation.longitude},${userLocation.latitude};${destCoords.longitude},${destCoords.latitude}?overview=full&geometries=geojson`;
                const response = await axios.get(url);
                const route = response.data.routes[0];
                if (route?.geometry?.coordinates) {
                    const newRouteCoords: Coords[] = route.geometry.coordinates.map((coord: number[]) => ({ latitude: coord[1], longitude: coord[0] }));
                    setRouteCoordinates(newRouteCoords);
                    if (mapRef.current) {
                        mapRef.current.fitToCoordinates([userLocation, destCoords], { edgePadding: { top: 150, right: 50, bottom: 80, left: 50 }, animated: true });
                    }
                } else {
                    Alert.alert("Ruta no disponible", `No se encontró ruta para ${destNombre}.`);
                }
            } catch (error: any) {
                console.error("MAPA (fetchRouteOSRM): Error:", error.message);
                Alert.alert("Error de Ruteo", "No se pudo calcular la ruta (OSRM).");
            } finally {
                setIsLoadingRoute(false);
            }
        };

        fetchRouteOSRM();
    }
    // Si faltan coords, no hace nada
}, [params.destLat, params.destLng, params.destNombre, userLocation]);

    // --- Funciones de Interacción ---
    const handleZoom = (factor: number) => { /* ... (igual) ... */
         if (!region) return;
         const newRegion: Region = { ...region, latitudeDelta: region.latitudeDelta * factor, longitudeDelta: region.longitudeDelta * factor };
         mapRef.current?.animateToRegion(newRegion, 300);
    };
    const handleMarkerPress = (parqueo: ParqueoParaVista) => { /* ... (igual) ... */
        if (destination) return;
        setSelectedParking(parqueo);
        if (region && mapRef.current) {
            mapRef.current.animateToRegion({ latitude: parqueo.latitud, longitude: parqueo.longitud, latitudeDelta: region.latitudeDelta, longitudeDelta: region.longitudeDelta }, 500);
        }
    };
    const handleClearSelection = () => { /* ... (igual) ... */
         console.log("MAPA: Limpiando selección/ruta.");
         setSelectedParking(null);
         setDestination(null);
         setDestinationName(null);
         setRouteCoordinates([]);
         if (userLocation && mapRef.current && region) {
              mapRef.current.animateToRegion({ ...userLocation, latitudeDelta: INITIAL_DELTA, longitudeDelta: INITIAL_DELTA }, 300);
         }
    };

    // --- Vistas de Carga y Error ---
     if (errorMsg && !isLoadingApi && !isLocationLoading) { /* ... (igual) ... */
         return (<View className="flex-1 items-center justify-center bg-red-100 p-4"><Feather name="alert-triangle" size={40} color="#b91c1c" /><Text className="text-lg font-bold text-red-800 text-center mt-4">{errorMsg}</Text></View>);
     }
     if (isLocationLoading || isLoadingApi || !region) { /* ... (igual) ... */
          let loadingText = "Cargando mapa...";
         if (isLocationLoading || !userLocation) loadingText = "Obteniendo tu ubicación...";
         else if (isLoadingApi) loadingText = "Cargando parqueos cercanos...";
         return (<View className="flex-1 items-center justify-center bg-gray-50"><ActivityIndicator size="large" color="#4F46E5" /><Text className="mt-3 text-base text-gray-500">{loadingText}</Text></View>);
     }

    // --- Render Principal ---
    return (
        <View className="flex-1">
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={StyleSheet.absoluteFillObject}
                initialRegion={region}
                showsUserLocation={true}
                showsMyLocationButton={false} // Quitamos botón nativo
                onRegionChangeComplete={setRegion} // Actualiza zoom/centro
                onPress={handleClearSelection} // Limpia al tocar fondo
                // mapPadding={{ bottom: Platform.select({ ios: selectedParking ? 180 : (destination ? 90 : 30), android: selectedParking ? 160 : (destination ? 90 : 30) }) }} // Ajustar padding dinámico
            >
                {/* Marcadores Parqueos */}
                {parqueos.map((parqueo) => (
                    <Marker
                        key={`parqueo-${parqueo.id}`}
                        coordinate={{ latitude: parqueo.latitud, longitude: parqueo.longitud }}
                        title={parqueo.nombre}
                        onPress={destination ? undefined : () => handleMarkerPress(parqueo)} // Desactivar onPress si hay ruta
                        opacity={(destination && (destination.latitude !== parqueo.latitud || destination.longitude !== parqueo.longitud)) ? 0.5 : 1.0} // Atenuar otros
                        zIndex={0} // Por defecto
                    >
                        <Image source={{ uri: parqueo.disponible ? MARKER_DISPONIBLE : MARKER_LLENO }} style={{ width: 35, height: 35 }} resizeMode="contain" />
                    </Marker>
                ))}

                {/* Ruta */}
                {routeCoordinates.length > 0 && (
                    <Polyline coordinates={routeCoordinates} strokeWidth={5} strokeColor="#3b82f6" lineCap="round" zIndex={1} />
                )}

                 {/* Marcador Destino */}
                 {destination && (
                    <Marker coordinate={destination} title={destinationName || "Destino"} pinColor="blue" zIndex={2} />
                 )}
            </MapView>

             {/* Indicador Carga RUTA */}
            {isLoadingRoute && (
                <View className="absolute top-16 self-center bg-white/90 p-3 rounded-lg shadow-md flex-row items-center z-20 elevation-4">
                     <ActivityIndicator size="small" color="#3b82f6" />
                     <Text className="text-blue-600 text-sm ml-2 font-medium">Calculando ruta...</Text>
                </View>
            )}

            {/* Controles Zoom */}
            <View className="absolute bottom-24 right-5 z-10 flex-col gap-3">
                <TouchableOpacity onPress={() => handleZoom(0.7)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg active:bg-gray-200 elevation-5">
                    <Feather name="plus" size={24} color="#4b5563" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleZoom(1.4)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg active:bg-gray-200 elevation-5">
                    <Feather name="minus" size={24} color="#4b5563" />
                </TouchableOpacity>
            </View>

            {/* Botón LIMPIAR RUTA */}
            {destination && (
                <TouchableOpacity onPress={handleClearSelection} className="absolute bottom-5 left-5 z-10 bg-red-600 px-4 py-3 rounded-xl shadow-lg active:bg-red-700 flex-row items-center gap-1 elevation-5">
                    <Feather name="x-circle" size={16} color="white"/>
                    <Text className="text-white font-bold text-sm">Limpiar Ruta</Text>
                </TouchableOpacity>
            )}

            {/* Popup Info */}
            {selectedParking && !destination && (
                <ParkeoPopup details={selectedParking} onClose={handleClearSelection} />
            )}
        </View>
    );
}

// Estilos Nativos (solo si es necesario, como para elevation en Android)
 