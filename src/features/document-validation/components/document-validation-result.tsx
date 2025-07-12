'use client';

import { useState } from 'react';
import {
    Check,
    CircleCheck,
    Cloud,
    CloudAlert,
    CloudCog,
    CloudLightning,
    Copy,
    FileWarning,
    Loader
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface DocumentValidationResultProps {
    data: Record<string, any> | null;
    error: string | null;
    isLoading: boolean;
    isPolling: boolean;
    pollingStatus: string | null;
}

export function DocumentValidationResult({
    data,
    error,
    isLoading,
    isPolling,
    pollingStatus
}: DocumentValidationResultProps) {
    const [showPrettyJson, setShowPrettyJson] = useState(true);
    const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

    // Formatear el JSON para mostrarlo
    const formatJson = (data: Record<string, any> | null): string => {
        if (!data) return '';

        try {
            return showPrettyJson ? JSON.stringify(data, null, 2) : JSON.stringify(data);
        } catch (e) {
            return 'Error al formatear JSON';
        }
    };

    // Copiar el JSON al portapapeles
    const handleCopyJson = async () => {
        if (!data) return;

        try {
            await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            setCopyState('copied');

            setTimeout(() => {
                setCopyState('idle');
            }, 2000);
        } catch (error) {
            console.error('Error al copiar al portapapeles:', error);
        }
    };

    // Renderizar estado del polling
    const renderPollingStatus = () => {
        if (!isPolling && !pollingStatus) return null;

        let estado = pollingStatus;
        if (!estado && data?.status) {
            estado = data.status;
        }
        if (!estado && data?.transaction?.status) {
            estado = data.transaction.status;
        }

        return (
            <div className='mb-4 flex items-center justify-between rounded-md border p-3'>
                <div className='flex items-center gap-2'>
                    {(estado === 'PENDING' || !estado) && (
                        <CloudLightning className='h-5 w-5 animate-pulse text-yellow-500' />
                    )}
                    {estado === 'DONE' && <Cloud className='h-5 w-5 text-green-500' />}
                    {estado === 'FAILED' && <CloudAlert className='h-5 w-5 text-red-500' />}
                    <div>
                        <p className='text-sm font-medium'>
                            Estado:{' '}
                            <Badge
                                variant={
                                    estado === 'DONE'
                                        ? 'success'
                                        : estado === 'FAILED'
                                          ? 'destructive'
                                          : 'default'
                                }
                            >
                                {(estado === 'PENDING' || !estado) && 'Pendiente'}
                                {estado === 'DONE' && 'Completado'}
                                {estado === 'FAILED' && 'Fallido'}
                            </Badge>
                        </p>
                        <p className='text-muted-foreground mt-1 text-sm'>
                            {(estado === 'PENDING' || !estado) &&
                                'La validación está en proceso, espere un momento...'}
                            {estado === 'DONE' && 'La validación se ha completado correctamente.'}
                            {estado === 'FAILED' && 'La validación ha fallado.'}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card className='flex h-full w-full max-w-full flex-col overflow-hidden'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <div>
                    <CardTitle>Resultados de Validación</CardTitle>
                    <CardDescription className='mt-1'>
                        Información detallada del proceso de validación del documento
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className='flex-grow overflow-x-auto'>
                {isLoading && (
                    <div className='flex h-full flex-col items-center justify-center'>
                        <CloudCog className='mb-4 h-20 w-20 animate-pulse' />
                        <p className='text-muted-foreground'>Procesando solicitud...</p>
                    </div>
                )}

                {error && !isLoading && (
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <CloudAlert className='mb-4 h-20 w-20' />
                        <p className='text-sm'>
                            {error}
                        </p>
                    </div>
                )}

                {!data && !error && !isLoading && !isPolling && (
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <CloudCog className='mb-4 h-20 w-20' />
                        <p className='text-sm'>
                            Complete el formulario para iniciar o consultar una validación
                        </p>
                    </div>
                )}

                {isPolling && !data && !error && !isLoading && (
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <Loader className='mb-4 h-20 w-20 animate-spin' />
                        <p>Validando documento, esto puede tomar unos segundos...</p>
                        <p className='mt-2 text-sm'>Estado: {pollingStatus || 'Pendiente'}</p>
                    </div>
                )}

                {data && (
                    <div className='space-y-4'>
                        {/* Mostrar estado de polling si está activo */}
                        {renderPollingStatus()}

                        {/* Controles para el formato JSON */}
                        <div className='flex items-center justify-between'>
                            <Label className='text-sm font-medium'>Respuesta JSON</Label>
                            <div className='flex items-center space-x-2'>
                                <Switch
                                    checked={showPrettyJson}
                                    onCheckedChange={setShowPrettyJson}
                                    id='pretty-json'
                                />
                                <Label
                                    htmlFor='pretty-json'
                                    className='text-muted-foreground text-xs'
                                >
                                    Formato legible
                                </Label>
                            </div>
                        </div>

                        {/* Visualización del JSON */}
                        <div className='relative'>
                            <pre
                                className={`bg-muted mt-2 max-h-[400px] overflow-auto rounded-md p-4 font-mono text-xs ${
                                    showPrettyJson ? 'whitespace-pre' : 'whitespace-pre-wrap'
                                }`}
                            >
                                {formatJson(data)}
                            </pre>

                            {/* Botón de copiar */}
                            <Button
                                variant='secondary'
                                size='sm'
                                className='absolute top-2 right-2'
                                onClick={handleCopyJson}
                            >
                                {copyState === 'copied' ? (
                                    <>
                                        <Check className='mr-1 h-3 w-3' />
                                        Copiado
                                    </>
                                ) : (
                                    <>
                                        <Copy className='mr-1 h-3 w-3' />
                                        Copiar
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Mostrar advertencia si la validación falló */}
                        {(pollingStatus === 'FAILED' ||
                            data.status === 'FAILED' ||
                            data.transaction?.status === 'FAILED') && (
                            <Alert variant='destructive' className='mt-4'>
                                <FileWarning className='h-4 w-4' />
                                <AlertTitle>Validación fallida</AlertTitle>
                                <AlertDescription>
                                    El proceso de validación del documento ha fallado. Verifique que
                                    las imágenes sean claras y que los datos proporcionados sean
                                    correctos.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Mostrar info si la validación fue exitosa */}
                        {(pollingStatus === 'DONE' ||
                            data.status === 'DONE' ||
                            data.transaction?.status === 'DONE') && (
                            <Alert className='mt-4 border-l-4 border-l-green-500'>
                                <CircleCheck className='h-5 w-5 stroke-green-500' />
                                <AlertTitle>Validación completada</AlertTitle>
                                <AlertDescription>
                                    {data.document?.status === 'ERROR_NOT_READABLE_ID' && (
                                        <span className='mt-1 block text-amber-600'>
                                            Nota: Se ha detectado que el documento tiene problemas
                                            de legibilidad.
                                        </span>
                                    )}
                                    {data.document?.status === 'DENIED_FRAUD' && (
                                        <span className='mt-1 block text-red-600'>
                                            Nota: El documento ha sido rechazado por sospecha de
                                            fraude.
                                        </span>
                                    )}
                                    {data.document?.status === 'APPROVED_VERIFIED' && (
                                        <span className='mt-1 block text-green-600'>
                                            Nota: El documento ha sido verificado y aprobado.
                                        </span>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
