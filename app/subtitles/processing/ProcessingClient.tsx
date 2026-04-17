"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";

// Human-readable labels for each stage
const STATUS_LABELS: Record<string, string> = {
  waiting: "Waiting in line...",
  downloading: "Downloading video...",
  extracting: "Extracting audio...",
  transcribing: "Transcribing speech...",
  translating: "Translating subtitles...",
  finalizing: "Building subtitle file...",
  done: "Done!",
  failed: "Something went wrong",
};

export default function ProcessingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get ?id= from URL
  const taskId = searchParams.get("id");

  const [status, setStatus] = useState("waiting");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!taskId) return;

    // Poll backend every 2 seconds
    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/task/progress?id=${taskId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Progress lookup failed.");
        }

        setStatus(data.status);
        setProgress(data.progress);

        // If done → go to editor
        if (data.status === "done") {
          window.clearInterval(interval);
          router.replace(`/editor/${taskId}`);
        }

        // If failed → show error
        if (data.status === "failed") {
          window.clearInterval(interval);
          setError(data.error || "Processing failed.");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => window.clearInterval(interval);
  }, [taskId, router]);

  // If no ID in URL
  if (!taskId) {
    return (
      <div className="text-center">
        <h2>Missing task ID</h2>
        <Link href="/subtitles">Go back</Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Processing your video</h2>

      <p>{STATUS_LABELS[status] || status}</p>

      <ProgressBar value={progress} />

      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </div>
  );
}