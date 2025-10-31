
export type Vehiculo = {
    placa: string;
    tipo: 'auto' | 'moto';
    horaInicio: string;
    horaFin: string;
    estacionado: boolean;
    inicioTs: number;
    finTs?: number;
    espacioId?: string;
    monto?: number;
};

export type Espacio = {
    id: string;
    tipo: 'auto' | 'moto';
    estado: 'libre' | 'ocupado' | 'reservado';
    reservadoHasta?: number;
    placaActual?: string;
};

