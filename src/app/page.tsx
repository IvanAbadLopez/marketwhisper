import { auth } from "@/lib/auth";
import { MainLayout } from "@/widgets/layout";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/shared";
import { RecentJobsList } from "@/widgets/job-queue/RecentJobsList";

export default async function Home() {
  const session = await auth();
  const t = await getTranslations('dashboard');

  if (!session?.user) {
    redirect("/login");
  }

  // Get user ID for job counting
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });

  // Fetch stats from database
  const [videoCount, articleCount, mentionCount, activeJobsCount] = await Promise.all([
    prisma.content.count({ where: { contentType: "VIDEO" } }),
    prisma.content.count({
      where: {
        contentType: { in: ["WEB_ARTICLE", "BLOG_POST", "SPECIAL_EVENT", "NEWS"] },
      },
    }),
    prisma.mention.count(),
    user
      ? prisma.job.count({
          where: {
            userId: user.id,
            status: { in: ["PENDING", "PROCESSING"] },
          },
        })
      : 0,
  ]);

  return (
    <MainLayout user={session.user}>
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome section */}
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              {t('welcomeBack', { name: session.user.name?.split(" ")[0] || 'User' })}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              {t('subtitle')}
            </p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {t('videosAnalyzed')}
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
                    {t('contentItems')}
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
                    {t('stockMentions')}
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

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {t('activeJobs')}
                  </p>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                    {activeJobsCount}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⚙️</span>
                </div>
              </div>
            </div>
          </div>

          {/* Getting started */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              {t('getStartedTitle')}
            </h3>
            <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">1.</span>
                <span>{t('getStartedStep1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">2.</span>
                <span>{t('getStartedStep2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">3.</span>
                <span>{t('getStartedStep3')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">4.</span>
                <span>{t('getStartedStep4')}</span>
              </li>
            </ul>
          </div>

          {/* Recent activity */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              {t('recentActivity')}
            </h3>
            <RecentJobsList />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
