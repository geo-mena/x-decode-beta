import React, { useCallback, useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CloudUpload, Play, RefreshCcw, Route, Trash } from 'lucide-react'

interface ImageUploadProps {
    onFilesSelected: (files: File[], isDirectory: boolean) => void
    onClear: () => void
    isLoading: boolean
    supportedExtensions: string[]
}

export function ImageUpload({ onFilesSelected, onClear, isLoading, supportedExtensions }: ImageUploadProps) {
    const [dragActive, setDragActive] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])

    const isValidFile = useCallback((file: File): boolean => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase()
        return supportedExtensions.includes(extension)
    }, [supportedExtensions])

    const handleFiles = useCallback((files: FileList | File[]) => {
        const fileArray = Array.from(files)
        const validFiles = fileArray.filter(isValidFile)
        const invalidFiles = fileArray.filter(file => !isValidFile(file))

        if (invalidFiles.length > 0) {
            toast.warning('Archivos no válidos', {
                description: `${invalidFiles.length} archivo(s) ignorado(s). Solo se admiten: ${supportedExtensions.join(', ')}`
            })
        }

        if (validFiles.length === 0) {
            toast.error('Error', {
                description: 'No se seleccionaron archivos de imagen válidos'
            })
            return
        }

        setSelectedFiles(validFiles)
        
        // Determinar si es un directorio (múltiples archivos)
        const isDirectory = validFiles.length > 1
        
        toast.success('Archivos seleccionados', {
            description: `${validFiles.length} imagen${validFiles.length > 1 ? 'es' : ''} seleccionada${validFiles.length > 1 ? 's' : ''}`
        })
    }, [isValidFile, supportedExtensions])

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        const files = e.dataTransfer.files
        if (files && files.length > 0) {
            handleFiles(files)
        }
    }, [handleFiles])

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files)
        }
    }, [handleFiles])

    const handleSubmit = useCallback(() => {
        if (selectedFiles.length === 0) {
            toast.error('Error', {
                description: 'Seleccione al menos una imagen para evaluar'
            })
            return
        }

        const isDirectory = selectedFiles.length > 1
        onFilesSelected(selectedFiles, isDirectory)
    }, [selectedFiles, onFilesSelected])

    const handleClear = useCallback(() => {
        setSelectedFiles([])
        onClear()
        // Reset input
        const input = document.getElementById('file-input') as HTMLInputElement
        if (input) {
            input.value = ''
        }
    }, [onClear])

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Route type="route" />
                    Evaluación de Liveness
                </CardTitle>
                <CardDescription>
                    Suba una imagen individual o múltiples imágenes para evaluar la prueba de vida pasiva
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">

                {/* Drop zone */}
                <div
                    className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                        dragActive
                            ? 'border-primary bg-primary/5'
                            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        id="file-input"
                        type="file"
                        multiple
                        accept={supportedExtensions.map(ext => `image/*${ext}`).join(',')}
                        onChange={handleFileInput}
                        className="absolute inset-0 cursor-pointer opacity-0"
                        disabled={isLoading}
                    />
                    
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <CloudUpload className='mb-2 h-12 w-12 text-muted-foreground'/>
                        <div>
                            <p className="text-sm font-medium">
                                Haga clic para seleccionar o arrastre archivos aquí
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Imagen individual o múltiples imágenes (máx. 10MB por archivo)
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex gap-2">
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || selectedFiles.length === 0}
                    className="flex-1 text-background"
                    variant="default"
                >
                    {isLoading ? (
                        <>
                            <RefreshCcw className="mr-2 animate-spin"/>
                            Evaluando...
                        </>
                    ) : (
                        <>
                            <Play className="mr-2"/>
                            Evaluar {selectedFiles.length > 1 ? 'Imágenes' : 'Imagen'}
                        </>
                    )}
                </Button>
                
                <Button
                    variant="outline"
                    onClick={handleClear}
                    disabled={isLoading || selectedFiles.length === 0}
                >
                    <Trash className="mr-2" />
                    Limpiar
                </Button>
            </CardFooter>
        </Card>
    )
}
