import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from "@expo/vector-icons";
interface UserData {
    id: string;
    email: string;
    token: string;
    nombre: string;
}

export default function PagoTarjetaScreen() {
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

    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);

    // --- CARGAR DATOS DEL USUARIO ---
    useEffect(() => {
        const cargarUsuario = async () => {
            try {
                const storedUserData = await AsyncStorage.getItem('userData');
                if (storedUserData) {
                    const user = JSON.parse(storedUserData);
                    setUserData(user);
                    console.log('✅ Usuario cargado en PagoTarjeta:', user);
                } else {
                    console.log('❌ No hay usuario logueado en PagoTarjeta');
                }
            } catch (error) {
                console.error('Error cargando usuario en PagoTarjeta:', error);
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

            console.log('📤 Enviando reserva a API desde PagoTarjeta:', reservaPayload);

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

            console.log('✅ Reserva creada exitosamente desde PagoTarjeta:', responseData);
            return responseData;

        } catch (error: any) {
            console.error('❌ Error creando reserva desde PagoTarjeta:', error);
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

            console.log('🔄 Actualizando estado de plaza desde PagoTarjeta:', { plazaId, updatePayload });

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
            console.log('✅ Estado de plaza actualizado exitosamente desde PagoTarjeta:', responseData);
            return responseData;

        } catch (error: any) {
            console.error('❌ Error actualizando estado de plaza desde PagoTarjeta:', error);
            throw error;
        }
    };

    const formatExpiry = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 2) return cleaned;
        return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    };

    const formatCardNumber = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        const parts = [];
        for (let i = 0; i < cleaned.length; i += 4) {
            parts.push(cleaned.slice(i, i + 4));
        }
        return parts.join(' ');
    };

    // --- MANEJADOR DE PAGO CON TARJETA ACTUALIZADO ---
    const handlePagar = async () => {
        if (!userData) {
            Alert.alert(
                "Sesión Requerida", 
                "Debes iniciar sesión para completar el pago.",
                [{ text: "OK" }]
            );
            return;
        }

        // Validaciones de tarjeta
        if (!cardNumber || cardNumber.replace(/\s/g, '').length < 14) {
            Alert.alert("Error", "Ingresa un número de tarjeta válido.");
            return;
        }
        if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
            Alert.alert("Error", "Ingresa la fecha de expiración (MM/AA).");
            return;
        }
        if (!cvv || cvv.length < 3) {
            Alert.alert("Error", "Ingresa el CVV (3 o 4 dígitos).");
            return;
        }

        setIsProcessing(true);
        console.log("PAGO TARJETA: Iniciando procesamiento real...");

        try {
            // 1. CREAR RESERVA EN LA API
            const reservaCreada = await crearReservaEnAPI();
            
            // 2. ACTUALIZAR ESTADO DE LA PLAZA A OCUPADO
            const plazaIdReal = parseInt(reservaData.plazaId);
            await actualizarEstadoPlaza(plazaIdReal);

            console.log("PAGO TARJETA: Proceso completado exitosamente");

            Alert.alert(
                "¡Pago con Tarjeta Exitoso!",
                `Reserva creada exitosamente:\n\n• Parqueo: ${reservaData.parqueoNombre}\n• Plaza: ${reservaData.nroPlazaReal}\n• Vehículo: ${reservaData.tipoVehiculo} (${reservaData.matricula})\n• Horario: ${new Date(reservaData.fechaInicioISO).toLocaleString()} - ${new Date(reservaData.fechaFinISO).toLocaleString()}\n• Costo: ${reservaData.costoTotal} Bs\n• Método: Tarjeta\n`,
                [{
                    text: "Ver Ruta en Mapa",
                    onPress: () => {
                        console.log("PAGO TARJETA: Navegando al mapa con indicaciones...");

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
            console.error("❌ Error en proceso de pago con tarjeta:", error);
            Alert.alert(
                "❌ Error en el Pago",
                error.message || "No se pudo completar el pago. Por favor, intenta nuevamente."
            );
        } finally {
            setIsProcessing(false);
        }
    };

    // --- VERIFICAR DATOS ANTES DE RENDERIZAR ---
    useEffect(() => {
        console.log('📋 Datos recibidos en PagoTarjeta:', reservaData);
        
        if (!reservaData.plazaId || !reservaData.fechaInicioISO || !reservaData.fechaFinISO) {
            console.error('❌ Datos incompletos para el pago con tarjeta');
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
                    <FontAwesome5 name="credit-card" size={48} color="#FD721D" />
                    <Text className="text-2xl font-bold text-black mt-3">Pago con Tarjeta</Text>
                    <Text className="text-sm text-gray-600 mt-1">Ingrese los detalles de su tarjeta</Text>
                </View>
            </View>

            {/* Contenido principal */}
            <View className="flex-1 px-5 mt-6">
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

                {/* Formulario de Tarjeta */}
                <View className="w-full mb-6">
                    {/* Número de Tarjeta */}
                    <View className="mb-4">
                        <Text className="text-sm font-semibold text-black mb-2 ml-1">Número de Tarjeta</Text>
                        <View className="flex-row items-center bg-white border-2 border-black rounded-xl px-4 py-3 shadow">
                            <FontAwesome5 name="credit-card" size={18} color="black" />
                            <TextInput
                                className="flex-1 text-base text-black ml-3"
                                placeholder="0000 0000 0000 0000"
                                keyboardType="numeric"
                                value={cardNumber}
                                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                                maxLength={19}
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    {/* Expiración y CVV */}
                    <View className="flex-row gap-3 mb-4">
                        <View className="flex-1">
                            <Text className="text-sm font-semibold text-black mb-2 ml-1">Expiración</Text>
                            <View className="flex-row items-center bg-white border-2 border-black rounded-xl px-4 py-3 shadow">
                                <Feather name="calendar" size={18} color="black" />
                                <TextInput
                                    className="flex-1 text-base text-black ml-3"
                                    placeholder="MM/AA"
                                    keyboardType="numeric"
                                    value={expiry}
                                    onChangeText={(text) => setExpiry(formatExpiry(text))}
                                    maxLength={5}
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>
                        <View className="flex-1">
                            <Text className="text-sm font-semibold text-black mb-2 ml-1">CVV</Text>
                            <View className="flex-row items-center bg-white border-2 border-black rounded-xl px-4 py-3 shadow">
                                <Feather name="lock" size={18} color="black" />
                                <TextInput
                                    className="flex-1 text-base text-black ml-3"
                                    placeholder="123"
                                    keyboardType="numeric"
                                    secureTextEntry
                                    value={cvv}
                                    onChangeText={setCvv}
                                    maxLength={4}
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Botón de Pagar */}
                <TouchableOpacity
                    className={`w-full py-4 rounded-xl items-center shadow-xl mb-6 ${
                        !userData || isProcessing ? 'bg-gray-400' : 'bg-black'
                    }`}
                    onPress={handlePagar}
                    disabled={!userData || isProcessing}
                    activeOpacity={0.8}
                >
                    {isProcessing ? (
                        <View className="flex-row items-center">
                            <ActivityIndicator size="small" color="#ffffff" />
                            <Text className="text-white text-base font-bold ml-2">Procesando Pago...</Text>
                        </View>
                    ) : (
                        <View className="flex-row items-center">
                            <FontAwesome5 name="credit-card" size={20} color="#F6EEE4" />
                            <Text className="text-white text-lg font-bold ml-2">
                                {!userData ? 'Inicia Sesión Primero' : 'Pagar con Tarjeta'}
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

                {/* Mensaje de seguridad */}
                <View className="flex-row items-center justify-center mt-4">
                    <Feather name="shield" size={16} color="#FD721D" />
                    <Text className="text-xs text-black/70 ml-2">Pago 100% seguro y encriptado</Text>
                </View>
            </View>
        </View>
    );
}