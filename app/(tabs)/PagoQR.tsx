// Archivo: app/pagoQr.tsx (Nueva pantalla)
// Simula el pago con QR

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function PagoQrScreen() {
    const router = useRouter();
    // Recibimos los datos de la reserva
    const reservaData = useLocalSearchParams<{
        parqueoNombre: string;
        costoTotal: string;
        // ...puedes recibir más datos si los necesitas mostrar
        plazaId: string;
        matricula: string;
        fechaInicioISO: string;
        fechaFinISO: string;
        metodoPago: string;
    }>();

    const [isVerifying, setIsVerifying] = useState(false); // Estado para simular carga

    const handleVerificarPago = () => {
        setIsVerifying(true);
        console.log("PAGO QR: Iniciando verificación simulada...");

        // Simulamos una demora de 2 segundos
        setTimeout(() => {
            console.log("PAGO QR: Verificación simulada completa.");
            setIsVerifying(false);

            // === SIMULACIÓN DE ÉXITO ===
            // Aquí iría tu lógica real para confirmar el pago en el backend
            Alert.alert(
                "¡Pago QR Verificado! (Simulado)",
                `Reserva Confirmada:\nParqueo: ${reservaData.parqueoNombre}\nPlaza: ${reservaData.plazaId}\nVehículo: ${reservaData.matricula}\nCosto: ${reservaData.costoTotal} Bs`,
                [{
                    text: "Finalizar", onPress: () => {
                        // Volvemos DOS pantallas atrás (Reserva -> Detalle)
                        if (router.canGoBack()) {
                            router.back(); // Sale de PagoQR a Reserva
                            if (router.canGoBack()) {
                                router.back(); // Sale de Reserva a Detalle
                            }
                        }
                    }
                }]
            );
        }, 2000); // 2 segundos de espera simulada
    };

    return (
        <View className="flex-1 items-center justify-center bg-gray-100 p-5">
            {/* Botón Volver */}
             <TouchableOpacity onPress={() => router.back()} className="absolute top-10 left-5 z-10 p-2">
                 <Feather name="x" size={28} color="#555" />
            </TouchableOpacity>

            <Text className="text-2xl font-bold text-gray-800 mb-4">Pago con QR</Text>
            <Text className="text-lg text-gray-600 mb-2">Parqueo: {reservaData.parqueoNombre}</Text>
            <Text className="text-3xl font-extrabold text-blue-600 mb-6">Monto: {reservaData.costoTotal} Bs</Text>

            {/* Placeholder para la imagen del QR */}
            <View className="w-64 h-64 bg-white border border-gray-300 rounded-lg items-center justify-center shadow-md mb-8">
                {/* Puedes poner una imagen real de un QR genérico si quieres */}
                {/* O usar un icono */}
                 <Feather name="grid" size={150} color="#d1d5db" />
                 <Text className="text-gray-400 mt-2">Simulación de QR</Text>
            </View>

            <Text className="text-center text-gray-500 mb-8 px-4">
                Escanea el código QR con tu aplicación bancaria para completar el pago.
            </Text>

            {/* Botón de Verificar */}
            <TouchableOpacity
                className={`w-full py-4 rounded-lg items-center shadow-lg ${isVerifying ? 'bg-gray-400' : 'bg-green-600 active:bg-green-700'}`}
                onPress={handleVerificarPago}
                disabled={isVerifying}
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