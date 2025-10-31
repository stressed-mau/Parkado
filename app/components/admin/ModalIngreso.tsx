import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import ChipEspacio from './ChipEspacio';
import { Espacio, Vehiculo } from '../../constants/parqueo';

export default function ModalIngreso({
    visible,
    onClose,
    espacios,
    onConfirm,
}: {
    visible: boolean;
    onClose: () => void;
    espacios: Espacio[];
    onConfirm: (placa: string, tipo: 'auto' | 'moto', espacioId?: string | null) => void;
}) {
    const [placaInput, setPlacaInput] = useState('');
    const [tipoInput, setTipoInput] = useState<'auto' | 'moto'>('auto');
    const [espacioSeleccionado, setEspacioSeleccionado] = useState<string | null>(null);

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                    <Text style={styles.modalTitulo}>Ingresar Vehículo</Text>
                    <TextInput
                        placeholder="Placa (p.ej. ABC-123)"
                        autoCapitalize="characters"
                        value={placaInput}
                        onChangeText={t => setPlacaInput(t.toUpperCase())}
                        style={styles.input}
                    />
                    <View style={styles.filtersRow}>
                        <Pressable onPress={() => setTipoInput('auto')} style={[styles.filterBtn, tipoInput === 'auto' && styles.filterBtnActive]}>
                            <Text style={{ color: tipoInput === 'auto' ? '#fff' : '#333' }}>Auto</Text>
                        </Pressable>
                        <Pressable onPress={() => setTipoInput('moto')} style={[styles.filterBtn, tipoInput === 'moto' && styles.filterBtnActive]}>
                            <Text style={{ color: tipoInput === 'moto' ? '#fff' : '#333' }}>Moto</Text>
                        </Pressable>
                    </View>
                    <Text style={styles.seleccionTitulo}>Selecciona un espacio (opcional)</Text>
                    <ScrollView style={{ maxHeight: 100 }}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {(tipoInput === 'auto' ? espacios.filter(e => e.tipo === 'auto' && e.estado === 'libre') : espacios.filter(e => e.tipo === 'moto' && e.estado === 'libre')).map(e => (
                                <ChipEspacio
                                    key={e.id}
                                    espacio={e}
                                    selected={espacioSeleccionado === e.id}
                                    onPress={() => setEspacioSeleccionado(prev => (prev === e.id ? null : e.id))}
                                />
                            ))}
                        </View>
                    </ScrollView>
                    <View style={styles.modalActions}>
                        <Pressable style={styles.cancelBtn} onPress={onClose}>
                            <Text>Cancelar</Text>
                        </Pressable>
                        <Pressable
                            style={styles.okBtn}
                            onPress={() => {
                                onConfirm(placaInput, tipoInput, espacioSeleccionado);
                                setPlacaInput('');
                                setEspacioSeleccionado(null);
                            }}
                        >
                            <Text style={{ color: '#fff' }}>Confirmar</Text>
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
        marginBottom: 8,
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