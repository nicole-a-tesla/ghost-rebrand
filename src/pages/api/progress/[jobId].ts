import type { NextApiRequest, NextApiResponse } from "next";
import getQueue from "~/lib/queue";
import { getRedisClient } from "~/lib/redis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { jobId } = req.query as { jobId: string };
  const redis = await getRedisClient();

  if (!jobId || Array.isArray(jobId)) {
    return res.status(400).json({ message: "Invalid job ID" });
  }

  // headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform"); // todo 
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // todo

  // initial message to establish connection
  res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);


  async function sendUpdate() {
    let status = "processing";
    const queue = getQueue();
    const jobCounts = await queue.getJobCounts()
    console.log({jobCounts})

    try {
      const completedIdCount = await redis.sCard(`job:${jobId}:processedPosts`)
      const failedIds = await redis.sDiff([`job:${jobId}:failedPosts`, `job:${jobId}:processedPosts`]);
      const jobStr = await redis.get(`job:${jobId}`);
      const job = JSON.parse(jobStr);
      const totalPostCount = job.totalPostCount;

      const jobsComplete = job.totalPostCount === (completedIdCount + failedIds.length);

      // todo status calc refactor out
      if (jobsComplete || completedIdCount === totalPostCount) {
        status = "completed";
      } else if (completedIdCount === 0 && jobsComplete) {
        status = "failed";
      } else if (completedIdCount === 0 && !jobsComplete) {
        status = "pending";
      }

      const data = {
        totalPostCount,
        completedIdCount,
        failedIds,
        status
      }
      res.write(`data: ${JSON.stringify(data)}\n\n`);

      // todo constants
      if (status === "completed" || status === "failed") {
        res.end();
        clearInterval(intervalId);
      }
    } catch (error) {
      console.error(`Error fetching job progress for ${jobId}:`, error);
      res.write(`data: ${JSON.stringify({ error: "Error fetching job progress" })}\n\n`);
      res.end();
      clearInterval(intervalId);
    }
  }

  const intervalId = setInterval(sendUpdate, 1000);

  // send first update immediately
  sendUpdate().catch(console.error);

  // handle client disconnect
  req.on("close", () => {
    clearInterval(intervalId);
    res.end();
  });
}