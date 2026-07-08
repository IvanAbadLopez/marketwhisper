"use client";

import { SessionProvider } from "next-auth/react";
import { NotificationProvider, Toaster } from "@/shared/ui/notifications";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NotificationProvider>
        {children}
        <Toaster />
      </NotificationProvider>
    </SessionProvider>
  );
}
