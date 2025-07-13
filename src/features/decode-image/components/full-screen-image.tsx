'use client';

import { useEffect, useRef, useState } from 'react';
import { Copy, Download, Info, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import base64ImageService from '@/lib/tools/base64-image.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ImageControls } from '@/features/detokenize/components/image-controls';

interface FullscreenImageProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string | undefined;
    fileName: string | undefined;
    zoomLevel: number;
    rotation: number;
    onZoom: (level: number) => void;
    onRotate: () => void;
    onDownload?: (fileName: string) => void;
    mimeType?: string;
    size?: number;
    width?: number;
    height?: number;
    quality?: number;
    isProgressiveJpeg?: boolean;
}

export function FullscreenImage({
    isOpen,
    onClose,
    imageUrl,
    fileName,
    zoomLevel,
    rotation,
    onZoom,
    onRotate,
    onDownload,
    mimeType = 'image/jpeg',
    size,
    width,
    height,
    quality,
    isProgressiveJpeg
}: FullscreenImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [infoOpen, setInfoOpen] = useState(false);
    const [copyLoading, setCopyLoading] = useState(false);
    const startPos = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset loading state when the imageUrl changes
    useEffect(() => {
        if (imageUrl) {
            setIsLoading(true);
            setError(null);
        }
    }, [imageUrl]);

    // Reset position when dialog opens or zoom/rotation changes
    useEffect(() => {
        setPosition({ x: 0, y: 0 });
    }, [isOpen, zoomLevel, rotation]);

    // Format file size
    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'Unknown';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowLeft') {
                // Implementation for previous image (could be added as prop)
            } else if (e.key === 'ArrowRight') {
                // Implementation for next image (could be added as prop)
            } else if (e.key === '+') {
                onZoom(Math.min(zoomLevel + 25, 300));
            } else if (e.key === '-') {
                onZoom(Math.max(zoomLevel - 25, 25));
            } else if (e.key === 'r') {
                onRotate();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, onZoom, onRotate, zoomLevel]);

    // Drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoomLevel > 100) {
            setIsDragging(true);
            startPos.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y
            };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoomLevel > 100) {
            setPosition({
                x: e.clientX - startPos.current.x,
                y: e.clientY - startPos.current.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Handle touch for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        if (zoomLevel > 100 && e.touches.length === 1) {
            setIsDragging(true);
            startPos.current = {
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y
            };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging && zoomLevel > 100 && e.touches.length === 1) {
            setPosition({
                x: e.touches[0].clientX - startPos.current.x,
                y: e.touches[0].clientY - startPos.current.y
            });

            e.preventDefault();
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // Handle image load events
    const handleImageLoad = () => {
        setIsLoading(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        setError('Could not load the image');
    };

    // Download the image
    const handleDownload = () => {
        if (fileName && onDownload) {
            onDownload(fileName);
        } else if (imageUrl && fileName) {
            const proxyUrl = fileName ? base64ImageService.getProxyUrl(fileName) : imageUrl;

            const link = document.createElement('a');
            link.href = proxyUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.info('Downloading image', {
                description: 'The image is downloading to your device'
            });
        }
    };

    /* 🌱 Función para copiar la imagen al portapapeles usando canvas - de ImagePreview */
    const handleCopyImage = async () => {
        if (!fileName || !imageUrl) return;

        setCopyLoading(true);
        try {
            const img = new Image();
            const proxyUrl = fileName ? base64ImageService.getProxyUrl(fileName) : imageUrl;

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
                            tryFallbackCopyMethod(canvas);
                        }
                    }
                });
            } catch (err) {
                tryFallbackCopyMethod(canvas);
            }
        } catch (error) {
            toast.error('Copy error', {
                description: 'Could not copy the image. Try the "Download" option'
            });
        } finally {
            setCopyLoading(false);
        }
    };

    /* 🌱 Función de respaldo para copiar la imagen usando un enlace de descarga - de ImagePreview */
    const tryFallbackCopyMethod = (canvas: HTMLCanvasElement) => {
        try {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = fileName || 'image.png';

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

    if (!imageUrl) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal>
            <DialogContent className='!sm:rounded-none !h-screen !max-h-screen !w-screen !max-w-none !overflow-hidden !p-0'>
                {/* Header */}
                <DialogHeader className='bg-background/80 absolute top-0 right-0 left-0 z-10 flex flex-row items-center justify-between gap-4 px-4 py-2 backdrop-blur-md'>
                    <DialogTitle className='truncate text-base font-normal'></DialogTitle>

                    <div className='flex items-center gap-2'>
                        <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
                            <SheetTrigger asChild>
                                <Button disabled variant='ghost' size='icon' className='h-8 w-8'>
                                    <Info className='h-4 w-4' />
                                </Button>
                            </SheetTrigger>
                            <SheetContent className='w-full max-w-sm sm:max-w-md'>
                                <SheetHeader>
                                    <SheetTitle>Image Details</SheetTitle>
                                </SheetHeader>
                                <div className='mt-6 space-y-4'>
                                    {/* Información del archivo - Igual que en ImagePreview */}
                                    <div>
                                        <h3 className='mb-2 text-sm font-medium'>
                                            File Information
                                        </h3>
                                        <div className='grid grid-cols-2 gap-x-4 gap-y-2 text-sm'>
                                            <div className='text-muted-foreground'>Type:</div>
                                            <div>
                                                <Badge
                                                    variant='default'
                                                    className='font-mono text-xs'
                                                >
                                                    {mimeType}
                                                </Badge>
                                            </div>

                                            <div className='text-muted-foreground'>Size:</div>
                                            <div>{formatFileSize(size)}</div>

                                            {width && height && (
                                                <>
                                                    <div className='text-muted-foreground'>
                                                        Dimensions:
                                                    </div>
                                                    <div>
                                                        {width} × {height} px
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Detalles técnicos - Igual que en ImagePreview */}
                                    <div>
                                        <h3 className='mb-2 text-sm font-medium'>
                                            Technical Details
                                        </h3>
                                        <div className='grid grid-cols-2 gap-x-4 gap-y-2 text-sm'>
                                            {quality !== undefined && (
                                                <>
                                                    <div className='text-muted-foreground'>
                                                        JPEG Quality:
                                                    </div>
                                                    <div>{quality}%</div>
                                                </>
                                            )}

                                            {isProgressiveJpeg !== undefined && (
                                                <>
                                                    <div className='text-muted-foreground'>
                                                        Progressive JPEG:
                                                    </div>
                                                    <div>{isProgressiveJpeg ? 'Yes' : 'No'}</div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Button variant='ghost' size='icon' className='h-8 w-8' onClick={onClose}>
                            <X className='h-4 w-4' />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Main image container */}
                <div
                    ref={containerRef}
                    className='bg-background/10 relative flex h-full w-full items-center justify-center overflow-hidden backdrop-blur-sm'
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{
                        cursor: isDragging ? 'grabbing' : zoomLevel > 100 ? 'grab' : 'default'
                    }}
                >
                    {isLoading && (
                        <div className='absolute inset-0 flex items-center justify-center'>
                            <Loader2 className='text-primary/70 h-12 w-12 animate-spin' />
                        </div>
                    )}

                    {error && (
                        <div className='absolute inset-0 flex flex-col items-center justify-center space-y-2 p-4 text-center'>
                            <div className='bg-destructive/10 rounded-full p-3'>
                                <X className='text-destructive h-6 w-6' />
                            </div>
                            <p className='text-destructive font-medium'>{error}</p>
                            <p className='text-muted-foreground text-sm'>
                                Could not load the image. Please try again.
                            </p>
                        </div>
                    )}

                    <div
                        className='transition-transform'
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px)`
                        }}
                    >
                        <img
                            src={imageUrl}
                            alt={fileName || 'Fullscreen image'}
                            className='max-h-none max-w-none transform-gpu object-contain'
                            style={{
                                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                                transformOrigin: 'center',
                                opacity: isLoading ? 0 : 1,
                                transition: 'opacity 0.2s ease'
                            }}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            draggable={false}
                        />
                    </div>
                </div>

                {/* Footer with controls */}
                <DialogFooter className='bg-background/80 absolute right-0 bottom-0 left-0 flex items-center justify-between px-4 py-2 backdrop-blur-md'>
                    <div className='flex items-center gap-2'>
                        <Button variant='outline' size='sm' onClick={handleDownload}>
                            <Download className='mr-2 h-4 w-4' />
                            Download
                        </Button>

                        <Button
                            variant='outline'
                            size='sm'
                            onClick={handleCopyImage}
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

                    <ImageControls
                        zoomLevel={zoomLevel}
                        onZoom={onZoom}
                        onRotate={onRotate}
                        onFullscreen={() => {}}
                        className='bg-transparent backdrop-blur-none'
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
