import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { Coords, ParqueoParaVista, MapState, MapActions } from '../types/mapa';
import { API_URL, INITIAL_DELTA, COCHABAMBA_REGION } from '../constants/mapa';

export const useMapa = () => {
  const params = useLocalSearchParams<{ destLat?: string; destLng?: string; destNombre?: string }>();
  const router = useRouter();
  const mapRef = useRef<any>(null);

  // Estados
  const [region, setRegion] = useState<Region | null>(COCHABAMBA_REGION);
  const [userLocation, setUserLocation] = useState<Coords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedParking, setSelectedParking] = useState<ParqueoParaVista | null>(null);
  const [parqueos, setParqueos] = useState<ParqueoParaVista[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [destination, setDestination] = useState<Coords | null>(null);
  const [destinationName, setDestinationName] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coords[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Efecto para permisos y ubicación inicial
  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      setIsLocationLoading(true);
      setErrorMsg(null);
      
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          setErrorMsg('Los servicios de ubicación están desactivados. Actívalos en ajustes del dispositivo.');
          return;
        }

        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
          status = newStatus;
        }

        if (status !== 'granted') {
          setErrorMsg('Permiso de ubicación denegado. Actívalo en ajustes de la app.');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 10000,
        });

        const coords: Coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        if (isMounted) {
          setUserLocation(coords);
          setErrorMsg(null);
          
          if (mapRef.current) {
            const newRegion = {
              ...coords,
              latitudeDelta: INITIAL_DELTA,
              longitudeDelta: INITIAL_DELTA,
            };
            setRegion(newRegion);
          }
        }
      } catch (error: any) {
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
      } finally {
        if (isMounted) {
          setIsLocationLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Efecto para cargar parqueos - CORREGIDO
  useEffect(() => {
    let isMounted = true;
    const fetchAndTransformParqueos = async () => {
      setIsLoadingApi(true);
      
      try {
        const response = await axios.get<any[]>(API_URL);
        const datosTransformados = response.data
          .map((p): ParqueoParaVista | null => {
            let lat: number | undefined, lon: number | undefined;
            
            if (typeof p.latitud === 'number' && typeof p.longitud === 'number') {
              lat = p.latitud;
              lon = p.longitud;
            } else if (p.plazas?.[0]?.latitud && p.plazas?.[0]?.longitud) {
              lat = p.plazas[0].latitud;
              lon = p.plazas[0].longitud;
            }
            
            if (typeof lat !== 'number' || typeof lon !== 'number') return null;

            const rAvg = (p.calificaciones || []).length > 0
              ? p.calificaciones.reduce((s: number, c: any) => s + parseInt(c.puntuacion || '0'), 0) / p.calificaciones.length
              : 0;

            const disp = (p.capacidades || []).reduce((s: number, c: any) => s + (c.cantidad || 0), 0) > 0;

            return {
              id: p.id,
              nombre: p.nombre || '?',
              direccion: p.direccion || 'Dirección no disponible',
              tipoLugar: p.tipoLugar || 'Estacionamiento',
              propietarioId: p.propietarioId || 0,
              latitud: lat,
              longitud: lon,
              horarios: p.horarios || [],
              calificaciones: p.calificaciones || [],
              capacidades: p.capacidades || [],
              servicios: p.servicios || [],
              plazas: p.plazas || [],
              tarifas: p.tarifas || [],
              fotos: p.fotos || [],
              // ❌ ELIMINADO: descripcion: p.descripcion,
              rating: parseFloat(rAvg.toFixed(1)),
              disponible: disp,
            };
          })
          .filter((p): p is ParqueoParaVista => p !== null);

        if (isMounted) {
          setParqueos(datosTransformados);
        }
      } catch (e: any) {
        setErrorMsg('Error cargando parqueos. Revisa tu conexión.');
      } finally {
        if (isMounted) {
          setIsLoadingApi(false);
        }
      }
    };

    fetchAndTransformParqueos();
    return () => {
      isMounted = false;
    };
  }, []);

  // Efecto para detectar parámetros de ruta
  useEffect(() => {
    const { destLat, destLng, destNombre } = params;

    if (destLat && destLng && destNombre && userLocation) {
      const targetLocation = {
        latitude: parseFloat(destLat),
        longitude: parseFloat(destLng),
      };

      if (destination?.latitude === targetLocation.latitude && destination?.longitude === targetLocation.longitude) {
        return;
      }

      setDestination(targetLocation);
      setDestinationName(destNombre);
      setSelectedParking(null);
      setRouteCoordinates([]);

      router.setParams({
        destLat: undefined,
        destLng: undefined,
        destNombre: undefined,
      });

      fetchRoute(userLocation, targetLocation, destNombre);
    }
  }, [params, userLocation]);

  const fetchRoute = useCallback(
    async (origin: Coords, destinationCoords: Coords, destNombre?: string) => {
      setIsLoadingRoute(true);
      setRouteCoordinates([]);

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?overview=full&geometries=geojson`;
        const response = await axios.get(url);

        if (response.data.routes && response.data.routes.length > 0) {
          const coordinates = response.data.routes[0].geometry.coordinates.map((coord: number[]) => ({
            latitude: coord[1],
            longitude: coord[0],
          }));

          setRouteCoordinates(coordinates);
          setShowDirections(true);

          if (mapRef.current) {
            mapRef.current.fitToCoordinates([origin, destinationCoords], {
              edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
              animated: true,
            });
          }
        } else {
          throw new Error('No se encontró ruta disponible');
        }
      } catch (error: any) {
        Alert.alert('Error', `No se pudo trazar la ruta${destNombre ? ` a ${destNombre}` : ''}.`);
        setShowDirections(false);
      } finally {
        setIsLoadingRoute(false);
      }
    },
    []
  );

  const handleCenterOnUser = useCallback(async () => {
    setIsLocating(true);
    setErrorMsg(null);

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
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
                  console.error('Error abriendo configuración:', error);
                }
              },
            },
          ]
        );
        return;
      }

      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        status = newStatus;
      }

      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Se necesita permiso de ubicación para centrar el mapa en tu ubicación actual.',
          [{ text: 'OK' }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
        maximumAge: 30000,
      });

      const newCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(newCoords);
      setErrorMsg(null);

      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            ...newCoords,
            latitudeDelta: INITIAL_DELTA,
            longitudeDelta: INITIAL_DELTA,
          },
          1000
        );
      }
    } catch (error: any) {
      let errorMessage = 'No se pudo obtener tu ubicación actual. ';
      if (error.code === 'CANCELLED') {
        errorMessage += 'La solicitud fue cancelada.';
      } else if (error.code === 'UNAVAILABLE') {
        errorMessage += 'Los servicios de ubicación no están disponibles. Verifica que la ubicación esté activada en tu dispositivo.';
      } else if (error.code === 'TIMEOUT') {
        errorMessage += 'El tiempo de espera se agotado. Intenta nuevamente.';
      } else {
        errorMessage += 'Verifica tu conexión y configuración de ubicación.';
      }
      setErrorMsg(errorMessage);
      Alert.alert('Error de ubicación', errorMessage);

      // Fallback
      if (userLocation && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            ...userLocation,
            latitudeDelta: INITIAL_DELTA,
            longitudeDelta: INITIAL_DELTA,
          },
          1000
        );
      } else if (mapRef.current) {
        mapRef.current.animateToRegion(COCHABAMBA_REGION, 1000);
      }
    } finally {
      setIsLocating(false);
    }
  }, [userLocation]);

  const handleZoom = useCallback(
    (factor: number) => {
      if (!region) return;
      const newR: Region = {
        ...region,
        latitudeDelta: region.latitudeDelta * factor,
        longitudeDelta: region.longitudeDelta * factor,
      };
      mapRef.current?.animateToRegion(newR, 300);
    },
    [region]
  );

  const handleMarkerPress = useCallback(
    (parqueo: ParqueoParaVista) => {
      setSelectedParking(parqueo);
      setShowDirections(false);
      setRouteCoordinates([]);
      if (region && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: parqueo.latitud,
            longitude: parqueo.longitud,
            latitudeDelta: region.latitudeDelta,
            longitudeDelta: region.longitudeDelta,
          },
          500
        );
      }
    },
    [region]
  );

  const handleClearSelection = useCallback(() => {
    setSelectedParking(null);
    setDestination(null);
    setDestinationName(null);
    setRouteCoordinates([]);
    setShowDirections(false);
    setIsLoadingRoute(false);

    if (params.destLat || params.destLng || params.destNombre) {
      router.setParams({
        destLat: undefined,
        destLng: undefined,
        destNombre: undefined,
      });
    }

    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...userLocation,
          latitudeDelta: INITIAL_DELTA,
          longitudeDelta: INITIAL_DELTA,
        },
        300
      );
    } else if (mapRef.current) {
      mapRef.current.animateToRegion(COCHABAMBA_REGION, 300);
    }
  }, [userLocation, params]);

const cerrarSoloPopup = useCallback(() => {
  setSelectedParking(null);
}, []);

  
  const handleShowDirectionsFromPopup = useCallback(
    (coords: { latitude: number; longitude: number; name: string }) => {
      if (userLocation) {
        setDestination({ latitude: coords.latitude, longitude: coords.longitude });
        setDestinationName(coords.name);
        setSelectedParking(null);
        setRouteCoordinates([]);
        fetchRoute(userLocation, { latitude: coords.latitude, longitude: coords.longitude }, coords.name);
      } else {
        Alert.alert(
          'Ubicación no disponible',
          'No se pudo obtener tu ubicación actual. Usa el botón de ubicación primero o verifica los permisos.',
          [{ text: 'OK' }]
        );
      }
    },
    [userLocation, fetchRoute]
  );

  return {
    // Refs
    mapRef,
    
    // State
    region,
    userLocation,
    errorMsg,
    selectedParking,
    parqueos,
    isLoadingApi,
    isLocationLoading,
    destination,
    destinationName,
    routeCoordinates,
    isLoadingRoute,
    showDirections,
    isLocating,
    
    // Actions
    setRegion,
    setSelectedParking,
    handleCenterOnUser,
    handleZoom,
    handleMarkerPress,
    handleClearSelection,
    handleShowDirectionsFromPopup,
    cerrarSoloPopup
  };
};