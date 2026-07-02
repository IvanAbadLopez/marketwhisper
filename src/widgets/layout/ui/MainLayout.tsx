// Widget: Layout - Main Layout Composition

import { ReactNode } from "react";
import { User } from "next-auth";
import { Header } from "@/widgets/header";
import { Sidebar } from "@/widgets/sidebar";

interface MainLayoutProps {
  user?: User;
  children: ReactNode;
}

export function MainLayout({ user, children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-white dark:bg-black overflow-hidden">
      {/* Sidebar Widget */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Widget */}
        <Header user={user} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
