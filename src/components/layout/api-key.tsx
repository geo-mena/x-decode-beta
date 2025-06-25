'use client';

import { Button } from '@/components/ui/button';
import { usePlaygroundStore } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { truncateText } from '@/lib/utils-key';
import { Input } from '../ui/input';
import { Key, Save } from 'lucide-react';

const API_KEY_PLACEHOLDER = 'Add API Key';

const ApiKey = () => {
    const { apiKey, setApiKey } = usePlaygroundStore();
    const [isEditing, setIsEditing] = useState(false);
    const [apiKeyValue, setApiKeyValue] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        setApiKeyValue(apiKey);
        setIsMounted(true);
    }, [apiKey]);

    const handleSave = async () => {
        if (!apiKeyValue.trim()) {
            toast.error('Please enter a valid API key');
            return;
        }
        const cleanApiKey = apiKeyValue.trim();
        setApiKey(cleanApiKey);
        setIsEditing(false);
        setIsHovering(false);
        toast.success('API key saved successfully');
    };

    const handleCancel = () => {
        setApiKeyValue(apiKey);
        setIsEditing(false);
        setIsHovering(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    const maskApiKey = (key: string): string => {
        if (!key) return '';
        if (key.length <= 8) return '*'.repeat(key.length);
        return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
    };

    const getDisplayText = (): string => {
        if (!isMounted) return 'Loading...';
        if (!apiKey) return API_KEY_PLACEHOLDER;
        return truncateText(maskApiKey(apiKey), 22);
    };

    if (isEditing) {
        return (
            <div className='flex items-center gap-2'>
                <div className='relative flex-1'>
                    <Key className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                    <Input
                        type='password'
                        value={apiKeyValue}
                        onChange={(e) => setApiKeyValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className='h-9 pr-3 pl-10 text-sm font-normal'
                        placeholder='Enter API key...'
                        autoFocus
                    />
                </div>
                <Button
                    variant='outline'
                    size='sm'
                    onClick={handleSave}
                    className='h-9 px-3 text-xs'
                >
                    <Save className='h-4 w-4' />
                </Button>
            </div>
        );
    }

    return (
        <Button
            variant='outline'
            className='bg-background text-muted-foreground hover:bg-accent relative h-9 w-full justify-start rounded-[0.5rem] text-sm font-normal shadow-none'
            onClick={() => setIsEditing(true)}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <Key className='h-4 w-4 flex-shrink-0' />

            <div className='min-w-0 flex-1'>
                <AnimatePresence mode='wait'>
                    {isHovering && apiKey ? (
                        <motion.span
                            key='edit-text'
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className='text-primary block truncate'
                        >
                            Edit API Key
                        </motion.span>
                    ) : (
                        <motion.span
                            key='display-text'
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className={`block truncate ${apiKey ? 'text-foreground' : 'text-muted-foreground'}`}
                        >
                            {getDisplayText()}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            <div
                className={`size-2 flex-shrink-0 rounded-full ${
                    apiKey ? 'bg-green-500' : 'bg-red-500'
                }`}
            />
        </Button>
    );
};

export default ApiKey;
