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
import { useRouter } from 'expo-router';

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

// Helpers de autocompletado
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
    return nombre.includes(q) || direccion.includes(q);
  });
};

const Mapa: React.FC = () => {
  const router = useRouter();

  const {
    // useMapa
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
    handleCenterOnUser,
    handleZoom,
    handleMarkerPress,
    handleClearSelection,
    cerrarSoloPopup,
    handleShowDirectionsFromPopup,
  } = useMapa();

  // Hook de búsqueda
  const {
    resultados: parqueosBusqueda,
    loading: loadingBusqueda,
    buscar,
  } = useBusqueda();

  // Estado de vista
  const [modoBusqueda, setModoBusqueda] = useState<'texto' | 'mapa'>('mapa');
  const [parqueosParaVista, setParqueosParaVista] = useState<ParqueoParaVista[]>([]);

  // Sugerencias
  const [sugerencias, setSugerencias] = useState<ParqueoParaVista[]>([]);

  // Filtros modal
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtrosActuales, setFiltrosActuales] = useState<any>({});

  // Cambiar lista según modo
  useEffect(() => {
    if (modoBusqueda === 'mapa') {
      setParqueosParaVista(parqueosUseMapa || []);
    } else {
      const convertidos =
        convertirArrayParqueoBusquedaAParaVista(parqueosBusqueda);
      setParqueosParaVista(convertidos);
    }
  }, [parqueosUseMapa, parqueosBusqueda, modoBusqueda]);

  // Control principal de búsqueda
  const handleBuscar = async (payload: string | any) => {
    try {
      if (typeof payload === 'string') {
        const q = payload.trim();
        if (!q || q.length < 3) {
          Alert.alert('Búsqueda', 'Escribe al menos 3 caracteres.');
          return;
        }
        await buscar({ q });
      } else {
        const opciones = { ...payload };

        // añadir lat/lng si no vienen
        if (!opciones.lat && region) {
          opciones.lat = region.latitude;
          opciones.lng = region.longitude;
        }

        // validaciones
        if (opciones.q && opciones.q.length > 0 && opciones.q.length < 3) {
          Alert.alert('Búsqueda', 'Escribe 3+ caracteres.');
          return;
        }

        await buscar(opciones);
      }

      setModoBusqueda('texto');
      setSugerencias([]);

      // centrar en primer resultado
      const convertidos =
        convertirArrayParqueoBusquedaAParaVista(parqueosBusqueda);
      if (convertidos.length > 0 && mapRef.current) {
        const first = convertidos[0];
        mapRef.current.animateToRegion(
          {
            latitude: first.latitud,
            longitude: first.longitud,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          1000
        );
      }

    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Ocurrió un error en la búsqueda.');
    }
  };

  // autocompletado
  const handleChangeTexto = (texto: string) => {
    const limpia = texto.trim();

    if (!limpia) {
      setSugerencias([]);
      return;
    }

    const matches = filtrarParqueosLocalmente(parqueosUseMapa || [], limpia);
    setSugerencias(matches.slice(0, 35));
  };

  const handleSeleccionSugerencia = async (parqueo: ParqueoParaVista) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: parqueo.latitud,
          longitude: parqueo.longitud,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        1000
      );
    }

    setSugerencias([]);
    await buscar({ q: parqueo.nombre });
    setModoBusqueda('texto');
  };

  const handleVolverAMapaCompleto = () => {
    setModoBusqueda('mapa');
    setSugerencias([]);

    if (mapRef.current) {
      mapRef.current.animateToRegion(COCHABAMBA_REGION, 1000);
    }
  };

  const handleParqueoPress = (parqueo: ParqueoParaVista) => {
    router.push(`/parqueo-detalle/${parqueo.id}`);
  };

  const getTituloResultados = () =>
    modoBusqueda === 'texto'
      ? `${parqueosParaVista.length} resultados`
      : `${parqueosParaVista.length} parqueos disponibles`;

  const getInfoAdicionalParqueo = (parqueo: ParqueoParaVista) => {
    if (modoBusqueda !== 'mapa') {
      const p = parqueosBusqueda.find((x) => x.id === parqueo.id);
      if (!p) return null;
      return {
        precio: p.precio_minimo_hora,
        plazasDisponibles: p.plazas_disponibles,
        distancia: p.distancia_metros,
        ratingPromedio: p.rating_promedio,
        totalCalificaciones: p.total_calificaciones,
      };
    }
    return null;
  };

  // Error ubicación
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
            onPress={handleCenterOnUser}
            className="bg-red-600 px-4 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Loading general
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

  return (
    <View className="flex-1">

      {/* BUSCADOR */}
      <BuscadorMapa
        onBuscar={handleBuscar}
        onChangeTexto={handleChangeTexto}
        loading={loadingBusqueda}
        onAbrirFiltros={() => setShowFiltros(true)}
      />

      {/* LISTA DE SUGERENCIAS */}
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
        routeCoordinates={routeCoordinates || []}
        showDirections={showDirections}
      />

      {/* UI */}
      <MapUI
        onCenterOnUser={handleCenterOnUser}
        onZoom={handleZoom}
        onClearRoute={handleClearSelection}
        isLocating={isLocating}
        showDirections={showDirections}
        isLoadingRoute={isLoadingRoute}
      />

      {/* LISTADO RESULTADOS (MODO TEXTO) */}
      {modoBusqueda === 'texto' && (
        <View className="absolute bottom-4 left-4 right-4">
          <View className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-bold text-black">{getTituloResultados()}</Text>

              <TouchableOpacity
                onPress={handleVolverAMapaCompleto}
                className="bg-[#7BB5CB] px-3 py-1 rounded-lg"
              >
                <Text className="text-white text-sm font-semibold">Ver todos</Text>
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
                  {parqueosParaVista.slice(0, 5).map((parqueo) => {
                    const info = getInfoAdicionalParqueo(parqueo);

                    return (
                      <TouchableOpacity
                        key={parqueo.id}
                        className="bg-[#7BB5CB] px-3 py-2 rounded-lg min-w-[140px]"
                        onPress={() => handleParqueoPress(parqueo)}
                      >
                        <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                          {parqueo.nombre}
                        </Text>
                        <Text className="text-white text-xs">
                          {info?.precio ? `${info.precio} Bs/h` : 'Consultar precio'}
                        </Text>
                        <Text className="text-white text-xs">
                          ⭐ {(info?.ratingPromedio ?? parqueo.rating).toFixed(1)} •{' '}
                          {info?.plazasDisponibles !== undefined
                            ? `${info.plazasDisponibles} plazas`
                            : parqueo.disponible
                            ? 'Disponible'
                            : 'No disponible'}
                        </Text>
                        {info?.distancia && (
                          <Text className="text-white text-xs">📍 {info.distancia}m</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
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
          onShowDirections={() => {
            if (selectedParking.latitud && selectedParking.longitud) {
              handleShowDirectionsFromPopup({
                latitude: selectedParking.latitud,
                longitude: selectedParking.longitud,
                name: selectedParking.nombre,
              });
            }
          }}
          showingDirections={showDirections || isLoadingRoute}
        />
      )}

      {/* FILTROS MODAL */}
      <FiltrosModal
        visible={showFiltros}
        onClose={() => setShowFiltros(false)}
        initial={filtrosActuales}
        serviciosDisponibles={[
          { id: 1, nombre: 'Lavado de autos' },
          { id: 2, nombre: 'Inflado de llantas' },
        ]}
        onApply={async (opciones) => {
          setFiltrosActuales(opciones);
          setShowFiltros(false);

          if (!opciones.lat && region) {
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
