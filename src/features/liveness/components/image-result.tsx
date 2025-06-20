import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { LivenessResult } from '@/types/liveness'
import { Download, RefreshCcw, UserCog, X } from 'lucide-react'

interface ImageResultProps {
    result: LivenessResult | null
    isLoading: boolean
    error: string | null
}

export function ImageResult({ result, isLoading, error }: ImageResultProps) {
    const getDiagnosticBadgeVariant = (diagnostic: string | undefined) => {
        if (!diagnostic) return 'secondary'
        
        const lowerDiag = diagnostic.toLowerCase()
        if (lowerDiag.includes('error') || lowerDiag.includes('failed')) {
            return 'destructive'
        }
        if (lowerDiag.includes('live') || lowerDiag.includes('success')) {
            return 'default'
        }
        return 'secondary'
    }

    const handleDownloadImage = () => {
        if (result?.imageUrl) {
            const link = document.createElement('a')
            link.href = result.imageUrl
            link.download = result.imagePath
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    const handleOpenInNewTab = () => {
        if (result?.imageUrl) {
            window.open(result.imageUrl, '_blank')
        }
    }

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCcw className="animate-spin" />
                        Evaluando Imagen
                    </CardTitle>
                    <CardDescription>
                        Procesando imagen con el servicio de liveness...
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="aspect-video w-full rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error && !result) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <X type="x" />
                        Error en Evaluación
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <X type="x" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        )
    }

    if (!result) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <X type="agent" />
                        Resultado de Evaluación
                    </CardTitle>
                    <CardDescription>
                        Seleccione una imagen para ver los resultados de la evaluación
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex h-64 items-center justify-center text-muted-foreground">
                    <div className="text-center">
                        <UserCog className="mx-auto mb-2 h-12 w-12 opacity-50" />
                        <p className="text-sm">Esperando imagen para evaluar...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <UserCog/>
                        {result.title}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                            <Download className="mr-1" />
                            Ver
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadImage}>
                            <Download className="mr-1" />
                            Descargar
                        </Button>
                    </div>
                </CardTitle>
                <CardDescription>
                    Resultado de la evaluación de liveness pasiva
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Imagen */}
                {result.imageUrl && (
                    <div className="flex justify-center">
                        <div className="relative overflow-hidden rounded-lg border">
                            <img
                                src={result.imageUrl}
                                alt={result.title}
                                className="max-h-64 max-w-full object-contain"
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                        </div>
                    </div>
                )}

                {/* Información de la imagen */}
                <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                    <div>
                        <p className="text-xs text-muted-foreground">Resolución</p>
                        <p className="text-sm font-mono">{result.resolution}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Tamaño</p>
                        <p className="text-sm font-mono">{result.size}</p>
                    </div>
                    {result.imageInfo?.type && (
                        <div>
                            <p className="text-xs text-muted-foreground">Tipo</p>
                            <Badge variant="outline" className="text-xs">
                                {result.imageInfo.type}
                            </Badge>
                        </div>
                    )}
                    <div>
                        <p className="text-xs text-muted-foreground">Archivo</p>
                        <p className="text-sm font-mono">{result.imagePath}</p>
                    </div>
                </div>

                {/* Diagnóstico */}
                <div className="space-y-3">
                    <h4 className="text-sm font-medium">Resultado de Liveness</h4>
                    
                    <div className="rounded-lg border p-4">
                        <div className="flex items-start gap-3">
                            <UserCog
                                className="mt-0.5"
                            />
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Servicio SaaS</span>
                                    <Badge variant={getDiagnosticBadgeVariant(result.diagnosticSaaS)}>
                                        {result.diagnosticSaaS ? 'Completado' : 'Pendiente'}
                                    </Badge>
                                </div>
                                {result.diagnosticSaaS && (
                                    <p className="text-sm text-muted-foreground">
                                        {result.diagnosticSaaS}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Información adicional del response */}
                {result.rawResponse && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium">Detalles Técnicos</h4>
                        <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-xs">
                            <div>
                                <p className="text-muted-foreground">Código de Resultado</p>
                                <p className="font-mono">{result.rawResponse.serviceResultCode}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Tiempo de Respuesta</p>
                                <p className="font-mono">{result.rawResponse.serviceTime} ms</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-muted-foreground">ID de Transacción</p>
                                <p className="font-mono break-all">{result.rawResponse.serviceTransactionId}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Resultado Liveness</p>
                                <Badge variant={result.rawResponse.serviceLivenessResult === 3 ? 'default' : 'destructive'}>
                                    {result.rawResponse.serviceLivenessResult === 3 ? 'LIVE' : 'NOT LIVE'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error si existe */}
                {result.error && (
                    <Alert variant="destructive">
                        <X type="x" />
                        <AlertTitle>Error en Procesamiento</AlertTitle>
                        <AlertDescription>{result.error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    )
}
