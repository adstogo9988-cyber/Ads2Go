"use client";
import Link from "next/link";
import React, { useState } from "react";

export function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-6">
                <header className="glass-pill flex h-14 w-full max-w-4xl items-center justify-between px-2 rounded-full">
                    <div className="flex items-center gap-3 pl-4">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 48 48"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z"
                                        fill="currentColor"
                                    ></path>
                                </svg>
                            </div>
                            <span className="text-sm font-bold tracking-tight text-slate-900 uppercase">
                                Ad2Go
                            </span>
                        </Link>
                    </div>
                    <nav className="hidden md:flex items-center gap-10">
                        <Link
                            className="text-[12px] font-medium tracking-wide text-slate-500 hover:text-slate-900 transition-colors"
                            href="/analysis"
                        >
                            Analyze
                        </Link>
                        <Link
                            className="text-[12px] font-medium tracking-wide text-slate-500 hover:text-slate-900 transition-colors"
                            href="/solutions"
                        >
                            Solutions
                        </Link>
                        <Link
                            className="text-[12px] font-medium tracking-wide text-slate-500 hover:text-slate-900 transition-colors"
                            href="/pricing"
                        >
                            Pricing
                        </Link>
                        <Link
                            className="text-[12px] font-medium tracking-wide text-slate-500 hover:text-slate-900 transition-colors"
                            href="/about"
                        >
                            About
                        </Link>
                        <Link
                            className="text-[12px] font-medium tracking-wide text-slate-500 hover:text-slate-900 transition-colors"
                            href="/contact"
                        >
                            Contact
                        </Link>
                    </nav>
                    <div className="hidden md:flex items-center gap-1">
                        <Link
                            href="/login"
                            className="text-[12px] font-semibold text-slate-600 px-5 py-2 hover:text-slate-900 transition-all"
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            className="bg-white/80 hover:bg-white text-slate-900 text-[12px] font-bold px-6 py-2.5 rounded-full transition-all border border-white/40 shadow-sm"
                        >
                            Get Started
                        </Link>
                    </div>
                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 mr-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <span className="material-symbols-outlined text-slate-700">
                            {isMobileMenuOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                </header>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="absolute top-20 left-4 right-4 liquid-glass-card rounded-[24px] p-6">
                        <nav className="flex flex-col gap-4 relative z-10">
                            <Link
                                className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2 border-b border-slate-100"
                                href="/analysis"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Analyze
                            </Link>
                            <Link
                                className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2 border-b border-slate-100"
                                href="/solutions"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Solutions
                            </Link>
                            <Link
                                className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2 border-b border-slate-100"
                                href="/pricing"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Pricing
                            </Link>
                            <Link
                                className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2 border-b border-slate-100"
                                href="/about"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                About
                            </Link>
                            <Link
                                className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2 border-b border-slate-100"
                                href="/contact"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Contact
                            </Link>
                            <Link
                                className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors py-2 border-b border-slate-100"
                                href="/blog"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Blog
                            </Link>
                            <div className="flex flex-col gap-3 pt-4">
                                <Link
                                    href="/login"
                                    className="text-center text-sm font-semibold text-slate-600 py-3 px-4 hover:text-slate-900 transition-all liquid-glass-button rounded-xl"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="text-center bg-slate-900 text-white text-sm font-bold py-3 px-4 rounded-xl transition-all"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </div>
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
}
