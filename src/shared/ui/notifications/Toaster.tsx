"use client";


import { useEffect } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { useNotifications } from "./NotificationProvider";

const TOAST_DURATION = 8000;

export function Toaster() {
  const { toasts, removeToast } = useNotifications();

  console.log(`[Toaster] Rendering with ${toasts.length} toasts`);

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    toasts.forEach((toast) => {
      const timer = setTimeout(() => {
        removeToast(toast.id);
      }, TOAST_DURATION);
      timers.push(timer);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts, removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => {
        const Icon =
          toast.type === "success"
            ? CheckCircle
            : toast.type === "error"
            ? XCircle
            : Info;

        const bgColor =
          toast.type === "success"
            ? "bg-green-900/90 border-green-500/50"
            : toast.type === "error"
            ? "bg-red-900/90 border-red-500/50"
            : "bg-blue-900/90 border-blue-500/50";

        const iconColor =
          toast.type === "success"
            ? "text-green-400"
            : toast.type === "error"
            ? "text-red-400"
            : "text-blue-400";

        return (
          <div
            key={toast.id}
            className={`${bgColor} border rounded-lg p-4 shadow-lg backdrop-blur-sm animate-in slide-in-from-right duration-300`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`h-5 w-5 ${iconColor} mt-0.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">
                  {toast.ticker}
                </p>
                <p className="text-sm text-zinc-300 mt-1">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-400 hover:text-white transition-colors flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
