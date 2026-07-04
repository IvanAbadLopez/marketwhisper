import { auth } from "@/lib/auth";
import { MainLayout } from "@/widgets/layout";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AnalyzeTextForm } from "@/features/analyze-text";

export default async function AnalyzePage() {
  const session = await auth();
  const t = await getTranslations('analyzePage');

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <MainLayout user={session.user}>
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {t('title')}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              {t('subtitle')}
            </p>
          </div>

          <AnalyzeTextForm />
        </div>
      </div>
    </MainLayout>
  );
}
