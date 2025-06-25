import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatBytes(
    bytes: number,
    opts: {
        decimals?: number;
        sizeType?: 'accurate' | 'normal';
    } = {}
) {
    const { decimals = 0, sizeType = 'normal' } = opts;

    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const accurateSizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
        sizeType === 'accurate' ? (accurateSizes[i] ?? 'Bytest') : (sizes[i] ?? 'Bytes')
    }`;
}

// URL validation function
export function isValidUrl(string: string): boolean {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Text truncation function
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}
