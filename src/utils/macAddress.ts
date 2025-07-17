export const macAddressValidationRules = [
    {
        test: (value: string) => {
            if (!value) return false;
            
            // Remove common separators and check if we have 12 hex characters
            const cleanMac = value.replace(/[.:-]/g, '');
            
            // Check if it's exactly 12 characters and all are hex
            return /^[0-9A-Fa-f]{12}$/.test(cleanMac);
        },
        message: 'Please enter a valid MAC address (e.g., 20:37:06:12:34:56)'
    }
];

export const formatMacAddress = (address: string): string => {
    // Remove all separators and convert to uppercase
    const clean = address.replace(/[.:-]/g, '').toUpperCase();
    
    // Add colons every 2 characters
    return clean.replace(/(.{2})/g, '$1:').slice(0, -1);
};

export const getVendorValue = (address: string): string => {
    return address.trim().replace(/[.:-]/g, '').toUpperCase().substring(0, 6);
};