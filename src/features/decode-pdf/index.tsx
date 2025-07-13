'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Base64PdfResponseData,
    isMultiplePdfResponse,
    isSinglePdfResponse
} from '@/types/base64-pdf';
import { toast } from 'sonner';
import base64PdfService from '@/lib/tools/base64-pdf.service';
import { Base64Input } from './components/base64-input';
import { PdfPreview } from './components/pdf-preview';

interface PdfDataWithIndex extends Base64PdfResponseData {
    codeIndex: number;
}

export default function DecodePdf() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pdfData, setPdfData] = useState<PdfDataWithIndex[] | null>(null);
    const base64InputRef = useRef<{ reset: () => void } | null>(null);

    /* 🌱 Función para manejar la decodificación del PDF */
    const handleDecode = async (base64Codes: string[]) => {
        // Limpiar estado previo
        setPdfData(null);
        setError(null);
        setLoading(true);

        try {
            let response;

            // Usar el método correcto según la cantidad de códigos
            if (base64Codes.length === 1) {
                // Un solo PDF
                response = await base64PdfService.decodeSinglePdf(base64Codes[0]);
            } else {
                // Múltiples PDFs
                response = await base64PdfService.decodeMultiplePdfs(base64Codes);
            }

            if (!response.success) {
                const errorMsg = response.message || 'Error decoding the PDF.';
                setError(errorMsg);
                setPdfData(null);

                // Mostrar error específico según el tipo
                if ('error_type' in response) {
                    switch (response.error_type) {
                        case 'invalid_base64':
                            toast.error('Invalid Base64', {
                                description: 'The provided code is not a valid Base64.'
                            });
                            break;
                        case 'no_valid_pdfs':
                            toast.error('No valid PDFs', {
                                description: 'None of the codes could be processed as PDF.'
                            });
                            break;
                        case 'network_error':
                            toast.error('Connection error', {
                                description: 'Could not connect to the server.'
                            });
                            break;
                        default:
                            toast.error('Decoding error', {
                                description: errorMsg
                            });
                    }
                } else {
                    toast.error('Decoding error', {
                        description: errorMsg
                    });
                }
                return;
            }

            // Procesar respuesta exitosa
            if (!response.data) {
                setError('No data received from server');
                return;
            }

            let processedData: PdfDataWithIndex[] = [];

            if (isSinglePdfResponse(response)) {
                // Respuesta de un solo PDF
                processedData = [
                    {
                        ...response.data,
                        codeIndex: 0
                    }
                ];

                toast.success('PDF decoded', {
                    description: `${response.data.file_name} (${response.data.pages} pages, ${response.data.size_kb.toFixed(2)} KB)`
                });
            } else if (isMultiplePdfResponse(response)) {
                // Respuesta de múltiples PDFs
                processedData = response.data.processed_files.map((pdf, index) => ({
                    ...pdf,
                    codeIndex: index
                }));

                const totalProcessed = response.data.total_processed;
                const totalFailed = response.data.total_failed;

                if (totalProcessed > 0) {
                    toast.success('PDFs decoded', {
                        description: `${totalProcessed} PDFs processed successfully${totalFailed > 0 ? `, ${totalFailed} failed` : ''}`
                    });

                    // Mostrar advertencias sobre archivos fallidos
                    if (totalFailed > 0 && response.data.failed_files.length > 0) {
                        const failedReason =
                            response.data.failed_files[0]?.reason || 'Unknown error';
                        toast.warning('Some files failed', {
                            description: `${totalFailed} file(s) could not be processed: ${failedReason}`
                        });
                    }
                } else {
                    setError('Could not process any PDF');
                    toast.error('Error', {
                        description: 'None of the Base64 codes could be processed.'
                    });
                    return;
                }
            }

            setPdfData(processedData);
        } catch (err) {
            const errorMessage = 'Unexpected error processing the request. Please try again.';
            setError(errorMessage);
            setPdfData(null);

            console.error('Decode error:', err);
            toast.error('Unexpected error', {
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    /* 🌱 Función para manejar la descarga del PDF */
    const handleDownload = async (fileName: string) => {
        try {
            const success = await base64PdfService.downloadPdfWithFetch(fileName);

            if (success) {
                toast.success('Download started', {
                    description: `Downloading ${fileName}`
                });
            } else {
                toast.error('Download error', {
                    description: 'Could not download the file. Please try again.'
                });
            }
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Download error', {
                description: 'An error occurred while downloading the file.'
            });
        }
    };

    /* Función para restablecer el formulario */
    const handleReset = () => {
        setPdfData(null);
        setError(null);
        setLoading(false);

        if (base64InputRef.current && typeof base64InputRef.current.reset === 'function') {
            base64InputRef.current.reset();
        }

        toast.info('Form reset', {
            description: 'All data has been cleared for a new query.'
        });
    };

    return (
        <>
            <div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className='mb-6 flex items-center justify-between'
                >
                    <div>
                        <h1 className='text-2xl font-bold tracking-tight'>Base64 to PDF</h1>
                        <p className='text-muted-foreground text-sm'>
                            Convert base64 codes into viewable and downloadable PDF files.
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className='grid gap-6 lg:grid-cols-2'
                >
                    {/* Base64 input form */}
                    <Base64Input
                        ref={base64InputRef}
                        onSubmit={handleDecode}
                        onReset={handleReset}
                        isLoading={loading}
                    />

                    {/* PDF visualization */}
                    <PdfPreview
                        data={pdfData}
                        error={error}
                        isLoading={loading}
                        onDownload={handleDownload}
                    />
                </motion.div>
            </div>
        </>
    );
}
