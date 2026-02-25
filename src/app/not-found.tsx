import React from "react";
import Link from "next/link";

export default function NotFound() {
    return (
        <main className="flex-grow flex flex-col items-center justify-center relative z-10 min-h-screen px-4">
            <div className="max-w-md w-full text-center">
                {/* 404 Number */}
                <div className="text-[150px] md:text-[200px] font-extralight text-slate-100 leading-none mb-0">
                    404
                </div>

                {/* Content */}
                <div className="relative -mt-16">
                    <div className="liquid-glass-card rounded-[32px] p-8 md:p-12">
                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-2xl liquid-glass-icon flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-3xl text-slate-400">search_off</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extralight text-slate-900 tracking-tighter mb-3">
                                Page Not Found
                            </h1>
                            <p className="text-slate-500 text-sm font-light mb-8">
                                The page you&apos;re looking for doesn&apos;t exist or has been moved.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Link
                                    href="/"
                                    className="px-6 py-3 liquid-glass-button-primary rounded-xl text-xs uppercase tracking-widest font-bold text-white flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-base">home</span>
                                    Go Home
                                </Link>
                                <Link
                                    href="/analysis"
                                    className="px-6 py-3 liquid-glass-button rounded-xl text-xs uppercase tracking-widest font-medium text-slate-700 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-base">search</span>
                                    Analyze Site
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Support Link */}
                <p className="mt-8 text-slate-400 text-xs">
                    Need help?{" "}
                    <Link href="/contact" className="text-slate-600 hover:underline">Contact Support</Link>
                </p>
            </div>
        </main>
    );
}
