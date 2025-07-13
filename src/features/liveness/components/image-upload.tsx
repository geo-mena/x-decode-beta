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
                toast.warning('Invalid files', {
                    description: `${invalidFiles.length} file(s) ignored. Only accepted: ${supportedExtensions.join(', ')}`
                });
            }

            if (validFiles.length === 0) {
                toast.error('Error', {
                    description: 'No valid image files were selected'
                });
                return;
            }

            setSelectedFiles(validFiles);

            toast.success('Files selected', {
                description: `${validFiles.length} image${validFiles.length > 1 ? 's' : ''} selected`
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
            toast.warning('Limit reached', {
                description: `Cannot add more than ${MAX_BASE64_INPUTS} base64 entries.`
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
        toast.success('Copied to clipboard', {
            description: 'Base64 has been copied to clipboard.'
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
                    description: 'Select at least one image to evaluate'
                });
                return;
            }

            // Verify that if SDK is enabled, at least one endpoint is selected and active
            if (useSDK) {
                const activeSelected = getSelectedActiveEndpoints();
                if (activeSelected.length === 0) {
                    toast.error('Error', {
                        description:
                            'Must select at least one active SDK endpoint or disable SDK evaluation'
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
                    description: 'Enter at least one valid base64 to evaluate'
                });
                return;
            }

            // Verify that if SDK is enabled, at least one endpoint is selected and active
            if (useSDK) {
                const activeSelected = getSelectedActiveEndpoints();
                if (activeSelected.length === 0) {
                    toast.error('Error', {
                        description:
                            'Must select at least one active SDK endpoint or disable SDK evaluation'
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
            return selectedFiles.length > 1 ? 'Evaluate Images' : 'Evaluate Image';
        } else {
            const validCount = base64Inputs.filter(
                (b) => b.trim() && validateBase64(b.trim())
            ).length;
            return validCount > 1 ? 'Evaluate Base64s' : 'Evaluate Base64';
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
                <CardTitle className='flex items-center gap-2'>Input Parameters</CardTitle>
                <CardDescription>Upload images from files or enter base64 manually</CardDescription>
            </CardHeader>

            <CardContent className='space-y-6'>
                {/* SDK Configuration Section */}
                <div className='space-y-4 rounded-lg border p-4'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-2'>
                            <Server className='h-4 w-4' />
                            <Label htmlFor='sdk-toggle' className='text-sm font-medium'>
                                Local SDK Evaluation
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
                                    Select SDK endpoints:
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
                                    Check status
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
                                            {endpoint.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>

                            {userEndpoints.length === 0 && (
                                <p className='text-muted-foreground text-sm'>
                                    No endpoints configured. Configure endpoints in settings.
                                </p>
                            )}

                            {selectedSDKEndpoints.length > 0 && (
                                <div className='text-muted-foreground text-sm'>
                                    {selectedSDKEndpoints.length} endpoint
                                    {selectedSDKEndpoints.length > 1 ? 's' : ''} selected
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
                            Upload Files
                        </TabsTrigger>
                        <TabsTrigger value='base64'>
                            <FileText className='mr-2 h-4 w-4' />
                            Enter Base64
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
                                Individual files
                            </Button>
                            <Button
                                variant={isDirectoryMode ? 'default' : 'outline'}
                                size='sm'
                                onClick={() => isDirectoryMode || toggleMode()}
                                disabled={isLoading}
                                className='flex items-center gap-2'
                            >
                                <Folder className='h-4 w-4' />
                                Complete folder
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
                                            ? 'Click to select a folder or drag a folder here'
                                            : 'Click to select files or drag files here'}
                                    </p>
                                    <p className='text-muted-foreground text-xs'>
                                        {isDirectoryMode
                                            ? 'All images in the folder will be selected (max. 10MB per file)'
                                            : 'Individual image or multiple images (max. 10MB per file)'}
                                    </p>
                                    {selectedFiles.length > 0 && (
                                        <p className='mt-1 text-xs text-emerald-500'>
                                            {selectedFiles.length} file
                                            {selectedFiles.length > 1 ? 's' : ''} selected
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
                                    <Label>Image Base64</Label>
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
                                            placeholder={`Image base64 ${index + 1}`}
                                            value={base64}
                                            onChange={(e) =>
                                                updateBase64Input(e.target.value, index)
                                            }
                                            className='max-h-[100px] min-h-[100px] flex-grow resize-none overflow-y-auto font-mono text-xs'
                                        />
                                        <div className='flex flex-col space-y-2'>
                                            {base64 && (
                                                <Button
                                                    variant='outline'
                                                    size='icon'
                                                    onClick={() => copyToClipboard(base64)}
                                                    title='Copy base64'
                                                >
                                                    <Copy className='h-4 w-4' />
                                                </Button>
                                            )}
                                            <Button
                                                variant='outline'
                                                size='icon'
                                                onClick={() => removeBase64Field(index)}
                                                title='Remove field'
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
                                        ? `Maximum ${MAX_BASE64_INPUTS} base64s`
                                        : 'Add another base64'}
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
                            Evaluating...
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
                    Clear
                </Button>
            </CardFooter>
        </Card>
    );
}
