import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { LivenessResult } from '@/types/liveness'
import { Download, RefreshCcw, Sheet, X, MoreHorizontal, Eye, Search, Filter, Settings2, Trash2 } from 'lucide-react'

interface ResultsTableProps {
    results: LivenessResult[]
    isLoading: boolean
    onClear: () => void
}

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
    // Estados para filtros
    const [searchValue, setSearchValue] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [visibleColumns, setVisibleColumns] = useState({
        imagen: true,
        titulo: true,
        resolucion: true,
        tamaño: true,
        diagnostico: true,
        acciones: true
    })

    // Filtrar resultados
    const filteredResults = useMemo(() => {
        return results.filter(result => {
            // Filtro de búsqueda por título y path
            const matchesSearch = searchValue === '' || 
                result.title.toLowerCase().includes(searchValue.toLowerCase()) ||
                result.imagePath.toLowerCase().includes(searchValue.toLowerCase())

            // Filtro por estado
            const matchesStatus = statusFilter === 'all' || 
                (statusFilter === 'success' && result.diagnosticSaaS && !result.diagnosticSaaS.toLowerCase().includes('error')) ||
                (statusFilter === 'error' && (result.error || (result.diagnosticSaaS && result.diagnosticSaaS.toLowerCase().includes('error'))))

            return matchesSearch && matchesStatus
        })
    }, [results, searchValue, statusFilter])

    // Componente Toolbar
    const DataTableToolbar = () => {
        const isFiltered = searchValue !== '' || statusFilter !== 'all'

        const handleReset = () => {
            setSearchValue('')
            setStatusFilter('all')
        }

        return (
            <div className="flex w-full items-start justify-between gap-2 p-1">
                <div className="flex flex-1 flex-wrap items-center gap-2">
                    {/* Búsqueda por texto */}
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por título o archivo..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="h-8 w-[200px] pl-8 lg:w-[250px]"
                        />
                    </div>

                    {/* Filtro por estado */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 border-dashed">
                                <Filter className="mr-2 h-4 w-4" />
                                Estado
                                {statusFilter !== 'all' && (
                                    <Badge variant="secondary" className="ml-2 h-5 px-1 text-xs">
                                        1
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[200px]">
                            <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                                checked={statusFilter === 'all'}
                                onCheckedChange={() => setStatusFilter('all')}
                            >
                                Todos los resultados
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={statusFilter === 'success'}
                                onCheckedChange={() => setStatusFilter('success')}
                            >
                                Exitosos
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={statusFilter === 'error'}
                                onCheckedChange={() => setStatusFilter('error')}
                            >
                                Con errores
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Botón reset */}
                    {isFiltered && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 lg:px-3 border-dashed"
                            onClick={handleReset}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Reset
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Vista de columnas */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="ml-auto h-8">
                                <Settings2 className="mr-2 h-4 w-4" />
                                Ver
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                            <DropdownMenuLabel>Alternar columnas</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.imagen}
                                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, imagen: checked }))}
                            >
                                Imagen
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.titulo}
                                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, titulo: checked }))}
                            >
                                Título
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.resolucion}
                                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, resolucion: checked }))}
                            >
                                Resolución
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.tamaño}
                                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, tamaño: checked }))}
                            >
                                Tamaño
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.diagnostico}
                                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, diagnostico: checked }))}
                            >
                                Diagnóstico SaaS
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        )
    }

    const getDiagnosticBadgeVariant = (diagnostic: string | undefined) => {
        if (!diagnostic) return 'secondary'
        
        const trimmedDiag = diagnostic.trim().toLowerCase()
        
        if (trimmedDiag === 'live') {
            return 'default'
        }
        if (trimmedDiag === 'nolive') {
            return 'destructive'
        }
        
        if (trimmedDiag.includes('error') || trimmedDiag.includes('failed')) {
            return 'destructive'
        }
        if (trimmedDiag.includes('success')) {
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
                            Resultados de la evaluación de liveness
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
                {/* Toolbar mejorado */}
                <DataTableToolbar />

                {/* Tabla mejorada */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {visibleColumns.imagen && <TableHead className="w-20">Imagen</TableHead>}
                                {visibleColumns.titulo && <TableHead>Título</TableHead>}
                                {visibleColumns.resolucion && <TableHead>Resolución</TableHead>}
                                {visibleColumns.tamaño && <TableHead>Tamaño</TableHead>}
                                {visibleColumns.diagnostico && <TableHead>Diagnóstico SaaS</TableHead>}
                                {visibleColumns.acciones && <TableHead className="w-20">Acciones</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredResults.length === 0 ? (
                                <TableRow>
                                    <TableCell 
                                        colSpan={Object.values(visibleColumns).filter(Boolean).length} 
                                        className="h-24 text-center"
                                    >
                                        {searchValue || statusFilter !== 'all' ? 'No se encontraron resultados con los filtros aplicados.' : 'No hay resultados.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredResults.map((result, index) => (
                                    <TableRow key={index} className="hover:bg-muted/50">
                                        {/* Imagen */}
                                        {visibleColumns.imagen && (
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
                                        )}

                                        {/* Título */}
                                        {visibleColumns.titulo && (
                                            <TableCell className="font-medium">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium leading-none">{result.title}</p>
                                                    <p className="text-xs text-muted-foreground">{result.imagePath}</p>
                                                </div>
                                            </TableCell>
                                        )}

                                        {/* Resolución */}
                                        {visibleColumns.resolucion && (
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {result.resolution}
                                                </Badge>
                                            </TableCell>
                                        )}

                                        {/* Tamaño */}
                                        {visibleColumns.tamaño && (
                                            <TableCell>
                                                <span className="text-sm font-medium">{result.size}</span>
                                            </TableCell>
                                        )}

                                        {/* Diagnóstico SaaS */}
                                        {visibleColumns.diagnostico && (
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <Badge variant={getDiagnosticBadgeVariant(result.diagnosticSaaS)}>
                                                        {getDiagnosticDisplay(result.diagnosticSaaS)}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                        )}

                                        {/* Acciones */}
                                        {visibleColumns.acciones && (
                                            <TableCell>
                                                <CellAction result={result} />
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Información de resultados */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                        Mostrando {filteredResults.length} de {results.length} resultado{results.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}