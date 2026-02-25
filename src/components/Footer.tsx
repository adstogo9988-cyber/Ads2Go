"use strict";
import React from "react";

export function Footer() {
    return (
        <footer className="footer-bg mt-auto pt-24 md:pt-32">
            {/* Newsletter Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-20 -translate-y-16 md:-translate-y-24">
                <div className="glass-newsletter rounded-[24px] md:rounded-[32px] p-6 md:p-8 lg:p-12 text-center">
                    <h3 className="text-xl md:text-2xl font-light text-slate-900 mb-2 tracking-tight">Intelligence Updates</h3>
                    <p className="text-slate-500 font-light text-sm md:text-base mb-8 md:mb-10 max-w-md mx-auto">
                        Stay informed on global monetization standards and system enhancements.
                    </p>
                    <form className="max-w-lg mx-auto">
                        <div className="flex items-center bg-white/60 border border-white/40 rounded-full p-1.5 shadow-sm">
                            <input
                                className="flex-1 bg-transparent border-0 focus:ring-0 placeholder-slate-400 font-light text-sm px-5 py-3"
                                placeholder="Email Address"
                                type="email"
                            />
                            <button
                                className="bg-white hover:bg-slate-50 text-slate-900 font-medium text-sm py-3 px-8 rounded-full shadow-md transition-all whitespace-nowrap"
                                type="submit"
                            >
                                Join
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Footer Links */}
            <div className="max-w-6xl mx-auto px-8 sm:px-12 lg:px-16 pb-12 md:pb-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-16 justify-items-start border-b border-slate-200/50 pb-12 md:pb-20">
                    {/* Brand Column */}
                    <div className="space-y-4 md:space-y-6 col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center">
                                <span className="text-[10px] text-white font-bold">A</span>
                            </div>
                            <span className="text-lg font-medium tracking-tight text-slate-900">Ad2Go</span>
                        </div>
                        <p className="text-slate-500 font-light text-sm leading-relaxed max-w-xs">
                            Empowering publishers with neural intelligence to achieve seamless ad network readiness and technical excellence.
                        </p>
                        <div className="flex gap-4 items-center">
                            {/* GitHub */}
                            <a className="social-icon" href="#">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path></svg>
                            </a>
                            {/* Twitter */}
                            <a className="social-icon" href="#">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path></svg>
                            </a>
                            {/* LinkedIn */}
                            <a className="social-icon" href="#">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>
                            </a>
                            {/* WhatsApp */}
                            <a className="social-icon" href="#">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.651zm6.59-4.819c1.415.84 2.82 1.315 4.509 1.317 5.236 0 9.503-4.267 9.505-9.504.001-2.538-.987-4.923-2.786-6.723s-4.183-2.787-6.721-2.788c-5.239 0-9.505 4.267-9.508 9.505 0 1.703.489 3.125 1.351 4.577l-.889 3.25 3.339-.874zm10.291-7.013c-.279-.14-1.647-.812-1.903-.905-.256-.092-.441-.139-.627.139-.186.279-.721.905-.883 1.09-.163.186-.326.209-.605.069-.279-.14-1.18-.435-2.247-1.387-.83-.741-1.39-1.656-1.553-1.935-.163-.279-.017-.43.122-.569.125-.124.279-.325.419-.487.14-.163.186-.279.279-.465.093-.186.047-.348-.023-.487-.07-.14-.627-1.51-.86-2.067-.226-.546-.457-.472-.627-.48l-.535-.008c-.186 0-.488.07-.744.348-.256.279-.977.953-.977 2.325s1.001 2.696 1.14 2.882c.14.186 1.966 3.003 4.763 4.21.665.286 1.184.457 1.587.585.67.213 1.279.183 1.761.111.537-.08 1.647-.674 1.88-1.325.233-.651.233-1.209.163-1.325-.069-.116-.256-.186-.535-.326z"></path></svg>
                            </a>
                        </div>
                    </div>

                    {/* Capabilities Column */}
                    <div className="space-y-4 md:space-y-6">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">Capabilities</h4>
                        <ul className="space-y-3 md:space-y-4">
                            <li><a className="text-slate-500 font-light text-sm hover:text-slate-900 transition-colors" href="/solutions">Solutions</a></li>
                            <li><a className="text-slate-500 font-light text-sm hover:text-slate-900 transition-colors" href="/analysis">Neural Analysis</a></li>
                            <li><a className="text-slate-500 font-light text-sm hover:text-slate-900 transition-colors" href="/dashboard">Dashboard</a></li>
                            <li><a className="text-slate-500 font-light text-sm hover:text-slate-900 transition-colors" href="/roadmap">Roadmap</a></li>
                        </ul>
                    </div>

                    {/* Network Column */}
                    <div className="space-y-4 md:space-y-6">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">Company</h4>
                        <ul className="space-y-3 md:space-y-4">
                            <li><a className="text-slate-500 font-light text-sm hover:text-slate-900 transition-colors" href="/pricing">Pricing</a></li>
                            <li><a className="text-slate-500 font-light text-sm hover:text-slate-900 transition-colors" href="/about">About Us</a></li>
                            <li><a className="text-slate-500 font-light text-sm hover:text-slate-900 transition-colors" href="/contact">Contact</a></li>
                            <li><a className="text-slate-500 font-light text-sm hover:text-slate-900 transition-colors" href="/faq">FAQ</a></li>
                        </ul>
                    </div>

                    {/* Legal Column */}
                    <div className="space-y-4 md:space-y-6">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">Legal</h4>
                        <ul className="space-y-3 md:space-y-4">
                            <li><a className="text-slate-500 font-light text-sm hover:text-slate-900 transition-colors" href="/privacy">Privacy Policy</a></li>
                            <li><a className="text-slate-500 font-light text-sm hover:text-slate-900 transition-colors" href="/terms">Terms of Service</a></li>
                            <li><a className="text-slate-500 font-light text-sm hover:text-slate-900 transition-colors" href="/login">Login</a></li>
                            <li><a className="text-slate-500 font-light text-sm hover:text-slate-900 transition-colors" href="/register">Register</a></li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest">
                        © 2026 Ad2Go Systems. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <span className="text-[10px] text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Engine Status Online
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
