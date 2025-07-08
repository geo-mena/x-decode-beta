'use client';

import { FC } from 'react';
import { Download, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DownloadReportProps {
    isDownloading: boolean;
    isCapturing?: boolean;
    onDownload: () => void;
}

const DownloadReport: FC<DownloadReportProps> = ({
    isDownloading,
    isCapturing = false,
    onDownload
}) => {
    if (isCapturing) {
        return (
            <Button className='flex items-center gap-2' disabled>
                <Loader className='h-4 w-4 animate-spin' />
                <span className='text-sm'>Descargando...</span>
            </Button>
        );
    }

    return (
        <Button onClick={onDownload} disabled={isDownloading} className='flex items-center gap-2'>
            {isDownloading ? (
                <>
                    <Loader className='h-4 w-4 animate-spin' />
                    <span>Generando...</span>
                </>
            ) : (
                <>
                    <Download className='h-4 w-4' />
                    <span>Descargar</span>
                </>
            )}
        </Button>
    );
};

export default DownloadReport;
