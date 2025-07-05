import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002';

export interface AIDetectionResponse {
    success: boolean;
    is_ai_generated: boolean;
    smart_detection: boolean;
    smart_explanation: string;
    confidence_score: number;
    details?: {
        label: string;
        score: number;
    }[];
}

export const aiDetectionService = {
    /**
     * Detecta si una imagen fue generada por IA
     *
     * @param imageFile - Archivo de imagen a analizar
     * @returns Promise con la respuesta del servidor
     */
    detectAIImage: async (imageFile: File): Promise<AIDetectionResponse> => {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);

            const response = await axios.post<AIDetectionResponse>(
                `${API_URL}/api/detect-ai-image`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                return error.response.data as AIDetectionResponse;
            }
            return {
                success: false,
                is_ai_generated: false,
                smart_detection: false,
                smart_explanation: 'Error al conectar con el servidor',
                confidence_score: 0
            };
        }
    }
};

export default aiDetectionService;
