import { auth } from "@/lib/auth";
import { MainLayout } from "@/widgets/layout";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export default async function InsightsPage() {
  const session = await auth();
  const t = await getTranslations('insights');

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <MainLayout user={session.user}>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {t('title')}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              {t('subtitle')}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              {t('comingSoon')}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              {t('comingSoonDesc')}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              {t('features')}
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
