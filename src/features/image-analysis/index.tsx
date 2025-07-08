'use client';

import { useRef, useState } from 'react';
import { ImageAnalysisResponse } from '@/types/image-analysis';
import { toast } from 'sonner';
import imageAnalysisService from '@/lib/tools/image-analysis.service';
import { ImageAnalysisInput } from './components/image-analysis-input';
import { ImageAnalysisResults } from './components/image-analysis-results';

export default function ImageAnalysis() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageData, setImageData] = useState<ImageAnalysisResponse | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const inputFormRef = useRef<{ reset: () => void } | null>(null);

    /* 🌱 Función para manejar el análisis de la imagen */
    const handleAnalyze = async (data: {
        imageSource: File | string;
        saveToDb: boolean;
        storeFile: boolean;
    }) => {
        setImageData(null);
        setError(null);
        setLoading(true);

        try {
            let response: ImageAnalysisResponse;

            if (typeof data.imageSource === 'string') {
                setImagePreview(data.imageSource);
                response = await imageAnalysisService.analyzeImageFromUrl(
                    data.imageSource,
                    data.saveToDb,
                    data.storeFile
                );
            } else {
                const objectUrl = URL.createObjectURL(data.imageSource);
                setImagePreview(objectUrl);
                response = await imageAnalysisService.analyzeImageFromFile(
                    data.imageSource,
                    data.saveToDb,
                    data.storeFile
                );
            }

            if (!response.success || !response.data) {
                setError(response.message || 'Error al analizar la imagen.');
                setImageData(null);

                toast.error('Error de análisis', {
                    description: response.message || 'No se pudo procesar la imagen.'
                });
            } else {
                setImageData(response);

                const verdict = response.data.report.verdict === 'ai' ? 'IA' : 'Humano';
                const confidence = Math.round(
                    response.data.report.verdict === 'ai'
                        ? response.data.report.ai.confidence * 100
                        : response.data.report.human.confidence * 100
                );

                toast.success('Análisis completado', {
                    description: `Resultado: ${verdict} (${confidence}% de confianza)`
                });
            }
        } catch (err) {
            const errorMessage = 'Error al procesar la solicitud. Intente nuevamente.';
            setError(errorMessage);
            setImageData(null);

            toast.error('Error', {
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    /* 🆕 Función para restablecer el formulario */
    const handleReset = () => {
        setImageData(null);
        setError(null);
        setLoading(false);
        setImagePreview(null);

        if (inputFormRef.current && typeof inputFormRef.current.reset === 'function') {
            inputFormRef.current.reset();
        }

        toast.info('Formulario restablecido', {
            description: 'Todos los datos han sido borrados para un nuevo análisis.'
        });
    };

    return (
        <>
            {/* ===== Main ===== */}
            <>
                <div className='mb-6 flex items-center justify-between'>
                    <div>
                        <h1 className='text-2xl font-bold tracking-tight'>Análisis de Imágenes</h1>
                        <p className='text-muted-foreground text-sm'>
                            Determine si una imagen fue creada por humanos o generada por
                            inteligencia artificial.
                        </p>
                    </div>
                </div>

                <div className='grid gap-6 lg:grid-cols-2'>
                    {/* Formulario de entrada para análisis */}
                    <ImageAnalysisInput
                        ref={inputFormRef}
                        onSubmit={handleAnalyze}
                        onReset={handleReset}
                        isLoading={loading}
                    />

                    {/* Visualización de resultados */}
                    <ImageAnalysisResults
                        data={imageData}
                        error={error}
                        isLoading={loading}
                        imagePreview={imagePreview}
                    />
                </div>
            </>
        </>
    );
}
