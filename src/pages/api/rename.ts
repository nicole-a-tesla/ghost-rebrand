import type { NextApiRequest, NextApiResponse } from "next";
import GhostAdminApi from "@tryghost/admin-api";
import { getQueue } from "~/lib/queue";
import { getRedisClient } from "~/lib/redis";
import { v4 as uuidv4 } from 'uuid';

const BATCH_SIZE = 5;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { siteUrl, apiKey, oldName, newName } = req.body;

    if (!siteUrl || !apiKey || !oldName || !newName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const jobId = uuidv4();

    const ghostApi = new GhostAdminApi({
      url: siteUrl,
      key: apiKey,
      version: "v5.0",
    });

    // typescript seems to be inferring wrong type here?
    const posts: any = await ghostApi.posts.browse({ limit: 1 });
    const totalPostCount = posts.meta?.pagination?.total;

    console.log("Total posts count:", totalPostCount);
    if (totalPostCount === undefined) {
      return res.status(500).json({ message: "Failed to fetch total count" });
    }

    const totalPageCount = Math.ceil(totalPostCount / BATCH_SIZE);
    console.log("Total pages count:", totalPageCount);

    const redis = await getRedisClient();
    const oneDayTTL = { EX: 24 * 60 * 60 }; // 24 hours in seconds

    await redis.set(`job:${jobId}`, JSON.stringify({
      jobId,
      totalPostCount,
      totalPageCount,
      status: "processing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }), oneDayTTL);

    const queue = getQueue();
    
    for (let i = 0; i < totalPageCount; i++) {
      await queue.add({
        jobId,
        siteUrl,
        apiKey,
        oldName,
        newName,
        batchSize: BATCH_SIZE,
        page: i + 1,
      }, {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        }
      });
    }

    return res.status(200).json({ message: "Job started", jobId });
  } catch (error) {
    console.error("Error creating job:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}