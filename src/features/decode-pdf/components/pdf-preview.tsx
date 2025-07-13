'use client';

import { useState, useEffect } from 'react';
import { Base64PdfResponseData } from '@/types/base64-pdf';
import {
    AlertCircle,
    Download,
    ExternalLink,
    FileText,
    Files,
    FileDown,
    Info,
    Calendar,
    User,
    FileType,
    RefreshCw,
    CheckCircle,
    XCircle,
    CloudCog,
    CloudAlert
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PdfDataWithIndex extends Base64PdfResponseData {
    codeIndex: number;
}

interface PdfPreviewProps {
    data: PdfDataWithIndex[] | null;
    error: string | null;
    isLoading: boolean;
    onDownload: (fileName: string) => void;
}

export function PdfPreview({ data, error, isLoading, onDownload }: PdfPreviewProps) {
    const [activeTab, setActiveTab] = useState('0');
    const [iframeErrors, setIframeErrors] = useState<Set<string>>(new Set());
    const [retryCount, setRetryCount] = useState<Map<string, number>>(new Map());
    const [loadedPdfs, setLoadedPdfs] = useState<Set<string>>(new Set());

    const pdfs = data || [];
    const hasMultiplePdfs = pdfs.length > 1;
    const activePdf = pdfs.length > 0 ? pdfs[parseInt(activeTab)] || pdfs[0] : null;

    // Limpiar estados cuando cambian los datos
    useEffect(() => {
        setIframeErrors(new Set());
        setRetryCount(new Map());
        setLoadedPdfs(new Set());
        setActiveTab('0');
    }, [data]);

    /* 🌱 Función para formatear el tamaño del archivo */
    const formatFileSize = (sizeKb: number) => {
        if (sizeKb < 1) return `${Math.round(sizeKb * 1024)} bytes`;
        if (sizeKb < 1024) return `${sizeKb.toFixed(2)} KB`;
        return `${(sizeKb / 1024).toFixed(2)} MB`;
    };

    /* 🌱 Función para formatear fecha */
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    /* 🌱 Función para obtener badge de versión PDF */
    const getPdfVersionBadge = (version: string | null) => {
        if (!version) return null;

        const versionNum = parseFloat(version);
        let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';

        if (versionNum >= 2.0) variant = 'default';
        else if (versionNum >= 1.7) variant = 'secondary';
        else if (versionNum >= 1.4) variant = 'outline';
        else variant = 'destructive';

        return (
            <Badge variant={variant} className='font-mono text-xs'>
                PDF {version}
            </Badge>
        );
    };

    /* 🌱 Función para manejar errores de iframe */
    const handleIframeError = (fileName: string) => {
        const currentRetries = retryCount.get(fileName) || 0;

        if (currentRetries < 2) {
            // Intentar de nuevo hasta 2 veces
            setRetryCount((prev) => new Map(prev.set(fileName, currentRetries + 1)));

            toast.warning('Retrying load', {
                description: `Attempt ${currentRetries + 2} of 3 for ${fileName}`
            });
        } else {
            // Marcar como error permanente
            setIframeErrors((prev) => new Set(prev).add(fileName));
            toast.error('Preview error', {
                description: `Could not load preview of ${fileName}. Use "Open in new tab" or download the file.`
            });
        }
    };

    /* 🌱 Función para manejar carga exitosa de iframe */
    const handleIframeLoad = (fileName: string) => {
        setLoadedPdfs((prev) => new Set(prev).add(fileName));
        setIframeErrors((prev) => {
            const newSet = new Set(prev);
            newSet.delete(fileName);
            return newSet;
        });
        setRetryCount((prev) => new Map(prev.set(fileName, 0)));
    };

    /* 🌱 Función para abrir el PDF en una nueva pestaña */
    const handleOpenPdf = (pdfData: PdfDataWithIndex) => {
        // Usar view_url si está disponible, sino download_url como fallback
        const url = pdfData.view_url || pdfData.download_url;

        if (url) {
            window.open(url, '_blank');
            toast.info('Opening PDF', {
                description: `Viewing ${pdfData.file_name} in a new tab`
            });
        } else {
            toast.error('URL not available', {
                description: 'No valid URL found to open the PDF'
            });
        }
    };

    /* 🌱 Función para manejar descarga con validación */
    const handleDownloadClick = (pdfData: PdfDataWithIndex) => {
        if (!pdfData?.file_name) {
            toast.error('Download error', {
                description: 'File name not found.'
            });
            return;
        }
        onDownload(pdfData.file_name);
    };

    /* 🌱 Función para reintentar carga de iframe */
    const handleRetryIframe = (fileName: string) => {
        setIframeErrors((prev) => {
            const newSet = new Set(prev);
            newSet.delete(fileName);
            return newSet;
        });
        setRetryCount((prev) => new Map(prev.set(fileName, 0)));
        setLoadedPdfs((prev) => {
            const newSet = new Set(prev);
            newSet.delete(fileName);
            return newSet;
        });

        toast.info('Retrying', {
            description: 'Reloading PDF preview...'
        });
    };

    /* 🌱 Renderizar información básica del PDF */
    const renderPdfBasicInfo = (pdfData: PdfDataWithIndex) => (
        <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <div className='flex items-center space-x-2'>
                <FileType className='text-muted-foreground h-4 w-4' />
                <div>
                    <p className='text-muted-foreground text-xs'>Format</p>
                    <Badge variant='outline' className='text-xs'>
                        {pdfData.mime_type || 'application/pdf'}
                    </Badge>
                </div>
            </div>

            <div className='flex items-center space-x-2'>
                <Files className='text-muted-foreground h-4 w-4' />
                <div>
                    <p className='text-muted-foreground text-xs'>Size</p>
                    <p className='text-sm font-medium'>{formatFileSize(pdfData.size_kb || 0)}</p>
                </div>
            </div>

            <div className='flex items-center space-x-2'>
                <FileText className='text-muted-foreground h-4 w-4' />
                <div>
                    <p className='text-muted-foreground text-xs'>Pages</p>
                    <p className='text-sm font-medium'>{pdfData.pages || 'N/A'}</p>
                </div>
            </div>

            <div className='flex items-center space-x-2'>
                <Info className='text-muted-foreground h-4 w-4' />
                <div>
                    <p className='text-muted-foreground text-xs'>Version</p>
                    {getPdfVersionBadge(pdfData.pdf_version)}
                </div>
            </div>
        </div>
    );

    /* 🌱 Renderizar metadatos del PDF con Accordion */
    const renderPdfMetadata = (pdfData: PdfDataWithIndex) => {
        const metadata = [
            { icon: FileText, label: 'Title', value: pdfData.title },
            { icon: User, label: 'Author', value: pdfData.author },
            { icon: Info, label: 'Subject', value: pdfData.subject },
            { icon: Calendar, label: 'Created', value: formatDate(pdfData.creation_date) },
            { icon: Calendar, label: 'Modified', value: formatDate(pdfData.modification_date) },
            { icon: Info, label: 'Creator', value: pdfData.creator },
            { icon: Info, label: 'Producer', value: pdfData.producer },
            { icon: Info, label: 'Keywords', value: pdfData.keywords }
        ].filter((item) => item.value && item.value !== 'N/A');

        if (metadata.length === 0) {
            return (
                <Accordion type='single' collapsible className='w-full'>
                    <AccordionItem value='metadata'>
                        <AccordionTrigger className='text-sm font-medium'>
                            <div className='flex items-center space-x-2'>
                                <Info className='h-4 w-4' />
                                <span>Metadata</span>
                                <Badge variant='outline' className='text-xs'>
                                    No data
                                </Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className='text-muted-foreground py-6 text-center'>
                                <Info className='mx-auto mb-2 h-8 w-8 opacity-50' />
                                <p className='text-sm'>No metadata available</p>
                                <p className='mt-1 text-xs'>
                                    The PDF does not contain additional information
                                </p>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            );
        }

        return (
            <Accordion type='single' collapsible className='w-full'>
                <AccordionItem value='metadata'>
                    <AccordionTrigger className='text-sm font-medium'>
                        <div className='flex items-center space-x-2'>
                            <Info className='h-4 w-4' />
                            <span>Metadata</span>
                            <Badge variant='secondary' className='text-xs'>
                                {metadata.length} field{metadata.length > 1 ? 's' : ''}
                            </Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className='space-y-2 pt-2'>
                            {metadata.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={index}
                                        className='bg-muted/30 flex items-start space-x-3 rounded-lg p-2'
                                    >
                                        <Icon className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
                                        <div className='min-w-0 flex-1'>
                                            <p className='text-muted-foreground text-xs font-medium'>
                                                {item.label}
                                            </p>
                                            <p className='text-sm break-words'>{item.value}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        );
    };

    /* 🌱 Renderizar detalles completos del PDF */
    const renderPdfDetails = (pdfData: PdfDataWithIndex) => (
        <div className='space-y-6'>
            {renderPdfBasicInfo(pdfData)}
            {renderPdfMetadata(pdfData)}
        </div>
    );

    /* 🌱 Renderizar vista previa del PDF con manejo de errores robusto */
    const renderPdfViewer = (pdfData: PdfDataWithIndex) => {
        const hasError = iframeErrors.has(pdfData.file_name);
        const retries = retryCount.get(pdfData.file_name) || 0;
        const isLoaded = loadedPdfs.has(pdfData.file_name);

        // Determinar qué URL usar para la vista previa
        const previewUrl = pdfData.view_url || pdfData.download_url;

        return (
            <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                        <h4 className='text-sm font-medium'>Preview</h4>
                        {isLoaded && !hasError && (
                            <Badge variant='secondary' className='text-xs'>
                                <CheckCircle className='mr-1 h-3 w-3' />
                                Loaded
                            </Badge>
                        )}
                        {hasError && (
                            <Badge variant='destructive' className='text-xs'>
                                <XCircle className='mr-1 h-3 w-3' />
                                Error
                            </Badge>
                        )}
                        {retries > 0 && !hasError && (
                            <Badge variant='outline' className='text-xs'>
                                Attempt {retries + 1}
                            </Badge>
                        )}
                    </div>
                    <div className='flex items-center space-x-2'>
                        {pdfData.original_name && (
                            <Badge variant='outline' className='text-xs'>
                                Original: {pdfData.original_name}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className='bg-muted relative h-[450px] w-full overflow-hidden rounded-lg border'>
                    {hasError ? (
                        // Vista de error con opciones de recuperación
                        <div className='flex h-full flex-col items-center justify-center p-6'>
                            <AlertCircle className='text-destructive mb-4 h-16 w-16 opacity-50' />
                            <h5 className='mb-2 text-lg font-medium'>
                                Error loading preview
                            </h5>
                            <p className='text-muted-foreground mb-4 max-w-md text-center text-sm'>
                                The PDF file exists but cannot be displayed in this preview.
                                This may be due to browser restrictions or specific PDF features.
                            </p>
                            <div className='flex flex-wrap justify-center gap-2'>
                                <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={() => handleRetryIframe(pdfData.file_name)}
                                >
                                    <RefreshCw className='mr-2 h-4 w-4' />
                                    Retry preview
                                </Button>
                                <Button
                                    variant='default'
                                    size='sm'
                                    onClick={() => handleOpenPdf(pdfData)}
                                >
                                    <ExternalLink className='mr-2 h-4 w-4' />
                                    Open in new tab
                                </Button>
                                <Button
                                    variant='secondary'
                                    size='sm'
                                    onClick={() => handleDownloadClick(pdfData)}
                                >
                                    <Download className='mr-2 h-4 w-4' />
                                    Download file
                                </Button>
                            </div>
                        </div>
                    ) : previewUrl ? (
                        // Vista previa con iframe
                        <>
                            {!isLoaded && (
                                <div className='bg-muted text-muted-foreground absolute inset-0 z-10 flex items-center justify-center'>
                                    <div className='text-center'>
                                        <FileDown className='mx-auto mb-2 h-8 w-8 animate-pulse' />
                                        <p className='text-sm'>Loading preview...</p>
                                    </div>
                                </div>
                            )}
                            <iframe
                                key={`${pdfData.file_name}_${retries}`} // Force re-render on retry
                                src={`${previewUrl}#toolbar=0&navpanes=0&view=FitH`}
                                className='h-full w-full'
                                title={`Preview of ${pdfData.file_name}`}
                                onError={() => handleIframeError(pdfData.file_name)}
                                onLoad={() => handleIframeLoad(pdfData.file_name)}
                                allowFullScreen
                            />
                        </>
                    ) : (
                        // Sin URL disponible
                        <div className='flex h-full items-center justify-center'>
                            <div className='text-center'>
                                <FileText className='text-muted-foreground mx-auto mb-2 h-12 w-12' />
                                <p className='text-muted-foreground text-sm'>
                                    Preview not available
                                </p>
                                <p className='text-muted-foreground mt-1 text-xs'>
                                    Preview URL not found
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Card className='flex h-full flex-col'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <div>
                    <CardTitle className='flex items-center space-x-2'>
                        <span>Output Results</span>
                    </CardTitle>
                    <CardDescription className='mt-1'>
                        {hasMultiplePdfs
                            ? 'Preview and details of generated PDFs'
                            : 'Preview and details of generated PDF'}
                    </CardDescription>
                </div>
                {pdfs.length > 0 && (
                    <Badge variant='secondary' className='flex items-center space-x-1'>
                        <Files className='h-3 w-3' />
                        <span>
                            {pdfs.length} file{pdfs.length > 1 ? 's' : ''}
                        </span>
                    </Badge>
                )}
            </CardHeader>

            <CardContent className='flex-grow'>
                {isLoading && (
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <CloudCog className='mb-4 h-20 w-20 animate-pulse' />
                        <p className='text-sm font-medium'>Processing base64 code(s)...</p>
                    </div>
                )}

                {error && !isLoading && (
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <CloudAlert className='mb-4 h-20 w-20' />
                        <p className='text-sm font-medium'>{error}</p>
                    </div>
                )}

                {!pdfs.length && !error && !isLoading && (
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <CloudCog className='mb-4 h-20 w-20' />
                        <p className='text-sm font-medium'>
                            Enter a base64 code to view the PDF
                        </p>
                    </div>
                )}

                {pdfs.length > 0 && (
                    <>
                        {hasMultiplePdfs ? (
                            <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
                                <TabsList
                                    className={`mb-4 grid w-full ${pdfs.length > 4 ? 'grid-cols-4' : `grid-cols-${pdfs.length}`}`}
                                >
                                    {pdfs.slice(0, 4).map((pdf, index) => (
                                        <TabsTrigger
                                            key={index}
                                            value={index.toString()}
                                            className='flex items-center space-x-1'
                                        >
                                            <Files className='h-4 w-4' />
                                            <span>PDF {index + 1}</span>
                                            {iframeErrors.has(pdf.file_name) && (
                                                <AlertCircle className='text-destructive ml-1 h-3 w-3' />
                                            )}
                                            {loadedPdfs.has(pdf.file_name) &&
                                                !iframeErrors.has(pdf.file_name) && (
                                                    <CheckCircle className='ml-1 h-3 w-3 text-green-500' />
                                                )}
                                        </TabsTrigger>
                                    ))}
                                    {pdfs.length > 4 && (
                                        <TabsTrigger value='more'>
                                            <span>+{pdfs.length - 4} more</span>
                                        </TabsTrigger>
                                    )}
                                </TabsList>

                                {pdfs.map((pdf, index) => (
                                    <TabsContent
                                        key={index}
                                        value={index.toString()}
                                        className='mt-0 space-y-6'
                                    >
                                        {renderPdfViewer(pdf)}
                                        {renderPdfDetails(pdf)}
                                    </TabsContent>
                                ))}

                                {/* Tab content para PDFs adicionales si hay más de 4 */}
                                {pdfs.length > 4 && (
                                    <TabsContent value='more' className='mt-0'>
                                        <div className='space-y-4'>
                                            <h4 className='flex items-center space-x-2 text-sm font-medium'>
                                                <Files className='h-4 w-4' />
                                                <span>Additional PDFs</span>
                                            </h4>
                                            <div className='grid gap-2'>
                                                {pdfs.slice(4).map((pdf, index) => (
                                                    <Button
                                                        key={index + 4}
                                                        variant='outline'
                                                        className='h-auto justify-start p-3'
                                                        onClick={() =>
                                                            setActiveTab((index + 4).toString())
                                                        }
                                                    >
                                                        <div className='flex items-center space-x-3'>
                                                            <Files className='h-4 w-4' />
                                                            <div className='text-left'>
                                                                <p className='font-medium'>
                                                                    PDF {index + 5}
                                                                </p>
                                                                <p className='text-muted-foreground text-xs'>
                                                                    {pdf.file_name}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </TabsContent>
                                )}
                            </Tabs>
                        ) : (
                            <div className='space-y-6'>
                                {activePdf && (
                                    <>
                                        {renderPdfViewer(activePdf)}
                                        {renderPdfDetails(activePdf)}
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </CardContent>

            {activePdf && (
                <CardFooter className='flex gap-2'>
                    <Button
                        onClick={() => handleDownloadClick(activePdf)}
                        className='flex-1'
                        disabled={isLoading}
                    >
                        <Download className='mr-2 h-4 w-4' />
                        Download PDF
                    </Button>
                    {activePdf.view_url && (
                        <Button
                            variant='outline'
                            onClick={() => handleOpenPdf(activePdf)}
                            disabled={isLoading}
                        >
                            <ExternalLink className='mr-2 h-4 w-4' />
                            New tab
                        </Button>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}
