'use client';

import { useState } from 'react';
import { Base64EncodeResponseData } from '@/types/image-base64';
import {
    AlertCircle,
    Check,
    CloudAlert,
    CloudCog,
    Copy,
    Download,
    ExternalLink,
    Images
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

interface Base64ResultProps {
    data: Base64EncodeResponseData | Base64EncodeResponseData[] | null;
    error: string | null;
    isLoading: boolean;
    onCopy: (content: string, isDataUri?: boolean, resultIndex?: string) => void;
    onDownload: (dataUri: string, fileName: string) => void;
}

export function Base64Result({ data, error, isLoading, onCopy, onDownload }: Base64ResultProps) {
    const [activeTab, setActiveTab] = useState('0');
    const [showTruncated, setShowTruncated] = useState(true);
    const [copyState, setCopyState] = useState<{
        [key: string]: 'idle' | 'copied';
    }>({});

    const hasMultipleResults = data !== null && Array.isArray(data) && data.length > 1;
    const results = data ? (Array.isArray(data) ? data : [data]) : [];
    const activeResult = results.length > 0 ? results[parseInt(activeTab)] : null;

    /* 🌱 Función para formatear el tamaño del archivo en bytes */
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    /* 🌱 Función para copiar con animación de estado */
    const handleCopy = async (content: string, isDataUri: boolean = false, resultIndex: string) => {
        const key = `${resultIndex}-${isDataUri ? 'uri' : 'base64'}`;
        setCopyState({ ...copyState, [key]: 'copied' });

        await onCopy(content, isDataUri);

        setTimeout(() => {
            setCopyState({ ...copyState, [key]: 'idle' });
        }, 2000);
    };

    /* 🌱 Función para descargar el código base64 como archivo de texto */
    const handleDownloadBase64 = (content: string, fileName: string) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const dataUrl = URL.createObjectURL(blob);
        onDownload(dataUrl, `${fileName.split('.')[0]}-base64.txt`);
        setTimeout(() => URL.revokeObjectURL(dataUrl), 100);
    };

    /* 🌱 Función para truncar texto largo */
    const truncateText = (text: string, maxLength: number = 100): string => {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    /* 🌱 Renderizar detalles del resultado */
    const renderResultDetails = (resultData: Base64EncodeResponseData, index: string) => {
        const base64Key = `${index}-base64`;

        return (
            <div className='space-y-4'>
                <div>
                    <h3 className='mb-2 text-sm font-medium'>Información de la imagen</h3>
                    <div className='grid grid-cols-2 gap-x-4 gap-y-2 text-sm'>
                        <div className='text-muted-foreground'>Nombre:</div>
                        <div className='truncate font-medium' title={resultData.original_name}>
                            {resultData.original_name}
                        </div>

                        {resultData.original_url && (
                            <>
                                <div className='text-muted-foreground'>URL:</div>
                                <div className='truncate' title={resultData.original_url}>
                                    <a
                                        href={resultData.original_url}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='flex items-center text-blue-500 hover:underline'
                                    >
                                        {truncateText(resultData.original_url, 20)}
                                        <ExternalLink className='ml-1 h-3 w-3' />
                                    </a>
                                </div>
                            </>
                        )}

                        <div className='text-muted-foreground'>Tipo:</div>
                        <div>
                            <Badge variant='default' className='font-mono text-xs'>
                                {resultData.mime_type}
                            </Badge>
                        </div>

                        <div className='text-muted-foreground'>Tamaño:</div>
                        <div>{resultData.size_formatted || formatFileSize(resultData.size)}</div>

                        <div className='text-muted-foreground'>Dimensiones:</div>
                        <div>
                            {resultData.width} × {resultData.height} px
                        </div>
                    </div>
                </div>

                <Separator />

                <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                        <h3 className='text-sm font-medium'>Código Base64</h3>
                        <div className='flex items-center space-x-2'>
                            <Switch
                                id='truncate-switch'
                                checked={showTruncated}
                                onCheckedChange={setShowTruncated}
                            />
                            <Label
                                htmlFor='truncate-switch'
                                className='text-muted-foreground text-xs'
                            >
                                Mostrar truncado
                            </Label>
                        </div>
                    </div>

                    <Textarea
                        readOnly
                        value={
                            showTruncated ? truncateText(resultData.base64, 400) : resultData.base64
                        }
                        className='h-24 resize-none font-mono text-xs'
                    />

                    <div className='flex gap-2'>
                        <Button
                            variant='secondary'
                            onClick={() => handleCopy(resultData.base64, false, index)}
                            className='flex-1'
                        >
                            {copyState[base64Key] === 'copied' ? (
                                <>
                                    <Check className='mr-2 h-4 w-4' />
                                    ¡Copiado!
                                </>
                            ) : (
                                <>
                                    <Copy className='mr-2 h-4 w-4' />
                                    Copiar Base64
                                </>
                            )}
                        </Button>

                        <Button
                            variant='secondary'
                            onClick={() =>
                                handleDownloadBase64(resultData.base64, resultData.original_name)
                            }
                            className='flex-1'
                        >
                            <Download className='mr-2 h-4 w-4' />
                            Descargar TXT
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card className='flex h-full w-full max-w-full flex-col overflow-hidden'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <div>
                    <CardTitle>Resultados Base64</CardTitle>
                    <CardDescription className='mt-1'>
                        {hasMultipleResults
                            ? 'Códigos base64 generados a partir de las imágenes'
                            : 'Código base64 generado a partir de la imagen'}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className='flex-grow overflow-x-auto'>
                {isLoading && (
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <CloudCog className='mb-4 h-20 w-20 animate-pulse' />
                        <p className='text-sm'>Codificando imagen(es) a Base64...</p>
                    </div>
                )}

                {error && !isLoading && (
                    <Alert variant='destructive' className='mb-4'>
                        <AlertCircle className='h-4 w-4' />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {!data && !error && !isLoading && (
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <CloudAlert className='mb-4 h-20 w-20' />
                        <p className='text-sm'>
                            Suba una imagen o proporcione una URL para obtener su código Base64
                        </p>
                    </div>
                )}

                {results.length > 0 && (
                    <>
                        {hasMultipleResults ? (
                            <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
                                <TabsList className='mb-4 grid grid-cols-2'>
                                    {results.map((_, index) => (
                                        <TabsTrigger key={index} value={index.toString()}>
                                            <div className='flex items-center gap-1.5'>
                                                <Images className='h-4 w-4' />
                                                <span>Resultado {index + 1}</span>
                                            </div>
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                {results.map((result, index) => (
                                    <TabsContent
                                        key={index}
                                        value={index.toString()}
                                        className='mt-0 space-y-6'
                                    >
                                        {renderResultDetails(result, index.toString())}
                                    </TabsContent>
                                ))}
                            </Tabs>
                        ) : (
                            <div className='space-y-6'>
                                {activeResult && renderResultDetails(activeResult, '0')}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
