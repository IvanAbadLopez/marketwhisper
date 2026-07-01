"use client";

import { signOut } from "next-auth/react";
import { User } from "next-auth";

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="w-full border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              MarketWhisper
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {user.name || "User"}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {user.email}
                </span>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
