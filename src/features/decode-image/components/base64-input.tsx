'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import {
    Braces,
    CloudUpload,
    Cog,
    Copy,
    FileText,
    Loader,
    Play,
    Plus,
    RefreshCw,
    X
} from 'lucide-react';
import { toast } from 'sonner';
import base64ImageService from '@/lib/tools/base64-image.service';
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
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const MAX_CODES = 2;

interface Base64InputProps {
    onSubmit: (codes: string[]) => void;
    onReset: () => void;
    isLoading: boolean;
}

export const Base64Input = forwardRef<any, Base64InputProps>(
    ({ onSubmit, onReset, isLoading }, ref) => {
        const [codes, setCodes] = useState<string[]>(['']);
        const [inputMethod, setInputMethod] = useState<'paste' | 'upload'>('paste');
        const [repairing, setRepairing] = useState(false);

        useImperativeHandle(ref, () => ({
            reset: () => {
                setCodes(['']);
                setInputMethod('paste');
            }
        }));

        /* 🌱 Función para manejar la carga de archivos */
        const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const content = event.target?.result as string;
                    const base64Content = content.trim();

                    // Verificar si el contenido parece contener múltiples códigos (JSON array)
                    try {
                        const jsonContent = JSON.parse(content);
                        if (Array.isArray(jsonContent)) {
                            const validCodes = jsonContent
                                .filter((code) => typeof code === 'string')
                                .slice(0, MAX_CODES);

                            setCodes(validCodes);

                            if (jsonContent.length > MAX_CODES) {
                                toast.warning('Code limit exceeded', {
                                    description: `Only the first ${MAX_CODES} codes will be processed. The rest will be ignored.`
                                });
                            } else {
                                toast.success('Codes loaded', {
                                    description: `${validCodes.length} codes loaded from file ${file.name}`
                                });
                            }
                            return;
                        }
                    } catch (e) {
                        // No es JSON, continuar con el procesamiento normal
                    }

                    setCodes([base64Content]);
                    toast.success('File loaded', {
                        description: `Base64 code extracted from file ${file.name}`
                    });
                } catch (error) {
                    toast.error('Error processing file', {
                        description: 'The file does not contain valid base64 codes.'
                    });
                }
            };
            reader.readAsText(file);
        };

        const copyToClipboard = (code: string) => {
            if (!code) return;
            navigator.clipboard.writeText(code);

            toast.success('Copied to clipboard', {
                description: 'The code has been copied to the clipboard.'
            });
        };

        const handleSubmit = () => {
            const validCodes = codes.filter((code) => code.trim() !== '');

            if (validCodes.length === 0) {
                toast.error('Base64 code required', {
                    description: 'Please enter at least one valid base64 code.'
                });
                return;
            }

            const limitedCodes = validCodes.slice(0, MAX_CODES);
            onSubmit(limitedCodes);
        };

        const handleResetClick = () => {
            onReset();
        };

        const addCodeField = () => {
            if (codes.length >= MAX_CODES) {
                toast.warning('Limit reached', {
                    description: `Cannot add more than ${MAX_CODES} codes.`
                });
                return;
            }

            setCodes([...codes, '']);
        };

        const removeCodeField = (index: number) => {
            if (codes.length <= 1) {
                setCodes(['']);
            } else {
                const newCodes = [...codes];
                newCodes.splice(index, 1);
                setCodes(newCodes);
            }
        };

        const updateCode = (value: string, index: number) => {
            const newCodes = [...codes];
            newCodes[index] = value;
            setCodes(newCodes);
        };

        const handleRepairBase64 = async (index: number) => {
            const codeToRepair = codes[index];
            if (!codeToRepair.trim()) {
                toast.error('Empty code', {
                    description: 'No base64 code to repair.'
                });
                return;
            }

            setRepairing(true);
            try {
                const result = await base64ImageService.repairBase64(codeToRepair);

                if (result.success && result.data?.repaired) {
                    updateCode(result.data.repaired, index);

                    toast.success('Code repaired', {
                        description: 'The base64 code has been repaired and updated.'
                    });

                    if (result.warnings && result.warnings.length > 0) {
                        toast.warning('Warnings', {
                            description: result.warnings.join('. ')
                        });
                    }
                } else {
                    toast.error('Could not repair', {
                        description:
                            result.message || 'The base64 code could not be completely repaired.'
                    });
                }
            } catch (error) {
                toast.error('Repair error', {
                    description: 'An error occurred while trying to repair the base64 code.'
                });
            } finally {
                setRepairing(false);
            }
        };

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Input Parameters</CardTitle>
                    <CardDescription>
                        Enter up to {MAX_CODES} codes to generate images
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <Tabs
                        value={inputMethod}
                        onValueChange={(v) => setInputMethod(v as 'paste' | 'upload')}
                    >
                        <TabsList className='grid w-full grid-cols-2'>
                            <TabsTrigger value='paste'>
                                <Braces className='mr-2 h-4 w-4' />
                                Enter Codes
                            </TabsTrigger>
                            <TabsTrigger value='upload'>
                                <CloudUpload className='mr-2 h-4 w-4' />
                                Upload File
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value='paste' className='space-y-4'>
                            <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <Label>Base64 Codes</Label>
                                    <Badge
                                        variant={
                                            codes.length >= MAX_CODES ? 'destructive' : 'secondary'
                                        }
                                        className='ml-2'
                                    >
                                        {codes.filter((c) => c.trim() !== '').length}/{MAX_CODES}{' '}
                                        code(s)
                                    </Badge>
                                </div>

                                {codes.map((code, index) => (
                                    <div key={index} className='flex space-x-2'>
                                        <Textarea
                                            placeholder={`Code ${index + 1}`}
                                            value={code}
                                            onChange={(e) => updateCode(e.target.value, index)}
                                            className='max-h-[125px] min-h-[100px] flex-grow resize-none overflow-y-auto font-mono text-xs'
                                        />
                                        <div className='flex flex-col space-y-2'>
                                            {code && (
                                                <>
                                                    <Button
                                                        variant='outline'
                                                        size='icon'
                                                        onClick={() => copyToClipboard(code)}
                                                        title='Copy code'
                                                    >
                                                        <Copy className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='outline'
                                                        size='icon'
                                                        onClick={() => handleRepairBase64(index)}
                                                        disabled={repairing}
                                                        title='Repair base64 code'
                                                    >
                                                        {repairing ? (
                                                            <Loader className='h-4 w-4 animate-spin' />
                                                        ) : (
                                                            <Cog className='h-4 w-4' />
                                                        )}
                                                    </Button>
                                                </>
                                            )}
                                            <Button
                                                variant='outline'
                                                size='icon'
                                                onClick={() => removeCodeField(index)}
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
                                    onClick={addCodeField}
                                    disabled={codes.length >= MAX_CODES}
                                >
                                    <Plus className='mr-2 h-4 w-4' />
                                    {codes.length >= MAX_CODES
                                        ? `Maximum ${MAX_CODES} codes`
                                        : 'Add another code'}
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value='upload' className='space-y-4'>
                            <div className='space-y-2'>
                                <Label htmlFor='file-upload'>
                                    Upload base64 code(s) file
                                </Label>

                                <label
                                    htmlFor='file-upload'
                                    className='border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors'
                                >
                                    <div className='flex flex-col items-center justify-center p-4'>
                                        <FileText className='text-muted-foreground mb-2 h-12 w-12' />
                                        <p className='text-muted-foreground mb-2 text-sm'>
                                            <span className='font-semibold'>
                                                Click to upload
                                            </span>{' '}
                                            or drag and drop
                                        </p>
                                        <p className='text-muted-foreground text-xs'>
                                            Text file (.txt) or JSON (max. {MAX_CODES}{' '}
                                            codes)
                                        </p>
                                    </div>
                                    <input
                                        id='file-upload'
                                        type='file'
                                        accept='.txt,.json'
                                        className='hidden'
                                        onChange={handleFileUpload}
                                    />
                                </label>

                                {codes.length > 0 && codes[0] && (
                                    <Textarea
                                        readOnly
                                        value={
                                            codes.length === 1
                                                ? codes[0].length > 100
                                                    ? codes[0].substring(0, 100) + '...'
                                                    : codes[0]
                                                : `${codes.length} codes loaded`
                                        }
                                        className='bg-muted w-full resize-none text-sm'
                                    />
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className='flex gap-2'>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || codes.every((code) => !code.trim())}
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
                                Decode
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={handleResetClick}
                        variant='secondary'
                        type='button'
                        disabled={isLoading || codes.every((code) => !code.trim())}
                    >
                        <RefreshCw className='mr-2 h-4 w-4' />
                        Clear
                    </Button>
                </CardFooter>
            </Card>
        );
    }
);

Base64Input.displayName = 'Base64Input';
