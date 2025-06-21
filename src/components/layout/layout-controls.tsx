"use client";

import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { SidebarVariant, SidebarCollapsible, ContentLayout } from "@/lib/layout-preferences";
import { setValueToCookie } from "@/server/server-actions";
import { useThemeConfig } from "@/components/active-theme";

const DEFAULT_THEMES = [
    {
        name: 'Default',
        value: 'default'
    },
    {
        name: 'Blue',
        value: 'blue'
    },
    {
        name: 'Green',
        value: 'green'
    },
    {
        name: 'Amber',
        value: 'amber'
    }
];

const MONO_THEMES = [
    {
        name: 'Mono',
        value: 'mono-scaled'
    }
];

type LayoutControlsProps = {
    readonly variant: SidebarVariant;
    readonly collapsible: SidebarCollapsible;
    readonly contentLayout: ContentLayout;
};

export function LayoutControls({ variant, collapsible, contentLayout }: LayoutControlsProps) {
    const router = useRouter();
    const { activeTheme, setActiveTheme } = useThemeConfig();
    
    const handleValueChange = async (key: string, value: string) => {
        await setValueToCookie(key, value);
        router.refresh(); // Refresh to apply new layout preferences
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button size="icon" variant="ghost">
                    <Settings className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
                <div className="flex flex-col gap-5">
                    <div className="space-y-1.5">
                        <h4 className="text-sm leading-none font-medium">Layout Settings</h4>
                        <p className="text-muted-foreground text-xs">Customize your dashboard layout preferences.</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Theme Selection */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Theme</Label>
                            <Select value={activeTheme} onValueChange={setActiveTheme}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Default</SelectLabel>
                                        {DEFAULT_THEMES.map((theme) => (
                                            <SelectItem key={theme.name} value={theme.value}>
                                                {theme.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                    <SelectSeparator />
                                    <SelectGroup>
                                        <SelectLabel>Monospaced</SelectLabel>
                                        {MONO_THEMES.map((theme) => (
                                            <SelectItem key={theme.name} value={theme.value}>
                                                {theme.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        {/* Layout Settings */}
                        <div className="flex flex-col gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Sidebar Variant</Label>
                                <ToggleGroup
                                    className="w-full"
                                    size="sm"
                                    variant="outline"
                                    type="single"
                                    value={variant}
                                    onValueChange={(value) => handleValueChange("sidebar_variant", value)}
                                >
                                    <ToggleGroupItem className="text-xs" value="inset" aria-label="Toggle inset">
                                        Inset
                                    </ToggleGroupItem>
                                    <ToggleGroupItem className="text-xs" value="sidebar" aria-label="Toggle sidebar">
                                        Sidebar
                                    </ToggleGroupItem>
                                    <ToggleGroupItem className="text-xs" value="floating" aria-label="Toggle floating">
                                        Floating
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Sidebar Collapsible</Label>
                                <ToggleGroup
                                    className="w-full"
                                    size="sm"
                                    variant="outline"
                                    type="single"
                                    value={collapsible}
                                    onValueChange={(value) => handleValueChange("sidebar_collapsible", value)}
                                >
                                    <ToggleGroupItem className="text-xs" value="icon" aria-label="Toggle icon">
                                        Icon
                                    </ToggleGroupItem>
                                    <ToggleGroupItem className="text-xs" value="offcanvas" aria-label="Toggle offcanvas">
                                        OffCanvas
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Content Layout</Label>
                                <ToggleGroup
                                    className="w-full"
                                    size="sm"
                                    variant="outline"
                                    type="single"
                                    value={contentLayout}
                                    onValueChange={(value) => handleValueChange("content_layout", value)}
                                >
                                    <ToggleGroupItem className="text-xs" value="centered" aria-label="Toggle centered">
                                        Centered
                                    </ToggleGroupItem>
                                    <ToggleGroupItem className="text-xs" value="full-width" aria-label="Toggle full-width">
                                        Full Width
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </div>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
