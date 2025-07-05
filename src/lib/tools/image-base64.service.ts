import axios from 'axios';
import { Base64EncodeUrlRequest, Base64EncodeResponse, ErrorResponse } from '@/types/image-base64';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002';

export const base64EncodeService = {
    /**
     * Codifica una o varias imágenes a formato base64
     *
     * @param files - Archivos de imagen a codificar
     * @param includeDataUri - Indica si incluir data URI en la respuesta
     * @returns Promise con la respuesta del servidor
     */
    encodeImages: async (
        files: File[],
        includeDataUri: boolean = true
    ): Promise<Base64EncodeResponse> => {
        try {
            const formData = new FormData();

            // Si es un solo archivo
            if (files.length === 1) {
                formData.append('image', files[0]);
            } else {
                // Si son múltiples archivos
                files.forEach((file) => {
                    formData.append('images[]', file);
                });
            }

            // Convertimos el booleano a un valor que PHP pueda interpretar correctamente
            formData.append('include_data_uri', includeDataUri ? '1' : '0');

            const response = await axios.post<Base64EncodeResponse>(
                `${API_URL}/v1/encode/image`,
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
                return error.response.data as ErrorResponse;
            }
            return {
                success: false,
                message: 'Error al conectar con el servidor'
            };
        }
    },

    /**
     * Codifica una imagen desde una URL a formato base64
     *
     * @param imageUrl - URL de la imagen a codificar
     * @param includeDataUri - Indica si incluir data URI en la respuesta
     * @returns Promise con la respuesta del servidor
     */
    encodeImageFromUrl: async (
        imageUrl: string,
        includeDataUri: boolean = true
    ): Promise<Base64EncodeResponse> => {
        try {
            const payload: Base64EncodeUrlRequest = {
                image_url: imageUrl,
                include_data_uri: includeDataUri ? 1 : 0
            };

            const response = await axios.post<Base64EncodeResponse>(
                `${API_URL}/v1/encode/image`,
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
     * Copia el contenido base64 o data URI al portapapeles
     *
     * @param content - Contenido a copiar (base64 o data URI)
     * @param includeDataUri - Si es true, copia el data URI completo
     * @returns Promise con resultado de la operación
     */
    copyToClipboard: async (
        content: string,
        includeDataUri: boolean = false
    ): Promise<{ success: boolean; message: string }> => {
        try {
            await navigator.clipboard.writeText(content);
            return {
                success: true,
                message: `${includeDataUri ? 'Data URI' : 'Base64'} copiado al portapapeles`
            };
        } catch (error) {
            console.error('Error al copiar al portapapeles:', error);
            return {
                success: false,
                message: 'No se pudo copiar al portapapeles'
            };
        }
    },

    /**
     * Descarga el contenido de un data URI como archivo
     *
     * @param dataUri - Data URI que contiene la imagen
     * @param fileName - Nombre de archivo sugerido para la descarga
     * @returns void
     */
    downloadFromDataUri: (dataUri: string, fileName: string): void => {
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export default base64EncodeService;
