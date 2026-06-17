 'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Next.js Global caught error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-white font-sans">
        <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-8 backdrop-blur-md max-w-md w-full space-y-4">
          <h2 className="text-xl font-bold text-red-400">Critical System Error</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            A critical system error occurred. We apologize for the interruption.
          </p>
          <div className="flex gap-4 justify-center pt-2">
            <button
              onClick={() => reset()}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 text-xs transition-all cursor-pointer shadow-md"
            >
              Recover
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.href = '/';
              }}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 text-xs transition-all cursor-pointer"
            >
              Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
