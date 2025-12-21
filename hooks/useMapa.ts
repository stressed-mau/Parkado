// hooks/useMapa.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, DeviceEventEmitter } from 'react-native';
import { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Coords, ParqueoParaVista } from '../types/mapa';
import { API_URL, INITIAL_DELTA, COCHABAMBA_REGION } from '../constants/mapa';

// Hook personalizado para verificar montaje
const useIsMounted = () => {
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
};

// Utilidad para validar coordenadas
const isValidCoordinate = (coord: Coords | null): boolean => {
  if (!coord) return false;
  return (
    typeof coord.latitude === 'number' &&
    typeof coord.longitude === 'number' &&
    !isNaN(coord.latitude) &&
    !isNaN(coord.longitude) &&
    Math.abs(coord.latitude) <= 90 &&
    Math.abs(coord.longitude) <= 180
  );
};

// --- UTIL: obtenerUbicacionConTimeout (Promise.race) ---
const obtenerUbicacionConTimeout = async (ms: number) => {
  const locPromise = Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), ms)
  );

  return Promise.race([locPromise, timeoutPromise]);
};

export const useMapa = () => {
  const params = useLocalSearchParams<{ destLat?: string; destLng?: string; destNombre?: string }>();
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const isMounted = useIsMounted();

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

  // -------------------------
  // Utilidades seguras para el mapa
  // -------------------------
  const safeAnimateToRegion = useCallback((region: Region, duration = 500) => {
    if (mapRef.current?.animateToRegion && typeof mapRef.current.animateToRegion === 'function') {
      try {
        mapRef.current.animateToRegion(region, duration);
      } catch (err) {
        console.warn('animateToRegion falló:', err);
      }
    }
  }, []);

  const safeFitToCoordinates = useCallback((coordinates: Coords[], options: any) => {
    if (mapRef.current?.fitToCoordinates && typeof mapRef.current.fitToCoordinates === 'function') {
      try {
        mapRef.current.fitToCoordinates(coordinates, options);
      } catch (err) {
        console.warn('fitToCoordinates falló:', err);
      }
    }
  }, []);

  const safeAnimateCamera = useCallback((camera: any, options: any) => {
    if (mapRef.current?.animateCamera && typeof mapRef.current.animateCamera === 'function') {
      try {
        mapRef.current.animateCamera(camera, options);
      } catch (err) {
        console.warn('animateCamera falló:', err);
      }
    }
  }, []);

  // -------------------------
  // transformarParqueo
  // -------------------------
  const transformarParqueo = useCallback((p: any): ParqueoParaVista | null => {
    if (!p || typeof p !== 'object') return null;

    const lat = Number(p.latitud ?? p.latitude ?? p.lat ?? null);
    const lon = Number(p.longitud ?? p.longitude ?? p.lng ?? null);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return null;
    }

    const califs = Array.isArray(p.calificaciones) ? p.calificaciones : [];
    const rAvg =
      califs.length > 0
        ? califs.reduce((s: number, c: any) => s + (Number(c.puntuacion || 0) || 0), 0) / califs.length
        : 0;

    const plazas = Array.isArray(p.plazas) ? p.plazas : [];

const plazasDisponibles = plazas.filter(
  (plaza: any) =>
    plaza.estado === 'DISPONIBLE' ||
    plaza.estado === 'libre' ||
    plaza.estado === null
).length;


    const id = p.id ?? `${lat.toFixed(6)}_${lon.toFixed(6)}`;

    return {
      id,
      nombre: p.nombre || '?',
      direccion: p.direccion || 'Dirección no disponible',
      tipoLugar: p.tipoLugar || 'Estacionamiento',
      propietarioId: p.propietarioId ?? 0,
      latitud: lat,
      longitud: lon,
      latitude: lat,
      longitude: lon,
      horarios: Array.isArray(p.horarios) ? p.horarios : [],
      calificaciones: califs,
      capacidades: Array.isArray(p.capacidades) ? p.capacidades : [],
      servicios: Array.isArray(p.serviciosAsociados) ? p.serviciosAsociados : (p.servicios || []),
      plazas: plazas,
      tarifas: Array.isArray(p.tarifas) ? p.tarifas : [],
      fotos: Array.isArray(p.fotos) ? p.fotos : [],
      rating: Number(rAvg.toFixed(1)),
      disponible: plazasDisponibles > 0,

      isResumen: !Array.isArray(p.horarios),

    } as ParqueoParaVista;
  }, []);

  // -------------------------
  // fetchParqueos
  // -------------------------
  const fetchParqueos = useCallback(async () => {
    if (!isMounted.current) return [];

    setIsLoadingApi(true);
    try {
      const response = await axios.get(API_URL);
      const remote = response?.data;

      if (!Array.isArray(remote)) {
        console.warn('Respuesta API parqueos no es array:', remote);
        if (isMounted.current) setParqueos([]);
        return [];
      }

      const datosTransformados = remote
        .map(transformarParqueo)
        .filter((p: ParqueoParaVista | null): p is ParqueoParaVista => p !== null);

      if (isMounted.current) setParqueos(datosTransformados);
      return datosTransformados;
    } catch (e: any) {
      console.error('Error cargando parqueos:', e);
      if (isMounted.current) setErrorMsg('Error cargando parqueos. Revisa tu conexión.');
      return [];
    } finally {
      if (isMounted.current) setIsLoadingApi(false);
    }
  }, [isMounted, transformarParqueo]);

  const reloadParqueos = useCallback(async () => {
    return await fetchParqueos();
  }, [fetchParqueos]);

  useEffect(() => {
    fetchParqueos();
  }, [fetchParqueos]);

  // DeviceEventEmitter listener
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('parqueoCreated', async () => {
      try {
        await fetchParqueos();
        const coordsStr = await AsyncStorage.getItem('parkado_last_coords');
        if (coordsStr && isMounted.current) {
          try {
            const parsed = JSON.parse(coordsStr);
            if (parsed?.latitude && parsed?.longitude) {
              safeAnimateToRegion({
                latitude: Number(parsed.latitude),
                longitude: Number(parsed.longitude),
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }, 500);
            }
            await AsyncStorage.removeItem('parkado_last_coords');
          } catch (err) {
            console.warn('No se pudo parsear parkado_last_coords:', err);
          }
        }
      } catch (e) {
        console.warn('Error fetchParqueos desde DeviceEventEmitter:', e);
      }
    });

    return () => {
      try { sub.remove(); } catch (err) { console.warn('Error removiendo DeviceEventEmitter listener:', err); }
    };
  }, [fetchParqueos, isMounted, safeAnimateToRegion]);

  // Focus flag (AsyncStorage)
  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const checkFlag = async () => {
        try {
          const flag = await AsyncStorage.getItem('parkado_needs_reload');
          if (!mounted || !isMounted.current) return;

          if (flag === '1') {
            await fetchParqueos();
            await AsyncStorage.removeItem('parkado_needs_reload');

            const coordsStr = await AsyncStorage.getItem('parkado_last_coords');
            if (coordsStr) {
              try {
                const parsed = JSON.parse(coordsStr);
                if (parsed?.latitude && parsed?.longitude) {
                  safeAnimateToRegion({
                    latitude: Number(parsed.latitude),
                    longitude: Number(parsed.longitude),
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }, 500);
                }
                await AsyncStorage.removeItem('parkado_last_coords');
              } catch (err) {
                console.warn('No se pudo parsear parkado_last_coords (focus):', err);
              }
            }
          }
        } catch (e) {
          console.warn('Error checando flag parkado_needs_reload:', e);
        }
      };

      checkFlag();
      return () => { mounted = false; };
    }, [fetchParqueos, isMounted, safeAnimateToRegion])
  );

  // -------------------------
  // Permisos y ubicación inicial (con timeout)
  // -------------------------
  useEffect(() => {
    (async () => {
      if (!isMounted.current) return;

      setIsLocationLoading(true);
      setErrorMsg(null);

      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          if (isMounted.current) setErrorMsg('Los servicios de ubicación están desactivados. Actívalos en ajustes del dispositivo.');
          return;
        }

        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
          status = newStatus;
        }

        if (status !== 'granted') {
          if (isMounted.current) setErrorMsg('Permiso de ubicación denegado. Actívalo en ajustes de la app.');
          return;
        }

        // usamos la util con timeout
        const location = await obtenerUbicacionConTimeout(10000);

        const coords: Coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        if (isMounted.current) {
          setUserLocation(coords);
          setErrorMsg(null);

          const newRegion = {
            ...coords,
            latitudeDelta: INITIAL_DELTA,
            longitudeDelta: INITIAL_DELTA,
          };

          safeAnimateToRegion(newRegion, 500);
          setRegion(newRegion);
        }
      } catch (error: any) {
        if (!isMounted.current) return;
        let errorMessage = 'No se pudo obtener tu ubicación actual. ';
        if (error?.message === 'TIMEOUT') {
          errorMessage += 'Tiempo de espera agotado.';
        } else if (error?.code === 'CANCELLED') {
          errorMessage += 'La solicitud fue cancelada.';
        } else if (error?.code === 'UNAVAILABLE') {
          errorMessage += 'Servicio de ubicación no disponible.';
        } else {
          errorMessage += 'Verifica tu conexión y servicios de ubicación.';
        }
        setErrorMsg(errorMessage);
      } finally {
        if (isMounted.current) setIsLocationLoading(false);
      }
    })();
  }, [isMounted, safeAnimateToRegion]);

  // -------------------------
  // fetchRoute (OSRM)
  // -------------------------
  const fetchRoute = useCallback(
    async (origin: Coords, destinationCoords: Coords, destNombre?: string) => {
      if (!isMounted.current) return;

      if (!isValidCoordinate(origin) || !isValidCoordinate(destinationCoords)) {
        Alert.alert('Error', 'Coordenadas inválidas para calcular la ruta');
        return;
      }

      setIsLoadingRoute(true);
      setRouteCoordinates([]);
      setShowDirections(false);

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?overview=full&geometries=geojson`;
        const response = await axios.get(url);

        if (!isMounted.current) return;

        if (!response?.data || !Array.isArray(response.data.routes) || response.data.routes.length === 0) {
          throw new Error('No se encontró ruta disponible');
        }

        const geo = response.data.routes[0]?.geometry;
        if (!geo || !Array.isArray(geo.coordinates)) {
          throw new Error('Formato de ruta inesperado');
        }

        const coordinates = geo.coordinates
          .map((coord: any) => {
            if (!Array.isArray(coord) || coord.length < 2) return null;
            const lat = Number(coord[1]);
            const lng = Number(coord[0]);
            if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
            return { latitude: lat, longitude: lng };
          })
          .filter((c: any) => c !== null);

        if (isMounted.current) {
          setRouteCoordinates(coordinates as Coords[]);
          setShowDirections(true);
        }

        safeFitToCoordinates([origin, destinationCoords], {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        });
      } catch (error: any) {
        if (!isMounted.current) return;
        Alert.alert('Error', `No se pudo trazar la ruta${destNombre ? ` a ${destNombre}` : ''}.`);
        setShowDirections(false);
        console.error('Error fetchRoute:', error);
      } finally {
        if (isMounted.current) setIsLoadingRoute(false);
      }
    },
    [isMounted, safeFitToCoordinates]
  );

  // -------------------------
  // UI actions
  // -------------------------
  const handleCenterOnUser = useCallback(async () => {
    if (!isMounted.current) return;

    setIsLocating(true);
    setErrorMsg(null);

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert('Ubicación desactivada', 'Activa ubicación en el dispositivo.');
        return;
      }

      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        status = newStatus;
      }

      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se necesita permiso de ubicación para centrar el mapa en tu ubicación actual.', [{ text: 'OK' }]);
        return;
      }

      const location = await obtenerUbicacionConTimeout(10000);

      const newCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      if (isMounted.current) {
        setUserLocation(newCoords);
        setErrorMsg(null);
      }

      const newRegion = {
        ...newCoords,
        latitudeDelta: INITIAL_DELTA,
        longitudeDelta: INITIAL_DELTA,
      };

      safeAnimateToRegion(newRegion, 1000);

      if (isMounted.current) setRegion(newRegion);
    } catch (error: any) {
      if (!isMounted.current) return;
      let errorMessage = 'No se pudo obtener tu ubicación actual. ';
      if (error?.message === 'TIMEOUT') {
        errorMessage += 'El tiempo de espera se agotó.';
      } else if (error?.code === 'CANCELLED') {
        errorMessage += 'La solicitud fue cancelada.';
      } else if (error?.code === 'UNAVAILABLE') {
        errorMessage += 'Los servicios de ubicación no están disponibles.';
      } else {
        errorMessage += 'Verifica tu conexión y configuración de ubicación.';
      }
      setErrorMsg(errorMessage);
      Alert.alert('Error de ubicación', errorMessage);
    } finally {
      if (isMounted.current) setIsLocating(false);
    }
  }, [isMounted, safeAnimateToRegion]);

  const handleZoom = useCallback(
    (factor: number) => {
      if (!region || !isMounted.current) return;

      const newR: Region = {
        ...region,
        latitudeDelta: region.latitudeDelta * factor,
        longitudeDelta: region.longitudeDelta * factor,
      };

      safeAnimateToRegion(newR, 300);

      if (isMounted.current) setRegion(newR);
    },
    [region, isMounted, safeAnimateToRegion]
  );

  const handleMarkerPress = useCallback(
  (parqueo: ParqueoParaVista) => {
    if (!isMounted.current) return;

    // 🔥 BUSCAR EL PARQUEO COMPLETO POR ID
    const parqueoCompleto = parqueos.find(
      (p) => String(p.id) === String(parqueo.id)
    );

    if (parqueoCompleto) {
      // ✅ Tenemos info completa
      setSelectedParking(parqueoCompleto);
    } else {
      // ⚠️ Fallback (solo por seguridad)
      setSelectedParking(parqueo);
    }

    setShowDirections(false);
    setRouteCoordinates([]);

    if (region) {
      safeAnimateToRegion(
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
  [parqueos, region, isMounted, safeAnimateToRegion]
);



  const handleClearSelection = useCallback(() => {
    if (!isMounted.current) return;

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

    if (userLocation) {
      safeAnimateToRegion(
        {
          ...userLocation,
          latitudeDelta: INITIAL_DELTA,
          longitudeDelta: INITIAL_DELTA,
        },
        300
      );
    } else {
      safeAnimateToRegion(COCHABAMBA_REGION, 300);
    }
  }, [userLocation, params, router, isMounted, safeAnimateToRegion]);

  const cerrarSoloPopup = useCallback(() => {
    if (isMounted.current) setSelectedParking(null);
  }, [isMounted]);

  const handleShowDirectionsFromPopup = useCallback(
    (coords: { latitude: number; longitude: number; name: string }) => {
      if (!isMounted.current) return;

      if (userLocation && isValidCoordinate(userLocation)) {
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
    [userLocation, fetchRoute, isMounted]
  );

  // Cuando venimos desde otra pantalla con destLat/destLng en la URL
  useEffect(() => {
    if (!params.destLat || !params.destLng) return;
    if (!userLocation) return;

    const lat = Number(params.destLat);
    const lng = Number(params.destLng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      console.warn('❌ destLat/destLng no son números válidos', params.destLat, params.destLng);
      return;
    }

    const destCoords: Coords = { latitude: lat, longitude: lng };

    if (!isValidCoordinate(userLocation) || !isValidCoordinate(destCoords)) {
      console.warn('❌ Coordenadas inválidas para calcular ruta');
      return;
    }

    if (isMounted.current) {
      setDestination(destCoords);
      setDestinationName(params.destNombre ?? null);
      setRouteCoordinates([]);
      setShowDirections(false);
    }

    fetchRoute(userLocation, destCoords, params.destNombre ?? undefined);
  }, [params.destLat, params.destLng, params.destNombre, userLocation, fetchRoute, isMounted]);

  const refreshPopupIfOpen = useCallback(async (parqueoId: number) => {
    if (!isMounted.current) return;

    try {
      if (!selectedParking) return;
      if (selectedParking.id !== parqueoId) return;

      const response = await axios.get(`${API_URL}/${parqueoId}`);
      const nuevo = transformarParqueo(response.data);
      if (nuevo && isMounted.current) {
        setSelectedParking(nuevo);
      }
    } catch (e) {
      console.warn('Error refrescando popup:', e);
    }
  }, [selectedParking, transformarParqueo, isMounted]);

  // -------------------------
  // Retorno del hook (IMPORTANTE: incluye fetchRoute y setDestination)
  // -------------------------
  return {
    mapRef,
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
    setDestination,                // <-- expuesto
    setDestinationName,            // <-- expuesto
    handleCenterOnUser,
    handleZoom,
    handleMarkerPress,
    handleClearSelection,
    handleShowDirectionsFromPopup,
    cerrarSoloPopup,

    // Utilities
    fetchRoute,                    // <-- expuesto
    fetchParqueos,
    reloadParqueos,
    refreshPopupIfOpen,
  };
};
