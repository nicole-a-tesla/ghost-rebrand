import type { NextApiRequest, NextApiResponse } from "next";
import { createJob } from "~/lib/jobManager";
import { processNameChange } from "~/lib/ghostApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { siteUrl, apiKey, oldName, newName } = req.body;
    if (!siteUrl || !apiKey || !oldName || !newName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const jobId = createJob(siteUrl, oldName, newName);

    // todo consider using a queue or similar bc vercel might kill this b4 it finishes
    processNameChange(jobId, siteUrl, apiKey, oldName, newName)
      .catch((error) => console.error("background job failed", error));
    
    return res.status(200).json({ message: "Job started", jobId });
  } catch (error) {
    console.error("Error creating job:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}