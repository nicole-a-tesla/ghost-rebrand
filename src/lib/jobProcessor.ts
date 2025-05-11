import { getQueue } from './queue';
import { getRedisClient } from './redis';
import GhostAdminApi, { type Post } from '@tryghost/admin-api';
import { findAndReplaceAll } from './utils';
import type { JobData, ProcessPostResult } from '../types.d.ts';

const CONCURRENCY = 5;

const queue = getQueue();

queue.process(CONCURRENCY, async (job) => {
  console.log('Processing job:', job.data.jobId);
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
  await redis.sAdd(`job:${jobId}:processedPosts`, successfullyProcessed);
});

const processPost = async (
  ghostApi: GhostAdminApi,
  post: Post,
  oldName: string,
  newName: string
) => {
    const result = { postId: post.id, success: false } as ProcessPostResult;
    console.log({postId: post.id})
    // TODO get mobiledoc posts if lexical is not available
    const postContent = post.lexical;
    const canBeProcessed = postContent && postContent.includes(oldName);
    if (!canBeProcessed) {
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
