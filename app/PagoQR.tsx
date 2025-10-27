import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function PagoQrScreen() {
    const router = useRouter();
    const reservaData = useLocalSearchParams<{
        parqueoNombre: string;
        costoTotal: string;
        plazaId: string;
        matricula: string;
        parqueoLat?: string;
        parqueoLng?: string;
    }>();

    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerificarPago = () => {
        setIsVerifying(true);
        console.log("PAGO QR: Iniciando verificación simulada...");

        setTimeout(() => {
            console.log("PAGO QR: Verificación simulada completa.");
            setIsVerifying(false);

            Alert.alert(
                "¡Pago QR Verificado!",
                `Reserva Confirmada:\nParqueo: ${reservaData.parqueoNombre}\nPlaza: ${reservaData.plazaId}\nVehículo: ${reservaData.matricula}\nCosto: ${reservaData.costoTotal} Bs`,
                [{
                    text: "Ver Ruta en Mapa",
                    onPress: () => {
                        console.log("PAGO QR: Pago exitoso. Navegando al mapa con indicaciones...");

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
        }, 2000);
    };

    return (
        <View className="flex-1 bg-[#F6EEE4]">
            {/* Header con gradiente visual */}
            <View className=" pb-6 px-5 rounded-b-3xl ">
                <TouchableOpacity onPress={() => router.back()} className="absolute top-12 left-5 z-10 p-2">
                     <Feather name="x" size={28} color="black" />
                </TouchableOpacity>
                <View className="items-center mt-6">
                    
                    <Text className="text-2xl font-bold mt-3">Pago con QR</Text>
                    <Text className="text-sm text/80 mt-1">Escanea para completar</Text>
                </View>
            </View>

            {/* Contenido principal */}
            <View className="flex-1 items-center px-5 mt-6">
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

                {/* QR Code Placeholder */}
                <View className="w-64 h-64 bg-white border-2 border-black rounded-2xl items-center justify-center shadow-lg mb-6">
                     <Feather name="grid" size={120} color="black" />
                     <Text className="  mt-3 font-semibold">Código QR</Text>
                </View>

                <Text className="text-center text-black/70 mb-8 px-6 text-sm">
                    Escanea el código con tu app bancaria para completar el pago de forma segura.
                </Text>

                {/* Botón Verificar */}
                <TouchableOpacity
                    className={`w-full py-4 rounded-xl items-center shadow-xl ${isVerifying ? 'bg-black' : 'bg-black'}`}
                    onPress={handleVerificarPago}
                    disabled={isVerifying}
                    activeOpacity={0.8}
                >
                    {isVerifying ? (
                        <View className="flex-row items-center">
                            <ActivityIndicator size="small" color="#ffffff" />
                            <Text className="text-white text-base font-bold ml-2">Verificando...</Text>
                        </View>
                    ) : (
                        <View className="flex-row items-center">
                            <Feather name="check-circle" size={20} color="#F6EEE4" />
                            <Text className="text-white text-lg font-bold ml-2">Verificar Pago</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
