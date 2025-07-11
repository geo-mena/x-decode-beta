'use client';

import { useRef, useState } from 'react';
import { DetokenizeResponseData } from '@/types/detokenize';
import { File } from 'lucide-react';
import { toast } from 'sonner';
import detokenizeService from '@/lib/identity-api/detokenize.service';
import { Badge } from '@/components/ui/badge';
import { ImagePreview } from './components/image-preview';
import { TokenInput } from './components/token-input';

export default function Detokenize() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageData, setImageData] = useState<
        DetokenizeResponseData | DetokenizeResponseData[] | null
    >(null);
    const tokenInputRef = useRef<{ reset: () => void } | null>(null);

    /* 🌱 Función para manejar la detokenización de la imagen */
    const handleDetokenize = async (tokens: string[], transactionId: string) => {
        // Limpiar estado previo
        setImageData(null);
        setError(null);
        setLoading(true);

        try {
            const response = await detokenizeService.detokenizeImage({
                bestImageTokens: tokens,
                transactionId: transactionId || undefined
            });

            if (!response.success || !response.data) {
                setError(response.message || 'Error al detokenizar la imagen.');
                setImageData(null);

                toast.error('Error de detokenización', {
                    description: response.message || 'No se pudo procesar los tokens de imagen.'
                });
            } else {
                // Agregar índice de token a cada imagen para referencia
                if (Array.isArray(response.data)) {
                    const processedData = response.data.map((img, index) => ({
                        ...img,
                        tokenIndex: index
                    }));
                    setImageData(processedData);

                    toast.success('Imágenes recuperadas', {
                        description: `Se recuperaron ${processedData.length} imágenes exitosamente`
                    });
                } else {
                    // Si es una sola imagen
                    setImageData({
                        ...response.data,
                        tokenIndex: 0
                    });

                    toast.success('Imagen recuperada', {
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

    /* 🌱 Función para manejar la descarga de la imagen */
    const handleDownload = (fileName: string) => {
        if (fileName) {
            detokenizeService.downloadImage(fileName);

            toast.success('Descargando imagen', {
                description: `Descargando ${fileName}`
            });
        }
    };

    const handleReset = () => {
        setImageData(null);
        setError(null);
        setLoading(false);

        if (tokenInputRef.current && typeof tokenInputRef.current.reset === 'function') {
            tokenInputRef.current.reset();
        }

        toast.info('Formulario restablecido', {
            description: 'Todos los datos han sido borrados para una nueva consulta.'
        });
    };

    const topNav = [
        {
            title: 'Overview',
            href: '/',
            isActive: false,
            disabled: true
        }
    ];

    return (
        <>
            {/* ===== Main ===== */}
            <>
                <div className='mb-6 flex items-center justify-between'>
                    <div>
                        <h1 className='text-2xl font-bold tracking-tight'>Detokenizar Imagen</h1>
                        <p className='text-muted-foreground text-sm'>
                            Convierte tokens de imagen en archivos de imagen visualizables y
                            descargables.
                        </p>
                    </div>
                </div>

                <Badge 
                    variant='secondary' 
                    className='cursor-pointer p-2 text-primary'
                    onClick={() => window.open('https://docs.identity-platform.io/docs/identity-api/resources/Services/detokenize', '_blank', 'noopener,noreferrer')}
                >
                    <File className='h-4 w-4' />
                    <span className='ml-2'>Documentación</span>
                </Badge>

                <div className='grid gap-6 lg:grid-cols-2'>
                    {/* Formulario de entrada de token */}
                    <TokenInput
                        ref={tokenInputRef}
                        onSubmit={handleDetokenize}
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
