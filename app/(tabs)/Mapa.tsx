// Archivo: app/(tabs)/Mapa.tsx (CORREGIDO EL BUCLE DE LIMPIEZA)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Image, Platform } from 'react-native';
import MapView, { Region, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
    // Usamos los nombres correctos: destLat, destLng, destNombre
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
    const [showDirections, setShowDirections] = useState(false); // Tu estado original

    // ------------------------------------
    // EFECTO 1: Permisos y Ubicación Inicial (Tu código)
    // ------------------------------------
    useEffect(() => {
        let isMounted = true;
        (async () => {
             setIsLocationLoading(true); setErrorMsg(null); console.log("MAPA (E1): Permisos...");
             try {
                 let { status } = await Location.getForegroundPermissionsAsync();
                 if (status !== 'granted') status = (await Location.requestForegroundPermissionsAsync()).status;
                 if (status !== 'granted') { if (isMounted) setErrorMsg('Permiso denegado.'); return; }
                 console.log("MAPA (E1): Ubicación...");
                 const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                 const coords: Coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
                 if (isMounted) {
                     console.log("MAPA (E1): Ubicación OK:", coords);
                     setUserLocation(coords);
                     if (mapRef.current && region?.latitude === COCHABAMBA_REGION.latitude) {
                        console.log("MAPA (E1): Centrando inicial.");
                        setRegion({ ...coords, latitudeDelta: INITIAL_DELTA, longitudeDelta: INITIAL_DELTA });
                     }
                 }
             } catch (error: any) { console.error("MAPA (E1): Error:", error.message); if (isMounted) setErrorMsg('Error ubicación.');
             } finally { if (isMounted) setIsLocationLoading(false); }
         })();
         return () => { isMounted = false };
    }, []);

    // ------------------------------------
    // EFECTO 2: Cargar Parqueos (Tu código)
    // ------------------------------------
    useEffect(() => {
         let isMounted = true;
         // CORRECCIÓN 1: El nombre de tu función es fetchAndTransformParqueos
         const fetchAndTransformParqueos = async () => {
             setIsLoadingApi(true); console.log("MAPA (E2): Cargando parqueos...");
             try {
                 const response = await axios.get<any[]>(API_URL);
                 const datosTransformados = response.data.map((p): ParqueoParaVista | null => {
                     let lat: number|undefined, lon: number|undefined;
                     if(typeof p.latitud==='number'&&typeof p.longitud==='number'){lat=p.latitud;lon=p.longitud;}
                     else if(p.plazas?.[0]?.latitud && p.plazas?.[0]?.longitud){lat=p.plazas[0].latitud;lon=p.plazas[0].longitud;}
                     if(typeof lat!=='number'||typeof lon!=='number') return null;
                     const rAvg=(p.calificaciones||[]).length>0?(p.calificaciones.reduce((s:number,c:any)=>s+parseInt(c.puntuacion||'0'),0)/p.calificaciones.length):0;
                     const h1=(p.horarios||[])[0]; let hStr='No disp.';
                     if(h1?.horaAbrir&&h1?.horaCerrar){try{hStr=`${h1.diaSemana}: ${new Date(h1.horaAbrir).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} - ${new Date(h1.horaCerrar).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`}catch(e){}}
                     const disp=(p.capacidades||[]).reduce((s:number,c:any)=>s+(c.cantidad||0),0)>0;
                     return {id:String(p.id),nombre:p.nombre||'?',latitud:lat,longitud:lon,rating:parseFloat(rAvg.toFixed(1)),imageUri:p.imagen_url||`https://picsum.photos/seed/${p.id}/100/80`,horario:hStr,tarifa:'7 Bs/h',disponible:disp};
                 }).filter((p): p is ParqueoParaVista => p !== null);
                 if(isMounted){setParqueos(datosTransformados); console.log(`MAPA (E2): ${datosTransformados.length} válidos.`);}
             } catch(e:any){console.error("MAPA (E2): Error:",e.message); if(isMounted)setErrorMsg("Error servidor.");}
             finally {if(isMounted)setIsLoadingApi(false);}
         };
         
         // CORRECCIÓN 1 (Llamada):
         fetchAndTransformParqueos(); // Llamamos a la función
         return ()=>{isMounted=false};
     }, []);

     // ------------------------------------
     // EFECTO 3: Detectar parámetros de ruta (Tu lógica - CORREGIDA)
     // ------------------------------------
     useEffect(() => {
        // --- CORRECCIÓN 2 (Usar los nombres correctos) ---
        // Usamos destLat, destLng, destNombre (los que definiste en useLocalSearchParams)
        const { destLat, destLng, destNombre } = params;
        // --- Fin Corrección 2 ---

        console.log("MAPA (E3 - Params Check): Params recibidos:", params);

        // Usamos destLat, destLng, destNombre
        if (destLat && destLng && destNombre && userLocation) {
            console.log("MAPA (E3 - Params Check): Procesando ruta desde params...");
            const targetLocation = { latitude: parseFloat(destLat), longitude: parseFloat(destLng) };

            if (destination?.latitude === targetLocation.latitude && destination?.longitude === targetLocation.longitude) {
                // Si el destino es el mismo, solo limpiamos params para evitar bucles
                if (params.destLat) { // Solo si de verdad hay params
                     console.log("MAPA (E3 - Params Check): Destino sin cambios, limpiando params.");
                     router.setParams({ destLat: undefined, destLng: undefined, destNombre: undefined });
                }
                return;
            }

            setDestination(targetLocation);
            setDestinationName(destNombre || "Destino");
            setSelectedParking(null);
            setRouteCoordinates([]);
            // Limpiar params usando el router para que sea permanente
            console.log("MAPA (E3 - Params Check): Limpiando params de URL...");
            router.setParams({ destLat: undefined, destLng: undefined, destNombre: undefined });


            console.log("MAPA (E3 - Params Check): Llamando a fetchRoute...");
            fetchRoute(userLocation, targetLocation, destNombre); // Pasamos el nombre

        } else {
             console.log("MAPA (E3 - Params Check): No se cumplen condiciones.", { hasTarget: !!destLat, hasUserLoc: !!userLocation });
        }
    }, [params, userLocation, parqueos, destination]); // Tus dependencias


    // --- Función Fetch Route (Tu código original - MODIFICADA) ---
    const fetchRoute = async (origin: Coords, destinationCoords: Coords, destNombre?: string) => { // destNombre opcional
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
            const coordinates = response.data.routes[0].geometry.coordinates.map((coord: number[]) => ({
                latitude: coord[1],
                longitude: coord[0]
            }));
            setRouteCoordinates(coordinates);
            setShowDirections(true); // <-- Tu estado
            console.log(`MAPA (fetchRoute): Ruta obtenida (${coordinates.length} puntos).`);
             if (mapRef.current) {
                  console.log("MAPA (fetchRoute): Ajustando mapa a la ruta.");
                  mapRef.current.fitToCoordinates([origin, destinationCoords], { edgePadding: { top: 100, right: 50, bottom: 100, left: 50 }, animated: true });
             }
        } catch (error: any) {
            console.error('MAPA (fetchRoute): Error obteniendo ruta:', error.response?.data || error.message);
            Alert.alert('Error', `No se pudo trazar la ruta${destNombre ? ` a ${destNombre}` : ''}.`);
            setShowDirections(false);
        } finally {
            setIsLoadingRoute(false);
        }
    };


    // --- Funciones Interacción ---
    const handleZoom = (factor: number) => { /* ... */ if (!region) return; const newR: Region={...region, latitudeDelta: region.latitudeDelta*factor, longitudeDelta: region.longitudeDelta*factor}; mapRef.current?.animateToRegion(newR, 300); };
    const handleMarkerPress = (parqueo: ParqueoParaVista) => { /* ... */ setSelectedParking(parqueo); setShowDirections(false); setRouteCoordinates([]); if(region && mapRef.current){ mapRef.current.animateToRegion({ latitude: parqueo.latitud, longitude: parqueo.longitud, latitudeDelta: region.latitudeDelta, longitudeDelta: region.longitudeDelta }, 500); } };
    
    // --- 👇 CORRECCIÓN 3 (handleCloseCard - AHORA ES handleClearSelection) 👇 ---
    // Esta función AHORA limpia TODOS los estados de la ruta Y los params
    const handleClearSelection = () => {
        console.log("MAPA (handleClearSelection): Limpiando TODO...");
        setSelectedParking(null); // Cierra popup
        setDestination(null); // Borra destino
        setDestinationName(null);
        setRouteCoordinates([]); // Borra línea
        setShowDirections(false); // Oculta ruta y botón "Limpiar"
        setIsLoadingRoute(false); // Detiene carga

        // --- ESTA ES LA PARTE CLAVE QUE FALTABA ---
        // Limpiar los parámetros de la URL para que no vuelvan a disparar el efecto
        if (params.destLat || params.destLng || params.destNombre) {
            console.log("MAPA (handleClearSelection): Reseteando params de URL.");
            router.setParams({
                destLat: undefined,
                destLng: undefined,
                destNombre: undefined,
            });
        }
        // --- FIN PARTE CLAVE ---

        // Opcional: Centrar en usuario
        if (userLocation && mapRef.current && region) {
             mapRef.current.animateToRegion({ ...userLocation, latitudeDelta: INITIAL_DELTA, longitudeDelta: INITIAL_DELTA }, 300);
        }
    };
    // --- Fin Corrección 3 ---


    // --- 👇 FUNCIÓN AÑADIDA para el botón "Cómo Llegar" 👇 ---
    const handleShowDirectionsFromPopup = useCallback((coords: { latitude: number; longitude: number; name: string }) => {
        console.log("MAPA (handleShowDirectionsFromPopup): Solicitud de ruta para:", coords.name);
        if (userLocation) {
            // Establece el destino
            setDestination({ latitude: coords.latitude, longitude: coords.longitude });
            setDestinationName(coords.name);
            setSelectedParking(null); // Cierra el popup
            setRouteCoordinates([]); // Limpia anterior
            
            // Llama a tu función fetchRoute directamente
            fetchRoute(userLocation, { latitude: coords.latitude, longitude: coords.longitude }, coords.name);
        } else {
             Alert.alert("Ubicación no disponible", "Aún no se ha podido obtener tu ubicación actual.");
        }
    }, [userLocation, fetchRoute]); // Depende de userLocation y fetchRoute


    // --- Vistas Carga/Error (Tu código original) ---
     if (errorMsg) { return (<View className="flex-1 items-center justify-center bg-red-50 p-4"><Text className="text-lg font-bold text-red-700 text-center">{errorMsg}</Text></View>); }
     if (!region || isLoadingApi || isLocationLoading) { return (<View className="flex-1 items-center justify-center bg-gray-100"><ActivityIndicator size="large" color="#4F46E5" /><Text className="mt-2 text-base text-gray-500">{isLocationLoading ? 'Obteniendo ubicación...' : 'Cargando parqueos...'}</Text></View>); }

    // --- Render Principal ---
    return (
        <View className="flex-1">
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                region={region}
                showsUserLocation
                showsMyLocationButton={false}
                onRegionChangeComplete={setRegion}
                onPress={handleClearSelection} // <--- Usa la función corregida
                provider={PROVIDER_GOOGLE}
            >
                {/* Marcadores */}
                {parqueos.map((parqueo) => (
                    <Marker
                        key={`p-${parqueo.id}`}
                        coordinate={{ latitude: parqueo.latitud, longitude: parqueo.longitud }} // Corregido
                        title={parqueo.nombre}
                        onPress={destination ? undefined : () => handleMarkerPress(parqueo)}
                        opacity={(destination && (destination.latitude !== parqueo.latitud || destination.longitude !== parqueo.longitud)) ? 0.6 : 1.0}
                        zIndex={0}
                    >
                        <Image source={{ uri: parqueo.disponible ? MARKER_DISPONIBLE : MARKER_LLENO }} style={{ width: 40, height: 40 }} resizeMode="contain" />
                    </Marker>
                ))}

                {/* Ruta (Usa tu estado 'showDirections') */}
                {showDirections && routeCoordinates.length > 0 && (
                    <Polyline coordinates={routeCoordinates} strokeWidth={4} strokeColor="#4F46E5" zIndex={1} />
                )}

                  
            </MapView>

             {/* Indicador Carga RUTA */}
            {isLoadingRoute && (
                <View className="absolute top-20 self-center bg-white px-4 py-2 rounded-full shadow-lg flex-row items-center elevation-4 z-20">
                    <ActivityIndicator size="small" color="#4F46E5" />
                    <Text className="text-sm text-gray-600 ml-2">Calculando ruta...</Text>
                </View>
            )}

            {/* Controles Zoom */}
            <View className="absolute bottom-24 right-6 z-10 flex-col space-y-3" style={{ elevation: 5 }}>
                 <TouchableOpacity onPress={() => handleZoom(0.8)} className="w-14 h-14 bg-white rounded-full items-center justify-center shadow-lg active:bg-gray-200"><Feather name="plus" size={28} color="#4b5563" /></TouchableOpacity>
                 <TouchableOpacity onPress={() => handleZoom(1.25)} className="w-14 h-14 bg-white rounded-full items-center justify-center shadow-lg active:bg-gray-200"><Feather name="minus" size={28} color="#4b5563" /></TouchableOpacity>
            </View>

            {/* Botón LIMPIAR RUTA (Usa tu estado 'showDirections') */}
            {showDirections && (
                <TouchableOpacity
                    onPress={handleClearSelection} // <--- Usa la función corregida
                    className="absolute bottom-5 left-5 z-10 bg-red-600 px-4 py-3 rounded-xl shadow-lg active:bg-red-700 flex-row items-center gap-1 elevation-5"
                >
                    <Feather name="x-circle" size={16} color="white"/>
                    <Text className="text-white font-bold text-sm">Limpiar Ruta</Text>
                </TouchableOpacity>
            )}

            {/* Popup Info */}
            {/* --- 👇 CONECTAMOS onShowDirections Y onClose 👇 --- */}
            {selectedParking && (
                <ParkeoPopup
                    details={selectedParking}
                    onClose={handleClearSelection} // <--- Usa la función corregida
                    onShowDirections={() => handleShowDirectionsFromPopup({
                        latitude: selectedParking.latitud,
                        longitude: selectedParking.longitud,
                        name: selectedParking.nombre
                    })}
                    showingDirections={showDirections || isLoadingRoute} // Re-añadido tu prop original
                />
            )}
             {/* --- Fin Conexión --- */}
        </View>
    );
}

// Estilos Nativos (solo si es necesario)
// const styles = StyleSheet.create({ });