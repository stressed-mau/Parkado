import axios from "axios";

const BASE_URL = "https://parkado-backend.vercel.app/api";

export const createComment = async (data: {
    puntuacion:number;
    comentario:string;
}) => {
    try{
        const response  = await axios.post(`${BASE_URL}/calificaciones`, data);
        return response.data;
    }catch(error:any){
        console.error("Error al crear el comentario:", error.response?.data || console.error);
        throw error.response?.data || error;
    }
}