import { useState, RefObject } from 'react';
import html2canvas from 'html2canvas';

type ReportDownloadState = {
    isCapturing: boolean;
    isDownloading: boolean;
};

export const useReportDownload = (cardRef: RefObject<HTMLDivElement>) => {
    const [state, setState] = useState<ReportDownloadState>({
        isCapturing: false,
        isDownloading: false
    });

    const downloadReportAsImage = async () => {
        if (!cardRef.current) return;

        try {
            setState({ isCapturing: true, isDownloading: false });

            await new Promise((resolve) => setTimeout(resolve, 50));

            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: document.body.classList.contains('dark') ? '#09090b' : '#ffffff',
                windowWidth: document.documentElement.offsetWidth,
                windowHeight: document.documentElement.offsetHeight,
                ignoreElements: (element) => element.classList.contains('report-footer')
            });

            setState({ isCapturing: false, isDownloading: true });

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `reporte-analisis-${timestamp}.png`;

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        console.error('Failed to convert canvas to blob');
                        setState({ isCapturing: false, isDownloading: false });
                        return;
                    }

                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;

                    document.body.appendChild(link);
                    link.click();

                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    setState({ isCapturing: false, isDownloading: false });
                },
                'image/png',
                1.0
            );
        } catch (error) {
            console.error('Error generating image:', error);
            setState({ isCapturing: false, isDownloading: false });
        }
    };

    return {
        isCapturing: state.isCapturing,
        isDownloading: state.isDownloading,
        downloadReportAsImage
    };
};

export default useReportDownload;
