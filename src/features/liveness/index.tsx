'use client';

import React, { useState } from 'react';
import { File } from 'lucide-react';
import { useLivenessEvaluator } from '@/hooks/use-liveness-evaluator';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from './components/image-upload';
import { LivenessPreview } from './components/liveness-preview';
import { ResultsTable } from './components/results-table';

export default function LivenessContent() {
    const [currentFiles, setCurrentFiles] = useState<File[]>([]);
    const [currentBase64s, setCurrentBase64s] = useState<string[]>([]);

    const {
        loading,
        results,
        evaluateImages,
        evaluateBase64Images,
        clearResults,
        supportedExtensions,
        useSDK,
        setUseSDK,
        selectedSDKEndpoints,
        setSelectedSDKEndpoints,
        checkSDKEndpointStatus
    } = useLivenessEvaluator();

    const handleFilesSelected = async (files: File[], _isDir: boolean) => {
        setCurrentFiles(files);
        setCurrentBase64s([]);

        await evaluateImages(files);
    };

    const handleBase64Selected = async (base64Images: string[]) => {
        setCurrentBase64s(base64Images);
        setCurrentFiles([]);

        await evaluateBase64Images(base64Images);
    };

    const handleClear = () => {
        clearResults();
        setCurrentFiles([]);
        setCurrentBase64s([]);
    };

    const showInitialLayout =
        results.length === 0 &&
        !loading &&
        currentFiles.length === 0 &&
        currentBase64s.length === 0;
    const showResultsLayout = !showInitialLayout;

    if (showResultsLayout) {
        return (
            <div className='space-y-6'>
                <ResultsTable
                    results={results}
                    isLoading={loading}
                    onClear={handleClear}
                    useSDK={useSDK}
                />
            </div>
        );
    }

    return (
        <>
            {/* ===== Main ===== */}
            <>
                <div className='mb-6 flex items-center justify-between'>
                    <div>
                        <h1 className='text-2xl font-bold tracking-tight'>
                            Evaluación de Liveness
                        </h1>
                        <p className='text-muted-foreground text-sm'>
                            Evalúa la autenticidad de imágenes faciales para detectar ataques de
                            spoofing.
                        </p>
                    </div>
                </div>

                <Badge
                    variant='secondary'
                    className='text-primary cursor-pointer p-2'
                    onClick={() =>
                        window.open(
                            'https://docs.identity-platform.io/docs/identity-api/resources/Services/liveness',
                            '_blank',
                            'noopener,noreferrer'
                        )
                    }
                >
                    <File className='h-4 w-4' />
                    <span className='ml-2'>Documentación</span>
                </Badge>

                <div className='grid gap-6 lg:grid-cols-2'>
                    {/* Formulario de subida de imágenes */}
                    <ImageUpload
                        onFilesSelected={handleFilesSelected}
                        onBase64Selected={handleBase64Selected}
                        onClear={handleClear}
                        isLoading={loading}
                        supportedExtensions={supportedExtensions.slice()}
                        useSDK={useSDK}
                        setUseSDK={setUseSDK}
                        selectedSDKEndpoints={selectedSDKEndpoints}
                        setSelectedSDKEndpoints={setSelectedSDKEndpoints}
                        checkSDKEndpointStatus={checkSDKEndpointStatus}
                    />

                    {/* Vista previa de resultados */}
                    <LivenessPreview isLoading={loading} hasResults={results.length > 0} />
                </div>
            </>
        </>
    );
}
