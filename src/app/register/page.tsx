"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Loader2,
  TrendingUp,
  BarChart2,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (data?.user && !data?.session) {
      setSuccess("Account created successfully! Please check your email to verify your account.");
    } else if (data?.session) {
       router.push("/dashboard");
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (authError) {
      setError(authError.message);
    }
  };

  const features = [
    {
      icon: <TrendingUp size={16} />,
      title: "Revenue Intelligence",
      desc: "AI-powered AdSense optimization insights",
    },
    {
      icon: <BarChart2 size={16} />,
      title: "Deep Analytics",
      desc: "Comprehensive site performance analysis",
    },
    {
      icon: <ShieldCheck size={16} />,
      title: "Compliance Guard",
      desc: "Real-time policy violation detection",
    },
    {
      icon: <Zap size={16} />,
      title: "Instant Reports",
      desc: "Monetization readiness scores in seconds",
    },
  ];

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4"
      style={{ background: "hsl(var(--background))" }}
    >
      <style jsx>{`
        .register-btn {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          position: relative;
          overflow: hidden;
        }
        .register-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          transition: left 0.5s;
        }
        .register-btn:hover::before {
          left: 100%;
        }
        .animate-fadeInUp {
          opacity: 0;
          animation: fadeInUp 0.6s ease forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="z-10 w-full max-w-6xl">
        <div
          className="overflow-hidden rounded-[40px] shadow-2xl"
          style={{ background: "hsl(var(--secondary) / 0.5)" }}
        >
          <div className="grid min-h-[760px] lg:grid-cols-2">

            {/* ── Left Side: Brand Panel ── */}
            <div
              className="relative m-4 hidden rounded-3xl bg-cover bg-center p-12 text-white lg:flex lg:flex-col lg:justify-between"
              style={{
                backgroundImage:
                  "url('https://cdn.midjourney.com/299f94f9-ecb9-4b26-bead-010b8d8b01d9/0_0.webp?w=800&q=80')",
              }}
            >
              {/* overlay */}
              <div
                className="absolute inset-0 rounded-3xl"
                style={{ background: "rgba(0,0,0,0.35)" }}
              />

              <div className="relative z-10">
                {/* Logo */}
                <div className="mb-12">
                  <span className="text-lg font-semibold uppercase tracking-widest text-white">
                    Ad2Vo
                  </span>
                </div>

                {/* Headline */}
                <h1 className="mb-4 text-6xl font-medium leading-tight">
                  Start Growing<br />Your Revenue
                </h1>
                <p className="mb-12 text-xl opacity-80">
                  Create your free account and get instant access to AI-powered
                  AdSense analysis. No credit card required.
                </p>

                {/* Feature list */}
                <div className="space-y-6">
                  {features.map(({ icon, title, desc }, i) => (
                    <div
                      key={i}
                      className="animate-fadeInUp flex items-center"
                      style={{ animationDelay: `${0.2 * (i + 1)}s` }}
                    >
                      <div className="mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur-sm">
                        {icon}
                      </div>
                      <div>
                        <div className="font-semibold">{title}</div>
                        <div className="text-sm opacity-70">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right Side: Register Form ── */}
            <div className="flex flex-col justify-center p-12">
              <div className="mx-auto w-full max-w-md">

                {/* Mobile logo */}
                <div className="mb-8 flex justify-center lg:hidden">
                  <div className="h-10 overflow-hidden">
                    <Image
                      src="/logo.png"
                      alt="Ad2Vo"
                      width={120}
                      height={40}
                      className="h-full w-auto object-contain"
                    />
                  </div>
                </div>

                <div className="mb-8 text-center">
                  <h2
                    className="text-3xl font-light uppercase"
                    style={{ color: "hsl(var(--foreground))" }}
                  >
                    Create account
                  </h2>
                  <p
                    className="mt-2 text-sm"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    Start your free AdSense analysis today
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                  {error && (
                    <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20 text-center">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-500 border border-green-500/20 text-center">
                      {success}
                    </div>
                  )}
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium uppercase"
                      style={{ color: "hsl(var(--foreground))" }}
                    >
                      Full name
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        autoComplete="new-password"
                        readOnly
                        onFocus={(e) => e.target.removeAttribute('readonly')}
                        onMouseEnter={(e) => e.target.removeAttribute('readonly')}
                        className="block w-full rounded-lg border py-3 pr-3 pl-10 text-sm"
                        style={{
                          borderColor: "hsl(var(--border))",
                          background: "hsl(var(--input))",
                          color: "hsl(var(--foreground))",
                        }}
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium uppercase"
                      style={{ color: "hsl(var(--foreground))" }}
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="new-password"
                        readOnly
                        onFocus={(e) => e.target.removeAttribute('readonly')}
                        onMouseEnter={(e) => e.target.removeAttribute('readonly')}
                        className="block w-full rounded-lg border py-3 pr-3 pl-10 text-sm"
                        style={{
                          borderColor: "hsl(var(--border))",
                          background: "hsl(var(--input))",
                          color: "hsl(var(--foreground))",
                        }}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-medium uppercase"
                      style={{ color: "hsl(var(--foreground))" }}
                    >
                      Password
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        readOnly
                        onFocus={(e) => e.target.removeAttribute('readonly')}
                        onMouseEnter={(e) => e.target.removeAttribute('readonly')}
                        className="block w-full rounded-lg border py-3 pr-12 pl-10 text-sm"
                        style={{
                          borderColor: "hsl(var(--border))",
                          background: "hsl(var(--input))",
                          color: "hsl(var(--foreground))",
                        }}
                        placeholder="Create a password"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <p
                      className="mt-1.5 text-xs"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      Must be at least 8 characters
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="register-btn relative flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-medium text-white transition-all duration-300 disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="ml-2">Creating account...</span>
                      </>
                    ) : (
                      "Create free account"
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative flex items-center text-sm">
                    <div className="flex-1 border-t" style={{ borderColor: "#e2e8f0" }} />
                    <span
                      className="mx-3 whitespace-nowrap text-xs"
                      style={{ color: "hsl(var(--muted-foreground))", background: "#ffffff" }}
                    >
                      Or continue with
                    </span>
                    <div className="flex-1 border-t" style={{ borderColor: "#e2e8f0" }} />
                  </div>

                  {/* Social Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleOAuthLogin('google')}
                      className="flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm shadow-sm transition-all hover:opacity-80"
                      style={{
                        borderColor: "hsl(var(--border))",
                        background: "hsl(var(--secondary))",
                        color: "hsl(var(--foreground))",
                      }}
                    >
                      <img
                        src="https://www.svgrepo.com/show/475656/google-color.svg"
                        className="h-5 w-5"
                        alt="Google"
                      />
                      <span className="ml-2">Google</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOAuthLogin('github')}
                      className="flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm shadow-sm transition-all hover:opacity-80"
                      style={{
                        borderColor: "hsl(var(--border))",
                        background: "hsl(var(--secondary))",
                        color: "hsl(var(--foreground))",
                      }}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      <span className="ml-2">GitHub</span>
                    </button>
                  </div>
                </form>

                {/* Terms */}
                <p
                  className="mt-5 text-center text-xs"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  By creating an account, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="hover:underline"
                    style={{ color: "hsl(var(--foreground))" }}
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="hover:underline"
                    style={{ color: "hsl(var(--foreground))" }}
                  >
                    Privacy Policy
                  </Link>
                </p>

                <div
                  className="mt-6 text-center text-sm"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="transition-opacity hover:opacity-80"
                    style={{ color: "hsl(var(--primary))" }}
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
            {/* ── End Right Side ── */}
          </div>
        </div>
      </div>
    </div>
  );
}
