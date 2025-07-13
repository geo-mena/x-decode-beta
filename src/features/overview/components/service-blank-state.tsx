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
                    className='text-2xl font-[600] tracking-tight'
                >
                    Quick Docker Setup
                </motion.h1>
                
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                    className='text-muted-foreground text max-w-2xl'
                >
                    Get started in seconds with our official Docker image. Using Docker is the recommended approach for enhanced security and easy deployment.
                </motion.p>
                
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className='space-y-8 w-full max-w-4xl'
                >
                    <div className='space-y-3'>
                        <div className='flex items-center gap-3'>
                            <div className='w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold'>
                                1
                            </div>
                            <h3 className='text font-semibold'>Download Latest Image</h3>
                        </div>
                        <div className='ml-11'>
                            <ShellHighlighter 
                                code="docker pull geomena/x-decode:latest" 
                                filename="terminal"
                            />
                        </div>
                    </div>
                    
                    <div className='space-y-3'>
                        <div className='flex items-center gap-3'>
                            <div className='w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold'>
                                2
                            </div>
                            <h3 className='text font-semibold'>Run Container</h3>
                        </div>
                        <div className='ml-11'>
                            <ShellHighlighter 
                                code="docker run -p 3000:3000 geomena/x-decode:latest" 
                                filename="terminal"
                            />
                        </div>
                    </div>
                    
                    <div className='space-y-3'>
                        <div className='flex items-center gap-3'>
                            <div className='w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold'>
                                3
                            </div>
                            <h3 className='text font-semibold'>Access Application</h3>
                        </div>
                        <div className='ml-11'>
                            <ShellHighlighter 
                                code="http://localhost:3000" 
                                filename="browser"
                                language="text"
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default ServiceBlankState;
