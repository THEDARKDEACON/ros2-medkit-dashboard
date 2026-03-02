/**
 * Rosbridge v2.0 Protocol Client
 *
 * Implements the rosbridge v2.0 protocol for direct communication
 * with any ROS2 robot running rosbridge_server.
 *
 * Protocol spec: https://github.com/RobotWebTools/rosbridge_suite/blob/ros2/ROSBRIDGE_PROTOCOL.md
 *
 * Supports:
 * - Topic subscription with throttling and queue management
 * - Topic publishing
 * - Service calls
 * - Topic/service discovery via rosapi
 * - Automatic reconnection with exponential backoff
 */

import { createReconnectionManager, type ReconnectionManager } from '../api/reconnection';

// ─── Protocol Message Types ────────────────────────────────────────────────

export interface RosbridgeSubscribeMsg {
    op: 'subscribe';
    id?: string;
    topic: string;
    type?: string;
    throttle_rate?: number;
    queue_length?: number;
    fragment_size?: number;
    compression?: string;
}

export interface RosbridgeUnsubscribeMsg {
    op: 'unsubscribe';
    id?: string;
    topic: string;
}

export interface RosbridgePublishMsg {
    op: 'publish';
    id?: string;
    topic: string;
    msg: unknown;
}

export interface RosbridgeAdvertiseMsg {
    op: 'advertise';
    id?: string;
    topic: string;
    type: string;
}

export interface RosbridgeUnadvertiseMsg {
    op: 'unadvertise';
    id?: string;
    topic: string;
}

export interface RosbridgeCallServiceMsg {
    op: 'call_service';
    id?: string;
    service: string;
    args?: unknown[];
    fragment_size?: number;
    compression?: string;
    timeout?: number;
}

export interface RosbridgeServiceResponseMsg {
    op: 'service_response';
    id?: string;
    service: string;
    values?: unknown;
    result: boolean;
}

export interface RosbridgeTopicMsg {
    op: 'publish';
    topic: string;
    msg: unknown;
}

export interface RosbridgeStatusMsg {
    op: 'status';
    level: 'info' | 'warning' | 'error' | 'none';
    msg: string;
    id?: string;
}

// ─── Subscription Management ───────────────────────────────────────────────

export type TopicCallback<T = unknown> = (msg: T) => void;

interface Subscription {
    topic: string;
    type?: string;
    throttleRate?: number;
    callbacks: Set<TopicCallback>;
}

interface PendingServiceCall {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
}

// ─── Topic Info ────────────────────────────────────────────────────────────

export interface TopicInfo {
    name: string;
    type: string;
}

export interface ServiceInfo {
    name: string;
    type: string;
}

// ─── Connection Events ─────────────────────────────────────────────────────

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

export type ConnectionEventCallback = (status: ConnectionStatus) => void;

// ─── Client Configuration ──────────────────────────────────────────────────

export interface RosbridgeClientConfig {
    /** WebSocket URL, e.g. ws://localhost:9090 */
    url: string;
    /** Max reconnection attempts before giving up (default: 5) */
    maxReconnectAttempts?: number;
    /** Base delay for exponential backoff in ms (default: 1000) */
    baseReconnectDelay?: number;
    /** Max delay for exponential backoff in ms (default: 16000) */
    maxReconnectDelay?: number;
    /** Service call timeout in ms (default: 10000) */
    serviceTimeout?: number;
}

// ─── RosbridgeClient ───────────────────────────────────────────────────────

/**
 * Rosbridge v2.0 WebSocket Client
 *
 * Usage:
 * ```ts
 * const client = new RosbridgeClient({ url: 'ws://robot:9090' });
 * client.connect();
 *
 * // Subscribe to a topic
 * const unsub = client.subscribe('/map', (msg) => {
 *   console.log('Map update:', msg);
 * }, { type: 'nav_msgs/OccupancyGrid', throttleRate: 1000 });
 *
 * // Publish to a topic
 * client.publish('/cmd_vel', 'geometry_msgs/Twist', {
 *   linear: { x: 0.5, y: 0, z: 0 },
 *   angular: { x: 0, y: 0, z: 0.1 }
 * });
 *
 * // Call a service
 * const result = await client.callService('/rosapi/topics');
 *
 * // Discover topics
 * const topics = await client.getTopics();
 * ```
 */
export class RosbridgeClient {
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectionManager: ReconnectionManager;
    private maxReconnectAttempts: number;
    private serviceTimeout: number;
    private isManuallyDisconnected = false;

    // Subscription management
    private subscriptions: Map<string, Subscription> = new Map();
    private idCounter = 0;

    // Service call management
    private pendingServiceCalls: Map<string, PendingServiceCall> = new Map();

    // Connection event listeners
    private connectionListeners: Set<ConnectionEventCallback> = new Set();
    private _status: ConnectionStatus = 'disconnected';

    // Message queue for when connection is not yet ready
    private messageQueue: string[] = [];

    constructor(config: RosbridgeClientConfig) {
        this.url = config.url;
        this.maxReconnectAttempts = config.maxReconnectAttempts ?? 5;
        this.serviceTimeout = config.serviceTimeout ?? 10000;
        this.reconnectionManager = createReconnectionManager({
            baseDelay: config.baseReconnectDelay ?? 1000,
            maxDelay: config.maxReconnectDelay ?? 16000,
            maxAttempts: this.maxReconnectAttempts,
        });
    }

    // ─── Connection ────────────────────────────────────────────────────────

    /** Connect to the rosbridge server */
    connect(): void {
        if (this.ws) {
            this.disconnect();
        }

        this.isManuallyDisconnected = false;
        this.setStatus('connecting');

        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('[Rosbridge] Connected to', this.url);
                this.reconnectionManager.reset();
                this.setStatus('connected');
                this.flushMessageQueue();
                this.resubscribeAll();
            };

            this.ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    this.handleMessage(msg);
                } catch (error) {
                    console.error('[Rosbridge] Failed to parse message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('[Rosbridge] Connection error:', error);
            };

            this.ws.onclose = () => {
                console.log('[Rosbridge] Disconnected');
                if (!this.isManuallyDisconnected) {
                    this.handleReconnection();
                } else {
                    this.setStatus('disconnected');
                }
            };
        } catch (error) {
            console.error('[Rosbridge] Failed to create WebSocket:', error);
            this.setStatus('failed');
        }
    }

    /** Disconnect from the rosbridge server */
    disconnect(): void {
        this.isManuallyDisconnected = true;
        this.reconnectionManager.cancel();

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        // Reject all pending service calls
        this.pendingServiceCalls.forEach((call) => {
            clearTimeout(call.timeout);
            call.reject(new Error('Disconnected'));
        });
        this.pendingServiceCalls.clear();

        this.setStatus('disconnected');
        console.log('[Rosbridge] Disconnected');
    }

    /** Update the connection URL (disconnects if currently connected) */
    setUrl(url: string): void {
        const wasConnected = this.isConnected();
        if (wasConnected) {
            this.disconnect();
        }
        this.url = url;
        if (wasConnected) {
            this.connect();
        }
    }

    /** Get the current connection URL */
    getUrl(): string {
        return this.url;
    }

    /** Check if currently connected */
    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    /** Get the current connection status */
    get status(): ConnectionStatus {
        return this._status;
    }

    /** Listen for connection status changes */
    onStatusChange(callback: ConnectionEventCallback): () => void {
        this.connectionListeners.add(callback);
        return () => {
            this.connectionListeners.delete(callback);
        };
    }

    // ─── Topic Subscription ────────────────────────────────────────────────

    /**
     * Subscribe to a ROS topic
     *
     * @param topic - Topic name (e.g., '/map', '/odom')
     * @param callback - Callback invoked with each message
     * @param options - Subscription options
     * @returns Unsubscribe function
     */
    subscribe<T = unknown>(
        topic: string,
        callback: TopicCallback<T>,
        options?: {
            type?: string;
            throttleRate?: number;
            queueLength?: number;
        }
    ): () => void {
        const existing = this.subscriptions.get(topic);

        if (existing) {
            // Add callback to existing subscription
            existing.callbacks.add(callback as TopicCallback);
        } else {
            // Create new subscription
            const sub: Subscription = {
                topic,
                type: options?.type,
                throttleRate: options?.throttleRate,
                callbacks: new Set([callback as TopicCallback]),
            };
            this.subscriptions.set(topic, sub);

            // Send subscribe message to rosbridge
            this.sendMessage({
                op: 'subscribe',
                id: `sub_${topic}_${this.nextId()}`,
                topic,
                type: options?.type,
                throttle_rate: options?.throttleRate,
                queue_length: options?.queueLength,
            } as RosbridgeSubscribeMsg);
        }

        // Return unsubscribe function
        return () => {
            this.unsubscribeCallback(topic, callback as TopicCallback);
        };
    }

    /** Unsubscribe a specific callback from a topic */
    private unsubscribeCallback(topic: string, callback: TopicCallback): void {
        const sub = this.subscriptions.get(topic);
        if (!sub) return;

        sub.callbacks.delete(callback);

        // If no more callbacks, fully unsubscribe
        if (sub.callbacks.size === 0) {
            this.subscriptions.delete(topic);
            this.sendMessage({
                op: 'unsubscribe',
                topic,
            } as RosbridgeUnsubscribeMsg);
        }
    }

    // ─── Publishing ────────────────────────────────────────────────────────

    /**
     * Publish a message to a ROS topic
     *
     * @param topic - Topic name
     * @param type - ROS message type (e.g., 'geometry_msgs/Twist')
     * @param msg - Message payload
     */
    publish(topic: string, type: string, msg: unknown): void {
        // Advertise first if needed
        this.sendMessage({
            op: 'advertise',
            topic,
            type,
        } as RosbridgeAdvertiseMsg);

        this.sendMessage({
            op: 'publish',
            topic,
            msg,
        } as RosbridgePublishMsg);
    }

    // ─── Service Calls ─────────────────────────────────────────────────────

    /**
     * Call a ROS service
     *
     * @param service - Service name (e.g., '/rosapi/topics')
     * @param args - Service arguments
     * @returns Promise resolving with the service response
     */
    callService(service: string, args?: unknown[]): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const id = `svc_${this.nextId()}`;

            const timeout = setTimeout(() => {
                this.pendingServiceCalls.delete(id);
                reject(new Error(`Service call timed out: ${service}`));
            }, this.serviceTimeout);

            this.pendingServiceCalls.set(id, { resolve, reject, timeout });

            this.sendMessage({
                op: 'call_service',
                id,
                service,
                args,
            } as RosbridgeCallServiceMsg);
        });
    }

    // ─── Discovery ─────────────────────────────────────────────────────────

    /**
     * Get all available topics on the robot
     *
     * Uses the `/rosapi/topics` service provided by rosbridge_suite.
     */
    async getTopics(): Promise<TopicInfo[]> {
        try {
            const result = await this.callService('/rosapi/topics') as {
                topics: string[];
                types: string[];
            };

            return result.topics.map((name: string, i: number) => ({
                name,
                type: result.types[i] || 'unknown',
            }));
        } catch (error) {
            console.error('[Rosbridge] Failed to get topics:', error);
            return [];
        }
    }

    /**
     * Get all available services on the robot
     *
     * Uses the `/rosapi/services` service provided by rosbridge_suite.
     */
    async getServices(): Promise<ServiceInfo[]> {
        try {
            const result = await this.callService('/rosapi/services') as {
                services?: string[];
                types?: string[];
            };

            const services = result?.services || [];
            const types = result?.types || [];

            return services.map((name: string, i: number) => ({
                name,
                type: types[i] || 'unknown',
            }));
        } catch (error) {
            console.error('[Rosbridge] Failed to get services:', error);
            return [];
        }
    }

    /**
     * Get the message type for a specific topic
     */
    async getTopicType(topic: string): Promise<string | null> {
        try {
            const result = await this.callService('/rosapi/topic_type', [topic]) as { type: string };
            return result.type;
        } catch {
            return null;
        }
    }

    // ─── Internal ──────────────────────────────────────────────────────────

    /** Handle incoming rosbridge message */
    private handleMessage(msg: Record<string, unknown>): void {
        switch (msg.op) {
            case 'publish': {
                // Incoming topic message
                const topic = msg.topic as string;
                const sub = this.subscriptions.get(topic);
                if (sub) {
                    sub.callbacks.forEach((cb) => {
                        try {
                            cb(msg.msg);
                        } catch (error) {
                            console.error(`[Rosbridge] Error in callback for ${topic}:`, error);
                        }
                    });
                }
                break;
            }

            case 'service_response': {
                const id = msg.id as string;
                const pending = this.pendingServiceCalls.get(id);
                if (pending) {
                    clearTimeout(pending.timeout);
                    this.pendingServiceCalls.delete(id);

                    if (msg.result) {
                        pending.resolve(msg.values);
                    } else {
                        pending.reject(new Error(`Service call failed: ${JSON.stringify(msg.values)}`));
                    }
                }
                break;
            }

            case 'status': {
                const statusMsg = msg as unknown as RosbridgeStatusMsg;
                if (statusMsg.level === 'error') {
                    console.error('[Rosbridge] Server error:', statusMsg.msg);
                } else if (statusMsg.level === 'warning') {
                    console.warn('[Rosbridge] Server warning:', statusMsg.msg);
                }
                break;
            }

            default:
                // Unknown op, ignore
                break;
        }
    }

    /** Send a message over the WebSocket */
    private sendMessage(msg: Record<string, unknown>): void {
        const json = JSON.stringify(msg);

        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(json);
        } else {
            this.messageQueue.push(json);
        }
    }

    /** Flush queued messages */
    private flushMessageQueue(): void {
        while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift()!;
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(msg);
            }
        }
    }

    /** Re-subscribe to all topics after reconnection */
    private resubscribeAll(): void {
        this.subscriptions.forEach((sub) => {
            this.sendMessage({
                op: 'subscribe',
                id: `sub_${sub.topic}_${this.nextId()}`,
                topic: sub.topic,
                type: sub.type,
                throttle_rate: sub.throttleRate,
            } as RosbridgeSubscribeMsg);
        });
    }

    /** Handle reconnection with exponential backoff */
    private async handleReconnection(): Promise<void> {
        const attempts = this.reconnectionManager.getAttempts();

        if (attempts >= this.maxReconnectAttempts) {
            console.error('[Rosbridge] Max reconnection attempts reached');
            this.setStatus('failed');
            return;
        }

        this.setStatus('reconnecting');

        const state = this.reconnectionManager.getState();
        console.log(
            `[Rosbridge] Reconnecting in ${state.nextDelay}ms (attempt ${state.attempts + 1}/${this.maxReconnectAttempts})`
        );

        try {
            await this.reconnectionManager.scheduleReconnection();
            if (!this.isManuallyDisconnected) {
                this.connect();
            }
        } catch (error) {
            console.error('[Rosbridge] Reconnection scheduling failed:', error);
            this.setStatus('failed');
        }
    }

    /** Update and broadcast connection status */
    private setStatus(status: ConnectionStatus): void {
        this._status = status;
        this.connectionListeners.forEach((cb) => {
            try {
                cb(status);
            } catch (error) {
                console.error('[Rosbridge] Error in status listener:', error);
            }
        });
    }

    /** Generate unique IDs */
    private nextId(): string {
        return `${++this.idCounter}`;
    }

    /** Get subscription count */
    getSubscriptionCount(): number {
        return this.subscriptions.size;
    }

    /** Get list of subscribed topics */
    getSubscribedTopics(): string[] {
        return Array.from(this.subscriptions.keys());
    }
}

// ─── Singleton ─────────────────────────────────────────────────────────────

let clientInstance: RosbridgeClient | null = null;

/**
 * Get or create the singleton RosbridgeClient
 * Default URL: ws://localhost:9090
 */
export function getRosbridgeClient(url?: string): RosbridgeClient {
    if (!clientInstance) {
        clientInstance = new RosbridgeClient({
            url: url || 'ws://localhost:9090',
        });
    }
    return clientInstance;
}

/**
 * Reset the singleton client (useful for testing or URL changes)
 */
export function resetRosbridgeClient(): void {
    if (clientInstance) {
        clientInstance.disconnect();
        clientInstance = null;
    }
}
