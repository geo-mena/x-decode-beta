import axios from 'axios';
import { Base64ImageRequest, Base64ImageResponse, ErrorResponse } from '@/types/base64-image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002';

export const base64ImageService = {
    /**
     * Decodifica una imagen a partir de uno o varios códigos base64
     *
     * @param data - Objeto con base64_code o base64_codes
     * @returns Promise con la respuesta del servidor
     */
    decodeImage: async (data: Base64ImageRequest): Promise<Base64ImageResponse> => {
        try {
            const payload: Base64ImageRequest = {
                ...data
            };

            if (data.base64_code && !data.base64_codes) {
                payload.base64_codes = [data.base64_code];
                delete payload.base64_code;
            }

            const response = await axios.post<Base64ImageResponse>(
                `${API_URL}/v1/decode/image`,
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
     * Obtiene la URL de descarga para una imagen decodificada
     *
     * @param fileName - Nombre del archivo a descargar
     * @returns URL de descarga
     */
    getDownloadUrl: (fileName: string): string => {
        return `${API_URL}/v1/decode/download/${fileName}`;
    },

    /**
     * Descarga directamente una imagen decodificada
     *
     * @param fileName - Nombre del archivo a descargar
     * @returns void
     */
    downloadImage: (fileName: string): void => {
        window.open(base64ImageService.getDownloadUrl(fileName), '_blank');
    },

    /**
     * Obtiene la URL del proxy para una imagen decodificada
     * Esta URL es segura para operaciones como copiar al portapapeles
     *
     * @param fileName - Nombre del archivo de imagen
     * @returns URL del proxy de imagen
     */
    getProxyUrl: (fileName: string): string => {
        return `${API_URL}/v1/base64-image/${fileName}`;
    },

    /**
     * Repara un código base64 malformado
     *
     * @param base64Code - Código base64 a reparar
     * @returns Promise con la respuesta del servidor
     */
    repairBase64: async (base64Code: string): Promise<any> => {
        try {
            const response = await axios.post(
                `${API_URL}/v1/tool/repair`,
                { base64_code: base64Code },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                return error.response.data;
            }
            return {
                success: false,
                message: 'Error al conectar con el servidor'
            };
        }
    }
};

export default base64ImageService;
