import { PlaygroundChatMessage, SessionEntry } from '@/types/playground';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

interface Agent {
    value: string;
    label: string;
    model: {
        provider: string;
    };
    storage?: boolean;
}

interface Route {
    value: string;
    label: string;
    path: string;
    description: string;
}

interface UserEndpoint {
    id: string;
    tag: string;
    url: string;
    isActive: boolean;
    isSelected: boolean;
}

interface PlaygroundStore {
    hydrated: boolean;
    setHydrated: () => void;
    streamingErrorMessage: string;
    setStreamingErrorMessage: (streamingErrorMessage: string) => void;
    // Legacy endpoints (keeping for compatibility)
    endpoints: {
        endpoint: string;
        id_playground_endpoint: string;
    }[];
    setEndpoints: (
        endpoints: {
            endpoint: string;
            id_playground_endpoint: string;
        }[]
    ) => void;
    // New multiple endpoints with tags
    userEndpoints: UserEndpoint[];
    setUserEndpoints: (endpoints: UserEndpoint[]) => void;
    addUserEndpoint: (tag: string, url: string) => void;
    updateUserEndpoint: (id: string, updates: Partial<UserEndpoint>) => void;
    removeUserEndpoint: (id: string) => void;
    selectUserEndpoint: (id: string) => void;
    getSelectedEndpoint: () => UserEndpoint | null;
    isStreaming: boolean;
    setIsStreaming: (isStreaming: boolean) => void;
    isEndpointActive: boolean;
    setIsEndpointActive: (isActive: boolean) => void;
    isEndpointLoading: boolean;
    setIsEndpointLoading: (isLoading: boolean) => void;
    messages: PlaygroundChatMessage[];
    setMessages: (
        messages:
            | PlaygroundChatMessage[]
            | ((
                  prevMessages: PlaygroundChatMessage[]
              ) => PlaygroundChatMessage[])
    ) => void;
    hasStorage: boolean;
    setHasStorage: (hasStorage: boolean) => void;
    chatInputRef: React.RefObject<HTMLTextAreaElement | null>;
    // Legacy selected endpoint (keeping for compatibility)
    selectedEndpoint: string;
    setSelectedEndpoint: (selectedEndpoint: string) => void;
    apiKey: string;
    setApiKey: (apiKey: string) => void;
    agents: Agent[];
    setAgents: (agents: Agent[]) => void;
    routes: Route[];
    setRoutes: (routes: Route[]) => void;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    sessionsData: SessionEntry[] | null;
    setSessionsData: (
        sessionsData:
            | SessionEntry[]
            | ((prevSessions: SessionEntry[] | null) => SessionEntry[] | null)
    ) => void;
    isSessionsLoading: boolean;
    setIsSessionsLoading: (isSessionsLoading: boolean) => void;
}

export const usePlaygroundStore = create<PlaygroundStore>()(
    persist(
        (set, get) => ({
            hydrated: false,
            setHydrated: () => set({ hydrated: true }),
            streamingErrorMessage: '',
            setStreamingErrorMessage: (streamingErrorMessage) =>
                set(() => ({ streamingErrorMessage })),
            endpoints: [],
            setEndpoints: (endpoints) => set(() => ({ endpoints })),
            // New multiple endpoints functionality
            userEndpoints: [
                {
                    id: uuidv4(),
                    tag: 'Development',
                    url: 'http://localhost:7777',
                    isActive: false,
                    isSelected: true
                }
            ],
            setUserEndpoints: (userEndpoints) => set({ userEndpoints }),
            addUserEndpoint: (tag: string, url: string) => {
                const currentEndpoints = get().userEndpoints;
                if (currentEndpoints.length >= 3) return; // Max 3 endpoints
                
                const newEndpoint: UserEndpoint = {
                    id: uuidv4(),
                    tag,
                    url,
                    isActive: false,
                    isSelected: false
                };
                
                set({ userEndpoints: [...currentEndpoints, newEndpoint] });
            },
            updateUserEndpoint: (id: string, updates: Partial<UserEndpoint>) => {
                const currentEndpoints = get().userEndpoints;
                const updatedEndpoints = currentEndpoints.map(endpoint =>
                    endpoint.id === id ? { ...endpoint, ...updates } : endpoint
                );
                set({ userEndpoints: updatedEndpoints });
            },
            removeUserEndpoint: (id: string) => {
                const currentEndpoints = get().userEndpoints;
                if (currentEndpoints.length <= 1) return; // Keep at least 1
                
                const filteredEndpoints = currentEndpoints.filter(endpoint => endpoint.id !== id);
                const removedEndpoint = currentEndpoints.find(endpoint => endpoint.id === id);
                
                // If we're removing the selected endpoint, select the first one
                if (removedEndpoint?.isSelected && filteredEndpoints.length > 0) {
                    filteredEndpoints[0].isSelected = true;
                }
                
                set({ userEndpoints: filteredEndpoints });
            },
            selectUserEndpoint: (id: string) => {
                const currentEndpoints = get().userEndpoints;
                const updatedEndpoints = currentEndpoints.map(endpoint => ({
                    ...endpoint,
                    isSelected: endpoint.id === id
                }));
                
                // Update legacy selectedEndpoint for compatibility
                const selectedEndpoint = updatedEndpoints.find(e => e.isSelected);
                if (selectedEndpoint) {
                    set({ 
                        userEndpoints: updatedEndpoints, 
                        selectedEndpoint: selectedEndpoint.url 
                    });
                } else {
                    set({ userEndpoints: updatedEndpoints });
                }
            },
            getSelectedEndpoint: () => {
                const endpoints = get().userEndpoints;
                return endpoints.find(endpoint => endpoint.isSelected) || null;
            },
            isStreaming: false,
            setIsStreaming: (isStreaming) => set(() => ({ isStreaming })),
            isEndpointActive: false,
            setIsEndpointActive: (isActive) =>
                set(() => ({ isEndpointActive: isActive })),
            isEndpointLoading: true,
            setIsEndpointLoading: (isLoading) =>
                set(() => ({ isEndpointLoading: isLoading })),
            messages: [],
            setMessages: (messages) =>
                set((state) => ({
                    messages:
                        typeof messages === 'function'
                            ? messages(state.messages)
                            : messages
                })),
            hasStorage: false,
            setHasStorage: (hasStorage) => set(() => ({ hasStorage })),
            chatInputRef: { current: null },
            selectedEndpoint: 'http://localhost:7777',
            setSelectedEndpoint: (selectedEndpoint) =>
                set(() => ({ selectedEndpoint })),
            apiKey: '',
            setApiKey: (apiKey) => set(() => ({ apiKey })),
            agents: [],
            setAgents: (agents) => set({ agents }),
            routes: [
                {
                    value: 'liveness',
                    label: 'Liveness',
                    path: '/liveness',
                    description: 'Health check and monitoring route'
                },
                {
                    value: 'readiness',
                    label: 'Readiness',
                    path: '/Readiness',
                    description: 'Health check and monitoring route'
                }
            ],
            setRoutes: (routes) => set({ routes }),
            selectedModel: '',
            setSelectedModel: (selectedModel) => set(() => ({ selectedModel })),
            sessionsData: null,
            setSessionsData: (sessionsData) =>
                set((state) => ({
                    sessionsData:
                        typeof sessionsData === 'function'
                            ? sessionsData(state.sessionsData)
                            : sessionsData
                })),
            isSessionsLoading: false,
            setIsSessionsLoading: (isSessionsLoading) =>
                set(() => ({ isSessionsLoading }))
        }),
        {
            name: 'endpoint-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                selectedEndpoint: state.selectedEndpoint,
                apiKey: state.apiKey,
                userEndpoints: state.userEndpoints
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated?.();
            }
        }
    )
);
