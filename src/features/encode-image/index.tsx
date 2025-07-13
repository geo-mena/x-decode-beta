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
                setError(response.message || 'Error encoding the image.');
                setEncodedData(null);

                toast.error('Encoding error', {
                    description: response.message || 'Could not process the images.'
                });
            } else {
                // Si es un solo resultado o múltiples, normalizamos a un array
                if (Array.isArray(response.data)) {
                    setEncodedData(response.data);

                    toast.success('Images encoded', {
                        description: `Successfully encoded ${response.data.length} images`
                    });
                } else {
                    // Si es una sola imagen
                    setEncodedData([response.data]);

                    toast.success('Image encoded', {
                        description: `${response.data.original_name} (${response.data.width}×${response.data.height})`
                    });
                }
            }
        } catch (err) {
            const errorMessage = 'Error processing the request. Please try again.';
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
                setError(response.message || 'Error encoding image from URL.');
                setEncodedData(null);

                toast.error('Encoding error', {
                    description: response.message || 'Could not process the image URL.'
                });
            } else {
                // Establecer resultado
                setEncodedData(Array.isArray(response.data) ? response.data : [response.data]);

                toast.success('Image encoded', {
                    description: `URL processed successfully`
                });
            }
        } catch (err) {
            const errorMessage = 'Error processing the URL. Please try again.';
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
            toast.success('Copied to clipboard', {
                description: result.message
            });
        } else {
            toast.error('Copy error', {
                description: result.message
            });
        }
    };

    const handleDownloadFromDataUri = (dataUri: string, fileName: string) => {
        base64EncodeService.downloadFromDataUri(dataUri, fileName);

        toast.success('Downloading image', {
            description: `Downloading ${fileName}`
        });
    };

    const handleReset = () => {
        setEncodedData(null);
        setError(null);
        setLoading(false);

        if (imageInputRef.current && typeof imageInputRef.current.reset === 'function') {
            imageInputRef.current.reset();
        }

        toast.info('Form reset', {
            description: 'All data has been cleared for a new query.'
        });
    };

    return (
        <>
            {/* ===== Main ===== */}
            <>
                <div className='mb-6 flex items-center justify-between'>
                    <div>
                        <h1 className='text-2xl font-bold tracking-tight'>Image to Base64</h1>
                        <p className='text-muted-foreground text-sm'>
                            Convert images to base64 codes for use in HTML, CSS or any other
                            document.
                        </p>
                    </div>
                </div>

                <div className='grid gap-6 lg:grid-cols-2'>
                    {/* Image input form */}
                    <ImageInput
                        ref={imageInputRef}
                        onSubmitFiles={handleEncodeImages}
                        onSubmitUrl={handleEncodeFromUrl}
                        onReset={handleReset}
                        isLoading={loading}
                    />

                    {/* Base64 results visualization */}
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
