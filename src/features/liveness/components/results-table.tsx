import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { LivenessResult } from '@/types/liveness';
import {
    Download,
    Sheet,
    X,
    MoreHorizontal,
    Eye,
    Search,
    Filter,
    Settings2,
    Trash2
} from 'lucide-react';
import { ResultsTableSkeleton } from './results-table-skeleton';
import { ImagePreviewModal } from './image-preview';

interface ResultsTableProps {
    results: LivenessResult[];
    isLoading: boolean;
    onClear: () => void;
    useSDK: boolean;
}

const CellAction = ({
    result,
    onViewImage
}: {
    result: LivenessResult;
    onViewImage: (result: LivenessResult) => void;
}) => {
    const handleDownloadImage = () => {
        if (result.imageUrl) {
            const link = document.createElement('a');
            link.href = result.imageUrl;
            link.download = result.imagePath;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleViewImage = () => {
        if (result.imageUrl) {
            onViewImage(result);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='h-8 w-8 p-0'>
                    <span className='sr-only'>Abrir menú</span>
                    <MoreHorizontal className='h-4 w-4' />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem
                    onClick={handleViewImage}
                    disabled={!result.imageUrl}
                >
                    <Eye className='mr-2 h-4 w-4' />
                    Ver imagen
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={handleDownloadImage}
                    disabled={!result.imageUrl}
                >
                    <Download className='mr-2 h-4 w-4' />
                    Descargar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export function ResultsTable({
    results,
    isLoading,
    onClear,
    useSDK
}: ResultsTableProps) {
    // Estados para filtros
    const [searchValue, setSearchValue] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    
    // Estados para el modal de imagen
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<LivenessResult | null>(null);

    // Obtener tags únicos de SDK para columnas dinámicas
    const sdkTags = useMemo(() => {
        if (!useSDK) return [];
        
        const tags = new Set<string>();
        results.forEach(result => {
            if (result.sdkDiagnostics) {
                Object.keys(result.sdkDiagnostics).forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags).sort();
    }, [results, useSDK]);

    // Estado para columnas visibles (dinámico basado en SDK)
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
        const baseColumns: Record<string, boolean> = {
            imagen: true,
            titulo: true,
            resolucion: true,
            tamaño: true,
            diagnosticoSaaS: true,
            acciones: true
        };

        // Agregar columnas SDK dinámicamente
        sdkTags.forEach(tag => {
            baseColumns[`sdk_${tag}`] = true;
        });

        return baseColumns;
    });

    // Actualizar columnas visibles cuando cambien los tags SDK
    React.useEffect(() => {
        if (useSDK && sdkTags.length > 0) {
            setVisibleColumns(prev => {
                const newColumns = { ...prev };
                sdkTags.forEach(tag => {
                    const key = `sdk_${tag}`;
                    if (!newColumns.hasOwnProperty(key)) {
                        newColumns[key] = true;
                    }
                });
                return newColumns;
            });
        }
    }, [sdkTags, useSDK]);

    // Obtener valores únicos de diagnóstico para filtros
    const uniqueDiagnosticValues = useMemo(() => {
        const values = new Set<string>();

        results.forEach((result) => {
            // SaaS diagnostics
            if (result.diagnosticSaaS && result.diagnosticSaaS.trim()) {
                values.add(`SaaS: ${result.diagnosticSaaS.trim()}`);
            }
            
            // SDK diagnostics
            if (result.sdkDiagnostics) {
                Object.entries(result.sdkDiagnostics).forEach(([tag, diagnostic]) => {
                    if (diagnostic && diagnostic.trim()) {
                        values.add(`${tag}: ${diagnostic.trim()}`);
                    }
                });
            }
        });

        if (values.size === 0) {
            values.add('Pendiente');
        }

        return Array.from(values).sort();
    }, [results]);

    // Filtrar resultados
    const filteredResults = useMemo(() => {
        return results.filter((result) => {
            // Filtro de búsqueda por título y path
            const matchesSearch =
                searchValue === '' ||
                result.title
                    .toLowerCase()
                    .includes(searchValue.toLowerCase()) ||
                result.imagePath
                    .toLowerCase()
                    .includes(searchValue.toLowerCase());

            // Filtro por estado
            let matchesStatus = true;
            if (statusFilter !== 'all') {
                // Verificar si coincide con SaaS
                const saasMatch = result.diagnosticSaaS && 
                    statusFilter === `SaaS: ${result.diagnosticSaaS.trim()}`;
                
                // Verificar si coincide con algún SDK
                let sdkMatch = false;
                if (result.sdkDiagnostics) {
                    sdkMatch = Object.entries(result.sdkDiagnostics).some(([tag, diagnostic]) => 
                        statusFilter === `${tag}: ${diagnostic.trim()}`
                    );
                }

                matchesStatus = saasMatch || sdkMatch || statusFilter === 'Pendiente';
            }

            return matchesSearch && matchesStatus;
        });
    }, [results, searchValue, statusFilter]);

    // Contar resultados por cada filtro
    const getFilterCount = (filterValue: string) => {
        if (filterValue === 'all') return results.length;

        return results.filter((result) => {
            const saasMatch = result.diagnosticSaaS && 
                filterValue === `SaaS: ${result.diagnosticSaaS.trim()}`;
            
            let sdkMatch = false;
            if (result.sdkDiagnostics) {
                sdkMatch = Object.entries(result.sdkDiagnostics).some(([tag, diagnostic]) => 
                    filterValue === `${tag}: ${diagnostic.trim()}`
                );
            }

            return saasMatch || sdkMatch || filterValue === 'Pendiente';
        }).length;
    };

    // Funciones para el modal de imagen
    const handleViewImage = (result: LivenessResult) => {
        setSelectedImage(result);
        setImageModalOpen(true);
    };

    const handleCloseImageModal = () => {
        setImageModalOpen(false);
        setSelectedImage(null);
    };

    // Función para actualizar visibilidad de columna
    const updateColumnVisibility = (columnKey: string, checked: boolean) => {
        setVisibleColumns(prev => ({
            ...prev,
            [columnKey]: checked
        }));
    };

    // Componente Toolbar
    const DataTableToolbar = () => {
        const isFiltered = searchValue !== '' || statusFilter !== 'all';

        const handleReset = () => {
            setSearchValue('');
            setStatusFilter('all');
        };

        return (
            <div className='flex w-full items-start justify-between gap-2 p-1'>
                <div className='flex flex-1 flex-wrap items-center gap-2'>
                    {/* Búsqueda por texto */}
                    <div className='relative'>
                        <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
                        <Input
                            placeholder='Buscar por título o archivo...'
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className='h-8 w-[200px] pl-8 lg:w-[250px]'
                        />
                    </div>

                    {/* Filtro por estado dinámico */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant='outline'
                                size='sm'
                                className='h-8 border-dashed'
                            >
                                <Filter className='mr-2 h-4 w-4' />
                                Estado
                                {statusFilter !== 'all' && (
                                    <Badge
                                        variant='secondary'
                                        className='ml-2 h-5 px-1 text-xs'
                                    >
                                        1
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align='start'
                            className='w-[300px] max-h-[400px] overflow-y-auto'
                        >
                            <DropdownMenuLabel>
                                Filtrar por diagnóstico
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {/* Opción "Todos" */}
                            <DropdownMenuCheckboxItem
                                checked={statusFilter === 'all'}
                                onCheckedChange={() => setStatusFilter('all')}
                            >
                                <div className='flex w-full items-center justify-between'>
                                    <span>Todos los resultados</span>
                                    <Badge
                                        variant='outline'
                                        className='ml-2 h-5 px-1 text-xs'
                                    >
                                        {getFilterCount('all')}
                                    </Badge>
                                </div>
                            </DropdownMenuCheckboxItem>

                            <DropdownMenuSeparator />

                            {/* Opciones dinámicas */}
                            {uniqueDiagnosticValues.map((diagnosticValue) => (
                                <DropdownMenuCheckboxItem
                                    key={diagnosticValue}
                                    checked={statusFilter === diagnosticValue}
                                    onCheckedChange={() =>
                                        setStatusFilter(diagnosticValue)
                                    }
                                >
                                    <div className='flex w-full items-center justify-between'>
                                        <span className='truncate text-xs'>
                                            {diagnosticValue}
                                        </span>
                                        <Badge
                                            variant='outline'
                                            className='ml-2 h-5 px-1 text-xs'
                                        >
                                            {getFilterCount(diagnosticValue)}
                                        </Badge>
                                    </div>
                                </DropdownMenuCheckboxItem>
                            ))}

                            {uniqueDiagnosticValues.length === 0 && (
                                <div className='text-muted-foreground px-2 py-1.5 text-sm'>
                                    No hay diagnósticos disponibles
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Botón reset */}
                    {isFiltered && (
                        <Button
                            variant='outline'
                            size='sm'
                            className='h-8 border-dashed px-2 lg:px-3'
                            onClick={handleReset}
                        >
                            <X className='mr-2 h-4 w-4' />
                            Reset
                        </Button>
                    )}
                </div>

                <div className='flex items-center gap-2'>
                    {/* Vista de columnas */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant='outline'
                                size='sm'
                                className='ml-auto h-8'
                            >
                                <Settings2 className='mr-2 h-4 w-4' />
                                Ver
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-[200px]'>
                            <DropdownMenuLabel>
                                Alternar columnas
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.imagen}
                                onCheckedChange={(checked) =>
                                    updateColumnVisibility('imagen', checked as boolean)
                                }
                            >
                                Imagen
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.titulo}
                                onCheckedChange={(checked) =>
                                    updateColumnVisibility('titulo', checked as boolean)
                                }
                            >
                                Título
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.resolucion}
                                onCheckedChange={(checked) =>
                                    updateColumnVisibility('resolucion', checked as boolean)
                                }
                            >
                                Resolución
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.tamaño}
                                onCheckedChange={(checked) =>
                                    updateColumnVisibility('tamaño', checked as boolean)
                                }
                            >
                                Tamaño
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.diagnosticoSaaS}
                                onCheckedChange={(checked) =>
                                    updateColumnVisibility('diagnosticoSaaS', checked as boolean)
                                }
                            >
                                Diagnóstico SaaS
                            </DropdownMenuCheckboxItem>
                            
                            {/* Columnas SDK dinámicas */}
                            {useSDK && sdkTags.length > 0 && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className='text-xs'>
                                        SDK Diagnósticos
                                    </DropdownMenuLabel>
                                    {sdkTags.map(tag => {
                                        const columnKey = `sdk_${tag}`;
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={tag}
                                                checked={visibleColumns[columnKey]}
                                                onCheckedChange={(checked) =>
                                                    updateColumnVisibility(columnKey, checked as boolean)
                                                }
                                            >
                                                SDK {tag}
                                            </DropdownMenuCheckboxItem>
                                        );
                                    })}
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Botón Limpiar */}
                    <Button
                        variant='outline'
                        size='sm'
                        className='h-8'
                        onClick={onClear}
                    >
                        <Trash2 className='mr-2 h-4 w-4' />
                        Limpiar
                    </Button>
                </div>
            </div>
        );
    };

    const getDiagnosticBadgeVariant = (diagnostic: string | undefined) => {
        if (!diagnostic) return 'secondary';

        const trimmedDiag = diagnostic.trim().toLowerCase();

        if (trimmedDiag === 'live') {
            return 'success';
        }
        if (trimmedDiag === 'nolive') {
            return 'destructive';
        }

        if (trimmedDiag.includes('error') || trimmedDiag.includes('failed')) {
            return 'destructive';
        }
        if (trimmedDiag.includes('success')) {
            return 'default';
        }
        return 'secondary';
    };

    const getDiagnosticDisplay = (diagnostic: string | undefined) => {
        if (!diagnostic) return 'Pendiente';

        // Truncar mensaje muy largo
        if (diagnostic.length > 50) {
            return diagnostic.substring(0, 47) + '...';
        }
        return diagnostic;
    };

    // Mostrar skeleton cuando esté cargando
    if (isLoading) {
        return (
            <ResultsTableSkeleton visibleColumns={visibleColumns} rows={5} />
        );
    }

    if (results.length === 0) {
        return (
            <Card className='w-full'>
                <CardContent className='text-muted-foreground flex h-64 items-center justify-center'>
                    <div className='text-center'>
                        <Sheet className='mx-auto mb-2 h-12 w-12 opacity-50' />
                        <p className='text-sm'>
                            Esperando resultados de evaluación...
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className='w-full'>
            <CardContent className='space-y-4'>
                {/* Toolbar mejorado */}
                <DataTableToolbar />

                {/* Tabla mejorada */}
                <div className='rounded-md border'>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {visibleColumns.imagen && (
                                    <TableHead className='w-20'>
                                        Imagen
                                    </TableHead>
                                )}
                                {visibleColumns.titulo && (
                                    <TableHead>Título</TableHead>
                                )}
                                {visibleColumns.resolucion && (
                                    <TableHead>Resolución</TableHead>
                                )}
                                {visibleColumns.tamaño && (
                                    <TableHead>Tamaño</TableHead>
                                )}
                                {visibleColumns.diagnosticoSaaS && (
                                    <TableHead>Diagnóstico SaaS</TableHead>
                                )}
                                {/* Columnas SDK dinámicas */}
                                {useSDK && sdkTags.map(tag => {
                                    const columnKey = `sdk_${tag}`;
                                    return visibleColumns[columnKey] && (
                                        <TableHead key={tag}>
                                            Diagnóstico SDK {tag}
                                        </TableHead>
                                    );
                                })}
                                {visibleColumns.acciones && (
                                    <TableHead className='w-20'>
                                        Acciones
                                    </TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredResults.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={
                                            Object.values(visibleColumns).filter(Boolean).length
                                        }
                                        className='h-24 text-center'
                                    >
                                        {searchValue || statusFilter !== 'all'
                                            ? 'No se encontraron resultados con los filtros aplicados.'
                                            : 'No hay resultados.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredResults.map((result, index) => (
                                    <TableRow
                                        key={index}
                                        className='hover:bg-muted/50'
                                    >
                                        {/* Imagen */}
                                        {visibleColumns.imagen && (
                                            <TableCell>
                                                {result.imageUrl ? (
                                                    <div className='relative aspect-square h-20 w-20 overflow-hidden rounded border'>
                                                        <img
                                                            src={result.imageUrl}
                                                            alt={result.title}
                                                            className='h-full w-full object-cover'
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className='bg-muted flex h-12 w-12 items-center justify-center rounded border'>
                                                        <X className='text-muted-foreground h-4 w-4' />
                                                    </div>
                                                )}
                                            </TableCell>
                                        )}

                                        {/* Título */}
                                        {visibleColumns.titulo && (
                                            <TableCell className='font-medium'>
                                                <div className='space-y-1'>
                                                    <p className='text-sm leading-none font-medium'>
                                                        {result.title}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        )}

                                        {/* Resolución */}
                                        {visibleColumns.resolucion && (
                                            <TableCell>
                                                <span className='font-sm font-medium'>
                                                    {result.resolution} px
                                                </span>
                                            </TableCell>
                                        )}

                                        {/* Tamaño */}
                                        {visibleColumns.tamaño && (
                                            <TableCell>
                                                <span className='text-sm font-medium'>
                                                    {result.size}
                                                </span>
                                            </TableCell>
                                        )}

                                        {/* Diagnóstico SaaS */}
                                        {visibleColumns.diagnosticoSaaS && (
                                            <TableCell>
                                                <div className='space-y-1'>
                                                    <Badge
                                                        variant={getDiagnosticBadgeVariant(
                                                            result.diagnosticSaaS
                                                        )}
                                                    >
                                                        {getDiagnosticDisplay(
                                                            result.diagnosticSaaS
                                                        )}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                        )}

                                        {/* Columnas SDK dinámicas */}
                                        {useSDK && sdkTags.map(tag => {
                                            const columnKey = `sdk_${tag}`;
                                            return visibleColumns[columnKey] && (
                                                <TableCell key={tag}>
                                                    <div className='space-y-1'>
                                                        <Badge
                                                            variant={getDiagnosticBadgeVariant(
                                                                result.sdkDiagnostics?.[tag]
                                                            )}
                                                        >
                                                            {getDiagnosticDisplay(
                                                                result.sdkDiagnostics?.[tag]
                                                            )}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                            );
                                        })}

                                        {/* Acciones */}
                                        {visibleColumns.acciones && (
                                            <TableCell>
                                                <CellAction
                                                    result={result}
                                                    onViewImage={handleViewImage}
                                                />
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Información de resultados */}
                <div className='text-muted-foreground flex items-center justify-between text-sm'>
                    <div>
                        Mostrando {filteredResults.length} de {results.length}{' '}
                        resultado{results.length !== 1 ? 's' : ''}
                        {statusFilter !== 'all' && (
                            <span className='ml-2'>
                                • Filtrado por:{' '}
                                <span className='font-medium'>
                                    {statusFilter}
                                </span>
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>

            {/* Modal de vista previa de imagen */}
            <ImagePreviewModal
                isOpen={imageModalOpen}
                onClose={handleCloseImageModal}
                result={selectedImage}
            />
        </Card>
    );
}