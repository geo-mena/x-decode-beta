'use client';

import { useRef, useState } from 'react';
import { Base64ImageResponseData } from '@/types/base64-image';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import base64ImageService from '@/lib/tools/base64-image.service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Base64Input } from './components/base64-input';
import { ImagePreview } from './components/image-preview';

export default function DecodeImage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageData, setImageData] = useState<
        Base64ImageResponseData | Base64ImageResponseData[] | null
    >(null);
    const base64InputRef = useRef<{ reset: () => void } | null>(null);

    /* 🌱 Función para manejar la decodificación de la imagen */
    const handleDecode = async (base64Codes: string[]) => {
        // Limpiar estado previo
        setImageData(null);
        setError(null);
        setLoading(true);

        try {
            const response = await base64ImageService.decodeImage({
                base64_codes: base64Codes
            });

            if (!response.success || !response.data) {
                setError(response.message || 'Error al decodificar la imagen.');
                setImageData(null);

                toast.error('Error de decodificación', {
                    description: response.message || 'No se pudo procesar los códigos base64.'
                });
            } else {
                // Agregar índice de código a cada imagen para referencia
                if (Array.isArray(response.data)) {
                    const processedData = response.data.map((img, index) => ({
                        ...img,
                        codeIndex: index
                    }));
                    setImageData(processedData);

                    toast.success('Imágenes decodificadas', {
                        description: `Se decodificaron ${processedData.length} imágenes exitosamente`
                    });
                } else {
                    // Si es una sola imagen
                    setImageData({
                        ...response.data,
                        codeIndex: 0
                    });

                    toast.success('Imagen decodificada', {
                        description: `${response.data.file_name} (${response.data.width}×${response.data.height})`
                    });
                }
            }
        } catch (err) {
            const errorMessage = 'Error al procesar la solicitud. Intente nuevamente.';
            setError(errorMessage);
            setImageData(null);

            toast.error('Error', {
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (fileName: string) => {
        if (fileName) {
            base64ImageService.downloadImage(fileName);

            toast.success('Descargando imagen', {
                description: `Descargando ${fileName}`
            });
        }
    };

    const handleReset = () => {
        setImageData(null);
        setError(null);
        setLoading(false);

        if (base64InputRef.current && typeof base64InputRef.current.reset === 'function') {
            base64InputRef.current.reset();
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
                        <h1 className='text-2xl font-bold tracking-tight'>Base64 a Imagen</h1>
                        <p className='text-muted-foreground text-sm'>
                            Convierte códigos base64 en archivos de imagen visualizables y
                            descargables.
                        </p>
                    </div>
                </div>

                <div className='grid gap-6 lg:grid-cols-2'>
                    {/* Formulario de entrada de base64 */}
                    <Base64Input
                        ref={base64InputRef}
                        onSubmit={handleDecode}
                        onReset={handleReset}
                        isLoading={loading}
                    />

                    {/* Visualización de la imagen */}
                    <ImagePreview
                        data={imageData}
                        error={error}
                        isLoading={loading}
                        onDownload={handleDownload}
                    />
                </div>
            </>
        </>
    );
}
