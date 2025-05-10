
export interface JobData {
  jobId: string;
  siteUrl: string;
  apiKey: string;
  oldName: string;
  newName: string;
  batchSize: number;
  page: number;
}

export interface ProcessPostResult {
  postId: string;
  success: boolean;
};
