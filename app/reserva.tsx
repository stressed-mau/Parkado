import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import useReserva from '../hooks/useReserva';
import { METODOS_PAGO } from '../types/parqueo';

export default function ReservaScreen() {
    const router = useRouter();
    const {
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
        handleConfirmarReserva,
        
        // Memoizados
        plazasDisponiblesPorTipo,
        plazasDisponiblesParaTipo,
        costoTotal,
    } = useReserva();

    // Funciones DateTimePicker - MEJORADAS
    const onChangeInicio = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || fechaInicio;
        setShowInicioPicker(Platform.OS === 'ios');
        
        if (event.type === 'set') {
            setFechaInicio(currentDate);
            
            // Ajustar automáticamente la fecha fin si es necesario
            if (currentDate >= fechaFin) {
                const nuevaFechaFin = new Date(currentDate);
                nuevaFechaFin.setHours(nuevaFechaFin.getHours() + 1);
                setFechaFin(nuevaFechaFin);
            }
        }
    };

    const showInicioMode = (currentMode: 'date' | 'time') => {
        setShowInicioPicker(true);
        setModeInicioPicker(currentMode);
    };

    const onChangeFin = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || fechaFin;
        setShowFinPicker(Platform.OS === 'ios');
        
        if (event.type === 'set') {
            if (currentDate > fechaInicio) {
                setFechaFin(currentDate);
            } else {
                Alert.alert(
                    "Horario Inválido", 
                    "La fecha y hora de fin debe ser posterior a la de inicio."
                );
                // Ajustar automáticamente a 1 hora después del inicio
                const nuevaFechaFin = new Date(fechaInicio);
                nuevaFechaFin.setHours(nuevaFechaFin.getHours() + 1);
                setFechaFin(nuevaFechaFin);
            }
        }
    };

    const showFinMode = (currentMode: 'date' | 'time') => {
        setShowFinPicker(true);
        setModeFinPicker(currentMode);
    };

    // ✅ NUEVO: Función para formatear duración
    const getDuracionReserva = () => {
        const diffMs = fechaFin.getTime() - fechaInicio.getTime();
        if (diffMs <= 0) return '0h 0m';
        
        const horas = Math.floor(diffMs / 3600000);
        const minutos = Math.floor((diffMs % 3600000) / 60000);
        
        return `${horas}h ${minutos}m`;
    };

    // ----- VALIDACIONES & WRAPPER para confirmar -----
    const validarYConfirmar = () => {
        // 1) Usuario
        if (!userData) {
            Alert.alert(
                "No autenticado",
                "Debes iniciar sesión para reservar. ¿Quieres ir a iniciar sesión?",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Ir a login", onPress: () => router.push('/Login') }
                ]
            );
            return;
        }

        // 2) tipoVehiculo
        if (!tipoVehiculo) {
            Alert.alert("Selecciona vehículo", "Selecciona si tu vehículo es 'Auto' o 'Moto' antes de continuar.");
            return;
        }

        // 3) plazas disponibles para ese tipo
        const disponiblesTipo = tipoVehiculo === 'auto' ? plazasDisponiblesPorTipo.autos : plazasDisponiblesPorTipo.motos;
        if (typeof disponiblesTipo === 'number' && disponiblesTipo <= 0) {
            Alert.alert("Sin disponibilidad", `No hay plazas disponibles para ${tipoVehiculo === 'auto' ? 'autos' : 'motos'} en este parqueo.`);
            return;
        }

        // 4) plaza seleccionada
        if (!plazaSeleccionadaId) {
            Alert.alert("Selecciona plaza", "Selecciona una plaza disponible antes de confirmar la reserva.");
            return;
        }

        const plazaSeleccionada = plazasReales.find(p => p.id === plazaSeleccionadaId);
        if (!plazaSeleccionada) {
            Alert.alert("Plaza inválida", "La plaza seleccionada no es válida. Actualiza la lista de plazas.");
            return;
        }

        // 5) plaza tipo coincide con tipoVehiculo
        const plazaTipo = (plazaSeleccionada.tipo || '').toString().toLowerCase();
        if (tipoVehiculo === 'auto' && !plazaTipo.includes('auto') && plazaTipo !== 'auto') {
            Alert.alert("Plaza incompatible", "La plaza seleccionada no es para autos. Elige una plaza para autos.");
            return;
        }
        if (tipoVehiculo === 'moto' && !plazaTipo.includes('moto') && plazaTipo !== 'moto') {
            Alert.alert("Plaza incompatible", "La plaza seleccionada no es para motos. Elige una plaza para motos.");
            return;
        }

        // 6) matrícula
        const mat = (matricula || '').trim();
        if (!mat) {
            Alert.alert("Matrícula requerida", "Ingresa la matrícula del vehículo.");
            return;
        }
        if (mat.length < 3 || mat.length > 10) {
            Alert.alert("Matrícula inválida", "La matrícula debe tener entre 3 y 10 caracteres.");
            return;
        }
        // Sólo letras y números (puedes ajustar si quieres permitir guiones/espacios)
        if (!/^[A-Z0-9]+$/i.test(mat)) {
            Alert.alert("Matrícula inválida", "La matrícula sólo debe contener letras y números (sin espacios ni caracteres especiales).");
            return;
        }

        // 7) Fechas
        const ahora = new Date();
        if (fechaInicio < ahora) {
            Alert.alert("Fecha inválida", "La fecha y hora de inicio no puede estar en el pasado.");
            return;
        }
        if (fechaFin <= fechaInicio) {
            Alert.alert("Fecha inválida", "La fecha y hora de fin debe ser posterior a la fecha de inicio.");
            return;
        }
        const minsDiff = (fechaFin.getTime() - fechaInicio.getTime()) / 60000;
        const MIN_MINS = 15; // mínimo permitdo — ajusta si quieres
        if (minsDiff < MIN_MINS) {
            Alert.alert("Duración mínima", `La reserva debe ser de al menos ${MIN_MINS} minutos.`);
            return;
        }

        // 8) costo
        if (!costoTotal || costoTotal <= 0) {
            Alert.alert("Costo inválido", "El costo calculado es 0. Verifica las tarifas o las fechas seleccionadas.");
            return;
        }

        // 9) método de pago
        if (!metodoPago) {
            Alert.alert("Selecciona método", "Selecciona un método de pago antes de confirmar.");
            return;
        }

        // 10) evitar doble envío
        if (isCreatingReserva) {
            Alert.alert("Procesando", "Tu reserva ya está en proceso. Espera a que termine.");
            return;
        }

        // Pedido de confirmación final con resumen
        const plazaLabel = plazaSeleccionada.nroPlazaReal || plazaSeleccionadaId;
        Alert.alert(
            "Confirmar reserva",
            `Una vez realizada la reserva puede cancelarla desde el perfil de usuario\n\n¿Deseas confirmar la reserva?`,
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Confirmar", onPress: async () => {
                    try {
                        await handleConfirmarReserva();
                    } catch (err) {
                        console.error("Error en handleConfirmarReserva:", err);
                        Alert.alert("Error", "Ocurrió un error al intentar crear la reserva.");
                    }
                } }
            ]
        );
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
        <ScrollView 
            className="flex-1 bg-[#F6EEE4]" 
            contentContainerStyle={{ padding: 20, paddingBottom: 60 }} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            {/* Botón Volver */}
<TouchableOpacity 
  onPress={() => router.back()} 
  className="absolute top-12 left-5 z-10 flex-row items-center p-2 rounded-full"
  activeOpacity={0.7}
  style={{ backgroundColor: "#7BB3CD" }}
>
  <MaterialCommunityIcons
    name="arrow-left-circle"
    size={22}
    color="white"
    style={{ marginRight: 6 }}
  />
  <Text className="text-white font-bold">Volver</Text>
</TouchableOpacity>

            
            {/* Título */}
            <Text className="text-2xl font-bold text-center text-black mt-10 mb-1">
                {datosParqueo?.nombre || 'Parqueo Desconocido'}
            </Text>
            <Text className="text-sm text-center text-gray-600 mb-6">
                {datosParqueo?.direccion || 'Dirección no disponible'}
            </Text>

            {/* === SECCIÓN 1: TIPO DE VEHÍCULO === */}
            <Text className="text-base font-semibold text-black mt-5 mb-2">Selecciona tu vehículo</Text>
            <View className="flex-row gap-3 mb-3">
                {/* BOTÓN MOTOS */}
                <TouchableOpacity 
                    className={`flex-1 py-4 rounded-lg items-center justify-center shadow-lg ${
                        tipoVehiculo === 'moto' 
                        ? 'bg-[#7BB5CB] border-2 border-[#7BB5CB]' 
                        : 'bg-white border-2 border-[#7BB5CB]/30'
                    }`} 
                    onPress={() => setTipoVehiculo('moto')} 
                    activeOpacity={0.7}
                    disabled={plazasDisponiblesPorTipo.motos === 0}
                >
                    <FontAwesome5 
                        name="motorcycle" 
                        size={24} 
                        color={
                            tipoVehiculo === 'moto' 
                            ? '#F6EEE4' 
                            : plazasDisponiblesPorTipo.motos === 0 
                                ? '#CCCCCC' 
                                : '#7BB5CB'
                        } 
                    />
                    <Text className={`text-xs font-semibold mt-2 ${
                        tipoVehiculo === 'moto' 
                        ? 'text-white' 
                        : plazasDisponiblesPorTipo.motos === 0 
                            ? 'text-gray-400' 
                            : 'text-black'
                    }`}>
                        Motos
                    </Text>
                    <Text className={`text-2xl font-bold ${
                        tipoVehiculo === 'moto' 
                        ? 'text-white' 
                        : plazasDisponiblesPorTipo.motos === 0 
                            ? 'text-gray-400' 
                            : 'text-black'
                    }`}>
                        {plazasDisponiblesPorTipo.motos}
                    </Text>
                    <Text className={`text-xs ${
                        tipoVehiculo === 'moto' 
                        ? 'text-white' 
                        : plazasDisponiblesPorTipo.motos === 0 
                            ? 'text-gray-400' 
                            : 'text-black'
                    }`}>
                        {tarifasReales.moto > 0 ? `${tarifasReales.moto} Bs/h` : 'Sin tarifa'}
                    </Text>
                    {plazasDisponiblesPorTipo.motos === 0 && (
                        <Text className="text-xs text-red-500 mt-1">Agotado</Text>
                    )}
                </TouchableOpacity>

                {/* BOTÓN AUTOS */}
                <TouchableOpacity 
                    className={`flex-1 py-4 rounded-lg items-center justify-center shadow-lg ${
                        tipoVehiculo === 'auto' 
                        ? 'bg-[#7BB5CB] border-2 border-[#7BB5CB]' 
                        : 'bg-white border-2 border-[#7BB5CB]/30'
                    }`} 
                    onPress={() => setTipoVehiculo('auto')} 
                    activeOpacity={0.7}
                    disabled={plazasDisponiblesPorTipo.autos === 0}
                >
                    <FontAwesome5 
                        name="car" 
                        size={24} 
                        color={
                            tipoVehiculo === 'auto' 
                            ? '#F6EEE4' 
                            : plazasDisponiblesPorTipo.autos === 0 
                                ? '#CCCCCC' 
                                : '#7BB5CB'
                        } 
                    />
                    <Text className={`text-xs font-semibold mt-2 ${
                        tipoVehiculo === 'auto' 
                        ? 'text-white' 
                        : plazasDisponiblesPorTipo.autos === 0 
                            ? 'text-gray-400' 
                            : 'text-black'
                    }`}>
                        Autos
                    </Text>
                    <Text className={`text-2xl font-bold ${
                        tipoVehiculo === 'auto' 
                        ? 'text-white' 
                        : plazasDisponiblesPorTipo.autos === 0 
                            ? 'text-gray-400' 
                            : 'text-black'
                    }`}>
                        {plazasDisponiblesPorTipo.autos}
                    </Text>
                    <Text className={`text-xs ${
                        tipoVehiculo === 'auto' 
                        ? 'text-white' 
                        : plazasDisponiblesPorTipo.autos === 0 
                            ? 'text-gray-400' 
                            : 'text-black'
                    }`}>
                        {tarifasReales.auto > 0 ? `${tarifasReales.auto} Bs/h` : 'Sin tarifa'}
                    </Text>
                    {plazasDisponiblesPorTipo.autos === 0 && (
                        <Text className="text-xs text-red-500 mt-1">Agotado</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* === SECCIÓN 2: PLAZAS DISPONIBLES === */}
<Text className="text-base font-semibold text-black mt-5 mb-2">
  Plazas disponibles ({plazasDisponiblesParaTipo.length})
</Text>

<View className="mb-4 items-center pl-4" >
  {plazasDisponiblesParaTipo.length > 0 ? (
    <View className="flex-row flex-wrap justify-start gap-[6px] w-[340px]">

      {plazasDisponiblesParaTipo.map((plaza) => (
        <TouchableOpacity
          key={plaza.id}
          onPress={() => setPlazaSeleccionadaId(plaza.id)}
          activeOpacity={0.85}
          className={`w-[22%] h-[78px] rounded-lg border-2 items-center justify-center ${
            plazaSeleccionadaId === plaza.id
              ? 'bg-[#7BB5CB] border-[#7BB5CB]'
              : 'bg-white border-[#7BB5CB]'
          }`}
        >
          {/* NÚMERO DE PLAZA */}
          <Text
            className={`text-base font-bold ${
              plazaSeleccionadaId === plaza.id
                ? 'text-white'
                : 'text-[#7BB5CB]'
            }`}
          >
            {plaza.nroPlazaReal}
          </Text>

          {/* TIPO */}
          <Text
            className={`text-[11px] ${
              plazaSeleccionadaId === plaza.id
                ? 'text-white'
                : 'text-gray-600'
            }`}
          >
            {plaza.tipo === 'auto' ? 'Auto' : 'Moto'}
          </Text>

          {/* ESTADO */}
          <Text
            className={`text-[10px] font-semibold ${
              plazaSeleccionadaId === plaza.id
                ? 'text-white'
                : 'text-green-600'
            }`}
            numberOfLines={1}
          >
            Disponible
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  ) : (
    <View className="py-4 px-4 bg-yellow-50 rounded-lg border border-yellow-200">
      <Text className="italic text-black text-center mb-2">
        No hay plazas {tipoVehiculo === 'auto' ? 'para autos' : 'para motos'} disponibles.
      </Text>

      <TouchableOpacity
        onPress={cargarPlazasDisponibles}
        className="bg-[#7BB5CB] py-2 px-4 rounded-lg"
        activeOpacity={0.7}
      >
        <Text className="text-white text-center font-semibold">
          Actualizar disponibilidad
        </Text>
      </TouchableOpacity>
    </View>
  )}
</View>


            {/* === SECCIÓN 3: MATRÍCULA === */}
            <Text className="text-base font-semibold text-black mt-5 mb-2">
                Matrícula del vehículo
            </Text>
            <TextInput 
                className="border-2 border-[#7BB5CB] rounded-lg px-4 py-3 text-base bg-white mb-3 shadow-sm text-black" 
                placeholder="Ej: 1234ABC" 
                placeholderTextColor="#999"
                value={matricula} 
                onChangeText={setMatricula} 
                autoCapitalize="characters" 
                maxLength={10}
                autoCorrect={false}
                spellCheck={false}
            />

            {/* === SECCIÓN 4: FECHA Y HORA DE INICIO === */}
            <Text className="text-base font-semibold text-black mt-5 mb-2">
                Fecha y Hora de Inicio
            </Text>
            <View className="flex-row justify-between mb-3">
                <TouchableOpacity 
                    onPress={() => showInicioMode('date')} 
                    className="flex-row items-center bg-white border-2 border-[#7BB5CB] px-4 py-3 rounded-lg gap-2 shadow flex-1 mr-2" 
                    activeOpacity={0.7}
                >
                    <Feather name="calendar" size={18} color="#7BB5CB" />
                    <Text className="text-base text-black flex-1">
                        {fechaInicio.toLocaleDateString('es-BO')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => showInicioMode('time')} 
                    className="flex-row items-center bg-white border-2 border-[#7BB5CB] px-4 py-3 rounded-lg gap-2 shadow flex-1 ml-2" 
                    activeOpacity={0.7}
                >
                    <Feather name="clock" size={18} color="#7BB5CB" />
                    <Text className="text-base text-black flex-1">
                        {fechaInicio.toLocaleTimeString('es-BO', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: false 
                        })}
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
                    locale="es-BO"
                />
            )}

            {/* === SECCIÓN 5: FECHA Y HORA DE FIN === */}
            <Text className="text-base font-semibold text-black mt-5 mb-2">
                Fecha y Hora de Fin
            </Text>
            <View className="flex-row justify-between mb-3">
                <TouchableOpacity 
                    onPress={() => showFinMode('date')} 
                    className="flex-row items-center bg-white border-2 border-[#7BB5CB] px-4 py-3 rounded-lg gap-2 shadow flex-1 mr-2" 
                    activeOpacity={0.7}
                >
                    <Feather name="calendar" size={18} color="#7BB5CB" />
                    <Text className="text-base text-black flex-1">
                        {fechaFin.toLocaleDateString('es-BO')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => showFinMode('time')} 
                    className="flex-row items-center bg-white border-2 border-[#7BB5CB] px-4 py-3 rounded-lg gap-2 shadow flex-1 ml-2" 
                    activeOpacity={0.7}
                >
                    <Feather name="clock" size={18} color="#7BB5CB" />
                    <Text className="text-base text-black flex-1">
                        {fechaFin.toLocaleTimeString('es-BO', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: false 
                        })}
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
                    locale="es-BO"
                />
            )}

            {/* === SECCIÓN 6: MÉTODO DE PAGO === */}
            <Text className="text-base font-semibold text-black mt-5 mb-2">
                Método de Pago
            </Text>
            <View className="flex-row gap-2 mb-3 flex-wrap justify-center">
                {METODOS_PAGO.map(metodo => (
                    <TouchableOpacity 
                        key={metodo} 
                        className={`px-4 py-3 rounded-lg border-2 shadow-sm min-w-[100px] ${
                            metodoPago === metodo 
                            ? 'bg-[#7BB5CB] border-[#7BB5CB]' 
                            : 'bg-white border-[#7BB5CB]'
                        }`} 
                        onPress={() => setMetodoPago(metodo)} 
                        activeOpacity={0.7}
                    >
                        <Text className={`text-sm font-bold text-center ${
                            metodoPago === metodo ? 'text-white' : 'text-[#7BB5CB]'
                        }`}>
                            {metodo}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* === SECCIÓN 7: RESUMEN MEJORADO === */}
            <View className="mt-6 mb-6 p-4 bg-white rounded-lg border-2 border-[#7BB5CB] shadow">
                <Text className="text-lg font-bold mb-3 text-black text-center">
                    Detalle de Reserva
                </Text>
                <View className="space-y-3">
                    <View className="flex-row justify-between items-center">
                        <Text className="text-black font-medium">Plaza:</Text>
                        <Text className="font-semibold text-black text-right">
                            {plazaSeleccionadaId 
                                ? plazasReales.find(p => p.id === plazaSeleccionadaId)?.nroPlazaReal 
                                : 'No seleccionada'
                            }
                        </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                        <Text className="text-black font-medium">Tipo de vehículo:</Text>
                        <Text className="font-semibold text-black">
                            {tipoVehiculo === 'auto' ? 'Auto' : 'Moto'}
                        </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                        <Text className="text-black font-medium">Matrícula:</Text>
                        <Text className="font-semibold text-black">
                            {matricula.toUpperCase() || 'No ingresada'}
                        </Text>
                    </View>
                    <View className="flex-row justify-between items-start">
                        <Text className="text-black font-medium">Desde:</Text>
                        <Text className="font-semibold text-black text-right">
                            {fechaInicio.toLocaleDateString('es-BO')}{'\n'}
                            {fechaInicio.toLocaleTimeString('es-BO', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false 
                            })}
                        </Text>
                    </View>
                    <View className="flex-row justify-between items-start">
                        <Text className="text-black font-medium">Hasta:</Text>
                        <Text className="font-semibold text-black text-right">
                            {fechaFin.toLocaleDateString('es-BO')}{'\n'}
                            {fechaFin.toLocaleTimeString('es-BO', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false 
                            })}
                        </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                        <Text className="text-black font-medium">Duración:</Text>
                        <Text className="font-semibold text-black">
                            {getDuracionReserva()}
                        </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                        <Text className="text-black font-medium">Método de pago:</Text>
                        <Text className="font-semibold text-black">{metodoPago}</Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                        <Text className="text-black font-medium">Tarifa por hora:</Text>
                        <Text className="font-semibold text-black">
                            {tipoVehiculo === 'auto' ? tarifasReales.auto : tarifasReales.moto} Bs/h
                        </Text>
                    </View>
                    <View className="border-t border-gray-300 pt-3 mt-2">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-lg font-bold text-black">Total a pagar:</Text>
                            <Text className="text-lg font-bold text-[#7BB5CB]">
                                {costoTotal.toFixed(2)} Bs
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* === SECCIÓN 8: BOTÓN CONFIRMAR MEJORADO === */}
            <TouchableOpacity 
                className={`py-4 rounded-lg items-center mt-3 mb-5 shadow-xl ${
                    (!plazaSeleccionadaId || !matricula.trim() || costoTotal <= 0 || isCreatingReserva || !userData) 
                    ? 'bg-gray-400' 
                    : 'bg-black'
                }`} 
                onPress={validarYConfirmar} 
                disabled={!plazaSeleccionadaId || !matricula.trim() || costoTotal <= 0 || isCreatingReserva || !userData} 
                activeOpacity={0.8}
            >
                {isCreatingReserva ? (
                    <View className="flex-row items-center">
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text className="text-white text-lg font-bold ml-2">Procesando...</Text>
                    </View>
                ) : (
                    <Text className="text-white text-lg font-bold">
                        {!userData ? 'Inicia sesión primero' :
                         !plazaSeleccionadaId ? 'Selecciona una plaza' : 
                         !matricula.trim() ? 'Ingresa la matrícula' : 
                         costoTotal <= 0 ? 'Verifica las fechas' : 
                         `Confirmar Reserva - ${costoTotal.toFixed(2)} Bs`
                        }
                    </Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}
