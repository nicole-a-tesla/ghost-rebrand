import GhostAdminApi, { type Post } from '@tryghost/admin-api';
import { markPostProcessed, markPostUpdateFailed, incrementProcessedCount } from './stateManager';
import { findAndReplaceAll } from './utils';

export default async function processPosts(ghostApi: GhostAdminApi, jobId: string, posts: Post[], oldName: string, newName: string) {

  for (const post of posts) {
      // TODO get mobiledoc posts if lexical is not available
      // & check mobiledoc structure + replacement logic
    const postContent = post.lexical;
    const canBeProcessed = postContent && postContent.includes(oldName);

    if (!canBeProcessed) {
      markPostProcessed(jobId, post.id);
      incrementProcessedCount(jobId);
      continue;
    }

    const newContent = findAndReplaceAll(postContent, oldName, newName);
    const updatedData = {
      id: post.id,
      lexical: newContent,
      updated_at: post.updated_at,
    };

    try {
      await ghostApi.posts.edit(updatedData);
      markPostProcessed(jobId, post.id);
    } catch (error) {
      console.error('Error updating post:', error);
      markPostUpdateFailed(jobId, post.id);
    }
    // TODO move into try block when implement retries
    incrementProcessedCount(jobId);

  }
}