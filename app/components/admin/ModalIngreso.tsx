import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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
            <View className="flex-1 justify-center p-4 bg-black/28">
                <View className="bg-yellow-400 rounded-lg p-[18px] gap-2 shadow-lg shadow-black">
                    <Text className="text-[19px] font-bold mb-2 text-[#2980b9] ">Ingresar Vehículo</Text>
                    <TextInput
                        placeholder="Placa (p.ej. ABC-123)"
                        autoCapitalize="characters"
                        value={placaInput}
                        onChangeText={t => setPlacaInput(t.toUpperCase())}
                        className="border border-[#ddd] rounded-[10px] px-3.5 py-[11px] text-base bg-white mb-2"
                    />
                    <View className="flex-row gap-2 items-center mt-1.5">
                        <Pressable onPress={() => setTipoInput('auto')} className={`px-3 py-[7px] rounded-[10px] ${tipoInput === 'auto' ? 'bg-[#2c3e50]' : 'bg-[#f0f0f0]'}`}>
                            <Text className={`${tipoInput === 'auto' ? 'text-white' : 'text-[#333]'}`}>Auto</Text>
                        </Pressable>
                        <Pressable onPress={() => setTipoInput('moto')} className={`px-3 py-[7px] rounded-[10px] ${tipoInput === 'moto' ? 'bg-[#2c3e50]' : 'bg-[#f0f0f0]'}`}>
                            <Text className={`${tipoInput === 'moto' ? 'text-white' : 'text-[#333]'}`}>Moto</Text>
                        </Pressable>
                    </View>
                    <Text className="text-lg text-[#444] mt-1.5">Selecciona un espacio (opcional)</Text>
                    <ScrollView className="max-h-[100px]">
                        <View className="flex-row flex-wrap">
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
                    <View className="flex-row justify-end gap-3.5 mt-4">
                        <Pressable className="px-3.5 py-[9px]" onPress={onClose}>
                            <Text>Cancelar</Text>
                        </Pressable>
                        <Pressable
                            className="bg-[#27ae60] px-3.5 py-[9px] rounded-[10px]"
                            onPress={() => {
                                onConfirm(placaInput, tipoInput, espacioSeleccionado);
                                setPlacaInput('');
                                setEspacioSeleccionado(null);
                            }}
                        >
                            <Text className="text-white">Confirmar</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}