'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Network } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MacGeneratorInput, MacGeneratorInputRef } from './components/mac-generator-input';
import { GeneratedMacAddresses } from './components/generated-mac-addresses';
import { generateMultipleMacAddresses, MacGeneratorOptions } from '@/utils/macAddressGenerator';

export default function MacAddressGenerator() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [macAddresses, setMacAddresses] = useState<string[]>([]);
    const [lastOptions, setLastOptions] = useState<MacGeneratorOptions>({});
    const macInputRef = useRef<MacGeneratorInputRef | null>(null);

    const handleGenerate = async (options: MacGeneratorOptions) => {
        setError(null);
        setLoading(true);
        setLastOptions(options);

        // Simulate generation delay for better UX
        setTimeout(() => {
            try {
                const generated = generateMultipleMacAddresses(options);
                setMacAddresses(generated);
                setLoading(false);
            } catch (err) {
                setError('Error generating MAC addresses');
                setMacAddresses([]);
                setLoading(false);
            }
        }, 300);
    };

    const handleRefresh = () => {
        if (Object.keys(lastOptions).length > 0) {
            handleGenerate(lastOptions);
        }
    };

    const handleReset = () => {
        setMacAddresses([]);
        setError(null);
        setLoading(false);
        setLastOptions({});

        if (macInputRef.current) {
            macInputRef.current.reset();
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className='mb-6 flex items-center justify-between'
            >
                <div>
                    <h1 className='text-2xl font-bold tracking-tight'>MAC Address Generator</h1>
                    <p className='text-muted-foreground text-sm'>
                        Generate random MAC addresses with custom prefixes, separators, and formats.
                    </p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Badge
                    variant='secondary'
                    className='text-primary cursor-pointer p-2 mb-6'
                    onClick={() =>
                        window.open(
                            'https://standards.ieee.org/develop/regauth/oui/public.html',
                            '_blank',
                            'noopener,noreferrer'
                        )
                    }
                >
                    <Network className='h-4 w-4' />
                    <span className='ml-2'>IEEE OUI Database</span>
                </Badge>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className='grid gap-6 lg:grid-cols-2'
            >
                <MacGeneratorInput
                    ref={macInputRef}
                    onGenerate={handleGenerate}
                    onReset={handleReset}
                    isLoading={loading}
                />

                <GeneratedMacAddresses
                    macAddresses={macAddresses}
                    isLoading={loading}
                    error={error}
                    onRefresh={handleRefresh}
                    canRefresh={Object.keys(lastOptions).length > 0}
                />
            </motion.div>
        </>
    );
}