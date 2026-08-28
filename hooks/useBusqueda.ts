// hooks/useBusqueda.ts
import { useState } from 'react';
import { Alert } from 'react-native';
import { ParqueoBusqueda } from '../types/parqueo';

const API_BASE_URL = 'https://parkado-backend.vercel.app';

export type BusquedaOpciones = {
  q?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  ratingMinimo?: number;
  precioMaxHora?: number;
  tipoVehiculoId?: number;
  serviciosIds?: number[]; // internamente lo convertimos a "1,2"
  sort?: 'distancia' | 'rating' | 'precio';
};

export const useBusqueda = () => {
  const [resultados, setResultados] = useState<ParqueoBusqueda[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeNumber = (v: any): number | undefined => {
    if (v === undefined || v === null) return undefined;
    if (typeof v === 'string' && v.trim() === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const isValidSort = (s: any) => {
    if (typeof s !== 'string') return false;
    const t = s.trim();
    return t === 'rating' || t === 'precio' || t === 'distancia';
  };

  const fetchBusqueda = async (opciones: BusquedaOpciones = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      // q
      if (opciones.q && typeof opciones.q === 'string' && opciones.q.trim()) {
        params.append('q', opciones.q.trim());
      }

      // números seguros
      const lat = safeNumber(opciones.lat);
      const lng = safeNumber(opciones.lng);
      const radius = safeNumber(opciones.radius);
      const ratingMinimo = safeNumber(opciones.ratingMinimo);
      const precioMaxHora = safeNumber(opciones.precioMaxHora);
      const tipoVehiculoId = safeNumber(opciones.tipoVehiculoId);

      if (lat !== undefined) params.append('lat', String(lat));
      if (lng !== undefined) params.append('lng', String(lng));
      if (radius !== undefined && radius > 0) params.append('radius', String(radius));
      if (ratingMinimo !== undefined && ratingMinimo > 0) params.append('ratingMinimo', String(ratingMinimo));
      if (precioMaxHora !== undefined && precioMaxHora > 0) params.append('precioMaxHora', String(precioMaxHora));
      if (tipoVehiculoId !== undefined && tipoVehiculoId > 0) params.append('tipoVehiculoId', String(tipoVehiculoId));

      // serviciosIds -> "1,2,3"
      if (Array.isArray(opciones.serviciosIds) && opciones.serviciosIds.length > 0) {
        const servicios = opciones.serviciosIds
          .map((s) => Number(s))
          .filter((n) => Number.isInteger(n) && n > 0);
        if (servicios.length > 0) params.append('serviciosIds', servicios.join(','));
      }

      // sort (trim y validar)
      if (opciones.sort && isValidSort(opciones.sort)) {
        params.append('sort', (opciones.sort as string).trim());
      }

      const url = `${API_BASE_URL}/api/buscar${params.toString() ? '?' + params.toString() : ''}`;
      console.log('🔎 Ejecutando búsqueda URL:', url);

      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const text = await res.text();
      console.log('📡 fetch status:', res.status, 'body:', text);

      if (!res.ok) {
        let message: string = `Error ${res.status}`;
        try {
          const parsed = JSON.parse(text);
          message = parsed.message || JSON.stringify(parsed);
        } catch (e) {
          message = typeof text === 'string' ? text.slice(0, 1000) : String(text);
        }

        if (res.status === 500 && typeof message === 'string' && message.includes('Error interno del servidor')) {
          console.warn('⚠ API devolvió 500 (Error interno), se devuelve [] en lugar de propagar error.');
          setResultados([]);
          return [];
        }

        throw new Error(message);
      }

            // ------------------------------
      //  PARSEO + FILTRO SOLO POR INICIO
      // ------------------------------
      let raw: any;
      try {
        raw = JSON.parse(text || '[]');
      } catch (e) {
        console.warn('Respuesta de búsqueda no es JSON válido:', e);
        raw = [];
      }

      let data: ParqueoBusqueda[] = Array.isArray(raw) ? raw : [];

      if (opciones.q && typeof opciones.q === 'string' && opciones.q.trim()) {
        const normalize = (str: string) =>
  str
    .trim() // ← AGREGAR ESTO
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();


        const qNorm = normalize(opciones.q.trim());

        const startsWithField = (rawField?: string) => {
          if (!rawField) return false;
          const norm = normalize(rawField);
          if (!qNorm) return false;
          return norm.startsWith(qNorm); // 🔥 SOLO inicio de cadena
        };

        data = data.filter((p) => {
  const nombre = p.nombre ?? "";
  const dir = p.direccion ?? "";

  const normNombre = normalize(nombre);
  const normDir = normalize(dir);

  // FILTRO EXACTO CARACTER A CARACTER
  return normNombre.startsWith(qNorm) || normDir.startsWith(qNorm);
});

      }

      setResultados(data);
      return data;


    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido en la búsqueda';
      setError(msg);
      console.error('❌ useBusqueda error:', e);
      Alert.alert('Error de Búsqueda', msg);
      setResultados([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    resultados,
    loading,
    error,
    buscar: fetchBusqueda,
    buscarGlobal: () => fetchBusqueda({}),
    buscarPorTexto: (q: string) => fetchBusqueda({ q }),
    limpiarResultados: () => {
      setResultados([]);
      setError(null);
    },
  };
};
