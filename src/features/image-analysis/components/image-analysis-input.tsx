'use client';

import { ChangeEvent, forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { CloudUpload, Image, ImageUp, Link, Loader, Play, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImageAnalysisInputProps {
    onSubmit: (data: { imageSource: File | string; saveToDb: boolean; storeFile: boolean }) => void;
    onReset: () => void;
    isLoading: boolean;
}

export const ImageAnalysisInput = forwardRef<{ reset: () => void }, ImageAnalysisInputProps>(
    ({ onSubmit, onReset, isLoading }, ref) => {
        const [imageUrl, setImageUrl] = useState('');
        const [saveToDb, setSaveToDb] = useState(false);
        const [storeFile, setStoreFile] = useState(false);
        const [formError, setFormError] = useState<string | null>(null);
        const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');
        const [fileName, setFileName] = useState<string | null>(null);
        const [selectedFile, setSelectedFile] = useState<File | null>(null);

        // Referencias a los elementos de formulario
        const urlInputRef = useRef<HTMLInputElement>(null);
        const fileInputRef = useRef<HTMLInputElement>(null);

        useImperativeHandle(ref, () => ({
            reset: () => {
                setImageUrl('');
                setSaveToDb(false);
                setStoreFile(false);
                setFormError(null);
                setActiveTab('url');
                setFileName(null);
                setSelectedFile(null);

                if (urlInputRef.current) urlInputRef.current.value = '';
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }));

        // Manejar carga de archivo
        const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            const file = files[0];
            if (!file.type.startsWith('image/')) {
                setFormError('The file must be a valid image (JPG, PNG, GIF, WEBP, SVG).');
                return;
            }

            setSelectedFile(file);
            setFileName(file.name);
            setFormError(null);

            toast.success('Image selected', {
                description: `${file.name} ready for analysis`
            });
        };

        // Validar la URL
        const validateUrl = (url: string): boolean => {
            try {
                new URL(url);
                return true;
            } catch (e) {
                return false;
            }
        };

        // Validar el formulario
        const validateForm = (): boolean => {
            if (activeTab === 'url') {
                if (!imageUrl.trim()) {
                    setFormError('Image URL is required.');
                    return false;
                }
                if (!validateUrl(imageUrl)) {
                    setFormError('Enter a valid URL.');
                    return false;
                }
            } else {
                if (!selectedFile) {
                    setFormError('Select an image to analyze.');
                    return false;
                }
            }

            setFormError(null);
            return true;
        };

        // Manejar el envío del formulario
        const handleSubmit = () => {
            if (!validateForm()) return;

            if (activeTab === 'url') {
                onSubmit({
                    imageSource: imageUrl,
                    saveToDb,
                    storeFile
                });
            } else if (activeTab === 'file' && selectedFile) {
                onSubmit({
                    imageSource: selectedFile,
                    saveToDb,
                    storeFile
                });
            }
        };

        return (
            <Card className='w-full'>
                <CardHeader>
                    <CardTitle>Input Parameters</CardTitle>
                    <CardDescription>
                        Determine if an image was AI-generated or created by a human
                    </CardDescription>
                </CardHeader>

                <CardContent className='space-y-4'>
                    {/* Pestañas para seleccionar el tipo de entrada */}
                    <Tabs
                        value={activeTab}
                        onValueChange={(value) => setActiveTab(value as 'url' | 'file')}
                        className='w-full'
                    >
                        <TabsList className='grid w-full grid-cols-2'>
                            <TabsTrigger value='url' disabled={isLoading}>
                                <Link className='mr-2 h-4 w-4' />
                                Image URL
                            </TabsTrigger>
                            <TabsTrigger value='file' disabled={isLoading}>
                                <CloudUpload className='mr-2 h-4 w-4' />
                                Upload File
                            </TabsTrigger>
                        </TabsList>

                        {/* Contenido de la pestaña URL */}
                        <TabsContent value='url' className='space-y-4'>
                            <div className='space-y-2'>
                                <Label htmlFor='imageUrl'>Image URL *</Label>
                                <Input
                                    ref={urlInputRef}
                                    id='imageUrl'
                                    placeholder='https://ejemplo.com/imagen.jpg'
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    disabled={isLoading}
                                />
                                <p className='text-muted-foreground text-xs'>
                                    Enter the direct URL of a publicly accessible image
                                </p>
                            </div>
                        </TabsContent>

                        {/* Contenido de la pestaña Archivo */}
                        <TabsContent value='file'>
                            <div className='space-y-2'>
                                <Label htmlFor='imageFile'>Image file *</Label>
                                <div className='border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors'>
                                    <input
                                        ref={fileInputRef}
                                        type='file'
                                        id='imageFile'
                                        accept='image/*'
                                        onChange={handleFileChange}
                                        disabled={isLoading}
                                        className='hidden'
                                    />
                                    {fileName ? (
                                        <div className='flex flex-col items-center'>
                                            <Image className='text-muted-foreground mb-2 h-12 w-12' />
                                            <p className='text-sm font-medium'>{fileName}</p>
                                            <p className='text-muted-foreground text-xs'>
                                                Image ready for analysis
                                            </p>
                                            <Button
                                                variant='outline'
                                                size='sm'
                                                className='mt-2'
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isLoading}
                                            >
                                                Change file
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className='flex flex-col items-center'>
                                            <ImageUp className='text-muted-foreground mb-2 h-12 w-12' />
                                            <p className='text-sm font-medium'>
                                                Click to select image
                                            </p>
                                            <p className='text-muted-foreground text-xs'>
                                                Or drag and drop files here
                                            </p>
                                            <Button
                                                variant='outline'
                                                size='sm'
                                                className='mt-2'
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isLoading}
                                            >
                                                Select File
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Opciones adicionales */}
                    <div className='space-y-4'>
                        <div className='flex items-center space-x-2'>
                            <Switch
                                id='saveToDb'
                                checked={saveToDb}
                                onCheckedChange={setSaveToDb}
                                disabled={isLoading}
                            />
                            <Label htmlFor='saveToDb'>Save to DB</Label>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <Switch
                                id='storeFile'
                                checked={storeFile}
                                onCheckedChange={setStoreFile}
                                disabled={isLoading}
                            />
                            <Label htmlFor='storeFile'>Save to R2</Label>
                        </div>
                    </div>

                    {/* Mensaje de error */}
                    {formError && (
                        <div className='bg-destructive/10 text-destructive rounded-md p-3 text-sm font-medium'>
                            {formError}
                        </div>
                    )}
                </CardContent>

                <CardFooter className='flex gap-2'>
                    <Button
                        onClick={handleSubmit}
                        disabled={
                            isLoading || (activeTab === 'url' ? !imageUrl.trim() : !selectedFile)
                        }
                        className='flex-1'
                    >
                        {isLoading ? (
                            <>
                                <Loader className='mr-2 h-4 w-4 animate-spin' />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Play className='mr-2 h-4 w-4' />
                                Analyze Image
                            </>
                        )}
                    </Button>
                    <Button
                        variant='secondary'
                        onClick={onReset}
                        disabled={
                            isLoading || (activeTab === 'url' ? !imageUrl.trim() : !selectedFile)
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

ImageAnalysisInput.displayName = 'ImageAnalysisInput';
