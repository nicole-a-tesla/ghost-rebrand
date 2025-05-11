import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { jobId } = req.query as { jobId: string };

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

  // handle job progress updates
  async function sendUpdate() {
    // todo
  }

  // send updates every second
  const intervalId = setInterval(sendUpdate, 1000);

  // send first update immediately
  sendUpdate().catch(console.error);

  // handle client disconnect
  req.on("close", () => {
    clearInterval(intervalId);
    res.end();
  });
}