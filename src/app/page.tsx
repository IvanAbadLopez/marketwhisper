import { auth } from "@/lib/auth";
import { MainLayout } from "@/components/MainLayout";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <MainLayout user={session.user}>
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome section */}
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Welcome back, {session.user.name?.split(" ")[0] || "User"}!
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Your AI-powered market intelligence dashboard
            </p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Videos Analyzed
                  </p>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                    0
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎥</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Special Situations
                  </p>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                    0
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📰</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Stock Mentions
                  </p>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                    0
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>
          </div>

          {/* Getting started */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              🚀 Getting Started
            </h3>
            <p className="text-blue-700 dark:text-blue-300 mb-4">
              Start by syncing your content to populate the dashboard with market intelligence.
            </p>
            <ul className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
              <li className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                Click <strong>Sync Now</strong> to download and process videos
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                Explore transcriptions and AI-extracted insights
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                Use semantic search to find specific market topics
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                Chat with AI about market trends and predictions
              </li>
            </ul>
          </div>

          {/* Recent activity placeholder */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Recent Activity
            </h3>
            <div className="text-center py-8">
              <p className="text-zinc-500 dark:text-zinc-400">
                No content synchronized yet. Click Sync Now to get started.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
