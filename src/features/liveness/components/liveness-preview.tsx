'use client';

import { CloudAlert, CloudCog } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LivenessPreviewProps {
    isLoading: boolean;
    hasResults: boolean;
}

export function LivenessPreview({ isLoading, hasResults }: LivenessPreviewProps) {
    return (
        <Card className='flex h-full flex-col'>
            <CardHeader>
                <CardTitle>Resultado de Liveness</CardTitle>
                <CardDescription>
                    Vista previa y resultados de la evaluación de liveness
                </CardDescription>
            </CardHeader>
            <CardContent className='flex-grow'>
                {isLoading && (
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <CloudCog className='mb-4 h-20 w-20 animate-pulse' />
                        <p className='text-sm'>Procesando imágenes...</p>
                    </div>
                )}

                {!hasResults && !isLoading && (
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <CloudCog className='mb-4 h-20 w-20' />
                        <p className='text-sm'>Suba una imagen para ver los resultados</p>
                    </div>
                )}

                {hasResults && !isLoading && (
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <CloudAlert className='mb-4 h-20 w-20' />
                        <p className='text-sm'>Los resultados se mostrarán en la tabla</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
