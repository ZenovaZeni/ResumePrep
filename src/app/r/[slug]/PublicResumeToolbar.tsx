"use client";

import { useState } from "react";

export function PublicResumeToolbar({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/r/${slug}` : "";

  function copyLink() {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="no-print flex items-center justify-between gap-4 p-4 max-w-2xl mx-auto border-b border-gray-200 bg-gray-50">
      <span className="text-sm text-gray-600">Share this resume</span>
      <button
        type="button"
        onClick={copyLink}
        className="px-3 py-1.5 rounded-md bg-gray-800 text-white text-sm font-medium hover:bg-gray-700"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
