import React from 'react';
import { View, Text } from 'react-native';

interface DebugBusquedaProps {
  loading: boolean;
  error: string | null;
  resultadosCount: number;
  usandoMock: boolean;
}

const DebugBusqueda: React.FC<DebugBusquedaProps> = ({
  loading,
  error,
  resultadosCount,
  usandoMock,
}) => {
  if (!loading && !error && resultadosCount === 0) return null;

  return (
    <View className="absolute top-20 left-4 right-4 bg-black/80 p-3 rounded-lg z-50">
      <Text className="text-white font-bold text-center mb-1">Estado Búsqueda</Text>
      
      <View className="flex-row justify-between">
        <Text className="text-white text-xs">
          Estado: {loading ? '🔄 Cargando...' : error ? '❌ Error' : '✅ Listo'}
        </Text>
        <Text className="text-white text-xs">
          Resultados: {resultadosCount}
        </Text>
        <Text className="text-white text-xs">
          Fuente: {usandoMock ? '📱 Mock' : '🌐 API'}
        </Text>
      </View>

      {error && (
        <Text className="text-red-400 text-xs mt-1">
          Error: {error}
        </Text>
      )}

      {usandoMock && (
        <Text className="text-yellow-400 text-xs mt-1">
          ⚠️ Usando datos de prueba
        </Text>
      )}
    </View>
  );
};

export default DebugBusqueda;