'use client';

import { useRef, useState, useEffect } from 'react';
import { File } from 'lucide-react';
import { toast } from 'sonner';
import { documentValidationService } from '@/lib/identity-api/document-validation.service';
import { Badge } from '@/components/ui/badge';
import { DocumentValidationInput } from './components/document-validation-input';
import { DocumentValidationResult } from './components/document-validation-result';

const POLLING_INTERVAL = 5000;

export default function DocumentValidation() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationResult, setValidationResult] = useState<Record<string, any> | null>(null);
    const [pollingActive, setPollingActive] = useState(false);
    const [pollingStatus, setPollingStatus] = useState<string | null>(null);
    const inputRef = useRef<{ reset: () => void } | null>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    // Función para iniciar la validación del documento
    const handleStartValidation = async (
        country: string,
        idType: string,
        frontsideImage: string,
        backsideImage: string,
        storeResponses: boolean,
        merchantIdScanReference?: string
    ) => {
        setValidationResult(null);
        setError(null);
        setLoading(true);
        setPollingActive(false);
        setPollingStatus(null);
        stopPolling();

        try {
            const response = await documentValidationService.startDocumentValidation(
                country,
                idType,
                frontsideImage,
                backsideImage,
                storeResponses,
                merchantIdScanReference
            );

            if (!response.success) {
                setError(response.message || 'Error al iniciar la validación del documento.');
                setValidationResult(null);
                toast.error('Error de validación', {
                    description: response.message || 'No se pudo iniciar el proceso de validación.'
                });
            } else {
                setValidationResult(response.data ?? null);

                toast.success('Validación iniciada', {
                    description: `Referencia: ${response.data?.scanReference}`
                });

                if (response.data?.scanReference) {
                    startPolling(response.data.scanReference, storeResponses);
                }
            }
        } catch (err) {
            console.error('Error en startDocumentValidation:', err);
            const errorMessage = 'Error al procesar la solicitud. Intente nuevamente.';
            setError(errorMessage);
            setValidationResult(null);
            toast.error('Error', {
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    // Función para obtener datos de validación por scanReference
    const handleGetValidationData = async (scanReference: string) => {
        setValidationResult(null);
        setError(null);
        setLoading(true);
        stopPolling();

        try {
            const response = await documentValidationService.getValidationData(
                scanReference,
                false
            );

            if (!response.success) {
                setError(response.message || 'Error al obtener datos de validación.');
                setValidationResult(null);
                toast.error('Error', {
                    description:
                        response.message || 'No se pudieron obtener los datos de validación.'
                });
            } else {
                setValidationResult(response.data ?? null);
                toast.success('Datos obtenidos', {
                    description: `Datos de validación para referencia: ${scanReference}`
                });
            }
        } catch (err) {
            console.error('Error en getValidationData:', err);
            const errorMessage = 'Error al procesar la solicitud. Intente nuevamente.';
            setError(errorMessage);
            setValidationResult(null);
            toast.error('Error', {
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    // Función para iniciar el polling de estado
    const startPolling = (scanReference: string, storeResponses: boolean) => {
        setPollingActive(true);
        setPollingStatus('PENDING');

        toast.info('Verificando estado', {
            description: 'Comprobando el estado de la validación del documento...'
        });

        // Función que se ejecutará a intervalos regulares
        const checkStatus = async () => {
            try {
                const statusResponse = await documentValidationService.checkValidationStatus(
                    scanReference,
                    false
                );

                if (statusResponse.success && statusResponse.data) {
                    const status = statusResponse.data.status;
                    setPollingStatus(status);

                    setValidationResult(statusResponse.data);

                    if (status === 'DONE') {
                        stopPolling();
                        toast.success('Validación completada', {
                            description: 'El proceso de validación ha finalizado correctamente.'
                        });

                        const dataResponse = await documentValidationService.getValidationData(
                            scanReference,
                            storeResponses
                        );

                        if (dataResponse.success) {
                            setValidationResult(dataResponse.data ?? null);
                            toast.success('Datos obtenidos', {
                                description: 'Se han recuperado los datos de validación.'
                            });
                        } else {
                            setError('Error al obtener los datos finales de validación.');
                            toast.error('Error', {
                                description:
                                    'No se pudieron obtener los datos finales de validación.'
                            });
                        }
                    } else if (status === 'FAILED') {
                        stopPolling();
                        setError('La validación del documento ha fallado.');
                        toast.error('Validación fallida', {
                            description: 'El proceso de validación del documento ha fallado.'
                        });
                    }
                    // Si sigue en PENDING, continuar el polling
                }
            } catch (err) {
                console.error('Error durante el polling:', err);
                toast.error('Error de conexión', {
                    description: 'Error al verificar el estado, reintentando...'
                });
            }
        };

        checkStatus();

        pollingIntervalRef.current = setInterval(checkStatus, POLLING_INTERVAL);
    };

    // Función para detener el polling
    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        setPollingActive(false);
    };

    // Función para restablecer el formulario
    const handleReset = () => {
        setValidationResult(null);
        setError(null);
        setLoading(false);
        stopPolling();
        setPollingStatus(null);

        if (inputRef.current && typeof inputRef.current.reset === 'function') {
            inputRef.current.reset();
        }

        toast.info('Formulario restablecido', {
            description: 'Todos los datos han sido borrados para una nueva consulta.'
        });
    };

    return (
        <>
            {/* ===== Main ===== */}
            <>
                <div className='mb-6 flex items-center justify-between'>
                    <div>
                        <h1 className='text-2xl font-bold tracking-tight'>
                            Validación de Documentos
                        </h1>
                        <p className='text-muted-foreground text-sm'>
                            Valide documentos de identidad como pasaportes, licencias de conducir o
                            tarjetas de identificación.
                        </p>
                    </div>
                </div>

                <a
                    href='https://docs.identity-platform.io/docs/identity-api/resources/Verify/document-validation'
                    target='_blank'
                    rel='noopener noreferrer'
                >
                    <Badge variant='secondary' className='mb-4 cursor-pointer p-2 text-emerald-500'>
                        <File className='h-4 w-4' />
                        <span className='ml-2'>Documentación</span>
                    </Badge>
                </a>

                <div className='grid gap-6 lg:grid-cols-2'>
                    {/* Formulario de entrada de datos */}
                    <DocumentValidationInput
                        ref={inputRef}
                        onStartValidation={handleStartValidation}
                        onGetValidationData={handleGetValidationData}
                        onReset={handleReset}
                        isLoading={loading}
                        isPolling={pollingActive}
                    />

                    {/* Visualización de resultados */}
                    <DocumentValidationResult
                        data={validationResult}
                        error={error}
                        isLoading={loading}
                        isPolling={pollingActive}
                        pollingStatus={pollingStatus}
                    />
                </div>
            </>
        </>
    );
}
