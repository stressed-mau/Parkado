export interface Parking {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  availability: string; // Ej: "5 espacios libres"
}
