'use client';

import React, { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Next.js App Router caught error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-white font-sans">
      <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-8 backdrop-blur-md max-w-md w-full space-y-4">
        <h2 className="text-xl font-bold text-red-400">Something went wrong!</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          An unexpected error occurred in the application interface. The incident has been logged.
        </p>
        <div className="flex gap-4 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 text-xs transition-all cursor-pointer shadow-md"
          >
            Try again
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') window.location.href = '/';
            }}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 text-xs transition-all cursor-pointer"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
