'use client';

import { useState } from 'react';
import { Check, CircleCheck, CloudAlert, CloudCog, Copy, FileWarning, Loader } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { JsonHighlighter } from '@/components/ui/json-highlighter';

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
    const [showPrettyJson, _setShowPrettyJson] = useState(true);
    const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

    // Format JSON for display
    const formatJson = (data: Record<string, any> | null): string => {
        if (!data) return '';

        try {
            return showPrettyJson ? JSON.stringify(data, null, 2) : JSON.stringify(data);
        } catch (e) {
            return 'Error formatting JSON';
        }
    };

    // Copy JSON to clipboard
    const handleCopyJson = async () => {
        if (!data) return;

        try {
            await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            setCopyState('copied');

            setTimeout(() => {
                setCopyState('idle');
            }, 2000);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    };

    // Renderizar estado del polling
    // const renderPollingStatus = () => {
    //     if (!isPolling && !pollingStatus) return null;

    //     let estado = pollingStatus;
    //     if (!estado && data?.status) {
    //         estado = data.status;
    //     }
    //     if (!estado && data?.transaction?.status) {
    //         estado = data.transaction.status;
    //     }

    //     return (
    //         <div className='mb-4 flex items-center justify-between rounded-md border p-3'>
    //             <div className='flex items-center gap-2'>
    //                 {(estado === 'PENDING' || !estado) && (
    //                     <CloudLightning className='h-5 w-5 animate-pulse text-yellow-500' />
    //                 )}
    //                 {estado === 'DONE' && <Cloud className='h-5 w-5 text-green-500' />}
    //                 {estado === 'FAILED' && <CloudAlert className='h-5 w-5 text-red-500' />}
    //                 <div>
    //                     <p className='text-sm font-medium'>
    //                         Estado:{' '}
    //                         <Badge
    //                             variant={
    //                                 estado === 'DONE'
    //                                     ? 'success'
    //                                     : estado === 'FAILED'
    //                                       ? 'destructive'
    //                                       : 'default'
    //                             }
    //                         >
    //                             {(estado === 'PENDING' || !estado) && 'Pendiente'}
    //                             {estado === 'DONE' && 'Completado'}
    //                             {estado === 'FAILED' && 'Fallido'}
    //                         </Badge>
    //                     </p>
    //                     <p className='text-muted-foreground mt-1 text-sm'>
    //                         {(estado === 'PENDING' || !estado) &&
    //                             'La validación está en proceso, espere un momento...'}
    //                         {estado === 'DONE' && 'La validación se ha completado correctamente.'}
    //                         {estado === 'FAILED' && 'La validación ha fallado.'}
    //                     </p>
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // };

    return (
        <Card className='flex h-full w-full max-w-full flex-col overflow-hidden'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <div>
                    <CardTitle>Output Results</CardTitle>
                    <CardDescription className='mt-1'>
                        Detailed information about the document validation process
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className='flex-grow overflow-x-auto'>
                {isLoading && (
                    <div className='flex h-full flex-col items-center justify-center'>
                        <CloudCog className='mb-4 h-20 w-20 animate-pulse' />
                        <p className='text-muted-foreground'>Processing request...</p>
                    </div>
                )}

                {error && !isLoading && (
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <CloudAlert className='mb-4 h-20 w-20' />
                        <p className='text-sm'>{error}</p>
                    </div>
                )}

                {!data && !error && !isLoading && !isPolling && (
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <CloudCog className='mb-4 h-20 w-20' />
                        <p className='text-sm'>
                            Complete the form to start or query a validation
                        </p>
                    </div>
                )}

                {isPolling && !data && !error && !isLoading && (
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <Loader className='mb-4 h-20 w-20 animate-spin' />
                        <p>Validating document, this may take a few seconds...</p>
                        <p className='mt-2 text-sm'>Status: {pollingStatus || 'Pending'}</p>
                    </div>
                )}

                {data && (
                    <div className='space-y-4'>
                        {/* Show polling status if active */}
                        {/* {renderPollingStatus()} */}

                        {/* Controles para el formato JSON */}
                        <div className='flex items-center justify-between'>
                            <Label className='text-sm font-medium'>JSON Response</Label>
                        </div>

                        {/* JSON visualization */}
                        <div className='relative'>
                            <JsonHighlighter
                                code={formatJson(data)}
                                className='mt-2 max-h-[550px] overflow-auto'
                            />

                            {/* Copy button */}
                            <Button
                                variant='secondary'
                                size='sm'
                                className='absolute top-2 right-2'
                                onClick={handleCopyJson}
                            >
                                {copyState === 'copied' ? (
                                    <>
                                        <Check className='mr-1 h-3 w-3' />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className='mr-1 h-3 w-3' />
                                        Copy
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Show warning if validation failed */}
                        {(pollingStatus === 'FAILED' ||
                            data.status === 'FAILED' ||
                            data.transaction?.status === 'FAILED') && (
                            <Alert variant='destructive' className='mt-4'>
                                <FileWarning className='h-4 w-4' />
                                <AlertTitle>Validation failed</AlertTitle>
                                <AlertDescription>
                                    The document validation process has failed. Verify that
                                    the images are clear and that the provided data is
                                    correct.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Show info if validation was successful */}
                        {(pollingStatus === 'DONE' ||
                            data.status === 'DONE' ||
                            data.transaction?.status === 'DONE') && (
                            <Alert className='border-l-primary mt-4 border-l-4'>
                                <CircleCheck className='stroke-primary h-5 w-5' />
                                <AlertTitle>Validation Completed</AlertTitle>
                                <AlertDescription>
                                    {data.document?.status === 'ERROR_NOT_READABLE_ID' && (
                                        <span className='mt-1 block'>
                                            It has been detected that the document has readability
                                            problems.
                                        </span>
                                    )}
                                    {data.document?.status === 'DENIED_FRAUD' && (
                                        <span className='mt-1 block'>
                                            The document has been rejected due to suspicion of fraud.
                                        </span>
                                    )}
                                    {data.document?.status === 'APPROVED_VERIFIED' && (
                                        <span className='mt-1 block'>
                                            The document has been verified and approved.
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
