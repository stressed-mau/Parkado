import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native'; 
import MapView, { Region, Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';

// --- TIPOS ---
type Parqueo = {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  horario: string;
  tarifa: string;
  disponible: boolean;
};

type RegionState = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const INITIAL_DELTA = 0.04;

// --- DATOS MOCKEADOS ---
const MOCK_PARQUEOS: Parqueo[] = [
  {
    id: 'p1',
    nombre: 'Central Parking',
    latitud: -17.3942,
    longitud: -66.1578,
    horario: 'L-D: 8:00 - 22:00',
    tarifa: '5 Bs/hora',
    disponible: true,
  },
  {
    id: 'p2',
    nombre: 'Parqueo El Prado (Lleno)',
    latitud: -17.3915,
    longitud: -66.1601,
    horario: 'L-V: 9:00 - 18:00',
    tarifa: '8 Bs/hora',
    disponible: false,
  },
  {
    id: 'p3',
    nombre: 'Parqueo Fantasma',
    latitud: 0,
    longitud: 0,
    horario: '24/7',
    tarifa: '10 Bs/hora',
    disponible: true,
  },
];

// ------------------------------------
// --- COMPONENTE PRINCIPAL ---
// ------------------------------------

export default function Mapa() {
  const mapRef = useRef<MapView | null>(null);
  const [region, setRegion] = useState<RegionState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permiso para acceder a la ubicación denegado.');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: INITIAL_DELTA,
          longitudeDelta: INITIAL_DELTA,
        });
      } catch (error) {
        setErrorMsg('Error al obtener la ubicación.');
      }
    })();
  }, []);

  const handleZoom = (factor: number) => {
    if (!region) return;
    const newRegion: Region = {
      ...region,
      latitudeDelta: region.latitudeDelta * factor,
      longitudeDelta: region.longitudeDelta * factor,
    };
    mapRef.current?.animateToRegion(newRegion, 300);
    setRegion(newRegion);
  };

  // --- Carga / Error ---
  if (errorMsg) {
    return (
      <View style={styles.containerCenter}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  if (!region) {
    return (
      <View style={styles.containerCenter}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  // --- Render ---
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        showsUserLocation
        onRegionChangeComplete={setRegion}
      >
        {MOCK_PARQUEOS.map((parqueo) => {
          if (parqueo.latitud === 0 && parqueo.longitud === 0) return null;

          const markerImageSource = parqueo.disponible
            ? require('../../assets/mapa/parking.png')
            : require('../../assets/mapa/parking_full.png');

          return (
            <Marker
              key={parqueo.id}
              coordinate={{ latitude: parqueo.latitud, longitude: parqueo.longitud }}
            >
              {/* Imagen personalizada dentro del marker */}
              <Image
                source={markerImageSource}
                style={styles.markerImage}
                resizeMode="contain"
              />

              <Callout tooltip>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{parqueo.nombre}</Text>
                  <Text style={styles.calloutDetail}>Horario: {parqueo.horario}</Text>
                  <Text style={styles.calloutDetail}>Tarifa: {parqueo.tarifa}</Text>
                  <Text
                    style={[
                      styles.calloutStatus,
                      parqueo.disponible ? styles.statusAvailable : styles.statusUnavailable,
                    ]}
                  >
                    {parqueo.disponible ? 'DISPONIBLE' : 'SIN ESPACIOS'}
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Botones Zoom */}
      <View style={styles.zoomControlsContainer}>
        <TouchableOpacity
          onPress={() => handleZoom(0.8)}
          style={[styles.zoomButton, styles.zoomButtonShadow, styles.zoomButtonTop]}
        >
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleZoom(1.25)}
          style={[styles.zoomButton, styles.zoomButtonShadow]}
        >
          <Text style={styles.zoomButtonText}>-</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ------------------------------------
// --- ESTILOS ---
// ------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { width: '100%', height: '100%' },
  loadingText: { marginTop: 8, fontSize: 16, color: '#4b5563' },
  errorText: { color: 'red', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },

  // Imagen de los markers (control del tamaño)
  markerImage: {
    width: 40,
    height: 40,
  },

  calloutContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    minWidth: 150,
  },
  calloutTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  calloutDetail: { fontSize: 14, color: '#333' },
  calloutStatus: {
    marginTop: 5,
    paddingVertical: 2,
    paddingHorizontal: 5,
    fontWeight: 'bold',
    fontSize: 12,
    borderRadius: 4,
    textAlign: 'center',
  },
  statusAvailable: { backgroundColor: '#D1FAE5', color: '#065F46' },
  statusUnavailable: { backgroundColor: '#FEE2E2', color: '#991B1B' },

  zoomControlsContainer: { position: 'absolute', bottom: 16, right: 16, zIndex: 10 },
  zoomButton: {
    backgroundColor: 'white',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonTop: { marginBottom: 8 },
  zoomButtonShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  zoomButtonText: { fontSize: 24, fontWeight: 'bold', color: '#4b5563' },
});
