// ----------------------------------------------------
// ARCHIVO: ParqueoMarker.tsx (¡SOLO ESTO!)
// ----------------------------------------------------
import React from 'react';
import { Image, StyleSheet, View, Text } from 'react-native';
import { Marker, Callout } from 'react-native-maps';

// Definición de tipos para las propiedades del Parqueo
type Parqueo = {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  horario: string;
  tarifa: string;
  disponible: boolean;
};

// Definición de las props que recibirá el componente
interface ParqueoMarkerProps {
  parqueo: Parqueo;
}

const ParqueoMarker: React.FC<ParqueoMarkerProps> = ({ parqueo }) => {
  // 💡 Lógica central: decide qué imagen usar
  // ASEGÚRATE DE QUE LA RUTA DE LAS IMÁGENES ES CORRECTA AQUÍ:
  const markerImageSource = parqueo.disponible
    ? require('../assets/mapa/parking.png') 
    : require('../assets/mapa/parking_full.png'); 

  // No renderizar marcadores "fantasmas"
  if (parqueo.latitud === 0 && parqueo.longitud === 0) return null;

  return (
    <Marker
      key={parqueo.id}
      coordinate={{ latitude: parqueo.latitud, longitude: parqueo.longitud }}
      zIndex={parqueo.disponible ? 1 : 0} 
    >
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
};

const styles = StyleSheet.create({
  markerImage: {
    width: 40,
    height: 40,
  },
// ... el resto de los estilos del marcador
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
});

export default ParqueoMarker;