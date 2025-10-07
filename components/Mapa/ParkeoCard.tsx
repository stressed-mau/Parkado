import { View, Text, TouchableOpacity } from "react-native";

// ✅ Tipo de datos consistente con tu código de Mapa
type Parking = {
    id: string;
    nombre: string; 
    latitud: number;
    longitud: number;
    horario: string;
    tarifa: string;
    disponible: boolean;
};

// --- Tipos de Propiedades de la Tarjeta ---
type Props = {
    parking: Parking; 
    onClose: () => void;
};

// ✅ CAMBIO DE NOMBRE: De ParkingDetailCard a ParkeoCard
export const ParkeoCard = ({ parking, onClose }: Props) => {
    
    // Mapeamos los campos del tipo 'Parking' a los nombres que la tarjeta necesita
    const parkingName = parking.nombre;
    const parkingAddress = `Horario: ${parking.horario} | Tarifa: ${parking.tarifa}`; 
    
    // Texto de disponibilidad
    const availabilityText = parking.disponible 
        ? "✅ Lugares disponibles: ¡Estaciona aquí!" 
        : "❌ Estacionamiento lleno / No disponible";

    // Usamos estilos NativeWind (Tailwind CSS)
    return (
        // Contenedor flotante y visible sobre el mapa
        <View className="absolute bottom-10 left-5 right-5 bg-white p-4 rounded-2xl shadow-xl z-40"> 
            
            <Text className="text-xl font-bold text-gray-800">{parkingName}</Text>
            <Text className="text-sm text-gray-600 mt-1">{parkingAddress}</Text>
            
            {/* Texto de disponibilidad con color condicional */}
            <Text 
                className={`mt-2 font-semibold ${parking.disponible ? 'text-green-600' : 'text-red-600'}`}
            >
                {availabilityText}
            </Text>

            <TouchableOpacity
                className="mt-4 bg-blue-500 py-3 rounded-xl active:bg-blue-600 shadow-md"
                onPress={onClose}
            >
                <Text className="text-center text-white font-bold text-base">Cerrar Detalles</Text>
            </TouchableOpacity>
        </View>
    );
};