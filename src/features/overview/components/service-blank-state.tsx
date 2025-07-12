'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface ActionButtonProps {
    href: string;
    variant?: 'primary';
    text: string;
    onClick?: () => void;
}

const ActionButton = ({ href, variant, text, onClick }: ActionButtonProps) => {
    const baseStyles = 'px-4 py-2 text-sm transition-colors font-medium tracking-tight';
    const variantStyles = {
        primary: 'border border-border hover:bg-neutral-800 rounded-xl bg-background'
    };

    if (onClick) {
        return (
            <button
                onClick={onClick}
                className={`${baseStyles} ${variant ? variantStyles[variant] : 'hover:bg-muted rounded-xl'}`}
            >
                {text}
            </button>
        );
    }

    return (
        <Link
            href={href}
            className={`${baseStyles} ${variant ? variantStyles[variant] : 'hover:bg-muted rounded-xl'}`}
        >
            {text}
        </Link>
    );
};

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
                    <div className='flex flex-wrap items-center justify-center gap-x-2 font-medium whitespace-nowrap'>
                        <span className='flex items-center font-[600]'>Welcome to your</span>
                        <span className='text-primary flex items-center font-[600]'>
                            Service Overview
                        </span>
                        <span className='flex items-center font-[600]'>powered by</span>
                    </div>
                    <p className='text-muted-foreground mt-4 text-lg'>
                        Start by connecting your first data source or configuring your services.
                    </p>
                </motion.h1>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className='flex flex-wrap justify-center gap-4'
                >
                    <ActionButton
                        href='/service/settings'
                        variant='primary'
                        text='CONFIGURE SERVICES'
                    />
                    <ActionButton href='/service/data-sources' text='CONNECT DATA SOURCE' />
                    <ActionButton href='/service/docs' text='VIEW DOCUMENTATION' />
                </motion.div>
            </div>
        </section>
    );
};

export default ServiceBlankState;
