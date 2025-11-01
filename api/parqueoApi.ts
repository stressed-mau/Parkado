import axios from 'axios';

const API_URL = 'https://parkado-backend.vercel.app/api/parqueos/3/tarifas-plazas';

export const getTarifasYPlazas = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error al obtener tarifas y plazas:', error);
    throw error;
  }
};