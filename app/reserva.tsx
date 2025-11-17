import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

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
                className="absolute top-12 left-5 z-10 p-2 rounded-full bg-black/50"
                activeOpacity={0.7}
            >
                <Feather name="arrow-left" size={24} color="white" />
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
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                className="mb-3 -mx-1 px-1"
                contentContainerStyle={{ paddingHorizontal: 4 }}
            >
                <View className="flex-row py-1 gap-2">
                    {plazasDisponiblesParaTipo.length > 0 ? (
                        plazasDisponiblesParaTipo.map(plaza => (
                            <TouchableOpacity 
                                key={plaza.id} 
                                className={`px-4 py-3 rounded-lg border-2 shadow-sm min-w-[100px] ${
                                    plazaSeleccionadaId === plaza.id 
                                    ? 'bg-[#7BB5CB] border-[#7BB5CB]' 
                                    : 'bg-white border-[#7BB5CB]'
                                }`} 
                                onPress={() => setPlazaSeleccionadaId(plaza.id)} 
                                activeOpacity={0.7}
                            >
                                <Text className={`font-bold text-base text-center ${
                                    plazaSeleccionadaId === plaza.id ? 'text-white' : 'text-[#7BB5CB]'
                                }`}>
                                    {plaza.nroPlazaReal}
                                </Text>
                                <Text className={`text-xs text-center ${
                                    plazaSeleccionadaId === plaza.id ? 'text-white' : 'text-gray-600'
                                }`}>
                                    {plaza.tipo === 'auto' ? 'Auto' : 'Moto'}
                                </Text>
                                <Text className={`text-xs text-center ${
                                    plazaSeleccionadaId === plaza.id ? 'text-white' : 'text-green-600'
                                }`}>
                                    ● Disponible
                                </Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View className="py-3 px-4 bg-yellow-50 rounded-lg border border-yellow-200 mx-2">
                            <Text className="italic text-black text-center">
                                No hay plazas {tipoVehiculo === 'auto' ? 'para autos' : 'para motos'} disponibles en este momento.
                            </Text>
                            <TouchableOpacity 
                                onPress={cargarPlazasDisponibles}
                                className="mt-2 bg-[#7BB5CB] py-2 px-4 rounded-lg"
                                activeOpacity={0.7}
                            >
                                <Text className="text-white text-center font-semibold">Actualizar Disponibilidad</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

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
                    Resumen de Reserva
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
                    : 'bg-[#FD721D]'
                }`} 
                onPress={handleConfirmarReserva} 
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