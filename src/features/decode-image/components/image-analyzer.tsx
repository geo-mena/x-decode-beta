'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Leaf, Zap } from 'lucide-react';
import { toast } from 'sonner';
import base64ImageService from '@/lib/tools/base64-image.service';
import { aiDetectionService } from '@/lib/tools/image-detection.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface ImageData {
    file_name?: string;
    width?: number;
    height?: number;
    mime_type?: string;
    preview_url?: string;
    jpeg_quality?: number;
    timestamp: string | number;
}

interface AIDetectionResult {
    success: boolean;
    is_ai_generated: boolean;
    smart_detection: boolean;
    smart_explanation: string;
    confidence_score: number;
    details?: {
        label: string;
        score: number;
    }[];
}

interface ImageAnalysisResult {
    dominantColors: string[];
    estimatedQuality: number;
    detectedObjects: string[];
    focalPoint: { x: number; y: number };
    exposureScore: number;
    noiseLevel: number;
    blurScore: number;
    compressionArtifacts: number;
    aiDetection?: AIDetectionResult;
}

interface ImageAnalyzerProps {
    data: ImageData | null;
    onEnhanceApplied?: (settings: {
        brightness: number;
        contrast: number;
        saturation: number;
    }) => void;
}

export function ImageAnalyzer({ data, onEnhanceApplied }: ImageAnalyzerProps) {
    const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysisResult | null>(null);
    const [processingPercent, setProcessingPercent] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [autoEnhanceApplied, setAutoEnhanceApplied] = useState(false);
    const [aiDetectionError, setAiDetectionError] = useState<string | null>(null);

    // Estados para el efecto de streaming del texto
    const [visibleExplanation, setVisibleExplanation] = useState('');
    const [isTypingComplete, setIsTypingComplete] = useState(false);
    const [showCursor, setShowCursor] = useState(true);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const cursorIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Resetear el estado cuando cambia la imagen
    useEffect(() => {
        setImageAnalysis(null);
        setProcessingPercent(0);
        setStatusMessage('');
        setAutoEnhanceApplied(false);
        setAiDetectionError(null);
        setVisibleExplanation('');
        setIsTypingComplete(false);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        if (cursorIntervalRef.current) {
            clearInterval(cursorIntervalRef.current);
        }
    }, [data?.file_name]);

    useEffect(() => {
        cursorIntervalRef.current = setInterval(() => {
            setShowCursor((prev) => !prev);
        }, 500);

        return () => {
            if (cursorIntervalRef.current) {
                clearInterval(cursorIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (imageAnalysis?.aiDetection?.smart_explanation && !isTypingComplete) {
            typeExplanation(imageAnalysis.aiDetection.smart_explanation);
        }

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [imageAnalysis?.aiDetection]);

    const typeExplanation = (text: string) => {
        let currentIndex = 0;
        setVisibleExplanation('');

        const typeNextChar = () => {
            if (currentIndex < text.length) {
                setVisibleExplanation((prev) => prev + text[currentIndex]);
                currentIndex++;

                const randomSpeed = Math.floor(Math.random() * 25) + 15;
                typingTimeoutRef.current = setTimeout(typeNextChar, randomSpeed);
            } else {
                setIsTypingComplete(true);
            }
        };

        typingTimeoutRef.current = setTimeout(typeNextChar, 300);
    };

    const completeTyping = () => {
        if (!imageAnalysis?.aiDetection?.smart_explanation || isTypingComplete) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        setVisibleExplanation(imageAnalysis.aiDetection.smart_explanation);
        setIsTypingComplete(true);
    };

    /* Función para analizar la imagen y detectar si es generada por IA */
    const analyzeImage = async () => {
        if (!data || !data.file_name || !data.preview_url) return;

        setStatusMessage('Analyzing image...');
        setProcessingPercent(0);
        setAiDetectionError(null);
        setVisibleExplanation('');
        setIsTypingComplete(false);

        // Simular progreso de análisis
        const interval = setInterval(() => {
            setProcessingPercent((prev) => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + Math.floor(Math.random() * 15) + 5;
            });
        }, 300);

        try {
            // Comenzar detección de IA
            setStatusMessage('Detecting if AI-generated...');

            // Obtener el archivo de imagen usando la URL del proxy
            const proxyUrl = base64ImageService.getProxyUrl(data.file_name);
            const response = await fetch(proxyUrl);
            const blob = await response.blob();
            const imageFile = new File([blob], data.file_name, {
                type: blob.type
            });

            // Llamar al servicio de detección de IA
            const aiDetectionResult = await aiDetectionService.detectAIImage(imageFile);

            if (!aiDetectionResult.success) {
                throw new Error(
                    aiDetectionResult.smart_explanation || 'AI detection error'
                );
            }

            // Finalización del análisis
            setProcessingPercent(100);
            setStatusMessage('Analysis completed');

            // Guardar solo los resultados de detección de IA
            setImageAnalysis({
                dominantColors: [],
                estimatedQuality: 0,
                detectedObjects: [],
                focalPoint: { x: 0, y: 0 },
                exposureScore: 0,
                noiseLevel: 0,
                blurScore: 0,
                compressionArtifacts: 0,
                aiDetection: aiDetectionResult
            });
        } catch (error) {
            console.error('Error analyzing image:', error);
            clearInterval(interval);
            setProcessingPercent(0);
            setStatusMessage('');
            setAiDetectionError(
                error instanceof Error ? error.message : 'Unknown error analyzing image'
            );

            toast.error('Analysis error', {
                description: 'Could not complete AI analysis of the image'
            });
        }
    };

    /* Función para renderizar los resultados de detección de IA */
    const renderAIDetectionResults = () => {
        if (!imageAnalysis?.aiDetection) return null;

        const { aiDetection } = imageAnalysis;
        const confidencePercent = Math.round(aiDetection.confidence_score * 100);

        return (
            <div className='space-y-4'>
                <div>
                    <div className='bg-muted/30 rounded-md border p-4'>
                        <div className='mb-4 flex items-center justify-between'>
                            <span className='text-sm font-medium'>Result:</span>
                            {aiDetection.smart_detection ? (
                                <Badge className='px-3 py-1 text-xs' variant='destructive'>
                                    AI Generated
                                </Badge>
                            ) : (
                                <Badge
                                    className='border-emerald-500 px-3 py-1 text-xs text-emerald-500'
                                    variant='outline'
                                >
                                    Human Created
                                </Badge>
                            )}
                        </div>

                        <div className='space-y-4'>
                            <div>
                                <div className='mb-2 flex items-center justify-between text-xs'>
                                    <span className='text-muted-foreground'>
                                        Confidence Level
                                    </span>
                                    <span className='font-medium'>{confidencePercent}%</span>
                                </div>
                                <Progress
                                    value={confidencePercent}
                                    className={`h-3 ${aiDetection.smart_detection ? 'bg-muted' : ''}`}
                                />
                            </div>

                            <div
                                className='text-muted-foreground relative cursor-pointer text-sm'
                                onClick={completeTyping}
                                title={!isTypingComplete ? 'Click to complete' : ''}
                            >
                                {visibleExplanation}
                                {!isTypingComplete && showCursor && (
                                    <span className='bg-primary ml-0.5 inline-block h-4 w-1 animate-pulse'></span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {aiDetection.details && aiDetection.details.length > 0 && (
                    <div className='mt-3 grid grid-cols-2 gap-4'>
                        {aiDetection.details.map((detail, index) => (
                            <div key={index} className='flex flex-col rounded-md border p-3'>
                                <span className='text-muted-foreground text-xs capitalize'>
                                    {detail.label === 'artificial' ? 'AI' : 'Human'}
                                </span>
                                <span className='text-2xl font-medium'>
                                    {Math.round(detail.score * 100)}%
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant='ghost' size='icon' title='Analyze Image'>
                    <Leaf className='h-4 w-4' />
                </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>Image Analysis</DialogTitle>
                </DialogHeader>

                {!imageAnalysis ? (
                    <div className='py-6'>
                        {aiDetectionError ? (
                            <div className='space-y-4 text-center'>
                                <AlertCircle className='text-destructive mx-auto h-10 w-10' />
                                <p className='text-muted-foreground'>{aiDetectionError}</p>
                                <Button
                                    variant='outline'
                                    className='mt-2'
                                    onClick={() => setAiDetectionError(null)}
                                >
                                    Try again
                                </Button>
                            </div>
                        ) : (
                            <>
                                <p className='text-muted-foreground mb-4 text-center'>
                                    Analyze this image to detect if it was AI-generated.
                                </p>

                                {processingPercent > 0 && processingPercent < 100 ? (
                                    <div className='space-y-3'>
                                        <p className='text-center text-sm'>{statusMessage}</p>
                                        <Progress value={processingPercent} className='h-2' />
                                    </div>
                                ) : (
                                    <Button
                                        className='w-full'
                                        onClick={analyzeImage}
                                        disabled={!data}
                                    >
                                        <Leaf className='mr-2 h-4 w-4' />
                                        Analyze Image
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div className='space-y-5 py-4'>
                        {/* Resultados de detección de IA */}
                        {renderAIDetectionResults()}

                        {onEnhanceApplied && (
                            <>
                                <Separator />
                                <Button disabled={autoEnhanceApplied} className='w-full'>
                                    <Zap className='mr-2 h-4 w-4' />
                                    {autoEnhanceApplied
                                        ? 'Enhancement applied'
                                        : 'Apply automatic enhancement'}
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
