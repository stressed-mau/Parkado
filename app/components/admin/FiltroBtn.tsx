import React from 'react';
import { Pressable, Text } from 'react-native';

export default function FiltroBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 10,
                backgroundColor: active ? '#2c3e50' : '#f0f0f0',
            }}
        >
            <Text style={{ color: active ? '#fff' : '#333', fontWeight: active ? '600' : '400', fontSize: 15 }}>{label}</Text>
        </Pressable>
    );
}