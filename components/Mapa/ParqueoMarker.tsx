import React from 'react';
import { Marker } from 'react-native-maps';
import { Image } from 'react-native';
import { ParqueoParaVista, Coords } from '../../types/mapa';
import { MARKER_DISPONIBLE, MARKER_LLENO } from '../../constants/mapa';

interface ParqueoMarkerProps {
  parqueo: ParqueoParaVista;
  onPress: (parqueo: ParqueoParaVista) => void;
  destination: Coords | null;
}

const ParqueoMarker: React.FC<ParqueoMarkerProps> = ({ parqueo, onPress, destination }) => {
  const isDestination = destination && 
    destination.latitude === parqueo.latitud && 
    destination.longitude === parqueo.longitud;

  return (
    <Marker
      coordinate={{ latitude: parqueo.latitud, longitude: parqueo.longitud }}
      title={parqueo.nombre}
      onPress={destination && !isDestination ? undefined : () => onPress(parqueo)}
      opacity={destination && !isDestination ? 0.6 : 1.0}
      zIndex={isDestination ? 1 : 0}
    >
      <Image 
        source={{ uri: parqueo.disponible ? MARKER_DISPONIBLE : MARKER_LLENO }} 
        style={{ width: 40, height: 40 }} 
        resizeMode="contain" 
      />
    </Marker>
  );
};

export default ParqueoMarker;