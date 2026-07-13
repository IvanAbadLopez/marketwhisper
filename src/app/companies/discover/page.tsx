"use client";

import { useEffect } from "react";
import { MainLayout } from "@/widgets/layout";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DiscoverSearch } from "@/features/discover-company";
import type { Session } from "next-auth";

export default function DiscoverPage() {
  const { data: session, status } = useSession() as { data: Session | null; status: "loading" | "authenticated" | "unauthenticated" };
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  if (status === "loading") {
    return (
      <MainLayout user={session?.user ?? undefined}>
        <div className="p-8">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout user={session?.user ?? undefined}>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push("/situations")}
            className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Companies
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Discover Companies
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              Search Finnhub to find and import companies into your system
            </p>
          </div>

          {/* Discover Feature */}
          <DiscoverSearch />
        </div>
      </div>
    </MainLayout>
  );
}
