'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Activity, Play } from 'lucide-react';
import { toast } from 'sonner';
import { usePlaygroundStore } from '@/store';
import { createLivenessServiceWithApiKey } from '@/lib/identity-api/liveness.service';
import { EvaluatePassiveLivenessResponse, LivenessApiError } from '@/types/liveness';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { JsonHighlighter } from '@/components/ui/json-highlighter';

interface ImageData {
    file_name?: string;
    width?: number;
    height?: number;
    mime_type?: string;
    preview_url?: string;
    jpeg_quality?: number;
    timestamp: string | number;
    base64_data?: string;
}

interface LivenessAnalyzerProps {
    data: ImageData | null;
}

export function LivenessAnalyzer({ data }: LivenessAnalyzerProps) {
    const [livenessResult, setLivenessResult] = useState<EvaluatePassiveLivenessResponse | null>(null);
    const [processingPercent, setProcessingPercent] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [livenessError, setLivenessError] = useState<string | null>(null);
    const { apiKey } = usePlaygroundStore();

    // Reset state when image changes
    useEffect(() => {
        setLivenessResult(null);
        setProcessingPercent(0);
        setStatusMessage('');
        setLivenessError(null);
    }, [data?.file_name]);

    const analyzeLiveness = async () => {
        if (!data || !data.base64_data) return;

        if (!apiKey || !apiKey.trim()) {
            setLivenessError('API Key is required. Please configure it in the playground store.');
            return;
        }

        setStatusMessage('Evaluating liveness...');
        setProcessingPercent(0);
        setLivenessError(null);

        // Simulate progress
        const interval = setInterval(() => {
            setProcessingPercent((prev) => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + Math.floor(Math.random() * 15) + 5;
            });
        }, 200);

        try {
            setStatusMessage('Calling Identity Platform API...');
            
            const livenessService = createLivenessServiceWithApiKey(apiKey);
            const response = await livenessService.evaluatePassiveLiveness({
                imageBuffer: data.base64_data
            });

            // Complete progress
            setProcessingPercent(100);
            setStatusMessage('Liveness evaluation completed');
            setLivenessResult(response);

            toast.success('Liveness Test Completed', {
                description: `Result: ${response.serviceResultLog}`
            });

        } catch (error) {
            console.error('Error analyzing liveness:', error);
            clearInterval(interval);
            setProcessingPercent(0);
            setStatusMessage('');
            
            if (error instanceof LivenessApiError) {
                setLivenessError(`API Error: ${error.message}`);
            } else {
                setLivenessError(
                    error instanceof Error ? error.message : 'Unknown error during liveness evaluation'
                );
            }

            toast.error('Liveness Analysis Error', {
                description: 'Could not complete liveness evaluation'
            });
        }
    };


    const renderLivenessResults = () => {
        if (!livenessResult) return null;

        return (
            <div className='space-y-4'>
                <div className='space-y-2'>
                    <JsonHighlighter 
                        code={JSON.stringify(livenessResult, null, 2)}
                        className='max-h-96'
                    />
                </div>
            </div>
        );
    };

    const isApiKeyConfigured = apiKey && apiKey.trim().length > 0;
    const hasImageData = data && data.base64_data;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant='outline' size='icon' title='Test Liveness'>
                    <Activity className='h-4 w-4' />
                </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-2xl'>
                <DialogHeader>
                    <DialogTitle>Liveness Test</DialogTitle>
                </DialogHeader>

                {!livenessResult ? (
                    <div className='py-6'>
                        {livenessError ? (
                            <div className='space-y-4 text-center'>
                                <AlertCircle className='text-destructive mx-auto h-10 w-10' />
                                <p className='text-muted-foreground text-sm'>{livenessError}</p>
                                <Button
                                    variant='outline'
                                    className='mt-2'
                                    onClick={() => setLivenessError(null)}
                                >
                                    Try again
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className='text-center mb-4'>
                                    <p className='text-muted-foreground text-sm'>
                                        Test this image for passive liveness detection using the Identity Platform API.
                                    </p>
                                </div>

                                {!isApiKeyConfigured && (
                                    <div className='rounded-md border border-yellow-200 bg-yellow-50 p-3 mb-4 dark:border-yellow-800 dark:bg-yellow-900/20'>
                                        <div className='flex items-center gap-2 text-yellow-800 dark:text-yellow-200'>
                                            <AlertCircle className='h-4 w-4' />
                                            <span className='text-sm font-medium'>API Key Required</span>
                                        </div>
                                        <p className='mt-1 text-sm text-yellow-700 dark:text-yellow-300'>
                                            Configure your Identity Platform API key in the playground store.
                                        </p>
                                    </div>
                                )}

                                {!hasImageData && (
                                    <div className='rounded-md border border-yellow-200 bg-yellow-50 p-3 mb-4 dark:border-yellow-800 dark:bg-yellow-900/20'>
                                        <div className='flex items-center gap-2 text-yellow-800 dark:text-yellow-200'>
                                            <AlertCircle className='h-4 w-4' />
                                            <span className='text-sm font-medium'>No Image Data</span>
                                        </div>
                                        <p className='mt-1 text-sm text-yellow-700 dark:text-yellow-300'>
                                            Image data is required for liveness testing.
                                        </p>
                                    </div>
                                )}

                                {processingPercent > 0 && processingPercent < 100 ? (
                                    <div className='space-y-3'>
                                        <p className='text-center text-sm'>{statusMessage}</p>
                                        <Progress value={processingPercent} className='h-2' />
                                    </div>
                                ) : (
                                    <Button
                                        className='w-full'
                                        onClick={analyzeLiveness}
                                        disabled={!isApiKeyConfigured || !hasImageData}
                                    >
                                        <Play className='mr-2 h-4 w-4' />
                                        Run Liveness Test
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div className='space-y-5 py-4'>
                        {renderLivenessResults()}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}