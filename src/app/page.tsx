import { auth } from "@/lib/auth";
import { MainLayout } from "@/components/MainLayout";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch stats from database
  const [videoCount, articleCount, mentionCount] = await Promise.all([
    prisma.content.count({ where: { contentType: "VIDEO" } }),
    prisma.content.count({
      where: {
        contentType: { in: ["WEB_ARTICLE", "BLOG_POST", "SPECIAL_EVENT", "NEWS"] },
      },
    }),
    prisma.mention.count(),
  ]);

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
                    {videoCount}
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
                    Content Items
                  </p>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                    {articleCount}
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
                    {mentionCount}
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
              Start by adding content from any web source to populate the dashboard.
            </p>
            <ul className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
              <li className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                Click <strong>Add Content</strong> to scrape from any URL
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                Content is automatically analyzed for ticker mentions
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
