import axios, { AxiosError } from 'axios';
import {
    EvaluatePassiveLivenessRequest,
    EvaluatePassiveLivenessResponse,
    LivenessApiError,
    LivenessConfig
} from '../../types/liveness';

const LIVENESS_API_URL = 'https://api.identity-platform.io/services/evaluatePassiveLivenessToken';

export class LivenessService {
    private readonly apiKey: string;

    constructor(config: LivenessConfig) {
        this.apiKey = config.apiKey;
    }

    /**
     * Evaluates passive liveness using tokenized image
     *
     * @param request - Contains imageBuffer from Selphi widget and optional tracking data
     * @returns Raw API response with liveness evaluation results
     * @throws LivenessApiError - When API key missing, imageBuffer missing, or API call fails
     */
    async evaluatePassiveLiveness(
        request: EvaluatePassiveLivenessRequest
    ): Promise<EvaluatePassiveLivenessResponse> {
        if (!this.apiKey) {
            throw new LivenessApiError('API key is required');
        }

        if (!request.imageBuffer) {
            throw new LivenessApiError('imageBuffer is required');
        }

        try {
            const response = await axios.post<EvaluatePassiveLivenessResponse>(
                LIVENESS_API_URL,
                request,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey
                    },
                    timeout: 30000
                }
            );

            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorMessage = error.response?.data?.message || error.message;
                throw new LivenessApiError(
                    `API request failed: ${errorMessage}`,
                    error.response?.status,
                    error.code
                );
            }

            throw new LivenessApiError(
                `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }
}

/**
 * Factory function to create a LivenessService instance
 *
 * @param config - Configuration object with apiKey
 * @returns Configured LivenessService instance
 */
export const createLivenessService = (config: LivenessConfig): LivenessService => {
    return new LivenessService(config);
};

/**
 * Convenience factory function with just API key
 *
 * @param apiKey - The API key for Identity Platform
 * @returns Configured LivenessService instance
 */
export const createLivenessServiceWithApiKey = (apiKey: string): LivenessService => {
    return new LivenessService({ apiKey });
};

export type {
    EvaluatePassiveLivenessRequest,
    EvaluatePassiveLivenessResponse,
    LivenessApiError,
    LivenessConfig
};
