// src/components/ParkingDetailsPopup.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
// Asume que tienes iconos o puedes usar una librería como 'lucide-react-native' o 'react-native-vector-icons'
// Para este ejemplo, usaremos un texto para simular los iconos.
// const CalendarIcon = ...
// const MapIcon = ...

interface ParkingDetails {
  name: string;
  rating: number; // Por ejemplo, 1 a 5
  address: string;
  availability: string;
  imageUri: string;
}

interface ParkingDetailsPopupProps {
  isVisible: boolean;
  details: ParkingDetails;
  onClose: () => void;
  // Puedes añadir más props para acciones como 'onBook' o 'onNavigate'
}

const ParkingDetailsPopup: React.FC<ParkingDetailsPopupProps> = ({ isVisible, details, onClose }) => {
  if (!isVisible) {
    return null; // No renderiza si no es visible
  }

  // Componente simple para mostrar estrellas de calificación (simulado)
  const RatingStars = ({ count }: { count: number }) => (
    <Text className="text-yellow-500">{
      '★'.repeat(count) + '☆'.repeat(5 - count)
    }</Text>
  );

  return (
    // Contenedor principal del popup
    // bg-white: fondo blanco; p-4: padding; rounded-lg: esquinas redondeadas; 
    // shadow-xl: sombra; w-11/12 (ejemplo de ancho); mx-auto: centrado horizontal
    <View className="absolute top-1/4 left-0 right-0 p-4 mx-6 bg-white rounded-xl shadow-2xl z-50">
      
      {/* Botón de Cierre (Opcional, si no usas un modal nativo) */}
      {/*
      <TouchableOpacity onPress={onClose} className="absolute top-2 right-2 p-1">
        <Text className="text-xl font-bold text-gray-500">×</Text>
      </TouchableOpacity>
      */}

      {/* 1. Área de Contenido (Imagen y Texto) */}
      <View className="flex-row items-start space-x-3">
        
        {/* Marcador de Imagen o Placeholder */}
        <View className="w-20 h-16 bg-gray-200 rounded-lg justify-center items-center">
            {/* Si tienes una URL, usa Image. En el mockup es un placeholder */}
            <Image 
              source={{ uri: details.imageUri || 'https://via.placeholder.com/100x80?text=IMG' }} 
              className="w-full h-full rounded-lg"
              resizeMode="cover"
            />
        </View>

        {/* Detalles del Estacionamiento */}
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800">{details.name}</Text>
          <View className="flex-row items-center my-1">
            <RatingStars count={details.rating} />
            <Text className="text-xs text-gray-500 ml-2">({details.rating}.0)</Text>
          </View>
          <Text className="text-sm text-gray-600">Dirección: {details.address}</Text>
          <Text className="text-xs text-gray-500 mt-1">
            <Text className="font-semibold">Libre:</Text> {details.availability}
          </Text>
        </View>

        {/* Iconos de Acción (Calendario y Mapa) */}
        <View className="flex-col space-y-3 pt-1">
          {/* Icono de Calendario */}
          <TouchableOpacity onPress={() => console.log('Abrir reserva')} className="p-1">
             <Text className="text-2xl text-gray-600">📅</Text> 
          </TouchableOpacity>
          {/* Icono de Mapa/Ruta */}
          <TouchableOpacity onPress={() => console.log('Abrir rutas')} className="p-1">
             <Text className="text-2xl text-gray-600">🗺️</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
};

export default ParkingDetailsPopup;
