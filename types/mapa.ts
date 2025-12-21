import type { Region } from "react-native-maps";

// Coordenadas
export type Coords = {
  latitude: number;
  longitude: number;
};

export type ParqueoParaVista = {
  id: number;
  nombre: string;
  direccion: string;
  tipoLugar: string;
  propietarioId: number;
  latitud: number;
  longitud: number;
  horarios: any[];
  calificaciones: any[];
  capacidades: any[];
  servicios: any[];
  plazas: any[];
  tarifas: any[];
  fotos: any[];
  rating: number;
  disponible: boolean;
  isResumen?: boolean;

};

export type MapState = {
  region: Region | null;        // ✔️ ahora funciona
  userLocation: Coords | null;
  errorMsg: string | null;
  selectedParking: ParqueoParaVista | null;
  parqueos: ParqueoParaVista[];
  isLoadingApi: boolean;
  isLocationLoading: boolean;
  destination: Coords | null;
  destinationName: string | null;
  routeCoordinates: Coords[];
  isLoadingRoute: boolean;
  showDirections: boolean;
  isLocating: boolean;
};

export type MapActions = {
  setRegion: (region: Region) => void;  // ✔️ ahora funciona
  setSelectedParking: (parking: ParqueoParaVista | null) => void;
  handleCenterOnUser: () => Promise<void>;
  handleZoom: (factor: number) => void;
  handleMarkerPress: (parqueo: ParqueoParaVista) => void;
  handleClearSelection: () => void;
  handleShowDirectionsFromPopup: (coords: { latitude: number; longitude: number; name: string }) => void;
};

// Funciones de conversión
export const convertirParqueoBusquedaAParaVista = (parqueoBusqueda: any): ParqueoParaVista => {
  return {
    id: parqueoBusqueda.id,
    nombre: parqueoBusqueda.nombre,
    direccion: parqueoBusqueda.direccion,
    tipoLugar: parqueoBusqueda.tipoLugar,
    propietarioId: parqueoBusqueda.propietarioId || 0,
    latitud: parqueoBusqueda.latitud,
    longitud: parqueoBusqueda.longitud,
    horarios: parqueoBusqueda.horarios || [],
    calificaciones: parqueoBusqueda.calificaciones || [],
    capacidades: parqueoBusqueda.capacidades || [],
    servicios: parqueoBusqueda.servicios || [],
    plazas: parqueoBusqueda.plazas || [],
    tarifas: parqueoBusqueda.tarifas || [],
    fotos: parqueoBusqueda.fotos || [],
    rating: parqueoBusqueda.rating_promedio || parqueoBusqueda.rating || 0,
    disponible: (parqueoBusqueda.plazas_disponibles || 0) > 0,
  };
};

export const convertirArrayParqueoBusquedaAParaVista = (parqueosBusqueda: any[]): ParqueoParaVista[] => {
  return parqueosBusqueda.map(convertirParqueoBusquedaAParaVista);
};
