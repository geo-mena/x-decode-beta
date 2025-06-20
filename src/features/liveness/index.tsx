"use client"

import React, { useState } from 'react'
import { useLivenessEvaluator } from '@/hooks/useLivenessEvaluator'
import { ImageUpload } from './components/image-upload'
import { ResultsTable } from './components/results-table'

export default function LivenessContent() {
    const [isDirectory, setIsDirectory] = useState(false)
    const [currentFiles, setCurrentFiles] = useState<File[]>([])
    const [currentBase64s, setCurrentBase64s] = useState<string[]>([])
    const [inputType, setInputType] = useState<'files' | 'base64'>('files')
    
    const {
        loading,
        results,
        error,
        evaluateImages,
        evaluateBase64Images,
        clearResults,
        supportedExtensions
    } = useLivenessEvaluator()

    const handleFilesSelected = async (files: File[], isDir: boolean) => {
        setCurrentFiles(files)
        setCurrentBase64s([])
        setIsDirectory(isDir)
        setInputType('files')
        
        // Llamar al evaluador de archivos
        await evaluateImages(files, isDir)
    }

    const handleBase64Selected = async (base64Images: string[]) => {
        setCurrentBase64s(base64Images)
        setCurrentFiles([])
        setIsDirectory(false)
        setInputType('base64')
        
        // Llamar al evaluador de base64
        await evaluateBase64Images(base64Images)
    }

    const handleClear = () => {
        clearResults()
        setCurrentFiles([])
        setCurrentBase64s([])
        setIsDirectory(false)
        setInputType('files')
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
                    onBase64Selected={handleBase64Selected}
                    onClear={handleClear}
                    isLoading={loading}
                    supportedExtensions={supportedExtensions}
                />
            </div>
        </div>
    )

    const showInitialLayout = results.length === 0 && !loading && currentFiles.length === 0 && currentBase64s.length === 0
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