import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download } from 'lucide-react';
import { LivenessResult } from '@/types/liveness';

interface ImagePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: LivenessResult | null;
}

export function ImagePreviewModal({ isOpen, onClose, result }: ImagePreviewModalProps) {
    if (!result || !result.imageUrl) return null;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = result.imageUrl!;
        link.download = result.imagePath;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='max-h-[90vh] max-w-4xl p-0'>
                <DialogHeader className='p-6 pb-4'>
                    <DialogTitle>Image Preview</DialogTitle>
                </DialogHeader>
                {/* Image */}
                <div className='flex items-center justify-center px-6'>
                    <div className='relative max-h-[70vh] max-w-full overflow-hidden rounded-lg border'>
                        <Image
                            src={result.imageUrl}
                            alt={result.title}
                            className='max-h-[70vh] max-w-full object-contain'
                            width={800}
                            height={600}
                            style={{ objectFit: 'contain' }}
                        />
                    </div>
                </div>

                {/* Download button */}
                <div className='flex justify-center p-6 pt-4'>
                    <Button variant='outline' size='sm' onClick={handleDownload} className='gap-2'>
                        <Download className='h-4 w-4' />
                        Download Image
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
