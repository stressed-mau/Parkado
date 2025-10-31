import React from 'react';
import { Text, View } from 'react-native';

export default function ResumenCard({
    label,
    ocupados,
    capacidad,
    tarifa,
    color,
    icon,
}: {
    label: string;
    ocupados: number;
    capacidad: number;
    tarifa: string;
    color: string;
    icon: string;
}) {
    return (
        <View
            className="bg-white rounded-[16px] p-[15px] flex-1 items-center border border-[#eee] shadow"
            style={{ shadowColor: color }}
        >
            <Text className="text-2xl">{icon}</Text>
            <Text className="text-[16px] font-bold mb-[5px]" style={{ color }}>
                {label}
            </Text>
            <Text className="text-[17px]">
                {ocupados} / {capacidad}
            </Text>
            <Text className="text-[13px] text-[#888] mt-[2px]">
                Tarifa: <Text style={{ color }}>{tarifa}</Text>
            </Text>
        </View>
    );
}

