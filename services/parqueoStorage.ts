import type { Espacio, Vehiculo } from '@/types/parqueo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_VEHICULOS = 'vehiculos';
const KEY_ESPACIOS = 'espacios';

export async function getVehiculos(): Promise<Vehiculo[] | null> {
    const raw = await AsyncStorage.getItem(KEY_VEHICULOS);
    return raw ? (JSON.parse(raw) as Vehiculo[]) : null;
}

export async function setVehiculos(data: Vehiculo[]): Promise<void> {
    await AsyncStorage.setItem(KEY_VEHICULOS, JSON.stringify(data));
}

export async function getEspacios(): Promise<Espacio[] | null> {
    const raw = await AsyncStorage.getItem(KEY_ESPACIOS);
    return raw ? (JSON.parse(raw) as Espacio[]) : null;
}

export async function setEspacios(data: Espacio[]): Promise<void> {
    await AsyncStorage.setItem(KEY_ESPACIOS, JSON.stringify(data));
}

