import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from "@expo/vector-icons";
interface UserData {
    id: string;
    email: string;
    token: string;
    nombre: string;
}

export default function PagoQrScreen() {
    const router = useRouter();
    const reservaData = useLocalSearchParams<{
        parqueoId: string;
        parqueoNombre: string;
        plazaId: string;
        nroPlazaReal: string;
        tipoVehiculo: string;
        matricula: string;
        fechaInicioISO: string;
        fechaFinISO: string;
        costoTotal: string;
        metodoPago: string;
        parqueoLat: string;
        parqueoLng: string;
        usuarioId: string;
        usuarioEmail: string;
        usuarioNombre: string;
        tarifaAplicada: string;
        timestamp: string;
    }>();

    const [isVerifying, setIsVerifying] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);

    // --- CARGAR DATOS DEL USUARIO ---
    useEffect(() => {
        const cargarUsuario = async () => {
            try {
                const storedUserData = await AsyncStorage.getItem('userData');
                if (storedUserData) {
                    const user = JSON.parse(storedUserData);
                    setUserData(user);
                    console.log('✅ Usuario cargado en PagoQR:', user);
                } else {
                    console.log('❌ No hay usuario logueado en PagoQR');
                }
            } catch (error) {
                console.error('Error cargando usuario en PagoQR:', error);
            }
        };

        cargarUsuario();
    }, []);

    // --- FUNCIÓN PARA CREAR RESERVA EN LA API ---
    const crearReservaEnAPI = async () => {
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

            console.log('📤 Enviando reserva a API desde PagoQR:', reservaPayload);

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

            console.log('✅ Reserva creada exitosamente desde PagoQR:', responseData);
            return responseData;

        } catch (error: any) {
            console.error('❌ Error creando reserva desde PagoQR:', error);
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

            console.log('🔄 Actualizando estado de plaza desde PagoQR:', { plazaId, updatePayload });

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
            console.log('✅ Estado de plaza actualizado exitosamente desde PagoQR:', responseData);
            return responseData;

        } catch (error: any) {
            console.error('❌ Error actualizando estado de plaza desde PagoQR:', error);
            throw error;
        }
    };

    // --- MANEJADOR DE PAGO QR ACTUALIZADO ---
    const handleVerificarPago = async () => {
        if (!userData) {
            Alert.alert(
                "Sesión Requerida", 
                "Debes iniciar sesión para completar el pago.",
                [{ text: "OK" }]
            );
            return;
        }

        setIsVerifying(true);
        console.log("PAGO QR: Iniciando proceso de pago real...");

        try {
            // 1. CREAR RESERVA EN LA API
            const reservaCreada = await crearReservaEnAPI();
            
            // 2. ACTUALIZAR ESTADO DE LA PLAZA A OCUPADO
            const plazaIdReal = parseInt(reservaData.plazaId);
            await actualizarEstadoPlaza(plazaIdReal);

            console.log("PAGO QR: Proceso completado exitosamente");

            Alert.alert(
                "¡Pago QR Confirmado!",
                `Reserva creada exitosamente:\n\n• Parqueo: ${reservaData.parqueoNombre}\n• Plaza: ${reservaData.nroPlazaReal}\n• Vehículo: ${reservaData.tipoVehiculo} (${reservaData.matricula})\n• Horario: ${new Date(reservaData.fechaInicioISO).toLocaleString()} - ${new Date(reservaData.fechaFinISO).toLocaleString()}\n• Costo: ${reservaData.costoTotal} Bs\n• Método: QR\n`,
                [{
                    text: "Ver Ruta en Mapa",
                    onPress: () => {
                        console.log("PAGO QR: Navegando al mapa con indicaciones...");

                        if (!reservaData.parqueoLat || !reservaData.parqueoLng) {
                            console.error("Error: No se recibieron coordenadas Lat/Lng");
                            Alert.alert("Error", "No se pudieron obtener las coordenadas para mostrar la ruta.");
                            return;
                        }

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

        } catch (error: any) {
            console.error("❌ Error en proceso de pago QR:", error);
            Alert.alert(
                "❌ Error en el Pago",
                error.message || "No se pudo completar el pago. Por favor, intenta nuevamente."
            );
        } finally {
            setIsVerifying(false);
        }
    };

    // --- VERIFICAR DATOS ANTES DE RENDERIZAR ---
    useEffect(() => {
        console.log('📋 Datos recibidos en PagoQR:', reservaData);
        
        if (!reservaData.plazaId || !reservaData.fechaInicioISO || !reservaData.fechaFinISO) {
            console.error('❌ Datos incompletos para el pago QR');
            Alert.alert(
                "Error", 
                "Datos de reserva incompletos. Por favor, regresa y vuelve a intentar.",
                [{ text: "OK", onPress: () => router.back() }]
            );
        }
    }, [reservaData]);

    return (
        <View className="flex-1 bg-[#F6EEE4]">
            {/* Header */}
            <View className="pb-6 px-5 rounded-b-3xl">
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    className="absolute top-12 left-5 z-10 p-2"
                >
                    <Feather name="x" size={28} color="black" />
                </TouchableOpacity>
                <View className="items-center mt-6">
                    <Text className="text-2xl font-bold mt-3">Pago con QR</Text>
                    <Text className="text-sm text-gray-600 mt-1">Escanea para completar</Text>
                </View>
            </View>

            {/* Contenido principal */}
            <View className="flex-1 items-center px-5 mt-6">
                {/* Info del parqueo */}
                <View className="w-full bg-white rounded-xl p-4 mb-5 shadow border border-[#FD721D]/20">
                    <View className="flex-row items-center mb-2">
                        <Feather name="map-pin" size={18} color="#FD721D" />
                        <Text className="text-base font-semibold text-black ml-2">{reservaData.parqueoNombre}</Text>
                    </View>
                    <View className="flex-row items-center mb-2">
                        <Feather name="square" size={18} color="#FD721D" />
                        <Text className="text-sm text-black ml-2">
                            Plaza: <Text className="font-bold">{reservaData.nroPlazaReal}</Text>
                        </Text>
                    </View>
                    <View className="flex-row items-center mb-2">
                        <Feather name="truck" size={18} color="#FD721D" />
                        <Text className="text-sm text-black ml-2">
                            Vehículo: <Text className="font-bold">{reservaData.matricula}</Text>
                        </Text>
                    </View>
                    <View className="flex-row items-center">
                        <Feather name="clock" size={18} color="#FD721D" />
                        <Text className="text-sm text-black ml-2">
                            Horario: <Text className="font-bold">
                                {new Date(reservaData.fechaInicioISO).toLocaleTimeString('es-BO', { 
                                    hour: '2-digit', minute: '2-digit' 
                                })} - {new Date(reservaData.fechaFinISO).toLocaleTimeString('es-BO', { 
                                    hour: '2-digit', minute: '2-digit' 
                                })}
                            </Text>
                        </Text>
                    </View>
                </View>

                {/* Monto destacado */}
                <View className="bg-[#FD721D] rounded-2xl px-8 py-4 mb-6 shadow-xl">
                    <Text className="text-sm text-white/90 text-center">Total a Pagar</Text>
                    <Text className="text-4xl font-extrabold text-white text-center">
                        {reservaData.costoTotal} Bs
                    </Text>
                </View>

                {/* QR Code Placeholder */}
                <View className="w-64 h-64 bg-white border-2 border-black rounded-2xl items-center justify-center shadow-lg mb-6">
                    <Feather name="grid" size={120} color="black" />
                    <Text className="mt-3 font-semibold">Código QR</Text>
                </View>

                <Text className="text-center text-black/70 mb-8 px-6 text-sm">
                    Escanea el código con tu app bancaria para completar el pago de forma segura.
                </Text>

                {/* Estado del usuario */}
                {!userData ? (
                    <View className="w-full bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-4">
                        <Text className="text-yellow-800 text-sm text-center">
                            ⚠️ Debes iniciar sesión para completar el pago
                        </Text>
                    </View>
                ) : (
                    <View>
                        
                    </View>
                )}

                {/* Botón Verificar */}
                <TouchableOpacity
                    className={`w-full py-4 rounded-xl items-center shadow-xl ${
                        !userData || isVerifying ? 'bg-gray-400' : 'bg-black'
                    }`}
                    onPress={handleVerificarPago}
                    disabled={!userData || isVerifying}
                    activeOpacity={0.8}
                >
                    {isVerifying ? (
                        <View className="flex-row items-center">
                            <ActivityIndicator size="small" color="#ffffff" />
                            <Text className="text-white text-base font-bold ml-2">
                                Procesando Pago...
                            </Text>
                        </View>
                    ) : (
                        <View className="flex-row items-center">
                            <Feather name="check-circle" size={20} color="#F6EEE4" />
                            <Text className="text-white text-lg font-bold ml-2">
                                {!userData ? 'Inicia Sesión Primero' : 'Confirmar Pago QR'}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Información adicional */}
                <View className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Text className="text-xs text-blue-800 text-center">
                        💡 Después del pago, la plaza se reservará automáticamente y se actualizará su estado a OCUPADO.
                    </Text>
                </View>
            </View>
        </View>
    );
}