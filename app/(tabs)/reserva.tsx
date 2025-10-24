// Archivo: app/(tabs)/reserva.tsx (o app/reserva.tsx según tu estructura final)
// CON NATIVEWIND y REDIRECCIÓN A PAGOS

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';

// --- TIPOS Y CONSTANTES ---
type Espacio = {
    id: string;
    tipo: 'auto' | 'moto';
    estado: 'libre';
};

type Tarifas = {
    auto: number;
    moto: number;
};

// Genera IDs simulados como 'A-01', 'M-01'
function generarEspaciosSimulados(cAutos: number, cMotos: number): Espacio[] {
    const esp: Espacio[] = [];
    for (let i = 1; i <= cAutos; i++) {
        esp.push({ id: `A-${String(i).padStart(2, '0')}`, tipo: 'auto', estado: 'libre' });
    }
    for (let i = 1; i <= cMotos; i++) {
        esp.push({ id: `M-${String(i).padStart(2, '0')}`, tipo: 'moto', estado: 'libre' });
    }
    return esp;
}

const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'QR'];

// --- COMPONENTE PRINCIPAL ---
export default function ReservaScreen() {
    const router = useRouter();
    const {
        parqueoId,
        parqueoNombre,
        tarifaAuto,
        tarifaMoto,
        capacidadAutos,
        capacidadMotos
    } = useLocalSearchParams<{
        parqueoId: string;
        parqueoNombre: string;
        tarifaAuto: string;
        tarifaMoto: string;
        capacidadAutos: string;
        capacidadMotos: string;
    }>();

    const [isLoading, setIsLoading] = useState(true); // Para la generación inicial de plazas

    // --- Estados del Formulario ---
    const [tipoVehiculo, setTipoVehiculo] = useState<'auto' | 'moto'>('auto');
    const [plazasSimuladas, setPlazasSimuladas] = useState<Espacio[]>([]);
    const [plazaSeleccionadaId, setPlazaSeleccionadaId] = useState<string | null>(null);
    const [matricula, setMatricula] = useState('');
    const [fechaInicio, setFechaInicio] = useState<Date>(new Date());
    const [fechaFin, setFechaFin] = useState<Date>(() => {
        const d = new Date();
        d.setHours(d.getHours() + 1); // 1 hora por defecto
        return d;
    });
    const [metodoPago, setMetodoPago] = useState<string>(METODOS_PAGO[0]);

    // --- Estados para DateTimePicker ---
    const [showInicioPicker, setShowInicioPicker] = useState(false);
    const [modeInicioPicker, setModeInicioPicker] = useState<'date' | 'time'>('date');
    const [showFinPicker, setShowFinPicker] = useState(false);
    const [modeFinPicker, setModeFinPicker] = useState<'date' | 'time'>('date');

    // --- Memos y Efectos ---
    const tarifas: Tarifas = useMemo(() => ({
        auto: parseFloat(tarifaAuto || '0'),
        moto: parseFloat(tarifaMoto || '0')
    }), [tarifaAuto, tarifaMoto]);

    const cAutos = parseInt(capacidadAutos || '0', 10);
    const cMotos = parseInt(capacidadMotos || '0', 10);

    // Genera las plazas simuladas al inicio
    useEffect(() => {
        console.log("RESERVA: Generando plazas simuladas...");
        const plazas = generarEspaciosSimulados(cAutos, cMotos);
        setPlazasSimuladas(plazas);
        setIsLoading(false);
    }, [cAutos, cMotos]);

    // Filtra las plazas disponibles según el tipo seleccionado
    const plazasDisponiblesParaTipo = useMemo(() => {
        return plazasSimuladas.filter(p => p.tipo === tipoVehiculo);
    }, [plazasSimuladas, tipoVehiculo]);

    // Deselecciona la plaza si cambia el tipo de vehículo
    useEffect(() => {
        setPlazaSeleccionadaId(null);
    }, [tipoVehiculo]);

    // Calcula el costo total estimado
    const costoTotal = useMemo(() => {
        const diffMs = fechaFin.getTime() - fechaInicio.getTime();
        if (diffMs <= 0) return 0;
        const horas = diffMs / (1000 * 60 * 60);
        const tarifaAplicable = tipoVehiculo === 'auto' ? tarifas.auto : tarifas.moto;
        const costo = horas * tarifaAplicable;
        return parseFloat(costo.toFixed(2));
    }, [fechaInicio, fechaFin, tipoVehiculo, tarifas]);

    // --- Manejadores de DateTimePicker ---
    const onChangeInicio = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || fechaInicio;
        setShowInicioPicker(Platform.OS === 'ios');
        if (currentDate >= fechaFin) {
            const nuevaFechaFin = new Date(currentDate);
            nuevaFechaFin.setHours(nuevaFechaFin.getHours() + 1);
            setFechaFin(nuevaFechaFin);
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
            Alert.alert("Fecha inválida", "La hora de fin debe ser posterior a la hora de inicio.");
            const nuevaFechaFin = new Date(fechaInicio);
            nuevaFechaFin.setHours(nuevaFechaFin.getHours() + 1);
            setFechaFin(nuevaFechaFin);
        }
    };

     const showFinMode = (currentMode: 'date' | 'time') => {
        setShowFinPicker(true);
        setModeFinPicker(currentMode);
    };

    // --- Manejador de Confirmación (CON REDIRECCIÓN) ---
    const handleConfirmarReserva = () => {
        // --- Validaciones (igual que antes) ---
        if (!plazaSeleccionadaId) {
            Alert.alert("Campo Requerido", "Por favor, selecciona una plaza de parqueo.");
            return;
        }
        const matriculaLimpia = matricula.trim().toUpperCase();
        if (!matriculaLimpia || matriculaLimpia.length < 4) {
            Alert.alert("Campo Requerido", "Ingresa una matrícula válida (mínimo 4 caracteres).");
            return;
        }
        if (costoTotal <= 0) {
             Alert.alert("Fechas Inválidas", "Verifica las fechas y horas de inicio y fin.");
            return;
        }
        // --- Fin Validaciones ---

        // Preparamos los datos de la reserva (usando ISO para fechas)
        const reservaData = {
            parqueoId: parqueoId || '0',
            parqueoNombre: parqueoNombre || 'Desconocido',
            plazaId: plazaSeleccionadaId,
            tipoVehiculo: tipoVehiculo,
            matricula: matriculaLimpia,
            fechaInicioISO: fechaInicio.toISOString(),
            fechaFinISO: fechaFin.toISOString(),
            costoTotal: costoTotal.toString(),
            metodoPago: metodoPago,
        };

        console.log("--- DATOS DE RESERVA PREPARADOS PARA PAGO ---");
        console.log(reservaData);
        console.log("---------------------------------------------");

        // --- Decisión y Redirección según Método de Pago ---
        if (metodoPago === 'QR') {
            console.log("Navegando a Pago QR...");
            router.push({
                pathname: '/PagoQR' as any, // Asume que app/pagoQr.tsx existe
                params: reservaData // Pasamos todos los datos
            });
        } else if (metodoPago === 'Tarjeta') {
            console.log("Navegando a Pago con Tarjeta...");
             router.push({
                pathname: '/PagoTarjeta' as any, // Asume que app/pagoTarjeta.tsx existe
                params: reservaData // Pasamos todos los datos
            });
        } else { // Efectivo (u otro método sin pantalla adicional)
            console.log("Procesando reserva en Efectivo (simulado)...");
            // Mostramos la confirmación directamente
            Alert.alert(
                "Reserva (Simulada) Confirmada - Efectivo",
                `Parqueo: ${reservaData.parqueoNombre}\nPlaza: ${reservaData.plazaId}\nVehículo: ${reservaData.matricula}\nDesde: ${fechaInicio.toLocaleString()}\nHasta: ${fechaFin.toLocaleString()}\nCosto: ${costoTotal.toFixed(2)} Bs\nMétodo: ${reservaData.metodoPago}`,
                [{ text: "¡Listo!", onPress: () => router.back() }] // Volver atrás
            );
        }
    };

    // --- Renderizado ---

    // Muestra carga inicial
    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-100">
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text className="mt-2 text-gray-600">Preparando formulario...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            className="flex-1 bg-gray-50"
            contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
            keyboardShouldPersistTaps="handled"
        >
            {/* Botón Volver */}
            <TouchableOpacity onPress={() => router.back()} className="absolute top-5 left-5 z-10 p-1 rounded-full bg-white/70">
                 <Feather name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>

            {/* Títulos */}
            <Text className="text-2xl font-bold text-center text-gray-800 mt-10 mb-1">{parqueoNombre || 'Reservar Parqueo'}</Text>
            <Text className="text-sm text-center text-gray-500 mb-6">Parqueo ID: {parqueoId}</Text>

            {/* --- Inicio del Formulario --- */}

            {/* 1. Tipo de Vehículo */}
            <Text className="text-base font-semibold text-gray-700 mt-5 mb-2">1. Tipo de Vehículo</Text>
            <View className="flex-row gap-2 mb-3">
                <TouchableOpacity
                    className={`flex-1 py-3 rounded-lg border items-center shadow-sm ${tipoVehiculo === 'auto' ? 'bg-blue-600 border-blue-700 shadow-lg' : 'bg-white border-gray-300'}`}
                    onPress={() => setTipoVehiculo('auto')}
                    activeOpacity={0.7}
                >
                    <Text className={`text-base font-medium ${tipoVehiculo === 'auto' ? 'text-white' : 'text-gray-700'}`}>🚗 Auto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 py-3 rounded-lg border items-center shadow-sm ${tipoVehiculo === 'moto' ? 'bg-blue-600 border-blue-700 shadow-lg' : 'bg-white border-gray-300'}`}
                    onPress={() => setTipoVehiculo('moto')}
                    activeOpacity={0.7}
                >
                    <Text className={`text-base font-medium ${tipoVehiculo === 'moto' ? 'text-white' : 'text-gray-700'}`}>🛵 Moto</Text>
                </TouchableOpacity>
            </View>

            {/* 2. Selección de Plaza */}
            <Text className="text-base font-semibold text-gray-700 mt-5 mb-2">2. Selecciona una Plaza Libre</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 -mx-1 px-1">
                <View className="flex-row py-1 gap-2">
                    {plazasDisponiblesParaTipo.length > 0 ? (
                        plazasDisponiblesParaTipo.map(plaza => (
                            <TouchableOpacity
                                key={plaza.id}
                                className={`px-4 py-2 rounded-full border-2 shadow-sm ${plazaSeleccionadaId === plaza.id ? 'bg-green-600 border-green-700 shadow-md' : 'bg-green-100 border-green-500'}`}
                                onPress={() => setPlazaSeleccionadaId(plaza.id)}
                                activeOpacity={0.7}
                            >
                                <Text className={`font-semibold text-sm ${plazaSeleccionadaId === plaza.id ? 'text-white' : 'text-green-800'}`}>{plaza.id}</Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text className="italic text-gray-500 py-2 px-1">No hay plazas libres para {tipoVehiculo} en este momento.</Text>
                    )}
                </View>
            </ScrollView>

             {/* 3. Matrícula */}
            <Text className="text-base font-semibold text-gray-700 mt-5 mb-2">3. Matrícula del Vehículo</Text>
            <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white mb-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Ej: 1234ABC"
                value={matricula}
                onChangeText={setMatricula}
                autoCapitalize="characters"
                maxLength={10}
                placeholderTextColor="#9ca3af"
            />

            {/* 4. Fecha y Hora de Inicio */}
            <Text className="text-base font-semibold text-gray-700 mt-5 mb-2">4. Fecha y Hora de Inicio</Text>
            <View className="flex-row justify-around mb-3">
                 <TouchableOpacity
                     onPress={() => showInicioMode('date')}
                     className="flex-row items-center bg-gray-100 border border-gray-300 px-4 py-3 rounded-lg gap-2 shadow-sm active:bg-gray-200"
                     activeOpacity={0.7}
                 >
                    <Feather name="calendar" size={18} color="#4b5563" />
                    <Text className="text-base text-gray-700">{fechaInicio.toLocaleDateString()}</Text>
                 </TouchableOpacity>
                 <TouchableOpacity
                     onPress={() => showInicioMode('time')}
                     className="flex-row items-center bg-gray-100 border border-gray-300 px-4 py-3 rounded-lg gap-2 shadow-sm active:bg-gray-200"
                     activeOpacity={0.7}
                  >
                    <Feather name="clock" size={18} color="#4b5563" />
                    <Text className="text-base text-gray-700">{fechaInicio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</Text>
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

             {/* 5. Fecha y Hora de Fin */}
            <Text className="text-base font-semibold text-gray-700 mt-5 mb-2">5. Fecha y Hora de Fin</Text>
             <View className="flex-row justify-around mb-3">
                 <TouchableOpacity
                     onPress={() => showFinMode('date')}
                     className="flex-row items-center bg-gray-100 border border-gray-300 px-4 py-3 rounded-lg gap-2 shadow-sm active:bg-gray-200"
                     activeOpacity={0.7}
                 >
                    <Feather name="calendar" size={18} color="#4b5563" />
                    <Text className="text-base text-gray-700">{fechaFin.toLocaleDateString()}</Text>
                 </TouchableOpacity>
                 <TouchableOpacity
                     onPress={() => showFinMode('time')}
                     className="flex-row items-center bg-gray-100 border border-gray-300 px-4 py-3 rounded-lg gap-2 shadow-sm active:bg-gray-200"
                     activeOpacity={0.7}
                  >
                    <Feather name="clock" size={18} color="#4b5563" />
                    <Text className="text-base text-gray-700">{fechaFin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</Text>
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

            {/* 6. Método de Pago */}
            <Text className="text-base font-semibold text-gray-700 mt-5 mb-2">6. Método de Pago</Text>
            <View className="flex-row gap-2 mb-3 flex-wrap">
                {METODOS_PAGO.map(metodo => (
                     <TouchableOpacity
                        key={metodo}
                        className={`px-4 py-2 rounded-full border shadow-sm ${metodoPago === metodo ? 'bg-blue-600 border-blue-700 shadow-md' : 'bg-white border-gray-300'}`}
                        onPress={() => setMetodoPago(metodo)}
                         activeOpacity={0.7}
                    >
                        <Text className={`text-sm ${metodoPago === metodo ? 'text-white font-semibold' : 'text-gray-700'}`}>{metodo}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* 7. Resumen y Costo */}
            <View className="mt-6 mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow">
                <Text className="text-base font-bold mb-3 text-gray-700">Resumen de Reserva</Text>
                <View className="space-y-1">
                     <Text className="text-gray-600">Plaza: <Text className="font-medium text-gray-800">{plazaSeleccionadaId || 'No seleccionada'}</Text></Text>
                     <Text className="text-gray-600">Tipo: <Text className="font-medium text-gray-800">{tipoVehiculo}</Text></Text>
                     <Text className="text-gray-600">Matrícula: <Text className="font-medium text-gray-800">{matricula.toUpperCase() || 'No ingresada'}</Text></Text>
                     <Text className="text-gray-600">Desde: <Text className="font-medium text-gray-800">{fechaInicio.toLocaleString()}</Text></Text>
                     <Text className="text-gray-600">Hasta: <Text className="font-medium text-gray-800">{fechaFin.toLocaleString()}</Text></Text>
                     <Text className="mt-3 text-lg font-bold text-green-600">Costo Total Estimado: {costoTotal.toFixed(2)} Bs</Text>
                 </View>
            </View>

            {/* 8. Botón de Confirmar */}
            <TouchableOpacity
                className={`py-4 rounded-lg items-center mt-3 mb-5 shadow-md ${(!plazaSeleccionadaId || !matricula.trim() || costoTotal <= 0) ? 'bg-gray-400' : 'bg-green-600 active:bg-green-700'}`}
                onPress={handleConfirmarReserva}
                disabled={!plazaSeleccionadaId || !matricula.trim() || costoTotal <= 0}
                activeOpacity={0.8}
            >
                <Text className="text-white text-lg font-bold">Confirmar Reserva</Text>
            </TouchableOpacity>

        </ScrollView>
    );
}