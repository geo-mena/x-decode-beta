import React, { useCallback, useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CloudUpload, Play, Route, Trash, Folder, Files, Loader } from 'lucide-react'

interface ImageUploadProps {
    onFilesSelected: (files: File[], isDirectory: boolean) => void
    onClear: () => void
    isLoading: boolean
    supportedExtensions: string[]
}

export function ImageUpload({ onFilesSelected, onClear, isLoading, supportedExtensions }: ImageUploadProps) {
    const [dragActive, setDragActive] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [isDirectoryMode, setIsDirectoryMode] = useState(false)

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
        
        // Determinar si es un directorio (múltiples archivos o modo directorio)
        const isDirectory = validFiles.length > 1 || isDirectoryMode
        
        toast.success('Archivos seleccionados', {
            description: `${validFiles.length} imagen${validFiles.length > 1 ? 'es' : ''} seleccionada${validFiles.length > 1 ? 's' : ''}`
        })
    }, [isValidFile, supportedExtensions, isDirectoryMode])

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

        const isDirectory = selectedFiles.length > 1 || isDirectoryMode
        onFilesSelected(selectedFiles, isDirectory)
    }, [selectedFiles, onFilesSelected, isDirectoryMode])

    const handleClear = useCallback(() => {
        setSelectedFiles([])
        onClear()
        // Reset both inputs
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        const dirInput = document.getElementById('directory-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        if (dirInput) dirInput.value = ''
    }, [onClear])

    const clearInputsOnly = useCallback(() => {
        setSelectedFiles([])
        // Reset both inputs without triggering onClear callback
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        const dirInput = document.getElementById('directory-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        if (dirInput) dirInput.value = ''
    }, [])

    const toggleMode = useCallback(() => {
        setIsDirectoryMode(!isDirectoryMode)
        // Limpiar internamente sin mostrar mensaje
        clearInputsOnly()
    }, [isDirectoryMode, clearInputsOnly])

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Route className="h-5 w-5" />
                    Evaluación de Liveness
                </CardTitle>
                <CardDescription>
                    Suba una imagen individual o múltiples imágenes para evaluar la prueba de vida pasiva
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Mode selector */}
                <div className="flex gap-2">
                    <Button
                        variant={!isDirectoryMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => !isDirectoryMode || toggleMode()}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                    >
                        <Files className="h-4 w-4" />
                        Archivos individuales
                    </Button>
                    <Button
                        variant={isDirectoryMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => isDirectoryMode || toggleMode()}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                    >
                        <Folder className="h-4 w-4" />
                        Carpeta completa
                    </Button>
                </div>

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
                    {/* Input for individual files */}
                    <input
                        id="file-input"
                        type="file"
                        multiple={!isDirectoryMode}
                        accept={supportedExtensions.map(ext => `image/*${ext}`).join(',')}
                        onChange={handleFileInput}
                        className={`absolute inset-0 cursor-pointer opacity-0 ${isDirectoryMode ? 'hidden' : ''}`}
                        disabled={isLoading || isDirectoryMode}
                    />
                    
                    {/* Input for directory */}
                    <input
                        id="directory-input"
                        type="file"
                        // @ts-ignore - webkitdirectory is not in TypeScript definitions but is supported
                        webkitdirectory="true"
                        multiple
                        onChange={handleFileInput}
                        className={`absolute inset-0 cursor-pointer opacity-0 ${!isDirectoryMode ? 'hidden' : ''}`}
                        disabled={isLoading || !isDirectoryMode}
                    />
                    
                    <div className="flex flex-col items-center justify-center space-y-2">
                        {isDirectoryMode ? (
                            <Folder className='mb-2 h-12 w-12 text-muted-foreground'/>
                        ) : (
                            <CloudUpload className='mb-2 h-12 w-12 text-muted-foreground'/>
                        )}
                        <div>
                            <p className="text-sm font-medium">
                                {isDirectoryMode 
                                    ? 'Haga clic para seleccionar una carpeta o arrastre una carpeta aquí'
                                    : 'Haga clic para seleccionar archivos o arrastre archivos aquí'
                                }
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {isDirectoryMode 
                                    ? 'Se seleccionarán todas las imágenes de la carpeta (máx. 10MB por archivo)'
                                    : 'Imagen individual o múltiples imágenes (máx. 10MB por archivo)'
                                }
                            </p>
                            {selectedFiles.length > 0 && (
                                <p className="text-xs text-emerald-500 mt-1">
                                    {selectedFiles.length} archivo{selectedFiles.length > 1 ? 's' : ''} seleccionado{selectedFiles.length > 1 ? 's' : ''}
                                </p>
                            )}
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
                            <Loader className="mr-2 h-4 w-4 animate-spin"/>
                            Evaluando...
                        </>
                    ) : (
                        <>
                            <Play className="mr-2 h-4 w-4"/>
                            Evaluar {selectedFiles.length > 1 ? 'Imágenes' : 'Imagen'}
                        </>
                    )}
                </Button>
                
                <Button
                    variant="outline"
                    onClick={handleClear}
                    disabled={isLoading || selectedFiles.length === 0}
                >
                    <Trash className="mr-2 h-4 w-4" />
                    Limpiar
                </Button>
            </CardFooter>
        </Card>
    )
}
