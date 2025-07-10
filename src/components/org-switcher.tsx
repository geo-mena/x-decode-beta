'use client';

import * as React from 'react';

import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import Logo from './icons/logo';

interface Tenant {
    id: string;
    name: string;
}

export function OrgSwitcher({
    tenants,
    defaultTenant
    // onTenantSwitch
}: {
    tenants: Tenant[];
    defaultTenant: Tenant;
    onTenantSwitch?: (tenantId: string) => void;
}) {
    const [selectedTenant, _setSelectedTenant] = React.useState<Tenant | undefined>(
        defaultTenant || (tenants.length > 0 ? tenants[0] : undefined)
    );

    // const handleTenantSwitch = (tenant: Tenant) => {
    //     setSelectedTenant(tenant);
    //     if (onTenantSwitch) {
    //         onTenantSwitch(tenant.id);
    //     }
    // };

    if (!selectedTenant) {
        return null;
    }
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size='lg'
                            className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                        >
                            <div className='bg-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                                <Logo className='size-20' />
                            </div>
                            <div className='flex flex-col gap-0.5 leading-none'>
                                <span className='font-mono font-bold'>X DECODE</span>
                                {/* <span className=''>{selectedTenant.name}</span> */}
                                <span className='text-muted-foreground text-xs'>v2.0</span>
                            </div>
                            {/* <ChevronsUpDown className='ml-auto' /> */}
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    {/* <DropdownMenuContent
                        className='w-[--radix-dropdown-menu-trigger-width]'
                        align='start'
                    >
                        {tenants.map((tenant) => (
                            <DropdownMenuItem
                                key={tenant.id}
                                onSelect={() => handleTenantSwitch(tenant)}
                            >
                                {tenant.name}{' '}
                                {tenant.id === selectedTenant.id && <Check className='ml-auto' />}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent> */}
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
