// hooks/useServicios.ts
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

const API_BASE = 'https://parkado-backend.vercel.app';

export type Servicio = {
  id: number;
  nombre: string;
  descripcion?: string;
  parqueos?: any[];
};

export const useServicios = () => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServicios = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/servicios`, { method: 'GET', headers: { Accept: 'application/json' }});
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || `Error ${res.status}`);
      }
      const data: Servicio[] = JSON.parse(text || '[]');
      setServicios(data);
      return data;
    } catch (e: any) {
      const msg = e?.message ?? 'Error al obtener servicios';
      setError(msg);
      console.error('useServicios error:', msg);
      Alert.alert('Error', 'No se pudieron cargar los servicios.');
      setServicios([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  return { servicios, loading, error, refresh: fetchServicios };
};
