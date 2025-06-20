'use client'

import { Button } from '@/components/ui/button'
import { usePlaygroundStore } from '@/store'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { truncateText } from '@/lib/utils-key'
import { IconKey, IconX } from '@tabler/icons-react'
import { Input } from '../ui/input'
import { Save } from 'lucide-react'

const API_KEY_PLACEHOLDER = 'Add API Key'

const ApiKey = () => {
    const { apiKey, setApiKey } = usePlaygroundStore()
    const [isEditing, setIsEditing] = useState(false)
    const [apiKeyValue, setApiKeyValue] = useState('')
    const [isMounted, setIsMounted] = useState(false)
    const [isHovering, setIsHovering] = useState(false)

    useEffect(() => {
        setApiKeyValue(apiKey)
        setIsMounted(true)
    }, [apiKey])

    const handleSave = async () => {
        if (!apiKeyValue.trim()) {
            toast.error('Please enter a valid API key')
            return
        }
        const cleanApiKey = apiKeyValue.trim()
        setApiKey(cleanApiKey)
        setIsEditing(false)
        setIsHovering(false)
        toast.success('API key saved successfully')
    }

    const handleCancel = () => {
        setApiKeyValue(apiKey)
        setIsEditing(false)
        setIsHovering(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave()
        } else if (e.key === 'Escape') {
            handleCancel()
        }
    }

    const maskApiKey = (key: string): string => {
        if (!key) return ''
        if (key.length <= 8) return '*'.repeat(key.length)
        return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4)
    }

    const getDisplayText = (): string => {
        if (!isMounted) return 'Loading...'
        if (!apiKey) return API_KEY_PLACEHOLDER
        return truncateText(maskApiKey(apiKey), 22)
    }

    if (isEditing) {
        return (
            <div className="space-y-2">
                <div className="relative">
                    <IconKey className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="password"
                        value={apiKeyValue}
                        onChange={(e) => setApiKeyValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="h-9 pl-10 pr-3 text-sm font-normal"
                        placeholder="Enter API key..."
                        autoFocus
                    />
                </div>
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="h-7 px-2 text-xs hover:bg-red-100 hover:text-red-600"
                    >
                        <IconX className="h-3 w-3 mr-1" />
                        Cancel
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSave}
                        className="h-7 px-2 text-xs hover:bg-green-100 hover:text-green-600"
                    >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <Button
            variant="outline"
            className="bg-background text-muted-foreground relative h-9 w-full justify-start rounded-[0.5rem] text-sm font-normal shadow-none hover:bg-accent"
            onClick={() => setIsEditing(true)}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <IconKey className="mr-2 h-4 w-4 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                    {isHovering && apiKey ? (
                        <motion.span
                            key="edit-text"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="text-primary truncate block"
                        >
                            Edit API Key
                        </motion.span>
                    ) : (
                        <motion.span
                            key="display-text"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className={`truncate block ${apiKey ? 'text-foreground' : 'text-muted-foreground'}`}
                        >
                            {getDisplayText()}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            <div
                className={`flex-shrink-0 size-2 rounded-full ${
                    apiKey ? 'bg-green-500' : 'bg-red-500'
                }`}
            />
        </Button>
    )
}

export default ApiKey