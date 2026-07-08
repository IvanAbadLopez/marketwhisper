import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MainLayout } from "@/widgets/layout";
import { JobQueue } from "@/widgets/job-queue/JobQueue";

export default async function JobsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <MainLayout user={session.user}>
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page header */}
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Process Queue
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Track the status of your AI analysis and enrichment jobs in real-time
            </p>
          </div>

          {/* Job queue component */}
          <JobQueue />
        </div>
      </div>
    </MainLayout>
  );
}
