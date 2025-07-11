import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
// import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { UserNav } from './user-nav';
import { ModeToggle } from './ThemeToggle/theme-toggle';
import { LayoutControls } from './layout-controls';
import {
    getSidebarVariant,
    getSidebarCollapsible,
    getContentLayout
} from '@/lib/layout-preferences';

export default async function Header() {
    const variant = await getSidebarVariant();
    const collapsible = await getSidebarCollapsible();
    const contentLayout = await getContentLayout();

    return (
        <header className='flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
            <div className='flex items-center gap-2 px-4'>
                <SidebarTrigger className='-ml-1' />
                {/* <Separator orientation='vertical' className='mr-2 h-4' />
                <Breadcrumbs /> */}
            </div>

            <div className='flex items-center gap-2 px-4'>
                <Separator orientation='vertical' className='hidden h-4 lg:block' />
                <div className='hidden md:flex'>
                    <SearchInput />
                </div>
                <LayoutControls
                    variant={variant}
                    collapsible={collapsible}
                    contentLayout={contentLayout}
                />
                <UserNav />
                <ModeToggle />
            </div>
        </header>
    );
}
