import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLivenessEvaluator } from '@/hooks/useLivenessEvaluator'
import { ImageUpload } from './components/Image-upload'
import { ImageResult } from './components/Image-result'
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

    // Layout para imagen individual (lado a lado)
    const singleImageLayout = (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Columna izquierda - Subida */}
            <div>
                <ImageUpload
                    onFilesSelected={handleFilesSelected}
                    onClear={handleClear}
                    isLoading={loading}
                    supportedExtensions={supportedExtensions}
                />
            </div>

            {/* Columna derecha - Resultado */}
            <div>
                <ImageResult
                    result={results[0] || null}
                    isLoading={loading}
                    error={error}
                />
            </div>
        </div>
    )

    // Layout para múltiples imágenes (tabla completa)
    const directoryLayout = (
        <div className="space-y-6">
            {/* Estado compacto */}
            <Card className="mx-auto max-w-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Estado de Evaluación</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Imágenes</p>
                            <Badge className="mt-1">{currentFiles.length}</Badge>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Resultados</p>
                            <Badge variant={results.length > 0 ? 'default' : 'secondary'} className="mt-1">
                                {results.length}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabla de resultados */}
            <ResultsTable
                results={results}
                isLoading={loading}
                onClear={handleClear}
            />
        </div>
    )

    // Layout inicial (sin evaluación iniciada)
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

    // Determinar qué layout mostrar
    const showInitialLayout = results.length === 0 && !loading && !isDirectory
    const showSingleImageLayout = !showInitialLayout && !isDirectory && currentFiles.length === 1
    const showDirectoryLayout = !showInitialLayout && (isDirectory || currentFiles.length > 1)

    return (
        <div className="h-full w-full">
            {showInitialLayout && initialLayout}
            {showSingleImageLayout && (
                <div className="container mx-auto p-6">
                    {singleImageLayout}
                </div>
            )}
            {showDirectoryLayout && (
                <div className="container mx-auto p-6">
                    {directoryLayout}
                </div>
            )}
        </div>
    )
}
