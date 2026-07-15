"use client";

import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/widgets/layout";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { SearchBar, useCompanySearch } from "@/features/company-search";
import { CompanyCard } from "@/entities/company";
import type { Company } from "@/entities/company";

export default function SituationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await fetch("/api/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCompanies();
    }
  }, [status, fetchCompanies]);

  const handleCompanyClick = (ticker: string) => {
    router.push(`/companies/${ticker.toLowerCase()}`);
  };

  const handleDeleteCompany = async (ticker: string) => {
    if (!confirm(`Are you sure you want to delete ${ticker} and all its related data?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/companies/${ticker}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh company list
        await fetchCompanies();
      } else {
        const error = await response.json();
        alert(`Failed to delete company: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      alert("Failed to delete company");
    }
  };

  // Use company search feature (FSD)
  const filteredCompanies = useCompanySearch(companies, searchQuery);

  if (status === "loading" || loading) {
    return (
      <MainLayout user={session?.user}>
        <div className="p-8">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout user={session?.user}>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Companies Tracked
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                AI-analyzed companies from your text analyses and reports
              </p>
            </div>
            <button
              onClick={() => router.push('/companies/discover')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Discover Companies</span>
            </button>
          </div>

          {/* Search Bar */}
          {companies.length > 0 && (
            <SearchBar 
              value={searchQuery}
              onChange={setSearchQuery}
              resultsCount={filteredCompanies.length}
            />
          )}

          {companies.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🏢</div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                No Companies Yet
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Discover companies to start tracking
              </p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                No Companies Found
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                No companies match your search "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onClick={handleCompanyClick}
                  onDelete={handleDeleteCompany}
                />
              ))}
            </div>
          )}

          {companies.length > 0 && filteredCompanies.length > 0 && !searchQuery && (
            <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Tracking {companies.length} {companies.length === 1 ? 'company' : 'companies'}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}


