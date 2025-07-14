import React from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LivenessResult } from '@/types/liveness';

interface ImagePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: LivenessResult | null;
}

export function ImagePreviewModal({ isOpen, onClose, result }: ImagePreviewModalProps) {
    if (!result || !result.imageUrl) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='max-h-[90vh] max-w-4xl p-0'>
                <DialogHeader className='p-6 pb-4'>
                    <DialogTitle>Image Preview</DialogTitle>
                </DialogHeader>
                {/* Image */}
                <div className='flex items-center justify-center px-6 mb-8'>
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
            </DialogContent>
        </Dialog>
    );
}
