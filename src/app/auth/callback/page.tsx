"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import Link from "next/link";

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorDesc, setErrorDesc] = useState<string | null>(null);

  useEffect(() => {
    // Check if URL has explicitly returned an error (e.g. user canceled OAuth)
    const urlError = searchParams.get("error");
    const urlErrorDesc = searchParams.get("error_description");

    if (urlError) {
      setErrorDesc(urlErrorDesc || "An error occurred during authentication.");
      return;
    }

    // Set up a listener for the session being established
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          router.push("/dashboard");
        }
      }
    );

    // Fallback: Check if session is already active (sometimes event fires too fast)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setErrorDesc(error.message);
      } else if (session) {
        router.push("/dashboard");
      }
    }).catch(err => {
      setErrorDesc(err.message);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, searchParams]);

  if (errorDesc) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 max-w-md w-full text-center shadow-lg shadow-red-500/5">
        <h2 className="font-bold text-lg mb-2">Authentication Error</h2>
        <p className="text-sm opacity-90 mb-6">{errorDesc}</p>
        <Link 
          href="/login"
          className="inline-flex items-center justify-center px-4 py-2 bg-white border border-red-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Return to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <Loader2 className="h-10 w-10 animate-spin mb-4 text-indigo-600" />
      <p className="text-sm font-medium tracking-wide flex items-center justify-center text-slate-500">
        Authenticating securely
        <span className="inline-flex w-4 ml-1">
          <span className="animate-[bounce_1.4s_infinite_0ms]">.</span>
          <span className="animate-[bounce_1.4s_infinite_200ms]">.</span>
          <span className="animate-[bounce_1.4s_infinite_400ms]">.</span>
        </span>
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#fcfdfe]">
      <Suspense fallback={
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin mb-4 text-slate-400" />
        </div>
      }>
        <AuthCallbackHandler />
      </Suspense>
    </div>
  );
}
