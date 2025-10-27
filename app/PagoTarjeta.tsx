// Archivo: app/PagoTarjeta.tsx (ACTUALIZADO para redirigir al mapa con ruta)

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function PagoTarjetaScreen() {
    const router = useRouter();
    // Recibimos los datos, incluyendo Lat/Lng
    const reservaData = useLocalSearchParams<{
        parqueoNombre: string;
        costoTotal: string;
        plazaId: string;
        matricula: string;
        // --- 👇 Necesitamos estos para la ruta ---
        parqueoLat?: string;
        parqueoLng?: string;
        // (Otros datos si los pasaste)
        // fechaInicioISO: string;
        // fechaFinISO: string;
        // metodoPago: string;
    }>();

    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState(''); // MM/AA
    const [cvv, setCvv] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const formatExpiry = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 2) return cleaned;
        return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    };

    const handlePagar = () => {
        // --- Validaciones ---
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
        // --- Fin Validaciones ---

        setIsProcessing(true);
        console.log("PAGO TARJETA: Iniciando procesamiento simulado...");

        setTimeout(() => {
            console.log("PAGO TARJETA: Procesamiento simulado completo.");
            setIsProcessing(false);

            // === SIMULACIÓN DE ÉXITO ===
            Alert.alert(
                "¡Pago con Tarjeta Exitoso! (Simulado)",
                `Reserva Confirmada:\nParqueo: ${reservaData.parqueoNombre}\nPlaza: ${reservaData.plazaId}\nVehículo: ${reservaData.matricula}\nCosto: ${reservaData.costoTotal} Bs`,
                 [{
                    text: "Ver Ruta en Mapa", // Cambiamos texto
                    onPress: () => {
                        console.log("PAGO TARJETA: Pago exitoso. Navegando al mapa con indicaciones...");

                        // Verificamos si recibimos las coordenadas
                        if (!reservaData.parqueoLat || !reservaData.parqueoLng) {
                            console.error("Error: No se recibieron coordenadas Lat/Lng desde la pantalla de reserva.");
                            Alert.alert("Error", "No se pudieron obtener las coordenadas para mostrar la ruta.", [
                                { text: "OK", onPress: () => {
                                    // Fallback: Volver dos pantallas si no hay coords
                                    if(router.canGoBack()) router.back(); // Sale de PagoTarjeta
                                    if(router.canGoBack()) router.back(); // Sale de Reserva
                                }}
                            ]);
                            return;
                        }

                        // --- 👇 NAVEGACIÓN AL MAPA CON PARÁMETROS 👇 ---
                        router.push({
                           pathname: '/(tabs)/Mapa' as any, // Ruta a tu pantalla de mapa
                           params: {
                             destLat: reservaData.parqueoLat,
                             destLng: reservaData.parqueoLng,
                             destNombre: reservaData.parqueoNombre,
                           }
                       });
                       // --- Fin Navegación ---
                    }
                }]
            );
        }, 3000);
    };

    return (
        <View className="flex-1 justify-center bg-gray-100 p-5">
             <TouchableOpacity onPress={() => router.back()} className="absolute top-10 left-5 z-10 p-2">
                 <Feather name="x" size={28} color="#555" />
            </TouchableOpacity>

            <Text className="text-2xl font-bold text-gray-800 mb-4 text-center">Pago con Tarjeta</Text>
            <Text className="text-lg text-gray-600 mb-2 text-center">Parqueo: {reservaData.parqueoNombre}</Text>
            <Text className="text-3xl font-extrabold text-blue-600 mb-8 text-center">Monto: {reservaData.costoTotal} Bs</Text>

            {/* Formulario Simulado */}
            <View className="w-full space-y-4 mb-8">
                <View>
                    <Text className="text-sm font-medium text-gray-600 mb-1 ml-1">Número de Tarjeta</Text>
                    <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white shadow-sm focus:border-blue-500"
                        placeholder="0000 0000 0000 0000"
                        keyboardType="numeric"
                        value={cardNumber}
                        onChangeText={setCardNumber}
                        maxLength={19}
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                <View className="flex-row gap-4">
                    <View className="flex-1">
                         <Text className="text-sm font-medium text-gray-600 mb-1 ml-1">Expiración (MM/AA)</Text>
                         <TextInput
                            className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white shadow-sm focus:border-blue-500"
                            placeholder="MM/AA"
                            keyboardType="numeric"
                            value={expiry}
                            onChangeText={(text) => setExpiry(formatExpiry(text))}
                            maxLength={5}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                     <View className="flex-1">
                         <Text className="text-sm font-medium text-gray-600 mb-1 ml-1">CVV</Text>
                         <TextInput
                            className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white shadow-sm focus:border-blue-500"
                            placeholder="123"
                            keyboardType="numeric"
                            secureTextEntry
                            value={cvv}
                            onChangeText={setCvv}
                            maxLength={4}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                </View>
            </View>

            {/* Botón de Pagar */}
            <TouchableOpacity
                className={`w-full py-4 rounded-lg items-center shadow-lg ${isProcessing ? 'bg-gray-400' : 'bg-blue-600 active:bg-blue-700'}`}
                onPress={handlePagar}
                disabled={isProcessing}
                activeOpacity={0.8}
            >
                {isProcessing ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                    <Text className="text-white text-lg font-bold">Pagar {reservaData.costoTotal} Bs</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}