// Archivo: app/PagoQR.tsx (ACTUALIZADO para redirigir al mapa con ruta)

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'; // Quitamos Image
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function PagoQrScreen() {
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

    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerificarPago = () => {
        setIsVerifying(true);
        console.log("PAGO QR: Iniciando verificación simulada...");

        setTimeout(() => {
            console.log("PAGO QR: Verificación simulada completa.");
            setIsVerifying(false);

            // === SIMULACIÓN DE ÉXITO ===
            Alert.alert(
                "¡Pago QR Verificado! (Simulado)",
                `Reserva Confirmada:\nParqueo: ${reservaData.parqueoNombre}\nPlaza: ${reservaData.plazaId}\nVehículo: ${reservaData.matricula}\nCosto: ${reservaData.costoTotal} Bs`,
                [{
                    text: "Ver Ruta en Mapa", // Cambiamos el texto del botón
                    onPress: () => {
                        console.log("PAGO QR: Pago exitoso. Navegando al mapa con indicaciones...");

                        // Verificamos si recibimos las coordenadas
                        if (!reservaData.parqueoLat || !reservaData.parqueoLng) {
                            console.error("Error: No se recibieron coordenadas Lat/Lng desde la pantalla de reserva.");
                            Alert.alert("Error", "No se pudieron obtener las coordenadas para mostrar la ruta.", [
                                { text: "OK", onPress: () => {
                                    // Fallback: Volver dos pantallas si no hay coords
                                    if(router.canGoBack()) router.back(); // Sale de PagoQR
                                    if(router.canGoBack()) router.back(); // Sale de Reserva
                                }}
                            ]);
                            return;
                        }

                        // --- 👇 NAVEGACIÓN AL MAPA CON PARÁMETROS 👇 ---
                        router.push({
                           pathname: '/(tabs)/Mapa' as any, // Ruta a tu pantalla de mapa
                           params: {
                             // Pasamos las coordenadas del parqueo para que el mapa muestre la ruta
                             destLat: reservaData.parqueoLat,
                             destLng: reservaData.parqueoLng,
                             destNombre: reservaData.parqueoNombre,
                           }
                       });
                       // --- Fin Navegación ---
                    }
                }]
            );
        }, 2000);
    };

    return (
        <View className="flex-1 items-center justify-center bg-gray-100 p-5">
            <TouchableOpacity onPress={() => router.back()} className="absolute top-10 left-5 z-10 p-2">
                 <Feather name="x" size={28} color="#555" />
            </TouchableOpacity>

            <Text className="text-2xl font-bold text-gray-800 mb-4">Pago con QR</Text>
            <Text className="text-lg text-gray-600 mb-2">Parqueo: {reservaData.parqueoNombre}</Text>
            <Text className="text-3xl font-extrabold text-blue-600 mb-6">Monto: {reservaData.costoTotal} Bs</Text>

            {/* Placeholder QR */}
            <View className="w-64 h-64 bg-white border border-gray-300 rounded-lg items-center justify-center shadow-md mb-8">
                 <Feather name="grid" size={150} color="#d1d5db" />
                 <Text className="text-gray-400 mt-2">Simulación de QR</Text>
            </View>

            <Text className="text-center text-gray-500 mb-8 px-4">
                Escanea el código QR con tu aplicación bancaria para completar el pago.
            </Text>

            {/* Botón Verificar */}
            <TouchableOpacity
                className={`w-full py-4 rounded-lg items-center shadow-lg ${isVerifying ? 'bg-gray-400' : 'bg-green-600 active:bg-green-700'}`}
                onPress={handleVerificarPago}
                disabled={isVerifying}
                activeOpacity={0.8}
            >
                {isVerifying ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                    <Text className="text-white text-lg font-bold">Verificar Pago</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}