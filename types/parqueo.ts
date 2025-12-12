// Tipos para la API
export interface PlazaAPI {
    id: number;
    nroPlaza: string;
    ubicacionPiso: string | null;
    estado: string | null;
    parqueoId: number;
    tipoVehiculoId: number;
}

export interface CapacidadAPI {
    id: number;
    cantidad: number;
    parqueoId: number;
    tipoVehiculoId: number;
    tipoVehiculo: {
        id: number;
        nombre: string;
        descripcion: string;
    };
}

export interface TarifaAPI {
    id: number;
    descripcion: string;
    precioHora: string;
    precioDia: string | null;
    estado: string | null;
    parqueoId: number;
    tipoVehiculoId: number;
}

// Actualizar las interfaces principales:
export interface ParqueoDetalleAPI {
    id: number;
    nombre: string;
    direccion: string;
    tipoLugar: string;
    propietarioId: number;
    latitud: number;
    longitud: number;
    horarios: any[];
    calificaciones: any[];
    capacidades: CapacidadAPI[];
    servicios: any[];
    plazas: PlazaAPI[];
    tarifas: TarifaAPI[];
    fotos: any[];
    // ❌ ELIMINAR: descripcion?: string;
    serviciosAsociados?: number[]; // ✅ AGREGAR
}

export interface UserData {
    id: string;
    email: string;
    token: string;
    nombre: string;
}

export interface Espacio {
    id: string;
    tipo: 'auto' | 'moto';
    estado: 'libre' | 'ocupado' | 'mantenimiento';
    nroPlazaReal: string;
    plazaIdReal: number;
}

export interface Tarifas {
    auto: number;
    moto: number;
}

export interface ReservaData {
    parqueoId: string;
    parqueoNombre: string;
    plazaId: string;
    nroPlazaReal: string;
    tipoVehiculo: 'auto' | 'moto';
    matricula: string;
    fechaInicioISO: string;
    fechaFinISO: string;
    fechaInicioFormatted: string;
    fechaFinFormatted: string;
    costoTotal: string;
    costoTotalFormatted: string;
    metodoPago: string;
    parqueoLat: string;
    parqueoLng: string;
    tarifaAplicada: string;
    tarifaAuto: string;
    tarifaMoto: string;
    usuarioId: string;
    usuarioEmail: string;
    usuarioNombre: string;
    timestamp: string;
}

export interface ReservaPayload {
    fechaHoraIni: string;
    fechaHoraFin: string;
    plazaId: number;
    usuarioId: number;
    matriculaVehiculo: string;
}

export interface UseReservaReturn {
    // Estados
    isLoading: boolean;
    tipoVehiculo: 'auto' | 'moto';
    plazasReales: Espacio[];
    plazaSeleccionadaId: string | null;
    matricula: string;
    fechaInicio: Date;
    fechaFin: Date;
    metodoPago: string;
    showInicioPicker: boolean;
    modeInicioPicker: 'date' | 'time';
    showFinPicker: boolean;
    modeFinPicker: 'date' | 'time';
    userData: UserData | null;
    isCreatingReserva: boolean;
    datosParqueo: ParqueoDetalleAPI | null;
    tarifasReales: Tarifas;
    
    // Funciones
    setTipoVehiculo: (tipo: 'auto' | 'moto') => void;
    setPlazaSeleccionadaId: (id: string | null) => void;
    setMatricula: (matricula: string) => void;
    setFechaInicio: (fecha: Date) => void;
    setFechaFin: (fecha: Date) => void;
    setMetodoPago: (metodo: string) => void;
    setShowInicioPicker: (show: boolean) => void;
    setModeInicioPicker: (mode: 'date' | 'time') => void;
    setShowFinPicker: (show: boolean) => void;
    setModeFinPicker: (mode: 'date' | 'time') => void;
    
    // Lógica de negocio
    cargarPlazasDisponibles: () => Promise<void>;
    crearReservaEnAPI: (reservaData: ReservaData) => Promise<any>;
    actualizarEstadoPlaza: (plazaId: number) => Promise<any>;
    handleConfirmarReserva: () => Promise<void>;
    
    // Memoizados
    plazasDisponiblesPorTipo: { autos: number; motos: number };
    plazasDisponiblesParaTipo: Espacio[];
    costoTotal: number;
}

// Tipos para la API de Búsqueda
export interface ParqueoBusqueda {
  id: number;
  nombre: string;
  direccion: string;
  tipoLugar: string;
  latitud: number;
  longitud: number;
  distancia_metros: number | null;
  rating_promedio: number;
  total_calificaciones: number;
  plazas_disponibles: number;
  precio_minimo_hora: number | null;
}

export interface BusquedaParams {
  lat?: number;
  lng?: number;
  radius?: number;
  q?: string;
  ratingMinimo?: number;
  serviciosIds?: string;
  tipoVehiculoId?: number;
  precioMaxHora?: number;
  sort?: string;
}

// Tipo unificado para el mapa
export interface ParqueoMapa {
  id: number;
  nombre: string;
  direccion: string;
  tipoLugar: string;
  latitud: number;
  longitud: number;
  distancia_metros?: number | null;
  rating_promedio?: number;
  total_calificaciones?: number;
  plazas_disponibles?: number;
  precio_minimo_hora?: number | null;
  // Campos adicionales para compatibilidad
  propietarioId?: number;
  horarios?: any[];
  calificaciones?: any[];
  capacidades?: any[];
  servicios?: any[];
  plazas?: any[];
  tarifas?: any[];
  fotos?: any[];
}

export const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'QR'] as const;