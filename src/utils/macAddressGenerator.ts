export interface MacGeneratorOptions {
    prefix?: string;
    separator?: string;
    count?: number;
    caseFormat?: 'uppercase' | 'lowercase';
}

export const SEPARATORS = [
    { label: ':', value: ':' },
    { label: '-', value: '-' },
    { label: '.', value: '.' },
    { label: 'None', value: 'none' }
];

export const CASE_FORMATS = [
    { label: 'Uppercase', value: 'uppercase' as const },
    { label: 'Lowercase', value: 'lowercase' as const }
];

export function splitPrefix(prefix: string): string[] {
    const base = prefix.match(/[^0-9a-f]/i) === null 
        ? prefix.match(/.{1,2}/g) ?? [] 
        : prefix.split(/[^0-9a-f]/i);

    return base.filter(Boolean).map(byte => byte.padStart(2, '0'));
}

export function generateRandomByte(): string {
    return Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
}

export function generateRandomMacAddress(options: MacGeneratorOptions = {}): string {
    const { 
        prefix: rawPrefix = '', 
        separator = ':', 
        caseFormat = 'uppercase' 
    } = options;

    const prefix = splitPrefix(rawPrefix);
    const randomBytes = Array.from({ length: 6 - prefix.length }, generateRandomByte);
    const bytes = [...prefix, ...randomBytes];
    
    // Handle 'none' separator case
    const actualSeparator = separator === 'none' ? '' : separator;
    let macAddress = bytes.join(actualSeparator);
    
    return caseFormat === 'uppercase' ? macAddress.toUpperCase() : macAddress.toLowerCase();
}

export function generateMultipleMacAddresses(options: MacGeneratorOptions = {}): string[] {
    const { count = 1 } = options;
    return Array.from({ length: count }, () => generateRandomMacAddress(options));
}

export function validateMacPrefix(prefix: string): { isValid: boolean; message?: string } {
    if (!prefix.trim()) {
        return { isValid: true };
    }

    // Remove separators and check if it's valid hex
    const cleanPrefix = prefix.replace(/[.:-]/g, '');
    
    if (!/^[0-9A-Fa-f]*$/.test(cleanPrefix)) {
        return { 
            isValid: false, 
            message: 'Prefix must contain only hexadecimal characters and separators (: - .)' 
        };
    }

    if (cleanPrefix.length > 12) {
        return { 
            isValid: false, 
            message: 'Prefix cannot be longer than 12 hexadecimal characters (6 bytes)' 
        };
    }

    if (cleanPrefix.length % 2 !== 0) {
        return { 
            isValid: false, 
            message: 'Prefix must have an even number of hexadecimal characters' 
        };
    }

    return { isValid: true };
}