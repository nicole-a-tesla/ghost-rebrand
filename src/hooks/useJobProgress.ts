import { useState, useRef, useEffect } from 'react';

export interface JobState {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalPostCount: number | null;
  completedIdCount: number;
  failedIds: string[];
}

export interface UseJobProgressReturn {
  jobState: JobState;
  connected: boolean;
  error: string | null;
}

export function useJobProgress(jobId: string | string[] | undefined, isReady: boolean): UseJobProgressReturn {
  const [jobState, setJobState] = useState<JobState>({
    status: 'pending',
    totalPostCount: null,
    completedIdCount: 0,
    failedIds: []
  });
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isReady || !jobId) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/progress/${jobId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.error) {
          setError(data.error);
          return;
        }

        setJobState(data);

        if (data.status === 'completed') {
          eventSource.close();
          setConnected(false);
        }
      } catch (error) {
        setError(`Error parsing event data: ${error}`);
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
      setError('Error connecting to server');
    }

    // cleanup
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [isReady, jobId]);

  return { jobState, connected, error };
}