// hooks/useBusqueda.ts
import { useState } from 'react';
import { Alert } from 'react-native';
import { ParqueoBusqueda } from '../types/parqueo';

const API_BASE_URL = 'https://parkado-backend.vercel.app';

export const useBusqueda = () => {
  const [resultados, setResultados] = useState<ParqueoBusqueda[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarPorTexto = async (q: string) => {
    try {
      setLoading(true);
      setError(null);

      const query = q?.trim();
      if (!query) {
        setResultados([]);
        return [];
      }

      const url = `${API_BASE_URL}/api/buscar/prefijo?q=${encodeURIComponent(query)}`;
      console.log('🔎 Buscando por prefijo:', url);

      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const text = await res.text();
      console.log('📡 status:', res.status, text);

      if (!res.ok) {
        throw new Error(`Error ${res.status}`);
      }

      const parsed = JSON.parse(text);

      if (!parsed.ok || !Array.isArray(parsed.resultados)) {
        throw new Error('Respuesta inválida del backend');
      }

      setResultados(parsed.resultados);
      return parsed.resultados;

    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error en la búsqueda';
      console.error('❌ useBusqueda:', e);
      setError(msg);
      setResultados([]);
      Alert.alert('Error de búsqueda', msg);
      return [];
    } finally {
      setLoading(false);
    }
  };

const buscarConFiltros = async (opciones: Record<string, any>) => {
  try {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();

    if (opciones.q) params.append("q", opciones.q);
    if (opciones.radius) params.append("radius", String(opciones.radius));
    if (opciones.tipoVehiculoId) params.append("tipoVehiculoId", String(opciones.tipoVehiculoId));
    if (opciones.precioMaxHora) params.append("precioMaxHora", String(opciones.precioMaxHora));
    if (opciones.ratingMinimo) params.append("ratingMinimo", String(opciones.ratingMinimo));
    if (opciones.sort) params.append("sort", opciones.sort);
if (opciones.lat) params.append("lat", String(opciones.lat));
if (opciones.lng) params.append("lng", String(opciones.lng));

    const url = `${API_BASE_URL}/api/buscar?${params.toString()}`;
    console.log("🎛️ Buscando con filtros:", url);

    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("Respuesta inválida de búsqueda con filtros");
    }

    setResultados(data);
    return data;

  } catch (e) {
    console.error("❌ buscarConFiltros:", e);
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
    buscarPorTexto,
    buscarConFiltros,
    limpiarResultados: () => {
      setResultados([]);
      setError(null);
    },
  };
};
