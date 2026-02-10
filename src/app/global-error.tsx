"use client";

import { useState } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [href] = useState<string>(() => {
    try {
      return window.location.href;
    } catch {
      return "";
    }
  });

  return (
    <html lang="en">
      <body style={{ fontFamily: "ui-sans-serif, system-ui", padding: 24 }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>Application error</h2>
        <p style={{ marginTop: 12, maxWidth: 720 }}>
          A server-side exception occurred while loading this page.
        </p>
        <div style={{ marginTop: 12 }}>
          <div>
            <strong>URL:</strong> {href || "(unknown)"}
          </div>
          <div>
            <strong>Digest:</strong> {error.digest ?? "(none)"}
          </div>
          <div style={{ marginTop: 8 }}>
            <strong>Error:</strong> {error.name}: {error.message}
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => reset()} style={{ padding: "8px 12px" }}>
            Try again
          </button>
          <a href="/login" style={{ padding: "8px 12px", display: "inline-block" }}>
            Go to login
          </a>
          <a href="/diag" style={{ padding: "8px 12px", display: "inline-block" }}>
            Diagnostics (/diag)
          </a>
        </div>

        <p style={{ marginTop: 16, maxWidth: 720 }}>
          If you share the JSON from <code>/diag</code>, we can see whether the issue is missing
          environment variables or database connectivity.
        </p>
      </body>
    </html>
  );
}

