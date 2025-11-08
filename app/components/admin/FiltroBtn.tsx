import React from 'react';
import { Pressable, Text } from 'react-native';

type FiltroBtnProps = {
  label: string;
};

export default function FiltroBtn( {label}: FiltroBtnProps){
    return (
        <Pressable
            className= "px-3 py-[7px] rounded-[10px]'bg-[#2c3e50] ">
            <Text className="text-[15px] text-[#333] font-normal" >{label}</Text>
        </Pressable>
    );
}