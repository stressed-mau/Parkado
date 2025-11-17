import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useMapa } from '../../hooks/useMapa';
import { useBusqueda } from '../../hooks/useBusqueda';
import MapLayer from '../../components/Mapa/MapLayer';
import MapUI from '../../components/Mapa/MapUi';
import ParkeoPopup from '../../components/Mapa/ParkeoPopup';
import { BuscadorMapa } from '../../components/Mapa/BuscadorMapa';
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
    // Refs
    mapRef,

    // State
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

    // Actions
    setRegion,
    handleCenterOnUser,
    handleZoom,
    handleMarkerPress,
    handleClearSelection,
    cerrarSoloPopup,
    handleShowDirectionsFromPopup,
  } = useMapa();

  // Hook de búsqueda (solo texto)
  const {
    resultados: parqueosBusqueda,
    loading: loadingBusqueda,
    buscarPorTexto,
  } = useBusqueda();

  // Modo de visualización: mapa completo o resultados de texto
  const [modoBusqueda, setModoBusqueda] = useState<'texto' | 'mapa'>('mapa');
  const [parqueosParaVista, setParqueosParaVista] = useState<ParqueoParaVista[]>(
    []
  );

  // Sugerencias de autocompletado local
  const [sugerencias, setSugerencias] = useState<ParqueoParaVista[]>([]);

  // Actualizar lista de parqueos que se dibujan en el mapa
  useEffect(() => {
    if (modoBusqueda === 'mapa') {
      setParqueosParaVista(parqueosUseMapa || []);
    } else {
      const parqueosConvertidos =
        convertirArrayParqueoBusquedaAParaVista(parqueosBusqueda);
      setParqueosParaVista(parqueosConvertidos);
    }
  }, [parqueosUseMapa, parqueosBusqueda, modoBusqueda]);

  // Buscar por texto (backend) cuando el usuario confirma
  const handleBuscar = async (query: string) => {
    const limpia = query.trim();
    if (limpia.length < 3) {
      // opcional: mostrar aviso
      return;
    }

    await buscarPorTexto(limpia);
    setModoBusqueda('texto');
    setSugerencias([]);

    // Centrar el mapa en el primer resultado si existe
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
  };

  // Actualizar sugerencias locales mientras el usuario escribe
  const handleChangeTexto = (texto: string) => {
  const limpia = texto.trim();

  // Si está vacío, limpiar sugerencias
  if (!limpia) {
    setSugerencias([]);
    return;
  }

  const matches = filtrarParqueosLocalmente(parqueosUseMapa || [], limpia);
  setSugerencias(matches.slice(0, 35));
};

  const handleSeleccionSugerencia = async (parqueo: ParqueoParaVista) => {
    // Centrar mapa en el parqueo
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

    // Opcional: disparar búsqueda por texto para traer info extra del backend
    await buscarPorTexto(parqueo.nombre);
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

  const getTituloResultados = () => {
    if (modoBusqueda === 'texto') {
      return `${parqueosParaVista.length} resultados encontrados`;
    }
    return `${parqueosParaVista.length} parqueos disponibles`;
  };

  const getInfoAdicionalParqueo = (parqueo: ParqueoParaVista) => {
    if (modoBusqueda !== 'mapa') {
      const parqueoBusqueda = parqueosBusqueda.find((p) => p.id === parqueo.id);
      if (parqueoBusqueda) {
        return {
          precio: parqueoBusqueda.precio_minimo_hora,
          plazasDisponibles: parqueoBusqueda.plazas_disponibles,
          distancia: parqueoBusqueda.distancia_metros,
          ratingPromedio: parqueoBusqueda.rating_promedio,
          totalCalificaciones: parqueoBusqueda.total_calificaciones,
        };
      }
    }
    return null;
  };

  // Vista de error
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
          <TouchableOpacity
            onPress={() => {
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

  // Vista de carga
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
      {/* Buscador con autocompletado */}
      <BuscadorMapa
        onBuscar={handleBuscar}
        onChangeTexto={handleChangeTexto}
        loading={loadingBusqueda}
      />

            {/* Lista de sugerencias debajo del buscador */}
      {sugerencias.length > 0 && (
        <View className="absolute top-24 left-8 right-8 bg-white rounded-xl shadow-lg z-10 max-h-56 border border-gray-200">
          <ScrollView keyboardShouldPersistTaps="handled">
            {sugerencias.map((p) => (
              <TouchableOpacity
                key={p.id}
                className="px-3 py-2 border-b border-gray-100"
                onPress={() => handleSeleccionSugerencia(p)}
              >
                <Text
                  className="text-black font-semibold text-sm"
                  numberOfLines={1}
                >
                  {p.nombre}
                </Text>
                <Text
                  className="text-gray-500 text-xs"
                  numberOfLines={1}
                >
                  {p.direccion}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}


      {/* Capa del mapa */}
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

      {/* Controles de UI */}
      <MapUI
        onCenterOnUser={handleCenterOnUser}
        onZoom={handleZoom}
        onClearRoute={handleClearSelection}
        isLocating={isLocating}
        showDirections={showDirections}
        isLoadingRoute={isLoadingRoute}
      />

      {/* Panel inferior solo en modo texto */}
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
                <Text className="text-white text-sm font-semibold">
                  Ver todos
                </Text>
              </TouchableOpacity>
            </View>

            {loadingBusqueda && (
              <View className="flex-row items-center justify-center py-2">
                <ActivityIndicator size="small" color="#7BB5CB" />
                <Text className="text-gray-600 ml-2">
                  Buscando parqueos...
                </Text>
              </View>
            )}

            {!loadingBusqueda && parqueosParaVista.length === 0 && (
              <Text className="text-gray-600 text-center py-2">
                No se encontraron parqueos. Intenta con otro nombre o
                dirección.
              </Text>
            )}

            {!loadingBusqueda && parqueosParaVista.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-2"
              >
                <View className="flex-row gap-2">
                  {parqueosParaVista.slice(0, 5).map((parqueo) => {
                    const infoAdicional = getInfoAdicionalParqueo(parqueo);

                    return (
                      <TouchableOpacity
                        key={parqueo.id}
                        className="bg-[#7BB5CB] px-3 py-2 rounded-lg min-w-[140px]"
                        onPress={() => handleParqueoPress(parqueo)}
                      >
                        <Text
                          className="text-white font-semibold text-sm"
                          numberOfLines={1}
                        >
                          {parqueo.nombre}
                        </Text>
                        <Text className="text-white text-xs">
                          {infoAdicional?.precio
                            ? `${infoAdicional.precio} Bs/h`
                            : 'Consultar precio'}
                        </Text>
                        <Text className="text-white text-xs">
                          ⭐{' '}
                          {(
                            infoAdicional?.ratingPromedio ?? parqueo.rating
                          ).toFixed(1)}{' '}
                          •{' '}
                          {infoAdicional?.plazasDisponibles !== undefined
                            ? ` ${infoAdicional.plazasDisponibles} plazas`
                            : ` ${
                                parqueo.disponible
                                  ? 'Disponible'
                                  : 'No disponible'
                              }`}
                        </Text>
                        {infoAdicional?.distancia && (
                          <Text className="text-white text-xs">
                            📍 {infoAdicional.distancia}m
                          </Text>
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

      {/* Popup de info del parqueo */}
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
    </View>
  );
};

export default Mapa;
