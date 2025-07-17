'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Play, RefreshCw, Loader } from 'lucide-react';
import { 
    MacGeneratorOptions, 
    SEPARATORS, 
    CASE_FORMATS, 
    validateMacPrefix 
} from '@/utils/macAddressGenerator';

interface MacGeneratorInputProps {
    onGenerate: (options: MacGeneratorOptions) => void;
    onReset: () => void;
    isLoading?: boolean;
}

export interface MacGeneratorInputRef {
    reset: () => void;
}

export const MacGeneratorInput = forwardRef<MacGeneratorInputRef, MacGeneratorInputProps>(
    ({ onGenerate, onReset, isLoading = false }, ref) => {
        const [count, setCount] = useState(1);
        const [prefix, setPrefix] = useState('64:16:7F');
        const [separator, setSeparator] = useState(':');
        const [caseFormat, setCaseFormat] = useState<'uppercase' | 'lowercase'>('uppercase');
        const [prefixError, setPrefixError] = useState<string | null>(null);

        useImperativeHandle(ref, () => ({
            reset: () => {
                setCount(1);
                setPrefix('64:16:7F');
                setSeparator(':');
                setCaseFormat('uppercase');
                setPrefixError(null);
            }
        }));

        const validatePrefix = (value: string) => {
            const validation = validateMacPrefix(value);
            setPrefixError(validation.isValid ? null : validation.message || null);
            return validation.isValid;
        };

        const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setPrefix(value);
            validatePrefix(value);
        };

        const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value >= 1 && value <= 100) {
                setCount(value);
            }
        };

        const handleGenerate = () => {
            if (!validatePrefix(prefix)) {
                return;
            }

            const options: MacGeneratorOptions = {
                count,
                prefix: prefix.trim(),
                separator,
                caseFormat
            };

            onGenerate(options);
        };

        const handleReset = () => {
            setCount(1);
            setPrefix('64:16:7F');
            setSeparator(':');
            setCaseFormat('uppercase');
            setPrefixError(null);
            onReset();
        };

        const isValid = !prefixError && count >= 1 && count <= 100;

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Input Parameters</CardTitle>
                    <CardDescription>
                        Configure options to generate MAC addresses
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="count">Quantity (1-100)</Label>
                        <Input
                            id="count"
                            type="number"
                            min="1"
                            max="100"
                            value={count}
                            onChange={handleCountChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="prefix">MAC Address Prefix (optional)</Label>
                        <Input
                            id="prefix"
                            type="text"
                            placeholder="e.g., 64:16:7F"
                            value={prefix}
                            onChange={handlePrefixChange}
                            className={prefixError ? 'border-red-500' : ''}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                        />
                        {prefixError && (
                            <p className="text-sm text-red-500">{prefixError}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Leave empty for completely random addresses
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="case-format">Case Format</Label>
                        <Select value={caseFormat} onValueChange={(value: 'uppercase' | 'lowercase') => setCaseFormat(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CASE_FORMATS.map((format) => (
                                    <SelectItem key={format.value} value={format.value}>
                                        {format.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="separator">Separator</Label>
                        <Select value={separator} onValueChange={setSeparator}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SEPARATORS.map((sep) => (
                                    <SelectItem key={sep.value} value={sep.value}>
                                        {sep.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                    <Button
                        onClick={handleGenerate}
                        disabled={isLoading || !isValid}
                        className="flex-1"
                    >
                        {isLoading ? (
                            <>
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Play className="mr-2 h-4 w-4" />
                                Generate
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={handleReset}
                        variant="secondary"
                        disabled={isLoading}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Clear
                    </Button>
                </CardFooter>
            </Card>
        );
    }
);