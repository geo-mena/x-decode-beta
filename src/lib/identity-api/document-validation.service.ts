import axios from 'axios';
import {
    StartDocumentValidationRequest,
    CheckValidationStatusRequest,
    GetValidationDataRequest,
    DocumentValidationResponse,
    ErrorResponse
} from '@/types/document-validation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002';

export const documentValidationService = {
    /**
     * Inicia el proceso de validación de un documento
     *
     * @param country - Código del país (ej: "CHL")
     * @param idType - Tipo de documento (ej: "ID_CARD")
     * @param frontsideImage - Imagen frontal del documento en base64
     * @param backsideImage - Imagen trasera del documento en base64
     * @param merchantIdScanReference - Referencia personalizada (opcional)
     * @param storeResponses - Indica si guardar las respuestas
     * @returns Promise con la respuesta del servidor
     */
    startDocumentValidation: async (
        country: string,
        idType: string,
        frontsideImage: string,
        backsideImage: string,
        storeResponses: boolean = true,
        merchantIdScanReference?: string
    ): Promise<DocumentValidationResponse> => {
        try {
            const payload: StartDocumentValidationRequest = {
                country,
                idType,
                frontsideImage,
                backsideImage,
                merchantIdScanReference,
                storeResponses
            };

            const response = await axios.post(`${API_URL}/v1/document-validation/start`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-API-Token': API_TOKEN
                }
            });

            return {
                success: true,
                data: response.data
            };
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
     * Verifica el estado del proceso de validación de un documento
     *
     * @param scanReference - Referencia de escaneo
     * @param storeResponses - Indica si guardar las respuestas
     * @returns Promise con la respuesta del servidor
     */
    checkValidationStatus: async (
        scanReference: string,
        storeResponses: boolean = true
    ): Promise<DocumentValidationResponse> => {
        try {
            const payload: CheckValidationStatusRequest = {
                scanReference,
                storeResponses
            };

            const response = await axios.post(`${API_URL}/v1/document-validation/status`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-API-Token': API_TOKEN
                }
            });

            return {
                success: true,
                data: response.data
            };
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
     * Obtiene los datos resultantes del proceso de validación de un documento
     *
     * @param scanReference - Referencia de escaneo
     * @param storeResponses - Indica si guardar las respuestas
     * @returns Promise con la respuesta del servidor
     */
    getValidationData: async (
        scanReference: string,
        storeResponses: boolean = true
    ): Promise<DocumentValidationResponse> => {
        try {
            const payload: GetValidationDataRequest = {
                scanReference,
                storeResponses
            };

            const response = await axios.post(`${API_URL}/v1/document-validation/data`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-API-Token': API_TOKEN
                }
            });

            return {
                success: true,
                data: response.data
            };
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

export default documentValidationService;
