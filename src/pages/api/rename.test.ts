import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';

import handler, {
  validateRequestFields,
  addJobsToQueue,
  handleRenameKickoff
} from './rename';
import { type RequestBody } from './rename';

describe('/api/rename', () => {
  describe('validateRequestFields', () => {
    it('should return empty array for valid body', () => {
      const body = {
        siteUrl: 'https://test.ghost.io',
        apiKey: 'test-key',
        oldName: 'old',
        newName: 'new'
      };

      const result = validateRequestFields(body);
      expect(result).toEqual([]);
    });

    it('should return missing fields', () => {
      const body = {
        siteUrl: 'https://test.ghost.io',
        oldName: 'old'
      };

      const result = validateRequestFields(body);
      expect(result).toEqual(['apiKey', 'newName']);
    });

    it('should handle empty/falsy fields', () => {
      const body = {
        siteUrl: '',
        apiKey: null,
        oldName: 'old',
        newName: 'new'
      };

      const result = validateRequestFields(body);
      expect(result).toEqual(['siteUrl', 'apiKey']);
    });
  });

  describe('addJobsToQueue', () => {
    let mockQueue: any;

    beforeEach(async () => {
      vi.clearAllMocks();
      mockQueue = { add: vi.fn() };
    });

    it('should add all pages to queue', async () => {
      const jobData = {
        jobId: 'test-job-123',
        siteUrl: 'https://test.ghost.io',
        apiKey: 'test-key',
        oldName: 'old',
        newName: 'new',
        batchSize: 5
      };

      mockQueue.add.mockResolvedValue({});

      await addJobsToQueue(jobData, 3, mockQueue);

      expect(mockQueue.add).toHaveBeenCalledTimes(3);
      expect(mockQueue.add).toHaveBeenNthCalledWith(
        1,
        { ...jobData, page: 1 },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000
          }
        }
      );
      expect(mockQueue.add).toHaveBeenNthCalledWith(
        2,
        { ...jobData, page: 2 },
        expect.any(Object)
      );
      expect(mockQueue.add).toHaveBeenNthCalledWith(
        3,
        { ...jobData, page: 3 },
        expect.any(Object)
      );
    });

    it('should handle queue addition failures', async () => {
      const jobData = {
        jobId: 'test-job-123',
        siteUrl: 'https://test.ghost.io',
        apiKey: 'test-key',
        oldName: 'old',
        newName: 'new',
        batchSize: 5
      };

      mockQueue.add.mockRejectedValue(new Error('Queue error'));

      await expect(addJobsToQueue(jobData, 1, mockQueue)).rejects.toThrow('Queue error');
    });
  });

  describe('handlerRenameKickoff', () => {
    let mockGhostApi: any;
    let mockRedis: any;
    let mockQueue: any;
    
    const testRequestBody: RequestBody = {
      siteUrl: 'https://test.ghost.io',
      apiKey: 'test-api-key',
      oldName: 'Old Brand',
      newName: 'New Brand'
    };
    
    const testJobId = 'test-job-id-123';
    const totalPostCount = 27;

    beforeEach(() => {
      vi.clearAllMocks();
      
      mockGhostApi = {
        posts: {
          browse: vi.fn()
        }
      };
      
      mockRedis = {
        set: vi.fn()
      };
      
      mockQueue = {
        add: vi.fn().mockResolvedValue({ id: 'queue-job-id' })
      };

      mockGhostApi.posts.browse.mockResolvedValue({
        meta: {
          pagination: {
            total: totalPostCount
          }
        }
      });
      
      mockRedis.set.mockResolvedValue('OK');
    });

    it('calls ghost api for total post count', async () => {
      await handleRenameKickoff(
        testRequestBody,
        mockGhostApi,
        testJobId,
        mockRedis,
        mockQueue
      );

      expect(mockGhostApi.posts.browse).toHaveBeenCalledWith({ limit: 1 });
    });

    it('sets job up in redis', async () => {
      await handleRenameKickoff(
        testRequestBody,
        mockGhostApi,
        testJobId,
        mockRedis,
        mockQueue
      );

      expect(mockRedis.set).toHaveBeenCalledWith(
        `job:${testJobId}`,
        totalPostCount,
        { EX: 24 * 60 * 60 }
      );
    });

    it('sends pages to queue for processing', async () => {
      const expectedTotalPages = Math.ceil(totalPostCount / 5); // 6 pages
      
      await handleRenameKickoff(
        testRequestBody,
        mockGhostApi,
        testJobId,
        mockRedis,
        mockQueue
      );

      // queue.add was called the correct number of times
      expect(mockQueue.add).toHaveBeenCalledTimes(expectedTotalPages);
      
      // verify the first queue job
      expect(mockQueue.add).toHaveBeenNthCalledWith(
        1,
        {
          jobId: testJobId,
          siteUrl: testRequestBody.siteUrl,
          apiKey: testRequestBody.apiKey,
          oldName: testRequestBody.oldName,
          newName: testRequestBody.newName,
          batchSize: 5,
          page: 1
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000
          }
        }
      );
    });

    it('should handle edge case with 0 posts', async () => {
      mockGhostApi.posts.browse.mockResolvedValue({
        meta: {
          pagination: {
            total: 0
          }
        }
      });
      
      mockRedis.set.mockResolvedValue('OK');

      await handleRenameKickoff(
        testRequestBody,
        mockGhostApi,
        testJobId,
        mockRedis,
        mockQueue
      );

      // make a job entry so that they can see the a working progress page
      // TODO specific error message for this case
      expect(mockRedis.set).toHaveBeenCalledWith(`job:${testJobId}`, 0, { EX: 24 * 60 * 60 });
      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });
});