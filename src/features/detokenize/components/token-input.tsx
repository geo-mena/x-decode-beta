'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import {
    Brackets,
    CloudUpload,
    Copy,
    FileText,
    Loader,
    Play,
    Plus,
    RefreshCw,
    X
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';

const MAX_TOKENS = 2;

interface TokenInputProps {
    onSubmit: (tokens: string[], transactionId: string) => void;
    onReset: () => void;
    isLoading: boolean;
}

export const TokenInput = forwardRef<any, TokenInputProps>(
    ({ onSubmit, onReset, isLoading }, ref) => {
        const [tokens, setTokens] = useState<string[]>(['']);
        const [transactionId, setTransactionId] = useState('');
        const [inputMethod, setInputMethod] = useState<'paste' | 'upload'>('paste');

        useImperativeHandle(ref, () => ({
            reset: () => {
                setTokens(['']);
                setTransactionId('');
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
                    const tokenContent = content.trim();

                    // Verificar si el contenido parece contener múltiples tokens (JSON array)
                    try {
                        const jsonContent = JSON.parse(content);
                        if (Array.isArray(jsonContent)) {
                            const validTokens = jsonContent
                                .filter((token) => typeof token === 'string')
                                .slice(0, MAX_TOKENS);

                            setTokens(validTokens);

                            if (jsonContent.length > MAX_TOKENS) {
                                toast.warning('Límite de tokens excedido', {
                                    description: `Solo se procesarán los primeros ${MAX_TOKENS} tokens. Se ignorarán los demás.`
                                });
                            } else {
                                toast.success('Tokens cargados', {
                                    description: `Se cargaron ${validTokens.length} tokens del archivo ${file.name}`
                                });
                            }
                            return;
                        }
                    } catch (e) {
                        // No es JSON, continuar con el procesamiento normal
                    }

                    setTokens([tokenContent]);
                    toast.success('Archivo cargado', {
                        description: `Token extraído del archivo ${file.name}`
                    });
                } catch (error) {
                    toast.error('Error al procesar el archivo', {
                        description: 'El archivo no contiene tokens válidos.'
                    });
                }
            };
            reader.readAsText(file);
        };

        const copyToClipboard = (token: string) => {
            if (!token) return;
            navigator.clipboard.writeText(token);

            toast.success('Copiado al portapapeles', {
                description: 'El token ha sido copiado al portapapeles.'
            });
        };

        const handleSubmit = () => {
            const validTokens = tokens.filter((token) => token.trim() !== '');

            if (validTokens.length === 0) {
                toast.error('Token requerido', {
                    description: 'Por favor ingrese al menos un token de imagen válido.'
                });
                return;
            }

            const limitedTokens = validTokens.slice(0, MAX_TOKENS);
            onSubmit(limitedTokens, transactionId);
        };

        const handleResetClick = () => {
            onReset();
        };

        const addTokenField = () => {
            if (tokens.length >= MAX_TOKENS) {
                toast.warning('Límite alcanzado', {
                    description: `No se pueden agregar más de ${MAX_TOKENS} tokens.`
                });
                return;
            }

            setTokens([...tokens, '']);
        };

        const removeTokenField = (index: number) => {
            if (tokens.length <= 1) {
                setTokens(['']);
            } else {
                const newTokens = [...tokens];
                newTokens.splice(index, 1);
                setTokens(newTokens);
            }
        };

        const updateToken = (value: string, index: number) => {
            const newTokens = [...tokens];
            newTokens[index] = value;
            setTokens(newTokens);
        };

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Tokens de Imagen</CardTitle>
                    <CardDescription>
                        Ingrese hasta {MAX_TOKENS} tokens para recuperar la imagen
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <Tabs
                        value={inputMethod}
                        onValueChange={(v) => setInputMethod(v as 'paste' | 'upload')}
                    >
                        <TabsList className='grid w-full grid-cols-2'>
                            <TabsTrigger value='paste'>
                                <Brackets className='mr-2 h-4 w-4' />
                                Ingresar Tokens
                            </TabsTrigger>
                            <TabsTrigger value='upload'>
                                <CloudUpload className='mr-2 h-4 w-4' />
                                Subir Archivo
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value='paste' className='space-y-4'>
                            <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <Label>Tokens de Imagen</Label>
                                    <Badge
                                        variant={
                                            tokens.length >= MAX_TOKENS ? 'destructive' : 'outline'
                                        }
                                        className='ml-2'
                                    >
                                        {tokens.filter((t) => t.trim() !== '').length}/{MAX_TOKENS}{' '}
                                        token(s)
                                    </Badge>
                                </div>

                                {tokens.map((token, index) => (
                                    <div key={index} className='flex space-x-2'>
                                        <Textarea
                                            placeholder={`Token de imagen ${index + 1}`}
                                            value={token}
                                            onChange={(e) => updateToken(e.target.value, index)}
                                            className='min-h-[80px] flex-grow'
                                        />
                                        <div className='flex flex-col space-y-2'>
                                            {token && (
                                                <Button
                                                    variant='outline'
                                                    size='icon'
                                                    onClick={() => copyToClipboard(token)}
                                                    title='Copiar token'
                                                >
                                                    <Copy className='h-4 w-4' />
                                                </Button>
                                            )}
                                            <Button
                                                variant='outline'
                                                size='icon'
                                                onClick={() => removeTokenField(index)}
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
                                    onClick={addTokenField}
                                    disabled={tokens.length >= MAX_TOKENS}
                                >
                                    <Plus className='mr-2 h-4 w-4' />
                                    {tokens.length >= MAX_TOKENS
                                        ? `Máximo ${MAX_TOKENS} tokens`
                                        : 'Agregar otro token'}
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value='upload' className='space-y-4'>
                            <div className='space-y-2'>
                                <Label htmlFor='file-upload'>Subir archivo de token(s)</Label>
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
                                            Archivo de texto (.txt) o JSON (máx. {MAX_TOKENS}{' '}
                                            tokens)
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
                                {tokens.length > 0 && tokens[0] && (
                                    <Textarea
                                        readOnly
                                        value={
                                            tokens.length === 1
                                                ? tokens[0]
                                                : `${tokens.length} tokens cargados`
                                        }
                                        className='bg-muted w-full resize-none text-sm'
                                    />
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className='space-y-2'>
                        <Label htmlFor='transactionId'>ID de Transacción (opcional)</Label>
                        <Input
                            id='transactionId'
                            placeholder='Ingrese el ID de transacción si está disponible'
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter className='flex gap-2'>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || tokens.every((token) => !token)}
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
                                Detokenizar
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

TokenInput.displayName = 'TokenInput';
