import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';

interface ResultsTableSkeletonProps {
    visibleColumns: Record<string, boolean>;
    rows?: number;
}

export function ResultsTableSkeleton({
    visibleColumns,
    rows = 5
}: ResultsTableSkeletonProps) {
    // Contar columnas visibles para el colspan
    const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length;

    return (
        <Card className='w-full'>
            <CardContent className='space-y-4'>
                {/* Skeleton del Toolbar */}
                <div className='flex w-full items-start justify-between gap-2 p-1'>
                    <div className='flex flex-1 flex-wrap items-center gap-2'>
                        {/* Skeleton búsqueda */}
                        <Skeleton className='h-8 w-[250px]' />
                        {/* Skeleton filtro */}
                        <Skeleton className='h-8 w-[100px]' />
                    </div>
                    <div className='flex items-center gap-2'>
                        {/* Skeleton botones */}
                        <Skeleton className='h-8 w-[80px]' />
                        <Skeleton className='h-8 w-[90px]' />
                    </div>
                </div>

                {/* Skeleton de la tabla */}
                <div className='rounded-md border'>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {visibleColumns.imagen && (
                                    <TableHead className='w-20'>
                                        <Skeleton className='h-4 w-16' />
                                    </TableHead>
                                )}
                                {visibleColumns.titulo && (
                                    <TableHead>
                                        <Skeleton className='h-4 w-20' />
                                    </TableHead>
                                )}
                                {visibleColumns.resolucion && (
                                    <TableHead>
                                        <Skeleton className='h-4 w-24' />
                                    </TableHead>
                                )}
                                {visibleColumns.tamaño && (
                                    <TableHead>
                                        <Skeleton className='h-4 w-16' />
                                    </TableHead>
                                )}
                                {visibleColumns.diagnosticoSaaS && (
                                    <TableHead>
                                        <Skeleton className='h-4 w-32' />
                                    </TableHead>
                                )}
                                
                                {/* Columnas SDK dinámicas */}
                                {Object.keys(visibleColumns)
                                    .filter(key => key.startsWith('sdk_') && visibleColumns[key])
                                    .map(key => (
                                        <TableHead key={key}>
                                            <Skeleton className='h-4 w-24' />
                                        </TableHead>
                                    ))
                                }
                                
                                {visibleColumns.acciones && (
                                    <TableHead className='w-20'>
                                        <Skeleton className='h-4 w-20' />
                                    </TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(rows)].map((_, index) => (
                                <TableRow key={index}>
                                    {/* Skeleton Imagen */}
                                    {visibleColumns.imagen && (
                                        <TableCell>
                                            <Skeleton className='h-20 w-20 rounded' />
                                        </TableCell>
                                    )}

                                    {/* Skeleton Título */}
                                    {visibleColumns.titulo && (
                                        <TableCell>
                                            <div className='space-y-2'>
                                                <Skeleton className='h-4 w-[150px]' />
                                                <Skeleton className='h-3 w-[200px]' />
                                            </div>
                                        </TableCell>
                                    )}

                                    {/* Skeleton Resolución */}
                                    {visibleColumns.resolucion && (
                                        <TableCell>
                                            <Skeleton className='h-4 w-[80px]' />
                                        </TableCell>
                                    )}

                                    {/* Skeleton Tamaño */}
                                    {visibleColumns.tamaño && (
                                        <TableCell>
                                            <Skeleton className='h-4 w-[60px]' />
                                        </TableCell>
                                    )}

                                    {/* Skeleton Diagnóstico SaaS */}
                                    {visibleColumns.diagnosticoSaaS && (
                                        <TableCell>
                                            <Skeleton className='h-6 w-[100px] rounded-full' />
                                        </TableCell>
                                    )}

                                    {/* Skeleton Columnas SDK dinámicas */}
                                    {Object.keys(visibleColumns)
                                        .filter(key => key.startsWith('sdk_') && visibleColumns[key])
                                        .map(key => (
                                            <TableCell key={key}>
                                                <Skeleton className='h-6 w-[100px] rounded-full' />
                                            </TableCell>
                                        ))
                                    }

                                    {/* Skeleton Acciones */}
                                    {visibleColumns.acciones && (
                                        <TableCell>
                                            <Skeleton className='h-8 w-8 rounded' />
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Skeleton información de resultados */}
                <div className='flex items-center justify-between'>
                    <Skeleton className='h-4 w-[200px]' />
                </div>
            </CardContent>
        </Card>
    );
}