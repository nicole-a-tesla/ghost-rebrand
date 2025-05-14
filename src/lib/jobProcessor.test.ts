import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { type Post } from '@tryghost/admin-api';
import { processPost, extractPostContent, processBatch, updateJobStatus } from './jobProcessor';

vi.mock('../lib/redis', () => ({
  getRedisClient: vi.fn()
}));

describe('processor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractPostContent', () => {
    it('extracts lexical content', () => {
      const post = {
        id: '1',
        lexical: 'lexical content',
      } as Post;

      const result = extractPostContent(post);

      expect(result).toEqual({
        content: 'lexical content',
        useMobiledoc: false
      });
    });

    it('should use mobiledoc when lexical is not available', () => {
      const post = {
        id: '1',
        mobiledoc: 'mobiledoc content'
      } as Post;

      const result = extractPostContent(post);

      expect(result).toEqual({
        content: 'mobiledoc content',
        useMobiledoc: true
      });
    });

    it('should return undefined when no content is available', () => {
      const post = {
        id: '1'
      } as Post;

      const result = extractPostContent(post);

      expect(result).toEqual({
        content: undefined,
        useMobiledoc: false
      });
    });
  });

  describe('processPost', () => {
    let mockGhostApi: any;

    beforeEach(() => {
      mockGhostApi = {
        posts: {
          edit: vi.fn()
        }
      };
    });

    it('should return failure and make no api edit call when post has no content', async () => {
      const post = { id: '1' } as Post;

      const result = await processPost(mockGhostApi, post, 'old', 'new');

      expect(result).toEqual({
        postId: '1',
        success: false
      });
      expect(mockGhostApi.posts.edit).not.toHaveBeenCalled();
    });

    it('should return success without calling ghostApi when post does not contain old name', async () => {
      const post = {
        id: '1',
        lexical: 'some content without the target'
      } as Post;

      const result = await processPost(mockGhostApi, post, 'old', 'new');

      expect(result).toEqual({
        postId: '1',
        success: true
      });
      expect(mockGhostApi.posts.edit).not.toHaveBeenCalled();
    });

    it('should successfully update post with lexical content', async () => {
      const post = {
        id: '1',
        lexical: 'content with old name',
        updated_at: '2023-12-01T00:00:00.000Z'
      } as Post;

      mockGhostApi.posts.edit.mockResolvedValue({});

      const result = await processPost(mockGhostApi, post, 'old', 'new');

      expect(mockGhostApi.posts.edit).toHaveBeenCalledWith({
        id: '1',
        updated_at: '2023-12-01T00:00:00.000Z',
        lexical: 'content with new name'
      });
      expect(result).toEqual({
        postId: '1',
        success: true
      });
    });

    it('should successfully update post title only', async () => {
      const post = {
        id: '1',
        title: 'title with old name',
        lexical: 'content with no target',
        updated_at: '2023-12-01T00:00:00.000Z'
      } as Post;

      mockGhostApi.posts.edit.mockResolvedValue({});

      const result = await processPost(mockGhostApi, post, 'old', 'new');

      expect(mockGhostApi.posts.edit).toHaveBeenCalledWith({
        id: '1',
        title: 'title with new name',
        updated_at: '2023-12-01T00:00:00.000Z',
      });
      expect(result).toEqual({
        postId: '1',
        success: true
      });
    });

    it('should successfully update post title and content', async () => {
      const post = {
        id: '1',
        title: 'title with old name',
        lexical: 'content with old name',
        updated_at: '2023-12-01T00:00:00.000Z'
      } as Post;

      mockGhostApi.posts.edit.mockResolvedValue({});

      const result = await processPost(mockGhostApi, post, 'old', 'new');

      expect(mockGhostApi.posts.edit).toHaveBeenCalledWith({
        id: '1',
        title: 'title with new name',
        lexical: 'content with new name',
        updated_at: '2023-12-01T00:00:00.000Z',
      });
      expect(result).toEqual({
        postId: '1',
        success: true
      });
    });

    it('should successfully update post with mobiledoc content', async () => {
      const post = {
        id: '1',
        mobiledoc: 'content with old name',
        updated_at: '2023-12-01T00:00:00.000Z'
      } as Post;

      mockGhostApi.posts.edit.mockResolvedValue({});
      const result = await processPost(mockGhostApi, post, 'old', 'new');

      expect(mockGhostApi.posts.edit).toHaveBeenCalledWith({
        id: '1',
        updated_at: '2023-12-01T00:00:00.000Z',
        mobiledoc: 'content with new name'
      });
      expect(result).toEqual({
        postId: '1',
        success: true
      });
    });

    it('should report failure on Ghost API error', async () => {
      const post = {
        id: '1',
        lexical: 'content with old name',
        updated_at: '2023-12-01T00:00:00.000Z'
      } as Post;

      mockGhostApi.posts.edit.mockRejectedValue(new Error('API Error'));

      const result = await processPost(mockGhostApi, post, 'old', 'new');

      expect(result).toEqual({
        postId: '1',
        success: false
      });
    });
  });

  describe('processBatch', () => {
    let mockGhostApi: any;

    beforeEach(() => {
      mockGhostApi = {
        posts: {
          edit: vi.fn()
        }
      };
    });

    it('should process multiple posts and categorize results', async () => {
      const posts = [
        { id: '1', lexical: 'content with old name' },
        { id: '2', lexical: 'content without target' },
        { id: '3', lexical: 'another old name here' },
        { id: '4' } // no content
      ] as Post[];

      mockGhostApi.posts.edit.mockResolvedValue({});
      const result = await processBatch(mockGhostApi, posts, 'old', 'new');

      expect(result.successfullyProcessed).toEqual(['1', '2', '3']);
      expect(result.processFailed).toEqual(['4']);
    });

    it('should handle partial failures in batch', async () => {
      const posts = [
        { id: '1', lexical: 'content with old name', updated_at: '2023-12-01T00:00:00.000Z' },
        { id: '2', lexical: 'content with old name', updated_at: '2023-12-01T00:00:00.000Z' }
      ] as Post[];

      mockGhostApi.posts.edit
        .mockResolvedValueOnce({}) // Success for first post
        .mockRejectedValueOnce(new Error('API Error')); // Failure for second post

      const result = await processBatch(mockGhostApi, posts, 'old', 'new');

      expect(result.successfullyProcessed).toEqual(['1']);
      expect(result.processFailed).toEqual(['2']);
    });
  });

  describe('updateJobStatus', () => {
    let mockRedisClient: any;

    beforeEach(() => {
      mockRedisClient = {
        sAdd: vi.fn()
      };
    });

    it('should update job status with successful and failed posts', async () => {
      const jobId = 'test-job-123';
      const successfullyProcessed = ['1', '2', '3'];
      const processFailed = ['4', '5'];

      await updateJobStatus(mockRedisClient, jobId, successfullyProcessed, processFailed);

      expect(mockRedisClient.sAdd).toHaveBeenCalledWith(
        'job:test-job-123:processedPosts',
        ['1', '2', '3']
      );
      expect(mockRedisClient.sAdd).toHaveBeenCalledWith(
        'job:test-job-123:failedPosts',
        ['4', '5']
      );
    });

    it('should not call Redis when no posts to update', async () => {
      const jobId = 'test-job-123';
      const successfullyProcessed: string[] = [];
      const processFailed: string[] = [];

      await updateJobStatus(mockRedisClient, jobId, successfullyProcessed, processFailed);

      expect(mockRedisClient.sAdd).not.toHaveBeenCalled();
    });
  });

})