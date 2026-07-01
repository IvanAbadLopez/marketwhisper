"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

interface SyncResponse {
  success: boolean;
  message: string;
  count: number;
}

export function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  const handleSync = async () => {
    setSyncing(true);
    setMessage("");
    
    try {
      const response = await fetch("/api/sync/situations", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Sync failed");
      }

      const data: SyncResponse = await response.json();
      setMessage(data.message);
      
      // Refresh page data after sync
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Sync error:", error);
      setMessage(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleSync}
        disabled={syncing}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors
          ${
            syncing
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }
          text-white
        `}
      >
        <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
        {syncing ? "Syncing..." : "Sync Situations"}
      </button>
      
      {message && (
        <p className={`text-xs ${message.includes("failed") || message.includes("error") ? "text-red-500" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
