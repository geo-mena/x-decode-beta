'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw } from 'lucide-react';
import { macAddressValidationRules, formatMacAddress } from '@/utils/macAddress';

interface MacAddressInputProps {
    onLookup: (macAddress: string) => void;
    onReset: () => void;
    isLoading?: boolean;
}

export interface MacAddressInputRef {
    reset: () => void;
}

export const MacAddressInput = forwardRef<MacAddressInputRef, MacAddressInputProps>(
    ({ onLookup, onReset, isLoading = false }, ref) => {
        const [macAddress, setMacAddress] = useState('20:37:06:12:34:56');
        const [error, setError] = useState<string | null>(null);

        useImperativeHandle(ref, () => ({
            reset: () => {
                setMacAddress('20:37:06:12:34:56');
                setError(null);
            }
        }));

        const validateMacAddress = (value: string): boolean => {
            for (const rule of macAddressValidationRules) {
                if (!rule.test(value)) {
                    setError(rule.message);
                    return false;
                }
            }
            setError(null);
            return true;
        };

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setMacAddress(value);
            
            if (value.trim()) {
                validateMacAddress(value);
            } else {
                setError(null);
            }
        };

        const handleLookup = () => {
            if (validateMacAddress(macAddress)) {
                onLookup(macAddress);
            }
        };

        const handleReset = () => {
            setMacAddress('20:37:06:12:34:56');
            setError(null);
            onReset();
        };

        const handleKeyPress = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !isLoading) {
                handleLookup();
            }
        };

        return (
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="mac-address">MAC Address</Label>
                    <Input
                        id="mac-address"
                        type="text"
                        placeholder="Type a MAC address (e.g., 20:37:06:12:34:56)"
                        value={macAddress}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        className={error ? 'border-red-500' : ''}
                    />
                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={handleLookup}
                        disabled={isLoading || !!error || !macAddress.trim()}
                        className="flex-1"
                    >
                        <Search className="h-4 w-4 mr-2" />
                        {isLoading ? 'Looking up...' : 'Lookup Vendor'}
                    </Button>

                    <Button
                        onClick={handleReset}
                        variant="outline"
                        disabled={isLoading}
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    }
);