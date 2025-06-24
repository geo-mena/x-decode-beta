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
    SDKEvaluateResponse,
    SDKEndpointInfo
} from '@/types/liveness';

const VALID_IMAGE_EXTENSIONS = [
    '.jpg',
    '.jpeg',
    '.png',
    '.bmp',
    '.gif',
    '.webp'
];

// SDK Configuration
const SDK_ENDPOINT = '/api/v1/selphid/passive-liveness/evaluate';
const SDK_TIMEOUT = 10000; // 10 seconds

export const useLivenessEvaluator = () => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<LivenessResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [useSDK, setUseSDK] = useState(false);
    const [selectedSDKEndpoints, setSelectedSDKEndpoints] = useState<string[]>([]);
    const { apiKey, userEndpoints } = usePlaygroundStore();

    // Función para convertir imagen a base64
    const convertImageToBase64 = useCallback((file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    // Remover el prefijo data:image/...;base64,
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                } else {
                    reject(new Error('Error al convertir imagen a base64'));
                }
            };
            reader.onerror = () =>
                reject(new Error('Error al leer el archivo'));
            reader.readAsDataURL(file);
        });
    }, []);

    // Función para limpiar base64 (remover prefijos si existen)
    const cleanBase64 = useCallback((base64String: string): string => {
        const trimmed = base64String.trim();

        // Si tiene prefijo data:image, removerlo
        if (trimmed.startsWith('data:image/')) {
            return trimmed.split(',')[1];
        }

        return trimmed;
    }, []);

    // Función para obtener información de imagen desde base64
    const getImageInfoFromBase64 = useCallback(
        (base64String: string, index: number): Promise<ImageInfo> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                const cleanedBase64 = cleanBase64(base64String);
                const dataUrl = `data:image/jpeg;base64,${cleanedBase64}`;

                img.onload = () => {
                    // Calcular tamaño aproximado del base64
                    const base64Length = cleanedBase64.length;
                    const sizeInBytes = Math.floor(base64Length * 0.75); // Aproximación del tamaño real

                    resolve({
                        width: img.width,
                        height: img.height,
                        size: sizeInBytes,
                        name: `base64_image_${index + 1}.jpg`,
                        type: 'image/jpeg' // Asumimos JPEG por defecto
                    });
                };

                img.onerror = () => {
                    reject(new Error('Error al cargar la imagen desde base64'));
                };

                img.src = dataUrl;
            });
        },
        [cleanBase64]
    );

    // Función para obtener información de la imagen desde archivo
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
                reject(new Error('Error al cargar la imagen'));
                URL.revokeObjectURL(url);
            };

            img.src = url;
        });
    }, []);

    // Función para verificar si un endpoint SDK está activo
    const checkSDKEndpointStatus = useCallback(async (url: string): Promise<boolean> => {
        try {
            // Verificación básica de formato de URL
            const urlObj = new URL(url);
            
            // Si la URL tiene un formato válido y un protocolo HTTP/HTTPS, marcarla como activa
            if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
                return true;
            }
            
            return false;
        } catch (error) {
            // Si no es una URL válida, marcarla como inactiva
            return false;
        }
    }, []);

    // Función para evaluar con SDK
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

                const response = await fetch(fullUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    return {
                        diagnostic: `Error ${response.status}: ${response.statusText}`
                    };
                }

                const result = await response.json();
                return {
                    diagnostic: result.diagnostic || `Evaluado con ${tag}`,
                    rawResponse: result
                };
            } catch (error) {
                if (error instanceof Error) {
                    if (error.name === 'AbortError') {
                        return {
                            diagnostic: `Timeout: ${tag} no responde`
                        };
                    }
                    return {
                        diagnostic: `Error de conexión: ${error.message}`
                    };
                }
                return {
                    diagnostic: `Error desconocido en ${tag}`
                };
            }
        },
        [cleanBase64]
    );

    // Función para evaluar con SaaS usando base64 directo
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
                            'Error: API key no configurada. Configure la API key usando el botón "API Key" en la barra lateral.'
                    };
                }

                const livenessService = createLivenessServiceWithApiKey(apiKey);

                const response = await livenessService.evaluatePassiveLiveness({
                    imageBuffer: cleanedBase64
                });

                return {
                    diagnostic:
                        response.serviceResultLog ||
                        'Sin diagnóstico disponible',
                    rawResponse: response
                };
            } catch (error) {
                if (error instanceof LivenessApiError) {
                    return { diagnostic: `Error: ${error.message}` };
                }
                return {
                    diagnostic: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
                };
            }
        },
        [cleanBase64, apiKey]
    );

    // Función para evaluar con SaaS usando archivo
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
                    diagnostic: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
                };
            }
        },
        [convertImageToBase64, evaluateWithSaaS]
    );

    // Función para formatear el tamaño del archivo
    const formatFileSize = useCallback((bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }, []);

    // Función para obtener endpoints SDK activos
    const getActiveSDKEndpoints = useCallback(() => {
        return userEndpoints.filter(endpoint => 
            selectedSDKEndpoints.includes(endpoint.id) && endpoint.isActive
        );
    }, [userEndpoints, selectedSDKEndpoints]);

    // Función para procesar una imagen individual desde archivo
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

                // Evaluar con SaaS (siempre habilitado)
                try {
                    const saasResult = await evaluateFileWithSaaS(file);
                    result.diagnosticSaaS = saasResult.diagnostic;
                    result.rawResponse = saasResult.rawResponse;
                } catch (error) {
                    result.diagnosticSaaS = `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
                }

                // Evaluar con SDK si está habilitado
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
                            result.sdkDiagnostics[endpoint.tag] = `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
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
                    diagnosticSaaS: 'Error al procesar',
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Error desconocido'
                };
            }
        },
        [getImageInfo, formatFileSize, evaluateFileWithSaaS, convertImageToBase64, useSDK, getActiveSDKEndpoints, evaluateWithSDK]
    );

    // Función para procesar base64 directamente
    const processBase64 = useCallback(
        async (
            base64String: string,
            index: number
        ): Promise<LivenessResult> => {
            try {
                const imageInfo = await getImageInfoFromBase64(
                    base64String,
                    index
                );
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

                // Evaluar con SaaS (siempre habilitado)
                try {
                    const saasResult = await evaluateWithSaaS(base64String);
                    result.diagnosticSaaS = saasResult.diagnostic;
                    result.rawResponse = saasResult.rawResponse;
                } catch (error) {
                    result.diagnosticSaaS = `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
                }

                // Evaluar con SDK si está habilitado
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
                            result.sdkDiagnostics[endpoint.tag] = `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
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
                    diagnosticSaaS: 'Error al procesar base64',
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Error desconocido'
                };
            }
        },
        [getImageInfoFromBase64, cleanBase64, formatFileSize, evaluateWithSaaS, useSDK, getActiveSDKEndpoints, evaluateWithSDK]
    );

    // Función principal para evaluar imágenes desde archivos
    const evaluateImages = useCallback(
        async (files: File[], isDirectory: boolean = false) => {
            // Filtrar solo archivos de imagen válidos
            const validFiles = files.filter((file) => {
                const extension =
                    '.' + file.name.split('.').pop()?.toLowerCase();
                return VALID_IMAGE_EXTENSIONS.includes(extension);
            });

            if (validFiles.length === 0) {
                toast.error('Error', {
                    description: 'No se encontraron archivos de imagen válidos'
                });
                return;
            }

            setLoading(true);
            setError(null);
            setResults([]);

            try {
                const startTime = Date.now();

                toast.info('Procesando', {
                    description: `Evaluando ${validFiles.length} imagen${validFiles.length > 1 ? 'es' : ''}...`
                });

                // Procesar imágenes secuencialmente para evitar límites de API
                const results: LivenessResult[] = [];
                for (const file of validFiles) {
                    const result = await processImage(file);
                    results.push(result);
                }

                // Ordenar resultados por título
                results.sort((a, b) => a.title.localeCompare(b.title));
                setResults(results);

                const elapsed = (Date.now() - startTime) / 1000;
                toast.success('Evaluación completada', {
                    description: `${results.length} imagen${results.length > 1 ? 'es' : ''} procesada${results.length > 1 ? 's' : ''} en ${elapsed.toFixed(1)}s`
                });
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'Error desconocido durante la evaluación';
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

    // Función principal para evaluar base64s directamente
    const evaluateBase64Images = useCallback(
        async (base64Strings: string[]) => {
            if (base64Strings.length === 0) {
                toast.error('Error', {
                    description: 'No se proporcionaron base64 válidos'
                });
                return;
            }

            setLoading(true);
            setError(null);
            setResults([]);

            try {
                const startTime = Date.now();

                toast.info('Procesando', {
                    description: `Evaluando ${base64Strings.length} base64${base64Strings.length > 1 ? 's' : ''}...`
                });

                // Procesar base64s secuencialmente para evitar límites de API
                const results: LivenessResult[] = [];
                for (let i = 0; i < base64Strings.length; i++) {
                    const result = await processBase64(base64Strings[i], i);
                    results.push(result);
                }

                // Ordenar resultados por título
                results.sort((a, b) => a.title.localeCompare(b.title));
                setResults(results);

                const elapsed = (Date.now() - startTime) / 1000;
                toast.success('Evaluación completada', {
                    description: `${results.length} base64${results.length > 1 ? 's' : ''} procesado${results.length > 1 ? 's' : ''} en ${elapsed.toFixed(1)}s`
                });
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'Error desconocido durante la evaluación';
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

    // Función para limpiar resultados
    const clearResults = useCallback(() => {
        // Limpiar URLs de objeto para evitar memory leaks
        results.forEach((result) => {
            if (result.imageUrl && result.imageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(result.imageUrl);
            }
        });

        setResults([]);
        setError(null);

        toast.info('Resultados limpiados', {
            description:
                'Todos los datos han sido borrados para una nueva evaluación'
        });
    }, [results]);

    // Función para verificar si un archivo es una imagen válida
    const isValidImageFile = useCallback((file: File): boolean => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        return VALID_IMAGE_EXTENSIONS.includes(extension);
    }, []);

    // Función para validar base64
    const validateBase64 = useCallback((base64String: string): boolean => {
        try {
            // Limpiar el base64 (remover espacios y saltos de línea)
            const cleanString = base64String.replace(/\s/g, '');

            // Verificar si tiene el prefijo data:image
            const base64WithoutPrefix = cleanString.startsWith('data:image/')
                ? cleanString.split(',')[1]
                : cleanString;

            // Validar que sea base64 válido
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
        // SDK related functions and state
        useSDK,
        setUseSDK,
        selectedSDKEndpoints,
        setSelectedSDKEndpoints,
        checkSDKEndpointStatus,
        getActiveSDKEndpoints
    };
};
