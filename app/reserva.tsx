import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

// --- TIPOS Y CONSTANTES ---
type Espacio = { id: string; tipo: 'auto' | 'moto'; estado: 'libre'; };
type Tarifas = { auto: number; moto: number; };

function generarEspaciosSimulados(cAutos: number, cMotos: number): Espacio[] {
    const esp: Espacio[] = [];
    for (let i = 1; i <= cAutos; i++) { esp.push({ id: `A-${String(i).padStart(2, '0')}`, tipo: 'auto', estado: 'libre' }); }
    for (let i = 1; i <= cMotos; i++) { esp.push({ id: `M-${String(i).padStart(2, '0')}`, tipo: 'moto', estado: 'libre' }); }
    return esp;
}
const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'QR'];

// --- COMPONENTE PRINCIPAL ---
export default function ReservaScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        parqueoId?: string;
        parqueoNombre?: string;
        tarifaAuto?: string;
        tarifaMoto?: string;
        capacidadAutos?: string;
        capacidadMotos?: string;
        parqueoLat?: string;
        parqueoLng?: string;
    }>();

    const parqueoId = params.parqueoId ?? 'N/A';
    const parqueoNombre = params.parqueoNombre ?? 'Parqueo Desconocido';
    const tarifaAutoStr = params.tarifaAuto ?? '0';
    const tarifaMotoStr = params.tarifaMoto ?? '0';
    const capacidadAutosStr = params.capacidadAutos ?? '0';
    const capacidadMotosStr = params.capacidadMotos ?? '0';
    const parqueoLat = params.parqueoLat;
    const parqueoLng = params.parqueoLng;

    const [isLoading, setIsLoading] = useState(true);
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

    const tarifas: Tarifas = useMemo(() => ({ auto: parseFloat(tarifaAutoStr), moto: parseFloat(tarifaMotoStr) }), [tarifaAutoStr, tarifaMotoStr]);
    const cAutos = parseInt(capacidadAutosStr, 10);
    const cMotos = parseInt(capacidadMotosStr, 10);

    useEffect(() => {
        const plazas = generarEspaciosSimulados(cAutos, cMotos);
        setPlazasSimuladas(plazas);
        setIsLoading(false);
    }, [cAutos, cMotos]);

    const plazasDisponiblesParaTipo = useMemo(() => plazasSimuladas.filter(p => p.tipo === tipoVehiculo), [plazasSimuladas, tipoVehiculo]);
    useEffect(() => { setPlazaSeleccionadaId(null); }, [tipoVehiculo]);
    const costoTotal = useMemo(() => {
        const diffMs = fechaFin.getTime() - fechaInicio.getTime(); if (diffMs <= 0) return 0;
        const horas = diffMs / 3600000; const tarifaAplicable = tipoVehiculo === 'auto' ? tarifas.auto : tarifas.moto;
        return parseFloat((horas * tarifaAplicable).toFixed(2));
    }, [fechaInicio, fechaFin, tipoVehiculo, tarifas]);

    const onChangeInicio = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || fechaInicio; setShowInicioPicker(Platform.OS === 'ios');
        if (currentDate >= fechaFin) { const nueva = new Date(currentDate); nueva.setHoras(nueva.getHours() + 1); setFechaFin(nueva); }
        setFechaInicio(currentDate);
    };
    const showInicioMode = (currentMode: 'date' | 'time') => { setShowInicioPicker(true); setModeInicioPicker(currentMode); };
    const onChangeFin = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || fechaFin; setShowFinPicker(Platform.OS === 'ios');
        if (currentDate > fechaInicio) { setFechaFin(currentDate); }
        else if (selectedDate) { Alert.alert("Inválido", "Fin debe ser posterior a inicio."); const nueva = new Date(fechaInicio); nueva.setHoras(nueva.getHours() + 1); setFechaFin(nueva); }
    };
    const showFinMode = (currentMode: 'date' | 'time') => { setShowFinPicker(true); setModeFinPicker(currentMode); };

    const handleConfirmarReserva = () => {
        if (!plazaSeleccionadaId) { Alert.alert("Requerido", "Selecciona una plaza."); return; }
        const matriculaLimpia = matricula.trim().toUpperCase();
        if (!matriculaLimpia || matriculaLimpia.length < 4) { Alert.alert("Requerido", "Ingresa una matrícula válida."); return; }
        if (costoTotal <= 0) { Alert.alert("Inválido", "Verifica las fechas."); return; }
        if (!parqueoLat || !parqueoLng || parqueoLat === '0' || parqueoLng === '0') {
             Alert.alert("Error Interno", "No se pudieron obtener las coordenadas del parqueo para continuar.");
             return;
        }
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
            parqueoLat: parqueoLat,
            parqueoLng: parqueoLng,
        };

        if (metodoPago === 'QR') {
            router.push({ pathname: '/PagoQR' as any, params: reservaData });
        } else if (metodoPago === 'Tarjeta') {
             router.push({ pathname: '/PagoTarjeta' as any, params: reservaData });
        } else {
            Alert.alert("Confirmada (Efectivo)", `Detalles:\nParqueo: ${reservaData.parqueoNombre}\nPlaza: ${reservaData.plazaId}\nCosto: ${costoTotal.toFixed(2)} Bs`,
                [{ text: "OK", onPress: () => router.back() }] );
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-[#F6EEE4]">
                <ActivityIndicator size="large" color="#7BB5CB" />
                <Text className="mt-2 text-black">Preparando...</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-[#F6EEE4]" contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={() => router.back()} className="absolute top-5 left-5 z-10 p-1 rounded-full bg-white/70">
                 <Feather name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-center text-black mt-10 mb-1">{parqueoNombre}</Text>
             

            {/* === PRIMERA MITAD: AZUL === */}
            
            {/* 1. Tipo Vehículo - AZUL - ESTILO TARJETAS */}
            <Text className="text-base font-semibold text-black mt-5 mb-2">Capacidades y Espacios</Text>
            <View className="flex-row gap-3 mb-3">
                 <TouchableOpacity 
                     className={`flex-1 py-4 rounded-lg items-center justify-center shadow-lg ${tipoVehiculo === 'moto' ? 'bg-[#7BB5CB]' : 'bg-[#7BB5CB]/30'}`} 
                     onPress={() => setTipoVehiculo('moto')} 
                     activeOpacity={0.7}
                 >
                     <FontAwesome5 name="motorcycle" size={24} color={tipoVehiculo === 'moto' ? '#F6EEE4' : '#7BB5CB'} />
                     <Text className={`text-xs font-semibold mt-2 ${tipoVehiculo === 'moto' ? 'text-white' : 'text-black'}`}>Motos</Text>
                     <Text className={`text-2xl font-bold ${tipoVehiculo === 'moto' ? 'text-white' : 'text-black'}`}>{cMotos}</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                     className={`flex-1 py-4 rounded-lg items-center justify-center shadow-lg ${tipoVehiculo === 'auto' ? 'bg-[#7BB5CB]' : 'bg-[#7BB5CB]/30'}`} 
                     onPress={() => setTipoVehiculo('auto')} 
                     activeOpacity={0.7}
                 >
                     <FontAwesome5 name="car" size={24} color={tipoVehiculo === 'auto' ? '#F6EEE4' : '#7BB5CB'} />
                     <Text className={`text-xs font-semibold mt-2 ${tipoVehiculo === 'auto' ? 'text-white' : 'text-black'}`}>Autos</Text>
                     <Text className={`text-2xl font-bold ${tipoVehiculo === 'auto' ? 'text-white' : 'text-black'}`}>{cAutos}</Text>
                 </TouchableOpacity>
            </View>

            {/* 2. Plaza - AZUL */}
            <Text className="text-base font-semibold text-black mt-5 mb-2">Selecciona Plaza</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 -mx-1 px-1">
                <View className="flex-row py-1 gap-2">
                 {plazasDisponiblesParaTipo.length > 0 ? (
                     plazasDisponiblesParaTipo.map(plaza => (
                         <TouchableOpacity key={plaza.id} className={`px-4 py-2 rounded-full border-2 shadow-sm ${plazaSeleccionadaId === plaza.id ? 'bg-[#7BB5CB] border-[#7BB5CB]' : 'bg-white border-[#7BB5CB]'}`} onPress={() => setPlazaSeleccionadaId(plaza.id)} activeOpacity={0.7}>
                             <Text className={`font-bold text-sm ${plazaSeleccionadaId === plaza.id ? 'text-white' : 'text-[#7BB5CB]'}`}>{plaza.id}</Text>
                         </TouchableOpacity>
                     ))
                 ) : (
                     <Text className="italic text-black py-2 px-1">No hay plazas libres.</Text>
                 )}
                </View>
            </ScrollView>

            {/* 3. Matrícula - AZUL */}
            <Text className="text-base font-semibold text-black mt-5 mb-2">Matrícula</Text>
            <TextInput className="border-2 border-black rounded-lg px-4 py-3 text-base bg-white mb-3 shadow-sm" placeholder="Ej: 1234ABC" value={matricula} onChangeText={setMatricula} autoCapitalize="characters" maxLength={10} placeholderTextColor="#cbccccff" />

            {/* 4. Inicio - AZUL */}
            <Text className="text-base font-semibold text-black mt-5 mb-2">Fecha y Hora de Inicio</Text>
            <View className="flex-row justify-around mb-3">
                  <TouchableOpacity onPress={() => showInicioMode('date')} className="flex-row items-center bg-white border-2 border-Black px-4 py-3 rounded-lg gap-2 shadow" activeOpacity={0.7}>
                      <Feather name="calendar" size={18} color="black" />
                      <Text className="text-base text-black">{fechaInicio.toLocaleDateString()}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => showInicioMode('time')} className="flex-row items-center bg-white border-2 border-Black px-4 py-3 rounded-lg gap-2 shadow" activeOpacity={0.7}>
                      <Feather name="clock" size={18} color="black" />
                      <Text className="text-base text-black">{fechaInicio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</Text>
                  </TouchableOpacity>
            </View>
            {showInicioPicker && (<DateTimePicker testID="inicioDateTimePicker" value={fechaInicio} mode={modeInicioPicker} is24Hour={true} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onChangeInicio} minimumDate={new Date()} />)}

            {/* 5. Fin - AZUL */}
            <Text className="text-base font-semibold text-black mt-5 mb-2">Fecha y Hora de Fin</Text>
             <View className="flex-row justify-around mb-3">
                   <TouchableOpacity onPress={() => showFinMode('date')} className="flex-row items-center bg-white border-2 border-black px-4 py-3 rounded-lg gap-2 shadow" activeOpacity={0.7}>
                       <Feather name="calendar" size={18} color="Black" />
                       <Text className="text-base text-black">{fechaFin.toLocaleDateString()}</Text>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => showFinMode('time')} className="flex-row items-center bg-white border-2 border-black px-4 py-3 rounded-lg gap-2 shadow" activeOpacity={0.7}>
                       <Feather name="clock" size={18} color="Black" />
                       <Text className="text-base text-black">{fechaFin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</Text>
                   </TouchableOpacity>
             </View>
             {showFinPicker && (<DateTimePicker testID="finDateTimePicker" value={fechaFin} mode={modeFinPicker} is24Hour={true} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onChangeFin} minimumDate={fechaInicio} />)}

            {/* === SEGUNDA MITAD: NARANJA === */}

            {/* 6. Método Pago - NARANJA */}
            <Text className="text-base font-semibold text-black mt-5 mb-2">Método de Pago</Text>
            <View className="flex-row gap-2 mb-3 flex-wrap">
                 {METODOS_PAGO.map(metodo => (
                     <TouchableOpacity key={metodo} className={`px-4 py-2 rounded-full border-2 border-[#FD721D] shadow-sm ${metodoPago === metodo ? 'bg-[#FD721D]' : 'bg-white'}`} onPress={() => setMetodoPago(metodo)} activeOpacity={0.7}>
                         <Text className={`text-sm ${metodoPago === metodo ? 'text-white font-bold' : 'text-[#FD721D] font-bold'}`}>{metodo}</Text>
                     </TouchableOpacity>
                 ))}
            </View>

            {/* 7. Resumen - NARANJA */}
            <View className="mt-6 mb-6 p-4 bg-white rounded-lg border-2  shadow">
                 <Text className="text-base font-bold mb-3 text-black">Resumen</Text>
                 <View className="space-y-1">
                     <Text className="text-black">Plaza: <Text className="font-medium text-black">{plazaSeleccionadaId || '-'}</Text></Text>
                     <Text className="text-black">Tipo: <Text className="font-medium text-black">{tipoVehiculo}</Text></Text>
                     <Text className="text-black">Matrícula: <Text className="font-medium text-black">{matricula.toUpperCase() || '-'}</Text></Text>
                     <Text className="text-black">Desde: <Text className="font-medium text-black">{fechaInicio.toLocaleString()}</Text></Text>
                     <Text className="text-black">Hasta: <Text className="font-medium text-black">{fechaFin.toLocaleString()}</Text></Text>
                     <Text className="mt-3 text-lg font-bold ">Costo: {costoTotal.toFixed(2)} Bs</Text>
                 </View>
            </View>

            {/* 8. Botón Confirmar - NARANJA */}
            <TouchableOpacity className={`py-4 rounded-lg items-center mt-3 mb-5 shadow-xl border-2  ${(!plazaSeleccionadaId || !matricula.trim() || costoTotal <= 0) ? 'bg-black' : 'bg-black'}`} onPress={handleConfirmarReserva} disabled={!plazaSeleccionadaId || !matricula.trim() || costoTotal <= 0} activeOpacity={0.8}>
                <Text className="text-white text-lg font-bold">Confirmar Reserva</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
 