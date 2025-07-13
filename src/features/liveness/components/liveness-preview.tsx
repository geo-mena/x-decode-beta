'use client';

import { CloudAlert, CloudCog } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LivenessPreviewProps {
    isLoading: boolean;
    hasResults: boolean;
}

export function LivenessPreview({ isLoading, hasResults }: LivenessPreviewProps) {
    return (
        <Card className='flex h-full flex-col'>
            <CardHeader>
                <CardTitle>Output Results</CardTitle>
                <CardDescription>
                    Preview and results of liveness evaluation
                </CardDescription>
            </CardHeader>
            <CardContent className='flex-grow'>
                {isLoading && (
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <CloudCog className='mb-4 h-20 w-20 animate-pulse' />
                        <p className='text-sm'>Processing images...</p>
                    </div>
                )}

                {!hasResults && !isLoading && (
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <CloudCog className='mb-4 h-20 w-20' />
                        <p className='text-sm'>Upload an image to see results</p>
                    </div>
                )}

                {hasResults && !isLoading && (
                    <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                        <CloudAlert className='mb-4 h-20 w-20' />
                        <p className='text-sm'>Results will be displayed in the table</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
