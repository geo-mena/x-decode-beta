'use client';

import { useRef, useState } from 'react';
import { Base64ImageResponseData } from '@/types/base64-image';
import { toast } from 'sonner';
import base64ImageService from '@/lib/tools/base64-image.service';
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
                setError(response.message || 'Error decoding the image.');
                setImageData(null);

                toast.error('Decoding error', {
                    description: response.message || 'Could not process the base64 codes.'
                });
            } else {
                // Agregar índice de código a cada imagen para referencia
                if (Array.isArray(response.data)) {
                    const processedData = response.data.map((img, index) => ({
                        ...img,
                        codeIndex: index
                    }));
                    setImageData(processedData);

                    toast.success('Images decoded', {
                        description: `Successfully decoded ${processedData.length} images`
                    });
                } else {
                    // Si es una sola imagen
                    setImageData({
                        ...response.data,
                        codeIndex: 0
                    });

                    toast.success('Image decoded', {
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

    const handleDownload = (fileName: string) => {
        if (fileName) {
            base64ImageService.downloadImage(fileName);

            toast.success('Downloading image', {
                description: `Downloading ${fileName}`
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

        toast.info('Form reset', {
            description: 'All data has been cleared for a new query.'
        });
    };

    return (
        <>
            <div className='mb-6 flex items-center justify-between'>
                <div>
                    <h1 className='text-2xl font-bold tracking-tight'>Base64 to Image</h1>
                    <p className='text-muted-foreground text-sm'>
                        Convert base64 codes into viewable and downloadable image files.
                    </p>
                </div>
            </div>

            <div className='grid gap-6 lg:grid-cols-2'>
                {/* Base64 input form */}
                <Base64Input
                    ref={base64InputRef}
                    onSubmit={handleDecode}
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
    );
}
