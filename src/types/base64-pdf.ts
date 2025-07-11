export interface Base64PdfSingleRequest {
    base64_code: string;
}

export interface Base64PdfMultipleRequest {
    base64_codes: string[];
}

export type Base64PdfRequest = Base64PdfSingleRequest | Base64PdfMultipleRequest;

export interface Base64PdfResponseData {
    file_name: string;
    original_name?: string | null;
    mime_type: string;
    size_kb: number;
    pages: number;
    pdf_version: string | null;
    is_encrypted: boolean;
    has_form_fields: boolean;
    has_images: boolean;
    has_javascript: boolean;
    creation_date: string | null;
    modification_date: string | null;
    author: string | null;
    title: string | null;
    subject: string | null;
    producer: string | null;
    creator: string | null;
    keywords: string | null;

    download_url: string;
    view_url: string;
    info_url: string;
}

export interface Base64PdfMultipleResponseData {
    processed_files: Base64PdfResponseData[];
    total_processed: number;
    total_failed: number;
    failed_files: Array<{
        index: number;
        reason: string;
    }>;
}

// Respuesta para UN SOLO PDF
export interface Base64PdfSingleResponse {
    success: boolean;
    message: string;
    data?: Base64PdfResponseData;
}

// Respuesta para MÚLTIPLES PDFs
export interface Base64PdfMultipleResponse {
    success: boolean;
    message: string;
    data?: Base64PdfMultipleResponseData;
}

export type Base64PdfResponse = Base64PdfSingleResponse | Base64PdfMultipleResponse;

export interface ErrorResponse {
    success: false;
    message: string;
    error_type?: string;
}

export interface RepairPdfOptions {
    fix_headers?: boolean;
    fix_padding?: boolean;
    validate_pdf?: boolean;
}

export interface RepairPdfRequest {
    base64_code: string;
    repair_options?: RepairPdfOptions;
}

export interface PdfValidation {
    is_valid_base64: boolean;
    is_valid_pdf: boolean;
    pdf_version: string | null;
    size_bytes: number;
    estimated_pages: number;
    has_metadata: boolean;
    warnings: string[];
    errors: string[];
}

export interface RepairPdfResponse {
    success: boolean;
    message: string;
    warnings?: string[];
    errors?: string[];
    pdf_validation?: PdfValidation;
    data?: {
        original: string;
        repaired: string;
    };
}

export interface PdfInfo {
    file_name: string;
    size_bytes: number;
    size_kb: number;
    mime_type: string;
    last_modified: string;
    exists: boolean;
}

export interface PdfInfoResponse {
    success: boolean;
    message?: string;
    data?: PdfInfo;
    error_type?: string;
}

// Type guards para verificar el tipo de respuesta
export function isSinglePdfResponse(
    response: Base64PdfResponse
): response is Base64PdfSingleResponse {
    return !!response.success && !!response.data && 'file_name' in response.data!;
}

export function isMultiplePdfResponse(
    response: Base64PdfResponse
): response is Base64PdfMultipleResponse {
    return !!response.success && !!response.data && 'processed_files' in response.data;
}

export function isSingleRequest(request: Base64PdfRequest): request is Base64PdfSingleRequest {
    return 'base64_code' in request;
}

export function isMultipleRequest(request: Base64PdfRequest): request is Base64PdfMultipleRequest {
    return 'base64_codes' in request;
}
