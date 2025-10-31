import React from 'react';
import { Pressable, Text } from 'react-native';

export default function FiltroBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            className={`px-3 py-[7px] rounded-[10px] ${active ? 'bg-[#2c3e50]' : 'bg-[#f0f0f0]'}`}
        >
            <Text className={`text-[15px] ${active ? 'text-white font-semibold' : 'text-[#333] font-normal'}`}>{label}</Text>
        </Pressable>
    );
}
