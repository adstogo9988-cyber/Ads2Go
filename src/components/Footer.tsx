"use client";
import React, { useEffect, useState } from "react";
import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowDownLeft,
    Share2,
    CheckCircle2,
    Globe
} from 'lucide-react';

const Icons = {
    Twitter: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
    ),
    GitHub: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
    ),
    LinkedIn: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
    )
};

const navigation = {
    capabilities: [
        { name: 'Solutions', href: '/solutions' },
        { name: 'Analyze', href: '/analysis' },
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Roadmap', href: '/roadmap' },
    ],
    company: [
        { name: 'Pricing', href: '/pricing' },
        { name: 'Blog', href: '/blog' },
        { name: 'About Us', href: '/about' },
        { name: 'Contact', href: '/contact' },
        { name: 'FAQ', href: '/faq' },
    ],
    legal: [
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Login', href: '/login' },
        { name: 'Register', href: '/register' },
    ],
};

const socialLinks = [
    { icon: Icons.Twitter, label: 'Twitter', href: '#' },
    { icon: Icons.GitHub, label: 'GitHub', href: '#' },
    { icon: Icons.LinkedIn, label: 'LinkedIn', href: '#' },
    { icon: Globe, label: 'Website', href: '#' },
];

export function Footer() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const currentYear = new Date().getFullYear();

    if (!mounted) return null;

    return (
        <footer className="mt-20 w-full overflow-hidden bg-white border-t border-slate-100">
            {/* Top Energy Flow Line */}
            <div className="animate-energy-flow h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            
            <div className="relative w-full px-6 py-16 md:py-24">
                <div className="max-w-7xl mx-auto grid grid-cols-1 gap-16 lg:grid-cols-5">
                    
                    {/* Brand Section */}
                    <div className="flex flex-col lg:col-span-2">
                        <Link href="/" className="group -ml-1 w-fit">
                            <div className="flex items-center">
                                <Image 
                                    src="/logo.png" 
                                    alt="Ad2Vo Logo" 
                                    width={200}
                                    height={40}
                                    className="h-10 w-auto object-contain transform transition-transform duration-500 group-hover:scale-105" 
                                />
                            </div>
                        </Link>
                        
                        <p className="text-slate-500 font-light text-base leading-relaxed max-w-md mt-4">
                            Empowering publishers with neural intelligence to achieve 
                            seamless ad network readiness and technical excellence. 
                            Building the future of monetization standards.
                        </p>

                        <div className="flex items-center gap-4 mt-8">
                            {socialLinks.map(({ icon: Icon, label, href }) => (
                                <Link 
                                    key={label}
                                    href={href}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-500 hover:scale-110 hover:-rotate-12"
                                >
                                    <Icon className="h-5 w-5" />
                                </Link>
                            ))}
                        </div>
                        <div className="select-none pointer-events-none opacity-[0.03] text-4xl sm:text-6xl md:text-9xl font-black uppercase tracking-tighter text-slate-900 mt-6" aria-hidden="true">
                            AD2VO.COM
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:col-span-3">
                        {/* Capabilities */}
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-900 mb-8 flex items-center gap-2">
                                <div className="w-1 h-4 bg-slate-900 rounded-full" />
                                Capabilities
                            </h3>
                            <ul className="space-y-4">
                                {navigation.capabilities.map((item) => (
                                    <li key={item.name}>
                                        <Link href={item.href} className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm transition-all duration-300">
                                            <ArrowDownLeft className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-slate-900" />
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-900 mb-8 flex items-center gap-2">
                                <div className="w-1 h-4 bg-slate-900 rounded-full" />
                                Company
                            </h3>
                            <ul className="space-y-4">
                                {navigation.company.map((item) => (
                                    <li key={item.name}>
                                        <Link href={item.href} className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm transition-all duration-300">
                                            <ArrowDownLeft className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-slate-900" />
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-900 mb-8 flex items-center gap-2">
                                <div className="w-1 h-4 bg-slate-900 rounded-full" />
                                Legal
                            </h3>
                            <ul className="space-y-4">
                                {navigation.legal.map((item) => (
                                    <li key={item.name}>
                                        <Link href={item.href} className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm transition-all duration-300">
                                            <ArrowDownLeft className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-slate-900" />
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-20 pt-8 border-t border-slate-100">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-xs text-slate-400 font-medium tracking-widest text-center md:text-left">
                            © {currentYear} AD2VO SYSTEMS | ENGINE V4.2.0-SECURE
                        </p>
                        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                Neural Status: Optimal
                            </span>
                            <div className="flex gap-6">
                                <Link href="/privacy" className="text-[10px] text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors font-semibold">Privacy</Link>
                                <Link href="/terms" className="text-[10px] text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors font-semibold">Terms</Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Background Glow */}
                <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-slate-50/50 to-transparent pointer-events-none" />
            </div>

            <style jsx>{`
                @keyframes energy-flow {
                    0% { background-position: -100% 0; }
                    100% { background-position: 100% 0; }
                }
                .animate-energy-flow {
                    animation: energy-flow 4s linear infinite;
                    background-size: 200% 100%;
                }
            `}</style>
        </footer>
    );
}
