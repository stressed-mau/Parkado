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

/**
 * Hook useMapa (completo y corregido)
 * - Agrega listener para evento 'parqueoCreated'
 * - Fallback por AsyncStorage para recargar cuando la pantalla gana foco
 * - transformaciones defensivas a la nueva API
 * - **Sin WebSocket**: ahora sólo se obtiene la lista desde API_URL
 */

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

  // -------------------------
  // transformarParqueo: adaptado a la nueva estructura del backend
  // -------------------------
  const transformarParqueo = (p: any): ParqueoParaVista | null => {
    if (!p || typeof p !== 'object') return null;

    // Soportar distintas formas de naming
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

    const capacidades = Array.isArray(p.capacidades) ? p.capacidades : [];
    const disp = capacidades.some((c: any) => Number(c?.cantidad || 0) > 0);

    // Si no hay ID, generamos un fallback único basado en coordenadas
    const id = p.id ?? `${lat.toFixed(6)}_${lon.toFixed(6)}`;

    return {
      id,
      nombre: p.nombre || '?',
      direccion: p.direccion || 'Dirección no disponible',
      tipoLugar: p.tipoLugar || 'Estacionamiento',
      propietarioId: p.propietarioId ?? 0,
      latitud: lat,
      longitud: lon,
      latitude: lat, // duplicados para compatibilidad
      longitude: lon,
      horarios: Array.isArray(p.horarios) ? p.horarios : [],
      calificaciones: califs,
      capacidades: capacidades,
      servicios: Array.isArray(p.serviciosAsociados) ? p.serviciosAsociados : (p.servicios || []),
      plazas: Array.isArray(p.plazas) ? p.plazas : [],
      tarifas: Array.isArray(p.tarifas) ? p.tarifas : [],
      fotos: Array.isArray(p.fotos) ? p.fotos : [],
      rating: Number(rAvg.toFixed(1)),
      disponible: !!disp,
    } as ParqueoParaVista;
  };

  // -------------------------
  // fetchParqueos / reloadParqueos: obtiene lista desde API y transforma
  // -------------------------
  const fetchParqueos = useCallback(async () => {
    console.log('fetchParqueos: start');
    setIsLoadingApi(true);
    try {
      const response = await axios.get(API_URL);
      const remote = response?.data;

      if (!Array.isArray(remote)) {
        console.warn('Respuesta API parqueos no es array:', remote);
        setParqueos([]);
        return [];
      }

      const datosTransformados = remote
        .map(transformarParqueo)
        .filter((p: ParqueoParaVista | null): p is ParqueoParaVista => p !== null);

      setParqueos(datosTransformados);
      console.log('fetchParqueos: end, count=', datosTransformados.length);
      return datosTransformados;
    } catch (e: any) {
      console.error('Error cargando parqueos:', e);
      setErrorMsg('Error cargando parqueos. Revisa tu conexión.');
      return [];
    } finally {
      setIsLoadingApi(false);
    }
  }, []);

  // reloadParqueos — alias explícito para ser llamado desde fuera (POST)
  const reloadParqueos = useCallback(async () => {
    return await fetchParqueos();
  }, [fetchParqueos]);

  // Llamar al montar
  useEffect(() => {
    fetchParqueos();
  }, [fetchParqueos]);

  // -------------------------
  // DeviceEventEmitter listener + AsyncStorage fallback (para recargar cuando se crea un parqueo)
  // -------------------------
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('parqueoCreated', async () => {
      console.log('DeviceEventEmitter: parqueoCreated recibido -> fetchParqueos()');
      try {
        await fetchParqueos();
        // opcional: intentar centrar si se guardó coords en AsyncStorage
        const coordsStr = await AsyncStorage.getItem('parkado_last_coords');
        if (coordsStr) {
          try {
            const parsed = JSON.parse(coordsStr);
            if (parsed?.latitude && parsed?.longitude && mapRef.current && typeof mapRef.current.animateToRegion === 'function') {
              mapRef.current.animateToRegion({
                latitude: Number(parsed.latitude),
                longitude: Number(parsed.longitude),
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }, 500);
            }
            await AsyncStorage.removeItem('parkado_last_coords');
          } catch (err) {
            // ignore
            console.warn('No se pudo parsear parkado_last_coords:', err);
          }
        }
      } catch (e) {
        console.warn('Error fetchParqueos desde DeviceEventEmitter:', e);
      }
    });

    return () => {
      try { sub.remove(); } catch (err) { /* ignore */ }
    };
  }, [fetchParqueos]);

  // Fallback: cuando la pantalla gana foco, chequeamos flag en AsyncStorage
  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const checkFlag = async () => {
        try {
          const flag = await AsyncStorage.getItem('parkado_needs_reload');
          if (!mounted) return;
          if (flag === '1') {
            console.log('Flag found parkado_needs_reload -> recargando parqueos');
            await fetchParqueos();
            await AsyncStorage.removeItem('parkado_needs_reload');
            console.log('Flag removed parkado_needs_reload');
            // también intentar centrar en coords si existen
            const coordsStr = await AsyncStorage.getItem('parkado_last_coords');
            if (coordsStr) {
              try {
                const parsed = JSON.parse(coordsStr);
                if (parsed?.latitude && parsed?.longitude && mapRef.current && typeof mapRef.current.animateToRegion === 'function') {
                  mapRef.current.animateToRegion({
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

      return () => {
        mounted = false;
      };
    }, [fetchParqueos])
  );

  // -------------------------
  // Permisos y ubicación inicial
  // -------------------------
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

          if (mapRef.current && typeof mapRef.current.animateToRegion === 'function') {
            const newRegion = {
              ...coords,
              latitudeDelta: INITIAL_DELTA,
              longitudeDelta: INITIAL_DELTA,
            };
            try {
              mapRef.current.animateToRegion(newRegion, 500);
              setRegion(newRegion);
            } catch (err) {
              console.warn('animateToRegion falló durante ubicación inicial:', err);
            }
          } else {
            setRegion({
              ...coords,
              latitudeDelta: INITIAL_DELTA,
              longitudeDelta: INITIAL_DELTA,
            });
          }
        }
      } catch (error: any) {
        let errorMessage = 'No se pudo obtener tu ubicación actual. ';
        if (error?.code === 'CANCELLED') {
          errorMessage += 'La solicitud fue cancelada.';
        } else if (error?.code === 'UNAVAILABLE') {
          errorMessage += 'Servicio de ubicación no disponible.';
        } else if (error?.code === 'TIMEOUT') {
          errorMessage += 'Tiempo de espera agotado.';
        } else {
          errorMessage += 'Verifica tu conexión y servicios de ubicación.';
        }
        setErrorMsg(errorMessage);
      } finally {
        if (isMounted) setIsLocationLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // -------------------------
  // fetchRoute (OSRM)
  // -------------------------
  const fetchRoute = useCallback(
  async (origin: Coords, destinationCoords: Coords, destNombre?: string) => {
    setIsLoadingRoute(true);
    setRouteCoordinates([]);
    setShowDirections(false);

    console.log("🌍 Fetching route...");
    console.log("🛣️ Origen: ", origin);
    console.log("📍 Destino: ", destinationCoords);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?overview=full&geometries=geojson`;
      console.log("🌐 URL:", url);  // Log de la URL para verificar que la consulta es correcta

      const response = await axios.get(url);

      console.log("🚀 Response: ", response); // Verifica la respuesta completa de la API

      if (!response?.data || !Array.isArray(response.data.routes) || response.data.routes.length === 0) {
        throw new Error('No se encontró ruta disponible');
      }

      const geo = response.data.routes[0]?.geometry;
      console.log("🗺️ Ruta encontrada: ", geo);

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

      console.log("📍 Coordenadas de la ruta: ", coordinates);  // Verifica las coordenadas de la ruta

      setRouteCoordinates(coordinates as Coords[]);
      setShowDirections(true);

      if (mapRef.current && typeof mapRef.current.fitToCoordinates === 'function') {
        try {
          mapRef.current.fitToCoordinates([origin, destinationCoords], {
            edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
            animated: true,
          });
        } catch (err) {
          console.warn('fitToCoordinates falló:', err);
        }
      } else {
        console.warn('fitToCoordinates no disponible en mapRef.current');
      }
    } catch (error: any) {
      Alert.alert('Error', `No se pudo trazar la ruta${destNombre ? ` a ${destNombre}` : ''}.`);
      setShowDirections(false);
      console.error('Error fetchRoute:', error);
    } finally {
      setIsLoadingRoute(false);
    }
  },
  []
);


  // -------------------------
  // UI actions: centrar, zoom, marker press, clear, show directions
  // -------------------------
  const handleCenterOnUser = useCallback(async () => {
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

      if (mapRef.current && typeof mapRef.current.animateToRegion === 'function') {
        try {
          mapRef.current.animateToRegion(
            {
              ...newCoords,
              latitudeDelta: INITIAL_DELTA,
              longitudeDelta: INITIAL_DELTA,
            },
            1000
          );
          setRegion({
            ...newCoords,
            latitudeDelta: INITIAL_DELTA,
            longitudeDelta: INITIAL_DELTA,
          });
        } catch (err) {
          console.warn('animateToRegion falló al centrar en el usuario:', err);
        }
      } else if (mapRef.current && typeof mapRef.current.animateCamera === 'function') {
        try {
          mapRef.current.animateCamera({ center: newCoords, pitch: 0, heading: 0, altitude: 0 }, { duration: 1000 });
        } catch (err) {
          console.warn('animateCamera falló al centrar en el usuario:', err);
        }
      } else {
        setRegion({ ...newCoords, latitudeDelta: INITIAL_DELTA, longitudeDelta: INITIAL_DELTA });
      }
    } catch (error: any) {
      let errorMessage = 'No se pudo obtener tu ubicación actual. ';
      if (error?.code === 'CANCELLED') {
        errorMessage += 'La solicitud fue cancelada.';
      } else if (error?.code === 'UNAVAILABLE') {
        errorMessage += 'Los servicios de ubicación no están disponibles.';
      } else if (error?.code === 'TIMEOUT') {
        errorMessage += 'El tiempo de espera se agotado.';
      } else {
        errorMessage += 'Verifica tu conexión y configuración de ubicación.';
      }
      setErrorMsg(errorMessage);
      Alert.alert('Error de ubicación', errorMessage);
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

      if (mapRef.current && typeof mapRef.current.animateToRegion === 'function') {
        try {
          mapRef.current.animateToRegion(newR, 300);
        } catch (err) {
          console.warn('animateToRegion falló en handleZoom:', err);
        }
      } else {
        setRegion(newR);
      }
    },
    [region]
  );

  const handleMarkerPress = useCallback(
    (parqueo: ParqueoParaVista) => {
      setSelectedParking(parqueo);
      setShowDirections(false);
      setRouteCoordinates([]);

      if (region && mapRef.current && typeof mapRef.current.animateToRegion === 'function') {
        try {
          mapRef.current.animateToRegion(
            {
              latitude: parqueo.latitud,
              longitude: parqueo.longitud,
              latitudeDelta: region.latitudeDelta,
              longitudeDelta: region.longitudeDelta,
            },
            500
          );
        } catch (err) {
          console.warn('animateToRegion falló al pulsar marcador:', err);
        }
      } else {
        setRegion({
          latitude: parqueo.latitud,
          longitude: parqueo.longitud,
          latitudeDelta: region?.latitudeDelta ?? INITIAL_DELTA,
          longitudeDelta: region?.longitudeDelta ?? INITIAL_DELTA,
        });
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

    if (userLocation && mapRef.current && typeof mapRef.current.animateToRegion === 'function') {
      try {
        mapRef.current.animateToRegion(
          {
            ...userLocation,
            latitudeDelta: INITIAL_DELTA,
            longitudeDelta: INITIAL_DELTA,
          },
          300
        );
      } catch (err) {
        console.warn('animateToRegion falló en clearSelection (userLocation):', err);
      }
    } else if (mapRef.current && typeof mapRef.current.animateToRegion === 'function') {
      try {
        mapRef.current.animateToRegion(COCHABAMBA_REGION, 300);
      } catch (err) {
        console.warn('animateToRegion falló en clearSelection (COCHABAMBA_REGION):', err);
      }
    } else {
      setRegion(COCHABAMBA_REGION);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // -------------------------
  // Retorno del hook (incluye reloadParqueos)
  // -------------------------
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
    cerrarSoloPopup,

    // Utilities
    fetchParqueos, // para uso interno si lo necesitás
    reloadParqueos, // <-- LLAMA ESTO DESPUÉS DEL POST PARA RECARGAR EL MAPA
  };
};
