import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

import { getPlazasDisponibles, crearReserva } from "../api/parqueoApi";

export default function IngresarVehiculo() {
  const navigation = useNavigation();
  
  const [matricula, setMatricula] = useState('');
  const [plazasDisponibles, setPlazasDisponibles] = useState<any[]>([]);
  const [tipoVehiculo, setTipoVehiculo] = useState('');
  const [espacioSeleccionado, setEspacioSeleccionado] = useState('');
    const [fechaInicio, setFechaInicio] = useState<Date>(new Date());  const [horaInicio, setHoraInicio] = useState('');
    const [fechaFin, setFechaFin] = useState<Date>(() => { 
        const d = new Date(); 
        d.setHours(d.getHours() + 1); 
        return d; 
    });

  const [horaFin, setHoraFin] = useState('');
  const [montoTotal, setMontoTotal] = useState('S/.0.00');
    const [showInicioPicker, setShowInicioPicker] = useState(false);
    const [modeInicioPicker, setModeInicioPicker] = useState<'date' | 'time'>('date');
    const [showFinPicker, setShowFinPicker] = useState(false);
    const [modeFinPicker, setModeFinPicker] = useState<'date' | 'time'>('date');
    const [usuarioId] = useState(3);
  // Datos para los dropdowns
  const cargarPlazas = async (tipo: string) => {
  try {
    // Convierte el tipo de vehículo a su ID (ajusta si tus IDs cambian)
    const tipoVehiculoId = tipo === "Auto" ? 1 : tipo === "Moto" ? 2 : 0;

    if (!tipoVehiculoId) {
      setPlazasDisponibles([]);
      return;
    }

    const parqueoId = 3; // <-- puedes obtenerlo dinámicamente si lo tienes en tu pantalla
    const data = await getPlazasDisponibles(parqueoId, tipoVehiculoId);
    setPlazasDisponibles(data);
  } catch (error) {
    console.error("Error cargando plazas:", error);
  }
};



  const calcularMonto = () => {
    // Aquí iría la lógica para calcular el monto total
    // basado en las fechas y horas seleccionadas
    if (fechaInicio && horaInicio && fechaFin && horaFin) {
      // Ejemplo de cálculo - implementa tu lógica real aquí
      setMontoTotal('S/.15.00');
    }
  };

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

    // Crear objeto a enviar
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
  } catch (error: any) {
    console.error("❌ Error al registrar reserva:", error);
    Alert.alert("Error", error?.message || "No se pudo crear la reserva");
  }
};


  return (
    <ScrollView className="flex-1 p-6 bg-[#F6EEE4]">
      <Text className="text-2xl font-bold my-7 text-[#22485A] self-center">
        Ingresar Vehículo
      </Text>

      {/* Matrícula */}
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-2 text-[#22485A]">Matrícula</Text>
        <TextInput
          className="border-2 border-[#7BB5CB] rounded-lg px-4 py-3 text-base bg-white mb-3 shadow-sm"
          placeholder="Ej: ABC-1234"
          value={matricula}
          onChangeText={setMatricula}
          autoCapitalize="characters"
        />
      </View>

      {/* Tipo de Vehículo - Dropdown */}
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-2 text-[#22485A]">Tipo de Vehículo</Text>
        <View className="border-2 border-[#7BB5CB] rounded-lg bg-white overflow-hidden">
<Picker
  selectedValue={tipoVehiculo}
  onValueChange={(itemValue) => {
    setTipoVehiculo(itemValue);
    cargarPlazas(itemValue);
  }}
>
  <Picker.Item label="Seleccionar tipo" value="" />
  <Picker.Item label="Auto" value="Auto" />
  <Picker.Item label="Moto" value="Moto" />
</Picker>
        </View>
      </View>

      {/* Espacio - Dropdown */}
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-2 text-[#22485A]">Espacio</Text>
        <View className="border-2 border-[#7BB5CB] rounded-lg bg-white overflow-hidden">
<Picker
  selectedValue={espacioSeleccionado}
  onValueChange={(itemValue) => setEspacioSeleccionado(itemValue)}
>
  <Picker.Item label="Seleccionar espacio" value="" />
  {plazasDisponibles.map((plaza) => (
    <Picker.Item
      key={plaza.id}
      label={plaza.nroPlaza}
      value={plaza.id} // puedes usar el ID directamente
    />
  ))}
</Picker>
        </View>
      </View>

      {/* Fechas y Horas */}
<Text className="text-base font-semibold text-black mt-5 mb-2">Fecha y Hora de Inicio</Text>
            <View className="flex-row justify-around mb-3">
                <TouchableOpacity 
                    onPress={() => showInicioMode('date')} 
                    className="flex-row items-center bg-white border-2 border-[#7BB5CB] px-4 py-3 rounded-lg gap-2 shadow" 
                    activeOpacity={0.7}
                >
                    <Feather name="calendar" size={18} color="#7BB5CB" />
                    <Text className="text-base text-black">{fechaInicio.toLocaleDateString('es-BO')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => showInicioMode('time')} 
                    className="flex-row items-center bg-white border-2 border-[#7BB5CB] px-4 py-3 rounded-lg gap-2 shadow" 
                    activeOpacity={0.7}
                >
                    <Feather name="clock" size={18} color="#7BB5CB" />
                    <Text className="text-base text-black">
                        {fechaInicio.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit'})}
                    </Text>
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

            {/* === SECCIÓN 5: FECHA Y HORA DE FIN === */}
            <Text className="text-base font-semibold text-black mt-5 mb-2">Fecha y Hora de Fin</Text>
            <View className="flex-row justify-around mb-3">
                <TouchableOpacity 
                    onPress={() => showFinMode('date')} 
                    className="flex-row items-center bg-white border-2 border-[#7BB5CB] px-4 py-3 rounded-lg gap-2 shadow" 
                    activeOpacity={0.7}
                >
                    <Feather name="calendar" size={18} color="#7BB5CB" />
                    <Text className="text-base text-black">{fechaFin.toLocaleDateString('es-BO')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => showFinMode('time')} 
                    className="flex-row items-center bg-white border-2 border-[#7BB5CB] px-4 py-3 rounded-lg gap-2 shadow" 
                    activeOpacity={0.7}
                >
                    <Feather name="clock" size={18} color="#7BB5CB" />
                    <Text className="text-base text-black">
                        {fechaFin.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit'})}
                    </Text>
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
      <View className="bg-[#CCCCCC] rounded-md p-3 my-6">
        <View className="flex-row justify-between items-center">
            <Text className="text-lg font-semibold text-[#22485A] mb-1"> 
                Monto Total: 
            </Text> 
            <Text className="text-2xl font-bold text-[#7BB3CD]"> 
                {montoTotal}
                </Text>
        </View>
      </View>

      {/* Línea divisoria */}
      <View className="border-t border-gray-300 mb-8" />

      {/* Botones */}
      <View className="flex-row justify-between mb-10">
        <TouchableOpacity
          className="bg-gray-500 py-4 rounded-xl flex-1 mr-3"
        >
          <Text className="text-white text-center font-bold text-lg">Cancelar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
        onPress={handleIngresar}
        className="bg-[#2980b9] py-4 rounded-xl flex-1 ml-3"
        >
          <Text className="text-white text-center font-bold text-lg">Ingresar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}