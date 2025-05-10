import GhostAdminApi from '@tryghost/admin-api';
import processPosts from './processPosts';
import { getLastPageFetched, markPageFetched, setTotalCount } from './stateManager';

export default async function processPages(
  ghostApi: GhostAdminApi,
  jobId: string,
  oldName: string,
  newName: string,
): Promise<void> {

  try {
    let page = getLastPageFetched(jobId);
    const limit = 100;
    let hasMore = true;
    let totalCount = null;

    while (hasMore) {
      const posts = await ghostApi.posts.browse({
        limit,
        page,
        order: 'published_at asc',
      });

      if (totalCount === null) {
        totalCount = posts.meta.pagination.total;
        setTotalCount(jobId, totalCount);
      }

      if (posts.length < limit) {
        hasMore = false;
      }

      if (posts.length === 0) {
        break;
      }
      
      processPosts(ghostApi, jobId, posts, oldName, newName);

      page++;
      markPageFetched(jobId, page);
    }
  } catch (error) {
    console.error('Error processing posts:', error);
  }
}