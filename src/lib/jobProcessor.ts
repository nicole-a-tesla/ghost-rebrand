import { getQueue } from './queue';
import { getRedisClient } from './redis';
import GhostAdminApi, { type Post } from '@tryghost/admin-api';
import { findAndReplaceAll } from './utils';
import type { RedisClientType } from '@redis/client';

const CONCURRENCY = 5;

interface JobData {
  jobId: string;
  siteUrl: string;
  apiKey: string;
  oldName: string;
  newName: string;
  batchSize: number;
  page: number;
}

interface ProcessPostResult {
  postId: string;
  success: boolean;
};

const getReplacementStringOrNull = (
  currentValue: string|undefined,
  oldName: string,
  newName: string
): string | null => {
  const exists = currentValue !== undefined;
  const includesTarget = exists && currentValue.includes(oldName);
  if (includesTarget) {
    return findAndReplaceAll(currentValue, oldName, newName)
  }
  return null;
}

export const processPost = async (
  ghostApi: GhostAdminApi,
  post: Post,
  oldName: string,
  newName: string
) => {
    const result = { postId: post.id, success: false } as ProcessPostResult;
    const { content, useMobiledoc } = extractPostContent(post);

    if (content === undefined && post.title === undefined) {
      // received no content to process, mark as failed
      return result;
    }

    const newContent = getReplacementStringOrNull(content, oldName, newName);
    const newTitle = getReplacementStringOrNull(post.title, oldName, newName);

    if (!newContent && !newTitle) {
      // noop, mark success and move on
      result.success = true;
      return result;
    }

    const newData = {
      id: post.id,
      updated_at: post.updated_at
    }

    if (newContent) {
      useMobiledoc
        ? newData.mobiledoc = newContent
        : newData.lexical = newContent;
    }

    if (newTitle) {
      newData.title = newTitle;
    }

    try {
      await ghostApi.posts.edit(newData);
      result.success = true;
      return result;
    } catch (error) {
      // Log error for debugging but don't throw
      console.error(`Failed to update post ${post.id}:`, error);
      return result;
    }
}

export const extractPostContent = (post: Post): { content?: string, useMobiledoc: boolean } => {
  if (post.lexical !== undefined) {
    return { content: post.lexical, useMobiledoc: false };
  } else if (post.mobiledoc !== undefined) {
    return { content: post.mobiledoc, useMobiledoc: true };
  }
  return { content: undefined, useMobiledoc: false };
}

export const processBatch = async (
  ghostApi: GhostAdminApi,
  posts: Post[],
  oldName: string,
  newName: string
): Promise<{ successfullyProcessed: string[]; processFailed: string[] }> => {
  const successfullyProcessed: string[] = [];
  const processFailed: string[] = [];

  for (const post of posts) {
    const result = await processPost(ghostApi, post, oldName, newName);
    if (result.success) {
      successfullyProcessed.push(result.postId);
    } else {
      processFailed.push(result.postId);
    }
  }

  return { successfullyProcessed, processFailed };
};

export const updateJobStatus = async (
  redis: RedisClientType,
  jobId: string,
  successfullyProcessed: string[],
  processFailed: string[]
): Promise<void> => {
  if (successfullyProcessed.length > 0) {
    await redis.sAdd(`job:${jobId}:processedPosts`, successfullyProcessed);
  }

  if (processFailed.length > 0) {
    await redis.sAdd(`job:${jobId}:failedPosts`, processFailed);
  }
};

export const setupQueueProcessor = async () => {
  const queue = getQueue();

  await queue.process(CONCURRENCY, async (job) => {
    const {
      jobId,
      siteUrl,
      apiKey,
      oldName,
      newName,
      batchSize,
      page,
    } = job.data as JobData;
    try {
      const ghostApi = new GhostAdminApi({
        url: siteUrl,
        key: apiKey,
        version: 'v5.0',
      });
      const redis = await getRedisClient();

      const posts = await ghostApi.posts.browse({ limit: batchSize, page });
      const { successfullyProcessed, processFailed } = await processBatch(
        ghostApi,
        posts,
        oldName,
        newName
      );
      await updateJobStatus(redis, jobId, successfullyProcessed, processFailed);
    } catch (error) {
      console.error(`Failed to process job ${jobId}:`, error);
      throw error;
    }
  });
};

// Auto-initialize when module is imported
setupQueueProcessor().catch(console.error);