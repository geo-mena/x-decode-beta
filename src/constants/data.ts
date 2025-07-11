import { NavItem } from '@/types';

export type Product = {
    photo_url: string;
    name: string;
    description: string;
    created_at: string;
    price: number;
    id: number;
    category: string;
    updated_at: string;
};

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
    // {
    //     title: 'Dashboard',
    //     url: '/service/overview',
    //     icon: 'dashboard',
    //     isActive: false,
    //     shortcut: ['d', 'd'],
    //     items: [] // Empty array as there are no child items for Dashboard
    // },
    // {
    //     title: 'Product',
    //     url: '/service/product',
    //     icon: 'product',
    //     shortcut: ['p', 'p'],
    //     isActive: false,
    //     items: [] // No child items
    // },
    // {
    //     title: 'Account',
    //     url: '#', // Placeholder as there is no direct link for the parent
    //     icon: 'billing',
    //     isActive: true,

    //     items: [
    //         {
    //             title: 'Profile',
    //             url: '/service/profile',
    //             icon: 'userPen',
    //             shortcut: ['m', 'm']
    //         },
    //         {
    //             title: 'Login',
    //             shortcut: ['l', 'l'],
    //             url: '/',
    //             icon: 'login'
    //         }
    //     ]
    // },
    // {
    //     title: 'Kanban',
    //     url: '/service/kanban',
    //     icon: 'kanban',
    //     shortcut: ['k', 'k'],
    //     isActive: false,
    //     items: [] // No child items
    // },
    {
        title: 'Identity API',
        url: '#', // Placeholder as there is no direct link for the parent
        icon: 'server',
        isActive: true,

        items: [
            {
                title: 'Detokenize',
                url: '/service/detokenize',
                icon: 'route',
                shortcut: ['m', 'm']
            },
            {
                title: 'Prueba de vida',
                url: '/service/liveness',
                icon: 'route',
                shortcut: ['m', 'm']
            },
            {
                title: 'Morfología',
                url: '/service/morphology',
                icon: 'route',
                shortcut: ['m', 'm']
            },
        ]
    },

    {
        title: 'Decoders',
        url: '#', // Placeholder as there is no direct link for the parent
        icon: 'cloudDownload',
        isActive: true,

        items: [
            {
                title: 'Base64 a Imagen',
                url: '/tools/decode-image',
                icon: 'route',
                shortcut: ['m', 'm']
            },
            {
                title: 'Base64 a PDF',
                url: '/tools/decode-pdf',
                icon: 'route',
                shortcut: ['m', 'm']
            }
        ]
    },

    {
        title: 'Encoders',
        url: '#', // Placeholder as there is no direct link for the parent
        icon: 'cloudUpload',
        isActive: true,

        items: [
            {
                title: 'Imagen a Base64',
                url: '/tools/encode-image',
                icon: 'route',
                shortcut: ['m', 'm']
            }
        ]
    },

    {
        title: 'Tools',
        url: '#', // Placeholder as there is no direct link for the parent
        icon: 'tools',
        isActive: true,

        items: [
            {
                title: 'Análisis de Imágenes',
                url: '/tools/image-analysis',
                icon: 'route',
                shortcut: ['m', 'm']
            }
        ]
    }
];

export interface SaleUser {
    id: number;
    name: string;
    email: string;
    amount: string;
    image: string;
    initials: string;
}

export const recentSalesData: SaleUser[] = [
    {
        id: 1,
        name: 'Olivia Martin',
        email: 'olivia.martin@email.com',
        amount: '+$1,999.00',
        image: 'https://api.slingacademy.com/public/sample-users/1.png',
        initials: 'OM'
    },
    {
        id: 2,
        name: 'Jackson Lee',
        email: 'jackson.lee@email.com',
        amount: '+$39.00',
        image: 'https://api.slingacademy.com/public/sample-users/2.png',
        initials: 'JL'
    },
    {
        id: 3,
        name: 'Isabella Nguyen',
        email: 'isabella.nguyen@email.com',
        amount: '+$299.00',
        image: 'https://api.slingacademy.com/public/sample-users/3.png',
        initials: 'IN'
    },
    {
        id: 4,
        name: 'William Kim',
        email: 'will@email.com',
        amount: '+$99.00',
        image: 'https://api.slingacademy.com/public/sample-users/4.png',
        initials: 'WK'
    },
    {
        id: 5,
        name: 'Sofia Davis',
        email: 'sofia.davis@email.com',
        amount: '+$39.00',
        image: 'https://api.slingacademy.com/public/sample-users/5.png',
        initials: 'SD'
    }
];
