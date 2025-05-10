import { v4 as uuidv4 } from 'uuid';

export const createJob = (siteUrl: string, oldName: string, newName: string): string => {
  const jobId = uuidv4();
  // todo everything else lol
  return jobId;
}
export const markPostProcessed = (jobId: string, postId: string): void => {}
export const markPostUpdateFailed = (jobId: string, postId: string): void => {}
export const updateJobProgress = (jobId: string, totalProcessed: number): void => {}