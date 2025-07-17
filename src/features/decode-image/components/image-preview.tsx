'use client';

import { useEffect, useState } from 'react';
import { Base64ImageResponseData } from '@/types/base64-image';
import { CloudAlert, CloudCog, Copy, Download, ExternalLink, Images, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import base64ImageService from '@/lib/tools/base64-image.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageControls } from '@/features/detokenize/components/image-controls';
import { FullscreenImage } from './full-screen-image';
// import { ImageAnalyzer } from './image-analyzer';

interface ImageControlState {
    zoomLevel: number;
    rotation: number;
}

interface ImagePreviewProps {
    data: Base64ImageResponseData | Base64ImageResponseData[] | null;
    error: string | null;
    isLoading: boolean;
    onDownload: (fileName: string) => void;
}

const DEFAULT_IMAGE_CONTROLS = {
    '0': { zoomLevel: 100, rotation: 0 },
    '1': { zoomLevel: 100, rotation: 0 }
};

export function ImagePreview({ data, error, isLoading, onDownload }: ImagePreviewProps) {
    const [copyLoading, setCopyLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('0');
    const [imageControls, setImageControls] = useState<{
        [key: string]: ImageControlState;
    }>(DEFAULT_IMAGE_CONTROLS);
    const [fullscreenOpen, setFullscreenOpen] = useState(false);

    useEffect(() => {
        if (data && !isLoading) {
            setImageControls(DEFAULT_IMAGE_CONTROLS);
            setActiveTab('0');
        }
    }, [data, isLoading]);

    const hasMultipleImages = data !== null && Array.isArray(data) && data.length > 1;
    const images = data ? (Array.isArray(data) ? data : [data]) : [];
    const activeImage = images.length > 0 ? images[parseInt(activeTab)] : null;
    const activeControls = imageControls[activeTab] || {
        zoomLevel: 100,
        rotation: 0
    };

    /* 🌱 Función para formatear el tamaño del archivo en bytes */
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} KB`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    /* 🌱 Función para abrir la imagen original en una nueva pestaña */
    const handleOpenOriginal = (imageData: Base64ImageResponseData) => {
        if (imageData?.preview_url) {
            window.open(imageData.preview_url, '_blank');

            toast.info('Opening image', {
                description: 'Viewing the image in a new tab'
            });
        }
    };

    /* 🌱 Función para copiar la imagen al portapapeles usando canvas */
    const handleCopyImage = async (imageData: Base64ImageResponseData) => {
        if (!imageData?.file_name) return;

        setCopyLoading(true);
        try {
            const img = new Image();
            const proxyUrl = base64ImageService.getProxyUrl(imageData.file_name);

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.crossOrigin = 'anonymous';
                img.src = proxyUrl;
            });

            // Crear un canvas para dibujar la imagen
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            // Dibujar la imagen en el canvas
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);

            try {
                // Método 1: Intenta usar la API moderna de portapapeles (Chrome, Edge)
                canvas.toBlob(async (blob) => {
                    if (blob) {
                        try {
                            const data = [new ClipboardItem({ [blob.type]: blob })];
                            await navigator.clipboard.write(data);
                            toast.success('Image copied', {
                                description: 'The image was copied to the clipboard'
                            });
                        } catch (err) {
                            tryFallbackCopyMethod(canvas, imageData);
                        }
                    }
                });
            } catch (err) {
                tryFallbackCopyMethod(canvas, imageData);
            }
        } catch (error) {
            toast.error('Copy error', {
                description: 'Could not copy the image. Try the "Download" option'
            });
        } finally {
            setCopyLoading(false);
        }
    };

    /* 🌱 Función de respaldo para copiar la imagen usando un enlace de descarga */
    const tryFallbackCopyMethod = (
        canvas: HTMLCanvasElement,
        imageData: Base64ImageResponseData
    ) => {
        try {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = imageData?.file_name || 'image.png';

            toast.info('Downloading image', {
                description: 'The image cannot be copied directly. It will be downloaded instead.'
            });

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (fallbackError) {
            toast.error('Processing error', {
                description: 'Could not process the image. Try the "Download" option'
            });
        }
    };

    const handleZoom = (imageIndex: string, newZoomLevel: number) => {
        setImageControls((prev) => ({
            ...prev,
            [imageIndex]: {
                ...prev[imageIndex],
                zoomLevel: newZoomLevel
            }
        }));
    };

    const handleRotate = (imageIndex: string) => {
        setImageControls((prev) => {
            const currentRotation = prev[imageIndex]?.rotation || 0;
            const newRotation = (currentRotation + 90) % 360;

            return {
                ...prev,
                [imageIndex]: {
                    ...prev[imageIndex],
                    rotation: newRotation
                }
            };
        });
    };

    const handleOpenFullscreen = () => {
        setFullscreenOpen(true);
    };

    const handleCloseFullscreen = () => {
        setFullscreenOpen(false);
    };

    /* 🌱 Renderizar detalles de imagen */
    const renderImageDetails = (imageData: Base64ImageResponseData) => (
        <div className='space-y-4'>
            <div>
                <h3 className='mb-2 text-sm font-medium'>Image Information</h3>
                <Table className='border border-border'>
                    <TableHeader className='bg-muted'>
                        <TableRow className='border-b border-border'>
                            <TableHead className='border-r border-border font-semibold'>Format</TableHead>
                            <TableHead className='border-r border-border font-semibold'>Size</TableHead>
                            <TableHead className='border-r border-border font-semibold'>Resolution</TableHead>
                            {imageData.jpeg_quality !== undefined && (
                                <TableHead className='border-border font-semibold'>JPEG Quality</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow className='border-b border-border'>
                            <TableCell className='border-r border-border'>
                                {imageData.mime_type}
                            </TableCell>
                            <TableCell className='border-r border-border'>
                                {formatFileSize(imageData.size)}
                            </TableCell>
                            <TableCell className='border-r border-border'>
                                {imageData.width} × {imageData.height} px
                            </TableCell>
                            {imageData.jpeg_quality !== undefined && (
                                <TableCell className='border-border'>{imageData.jpeg_quality}%</TableCell>
                            )}
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            <div className='flex flex-wrap items-center gap-2'>
                <Button variant='outline' size='sm' onClick={() => handleOpenOriginal(imageData)}>
                    <ExternalLink className='mr-2 h-4 w-4' />
                    View Original
                </Button>
                <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleCopyImage(imageData)}
                    disabled={copyLoading}
                >
                    {copyLoading ? (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                        <Copy className='mr-2 h-4 w-4' />
                    )}
                    Copy Image
                </Button>
            </div>
        </div>
    );

    return (
        <>
            <Card className='flex h-full flex-col'>
                <CardHeader className='flex flex-row items-center justify-between'>
                    <div>
                        <CardTitle>
                            {hasMultipleImages ? 'Output Results' : 'Output Results'}
                        </CardTitle>
                        <CardDescription className='mt-1'>
                            {hasMultipleImages
                                ? 'Previews and details of generated images'
                                : 'Preview and details of generated image'}
                        </CardDescription>
                    </div>

                    {activeImage && (
                        <div className='flex gap-2'>
                            {/* Componente de análisis de imagen */}
                            {/* <ImageAnalyzer data={activeImage} /> */}
                        </div>
                    )}
                </CardHeader>
                <CardContent className='flex-grow'>
                    {isLoading && (
                        <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                            <CloudCog className='mb-4 h-20 w-20 animate-pulse' />
                            <p className='text-sm'>Processing base64 code(s)...</p>
                        </div>
                    )}

                    {error && !isLoading && (
                        <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                            <CloudAlert className='mb-4 h-20 w-20' />
                            <p className='text-sm'>{error}</p>
                        </div>
                    )}

                    {!data && !error && !isLoading && (
                        <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                            <CloudCog className='mb-4 h-20 w-20' />
                            <p className='text-sm'>Enter a base64 code to view the image</p>
                        </div>
                    )}

                    {images.length > 0 && (
                        <>
                            {hasMultipleImages ? (
                                <Tabs
                                    value={activeTab}
                                    onValueChange={setActiveTab}
                                    className='w-full'
                                >
                                    <TabsList className='mb-4 grid w-full' style={{ gridTemplateColumns: `repeat(${images.length}, 1fr)` }}>
                                        {images.map((_, index) => (
                                            <TabsTrigger key={index} value={index.toString()}>
                                                <div className='flex items-center gap-1.5'>
                                                    <Images className='h-4 w-4' />
                                                    <span>Image {index + 1}</span>
                                                </div>
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>

                                    {images.map((img, index) => {
                                        const indexStr = index.toString();
                                        const controls = imageControls[indexStr] || {
                                            zoomLevel: 100,
                                            rotation: 0
                                        };

                                        return (
                                            <TabsContent
                                                key={index}
                                                value={indexStr}
                                                className='mt-0 space-y-6'
                                            >
                                                <div className='bg-muted relative flex aspect-auto items-center justify-center overflow-hidden rounded-lg p-2'>
                                                    <div className='relative'>
                                                        <img
                                                            src={img.preview_url}
                                                            alt={`Decoded image ${index + 1}`}
                                                            className='max-h-[300px] max-w-full rounded object-contain shadow-sm'
                                                            style={{
                                                                transform: `scale(${controls.zoomLevel / 100}) rotate(${controls.rotation}deg)`,
                                                                transformOrigin: 'center'
                                                            }}
                                                        />
                                                    </div>
                                                    <ImageControls
                                                        zoomLevel={controls.zoomLevel}
                                                        onZoom={(newZoom) =>
                                                            handleZoom(indexStr, newZoom)
                                                        }
                                                        onRotate={() => handleRotate(indexStr)}
                                                        onFullscreen={handleOpenFullscreen}
                                                        className='absolute right-2 bottom-2'
                                                    />
                                                </div>

                                                {renderImageDetails(img)}
                                            </TabsContent>
                                        );
                                    })}
                                </Tabs>
                            ) : (
                                <div className='space-y-6'>
                                    <div className='bg-muted relative flex aspect-auto items-center justify-center overflow-hidden rounded-lg p-2'>
                                        <div className='relative'>
                                            <img
                                                src={activeImage?.preview_url}
                                                alt='Decoded image'
                                                className='max-h-[300px] max-w-full rounded object-contain shadow-sm'
                                                style={{
                                                    transform: `scale(${activeControls.zoomLevel / 100}) rotate(${activeControls.rotation}deg)`,
                                                    transformOrigin: 'center'
                                                }}
                                            />
                                        </div>
                                        <ImageControls
                                            zoomLevel={activeControls.zoomLevel}
                                            onZoom={(newZoom) => handleZoom(activeTab, newZoom)}
                                            onRotate={() => handleRotate(activeTab)}
                                            onFullscreen={handleOpenFullscreen}
                                            className='absolute right-2 bottom-2'
                                        />
                                    </div>

                                    {activeImage && renderImageDetails(activeImage)}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>

                {activeImage && (
                    <CardFooter>
                        <Button
                            onClick={() => onDownload(activeImage.file_name)}
                            className='w-full'
                        >
                            <Download className='mr-2 h-4 w-4' />
                            Download Image
                        </Button>
                    </CardFooter>
                )}
            </Card>

            {/* Fullscreen modal */}
            {activeImage && (
                <FullscreenImage
                    isOpen={fullscreenOpen}
                    onClose={handleCloseFullscreen}
                    imageUrl={activeImage.preview_url}
                    fileName={activeImage.file_name}
                    zoomLevel={activeControls.zoomLevel}
                    rotation={activeControls.rotation}
                    onZoom={(newZoom) => handleZoom(activeTab, newZoom)}
                    onRotate={() => handleRotate(activeTab)}
                    onDownload={onDownload}
                />
            )}
        </>
    );
}
