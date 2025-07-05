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
                                toast.warning('Límite de códigos excedido', {
                                    description: `Solo se procesarán los primeros ${MAX_CODES} códigos. Se ignorarán los demás.`
                                });
                            } else {
                                toast.success('Códigos cargados', {
                                    description: `Se cargaron ${validCodes.length} códigos del archivo ${file.name}`
                                });
                            }
                            return;
                        }
                    } catch (e) {
                        // No es JSON, continuar con el procesamiento normal
                    }

                    setCodes([base64Content]);
                    toast.success('Archivo cargado', {
                        description: `Código base64 extraído del archivo ${file.name}`
                    });
                } catch (error) {
                    toast.error('Error al procesar el archivo', {
                        description: 'El archivo no contiene códigos base64 válidos.'
                    });
                }
            };
            reader.readAsText(file);
        };

        const copyToClipboard = (code: string) => {
            if (!code) return;
            navigator.clipboard.writeText(code);

            toast.success('Copiado al portapapeles', {
                description: 'El código ha sido copiado al portapapeles.'
            });
        };

        const handleSubmit = () => {
            const validCodes = codes.filter((code) => code.trim() !== '');

            if (validCodes.length === 0) {
                toast.error('Código base64 requerido', {
                    description: 'Por favor ingrese al menos un código base64 válido.'
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
                toast.warning('Límite alcanzado', {
                    description: `No se pueden agregar más de ${MAX_CODES} códigos.`
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
                toast.error('Código vacío', {
                    description: 'No hay código base64 para reparar.'
                });
                return;
            }

            setRepairing(true);
            try {
                const result = await base64ImageService.repairBase64(codeToRepair);

                if (result.success && result.data?.repaired) {
                    updateCode(result.data.repaired, index);

                    toast.success('Código reparado', {
                        description: 'El código base64 ha sido reparado y actualizado.'
                    });

                    if (result.warnings && result.warnings.length > 0) {
                        toast.warning('Advertencias', {
                            description: result.warnings.join('. ')
                        });
                    }
                } else {
                    toast.error('No se pudo reparar', {
                        description:
                            result.message || 'El código base64 no pudo ser reparado completamente.'
                    });
                }
            } catch (error) {
                toast.error('Error al reparar', {
                    description: 'Ocurrió un error al intentar reparar el código base64.'
                });
            } finally {
                setRepairing(false);
            }
        };

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Códigos Base64</CardTitle>
                    <CardDescription>
                        Ingrese hasta {MAX_CODES} códigos para generar imágenes
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
                                Ingresar Códigos
                            </TabsTrigger>
                            <TabsTrigger value='upload'>
                                <CloudUpload className='mr-2 h-4 w-4' />
                                Subir Archivo
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value='paste' className='space-y-4'>
                            <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <Label>Códigos Base64</Label>
                                    <Badge
                                        variant={
                                            codes.length >= MAX_CODES ? 'destructive' : 'secondary'
                                        }
                                        className='ml-2'
                                    >
                                        {codes.filter((c) => c.trim() !== '').length}/{MAX_CODES}{' '}
                                        código(s)
                                    </Badge>
                                </div>

                                {codes.map((code, index) => (
                                    <div key={index} className='flex space-x-2'>
                                        <Textarea
                                            placeholder={`Código ${index + 1}`}
                                            value={code}
                                            onChange={(e) => updateCode(e.target.value, index)}
                                            className='max-h-[200px] min-h-[80px] flex-grow resize-none overflow-y-auto'
                                        />
                                        <div className='flex flex-col space-y-2'>
                                            {code && (
                                                <>
                                                    <Button
                                                        variant='outline'
                                                        size='icon'
                                                        onClick={() => copyToClipboard(code)}
                                                        title='Copiar código'
                                                    >
                                                        <Copy className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='outline'
                                                        size='icon'
                                                        onClick={() => handleRepairBase64(index)}
                                                        disabled={repairing}
                                                        title='Reparar código base64'
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
                                    onClick={addCodeField}
                                    disabled={codes.length >= MAX_CODES}
                                >
                                    <Plus className='mr-2 h-4 w-4' />
                                    {codes.length >= MAX_CODES
                                        ? `Máximo ${MAX_CODES} códigos`
                                        : 'Agregar otro código'}
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value='upload' className='space-y-4'>
                            <div className='space-y-2'>
                                <Label htmlFor='file-upload'>
                                    Subir archivo de código(s) base64
                                </Label>

                                <label
                                    htmlFor='file-upload'
                                    className='border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors'
                                >
                                    <div className='flex flex-col items-center justify-center p-4'>
                                        <FileText className='text-muted-foreground mb-2 h-12 w-12' />
                                        <p className='text-muted-foreground mb-2 text-sm'>
                                            <span className='font-semibold'>
                                                Haga clic para subir
                                            </span>{' '}
                                            o arrastre y suelte
                                        </p>
                                        <p className='text-muted-foreground text-xs'>
                                            Archivo de texto (.txt) o JSON (máx. {MAX_CODES}{' '}
                                            códigos)
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
                                                : `${codes.length} códigos cargados`
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
                        disabled={isLoading || codes.every((code) => !code)}
                        className='flex-1'
                    >
                        {isLoading ? (
                            <>
                                <Loader className='mr-2 h-4 w-4 animate-spin' />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <Play className='mr-2 h-4 w-4' />
                                Decodificar
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={handleResetClick}
                        variant='secondary'
                        type='button'
                        disabled={isLoading}
                    >
                        <RefreshCw className='mr-2 h-4 w-4' />
                        Limpiar
                    </Button>
                </CardFooter>
            </Card>
        );
    }
);

Base64Input.displayName = 'Base64Input';
