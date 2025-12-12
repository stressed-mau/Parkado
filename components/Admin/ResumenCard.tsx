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
    icon: React.ReactNode;
}) {
    return (
        <View style={{
            backgroundColor: '#d1dddd',
            borderRadius: 16,
            padding: 15,
            flex: 1,
            alignItems: 'center',
            shadowColor: color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.16,
            shadowRadius: 4,
            elevation: 2,
            borderWidth: 1,
            borderColor: '#eee',
            marginHorizontal: 6,
        }}>
            {icon}
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>{label}</Text>
            <Text style={{ fontSize: 17 }}>{ocupados} / {capacidad}</Text>
            <Text style={{ fontSize: 13, marginTop: 2 }}>{tarifa}</Text>
        </View>
    );
}