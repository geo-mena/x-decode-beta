import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Download, FileText, Loader, User } from 'lucide-react';
import { LivenessResult } from '@/types/liveness';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportResultsProps {
    visibleColumns: Record<string, boolean>;
    filteredResults: LivenessResult[];
    useSDK: boolean;
    sdkTags: string[];
}

export function ExportResults({
    visibleColumns,
    filteredResults,
    useSDK,
    sdkTags
}: ExportResultsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [clientName, setClientName] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    const getColumnHeaders = () => {
        const headers: Record<string, string> = {};
        
        if (visibleColumns.imagen) headers.imagen = 'Image';
        if (visibleColumns.titulo) headers.titulo = 'Title';
        if (visibleColumns.resolucion) headers.resolucion = 'Resolution';
        if (visibleColumns.tamaño) headers.tamaño = 'Size';
        if (visibleColumns.diagnosticoSaaS) headers.diagnosticoSaaS = 'SaaS Diagnostic';
        
        if (useSDK && sdkTags.length > 0) {
            sdkTags.forEach((tag) => {
                const columnKey = `sdk_${tag}`;
                if (visibleColumns[columnKey]) {
                    headers[columnKey] = `SDK ${tag}`;
                }
            });
        }
        
        return headers;
    };

    const extractTableData = () => {
        const headers = getColumnHeaders();
        
        return filteredResults.map((result) => {
            const row: Record<string, any> = {};
            
            Object.keys(headers).forEach((key) => {
                switch (key) {
                    case 'imagen':
                        row[key] = result.imageUrl || null;
                        break;
                    case 'titulo':
                        row[key] = result.title;
                        break;
                    case 'resolucion':
                        row[key] = `${result.resolution} px`;
                        break;
                    case 'tamaño':
                        row[key] = result.size;
                        break;
                    case 'diagnosticoSaaS':
                        row[key] = result.diagnosticSaaS || 'Pending';
                        break;
                    default:
                        if (key.startsWith('sdk_')) {
                            const tag = key.replace('sdk_', '');
                            row[key] = result.sdkDiagnostics?.[tag] || 'Pending';
                        }
                        break;
                }
            });
            
            return row;
        });
    };


    const createTableHTML = async () => {
        const headers = getColumnHeaders();
        const headerKeys = Object.keys(headers);
        const tableData = extractTableData();
        
        // Convert images to base64
        const processedTableData = await Promise.all(
            tableData.map(async (row) => {
                const processedRow = { ...row };
                
                if (row.imagen && typeof row.imagen === 'string') {
                    try {
                        const response = await fetch(row.imagen);
                        const blob = await response.blob();
                        const base64 = await new Promise<string>((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(blob);
                        });
                        processedRow.imagen = base64;
                    } catch (error) {
                        console.error('Error loading image:', error);
                        processedRow.imagen = null;
                    }
                }
                
                return processedRow;
            })
        );
        
        return `
            <div style="font-family: 'Poppins', Arial, sans-serif; padding: 20px; max-width: 100%; background-color: #ffffff; color: #000000;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #1f2937; margin-bottom: 20px; font-size: 24px; font-weight: bold; font-family: 'Poppins', Arial, sans-serif;">Informe de Resultados</h1>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11px; background-color: #ffffff; font-family: 'Poppins', Arial, sans-serif; table-layout: fixed;">
                    <thead>
                        <tr style="background-color: #f9fafb; border: 1px solid #000000;">
                            ${headerKeys.map(key => {
                                let width = '';
                                if (key === 'imagen') width = 'width: 150px;';
                                else if (key === 'titulo') width = 'width: 150px;';
                                else if (key === 'resolucion') width = 'width: 150px;';
                                else if (key === 'tamaño') width = 'width: 150px;';
                                
                                return `
                                    <th style="border: 1px solid #000000; padding: 12px 8px; text-align: center; font-weight: bold; color: #374151; font-size: 11px; font-family: 'Poppins', Arial, sans-serif; ${width}">
                                        ${headers[key]}
                                    </th>
                                `;
                            }).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${processedTableData.map((row, index) => `
                            <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'}; border: 1px solid #000000;">
                                ${headerKeys.map(key => {
                                    const value = row[key];
                                    let width = '';
                                    if (key === 'imagen') width = 'width: 150px;';
                                    else if (key === 'titulo') width = 'width: 150px;';
                                    else if (key === 'resolucion') width = 'width: 150px;';
                                    else if (key === 'tamaño') width = 'width: 150px;';
                                    
                                    if (key === 'imagen') {
                                        if (value && typeof value === 'string' && value.startsWith('data:')) {
                                            return `
                                                <td style="border: 1px solid #000000; padding: 8px; text-align: center; ${width}">
                                                    <img src="${value}" style="width: 100px; height: 130px; object-fit: cover; border-radius: 4px;" />
                                                </td>
                                            `;
                                        } else {
                                            return `
                                                <td style="border: 1px solid #000000; padding: 8px; text-align: center; color: #6b7280; font-family: 'Poppins', Arial, sans-serif; ${width}">
                                                    N/A
                                                </td>
                                            `;
                                        }
                                    }
                                    
                                    return `
                                        <td style="border: 1px solid #000000; padding: 8px; text-align: center; color: #374151; font-family: 'Poppins', Arial, sans-serif; ${width}">
                                            ${value || ''}
                                        </td>
                                    `;
                                }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };

    const convertToPDF = async (htmlContent: string, filename: string) => {
        // Determine orientation based on number of active columns (excluding Actions)
        const exportableColumns = Object.entries(visibleColumns)
            .filter(([key, visible]) => visible && key !== 'acciones')
            .length;
        const isLandscape = exportableColumns >= 6;
        const orientation = isLandscape ? 'landscape' : 'portrait';
        // Create a new iframe to isolate from page CSS
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.top = '-9999px';
        iframe.style.width = isLandscape ? '1400px' : '800px';
        iframe.style.height = '2000px';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        try {
            const iframeDoc = iframe.contentDocument!;
            
            // Write clean HTML with no external CSS
            iframeDoc.open();
            iframeDoc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                            font-family: 'Poppins', Arial, sans-serif !important;
                            color: #000000 !important;
                        }
                        body {
                            background-color: #ffffff !important;
                            color: #000000 !important;
                            font-family: 'Poppins', Arial, sans-serif !important;
                        }
                    </style>
                </head>
                <body>
                    ${htmlContent}
                </body>
                </html>
            `);
            iframeDoc.close();

            // Wait for content to load
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(iframeDoc.body, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: isLandscape ? 1400 : 800,
                logging: false,
                foreignObjectRendering: false
            });

            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: orientation,
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const imgWidth = pdfWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 10;

            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight - 20;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight + 10;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight - 20;
            }

            pdf.save(filename);
        } finally {
            document.body.removeChild(iframe);
        }
    };

    const handleExport = async () => {
        if (!clientName.trim()) {
            alert('Por favor ingrese el nombre del cliente');
            return;
        }

        setIsExporting(true);

        try {
            const htmlContent = await createTableHTML();
            const filename = `Informe_${clientName.trim().replace(/\s+/g, '_')}_${format(new Date(), 'ddMMyyyy')}.pdf`;
            
            await convertToPDF(htmlContent, filename);

            setIsOpen(false);
            setClientName('');
        } catch (error) {
            console.error('Error exporting results:', error);
            alert('Error al exportar los resultados. Por favor intente nuevamente.');
        } finally {
            setIsExporting(false);
        }
    };

    const PreviewTable = () => {
        const headers = getColumnHeaders();
        const tableData = extractTableData();
        const previewData = tableData.slice(0, 3);

        return (
            <Card className="mt-4">
                <CardContent className="p-4">
                    <div className="mb-4">
                        <h3 className="font-semibold text-sm mb-2">Vista previa de los datos a exportar:</h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>Cliente: {clientName || '[Nombre del cliente]'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                <span>Formato: {Object.entries(visibleColumns).filter(([key, visible]) => visible && key !== 'acciones').length >= 6 ? 'LANDSCAPE' : 'PORTRAIT'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto border rounded">
                        <table className="w-full text-xs">
                            <thead className="bg-muted">
                                <tr>
                                    {Object.values(headers).map((header, index) => (
                                        <th key={index} className="p-2 text-left font-medium">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((row, index) => (
                                    <tr key={index} className="border-t">
                                        {Object.keys(headers).map((key, cellIndex) => (
                                            <td key={cellIndex} className="p-2">
                                                {key === 'imagen' && row[key] && typeof row[key] === 'string' && row[key] !== 'N/A' ? (
                                                    <div className="flex justify-center">
                                                        <img 
                                                            src={row[key]} 
                                                            alt="Preview" 
                                                            className="w-8 h-8 object-cover rounded border"
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="text-xs">{row[key] === null ? 'N/A' : row[key]}</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {tableData.length > 3 && (
                                    <tr className="border-t bg-muted/50">
                                        <td colSpan={Object.keys(headers).length} className="p-2 text-center text-muted-foreground">
                                            ... y {tableData.length - 3} registros más
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="mt-3 text-xs text-muted-foreground">
                        Total de columnas: {Object.keys(headers).length} | Total de registros: {tableData.length} | 
                        Orientación: <span className="font-medium">{Object.entries(visibleColumns).filter(([key, visible]) => visible && key !== 'acciones').length >= 6 ? 'LANDSCAPE' : 'PORTRAIT'}</span>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8" disabled={filteredResults.length === 0}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Exportar Resultados a PDF
                    </DialogTitle>
                    <DialogDescription>
                        Genere un informe en PDF con los resultados filtrados de la tabla en formato landscape.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="client-name">Nombre del Cliente *</Label>
                        <Input
                            id="client-name"
                            type="text"
                            placeholder="Ingrese el nombre del cliente"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            disabled={isExporting}
                        />
                    </div>

                    <PreviewTable />
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isExporting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={!clientName.trim() || isExporting}
                    >
                        {isExporting ? (
                            <>
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                                Exportando...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Exportar PDF
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}