'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { File } from 'lucide-react';
import { toast } from 'sonner';
import { createDocumentValidationService } from '@/lib/identity-api/document-validation.service';
import { usePlaygroundStore } from '@/store';
import { Badge } from '@/components/ui/badge';
import { DocumentValidationInput } from './components/document-validation-input';
import { DocumentValidationResult } from './components/document-validation-result';

const POLLING_INTERVAL = 5000;

export default function DocumentValidation() {
    const { apiKey } = usePlaygroundStore();
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

    // Function to start document validation
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
            if (!apiKey.trim()) {
                setError('API Key not configured');
                toast.error('Error', {
                    description: 'Please configure your API Key in settings.'
                });
                return;
            }

            const documentValidationService = createDocumentValidationService(apiKey);
            const response = await documentValidationService.startDocumentValidation(
                country,
                idType,
                frontsideImage,
                backsideImage,
                storeResponses,
                merchantIdScanReference
            );

            if (!response.success) {
                setError(response.message || 'Error starting document validation.');
                setValidationResult(null);
                toast.error('Validation error', {
                    description: response.message || 'Could not start validation process.'
                });
            } else {
                setValidationResult(response.data ?? null);

                toast.success('Validation started', {
                    description: `Reference: ${response.data?.scanReference}`
                });

                if (response.data?.scanReference) {
                    startPolling(response.data.scanReference, storeResponses);
                }
            }
        } catch (err) {
            console.error('Error en startDocumentValidation:', err);
            const errorMessage = 'Error processing request. Please try again.';
            setError(errorMessage);
            setValidationResult(null);
            toast.error('Error', {
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    // Function to get validation data by scanReference
    const handleGetValidationData = async (scanReference: string) => {
        setValidationResult(null);
        setError(null);
        setLoading(true);
        stopPolling();

        try {
            if (!apiKey.trim()) {
                setError('API Key not configured');
                toast.error('Error', {
                    description: 'Please configure your API Key in settings.'
                });
                return;
            }

            const documentValidationService = createDocumentValidationService(apiKey);
            const response = await documentValidationService.getValidationData(
                scanReference,
                false
            );

            if (!response.success) {
                setError(response.message || 'Error getting validation data.');
                setValidationResult(null);
                toast.error('Error', {
                    description: response.message || 'Could not get validation data.'
                });
            } else {
                setValidationResult(response.data ?? null);
                toast.success('Data obtained', {
                    description: `Validation data for reference: ${scanReference}`
                });
            }
        } catch (err) {
            console.error('Error en getValidationData:', err);
            const errorMessage = 'Error processing request. Please try again.';
            setError(errorMessage);
            setValidationResult(null);
            toast.error('Error', {
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    // Function to start status polling
    const startPolling = (scanReference: string, storeResponses: boolean) => {
        setPollingActive(true);
        setPollingStatus('PENDING');

        toast.info('Checking status', {
            description: 'Checking document validation status...'
        });

        // Function to be executed at regular intervals
        const checkStatus = async () => {
            try {
                if (!apiKey.trim()) {
                    stopPolling();
                    setError('API Key not configured');
                    toast.error('Error', {
                        description: 'API Key required to continue polling.'
                    });
                    return;
                }

                const documentValidationService = createDocumentValidationService(apiKey);
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
                        toast.success('Validation completed', {
                            description: 'Validation process completed successfully.'
                        });

                        const dataResponse = await documentValidationService.getValidationData(
                            scanReference,
                            storeResponses
                        );

                        if (dataResponse.success) {
                            setValidationResult(dataResponse.data ?? null);
                            toast.success('Data obtained', {
                                description: 'Validation data has been retrieved.'
                            });
                        } else {
                            setError('Error getting final validation data.');
                            toast.error('Error', {
                                description: 'Could not get final validation data.'
                            });
                        }
                    } else if (status === 'FAILED') {
                        stopPolling();
                        setError('Document validation failed.');
                        toast.error('Validation failed', {
                            description: 'Document validation process failed.'
                        });
                    }
                    // If still PENDING, continue polling
                }
            } catch (err) {
                console.error('Error durante el polling:', err);
                toast.error('Connection error', {
                    description: 'Error checking status, retrying...'
                });
            }
        };

        checkStatus();

        pollingIntervalRef.current = setInterval(checkStatus, POLLING_INTERVAL);
    };

    // Function to stop polling
    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        setPollingActive(false);
    };

    // Function to reset form
    const handleReset = () => {
        setValidationResult(null);
        setError(null);
        setLoading(false);
        stopPolling();
        setPollingStatus(null);

        if (inputRef.current && typeof inputRef.current.reset === 'function') {
            inputRef.current.reset();
        }

        toast.info('Form reset', {
            description: 'All data has been cleared for a new query.'
        });
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className='mb-6 flex items-center justify-between'
            >
                <div>
                    <h1 className='text-2xl font-bold tracking-tight'>Document Validation</h1>
                    <p className='text-muted-foreground text-sm'>
                        Validate identity documents such as passports, driver&apos;s licenses or
                        identification cards.
                    </p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Badge
                    variant='secondary'
                    className='text-primary cursor-pointer p-2'
                    onClick={() =>
                        window.open(
                            'https://docs.identity-platform.io/docs/identity-api/resources/Verify/document-validation',
                            '_blank',
                            'noopener,noreferrer'
                        )
                    }
                >
                    <File className='h-4 w-4' />
                    <span className='ml-2'>Documentation</span>
                </Badge>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className='grid gap-6 lg:grid-cols-2'
            >
                {/* Data input form */}
                <DocumentValidationInput
                    ref={inputRef}
                    onStartValidation={handleStartValidation}
                    onGetValidationData={handleGetValidationData}
                    onReset={handleReset}
                    isLoading={loading}
                    isPolling={pollingActive}
                />

                {/* Results visualization */}
                <DocumentValidationResult
                    data={validationResult}
                    error={error}
                    isLoading={loading}
                    isPolling={pollingActive}
                    pollingStatus={pollingStatus}
                />
            </motion.div>
        </>
    );
}
