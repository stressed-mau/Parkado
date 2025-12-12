// components/Mapa/BuscadorMapa.tsx
import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";

interface BuscadorMapaProps {
  // onBuscar puede recibir string (compat) o un objeto de opciones
  onBuscar: (payload: string | Record<string, any>) => void;
  onChangeTexto?: (query: string) => void;
  loading: boolean;
  initialQuery?: string;
  onAbrirFiltros?: () => void; // nuevo: abrir modal de filtros
}

export const BuscadorMapa: React.FC<BuscadorMapaProps> = ({
  onBuscar,
  onChangeTexto,
  loading,
  initialQuery = "",
  onAbrirFiltros,
}) => {
  const [query, setQuery] = useState(initialQuery);

  const handleBuscarTexto = () => {
    if (!query.trim()) return;
    onBuscar(query.trim());
  };

  const handleChange = (text: string) => {
    setQuery(text);
    if (onChangeTexto) onChangeTexto(text);
  };

  return (
    <View style={{ position: "absolute", top: Platform.OS === "ios" ? 50 : 40, left: 16, right: 16, zIndex: 50 }}>
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 12, padding: 8, elevation: 6 }}>
        <TextInput
          style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 10, fontSize: 16, color: "#111" }}
          placeholder="Buscar por nombre o dirección..."
          value={query}
          onChangeText={handleChange}
          onSubmitEditing={handleBuscarTexto}
          placeholderTextColor="#666"
        />

        <TouchableOpacity
          onPress={handleBuscarTexto}
          style={{ padding: 10, marginLeft: 8, backgroundColor: "#7BB5CB", borderRadius: 8, opacity: loading ? 0.6 : 1 }}
          disabled={loading}
        >
          <Feather name="search" size={20} color="white" />
        </TouchableOpacity>

        {/* BOTÓN FILTROS */}
        <TouchableOpacity
          onPress={() => onAbrirFiltros && onAbrirFiltros()}
          style={{ padding: 10, marginLeft: 8, backgroundColor: "#F2BD2B", borderRadius: 8 }}
        >
          <Feather name="filter" size={18} color="#082E3D" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BuscadorMapa;
