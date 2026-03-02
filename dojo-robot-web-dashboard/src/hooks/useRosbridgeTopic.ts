/**
 * useRosbridgeTopic Hook
 *
 * React hook for subscribing to a rosbridge topic.
 * Manages subscription lifecycle and provides the latest message data.
 *
 * Usage:
 * ```tsx
 * const { data, isConnected, error } = useRosbridgeTopic<OccupancyGrid>(
 *   '/map',
 *   { type: 'nav_msgs/OccupancyGrid', throttleRate: 1000 }
 * );
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRosbridgeStore } from '../features/stores/rosbridgeStore';

interface UseRosbridgeTopicOptions {
    /** ROS message type (e.g., 'nav_msgs/OccupancyGrid'). Optional — rosbridge can infer. */
    type?: string;
    /** Minimum ms between messages (throttling). Default: 0 (no throttle). */
    throttleRate?: number;
    /** Queue length for buffered messages. Default: 1 (latest only). */
    queueLength?: number;
    /** Whether the subscription is enabled. Default: true. */
    enabled?: boolean;
}

interface UseRosbridgeTopicResult<T> {
    /** Latest message data, or undefined if no message received yet */
    data: T | undefined;
    /** Whether the rosbridge connection is active */
    isConnected: boolean;
    /** Timestamp of the last received message */
    lastUpdate: number | undefined;
    /** Number of messages received */
    messageCount: number;
    /** Any error from the subscription */
    error: string | undefined;
}

export function useRosbridgeTopic<T = unknown>(
    topic: string,
    options: UseRosbridgeTopicOptions = {}
): UseRosbridgeTopicResult<T> {
    const { type, throttleRate, queueLength = 1, enabled = true } = options;

    const [data, setData] = useState<T | undefined>(undefined);
    const [lastUpdate, setLastUpdate] = useState<number | undefined>(undefined);
    const [messageCount, setMessageCount] = useState(0);
    const [error, setError] = useState<string | undefined>(undefined);

    const status = useRosbridgeStore((s) => s.status);
    const getClient = useRosbridgeStore((s) => s.getClient);
    const isConnected = status === 'connected';

    // Track message count with ref to avoid re-renders on every message
    const countRef = useRef(0);

    const handleMessage = useCallback((msg: unknown) => {
        try {
            setData(msg as T);
            setLastUpdate(Date.now());
            countRef.current += 1;
            setMessageCount(countRef.current);
            setError(undefined);
        } catch (err) {
            setError(`Failed to process message: ${err}`);
        }
    }, []);

    useEffect(() => {
        if (!enabled || !topic || !isConnected) {
            return;
        }

        const client = getClient();
        const unsub = client.subscribe(topic, handleMessage, {
            type,
            throttleRate,
            queueLength,
        });

        return () => {
            unsub();
        };
    }, [topic, type, throttleRate, queueLength, enabled, isConnected, getClient, handleMessage]);

    // Reset data when topic changes
    useEffect(() => {
        setData(undefined);
        setLastUpdate(undefined);
        countRef.current = 0;
        setMessageCount(0);
        setError(undefined);
    }, [topic]);

    return {
        data,
        isConnected,
        lastUpdate,
        messageCount,
        error,
    };
}

/**
 * useRosbridgeTopics Hook
 *
 * Convenience hook to subscribe to multiple topics at once.
 * Returns a map of topic → latest message.
 */
export function useRosbridgeTopics(
    topics: Array<{ topic: string; type?: string; throttleRate?: number }>,
    enabled = true
): Map<string, unknown> {
    const [dataMap, setDataMap] = useState<Map<string, unknown>>(new Map());

    const status = useRosbridgeStore((s) => s.status);
    const getClient = useRosbridgeStore((s) => s.getClient);
    const isConnected = status === 'connected';

    useEffect(() => {
        if (!enabled || !isConnected || topics.length === 0) {
            return;
        }

        const client = getClient();
        const unsubs: Array<() => void> = [];

        topics.forEach(({ topic, type, throttleRate }) => {
            const unsub = client.subscribe(topic, (msg: unknown) => {
                setDataMap((prev) => {
                    const next = new Map(prev);
                    next.set(topic, msg);
                    return next;
                });
            }, { type, throttleRate });
            unsubs.push(unsub);
        });

        return () => {
            unsubs.forEach((unsub) => unsub());
        };
    }, [topics, enabled, isConnected, getClient]);

    return dataMap;
}
