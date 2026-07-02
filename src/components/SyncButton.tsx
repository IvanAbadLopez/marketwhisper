"use client";

import { AnalyzeTextForm } from "@/features/analyze-text";

// Re-export from features layer (FSD architecture)
export function SyncButton() {
  return <AnalyzeTextForm />;
}
