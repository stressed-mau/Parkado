// screens/Mapa.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useMapa } from '../../hooks/useMapa';
import { useBusqueda } from '../../hooks/useBusqueda';

import MapLayer from '../../components/Mapa/MapLayer';
import MapUI from '../../components/Mapa/MapUi';
import ParkeoPopup from '../../components/Mapa/ParkeoPopup';
import BuscadorMapa from '../../components/Mapa/BuscadorMapa';
import FiltrosModal from '../../components/Mapa/FiltrosModal';

import { COCHABAMBA_REGION } from '../../constants/mapa';
import {
  ParqueoParaVista,
  convertirArrayParqueoBusquedaAParaVista,
} from '../../types/mapa';

// ------------------------
// Helpers
// ------------------------
const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const filtrarParqueosLocalmente = (
  parqueos: ParqueoParaVista[],
  query: string
) => {
  const q = normalizar(query.trim());
  if (!q) return [];

  return parqueos.filter((p) => {
  const nombre = normalizar(p.nombre || '');
  const direccion = normalizar(p.direccion || '');
  return nombre.startsWith(q) || direccion.startsWith(q);
});

};

// =====================================================
//                COMPONENTE PRINCIPAL MAPA
// =====================================================

const Mapa: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    destLat?: string;
    destLng?: string;
    destNombre?: string;
  }>();

  // Hook principal de mapa
  const {
    mapRef,
    region,
    userLocation,
    errorMsg,
    selectedParking,
    parqueos: parqueosUseMapa,
    isLoadingApi,
    isLocationLoading,
    destination,
    routeCoordinates,
    isLoadingRoute,
    showDirections,
    isLocating,
    setRegion,
    setDestination,          // <-- agregado desde useMapa
    handleCenterOnUser,
    handleZoom,
    handleMarkerPress,
    handleClearSelection,
    cerrarSoloPopup,
    handleShowDirectionsFromPopup,
    fetchRoute,              // <-- expuesto explícitamente
  } = useMapa();

  // Hook de búsqueda
  const {
  resultados: parqueosBusqueda,
  loading: loadingBusqueda,
  buscarPorTexto,
  buscarConFiltros,
} = useBusqueda();


  // Estado interno
  const [modoBusqueda, setModoBusqueda] = useState<'texto' | 'mapa'>('mapa');
  const [parqueosParaVista, setParqueosParaVista] = useState<ParqueoParaVista[]>([]);
  const [sugerencias, setSugerencias] = useState<ParqueoParaVista[]>([]);
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtrosActuales, setFiltrosActuales] = useState<Record<string, any>>({});

  // ------------------------------------------
  // Cambia lista al alternar entre búsqueda y mapa
  // ------------------------------------------
  useEffect(() => {
    if (modoBusqueda === 'mapa') {
      setParqueosParaVista(parqueosUseMapa || []);
    } else {
      const convertidos = convertirArrayParqueoBusquedaAParaVista(parqueosBusqueda);
      setParqueosParaVista(convertidos);
    }
  }, [parqueosUseMapa, parqueosBusqueda, modoBusqueda]);

  // ------------------------------------------
  // Manejo del destino desde URL (parámetros)
  // ------------------------------------------
  useEffect(() => {
    const latStr = params.destLat;
    const lngStr = params.destLng;

    if (!latStr || !lngStr) return;

    const lat = Number(latStr);
    const lng = Number(lngStr);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      console.warn('Coordenadas inválidas en params:', params);
      return;
    }

    const destCoords = { latitude: lat, longitude: lng };
    setDestination(destCoords);

    setRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });

    if (userLocation) {
      fetchRoute(userLocation, destCoords, params.destNombre);
    }

    router.setParams({
      destLat: undefined,
      destLng: undefined,
      destNombre: undefined,
    });

  }, [params.destLat, params.destLng, params.destNombre, userLocation, fetchRoute]);

  // ------------------------------------------
  // Acción principal de búsqueda
  // ------------------------------------------
  const handleBuscar = async (payload: string | Record<string, any>) => {
  try {
    if (typeof payload === 'string') {
      const q = payload.trim();
      if (!q || q.length < 1) {
        setModoBusqueda('mapa');
        return;
      }

      await buscarPorTexto(q);
    } else {
      const opciones = { ...payload };

      if (!opciones.lat && region) {
        opciones.lat = region.latitude;
        opciones.lng = region.longitude;
      }

      await buscarConFiltros(opciones);
    }

    setModoBusqueda('texto');
    setSugerencias([]);

  } catch (err) {
    console.error(err);
    Alert.alert('Error', 'Ocurrió un error en la búsqueda.');
  }
};


  // ------------------------------------------
  // Autocompletado
  // ------------------------------------------
  const handleChangeTexto = (txt: string) => {
    const clean = txt.trim();
    if (!clean) {
      setSugerencias([]);
      return;
    }
    const matches = filtrarParqueosLocalmente(parqueosUseMapa, clean);
    setSugerencias(matches.slice(0, 35));
  };

  const handleSeleccionSugerencia = async (p: ParqueoParaVista) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: p.latitud,
          longitude: p.longitud,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        1000
      );
    }
    setSugerencias([]);
    await buscarPorTexto(p.nombre);

    setModoBusqueda('texto');
  };

  const handleVolverAMapaCompleto = () => {
    setModoBusqueda('mapa');
    setSugerencias([]);
    if (mapRef.current) {
      mapRef.current.animateToRegion(COCHABAMBA_REGION, 1000);
    }
  };

  const handleParqueoPress = (p: ParqueoParaVista) => {
    router.push(`/parqueo-detalle/${p.id}`);
  };

  const getTituloResultados = () =>
    modoBusqueda === 'texto'
      ? `${parqueosParaVista.length} resultados`
      : `${parqueosParaVista.length} parqueos disponibles`;

  // ------------------------------------------
  // Manejo errores ubicación
  // ------------------------------------------
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
        <TouchableOpacity
          onPress={handleCenterOnUser}
          className="bg-red-600 px-4 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ------------------------------------------
  // Loading general
  // ------------------------------------------
  if (!region || isLoadingApi || isLocationLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-2 text-base text-gray-500">
          {isLocationLoading
            ? 'Obteniendo ubicación...'
            : 'Cargando parqueos...'}
        </Text>
      </View>
    );
  }

  // =====================================================
  //                     RENDER PRINCIPAL
  // =====================================================

  return (
    <View className="flex-1">

      {/* BUSCADOR */}
      <BuscadorMapa
        onBuscar={handleBuscar}
        onChangeTexto={handleChangeTexto}
        loading={loadingBusqueda}
        onAbrirFiltros={() => setShowFiltros(true)}
      />

      {/* AUTOCOMPLETE */}
      {sugerencias.length > 0 && (
        <View className="absolute top-24 left-8 right-8 bg-white rounded-xl shadow-lg z-10 max-h-56 border border-gray-200">
          <ScrollView keyboardShouldPersistTaps="handled">
            {sugerencias.map((p) => (
              <TouchableOpacity
                key={p.id}
                className="px-3 py-2 border-b border-gray-100"
                onPress={() => handleSeleccionSugerencia(p)}
              >
                <Text className="text-black font-semibold text-sm" numberOfLines={1}>
                  {p.nombre}
                </Text>
                <Text className="text-gray-500 text-xs" numberOfLines={1}>
                  {p.direccion}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* MAPA */}
      <MapLayer
        mapRef={mapRef}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={cerrarSoloPopup}
        userLocation={userLocation}
        parqueos={parqueosParaVista}
        onMarkerPress={handleMarkerPress}
        destination={destination}
        routeCoordinates={routeCoordinates}
        showDirections={showDirections}
      />

      {/* BOTONES DEL MAPA */}
      <MapUI
        onCenterOnUser={handleCenterOnUser}
        onZoom={handleZoom}
        onClearRoute={handleClearSelection}
        isLocating={isLocating}
        showDirections={showDirections}
        isLoadingRoute={isLoadingRoute}
      />

      {/* RESULTADOS EN MODO TEXTO */}
      {modoBusqueda === 'texto' && (
        <View className="absolute bottom-4 left-4 right-4">
          <View className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-bold text-black">
                {getTituloResultados()}
              </Text>

              <TouchableOpacity
                onPress={handleVolverAMapaCompleto}
                className="bg-[#7BB5CB] px-3 py-1 rounded-lg"
              >
                <Text className="text-white text-sm font-semibold">Cancelar</Text>
              </TouchableOpacity>
            </View>

            {loadingBusqueda && (
              <View className="flex-row items-center justify-center py-2">
                <ActivityIndicator size="small" color="#7BB5CB" />
                <Text className="text-gray-600 ml-2">Buscando parqueos...</Text>
              </View>
            )}

            {!loadingBusqueda && parqueosParaVista.length === 0 && (
              <Text className="text-gray-600 text-center py-2">
                No se encontraron parqueos.
              </Text>
            )}

            {!loadingBusqueda && parqueosParaVista.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
                <View className="flex-row gap-2">
                  {parqueosParaVista.slice(0, 5).map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      className="bg-[#7BB5CB] px-3 py-2 rounded-lg min-w-[140px]"
                      onPress={() => handleParqueoPress(p)}
                    >
                      <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                        {p.nombre}
                      </Text>
                      <Text className="text-white text-xs">
                        ⭐ {p.rating.toFixed(1)}
                      </Text>
                      <Text className="text-white text-xs">
                        {p.disponible ? 'Disponible' : 'No disponible'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      )}

      {/* POPUP */}
      {selectedParking && (
        <ParkeoPopup
          details={selectedParking}
          onClose={cerrarSoloPopup}
          onShowDirections={() =>
            handleShowDirectionsFromPopup({
              latitude: selectedParking.latitud,
              longitude: selectedParking.longitud,
              name: selectedParking.nombre,
            })
          }
          showingDirections={showDirections || isLoadingRoute}
        />
      )}

      {/* FILTROS */}
     <FiltrosModal
  visible={showFiltros}
  onClose={() => setShowFiltros(false)}
  initial={filtrosActuales}
  serviciosDisponibles={[
    { id: 1, nombre: 'Lavado de autos' },
    { id: 2, nombre: 'Inflado de llantas' },
  ]}
  onApply={async (opciones: Record<string, any>) => {
    setFiltrosActuales(opciones);
    setShowFiltros(false);

    // 🔥 SOLO si se ordena por distancia
    if (opciones.sort === 'distancia') {
      if (!region) {
        Alert.alert(
          'Ubicación no disponible',
          'No se puede ordenar por distancia sin ubicación actual.'
        );
        return;
      }

      opciones.lat = region.latitude;
      opciones.lng = region.longitude;
    }

    await handleBuscar(opciones);
  }}
/>

    </View>
  );
};

export default Mapa;
