import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import ResumenCard from "@/components/Admin/ResumenCard";
import { getTarifasYPlazas, getPlazas, getReservasPorParqueo } from "../api/parqueoApi";
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';

export default function ParqueoDetalle() {
  const [tarifas, setTarifas] = useState<any[]>([]);
  const [plazas, setPlazas] = useState<any[]>([]);
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"Todos" | "Auto" | "Moto">("Todos");
  const [plazasOpen, setPlazasOpen] = useState(false); // Nuevo estado para colapsable
  const [vehiculosOpen, setVehiculosOpen] = useState(false);

  const idParqueo = 1; // puedes cambiarlo o pasarlo por props

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);

        const [tarifasData, plazasData, reservasData] = await Promise.all([
          getTarifasYPlazas(),
          getPlazas(idParqueo),
          getReservasPorParqueo(idParqueo),
        ]);

        setTarifas(tarifasData);
        setPlazas(plazasData);
        setReservas(reservasData);
      } catch (error) {
        Alert.alert("Error", "No se pudieron cargar los datos del parqueo");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Filtra las plazas según el tipo de vehículo
  const plazasFiltradas = plazas.filter((p) => {
    if (filter === "Todos") return true;
    return p.tipoVehiculo?.nombre === filter;
  });

  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha);
    return d.toLocaleDateString();
  };

  const formatearHora = (fecha: string) => {
    const d = new Date(fecha);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Asigna color de fondo según el estado
  const getEstadoColor = (estado: string | null) => {
    switch (estado) {
      case "OCUPADO":
        return "bg-[#FD721D] border-[#FD721D]";
      case "RESERVA":
        return "bg-[#F2BD2B] border-[#F2BD2B]";
      case "DISPONIBLE":
      default:
        return "bg-[#8bb23f] border-[#8bb23f]";
    }
  };

  return (
    <View className="flex-1 p-6 bg-[#F6EEE4]">
      <Text className="text-2xl font-bold my-7 text-[#22485A] self-center">
        PARQUEO N° 1
      </Text>

      {/* --- Tarjetas resumen --- */}
      <View className="flex-row  justify-between mb-4 gap-2.5">
        {tarifas.map((item) => (
          <ResumenCard
            key={item.tipoVehiculo}
            label={item.tipoVehiculo}
            ocupados={item.plazasOcupadas}
            capacidad={item.plazasTotales}
            tarifa={`${item.tarifaHora} Bs/h`}
            color={item.tipoVehiculo === "Auto" ? "#2980b9" : "#8e44ad"}
            icon={item.tipoVehiculo === "Auto" ? <FontAwesome5 name="car-side" size={24} color="#2980b9" /> : <FontAwesome5 name="motorcycle" size={24} color="#2980b9" />}
          />
        ))}
      </View>

      {/* --- Filtros (Autos / Motos / Todos) --- */}
      <View className="flex-row justify-start mb-4">
        {["Auto", "Moto", "Todos"].map((tipo) => (
          <TouchableOpacity
            key={tipo}
            onPress={() => setFilter(tipo as any)}
            className={`px-4 py-2 mx-1 rounded-xl border ${
              filter === tipo
                ? tipo === "Auto"
                  ? "bg-blue-400 border-blue-500"
                  : tipo === "Moto"
                  ? "bg-blue-400 border-blue-500"
                  : "bg-gray-400 border-gray-500"
                : "bg-white border-gray-300"
            }`}
          >
            <Text
              className={`font-semibold ${
                filter === tipo ? "text-white" : "text-gray-600"
              }`}
            >
              {tipo === "Auto" ? "Autos" : tipo === "Moto" ? "Motos" : "Todos"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => setPlazasOpen(!plazasOpen)}
        className="mb-3 w-full px-4 py-2 bg-[#7bb3cd] rounded-xl self-start"
      >
        <Text className="font-semibold text-white">
          {plazasOpen ? "∆ Ocultar plazas" : "∇ Mostrar plazas"}
        </Text>
      </TouchableOpacity>

      {/* --- Mapa de espacios --- */}
      {plazasOpen && (
        <>
          {loading ? (
            <ActivityIndicator size="large" color="#2980b9" />
          ) : (
            <FlatList
              data={plazasFiltradas}
              keyExtractor={(item) => item.id.toString()}
              numColumns={4}
              columnWrapperStyle={{
                justifyContent: "space-between",
                marginBottom: 10,
              }}
              renderItem={({ item }) => (
                <View
                  className={`flex-1 items-center justify-center p-3 rounded-lg border ${getEstadoColor(
                    item.estado
                  )}`}
                  style={{ marginHorizontal: 5 }}
                >
                  <Text className="font-bold text-[#222]">{item.nroPlaza}</Text>
                  <Text className="text-sm text-[#444]">
                    {item.estado ? item.estado.toLowerCase() : "libre"}
                  </Text>
                </View>
              )}
            />
          )}
        </>
      )}

      <TouchableOpacity
        onPress={() => setVehiculosOpen(!vehiculosOpen)}
        className="mb-3 w-full px-4 py-2 bg-[#7bb3cd] rounded-xl self-start"
      >
        <Text className="font-semibold text-white">
          {vehiculosOpen ? "∆ Mostrar vehiculos en el parqueo" : "∇ Mostrar vehiculos en el parqueo"}
        </Text>
      </TouchableOpacity>

      {vehiculosOpen && (
        <View className="bg-[#e4ecf6] border-[#087E88] p-3 rounded-xl border mb-5">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 800 }}>
              {/* Encabezado */}
              <View className="flex-row border-[#087E88] border-b pb-2 mb-2">
                <Text className="flex-1 font-bold text-[#055158]">Placa</Text>
                <Text className="flex-1 font-bold text-[#055158]">Tipo</Text>
                <Text className="flex-1 font-bold text-[#055158]">Espacio</Text>
                <Text className="flex-1 font-bold text-[#055158]">Fecha Inicio</Text>
                <Text className="flex-1 font-bold text-[#055158]">Hora Inicio</Text>
                <Text className="flex-1 font-bold text-[#055158]">Fecha Fin</Text>
                <Text className="flex-1 font-bold text-[#055158]">Hora Fin</Text>
              </View>

              {reservas.length === 0 ? (
                <Text className="text-gray-500 text-center">No hay vehículos registrados</Text>
              ) : (
                reservas.slice(0, 5).map((r) => (
                  <View key={r.id} className="flex-row border-[#087E88] py-1 border-b">
                    <Text className="flex-1">{r.matriculaVehiculo}</Text>
                    <Text className="flex-1">{r.plaza.tipoVehiculo?.nombre}</Text>
                    <Text className="flex-1">{r.plaza?.nroPlaza}</Text>
                    <Text className="flex-1">{formatearFecha(r.fechaHoraIni)}</Text>
                    <Text className="flex-1">{formatearHora(r.fechaHoraIni)}</Text>
                    <Text className="flex-1">
                      {r.fechaHoraFin ? formatearFecha(r.fechaHoraFin) : "--"}
                    </Text>
                    <Text className="flex-1">
                      {r.fechaHoraFin ? formatearHora(r.fechaHoraFin) : "--"}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      )}

      <View className="flex-row gap-[9px] mb-[86px]"> 
        <TouchableOpacity className="bg-[#2980b9] py-[13px] rounded-xl items-center flex-1 mr-[9px]"> 
            <Text className="text-center text-white font-bold text-[17px]">Ingresar Vehículo</Text> 
        </TouchableOpacity>
      </View>
    </View>
  );
}