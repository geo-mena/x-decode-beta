'use client';

import { ChangeEvent, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as countries from 'i18n-iso-countries';
import spanish from 'i18n-iso-countries/langs/es.json';
import { Braces, CloudUpload, Eye, ImageUp, Loader, Play, RefreshCw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { base64EncodeService } from '@/lib/tools/image-base64.service';
import { isValidCountryCode } from '@/utils/country';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

countries.registerLocale(spanish);

const MAX_SIZE_MB = 50;
const ID_TYPES = [
    { value: 'PASSPORT', label: 'Pasaporte' },
    { value: 'DRIVING_LICENSE', label: 'Licencia de conducir' },
    { value: 'ID_CARD', label: 'Tarjeta de identificación' },
    { value: 'VISA', label: 'Visa' }
];

interface DocumentValidationInputProps {
    onStartValidation: (
        country: string,
        idType: string,
        frontsideImage: string,
        backsideImage: string,
        storeResponses: boolean,
        merchantIdScanReference?: string
    ) => void;
    onGetValidationData: (scanReference: string) => void;
    onReset: () => void;
    isLoading: boolean;
    isPolling: boolean;
}

export const DocumentValidationInput = forwardRef<any, DocumentValidationInputProps>(
    ({ onStartValidation, onGetValidationData, onReset, isLoading, isPolling }, ref) => {
        const [inputMethod, setInputMethod] = useState<'start' | 'get'>('start');
        const [country, setCountry] = useState('CHL');
        const [idType, setIdType] = useState('');
        const [frontsideImageBase64, setFrontsideImageBase64] = useState('');
        const [backsideImageBase64, setBacksideImageBase64] = useState('');
        const [scanReference, setScanReference] = useState('');
        const [merchantIdScanReference, setMerchantIdScanReference] = useState('');
        const [storeResponses, setStoreResponses] = useState(false);

        // Estados para la interfaz de carga de archivos
        const [frontsideTab, setFrontsideTab] = useState<'text' | 'file'>('file');
        const [backsideTab, setBacksideTab] = useState<'text' | 'file'>('file');
        const [frontsideFileName, setFrontsideFileName] = useState<string | null>(null);
        const [backsideFileName, setBacksideFileName] = useState<string | null>(null);
        const [frontsidePreviewUrl, setFrontsidePreviewUrl] = useState('');
        const [backsidePreviewUrl, setBacksidePreviewUrl] = useState('');
        
        const [frontsideLoading, setFrontsideLoading] = useState(false);
        const [backsideLoading, setBacksideLoading] = useState(false);
        const [formError, setFormError] = useState<string | null>(null);
        const [imageModalOpen, setImageModalOpen] = useState(false);
        const [modalImageData, setModalImageData] = useState<{
            url: string;
            title: string;
            fileName: string;
        } | null>(null);

        // Referencias a los elementos de formulario
        const frontInputRef = useRef<HTMLTextAreaElement>(null);
        const backInputRef = useRef<HTMLTextAreaElement>(null);
        const frontFileInputRef = useRef<HTMLInputElement>(null);
        const backFileInputRef = useRef<HTMLInputElement>(null);

        // Implementar la función reset que será expuesta a través de la ref
        useImperativeHandle(ref, () => ({
            reset: () => {
                setCountry('CHL');
                setIdType('');
                setFrontsideImageBase64('');
                setBacksideImageBase64('');
                setFrontsidePreviewUrl('');
                setBacksidePreviewUrl('');
                setScanReference('');
                setMerchantIdScanReference('');
                setStoreResponses(false);
                setInputMethod('start');
                setFrontsideTab('file');
                setBacksideTab('file');
                setFrontsideFileName(null);
                setBacksideFileName(null);
                setFormError(null);

                // Limpiar referencias
                if (frontInputRef.current) frontInputRef.current.value = '';
                if (backInputRef.current) backInputRef.current.value = '';
                if (frontFileInputRef.current) frontFileInputRef.current.value = '';
                if (backFileInputRef.current) backFileInputRef.current.value = '';
            }
        }));

        // Validar el código de país
        const validateCountryCode = (code: string): boolean => {
            if (!code.trim()) return false;

            const iso3166Alpha3Regex = /^[A-Z]{3}$/;
            if (!iso3166Alpha3Regex.test(code)) return false;

            return isValidCountryCode(code);
        };

        // Manejar cambio del código de país
        const handleCountryCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value.toUpperCase();
            setCountry(value);
        };

        // Manejar carga de archivo frontal
        const handleFrontsideFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            const file = files[0];

            // Validar tamaño máximo
            if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                toast.error('Archivo demasiado grande', {
                    description: `El archivo excede el límite de ${MAX_SIZE_MB} MB.`
                });
                return;
            }

            setFrontsideLoading(true);
            setFrontsideFileName(file.name);

            try {
                // Convertir archivo a base64 usando el servicio existente
                const response = await base64EncodeService.encodeImages([file], true);

                if (!response.success || !response.data) {
                    toast.error('Error de conversión', {
                        description: response.message || 'No se pudo convertir la imagen a base64.'
                    });
                    setFrontsideFileName(null);
                    return;
                }

                // Obtener el base64 del resultado
                const data = Array.isArray(response.data) ? response.data[0] : response.data;
                setFrontsideImageBase64(data.base64);

                // Crear URL de vista previa
                setFrontsidePreviewUrl(URL.createObjectURL(file));

                toast.success('Imagen cargada', {
                    description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`
                });
            } catch (error) {
                toast.error('Error', {
                    description: 'Error al procesar la imagen frontal.'
                });
                setFrontsideFileName(null);
            } finally {
                setFrontsideLoading(false);
                e.target.value = '';
            }
        };

        // Manejar carga de archivo trasero
        const handleBacksideFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            const file = files[0];

            // Validar tamaño máximo
            if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                toast.error('Archivo demasiado grande', {
                    description: `El archivo excede el límite de ${MAX_SIZE_MB} MB.`
                });
                return;
            }

            setBacksideLoading(true);
            setBacksideFileName(file.name);

            try {
                // Convertir archivo a base64 usando el servicio existente
                const response = await base64EncodeService.encodeImages([file], true);

                if (!response.success || !response.data) {
                    toast.error('Error de conversión', {
                        description: response.message || 'No se pudo convertir la imagen a base64.'
                    });
                    setBacksideFileName(null);
                    return;
                }

                // Obtener el base64 del resultado
                const data = Array.isArray(response.data) ? response.data[0] : response.data;
                setBacksideImageBase64(data.base64);

                // Crear URL de vista previa
                setBacksidePreviewUrl(URL.createObjectURL(file));

                toast.success('Imagen cargada', {
                    description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`
                });
            } catch (error) {
                toast.error('Error', {
                    description: 'Error al procesar la imagen trasera.'
                });
                setBacksideFileName(null);
            } finally {
                setBacksideLoading(false);
                e.target.value = '';
            }
        };

        // Verificar si un string parece ser base64
        const isBase64Like = (str: string): boolean => {
            const cleanStr = str.includes(';base64,') ? str.split(';base64,')[1] : str;
            const base64Regex = /^[A-Za-z0-9+/=]+$/;
            return base64Regex.test(cleanStr.trim());
        };

        // Validar formulario para iniciar validación
        const validateStartForm = (): boolean => {
            if (!validateCountryCode(country)) {
                toast.error('País inválido', {
                    description:
                        'Por favor ingrese un código de país válido en formato ISO 3166-1 alpha-3.'
                });
                return false;
            }

            if (!idType) {
                toast.error('Tipo de documento requerido', {
                    description: 'Por favor seleccione el tipo de documento.'
                });
                return false;
            }

            if (!frontsideImageBase64) {
                toast.error('Imagen frontal requerida', {
                    description: 'Por favor proporcione la imagen frontal del documento.'
                });
                return false;
            }

            if (!isBase64Like(frontsideImageBase64)) {
                toast.error('Formato de imagen frontal inválido', {
                    description: 'El formato del documento frontal no parece ser base64 válido.'
                });
                return false;
            }

            // Para pasaportes no es obligatorio el reverso, pero para otros documentos sí
            if (idType !== 'PASSPORT' && !backsideImageBase64) {
                toast.error('Imagen trasera requerida', {
                    description:
                        'Para este tipo de documento es necesario proporcionar la imagen trasera.'
                });
                return false;
            }

            if (backsideImageBase64 && !isBase64Like(backsideImageBase64)) {
                toast.error('Formato de imagen trasera inválido', {
                    description: 'El formato del documento trasero no parece ser base64 válido.'
                });
                return false;
            }

            return true;
        };

        // Eliminar imagen frontal
        const removeFrontsideImage = () => {
            if (frontsidePreviewUrl) {
                URL.revokeObjectURL(frontsidePreviewUrl);
            }
            setFrontsideImageBase64('');
            setFrontsidePreviewUrl('');
            setFrontsideFileName(null);
            if (frontFileInputRef.current) frontFileInputRef.current.value = '';
        };

        // Eliminar imagen trasera
        const removeBacksideImage = () => {
            if (backsidePreviewUrl) {
                URL.revokeObjectURL(backsidePreviewUrl);
            }
            setBacksideImageBase64('');
            setBacksidePreviewUrl('');
            setBacksideFileName(null);
            if (backFileInputRef.current) backFileInputRef.current.value = '';
        };

        // Manejar envío de formulario para iniciar validación
        const handleStartValidation = () => {
            if (!validateStartForm()) return;

            // Iniciar la validación
            onStartValidation(
                country,
                idType,
                frontsideImageBase64,
                backsideImageBase64,
                storeResponses,
                merchantIdScanReference || undefined
            );
        };

        // Manejar envío de formulario para obtener datos de validación
        const handleGetValidationData = () => {
            if (!scanReference) {
                toast.error('Referencia requerida', {
                    description: 'Por favor ingrese la referencia de validación.'
                });
                return;
            }

            onGetValidationData(scanReference);
        };

        // Validar si hay datos suficientes para habilitar el botón de ejecución
        const hasRequiredDataForStart = () => {
            return (
                country.trim() !== '' &&
                idType !== '' &&
                frontsideImageBase64.trim() !== ''
            );
        };

        const hasRequiredDataForGet = () => {
            return scanReference.trim() !== '';
        };

        const hasRequiredData = () => {
            return inputMethod === 'start' ? hasRequiredDataForStart() : hasRequiredDataForGet();
        };

        // Funciones para manejar el modal de imagen
        const openImageModal = (url: string, title: string, fileName: string) => {
            setModalImageData({ url, title, fileName });
            setImageModalOpen(true);
        };

        // Limpiar resources cuando el componente se desmonte
        useEffect(() => {
            return () => {
                if (frontsidePreviewUrl) {
                    URL.revokeObjectURL(frontsidePreviewUrl);
                }
                if (backsidePreviewUrl) {
                    URL.revokeObjectURL(backsidePreviewUrl);
                }
            };
        }, [frontsidePreviewUrl, backsidePreviewUrl]);

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Validación de Documento</CardTitle>
                    <CardDescription>
                        Inicie una nueva validación o consulte una existente
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <Tabs
                        value={inputMethod}
                        onValueChange={(v) => setInputMethod(v as 'start' | 'get')}
                    >
                        <TabsList className='grid w-full grid-cols-2'>
                            <TabsTrigger value='start'>
                                <CloudUpload className='mr-2 h-4 w-4' />
                                Nueva Validación
                            </TabsTrigger>
                            <TabsTrigger value='get'>
                                <Search className='mr-2 h-4 w-4' />
                                Consultar Validación
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value='start' className='space-y-4'>
                            {/* Campos de país y tipo de documento en la misma línea */}
                            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 pt-2'>
                                {/* Campo de código de país */}
                                <div className='space-y-2'>
                                    <Label htmlFor='country'>
                                        País del documento *
                                    </Label>
                                    <Input
                                        id='country'
                                        value={country}
                                        onChange={handleCountryCodeChange}
                                        placeholder='Ej: CHL, ARG, MEX'
                                        maxLength={3}
                                        disabled={isLoading || isPolling}
                                    />
                                    <span className='text-muted-foreground text-xs'>
                                        Código ISO 3166-1 alpha-3
                                    </span>
                                </div>

                                {/* Campo de tipo de documento */}
                                <div className='space-y-2'>
                                    <Label htmlFor='idType'>Tipo de Documento *</Label>
                                    <Select
                                        value={idType}
                                        onValueChange={setIdType}
                                        disabled={isLoading || isPolling}
                                    >
                                        <SelectTrigger id='idType' className='w-full'>
                                            <SelectValue placeholder='Selecciona un tipo de documento' />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ID_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Imagen frontal con tabs */}
                            <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <Label>Imagen Frontal del Documento</Label>
                                    <Badge variant='secondary' className='text-primary'>
                                        Requerido
                                    </Badge>
                                </div>

                                <Tabs
                                    value={frontsideTab}
                                    onValueChange={(value) =>
                                        setFrontsideTab(value as 'text' | 'file')
                                    }
                                >
                                    <TabsList className='grid w-full grid-cols-2'>
                                        <TabsTrigger
                                            value='file'
                                            disabled={isLoading || isPolling || frontsideLoading}
                                        >
                                            <CloudUpload className='mr-2 h-4 w-4' />
                                            Archivo
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value='text'
                                            disabled={isLoading || isPolling || frontsideLoading}
                                        >
                                            <Braces className='mr-2 h-4 w-4' />
                                            Base64
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value='file' className='pt-2'>
                                        {/* Input para subir imagen */}
                                        <input
                                            ref={frontFileInputRef}
                                            id='frontside-image'
                                            type='file'
                                            accept='image/*'
                                            className='hidden'
                                            onChange={handleFrontsideFileChange}
                                            disabled={isLoading || isPolling || frontsideLoading}
                                        />

                                        {!frontsideImageBase64 && !frontsideLoading && (
                                            <div className='border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors'>
                                                <div className='flex flex-col items-center justify-center'>
                                                    <ImageUp className='text-muted-foreground mb-2 h-12 w-12' />
                                                    <p className='text-muted-foreground text-sm'>
                                                        <span className='font-semibold'>
                                                            Haga clic para subir
                                                        </span>{' '}
                                                        o arrastre y suelte
                                                    </p>
                                                    <p className='text-muted-foreground text-xs'>
                                                        JPG, PNG, GIF (máx. {MAX_SIZE_MB} MB)
                                                    </p>
                                                    <Button
                                                        variant='outline'
                                                        size='sm'
                                                        className='mt-2'
                                                        onClick={() =>
                                                            frontFileInputRef.current?.click()
                                                        }
                                                        disabled={isLoading || isPolling}
                                                    >
                                                        Seleccionar Archivo
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {frontsideLoading && (
                                            <div className='flex h-32 flex-col items-center justify-center rounded-md border p-6'>
                                                <Loader className='text-muted-foreground mb-2 h-8 w-8 animate-spin' />
                                                <p className='text-muted-foreground text-sm'>
                                                    Procesando imagen...
                                                </p>
                                            </div>
                                        )}

                                        {frontsideImageBase64 && !frontsideLoading && (
                                            <div className='flex items-center justify-between rounded-md border p-3'>
                                                <div className='flex items-center gap-3'>
                                                    {frontsidePreviewUrl && (
                                                        <div className='bg-muted h-12 w-12 flex-shrink-0 overflow-hidden rounded'>
                                                            <img
                                                                src={frontsidePreviewUrl}
                                                                alt='Imagen frontal'
                                                                className='h-full w-full object-cover'
                                                            />
                                                        </div>
                                                    )}
                                                    <div className='min-w-0 flex-1'>
                                                        <p className='truncate text-sm font-medium'>
                                                            {frontsideFileName || 'Archivo cargado'}
                                                        </p>
                                                        <p className='text-muted-foreground text-xs'>
                                                            {Math.round(
                                                                frontsideImageBase64.length / 1024
                                                            )}{' '}
                                                            KB
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className='flex gap-2'>
                                                    <Button
                                                        variant='outline'
                                                        size='icon'
                                                        onClick={() =>
                                                            openImageModal(
                                                                frontsidePreviewUrl,
                                                                'Imagen Frontal del Documento',
                                                                frontsideFileName || 'Imagen frontal'
                                                            )
                                                        }
                                                        disabled={isLoading || isPolling}
                                                        title='Ver imagen en grande'
                                                    >
                                                        <Eye className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='outline'
                                                        size='icon'
                                                        onClick={removeFrontsideImage}
                                                        disabled={isLoading || isPolling}
                                                        title='Eliminar imagen'
                                                    >
                                                        <X className='h-4 w-4' />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value='text' className='pt-2'>
                                        <Textarea
                                            ref={frontInputRef}
                                            placeholder='Ingrese el código base64 del frente del documento'
                                            value={frontsideImageBase64}
                                            onChange={(e) =>
                                                setFrontsideImageBase64(e.target.value)
                                            }
                                            disabled={isLoading || isPolling}
                                            className='max-h-[100px] min-h-[100px] flex-grow resize-none overflow-y-auto font-mono text-xs'
                                        />
                                    </TabsContent>
                                </Tabs>
                            </div>

                            {/* Imagen trasera (opcional para pasaportes) */}
                            <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <Label>Imagen Trasera del Documento</Label>
                                    <Badge variant='secondary' className='text-primary'>
                                        {idType === 'PASSPORT' ? 'Opcional' : 'Requerido'}
                                    </Badge>
                                </div>

                                <Tabs
                                    value={backsideTab}
                                    onValueChange={(value) =>
                                        setBacksideTab(value as 'text' | 'file')
                                    }
                                >
                                    <TabsList className='grid w-full grid-cols-2'>
                                        <TabsTrigger
                                            value='file'
                                            disabled={isLoading || isPolling || backsideLoading}
                                        >
                                            <CloudUpload className='mr-2 h-4 w-4' />
                                            Archivo
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value='text'
                                            disabled={isLoading || isPolling || backsideLoading}
                                        >
                                            <Braces className='mr-2 h-4 w-4' />
                                            Base64
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value='file' className='pt-2'>
                                        {/* Input para subir imagen */}
                                        <input
                                            ref={backFileInputRef}
                                            id='backside-image'
                                            type='file'
                                            accept='image/*'
                                            className='hidden'
                                            onChange={handleBacksideFileChange}
                                            disabled={isLoading || isPolling || backsideLoading}
                                        />

                                        {!backsideImageBase64 && !backsideLoading && (
                                            <div className='border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors'>
                                                <div className='flex flex-col items-center justify-center'>
                                                    <ImageUp className='text-muted-foreground mb-2 h-12 w-12' />
                                                    <p className='text-muted-foreground text-sm'>
                                                        <span className='font-semibold'>
                                                            Haga clic para subir
                                                        </span>{' '}
                                                        o arrastre y suelte
                                                    </p>
                                                    <p className='text-muted-foreground text-xs'>
                                                        JPG, PNG, GIF (máx. {MAX_SIZE_MB} MB)
                                                    </p>
                                                    <Button
                                                        variant='outline'
                                                        size='sm'
                                                        className='mt-2'
                                                        onClick={() =>
                                                            backFileInputRef.current?.click()
                                                        }
                                                        disabled={isLoading || isPolling}
                                                    >
                                                        Seleccionar Archivo
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {backsideLoading && (
                                            <div className='flex h-32 flex-col items-center justify-center rounded-md border p-6'>
                                                <Loader className='text-muted-foreground mb-2 h-8 w-8 animate-spin' />
                                                <p className='text-muted-foreground text-sm'>
                                                    Procesando imagen...
                                                </p>
                                            </div>
                                        )}

                                        {backsideImageBase64 && !backsideLoading && (
                                            <div className='flex items-center justify-between rounded-md border p-3'>
                                                <div className='flex items-center gap-3'>
                                                    {backsidePreviewUrl && (
                                                        <div className='bg-muted h-12 w-12 flex-shrink-0 overflow-hidden rounded'>
                                                            <img
                                                                src={backsidePreviewUrl}
                                                                alt='Imagen trasera'
                                                                className='h-full w-full object-cover'
                                                            />
                                                        </div>
                                                    )}
                                                    <div className='min-w-0 flex-1'>
                                                        <p className='truncate text-sm font-medium'>
                                                            {backsideFileName || 'Archivo cargado'}
                                                        </p>
                                                        <p className='text-muted-foreground text-xs'>
                                                            {Math.round(
                                                                backsideImageBase64.length / 1024
                                                            )}{' '}
                                                            KB
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className='flex gap-2'>
                                                    <Button
                                                        variant='outline'
                                                        size='icon'
                                                        onClick={() =>
                                                            openImageModal(
                                                                backsidePreviewUrl,
                                                                'Imagen Trasera del Documento',
                                                                backsideFileName || 'Imagen trasera'
                                                            )
                                                        }
                                                        disabled={isLoading || isPolling}
                                                        title='Ver imagen en grande'
                                                    >
                                                        <Eye className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='outline'
                                                        size='icon'
                                                        onClick={removeBacksideImage}
                                                        disabled={isLoading || isPolling}
                                                        title='Eliminar imagen'
                                                    >
                                                        <X className='h-4 w-4' />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value='text' className='pt-2'>
                                        <Textarea
                                            ref={backInputRef}
                                            placeholder='Ingrese el código base64 del reverso del documento (opcional para pasaportes)'
                                            value={backsideImageBase64}
                                            onChange={(e) => setBacksideImageBase64(e.target.value)}
                                            disabled={isLoading || isPolling}
                                            className='max-h-[100px] min-h-[100px] flex-grow resize-none overflow-y-auto font-mono text-xs'
                                        />
                                    </TabsContent>
                                </Tabs>
                            </div>

                            {/* Campo opcional de referencia personalizada */}
                            <div className='space-y-2'>
                                <Label htmlFor='merchantRef'>
                                    Referencia Personalizada (opcional)
                                </Label>
                                <Input
                                    id='merchantRef'
                                    placeholder='custom-ref-123'
                                    value={merchantIdScanReference}
                                    onChange={(e) => setMerchantIdScanReference(e.target.value)}
                                    disabled={isLoading || isPolling}
                                    maxLength={100}
                                />
                                <p className='text-muted-foreground text-xs'>
                                    Referencia personalizada para identificar esta validación (máx.
                                    100 caracteres)
                                </p>
                            </div>

                            {/* Opción para almacenar respuestas */}
                            <div className='flex items-center space-x-2 py-2'>
                                <Switch
                                    id='storeResponses'
                                    checked={storeResponses}
                                    onCheckedChange={setStoreResponses}
                                    disabled={isLoading || isPolling}
                                />
                                <Label htmlFor='storeResponses'>Guardar Respuestas</Label>
                            </div>

                            {/* Mensaje de error si existe */}
                            {formError && (
                                <div className='text-destructive text-sm font-medium'>
                                    {formError}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value='get' className='space-y-4'>
                            <div className='space-y-2'>
                                <Label htmlFor='scanReference'>Referencia de Validación</Label>
                                <Input
                                    id='scanReference'
                                    placeholder='fe294c25-17e1-4d98-a958-710edbf00064'
                                    value={scanReference}
                                    onChange={(e) => setScanReference(e.target.value)}
                                    disabled={isLoading || isPolling}
                                />
                                <p className='text-muted-foreground text-xs'>
                                    Ingrese la referencia de la validación que desea consultar
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className='flex gap-2'>
                    <Button
                        onClick={
                            inputMethod === 'start'
                                ? handleStartValidation
                                : handleGetValidationData
                        }
                        disabled={isLoading || isPolling || frontsideLoading || backsideLoading || !hasRequiredData()}
                        className='flex-1'
                    >
                        {isLoading ? (
                            <>
                                <Loader className='mr-2 h-4 w-4 animate-spin' />
                                Procesando...
                            </>
                        ) : frontsideLoading || backsideLoading ? (
                            <>
                                <Loader className='mr-2 h-4 w-4 animate-spin' />
                                Cargando imagen...
                            </>
                        ) : isPolling ? (
                            <>
                                <Loader className='mr-2 h-4 w-4 animate-spin' />
                                Validando documento...
                            </>
                        ) : inputMethod === 'start' ? (
                            <>
                                <Play className='mr-2 h-4 w-4' />
                                Iniciar validación
                            </>
                        ) : (
                            <>
                                <Play className='mr-2 h-4 w-4' />
                                Consultar datos
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={onReset}
                        variant='secondary'
                        type='button'
                        disabled={isLoading || isPolling || frontsideLoading || backsideLoading || !hasRequiredData()}
                    >
                        <RefreshCw className='mr-2 h-4 w-4' />
                        Limpiar
                    </Button>
                </CardFooter>

                {/* Modal para ver imagen en grande */}
                <Dialog 
                    open={imageModalOpen} 
                    onOpenChange={(open) => {
                        setImageModalOpen(open);
                        if (!open) {
                            setModalImageData(null);
                        }
                    }}
                >
                    <DialogContent className='max-w-4xl max-h-[90vh] overflow-auto'>
                        <DialogHeader>
                            <DialogTitle>
                                {modalImageData?.title || 'Vista de Imagen'}
                            </DialogTitle>
                        </DialogHeader>
                        {modalImageData && (
                            <div className='flex flex-col items-center space-y-4'>
                                <div className='relative w-full flex justify-center'>
                                    <img
                                        src={modalImageData.url}
                                        alt={modalImageData.title}
                                        className='max-w-full max-h-[70vh] object-contain rounded-lg border'
                                    />
                                </div>
                                <div className='text-center text-sm text-muted-foreground'>
                                    <p className='font-medium'>{modalImageData.fileName}</p>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </Card>
        );
    }
);

DocumentValidationInput.displayName = 'DocumentValidationInput';
