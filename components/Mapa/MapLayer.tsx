import React from 'react';
import MapView, { Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { Coords, ParqueoParaVista } from '../../types/mapa';
import ParqueoMarker from './ParqueoMarker';

interface MapLayerProps {
  mapRef: React.RefObject<MapView>;
  region: Region | null;
  onRegionChangeComplete: (region: Region) => void;
  onPress: () => void;
  userLocation: Coords | null;
  parqueos: ParqueoParaVista[];
  onMarkerPress: (parqueo: ParqueoParaVista) => void;
  destination: Coords | null;
  routeCoordinates: Coords[];
  showDirections: boolean;
}

const MapLayer: React.FC<MapLayerProps> = ({
  mapRef,
  region,
  onRegionChangeComplete,
  onPress,
  userLocation,
  parqueos,
  onMarkerPress,
  destination,
  routeCoordinates,
  showDirections,
}) => {
  if (!region) return null;

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFillObject}
      region={region}
      onRegionChangeComplete={onRegionChangeComplete}
      onPress={onPress}
      showsUserLocation={!!userLocation}
      showsMyLocationButton={false}
      provider={PROVIDER_GOOGLE}
      showsCompass={true}
      rotateEnabled={true}
      scrollEnabled={true}
      zoomEnabled={true}
    >
      {/* Marcadores de parqueos */}
      {parqueos.map((parqueo) => (
        <ParqueoMarker
          key={parqueo.id}
          parqueo={parqueo}
          onPress={onMarkerPress}
          destination={destination}
        />
      ))}

      {/* Ruta */}
      {showDirections && routeCoordinates.length > 0 && (
        <Polyline 
          coordinates={routeCoordinates} 
          strokeWidth={4} 
          strokeColor="#4F46E5" 
          zIndex={1} 
        />
      )}
    </MapView>
  );
};

export default MapLayer;