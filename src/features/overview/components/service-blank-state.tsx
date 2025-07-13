'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import React from 'react';
import { ShellHighlighter } from '@/components/ui/shell-highlighter';


const ServiceBlankState = () => {
    return (
        <section
            className='flex flex-col items-center px-6 text-center'
            aria-label='Service overview welcome'
        >
            <div className='flex max-w-3xl flex-col gap-y-8'>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className='flex justify-center'
                >
                    <Image
                        src='/assets/terminal-cron-header.webp'
                        alt='Terminal Cron Header'
                        width={350}
                        height={340}
                        className='rounded-lg'
                        priority
                    />
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className='text-3xl font-[600] tracking-tight'
                >
                    Setup Locale
                </motion.h1>
                
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className='space-y-6'
                >
                    <div>
                        <h3 className='text-lg font-semibold mb-3'>1. Download Latest Image</h3>
                        <ShellHighlighter code="docker pull geomena/x-decode:latest" />
                    </div>
                    
                    <div>
                        <h3 className='text-lg font-semibold mb-3'>2. Run Container</h3>
                        <ShellHighlighter code="docker run -p 3000:3000 geomena/x-decode:latest" />
                    </div>
                    
                    <div>
                        <h3 className='text-lg font-semibold mb-3'>3. Access Application</h3>
                        <ShellHighlighter code="# Application available at:
http://localhost:3000" />
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default ServiceBlankState;
