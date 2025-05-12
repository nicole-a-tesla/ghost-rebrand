import { getQueue } from './queue';
import { getRedisClient } from './redis';
import GhostAdminApi, { type Post } from '@tryghost/admin-api';
import { findAndReplaceAll } from './utils';
import type { JobData, ProcessPostResult } from '../types.d.ts';

const CONCURRENCY = 5;

const queue = getQueue();

export const processPost = async (
  ghostApi: GhostAdminApi,
  post: Post,
  oldName: string,
  newName: string
) => {
    const result = { postId: post.id, success: false } as ProcessPostResult;
    // TODO get mobiledoc posts if lexical is not available
    const postContent = post.lexical;

    if (!postContent) {
      // could not process post content, mark as failed
      return result;
    }

    if (!postContent.includes(oldName)) {
      // no op, mark success and move on
      result.success = true;
      return result;
    }

    const newContent = findAndReplaceAll(postContent, oldName, newName);

    try {
      await ghostApi.posts.edit({
        id: post.id,
        lexical: newContent,
        updated_at: post.updated_at,
      });
      result.success = true;
      return result;
    } catch (error) {
      return result;
    }
}

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

  const ghostApi = new GhostAdminApi({
    url: siteUrl,
    key: apiKey,
    version: 'v5.0',
  });

  const posts = await ghostApi.posts.browse({ limit: batchSize, page });
  const successfullyProcessed = [];
  const processFailed = [];

  for (const post of posts) {
    const result = await processPost(ghostApi, post, oldName, newName);
    result.success
      ? successfullyProcessed.push(result.postId)
      : processFailed.push(result.postId);
  }

  const redis = await getRedisClient();

  if (successfullyProcessed.length > 0) {
    await redis.sAdd(`job:${jobId}:processedPosts`, successfullyProcessed);
  }

  if (processFailed.length > 0) {
    await redis.sAdd(`job:${jobId}:failedPosts`, processFailed);
  }
});

