import axios from 'axios';

const BASE_URL = "https://parkado-backend.vercel.app/api";

export const getTarifasYPlazas = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/parqueos/details/3/plazas-tarifas`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener tarifas y plazas:', error);
    throw error;
  }
};

export const getPlazas = async (idParqueo: number, tipoVehiculoId?: number) => {
  let url = `${BASE_URL}/parqueos/filter-plazas/${idParqueo}`;
  if (tipoVehiculoId) url += `?tipoVehiculoId=${tipoVehiculoId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener plazas");
  return res.json();
};

export const getReservasPorParqueo = async (idParqueo: number) => {
  try {
    const response = await axios.get(`${BASE_URL}/reservas/parqueo/${idParqueo}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener reservas del parqueo:", error);
    throw error;
  }
};

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