import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

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

type Espacio = { 
    id: string; 
    tipo: 'auto' | 'moto'; 
    estado: 'libre' | 'ocupado';
    nroPlazaReal: string;
    plazaIdReal: number;
};

type Tarifas = { auto: number; moto: number; };

const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'QR'];

// --- COMPONENTE PRINCIPAL COMPLETO ---
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
    
    // ESTADOS PARA DATOS REALES DE LA API
    const [datosParqueo, setDatosParqueo] = useState<ParqueoDetalleAPI | null>(null);
    const [tarifasReales, setTarifasReales] = useState<Tarifas>({ auto: 0, moto: 0 });
    const [capacidadesReales, setCapacidadesReales] = useState({ autos: 0, motos: 0 });

    // --- EFECTO PARA CARGAR DATOS REALES DE LA API ---
    useEffect(() => {
        const cargarDatosReales = async () => {
            try {
                console.log('🔄 Cargando datos reales del parqueo ID:', parqueoId);
                
                const url = `https://parkado-backend.vercel.app/api/parqueos/details`;
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

                console.log('✅ Datos reales cargados:', {
                    nombre: parqueoEncontrado.nombre,
                    plazas: parqueoEncontrado.plazas?.length || 0,
                    tarifas: parqueoEncontrado.tarifas?.length || 0,
                    capacidades: parqueoEncontrado.capacidades?.length || 0
                });

                setDatosParqueo(parqueoEncontrado);

                // EXTRAER TARIFAS REALES
                const tarifaAutoObj = parqueoEncontrado.tarifas?.find(t => 
                    t.tipoVehiculoId === 1 || t.descripcion.toLowerCase().includes('auto')
                );
                const tarifaMotoObj = parqueoEncontrado.tarifas?.find(t => 
                    t.tipoVehiculoId === 2 || t.descripcion.toLowerCase().includes('moto')
                );

                setTarifasReales({
                    auto: tarifaAutoObj ? parseFloat(tarifaAutoObj.precioHora) : 0,
                    moto: tarifaMotoObj ? parseFloat(tarifaMotoObj.precioHora) : 0
                });

                // EXTRAER CAPACIDADES REALES
                const capacidadAutoObj = parqueoEncontrado.capacidades?.find(c => 
                    c.tipoVehiculoId === 1 || c.tipoVehiculo.nombre.toLowerCase().includes('auto')
                );
                const capacidadMotoObj = parqueoEncontrado.capacidades?.find(c => 
                    c.tipoVehiculoId === 2 || c.tipoVehiculo.nombre.toLowerCase().includes('moto')
                );

                setCapacidadesReales({
                    autos: capacidadAutoObj ? capacidadAutoObj.cantidad : 0,
                    motos: capacidadMotoObj ? capacidadMotoObj.cantidad : 0
                });

                // CONVERTIR PLAZAS REALES DE LA API AL FORMATO QUE USA EL COMPONENTE
                const plazasConvertidas: Espacio[] = parqueoEncontrado.plazas?.map(plaza => ({
                    id: plaza.id.toString(),
                    tipo: plaza.tipoVehiculoId === 1 ? 'auto' as const : 'moto' as const,
                    estado: (plaza.estado === 'ocupado' ? 'ocupado' : 'libre') as 'libre' | 'ocupado',
                    nroPlazaReal: plaza.nroPlaza,
                    plazaIdReal: plaza.id
                })) || [];

                console.log('🅿️ Plazas convertidas:', plazasConvertidas);
                setPlazasReales(plazasConvertidas);

            } catch (error: any) {
                console.error('❌ Error cargando datos reales:', error);
                Alert.alert('Error', 'No se pudieron cargar los datos del parqueo: ' + error.message);
            } finally {
                setIsLoading(false);
            }
        };

        cargarDatosReales();
    }, [parqueoId]);

    // FILTRAR PLAZAS DISPONIBLES POR TIPO
    const plazasDisponiblesParaTipo = useMemo(() => 
        plazasReales.filter(p => p.tipo === tipoVehiculo && p.estado === 'libre'), 
        [plazasReales, tipoVehiculo]
    );

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

    const handleConfirmarReserva = () => {
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

        const plazaSeleccionada = plazasReales.find(p => p.id === plazaSeleccionadaId);
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
            costoTotal: costoTotal.toString(),
            metodoPago: metodoPago,
            parqueoLat: datosParqueo.latitud.toString(),
            parqueoLng: datosParqueo.longitud.toString(),
            tarifaAplicada: (tipoVehiculo === 'auto' ? tarifasReales.auto : tarifasReales.moto).toString(),
            tarifaAuto: tarifasReales.auto.toString(),
            tarifaMoto: tarifasReales.moto.toString()
        };

        console.log('📋 Datos de reserva completos:', reservaData);

        if (metodoPago === 'QR') {
            router.push({ pathname: '/PagoQR' as any, params: reservaData });
        } else if (metodoPago === 'Tarjeta') {
            router.push({ pathname: '/PagoTarjeta' as any, params: reservaData });
        } else {
            Alert.alert(
                "Confirmada (Efectivo)", 
                `Detalles:\n• Parqueo: ${reservaData.parqueoNombre}\n• Plaza: ${reservaData.nroPlazaReal}\n• Vehículo: ${tipoVehiculo}\n• Matrícula: ${matriculaLimpia}\n• Horario: ${fechaInicio.toLocaleString()} - ${fechaFin.toLocaleString()}\n• Costo: ${costoTotal.toFixed(2)} Bs\n• Método: ${metodoPago}`,
                [{ text: "OK", onPress: () => router.back() }] 
            );
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-[#F6EEE4]">
                <ActivityIndicator size="large" color="#7BB5CB" />
                <Text className="mt-2 text-black">Cargando datos del parqueo...</Text>
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
                        {capacidadesReales.motos}
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
                        {capacidadesReales.autos}
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
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View className="py-3 px-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <Text className="italic text-black">
                                No hay plazas {tipoVehiculo === 'auto' ? 'de auto' : 'de moto'} disponibles.
                            </Text>
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
                className={`py-4 rounded-lg items-center mt-3 mb-5 shadow-xl ${(!plazaSeleccionadaId || !matricula.trim() || costoTotal <= 0) ? 'bg-gray-400' : 'bg-[#FD721D]'}`} 
                onPress={handleConfirmarReserva} 
                disabled={!plazaSeleccionadaId || !matricula.trim() || costoTotal <= 0} 
                activeOpacity={0.8}
            >
                <Text className="text-white text-lg font-bold">
                    {!plazaSeleccionadaId ? 'Selecciona una plaza' : 
                     !matricula.trim() ? 'Ingresa la matrícula' : 
                     costoTotal <= 0 ? 'Verifica las fechas' : 
                     'Confirmar Reserva'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}