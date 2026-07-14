-- Add CANCELLED status to JobStatus enum
ALTER TYPE "JobStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
