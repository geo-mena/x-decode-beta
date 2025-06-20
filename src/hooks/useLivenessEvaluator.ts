import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { usePlaygroundStore } from '@/store'
import { createLivenessServiceWithApiKey } from '@/lib/identity-api/liveness.service'
import {
    LivenessResult,
    ImageInfo,
    EvaluatePassiveLivenessResponse,
    LivenessApiError
} from '@/types/liveness'

const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp']

export const useLivenessEvaluator = () => {
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<LivenessResult[]>([])
    const [error, setError] = useState<string | null>(null)
    const { apiKey } = usePlaygroundStore()

    // Función para convertir imagen a base64
    const convertImageToBase64 = useCallback((file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    // Remover el prefijo data:image/...;base64,
                    const base64 = reader.result.split(',')[1]
                    resolve(base64)
                } else {
                    reject(new Error('Error al convertir imagen a base64'))
                }
            }
            reader.onerror = () => reject(new Error('Error al leer el archivo'))
            reader.readAsDataURL(file)
        })
    }, [])

    // Función para obtener información de la imagen
    const getImageInfo = useCallback((file: File): Promise<ImageInfo> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            const url = URL.createObjectURL(file)
            
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height,
                    size: file.size,
                    name: file.name,
                    type: file.type
                })
                URL.revokeObjectURL(url)
            }
            
            img.onerror = () => {
                reject(new Error('Error al cargar la imagen'))
                URL.revokeObjectURL(url)
            }
            
            img.src = url
        })
    }, [])

    // Función para evaluar con SaaS
    const evaluateWithSaaS = useCallback(async (
        file: File
    ): Promise<{ diagnostic: string; rawResponse?: EvaluatePassiveLivenessResponse }> => {
        try {
            const imageBase64 = await convertImageToBase64(file)
            
            if (!apiKey.trim()) {
                return { diagnostic: 'Error: API key no configurada. Configure la API key usando el botón "API Key" en la barra lateral.' }
            }
            
            const livenessService = createLivenessServiceWithApiKey(apiKey)
            
            const response = await livenessService.evaluatePassiveLiveness({
                imageBuffer: imageBase64
            })

            return {
                diagnostic: response.serviceResultLog || 'Sin diagnóstico disponible',
                rawResponse: response
            }
        } catch (error) {
            if (error instanceof LivenessApiError) {
                return { diagnostic: `Error: ${error.message}` }
            }
            return { diagnostic: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}` }
        }
    }, [convertImageToBase64, apiKey])

    // Función para formatear el tamaño del archivo
    const formatFileSize = useCallback((bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    }, [])

    // Función para procesar una imagen individual
    const processImage = useCallback(async (
        file: File
    ): Promise<LivenessResult> => {
        try {
            const imageInfo = await getImageInfo(file)
            const imageUrl = URL.createObjectURL(file)
            
            const title = file.name.split('.')[0]
            
            const result: LivenessResult = {
                title,
                imagePath: file.name,
                imageUrl,
                resolution: `${imageInfo.width} x ${imageInfo.height}`,
                size: formatFileSize(imageInfo.size),
                imageInfo
            }

            // Evaluar con SaaS
            try {
                const saasResult = await evaluateWithSaaS(file)
                result.diagnosticSaaS = saasResult.diagnostic
                result.rawResponse = saasResult.rawResponse
            } catch (error) {
                result.diagnosticSaaS = `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
                result.error = error instanceof Error ? error.message : 'Error desconocido'
            }

            return result
        } catch (error) {
            return {
                title: file.name,
                imagePath: file.name,
                resolution: 'N/A',
                size: 'N/A',
                diagnosticSaaS: 'Error al procesar',
                error: error instanceof Error ? error.message : 'Error desconocido'
            }
        }
    }, [getImageInfo, formatFileSize, evaluateWithSaaS])

    // Función principal para evaluar imágenes
    const evaluateImages = useCallback(async (
        files: File[],
        isDirectory: boolean = false
    ) => {

        // Filtrar solo archivos de imagen válidos
        const validFiles = files.filter(file => {
            const extension = '.' + file.name.split('.').pop()?.toLowerCase()
            return VALID_IMAGE_EXTENSIONS.includes(extension)
        })

        if (validFiles.length === 0) {
            toast.error('Error', {
                description: 'No se encontraron archivos de imagen válidos'
            })
            return
        }

        setLoading(true)
        setError(null)
        setResults([])

        try {
            const startTime = Date.now()
            
            toast.info('Procesando', {
                description: `Evaluando ${validFiles.length} imagen${validFiles.length > 1 ? 'es' : ''}...`
            })

            // Procesar imágenes secuencialmente para evitar límites de API
            const results: LivenessResult[] = []
            for (const file of validFiles) {
                const result = await processImage(file)
                results.push(result)
            }

            // Ordenar resultados por título
            results.sort((a, b) => a.title.localeCompare(b.title))
            setResults(results)

            const elapsed = (Date.now() - startTime) / 1000
            toast.success('Evaluación completada', {
                description: `${results.length} imagen${results.length > 1 ? 'es' : ''} procesada${results.length > 1 ? 's' : ''} en ${elapsed.toFixed(1)}s`
            })

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido durante la evaluación'
            setError(errorMessage)
            toast.error('Error', {
                description: errorMessage
            })
        } finally {
            setLoading(false)
        }
    }, [processImage])

    // Función para limpiar resultados
    const clearResults = useCallback(() => {
        // Limpiar URLs de objeto para evitar memory leaks
        results.forEach(result => {
            if (result.imageUrl) {
                URL.revokeObjectURL(result.imageUrl)
            }
        })
        
        setResults([])
        setError(null)
        
        toast.info('Resultados limpiados', {
            description: 'Todos los datos han sido borrados para una nueva evaluación'
        })
    }, [results])

    // Función para verificar si un archivo es una imagen válida
    const isValidImageFile = useCallback((file: File): boolean => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase()
        return VALID_IMAGE_EXTENSIONS.includes(extension)
    }, [])

    return {
        loading,
        results,
        error,
        evaluateImages,
        clearResults,
        isValidImageFile,
        supportedExtensions: VALID_IMAGE_EXTENSIONS
    }
}
