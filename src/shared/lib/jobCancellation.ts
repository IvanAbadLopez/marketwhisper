import { prisma } from "@/shared/api/prisma";

export class JobCancelledError extends Error {
  constructor(jobId: string) {
    super(`Job ${jobId} has been cancelled`);
    this.name = "JobCancelledError";
  }
}

export async function assertJobNotCancelled(jobId: string): Promise<void> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { status: true },
  });

  if (job?.status === "CANCELLED") {
    throw new JobCancelledError(jobId);
  }
}
