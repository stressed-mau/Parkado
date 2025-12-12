// Tipos principales para el detalle del parqueo
export interface Calificacion { 
    puntuacion: string; 
    comentario: string; 
}

export interface TipoVehiculo { 
    id: number;
    nombre: string; 
    descripcion: string;
}

export interface Capacidad { 
    id: number;
    cantidad: number; 
    parqueoId: number;
    tipoVehiculoId: number;
    tipoVehiculo: TipoVehiculo; 
}

export interface Servicio { 
    id: number;
    estado: boolean; 
    parqueoId: number;
    servicioId: number;
    servicio: { 
        id: number;
        nombre: string; 
        descripcion: string;
    }; 
}

export interface Horario { 
    id: number;
    diaSemana: string; 
    horaAbrir: string; 
    horaCerrar: string; 
    esCerrado: boolean | null; 
    parqueoId: number;
}

export interface Tarifa {
    id: number;
    descripcion: string;
    precioHora: string;
    precioDia: string | null;
    estado: string | null;
    parqueoId: number;
    tipoVehiculoId: number;
}

export interface Foto {
    id: number;
    url: string;
    parqueoId: number;
}

export interface Plaza {
    id: number;
    nroPlaza: string;
    ubicacionPiso: string | null;
    estado: string | null;
    parqueoId: number;
    tipoVehiculoId: number;
}

 
export interface ParqueoDetalleAPI {
    id: number;
    nombre: string;
    direccion: string;
    tipoLugar: string;
    propietarioId: number;
    latitud: number;
    longitud: number;
    horarios: Horario[];
    calificaciones: Calificacion[];
    capacidades: Capacidad[];
    servicios: Servicio[];
    tarifas: Tarifa[];
    fotos: Foto[];
    plazas: Plaza[];
    serviciosAsociados?: number[];
}

export interface ParqueoStats {
    averageRating: number;
    reviewCount: number;
}

export interface ParqueoData {
    imagenes: string[];
    imagenPrincipal: string;
    tarifaAuto: number;
    tarifaMoto: number;
    capacidadAutos: number;
    capacidadMotos: number;
    disponibilidadAutos: number;
    disponibilidadMotos: number;
    serviciosActivos: Servicio[];
}

export interface NavigationParams {
    parqueoId: string;
    parqueoNombre: string;
    tarifaAuto: string;
    tarifaMoto: string;
    capacidadAutos: string;
    capacidadMotos: string;
    disponibilidadAutos: string;
    disponibilidadMotos: string;
    parqueoLat: string;
    parqueoLng: string;
}

// Props para componentes
export interface RatingStarsProps {
    rating: number;
}

export interface GaleriaImagenesProps {
    imagenes: string[];
}

export interface ServiciosAdicionalesProps {
    servicios: Servicio[];
}

export interface DetalleCapacidadesProps {
    capacidadAutos: number;
    capacidadMotos: number;
    disponibilidadAutos: number;
    disponibilidadMotos: number;
    tarifaAuto: number;
    tarifaMoto: number;
}

// Hook return types
export interface UseParqueoStatsReturn {
    averageRating: number;
    reviewCount: number;
}

export interface UseParqueoDataReturn {
    imagenes: string[];
    imagenPrincipal: string;
    tarifaAuto: number;
    tarifaMoto: number;
    capacidadAutos: number;
    capacidadMotos: number;
    disponibilidadAutos: number;
    disponibilidadMotos: number;
    serviciosActivos: Servicio[];
}

export interface UseParqueoDetalleReturn {
    data: ParqueoDetalleAPI | null;
    isLoading: boolean;
    error: string | null;
    stats: UseParqueoStatsReturn;
    processedData: UseParqueoDataReturn;
    // ✅ CORREGIDO: Ahora acepta parámetros
    handleNavigateToReserva: (params: { parqueoId: string; parqueoNombre: string }) => void;
    refetch: () => Promise<void>;
}

// Constantes
export const ALL_DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;