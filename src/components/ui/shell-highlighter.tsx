'use client';

import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';
import { Copy, Check, Terminal } from 'lucide-react';

interface ShellHighlighterProps {
    code: string;
    className?: string;
    filename?: string;
    hideLineNumbers?: boolean;
    language?: string;
    noBackground?: boolean;
}

export function ShellHighlighter({ 
    code, 
    className = '', 
    filename,
    hideLineNumbers = true,
    language = 'shell'
}: ShellHighlighterProps) {
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
                    lang: language,
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
        <div className={`relative group border border-border rounded-lg overflow-hidden bg-background ${className}`}>
            {filename && (
                <div className='flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border'>
                    <div className='flex items-center gap-2 text-sm font-mono text-muted-foreground'>
                        <Terminal size={14} />
                        <span>{filename}</span>
                    </div>
                    <button
                        onClick={copyToClipboard}
                        className='p-1.5 rounded-md hover:bg-muted transition-colors duration-200'
                        title={copied ? 'Copied!' : 'Copy to clipboard'}
                    >
                        {copied ? (
                            <Check size={14} className='text-green-600' />
                        ) : (
                            <Copy size={14} className='text-muted-foreground hover:text-foreground' />
                        )}
                    </button>
                </div>
            )}
            <div
                className='overflow-auto text-sm p-4'
                style={{ backgroundColor: isDark ? '#121212' : '#ffffff' }}
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
            {!filename && (
                <button
                    onClick={copyToClipboard}
                    className='absolute top-3 right-3 p-1.5 rounded-md bg-background/90 hover:bg-background border border-border/50 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm hover:shadow-md'
                    title={copied ? 'Copied!' : 'Copy to clipboard'}
                >
                    {copied ? (
                        <Check size={14} className='text-green-600' />
                    ) : (
                        <Copy size={14} className='text-muted-foreground hover:text-foreground' />
                    )}
                </button>
            )}
        </div>
    );
}