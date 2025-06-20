import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LivenessResult } from '@/types/liveness'
import { Download, RefreshCcw, Sheet, UserCog, X } from 'lucide-react'

interface ResultsTableProps {
    results: LivenessResult[]
    isLoading: boolean
    onClear: () => void
}

export function ResultsTable({ results, isLoading, onClear }: ResultsTableProps) {
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

    const getDiagnosticDisplay = (diagnostic: string | undefined) => {
        if (!diagnostic) return 'Pendiente'
        
        // Truncar mensaje muy largo
        if (diagnostic.length > 50) {
            return diagnostic.substring(0, 47) + '...'
        }
        return diagnostic
    }

    const handleDownloadImage = (result: LivenessResult) => {
        if (result.imageUrl) {
            const link = document.createElement('a')
            link.href = result.imageUrl
            link.download = result.imagePath
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    const handleViewImage = (result: LivenessResult) => {
        if (result.imageUrl) {
            window.open(result.imageUrl, '_blank')
        }
    }

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCcw className="animate-spin" />
                        Evaluando Imágenes
                    </CardTitle>
                    <CardDescription>
                        Procesando múltiples imágenes con el servicio de liveness...
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <Skeleton className="h-16 w-16 rounded" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[200px]" />
                                    <Skeleton className="h-4 w-[150px]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (results.length === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sheet />
                        Resultados de Evaluación
                    </CardTitle>
                    <CardDescription>
                        Los resultados de la evaluación aparecerán aquí
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex h-64 items-center justify-center text-muted-foreground">
                    <div className="text-center">
                        <Sheet className="mx-auto mb-2 h-12 w-12 opacity-50" />
                        <p className="text-sm">Esperando resultados de evaluación...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const successCount = results.filter(r => 
        r.diagnosticSaaS && !r.diagnosticSaaS.toLowerCase().includes('error')
    ).length
    
    const errorCount = results.filter(r => 
        r.error || (r.diagnosticSaaS && r.diagnosticSaaS.toLowerCase().includes('error'))
    ).length

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Sheet />
                            Resultados de Evaluación
                        </CardTitle>
                        <CardDescription>
                            Resultados de la evaluación de liveness para {results.length} imágenes
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-500">
                            {successCount} exitosas
                        </Badge>
                        {errorCount > 0 && (
                            <Badge variant="destructive">
                                {errorCount} errores
                            </Badge>
                        )}
                        <Button variant="outline" size="sm" onClick={onClear}>
                            <X className="mr-1" />
                            Limpiar
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-20">Imagen</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Resolución</TableHead>
                                <TableHead>Tamaño</TableHead>
                                <TableHead>Diagnóstico SaaS</TableHead>
                                <TableHead className="w-24">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.map((result, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        {result.imageUrl ? (
                                            <div className="relative h-12 w-12 overflow-hidden rounded border">
                                                <img
                                                    src={result.imageUrl}
                                                    alt={result.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex h-12 w-12 items-center justify-center rounded border bg-muted">
                                                <X className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div>
                                            <p className="text-sm">{result.title}</p>
                                            <p className="text-xs text-muted-foreground">{result.imagePath}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono text-xs">
                                            {result.resolution}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">{result.size}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <Badge variant={getDiagnosticBadgeVariant(result.diagnosticSaaS)}>
                                                {getDiagnosticDisplay(result.diagnosticSaaS)}
                                            </Badge>
                                            {result.rawResponse && (
                                                <div className="text-xs text-muted-foreground">
                                                    Liveness: {result.rawResponse.serviceLivenessResult === 3 ? 'LIVE' : 'NOT LIVE'}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewImage(result)}
                                                disabled={!result.imageUrl}
                                                title="Ver imagen"
                                            >
                                                <UserCog className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDownloadImage(result)}
                                                disabled={!result.imageUrl}
                                                title="Descargar imagen"
                                            >
                                                <Download className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Estadísticas resumidas */}
                <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm md:grid-cols-4">
                    <div>
                        <p className="text-muted-foreground">Total de imágenes</p>
                        <p className="text-lg font-semibold">{results.length}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Evaluaciones exitosas</p>
                        <p className="text-lg font-semibold text-green-600">{successCount}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Errores</p>
                        <p className="text-lg font-semibold text-red-600">{errorCount}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Tasa de éxito</p>
                        <p className="text-lg font-semibold">
                            {results.length > 0 ? Math.round((successCount / results.length) * 100) : 0}%
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
