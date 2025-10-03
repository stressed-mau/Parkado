import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'; 
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
// FontAwesome ya no es necesario, pero lo dejo por si lo usas en otro sitio

// Importar el componente de marcador
import ParqueoMarker from '../../components/ParqueoMarker'; 
// AJUSTA la ruta si es necesario

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
  { id: 'p1', nombre: 'Central Parking', latitud: -17.3942, longitud: -66.1578, horario: 'L-D: 8:00 - 22:00', tarifa: '5 Bs/hora', disponible: true, },
  { id: 'p2', nombre: 'Parqueo El Prado (Lleno)', latitud: -17.3915, longitud: -66.1601, horario: 'L-V: 9:00 - 18:00', tarifa: '8 Bs/hora', disponible: false, },
  { id: 'p3', nombre: 'Parqueo Fantasma', latitud: 0, longitud: 0, horario: '24/7', tarifa: '10 Bs/hora', disponible: true, },
  { id: 'p4', nombre: 'Terminal Sur', latitud: -17.3990, longitud: -66.1625, horario: '24/7', tarifa: '6 Bs/hora', disponible: true, },
  { id: 'p5', nombre: 'Supermercado H', latitud: -17.3955, longitud: -66.1650, horario: 'L-S: 8:00 - 21:00', tarifa: '7 Bs/hora', disponible: false, },
  { id: 'p6', nombre: 'Cine Center', latitud: -17.3870, longitud: -66.1585, horario: '24/7', tarifa: '10 Bs/hora', disponible: true, },
  { id: 'p7', nombre: 'Av. Heroínas', latitud: -17.3850, longitud: -66.1540, horario: 'L-V: 7:00 - 19:00', tarifa: '5 Bs/hora', disponible: false, },
  { id: 'p8', nombre: 'Parque de la Familia', latitud: -17.3895, longitud: -66.1505, horario: '24/7', tarifa: '8 Bs/hora', disponible: true, },
  { id: 'p9', nombre: 'Zona Norte', latitud: -17.3800, longitud: -66.1610, horario: 'L-S: 8:00 - 20:00', tarifa: '9 Bs/hora', disponible: false, },
  { id: 'p10', nombre: 'Calle Calama', latitud: -17.4010, longitud: -66.1640, horario: 'L-D: 6:00 - 23:00', tarifa: '5 Bs/hora', disponible: true, },
  { id: 'p11', nombre: 'Mercado La Cancha', latitud: -17.3970, longitud: -66.1680, horario: 'L-S: 6:00 - 18:00', tarifa: '7 Bs/hora', disponible: false, },
  { id: 'p12', nombre: 'Av. América', latitud: -17.3840, longitud: -66.1670, horario: '24/7', tarifa: '10 Bs/hora', disponible: true, },
];

// ------------------------------------
// --- COMPONENTE PRINCIPAL ---
// ------------------------------------

export default function Mapa() {
  const mapRef = useRef<MapView | null>(null);
  const [region, setRegion] = useState<RegionState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 💡 Estados eliminados: [isPlacing] y [tempMarkers]

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
  
  // 💡 Función handleMapPress eliminada

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
        // onPress={handleMapPress} <-- Evento eliminado
      >
        {/* MARCADORES MOCKEADOS EXISTENTES */}
        {MOCK_PARQUEOS.map((parqueo) => (
            <ParqueoMarker key={parqueo.id} parqueo={parqueo as any} />
        ))}

        {/* 💡 Marcadores temporales eliminados */}
      </MapView>

      {/* Botones Zoom (mantenidos) */}
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
      
      {/* 💡 Herramienta provisional para agregar marcadores eliminada */}
    </View>
  );
}

// ------------------------------------
// --- ESTILOS (limpiados) ---
// ------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { width: '100%', height: '100%' },
  loadingText: { marginTop: 8, fontSize: 16, color: '#4b5563' },
  errorText: { color: 'red', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },

  // 💡 Estilos del botón de herramienta eliminados (toolButton, toolButtonInactive, etc.)

  // ESTILOS DEL ZOOM (mantenidos)
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