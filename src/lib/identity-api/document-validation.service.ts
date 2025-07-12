import axios from 'axios';
import {
    StartDocumentValidationRequest,
    CheckValidationStatusRequest,
    GetValidationDataRequest,
    DocumentValidationResponse,
    ErrorResponse
} from '@/types/document-validation';

const API_URL = 'https://api.identity-platform.io/verify';

export class DocumentValidationService {
    private readonly apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private get headers() {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-api-key': this.apiKey
        };
    }
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
    async startDocumentValidation(
        country: string,
        idType: string,
        frontsideImage: string,
        backsideImage: string,
        storeResponses: boolean = true,
        merchantIdScanReference?: string
    ): Promise<DocumentValidationResponse> {
        try {
            const payload: StartDocumentValidationRequest = {
                country,
                idType,
                frontsideImage,
                backsideImage,
                merchantIdScanReference,
                storeResponses
            };

            const response = await axios.post(`${API_URL}/documentValidation/start`, payload, {
                headers: this.headers
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

    /**
     * Verifica el estado del proceso de validación de un documento
     *
     * @param scanReference - Referencia de escaneo
     * @param storeResponses - Indica si guardar las respuestas
     * @returns Promise con la respuesta del servidor
     */
    async checkValidationStatus(
        scanReference: string,
        storeResponses: boolean = true
    ): Promise<DocumentValidationResponse> {
        try {
            const payload: CheckValidationStatusRequest = {
                scanReference,
                storeResponses
            };

            const response = await axios.post(`${API_URL}/documentValidation/status`, payload, {
                headers: this.headers
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

    /**
     * Obtiene los datos resultantes del proceso de validación de un documento
     *
     * @param scanReference - Referencia de escaneo
     * @param storeResponses - Indica si guardar las respuestas
     * @returns Promise con la respuesta del servidor
     */
    async getValidationData(
        scanReference: string,
        storeResponses: boolean = true
    ): Promise<DocumentValidationResponse> {
        try {
            const payload: GetValidationDataRequest = {
                scanReference,
                storeResponses
            };

            const response = await axios.post(`${API_URL}/documentValidation/data`, payload, {
                headers: this.headers
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
}

export const createDocumentValidationService = (apiKey: string): DocumentValidationService => {
    return new DocumentValidationService(apiKey);
};

export default DocumentValidationService;
