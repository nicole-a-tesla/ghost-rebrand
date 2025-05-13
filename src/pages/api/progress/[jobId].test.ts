import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import { calculateJobStatus, fetchJobProgress } from './[jobId]';

vi.mock('~/lib/queue', () => ({
  default: vi.fn()
}));

vi.mock('~/lib/redis', () => ({
  getRedisClient: vi.fn()
}));

describe('/api/progress/[jobId]', () => {
  let req: NextApiRequest;
  let res: NextApiResponse;
  let mockRedis: any;
  let consoleSpy: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    mockRedis = {
      sCard: vi.fn(),
      sDiff: vi.fn(),
      get: vi.fn()
    };

    const { getRedisClient } = await import('~/lib/redis');
    
    vi.mocked(getRedisClient).mockResolvedValue(mockRedis);

    const { req: mockReq, res: mockRes } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { jobId: 'test-job-123' }
    });

    req = mockReq;
    res = mockRes;

     // Mock response methods
     res.write = vi.fn();
     res.end = vi.fn();
     res.setHeader = vi.fn();
 
     // Mock console methods
     consoleSpy = {
       error: vi.spyOn(console, 'error').mockImplementation(() => {}),
       log: vi.spyOn(console, 'log').mockImplementation(() => {})
     };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
    consoleSpy.error.mockRestore();
    consoleSpy.log.mockRestore();
  });
  describe('calculateJobStatus', () => {
    it('should return completed when all posts are processed', () => {
      expect(calculateJobStatus(10, 0, 10)).toBe('completed');
      expect(calculateJobStatus(10, 5, 15)).toBe('completed');
    });

    it('should return completed when completedCount equals totalPostCount', () => {
      expect(calculateJobStatus(10, 2, 10)).toBe('completed');
    });

    it('should return failed when no posts completed but all are processed', () => {
      expect(calculateJobStatus(0, 10, 10)).toBe('failed');
    });

    it('should return pending when no posts are processed', () => {
      expect(calculateJobStatus(0, 0, 10)).toBe('pending');
    });

    it('should return processing for partial completion', () => {
      expect(calculateJobStatus(5, 2, 10)).toBe('processing');
    });

    it('should return processing for partial completion but all are failed', () => {
      expect(calculateJobStatus(0, 0, 10)).toBe('pending');
    });

  });

  describe('fetchJobProgress', () => {
    beforeEach(() => {
      mockRedis.sCard.mockResolvedValue(5); // completedIdsCount
      mockRedis.sDiff.mockResolvedValue(['failed-id-1', 'failed-id-2']);
      mockRedis.get.mockResolvedValue(10); // totalPostCount
    });

    it('should fetch processed posts, failed posts, and the job data', async () => {
      await fetchJobProgress(mockRedis, 'test-job-123');
      
      expect(mockRedis.sCard).toHaveBeenCalledWith('job:test-job-123:processedPosts');
      expect(mockRedis.sDiff).toHaveBeenCalledWith(['job:test-job-123:failedPosts', 'job:test-job-123:processedPosts']);
      expect(mockRedis.get).toHaveBeenCalledWith('job:test-job-123');
    });

    it('reports job progress correctly', async () => {
      const result = await fetchJobProgress(mockRedis, 'test-job-123');
      
      expect(result).toEqual({
        totalPostCount: 10,
        completedIdCount: 5,
        failedIds: ['failed-id-1', 'failed-id-2'],
        status: 'processing'
      });
    });
  });

  // ran out of time to test. plan was to unit test handler next, then integration test of the endpoint
});