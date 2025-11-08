import axios from 'axios';

const API_URL = 'https://parkado-backend.vercel.app/api/parqueos/details/3/plazas-tarifas';

export const getTarifasYPlazas = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error al obtener tarifas y plazas:', error);
    throw error;
  }
};

export const getPlazas = async (idParqueo: number, tipoVehiculoId?: number) => {
  let url = `https://parkado-backend.vercel.app/api/parqueos/filter-plazas/${idParqueo}`;
  if (tipoVehiculoId) url += `?tipoVehiculoId=${tipoVehiculoId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener plazas");
  return res.json();
};