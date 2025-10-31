import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    LayoutAnimation,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
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
    TARIFA_AUTOS_NUM,
    TARIFA_MOTOS_NUM,
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
        <View style={styles.container}>
            <Text style={styles.titulo}>Parqueo N° 1</Text>
            <View style={styles.resumenRow}>
                <ResumenCard
                    label="Autos"
                    ocupados={autosOcupados}
                    capacidad={CAPACIDAD_AUTOS}
                    tarifa={TARIFA_AUTOS}
                    color="#2980b9"
                    icon="🚗"
                />
                <ResumenCard
                    label="Motos"
                    ocupados={motosOcupados}
                    capacidad={CAPACIDAD_MOTOS}
                    tarifa={TARIFA_MOTOS}
                    color="#8e44ad"
                    icon="🛵"
                />
            </View>

            <View style={styles.controls}>
                <TextInput
                    placeholder="Buscar placa"
                    value={buscar}
                    onChangeText={t => setBuscar(t.toUpperCase())}
                    style={styles.input}
                    autoCapitalize="characters"
                />
                <View style={styles.filtersRow}>
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
                            <View style={styles.gridGroup}>
                                <Text style={styles.gridTitulo}>Autos</Text>
                                <View style={styles.gridResponsive}>
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
                            <View style={styles.gridGroup}>
                                <Text style={styles.gridTitulo}>Motos</Text>
                                <View style={styles.gridResponsive}>
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
                        <View style={styles.tablaHeader}>
                            <Text style={styles.tablaHeaderText}>Placa</Text>
                            <Text style={styles.tablaHeaderText}>Tipo</Text>
                            <Text style={styles.tablaHeaderText}>Espacio</Text>
                            <Text style={styles.tablaHeaderText}>Inicio</Text>
                            <Text style={styles.tablaHeaderText}>Fin</Text>
                            <Text style={styles.tablaHeaderText}>Monto</Text>
                            <Text style={styles.tablaHeaderText}></Text>
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

            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.ingresoBtn} onPress={() => setModalVisible(true)}>
                    <Text style={styles.botonTexto}>Ingresar Vehículo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reservaBtn} onPress={() => setModalReservaVisible(true)}>
                    <Text style={styles.botonTexto}>Reservar Espacio</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.botonEdit}>
                <Text style={styles.botonTexto}>Editar Información</Text>
            </TouchableOpacity>

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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 18,
        backgroundColor: '#f8f9fa',
    },
    titulo: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#222',
        alignSelf: 'center',
    },
    resumenRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 10,
    },
    controls: {
        marginBottom: 14,
        gap: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    filtersRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: 6,
    },
    seccionLabel: {
        fontSize: 19,
        fontWeight: 'bold',
        marginVertical: 10,
        color: '#222',
    },
    gridGroup: {
        marginRight: 26,
    },
    gridTitulo: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 6,
        color: '#444',
        alignSelf: 'center',
    },
    gridResponsive: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        minWidth: 200,
        maxWidth: 320,
        justifyContent: 'flex-start',
    },
    tablaHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 4,
        alignItems: 'center',
        minWidth: 570,
    },
    tablaHeaderText: {
        fontSize: 16,
        fontWeight: 'bold',
        width: 80,
        textAlign: 'left',
        color: '#444',
        minWidth: 70,
        maxWidth: 120,
    },
    tablaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
        paddingVertical: 6,
        backgroundColor: '#fff',
        borderRadius: 6,
        marginBottom: 2,
        minWidth: 570,
    },
    tablaCell: {
        fontSize: 15,
        color: '#222',
        width: 80,
        minWidth: 70,
        maxWidth: 120,
    },
    salidaBtn: {
        backgroundColor: '#e74c3c',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    salidaBtnTxt: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    ingresoBtn: {
        backgroundColor: '#2980b9',
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: 'center',
        flex: 1,
        marginRight: 9,
    },
    reservaBtn: {
        backgroundColor: '#8e44ad',
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: 'center',
        flex: 1,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 9,
        marginBottom: 86,
    },
    botonEdit: {
        backgroundColor: '#222',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        position: 'absolute',
        bottom: 24,
        left: 18,
        right: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 4,
    },
    botonTexto: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 17,
    },
    chip: {
        borderWidth: 1,
        borderColor: '#bbb',
        borderRadius: 18,
        paddingHorizontal: 13,
        paddingVertical: 7,
        backgroundColor: '#fafafa',
    },
    chipActive: {
        backgroundColor: '#2c3e50',
        borderColor: '#2c3e50',
    },
    chipTxt: { color: '#333' },
    chipTxtActive: { color: '#fff', fontWeight: '600' },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.28)',
        justifyContent: 'center',
        padding: 16,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
    },
    modalTitulo: { fontSize: 19, fontWeight: 'bold', marginBottom: 8, color: '#2980b9' },
    seleccionTitulo: { fontSize: 14, color: '#444', marginTop: 6 },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 14,
        marginTop: 16,
    },
    cancelBtn: { paddingHorizontal: 14, paddingVertical: 9 },
    okBtn: {
        backgroundColor: '#27ae60',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 10,
    },
    // Collapsible
    collapseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 4,
    },
    collapseTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#222',
    },
    collapseArrow: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#888',
        marginLeft: 6,
    },
    collapseContent: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 8,
        paddingTop: 4,
    },
});
