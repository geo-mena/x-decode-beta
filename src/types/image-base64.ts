import { ErrorResponse } from './base64-image';

export type { ErrorResponse };

export interface Base64EncodeUrlRequest {
    image_url: string;
    include_data_uri?: number;
}

export interface Base64EncodePathRequest {
    image_path: string;
    storage_disk?: string;
    include_data_uri?: number;
}

export interface Base64EncodeResponseData {
    original_name: string;
    original_url?: string;
    original_path?: string;
    mime_type: string;
    extension: string;
    width: number;
    height: number;
    size: number;
    size_formatted: string;
    base64: string;
    data_uri?: string;
}

export interface Base64EncodeResponse {
    success: boolean;
    message: string;
    data?: Base64EncodeResponseData | Base64EncodeResponseData[];
    errors?: Array<{
        index: number;
        file_name: string;
        error: string;
    }>;
}
