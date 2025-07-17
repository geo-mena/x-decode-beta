'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface GeneratedMacAddressesProps {
    macAddresses: string[];
    isLoading?: boolean;
    error?: string | null;
    onRefresh?: () => void;
    canRefresh?: boolean;
}

export function GeneratedMacAddresses({ 
    macAddresses, 
    isLoading = false, 
    error, 
    onRefresh,
    canRefresh = false 
}: GeneratedMacAddressesProps) {
    const handleCopy = async () => {
        if (macAddresses.length > 0) {
            try {
                const content = macAddresses.join('\n');
                await navigator.clipboard.writeText(content);
                toast.success('MAC addresses copied to clipboard');
            } catch (err) {
                toast.error('Failed to copy to clipboard');
            }
        }
    };

    const handleRefresh = () => {
        if (onRefresh && canRefresh) {
            onRefresh();
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Output Results</CardTitle>
                    <CardDescription>
                        Generating MAC addresses...
                    </CardDescription>
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
                    <CardTitle>Output Results</CardTitle>
                    <CardDescription>
                        An error occurred while generating MAC addresses.
                    </CardDescription>
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
                <CardTitle>Output Results</CardTitle>
                <CardDescription>
                    {macAddresses.length > 0 
                        ? `${macAddresses.length} MAC address${macAddresses.length > 1 ? 'es' : ''} generated`
                        : 'Click Generate to create MAC addresses'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="min-h-[200px] rounded-lg bg-muted p-4 font-mono text-sm">
                    {macAddresses.length > 0 ? (
                        <div className="space-y-1">
                            {macAddresses.map((mac, index) => (
                                <div key={index} className="text-sm">
                                    {mac}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground italic">
                            Configure parameters and click Generate to create MAC addresses
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    {canRefresh && (
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            disabled={isLoading}
                            className="flex-1"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    )}
                    <Button
                        onClick={handleCopy}
                        disabled={macAddresses.length === 0}
                        variant="outline"
                        className="flex-1"
                    >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy All
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}