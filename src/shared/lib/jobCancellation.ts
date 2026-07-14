/**
 * Job Cancellation Utilities
 * Cooperative cancellation support for background jobs
 * @module shared/lib/jobCancellation
 */

import { prisma } from "@/shared/api/prisma";

/**
 * Custom error thrown when a job has been cancelled
 * Allows background processes to detect cancellation and abort gracefully
 */
export class JobCancelledError extends Error {
  constructor(jobId: string) {
    super(`Job ${jobId} has been cancelled`);
    this.name = "JobCancelledError";
  }
}

/**
 * Check if a job has been cancelled and throw if so
 * Use this at checkpoints in long-running processes (between phases)
 * 
 * @param jobId - The job ID to check
 * @throws {JobCancelledError} If the job status is CANCELLED
 */
export async function assertJobNotCancelled(jobId: string): Promise<void> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { status: true },
  });

  if (job?.status === "CANCELLED") {
    throw new JobCancelledError(jobId);
  }
}
