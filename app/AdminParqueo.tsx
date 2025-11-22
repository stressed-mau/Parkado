import React, { useEffect, useState, useCallback } from "react";
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
import { FontAwesome5 } from '@expo/vector-icons';

// Ruta local al PDF que subiste (opcional)
const PLAZA_DOC_PATH = '/mnt/data/patch plaza api.pdf';

export default function ParqueoDetalle() {
  const [tarifas, setTarifas] = useState<any[]>([]);
  const [plazas, setPlazas] = useState<any[]>([]);
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"Todos" | "Auto" | "Moto">("Todos");
  const [plazasOpen, setPlazasOpen] = useState(false);
  const [vehiculosOpen, setVehiculosOpen] = useState(false);
  const [inconsistencias, setInconsistencias] = useState<any[]>([]);
  const [isReloadingReservas, setIsReloadingReservas] = useState(false);

  const idParqueo = 1; // probando con parqueo 1

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);

      // Pasar idParqueo para obtener las tarifas correctas
      const [tarifasData, plazasData, reservasData] = await Promise.all([
        getTarifasYPlazas(idParqueo),
        getPlazas(idParqueo),
        getReservasPorParqueo(idParqueo),
      ]);

      setTarifas(Array.isArray(tarifasData) ? tarifasData : []);
      setPlazas(Array.isArray(plazasData) ? plazasData : []);
      setReservas(Array.isArray(reservasData) ? reservasData : []);
    } catch (error) {
      console.error("Error cargarDatos ParqueoDetalle:", error);
      Alert.alert("Error", "No se pudieron cargar los datos del parqueo");
    } finally {
      setLoading(false);
    }
  }, [idParqueo]);

  // Carga inicial
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Helpers para formateo
  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "--";
    const d = new Date(fecha);
    return d.toLocaleDateString();
  };

  const formatearHora = (fecha?: string) => {
    if (!fecha) return "--";
    const d = new Date(fecha);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Normalización: obtener tipoNombre desde distintos formatos posibles
  const tipoNombreFrom = (p: any) => {
    if (!p) return undefined;
    if (typeof p === "string") return p;
    if (typeof p === "number") return p === 1 ? "Auto" : p === 2 ? "Moto" : undefined;
    if (p?.nombre) return p.nombre;
    if (p?.tipoVehiculo?.nombre) return p.tipoVehiculo.nombre;
    return undefined;
  };

  // Filtrado de plazas según filtro
  const plazasFiltradas = plazas.filter((p) => {
    if (filter === "Todos") return true;
    const tn = tipoNombreFrom(p?.tipoVehiculo) ?? tipoNombreFrom(p);
    return tn === filter;
  });

  // Estado -> color
  const getEstadoColor = (estado: string | null | undefined) => {
    switch ((estado || "DISPONIBLE").toString().toUpperCase()) {
      case "OCUPADO":
        return "bg-[#FD721D] border-[#FD721D]";
      case "RESERVA":
        return "bg-[#F2BD2B] border-[#F2BD2B]";
      case "DISPONIBLE":
      default:
        return "bg-[#8bb23f] border-[#8bb23f]";
    }
  };

  // --- Cálculo de capacidad y ocupados basado únicamente en plazas (fuente de verdad) ---
  const capacidadPorTipo = (tipo: "Auto" | "Moto") => {
    const total = plazas.reduce((acc, p) => {
      const tn = tipoNombreFrom(p?.tipoVehiculo) ?? tipoNombreFrom(p);
      if (tn === tipo) return acc + 1;
      return acc;
    }, 0);

    const ocupados = plazas.reduce((acc, p) => {
      const tn = tipoNombreFrom(p?.tipoVehiculo) ?? tipoNombreFrom(p);
      const estado = (p?.estado ?? "").toString().toUpperCase();
      if (tn === tipo && estado && estado !== "DISPONIBLE") return acc + 1;
      return acc;
    }, 0);

    return { total, ocupados };
  };

  // Obtener tarifa por tipo de forma defensiva (buscamos en distintas formas)
  const tarifaPorTipo = (tipo: "Auto" | "Moto") => {
    if (!tarifas || tarifas.length === 0) return 0;
    const found = tarifas.find((t: any) => {
      const tn =
        t?.tipoVehiculo?.nombre ??
        (typeof t?.tipoVehiculo === "string" ? t.tipoVehiculo :
          (t?.tipoVehiculoId === 1 ? "Auto" : t?.tipoVehiculoId === 2 ? "Moto" : undefined));
      return tn === tipo;
    });
    const price = found ? Number(found.precioHora ?? found.tarifaHora ?? found.tarifa ?? 0) : 0;
    return isNaN(price) ? 0 : price;
  };

  // Construir tarjetas (auto + moto) usando plazas como fuente de verdad para capacidad/ocupados
  const autoCalc = capacidadPorTipo("Auto");
  const motoCalc = capacidadPorTipo("Moto");
  const tarjetaAuto = {
    tipoNombre: "Auto",
    plazasTotales: autoCalc.total,
    plazasOcupadas: autoCalc.ocupados,
    tarifaHora: tarifaPorTipo("Auto"),
  };
  const tarjetaMoto = {
    tipoNombre: "Moto",
    plazasTotales: motoCalc.total,
    plazasOcupadas: motoCalc.ocupados,
    tarifaHora: tarifaPorTipo("Moto"),
  };

  // --- Detección de inconsistencias entre reservas y plazas ---
  useEffect(() => {
    // construimos set de ids de plazas válidas
    const plazaIds = new Set(plazas.map((p: any) => {
      // varios formatos posibles:
      if (p?.id !== undefined) return String(p.id);
      if (p?.plazaId !== undefined) return String(p.plazaId);
      if (p?.nroPlaza !== undefined) return String(p.nroPlaza); // menos probable
      return undefined;
    }).filter(Boolean));

    const invalid = (reservas || []).filter((r: any) => {
      // intentamos obtener el id de la plaza referida por la reserva en varios formatos
      const rPlazaId = r?.plazaId ?? r?.plaza?.id ?? r?.plaza?.plazaId ?? r?.plaza?.nroPlaza;
      // si no encontramos referencia, marcamos como inconsistente
      if (rPlazaId === undefined || rPlazaId === null) return true;
      return !plazaIds.has(String(rPlazaId));
    });

    setInconsistencias(invalid);
    if (invalid.length > 0) {
      console.warn('Reservas inconsistentes detectadas:', invalid);
    }
  }, [plazas, reservas]);

  const recargarReservas = async () => {
    try {
      setIsReloadingReservas(true);
      const nuevas = await getReservasPorParqueo(idParqueo);
      setReservas(Array.isArray(nuevas) ? nuevas : []);
      // el useEffect anterior recalculará inconsistencias
    } catch (e) {
      console.error('Error recargando reservas:', e);
      Alert.alert('Error', 'No se pudieron recargar las reservas');
    } finally {
      setIsReloadingReservas(false);
    }
  };

  return (
    <View className="flex-1 p-6 bg-[#F6EEE4]">
      <Text className="text-2xl font-bold my-7 text-[#22485A] self-center">
        PARQUEO N° {idParqueo}
      </Text>
{/* --- Texto solicitado: Vehículos en parqueo --- */}
      <Text className="text-lg font-semibold text-[#22485A] mb-3">
        Vehículos en parqueo
      </Text>`
      `
      {/* --- Tarjetas resumen basadas en plazas (fuente de verdad) --- */}
      <View className="flex-row justify-between mb-4 gap-2.5">
        <ResumenCard
          key={"auto"}
          label={tarjetaAuto.tipoNombre}
          ocupados={tarjetaAuto.plazasOcupadas}
          capacidad={tarjetaAuto.plazasTotales}
          tarifa={`${tarjetaAuto.tarifaHora} Bs/h`}
          color={"#2980b9"}
          icon={<FontAwesome5 name="car-side" size={24} color="#2980b9" />}
        />
        <ResumenCard
          key={"moto"}
          label={tarjetaMoto.tipoNombre}
          ocupados={tarjetaMoto.plazasOcupadas}
          capacidad={tarjetaMoto.plazasTotales}
          tarifa={`${tarjetaMoto.tarifaHora} Bs/h`}
          color={"#8e44ad"}
          icon={<FontAwesome5 name="motorcycle" size={24} color="#8e44ad" />}
        />
      </View>

      

      {/* --- Si hay inconsistencias, mostramos aviso y botón para recargar reservas --- */}
      {inconsistencias.length > 0 && (
        <View className="mb-3 p-3 bg-[#FFF4E5] border border-yellow-400 rounded-lg">
          <Text className="font-semibold text-yellow-800 mb-1">
            ⚠️ Se detectaron {inconsistencias.length} reserva(s) que no se corresponden con las plazas actuales.
          </Text>
          <Text className="text-sm text-yellow-800 mb-2">
            Esto puede deberse a reservas creadas antes de eliminar plazas, borrados en back, o datos des-sincronizados.
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              onPress={recargarReservas}
              className="px-3 py-2 bg-[#7BB5CB] rounded-md mr-2"
              disabled={isReloadingReservas}
            >
              <Text className="text-white">{isReloadingReservas ? 'Recargando...' : 'Recargar reservas'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                // mostrar detalles en consola. En producción podrías abrir un modal con la lista.
                console.warn('Reservas inconsistentes detalladas:', inconsistencias);
                Alert.alert('Detalles', `Hay ${inconsistencias.length} reserva(s) inconsistentes. Revisa logs.`);
              }}
              className="px-3 py-2 bg-[#FD721D] rounded-md"
            >
              <Text className="text-white">Ver detalles</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
              keyExtractor={(item) => (item?.id ? item.id.toString() : Math.random().toString())}
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
                  <Text className="font-bold text-[#222]">{item.nroPlaza ?? "-"}</Text>
                  <Text className="text-sm text-[#444]">
                    {(item.estado ?? "DISPONIBLE").toString().toLowerCase()}
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
                    <Text className="flex-1">{r.matriculaVehiculo ?? "-"}</Text>
                    <Text className="flex-1">{r.plaza?.tipoVehiculo?.nombre ?? r.plaza?.tipoVehiculo ?? "-"}</Text>
                    <Text className="flex-1">{r.plaza?.nroPlaza ?? r.plazaId ?? "-"}</Text>
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
