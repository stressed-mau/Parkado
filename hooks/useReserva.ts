import { useState, useEffect, useMemo, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Espacio,
    Tarifas,
    UserData,
    ParqueoDetalleAPI,
    ReservaData,
    ReservaPayload,
    UseReservaReturn,
    METODOS_PAGO
} from '../types/parqueo';

export default function useReserva(): UseReservaReturn {
    const router = useRouter();
    const params = useLocalSearchParams<{
        parqueoId?: string;
        parqueoNombre?: string;
    }>();

    const parqueoId = params.parqueoId ?? 'N/A';
    const parqueoNombreParam = params.parqueoNombre ?? 'Parqueo Desconocido';

    // Estados
    const [isLoading, setIsLoading] = useState(true);
    const [tipoVehiculo, setTipoVehiculo] = useState<'auto' | 'moto'>('auto');
    const [plazasReales, setPlazasReales] = useState<Espacio[]>([]);
    const [plazaSeleccionadaId, setPlazaSeleccionadaId] = useState<string | null>(null);
    const [matricula, setMatricula] = useState('');
    const [fechaInicio, setFechaInicio] = useState<Date>(new Date());
    const [fechaFin, setFechaFin] = useState<Date>(() => {
        const d = new Date();
        d.setHours(d.getHours() + 1);
        return d;
    });
    const [metodoPago, setMetodoPago] = useState<string>(METODOS_PAGO[0]);
    const [showInicioPicker, setShowInicioPicker] = useState(false);
    const [modeInicioPicker, setModeInicioPicker] = useState<'date' | 'time'>('date');
    const [showFinPicker, setShowFinPicker] = useState(false);
    const [modeFinPicker, setModeFinPicker] = useState<'date' | 'time'>('date');
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isCreatingReserva, setIsCreatingReserva] = useState(false);
    const [datosParqueo, setDatosParqueo] = useState<ParqueoDetalleAPI | null>(null);
    const [tarifasReales, setTarifasReales] = useState<Tarifas>({ auto: 0, moto: 0 });

    // Cargar datos del usuario
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

    // Función para cargar plazas disponibles - CORREGIDA
    const cargarPlazasDisponibles = useCallback(async () => {
        try {
            console.log('🔄 Cargando plazas disponibles para parqueo ID:', parqueoId);
            
            const url = `https://parkado-backend.vercel.app/api/parqueos/details`;
            console.log('📡 URL de la API:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status} al cargar datos`);
            }

            const json: ParqueoDetalleAPI[] = await response.json();
            const idBuscado = parseInt(parqueoId, 10);
            const parqueoEncontrado = json.find((parqueo) => parqueo.id === idBuscado);

            if (!parqueoEncontrado) {
                throw new Error(`Parqueo con ID ${parqueoId} no encontrado`);
            }

            console.log('🏢 Parqueo encontrado:', {
                id: parqueoEncontrado.id,
                nombre: parqueoEncontrado.nombre,
                totalTarifas: parqueoEncontrado.tarifas?.length || 0,
            });

            setDatosParqueo(parqueoEncontrado);

            // Extraer tarifas - CORREGIDO (sin usar descripcion)
            let tarifaAuto = 0;
            let tarifaMoto = 0;

            if (parqueoEncontrado.tarifas && parqueoEncontrado.tarifas.length > 0) {
                // ✅ CORREGIDO: Buscar solo por tipoVehiculoId
                const tarifaAutoObj = parqueoEncontrado.tarifas.find(t => t.tipoVehiculoId === 1);
                const tarifaMotoObj = parqueoEncontrado.tarifas.find(t => t.tipoVehiculoId === 2);

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

            setTarifasReales({
                auto: tarifaAuto,
                moto: tarifaMoto
            });

            // Convertir plazas reales
            const plazasConvertidas: Espacio[] = parqueoEncontrado.plazas
                ?.filter(plaza => {
                    const estaDisponible = plaza.estado === 'DISPONIBLE' || plaza.estado === 'libre' || plaza.estado === null;
                    return estaDisponible;
                })
                .map(plaza => ({
                    id: plaza.id.toString(),
                    tipo: plaza.tipoVehiculoId === 1 ? 'auto' as const : 'moto' as const,
                    estado: 'libre' as const,
                    nroPlazaReal: plaza.nroPlaza,
                    plazaIdReal: plaza.id
                })) || [];

            console.log('🅿️ Plazas disponibles cargadas:', {
                parqueoId: parqueoEncontrado.id,
                parqueoNombre: parqueoEncontrado.nombre,
                totalPlazas: parqueoEncontrado.plazas?.length || 0,
                disponibles: plazasConvertidas.length,
                tarifas: { auto: tarifaAuto, moto: tarifaMoto },
            });

            setPlazasReales(plazasConvertidas);

        } catch (error: any) {
            console.error('❌ Error cargando datos del parqueo:', error);
            Alert.alert('Error', 'No se pudieron cargar los datos del parqueo: ' + error.message);
            
            setTarifasReales({ auto: 8.5, moto: 4.0 });
            setPlazasReales([]);
        } finally {
            setIsLoading(false);
        }
    }, [parqueoId]);

    // Efecto para cargar datos al iniciar
    useEffect(() => {
        cargarPlazasDisponibles();
    }, [cargarPlazasDisponibles]);

    // Recargar plazas cuando la pantalla recibe foco
    useFocusEffect(
        useCallback(() => {
            cargarPlazasDisponibles();
        }, [cargarPlazasDisponibles])
    );

    // Función para crear reserva en API
    const crearReservaEnAPI = async (reservaData: ReservaData) => {
        try {
            if (!userData) {
                throw new Error('Usuario no autenticado');
            }

            const reservaPayload: ReservaPayload = {
                fechaHoraIni: reservaData.fechaInicioISO,
                fechaHoraFin: reservaData.fechaFinISO,
                plazaId: parseInt(reservaData.plazaId),
                usuarioId: parseInt(userData.id),
                matriculaVehiculo: reservaData.matricula
            };

            console.log('📤 Enviando reserva a API:', reservaPayload);

            const response = await fetch('https://parkado-backend.vercel.app/api/reservas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userData.token}`
                },
                body: JSON.stringify(reservaPayload)
            });

            const responseData = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    throw new Error('Conflicto de Horario: La plaza ya está reservada en ese rango.');
                }
                throw new Error(responseData.message || `Error ${response.status} al crear la reserva`);
            }

            console.log('✅ Reserva creada exitosamente:', responseData);
            return responseData;

        } catch (error: any) {
            console.error('❌ Error creando reserva:', error);
            throw error;
        }
    };

    // Función para actualizar estado de plaza
    const actualizarEstadoPlaza = async (plazaId: number) => {
        try {
            if (!userData) {
                throw new Error('Usuario no autenticado');
            }

            const updatePayload = {
                userId: 2,
                estado: "OCUPADO"
            };

            console.log('🔄 Actualizando estado de plaza:', { plazaId, updatePayload });

            const response = await fetch(`https://parkado-backend.vercel.app/api/plazas/${plazaId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userData.token}`
                },
                body: JSON.stringify(updatePayload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status} al actualizar plaza`);
            }

            const responseData = await response.json();
            console.log('✅ Estado de plaza actualizado exitosamente:', responseData);
            return responseData;

        } catch (error: any) {
            console.error('❌ Error actualizando estado de plaza:', error);
            throw error;
        }
    };

    // Memoized calculations
    const plazasDisponiblesPorTipo = useMemo(() => {
        const autos = plazasReales.filter(p => p.tipo === 'auto').length;
        const motos = plazasReales.filter(p => p.tipo === 'moto').length;
        
        console.log(`🎯 Plazas disponibles - Autos: ${autos}, Motos: ${motos}`);
        
        return { autos, motos };
    }, [plazasReales]);

    const plazasDisponiblesParaTipo = useMemo(() => {
        const disponibles = plazasReales.filter(p => 
            p.tipo === tipoVehiculo && 
            p.estado === 'libre'
        );
        
        console.log(`🎯 Plazas ${tipoVehiculo} disponibles:`, disponibles.length);
        return disponibles;
    }, [plazasReales, tipoVehiculo]);

    const costoTotal = useMemo(() => {
        const diffMs = fechaFin.getTime() - fechaInicio.getTime(); 
        if (diffMs <= 0) return 0;
        
        const horas = diffMs / 3600000; 
        const tarifaAplicable = tipoVehiculo === 'auto' ? tarifasReales.auto : tarifasReales.moto;
        return parseFloat((horas * tarifaAplicable).toFixed(2));
    }, [fechaInicio, fechaFin, tipoVehiculo, tarifasReales]);

    // Resetear plaza seleccionada al cambiar tipo de vehículo
    useEffect(() => { 
        setPlazaSeleccionadaId(null); 
    }, [tipoVehiculo]);

    // Handler principal para confirmar reserva
    const handleConfirmarReserva = async () => {
        if (!plazaSeleccionadaId) { 
            Alert.alert("Requerido", "Selecciona una plaza."); 
            return; 
        }
        
        const matriculaLimpia = matricula.trim().toUpperCase();
        if (!matriculaLimpia || matriculaLimpia.length < 4) { 
            Alert.alert("Requerido", "Ingresa una matrícula válida."); 
            return; 
        }
        
        if (costoTotal <= 0) { 
            Alert.alert("Inválido", "Verifica las fechas."); 
            return; 
        }
        
        if (!datosParqueo?.latitud || !datosParqueo?.longitud) {
            Alert.alert("Error Interno", "No se pudieron obtener las coordenadas del parqueo.");
            return;
        }

        if (!userData) {
            Alert.alert(
                "Sesión Requerida", 
                "Debes iniciar sesión para hacer una reserva.",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Iniciar Sesión", onPress: () => router.push('/LoginUsuario') }
                ]
            );
            return;
        }

        const plazaSeleccionada = plazasReales.find(p => p.id === plazaSeleccionadaId);
        
        if (!plazaSeleccionada || plazaSeleccionada.estado !== 'libre') {
            Alert.alert("Plaza no disponible", "La plaza seleccionada ya no está disponible. Por favor selecciona otra.");
            cargarPlazasDisponibles();
            setPlazaSeleccionadaId(null);
            return;
        }

        const nroPlazaReal = plazaSeleccionada?.nroPlazaReal || plazaSeleccionadaId;

        const reservaData: ReservaData = {
            parqueoId: parqueoId,
            parqueoNombre: datosParqueo.nombre || parqueoNombreParam,
            plazaId: plazaSeleccionadaId,
            nroPlazaReal: nroPlazaReal,
            tipoVehiculo: tipoVehiculo,
            matricula: matriculaLimpia,
            fechaInicioISO: fechaInicio.toISOString(),
            fechaFinISO: fechaFin.toISOString(),
            fechaInicioFormatted: fechaInicio.toLocaleString('es-BO'),
            fechaFinFormatted: fechaFin.toLocaleString('es-BO'),
            costoTotal: costoTotal.toString(),
            costoTotalFormatted: `${costoTotal.toFixed(2)} Bs`,
            metodoPago: metodoPago,
            parqueoLat: datosParqueo.latitud.toString(),
            parqueoLng: datosParqueo.longitud.toString(),
            tarifaAplicada: (tipoVehiculo === 'auto' ? tarifasReales.auto : tarifasReales.moto).toString(),
            tarifaAuto: tarifasReales.auto.toString(),
            tarifaMoto: tarifasReales.moto.toString(),
            usuarioId: userData.id,
            usuarioEmail: userData.email,
            usuarioNombre: userData.nombre,
            timestamp: Date.now().toString()
        };

        console.log('📋 Datos de reserva completos para pago:', reservaData);

        try {
            setIsCreatingReserva(true);

            if (metodoPago === 'Efectivo') {
                const reservaCreada = await crearReservaEnAPI(reservaData);
                
                const plazaIdReal = parseInt(plazaSeleccionadaId);
                await actualizarEstadoPlaza(plazaIdReal);
                
                setPlazasReales(prev => 
                    prev.map(plaza => 
                        plaza.id === plazaSeleccionadaId 
                            ? { ...plaza, estado: 'ocupado' as const }
                            : plaza
                    )
                );

                setTimeout(() => {
                    cargarPlazasDisponibles();
                }, 1000);
                
                Alert.alert(
                    "✅ Reserva Confirmada", 
                    `Detalles:\n• Parqueo: ${reservaData.parqueoNombre}\n• Plaza: ${reservaData.nroPlazaReal}\n• Vehículo: ${tipoVehiculo}\n• Matrícula: ${matriculaLimpia}\n• Horario: ${fechaInicio.toLocaleString()} - ${fechaFin.toLocaleString()}\n• Costo: ${costoTotal.toFixed(2)} Bs\n• Método: ${metodoPago}\n• ID Reserva: ${reservaCreada.id}`,
                    [{ 
                        text: "Ver Ruta", 
                        onPress: () => {
                            router.push({
                                pathname: '/(tabs)/Mapa' as any,
                                params: {
                                    destLat: reservaData.parqueoLat,
                                    destLng: reservaData.parqueoLng,
                                    destNombre: reservaData.parqueoNombre,
                                    reservaId: reservaCreada.id?.toString() || 'N/A'
                                }
                            });
                        }
                    }] 
                );
            } else if (metodoPago === 'QR') {
                console.log('🔄 Navegando a PagoQR con datos:', reservaData);
                router.push({ 
                    pathname: '/PagoQR' as any, 
                    params: reservaData 
                });
            } else if (metodoPago === 'Tarjeta') {
                console.log('🔄 Navegando a PagoTarjeta con datos:', reservaData);
                router.push({ 
                    pathname: '/PagoTarjeta' as any, 
                    params: reservaData 
                });
            }

        } catch (error: any) {
            Alert.alert("❌ Error", error.message || "No se pudo crear la reserva");
        } finally {
            setIsCreatingReserva(false);
        }
    };

    return {
        // Estados
        isLoading,
        tipoVehiculo,
        plazasReales,
        plazaSeleccionadaId,
        matricula,
        fechaInicio,
        fechaFin,
        metodoPago,
        showInicioPicker,
        modeInicioPicker,
        showFinPicker,
        modeFinPicker,
        userData,
        isCreatingReserva,
        datosParqueo,
        tarifasReales,
        
        // Setters
        setTipoVehiculo,
        setPlazaSeleccionadaId,
        setMatricula,
        setFechaInicio,
        setFechaFin,
        setMetodoPago,
        setShowInicioPicker,
        setModeInicioPicker,
        setShowFinPicker,
        setModeFinPicker,
        
        // Funciones
        cargarPlazasDisponibles,
        crearReservaEnAPI,
        actualizarEstadoPlaza,
        handleConfirmarReserva,
        
        // Memoizados
        plazasDisponiblesPorTipo,
        plazasDisponiblesParaTipo,
        costoTotal,
    };
}