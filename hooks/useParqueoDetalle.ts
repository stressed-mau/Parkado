// useParqueoDetalle.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ParqueoDetalleAPI,
    ParqueoStats,
    ParqueoData,
    NavigationParams,
    UseParqueoStatsReturn,
    UseParqueoDataReturn,
    UseParqueoDetalleReturn,
    ALL_DAYS
} from '../types/detalle';

// Función auxiliar para formatear horas
const formatHour = (timeString: string) => {
    if (!timeString) return "N/A";
    try {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
        return date.toLocaleTimeString('es-BO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch {
        return "N/A";
    }
};

// Hook para estadísticas del parqueo
const useParqueoStats = (data: ParqueoDetalleAPI | null): UseParqueoStatsReturn => {
    return useMemo(() => {
        if (!data?.calificaciones || data.calificaciones.length === 0) {
            return { averageRating: 0, reviewCount: 0 };
        }

        const totalRating = data.calificaciones.reduce((sum, c) => {
            const puntuacion = parseFloat(c.puntuacion) || 0;
            return sum + puntuacion;
        }, 0);

        const averageRating = totalRating / data.calificaciones.length;
        return {
            averageRating: parseFloat(averageRating.toFixed(1)),
            reviewCount: data.calificaciones.length
        };
    }, [data]);
};

// Hook para procesar datos del parqueo
const useParqueoData = (data: ParqueoDetalleAPI | null): UseParqueoDataReturn => {
    return useMemo(() => {
        if (!data) {
            return {
                imagenes: [],
                imagenPrincipal: 'https://via.placeholder.com/400x250?text=No+Image',
                tarifaAuto: 0,
                tarifaMoto: 0,
                capacidadAutos: 0,
                capacidadMotos: 0,
                disponibilidadAutos: 0,
                disponibilidadMotos: 0,
                serviciosActivos: [],
                serviciosIds: [],
            };
        }

        // 1. IMÁGENES
        const imagenes = data.fotos && data.fotos.length > 0
            ? data.fotos.map(foto => foto.url)
            : ['https://via.placeholder.com/400x250?text=No+Image'];

        const imagenPrincipal = imagenes[0];

        // 2. TARIFAS
        let tarifaAuto = 0;
        let tarifaMoto = 0;

        if (data.tarifas && data.tarifas.length > 0) {
            const tarifaAutoObj = data.tarifas.find(t => t.tipoVehiculoId === 1);
            const tarifaMotoObj = data.tarifas.find(t => t.tipoVehiculoId === 2);

            tarifaAuto = tarifaAutoObj ? parseFloat(String(tarifaAutoObj.precioHora)) : 0;
            tarifaMoto = tarifaMotoObj ? parseFloat(String(tarifaMotoObj.precioHora)) : 0;

            console.log('💰 Tarifas extraídas:', {
                auto: tarifaAuto,
                moto: tarifaMoto,
                encontradoAuto: !!tarifaAutoObj,
                encontradoMoto: !!tarifaMotoObj,
            });
        } else {
            console.warn('⚠️ Este parqueo no tiene tarifas definidas');
            tarifaAuto = 8.5;
            tarifaMoto = 4.0;
        }

        // 3. CAPACIDADES
        let capacidadAutos = 0;
        let capacidadMotos = 0;

        if (data.capacidades && data.capacidades.length > 0) {
            const capacidadAutoObj = data.capacidades.find(c => c.tipoVehiculoId === 1);
            const capacidadMotoObj = data.capacidades.find(c => c.tipoVehiculoId === 2);

            capacidadAutos = capacidadAutoObj ? Number(capacidadAutoObj.cantidad) : 0;
            capacidadMotos = capacidadMotoObj ? Number(capacidadMotoObj.cantidad) : 0;
        }

        // 4. DISPONIBILIDAD REAL
        let disponibilidadAutos = 0;
        let disponibilidadMotos = 0;

        if (data.plazas && data.plazas.length > 0) {
            const plazasAutoDisponibles = data.plazas.filter(plaza =>
                plaza.tipoVehiculoId === 1 &&
                (plaza.estado === 'DISPONIBLE' || plaza.estado === 'libre' || plaza.estado === null)
            );

            const plazasMotoDisponibles = data.plazas.filter(plaza =>
                plaza.tipoVehiculoId === 2 &&
                (plaza.estado === 'DISPONIBLE' || plaza.estado === 'libre' || plaza.estado === null)
            );

            disponibilidadAutos = plazasAutoDisponibles.length;
            disponibilidadMotos = plazasMotoDisponibles.length;

            console.log('🔄 Disponibilidad real calculada:', {
                totalPlazasAuto: data.plazas.filter(p => p.tipoVehiculoId === 1).length,
                totalPlazasMoto: data.plazas.filter(p => p.tipoVehiculoId === 2).length,
                disponiblesAuto: disponibilidadAutos,
                disponiblesMoto: disponibilidadMotos
            });
        } else {
            disponibilidadAutos = capacidadAutos;
            disponibilidadMotos = capacidadMotos;
        }

        // 5. SERVICIOS ACTIVOS
        let serviciosActivos: any[] = [];
        let serviciosIds: number[] = [];

        if (data.serviciosAsociados && Array.isArray(data.serviciosAsociados) && data.serviciosAsociados.length > 0) {
            serviciosIds = data.serviciosAsociados.map((id: any) => Number(id)).filter(n => !Number.isNaN(n));
            serviciosActivos = serviciosIds.map(id => ({
                id,
                servicio: { id, nombre: `Servicio ${id}`, descripcion: '' }
            }));
            console.log('✅ Usando serviciosAsociados (nueva estructura):', serviciosIds);
        } else if (data.servicios && data.servicios.length > 0) {
            serviciosActivos = data.servicios.filter((s: any) => s.estado);
            serviciosIds = serviciosActivos.map((s: any) => s.servicioId).filter((n: any) => typeof n === 'number');
            console.log('🔄 Usando servicios (estructura antigua):', serviciosActivos);
        } else {
            console.log('⚠️ No hay servicios definidos');
        }

        console.log('📊 DATOS FINALES PROCESADOS:', {
            nombre: data.nombre,
            capacidadAutos,
            capacidadMotos,
            disponibilidadAutos,
            disponibilidadMotos,
            tarifaAuto,
            tarifaMoto,
            serviciosIds,
            serviciosActivosCount: serviciosActivos.length
        });

        return {
            imagenes,
            imagenPrincipal,
            tarifaAuto,
            tarifaMoto,
            capacidadAutos,
            capacidadMotos,
            disponibilidadAutos,
            disponibilidadMotos,
            serviciosActivos,
            serviciosIds,
        };
    }, [data]);
};

// --- Serializador seguro para params de navegación ---
function serializeNavigationParams(params: NavigationParams): Record<string, string> {
    // Convierte todas las propiedades a string y filtra valores nulos/undefined
    const out: Record<string, string> = {};
    for (const key of Object.keys(params)) {
        const v: any = (params as any)[key];
        if (v === undefined || v === null) continue;
        out[key] = String(v);
    }
    return out;
}

// Hook principal para el detalle del parqueo
export default function useParqueoDetalle(): UseParqueoDetalleReturn {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const parqueoId = Array.isArray(id) ? id[0] : id;

    const [data, setData] = useState<ParqueoDetalleAPI | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userData, setUserData] = useState<any>(null); // queda interno, no lo devolvemos

    const stats = useParqueoStats(data);
    const processedData = useParqueoData(data);

    // Cargar datos de usuario para autenticación
    useEffect(() => {
        const cargarUsuario = async () => {
            try {
                const storedUserData = await AsyncStorage.getItem('userData');
                if (storedUserData) {
                    const user = JSON.parse(storedUserData);
                    setUserData(user);
                    console.log('✅ Usuario cargado desde AsyncStorage:', user);
                } else {
                    console.log('❌ No hay usuario logueado');
                }
            } catch (err) {
                console.error('Error cargando usuario:', err);
            }
        };

        cargarUsuario();
    }, []);

    // Función para cargar datos
    const fetchParqueoDetails = useCallback(async () => {
        console.log("===================================");
        console.log("🔍 PANTALLA DETALLE EN FOCO. Buscando ID:", parqueoId);

        if (!parqueoId) {
            setError("ID del parqueo no encontrado en la URL.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const url = `https://parkado-backend.vercel.app/api/parqueos/details`;
            console.log(`🌐 HACIENDO FETCH A: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: No se pudo cargar los datos.`);
            }

            const json: ParqueoDetalleAPI[] = await response.json();
            const idBuscado = parseInt(parqueoId, 10);
            const parqueoEncontrado = json.find((parqueo) => parqueo.id === idBuscado);

            if (!parqueoEncontrado) {
                throw new Error(`No se encontró el parqueo con ID: ${idBuscado}`);
            }

            console.log(`✅ DATOS ENCONTRADOS: "${parqueoEncontrado.nombre}"`, {
                id: parqueoEncontrado.id,
                fotos: parqueoEncontrado.fotos?.length || 0,
                servicios: parqueoEncontrado.servicios?.length || 0,
                serviciosAsociados: parqueoEncontrado.serviciosAsociados || 'No definido',
                capacidades: parqueoEncontrado.capacidades?.length || 0,
                tarifas: parqueoEncontrado.tarifas?.length || 0,
                horarios: parqueoEncontrado.horarios?.length || 0,
                plazas: parqueoEncontrado.plazas?.length || 0
            });

            setData(parqueoEncontrado);

        } catch (err: any) {
            console.error("❌ ERROR DURANTE EL FETCH:", err?.message || err);
            setError(err?.message || "Error de conexión. Verifica tu internet.");
        } finally {
            setIsLoading(false);
        }
    }, [parqueoId]);

    // Efecto para cargar datos al enfocar
    useFocusEffect(
        useCallback(() => {
            fetchParqueoDetails();
        }, [fetchParqueoDetails])
    );

    // Función para navegar a reserva - CON VERIFICACIÓN DE AUTENTICACIÓN
    const handleNavigateToReserva = useCallback(() => {
        if (!data) {
            Alert.alert("Error", "Datos del parqueo no disponibles.");
            return;
        }

        // Verificar autenticación
        if (!userData) {
            // El componente UI puede manejar el modal / login
            console.log('🔐 Usuario no autenticado, no navega automáticamente.');
            return;
        }

        const paramsToPass: NavigationParams = {
    parqueoId: data.id.toString(),
    parqueoNombre: data.nombre || 'Parqueo',
    tarifaAuto: processedData.tarifaAuto.toString(),
    tarifaMoto: processedData.tarifaMoto.toString(),
    capacidadAutos: processedData.capacidadAutos.toString(),
    capacidadMotos: processedData.capacidadMotos.toString(),
    disponibilidadAutos: processedData.disponibilidadAutos.toString(),
    disponibilidadMotos: processedData.disponibilidadMotos.toString(),
    parqueoLat: String(
        data.latitud !== undefined && data.latitud !== null
            ? data.latitud
            : -17.3936
    ),
    parqueoLng: String(
        data.longitud !== undefined && data.longitud !== null
            ? data.longitud
            : -66.1569
    ),
};


        const safeParams = serializeNavigationParams(paramsToPass);

        console.log(`🚀 Navegando a Reserva con datos (serializados):`, safeParams);
        router.push({
            pathname: '/reserva',
            params: safeParams
        });
    }, [data, processedData, router, userData]);

    // Función para recargar datos
    const refetch = useCallback(async () => {
        await fetchParqueoDetails();
    }, [fetchParqueoDetails]);

    return {
        data,
        isLoading,
        error,
        stats,
        processedData,
        handleNavigateToReserva,
        refetch,
        // NOTA: no devolvemos userData porque UseParqueoDetalleReturn no lo define;
        // si quieres exponerlo, actualiza el type y lo incluimos aquí.
    };
}

export { formatHour };
