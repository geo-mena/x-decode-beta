'use client';

import { useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MacAddressInput, MacAddressInputRef } from './components/mac-address-input';
import { VendorInfo } from './components/vendor-info';
import { getVendorValue } from '@/utils/macAddress';
// @ts-ignore
import db from 'oui-data';

export default function MacAddressLookup() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [macAddress, setMacAddress] = useState('');
    const macInputRef = useRef<MacAddressInputRef | null>(null);

    const vendorInfo = useMemo(() => {
        if (!macAddress) return null;
        const vendorKey = getVendorValue(macAddress);
        return (db as Record<string, string>)[vendorKey] || null;
    }, [macAddress]);

    const handleLookup = async (mac: string) => {
        setError(null);
        setLoading(true);
        setMacAddress(mac);

        // Simulate lookup delay for better UX
        setTimeout(() => {
            setLoading(false);
        }, 500);
    };

    const handleReset = () => {
        setMacAddress('');
        setError(null);
        setLoading(false);

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
                    <h1 className='text-2xl font-bold tracking-tight'>MAC Address Lookup</h1>
                    <p className='text-muted-foreground text-sm'>
                        Lookup vendor information for MAC addresses using the IEEE OUI database.
                    </p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className='grid gap-6 lg:grid-cols-2'
            >
                <MacAddressInput
                    ref={macInputRef}
                    onLookup={handleLookup}
                    onReset={handleReset}
                    isLoading={loading}
                />

                <VendorInfo
                    vendorInfo={vendorInfo}
                    macAddress={macAddress}
                    isLoading={loading}
                    error={error}
                />
            </motion.div>
        </>
    );
}
