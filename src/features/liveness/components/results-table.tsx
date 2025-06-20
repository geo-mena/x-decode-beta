import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { LivenessResult } from '@/types/liveness'
import { Download, RefreshCcw, Sheet, X, MoreHorizontal, Eye, Trash2 } from 'lucide-react'

interface ResultsTableProps {
    results: LivenessResult[]
    isLoading: boolean
    onClear: () => void
}

// Componente para acciones de cada fila
const CellAction = ({ result }: { result: LivenessResult }) => {
    const handleDownloadImage = () => {
        if (result.imageUrl) {
            const link = document.createElement('a')
            link.href = result.imageUrl
            link.download = result.imagePath
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    const handleViewImage = () => {
        if (result.imageUrl) {
            window.open(result.imageUrl, '_blank')
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir menú</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem 
                    onClick={handleViewImage}
                    disabled={!result.imageUrl}
                >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver imagen
                </DropdownMenuItem>
                <DropdownMenuItem 
                    onClick={handleDownloadImage}
                    disabled={!result.imageUrl}
                >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
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
                        <Button variant="outline" size="sm" onClick={onClear}>
                            <Trash2 className="mr-1" />
                            Limpiar
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Toolbar área */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-1 items-center space-x-2">
                        <p className="text-sm text-muted-foreground">
                            {results.length} resultado{results.length !== 1 ? 's' : ''} en total
                        </p>
                    </div>
                </div>

                {/* Tabla mejorada */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-20">Imagen</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Resolución</TableHead>
                                <TableHead>Tamaño</TableHead>
                                <TableHead>Diagnóstico SaaS</TableHead>
                                <TableHead className="w-20">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.map((result, index) => (
                                <TableRow key={index} className="hover:bg-muted/50">
                                    {/* Imagen */}
                                    <TableCell>
                                        {result.imageUrl ? (
                                            <div className="relative aspect-square h-20 w-20 overflow-hidden rounded border">
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

                                    {/* Título */}
                                    <TableCell className="font-medium">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{result.title}</p>
                                            <p className="text-xs text-muted-foreground">{result.imagePath}</p>
                                        </div>
                                    </TableCell>

                                    {/* Resolución */}
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono text-xs">
                                            {result.resolution}
                                        </Badge>
                                    </TableCell>

                                    {/* Tamaño */}
                                    <TableCell>
                                        <span className="text-sm font-medium">{result.size}</span>
                                    </TableCell>

                                    {/* Diagnóstico SaaS */}
                                    <TableCell>
                                        <div className="space-y-1">
                                            <Badge variant={getDiagnosticBadgeVariant(result.diagnosticSaaS)}>
                                                {getDiagnosticDisplay(result.diagnosticSaaS)}
                                            </Badge>
                                        </div>
                                    </TableCell>

                                    {/* Acciones */}
                                    <TableCell>
                                        <CellAction result={result} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}