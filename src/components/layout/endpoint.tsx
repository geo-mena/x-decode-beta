'use client';

import { Button } from '@/components/ui/button';
import { usePlaygroundStore } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { truncateText, isValidUrl } from '@/lib/utils-key';
import { Input } from '../ui/input';
import { Server, Save } from 'lucide-react';

const ENDPOINT_PLACEHOLDER = 'Add Endpoint';

const Endpoint = () => {
    const { 
        selectedEndpoint, 
        isEndpointActive, 
        setSelectedEndpoint, 
        setIsEndpointActive, 
        setAgents, 
        setSessionsData, 
        setMessages 
    } = usePlaygroundStore();
    
    const [isEditing, setIsEditing] = useState(false);
    const [endpointValue, setEndpointValue] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isRotating, setIsRotating] = useState(false);

    useEffect(() => {
        setEndpointValue(selectedEndpoint);
        setIsMounted(true);
    }, [selectedEndpoint]);

    const handleSave = async () => {
        if (!endpointValue.trim()) {
            toast.error('Please enter a valid endpoint URL');
            return;
        }
        if (!isValidUrl(endpointValue)) {
            toast.error('Please enter a valid URL');
            return;
        }
        const cleanEndpoint = endpointValue.replace(/\/$/, '').trim();
        setSelectedEndpoint(cleanEndpoint);
        setIsEditing(false);
        setIsHovering(false);
        setAgents([]);
        setSessionsData([]);
        setMessages([]);
        toast.success('Endpoint saved successfully');
        
        // Test endpoint after saving
        await testEndpoint(cleanEndpoint);
    };

    const handleCancel = () => {
        setEndpointValue(selectedEndpoint);
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

    const testEndpoint = async (endpoint?: string) => {
        const testUrl = endpoint || selectedEndpoint;
        if (!testUrl) {
            toast.error('No endpoint to test');
            return;
        }
        
        setIsRotating(true);
        try {
            const response = await fetch(`${testUrl}/liveness`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                setIsEndpointActive(true);
                if (!endpoint) { // Only show toast if manually testing
                    toast.success('Endpoint is active');
                }
            } else {
                setIsEndpointActive(false);
                if (!endpoint) {
                    toast.error('Endpoint is not responding');
                }
            }
        } catch (error) {
            setIsEndpointActive(false);
            if (!endpoint) {
                toast.error('Failed to connect to endpoint');
            }
        }
        
        setTimeout(() => setIsRotating(false), 500);
    };

    const getDisplayText = (): string => {
        if (!isMounted) return 'Loading...';
        if (!selectedEndpoint) return ENDPOINT_PLACEHOLDER;
        return truncateText(selectedEndpoint, 22);
    };

    if (isEditing) {
        return (
            <div className='flex items-center gap-2'>
                <div className='relative flex-1'>
                    <Server className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                    <Input
                        type='text'
                        value={endpointValue}
                        onChange={(e) => setEndpointValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className='h-9 pr-3 pl-10 text-sm font-normal'
                        placeholder='Enter endpoint URL...'
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
            onDoubleClick={() => testEndpoint()}
            title={selectedEndpoint ? 'Click to edit, double-click to test' : 'Click to add endpoint'}
        >
            <Server className='h-4 w-4 flex-shrink-0' />

            <div className='min-w-0 flex-1'>
                <AnimatePresence mode='wait'>
                    {isHovering && selectedEndpoint ? (
                        <motion.span
                            key='edit-text'
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className='text-primary block truncate'
                        >
                            Edit Endpoint
                        </motion.span>
                    ) : (
                        <motion.span
                            key='display-text'
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className={`block truncate ${
                                selectedEndpoint ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                        >
                            {getDisplayText()}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            <motion.div
                className={`size-2 flex-shrink-0 rounded-full ${
                    selectedEndpoint
                        ? isEndpointActive
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        : 'bg-gray-400'
                }`}
                animate={{ rotate: isRotating ? 360 : 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
        </Button>
    );
};

export default Endpoint;
