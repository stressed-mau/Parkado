import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getTarifasYPlazas } from '@/api/parqueoApi';

import {
    Alert,
    Dimensions,
    FlatList,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';

import {
    CAPACIDAD_AUTOS,
    CAPACIDAD_MOTOS,
    TARIFA_AUTOS,
    TARIFA_MOTOS,
    generarEspacios,
    calcularCobro,
    Espacio,
    Vehiculo,
} from './constants/parqueo';

import CollapsibleSection from './components/admin/CollapsibleSection';
import ChipEspacio from './components/admin/ChipEspacio';
import FiltroBtn from './components/admin/FiltroBtn';
import ResumenCard from './components/admin/ResumenCard';
import ModalIngreso from './components/admin/ModalIngreso';
import ModalReserva from './components/admin/ModalReserva';
import VehiculoRow from './components/admin/VehiculoRow';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Habilitar animaciones en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ParqueoDetalle() {

      const [tarifas, setTarifas] = useState<
    { tipoVehiculo: string; tarifaHora: string; plazasTotales: number; plazasOcupadas: number }[]
  >([]);

  useEffect(() => {
    const cargarTarifas = async () => {
      try {
        const data = await getTarifasYPlazas();
        setTarifas(data);
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar las tarifas del parqueo');
      }
    };

    cargarTarifas();
  }, []);

    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [espacios, setEspacios] = useState<Espacio[]>([]);

    const autosOcupados = useMemo(
        () => espacios.filter(e => e.tipo === 'auto' && e.estado === 'ocupado').length,
        [espacios]
    );
    const motosOcupados = useMemo(
        () => espacios.filter(e => e.tipo === 'moto' && e.estado === 'ocupado').length,
        [espacios]
    );

    const [buscar, setBuscar] = useState('');
    const [filtroTipo, setFiltroTipo] = useState<'todos' | 'auto' | 'moto'>('todos');
    const [verHistorial, setVerHistorial] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalReservaVisible, setModalReservaVisible] = useState(false);

    const sweepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const [vehRaw, espRaw] = await Promise.all([
                    AsyncStorage.getItem('vehiculos'),
                    AsyncStorage.getItem('espacios'),
                ]);
                if (espRaw) {
                    const parsed: Espacio[] = JSON.parse(espRaw);
                    setEspacios(parsed);
                } else {
                    const gen = generarEspacios(CAPACIDAD_AUTOS, CAPACIDAD_MOTOS);
                    setEspacios(gen);
                }
                if (vehRaw) {
                    setVehiculos(JSON.parse(vehRaw));
                } else {
                    setVehiculos([]);
                }
            } catch (e) {
                console.warn('Error cargando estado', e);
            }
        };
        init();
    }, []);

    useEffect(() => {
        AsyncStorage.setItem('vehiculos', JSON.stringify(vehiculos)).catch(() => { });
    }, [vehiculos]);
    useEffect(() => {
        AsyncStorage.setItem('espacios', JSON.stringify(espacios)).catch(() => { });
    }, [espacios]);

    useEffect(() => {
        if (sweepTimerRef.current) clearInterval(sweepTimerRef.current);
        sweepTimerRef.current = setInterval(() => {
            setEspacios(prev =>
                prev.map(e =>
                    e.estado === 'reservado' && e.reservadoHasta && e.reservadoHasta < Date.now()
                        ? { ...e, estado: 'libre', reservadoHasta: undefined }
                        : e
                )
            );
        }, 30000);
        return () => {
            if (sweepTimerRef.current) clearInterval(sweepTimerRef.current);
        };
    }, []);

    const regexPlaca = /^[A-Z0-9-]{5,10}$/;
    const existePlacaActiva = (placa: string) => vehiculos.some(v => v.placa === placa && v.estacionado);

    function obtenerEspacioDisponible(tipo: 'auto' | 'moto', preferido?: string | null): Espacio | undefined {
        const ahora = Date.now();
        if (preferido) {
            const e = espacios.find(x => x.id === preferido && x.tipo === tipo);
            if (!e) return undefined;
            if (e.estado === 'libre') return e;
            if (e.estado === 'reservado' && (e.reservadoHasta ?? 0) >= ahora) return e;
            return undefined;
        }
        const libres = espacios.filter(e => e.tipo === tipo && e.estado === 'libre');
        if (libres.length > 0) return libres[0];
        return undefined;
    }

    function registrarIngreso(placa: string, tipo: 'auto' | 'moto', espacioId?: string | null) {
        placa = placa.trim().toUpperCase();
        if (!regexPlaca.test(placa)) {
            Alert.alert('Placa inválida', 'Usa caracteres A-Z, 0-9 y guiones. Largo 5-10.');
            return;
        }
        if (existePlacaActiva(placa)) {
            Alert.alert('Placa duplicada', 'Este vehículo ya está estacionado.');
            return;
        }
        const capacidad = tipo === 'auto' ? CAPACIDAD_AUTOS : CAPACIDAD_MOTOS;
        const ocupados = tipo === 'auto' ? autosOcupados : motosOcupados;
        if (ocupados >= capacidad) {
            Alert.alert('Capacidad llena', `No hay espacios disponibles para ${tipo === 'auto' ? 'autos' : 'motos'}`);
            return;
        }
        const espacio = obtenerEspacioDisponible(tipo, espacioId ?? undefined);
        if (!espacio) {
            Alert.alert('Sin espacio disponible', 'Selecciona otro tipo o espera a que haya disponibilidad.');
            return;
        }
        const ahora = new Date();
        const ahoraTs = ahora.getTime();
        const horaActual = ahora.toLocaleTimeString();
        setVehiculos(old => [
            ...old,
            {
                placa,
                tipo,
                horaInicio: horaActual,
                horaFin: '',
                estacionado: true,
                inicioTs: ahoraTs,
                espacioId: espacio.id,
            },
        ]);
        setEspacios(prev =>
            prev.map(e =>
                e.id === espacio.id
                    ? { ...e, estado: 'ocupado', reservadoHasta: undefined, placaActual: placa }
                    : e
            )
        );
        setModalVisible(false);
    }

    function registrarSalida(placa: string) {
        const ahora = new Date();
        const horaActual = ahora.toLocaleTimeString();
        const finTs = ahora.getTime();
        let espacioLiberado: string | undefined;
        setVehiculos(old =>
            old.map(v => {
                if (v.placa === placa && v.estacionado) {
                    const monto = calcularCobro(v.tipo, v.inicioTs, finTs);
                    espacioLiberado = v.espacioId;
                    return { ...v, horaFin: horaActual, finTs, estacionado: false, monto };
                }
                return v;
            })
        );
        if (espacioLiberado) {
            setEspacios(prev => prev.map(e => (e.id === espacioLiberado ? { ...e, estado: 'libre', placaActual: undefined } : e)));
        }
    }

    const vehiculosFiltrados = useMemo(() => {
        return vehiculos
            .filter(v => (verHistorial ? !v.estacionado : v.estacionado))
            .filter(v => (filtroTipo === 'todos' ? true : v.tipo === filtroTipo))
            .filter(v => (buscar.trim() ? v.placa.includes(buscar.trim().toUpperCase()) : true))
            .sort((a, b) => (b.inicioTs ?? 0) - (a.inicioTs ?? 0));
    }, [vehiculos, verHistorial, filtroTipo, buscar]);

    const espaciosDisponiblesDelTipo = (tipo: 'auto' | 'moto') =>
        espacios.filter(e => e.tipo === tipo && e.estado === 'libre');

    const espaciosPorTipo = useMemo(() => ({
        autos: espacios.filter(e => e.tipo === 'auto'),
        motos: espacios.filter(e => e.tipo === 'moto'),
    }), [espacios]);

    return (
        <View className="flex-1 p-6 bg-[#f8f9fa]">
            <Text className="text-2xl font-bold my-7 text-[#222] self-center">PARQUEO N° 1</Text>
            <View className="flex-row justify-between mb-4 gap-2.5">
                  {tarifas.map((item) => (
                    <ResumenCard
                        key={item.tipoVehiculo}
                        label={item.tipoVehiculo}
                        ocupados={item.plazasOcupadas}
                        capacidad={item.plazasTotales}
                        tarifa={`${item.tarifaHora} Bs/h`}
                        color={item.tipoVehiculo === 'Auto' ? '#2980b9' : '#8e44ad'}
                        icon={item.tipoVehiculo === 'Auto' ? '🚗' : '🛵'}
                    />
                ))}
            </View>

            <View className="mb-4 gap-2">
                <TextInput
                    placeholder="Buscar placa"
                    value={buscar}
                    onChangeText={t => setBuscar(t.toUpperCase())}
                    className="border border-[#ddd] rounded-[10px] px-3.5 py-[11px] text-base bg-white"
                    autoCapitalize="characters"
                />
                <View className="flex-row gap-2 items-center flex-wrap mt-1.5">
                    <FiltroBtn label="Todos" active={filtroTipo === 'todos'} onPress={() => setFiltroTipo('todos')} />
                    <FiltroBtn label="Autos" active={filtroTipo === 'auto'} onPress={() => setFiltroTipo('auto')} />
                    <FiltroBtn label="Motos" active={filtroTipo === 'moto'} onPress={() => setFiltroTipo('moto')} />
                    <FiltroBtn label={verHistorial ? 'Ver activos' : 'Ver historial'} active={verHistorial} onPress={() => setVerHistorial(v => !v)} />
                </View>
            </View>

            <CollapsibleSection title="Mapa de espacios" defaultCollapsed={true}>
                <ScrollView style={{ maxHeight: 180 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                        <View style={{ flexDirection: 'row', gap: 22 }}>
                            <View className="mr-7">
                                <Text className="text-[15px] font-semibold mb-1.5 text-[#444] self-center">Autos</Text>
                                <View className="flex-row flex-wrap gap-2 min-w-[200px] max-w-xs justify-start">
                                    {espaciosPorTipo.autos.map(e => (
                                        <ChipEspacio
                                            key={e.id}
                                            espacio={e}
                                            selected={false}
                                            onPress={() => { }}
                                        />
                                    ))}
                                </View>
                            </View>
                            <View className="mr-7">
                                <Text className="text-[15px] font-semibold mb-1.5 text-[#444] self-center">Motos</Text>
                                <View className="flex-row flex-wrap gap-2 min-w-[200px] max-w-xs justify-start">
                                    {espaciosPorTipo.motos.map(e => (
                                        <ChipEspacio
                                            key={e.id}
                                            espacio={e}
                                            selected={false}
                                            onPress={() => { }}
                                        />
                                    ))}
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </ScrollView>
            </CollapsibleSection>

            <CollapsibleSection title={verHistorial ? 'Historial de vehículos' : 'Vehículos en el parqueo'} defaultCollapsed={false}>
                <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ marginBottom: 8 }}>
                    <View style={{ minWidth: SCREEN_WIDTH }}>
                        <View className="flex-row border-b border-[#eee] py-1 items-center min-w-[570px]">
                            <Text className="text-xl font-bold w-20 text-left text-[#444] min-w-[70px] max-w-[120px]">Placa</Text>
                            <Text className="text-xl font-bold w-20 text-left text-[#444] min-w-[70px] max-w-[120px]">Tipo</Text>
                            <Text className="text-xl font-bold w-20 text-left text-[#444] min-w-[70px] max-w-[120px]">Espacio</Text>
                            <Text className="text-xl font-bold w-20 text-left text-[#444] min-w-[70px] max-w-[120px]">Inicio</Text>
                            <Text className="text-xl font-bold w-20 text-left text-[#444] min-w-[70px] max-w-[120px]">Fin</Text>
                            <Text className="text-xl font-bold w-20 text-left text-[#444] min-w-[70px] max-w-[120px]">Monto</Text>
                            <Text className="text-xl font-bold w-20 text-left text-[#444] min-w-[70px] max-w-[120px]"></Text>
                        </View>
                        <FlatList
                            data={vehiculosFiltrados}
                            keyExtractor={item => `${item.placa}-${item.inicioTs}`}
                            renderItem={({ item }) => (
                                <VehiculoRow item={item} onSalida={registrarSalida} />
                            )}
                            style={{ minWidth: SCREEN_WIDTH }}
                        />
                    </View>
                </ScrollView>
            </CollapsibleSection>

            <View className="flex-row gap-[9px] mb-[86px]">
                <TouchableOpacity className="bg-[#2980b9] py-[13px] rounded-xl items-center flex-1 mr-[9px]" onPress={() => setModalVisible(true)}>
                    <Text className="text-center text-white font-bold text-[17px]">Ingresar Vehículo</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-[#8e44ad] py-[13px] rounded-xl items-center flex-1" onPress={() => setModalReservaVisible(true)}>
                    <Text className="text-center text-white font-bold text-[17px]">Reservar Espacio</Text>
                </TouchableOpacity>
            </View>

            <View className="items-center">
                <TouchableOpacity className="py-3 w-full bg-[#222] rounded-xl absolute shadow shadow-black">
                    <Text className="text-center text-white font-bold text-2xl">Editar Información</Text>
                </TouchableOpacity>

            </View>

            <ModalIngreso
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                espacios={espacios}
                onConfirm={registrarIngreso}
            />

            <ModalReserva
                visible={modalReservaVisible}
                onClose={() => setModalReservaVisible(false)}
                espacios={espacios}
                onReservar={(espacioId, minutos) => {
                    // lógica simple delegada aquí (se utiliza la función reservar del componente)
                    const hasta = Date.now() + Math.max(1, minutos) * 60000;
                    if (!espacioId) {
                        Alert.alert('Selecciona un espacio para reservar');
                        return;
                    }
                    setEspacios(prev =>
                        prev.map(e =>
                            e.id === espacioId && e.estado === 'libre'
                                ? { ...e, estado: 'reservado', reservadoHasta: hasta }
                                : e
                        )
                    );
                    setModalReservaVisible(false);
                }}
            />
        </View>
    );
}