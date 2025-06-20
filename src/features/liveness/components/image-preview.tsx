import React from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Download } from 'lucide-react'
import { LivenessResult } from '@/types/liveness'

interface ImagePreviewModalProps {
    isOpen: boolean
    onClose: () => void
    result: LivenessResult | null
}

export function ImagePreviewModal({ isOpen, onClose, result }: ImagePreviewModalProps) {
    if (!result || !result.imageUrl) return null

    const handleDownload = () => {
        const link = document.createElement('a')
        link.href = result.imageUrl!
        link.download = result.imagePath
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle>
                        Vista previa de la imagen
                    </DialogTitle>
                </DialogHeader>
                {/* Imagen */}
                <div className="flex items-center justify-center px-6">
                    <div className="relative max-w-full max-h-[70vh] overflow-hidden rounded-lg border">
                        <img
                            src={result.imageUrl}
                            alt={result.title}
                            className="max-w-full max-h-[70vh] object-contain"
                        />
                    </div>
                </div>

                {/* Botón descargar */}
                <div className="flex justify-center p-6 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Descargar imagen
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}