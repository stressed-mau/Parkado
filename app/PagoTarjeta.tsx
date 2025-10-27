import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

export default function PagoTarjetaScreen() {
    const router = useRouter();
    const reservaData = useLocalSearchParams<{
        parqueoNombre: string;
        costoTotal: string;
        plazaId: string;
        matricula: string;
        parqueoLat?: string;
        parqueoLng?: string;
    }>();

    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const formatExpiry = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 2) return cleaned;
        return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    };

    const handlePagar = () => {
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
        console.log("PAGO TARJETA: Iniciando procesamiento simulado...");

        setTimeout(() => {
            console.log("PAGO TARJETA: Procesamiento simulado completo.");
            setIsProcessing(false);

            Alert.alert(
                "¡Pago con Tarjeta Exitoso!",
                `Reserva Confirmada:\nParqueo: ${reservaData.parqueoNombre}\nPlaza: ${reservaData.plazaId}\nVehículo: ${reservaData.matricula}\nCosto: ${reservaData.costoTotal} Bs`,
                 [{
                    text: "Ver Ruta en Mapa",
                    onPress: () => {
                        console.log("PAGO TARJETA: Pago exitoso. Navegando al mapa con indicaciones...");

                        if (!reservaData.parqueoLat || !reservaData.parqueoLng) {
                            console.error("Error: No se recibieron coordenadas Lat/Lng desde la pantalla de reserva.");
                            Alert.alert("Error", "No se pudieron obtener las coordenadas para mostrar la ruta.", [
                                { text: "OK", onPress: () => {
                                    if(router.canGoBack()) router.back();
                                    if(router.canGoBack()) router.back();
                                }}
                            ]);
                            return;
                        }

                        router.push({
                           pathname: '/(tabs)/Mapa' as any,
                           params: {
                             destLat: reservaData.parqueoLat,
                             destLng: reservaData.parqueoLng,
                             destNombre: reservaData.parqueoNombre,
                           }
                       });
                    }
                }]
            );
        }, 3000);
    };

    return (
        <View className="flex-1 bg-[#F6EEE4]">
            {/* Header con gradiente visual */}
            <View className="pb-6 px-5 rounded-b-3xl">
                <TouchableOpacity onPress={() => router.back()} className="absolute top-12 left-5 z-10 p-2">
                     <Feather name="x" size={28} color="black" />
                </TouchableOpacity>
                <View className="items-center mt-6">
                    <FontAwesome5 name="credit-card" size={48} color="#F6EEE4" />
                    <Text className="text-2xl font-bold  mt-3">Pago con Tarjeta</Text>
                    <Text className="text-sm text/80 mt-1">Ingrese los detalles de su tarjeta</Text>
                </View>
            </View>

            {/* Contenido principal */}
            <View className="flex-1 px-5 mt-6">
                {/* Info del parqueo */}
                <View className="w-full bg-white rounded-xl p-4 mb-5 shadow border border-[#7BB5CB]/20">
                    <View className="flex-row items-center mb-2">
                        <Feather name="map-pin" size={18} color="#7BB5CB" />
                        <Text className="text-base font-semibold text-black ml-2">{reservaData.parqueoNombre}</Text>
                    </View>
                    <View className="flex-row items-center mb-2">
                        <Feather name="square" size={18} color="#7BB5CB" />
                        <Text className="text-sm text-black ml-2">Plaza: <Text className="font-bold">{reservaData.plazaId}</Text></Text>
                    </View>
                    <View className="flex-row items-center">
                        <Feather name="truck" size={18} color="#7BB5CB" />
                        <Text className="text-sm text-black ml-2">Vehículo: <Text className="font-bold">{reservaData.matricula}</Text></Text>
                    </View>
                </View>

                {/* Monto destacado */}
                <View className="bg-[#FD721D] rounded-2xl px-8 py-4 mb-6 shadow-xl">
                    <Text className="text-sm text-white/90 text-center">Total a Pagar</Text>
                    <Text className="text-4xl font-extrabold text-white text-center">{reservaData.costoTotal} Bs</Text>
                </View>

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
                                onChangeText={setCardNumber}
                                maxLength={19}
                                placeholderTextColor="#cbccccff"
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
                                    placeholderTextColor="#cbccccff"
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
                                    placeholderTextColor="#cbccccff"
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Botón de Pagar */}
                <TouchableOpacity
                    className={`w-full py-4 rounded-xl items-center shadow-xl mb-6 ${isProcessing ? 'bg-black' : 'bg-black'}`}
                    onPress={handlePagar}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                >
                    {isProcessing ? (
                        <View className="flex-row items-center">
                            <ActivityIndicator size="small" color="#ffffff" />
                            <Text className="text-white text-base font-bold ml-2">Procesando...</Text>
                        </View>
                    ) : (
                        <View className="flex-row items-center">
                            <FontAwesome5 name="credit-card" size={20} color="#F6EEE4" />
                            <Text className="text-white text-lg font-bold ml-2">Pagar</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Mensaje de seguridad */}
                <View className="flex-row items-center justify-center">
                    <Feather name="shield" size={16} color="#7BB5CB" />
                    <Text className="text-xs text-black/70 ml-2">Pago 100% seguro y encriptado</Text>
                </View>
            </View>
        </View>
    );
}
