import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface BuscadorMapaProps {
  onBuscar: (query: string) => void;
  onChangeTexto?: (query: string) => void;
  loading: boolean;
}

export const BuscadorMapa: React.FC<BuscadorMapaProps> = ({
  onBuscar,
  onChangeTexto,
  loading,
}) => {
  const [query, setQuery] = useState('');

  const handleBuscar = () => {
    if (query.trim()) {
      onBuscar(query.trim());
    }
  };

  const handleChange = (text: string) => {
    setQuery(text);
    if (onChangeTexto) {
      onChangeTexto(text);
    }
  };

  return (
    <View className="absolute top-10 left-0 right-0 z-20 px-4">
      <View className="flex-row items-center bg-white rounded-lg shadow-lg p-2">
        <TextInput
          className="flex-1 py-2 px-3 text-base text-black"
          placeholder="Buscar parqueos por nombre o dirección..."
          value={query}
          onChangeText={handleChange}
          onSubmitEditing={handleBuscar}
          placeholderTextColor="#666"
        />

        <TouchableOpacity
          onPress={handleBuscar}
          className="p-2 ml-2 bg-[#7BB5CB] rounded-lg"
          disabled={loading}
        >
          <Feather name="search" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
