// app/IngresarVehiculo.tsx  (versión actualizada)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';

import { getPlazasDisponibles, crearReserva } from "../api/parqueoApi";

type Props = {
  parqueoId?: number;
  usuarioId?: number;
  onClose?: () => void;
};

export default function IngresarVehiculo({ parqueoId = 3, usuarioId = 3, onClose }: Props) {
  const [matricula, setMatricula] = useState('');
  const [plazasDisponibles, setPlazasDisponibles] = useState<any[]>([]);
  const [tipoVehiculo, setTipoVehiculo] = useState('');
  const [espacioSeleccionado, setEspacioSeleccionado] = useState('');
  const [fechaInicio, setFechaInicio] = useState<Date>(new Date());
  const [fechaFin, setFechaFin] = useState<Date>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return d;
  });
  const [montoTotal, setMontoTotal] = useState('S/.0.00');
  const [showInicioPicker, setShowInicioPicker] = useState(false);
  const [modeInicioPicker, setModeInicioPicker] = useState<'date' | 'time'>('date');
  const [showFinPicker, setShowFinPicker] = useState(false);
  const [modeFinPicker, setModeFinPicker] = useState<'date' | 'time'>('date');

  // Cargar plazas desde API
  const cargarPlazas = async (tipo: string) => {
    try {
      const tipoVehiculoId = tipo === "Auto" ? 1 : tipo === "Moto" ? 2 : 0;

      if (!tipoVehiculoId) {
        setPlazasDisponibles([]);
        return;
      }

      const data = await getPlazasDisponibles(parqueoId, tipoVehiculoId);
      setPlazasDisponibles(Array.isArray(data) ? data : []);
      // si la plaza seleccionada ya no existe, la limpiamos
      if (espacioSeleccionado) {
        const exists = Array.isArray(data) && data.some((p: any) => String(p.id) === String(espacioSeleccionado));
        if (!exists) setEspacioSeleccionado('');
      }
    } catch (error) {
      console.error("Error cargando plazas:", error);
    }
  };

  // recalc monto (placeholder)
  const calcularMonto = () => {
    if (fechaInicio && fechaFin) {
      setMontoTotal('S/.15.00'); // tu lógica real aquí
    }
  };

  // si cambia tipoVehiculo o parqueoId, recargamos plazas
  useEffect(() => {
    if (tipoVehiculo) {
      // limpiar selección anterior y pedir plazas nuevas
      setEspacioSeleccionado('');
      cargarPlazas(tipoVehiculo);
    } else {
      setPlazasDisponibles([]);
      setEspacioSeleccionado('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoVehiculo, parqueoId]);

  // recalcular monto cuando cambian fechas
  useEffect(() => {
    calcularMonto();
  }, [fechaInicio, fechaFin]);

  const onChangeInicio = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || fechaInicio;
    setShowInicioPicker(Platform.OS === 'ios');
    if (currentDate >= fechaFin) {
      const nueva = new Date(currentDate);
      nueva.setHours(nueva.getHours() + 1);
      setFechaFin(nueva);
    }
    setFechaInicio(currentDate);
  };

  const showInicioMode = (currentMode: 'date' | 'time') => {
    setShowInicioPicker(true);
    setModeInicioPicker(currentMode);
  };

  const onChangeFin = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || fechaFin;
    setShowFinPicker(Platform.OS === 'ios');
    if (currentDate > fechaInicio) {
      setFechaFin(currentDate);
    } else if (selectedDate) {
      Alert.alert("Inválido", "Fin debe ser posterior a inicio.");
      const nueva = new Date(fechaInicio);
      nueva.setHours(nueva.getHours() + 1);
      setFechaFin(nueva);
    }
  };

  const showFinMode = (currentMode: 'date' | 'time') => {
    setShowFinPicker(true);
    setModeFinPicker(currentMode);
  };

  const handleIngresar = async () => {
    try {
      if (!fechaInicio || !fechaFin || !espacioSeleccionado || !matricula) {
        Alert.alert("Error", "Por favor complete todos los campos requeridos");
        return;
      }

      // Validar formato de matrícula
      const regexMatricula = /^[A-Z0-9-]+$/i;
      if (!regexMatricula.test(matricula)) {
        Alert.alert("Error", "Formato de matrícula inválido. Ejemplo: 4567-ABC");
        return;
      }

      const reservaData = {
        fechaHoraIni: fechaInicio.toISOString().slice(0, 19),
        fechaHoraFin: fechaFin.toISOString().slice(0, 19),
        plazaId: Number(espacioSeleccionado),
        usuarioId: usuarioId,
        matriculaVehiculo: matricula,
      };

      console.log("📦 Enviando reserva:", reservaData);

      const response = await crearReserva(reservaData);
      console.log("✅ Reserva creada:", response);

      Alert.alert("Éxito", "Reserva creada correctamente");

      // actualizar plazas disponibles: recargar desde API (fuente de verdad)
      if (tipoVehiculo) {
        await cargarPlazas(tipoVehiculo);
      }

      // optimista: quitar la plaza que acabo de usar de la lista
      setPlazasDisponibles(prev => prev.filter(p => String(p.id) !== String(reservaData.plazaId)));
      setEspacioSeleccionado('');

      // opcional: cerrar el formulario inline
      onClose?.();
    } catch (error: any) {
      console.error("❌ Error al registrar reserva:", error);
      Alert.alert("Error", error?.message || "No se pudo crear la reserva");
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 24, backgroundColor: "#F6EEE4" }}>
      <Text style={{ fontSize: 24, fontWeight: "700", textAlign: "center", color: "#22485A", marginBottom: 18 }}>
        Ingresar Vehículo
      </Text>

      {/* Matrícula */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#22485A" }}>Matrícula</Text>
        <TextInput
          style={{ borderWidth: 2, borderColor: "#7BB5CB", borderRadius: 12, padding: 12, backgroundColor: "white" }}
          placeholder="Ej: ABC-1234"
          value={matricula}
          onChangeText={setMatricula}
          autoCapitalize="characters"
        />
      </View>

      {/* Tipo de Vehículo */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#22485A" }}>Tipo de Vehículo</Text>
        <View style={{ borderWidth: 2, borderColor: "#7BB5CB", borderRadius: 12, backgroundColor: "white" }}>
          <Picker
            selectedValue={tipoVehiculo}
            onValueChange={(itemValue) => {
              setTipoVehiculo(itemValue);
            }}
          >
            <Picker.Item label="Seleccionar tipo" value="" />
            <Picker.Item label="Auto" value="Auto" />
            <Picker.Item label="Moto" value="Moto" />
          </Picker>
        </View>
      </View>

      {/* Espacio */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#22485A" }}>Espacio</Text>
        <View style={{ borderWidth: 2, borderColor: "#7BB5CB", borderRadius: 12, backgroundColor: "white" }}>
          <Picker
            selectedValue={espacioSeleccionado}
            onValueChange={(itemValue) => setEspacioSeleccionado(String(itemValue))}
          >
            <Picker.Item label="Seleccionar espacio" value="" />
            {plazasDisponibles.map((plaza) => (
              <Picker.Item
                key={String(plaza.id)}
                label={String(plaza.nroPlaza)}
                value={String(plaza.id)}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Fechas y Horas Inicio */}
      <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>Fecha y Hora de Inicio</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => showInicioMode('date')}
          style={{ flexDirection: "row", alignItems: "center", backgroundColor: "white", borderWidth: 2, borderColor: "#7BB5CB", padding: 12, borderRadius: 10 }}
        >
          <Feather name="calendar" size={18} color="#7BB5CB" />
          <Text style={{ marginLeft: 8 }}>{fechaInicio.toLocaleDateString('es-BO')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => showInicioMode('time')}
          style={{ flexDirection: "row", alignItems: "center", backgroundColor: "white", borderWidth: 2, borderColor: "#7BB5CB", padding: 12, borderRadius: 10 }}
        >
          <Feather name="clock" size={18} color="#7BB5CB" />
          <Text style={{ marginLeft: 8 }}>{fechaInicio.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</Text>
        </TouchableOpacity>
      </View>
      {showInicioPicker && (
        <DateTimePicker
          testID="inicioDateTimePicker"
          value={fechaInicio}
          mode={modeInicioPicker}
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeInicio}
          minimumDate={new Date()}
        />
      )}

      {/* Fecha y Hora Fin */}
      <Text style={{ fontSize: 16, fontWeight: "700", marginTop: 12, marginBottom: 8 }}>Fecha y Hora de Fin</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => showFinMode('date')}
          style={{ flexDirection: "row", alignItems: "center", backgroundColor: "white", borderWidth: 2, borderColor: "#7BB5CB", padding: 12, borderRadius: 10 }}
        >
          <Feather name="calendar" size={18} color="#7BB5CB" />
          <Text style={{ marginLeft: 8 }}>{fechaFin.toLocaleDateString('es-BO')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => showFinMode('time')}
          style={{ flexDirection: "row", alignItems: "center", backgroundColor: "white", borderWidth: 2, borderColor: "#7BB5CB", padding: 12, borderRadius: 10 }}
        >
          <Feather name="clock" size={18} color="#7BB5CB" />
          <Text style={{ marginLeft: 8 }}>{fechaFin.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</Text>
        </TouchableOpacity>
      </View>
      {showFinPicker && (
        <DateTimePicker
          testID="finDateTimePicker"
          value={fechaFin}
          mode={modeFinPicker}
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeFin}
          minimumDate={fechaInicio}
        />
      )}

      {/* Monto Total */}
      <View style={{ backgroundColor: "#CCCCCC", borderRadius: 10, padding: 12, marginVertical: 18 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#22485A" }}>Monto Total:</Text>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#7BB3CD" }}>{montoTotal}</Text>
        </View>
      </View>

      {/* Botones */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 40 }}>
        <TouchableOpacity
          onPress={() => onClose?.()}
          style={{ backgroundColor: "#9CA3AF", padding: 14, borderRadius: 12, flex: 1, marginRight: 8, alignItems: "center" }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleIngresar}
          style={{ backgroundColor: "#2980b9", padding: 14, borderRadius: 12, flex: 1, marginLeft: 8, alignItems: "center" }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>Ingresar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
