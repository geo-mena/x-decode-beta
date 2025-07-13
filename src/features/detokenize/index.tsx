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
                setError(response.message || 'Error detokenizing the image.');
                setImageData(null);

                toast.error('Detokenization error', {
                    description: response.message || 'Could not process the image tokens.'
                });
            } else {
                // Agregar índice de token a cada imagen para referencia
                if (Array.isArray(response.data)) {
                    const processedData = response.data.map((img, index) => ({
                        ...img,
                        tokenIndex: index
                    }));
                    setImageData(processedData);

                    toast.success('Images retrieved', {
                        description: `${processedData.length} images retrieved successfully`
                    });
                } else {
                    // Si es una sola imagen
                    setImageData({
                        ...response.data,
                        tokenIndex: 0
                    });

                    toast.success('Image retrieved', {
                        description: `${response.data.file_name} (${response.data.width}×${response.data.height})`
                    });
                }
            }
        } catch (err) {
            const errorMessage = 'Error processing the request. Please try again.';
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

            toast.success('Downloading image', {
                description: `Downloading ${fileName}`
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

        toast.info('Form reset', {
            description: 'All data has been cleared for a new query.'
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
                        <h1 className='text-2xl font-bold tracking-tight'>Detokenize Image</h1>
                        <p className='text-muted-foreground text-sm'>
                            Convert image tokens into viewable and downloadable image files.
                        </p>
                    </div>
                </div>

                <Badge
                    variant='secondary'
                    className='text-primary cursor-pointer p-2'
                    onClick={() =>
                        window.open(
                            'https://docs.identity-platform.io/docs/identity-api/resources/Services/detokenize',
                            '_blank',
                            'noopener,noreferrer'
                        )
                    }
                >
                    <File className='h-4 w-4' />
                    <span className='ml-2'>Documentation</span>
                </Badge>

                <div className='grid gap-6 lg:grid-cols-2'>
                    {/* Token input form */}
                    <TokenInput
                        ref={tokenInputRef}
                        onSubmit={handleDetokenize}
                        onReset={handleReset}
                        isLoading={loading}
                    />

                    {/* Image visualization */}
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
