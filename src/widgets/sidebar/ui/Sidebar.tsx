// Widget: Sidebar - UI Component

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { navigationItems } from "../model/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <aside className="w-64 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎧</span>
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {t('sidebar.appName')}
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.nameKey}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors
                ${
                  isActive
                    ? "bg-blue-500 text-white"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{t(item.nameKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {t('sidebar.version')}
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
          {t('sidebar.tagline')}
        </p>
      </div>
    </aside>
  );
}
