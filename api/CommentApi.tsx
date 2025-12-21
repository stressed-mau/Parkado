import axios from "axios";

const BASE_URL = "https://parkado-backend.vercel.app/api";

export const getCalificacionesByParqueo = async (parqueoId: number) => {
  try {
    const response = await axios.get(`${BASE_URL}/calificaciones/${parqueoId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error al obtener reseñas:", error.response?.data || error);
    throw error;
  }
};

export const deleteCalificacion = async (
  calificacionId: number,
  usuarioId: number
) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/calificaciones/${calificacionId}/${usuarioId}`
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Error al eliminar reseña:",
      error.response?.data || error
    );
    throw error;
  }
};


export const postCalificacion = async (body: {
  parqueoId: number;
  usuarioId: number;
  puntuacion: number;
  comentario: string;
}) => {
  try {
    const response = await axios.post(`${BASE_URL}/calificaciones`, body);
    return response.data;
  } catch (error: any) {
    console.log("Error POST calificación:", error.response?.data || error);
    throw error;
  }
};