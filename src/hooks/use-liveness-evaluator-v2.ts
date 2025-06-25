import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { usePlaygroundStore } from '@/store';
import { createLivenessServiceWithApiKey } from '@/lib/identity-api/liveness.service';
import {
    LivenessResult,
    ImageInfo,
    EvaluatePassiveLivenessResponse,
    LivenessApiError
} from '@/types/liveness';

// =================== CONSTANTS ===================
const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'] as const;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_BASE64_SIZE_MB = 15; // Base64 es ~33% más grande
const MAX_BASE64_SIZE_BYTES = MAX_BASE64_SIZE_MB * 1024 * 1024;
const MAX_CONCURRENT_EVALUATIONS = 3;
const IMAGE_LOAD_TIMEOUT_MS = 30000;
const API_REQUEST_TIMEOUT_MS = 60000;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE_MS = 1000;
const MIN_IMAGE_DIMENSION = 50;
const MAX_IMAGE_DIMENSION = 8192;
const VALID_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/bmp',
    'image/gif',
    'image/webp'
] as const;

// =================== TYPES ===================
type ProcessingError = {
    code: string;
    message: string;
    details?: string;
    retryable?: boolean;
};

type ValidationResult = {
    isValid: boolean;
    error?: ProcessingError;
};

type ProcessingContext = {
    startTime: number;
    totalItems: number;
    processedItems: number;
    abortController: AbortController;
};

// =================== ROBUST HOOK ===================
export const useLivenessEvaluator = () => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<LivenessResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { apiKey } = usePlaygroundStore();

    // Refs para cleanup y abort
    const abortControllerRef = useRef<AbortController | null>(null);
    const pendingImageUrlsRef = useRef<Set<string>>(new Set());
    const processingContextRef = useRef<ProcessingContext | null>(null);

    // =================== UTILITY FUNCTIONS ===================

    const createProcessingError = useCallback(
        (code: string, message: string, details?: string, retryable = false): ProcessingError => ({
            code,
            message,
            details,
            retryable
        }),
        []
    );

    const sleep = useCallback(
        (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms)),
        []
    );

    const withTimeout = useCallback(
        <T>(
            promise: Promise<T>,
            timeoutMs: number,
            errorMessage = 'Operation timed out'
        ): Promise<T> => {
            return Promise.race([
                promise,
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
                )
            ]);
        },
        []
    );

    const retryWithBackoff = useCallback(
        async <T>(
            operation: () => Promise<T>,
            maxAttempts = MAX_RETRY_ATTEMPTS,
            baseDelayMs = RETRY_DELAY_BASE_MS
        ): Promise<T> => {
            let lastError: Error;

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    return await operation();
                } catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));

                    if (attempt === maxAttempts) break;

                    // No retry en ciertos errores
                    if (error instanceof LivenessApiError && error.message.includes('401')) {
                        break;
                    }

                    const delay = baseDelayMs * Math.pow(2, attempt - 1);
                    await sleep(delay);
                }
            }

            throw lastError!;
        },
        [sleep]
    );

    // =================== VALIDATION FUNCTIONS ===================

    const validateApiKey = useCallback((): ValidationResult => {
        if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
            return {
                isValid: false,
                error: createProcessingError(
                    'INVALID_API_KEY',
                    'API key no configurada o inválida',
                    'Configure la API key usando el botón "API Key" en la barra lateral'
                )
            };
        }
        return { isValid: true };
    }, [apiKey, createProcessingError]);

    const validateFile = useCallback(
        (file: File): ValidationResult => {
            // Validar que sea un objeto File válido
            if (!file || !(file instanceof File)) {
                return {
                    isValid: false,
                    error: createProcessingError('INVALID_FILE', 'Archivo no válido')
                };
            }

            // Validar extensión
            const extension = '.' + file.name.split('.').pop()?.toLowerCase();
            if (!VALID_IMAGE_EXTENSIONS.includes(extension as any)) {
                return {
                    isValid: false,
                    error: createProcessingError(
                        'INVALID_EXTENSION',
                        `Extensión no válida: ${extension}`,
                        `Solo se admiten: ${VALID_IMAGE_EXTENSIONS.join(', ')}`
                    )
                };
            }

            // Validar tipo MIME
            if (!VALID_MIME_TYPES.includes(file.type as any)) {
                return {
                    isValid: false,
                    error: createProcessingError(
                        'INVALID_MIME_TYPE',
                        `Tipo MIME no válido: ${file.type}`,
                        `Solo se admiten: ${VALID_MIME_TYPES.join(', ')}`
                    )
                };
            }

            // Validar tamaño
            if (file.size > MAX_FILE_SIZE_BYTES) {
                return {
                    isValid: false,
                    error: createProcessingError(
                        'FILE_TOO_LARGE',
                        `Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
                        `Tamaño máximo permitido: ${MAX_FILE_SIZE_MB}MB`
                    )
                };
            }

            if (file.size === 0) {
                return {
                    isValid: false,
                    error: createProcessingError('EMPTY_FILE', 'El archivo está vacío')
                };
            }

            return { isValid: true };
        },
        [createProcessingError]
    );

    const validateBase64 = useCallback(
        (base64String: string): ValidationResult => {
            if (!base64String || typeof base64String !== 'string') {
                return {
                    isValid: false,
                    error: createProcessingError('INVALID_BASE64', 'Base64 no válido o vacío')
                };
            }

            try {
                // Limpiar y validar estructura
                const cleanString = base64String.replace(/\s/g, '');

                if (cleanString.length === 0) {
                    return {
                        isValid: false,
                        error: createProcessingError('EMPTY_BASE64', 'Base64 está vacío')
                    };
                }

                // Validar tamaño aproximado
                const estimatedSize = cleanString.length * 0.75; // Aprox. tamaño real
                if (estimatedSize > MAX_BASE64_SIZE_BYTES) {
                    return {
                        isValid: false,
                        error: createProcessingError(
                            'BASE64_TOO_LARGE',
                            `Base64 demasiado grande: ~${(estimatedSize / 1024 / 1024).toFixed(2)}MB`,
                            `Tamaño máximo permitido: ${MAX_BASE64_SIZE_MB}MB`
                        )
                    };
                }

                // Verificar prefijo data:image si existe
                let base64WithoutPrefix = cleanString;
                if (cleanString.startsWith('data:')) {
                    const parts = cleanString.split(',');
                    if (parts.length !== 2) {
                        return {
                            isValid: false,
                            error: createProcessingError(
                                'MALFORMED_DATA_URL',
                                'Data URL malformada'
                            )
                        };
                    }

                    const header = parts[0];
                    if (!header.includes('image/')) {
                        return {
                            isValid: false,
                            error: createProcessingError(
                                'NOT_IMAGE_DATA_URL',
                                'Data URL no es de imagen'
                            )
                        };
                    }

                    base64WithoutPrefix = parts[1];
                }

                // Validar caracteres base64
                const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
                if (!base64Regex.test(base64WithoutPrefix)) {
                    return {
                        isValid: false,
                        error: createProcessingError(
                            'INVALID_BASE64_CHARS',
                            'Caracteres inválidos en base64'
                        )
                    };
                }

                // Intentar decodificar
                const decoded = atob(base64WithoutPrefix);
                if (decoded.length === 0) {
                    return {
                        isValid: false,
                        error: createProcessingError(
                            'EMPTY_DECODED_BASE64',
                            'Base64 decodificado está vacío'
                        )
                    };
                }

                return { isValid: true };
            } catch (error) {
                return {
                    isValid: false,
                    error: createProcessingError(
                        'BASE64_DECODE_ERROR',
                        'Error al decodificar base64',
                        error instanceof Error ? error.message : String(error)
                    )
                };
            }
        },
        [createProcessingError]
    );

    // =================== CORE PROCESSING FUNCTIONS ===================

    const cleanBase64 = useCallback((base64String: string): string => {
        const trimmed = base64String.trim().replace(/\s/g, '');

        if (trimmed.startsWith('data:image/')) {
            const parts = trimmed.split(',');
            return parts.length === 2 ? parts[1] : trimmed;
        }

        return trimmed;
    }, []);

    const convertImageToBase64 = useCallback(
        async (file: File): Promise<string> => {
            const validation = validateFile(file);
            if (!validation.isValid) {
                throw new Error(validation.error!.message);
            }

            return withTimeout(
                new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();

                    reader.onload = () => {
                        try {
                            if (typeof reader.result === 'string') {
                                const base64 = reader.result.split(',')[1];
                                if (!base64) {
                                    reject(new Error('No se pudo extraer base64 del archivo'));
                                    return;
                                }
                                resolve(base64);
                            } else {
                                reject(new Error('Resultado de FileReader no es string'));
                            }
                        } catch (error) {
                            reject(new Error(`Error procesando FileReader: ${error}`));
                        }
                    };

                    reader.onerror = () => reject(new Error('Error leyendo archivo'));
                    reader.onabort = () => reject(new Error('Lectura de archivo abortada'));

                    try {
                        reader.readAsDataURL(file);
                    } catch (error) {
                        reject(new Error(`Error iniciando lectura: ${error}`));
                    }
                }),
                IMAGE_LOAD_TIMEOUT_MS,
                'Timeout convirtiendo imagen a base64'
            );
        },
        [validateFile, withTimeout]
    );

    const getImageInfoFromBase64 = useCallback(
        async (base64String: string, index: number): Promise<ImageInfo> => {
            const validation = validateBase64(base64String);
            if (!validation.isValid) {
                throw new Error(validation.error!.message);
            }

            const cleanedBase64 = cleanBase64(base64String);
            const dataUrl = `data:image/jpeg;base64,${cleanedBase64}`;

            return withTimeout(
                new Promise<ImageInfo>((resolve, reject) => {
                    const img = new Image();

                    img.onload = () => {
                        try {
                            // Validar dimensiones
                            if (
                                img.width < MIN_IMAGE_DIMENSION ||
                                img.height < MIN_IMAGE_DIMENSION
                            ) {
                                reject(
                                    new Error(
                                        `Imagen demasiado pequeña: ${img.width}x${img.height}px (mínimo: ${MIN_IMAGE_DIMENSION}px)`
                                    )
                                );
                                return;
                            }

                            if (
                                img.width > MAX_IMAGE_DIMENSION ||
                                img.height > MAX_IMAGE_DIMENSION
                            ) {
                                reject(
                                    new Error(
                                        `Imagen demasiado grande: ${img.width}x${img.height}px (máximo: ${MAX_IMAGE_DIMENSION}px)`
                                    )
                                );
                                return;
                            }

                            const base64Length = cleanedBase64.length;
                            const sizeInBytes = Math.floor(base64Length * 0.75);

                            resolve({
                                width: img.width,
                                height: img.height,
                                size: sizeInBytes,
                                name: `base64_image_${index + 1}.jpg`,
                                type: 'image/jpeg'
                            });
                        } catch (error) {
                            reject(new Error(`Error procesando imagen: ${error}`));
                        }
                    };

                    img.onerror = () => reject(new Error('Error cargando imagen desde base64'));
                    img.onabort = () => reject(new Error('Carga de imagen abortada'));

                    try {
                        img.src = dataUrl;
                    } catch (error) {
                        reject(new Error(`Error asignando src a imagen: ${error}`));
                    }
                }),
                IMAGE_LOAD_TIMEOUT_MS,
                'Timeout obteniendo info de imagen desde base64'
            );
        },
        [validateBase64, cleanBase64, withTimeout]
    );

    const getImageInfo = useCallback(
        async (file: File): Promise<ImageInfo> => {
            const validation = validateFile(file);
            if (!validation.isValid) {
                throw new Error(validation.error!.message);
            }

            let objectUrl: string | null = null;

            try {
                objectUrl = URL.createObjectURL(file);
                pendingImageUrlsRef.current.add(objectUrl);

                const imageInfo = await withTimeout(
                    new Promise<ImageInfo>((resolve, reject) => {
                        const img = new Image();

                        img.onload = () => {
                            try {
                                // Validar dimensiones
                                if (
                                    img.width < MIN_IMAGE_DIMENSION ||
                                    img.height < MIN_IMAGE_DIMENSION
                                ) {
                                    reject(
                                        new Error(
                                            `Imagen demasiado pequeña: ${img.width}x${img.height}px`
                                        )
                                    );
                                    return;
                                }

                                if (
                                    img.width > MAX_IMAGE_DIMENSION ||
                                    img.height > MAX_IMAGE_DIMENSION
                                ) {
                                    reject(
                                        new Error(
                                            `Imagen demasiado grande: ${img.width}x${img.height}px`
                                        )
                                    );
                                    return;
                                }

                                resolve({
                                    width: img.width,
                                    height: img.height,
                                    size: file.size,
                                    name: file.name,
                                    type: file.type
                                });
                            } catch (error) {
                                reject(new Error(`Error procesando imagen: ${error}`));
                            }
                        };

                        img.onerror = () => reject(new Error('Error cargando imagen'));
                        img.onabort = () => reject(new Error('Carga de imagen abortada'));

                        try {
                            img.src = objectUrl!;
                        } catch (error) {
                            reject(new Error(`Error asignando src: ${error}`));
                        }
                    }),
                    IMAGE_LOAD_TIMEOUT_MS,
                    'Timeout obteniendo info de imagen'
                );

                return imageInfo;
            } finally {
                if (objectUrl) {
                    URL.revokeObjectURL(objectUrl);
                    pendingImageUrlsRef.current.delete(objectUrl);
                }
            }
        },
        [validateFile, withTimeout]
    );

    const evaluateWithSaaS = useCallback(
        async (
            imageBase64: string
        ): Promise<{
            diagnostic: string;
            rawResponse?: EvaluatePassiveLivenessResponse;
        }> => {
            const apiValidation = validateApiKey();
            if (!apiValidation.isValid) {
                return { diagnostic: `Error: ${apiValidation.error!.message}` };
            }

            const base64Validation = validateBase64(imageBase64);
            if (!base64Validation.isValid) {
                return {
                    diagnostic: `Error: ${base64Validation.error!.message}`
                };
            }

            try {
                const cleanedBase64 = cleanBase64(imageBase64);
                const livenessService = createLivenessServiceWithApiKey(apiKey!);

                const response = await retryWithBackoff(async () => {
                    return withTimeout(
                        livenessService.evaluatePassiveLiveness({
                            imageBuffer: cleanedBase64
                        }),
                        API_REQUEST_TIMEOUT_MS,
                        'Timeout en evaluación SaaS'
                    );
                });

                return {
                    diagnostic: response.serviceResultLog || 'Sin diagnóstico disponible',
                    rawResponse: response
                };
            } catch (error) {
                if (error instanceof LivenessApiError) {
                    return { diagnostic: `Error API: ${error.message}` };
                }
                return {
                    diagnostic: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
                };
            }
        },
        [validateApiKey, validateBase64, cleanBase64, apiKey, retryWithBackoff, withTimeout]
    );

    const formatFileSize = useCallback((bytes: number): string => {
        if (!Number.isFinite(bytes) || bytes < 0) return 'N/A';
        if (bytes === 0) return '0 B';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }, []);

    // =================== PROCESSING FUNCTIONS ===================

    const processImage = useCallback(
        async (file: File): Promise<LivenessResult> => {
            const startTime = Date.now();
            let imageUrl: string | null = null;

            try {
                const imageInfo = await getImageInfo(file);
                imageUrl = URL.createObjectURL(file);
                pendingImageUrlsRef.current.add(imageUrl);

                const title = file.name.split('.')[0] || 'unnamed';

                const result: LivenessResult = {
                    title,
                    imagePath: file.name,
                    imageUrl,
                    resolution: `${imageInfo.width} x ${imageInfo.height}`,
                    size: formatFileSize(imageInfo.size),
                    imageInfo
                };

                // Evaluar con SaaS
                try {
                    const imageBase64 = await convertImageToBase64(file);
                    const saasResult = await evaluateWithSaaS(imageBase64);
                    result.diagnosticSaaS = saasResult.diagnostic;
                    result.rawResponse = saasResult.rawResponse;
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
                    result.diagnosticSaaS = `Error: ${errorMsg}`;
                    result.error = errorMsg;
                }

                const elapsed = Date.now() - startTime;
                console.log(`Processed image ${file.name} in ${elapsed}ms`);

                return result;
            } catch (error) {
                if (imageUrl) {
                    URL.revokeObjectURL(imageUrl);
                    pendingImageUrlsRef.current.delete(imageUrl);
                }

                const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
                return {
                    title: file.name || 'unnamed',
                    imagePath: file.name || 'unknown',
                    resolution: 'N/A',
                    size: 'N/A',
                    diagnosticSaaS: `Error al procesar: ${errorMsg}`,
                    error: errorMsg
                };
            }
        },
        [getImageInfo, formatFileSize, convertImageToBase64, evaluateWithSaaS]
    );

    const processBase64 = useCallback(
        async (base64String: string, index: number): Promise<LivenessResult> => {
            const startTime = Date.now();

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

                // Evaluar con SaaS
                try {
                    const saasResult = await evaluateWithSaaS(base64String);
                    result.diagnosticSaaS = saasResult.diagnostic;
                    result.rawResponse = saasResult.rawResponse;
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
                    result.diagnosticSaaS = `Error: ${errorMsg}`;
                    result.error = errorMsg;
                }

                const elapsed = Date.now() - startTime;
                console.log(`Processed base64 ${index + 1} in ${elapsed}ms`);

                return result;
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
                return {
                    title: `Base64_${index + 1}`,
                    imagePath: `base64_image_${index + 1}`,
                    resolution: 'N/A',
                    size: 'N/A',
                    diagnosticSaaS: `Error al procesar base64: ${errorMsg}`,
                    error: errorMsg
                };
            }
        },
        [getImageInfoFromBase64, cleanBase64, formatFileSize, evaluateWithSaaS]
    );

    // =================== PUBLIC API FUNCTIONS ===================

    const evaluateImages = useCallback(
        async (files: File[], isDirectory: boolean = false) => {
            // Validaciones de entrada
            if (!Array.isArray(files)) {
                toast.error('Error', {
                    description: 'Lista de archivos inválida'
                });
                return;
            }

            if (files.length === 0) {
                toast.error('Error', {
                    description: 'No se proporcionaron archivos'
                });
                return;
            }

            // Cancelar procesamiento anterior si existe
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Filtrar y validar archivos
            const validFiles: File[] = [];
            const invalidFiles: string[] = [];

            for (const file of files) {
                const validation = validateFile(file);
                if (validation.isValid) {
                    validFiles.push(file);
                } else {
                    invalidFiles.push(`${file?.name || 'unnamed'}: ${validation.error!.message}`);
                }
            }

            if (invalidFiles.length > 0) {
                toast.warning('Archivos no válidos', {
                    description: `${invalidFiles.length} archivo(s) ignorado(s). Ver consola para detalles.`
                });
                console.warn('Archivos inválidos:', invalidFiles);
            }

            if (validFiles.length === 0) {
                toast.error('Error', {
                    description: 'No se encontraron archivos de imagen válidos'
                });
                return;
            }

            // Configurar contexto de procesamiento
            abortControllerRef.current = new AbortController();
            processingContextRef.current = {
                startTime: Date.now(),
                totalItems: validFiles.length,
                processedItems: 0,
                abortController: abortControllerRef.current
            };

            setLoading(true);
            setError(null);
            setResults([]);

            try {
                toast.info('Procesando', {
                    description: `Evaluando ${validFiles.length} imagen${validFiles.length > 1 ? 'es' : ''}...`
                });

                const results: LivenessResult[] = [];

                // Procesar en lotes para evitar sobrecarga
                for (let i = 0; i < validFiles.length; i += MAX_CONCURRENT_EVALUATIONS) {
                    if (abortControllerRef.current?.signal.aborted) {
                        throw new Error('Procesamiento cancelado por el usuario');
                    }

                    const batch = validFiles.slice(i, i + MAX_CONCURRENT_EVALUATIONS);
                    const batchPromises = batch.map((file) => processImage(file));

                    try {
                        const batchResults = await Promise.all(batchPromises);
                        results.push(...batchResults);

                        processingContextRef.current!.processedItems += batch.length;

                        // Mostrar progreso
                        if (validFiles.length > 3) {
                            const progress = Math.round(
                                (processingContextRef.current!.processedItems / validFiles.length) *
                                    100
                            );
                            toast.info(`Progreso: ${progress}%`, {
                                description: `${processingContextRef.current!.processedItems}/${validFiles.length} imágenes procesadas`
                            });
                        }
                    } catch (error) {
                        console.error('Error en lote:', error);
                        // Continuar con el siguiente lote
                    }
                }

                // Ordenar resultados
                results.sort((a, b) => a.title.localeCompare(b.title));
                setResults(results);

                const elapsed = (Date.now() - processingContextRef.current.startTime) / 1000;
                toast.success('Evaluación completada', {
                    description: `${results.length} imagen${results.length > 1 ? 'es' : ''} procesada${results.length > 1 ? 's' : ''} en ${elapsed.toFixed(1)}s`
                });
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'Error desconocido durante la evaluación';
                setError(errorMessage);
                toast.error('Error', { description: errorMessage });
                console.error('Error evaluating images:', error);
            } finally {
                setLoading(false);
                abortControllerRef.current = null;
                processingContextRef.current = null;
            }
        },
        [validateFile, processImage]
    );

    const evaluateBase64Images = useCallback(
        async (base64Strings: string[]) => {
            // Validaciones de entrada
            if (!Array.isArray(base64Strings)) {
                toast.error('Error', {
                    description: 'Lista de base64 inválida'
                });
                return;
            }

            if (base64Strings.length === 0) {
                toast.error('Error', {
                    description: 'No se proporcionaron base64'
                });
                return;
            }

            // Cancelar procesamiento anterior si existe
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Filtrar y validar base64s
            const validBase64s: string[] = [];
            const invalidBase64s: string[] = [];

            base64Strings.forEach((base64, index) => {
                const validation = validateBase64(base64);
                if (validation.isValid) {
                    validBase64s.push(base64);
                } else {
                    invalidBase64s.push(`Base64 ${index + 1}: ${validation.error!.message}`);
                }
            });

            if (invalidBase64s.length > 0) {
                toast.warning('Base64 no válidos', {
                    description: `${invalidBase64s.length} base64(s) ignorado(s). Ver consola para detalles.`
                });
                console.warn('Base64 inválidos:', invalidBase64s);
            }

            if (validBase64s.length === 0) {
                toast.error('Error', {
                    description: 'No se encontraron base64 válidos'
                });
                return;
            }

            // Configurar contexto de procesamiento
            abortControllerRef.current = new AbortController();
            processingContextRef.current = {
                startTime: Date.now(),
                totalItems: validBase64s.length,
                processedItems: 0,
                abortController: abortControllerRef.current
            };

            setLoading(true);
            setError(null);
            setResults([]);

            try {
                toast.info('Procesando', {
                    description: `Evaluando ${validBase64s.length} base64${validBase64s.length > 1 ? 's' : ''}...`
                });

                const results: LivenessResult[] = [];

                // Procesar en lotes
                for (let i = 0; i < validBase64s.length; i += MAX_CONCURRENT_EVALUATIONS) {
                    if (abortControllerRef.current?.signal.aborted) {
                        throw new Error('Procesamiento cancelado por el usuario');
                    }

                    const batch = validBase64s.slice(i, i + MAX_CONCURRENT_EVALUATIONS);
                    const batchPromises = batch.map((base64, batchIndex) =>
                        processBase64(base64, i + batchIndex)
                    );

                    try {
                        const batchResults = await Promise.all(batchPromises);
                        results.push(...batchResults);

                        processingContextRef.current!.processedItems += batch.length;

                        // Mostrar progreso
                        if (validBase64s.length > 3) {
                            const progress = Math.round(
                                (processingContextRef.current!.processedItems /
                                    validBase64s.length) *
                                    100
                            );
                            toast.info(`Progreso: ${progress}%`, {
                                description: `${processingContextRef.current!.processedItems}/${validBase64s.length} base64s procesados`
                            });
                        }
                    } catch (error) {
                        console.error('Error en lote base64:', error);
                        // Continuar con el siguiente lote
                    }
                }

                // Ordenar resultados
                results.sort((a, b) => a.title.localeCompare(b.title));
                setResults(results);

                const elapsed = (Date.now() - processingContextRef.current.startTime) / 1000;
                toast.success('Evaluación completada', {
                    description: `${results.length} base64${results.length > 1 ? 's' : ''} procesado${results.length > 1 ? 's' : ''} en ${elapsed.toFixed(1)}s`
                });
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'Error desconocido durante la evaluación';
                setError(errorMessage);
                toast.error('Error', { description: errorMessage });
                console.error('Error evaluating base64s:', error);
            } finally {
                setLoading(false);
                abortControllerRef.current = null;
                processingContextRef.current = null;
            }
        },
        [validateBase64, processBase64]
    );

    const clearResults = useCallback(() => {
        try {
            // Cancelar cualquier procesamiento en curso
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }

            // Limpiar URLs de objeto para evitar memory leaks
            results.forEach((result) => {
                if (result.imageUrl && result.imageUrl.startsWith('blob:')) {
                    try {
                        URL.revokeObjectURL(result.imageUrl);
                        pendingImageUrlsRef.current.delete(result.imageUrl);
                    } catch (error) {
                        console.warn('Error cleaning up URL:', error);
                    }
                }
            });

            // Limpiar URLs pendientes
            pendingImageUrlsRef.current.forEach((url) => {
                try {
                    URL.revokeObjectURL(url);
                } catch (error) {
                    console.warn('Error cleaning up pending URL:', error);
                }
            });
            pendingImageUrlsRef.current.clear();

            setResults([]);
            setError(null);
            setLoading(false);
            processingContextRef.current = null;

            toast.info('Resultados limpiados', {
                description: 'Todos los datos han sido borrados para una nueva evaluación'
            });
        } catch (error) {
            console.error('Error clearing results:', error);
            toast.error('Error', { description: 'Error limpiando resultados' });
        }
    }, [results]);

    // =================== CLEANUP ===================

    useEffect(() => {
        // Cleanup al desmontar el componente
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            pendingImageUrlsRef.current.forEach((url) => {
                try {
                    URL.revokeObjectURL(url);
                } catch (error) {
                    console.warn('Error cleaning up URL on unmount:', error);
                }
            });
            pendingImageUrlsRef.current.clear();
        };
    }, []);

    // =================== PUBLIC API ===================

    return {
        loading,
        results,
        error,
        evaluateImages,
        evaluateBase64Images,
        clearResults,
        isValidImageFile: useCallback((file: File) => validateFile(file).isValid, [validateFile]),
        validateBase64: useCallback(
            (base64: string) => validateBase64(base64).isValid,
            [validateBase64]
        ),
        supportedExtensions: VALID_IMAGE_EXTENSIONS as readonly string[],
        // Funciones de utilidad adicionales
        canProcess: !loading,
        processingProgress: processingContextRef.current
            ? Math.round(
                  (processingContextRef.current.processedItems /
                      processingContextRef.current.totalItems) *
                      100
              )
            : 0
    };
};
