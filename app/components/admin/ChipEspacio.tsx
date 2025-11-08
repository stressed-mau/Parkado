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
    const color = espacio.estado === "libre" ? "#27ae60" : espacio.estado === "reservado"? "#f39c12" : "#c0392b";
    return (
        <Pressable
            onPress={onPress}
            className={`border m-1 rounded-[18px] px-[13px] py-[7px]
                ${selected 
                    ? 'bg-[#2c3e50] border-[#2c3e50]' 
                    : 'border-[#bbb] bg-[#fafafa]'
                }
            `}
        >
            <Text 
            className={`
                    ${selected 
                        ? 'text-white font-semibold' 
                        : 'text-[#333]'
                    }
                `}>
                    {espacio.id} · {espacio.estado}
            </Text>
        </Pressable>
    );
}