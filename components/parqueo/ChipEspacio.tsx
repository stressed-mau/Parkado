import type { Espacio } from '@/types/parqueo';
import React from 'react';
import { Pressable, Text } from 'react-native';

export default function ChipEspacio({ espacio, selected, onPress }: { espacio: Espacio; selected: boolean; onPress: () => void }) {
    const color = espacio.estado === 'libre' ? '#27ae60' : espacio.estado === 'reservado' ? '#f39c12' : '#c0392b';
    return (
        <Pressable
            onPress={onPress}
            className={`border rounded-[18px] px-[13px] py-[7px] bg-[#fafafa] ${selected ? 'bg-[#2c3e50] border-[#2c3e50]' : ''}`}
            style={{ borderColor: color }}
        >
            <Text className={`${selected ? 'text-white font-semibold' : 'text-[#333]'}`} style={{ color }}>
                {espacio.id} · {espacio.estado}
            </Text>
        </Pressable>
    );
}
