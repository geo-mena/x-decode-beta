'use client';

import { useRef, useState } from 'react';
import { Base64EncodeResponseData } from '@/types/image-base64';
import { toast } from 'sonner';
import { base64EncodeService } from '@/lib/tools/image-base64.service';
import { Base64Result } from './components/base64-result';
import { ImageInput } from './components/image-input';

export default function EncodeImage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [encodedData, setEncodedData] = useState<
        Base64EncodeResponseData | Base64EncodeResponseData[] | null
    >(null);
    const imageInputRef = useRef<{ reset: () => void } | null>(null);

    /* 🌱 Función para manejar la codificación de imágenes */
    const handleEncodeImages = async (files: File[]) => {
        // Limpiar estado previo
        setEncodedData(null);
        setError(null);
        setLoading(true);

        try {
            const response = await base64EncodeService.encodeImages(files, true);

            if (!response.success || !response.data) {
                setError(response.message || 'Error al codificar la imagen.');
                setEncodedData(null);

                toast.error('Error de codificación', {
                    description: response.message || 'No se pudieron procesar las imágenes.'
                });
            } else {
                // Si es un solo resultado o múltiples, normalizamos a un array
                if (Array.isArray(response.data)) {
                    setEncodedData(response.data);

                    toast.success('Imágenes codificadas', {
                        description: `Se codificaron ${response.data.length} imágenes exitosamente`
                    });
                } else {
                    // Si es una sola imagen
                    setEncodedData([response.data]);

                    toast.success('Imagen codificada', {
                        description: `${response.data.original_name} (${response.data.width}×${response.data.height})`
                    });
                }
            }
        } catch (err) {
            const errorMessage = 'Error al procesar la solicitud. Intente nuevamente.';
            setError(errorMessage);
            setEncodedData(null);

            toast.error('Error', {
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    /* 🌱 Función para manejar la codificación desde URL */
    const handleEncodeFromUrl = async (imageUrl: string) => {
        // Limpiar estado previo
        setEncodedData(null);
        setError(null);
        setLoading(true);

        try {
            const response = await base64EncodeService.encodeImageFromUrl(imageUrl, true);

            if (!response.success || !response.data) {
                setError(response.message || 'Error al codificar la imagen desde URL.');
                setEncodedData(null);

                toast.error('Error de codificación', {
                    description: response.message || 'No se pudo procesar la URL de imagen.'
                });
            } else {
                // Establecer resultado
                setEncodedData(Array.isArray(response.data) ? response.data : [response.data]);

                toast.success('Imagen codificada', {
                    description: `URL procesada exitosamente`
                });
            }
        } catch (err) {
            const errorMessage = 'Error al procesar la URL. Intente nuevamente.';
            setError(errorMessage);
            setEncodedData(null);

            toast.error('Error', {
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCopyToClipboard = async (content: string, isDataUri: boolean = false) => {
        const result = await base64EncodeService.copyToClipboard(content, isDataUri);

        if (result.success) {
            toast.success('Copiado al portapapeles', {
                description: result.message
            });
        } else {
            toast.error('Error al copiar', {
                description: result.message
            });
        }
    };

    const handleDownloadFromDataUri = (dataUri: string, fileName: string) => {
        base64EncodeService.downloadFromDataUri(dataUri, fileName);

        toast.success('Descargando imagen', {
            description: `Descargando ${fileName}`
        });
    };

    const handleReset = () => {
        setEncodedData(null);
        setError(null);
        setLoading(false);

        if (imageInputRef.current && typeof imageInputRef.current.reset === 'function') {
            imageInputRef.current.reset();
        }

        toast.info('Formulario restablecido', {
            description: 'Todos los datos han sido borrados para una nueva consulta.'
        });
    };

    return (
        <>
            {/* ===== Main ===== */}
            <>
                <div className='mb-6 flex items-center justify-between'>
                    <div>
                        <h1 className='text-2xl font-bold tracking-tight'>Imagen a Base64</h1>
                        <p className='text-muted-foreground text-sm'>
                            Convierte imágenes a códigos base64 para usar en HTML, CSS o cualquier
                            otro documento.
                        </p>
                    </div>
                </div>

                <div className='grid gap-6 lg:grid-cols-2'>
                    {/* Formulario de entrada de imágenes */}
                    <ImageInput
                        ref={imageInputRef}
                        onSubmitFiles={handleEncodeImages}
                        onSubmitUrl={handleEncodeFromUrl}
                        onReset={handleReset}
                        isLoading={loading}
                    />

                    {/* Visualización de resultados Base64 */}
                    <Base64Result
                        data={encodedData}
                        error={error}
                        isLoading={loading}
                        onCopy={handleCopyToClipboard}
                        onDownload={handleDownloadFromDataUri}
                    />
                </div>
            </>
        </>
    );
}
