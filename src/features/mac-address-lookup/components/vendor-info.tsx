'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Building } from 'lucide-react';
import { toast } from 'sonner';

interface VendorInfoProps {
    vendorInfo: string | null;
    macAddress: string;
    isLoading?: boolean;
    error?: string | null;
}

export function VendorInfo({ vendorInfo, macAddress, isLoading = false, error }: VendorInfoProps) {
    const handleCopy = async () => {
        if (vendorInfo) {
            try {
                await navigator.clipboard.writeText(vendorInfo);
                toast.success('Vendor info copied to clipboard');
            } catch (err) {
                toast.error('Failed to copy to clipboard');
            }
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Vendor Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Vendor Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-red-500 p-4">
                        {error}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Vendor Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="min-h-[120px] rounded-lg bg-muted p-4">
                    {vendorInfo ? (
                        <div className="space-y-2">
                            {vendorInfo.split('\n').map((line, index) => (
                                <div key={index} className="text-sm">
                                    {line}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground italic">
                            {macAddress ? 'Unknown vendor for this address' : 'Enter a MAC address to lookup vendor information'}
                        </div>
                    )}
                </div>

                <div className="flex justify-center">
                    <Button
                        onClick={handleCopy}
                        disabled={!vendorInfo}
                        variant="outline"
                        className="w-full"
                    >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Vendor Info
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}