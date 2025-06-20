import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getSidebarVariant, getSidebarCollapsible, getContentLayout } from '@/lib/layout-preferences';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
    title: 'Next Shadcn Dashboard Starter',
    description: 'Basic dashboard with Next.js and Shadcn'
};

export default async function DashboardLayout({
    children
}: {
    children: React.ReactNode;
}) {
    // Persisting the sidebar state in the cookie.
    const cookieStore = await cookies();
    const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
    
    // Get layout preferences
    const variant = await getSidebarVariant();
    const collapsible = await getSidebarCollapsible();
    const contentLayout = await getContentLayout();
    
    return (
        <KBar>
            <SidebarProvider defaultOpen={defaultOpen}>
                <AppSidebar 
                    variant={variant}
                    collapsible={collapsible}
                />
                <SidebarInset>
                    <Header />
                    {/* page main content */}
                    <div className={cn(
                        "flex flex-1 flex-col",
                        contentLayout === "centered" && "container mx-auto max-w-7xl px-4",
                        contentLayout === "full-width" && "w-full px-4"
                    )}>
                        {children}
                    </div>
                    {/* page main content ends */}
                </SidebarInset>
            </SidebarProvider>
        </KBar>
    );
}
