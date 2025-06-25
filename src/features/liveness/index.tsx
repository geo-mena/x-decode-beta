'use client';

import React, { useState } from 'react';
import { useLivenessEvaluator } from '@/hooks/use-liveness-evaluator';
import { ImageUpload } from './components/image-upload';
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
        // SDK related
        useSDK,
        setUseSDK,
        selectedSDKEndpoints,
        setSelectedSDKEndpoints,
        checkSDKEndpointStatus
    } = useLivenessEvaluator();

    const handleFilesSelected = async (files: File[], isDir: boolean) => {
        setCurrentFiles(files);
        setCurrentBase64s([]);

        // Llamar al evaluador de archivos
        await evaluateImages(files, isDir);
    };

    const handleBase64Selected = async (base64Images: string[]) => {
        setCurrentBase64s(base64Images);
        setCurrentFiles([]);

        // Llamar al evaluador de base64
        await evaluateBase64Images(base64Images);
    };

    const handleClear = () => {
        clearResults();
        setCurrentFiles([]);
        setCurrentBase64s([]);
    };

    const resultsLayout = (
        <div className='space-y-6'>
            {/* Tabla de resultados */}
            <ResultsTable
                results={results}
                isLoading={loading}
                onClear={handleClear}
                useSDK={useSDK}
            />
        </div>
    );

    const initialLayout = (
        <div className='flex h-full w-full items-center justify-center'>
            <div className='mx-auto w-full max-w-2xl px-6'>
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
            </div>
        </div>
    );

    const showInitialLayout =
        results.length === 0 &&
        !loading &&
        currentFiles.length === 0 &&
        currentBase64s.length === 0;
    const showResultsLayout = !showInitialLayout;

    return (
        <div className='h-full w-full'>
            {showInitialLayout && initialLayout}
            {showResultsLayout && <div>{resultsLayout}</div>}
        </div>
    );
}
