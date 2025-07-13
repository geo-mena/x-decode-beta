'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { CloudUpload, ImageUp, Link, Loader, Play, Plus, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MAX_FILES = 2;
const MAX_SIZE_MB = 50;

interface ImageInputProps {
    onSubmitFiles: (files: File[]) => void;
    onSubmitUrl: (url: string) => void;
    onReset: () => void;
    isLoading: boolean;
}

export const ImageInput = forwardRef<any, ImageInputProps>(
    ({ onSubmitFiles, onSubmitUrl, onReset, isLoading }, ref) => {
        const [files, setFiles] = useState<File[]>([]);
        const [imageUrl, setImageUrl] = useState('');
        const [inputMethod, setInputMethod] = useState<'upload' | 'url'>('upload');
        const [previewUrls, setPreviewUrls] = useState<string[]>([]);

        useImperativeHandle(ref, () => ({
            reset: () => {
                setFiles([]);
                setImageUrl('');
                setPreviewUrls([]);
                setInputMethod('upload');
            }
        }));

        /* 🌱 Función para manejar la selección de archivos */
        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFiles = e.target.files;
            if (!selectedFiles || selectedFiles.length === 0) return;

            // Convertir FileList a Array
            const filesArray = Array.from(selectedFiles);

            // Validar tamaño máximo
            const oversizedFiles = filesArray.filter(
                (file) => file.size > MAX_SIZE_MB * 1024 * 1024
            );
            if (oversizedFiles.length > 0) {
                toast.error('File too large', {
                    description: `One or more files exceed the ${MAX_SIZE_MB} MB limit.`
                });
                return;
            }

            // Limitar cantidad
            const filesToAdd = filesArray.slice(0, MAX_FILES - files.length);
            if (filesArray.length + files.length > MAX_FILES) {
                toast.warning('File limit exceeded', {
                    description: `Only up to ${MAX_FILES} files will be processed in total. The rest will be ignored.`
                });
            }

            // Crear URLs de vista previa
            const newPreviewUrls = filesToAdd.map((file) => URL.createObjectURL(file));

            // Actualizar estado
            setFiles([...files, ...filesToAdd]);
            setPreviewUrls([...previewUrls, ...newPreviewUrls]);

            toast.success('Images loaded', {
                description: `${filesToAdd.length} ${filesToAdd.length === 1 ? 'image loaded' : 'images loaded'}.`
            });

            // Limpiar el input de archivos
            e.target.value = '';
        };

        /* 🌱 Función para eliminar un archivo */
        const removeFile = (index: number) => {
            // Liberar URL de objeto
            if (previewUrls[index]) {
                URL.revokeObjectURL(previewUrls[index]);
            }

            // Eliminar archivo y previsualización
            const newFiles = [...files];
            const newPreviewUrls = [...previewUrls];

            newFiles.splice(index, 1);
            newPreviewUrls.splice(index, 1);

            setFiles(newFiles);
            setPreviewUrls(newPreviewUrls);
        };

        /* 🌱 Función para manejar el submit del formulario */
        const handleSubmit = () => {
            if (inputMethod === 'upload') {
                if (files.length === 0) {
                    toast.error('Image required', {
                        description: 'Please select at least one image to encode.'
                    });
                    return;
                }
                onSubmitFiles(files);
            } else {
                if (!imageUrl.trim()) {
                    toast.error('URL required', {
                        description: 'Please enter a valid image URL.'
                    });
                    return;
                }
                onSubmitUrl(imageUrl.trim());
            }
        };

        /* 🌱 Función para restablecer el formulario */
        const handleResetClick = () => {
            // Liberar URLs de objetos
            previewUrls.forEach((url) => URL.revokeObjectURL(url));

            onReset();
        };

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Input Parameters</CardTitle>
                    <CardDescription>
                        Upload up to {MAX_FILES} images or enter an image URL
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <Tabs
                        value={inputMethod}
                        onValueChange={(v) => setInputMethod(v as 'upload' | 'url')}
                    >
                        <TabsList className='grid w-full grid-cols-2'>
                            <TabsTrigger value='upload'>
                                <CloudUpload className='mr-2 h-4 w-4' />
                                Upload Files
                            </TabsTrigger>
                            <TabsTrigger value='url'>
                                <Link className='mr-2 h-4 w-4' />
                                Image URL
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value='upload' className='space-y-4'>
                            <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <Label>Images to encode</Label>
                                    <Badge
                                        variant={
                                            files.length >= MAX_FILES ? 'destructive' : 'secondary'
                                        }
                                        className='ml-2'
                                    >
                                        {files.length}/{MAX_FILES} image(s)
                                    </Badge>
                                </div>

                                {/* Input siempre presente pero oculto */}
                                <input
                                    id='image-upload'
                                    type='file'
                                    accept='image/*'
                                    multiple
                                    className='hidden'
                                    onChange={handleFileChange}
                                    disabled={isLoading || files.length >= MAX_FILES}
                                />

                                {/* Área de subida de imágenes */}
                                {files.length === 0 && (
                                    <label
                                        htmlFor='image-upload'
                                        className='border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors'
                                    >
                                        <div className='flex flex-col items-center justify-center p-4'>
                                            <ImageUp className='text-muted-foreground mb-2 h-12 w-12' />
                                            <p className='text-muted-foreground mb-2 text-sm'>
                                                <span className='font-semibold'>
                                                    Click to upload
                                                </span>{' '}
                                                or drag and drop
                                            </p>
                                            <p className='text-muted-foreground text-xs'>
                                                JPG, PNG, GIF, SVG, WebP (max. {MAX_SIZE_MB} MB)
                                            </p>
                                        </div>
                                    </label>
                                )}

                                {/* Lista de archivos seleccionados */}
                                {files.length > 0 && (
                                    <div className='space-y-3'>
                                        {files.map((file, index) => (
                                            <div
                                                key={index}
                                                className='flex items-center justify-between rounded-md border p-3'
                                            >
                                                <div className='flex items-center gap-3'>
                                                    {previewUrls[index] && (
                                                        <div className='bg-muted h-12 w-12 flex-shrink-0 overflow-hidden rounded'>
                                                            <img
                                                                src={previewUrls[index]}
                                                                alt={file.name}
                                                                className='h-full w-full object-cover'
                                                            />
                                                        </div>
                                                    )}
                                                    <div className='min-w-0 flex-1'>
                                                        <p className='truncate text-sm font-medium'>
                                                            {file.name}
                                                        </p>
                                                        <p className='text-muted-foreground text-xs'>
                                                            {(file.size / (1024 * 1024)).toFixed(2)}{' '}
                                                            MB
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    onClick={() => removeFile(index)}
                                                    disabled={isLoading}
                                                >
                                                    <X className='h-4 w-4' />
                                                </Button>
                                            </div>
                                        ))}

                                        {files.length < MAX_FILES && (
                                            <Button
                                                variant='outline'
                                                className='w-full'
                                                onClick={() =>
                                                    document.getElementById('image-upload')?.click()
                                                }
                                                disabled={isLoading}
                                            >
                                                <Plus className='mr-2 h-4 w-4' />
                                                Add another image
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value='url' className='space-y-4'>
                            <div className='space-y-2'>
                                <Label htmlFor='image-url'>Image URL</Label>
                                <Input
                                    id='image-url'
                                    placeholder='https://ejemplo.com/imagen.jpg'
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    disabled={isLoading}
                                />
                                <p className='text-muted-foreground mt-1 text-xs'>
                                    Enter the direct URL of a publicly accessible image.
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className='flex gap-2'>
                    <Button
                        onClick={handleSubmit}
                        disabled={
                            isLoading ||
                            (inputMethod === 'upload' ? files.length === 0 : !imageUrl.trim())
                        }
                        className='flex-1'
                    >
                        {isLoading ? (
                            <>
                                <Loader className='mr-2 h-4 w-4 animate-spin' />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Play className='mr-2 h-4 w-4' />
                                Encode
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={handleResetClick}
                        variant='secondary'
                        type='button'
                        disabled={
                            isLoading ||
                            (inputMethod === 'upload' ? files.length === 0 : !imageUrl.trim())
                        }
                    >
                        <RefreshCw className='mr-2 h-4 w-4' />
                        Clear
                    </Button>
                </CardFooter>
            </Card>
        );
    }
);

ImageInput.displayName = 'ImageInput';
