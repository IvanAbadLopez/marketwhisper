"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

export function SyncButton() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    
    try {
      // TODO: Call sync API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate
      alert("Sync completed! (API not implemented yet)");
    } catch (error) {
      console.error("Sync error:", error);
      alert("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
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
      {syncing ? "Syncing..." : "Sync Now"}
    </button>
  );
}
