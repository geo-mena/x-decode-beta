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
import base64PdfService from '@/lib/tools/base64-pdf.service';
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
        const [repairingIndex, setRepairingIndex] = useState<number | null>(null);

        useImperativeHandle(ref, () => ({
            reset: () => {
                setCodes(['']);
                setInputMethod('paste');
                setRepairingIndex(null);
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
                    if (!content) {
                        toast.error('Empty file', {
                            description: 'The selected file is empty.'
                        });
                        return;
                    }

                    const base64Content = content.trim();

                    // Verificar si el contenido parece contener múltiples códigos (JSON array)
                    try {
                        const jsonContent = JSON.parse(content);
                        if (Array.isArray(jsonContent)) {
                            const validCodes = jsonContent
                                .filter((code) => typeof code === 'string' && code.trim() !== '')
                                .slice(0, MAX_CODES);

                            if (validCodes.length === 0) {
                                toast.error('No valid codes', {
                                    description: 'The file does not contain valid Base64 codes.'
                                });
                                return;
                            }

                            setCodes(validCodes);

                            if (jsonContent.length > MAX_CODES) {
                                toast.warning('Code limit exceeded', {
                                    description: `Only the first ${MAX_CODES} codes will be processed. ${jsonContent.length - MAX_CODES} additional codes will be ignored.`
                                });
                            } else {
                                toast.success('Codes loaded', {
                                    description: `${validCodes.length} codes loaded from file ${file.name}`
                                });
                            }
                            return;
                        }
                    } catch (e) {
                        // No es JSON, continuar con el procesamiento normal de texto plano
                    }

                    // Procesamiento de archivo de texto plano
                    if (!base64Content) {
                        toast.error('Empty file', {
                            description: 'The file does not contain valid content.'
                        });
                        return;
                    }

                    setCodes([base64Content]);
                    toast.success('File loaded', {
                        description: `Base64 code extracted from file ${file.name}`
                    });
                } catch (error) {
                    console.error('File processing error:', error);
                    toast.error('Error processing file', {
                        description: 'The file does not contain valid base64 codes or is corrupted.'
                    });
                }
            };

            reader.onerror = () => {
                toast.error('Reading error', {
                    description: 'Could not read the selected file.'
                });
            };

            reader.readAsText(file);
        };

        const copyToClipboard = async (code: string) => {
            if (!code) return;

            try {
                await navigator.clipboard.writeText(code);
                toast.success('Copied to clipboard', {
                    description: 'The code has been copied to the clipboard.'
                });
            } catch (error) {
                console.error('Copy error:', error);
                toast.error('Copy error', {
                    description: 'Could not copy the code to the clipboard.'
                });
            }
        };

        const handleSubmit = () => {
            const validCodes = codes.filter((code) => code.trim() !== '');

            if (validCodes.length === 0) {
                toast.error('Base64 code required', {
                    description: 'Please enter at least one valid base64 code.'
                });
                return;
            }

            // El backend maneja hasta 10 códigos
            const limitedCodes = validCodes.slice(0, MAX_CODES);

            if (validCodes.length > MAX_CODES) {
                toast.warning('Limited codes', {
                    description: `Only the first ${MAX_CODES} codes will be processed.`
                });
            }

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

            setRepairingIndex(index);
            try {
                // Usar el método corregido con opciones por defecto
                const result = await base64PdfService.repairBase64(codeToRepair, {
                    fixHeaders: true,
                    fixPadding: true,
                    validatePdf: true
                });

                if (result.success && result.data?.repaired) {
                    updateCode(result.data.repaired, index);

                    toast.success('Code repaired', {
                        description: 'The base64 code has been repaired and updated.'
                    });

                    if (result.warnings && result.warnings.length > 0) {
                        toast.warning('Repair warnings', {
                            description:
                                result.warnings.slice(0, 2).join('. ') +
                                (result.warnings.length > 2 ? '...' : '')
                        });
                    }

                    // Mostrar información de validación PDF si está disponible
                    if (result.pdf_validation && result.pdf_validation.is_valid_pdf) {
                        toast.info('PDF validated', {
                            description: `Valid PDF detected (${result.pdf_validation.estimated_pages} pages, ${result.pdf_validation.pdf_version})`
                        });
                    }
                } else {
                    toast.error('Could not repair', {
                        description:
                            result.message || 'The base64 code could not be completely repaired.'
                    });

                    // Mostrar errores específicos si están disponibles
                    if (
                        'errors' in result &&
                        Array.isArray(result.errors) &&
                        result.errors.length > 0
                    ) {
                        console.error('Repair errors:', result.errors);
                    }
                }
            } catch (error) {
                console.error('Repair error:', error);
                toast.error('Repair error', {
                    description: 'An error occurred while trying to repair the base64 code.'
                });
            } finally {
                setRepairingIndex(null);
            }
        };

        const validCodesCount = codes.filter((c) => c.trim() !== '').length;
        const isRepairingCode = (index: number) => repairingIndex === index;

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Input Parameters</CardTitle>
                    <CardDescription>
                        Enter up to {MAX_CODES} codes to generate PDFs. The system automatically
                        optimizes processing.
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
                                            validCodesCount >= MAX_CODES
                                                ? 'destructive'
                                                : validCodesCount > 0
                                                  ? 'default'
                                                  : 'secondary'
                                        }
                                        className='ml-2'
                                    >
                                        {validCodesCount}/{MAX_CODES} code(s)
                                    </Badge>
                                </div>

                                {codes.map((code, index) => (
                                    <div key={index} className='flex space-x-2'>
                                        <Textarea
                                            placeholder={`Code ${index + 1} (PDF Base64)`}
                                            value={code}
                                            onChange={(e) => updateCode(e.target.value, index)}
                                            className='max-h-[125px] min-h-[100px] flex-grow resize-none overflow-y-auto font-mono text-xs'
                                            disabled={isLoading}
                                        />
                                        <div className='flex flex-col space-y-2'>
                                            {code && (
                                                <>
                                                    <Button
                                                        variant='outline'
                                                        size='icon'
                                                        onClick={() => copyToClipboard(code)}
                                                        title='Copy code'
                                                        disabled={isLoading}
                                                    >
                                                        <Copy className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='outline'
                                                        size='icon'
                                                        onClick={() => handleRepairBase64(index)}
                                                        disabled={
                                                            isLoading || isRepairingCode(index)
                                                        }
                                                        title='Repair base64 code'
                                                    >
                                                        {isRepairingCode(index) ? (
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
                                                disabled={isLoading}
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
                                    disabled={codes.length >= MAX_CODES || isLoading}
                                >
                                    <Plus className='mr-2 h-4 w-4' />
                                    {codes.length >= MAX_CODES
                                        ? `Maximum ${MAX_CODES} codes reached`
                                        : 'Add another code'}
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value='upload' className='space-y-4'>
                            <div className='space-y-2'>
                                <Label htmlFor='file-upload'>Upload file with base64 code(s)</Label>

                                <label
                                    htmlFor='file-upload'
                                    className='border-muted-foreground/25 hover:border-muted-foreground/50 flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors'
                                >
                                    <div className='flex flex-col items-center justify-center p-4'>
                                        <FileText className='text-muted-foreground mb-2 h-12 w-12' />
                                        <p className='text-muted-foreground mb-2 text-sm'>
                                            <span className='font-semibold'>Click to upload</span>{' '}
                                            or drag and drop
                                        </p>
                                        <p className='text-muted-foreground text-xs'>
                                            Text file (.txt) or JSON (max. {MAX_CODES} codes)
                                        </p>
                                    </div>
                                    <input
                                        id='file-upload'
                                        type='file'
                                        accept='.txt,.json'
                                        className='hidden'
                                        onChange={handleFileUpload}
                                        disabled={isLoading}
                                    />
                                </label>

                                {codes.length > 0 && codes[0] && (
                                    <div className='space-y-2'>
                                        <Label>Preview of loaded codes:</Label>
                                        <Textarea
                                            readOnly
                                            value={
                                                codes.length === 1
                                                    ? codes[0].length > 100
                                                        ? codes[0].substring(0, 100) +
                                                          '... (truncado)'
                                                        : codes[0]
                                                    : `${codes.filter((c) => c.trim()).length} codes loaded:\n${codes
                                                          .filter((c) => c.trim())
                                                          .map(
                                                              (c, i) =>
                                                                  `${i + 1}. ${c.substring(0, 50)}...`
                                                          )
                                                          .join('\n')}`
                                            }
                                            className='bg-muted max-h-32 w-full resize-none text-sm'
                                        />
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className='flex gap-2'>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || validCodesCount === 0 || repairingIndex !== null}
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
                                Decode {validCodesCount > 1 ? `${validCodesCount} PDFs` : 'PDF'}
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={handleResetClick}
                        variant='secondary'
                        type='button'
                        disabled={isLoading || repairingIndex !== null || validCodesCount === 0}
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
