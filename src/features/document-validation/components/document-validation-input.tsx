'use client';

import { ChangeEvent, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as countries from 'i18n-iso-countries';
import spanish from 'i18n-iso-countries/langs/es.json';
import {
    Braces,
    CloudUpload,
    Eye,
    ImageUp,
    Loader,
    Play,
    RefreshCw,
    Search,
    X
} from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'DRIVING_LICENSE', label: "Driver's License" },
    { value: 'ID_CARD', label: 'ID Card' },
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

        // States for file upload interface
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

        // References to form elements
        const frontInputRef = useRef<HTMLTextAreaElement>(null);
        const backInputRef = useRef<HTMLTextAreaElement>(null);
        const frontFileInputRef = useRef<HTMLInputElement>(null);
        const backFileInputRef = useRef<HTMLInputElement>(null);

        // Implement the reset function that will be exposed through the ref
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

                // Clear references
                if (frontInputRef.current) frontInputRef.current.value = '';
                if (backInputRef.current) backInputRef.current.value = '';
                if (frontFileInputRef.current) frontFileInputRef.current.value = '';
                if (backFileInputRef.current) backFileInputRef.current.value = '';
            }
        }));

        // Validate country code
        const validateCountryCode = (code: string): boolean => {
            if (!code.trim()) return false;

            const iso3166Alpha3Regex = /^[A-Z]{3}$/;
            if (!iso3166Alpha3Regex.test(code)) return false;

            return isValidCountryCode(code);
        };

        // Handle country code change
        const handleCountryCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value.toUpperCase();
            setCountry(value);
        };

        // Handle front file upload
        const handleFrontsideFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            const file = files[0];

            // Validate maximum size
            if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                toast.error('File too large', {
                    description: `File exceeds the ${MAX_SIZE_MB} MB limit.`
                });
                return;
            }

            setFrontsideLoading(true);
            setFrontsideFileName(file.name);

            try {
                // Convert file to base64 using existing service
                const response = await base64EncodeService.encodeImages([file], true);

                if (!response.success || !response.data) {
                    toast.error('Conversion error', {
                        description: response.message || 'Could not convert image to base64.'
                    });
                    setFrontsideFileName(null);
                    return;
                }

                // Obtener el base64 del resultado
                const data = Array.isArray(response.data) ? response.data[0] : response.data;
                setFrontsideImageBase64(data.base64);

                // Crear URL de vista previa
                setFrontsidePreviewUrl(URL.createObjectURL(file));

                toast.success('Image loaded', {
                    description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`
                });
            } catch (error) {
                toast.error('Error', {
                    description: 'Error processing front image.'
                });
                setFrontsideFileName(null);
            } finally {
                setFrontsideLoading(false);
                e.target.value = '';
            }
        };

        // Handle back file upload
        const handleBacksideFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            const file = files[0];

            // Validate maximum size
            if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                toast.error('File too large', {
                    description: `File exceeds the ${MAX_SIZE_MB} MB limit.`
                });
                return;
            }

            setBacksideLoading(true);
            setBacksideFileName(file.name);

            try {
                // Convert file to base64 using existing service
                const response = await base64EncodeService.encodeImages([file], true);

                if (!response.success || !response.data) {
                    toast.error('Conversion error', {
                        description: response.message || 'Could not convert image to base64.'
                    });
                    setBacksideFileName(null);
                    return;
                }

                // Obtener el base64 del resultado
                const data = Array.isArray(response.data) ? response.data[0] : response.data;
                setBacksideImageBase64(data.base64);

                // Crear URL de vista previa
                setBacksidePreviewUrl(URL.createObjectURL(file));

                toast.success('Image loaded', {
                    description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`
                });
            } catch (error) {
                toast.error('Error', {
                    description: 'Error processing back image.'
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

        // Validate form to start validation
        const validateStartForm = (): boolean => {
            if (!validateCountryCode(country)) {
                toast.error('Invalid country', {
                    description: 'Please enter a valid country code in ISO 3166-1 alpha-3 format.'
                });
                return false;
            }

            if (!idType) {
                toast.error('Document type required', {
                    description: 'Please select the document type.'
                });
                return false;
            }

            if (!frontsideImageBase64) {
                toast.error('Front image required', {
                    description: 'Please provide the front image of the document.'
                });
                return false;
            }

            if (!isBase64Like(frontsideImageBase64)) {
                toast.error('Invalid front image format', {
                    description: 'The front document format does not appear to be valid base64.'
                });
                return false;
            }

            // For passports the back is not mandatory, but for other documents it is
            if (idType !== 'PASSPORT' && !backsideImageBase64) {
                toast.error('Back image required', {
                    description: 'For this document type it is necessary to provide the back image.'
                });
                return false;
            }

            if (backsideImageBase64 && !isBase64Like(backsideImageBase64)) {
                toast.error('Invalid back image format', {
                    description: 'The back document format does not appear to be valid base64.'
                });
                return false;
            }

            return true;
        };

        // Remove front image
        const removeFrontsideImage = () => {
            if (frontsidePreviewUrl) {
                URL.revokeObjectURL(frontsidePreviewUrl);
            }
            setFrontsideImageBase64('');
            setFrontsidePreviewUrl('');
            setFrontsideFileName(null);
            if (frontFileInputRef.current) frontFileInputRef.current.value = '';
        };

        // Remove back image
        const removeBacksideImage = () => {
            if (backsidePreviewUrl) {
                URL.revokeObjectURL(backsidePreviewUrl);
            }
            setBacksideImageBase64('');
            setBacksidePreviewUrl('');
            setBacksideFileName(null);
            if (backFileInputRef.current) backFileInputRef.current.value = '';
        };

        // Handle form submission to start validation
        const handleStartValidation = () => {
            if (!validateStartForm()) return;

            // Start validation
            onStartValidation(
                country,
                idType,
                frontsideImageBase64,
                backsideImageBase64,
                storeResponses,
                merchantIdScanReference || undefined
            );
        };

        // Handle form submission to get validation data
        const handleGetValidationData = () => {
            if (!scanReference) {
                toast.error('Reference required', {
                    description: 'Please enter the validation reference.'
                });
                return;
            }

            onGetValidationData(scanReference);
        };

        // Validate if there is enough data to enable the execute button
        const hasRequiredDataForStart = () => {
            return country.trim() !== '' && idType !== '' && frontsideImageBase64.trim() !== '';
        };

        const hasRequiredDataForGet = () => {
            return scanReference.trim() !== '';
        };

        const hasRequiredData = () => {
            return inputMethod === 'start' ? hasRequiredDataForStart() : hasRequiredDataForGet();
        };

        // Functions to handle image modal
        const openImageModal = (url: string, title: string, fileName: string) => {
            setModalImageData({ url, title, fileName });
            setImageModalOpen(true);
        };

        // Clear resources when component unmounts
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
                    <CardTitle>Input Parameters</CardTitle>
                    <CardDescription>
                        Start a new validation or query an existing one
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
                                New Validation
                            </TabsTrigger>
                            <TabsTrigger value='get'>
                                <Search className='mr-2 h-4 w-4' />
                                Query Validation
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value='start' className='space-y-4'>
                            {/* Country and document type fields on same line */}
                            <div className='grid grid-cols-1 gap-4 pt-2 md:grid-cols-2'>
                                {/* Country code field */}
                                <div className='space-y-2'>
                                    <Label htmlFor='country'>Document Country *</Label>
                                    <Input
                                        id='country'
                                        value={country}
                                        onChange={handleCountryCodeChange}
                                        placeholder='Ex: CHL, ARG, MEX'
                                        maxLength={3}
                                        disabled={isLoading || isPolling}
                                    />
                                    <span className='text-muted-foreground text-xs'>
                                        ISO 3166-1 alpha-3 code
                                    </span>
                                </div>

                                {/* Document type field */}
                                <div className='space-y-2'>
                                    <Label htmlFor='idType'>Document Type *</Label>
                                    <Select
                                        value={idType}
                                        onValueChange={setIdType}
                                        disabled={isLoading || isPolling}
                                    >
                                        <SelectTrigger id='idType' className='w-full'>
                                            <SelectValue placeholder='Select a document type' />
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

                            {/* Front image with tabs */}
                            <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <Label>Document Front Image</Label>
                                    <Badge variant='secondary' className='text-primary'>
                                        Required
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
                                            File
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
                                        {/* Input to upload image */}
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
                                                            Click to upload
                                                        </span>{' '}
                                                        or drag and drop
                                                    </p>
                                                    <p className='text-muted-foreground text-xs'>
                                                        JPG, PNG, GIF (max. {MAX_SIZE_MB} MB)
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
                                                        Select File
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {frontsideLoading && (
                                            <div className='flex h-32 flex-col items-center justify-center rounded-md border p-6'>
                                                <Loader className='text-muted-foreground mb-2 h-8 w-8 animate-spin' />
                                                <p className='text-muted-foreground text-sm'>
                                                    Processing image...
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
                                                                alt='Front image'
                                                                className='h-full w-full object-cover'
                                                            />
                                                        </div>
                                                    )}
                                                    <div className='min-w-0 flex-1'>
                                                        <p className='truncate text-sm font-medium'>
                                                            {frontsideFileName || 'File loaded'}
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
                                                                'Document Front Image',
                                                                frontsideFileName || 'Front image'
                                                            )
                                                        }
                                                        disabled={isLoading || isPolling}
                                                        title='View image full size'
                                                    >
                                                        <Eye className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='outline'
                                                        size='icon'
                                                        onClick={removeFrontsideImage}
                                                        disabled={isLoading || isPolling}
                                                        title='Remove image'
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
                                            placeholder='Enter the base64 code of the document front'
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

                            {/* Back image (optional for passports) */}
                            <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <Label>Document Back Image</Label>
                                    <Badge variant='secondary' className='text-primary'>
                                        {idType === 'PASSPORT' ? 'Optional' : 'Required'}
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
                                            File
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
                                        {/* Input to upload image */}
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
                                                            Click to upload
                                                        </span>{' '}
                                                        or drag and drop
                                                    </p>
                                                    <p className='text-muted-foreground text-xs'>
                                                        JPG, PNG, GIF (max. {MAX_SIZE_MB} MB)
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
                                                        Select File
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {backsideLoading && (
                                            <div className='flex h-32 flex-col items-center justify-center rounded-md border p-6'>
                                                <Loader className='text-muted-foreground mb-2 h-8 w-8 animate-spin' />
                                                <p className='text-muted-foreground text-sm'>
                                                    Processing image...
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
                                                                alt='Back image'
                                                                className='h-full w-full object-cover'
                                                            />
                                                        </div>
                                                    )}
                                                    <div className='min-w-0 flex-1'>
                                                        <p className='truncate text-sm font-medium'>
                                                            {backsideFileName || 'File loaded'}
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
                                                                'Document Back Image',
                                                                backsideFileName || 'Back image'
                                                            )
                                                        }
                                                        disabled={isLoading || isPolling}
                                                        title='View image full size'
                                                    >
                                                        <Eye className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='outline'
                                                        size='icon'
                                                        onClick={removeBacksideImage}
                                                        disabled={isLoading || isPolling}
                                                        title='Remove image'
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
                                            placeholder='Enter the base64 code of the document back (optional for passports)'
                                            value={backsideImageBase64}
                                            onChange={(e) => setBacksideImageBase64(e.target.value)}
                                            disabled={isLoading || isPolling}
                                            className='max-h-[100px] min-h-[100px] flex-grow resize-none overflow-y-auto font-mono text-xs'
                                        />
                                    </TabsContent>
                                </Tabs>
                            </div>

                            {/* Optional custom reference field */}
                            <div className='space-y-2'>
                                <Label htmlFor='merchantRef'>Custom Reference (optional)</Label>
                                <Input
                                    id='merchantRef'
                                    placeholder='custom-ref-123'
                                    value={merchantIdScanReference}
                                    onChange={(e) => setMerchantIdScanReference(e.target.value)}
                                    disabled={isLoading || isPolling}
                                    maxLength={100}
                                />
                                <p className='text-muted-foreground text-xs'>
                                    Custom reference to identify this validation (max. 100
                                    characters)
                                </p>
                            </div>

                            {/* Option to store responses */}
                            {/* <div className='flex items-center space-x-2 py-2'>
                                <Switch
                                    id='storeResponses'
                                    checked={storeResponses}
                                    onCheckedChange={setStoreResponses}
                                    disabled={isLoading || isPolling}
                                />
                                <Label htmlFor='storeResponses'>Store Responses</Label>
                            </div> */}

                            {/* Error message if exists */}
                            {formError && (
                                <div className='text-destructive text-sm font-medium'>
                                    {formError}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value='get' className='space-y-4'>
                            <div className='space-y-2'>
                                <Label htmlFor='scanReference'>Validation Reference</Label>
                                <Input
                                    id='scanReference'
                                    placeholder='fe294c25-17e1-4d98-a958-710edbf00064'
                                    value={scanReference}
                                    onChange={(e) => setScanReference(e.target.value)}
                                    disabled={isLoading || isPolling}
                                />
                                <p className='text-muted-foreground text-xs'>
                                    Enter the reference of the validation you want to query
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
                        disabled={
                            isLoading ||
                            isPolling ||
                            frontsideLoading ||
                            backsideLoading ||
                            !hasRequiredData()
                        }
                        className='flex-1'
                    >
                        {isLoading ? (
                            <>
                                <Loader className='mr-2 h-4 w-4 animate-spin' />
                                Processing...
                            </>
                        ) : frontsideLoading || backsideLoading ? (
                            <>
                                <Loader className='mr-2 h-4 w-4 animate-spin' />
                                Loading image...
                            </>
                        ) : isPolling ? (
                            <>
                                <Loader className='mr-2 h-4 w-4 animate-spin' />
                                Validating document...
                            </>
                        ) : inputMethod === 'start' ? (
                            <>
                                <Play className='mr-2 h-4 w-4' />
                                Start validation
                            </>
                        ) : (
                            <>
                                <Play className='mr-2 h-4 w-4' />
                                Query data
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={onReset}
                        variant='secondary'
                        type='button'
                        disabled={
                            isLoading ||
                            isPolling ||
                            frontsideLoading ||
                            backsideLoading ||
                            !hasRequiredData()
                        }
                    >
                        <RefreshCw className='mr-2 h-4 w-4' />
                        Clear
                    </Button>
                </CardFooter>

                {/* Modal to view image full size */}
                <Dialog
                    open={imageModalOpen}
                    onOpenChange={(open) => {
                        setImageModalOpen(open);
                        if (!open) {
                            setModalImageData(null);
                        }
                    }}
                >
                    <DialogContent className='max-h-[90vh] max-w-4xl overflow-auto'>
                        <DialogHeader>
                            <DialogTitle>{modalImageData?.title || 'Image View'}</DialogTitle>
                        </DialogHeader>
                        {modalImageData && (
                            <div className='flex flex-col items-center space-y-4'>
                                <div className='relative flex w-full justify-center'>
                                    <img
                                        src={modalImageData.url}
                                        alt={modalImageData.title}
                                        className='max-h-[70vh] max-w-full rounded-lg border object-contain'
                                    />
                                </div>
                                <div className='text-muted-foreground text-center text-sm'>
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
