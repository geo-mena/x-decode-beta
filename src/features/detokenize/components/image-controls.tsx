import { Maximize, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ImageControlsProps {
    onZoom: (level: number) => void;
    onRotate: () => void;
    onFullscreen: () => void;
    zoomLevel: number;
    minZoom?: number;
    maxZoom?: number;
    className?: string;
}

export function ImageControls({
    onZoom,
    onRotate,
    onFullscreen,
    zoomLevel,
    minZoom = 25,
    maxZoom = 300,
    className = ''
}: ImageControlsProps) {
    const handleZoom = (direction: 'in' | 'out') => {
        if (direction === 'in' && zoomLevel < maxZoom) {
            const newZoom = Math.min(zoomLevel + 25, maxZoom);
            onZoom(newZoom);
        } else if (direction === 'out' && zoomLevel > minZoom) {
            const newZoom = Math.max(zoomLevel - 25, minZoom);
            onZoom(newZoom);
        }
    };

    return (
        <TooltipProvider>
            <div
                className={`bg-background/50 flex gap-1 rounded-md p-1 backdrop-blur-sm ${className}`}
            >
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6'
                            onClick={() => handleZoom('out')}
                            disabled={zoomLevel <= minZoom}
                        >
                            <ZoomOut className='h-3 w-3' />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className='text-xs'>Reducir zoom</p>
                    </TooltipContent>
                </Tooltip>

                <span className='flex items-center px-1 text-xs'>{zoomLevel}%</span>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6'
                            onClick={() => handleZoom('in')}
                            disabled={zoomLevel >= maxZoom}
                        >
                            <ZoomIn className='h-3 w-3' />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className='text-xs'>Aumentar zoom</p>
                    </TooltipContent>
                </Tooltip>

                <Separator orientation='vertical' className='mx-1 h-4' />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant='ghost' size='icon' className='h-6 w-6' onClick={onRotate}>
                            <RotateCw className='h-3 w-3' />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className='text-xs'>Rotar imagen 90°</p>
                    </TooltipContent>
                </Tooltip>

                <Separator orientation='vertical' className='mx-1 h-4' />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6'
                            onClick={onFullscreen}
                        >
                            <Maximize className='h-3 w-3' />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className='text-xs'>Pantalla completa</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}
