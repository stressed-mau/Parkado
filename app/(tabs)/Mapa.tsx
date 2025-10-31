// Archivo: app/(tabs)/Mapa.tsx (CORREGIDO - MANEJO COMPLETO DE ERRORES)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Image, Platform } from 'react-native';
import MapView, { Region, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import ParkeoPopup from '../../components/Mapa/ParkeoPopup';
import axios from 'axios';

// --- TIPOS ---
// En Mapa.tsx - Actualizar el tipo
type ParqueoParaVista = {
    id: number;  // ✅ Cambiar a number
    nombre: string;
    direccion: string;
    tipoLugar: string;
    propietarioId: number;
    latitud: number;
    longitud: number;
    horarios: any[];
    calificaciones: any[];
    capacidades: any[];
    servicios: any[];
    plazas: any[];
    tarifas: any[];
    fotos: any[];
    descripcion?: string;
    // Para compatibilidad
    rating: number;
    disponible: boolean;
};
type Coords = { latitude: number; longitude: number; };

// --- CONSTANTES ---
const API_URL = 'https://parkado-backend.vercel.app/api/parqueos/details';
const INITIAL_DELTA = 0.04;
const COCHABAMBA_REGION = { 
    latitude: -17.3936, 
    longitude: -66.1569, 
    latitudeDelta: INITIAL_DELTA, 
    longitudeDelta: INITIAL_DELTA 
};
const MARKER_DISPONIBLE = 'https://i.ibb.co/GfhsxmpT/parkeo-disponible.png';
const MARKER_LLENO = 'https://i.ibb.co/bj78fXYD/parkeo-lleno.png';

// --- Componente Principal ---
export default function Mapa() {
    const params = useLocalSearchParams<{ destLat?: string; destLng?: string; destNombre?: string; }>();
    const router = useRouter();
    const mapRef = useRef<MapView | null>(null);

    // --- Estados ---
    const [region, setRegion] = useState<Region | null>(COCHABAMBA_REGION);
    const [userLocation, setUserLocation] = useState<Coords | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [selectedParking, setSelectedParking] = useState<ParqueoParaVista | null>(null);
    const [parqueos, setParqueos] = useState<ParqueoParaVista[]>([]);
    const [isLoadingApi, setIsLoadingApi] = useState(true);
    const [isLocationLoading, setIsLocationLoading] = useState(true);
    // Ruta
    const [destination, setDestination] = useState<Coords | null>(null);
    const [destinationName, setDestinationName] = useState<string | null>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<Coords[]>([]);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [showDirections, setShowDirections] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    // ------------------------------------
    // EFECTO 1: Permisos y Ubicación Inicial (MEJORADO)
    // ------------------------------------
    useEffect(() => {
        let isMounted = true;
        
        (async () => {
            setIsLocationLoading(true); 
            setErrorMsg(null); 
            console.log("MAPA (E1): Iniciando obtención de ubicación...");
            
            try {
                // 1. Verificar si los servicios de ubicación están habilitados
                const servicesEnabled = await Location.hasServicesEnabledAsync();
                console.log("MAPA (E1): Servicios de ubicación habilitados:", servicesEnabled);
                
                if (!servicesEnabled) {
                    console.log("MAPA (E1): Servicios de ubicación DESACTIVADOS");
                    if (isMounted) {
                        setErrorMsg('Los servicios de ubicación están desactivados. Actívalos en ajustes del dispositivo.');
                    }
                    return;
                }

                // 2. Solicitar permisos
                let { status } = await Location.getForegroundPermissionsAsync();
                console.log("MAPA (E1): Estado inicial de permisos:", status);
                
                if (status !== 'granted') {
                    console.log("MAPA (E1): Solicitando permisos...");
                    const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
                    status = newStatus;
                    console.log("MAPA (E1): Nuevo estado de permisos:", status);
                }
                
                if (status !== 'granted') { 
                    console.log("MAPA (E1): Permisos DENEGADOS");
                    if (isMounted) {
                        setErrorMsg('Permiso de ubicación denegado. Actívalo en ajustes de la app.');
                    }
                    return; 
                }

                // 3. Obtener ubicación
                console.log("MAPA (E1): Obteniendo ubicación actual...");
                const location = await Location.getCurrentPositionAsync({ 
                    accuracy: Location.Accuracy.Balanced,
                    timeout: 10000
                });

                const coords: Coords = { 
                    latitude: location.coords.latitude, 
                    longitude: location.coords.longitude 
                };
                
                if (isMounted) {
                    console.log("MAPA (E1): Ubicación obtenida exitosamente:", coords);
                    setUserLocation(coords);
                    setErrorMsg(null);
                    
                    // Centrar mapa en ubicación actual
                    if (mapRef.current) {
                        console.log("MAPA (E1): Centrando mapa en ubicación actual.");
                        const newRegion = { 
                            ...coords, 
                            latitudeDelta: INITIAL_DELTA, 
                            longitudeDelta: INITIAL_DELTA 
                        };
                        setRegion(newRegion);
                    }
                }
                
            } catch (error: any) { 
                console.error("MAPA (E1): Error obteniendo ubicación:", error.message, error.code); 
                if (isMounted) {
                    let errorMessage = 'No se pudo obtener la ubicación inicial. ';
                    
                    if (error.code === 'CANCELLED') {
                        errorMessage += 'La solicitud fue cancelada.';
                    } else if (error.code === 'UNAVAILABLE') {
                        errorMessage += 'Servicio de ubicación no disponible.';
                    } else if (error.code === 'TIMEOUT') {
                        errorMessage += 'Tiempo de espera agotado.';
                    } else {
                        errorMessage += 'Verifica tu conexión y servicios de ubicación.';
                    }
                    
                    setErrorMsg(errorMessage);
                    console.log("MAPA (E1): Error establecido:", errorMessage);
                }
            } finally { 
                if (isMounted) {
                    setIsLocationLoading(false);
                    console.log("MAPA (E1): Carga de ubicación completada");
                }
            }
        })();
        
        return () => { isMounted = false };
    }, []);

    // ------------------------------------
    // EFECTO 2: Cargar Parqueos
    // ------------------------------------
    useEffect(() => {
         let isMounted = true;
         const fetchAndTransformParqueos = async () => {
             setIsLoadingApi(true); 
             console.log("MAPA (E2): Cargando parqueos...");
             try {
                 const response = await axios.get<any[]>(API_URL);
                 const datosTransformados = response.data.map((p): ParqueoParaVista | null => {
                     let lat: number|undefined, lon: number|undefined;
                     if(typeof p.latitud==='number'&&typeof p.longitud==='number'){
                         lat=p.latitud;
                         lon=p.longitud;
                     }
                     else if(p.plazas?.[0]?.latitud && p.plazas?.[0]?.longitud){
                         lat=p.plazas[0].latitud;
                         lon=p.plazas[0].longitud;
                     }
                     if(typeof lat!=='number'||typeof lon!=='number') return null;
                     
                     const rAvg=(p.calificaciones||[]).length>0?
                         (p.calificaciones.reduce((s:number,c:any)=>s+parseInt(c.puntuacion||'0'),0)/p.calificaciones.length):0;
                     
                     const h1=(p.horarios||[])[0]; 
                     let hStr='No disp.';
                     if(h1?.horaAbrir&&h1?.horaCerrar){
                         try{
                             hStr=`${h1.diaSemana}: ${new Date(h1.horaAbrir).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} - ${new Date(h1.horaCerrar).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`
                         }catch(e){}
                     }
                     
                     const disp=(p.capacidades||[]).reduce((s:number,c:any)=>s+(c.cantidad||0),0)>0;
                     
                     // ✅ NUEVA TRANSFORMACIÓN (datos completos)
return {
    id: p.id,  // ✅ Mantener como number
    nombre: p.nombre || '?',
    direccion: p.direccion || 'Dirección no disponible',
    tipoLugar: p.tipoLugar || 'Estacionamiento',
    propietarioId: p.propietarioId || 0,
    latitud: lat,
    longitud: lon,
    // ✅ ENVIAR ARRAYS COMPLETOS
    horarios: p.horarios || [],
    calificaciones: p.calificaciones || [],
    capacidades: p.capacidades || [],
    servicios: p.servicios || [],
    plazas: p.plazas || [],
    tarifas: p.tarifas || [],
    fotos: p.fotos || [],
    descripcion: p.descripcion,
    // Campos adicionales para compatibilidad
    rating: parseFloat(rAvg.toFixed(1)),
    disponible: disp
};
                 }).filter((p): p is ParqueoParaVista => p !== null);
                 
                 if(isMounted){
                     setParqueos(datosTransformados); 
                     console.log(`MAPA (E2): ${datosTransformados.length} parqueos válidos cargados.`);
                 }
             } catch(e:any){
                 console.error("MAPA (E2): Error cargando parqueos:", e.message); 
                 if(isMounted) setErrorMsg("Error cargando parqueos. Revisa tu conexión.");
             }
             finally {
                 if(isMounted) setIsLoadingApi(false);
             }
         };
         
         fetchAndTransformParqueos();
         return ()=>{isMounted=false};
     }, []);

     // ------------------------------------
     // EFECTO 3: Detectar parámetros de ruta
     // ------------------------------------
     useEffect(() => {
        const { destLat, destLng, destNombre } = params;

        console.log("MAPA (E3): Params recibidos:", params);

        if (destLat && destLng && destNombre && userLocation) {
            console.log("MAPA (E3): Procesando ruta desde params...");
            const targetLocation = { 
                latitude: parseFloat(destLat), 
                longitude: parseFloat(destLng) 
            };

            // Verificar si ya estamos mostrando esta misma ruta
            if (destination?.latitude === targetLocation.latitude && 
                destination?.longitude === targetLocation.longitude) {
                console.log("MAPA (E3): Ya mostrando esta ruta, ignorando.");
                return;
            }

            setDestination(targetLocation);
            setDestinationName(destNombre || "Destino");
            setSelectedParking(null);
            setRouteCoordinates([]);
            
            // Limpiar params usando el router
            console.log("MAPA (E3): Limpiando params de URL...");
            router.setParams({ 
                destLat: undefined, 
                destLng: undefined, 
                destNombre: undefined 
            });

            console.log("MAPA (E3): Llamando a fetchRoute...");
            fetchRoute(userLocation, targetLocation, destNombre);

        } else {
            console.log("MAPA (E3): No hay destino o ubicación disponible.");
        }
    }, [params, userLocation]);

    // --- Función Fetch Route con useCallback ---
    const fetchRoute = useCallback(async (origin: Coords, destinationCoords: Coords, destNombre?: string) => {
        console.log("MAPA (fetchRoute): Calculando ruta OSRM...");
        setIsLoadingRoute(true);
        setRouteCoordinates([]);
        
        try {
            // Validación interna
            if (!origin?.latitude || !destinationCoords?.latitude) {
                throw new Error("Coordenadas de origen o destino inválidas para fetchRoute.");
            }
            
            const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?overview=full&geometries=geojson`;
            const response = await axios.get(url);
            
            if (response.data.routes && response.data.routes.length > 0) {
                const coordinates = response.data.routes[0].geometry.coordinates.map((coord: number[]) => ({
                    latitude: coord[1],
                    longitude: coord[0]
                }));
                
                setRouteCoordinates(coordinates);
                setShowDirections(true);
                console.log(`MAPA (fetchRoute): Ruta obtenida (${coordinates.length} puntos).`);
                
                if (mapRef.current) {
                    console.log("MAPA (fetchRoute): Ajustando mapa a la ruta.");
                    mapRef.current.fitToCoordinates([origin, destinationCoords], { 
                        edgePadding: { top: 100, right: 50, bottom: 100, left: 50 }, 
                        animated: true 
                    });
                }
            } else {
                throw new Error('No se encontró ruta disponible');
            }
            
        } catch (error: any) {
            console.error('MAPA (fetchRoute): Error obteniendo ruta:', error.response?.data || error.message);
            Alert.alert('Error', `No se pudo trazar la ruta${destNombre ? ` a ${destNombre}` : ''}.`);
            setShowDirections(false);
        } finally {
            setIsLoadingRoute(false);
        }
    }, []);

    // --- Función para centrar en mi ubicación (COMPLETAMENTE CORREGIDA) ---
    const handleCenterOnUser = useCallback(async () => {
        console.log("MAPA: Intentando centrar en ubicación actual...");
        setIsLocating(true);
        setErrorMsg(null); // Limpiar errores previos
        
        try {
            // 1. Verificar servicios de ubicación
            console.log("MAPA: Verificando servicios de ubicación...");
            const servicesEnabled = await Location.hasServicesEnabledAsync();
            console.log("MAPA: Servicios de ubicación habilitados:", servicesEnabled);
            
            if (!servicesEnabled) {
                console.log("MAPA: Servicios de ubicación DESACTIVADOS - mostrando alerta");
                Alert.alert(
                    'Ubicación desactivada',
                    'Los servicios de ubicación están desactivados. Por favor, actívalos en la configuración de tu dispositivo.',
                    [
                        { text: 'OK' },
                        { 
                            text: 'Abrir Configuración', 
                            onPress: async () => {
                                try {
                                    await Location.enableNetworkProviderAsync();
                                } catch (error) {
                                    console.error("Error abriendo configuración:", error);
                                }
                            } 
                        }
                    ]
                );
                return;
            }

            // 2. Verificar y solicitar permisos
            console.log("MAPA: Verificando permisos...");
            let { status } = await Location.getForegroundPermissionsAsync();
            console.log("MAPA: Estado de permisos actual:", status);
            
            if (status !== 'granted') {
                console.log("MAPA: Solicitando permisos...");
                const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
                status = newStatus;
                console.log("MAPA: Nuevo estado de permisos:", status);
            }
            
            if (status !== 'granted') {
                console.log("MAPA: Permisos DENEGADOS");
                Alert.alert(
                    'Permiso requerido',
                    'Se necesita permiso de ubicación para centrar el mapa en tu ubicación actual.',
                    [{ text: 'OK' }]
                );
                return;
            }

            // 3. Obtener ubicación actual
            console.log("MAPA: Obteniendo ubicación actual...");
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeout: 10000, // 10 segundos timeout
                maximumAge: 30000 // Usar ubicación cacheada de hasta 30 segundos
            });
            
            const newCoords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            };
            
            console.log("MAPA: Ubicación obtenida exitosamente:", newCoords);
            
            // Actualizar ubicación del usuario
            setUserLocation(newCoords);
            setErrorMsg(null); // Limpiar cualquier error previo
            
            // Centrar el mapa en la ubicación
            if (mapRef.current) {
                console.log("MAPA: Centrando mapa en ubicación actual...");
                mapRef.current.animateToRegion({
                    ...newCoords,
                    latitudeDelta: INITIAL_DELTA,
                    longitudeDelta: INITIAL_DELTA
                }, 1000);
            }
            
            console.log("MAPA: Centrado completado exitosamente");
            
        } catch (error: any) {
            console.error("MAPA: Error crítico obteniendo ubicación:", error.message, error.code);
            
            // Manejo específico de errores
            let errorMessage = "No se pudo obtener tu ubicación actual. ";
            let showAlert = true;
            
            if (error.code === 'CANCELLED') {
                errorMessage += "La solicitud fue cancelada.";
            } else if (error.code === 'UNAVAILABLE') {
                errorMessage += "Los servicios de ubicación no están disponibles. Verifica que la ubicación esté activada en tu dispositivo.";
            } else if (error.code === 'TIMEOUT') {
                errorMessage += "El tiempo de espera se agotó. Intenta nuevamente.";
            } else if (error.message?.includes('Location services are disabled')) {
                errorMessage = "Los servicios de ubicación están desactivados. Actívalos en ajustes del dispositivo.";
            } else {
                errorMessage += "Verifica tu conexión y configuración de ubicación.";
            }
            
            console.log("MAPA: Estableciendo mensaje de error:", errorMessage);
            setErrorMsg(errorMessage);
            
            if (showAlert) {
                Alert.alert("Error de ubicación", errorMessage);
            }
            
            // Fallback: usar última ubicación conocida si existe
            if (userLocation && mapRef.current) {
                console.log("MAPA: Usando última ubicación conocida como fallback");
                mapRef.current.animateToRegion({
                    ...userLocation,
                    latitudeDelta: INITIAL_DELTA,
                    longitudeDelta: INITIAL_DELTA
                }, 1000);
            } else {
                // Fallback final: usar región por defecto
                console.log("MAPA: Usando región por defecto como fallback final");
                if (mapRef.current) {
                    mapRef.current.animateToRegion(COCHABAMBA_REGION, 1000);
                }
            }
        } finally {
            setIsLocating(false);
            console.log("MAPA: Proceso de ubicación finalizado");
        }
    }, [userLocation]);

    // --- Funciones Interacción ---
    const handleZoom = useCallback((factor: number) => {
        if (!region) return;
        const newR: Region = {
            ...region, 
            latitudeDelta: region.latitudeDelta * factor, 
            longitudeDelta: region.longitudeDelta * factor
        };
        mapRef.current?.animateToRegion(newR, 300);
    }, [region]);

    const handleMarkerPress = useCallback((parqueo: ParqueoParaVista) => {
        setSelectedParking(parqueo);
        setShowDirections(false);
        setRouteCoordinates([]);
        if (region && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: parqueo.latitud,
                longitude: parqueo.longitud,
                latitudeDelta: region.latitudeDelta,
                longitudeDelta: region.longitudeDelta
            }, 500);
        }
    }, [region]);
    
    const handleClearSelection = useCallback(() => {
        console.log("MAPA: Limpiando selección y ruta...");
        setSelectedParking(null);
        setDestination(null);
        setDestinationName(null);
        setRouteCoordinates([]);
        setShowDirections(false);
        setIsLoadingRoute(false);

        // Limpiar parámetros de URL si existen
        if (params.destLat || params.destLng || params.destNombre) {
            console.log("MAPA: Limpiando params de URL...");
            router.setParams({
                destLat: undefined,
                destLng: undefined,
                destNombre: undefined,
            });
        }

        // Centrar en usuario si está disponible
        if (userLocation && mapRef.current) {
            mapRef.current.animateToRegion({ 
                ...userLocation, 
                latitudeDelta: INITIAL_DELTA, 
                longitudeDelta: INITIAL_DELTA 
            }, 300);
        } else if (mapRef.current) {
            // Fallback: centrar en región por defecto
            mapRef.current.animateToRegion(COCHABAMBA_REGION, 300);
        }
    }, [userLocation, params]);

    const handleShowDirectionsFromPopup = useCallback((coords: { latitude: number; longitude: number; name: string }) => {
        console.log("MAPA: Solicitando ruta para:", coords.name);
        if (userLocation) {
            setDestination({ latitude: coords.latitude, longitude: coords.longitude });
            setDestinationName(coords.name);
            setSelectedParking(null);
            setRouteCoordinates([]);
            fetchRoute(userLocation, { latitude: coords.latitude, longitude: coords.longitude }, coords.name);
        } else {
            Alert.alert(
                "Ubicación no disponible", 
                "No se pudo obtener tu ubicación actual. Usa el botón de ubicación primero o verifica los permisos.",
                [{ text: 'OK' }]
            );
        }
    }, [userLocation, fetchRoute]);

    // --- Vistas Carga/Error MEJORADAS ---
    if (errorMsg) {
        return (
            <View className="flex-1 items-center justify-center bg-red-50 p-4">
                <Feather name="map-pin" size={48} color="#dc2626" />
                <Text className="text-lg font-bold text-red-700 text-center mt-4 mb-2">
                    Error de Ubicación
                </Text>
                <Text className="text-base text-red-600 text-center mb-4">
                    {errorMsg}
                </Text>
                <View className="flex-row space-x-3">
                    <TouchableOpacity 
                        onPress={() => {
                            setErrorMsg(null);
                            setIsLocationLoading(true);
                            // Reintentar obtención de ubicación
                            handleCenterOnUser();
                        }}
                        className="bg-red-600 px-4 py-3 rounded-lg"
                    >
                        <Text className="text-white font-semibold">Reintentar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => {
                            setErrorMsg(null);
                            // Continuar sin ubicación
                            if (mapRef.current) {
                                mapRef.current.animateToRegion(COCHABAMBA_REGION, 1000);
                            }
                        }}
                        className="bg-gray-600 px-4 py-3 rounded-lg"
                    >
                        <Text className="text-white font-semibold">Continuar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (!region || isLoadingApi || isLocationLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-100">
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text className="mt-2 text-base text-gray-500">
                    {isLocationLoading ? 'Obteniendo ubicación...' : 'Cargando parqueos...'}
                </Text>
            </View>
        );
    }

    // --- Render Principal ---
    return (
        <View className="flex-1">
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                region={region}
                showsUserLocation={!!userLocation}
                showsMyLocationButton={false}
                onRegionChangeComplete={setRegion}
                onPress={handleClearSelection}
                provider={PROVIDER_GOOGLE}
                showsCompass={true}
                rotateEnabled={true}
                scrollEnabled={true}
                zoomEnabled={true}
            >
                {/* Marcadores */}
                {parqueos.map((parqueo) => (
                    <Marker
                        key={`p-${parqueo.id}`}
                        coordinate={{ latitude: parqueo.latitud, longitude: parqueo.longitud }}
                        title={parqueo.nombre}
                        onPress={destination ? undefined : () => handleMarkerPress(parqueo)}
                        opacity={(destination && (destination.latitude !== parqueo.latitud || destination.longitude !== parqueo.longitud)) ? 0.6 : 1.0}
                        zIndex={0}
                    >
                        <Image 
                            source={{ uri: parqueo.disponible ? MARKER_DISPONIBLE : MARKER_LLENO }} 
                            style={{ width: 40, height: 40 }} 
                            resizeMode="contain" 
                        />
                    </Marker>
                ))}

                {/* Ruta */}
                {showDirections && routeCoordinates.length > 0 && (
                    <Polyline 
                        coordinates={routeCoordinates} 
                        strokeWidth={4} 
                        strokeColor="#4F46E5" 
                        zIndex={1} 
                    />
                )}
            </MapView>

            {/* Indicador Carga RUTA */}
            {isLoadingRoute && (
                <View className="absolute top-20 self-center bg-white px-4 py-2 rounded-full shadow-lg flex-row items-center elevation-4 z-20">
                    <ActivityIndicator size="small" color="#4F46E5" />
                    <Text className="text-sm text-gray-600 ml-2">Calculando ruta...</Text>
                </View>
            )}

            {/* BOTÓN MI UBICACIÓN */}
            <TouchableOpacity
                onPress={handleCenterOnUser}
                className="absolute top-24 right-6 z-10 w-14 h-14 bg-white rounded-full items-center justify-center shadow-lg active:bg-gray-200 elevation-5"
                disabled={isLocating}
            >
                {isLocating ? (
                    <ActivityIndicator size="small" color="#4F46E5" />
                ) : (
                    <Feather name="navigation" size={24} color="#4b5563" />
                )}
            </TouchableOpacity>

            {/* Controles Zoom */}
            <View className="absolute bottom-24 right-6 z-10 flex-col space-y-3" style={{ elevation: 5 }}>
                <TouchableOpacity 
                    onPress={() => handleZoom(0.8)} 
                    className="w-14 h-14 bg-white rounded-full items-center justify-center shadow-lg active:bg-gray-200"
                >
                    <Feather name="plus" size={28} color="#4b5563" />
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => handleZoom(1.25)} 
                    className="w-14 h-14 bg-white rounded-full items-center justify-center shadow-lg active:bg-gray-200"
                >
                    <Feather name="minus" size={28} color="#4b5563" />
                </TouchableOpacity>
            </View>

            {/* Botón LIMPIAR RUTA */}
            {showDirections && (
                <TouchableOpacity
                    onPress={handleClearSelection}
                    className="absolute bottom-5 left-5 z-10 bg-red-600 px-4 py-3 rounded-xl shadow-lg active:bg-red-700 flex-row items-center gap-1 elevation-5"
                >
                    <Feather name="x-circle" size={16} color="white"/>
                    <Text className="text-white font-bold text-sm">Limpiar Ruta</Text>
                </TouchableOpacity>
            )}

            {/* Popup Info */}
            {selectedParking && (
                <ParkeoPopup
                    details={selectedParking}
                    onClose={handleClearSelection}
                    onShowDirections={() => handleShowDirectionsFromPopup({
                        latitude: selectedParking.latitud,
                        longitude: selectedParking.longitud,
                        name: selectedParking.nombre
                    })}
                    showingDirections={showDirections || isLoadingRoute}
                />
            )}
        </View>
    );
}