"use client";

import { useEffect, useState } from "react";

export default function DebugPage() {
  const [cookies, setCookies] = useState<string>("");
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Get all cookies
    setCookies(document.cookie);

    // Fetch session
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => setSession(data));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Cookies:</h2>
        <pre className="bg-gray-800 p-4 rounded overflow-auto text-sm">
          {cookies || "No cookies found"}
        </pre>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Session:</h2>
        <pre className="bg-gray-800 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
    </div>
  );
}
