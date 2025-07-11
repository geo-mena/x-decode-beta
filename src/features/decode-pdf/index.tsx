'use client';

import { useRef, useState } from 'react';
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
                const errorMsg = response.message || 'Error al decodificar el PDF.';
                setError(errorMsg);
                setPdfData(null);

                // Mostrar error específico según el tipo
                if ('error_type' in response) {
                    switch (response.error_type) {
                        case 'invalid_base64':
                            toast.error('Base64 inválido', {
                                description: 'El código proporcionado no es un Base64 válido.'
                            });
                            break;
                        case 'no_valid_pdfs':
                            toast.error('Sin PDFs válidos', {
                                description: 'Ninguno de los códigos pudo ser procesado como PDF.'
                            });
                            break;
                        case 'network_error':
                            toast.error('Error de conexión', {
                                description: 'No se pudo conectar con el servidor.'
                            });
                            break;
                        default:
                            toast.error('Error de decodificación', {
                                description: errorMsg
                            });
                    }
                } else {
                    toast.error('Error de decodificación', {
                        description: errorMsg
                    });
                }
                return;
            }

            // Procesar respuesta exitosa
            if (!response.data) {
                setError('No se recibieron datos del servidor');
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

                toast.success('PDF decodificado', {
                    description: `${response.data.file_name} (${response.data.pages} páginas, ${response.data.size_kb.toFixed(2)} KB)`
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
                    toast.success('PDFs decodificados', {
                        description: `${totalProcessed} PDFs procesados exitosamente${totalFailed > 0 ? `, ${totalFailed} fallaron` : ''}`
                    });

                    // Mostrar advertencias sobre archivos fallidos
                    if (totalFailed > 0 && response.data.failed_files.length > 0) {
                        const failedReason =
                            response.data.failed_files[0]?.reason || 'Error desconocido';
                        toast.warning('Algunos archivos fallaron', {
                            description: `${totalFailed} archivo(s) no pudieron procesarse: ${failedReason}`
                        });
                    }
                } else {
                    setError('No se pudo procesar ningún PDF');
                    toast.error('Error', {
                        description: 'Ninguno de los códigos Base64 pudo ser procesado.'
                    });
                    return;
                }
            }

            setPdfData(processedData);
        } catch (err) {
            const errorMessage = 'Error inesperado al procesar la solicitud. Intente nuevamente.';
            setError(errorMessage);
            setPdfData(null);

            console.error('Decode error:', err);
            toast.error('Error inesperado', {
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
                toast.success('Descarga iniciada', {
                    description: `Descargando ${fileName}`
                });
            } else {
                toast.error('Error de descarga', {
                    description: 'No se pudo descargar el archivo. Inténtelo nuevamente.'
                });
            }
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Error de descarga', {
                description: 'Ocurrió un error al descargar el archivo.'
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

        toast.info('Formulario restablecido', {
            description: 'Todos los datos han sido borrados para una nueva consulta.'
        });
    };

    return (
        <>
            {/* ===== Main ===== */}
            <div>
                <div className='mb-6 flex items-center justify-between'>
                    <div>
                        <h1 className='text-2xl font-bold tracking-tight'>Base64 a PDF</h1>
                        <p className='text-muted-foreground text-sm'>
                            Convierte códigos base64 en archivos de PDF visualizables y
                            descargables.
                        </p>
                    </div>
                </div>

                <div className='grid gap-6 lg:grid-cols-2'>
                    {/* Formulario de entrada de base64 */}
                    <Base64Input
                        ref={base64InputRef}
                        onSubmit={handleDecode}
                        onReset={handleReset}
                        isLoading={loading}
                    />

                    {/* Visualización del PDF */}
                    <PdfPreview
                        data={pdfData}
                        error={error}
                        isLoading={loading}
                        onDownload={handleDownload}
                    />
                </div>
            </div>
        </>
    );
}
