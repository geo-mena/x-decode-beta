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
        <div
            className={`group border-border bg-background relative overflow-hidden rounded-lg border ${className}`}
        >
            {filename && (
                <div className='bg-muted/30 border-border flex items-center justify-between border-b px-4 py-2'>
                    <div className='text-muted-foreground flex items-center gap-2 font-mono text-sm'>
                        <Terminal size={14} />
                        <span>{filename}</span>
                    </div>
                    <button
                        onClick={copyToClipboard}
                        className='hover:bg-muted rounded-md p-1.5 transition-colors duration-200'
                        title={copied ? 'Copied!' : 'Copy to clipboard'}
                    >
                        {copied ? (
                            <Check size={14} className='text-green-600' />
                        ) : (
                            <Copy
                                size={14}
                                className='text-muted-foreground hover:text-foreground'
                            />
                        )}
                    </button>
                </div>
            )}
            <div
                className='overflow-auto p-4 text-sm'
                style={{ backgroundColor: isDark ? '#121212' : '#ffffff' }}
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
            {!filename && (
                <button
                    onClick={copyToClipboard}
                    className='bg-background/90 hover:bg-background border-border/50 absolute top-3 right-3 rounded-md border p-1.5 opacity-0 shadow-sm transition-all duration-200 group-hover:opacity-100 hover:shadow-md'
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
