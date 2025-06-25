'use client';

import { Button } from '@/components/ui/button';
import { usePlaygroundStore } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { truncateText } from '@/lib/utils-key';
import { Icons } from '@/components/icons';
import { EndpointsModal } from './endpoints-modal';

const Endpoints = () => {
    const { userEndpoints, getSelectedEndpoint } = usePlaygroundStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const selectedEndpoint = getSelectedEndpoint();
    const endpointsCount = userEndpoints.length;
    const hasActiveEndpoint = selectedEndpoint?.isActive || false;

    const getDisplayText = (): string => {
        if (!isMounted) return 'Loading...';
        if (endpointsCount === 0) return 'No Endpoints';
        if (endpointsCount === 1) return '1 Endpoint';
        return `${endpointsCount} Endpoints`;
    };

    const getStatusText = (): string => {
        if (!isMounted || !selectedEndpoint) return 'No endpoint selected';
        return `${selectedEndpoint.tag} - ${truncateText(selectedEndpoint.url, 20)}`;
    };

    return (
        <>
            <Button
                variant='outline'
                className='bg-background text-muted-foreground hover:bg-accent relative h-9 w-full justify-start rounded-[0.5rem] text-sm font-normal shadow-none'
                onClick={() => setIsModalOpen(true)}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                title={
                    isMounted
                        ? selectedEndpoint
                            ? getStatusText()
                            : 'Click to configure endpoints'
                        : 'Click to configure endpoints'
                }
            >
                <Icons.server className='h-4 w-4 flex-shrink-0' />

                <div className='min-w-0 flex-1'>
                    <AnimatePresence mode='wait'>
                        {isHovering ? (
                            <motion.span
                                key='edit-text'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className='text-primary block truncate'
                            >
                                Manage Endpoints
                            </motion.span>
                        ) : (
                            <motion.span
                                key='display-text'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className={`block truncate ${
                                    !isMounted
                                        ? 'text-muted-foreground'
                                        : endpointsCount > 0
                                          ? 'text-foreground'
                                          : 'text-muted-foreground'
                                }`}
                            >
                                {getDisplayText()}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                <div
                    className={`size-2 flex-shrink-0 rounded-full ${
                        !isMounted
                            ? 'bg-gray-400'
                            : endpointsCount > 0
                              ? hasActiveEndpoint
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                              : 'bg-gray-400'
                    }`}
                />
            </Button>

            <EndpointsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
};

export default Endpoints;
