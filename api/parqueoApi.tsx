import axios from 'axios';

const BASE_URL = "https://parkado-backend.vercel.app/api";

// Obtener tarifas y plazas de un parqueo específico
export const getTarifasYPlazas = async (parqueoId: number) => {
  try {
    const response = await axios.get(`${BASE_URL}/parqueos/details/${parqueoId}/plazas-tarifas`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener tarifas y plazas:', error);
    throw error;
  }
};

// Obtener plazas con filtrado opcional por tipo de vehículo
export const getPlazas = async (idParqueo: number, tipoVehiculoId?: number) => {
  let url = `${BASE_URL}/parqueos/filter-plazas/${idParqueo}`;
  if (tipoVehiculoId) url += `?tipoVehiculoId=${tipoVehiculoId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener plazas");
  return res.json();
};

// Obtener reservas por parqueo
export const getReservasPorParqueo = async (idParqueo: number) => {
  try {
    const response = await axios.get(`${BASE_URL}/reservas/parqueo/${idParqueo}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener reservas del parqueo:", error);
    throw error;
  }
};

// Crear una nueva reserva
export const crearReserva = async (data: {
  fechaHoraIni: string;
  fechaHoraFin: string;
  plazaId: number;
  usuarioId: number;
  matriculaVehiculo: string;
}) => {
  try {
    const response = await axios.post(`${BASE_URL}/reservas`, data);
    return response.data;
  } catch (error: any) {
    console.error("Error al crear la reserva:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Obtener plazas disponibles
export const getPlazasDisponibles = async (
  parqueoId: number,
  tipoVehiculoId: number
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/parqueos/filter-plazas/${parqueoId}?tipoVehiculoId=${tipoVehiculoId}&estado=DISPONIBLE`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error al obtener plazas disponibles:", error);
    throw error.response?.data || error;
  }
};
