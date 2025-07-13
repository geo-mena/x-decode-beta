'use client';

import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';
import { Copy, Check } from 'lucide-react';

interface ShellHighlighterProps {
    code: string;
    className?: string;
}

export function ShellHighlighter({ code, className = '' }: ShellHighlighterProps) {
    const [highlightedCode, setHighlightedCode] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isDark, setIsDark] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const checkTheme = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };

        checkTheme();

        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const highlightCode = async () => {
            try {
                setIsLoading(true);
                const html = await codeToHtml(code, {
                    lang: 'shell',
                    theme: isDark ? 'vitesse-dark' : 'vitesse-light'
                });
                setHighlightedCode(html);
            } catch (error) {
                console.error('Error highlighting code:', error);
                setHighlightedCode(`<pre><code>${code}</code></pre>`);
            } finally {
                setIsLoading(false);
            }
        };

        highlightCode();
    }, [code, isDark]);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    if (isLoading) {
        return (
            <div className={`bg-muted animate-pulse rounded p-4 ${className}`}>
                <div className='bg-muted-foreground/20 mb-2 h-4 w-3/4 rounded'></div>
                <div className='bg-muted-foreground/20 mb-2 h-4 w-1/2 rounded'></div>
                <div className='bg-muted-foreground/20 h-4 w-2/3 rounded'></div>
            </div>
        );
    }

    return (
        <div className={`relative group ${className}`}>
            <div
                className='overflow-auto rounded-md text-sm border-2'
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
            <button
                onClick={copyToClipboard}
                className='absolute top-2 right-2 p-2 rounded-md bg-background/80 hover:bg-background border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200'
                title={copied ? 'Copied!' : 'Copy to clipboard'}
            >
                {copied ? (
                    <Check size={16} className='text-green-500' />
                ) : (
                    <Copy size={16} className='text-muted-foreground' />
                )}
            </button>
        </div>
    );
}