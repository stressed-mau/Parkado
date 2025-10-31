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

export const CAPACIDAD_AUTOS = 10;
export const CAPACIDAD_MOTOS = 5;
export const TARIFA_AUTOS_NUM = 5.0;
export const TARIFA_MOTOS_NUM = 3.0;
export const TARIFA_AUTOS = `S/. ${TARIFA_AUTOS_NUM.toFixed(2)}`;
export const TARIFA_MOTOS = `S/. ${TARIFA_MOTOS_NUM.toFixed(2)}`;

export function generarEspacios(cAutos: number, cMotos: number): Espacio[] {
    const esp: Espacio[] = [];
    for (let i = 1; i <= cAutos; i++) {
        esp.push({ id: `A-${String(i).padStart(2, '0')}`, tipo: 'auto', estado: 'libre' });
    }
    for (let i = 1; i <= cMotos; i++) {
        esp.push({ id: `M-${String(i).padStart(2, '0')}`, tipo: 'moto', estado: 'libre' });
    }
    return esp;
}

export function calcularCobro(tipo: 'auto' | 'moto', inicioTs: number, finTs: number) {
    const tarifa = tipo === 'auto' ? TARIFA_AUTOS_NUM : TARIFA_MOTOS_NUM;
    const horas = (finTs - inicioTs) / 3600000;
    const monto = tarifa * horas;
    return Math.max(0, Number(monto.toFixed(2)));
}