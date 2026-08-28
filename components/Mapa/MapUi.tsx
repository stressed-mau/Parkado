import React from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface MapUIProps {
  onCenterOnUser: () => void;
  onZoom: (factor: number) => void;
  onClearRoute: () => void;
  isLocating: boolean;
  showDirections: boolean;
  isLoadingRoute: boolean;
}

const MapUI: React.FC<MapUIProps> = ({
  onCenterOnUser,
  onZoom,
  onClearRoute,
  isLocating,
  showDirections,
  isLoadingRoute,
}) => {
  return (
    <>
      {/* Indicador de carga de ruta */}
      {isLoadingRoute && (
        <View className="absolute top-20 self-center bg-white px-4 py-2 rounded-full shadow-lg flex-row items-center elevation-4 z-20">
          <ActivityIndicator size="small" color="#4F46E5" />
          <Text className="text-sm text-gray-600 ml-2">Calculando ruta...</Text>
        </View>
      )}

      {/* Botón de ubicación */}
      <TouchableOpacity
        onPress={onCenterOnUser}
        className="absolute top-28 right-8 z-10 w-14 h-14 bg-white rounded-full items-center justify-center shadow-lg active:bg-gray-200 elevation-5"
        disabled={isLocating}
      >
        {isLocating ? (
          <ActivityIndicator size="small" color="#4F46E5" />
        ) : (
          <Feather name="navigation" size={24} color="#4b5563" />
        )}
      </TouchableOpacity>

     {/*  
      <View className="absolute bottom-24 right-6 z-10 flex-col space-y-3" style={{ elevation: 5 }}>
        <TouchableOpacity 
          onPress={() => onZoom(0.8)} 
          className="w-14 h-14 bg-white rounded-full items-center justify-center shadow-lg active:bg-gray-200"
        >
          <Feather name="plus" size={28} color="#4b5563" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => onZoom(1.25)} 
          className="w-14 h-14 bg-white rounded-full items-center justify-center shadow-lg active:bg-gray-200"
        >
          <Feather name="minus" size={28} color="#4b5563" />
        </TouchableOpacity>
      </View> */}

      {/* Botón de limpiar ruta */}
      {showDirections && (
        <TouchableOpacity
          onPress={onClearRoute}
          className="absolute bottom-5 left-5 z-10 bg-red-600 px-4 py-3 rounded-xl shadow-lg active:bg-red-700 flex-row items-center gap-1 elevation-5"
        >
          <Feather name="x-circle" size={16} color="white"/>
          <Text className="text-white font-bold text-sm">Limpiar Ruta</Text>
        </TouchableOpacity>
      )}
    </>
  );
};

export default MapUI;