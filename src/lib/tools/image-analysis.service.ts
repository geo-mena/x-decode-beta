import axios from 'axios';

import {
    ImageAnalysisUrlRequest,
    ImageAnalysisResponse,
    ErrorResponse
} from '@/types/image-analysis';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002';
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || '';

export const imageAnalysisService = {
    /**
     * Analiza una imagen desde una URL
     *
     * @param imageUrl - URL de la imagen a analizar
     * @param saveToDb - Indica si guardar en base de datos
     * @param storeFile - Indica si almacenar el archivo
     * @returns Promise con la respuesta del servidor
     */
    analyzeImageFromUrl: async (
        imageUrl: string,
        saveToDb: boolean = true,
        storeFile: boolean = true
    ): Promise<ImageAnalysisResponse> => {
        try {
            const payload: ImageAnalysisUrlRequest = {
                image_url: imageUrl,
                save_to_db: saveToDb,
                store_file: storeFile
            };

            const response = await axios.post<ImageAnalysisResponse>(
                `${API_URL}/v1/image-analysis/analyze`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-API-Token': API_TOKEN
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
     * Analiza una imagen desde un archivo
     *
     * @param imageFile - Archivo de imagen a analizar
     * @param saveToDb - Indica si guardar en base de datos
     * @param storeFile - Indica si almacenar el archivo
     * @returns Promise con la respuesta del servidor
     */
    analyzeImageFromFile: async (
        imageFile: File,
        saveToDb: boolean = true,
        storeFile: boolean = true
    ): Promise<ImageAnalysisResponse> => {
        try {
            const formData = new FormData();
            formData.append('image_file', imageFile);
            formData.append('save_to_db', saveToDb ? '1' : '0');
            formData.append('store_file', storeFile ? '1' : '0');

            const response = await axios.post<ImageAnalysisResponse>(
                `${API_URL}/v1/image-analysis/analyze`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Accept: 'application/json',
                        'X-API-Token': API_TOKEN
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
    }
};

export default imageAnalysisService;
