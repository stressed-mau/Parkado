// hooks/useBusqueda.ts
import { useState } from 'react';
import { Alert } from 'react-native';
import { ParqueoBusqueda } from '../types/parqueo';

const API_BASE_URL = 'https://parkado-backend.vercel.app';

export const useBusqueda = () => {
  const [resultados, setResultados] = useState<ParqueoBusqueda[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSimple = async (url: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔗 URL completa:', url);

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      console.log('📡 Status:', res.status);

      const text = await res.text();
      console.log('📡 Body:', text);

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${text.substring(0, 200)}`);
      }

      const data: ParqueoBusqueda[] = JSON.parse(text);
      setResultados(data);
      return data;
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Error desconocido en la búsqueda';

      setError(msg);
      console.error('❌ Error búsqueda:', e);

      Alert.alert(
        'Error de Búsqueda',
        `No se pudieron cargar los parqueos.\n\n${msg}`
      );

      setResultados([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const buscarGlobal = async () => {
    const url = `${API_BASE_URL}/api/buscar`;
    return fetchSimple(url);
  };

  const buscarPorTexto = async (query: string) => {
    const limpia = query.trim();
    if (!limpia) {
      const msg = 'Texto de búsqueda vacío';
      setError(msg);
      return [];
    }

    const url = `${API_BASE_URL}/api/buscar?q=${encodeURIComponent(limpia)}`;
    return fetchSimple(url);
  };

  const limpiarResultados = () => {
    setResultados([]);
    setError(null);
  };

  return {
    resultados,
    loading,
    error,
    buscarGlobal,
    buscarPorTexto,
    limpiarResultados,
  };
};
