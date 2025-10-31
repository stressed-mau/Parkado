import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import ChipEspacio from './ChipEspacio';
import { Espacio } from '../../constants/parqueo';

export default function ModalReserva({
    visible,
    onClose,
    espacios,
    onReservar,
}: {
    visible: boolean;
    onClose: () => void;
    espacios: Espacio[];
    onReservar: (espacioId: string | null, minutos: number) => void;
}) {
    const [tipoReserva, setTipoReserva] = useState<'auto' | 'moto'>('auto');
    const [espacioReserva, setEspacioReserva] = useState<string | null>(null);
    const [minutosReserva, setMinutosReserva] = useState('60');

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                    <Text style={styles.modalTitulo}>Reservar Espacio</Text>
                    <View style={styles.filtersRow}>
                        <Pressable onPress={() => setTipoReserva('auto')} style={[styles.filterBtn, tipoReserva === 'auto' && styles.filterBtnActive]}>
                            <Text style={{ color: tipoReserva === 'auto' ? '#fff' : '#333' }}>Auto</Text>
                        </Pressable>
                        <Pressable onPress={() => setTipoReserva('moto')} style={[styles.filterBtn, tipoReserva === 'moto' && styles.filterBtnActive]}>
                            <Text style={{ color: tipoReserva === 'moto' ? '#fff' : '#333' }}>Moto</Text>
                        </Pressable>
                    </View>
                    <Text style={styles.seleccionTitulo}>Selecciona un espacio</Text>
                    <ScrollView style={{ maxHeight: 100 }}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {espacios
                                .filter(e => e.tipo === tipoReserva && e.estado === 'libre')
                                .map(e => (
                                    <ChipEspacio
                                        key={e.id}
                                        espacio={e}
                                        selected={espacioReserva === e.id}
                                        onPress={() => setEspacioReserva(prev => (prev === e.id ? null : e.id))}
                                    />
                                ))}
                        </View>
                    </ScrollView>
                    <TextInput
                        placeholder="Minutos (ej. 60)"
                        keyboardType="numeric"
                        value={minutosReserva}
                        onChangeText={setMinutosReserva}
                        style={styles.input}
                    />
                    <View style={styles.modalActions}>
                        <Pressable style={styles.cancelBtn} onPress={onClose}>
                            <Text>Cancelar</Text>
                        </Pressable>
                        <Pressable onPress={() => onReservar(espacioReserva, Math.max(1, parseInt(minutosReserva || '0', 10)))}>
                            <Text style={{ color: '#fff' }}>Reservar</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
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
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 16,
        backgroundColor: '#fff',
        marginTop: 8,
    },
    filtersRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        marginTop: 6,
    },
    filterBtn: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
    },
    filterBtnActive: {
        backgroundColor: '#2c3e50',
    },
});