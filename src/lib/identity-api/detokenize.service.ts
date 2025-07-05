import axios from 'axios';
import { DetokenizeRequest, DetokenizeResponse, ErrorResponse } from '@/types/detokenize';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002';

export const detokenizeService = {
    /**
     * Detokeniza una imagen a partir de uno o varios tokens
     *
     * @param data - Objeto con bestImageToken o bestImageTokens y opcionalmente transactionId
     * @returns Promise con la respuesta del servidor
     */
    detokenizeImage: async (data: DetokenizeRequest): Promise<DetokenizeResponse> => {
        try {
            const payload: DetokenizeRequest = {
                ...data
            };

            if (data.bestImageToken && !data.bestImageTokens) {
                payload.bestImageTokens = [data.bestImageToken];
                delete payload.bestImageToken;
            }

            const response = await axios.post<DetokenizeResponse>(
                `${API_URL}/v1/detokenize`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                return error.response.data as ErrorResponse;
            }
            return {
                success: false,
                message: 'Error al conectar con el servidor'
            };
        }
    },

    /**
     * Obtiene la URL de descarga para una imagen detokenizada
     *
     * @param fileName - Nombre del archivo a descargar
     * @returns URL de descarga
     */
    getDownloadUrl: (fileName: string): string => {
        return `${API_URL}/v1/detokenize/download/${fileName}`;
    },

    /**
     * Descarga directamente una imagen detokenizada
     *
     * @param fileName - Nombre del archivo a descargar
     * @returns void
     */
    downloadImage: (fileName: string): void => {
        window.open(detokenizeService.getDownloadUrl(fileName), '_blank');
    },

    /**
     * Obtiene la URL del proxy para una imagen detokenizada
     * Esta URL es segura para operaciones como copiar al portapapeles
     *
     * @param fileName - Nombre del archivo de imagen
     * @returns URL del proxy de imagen
     */
    getProxyUrl: (fileName: string): string => {
        return `${API_URL}/v1/image-proxy/${fileName}`;
    }
};

export default detokenizeService;
