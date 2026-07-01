import { auth } from "@/lib/auth";
import { MainLayout } from "@/components/MainLayout";
import { redirect } from "next/navigation";

export default async function VideosPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <MainLayout user={session.user}>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Video Analysis
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              Browse and analyze transcribed market videos
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🎥</div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              No Videos Yet
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Click "Sync Now" to download and transcribe your first videos
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Coming soon: Video list, transcriptions, and AI insights
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
