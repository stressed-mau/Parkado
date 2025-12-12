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
        date.setHours(parseInt(hours), parseInt(minutes));
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

// Hook para procesar datos del parqueo - CORREGIDO
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
                serviciosIds: [], // ✅ AGREGADO
            };
        }

        // 1. IMÁGENES
        const imagenes = data.fotos && data.fotos.length > 0 
            ? data.fotos.map(foto => foto.url)
            : ['https://via.placeholder.com/400x250?text=No+Image'];
        
        const imagenPrincipal = imagenes[0];

        // 2. TARIFAS - CORREGIDO (sin usar descripcion)
        let tarifaAuto = 0;
        let tarifaMoto = 0;

        if (data.tarifas && data.tarifas.length > 0) {
            // ✅ CORREGIDO: Buscar solo por tipoVehiculoId
            const tarifaAutoObj = data.tarifas.find(t => t.tipoVehiculoId === 1);
            const tarifaMotoObj = data.tarifas.find(t => t.tipoVehiculoId === 2);

            tarifaAuto = tarifaAutoObj ? parseFloat(tarifaAutoObj.precioHora) : 0;
            tarifaMoto = tarifaMotoObj ? parseFloat(tarifaMotoObj.precioHora) : 0;

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

        // 3. CAPACIDADES TEÓRICAS - CORREGIDO (sin usar descripcion)
        let capacidadAutos = 0;
        let capacidadMotos = 0;

        if (data.capacidades && data.capacidades.length > 0) {
            // ✅ CORREGIDO: Buscar solo por tipoVehiculoId
            const capacidadAutoObj = data.capacidades.find(c => c.tipoVehiculoId === 1);
            const capacidadMotoObj = data.capacidades.find(c => c.tipoVehiculoId === 2);

            capacidadAutos = capacidadAutoObj ? capacidadAutoObj.cantidad : 0;
            capacidadMotos = capacidadMotoObj ? capacidadMotoObj.cantidad : 0;
        }

        // 4. DISPONIBILIDAD REAL - CONTAR PLAZAS DISPONIBLES
        let disponibilidadAutos = 0;
        let disponibilidadMotos = 0;

        if (data.plazas && data.plazas.length > 0) {
            // Contar plazas disponibles por tipo
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
            // Si no hay plazas definidas, usar capacidades como disponibilidad
            disponibilidadAutos = capacidadAutos;
            disponibilidadMotos = capacidadMotos;
        }

        // 5. SERVICIOS ACTIVOS - ADAPTADO A NUEVA ESTRUCTURA
        let serviciosActivos: any[] = [];
        let serviciosIds: number[] = [];

        // Primero intentar usar serviciosAsociados (nueva estructura)
        if (data.serviciosAsociados && data.serviciosAsociados.length > 0) {
            serviciosIds = data.serviciosAsociados;
            // Convertir IDs a objetos de servicio para la UI
            serviciosActivos = serviciosIds.map(id => ({
                id: id,
                servicio: {
                    id: id,
                    nombre: `Servicio ${id}`,
                    descripcion: ''
                }
            }));
            console.log('✅ Usando serviciosAsociados (nueva estructura):', serviciosIds);
        } 
        // Si no existe serviciosAsociados, usar la estructura antigua
        else if (data.servicios && data.servicios.length > 0) {
            serviciosActivos = data.servicios.filter(s => s.estado);
            serviciosIds = serviciosActivos.map(s => s.servicioId);
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

// Hook principal para el detalle del parqueo - ACTUALIZADO
export default function useParqueoDetalle(): UseParqueoDetalleReturn {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const parqueoId = Array.isArray(id) ? id[0] : id;

    const [data, setData] = useState<ParqueoDetalleAPI | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userData, setUserData] = useState<any>(null);

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
            } catch (error) {
                console.error('Error cargando usuario:', error);
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
            console.error("❌ ERROR DURANTE EL FETCH:", err.message);
            setError(err.message || "Error de conexión. Verifica tu internet.");
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
            // Este caso ahora se maneja en el componente con el modal
            console.log('🔐 Usuario no autenticado, mostrando modal...');
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
            parqueoLat: data.latitud?.toString() || '-17.3936',
            parqueoLng: data.longitud?.toString() || '-66.1569',
        };

        console.log(`🚀 Navegando a Reserva con datos:`, paramsToPass);
        router.push({
            pathname: '/reserva' as any,
            params: paramsToPass
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
        userData,  
    };
}


export { formatHour };