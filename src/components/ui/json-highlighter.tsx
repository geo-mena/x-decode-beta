'use client';

import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';

interface JsonHighlighterProps {
    code: string;
    className?: string;
}

export function JsonHighlighter({ code, className = '' }: JsonHighlighterProps) {
    const [highlightedCode, setHighlightedCode] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isDark, setIsDark] = useState(false);

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
                    lang: 'json',
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
            className={`overflow-auto rounded-md text-sm ${className}`}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
    );
}
