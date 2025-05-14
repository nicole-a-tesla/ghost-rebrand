import type { NextApiRequest, NextApiResponse } from "next";
import GhostAdminApi from "@tryghost/admin-api";
import { getQueue } from "~/lib/queue";
import { getRedisClient } from "~/lib/redis";
import { v4 as uuidv4 } from 'uuid';
import type { Queue } from "bull";
import type { RedisClientType } from "redis";

export const BATCH_SIZE = 25;
const ONE_DAY_TTL = { EX: 24 * 60 * 60 };
export const QUEUE_OPTIONS = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 5000,
  }
};

export interface RequestBody {
  siteUrl: string;
  apiKey: string;
  oldName: string;
  newName: string;
}

interface GhostApiMeta {
  pagination: {
    total: number;
  };
}

interface GhostApiResponse {
  meta?: GhostApiMeta;
}

interface JobData {
  jobId: string;
  siteUrl: string;
  apiKey: string;
  oldName: string;
  newName: string;
  batchSize: number;
  page: number;
}

export const validateRequestFields = (body: any): string[] => {
  const requiredFields = ['siteUrl', 'apiKey', 'oldName', 'newName'];
  const missingFields = requiredFields.filter(field => !body[field]);
  return missingFields;
};

const getGhostPostTotal = async (ghostApi: any): Promise<number> => {
  const posts: GhostApiResponse = await ghostApi.posts.browse({ limit: 1 });
  const totalPostCount = posts.meta?.pagination?.total;
  if (totalPostCount === undefined) {
    throw new Error("Failed to fetch total post count from Ghost API");
  }
  return totalPostCount
};

export const addJobsToQueue = async (
  jobData: Omit<JobData, 'page'>,
  totalPageCount: number,
  queue: any
): Promise<void> => {
  const promises = [];
  
  for (let i = 0; i < totalPageCount; i++) {
    const promise = queue.add({
      ...jobData,
      page: i + 1,
    }, QUEUE_OPTIONS);
    promises.push(promise);
  }
  await Promise.all(promises);
}

export async function handleRenameKickoff(
  body: RequestBody,
  ghostApi: GhostAdminApi,
  jobId: string,
  redis: RedisClientType,
  queue: Queue
) {
  const { siteUrl, apiKey, oldName, newName } = body;

  const totalPostCount = await getGhostPostTotal(ghostApi);
  const totalPageCount = Math.ceil(totalPostCount / BATCH_SIZE);

  await redis.set(`job:${jobId}`, totalPostCount, ONE_DAY_TTL);
  await addJobsToQueue(
    { jobId, siteUrl, apiKey, oldName, newName, batchSize: BATCH_SIZE },
    totalPageCount,
    queue
  )
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const body = req.body as RequestBody;
  const missingFields = validateRequestFields(body);

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: "Missing required fields",
      fields: missingFields
    });
  }

  try {
    const jobId = uuidv4();
    const redis = await getRedisClient();
    const queue = getQueue();

    const ghostApi = new GhostAdminApi({
      url: req.body.siteUrl,
      key: req.body.apiKey,
      version: "v5.0",
    });

    await handleRenameKickoff(
      req.body,
      ghostApi,
      jobId,
      redis,
      queue
    )

    return res.status(200).json({ message: "Job started", jobId });
  } catch (error) {
    console.error("Error creating job:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}