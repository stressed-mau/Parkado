import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Datos iniciales (ejemplo)
const CAPACIDAD_AUTOS = 10;
const CAPACIDAD_MOTOS = 5;
const TARIFA_AUTOS = 'S/. 5.00';
const TARIFA_MOTOS = 'S/. 3.00';

type Vehiculo = {
    placa: string;
    tipo: 'auto' | 'moto';
    horaInicio: string;
    horaFin: string;
    estacionado: boolean;
};

export default function ParqueoDetalle() {
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([
        { placa: '0000ABCD', tipo: 'auto', horaInicio: '08:00:00', horaFin: '', estacionado: true },
        { placa: '0001ABCD', tipo: 'moto', horaInicio: '09:15:00', horaFin: '', estacionado: true },
    ]);
    const [autosOcupados, setAutosOcupados] = useState(
        vehiculos.filter(v => v.tipo === 'auto' && v.estacionado).length
    );
    const [motosOcupados, setMotosOcupados] = useState(
        vehiculos.filter(v => v.tipo === 'moto' && v.estacionado).length
    );

    // Criterio 2: Ingresar vehículo
    function registrarIngreso(placa: string, tipo: 'auto' | 'moto') {
        if (tipo === 'auto' && autosOcupados >= CAPACIDAD_AUTOS) {
            Alert.alert('No hay espacios disponibles para autos');
            return;
        }
        if (tipo === 'moto' && motosOcupados >= CAPACIDAD_MOTOS) {
            Alert.alert('No hay espacios disponibles para motos');
            return;
        }
        const horaActual = new Date().toLocaleTimeString();
        setVehiculos(old => [
            ...old,
            { placa, tipo, horaInicio: horaActual, horaFin: '', estacionado: true },
        ]);
        if (tipo === 'auto') setAutosOcupados(autosOcupados + 1);
        if (tipo === 'moto') setMotosOcupados(motosOcupados + 1);
    }

    // Criterio 3: Salida vehículo
    function registrarSalida(placa: string) {
        const horaActual = new Date().toLocaleTimeString();
        setVehiculos(old =>
            old.map(v =>
                v.placa === placa && v.estacionado
                    ? { ...v, horaFin: horaActual, estacionado: false }
                    : v
            )
        );
        const vehiculo = vehiculos.find(v => v.placa === placa);
        if (vehiculo?.tipo === 'auto') setAutosOcupados(autosOcupados - 1);
        if (vehiculo?.tipo === 'moto') setMotosOcupados(motosOcupados - 1);
    }

    // Filtrar sólo los vehículos estacionados o mostrar todos según criterio
    const vehiculosEnParqueo = vehiculos.filter(v => v.estacionado);

    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Parqueo N° 1</Text>

            {/* Capacidad de autos */}
            <View style={styles.section}>
                <Text style={styles.seccionTitulo}>Espacios para autos</Text>
                <Text style={styles.capacidad}>
                    {autosOcupados} / {CAPACIDAD_AUTOS}
                </Text>
            </View>
            {/* Capacidad de motos */}
            <View style={styles.section}>
                <Text style={styles.seccionTitulo}>Espacios para motos</Text>
                <Text style={styles.capacidad}>
                    {motosOcupados} / {CAPACIDAD_MOTOS}
                </Text>
            </View>
            {/* Tarifas */}
            <View style={styles.tarifaRow}>
                <Text style={styles.tarifaLabel}>TARIFA DE AUTOS</Text>
                <Text style={styles.tarifaValue}>{TARIFA_AUTOS}</Text>
            </View>
            <View style={styles.tarifaRow}>
                <Text style={styles.tarifaLabel}>TARIFA DE MOTOS</Text>
                <Text style={styles.tarifaValue}>{TARIFA_MOTOS}</Text>
            </View>

            {/* Tabla vehículos */}
            <Text style={styles.vehiculosTitulo}>Vehículos en el parqueo</Text>
            <View style={styles.tablaHeader}>
                <Text style={styles.tablaHeaderText}>Placa</Text>
                <Text style={styles.tablaHeaderText}>Hora inicio</Text>
                <Text style={styles.tablaHeaderText}>Hora fin</Text>
            </View>
            <FlatList
                data={vehiculos}
                keyExtractor={item => item.placa}
                renderItem={({ item }) => (
                    <View style={styles.tablaRow}>
                        <Text style={styles.tablaCell}>{item.placa}</Text>
                        <Text style={styles.tablaCell}>{item.horaInicio}</Text>
                        <Text style={styles.tablaCell}>{item.horaFin || '--'}</Text>
                        {item.estacionado && (
                            <TouchableOpacity
                                style={styles.salidaBtn}
                                onPress={() => registrarSalida(item.placa)}>
                                <Text style={styles.salidaBtnTxt}>Registrar salida</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
                style={{ marginBottom: 32 }}
            />

            {/* Botón para registrar ingreso (ejemplo, podrías hacerlo modal o formulario) */}
            <TouchableOpacity
                style={styles.ingresoBtn}
                onPress={() => registrarIngreso(`00${vehiculos.length}XYZ`, 'auto')}>
                <Text style={styles.botonTexto}>Registrar Ingreso Auto</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.ingresoBtn}
                onPress={() => registrarIngreso(`00${vehiculos.length}MOTO`, 'moto')}>
                <Text style={styles.botonTexto}>Registrar Ingreso Moto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.boton}>
                <Text style={styles.botonTexto}>Editar Información</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 18,
        backgroundColor: '#fff',
    },
    titulo: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    section: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    seccionTitulo: {
        fontSize: 16,
        color: '#222',
    },
    capacidad: {
        fontSize: 16,
        color: '#222',
        fontWeight: 'bold',
    },
    tarifaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 8,
    },
    tarifaLabel: {
        fontSize: 16,
        color: '#222',
        fontWeight: 'bold',
    },
    tarifaValue: {
        fontSize: 16,
        color: '#888',
    },
    vehiculosTitulo: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 12,
    },
    tablaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 4,
    },
    tablaHeaderText: {
        fontSize: 16,
        fontWeight: 'bold',
        width: '33%',
        textAlign: 'left',
    },
    tablaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
        paddingVertical: 6,
    },
    tablaCell: {
        fontSize: 15,
        color: '#222',
        width: '20%',
    },
    salidaBtn: {
        backgroundColor: '#e74c3c',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginLeft: 10,
    },
    salidaBtnTxt: {
        color: '#fff',
        fontSize: 14,
    },
    ingresoBtn: {
        backgroundColor: '#2980b9',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 8,
    },
    boton: {
        backgroundColor: '#000',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        position: 'absolute',
        bottom: 24,
        left: 18,
        right: 18,
    },
    botonTexto: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 17,
    },
});