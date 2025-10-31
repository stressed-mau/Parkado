import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Vehiculo } from '../../constants/parqueo';

export default function VehiculoRow({ item, onSalida }: { item: Vehiculo; onSalida: (placa: string) => void }) {
    return (
        <View style={styles.tablaRow}>
            <Text style={styles.tablaCell}>{item.placa}</Text>
            <Text style={styles.tablaCell}>{item.tipo === 'auto' ? '🚗' : '🛵'}</Text>
            <Text style={styles.tablaCell}>{item.espacioId || '-'}</Text>
            <Text style={styles.tablaCell}>{item.horaInicio}</Text>
            <Text style={styles.tablaCell}>{item.horaFin || '--'}</Text>
            <Text style={styles.tablaCell}>{item.monto ? `S/. ${item.monto.toFixed(2)}` : '--'}</Text>
            <View style={{ width: 70 }}>
                {item.estacionado && (
                    <TouchableOpacity style={styles.salidaBtn} onPress={() => onSalida(item.placa)}>
                        <Text style={styles.salidaBtnTxt}>Salida</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
});