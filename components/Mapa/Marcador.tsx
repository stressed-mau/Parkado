import React from "react";
import { Marker } from "react-native-maps";
import { Image } from "react-native";
// La importación de 'Parking' no es necesaria si definimos el tipo aquí o lo importamos

// ✅ CORRECCIÓN 1: Definición del tipo Parqueo consistente con el Mapa.tsx
type Parqueo = {
    id: string;
    nombre: string; 
    latitud: number;
    longitud: number;
    horario: string;
    tarifa: string;
    disponible: boolean;
    // Opcional: si usas íconos condicionales, podrías necesitar 'rating' e 'imageUri' aquí
    rating?: number; 
    imageUri?: string;
};

// --- Tipos de Propiedades del Marcador ---
type Props = {
    // Usamos el tipo Parqueo
    parqueo: Parqueo; 
    onPress: () => void;
};

// ✅ CAMBIO DE NOMBRE: De ParkingMarker a Marcador
export const Marcador = ({ parqueo, onPress }: Props) => {
    
    // ✅ CORRECCIÓN 2: Uso de propiedades de 'Parqueo'
    // Se usa 'parqueo.nombre' en lugar de 'parking.name'
    // Se usa 'parqueo.latitud' y 'parqueo.longitud' en lugar de 'parking.latitude' y 'parking.longitude'
    
    return (
        <Marker
            coordinate={{ latitude: parqueo.latitud, longitude: parqueo.longitud }}
            title={parqueo.nombre} // Muestra el nombre al hacer clic (antes de que salga el popup)
            onPress={onPress} // Dispara la función para mostrar el ParkeoPopup
            // Puedes usar pinColor aquí si quieres volver a los pines básicos de forma condicional:
            // pinColor={parqueo.disponible ? 'green' : 'red'}
        >
            {/* Ícono Personalizado */}
            <Image
                // Esta ruta asume que el archivo está en ../assets/images/
                source={require("../assets/images/paring_marker.png")} 
                style={{ 
                    width: 32, 
                    height: 32,
                    // Si el estacionamiento no está disponible, podemos cambiar su opacidad para indicarlo
                    opacity: parqueo.disponible ? 1.0 : 0.5 
                }}
                resizeMode="contain"
            />
        </Marker>
    );
};