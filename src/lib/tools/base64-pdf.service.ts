import axios from 'axios';
import {
    Base64PdfRequest,
    Base64PdfResponse,
    Base64PdfSingleResponse,
    Base64PdfMultipleResponse,
    ErrorResponse,
    RepairPdfRequest,
    RepairPdfResponse,
    isSingleRequest,
    isMultipleRequest,
    isSinglePdfResponse,
    isMultiplePdfResponse
} from '@/types/base64-pdf';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002';

export const base64PdfService = {
    /**
     * Decodifica un PDF a partir de uno o varios códigos base64
     * Mantiene la estructura correcta según el backend espera
     *
     * @param data - Objeto con base64_code (single) o base64_codes (multiple)
     * @returns Promise con la respuesta del servidor
     */
    decodePdf: async (data: Base64PdfRequest): Promise<Base64PdfResponse | ErrorResponse> => {
        try {
            let payload: any;

            if (isSingleRequest(data)) {
                payload = {
                    base64_code: data.base64_code
                };
            } else if (isMultipleRequest(data)) {
                payload = {
                    base64_codes: data.base64_codes
                };
            } else {
                throw new Error('Invalid request format');
            }

            const response = await axios.post<Base64PdfResponse>(
                `${API_URL}/v1/decode/pdf`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            return base64PdfService.handleError(error);
        }
    },

    /**
     * Decodifica UN SOLO PDF
     * Método de conveniencia para casos simples
     */
    decodeSinglePdf: async (
        base64Code: string
    ): Promise<Base64PdfSingleResponse | ErrorResponse> => {
        const response = await base64PdfService.decodePdf({ base64_code: base64Code });

        if (!response.success) {
            return response as ErrorResponse;
        }

        if (isSinglePdfResponse(response)) {
            return response;
        }

        return {
            success: false,
            message: 'Unexpected response format for single PDF request'
        };
    },

    /**
     * Decodifica MÚLTIPLES PDFs
     * Método de conveniencia para lotes
     */
    decodeMultiplePdfs: async (
        base64Codes: string[]
    ): Promise<Base64PdfMultipleResponse | ErrorResponse> => {
        if (!Array.isArray(base64Codes) || base64Codes.length === 0) {
            return {
                success: false,
                message: 'Array of base64 codes is required'
            };
        }

        if (base64Codes.length > 10) {
            return {
                success: false,
                message: 'Maximum 10 PDFs allowed per request'
            };
        }

        const response = await base64PdfService.decodePdf({ base64_codes: base64Codes });

        if (!response.success) {
            return response as ErrorResponse;
        }

        if (isMultiplePdfResponse(response)) {
            return response;
        }

        return {
            success: false,
            message: 'Unexpected response format for multiple PDF request'
        };
    },

    /**
     * Repara un código base64 malformado de PDF
     *
     * @param data - Objeto con base64_code y opciones de reparación
     * @returns Promise con la respuesta del servidor
     */
    repairPdf: async (data: RepairPdfRequest): Promise<RepairPdfResponse | ErrorResponse> => {
        try {
            const response = await axios.post<RepairPdfResponse>(`${API_URL}/v1/repair/pdf`, data, {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            return base64PdfService.handleError(error);
        }
    },

    /**
     * Método de conveniencia para reparar con opciones por defecto
     */
    repairBase64: async (
        base64Code: string,
        options?: {
            fixHeaders?: boolean;
            fixPadding?: boolean;
            validatePdf?: boolean;
        }
    ): Promise<RepairPdfResponse | ErrorResponse> => {
        return base64PdfService.repairPdf({
            base64_code: base64Code,
            repair_options: {
                fix_headers: options?.fixHeaders ?? true,
                fix_padding: options?.fixPadding ?? true,
                validate_pdf: options?.validatePdf ?? true
            }
        });
    },

    /**
     * Obtiene la URL de descarga para un PDF decodificado
     *
     * @param fileName - Nombre del archivo a descargar
     * @returns URL de descarga
     */
    getDownloadUrl: (fileName: string): string => {
        return `${API_URL}/v1/pdf/download/${encodeURIComponent(fileName)}`;
    },

    /**
     * Descarga directamente un PDF decodificado abriendo en nueva ventana
     *
     * @param fileName - Nombre del archivo a descargar
     */
    downloadPdf: (fileName: string): void => {
        const url = base64PdfService.getDownloadUrl(fileName);
        window.open(url, '_blank');
    },

    /**
     * Descarga un PDF usando fetch para mejor control de errores
     *
     * @param fileName - Nombre del archivo a descargar
     * @returns Promise que resuelve cuando la descarga inicia
     */
    downloadPdfWithFetch: async (fileName: string): Promise<boolean> => {
        try {
            const url = base64PdfService.getDownloadUrl(fileName);
            const response = await fetch(url);

            if (!response.ok) {
                console.error('Download failed:', response.status, response.statusText);
                return false;
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            return true;
        } catch (error) {
            console.error('Error downloading PDF:', error);
            return false;
        }
    },

    /**
     * Manejo centralizado de errores
     * @private
     */
    handleError: (error: unknown): ErrorResponse => {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                const data = error.response.data;
                if (data && typeof data === 'object' && 'success' in data) {
                    return data as ErrorResponse;
                }
                return {
                    success: false,
                    message: `Server error: ${error.response.status} ${error.response.statusText}`,
                    error_type: 'server_error'
                };
            } else if (error.request) {
                return {
                    success: false,
                    message: 'No se pudo conectar con el servidor',
                    error_type: 'network_error'
                };
            }
        }

        // Error desconocido
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Error desconocido',
            error_type: 'unknown_error'
        };
    }
};

export default base64PdfService;
