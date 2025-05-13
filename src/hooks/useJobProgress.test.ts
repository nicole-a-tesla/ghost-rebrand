import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useJobProgress } from '../hooks/useJobProgress';

class MockEventSource {
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {}

  simulateMessage(data: any) {
    const event = new MessageEvent('message', { data: JSON.stringify(data) });
    this.onmessage?.(event);
  }
  simulateError() {
    this.onerror?.(new Event('error'));
  }

  close() {}
}

global.EventSource = MockEventSource as any;

describe('useJobProgress', () => {
  let mockEventSource: MockEventSource;

  beforeEach(() => {
    mockEventSource = new MockEventSource('/test-url');
    // expect error to avoid implementing entire interface on mock
    // @ts-expect-error
    vi.spyOn(global, 'EventSource').mockImplementation((url) => {
      // @ts-expect-error
      mockEventSource = new MockEventSource(url);
      return mockEventSource;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not create EventSource when not ready', () => {
    renderHook(() => useJobProgress('test-job-id', false));
    expect(global.EventSource).not.toHaveBeenCalled();
  });

  it('should not create EventSource when jobId is undefined', () => {
    renderHook(() => useJobProgress(undefined, true));
    expect(global.EventSource).not.toHaveBeenCalled();
  });

  it('should create EventSource with correct URL', async () => {
    renderHook(() => useJobProgress('test-job-id', true));
    expect(global.EventSource).toHaveBeenCalledWith('/api/progress/test-job-id');
  });

  it('should handle connection opening', async () => {
    const { result } = renderHook(() => useJobProgress('test-job-id', true));

    await act(async () => {
      mockEventSource.onopen?.(new Event('open'));
    });

    expect(result.current.connected).toBe(true)
    expect(result.current.error).toBe(null);
  });

  it('should handle incoming messages', async () => {
    const { result } = renderHook(() => useJobProgress('test-job-id', true));

    const testData = {
      status: 'processing',
      totalPostCount: 100,
      completedIdCount: 50,
      failedIds: []
    };

    await act(async () => {
      mockEventSource.simulateMessage(testData);
    });

    expect(result.current.jobState).toEqual(testData);
  });

  it('should handle error messages', async () => {
    const { result } = renderHook(() => useJobProgress('test-job-id', true));

    const errorData = { error: 'Test error message' };

    await act(async () => {
      mockEventSource.simulateMessage(errorData);
    });

    expect(result.current.error).toBe('Test error message');
  });

  it('should handle completed status', async () => {
    const { result } = renderHook(() => useJobProgress('test-job-id', true));

    const completedData = {
      status: 'completed',
      totalPostCount: 100,
      completedIdCount: 100,
      failedIds: []
    };

    await act(async () => {
      mockEventSource.simulateMessage(completedData);
    });

    expect(result.current.jobState.status).toBe('completed');
    expect(result.current.connected).toBe(false);
  });

  it('should handle connection errors', async () => {
    const { result } = renderHook(() => useJobProgress('test-job-id', true));

    await act(async () => {
      mockEventSource.simulateError();
    });

    expect(result.current.connected).toBe(false);
    expect(result.current.error).toBe('Error connecting to server');
  });
})