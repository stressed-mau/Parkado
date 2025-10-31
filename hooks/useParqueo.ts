import { CAPACIDAD_AUTOS, CAPACIDAD_MOTOS } from '@/constants/parqueo';
import { calcularCobro, generarEspacios } from '@/lib/parqueo';
import { getEspacios, getVehiculos, setEspacios, setVehiculos } from '@/services/parqueoStorage';
import type { Espacio, Vehiculo } from '@/types/parqueo';
import { useEffect, useMemo, useRef, useState } from 'react';

type TipoVehiculo = 'auto' | 'moto';

export default function useParqueo() {
  const [vehiculos, setVehiculosState] = useState<Vehiculo[]>([]);
  const [espacios, setEspaciosState] = useState<Espacio[]>([]);

  // Carga inicial
  useEffect(() => {
    (async () => {
      try {
        const [vehList, espList] = await Promise.all([getVehiculos(), getEspacios()]);
        setVehiculosState(vehList ?? []);
        if (espList && espList.length > 0) setEspaciosState(espList);
        else setEspaciosState(generarEspacios(CAPACIDAD_AUTOS, CAPACIDAD_MOTOS));
      } catch (e) {
        console.warn('useParqueo: error al cargar', e);
        // Fallback: generar espacios por defecto
        setEspaciosState(generarEspacios(CAPACIDAD_AUTOS, CAPACIDAD_MOTOS));
      }
    })();
  }, []);

  // Persistencia
  useEffect(() => {
    setVehiculos(vehiculos).catch(() => { });
  }, [vehiculos]);
  useEffect(() => {
    setEspacios(espacios).catch(() => { });
  }, [espacios]);

  // Barrido de reservas vencidas
  const sweepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (sweepTimerRef.current) clearInterval(sweepTimerRef.current);
    sweepTimerRef.current = setInterval(() => {
      setEspaciosState(prev =>
        prev.map(e =>
          e.estado === 'reservado' && e.reservadoHasta && e.reservadoHasta < Date.now()
            ? { ...e, estado: 'libre', reservadoHasta: undefined }
            : e
        )
      );
    }, 30000);
    return () => {
      if (sweepTimerRef.current) clearInterval(sweepTimerRef.current);
    };
  }, []);

  // Derivados
  const autosOcupados = useMemo(
    () => espacios.filter(e => e.tipo === 'auto' && e.estado === 'ocupado').length,
    [espacios]
  );
  const motosOcupados = useMemo(
    () => espacios.filter(e => e.tipo === 'moto' && e.estado === 'ocupado').length,
    [espacios]
  );

  // Helpers
  function obtenerEspacioDisponible(tipo: TipoVehiculo, preferido?: string | null): Espacio | undefined {
    const ahora = Date.now();
    if (preferido) {
      const e = espacios.find(x => x.id === preferido && x.tipo === tipo);
      if (!e) return undefined;
      if (e.estado === 'libre') return e;
      if (e.estado === 'reservado' && (e.reservadoHasta ?? 0) >= ahora) return e;
      return undefined;
    }
    const libres = espacios.filter(e => e.tipo === tipo && e.estado === 'libre');
    if (libres.length > 0) return libres[0];
    return undefined;
  }

  const espaciosDisponiblesDelTipo = (tipo: TipoVehiculo) =>
    espacios.filter(e => e.tipo === tipo && e.estado === 'libre');

  // Acciones
  function registrarIngreso(placa: string, tipo: TipoVehiculo, espacioId?: string | null): string | null {
    const espacio = obtenerEspacioDisponible(tipo, espacioId ?? undefined);
    if (!espacio) return null;
    const ahora = new Date();
    const ahoraTs = ahora.getTime();
    const horaActual = ahora.toLocaleTimeString();
    setVehiculosState(old => [
      ...old,
      {
        placa,
        tipo,
        horaInicio: horaActual,
        horaFin: '',
        estacionado: true,
        inicioTs: ahoraTs,
        espacioId: espacio.id,
      },
    ]);
    setEspaciosState(prev =>
      prev.map(e => (e.id === espacio.id ? { ...e, estado: 'ocupado', reservadoHasta: undefined, placaActual: placa } : e))
    );
    return espacio.id;
  }

  function registrarSalida(placa: string): number | null {
    const ahora = new Date();
    const horaActual = ahora.toLocaleTimeString();
    const finTs = ahora.getTime();
    let espacioLiberado: string | undefined;
    let montoGenerado: number | null = null;
    setVehiculosState(old =>
      old.map(v => {
        if (v.placa === placa && v.estacionado) {
          const monto = calcularCobro(v.tipo, v.inicioTs, finTs);
          espacioLiberado = v.espacioId;
          montoGenerado = monto;
          return { ...v, horaFin: horaActual, finTs, estacionado: false, monto };
        }
        return v;
      })
    );
    if (espacioLiberado) {
      setEspaciosState(prev => prev.map(e => (e.id === espacioLiberado ? { ...e, estado: 'libre', placaActual: undefined } : e)));
    }
    return montoGenerado;
  }

  function reservarEspacio(espacioId: string, minutos: number) {
    const hasta = Date.now() + Math.max(1, minutos) * 60000;
    setEspaciosState(prev =>
      prev.map(e => (e.id === espacioId && e.estado === 'libre' ? { ...e, estado: 'reservado', reservadoHasta: hasta } : e))
    );
  }

  return {
    vehiculos,
    espacios,
    autosOcupados,
    motosOcupados,
    obtenerEspacioDisponible,
    espaciosDisponiblesDelTipo,
    registrarIngreso,
    registrarSalida,
    reservarEspacio,
  };
}
