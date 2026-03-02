/**
 * Rosbridge Connection Store
 *
 * Zustand store managing rosbridge connection state,
 * discovered topics, and connection preferences.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    RosbridgeClient,
    getRosbridgeClient,
    resetRosbridgeClient,
    type TopicInfo,
    type ServiceInfo,
    type ConnectionStatus,
} from '../realtime/rosbridgeClient';

interface RosbridgeState {
    // Connection
    url: string;
    status: ConnectionStatus;
    reconnectAttempts: number;

    // Discovery
    topics: TopicInfo[];
    services: ServiceInfo[];
    isDiscovering: boolean;

    // Preferences
    autoConnect: boolean;

    // Actions
    setUrl: (url: string) => void;
    connect: () => void;
    disconnect: () => void;
    setStatus: (status: ConnectionStatus) => void;
    discoverTopics: () => Promise<void>;
    discoverServices: () => Promise<void>;
    setAutoConnect: (auto: boolean) => void;
    getClient: () => RosbridgeClient;
}

export const useRosbridgeStore = create<RosbridgeState>()(
    persist(
        (set, get) => ({
            // Initial state
            url: 'ws://localhost:9090',
            status: 'disconnected',
            reconnectAttempts: 0,
            topics: [],
            services: [],
            isDiscovering: false,
            autoConnect: false,

            setUrl: (url: string) => {
                set({ url });
                const client = getRosbridgeClient();
                client.setUrl(url);
            },

            connect: () => {
                const { url } = get();
                // Reset the client with the current URL
                resetRosbridgeClient();
                const client = getRosbridgeClient(url);

                // Listen for status changes
                client.onStatusChange((status) => {
                    set({ status });

                    // Auto-discover topics on connect
                    if (status === 'connected') {
                        get().discoverTopics();
                        get().discoverServices();
                    }
                });

                client.connect();
            },

            disconnect: () => {
                const client = getRosbridgeClient();
                client.disconnect();
                set({ status: 'disconnected', topics: [], services: [] });
            },

            setStatus: (status: ConnectionStatus) => {
                set({ status });
            },

            discoverTopics: async () => {
                set({ isDiscovering: true });
                try {
                    const client = getRosbridgeClient();
                    const topics = await client.getTopics();
                    set({ topics, isDiscovering: false });
                } catch (error) {
                    console.error('[RosbridgeStore] Failed to discover topics:', error);
                    set({ isDiscovering: false });
                }
            },

            discoverServices: async () => {
                try {
                    const client = getRosbridgeClient();
                    const services = await client.getServices();
                    set({ services });
                } catch (error) {
                    console.error('[RosbridgeStore] Failed to discover services:', error);
                }
            },

            setAutoConnect: (auto: boolean) => {
                set({ autoConnect: auto });
            },

            getClient: () => {
                return getRosbridgeClient(get().url);
            },
        }),
        {
            name: 'rosbridge-storage',
            partialize: (state) => ({
                url: state.url,
                autoConnect: state.autoConnect,
            }),
        }
    )
);
