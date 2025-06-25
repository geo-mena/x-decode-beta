'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { usePlaygroundStore } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import { truncateText, isValidUrl } from '@/lib/utils-key';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface EndpointItemProps {
    endpoint: { id: string; tag: string; url: string; isActive: boolean; isSelected: boolean };
    isEditing: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    onTest: () => void;
    onSelect: () => void;
    onRemove: () => void;
    canRemove: boolean;
    tempValues: { tag: string; url: string };
    setTempValues: (values: { tag: string; url: string }) => void;
}

const EndpointItem = ({
    endpoint,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    onTest,
    onSelect,
    onRemove,
    canRemove,
    tempValues,
    setTempValues
}: EndpointItemProps) => {
    const [isHovering, setIsHovering] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    const handleTest = async () => {
        setIsTesting(true);
        await onTest();
        setTimeout(() => setIsTesting(false), 500);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSave();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    if (isEditing) {
        return (
            <div className='border-input bg-card space-y-3 rounded-lg border p-4'>
                <div className='flex items-center gap-2'>
                    <div className='relative flex-1'>
                        <Icons.edit className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                        <Input
                            type='text'
                            value={tempValues.tag}
                            onChange={(e) => setTempValues({ ...tempValues, tag: e.target.value })}
                            onKeyDown={handleKeyDown}
                            className='pl-10'
                            placeholder='Enter tag name...'
                            autoFocus
                        />
                    </div>
                    <Button variant='secondary' size='sm' onClick={onSave}>
                        <Icons.save className='h-4 w-4' />
                        Save
                    </Button>
                    <Button variant='outline' size='sm' onClick={onCancel}>
                        <Icons.x className='h-4 w-4' />
                        Cancel
                    </Button>
                </div>
                <div className='flex items-center gap-2'>
                    <div className='relative flex-1'>
                        <Icons.server className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                        <Input
                            type='text'
                            value={tempValues.url}
                            onChange={(e) => setTempValues({ ...tempValues, url: e.target.value })}
                            onKeyDown={handleKeyDown}
                            className='pl-10'
                            placeholder='Enter endpoint URL...'
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'cursor-pointer rounded-lg border p-4 transition-all duration-200',
                endpoint.isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-input bg-card hover:bg-accent'
            )}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={!endpoint.isSelected ? onSelect : undefined}
        >
            {/* Header with tag and actions */}
            <div className='mb-3 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <Badge variant={endpoint.isSelected ? 'default' : 'secondary'}>
                        {endpoint.tag}
                    </Badge>
                    {endpoint.isSelected && (
                        <Badge variant='outline' className='text-primary border-primary'>
                            Active
                        </Badge>
                    )}
                </div>

                {/* Action buttons */}
                <AnimatePresence>
                    {(isHovering || endpoint.isSelected) && (
                        <motion.div
                            className='flex items-center gap-1'
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                        >
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit();
                                }}
                                className='h-8 w-8 p-0'
                                title='Edit endpoint'
                            >
                                <Icons.edit className='h-4 w-4' />
                            </Button>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleTest();
                                }}
                                className='h-8 w-8 p-0'
                                title='Test endpoint'
                                disabled={isTesting}
                            >
                                <Icons.rotateCw
                                    className={cn('h-4 w-4', isTesting && 'animate-spin')}
                                />
                            </Button>
                            {canRemove && (
                                <Button
                                    variant='destructive'
                                    size='sm'
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove();
                                    }}
                                    className='hover:text-destructive h-8 w-8 p-0'
                                    title='Remove endpoint'
                                >
                                    <Icons.x className='h-4 w-4' />
                                </Button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* URL and status */}
            <div className='flex items-center justify-between'>
                <div className='flex min-w-0 flex-1 items-center gap-2'>
                    <Icons.server className='text-muted-foreground h-4 w-4 flex-shrink-0' />
                    <span className='text-muted-foreground truncate font-mono text-sm'>
                        {truncateText(endpoint.url, 40)}
                    </span>
                </div>
                <div className='flex items-center gap-2'>
                    <div
                        className={cn(
                            'h-2 w-2 rounded-full',
                            endpoint.isActive ? 'bg-green-500' : 'bg-red-500'
                        )}
                    />
                    <span className='text-muted-foreground text-xs'>
                        {endpoint.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>
        </div>
    );
};

interface EndpointsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EndpointsModal = ({ isOpen, onClose }: EndpointsModalProps) => {
    const {
        userEndpoints,
        addUserEndpoint,
        updateUserEndpoint,
        removeUserEndpoint,
        selectUserEndpoint,
        setAgents,
        setSessionsData,
        setMessages
    } = usePlaygroundStore();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempValues, setTempValues] = useState({ tag: '', url: '' });
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newEndpointValues, setNewEndpointValues] = useState({ tag: '', url: '' });

    const canAddMore = userEndpoints.length < 3;
    const canRemove = userEndpoints.length > 1;

    const handleEdit = (endpoint: any) => {
        setEditingId(endpoint.id);
        setTempValues({ tag: endpoint.tag, url: endpoint.url });
        setIsAddingNew(false);
    };

    const handleSave = async (endpointId: string) => {
        if (!tempValues.tag.trim()) {
            toast.error('Please enter a tag name');
            return;
        }
        if (!tempValues.url.trim()) {
            toast.error('Please enter a valid endpoint URL');
            return;
        }
        if (!isValidUrl(tempValues.url)) {
            toast.error('Please enter a valid URL');
            return;
        }

        const cleanUrl = tempValues.url.replace(/\/$/, '').trim();
        updateUserEndpoint(endpointId, {
            tag: tempValues.tag.trim(),
            url: cleanUrl
        });

        setEditingId(null);
        toast.success('Endpoint updated successfully');

        // Test the updated endpoint
        await testEndpoint(cleanUrl, endpointId);
    };

    const handleCancel = () => {
        setEditingId(null);
        setTempValues({ tag: '', url: '' });
    };

    const handleAddNew = async () => {
        if (!newEndpointValues.tag.trim()) {
            toast.error('Please enter a tag name');
            return;
        }
        if (!newEndpointValues.url.trim()) {
            toast.error('Please enter a valid endpoint URL');
            return;
        }
        if (!isValidUrl(newEndpointValues.url)) {
            toast.error('Please enter a valid URL');
            return;
        }

        const cleanUrl = newEndpointValues.url.replace(/\/$/, '').trim();
        addUserEndpoint(newEndpointValues.tag.trim(), cleanUrl);

        setIsAddingNew(false);
        setNewEndpointValues({ tag: '', url: '' });
        toast.success('Endpoint added successfully');
    };

    const testEndpoint = async (url: string, endpointId: string) => {
        try {
            const response = await fetch(`${url}/liveness`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            updateUserEndpoint(endpointId, { isActive: response.ok });
        } catch (error) {
            updateUserEndpoint(endpointId, { isActive: false });
        }
    };

    const handleTest = async (endpoint: any) => {
        await testEndpoint(endpoint.url, endpoint.id);
        const status = endpoint.isActive ? 'active' : 'inactive';
        toast.success(`${endpoint.tag} is ${status}`);
    };

    const handleSelect = (endpointId: string) => {
        selectUserEndpoint(endpointId);
        setAgents([]);
        setSessionsData([]);
        setMessages([]);
        toast.success('Endpoint selected');
    };

    const handleRemove = (endpointId: string) => {
        const endpoint = userEndpoints.find((e) => e.id === endpointId);
        removeUserEndpoint(endpointId);
        toast.success(`${endpoint?.tag} endpoint removed`);
    };

    const startAddingNew = () => {
        setIsAddingNew(true);
        setEditingId(null);
        setNewEndpointValues({ tag: '', url: '' });
    };

    const cancelAddingNew = () => {
        setIsAddingNew(false);
        setNewEndpointValues({ tag: '', url: '' });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='max-h-[80vh] min-w-xl overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                        <Icons.server className='h-5 w-5' />
                        Endpoint Management
                    </DialogTitle>
                    <DialogDescription>
                        Configure and manage your API endpoints. You can have up to 3 endpoints with
                        custom tags.
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-4'>
                    {/* Header with count and add button */}
                    <div className='flex items-center justify-between'>
                        <div className='text-muted-foreground text-sm'>
                            {userEndpoints.length} of 3 endpoints configured
                        </div>
                        {canAddMore && (
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={startAddingNew}
                                disabled={isAddingNew}
                            >
                                <Icons.plus className='h-4 w-4' />
                                Add Endpoint
                            </Button>
                        )}
                    </div>

                    {/* Add new endpoint form */}
                    {isAddingNew && (
                        <motion.div
                            className='border-primary bg-primary/5 space-y-3 rounded-lg border border-dashed p-4'
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <div className='text-primary text-sm font-medium'>Add New Endpoint</div>
                            <div className='flex items-center gap-2'>
                                <div className='relative flex-1'>
                                    <Icons.edit className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                                    <Input
                                        type='text'
                                        value={newEndpointValues.tag}
                                        onChange={(e) =>
                                            setNewEndpointValues({
                                                ...newEndpointValues,
                                                tag: e.target.value
                                            })
                                        }
                                        className='pl-10'
                                        placeholder='Enter tag name (e.g., Staging)...'
                                        autoFocus
                                    />
                                </div>
                                <Button variant='secondary' size='sm' onClick={handleAddNew}>
                                    <Icons.save className='h-4 w-4' />
                                    Save
                                </Button>
                                <Button variant='outline' size='sm' onClick={cancelAddingNew}>
                                    <Icons.x className='h-4 w-4' />
                                    Cancel
                                </Button>
                            </div>
                            <div className='flex items-center gap-2'>
                                <div className='relative flex-1'>
                                    <Icons.server className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                                    <Input
                                        type='text'
                                        value={newEndpointValues.url}
                                        onChange={(e) =>
                                            setNewEndpointValues({
                                                ...newEndpointValues,
                                                url: e.target.value
                                            })
                                        }
                                        className='pl-10'
                                        placeholder='Enter endpoint URL...'
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {userEndpoints.length > 0 && <Separator />}

                    {/* Endpoints list */}
                    <div className='space-y-3'>
                        {userEndpoints.map((endpoint) => (
                            <EndpointItem
                                key={endpoint.id}
                                endpoint={endpoint}
                                isEditing={editingId === endpoint.id}
                                onEdit={() => handleEdit(endpoint)}
                                onSave={() => handleSave(endpoint.id)}
                                onCancel={handleCancel}
                                onTest={() => handleTest(endpoint)}
                                onSelect={() => handleSelect(endpoint.id)}
                                onRemove={() => handleRemove(endpoint.id)}
                                canRemove={canRemove}
                                tempValues={tempValues}
                                setTempValues={setTempValues}
                            />
                        ))}
                    </div>

                    {userEndpoints.length === 0 && (
                        <div className='text-muted-foreground py-8 text-center'>
                            <Icons.server className='mx-auto mb-4 h-12 w-12 opacity-50' />
                            <p>No endpoints configured</p>
                            <p className='text-sm'>Click &quot;Add Endpoint&quot; to get started</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
