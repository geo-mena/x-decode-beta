import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { usePlaygroundStore } from '@/store';
import { createLivenessServiceWithApiKey } from '@/lib/identity-api/liveness.service';
import {
    LivenessResult,
    ImageInfo,
    EvaluatePassiveLivenessResponse,
    LivenessApiError,
    SDKEvaluateRequest,
    SDKEvaluateResponse
} from '@/types/liveness';

const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'];

const SDK_ENDPOINT = '/api/v1/selphid/passive-liveness/evaluate';
const SDK_TIMEOUT = 10000;

const needsProxy = (_endpoint: string): boolean => {
    return true;
};

export const useLivenessEvaluator = () => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<LivenessResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [useSDK, setUseSDK] = useState(false);
    const [selectedSDKEndpoints, setSelectedSDKEndpoints] = useState<string[]>([]);
    const { apiKey, userEndpoints } = usePlaygroundStore();

    // Function to convert image to base64
    const convertImageToBase64 = useCallback((file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    // Remover el prefijo data:image/...;base64,
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                } else {
                    reject(new Error('Error converting image to base64'));
                }
            };
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsDataURL(file);
        });
    }, []);

    // Function to clean base64 (remove prefixes if they exist)
    const cleanBase64 = useCallback((base64String: string): string => {
        const trimmed = base64String.trim();

        // Si tiene prefijo data:image, removerlo
        if (trimmed.startsWith('data:image/')) {
            return trimmed.split(',')[1];
        }

        return trimmed;
    }, []);

    // Function to get image information from base64
    const getImageInfoFromBase64 = useCallback(
        (base64String: string, index: number): Promise<ImageInfo> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                const cleanedBase64 = cleanBase64(base64String);
                const dataUrl = `data:image/jpeg;base64,${cleanedBase64}`;

                img.onload = () => {
                    // Calculate approximate base64 size
                    const base64Length = cleanedBase64.length;
                    const sizeInBytes = Math.floor(base64Length * 0.75);

                    resolve({
                        width: img.width,
                        height: img.height,
                        size: sizeInBytes,
                        name: `base64_image_${index + 1}.jpg`,
                        type: 'image/jpeg'
                    });
                };

                img.onerror = () => {
                    reject(new Error('Error loading image from base64'));
                };

                img.src = dataUrl;
            });
        },
        [cleanBase64]
    );

    // Function to get image information from file
    const getImageInfo = useCallback((file: File): Promise<ImageInfo> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height,
                    size: file.size,
                    name: file.name,
                    type: file.type
                });
                URL.revokeObjectURL(url);
            };

            img.onerror = () => {
                reject(new Error('Error loading image'));
                URL.revokeObjectURL(url);
            };

            img.src = url;
        });
    }, []);

    // Function to check if an SDK endpoint is active
    const checkSDKEndpointStatus = useCallback(async (url: string): Promise<boolean> => {
        try {
            // Basic URL format verification
            const urlObj = new URL(url);

            // If URL has valid format and HTTP/HTTPS protocol, mark as active
            if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
                const fullUrl = `${url}${SDK_ENDPOINT}`;

                try {
                    if (needsProxy(fullUrl)) {
                        const response = await fetch('/api/sdk-proxy', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                endpoint: fullUrl,
                                payload: { image: 'test' }
                            })
                        });

                        return response.ok || response.status === 500;
                    } else {
                        const response = await fetch(fullUrl, {
                            method: 'OPTIONS'
                        });
                        return response.ok || response.status === 405;
                    }
                } catch (error) {
                    return false;
                }
            }

            return false;
        } catch (error) {
            return false;
        }
    }, []);

    // Function to evaluate with SDK
    const evaluateWithSDK = useCallback(
        async (
            imageBase64: string,
            endpointUrl: string,
            tag: string
        ): Promise<{
            diagnostic: string;
            rawResponse?: SDKEvaluateResponse;
        }> => {
            try {
                const cleanedBase64 = cleanBase64(imageBase64);
                const fullUrl = `${endpointUrl}${SDK_ENDPOINT}`;

                const payload: SDKEvaluateRequest = {
                    image: cleanedBase64
                };

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), SDK_TIMEOUT);

                let response;

                if (needsProxy(fullUrl)) {
                    // Use proxy for external endpoints
                    response = await fetch('/api/sdk-proxy', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            endpoint: fullUrl,
                            payload: payload
                        }),
                        signal: controller.signal
                    });
                } else {
                    // Direct call for localhost
                    response = await fetch(fullUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload),
                        signal: controller.signal
                    });
                }

                clearTimeout(timeoutId);

                if (!response.ok) {
                    return {
                        diagnostic: `Error ${response.status}: ${response.statusText}`
                    };
                }

                const result = await response.json();
                return {
                    diagnostic: result.diagnostic || `Evaluated with ${tag}`,
                    rawResponse: result
                };
            } catch (error) {
                if (error instanceof Error) {
                    if (error.name === 'AbortError') {
                        return {
                            diagnostic: `Timeout: ${tag} not responding`
                        };
                    }
                    return {
                        diagnostic: `Connection error: ${error.message}`
                    };
                }
                return {
                    diagnostic: `Unknown error in ${tag}`
                };
            }
        },
        [cleanBase64]
    );

    // Function to evaluate with SaaS using direct base64
    const evaluateWithSaaS = useCallback(
        async (
            imageBase64: string
        ): Promise<{
            diagnostic: string;
            rawResponse?: EvaluatePassiveLivenessResponse;
        }> => {
            try {
                const cleanedBase64 = cleanBase64(imageBase64);

                if (!apiKey.trim()) {
                    return {
                        diagnostic:
                            'Error: API key not configured. Configure the API key using the "API Key" button in the sidebar.'
                    };
                }

                const livenessService = createLivenessServiceWithApiKey(apiKey);

                const response = await livenessService.evaluatePassiveLiveness({
                    imageBuffer: cleanedBase64
                });

                return {
                    diagnostic: response.serviceResultLog || 'No diagnostic available',
                    rawResponse: response
                };
            } catch (error) {
                if (error instanceof LivenessApiError) {
                    return { diagnostic: `Error: ${error.message}` };
                }
                return {
                    diagnostic: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                };
            }
        },
        [cleanBase64, apiKey]
    );

    // Function to evaluate with SaaS using file
    const evaluateFileWithSaaS = useCallback(
        async (
            file: File
        ): Promise<{
            diagnostic: string;
            rawResponse?: EvaluatePassiveLivenessResponse;
        }> => {
            try {
                const imageBase64 = await convertImageToBase64(file);
                return await evaluateWithSaaS(imageBase64);
            } catch (error) {
                if (error instanceof LivenessApiError) {
                    return { diagnostic: `Error: ${error.message}` };
                }
                return {
                    diagnostic: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                };
            }
        },
        [convertImageToBase64, evaluateWithSaaS]
    );

    // Function to format file size
    const formatFileSize = useCallback((bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }, []);

    // Function to get active SDK endpoints
    const getActiveSDKEndpoints = useCallback(() => {
        return userEndpoints.filter(
            (endpoint) => selectedSDKEndpoints.includes(endpoint.id) && endpoint.isActive
        );
    }, [userEndpoints, selectedSDKEndpoints]);

    // Function to process an individual image from file
    const processImage = useCallback(
        async (file: File): Promise<LivenessResult> => {
            try {
                const imageInfo = await getImageInfo(file);
                const imageUrl = URL.createObjectURL(file);
                const imageBase64 = await convertImageToBase64(file);

                const title = file.name.split('.')[0];

                const result: LivenessResult = {
                    title,
                    imagePath: file.name,
                    imageUrl,
                    resolution: `${imageInfo.width} x ${imageInfo.height}`,
                    size: formatFileSize(imageInfo.size),
                    imageInfo
                };

                // Evaluate with SaaS (always enabled)
                try {
                    const saasResult = await evaluateFileWithSaaS(file);
                    result.diagnosticSaaS = saasResult.diagnostic;
                    result.rawResponse = saasResult.rawResponse;
                } catch (error) {
                    result.diagnosticSaaS = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
                }

                // Evaluate with SDK if enabled
                if (useSDK) {
                    const activeEndpoints = getActiveSDKEndpoints();
                    result.sdkDiagnostics = {};
                    result.sdkRawResponses = {};

                    for (const endpoint of activeEndpoints) {
                        try {
                            const sdkResult = await evaluateWithSDK(
                                imageBase64,
                                endpoint.url,
                                endpoint.tag
                            );
                            result.sdkDiagnostics[endpoint.tag] = sdkResult.diagnostic;
                            if (sdkResult.rawResponse) {
                                result.sdkRawResponses[endpoint.tag] = sdkResult.rawResponse;
                            }
                        } catch (error) {
                            result.sdkDiagnostics[endpoint.tag] =
                                `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
                        }
                    }
                }

                return result;
            } catch (error) {
                return {
                    title: file.name,
                    imagePath: file.name,
                    resolution: 'N/A',
                    size: 'N/A',
                    diagnosticSaaS: 'Error processing',
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        },
        [
            getImageInfo,
            formatFileSize,
            evaluateFileWithSaaS,
            convertImageToBase64,
            useSDK,
            getActiveSDKEndpoints,
            evaluateWithSDK
        ]
    );

    // Function to process base64 directly
    const processBase64 = useCallback(
        async (base64String: string, index: number): Promise<LivenessResult> => {
            try {
                const imageInfo = await getImageInfoFromBase64(base64String, index);
                const cleanedBase64 = cleanBase64(base64String);
                const imageUrl = `data:image/jpeg;base64,${cleanedBase64}`;

                const title = `Base64_${index + 1}`;

                const result: LivenessResult = {
                    title,
                    imagePath: imageInfo.name,
                    imageUrl,
                    resolution: `${imageInfo.width} x ${imageInfo.height}`,
                    size: formatFileSize(imageInfo.size),
                    imageInfo
                };

                // Evaluate with SaaS (always enabled)
                try {
                    const saasResult = await evaluateWithSaaS(base64String);
                    result.diagnosticSaaS = saasResult.diagnostic;
                    result.rawResponse = saasResult.rawResponse;
                } catch (error) {
                    result.diagnosticSaaS = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
                }

                // Evaluate with SDK if enabled
                if (useSDK) {
                    const activeEndpoints = getActiveSDKEndpoints();
                    result.sdkDiagnostics = {};
                    result.sdkRawResponses = {};

                    for (const endpoint of activeEndpoints) {
                        try {
                            const sdkResult = await evaluateWithSDK(
                                base64String,
                                endpoint.url,
                                endpoint.tag
                            );
                            result.sdkDiagnostics[endpoint.tag] = sdkResult.diagnostic;
                            if (sdkResult.rawResponse) {
                                result.sdkRawResponses[endpoint.tag] = sdkResult.rawResponse;
                            }
                        } catch (error) {
                            result.sdkDiagnostics[endpoint.tag] =
                                `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
                        }
                    }
                }

                return result;
            } catch (error) {
                return {
                    title: `Base64_${index + 1}`,
                    imagePath: `base64_image_${index + 1}`,
                    resolution: 'N/A',
                    size: 'N/A',
                    diagnosticSaaS: 'Error processing base64',
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        },
        [
            getImageInfoFromBase64,
            cleanBase64,
            formatFileSize,
            evaluateWithSaaS,
            useSDK,
            getActiveSDKEndpoints,
            evaluateWithSDK
        ]
    );

    // Main function to evaluate images from files
    const evaluateImages = useCallback(
        async (files: File[]) => {
            // Filter only valid image files
            const validFiles = files.filter((file) => {
                const extension = '.' + file.name.split('.').pop()?.toLowerCase();
                return VALID_IMAGE_EXTENSIONS.includes(extension);
            });

            if (validFiles.length === 0) {
                toast.error('Error', {
                    description: 'No valid image files found'
                });
                return;
            }

            setLoading(true);
            setError(null);
            setResults([]);

            try {
                const startTime = Date.now();

                toast.info('Processing', {
                    description: `Evaluating ${validFiles.length} image${validFiles.length > 1 ? 's' : ''}...`
                });

                // Process images sequentially to avoid API limits
                const results: LivenessResult[] = [];
                for (const file of validFiles) {
                    const result = await processImage(file);
                    results.push(result);
                }

                // Sort results by title
                results.sort((a, b) => a.title.localeCompare(b.title));
                setResults(results);

                const elapsed = (Date.now() - startTime) / 1000;
                toast.success('Evaluation completed', {
                    description: `${results.length} image${results.length > 1 ? 's' : ''} processed in ${elapsed.toFixed(1)}s`
                });
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error during evaluation';
                setError(errorMessage);
                toast.error('Error', {
                    description: errorMessage
                });
            } finally {
                setLoading(false);
            }
        },
        [processImage]
    );

    // Main function to evaluate base64s directly
    const evaluateBase64Images = useCallback(
        async (base64Strings: string[]) => {
            if (base64Strings.length === 0) {
                toast.error('Error', {
                    description: 'No valid base64 provided'
                });
                return;
            }

            setLoading(true);
            setError(null);
            setResults([]);

            try {
                const startTime = Date.now();

                toast.info('Processing', {
                    description: `Evaluating ${base64Strings.length} base64${base64Strings.length > 1 ? 's' : ''}...`
                });

                // Process base64s sequentially to avoid API limits
                const results: LivenessResult[] = [];
                for (let i = 0; i < base64Strings.length; i++) {
                    const result = await processBase64(base64Strings[i], i);
                    results.push(result);
                }

                // Sort results by title
                results.sort((a, b) => a.title.localeCompare(b.title));
                setResults(results);

                const elapsed = (Date.now() - startTime) / 1000;
                toast.success('Evaluation completed', {
                    description: `${results.length} base64${results.length > 1 ? 's' : ''} processed in ${elapsed.toFixed(1)}s`
                });
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error during evaluation';
                setError(errorMessage);
                toast.error('Error', {
                    description: errorMessage
                });
            } finally {
                setLoading(false);
            }
        },
        [processBase64]
    );

    // Function to clear results
    const clearResults = useCallback(() => {
        // Clean object URLs to avoid memory leaks
        results.forEach((result) => {
            if (result.imageUrl && result.imageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(result.imageUrl);
            }
        });

        setResults([]);
        setError(null);

        toast.info('Results cleared', {
            description: 'All data has been cleared for a new evaluation'
        });
    }, [results]);

    // Function to check if a file is a valid image
    const isValidImageFile = useCallback((file: File): boolean => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        return VALID_IMAGE_EXTENSIONS.includes(extension);
    }, []);

    // Function to validate base64
    const validateBase64 = useCallback((base64String: string): boolean => {
        try {
            // Clean base64 (remove spaces and line breaks)
            const cleanString = base64String.replace(/\s/g, '');

            // Check if it has data:image prefix
            const base64WithoutPrefix = cleanString.startsWith('data:image/')
                ? cleanString.split(',')[1]
                : cleanString;

            // Validate that it's valid base64
            const decoded = atob(base64WithoutPrefix);
            return decoded.length > 0;
        } catch (error) {
            return false;
        }
    }, []);

    return {
        loading,
        results,
        error,
        evaluateImages,
        evaluateBase64Images,
        clearResults,
        isValidImageFile,
        validateBase64,
        supportedExtensions: VALID_IMAGE_EXTENSIONS,
        useSDK,
        setUseSDK,
        selectedSDKEndpoints,
        setSelectedSDKEndpoints,
        checkSDKEndpointStatus,
        getActiveSDKEndpoints
    };
};
