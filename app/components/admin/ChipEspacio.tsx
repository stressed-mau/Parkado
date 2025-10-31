import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Espacio } from '../../constants/parqueo';

export default function ChipEspacio({
    espacio,
    selected,
    onPress,
}: {
    espacio: Espacio;
    selected: boolean;
    onPress: () => void;
}) {
    const color = espacio.estado === 'libre' ? '#27ae60' : espacio.estado === 'reservado' ? '#f39c12' : '#c0392b';
    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.chip,
                selected && styles.chipActive,
                { borderColor: color },
            ]}
        >
            <Text style={[styles.chipTxt, selected && styles.chipTxtActive, { color }]}>{espacio.id} · {espacio.estado}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    chip: {
        borderWidth: 1,
        borderColor: '#bbb',
        borderRadius: 18,
        paddingHorizontal: 13,
        paddingVertical: 7,
        backgroundColor: '#fafafa',
        margin: 4,
    },
    chipActive: {
        backgroundColor: '#2c3e50',
        borderColor: '#2c3e50',
    },
    chipTxt: { color: '#333' },
    chipTxtActive: { color: '#fff', fontWeight: '600' },
});