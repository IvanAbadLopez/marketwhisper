"use client";

import { useState } from "react";
import { RefreshCw, Plus } from "lucide-react";

interface SyncResponse {
  success: boolean;
  message: string;
  count: number;
  created?: number;
  updated?: number;
}

export function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [sourceName, setSourceName] = useState("");

  const handleSync = async () => {
    if (!url || !sourceName) {
      setMessage("Please provide both URL and source name");
      return;
    }

    setSyncing(true);
    setMessage("");
    
    try {
      const response = await fetch("/api/sync/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, sourceName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Sync failed");
      }

      const data: SyncResponse = await response.json();
      setMessage(data.message);
      
      // Reset form
      setUrl("");
      setSourceName("");
      setShowForm(false);
      
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

  if (!showForm) {
    return (
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4" />
          Add Content
        </button>
        
        {message && (
          <p className={`text-xs ${message.includes("failed") || message.includes("error") ? "text-red-500" : "text-green-600"}`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-3 min-w-[300px]">
      <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Sync from URL
          </h3>
          <button
            onClick={() => {
              setShowForm(false);
              setUrl("");
              setSourceName("");
              setMessage("");
            }}
            className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Cancel
          </button>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Source Name
            </label>
            <input
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="e.g., MarketWatch, Bloomberg"
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              disabled={syncing}
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              URL to Scrape
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              disabled={syncing}
            />
          </div>
          
          <button
            onClick={handleSync}
            disabled={syncing || !url || !sourceName}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors text-sm
              ${
                syncing || !url || !sourceName
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }
              text-white
            `}
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Content"}
          </button>
        </div>
      </div>
      
      {message && (
        <p className={`text-xs ${message.includes("failed") || message.includes("error") || message.includes("Please") ? "text-red-500" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
