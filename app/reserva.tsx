import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- TIPOS COMPLETOS ---
interface PlazaAPI {
    id: number;
    nroPlaza: string;
    ubicacionPiso: string | null;
    estado: string | null;
    parqueoId: number;
    tipoVehiculoId: number;
}

interface CapacidadAPI {
    id: number;
    cantidad: number;
    parqueoId: number;
    tipoVehiculoId: number;
    tipoVehiculo: {
        id: number;
        nombre: string;
        descripcion: string;
    };
}

interface TarifaAPI {
    id: number;
    descripcion: string;
    precioHora: string;
    precioDia: string | null;
    estado: string | null;
    parqueoId: number;
    tipoVehiculoId: number;
}

interface ParqueoDetalleAPI {
    id: number;
    nombre: string;
    direccion: string;
    tipoLugar: string;
    latitud: number;
    longitud: number;
    horarios: any[];
    calificaciones: any[];
    capacidades: CapacidadAPI[];
    servicios: any[];
    plazas: PlazaAPI[];
    tarifas: TarifaAPI[];
    fotos: any[];
    propietarioId: number;
}

interface UserData {
    id: string;
    email: string;
    token: string;
    nombre: string;
}

type Espacio = { 
    id: string; 
    tipo: 'auto' | 'moto'; 
    estado: 'libre' | 'ocupado' | 'mantenimiento';
    nroPlazaReal: string;
    plazaIdReal: number;
};

type Tarifas = { auto: number; moto: number; };

const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'QR'];

// --- COMPONENTE PRINCIPAL COMPLETO Y CORREGIDO ---
export default function ReservaScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        parqueoId?: string;
        parqueoNombre?: string;
    }>();

    const parqueoId = params.parqueoId ?? 'N/A';
    const parqueoNombreParam = params.parqueoNombre ?? 'Parqueo Desconocido';

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
    
    // ESTADOS PARA DATOS REALES DE LA API
    const [datosParqueo, setDatosParqueo] = useState<ParqueoDetalleAPI | null>(null);
    const [tarifasReales, setTarifasReales] = useState<Tarifas>({ auto: 0, moto: 0 });

    // --- CARGAR DATOS DEL USUARIO DESDE ASYNC STORAGE ---
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

    // --- FUNCIÓN PARA CARGAR PLAZAS DISPONIBLES - USANDO ENDPOINT CORRECTO ---
const cargarPlazasDisponibles = useCallback(async () => {
    try {
        console.log('🔄 Cargando plazas disponibles para parqueo ID:', parqueoId);
        
        // ✅ USAR EL ENDPOINT CORRECTO QUE SÍ EXISTE
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
            tarifasDetalles: parqueoEncontrado.tarifas
        });

        setDatosParqueo(parqueoEncontrado);

        // ✅ EXTRAER TARIFAS - MÉTODO ROBUSTO
        let tarifaAuto = 0;
        let tarifaMoto = 0;

        if (parqueoEncontrado.tarifas && parqueoEncontrado.tarifas.length > 0) {
            // Buscar por tipoVehiculoId (más confiable)
            const tarifaAutoObj = parqueoEncontrado.tarifas.find(t => t.tipoVehiculoId === 1);
            const tarifaMotoObj = parqueoEncontrado.tarifas.find(t => t.tipoVehiculoId === 2);
            
            // Si no encuentra por ID, buscar por descripción
            const tarifaAutoPorDesc = tarifaAutoObj || parqueoEncontrado.tarifas.find(t => 
                t.descripcion.toLowerCase().includes('auto')
            );
            const tarifaMotoPorDesc = tarifaMotoObj || parqueoEncontrado.tarifas.find(t => 
                t.descripcion.toLowerCase().includes('moto')
            );

            tarifaAuto = tarifaAutoPorDesc ? parseFloat(tarifaAutoPorDesc.precioHora) : 0;
            tarifaMoto = tarifaMotoPorDesc ? parseFloat(tarifaMotoPorDesc.precioHora) : 0;

            console.log('💰 Tarifas extraídas:', {
                auto: tarifaAuto,
                moto: tarifaMoto,
                encontradoAuto: !!tarifaAutoPorDesc,
                encontradoMoto: !!tarifaMotoPorDesc,
                todasLasTarifas: parqueoEncontrado.tarifas.map(t => ({
                    id: t.id,
                    descripcion: t.descripcion,
                    precioHora: t.precioHora,
                    tipoVehiculoId: t.tipoVehiculoId
                }))
            });
        } else {
            console.warn('⚠️ Este parqueo no tiene tarifas definidas');
            // Usar tarifas por defecto si no hay
            tarifaAuto = 8.5;
            tarifaMoto = 4.0;
        }

        setTarifasReales({
            auto: tarifaAuto,
            moto: tarifaMoto
        });

        // CONVERTIR PLAZAS REALES DE LA API AL FORMATO QUE USA EL COMPONENTE
        const plazasConvertidas: Espacio[] = parqueoEncontrado.plazas
            ?.filter(plaza => {
                // Filtrar solo plazas DISPONIBLES
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
            todasLasPlazas: parqueoEncontrado.plazas?.map(p => ({
                id: p.id,
                nroPlaza: p.nroPlaza,
                tipoVehiculoId: p.tipoVehiculoId,
                estado: p.estado
            }))
        });

        setPlazasReales(plazasConvertidas);

    } catch (error: any) {
        console.error('❌ Error cargando datos del parqueo:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos del parqueo: ' + error.message);
        
        // CARGAR DATOS POR DEFECTO EN CASO DE ERROR
        setTarifasReales({ auto: 8.5, moto: 4.0 });
        setPlazasReales([]);
    } finally {
        setIsLoading(false);
    }
}, [parqueoId]);

    // --- EFECTO PARA CARGAR DATOS AL INICIAR Y AL ENFOCAR ---
    useEffect(() => {
        cargarPlazasDisponibles();
    }, [cargarPlazasDisponibles]);

    // Recargar plazas cuando la pantalla recibe foco
    useFocusEffect(
        useCallback(() => {
            cargarPlazasDisponibles();
        }, [cargarPlazasDisponibles])
    );

    // --- FUNCIÓN PARA CREAR RESERVA EN LA API ---
    const crearReservaEnAPI = async (reservaData: any) => {
        try {
            if (!userData) {
                throw new Error('Usuario no autenticado');
            }

            const reservaPayload = {
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

    // --- FUNCIÓN PARA ACTUALIZAR ESTADO DE PLAZA A OCUPADO ---
    const actualizarEstadoPlaza = async (plazaId: number) => {
        try {
            if (!userData) {
                throw new Error('Usuario no autenticado');
            }

            const updatePayload = {
                userId: 2, // propietariold del parqueo
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

    // CALCULAR PLAZAS DISPONIBLES POR TIPO PARA LOS BOTONES
    const plazasDisponiblesPorTipo = useMemo(() => {
        const autos = plazasReales.filter(p => p.tipo === 'auto').length;
        const motos = plazasReales.filter(p => p.tipo === 'moto').length;
        
        console.log(`🎯 Plazas disponibles - Autos: ${autos}, Motos: ${motos}`);
        
        return { autos, motos };
    }, [plazasReales]);

    // FILTRAR PLAZAS DISPONIBLES POR TIPO - MEJORADO
    const plazasDisponiblesParaTipo = useMemo(() => {
        const disponibles = plazasReales.filter(p => 
            p.tipo === tipoVehiculo && 
            p.estado === 'libre'
        );
        
        console.log(`🎯 Plazas ${tipoVehiculo} disponibles:`, disponibles.length);
        return disponibles;
    }, [plazasReales, tipoVehiculo]);

    // CALCULAR COSTO TOTAL CON TARIFAS REALES
    const costoTotal = useMemo(() => {
        const diffMs = fechaFin.getTime() - fechaInicio.getTime(); 
        if (diffMs <= 0) return 0;
        
        const horas = diffMs / 3600000; 
        const tarifaAplicable = tipoVehiculo === 'auto' ? tarifasReales.auto : tarifasReales.moto;
        return parseFloat((horas * tarifaAplicable).toFixed(2));
    }, [fechaInicio, fechaFin, tipoVehiculo, tarifasReales]);

    // RESETAR PLAZA SELECCIONADA AL CAMBIAR TIPO DE VEHÍCULO
    useEffect(() => { 
        setPlazaSeleccionadaId(null); 
    }, [tipoVehiculo]);

    // FUNCIONES DATETIMEPICKER
    const onChangeInicio = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || fechaInicio; 
        setShowInicioPicker(Platform.OS === 'ios');
        if (currentDate >= fechaFin) { 
            const nueva = new Date(currentDate); 
            nueva.setHours(nueva.getHours() + 1); 
            setFechaFin(nueva); 
        }
        setFechaInicio(currentDate);
    };

    const showInicioMode = (currentMode: 'date' | 'time') => { 
        setShowInicioPicker(true); 
        setModeInicioPicker(currentMode); 
    };

    const onChangeFin = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || fechaFin; 
        setShowFinPicker(Platform.OS === 'ios');
        if (currentDate > fechaInicio) { 
            setFechaFin(currentDate); 
        } else if (selectedDate) { 
            Alert.alert("Inválido", "Fin debe ser posterior a inicio."); 
            const nueva = new Date(fechaInicio); 
            nueva.setHours(nueva.getHours() + 1); 
            setFechaFin(nueva); 
        }
    };

    const showFinMode = (currentMode: 'date' | 'time') => { 
        setShowFinPicker(true); 
        setModeFinPicker(currentMode); 
    };

    // --- MANEJADOR DE CONFIRMACIÓN MEJORADO ---
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
        
        // VERIFICAR QUE LA PLAZA SIGA DISPONIBLE
        if (!plazaSeleccionada || plazaSeleccionada.estado !== 'libre') {
            Alert.alert("Plaza no disponible", "La plaza seleccionada ya no está disponible. Por favor selecciona otra.");
            // Recargar plazas disponibles
            cargarPlazasDisponibles();
            setPlazaSeleccionadaId(null);
            return;
        }

        const nroPlazaReal = plazaSeleccionada?.nroPlazaReal || plazaSeleccionadaId;

        const reservaData = {
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
                
                // ACTUALIZAR PLAZA A OCUPADO
                const plazaIdReal = parseInt(plazaSeleccionadaId);
                await actualizarEstadoPlaza(plazaIdReal);
                
                // ACTUALIZAR ESTADO LOCAL Y RECARGAR PLAZAS DISPONIBLES
                setPlazasReales(prev => 
                    prev.map(plaza => 
                        plaza.id === plazaSeleccionadaId 
                            ? { ...plaza, estado: 'ocupado' as const }
                            : plaza
                    )
                );

                // Recargar plazas disponibles
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

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-[#F6EEE4]">
                <ActivityIndicator size="large" color="#7BB5CB" />
                <Text className="mt-2 text-black">Cargando plazas disponibles...</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-[#F6EEE4]" contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
            {/* Botón Volver */}
            <TouchableOpacity onPress={() => router.back()} className="absolute top-12 left-5 z-10 p-2 rounded-full bg-black/50">
                <Feather name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            
            {/* Título */}
            <Text className="text-2xl font-bold text-center text-black mt-10 mb-1">
                {datosParqueo?.nombre || parqueoNombreParam}
            </Text>
            <Text className="text-sm text-center text-gray-600 mb-6">
                {datosParqueo?.direccion || 'Dirección no disponible'}
            </Text>

            {/* Indicador de usuario */}
            {userData ? (
                <View className="bg-green-50 p-3 rounded-lg mb-4 border border-green-200">
                    <Text className="text-green-800 text-sm">
                        ✅ Sesión iniciada como: {userData.email}
                    </Text>
                </View>
            ) : (
                <View className="bg-yellow-50 p-3 rounded-lg mb-4 border border-yellow-200">
                    <Text className="text-yellow-800 text-sm">
                        ⚠️ Debes iniciar sesión para hacer una reserva
                    </Text>
                    <TouchableOpacity 
                        onPress={() => router.push('/LoginUsuario')}
                        className="mt-2 bg-[#7BB5CB] py-2 px-4 rounded-lg"
                    >
                        <Text className="text-white text-center font-semibold">Iniciar Sesión</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* === SECCIÓN 1: TIPO DE VEHÍCULO === */}
            <Text className="text-base font-semibold text-black mt-5 mb-2">Selecciona tu vehículo</Text>
            <View className="flex-row gap-3 mb-3">
                {/* BOTÓN MOTOS */}
                <TouchableOpacity 
                    className={`flex-1 py-4 rounded-lg items-center justify-center shadow-lg ${tipoVehiculo === 'moto' ? 'bg-[#7BB5CB]' : 'bg-[#7BB5CB]/30'}`} 
                    onPress={() => setTipoVehiculo('moto')} 
                    activeOpacity={0.7}
                >
                    <FontAwesome5 name="motorcycle" size={24} color={tipoVehiculo === 'moto' ? '#F6EEE4' : '#7BB5CB'} />
                    <Text className={`text-xs font-semibold mt-2 ${tipoVehiculo === 'moto' ? 'text-white' : 'text-black'}`}>Motos</Text>
                    <Text className={`text-2xl font-bold ${tipoVehiculo === 'moto' ? 'text-white' : 'text-black'}`}>
                        {plazasDisponiblesPorTipo.motos}
                    </Text>
                    <Text className={`text-xs ${tipoVehiculo === 'moto' ? 'text-white' : 'text-black'}`}>
                        {tarifasReales.moto} Bs/h
                    </Text>
                </TouchableOpacity>

                {/* BOTÓN AUTOS */}
                <TouchableOpacity 
                    className={`flex-1 py-4 rounded-lg items-center justify-center shadow-lg ${tipoVehiculo === 'auto' ? 'bg-[#7BB5CB]' : 'bg-[#7BB5CB]/30'}`} 
                    onPress={() => setTipoVehiculo('auto')} 
                    activeOpacity={0.7}
                >
                    <FontAwesome5 name="car" size={24} color={tipoVehiculo === 'auto' ? '#F6EEE4' : '#7BB5CB'} />
                    <Text className={`text-xs font-semibold mt-2 ${tipoVehiculo === 'auto' ? 'text-white' : 'text-black'}`}>Autos</Text>
                    <Text className={`text-2xl font-bold ${tipoVehiculo === 'auto' ? 'text-white' : 'text-black'}`}>
                        {plazasDisponiblesPorTipo.autos}
                    </Text>
                    <Text className={`text-xs ${tipoVehiculo === 'auto' ? 'text-white' : 'text-black'}`}>
                        {tarifasReales.auto} Bs/h
                    </Text>
                </TouchableOpacity>
            </View>

            {/* === SECCIÓN 2: PLAZAS DISPONIBLES === */}
            <Text className="text-base font-semibold text-black mt-5 mb-2">
                Plazas disponibles ({plazasDisponiblesParaTipo.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 -mx-1 px-1">
                <View className="flex-row py-1 gap-2">
                    {plazasDisponiblesParaTipo.length > 0 ? (
                        plazasDisponiblesParaTipo.map(plaza => (
                            <TouchableOpacity 
                                key={plaza.id} 
                                className={`px-4 py-3 rounded-lg border-2 shadow-sm ${plazaSeleccionadaId === plaza.id ? 'bg-[#7BB5CB] border-[#7BB5CB]' : 'bg-white border-[#7BB5CB]'}`} 
                                onPress={() => setPlazaSeleccionadaId(plaza.id)} 
                                activeOpacity={0.7}
                            >
                                <Text className={`font-bold text-base ${plazaSeleccionadaId === plaza.id ? 'text-white' : 'text-[#7BB5CB]'}`}>
                                    {plaza.nroPlazaReal}
                                </Text>
                                <Text className={`text-xs ${plazaSeleccionadaId === plaza.id ? 'text-white' : 'text-gray-600'}`}>
                                    {plaza.tipo === 'auto' ? 'Auto' : 'Moto'}
                                </Text>
                                <Text className={`text-xs ${plazaSeleccionadaId === plaza.id ? 'text-white' : 'text-green-600'}`}>
                                    ● Disponible
                                </Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View className="py-3 px-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <Text className="italic text-black">
                                No hay plazas {tipoVehiculo === 'auto' ? 'de auto' : 'de moto'} disponibles en este momento.
                            </Text>
                            <TouchableOpacity 
                                onPress={cargarPlazasDisponibles}
                                className="mt-2 bg-[#7BB5CB] py-2 px-4 rounded-lg"
                            >
                                <Text className="text-white text-center font-semibold">Recargar</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* === SECCIÓN 3: MATRÍCULA === */}
            <Text className="text-base font-semibold text-black mt-5 mb-2">Matrícula del vehículo</Text>
            <TextInput 
                className="border-2 border-[#7BB5CB] rounded-lg px-4 py-3 text-base bg-white mb-3 shadow-sm" 
                placeholder="Ej: 1234ABC" 
                value={matricula} 
                onChangeText={setMatricula} 
                autoCapitalize="characters" 
                maxLength={10} 
                placeholderTextColor="#999"
            />

            {/* === SECCIÓN 4: FECHA Y HORA DE INICIO === */}
            <Text className="text-base font-semibold text-black mt-5 mb-2">Fecha y Hora de Inicio</Text>
            <View className="flex-row justify-around mb-3">
                <TouchableOpacity 
                    onPress={() => showInicioMode('date')} 
                    className="flex-row items-center bg-white border-2 border-[#7BB5CB] px-4 py-3 rounded-lg gap-2 shadow" 
                    activeOpacity={0.7}
                >
                    <Feather name="calendar" size={18} color="#7BB5CB" />
                    <Text className="text-base text-black">{fechaInicio.toLocaleDateString('es-BO')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => showInicioMode('time')} 
                    className="flex-row items-center bg-white border-2 border-[#7BB5CB] px-4 py-3 rounded-lg gap-2 shadow" 
                    activeOpacity={0.7}
                >
                    <Feather name="clock" size={18} color="#7BB5CB" />
                    <Text className="text-base text-black">
                        {fechaInicio.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit'})}
                    </Text>
                </TouchableOpacity>
            </View>
            {showInicioPicker && (
                <DateTimePicker 
                    testID="inicioDateTimePicker" 
                    value={fechaInicio} 
                    mode={modeInicioPicker} 
                    is24Hour={true} 
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
                    onChange={onChangeInicio} 
                    minimumDate={new Date()} 
                />
            )}

            {/* === SECCIÓN 5: FECHA Y HORA DE FIN === */}
            <Text className="text-base font-semibold text-black mt-5 mb-2">Fecha y Hora de Fin</Text>
            <View className="flex-row justify-around mb-3">
                <TouchableOpacity 
                    onPress={() => showFinMode('date')} 
                    className="flex-row items-center bg-white border-2 border-[#7BB5CB] px-4 py-3 rounded-lg gap-2 shadow" 
                    activeOpacity={0.7}
                >
                    <Feather name="calendar" size={18} color="#7BB5CB" />
                    <Text className="text-base text-black">{fechaFin.toLocaleDateString('es-BO')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => showFinMode('time')} 
                    className="flex-row items-center bg-white border-2 border-[#7BB5CB] px-4 py-3 rounded-lg gap-2 shadow" 
                    activeOpacity={0.7}
                >
                    <Feather name="clock" size={18} color="#7BB5CB" />
                    <Text className="text-base text-black">
                        {fechaFin.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit'})}
                    </Text>
                </TouchableOpacity>
            </View>
            {showFinPicker && (
                <DateTimePicker 
                    testID="finDateTimePicker" 
                    value={fechaFin} 
                    mode={modeFinPicker} 
                    is24Hour={true} 
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
                    onChange={onChangeFin} 
                    minimumDate={fechaInicio} 
                />
            )}

            {/* === SECCIÓN 6: MÉTODO DE PAGO === */}
            <Text className="text-base font-semibold text-black mt-5 mb-2">Método de Pago</Text>
            <View className="flex-row gap-2 mb-3 flex-wrap">
                {METODOS_PAGO.map(metodo => (
                    <TouchableOpacity 
                        key={metodo} 
                        className={`px-4 py-3 rounded-lg border-2 shadow-sm ${metodoPago === metodo ? 'bg-[#7BB5CB] border-[#7BB5CB]' : 'bg-white border-[#7BB5CB]'}`} 
                        onPress={() => setMetodoPago(metodo)} 
                        activeOpacity={0.7}
                    >
                        <Text className={`text-sm font-bold ${metodoPago === metodo ? 'text-white' : 'text-[#7BB5CB]'}`}>
                            {metodo}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* === SECCIÓN 7: RESUMEN === */}
            <View className="mt-6 mb-6 p-4 bg-white rounded-lg border-2 border-[#7BB5CB] shadow">
                <Text className="text-lg font-bold mb-3 text-black text-center">Resumen de Reserva</Text>
                <View className="space-y-2">
                    <View className="flex-row justify-between">
                        <Text className="text-black">Plaza:</Text>
                        <Text className="font-medium text-black">{plazaSeleccionadaId ? plazasReales.find(p => p.id === plazaSeleccionadaId)?.nroPlazaReal : 'No seleccionada'}</Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-black">Tipo:</Text>
                        <Text className="font-medium text-black">{tipoVehiculo === 'auto' ? 'Auto' : 'Moto'}</Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-black">Matrícula:</Text>
                        <Text className="font-medium text-black">{matricula.toUpperCase() || 'No ingresada'}</Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-black">Desde:</Text>
                        <Text className="font-medium text-black text-right">
                            {fechaInicio.toLocaleDateString('es-BO')} {fechaInicio.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit'})}
                        </Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-black">Hasta:</Text>
                        <Text className="font-medium text-black text-right">
                            {fechaFin.toLocaleDateString('es-BO')} {fechaFin.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit'})}
                        </Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-black">Método:</Text>
                        <Text className="font-medium text-black">{metodoPago}</Text>
                    </View>
                    <View className="border-t border-gray-300 pt-2 mt-2">
                        <View className="flex-row justify-between">
                            <Text className="text-lg font-bold text-black">Total a pagar:</Text>
                            <Text className="text-lg font-bold text-[#7BB5CB]">{costoTotal.toFixed(2)} Bs</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* === SECCIÓN 8: BOTÓN CONFIRMAR === */}
            <TouchableOpacity 
                className={`py-4 rounded-lg items-center mt-3 mb-5 shadow-xl ${(!plazaSeleccionadaId || !matricula.trim() || costoTotal <= 0 || isCreatingReserva || !userData) ? 'bg-gray-400' : 'bg-[#FD721D]'}`} 
                onPress={handleConfirmarReserva} 
                disabled={!plazaSeleccionadaId || !matricula.trim() || costoTotal <= 0 || isCreatingReserva || !userData} 
                activeOpacity={0.8}
            >
                {isCreatingReserva ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                    <Text className="text-white text-lg font-bold">
                        {!userData ? 'Inicia sesión primero' :
                         !plazaSeleccionadaId ? 'Selecciona una plaza' : 
                         !matricula.trim() ? 'Ingresa la matrícula' : 
                         costoTotal <= 0 ? 'Verifica las fechas' : 
                         'Confirmar Reserva'}
                    </Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}