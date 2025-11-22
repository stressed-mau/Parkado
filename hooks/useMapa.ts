// useMapa.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { Coords, ParqueoParaVista } from '../types/mapa';
import { API_URL, WEBSOCKET_URL, INITIAL_DELTA, COCHABAMBA_REGION } from '../constants/mapa';

/**
 * Hook useMapa (versión corregida)
 * - transformaciones actualizadas a la nueva API
 * - manejo de WebSocket robusto y seguro
 */

export const useMapa = () => {
  const params = useLocalSearchParams<{ destLat?: string; destLng?: string; destNombre?: string }>();
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const ws = useRef<WebSocket | null>(null);

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
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  // -------------------------
  // transformarParqueo: adaptado a la nueva estructura del backend
  // -------------------------
  const transformarParqueo = (p: any): ParqueoParaVista | null => {
    if (!p || typeof p !== 'object') return null;

    // latitud/longitud puede venir como number o string
    const lat = Number(p.latitud);
    const lon = Number(p.longitud);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      // no tenemos coordenadas válidas
      return null;
    }

    // rating (si existen calificaciones)
    const califs = Array.isArray(p.calificaciones) ? p.calificaciones : [];
    const rAvg =
      califs.length > 0
        ? califs.reduce((s: number, c: any) => s + (Number(c.puntuacion || 0) || 0), 0) / califs.length
        : 0;

    // disponibilidad: si capacidades tiene cantidad > 0 para algún tipo
    const capacidades = Array.isArray(p.capacidades) ? p.capacidades : [];
    const disp = capacidades.some((c: any) => Number(c?.cantidad || 0) > 0);

    return {
      // si backend no provee id, lo guardamos como null—luego manejamos este caso en el handler
      id: p.id ?? null,
      nombre: p.nombre || '?',
      direccion: p.direccion || 'Dirección no disponible',
      tipoLugar: p.tipoLugar || 'Estacionamiento',
      propietarioId: p.propietarioId ?? 0,
      latitud: lat,
      longitud: lon,
      horarios: Array.isArray(p.horarios) ? p.horarios : [],
      calificaciones: califs,
      capacidades: capacidades,
      servicios: Array.isArray(p.serviciosAsociados) ? p.serviciosAsociados : (p.servicios || []), // ahora viene como array de IDs
      plazas: Array.isArray(p.plazas) ? p.plazas : [], // ya no se usa, pero lo mantenemos por compatibilidad
      tarifas: Array.isArray(p.tarifas) ? p.tarifas : [],
      fotos: Array.isArray(p.fotos) ? p.fotos : [],
      rating: Number(rAvg.toFixed(1)),
      disponible: !!disp,
    } as ParqueoParaVista;
  };

  // -------------------------
  // WebSocket: conexión con reconexión y handler flexible
  // -------------------------
  useEffect(() => {
    let isUnmounted = false;
    let reconnectAttempts = 0;
    const maxReconnect = 8;

    const connectWebSocket = () => {
      try {
        // Si ya hay una conexión abierta o en proceso, no re-creamos otra
        if (ws.current && (ws.current.readyState === 0 || ws.current.readyState === 1)) {
          console.log('WebSocket ya conectado o conectándose, readyState=', ws.current.readyState);
          return;
        }

        console.log('Conectando WebSocket a', WEBSOCKET_URL);
        ws.current = new WebSocket(WEBSOCKET_URL);

        ws.current.onopen = () => {
          console.log('WebSocket conectado (onopen).');
          setIsWebSocketConnected(true);
          reconnectAttempts = 0;
        };

        ws.current.onmessage = (e) => {
          // Log RAW para debugging (puedes comentar luego)
          console.log('WS RAW message:', typeof e.data === 'string' ? e.data : e.data);

          try {
            // Aceptamos: objeto único (parqueo), wrapper {event, data}, o array
            const parsed = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;

            // Si el servidor envía un wrapper { event, data }
            if (parsed && typeof parsed === 'object' && parsed.event && parsed.data) {
              handleIncomingPayload(parsed.data, parsed.event);
              return;
            }

            // Si recibimos un array de parqueos
            if (Array.isArray(parsed)) {
              parsed.forEach(item => handleIncomingPayload(item, 'bulk'));
              return;
            }

            // Si es un objeto individual (probablemente un parqueo)
            handleIncomingPayload(parsed, 'single');
          } catch (err) {
            console.error('Error al parsear mensaje WS:', err, 'raw:', e.data);
          }
        };

        ws.current.onerror = (e: any) => {
          console.error('WebSocket error (onerror):', e);
          setIsWebSocketConnected(false);
        };

        ws.current.onclose = (e) => {
          console.warn('WebSocket cerrado. code=', e?.code, 'reason=', e?.reason, 'wasClean=', e?.wasClean);
          setIsWebSocketConnected(false);

          if (isUnmounted) return;

          // Backoff exponencial simple
          if (reconnectAttempts < maxReconnect) {
            const delay = Math.min(30000, 1000 * Math.pow(2, reconnectAttempts));
            reconnectAttempts++;
            console.log(`Reintentando conectar WS en ${delay} ms (attempt ${reconnectAttempts})`);
            setTimeout(() => {
              // sólo reconectar si no hay una conexión viva
              if (!ws.current || ws.current.readyState === WebSocket.CLOSED) connectWebSocket();
            }, delay);
          } else {
            console.warn('Máximo intentos de reconexión alcanzado para WS.');
          }
        };
      } catch (error) {
        console.error('Excepción al crear WebSocket:', error);
        setIsWebSocketConnected(false);
      }
    };

    // Maneja payloads entrantes desde el WS
    const handleIncomingPayload = (payload: any, eventType: string) => {
      if (!payload) return;
      // Si el payload es un objeto que contiene un campo "parqueo" o "data", intentamos normalizar
      const maybeParqueo = payload.parqueo ?? payload.data ?? payload;

      const parqueoTransformado = transformarParqueo(maybeParqueo);
      if (!parqueoTransformado) {
        console.warn('Payload WS no corresponde a un parqueo válido:', payload);
        return;
      }

      // Si no hay ID, no podemos hacer match con la lista existente => lo agregamos (o descartamos segun tu logica)
      if (!parqueoTransformado.id) {
        console.warn('Parqueo recibido sin ID — se ignorará la actualización en la lista existente. Considera que el backend devuelva id.');
        // Opcional: si quieres añadirlo a la lista:
        // setParqueos(prev => [...prev, parqueoTransformado]);
        return;
      }

      // Actualizar lista existente
      setParqueos(prevParqueos => {
        let found = false;
        const next = prevParqueos.map(p => {
          if (p.id === parqueoTransformado.id) {
            found = true;
            return parqueoTransformado;
          }
          return p;
        });

        // Si no estaba en la lista, lo añadimos (opcional)
        if (!found) {
          return [...next, parqueoTransformado];
        }
        return next;
      });

      // Si el parqueo seleccionado es el mismo, lo actualizamos
      setSelectedParking(prev => (prev && prev.id === parqueoTransformado.id ? parqueoTransformado : prev));
    };

    connectWebSocket();

    return () => {
      isUnmounted = true;
      if (ws.current) {
        try {
          ws.current.close();
        } catch (err) {
          // ignore
        }
        ws.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedParking]);

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
        let errorMessage = 'No se pudo obtener la ubicación inicial. ';
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
  // Cargar parqueos desde la API (GET)
  // -------------------------
  useEffect(() => {
    let isMounted = true;
    const fetchAndTransformParqueos = async () => {
      setIsLoadingApi(true);
      try {
        const response = await axios.get(API_URL);
        const remote = response?.data;

        if (!Array.isArray(remote)) {
          console.warn('Respuesta API parqueos no es array:', remote);
          if (isMounted) setParqueos([]);
          return;
        }

        const datosTransformados = remote
          .map(transformarParqueo)
          .filter((p: ParqueoParaVista | null): p is ParqueoParaVista => p !== null);

        if (isMounted) setParqueos(datosTransformados);
      } catch (e: any) {
        console.error('Error cargando parqueos:', e);
        if (isMounted) setErrorMsg('Error cargando parqueos. Revisa tu conexión.');
      } finally {
        if (isMounted) setIsLoadingApi(false);
      }
    };

    fetchAndTransformParqueos();
    return () => {
      isMounted = false;
    };
  }, []);

  // -------------------------
  // Detectar params de ruta
  // -------------------------
  useEffect(() => {
    const { destLat, destLng, destNombre } = params;

    if (destLat && destLng && destNombre && userLocation) {
      const targetLocation = {
        latitude: parseFloat(destLat),
        longitude: parseFloat(destLng),
      };

      if (
        destination?.latitude === targetLocation.latitude &&
        destination?.longitude === targetLocation.longitude
      ) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, userLocation]);

  // -------------------------
  // fetchRoute (sin cambios funcionales, sólo validaciones)
  // -------------------------
  const fetchRoute = useCallback(
    async (origin: Coords, destinationCoords: Coords, destNombre?: string) => {
      setIsLoadingRoute(true);
      setRouteCoordinates([]);
      setShowDirections(false);

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?overview=full&geometries=geojson`;
        const response = await axios.get(url);

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
  // Acciones (centrar, zoom, marcadores, etc.)
  // -------------------------
  const handleCenterOnUser = useCallback(async () => {
    setIsLocating(true);
    setErrorMsg(null);

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          'Ubicación desactivada',
          'Los servicios de ubicación están desactivados. Por favor, actívalos en la configuración de tu dispositivo.',
          [{ text: 'OK' }]
        );
        return;
      }

      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        status = newStatus;
      }

      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se necesita permiso de ubicación para centrar el mapa en tu ubicación actual.', [
          { text: 'OK' },
        ]);
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
          mapRef.current.animateCamera(
            {
              center: newCoords,
              pitch: 0,
              heading: 0,
              altitude: 0,
            },
            { duration: 1000 }
          );
        } catch (err) {
          console.warn('animateCamera falló al centrar en el usuario:', err);
        }
      } else {
        setRegion({
          ...newCoords,
          latitudeDelta: INITIAL_DELTA,
          longitudeDelta: INITIAL_DELTA,
        });
      }
    } catch (error: any) {
      let errorMessage = 'No se pudo obtener tu ubicación actual. ';
      if (error?.code === 'CANCELLED') {
        errorMessage += 'La solicitud fue cancelada.';
      } else if (error?.code === 'UNAVAILABLE') {
        errorMessage += 'Los servicios de ubicación no están disponibles. Verifica que la ubicación esté activada en tu dispositivo.';
      } else if (error?.code === 'TIMEOUT') {
        errorMessage += 'El tiempo de espera se agotado. Intenta nuevamente.';
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
  // Retorno del hook
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
    isWebSocketConnected,

    // actions
    setRegion,
    setSelectedParking,
    handleCenterOnUser,
    handleZoom,
    handleMarkerPress,
    handleClearSelection,
    handleShowDirectionsFromPopup,
    cerrarSoloPopup,
  };
};
