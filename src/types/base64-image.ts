// src/types/base64-image.ts

export interface Base64ImageRequest {
    base64_code?: string;
    base64_codes?: string[];
}

export interface Base64ImageResponseData {
    timestamp: string;
    file_name: string;
    mime_type: string;
    extension: string;
    width: number;
    height: number;
    size: number;
    preview_url: string;
    download_url: string;
    jpeg_quality?: number;
    is_progressive_jpeg?: boolean;
    codeIndex?: number;
}

export interface Base64ImageResponse {
    success: boolean;
    message: string;
    data?: Base64ImageResponseData | Base64ImageResponseData[];
}

export interface ErrorResponse {
    success: false;
    message: string;
}

export interface RepairBase64Response {
    success: boolean;
    message: string;
    warnings?: string[];
    errors?: string[];
    data?: {
        original: string;
        repaired: string;
    };
}
