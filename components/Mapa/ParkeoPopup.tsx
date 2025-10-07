import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

// ✅ CORRECCIÓN 1: Definición del tipo de datos 'Parqueo' que viene desde el mapa
type Parqueo = { 
    id: string; 
    nombre: string; 
    latitud: number; 
    longitud: number; 
    horario: string; 
    tarifa: string; 
    disponible: boolean; 
    // Añadimos campos que el Popup necesita, como rating e imagen, 
    // asumiendo que ya los has añadido a tu fuente de datos o mocks.
    rating: number; 
    imageUri: string;
};

// --- Tipos de Propiedades del Popup (renombrados) ---
interface ParkeoPopupProps {
    // Usaremos el campo 'details' con el tipo Parqueo
    details: Parqueo; 
    onClose: () => void;
}

// ✅ CAMBIO DE NOMBRE: De ParkingDetailsPopup a ParkeoPopup
const ParkeoPopup: React.FC<ParkeoPopupProps> = ({ details, onClose }) => {
  // En este componente, no necesitamos 'isVisible' si lo renderizamos condicionalmente en el padre.
  // El padre (Mapa.tsx) simplemente dejará de renderizarlo si 'details' es null.

  // Mapeamos los campos de Parqueo a la lógica del Popup
  const name = details.nombre;
  const rating = details.rating || 4; // Usamos un valor por defecto si no existe
  const address = `Horario: ${details.horario} | Tarifa: ${details.tarifa}`;
  const availabilityText = details.disponible ? "¡Disponible ahora!" : "Lleno";
  const imageUri = details.imageUri;


  // Componente simple para mostrar estrellas de calificación (simulado)
  const RatingStars = ({ count }: { count: number }) => (
    <Text className="text-yellow-500">{
      '★'.repeat(count) + '☆'.repeat(5 - count)
    }</Text>
  );

  return (
    // ✅ CAMBIO 2: Añadimos un fondo oscuro semi-transparente para dar efecto Modal
    <View style={StyleSheet.absoluteFillObject} className="bg-black/40 items-center justify-start pt-20 z-40">

      {/* Contenedor principal del popup */}
      <View className="p-4 mx-6 bg-white rounded-xl shadow-2xl z-50 w-11/12">
        
        {/* Botón de Cierre (Lo hacemos visible y funcional) */}
        <TouchableOpacity onPress={onClose} className="absolute top-3 right-3 p-1 z-10">
          <Text className="text-xl font-bold text-gray-500">✕</Text>
        </TouchableOpacity>

        {/* Área de Contenido (Imagen y Texto) */}
        <View className="flex-row items-start space-x-3 pt-2">
          
          {/* Marcador de Imagen o Placeholder */}
          <View className="w-20 h-16 bg-gray-200 rounded-lg justify-center items-center">
              <Image 
                source={{ uri: imageUri || 'https://via.placeholder.com/100x80?text=IMG' }} 
                className="w-full h-full rounded-lg"
                resizeMode="cover"
              />
          </View>

          {/* Detalles del Estacionamiento */}
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-800">{name}</Text>
            <View className="flex-row items-center my-1">
              <RatingStars count={rating} />
              <Text className="text-xs text-gray-500 ml-2">({rating}.0)</Text>
            </View>
            <Text className="text-sm text-gray-600">{address}</Text>
            <Text className={`text-xs mt-1 font-semibold ${details.disponible ? 'text-green-600' : 'text-red-600'}`}>
              {availabilityText}
            </Text>
          </View>

          {/* Iconos de Acción (Calendario y Mapa) */}
          <View className="flex-col space-y-3 pt-1">
            {/* Icono de Calendario/Reserva */}
            <TouchableOpacity onPress={() => console.log('Abrir reserva')} className="p-1 border border-gray-300 rounded-lg">
               <Text className="text-2xl text-blue-600">📅</Text> 
            </TouchableOpacity>
            {/* Icono de Mapa/Ruta */}
            <TouchableOpacity onPress={() => console.log('Abrir rutas')} className="p-1 border border-gray-300 rounded-lg">
               <Text className="text-2xl text-green-600">🗺️</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </View>
  );
};

export default ParkeoPopup;

const StyleSheet = { 
    absoluteFillObject: { 
        position: 'absolute' as 'absolute', 
        top: 0, 
        left: 0, 
        bottom: 0, 
        right: 0 
    }
};