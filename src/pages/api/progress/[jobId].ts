import type { NextApiRequest, NextApiResponse } from "next";
import { getRedisClient } from "~/lib/redis";

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no'
} as const;

const UPDATE_INTERVAL = 1000; // ms
const TERMINAL_STATUSES = ['completed', 'failed'] as const;

interface JobData {
  totalPostCount: number;
}

interface ProgressData {
  totalPostCount: number;
  completedIdCount: number;
  failedIds: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export const calculateJobStatus = (
  completedCount: number,
  failedCount: number,
  totalPostCount: number
): ProgressData['status'] => {
  const totalProcessed = completedCount + failedCount;
  const isComplete = totalProcessed === totalPostCount;
  
  if (isComplete && completedCount === 0) {
    return 'failed';
  } else if (isComplete || completedCount === totalPostCount) {
    return 'completed';
  } else if (completedCount === 0 && !isComplete) {
    return 'pending';
  }
  return 'processing';
};

export const fetchJobProgress = async (
  redis: any,
  jobId: string
): Promise<ProgressData> => {
  const completedIdCount = await redis.sCard(`job:${jobId}:processedPosts`);
  const failedIds = await redis.sDiff([`job:${jobId}:failedPosts`, `job:${jobId}:processedPosts`]);
  const totalPostCountStr = await redis.get(`job:${jobId}`);
  let totalPostCount;

  if (!totalPostCountStr) {
    throw new Error(`Job ${jobId} not found`);
  }
  
  try {
    totalPostCount = parseInt(totalPostCountStr)
  } catch (error) {
    throw new Error(`Job ${jobId} not found`);
  }
  
  const status = calculateJobStatus(completedIdCount, failedIds.length, totalPostCount);
  
  return {
    totalPostCount,
    completedIdCount,
    failedIds,
    status
  };
};

export const writeSSEMessage = (res: NextApiResponse, data: any): void => {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

export const setupSSEHeaders = (res: NextApiResponse): void => {
  Object.entries(SSE_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { jobId } = req.query as { jobId: string };

  if (!jobId || Array.isArray(jobId)) {
    return res.status(400).json({ message: "Invalid job ID" });
  }

  try {
    const redis = await getRedisClient();
    setupSSEHeaders(res);
    writeSSEMessage(res, {connected: true});

    let intervalId: any;

    const sendUpdate = async () => {
      try {
        const progressData = await fetchJobProgress(redis, jobId);
        writeSSEMessage(res, progressData);

        if (TERMINAL_STATUSES.includes(progressData.status as any)) {
          res.end();
          if (intervalId) clearInterval(intervalId);
        }
      } catch (error) {
        console.error(`Error fetching job progress for ${jobId}:`, error);
        writeSSEMessage(res, { error: "Error fetching job porgress"});
        res.end();
        if (intervalId) clearInterval(intervalId);
      }
    };

    intervalId = setInterval(sendUpdate, UPDATE_INTERVAL);
    await sendUpdate().catch(console.error);

    req.on("close", () => {
      if (intervalId) clearInterval(intervalId);
      res.end();
    });

  } catch (error) {
    console.error(`Error setting up SSE for job ${jobId}:`, error);
    return res.status(500).json({ message: "Internal server error" });
  }
};