import { Region } from 'react-native-maps';

export const API_URL = 'https://parkado-backend.vercel.app/api/parqueos/details';
// WebSocket eliminado: ahora sólo usamos la API en Vercel
export const INITIAL_DELTA = 0.04;
export const COCHABAMBA_REGION: Region = { 
  latitude: -17.3936, 
  longitude: -66.1569, 
  latitudeDelta: INITIAL_DELTA, 
  longitudeDelta: INITIAL_DELTA 
};
export const MARKER_DISPONIBLE = 'https://i.ibb.co/GfhsxmpT/parkeo-disponible.png';
export const MARKER_LLENO = 'https://i.ibb.co/bj78fXYD/parkeo-lleno.png';
