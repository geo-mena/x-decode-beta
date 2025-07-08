import React, { useCallback, useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
    CloudUpload,
    Play,
    Folder,
    Files,
    Loader,
    FileText,
    Plus,
    X,
    Copy,
    Server,
    CheckCircle,
    XCircle,
    RefreshCw
} from 'lucide-react';
import { usePlaygroundStore } from '@/store';

interface ImageUploadProps {
    onFilesSelected: (files: File[], isDirectory: boolean) => void;
    onBase64Selected: (base64Images: string[]) => void;
    onClear: () => void;
    isLoading: boolean;
    supportedExtensions: string[];
    useSDK: boolean;
    setUseSDK: (useSDK: boolean) => void;
    selectedSDKEndpoints: string[];
    setSelectedSDKEndpoints: (endpointIds: string[]) => void;
    checkSDKEndpointStatus: (url: string) => Promise<boolean>;
}

export function ImageUpload({
    onFilesSelected,
    onBase64Selected,
    onClear,
    isLoading,
    supportedExtensions,
    useSDK,
    setUseSDK,
    selectedSDKEndpoints,
    setSelectedSDKEndpoints,
    checkSDKEndpointStatus
}: ImageUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isDirectoryMode, setIsDirectoryMode] = useState(false);
    const [inputMethod, setInputMethod] = useState<'files' | 'base64'>('files');
    const [base64Inputs, setBase64Inputs] = useState<string[]>(['']);
    const [checkingEndpoints, setCheckingEndpoints] = useState(false);

    const { userEndpoints, updateUserEndpoint } = usePlaygroundStore();

    const MAX_BASE64_INPUTS = 5;

    // Check endpoint statuses - simplified to avoid dependency loops
    const checkAllEndpointStatuses = async () => {
        if (!useSDK || userEndpoints.length === 0) return;

        setCheckingEndpoints(true);

        try {
            for (const endpoint of userEndpoints) {
                try {
                    const isActive = await checkSDKEndpointStatus(endpoint.url);
                    updateUserEndpoint(endpoint.id, { isActive });
                } catch (error) {
                    updateUserEndpoint(endpoint.id, { isActive: false });
                }
            }
        } finally {
            setCheckingEndpoints(false);
        }
    };

    const isValidFile = useCallback(
        (file: File): boolean => {
            const extension = '.' + file.name.split('.').pop()?.toLowerCase();
            return supportedExtensions.includes(extension);
        },
        [supportedExtensions]
    );

    const handleFiles = useCallback(
        (files: FileList | File[]) => {
            const fileArray = Array.from(files);
            const validFiles = fileArray.filter(isValidFile);
            const invalidFiles = fileArray.filter((file) => !isValidFile(file));

            if (invalidFiles.length > 0) {
                toast.warning('Archivos no válidos', {
                    description: `${invalidFiles.length} archivo(s) ignorado(s). Solo se admiten: ${supportedExtensions.join(', ')}`
                });
            }

            if (validFiles.length === 0) {
                toast.error('Error', {
                    description: 'No se seleccionaron archivos de imagen válidos'
                });
                return;
            }

            setSelectedFiles(validFiles);

            toast.success('Archivos seleccionados', {
                description: `${validFiles.length} imagen${validFiles.length > 1 ? 'es' : ''} seleccionada${validFiles.length > 1 ? 's' : ''}`
            });
        },
        [isValidFile, supportedExtensions, isDirectoryMode]
    );

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);

            if (inputMethod === 'files') {
                const files = e.dataTransfer.files;
                if (files && files.length > 0) {
                    handleFiles(files);
                }
            }
        },
        [handleFiles, inputMethod]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files);
            }
        },
        [handleFiles]
    );

    // Funciones para manejar Base64
    const addBase64Field = useCallback(() => {
        if (base64Inputs.length >= MAX_BASE64_INPUTS) {
            toast.warning('Límite alcanzado', {
                description: `No se pueden agregar más de ${MAX_BASE64_INPUTS} entradas de base64.`
            });
            return;
        }
        setBase64Inputs([...base64Inputs, '']);
    }, [base64Inputs]);

    const removeBase64Field = useCallback(
        (index: number) => {
            if (base64Inputs.length <= 1) {
                setBase64Inputs(['']);
            } else {
                const newInputs = [...base64Inputs];
                newInputs.splice(index, 1);
                setBase64Inputs(newInputs);
            }
        },
        [base64Inputs]
    );

    const updateBase64Input = useCallback(
        (value: string, index: number) => {
            const newInputs = [...base64Inputs];
            newInputs[index] = value;
            setBase64Inputs(newInputs);
        },
        [base64Inputs]
    );

    const copyToClipboard = useCallback((base64: string) => {
        if (!base64) return;
        navigator.clipboard.writeText(base64);
        toast.success('Copiado al portapapeles', {
            description: 'El base64 ha sido copiado al portapapeles.'
        });
    }, []);

    const validateBase64 = useCallback((base64String: string): boolean => {
        try {
            // Limpiar el base64 (remover espacios y saltos de línea)
            const cleanBase64 = base64String.replace(/\s/g, '');

            // Verificar si tiene el prefijo data:image
            const base64WithoutPrefix = cleanBase64.startsWith('data:image/')
                ? cleanBase64.split(',')[1]
                : cleanBase64;

            // Validar que sea base64 válido
            const decoded = atob(base64WithoutPrefix);
            return decoded.length > 0;
        } catch (error) {
            return false;
        }
    }, []);

    // Funciones para manejar SDK endpoints - simplified
    const handleSDKToggle = (checked: boolean) => {
        setUseSDK(checked);
        if (checked) {
            // Check endpoints when enabling SDK
            checkAllEndpointStatuses();
        } else {
            // Clear selection when disabling SDK
            setSelectedSDKEndpoints([]);
        }
    };

    const handleEndpointSelection = useCallback(
        (endpointId: string, checked: boolean) => {
            if (checked) {
                setSelectedSDKEndpoints([...selectedSDKEndpoints, endpointId]);
            } else {
                setSelectedSDKEndpoints(selectedSDKEndpoints.filter((id) => id !== endpointId));
            }
        },
        [selectedSDKEndpoints, setSelectedSDKEndpoints]
    );

    const getSelectedActiveEndpoints = useCallback(() => {
        return userEndpoints.filter(
            (endpoint) => selectedSDKEndpoints.includes(endpoint.id) && endpoint.isActive
        );
    }, [userEndpoints, selectedSDKEndpoints]);

    const handleSubmit = useCallback(() => {
        if (inputMethod === 'files') {
            if (selectedFiles.length === 0) {
                toast.error('Error', {
                    description: 'Seleccione al menos una imagen para evaluar'
                });
                return;
            }

            // Verificar que si SDK está habilitado, al menos un endpoint esté seleccionado y activo
            if (useSDK) {
                const activeSelected = getSelectedActiveEndpoints();
                if (activeSelected.length === 0) {
                    toast.error('Error', {
                        description:
                            'Debe seleccionar al menos un endpoint SDK activo o deshabilitar la evaluación SDK'
                    });
                    return;
                }
            }

            const isDirectory = selectedFiles.length > 1 || isDirectoryMode;
            onFilesSelected(selectedFiles, isDirectory);
        } else {
            // Modo base64
            const validBase64s = base64Inputs.filter((base64) => {
                const trimmed = base64.trim();
                return trimmed !== '' && validateBase64(trimmed);
            });

            if (validBase64s.length === 0) {
                toast.error('Error', {
                    description: 'Ingrese al menos un base64 válido para evaluar'
                });
                return;
            }

            // Verificar que si SDK está habilitado, al menos un endpoint esté seleccionado y activo
            if (useSDK) {
                const activeSelected = getSelectedActiveEndpoints();
                if (activeSelected.length === 0) {
                    toast.error('Error', {
                        description:
                            'Debe seleccionar al menos un endpoint SDK activo o deshabilitar la evaluación SDK'
                    });
                    return;
                }
            }

            onBase64Selected(validBase64s);
        }
    }, [
        inputMethod,
        selectedFiles,
        onFilesSelected,
        isDirectoryMode,
        base64Inputs,
        validateBase64,
        onBase64Selected,
        useSDK,
        getSelectedActiveEndpoints
    ]);

    const handleClear = useCallback(() => {
        setSelectedFiles([]);
        setBase64Inputs(['']);
        onClear();

        // Reset file inputs
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        const dirInput = document.getElementById('directory-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        if (dirInput) dirInput.value = '';
    }, [onClear]);

    const clearInputsOnly = useCallback(() => {
        setSelectedFiles([]);
        setBase64Inputs(['']);

        // Reset inputs without triggering onClear callback
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        const dirInput = document.getElementById('directory-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        if (dirInput) dirInput.value = '';
    }, []);

    const toggleMode = useCallback(() => {
        setIsDirectoryMode(!isDirectoryMode);
        clearInputsOnly();
    }, [isDirectoryMode, clearInputsOnly]);

    const handleInputMethodChange = useCallback(
        (value: string) => {
            const newMethod = value as 'files' | 'base64';
            setInputMethod(newMethod);
            clearInputsOnly();
        },
        [clearInputsOnly]
    );

    const getSubmitText = () => {
        if (inputMethod === 'files') {
            return selectedFiles.length > 1 ? 'Evaluar Imágenes' : 'Evaluar Imagen';
        } else {
            const validCount = base64Inputs.filter(
                (b) => b.trim() && validateBase64(b.trim())
            ).length;
            return validCount > 1 ? 'Evaluar Base64s' : 'Evaluar Base64';
        }
    };

    const canSubmit = () => {
        if (inputMethod === 'files') {
            return selectedFiles.length > 0;
        } else {
            return base64Inputs.some((base64) => base64.trim() && validateBase64(base64.trim()));
        }
    };

    return (
        <Card className='w-full'>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                    Evaluación de Liveness
                </CardTitle>
                <CardDescription>
                    Suba imágenes desde archivos o ingrese base64 manualmente
                </CardDescription>
            </CardHeader>

            <CardContent className='space-y-6'>
                {/* SDK Configuration Section */}
                <div className='space-y-4 rounded-lg border p-4'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-2'>
                            <Server className='h-4 w-4' />
                            <Label htmlFor='sdk-toggle' className='text-sm font-medium'>
                                Evaluación con SDK Local
                            </Label>
                        </div>
                        <Switch
                            id='sdk-toggle'
                            checked={useSDK}
                            onCheckedChange={handleSDKToggle}
                            disabled={isLoading}
                        />
                    </div>

                    {useSDK && (
                        <div className='space-y-3'>
                            <div className='flex items-center justify-between'>
                                <Label className='text-muted-foreground text-sm'>
                                    Seleccionar endpoints SDK:
                                </Label>
                                <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={checkAllEndpointStatuses}
                                    disabled={checkingEndpoints || isLoading}
                                >
                                    {checkingEndpoints ? (
                                        <Loader className='mr-2 h-3 w-3 animate-spin' />
                                    ) : (
                                        <RefreshCw className='mr-2 h-3 w-3' />
                                    )}
                                    Verificar estado
                                </Button>
                            </div>

                            <div className='max-h-40 space-y-2 overflow-y-auto'>
                                {userEndpoints.map((endpoint) => (
                                    <div
                                        key={endpoint.id}
                                        className='flex items-center space-x-3 rounded border p-2'
                                    >
                                        <Checkbox
                                            id={endpoint.id}
                                            checked={selectedSDKEndpoints.includes(endpoint.id)}
                                            onCheckedChange={(checked) =>
                                                handleEndpointSelection(
                                                    endpoint.id,
                                                    checked as boolean
                                                )
                                            }
                                            disabled={!endpoint.isActive || isLoading}
                                        />
                                        <div className='min-w-0 flex-1'>
                                            <div className='flex items-center space-x-2'>
                                                <Label
                                                    htmlFor={endpoint.id}
                                                    className={`cursor-pointer text-sm ${
                                                        !endpoint.isActive
                                                            ? 'text-muted-foreground'
                                                            : ''
                                                    }`}
                                                >
                                                    {endpoint.tag}
                                                </Label>
                                                {endpoint.isActive ? (
                                                    <CheckCircle className='h-3 w-3 text-green-500' />
                                                ) : (
                                                    <XCircle className='h-3 w-3 text-red-500' />
                                                )}
                                            </div>
                                            <p
                                                className={`truncate text-xs ${
                                                    !endpoint.isActive
                                                        ? 'text-muted-foreground'
                                                        : 'text-muted-foreground'
                                                }`}
                                            >
                                                {endpoint.url}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={endpoint.isActive ? 'default' : 'secondary'}
                                            className='text-xs'
                                        >
                                            {endpoint.isActive ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>

                            {userEndpoints.length === 0 && (
                                <p className='text-muted-foreground text-sm'>
                                    No hay endpoints configurados. Configure endpoints en la
                                    configuración.
                                </p>
                            )}

                            {selectedSDKEndpoints.length > 0 && (
                                <div className='text-muted-foreground text-sm'>
                                    {selectedSDKEndpoints.length} endpoint
                                    {selectedSDKEndpoints.length > 1 ? 's' : ''} seleccionado
                                    {selectedSDKEndpoints.length > 1 ? 's' : ''}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Method selector tabs */}
                <Tabs value={inputMethod} onValueChange={handleInputMethodChange}>
                    <TabsList className='grid w-full grid-cols-2'>
                        <TabsTrigger value='files'>
                            <Files className='mr-2 h-4 w-4' />
                            Subir Archivos
                        </TabsTrigger>
                        <TabsTrigger value='base64'>
                            <FileText className='mr-2 h-4 w-4' />
                            Ingresar Base64
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value='files' className='space-y-4'>
                        {/* Mode selector for files */}
                        <div className='flex gap-2'>
                            <Button
                                variant={!isDirectoryMode ? 'default' : 'outline'}
                                size='sm'
                                onClick={() => !isDirectoryMode || toggleMode()}
                                disabled={isLoading}
                                className='flex items-center gap-2'
                            >
                                <Files className='h-4 w-4' />
                                Archivos individuales
                            </Button>
                            <Button
                                variant={isDirectoryMode ? 'default' : 'outline'}
                                size='sm'
                                onClick={() => isDirectoryMode || toggleMode()}
                                disabled={isLoading}
                                className='flex items-center gap-2'
                            >
                                <Folder className='h-4 w-4' />
                                Carpeta completa
                            </Button>
                        </div>

                        {/* Drop zone for files */}
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
                                id='file-input'
                                type='file'
                                multiple={!isDirectoryMode}
                                accept={supportedExtensions.map((ext) => `image/*${ext}`).join(',')}
                                onChange={handleFileInput}
                                className={`absolute inset-0 cursor-pointer opacity-0 ${isDirectoryMode ? 'hidden' : ''}`}
                                disabled={isLoading || isDirectoryMode}
                            />

                            {/* Input for directory */}
                            <input
                                id='directory-input'
                                type='file'
                                // @ts-ignore - webkitdirectory is not in TypeScript definitions but is supported
                                webkitdirectory='true'
                                multiple
                                onChange={handleFileInput}
                                className={`absolute inset-0 cursor-pointer opacity-0 ${!isDirectoryMode ? 'hidden' : ''}`}
                                disabled={isLoading || !isDirectoryMode}
                            />

                            <div className='flex flex-col items-center justify-center space-y-2'>
                                {isDirectoryMode ? (
                                    <Folder className='text-muted-foreground mb-2 h-12 w-12' />
                                ) : (
                                    <CloudUpload className='text-muted-foreground mb-2 h-12 w-12' />
                                )}
                                <div>
                                    <p className='text-sm font-medium'>
                                        {isDirectoryMode
                                            ? 'Haga clic para seleccionar una carpeta o arrastre una carpeta aquí'
                                            : 'Haga clic para seleccionar archivos o arrastre archivos aquí'}
                                    </p>
                                    <p className='text-muted-foreground text-xs'>
                                        {isDirectoryMode
                                            ? 'Se seleccionarán todas las imágenes de la carpeta (máx. 10MB por archivo)'
                                            : 'Imagen individual o múltiples imágenes (máx. 10MB por archivo)'}
                                    </p>
                                    {selectedFiles.length > 0 && (
                                        <p className='mt-1 text-xs text-emerald-500'>
                                            {selectedFiles.length} archivo
                                            {selectedFiles.length > 1 ? 's' : ''} seleccionado
                                            {selectedFiles.length > 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value='base64' className='space-y-4'>
                        {/* Base64 manual input */}
                        <div className='space-y-4'>
                            <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <Label>Base64 de Imágenes</Label>
                                    <Badge
                                        variant={
                                            base64Inputs.length >= MAX_BASE64_INPUTS
                                                ? 'destructive'
                                                : 'outline'
                                        }
                                        className='ml-2'
                                    >
                                        {base64Inputs.filter((b) => b.trim() !== '').length}/
                                        {MAX_BASE64_INPUTS} base64(s)
                                    </Badge>
                                </div>

                                {base64Inputs.map((base64, index) => (
                                    <div key={index} className='flex space-x-2'>
                                        <Textarea
                                            placeholder={`Base64 de imagen ${index + 1}`}
                                            value={base64}
                                            onChange={(e) =>
                                                updateBase64Input(e.target.value, index)
                                            }
                                            className='h-[100px] flex-grow resize-none overflow-auto font-mono text-xs'
                                        />
                                        <div className='flex flex-col space-y-2'>
                                            {base64 && (
                                                <Button
                                                    variant='outline'
                                                    size='icon'
                                                    onClick={() => copyToClipboard(base64)}
                                                    title='Copiar base64'
                                                >
                                                    <Copy className='h-4 w-4' />
                                                </Button>
                                            )}
                                            <Button
                                                variant='outline'
                                                size='icon'
                                                onClick={() => removeBase64Field(index)}
                                                title='Eliminar campo'
                                            >
                                                <X className='h-4 w-4' />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    variant='outline'
                                    className='w-full'
                                    onClick={addBase64Field}
                                    disabled={base64Inputs.length >= MAX_BASE64_INPUTS}
                                >
                                    <Plus className='mr-2 h-4 w-4' />
                                    {base64Inputs.length >= MAX_BASE64_INPUTS
                                        ? `Máximo ${MAX_BASE64_INPUTS} base64s`
                                        : 'Agregar otro base64'}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>

            <CardFooter className='flex gap-2'>
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !canSubmit()}
                    className='flex-1'
                    variant='default'
                >
                    {isLoading ? (
                        <>
                            <Loader className='mr-2 h-4 w-4 animate-spin' />
                            Evaluando...
                        </>
                    ) : (
                        <>
                            <Play className='mr-2 h-4 w-4' />
                            {getSubmitText()}
                        </>
                    )}
                </Button>

                <Button
                    variant='outline'
                    onClick={handleClear}
                    disabled={isLoading || !canSubmit()}
                >
                    <RefreshCw className='mr-2 h-4 w-4' />
                    Limpiar
                </Button>
            </CardFooter>
        </Card>
    );
}
