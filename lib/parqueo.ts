import { TARIFA_AUTOS_NUM, TARIFA_MOTOS_NUM } from '@/constants/parqueo';
import type { Espacio } from '@/types/parqueo';

export const regexPlaca = /^[A-Z0-9-]{5,10}$/;

export function calcularCobro(tipo: 'auto' | 'moto', inicioTs: number, finTs: number) {
    const tarifa = tipo === 'auto' ? TARIFA_AUTOS_NUM : TARIFA_MOTOS_NUM;
    const horas = (finTs - inicioTs) / 3600000;
    const monto = tarifa * horas;
    return Math.max(0, Number(monto.toFixed(2)));
}

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

