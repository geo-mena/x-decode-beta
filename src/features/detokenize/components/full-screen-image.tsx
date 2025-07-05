'use client';

import { useEffect, useRef, useState } from 'react';
import { Copy, Download, Info, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import detokenizeService from '@/lib/identity-api/detokenize.service';
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
import { ImageControls } from './image-controls';

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
        if (!bytes) return 'Desconocido';
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
                // Implementación para imagen anterior (se podría agregar como prop)
            } else if (e.key === 'ArrowRight') {
                // Implementación para imagen siguiente (se podría agregar como prop)
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
        setError('No se pudo cargar la imagen');
    };

    // Download the image - usando la lógica de ImagePreview
    const handleDownload = () => {
        if (fileName && onDownload) {
            onDownload(fileName);
        } else if (imageUrl && fileName) {
            const proxyUrl = fileName ? detokenizeService.getProxyUrl(fileName) : imageUrl;

            const link = document.createElement('a');
            link.href = proxyUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.info('Descargando imagen', {
                description: 'La imagen se está descargando a su dispositivo'
            });
        }
    };

    /* 🌱 Función para copiar la imagen al portapapeles usando canvas - de ImagePreview */
    const handleCopyImage = async () => {
        if (!fileName || !imageUrl) return;

        setCopyLoading(true);
        try {
            const img = new Image();
            const proxyUrl = fileName ? detokenizeService.getProxyUrl(fileName) : imageUrl;

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
                            toast.success('Imagen copiada', {
                                description: 'La imagen fue copiada al portapapeles'
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
            toast.error('Error al copiar', {
                description: 'No se pudo copiar la imagen. Intente con la opción "Descargar"'
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
            link.download = fileName || 'imagen.png';

            toast.info('Descargando imagen', {
                description: 'La imagen no se puede copiar directamente. Se descargará en su lugar.'
            });

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (fallbackError) {
            toast.error('Error al procesar', {
                description: 'No se pudo procesar la imagen. Intente con la opción "Descargar"'
            });
        }
    };

    if (!imageUrl) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal>
            <DialogContent className='!h-screen !max-h-screen !w-screen !max-w-none !overflow-hidden p-0 !sm:rounded-none'>
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
                                    <SheetTitle>Detalles de la imagen</SheetTitle>
                                </SheetHeader>
                                <div className='mt-6 space-y-4'>
                                    {/* Información del archivo - Igual que en ImagePreview */}
                                    <div>
                                        <h3 className='mb-2 text-sm font-medium'>
                                            Información del archivo
                                        </h3>
                                        <div className='grid grid-cols-2 gap-x-4 gap-y-2 text-sm'>
                                            <div className='text-muted-foreground'>Tipo:</div>
                                            <div>
                                                <Badge
                                                    variant='default'
                                                    className='font-mono text-xs'
                                                >
                                                    {mimeType}
                                                </Badge>
                                            </div>

                                            <div className='text-muted-foreground'>Tamaño:</div>
                                            <div>{formatFileSize(size)}</div>

                                            {width && height && (
                                                <>
                                                    <div className='text-muted-foreground'>
                                                        Dimensiones:
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
                                            Detalles técnicos
                                        </h3>
                                        <div className='grid grid-cols-2 gap-x-4 gap-y-2 text-sm'>
                                            {quality !== undefined && (
                                                <>
                                                    <div className='text-muted-foreground'>
                                                        Calidad JPEG:
                                                    </div>
                                                    <div>{quality}%</div>
                                                </>
                                            )}

                                            {isProgressiveJpeg !== undefined && (
                                                <>
                                                    <div className='text-muted-foreground'>
                                                        JPEG Progresivo:
                                                    </div>
                                                    <div>{isProgressiveJpeg ? 'Sí' : 'No'}</div>
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
                                No se pudo cargar la imagen. Por favor, inténtelo de nuevo.
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
                            alt={fileName || 'Imagen en pantalla completa'}
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
                            Descargar
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
                            Copiar Imagen
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
