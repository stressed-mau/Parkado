// Archivo: app/(tabs)/reserva.tsx (VERSIÓN REVISADA - Asegurando Lat/Lng)
// CON NATIVEWIND y REDIRECCIÓN A PAGOS

import React, { useState, useEffect, useMemo } from 'react'; // Quitamos useCallback que no se usa aquí
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';

// --- TIPOS Y CONSTANTES ---
type Espacio = { id: string; tipo: 'auto' | 'moto'; estado: 'libre'; };
type Tarifas = { auto: number; moto: number; };

function generarEspaciosSimulados(cAutos: number, cMotos: number): Espacio[] { /* ... (igual) ... */
    const esp: Espacio[] = [];
    for (let i = 1; i <= cAutos; i++) { esp.push({ id: `A-${String(i).padStart(2, '0')}`, tipo: 'auto', estado: 'libre' }); }
    for (let i = 1; i <= cMotos; i++) { esp.push({ id: `M-${String(i).padStart(2, '0')}`, tipo: 'moto', estado: 'libre' }); }
    return esp;
}
const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'QR'];

// --- COMPONENTE PRINCIPAL ---
export default function ReservaScreen() {
    const router = useRouter();
    // Recibe TODOS los parámetros, incluyendo lat/lng
    const params = useLocalSearchParams<{
        parqueoId?: string; // Hacemos opcionales por si acaso
        parqueoNombre?: string;
        tarifaAuto?: string;
        tarifaMoto?: string;
        capacidadAutos?: string;
        capacidadMotos?: string;
        parqueoLat?: string; // <-- Recibe Latitud
        parqueoLng?: string; // <-- Recibe Longitud
    }>();

    // --- 👇 AÑADIMOS LOG PARA VER QUÉ LLEGA EXACTAMENTE 👇 ---
    console.log("RESERVA SCREEN - Params INICIALES:", params);
    // --- Fin Log ---

    // Asignamos a constantes para más claridad y manejo de undefined
    const parqueoId = params.parqueoId ?? 'N/A';
    const parqueoNombre = params.parqueoNombre ?? 'Parqueo Desconocido';
    const tarifaAutoStr = params.tarifaAuto ?? '0';
    const tarifaMotoStr = params.tarifaMoto ?? '0';
    const capacidadAutosStr = params.capacidadAutos ?? '0';
    const capacidadMotosStr = params.capacidadMotos ?? '0';
    const parqueoLat = params.parqueoLat; // Puede ser undefined
    const parqueoLng = params.parqueoLng; // Puede ser undefined

    const [isLoading, setIsLoading] = useState(true);

    // --- Estados del Formulario ---
    const [tipoVehiculo, setTipoVehiculo] = useState<'auto' | 'moto'>('auto');
    const [plazasSimuladas, setPlazasSimuladas] = useState<Espacio[]>([]);
    const [plazaSeleccionadaId, setPlazaSeleccionadaId] = useState<string | null>(null);
    const [matricula, setMatricula] = useState('');
    const [fechaInicio, setFechaInicio] = useState<Date>(new Date());
    const [fechaFin, setFechaFin] = useState<Date>(() => { const d = new Date(); d.setHours(d.getHours() + 1); return d; });
    const [metodoPago, setMetodoPago] = useState<string>(METODOS_PAGO[0]);
    const [showInicioPicker, setShowInicioPicker] = useState(false);
    const [modeInicioPicker, setModeInicioPicker] = useState<'date' | 'time'>('date');
    const [showFinPicker, setShowFinPicker] = useState(false);
    const [modeFinPicker, setModeFinPicker] = useState<'date' | 'time'>('date');

    // --- Memos y Efectos ---
    const tarifas: Tarifas = useMemo(() => ({ auto: parseFloat(tarifaAutoStr), moto: parseFloat(tarifaMotoStr) }), [tarifaAutoStr, tarifaMotoStr]);
    const cAutos = parseInt(capacidadAutosStr, 10);
    const cMotos = parseInt(capacidadMotosStr, 10);

    useEffect(() => { /* ... (generarEspaciosSimulados igual) ... */
        console.log("RESERVA: Generando plazas...");
        const plazas = generarEspaciosSimulados(cAutos, cMotos);
        setPlazasSimuladas(plazas);
        setIsLoading(false); // Quitamos la carga aquí
    }, [cAutos, cMotos]);

    const plazasDisponiblesParaTipo = useMemo(() => plazasSimuladas.filter(p => p.tipo === tipoVehiculo), [plazasSimuladas, tipoVehiculo]);
    useEffect(() => { setPlazaSeleccionadaId(null); }, [tipoVehiculo]); // Deseleccionar al cambiar tipo
    const costoTotal = useMemo(() => { /* ... (cálculo igual) ... */
        const diffMs = fechaFin.getTime() - fechaInicio.getTime(); if (diffMs <= 0) return 0;
        const horas = diffMs / 3600000; const tarifaAplicable = tipoVehiculo === 'auto' ? tarifas.auto : tarifas.moto;
        return parseFloat((horas * tarifaAplicable).toFixed(2));
    }, [fechaInicio, fechaFin, tipoVehiculo, tarifas]);

    // --- Manejadores DateTimePicker ---
    const onChangeInicio = (event: DateTimePickerEvent, selectedDate?: Date) => { /* ... (igual) ... */
        const currentDate = selectedDate || fechaInicio; setShowInicioPicker(Platform.OS === 'ios');
        if (currentDate >= fechaFin) { const nueva = new Date(currentDate); nueva.setHours(nueva.getHours() + 1); setFechaFin(nueva); }
        setFechaInicio(currentDate);
    };
    const showInicioMode = (currentMode: 'date' | 'time') => { /* ... (igual) ... */ setShowInicioPicker(true); setModeInicioPicker(currentMode); };
    const onChangeFin = (event: DateTimePickerEvent, selectedDate?: Date) => { /* ... (igual) ... */
        const currentDate = selectedDate || fechaFin; setShowFinPicker(Platform.OS === 'ios');
        if (currentDate > fechaInicio) { setFechaFin(currentDate); }
        else if (selectedDate) { Alert.alert("Inválido", "Fin debe ser posterior a inicio."); const nueva = new Date(fechaInicio); nueva.setHours(nueva.getHours() + 1); setFechaFin(nueva); }
    };
    const showFinMode = (currentMode: 'date' | 'time') => { /* ... (igual) ... */ setShowFinPicker(true); setModeFinPicker(currentMode); };

    // --- Manejador Confirmación (REVISADO) ---
    const handleConfirmarReserva = () => {
        // --- Validaciones ---
        if (!plazaSeleccionadaId) { Alert.alert("Requerido", "Selecciona una plaza."); return; }
        const matriculaLimpia = matricula.trim().toUpperCase();
        if (!matriculaLimpia || matriculaLimpia.length < 4) { Alert.alert("Requerido", "Ingresa una matrícula válida."); return; }
        if (costoTotal <= 0) { Alert.alert("Inválido", "Verifica las fechas."); return; }
        // --- 👇 NUEVA VALIDACIÓN Lat/Lng 👇 ---
        if (!parqueoLat || !parqueoLng || parqueoLat === '0' || parqueoLng === '0') {
             console.error("handleConfirmarReserva: Faltan coordenadas válidas!", { parqueoLat, parqueoLng });
             Alert.alert("Error Interno", "No se pudieron obtener las coordenadas del parqueo para continuar.");
             return; // No continuar si las coordenadas son '0' o undefined
        }
        // --- Fin Validaciones ---

        // Preparamos datos (usando las constantes definidas al inicio)
        const reservaData = {
            parqueoId: parqueoId,
            parqueoNombre: parqueoNombre,
            plazaId: plazaSeleccionadaId,
            tipoVehiculo: tipoVehiculo,
            matricula: matriculaLimpia,
            fechaInicioISO: fechaInicio.toISOString(),
            fechaFinISO: fechaFin.toISOString(),
            costoTotal: costoTotal.toString(),
            metodoPago: metodoPago,
            // --- Usamos las constantes parqueoLat y parqueoLng ---
            parqueoLat: parqueoLat, // Ya validamos que no son '0' ni undefined
            parqueoLng: parqueoLng, // Ya validamos que no son '0' ni undefined
        };

        console.log("--- RESERVA PREPARADA (con Lat/Lng VALIDADOS) ---");
        console.log(reservaData);
        console.log("-------------------------------------------------");

        // --- Redirección ---
        if (metodoPago === 'QR') {
            router.push({ pathname: '/PagoQR' as any, params: reservaData });
        } else if (metodoPago === 'Tarjeta') {
             router.push({ pathname: '/PagoTarjeta' as any, params: reservaData });
        } else { // Efectivo
            Alert.alert("Confirmada (Efectivo)", `Detalles:\nParqueo: ${reservaData.parqueoNombre}\nPlaza: ${reservaData.plazaId}\nCosto: ${costoTotal.toFixed(2)} Bs`,
                [{ text: "OK", onPress: () => router.back() }] );
        }
    };

    // --- Renderizado ---
    if (isLoading) { /* ... (igual) ... */ return (<View className="flex-1 items-center justify-center bg-gray-100"><ActivityIndicator size="large" color="#4F46E5" /><Text className="mt-2 text-gray-600">Preparando...</Text></View>); }

    return (
        <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={() => router.back()} className="absolute top-5 left-5 z-10 p-1 rounded-full bg-white/70">
                 <Feather name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-center text-gray-800 mt-10 mb-1">{parqueoNombre}</Text>
            <Text className="text-sm text-center text-gray-500 mb-6">ID: {parqueoId}</Text>

            {/* --- Formulario (JSX sin cambios) --- */}
            {/* 1. Tipo Vehículo */}
            <Text className="text-base font-semibold text-gray-700 mt-5 mb-2">1. Tipo</Text>
            <View className="flex-row gap-2 mb-3">{/* ... (Botones Auto/Moto) ... */}
                 <TouchableOpacity className={`flex-1 py-3 rounded-lg border items-center shadow-sm ${tipoVehiculo === 'auto' ? 'bg-blue-600 border-blue-700 shadow-lg' : 'bg-white border-gray-300'}`} onPress={() => setTipoVehiculo('auto')} activeOpacity={0.7}><Text className={`text-base font-medium ${tipoVehiculo === 'auto' ? 'text-white' : 'text-gray-700'}`}>🚗 Auto</Text></TouchableOpacity>
                 <TouchableOpacity className={`flex-1 py-3 rounded-lg border items-center shadow-sm ${tipoVehiculo === 'moto' ? 'bg-blue-600 border-blue-700 shadow-lg' : 'bg-white border-gray-300'}`} onPress={() => setTipoVehiculo('moto')} activeOpacity={0.7}><Text className={`text-base font-medium ${tipoVehiculo === 'moto' ? 'text-white' : 'text-gray-700'}`}>🛵 Moto</Text></TouchableOpacity>
            </View>
            {/* 2. Plaza */}
            <Text className="text-base font-semibold text-gray-700 mt-5 mb-2">2. Plaza</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 -mx-1 px-1"><View className="flex-row py-1 gap-2">{/* ... (map de plazas) ... */}
                 {plazasDisponiblesParaTipo.length > 0 ? ( plazasDisponiblesParaTipo.map(plaza => (<TouchableOpacity key={plaza.id} className={`px-4 py-2 rounded-full border-2 shadow-sm ${plazaSeleccionadaId === plaza.id ? 'bg-green-600 border-green-700 shadow-md' : 'bg-green-100 border-green-500'}`} onPress={() => setPlazaSeleccionadaId(plaza.id)} activeOpacity={0.7}><Text className={`font-semibold text-sm ${plazaSeleccionadaId === plaza.id ? 'text-white' : 'text-green-800'}`}>{plaza.id}</Text></TouchableOpacity>)) ) : (<Text className="italic text-gray-500 py-2 px-1">No hay plazas libres.</Text>)}
            </View></ScrollView>
             {/* 3. Matrícula */}
            <Text className="text-base font-semibold text-gray-700 mt-5 mb-2">3. Matrícula</Text>
            <TextInput className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white mb-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Ej: 1234ABC" value={matricula} onChangeText={setMatricula} autoCapitalize="characters" maxLength={10} placeholderTextColor="#9ca3af" />
            {/* 4. Inicio */}
            <Text className="text-base font-semibold text-gray-700 mt-5 mb-2">4. Inicio</Text>
            <View className="flex-row justify-around mb-3">{/* ... (Botones Fecha/Hora Inicio) ... */}
                  <TouchableOpacity onPress={() => showInicioMode('date')} className="flex-row items-center bg-gray-100 border border-gray-300 px-4 py-3 rounded-lg gap-2 shadow-sm active:bg-gray-200" activeOpacity={0.7}><Feather name="calendar" size={18} color="#4b5563" /><Text className="text-base text-gray-700">{fechaInicio.toLocaleDateString()}</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => showInicioMode('time')} className="flex-row items-center bg-gray-100 border border-gray-300 px-4 py-3 rounded-lg gap-2 shadow-sm active:bg-gray-200" activeOpacity={0.7}><Feather name="clock" size={18} color="#4b5563" /><Text className="text-base text-gray-700">{fechaInicio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</Text></TouchableOpacity>
            </View>{showInicioPicker && (<DateTimePicker testID="inicioDateTimePicker" value={fechaInicio} mode={modeInicioPicker} is24Hour={true} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onChangeInicio} minimumDate={new Date()} />)}
             {/* 5. Fin */}
            <Text className="text-base font-semibold text-gray-700 mt-5 mb-2">5. Fin</Text>
             <View className="flex-row justify-around mb-3">{/* ... (Botones Fecha/Hora Fin) ... */}
                   <TouchableOpacity onPress={() => showFinMode('date')} className="flex-row items-center bg-gray-100 border border-gray-300 px-4 py-3 rounded-lg gap-2 shadow-sm active:bg-gray-200" activeOpacity={0.7}><Feather name="calendar" size={18} color="#4b5563" /><Text className="text-base text-gray-700">{fechaFin.toLocaleDateString()}</Text></TouchableOpacity>
                   <TouchableOpacity onPress={() => showFinMode('time')} className="flex-row items-center bg-gray-100 border border-gray-300 px-4 py-3 rounded-lg gap-2 shadow-sm active:bg-gray-200" activeOpacity={0.7}><Feather name="clock" size={18} color="#4b5563" /><Text className="text-base text-gray-700">{fechaFin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</Text></TouchableOpacity>
             </View>{showFinPicker && (<DateTimePicker testID="finDateTimePicker" value={fechaFin} mode={modeFinPicker} is24Hour={true} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onChangeFin} minimumDate={fechaInicio} />)}
            {/* 6. Método Pago */}
            <Text className="text-base font-semibold text-gray-700 mt-5 mb-2">6. Método Pago</Text>
            <View className="flex-row gap-2 mb-3 flex-wrap">{/* ... (Botones Método Pago) ... */}
                 {METODOS_PAGO.map(metodo => (<TouchableOpacity key={metodo} className={`px-4 py-2 rounded-full border shadow-sm ${metodoPago === metodo ? 'bg-blue-600 border-blue-700 shadow-md' : 'bg-white border-gray-300'}`} onPress={() => setMetodoPago(metodo)} activeOpacity={0.7}><Text className={`text-sm ${metodoPago === metodo ? 'text-white font-semibold' : 'text-gray-700'}`}>{metodo}</Text></TouchableOpacity>))}
            </View>
            {/* 7. Resumen */}
            <View className="mt-6 mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow">{/* ... (Textos del resumen) ... */}
                 <Text className="text-base font-bold mb-3 text-gray-700">Resumen</Text><View className="space-y-1"><Text className="text-gray-600">Plaza: <Text className="font-medium text-gray-800">{plazaSeleccionadaId || '-'}</Text></Text><Text className="text-gray-600">Tipo: <Text className="font-medium text-gray-800">{tipoVehiculo}</Text></Text><Text className="text-gray-600">Matrícula: <Text className="font-medium text-gray-800">{matricula.toUpperCase() || '-'}</Text></Text><Text className="text-gray-600">Desde: <Text className="font-medium text-gray-800">{fechaInicio.toLocaleString()}</Text></Text><Text className="text-gray-600">Hasta: <Text className="font-medium text-gray-800">{fechaFin.toLocaleString()}</Text></Text><Text className="mt-3 text-lg font-bold text-green-600">Costo: {costoTotal.toFixed(2)} Bs</Text></View>
            </View>
            {/* 8. Botón Confirmar */}
            <TouchableOpacity className={`py-4 rounded-lg items-center mt-3 mb-5 shadow-md ${(!plazaSeleccionadaId || !matricula.trim() || costoTotal <= 0) ? 'bg-gray-400' : 'bg-green-600 active:bg-green-700'}`} onPress={handleConfirmarReserva} disabled={!plazaSeleccionadaId || !matricula.trim() || costoTotal <= 0} activeOpacity={0.8}>
                <Text className="text-white text-lg font-bold">Confirmar Reserva</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}