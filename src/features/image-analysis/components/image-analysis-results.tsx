'use client';

import { useRef, useState } from 'react';
import type { ImageAnalysisResponse } from '@/types/image-analysis';
import { AlertCircle, CloudAlert, CloudCog, ImageIcon, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import useReportDownload from '@/hooks/use-report-download';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import DownloadReport from './download-report';

interface ImageAnalysisResultsProps {
    data: ImageAnalysisResponse | null;
    error: string | null;
    isLoading: boolean;
    imagePreview: string | null;
}

export const ImageAnalysisResults = ({
    data,
    error,
    isLoading,
    imagePreview
}: ImageAnalysisResultsProps) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null!);

    const { isCapturing, isDownloading, downloadReportAsImage } = useReportDownload(cardRef);

    if (isLoading) {
        return (
            <Card className='flex h-full flex-col'>
                <CardHeader>
                    <CardTitle>Reporte de análisis</CardTitle>
                    <CardDescription>
                        Ingrese una imagen para analizar si fue creada por IA o por humanos
                    </CardDescription>
                </CardHeader>
                <CardContent className='flex-grow'>
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <CloudCog className='h-20 w-20 animate-pulse' />
                        <p className='mt-4 text-sm'>Analizando imagen...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className='flex h-full flex-col'>
                <CardHeader>
                    <CardTitle>Error de análisis</CardTitle>
                    <CardDescription>No se pudo procesar la solicitud</CardDescription>
                </CardHeader>
                <CardContent className='flex-grow'>
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <AlertCircle className='mb-4 h-20 w-20 text-red-500' />
                        <p className='text-sm'>
                            Intente nuevamente con otra imagen o verifique su conexión.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data || !data.success || !data.data) {
        return (
            <Card className='flex h-full flex-col'>
                <CardHeader>
                    <CardTitle>Reporte de análisis</CardTitle>
                    <CardDescription>
                        Ingrese una imagen para analizar si fue creada por IA o por humanos
                    </CardDescription>
                </CardHeader>
                <CardContent className='flex-grow'>
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <CloudAlert className='h-20 w-20' />
                        <p className='mt-4 text-sm'>
                            Sin datos para mostrar, por favor sube una imagen
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const report = data.data.report;
    const facets = data.data.facets;
    const isAI = report.verdict === 'ai';

    // Calculamos porcentajes para mostrar
    const humanConfidence = Math.round(report.human.confidence * 100);
    const aiConfidence = Math.round(report.ai.confidence * 100);

    // Extraemos los datos de los generadores de IA e incluimos Human Made
    const generators = Object.entries(report.generator).map(([name, data]) => ({
        name: formatGeneratorName(name),
        confidence: Math.round(data.confidence * 100)
    }));

    generators.push({
        name: 'Human Made',
        confidence: humanConfidence
    });

    generators.sort((a, b) => b.confidence - a.confidence);

    function formatGeneratorName(name: string): string {
        if (name === 'this_person_does_not_exist') return 'This Person Does Not Exist';
        if (name === 'four_o') return '4o';

        return name
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    function getClassColor(name: string): string {
        const colorMap: Record<string, string> = {
            'Human Made': '#4ade80',
            Midjourney: '#d946ef',
            'Dall E': '#ffffff',
            'Stable Diffusion': '#3b82f6',
            'This Person Does Not Exist': '#f97316',
            'Adobe Firefly': '#ff4500',
            Flux: '#8b5cf6',
            '4o': '#10b981'
        };

        return colorMap[name] || '#9ca3af';
    }

    return (
        <Card className='w-full' ref={cardRef}>
            <CardHeader>
                <CardTitle>Reporte de análisis</CardTitle>
                <CardDescription>
                    A continuación se muestran los resultados del análisis de la imagen
                </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    {/* Imagen analizada */}
                    <div className='bg-neutro-800 relative aspect-[3/4] w-full overflow-hidden rounded-md'>
                        {!imageLoaded && imagePreview && (
                            <div className='absolute inset-0 flex items-center justify-center'>
                                <Loader className='h-8 w-8 animate-spin text-zinc-500' />
                            </div>
                        )}
                        {imagePreview ? (
                            <img
                                src={imagePreview || '/placeholder.svg'}
                                alt='Imagen analizada'
                                className={cn(
                                    'h-full w-full object-cover',
                                    !imageLoaded && 'opacity-0'
                                )}
                                onLoad={() => setImageLoaded(true)}
                            />
                        ) : (
                            <div className='flex h-full items-center justify-center'>
                                <ImageIcon className='text-neutro-500 h-12 w-12' />
                            </div>
                        )}
                    </div>

                    {/* Panel de resultados */}
                    <div className='flex flex-col gap-4'>
                        {/* Veredicto principal */}
                        <div className='rounded-md bg-zinc-200/50 p-4 dark:bg-zinc-800/50'>
                            <h2 className='text-center text-lg font-semibold text-emerald-500'>
                                {isAI ? 'Probablemente Generada por IA' : 'Probablemente Humano'}
                            </h2>
                        </div>
                        {/* Indicadores de calidad y NSFW */}
                        <div className='grid grid-cols-2 gap-4'>
                            <div className='rounded-md bg-zinc-200/50 p-4 dark:bg-zinc-800/50'>
                                <div className='flex flex-col items-center'>
                                    <div className='relative h-16 w-16'>
                                        {/* Semicircular gauge */}
                                        <svg viewBox='0 0 100 50' className='w-full'>
                                            <path
                                                d='M10,50 A40,40 0 1,1 90,50'
                                                fill='none'
                                                stroke='#1f2937'
                                                strokeWidth='10'
                                                strokeLinecap='round'
                                            />
                                            <path
                                                d='M10,50 A40,40 0 1,1 90,50'
                                                fill='none'
                                                stroke={
                                                    facets.quality.is_detected
                                                        ? '#4ade80'
                                                        : '#ef4444'
                                                }
                                                strokeWidth='10'
                                                strokeLinecap='round'
                                                strokeDasharray='126'
                                                strokeDashoffset='0'
                                            />
                                        </svg>
                                        <div className='absolute right-0 bottom-0 left-0 text-center'>
                                            <span className='text-muted-foreground text-xs font-normal'>
                                                Calidad
                                            </span>
                                        </div>
                                    </div>
                                    <span className='mt-2 text-lg font-semibold'>
                                        {facets.quality.is_detected ? 'Buena' : 'Pobre'}
                                    </span>
                                </div>
                            </div>

                            <div className='rounded-md bg-zinc-200/50 p-4 dark:bg-zinc-800/50'>
                                <div className='flex flex-col items-center'>
                                    <div className='relative h-16 w-16'>
                                        {/* Semicircular gauge */}
                                        <svg viewBox='0 0 100 50' className='w-full'>
                                            <path
                                                d='M10,50 A40,40 0 1,1 90,50'
                                                fill='none'
                                                stroke='#1f2937'
                                                strokeWidth='10'
                                                strokeLinecap='round'
                                            />
                                            <path
                                                d='M10,50 A40,40 0 1,1 90,50'
                                                fill='none'
                                                stroke={
                                                    facets.nsfw.is_detected ? '#4ade80' : '#ef4444'
                                                }
                                                strokeWidth='10'
                                                strokeLinecap='round'
                                                strokeDasharray='126'
                                                strokeDashoffset='0'
                                            />
                                        </svg>
                                        <div className='absolute right-0 bottom-0 left-0 text-center'>
                                            <span className='text-muted-foreground text-xs font-normal'>
                                                NSFW
                                            </span>
                                        </div>
                                    </div>
                                    <span className='mt-2 text-lg font-semibold'>
                                        {facets.nsfw.is_detected ? 'Si' : 'No'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Indicador AI y Radar */}
                        <div className='grid grid-cols-2 gap-4'>
                            <div className='rounded-md bg-zinc-200/50 p-4 dark:bg-zinc-800/50'>
                                <div className='flex flex-col items-center'>
                                    <div className='relative flex h-24 w-24 items-center justify-center'>
                                        {/* Circular indicator */}
                                        <svg viewBox='0 0 100 100' className='w-full'>
                                            {/* Fondo del círculo */}
                                            <circle
                                                cx='50'
                                                cy='50'
                                                r='40'
                                                fill='#1f2937'
                                                stroke='none'
                                            />

                                            {/* Círculo de progreso */}
                                            <circle
                                                cx='50'
                                                cy='50'
                                                r='40'
                                                fill='none'
                                                stroke={isAI ? '#f97316' : '#4ade80'}
                                                strokeWidth='8'
                                                strokeDasharray={`${2 * Math.PI * 40}`}
                                                strokeDashoffset={`${2 * Math.PI * 40 * (1 - (isAI ? report.ai.confidence : report.human.confidence))}`}
                                                strokeLinecap='round'
                                                transform='rotate(-90, 50, 50)'
                                            />

                                            <text
                                                x='50'
                                                y='45'
                                                textAnchor='middle'
                                                fill='white'
                                                fontSize='16'
                                                fontWeight='bold'
                                            >
                                                {isAI ? 'AI' : 'Human'}
                                            </text>
                                            <text
                                                x='50'
                                                y='65'
                                                textAnchor='middle'
                                                fill={isAI ? '#f97316' : '#4ade80'}
                                                fontSize='20'
                                                fontWeight='bold'
                                            >
                                                {isAI ? aiConfidence : humanConfidence}%
                                            </text>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className='rounded-md bg-zinc-200/50 p-4 dark:bg-zinc-800/50'>
                                <div className='flex flex-col items-center'>
                                    {/* Radar/Hexagon chart */}
                                    <svg viewBox='0 0 100 100' className='h-24 w-24'>
                                        {/* Outer hexagon */}
                                        <polygon
                                            points='50,10 90,30 90,70 50,90 10,70 10,30'
                                            fill='none'
                                            stroke='#333'
                                            strokeWidth='1'
                                        />
                                        {/* Middle hexagon */}
                                        <polygon
                                            points='50,30 70,40 70,60 50,70 30,60 30,40'
                                            fill='none'
                                            stroke='#333'
                                            strokeWidth='1'
                                        />
                                        {/* Inner hexagon */}
                                        <polygon
                                            points='50,40 60,45 60,55 50,60 40,55 40,45'
                                            fill='none'
                                            stroke='#333'
                                            strokeWidth='1'
                                        />
                                        {/* Data points */}
                                        <circle cx='50' cy='50' r='3' fill='#4ade80' />
                                        <circle
                                            cx={isAI ? '80' : '30'}
                                            cy='50'
                                            r='3'
                                            fill='#4ade80'
                                        />
                                        <circle cx='60' cy='70' r='3' fill='#4ade80' />
                                        {/* Text labels */}
                                        <text
                                            x='50'
                                            y='5'
                                            textAnchor='middle'
                                            fill='#666'
                                            fontSize='8'
                                        >
                                            100
                                        </text>
                                        <text
                                            x='50'
                                            y='25'
                                            textAnchor='middle'
                                            fill='#666'
                                            fontSize='8'
                                        >
                                            50
                                        </text>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Desglose de clases */}
                        <div className='rounded-md bg-zinc-200/50 p-4 dark:bg-zinc-800/50'>
                            <div className='mb-2 flex items-center justify-between border-b border-zinc-500 pb-2'>
                                <span className='text-sm font-semibold'>Clase</span>
                                <span className='text-sm font-semibold'>Probabilidad</span>
                            </div>
                            <div className='space-y-2'>
                                {generators.map((generator) => (
                                    <div
                                        key={generator.name}
                                        className='flex items-center justify-between'
                                    >
                                        <div className='flex items-center gap-2'>
                                            <div
                                                className='h-4 w-4 rounded-sm'
                                                style={{
                                                    backgroundColor: getClassColor(generator.name)
                                                }}
                                            />
                                            <span className='text-sm'>{generator.name}</span>
                                        </div>
                                        <span className='text-sm font-medium'>
                                            {generator.confidence}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className='report-footer flex justify-end'>
                <DownloadReport
                    isDownloading={isDownloading}
                    isCapturing={isCapturing}
                    onDownload={downloadReportAsImage}
                />
            </CardFooter>
        </Card>
    );
};

export default ImageAnalysisResults;
