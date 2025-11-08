export type Espacio = {
    id: string;
    tipo: 'auto' | 'moto';
    estado: 'libre' | 'ocupado' | 'reservado';
    reservadoHasta?: number;
    placaActual?: string;
};
