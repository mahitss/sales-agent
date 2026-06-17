"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, AlertTriangle, RefreshCw, Mail } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setSuccess(false);
      setMessage("Verification token is missing from the URL.");
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    fetch(`${API_URL}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setSuccess(true);
          setMessage(data.message || "Your email has been successfully verified!");
        } else {
          setSuccess(false);
          setMessage(data.message || "Email verification failed or token has expired.");
        }
      })
      .catch((err) => {
        console.error(err);
        setSuccess(false);
        setMessage("Could not connect to the verification service.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-md text-center">
      <div>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
          <Mail className="h-7 w-7" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
          Email Verification
        </h2>
      </div>

      <div className="py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="h-10 w-10 animate-spin text-emerald-400" />
            <p className="text-sm text-slate-400">Verifying your email token...</p>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-emerald-400 animate-pulse" />
            </div>
            <p className="text-sm text-slate-300">{message}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-rose-500" />
            </div>
            <p className="text-sm text-rose-400">{message}</p>
          </div>
        )}
      </div>

      {!loading && (
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-all shadow-lg cursor-pointer"
        >
          Go to Dashboard Sign In
        </button>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
