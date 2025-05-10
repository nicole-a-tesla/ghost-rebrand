import GhostAdminApi from '@tryghost/admin-api';
import { findAndReplaceAll } from "~/lib/utils";
import { markPostProcessed, markPostUpdateFailed, updateJobProgress } from "~/lib/jobManager";

export async function processNameChange(
  jobId: string,
  siteUrl: string,
  apiKey: string,
  oldName: string,
  newName: string
): Promise<void> {
  const api = new GhostAdminApi({
    url: siteUrl,
    key: apiKey,
    version: 'v5.0',
  });
  try {
    let page = 1;
    const limit = 100;
    let hasMore = true;
    let totalProcessed = 0;

    while (hasMore) {
      const posts = await api.posts.browse({
        limit,
        page,
        order: 'published_at asc',
      })

      if (posts.length < limit) {
        hasMore = false;
      }

      // TODO get mobiledoc posts if lexical is not available
      // & check mobiledoc structure + replacement logic

      for (const post of posts) {
        const postContent = post.lexical;
        const canBeProcessed = postContent && postContent.includes(oldName);

        if (!canBeProcessed) {
          markPostProcessed(jobId, post.id);
          totalProcessed++;
          updateJobProgress(jobId, totalProcessed);
          continue;
        }

        const newContent = findAndReplaceAll(postContent, oldName, newName);
        const updatedData = {
          id: post.id,
          lexical: newContent,
          updated_at: post.updated_at,
        }

        try {
          await api.posts.edit(updatedData);
          markPostProcessed(jobId, post.id);
        } catch (error) {
          console.error('Error updating post:', error);
          markPostUpdateFailed(jobId, post.id);
        } finally {
          // For now, update job progress after each post
          // regardless of success or failure
          // TODO: implement retries + check for rate limit response
          totalProcessed++;
          updateJobProgress(jobId, totalProcessed);
        }
      }

    page++;
  }

  } catch (error) {
    console.error('Error processing name change:', error);
    throw error;
  }
}