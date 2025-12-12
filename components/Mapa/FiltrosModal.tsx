// components/Mapa/FiltrosModal.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";

/**
 * Props:
 * - visible: boolean
 * - onClose: () => void
 * - onApply: (opciones) => void
 * - initial?: valores iniciales opcionales (para editar filtros existentes)
 */
const FiltrosModal: React.FC<any> = ({ visible, onClose, onApply, initial = {} }) => {
  // Campos del formulario
  const [q, setQ] = useState<string>((initial.q ?? "").toString());
  const [radius, setRadius] = useState<string>(String(initial.radius ?? 3000));
  const [tipoVehiculoId, setTipoVehiculoId] = useState<string>(String(initial.tipoVehiculoId ?? ""));
  const [precioMaxHora, setPrecioMaxHora] = useState<string>(String(initial.precioMaxHora ?? ""));
  const [ratingMinimo, setRatingMinimo] = useState<string>(String(initial.ratingMinimo ?? ""));
  const [sort, setSort] = useState<string>((initial.sort ?? "").toString());

  useEffect(() => {
    if (visible) {
      // re-inicializar con valores iniciales limpios
      setQ((initial.q ?? "").toString());
      setRadius(String(initial.radius ?? 3000));
      setTipoVehiculoId(String(initial.tipoVehiculoId ?? ""));
      setPrecioMaxHora(String(initial.precioMaxHora ?? ""));
      setRatingMinimo(String(initial.ratingMinimo ?? ""));
      setSort((initial.sort ?? "").toString());
    }
  }, [visible, initial]);

  const handleAplicar = () => {
    const payload: any = {};

    // Texto
    if (q && q.trim()) payload.q = q.trim();

    // Radio (solo > 0)
    if (typeof radius === "string" && radius.trim() !== "") {
      const r = Number(radius.trim());
      if (Number.isFinite(r) && r > 0) payload.radius = r;
    }

    // Tipo vehiculo
    if (typeof tipoVehiculoId === "string" && tipoVehiculoId.trim() !== "") {
      const tv = Number(tipoVehiculoId.trim());
      if (Number.isFinite(tv) && tv > 0) payload.tipoVehiculoId = tv;
    }

    // Precio máximo por hora: enviar solo si > 0
    if (typeof precioMaxHora === "string" && precioMaxHora.trim() !== "") {
      const pmax = Number(precioMaxHora.trim());
      if (Number.isFinite(pmax) && pmax > 0) payload.precioMaxHora = pmax;
    }

    // Rating mínimo: enviar solo si > 0
    if (typeof ratingMinimo === "string" && ratingMinimo.trim() !== "") {
      const rmin = Number(ratingMinimo.trim());
      if (Number.isFinite(rmin) && rmin > 0) payload.ratingMinimo = rmin;
    }

    // Sort -> validar y trim (acepta 'distancia', 'rating', 'precio')
    if (sort && typeof sort === "string") {
      const s = sort.trim();
      if (["distancia", "rating", "precio"].includes(s)) {
        payload.sort = s;
      }
    }

    onApply(payload);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }}>
        <View style={{ maxHeight: "85%", backgroundColor: "white", borderTopLeftRadius: 14, borderTopRightRadius: 14, padding: 16 }}>
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: "700" }}>Filtros de búsqueda</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView showsVerticalScrollIndicator style={{ marginBottom: 10 }}>
            <Text style={{ fontWeight: "600", marginTop: 6 }}>Texto (nombre / dirección)</Text>
            <TextInput value={q} onChangeText={setQ} placeholder="Ej: Central" style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6 }} />

            <Text style={{ fontWeight: "600", marginTop: 10 }}>Radio (metros)</Text>
            <TextInput value={radius} onChangeText={setRadius} keyboardType="numeric" placeholder="3000" style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6 }} />

            <Text style={{ fontWeight: "600", marginTop: 10 }}>Tipo de vehículo</Text>
            <View style={{ flexDirection: "row", marginTop: 6 }}>
              <TouchableOpacity onPress={() => setTipoVehiculoId("")} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: tipoVehiculoId === "" ? "#7BB5CB" : "#ddd", marginRight: 8 }}>
                <Text>Todos</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTipoVehiculoId("1")} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: tipoVehiculoId === "1" ? "#7BB5CB" : "#ddd", marginRight: 8 }}>
                <Text>Auto</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTipoVehiculoId("2")} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: tipoVehiculoId === "2" ? "#7BB5CB" : "#ddd" }}>
                <Text>Moto</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontWeight: "600", marginTop: 10 }}>Precio máximo por hora (Bs)</Text>
            <TextInput value={precioMaxHora} onChangeText={setPrecioMaxHora} keyboardType="numeric" placeholder="Ej: 12" style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6 }} />

            <Text style={{ fontWeight: "600", marginTop: 10 }}>Rating mínimo</Text>
            <TextInput value={ratingMinimo} onChangeText={setRatingMinimo} keyboardType="numeric" placeholder="Ej: 4" style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6 }} />

            <Text style={{ fontWeight: "600", marginTop: 10 }}>Ordenar por</Text>
            <View style={{ flexDirection: "row", marginTop: 6 }}>
              <TouchableOpacity onPress={() => setSort("")} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: sort === "" ? "#7BB5CB" : "#ddd", marginRight: 8 }}>
                <Text>Por defecto</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSort("rating")} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: sort === "rating" ? "#7BB5CB" : "#ddd", marginRight: 8 }}>
                <Text>Rating</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSort("precio")} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: sort === "precio" ? "#7BB5CB" : "#ddd" }}>
                <Text>Precio</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSort("distancia")} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: sort === "distancia" ? "#7BB5CB" : "#ddd" }}>
                <Text>Distancia</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            <TouchableOpacity onPress={onClose} style={{ paddingVertical: 12, paddingHorizontal: 18 }}>
              <Text style={{ color: "#666", fontWeight: "600" }}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleAplicar} style={{ backgroundColor: "#7BB5CB", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 }}>
              <Text style={{ color: "white", fontWeight: "700" }}>Aplicar filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FiltrosModal;
