"use client"

import React, { useState } from 'react'
import { useLivenessEvaluator } from '@/hooks/useLivenessEvaluator'
import { ImageUpload } from './components/image-upload'
import { ResultsTable } from './components/results-table'

export default function LivenessContent() {
    const [isDirectory, setIsDirectory] = useState(false)
    const [currentFiles, setCurrentFiles] = useState<File[]>([])
    
    const {
        loading,
        results,
        error,
        evaluateImages,
        clearResults,
        supportedExtensions
    } = useLivenessEvaluator()

    const handleFilesSelected = async (files: File[], isDir: boolean) => {
        setCurrentFiles(files)
        setIsDirectory(isDir)
        
        // Llamar al evaluador
        await evaluateImages(files, isDir)
    }

    const handleClear = () => {
        clearResults()
        setCurrentFiles([])
        setIsDirectory(false)
    }

    const resultsLayout = (
        <div className="space-y-6">
            {/* Tabla de resultados */}
            <ResultsTable
                results={results}
                isLoading={loading}
                onClear={handleClear}
            />
        </div>
    )

    const initialLayout = (
        <div className="flex h-full w-full items-center justify-center">
            <div className="w-full max-w-2xl mx-auto px-6">
                <ImageUpload
                    onFilesSelected={handleFilesSelected}
                    onClear={handleClear}
                    isLoading={loading}
                    supportedExtensions={supportedExtensions}
                />
            </div>
        </div>
    )

    const showInitialLayout = results.length === 0 && !loading && currentFiles.length === 0
    const showResultsLayout = !showInitialLayout

    return (
        <div className="h-full w-full">
            {showInitialLayout && initialLayout}
            {showResultsLayout && (
                <div className="container mx-auto p-6">
                    {resultsLayout}
                </div>
            )}
        </div>
    )
}