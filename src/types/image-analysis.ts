export interface ImageAnalysisUrlRequest {
    image_url: string;
    save_to_db?: boolean;
    store_file?: boolean;
}

export interface ImageAnalysisResponse {
    success: boolean;
    data?: {
        id: string;
        report: {
            verdict: 'human' | 'ai';
            ai: {
                confidence: number;
                is_detected: boolean;
            };
            human: {
                confidence: number;
                is_detected: boolean;
            };
            generator: {
                midjourney: {
                    confidence: number;
                    is_detected: boolean;
                };
                dall_e: {
                    confidence: number;
                    is_detected: boolean;
                };
                stable_diffusion: {
                    confidence: number;
                    is_detected: boolean;
                };
                this_person_does_not_exist: {
                    confidence: number;
                    is_detected: boolean;
                };
                adobe_firefly: {
                    confidence: number;
                    is_detected: boolean;
                };
                flux: {
                    confidence: number;
                    is_detected: boolean;
                };
                four_o: {
                    confidence: number;
                    is_detected: boolean;
                };
            };
        };
        facets: {
            nsfw: {
                version: string;
                is_detected: boolean;
            };
            quality: {
                version: string;
                is_detected: boolean;
            };
        };
        created_at: string;
    };
    message?: string;
}

export interface ErrorResponse {
    success: false;
    message: string;
}
