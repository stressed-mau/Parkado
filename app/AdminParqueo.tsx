import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import ResumenCard from "./components/admin/ResumenCard";
import { getTarifasYPlazas, getPlazas } from "../api/parqueoApi";



export default function ParqueoDetalle() {
  const [tarifas, setTarifas] = useState<any[]>([]);
  const [plazas, setPlazas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"Todos" | "Auto" | "Moto">("Todos");
  const [plazasOpen, setPlazasOpen] = useState(false); // Nuevo estado para colapsable
  const [vehiculosOpen, setVehiculosOpen] = useState(false);

  const idParqueo = 3; // puedes cambiarlo o pasarlo por props

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const tarifasData = await getTarifasYPlazas();
        setTarifas(tarifasData);

        const plazasData = await getPlazas(idParqueo);
        setPlazas(plazasData);
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

  // Asigna color de fondo según el estado
  const getEstadoColor = (estado: string | null) => {
    switch (estado) {
      case "OCUPADO":
        return "bg-red-300 border-red-600";
      case "RESERVA":
        return "bg-yellow-300 border-yellow-600";
      case "DISPONIBLE":
      default:
        return "bg-green-300 border-green-600";
    }
  };

  return (
    <View className="flex-1 p-6 bg-[#F6EEE4]">
      <Text className="text-2xl font-bold my-7 text-red-600 self-center">
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
            icon={item.tipoVehiculo === "Auto" ? "🚗" : "🛵"}
          />
        ))}
      </View>

      {/* --- Filtros (Autos / Motos / Todos) --- */}
      <View className="flex-row justify-center mb-4">
        {["Auto", "Moto", "Todos"].map((tipo) => (
          <TouchableOpacity
            key={tipo}
            onPress={() => setFilter(tipo as any)}
            className={`px-4 py-2 mx-1 rounded-xl border ${
              filter === tipo
                ? tipo === "Auto"
                  ? "bg-blue-400 border-blue-500"
                  : tipo === "Moto"
                  ? "bg-orange-400 border-orange-500"
                  : "bg-gray-400 border-gray-500"
                : "bg-white border-gray-300"
            }`}
          >
            <Text
              className={`font-semibold ${
                filter === tipo ? "text-white" : "text-gray-600"
              }`}
            >
              {tipo === "Auto" ? "🚗 Autos" : tipo === "Moto" ? "🛵 Motos" : "Todos"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => setPlazasOpen(!plazasOpen)}
        className="mb-3 w-full px-4 py-2 bg-gray-300 rounded-xl self-start"
      >
        <Text className="font-semibold">
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
              numColumns={3}
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
        className="mb-3 w-full px-4 py-2 bg-gray-300 rounded-xl self-start"
      >
        <Text className="font-semibold">
          {vehiculosOpen ? "∆ Mostrar vehiculos en el parqueo" : "∇ Mostrar vehiculos en el parqueo"}
        </Text>
      </TouchableOpacity>

            {vehiculosOpen && (
        <View className="bg-white p-3 rounded-xl border mb-5">

          {/* Encabezado */}
          <View className="flex-row border-b pb-2 mb-2">
            <Text className="flex-1 font-bold">Placa</Text>
            <Text className="flex-1 font-bold">Tipo</Text>
            <Text className="flex-1 font-bold">Espacio</Text>
            <Text className="flex-1 font-bold">Fecha</Text>
            <Text className="flex-1 font-bold">Inicio</Text>
            <Text className="flex-1 font-bold">Fin</Text>
          </View>

          {/* Lista */}
          
            <View className="flex-row py-1 border-b">
              <Text className="flex-1">AUTO-123</Text>
              <Text className="flex-1">Auto</Text>
              <Text className="flex-1"> A-03 </Text>
              <Text className="flex-1">08/11/2025</Text>
              <Text className="flex-1">5:12:03 p.m.</Text>
              <Text className="flex-1">--</Text>
            </View>
         
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