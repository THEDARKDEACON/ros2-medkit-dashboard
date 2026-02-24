import { useEffect, useRef, useCallback } from 'react';
import type { WorkerMessage, WorkerResponse } from '../workers/dataProcessor.worker';

/**
 * useWebWorker - Hook for using web workers with type safety
 * 
 * Manages the lifecycle of a web worker and provides a simple interface
 * for sending messages and receiving responses.
 * 
 * @param workerFactory - Function that creates a new Worker instance
 * @returns Tuple of [postMessage function, terminate function]
 * 
 * @example
 * ```tsx
 * const [processData, terminateWorker] = useWebWorker(
 *   () => new Worker(new URL('../workers/dataProcessor.worker.ts', import.meta.url))
 * );
 * 
 * const handleProcess = async () => {
 *   const result = await processData({
 *     type: 'COMPUTE_STATISTICS',
 *     data: [1, 2, 3, 4, 5],
 *   });
 *   console.log(result);
 * };
 * ```
 */
export function useWebWorker<TRequest = any, TResponse = any>(
  workerFactory: () => Worker
): [(message: Omit<WorkerMessage, 'requestId'>) => Promise<TResponse>, () => void] {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<Map<string, (value: TResponse) => void>>(new Map());
  const rejections = useRef<Map<string, (reason: any) => void>>(new Map());

  // Initialize worker
  useEffect(() => {
    workerRef.current = workerFactory();

    // Handle messages from worker
    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { requestId, data, error } = event.data;

      if (error) {
        const reject = rejections.current.get(requestId);
        if (reject) {
          reject(new Error(error));
          rejections.current.delete(requestId);
          pendingRequests.current.delete(requestId);
        }
      } else {
        const resolve = pendingRequests.current.get(requestId);
        if (resolve) {
          resolve(data);
          pendingRequests.current.delete(requestId);
          rejections.current.delete(requestId);
        }
      }
    };

    // Handle worker errors
    workerRef.current.onerror = (error) => {
      console.error('[WebWorker] Error:', error);
      // Reject all pending requests
      rejections.current.forEach((reject) => {
        reject(new Error('Worker error'));
      });
      pendingRequests.current.clear();
      rejections.current.clear();
    };

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      pendingRequests.current.clear();
      rejections.current.clear();
    };
  }, [workerFactory]);

  // Post message to worker
  const postMessage = useCallback(
    (message: Omit<WorkerMessage, 'requestId'>): Promise<TResponse> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'));
          return;
        }

        const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        pendingRequests.current.set(requestId, resolve);
        rejections.current.set(requestId, reject);

        const fullMessage: WorkerMessage = {
          ...message,
          requestId,
        } as WorkerMessage;

        workerRef.current.postMessage(fullMessage);
      });
    },
    []
  );

  // Terminate worker
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    pendingRequests.current.clear();
    rejections.current.clear();
  }, []);

  return [postMessage, terminate];
}
