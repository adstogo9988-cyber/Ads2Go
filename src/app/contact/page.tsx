"use client";
import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function ContactPage() {
    return (
        <>
            <Navbar />
            <main className="flex-grow flex flex-col relative z-10">
                {/* Hero Section */}
                <section className="relative z-10 pt-32 md:pt-40 pb-12 md:pb-20 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-4xl w-full text-center">
                        <span className="text-[10px] uppercase tracking-[0.6em] text-slate-400 font-medium mb-6 block">Get in Touch</span>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extralight text-slate-900 tracking-tighter mb-8 leading-tight">Contact Us</h1>
                        <p className="text-slate-500 text-base md:text-lg lg:text-xl font-light leading-relaxed max-w-2xl mx-auto">
                            Have a question or need help? We&apos;d love to hear from you.
                        </p>
                    </div>
                </section>

                {/* Contact Section */}
                <section className="relative z-10 py-12 md:py-20 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">

                            {/* Contact Form */}
                            <div className="liquid-glass-card rounded-[32px] p-8 md:p-12">
                                <div className="relative z-10">
                                    <h2 className="text-2xl font-light text-slate-800 mb-8 tracking-tight">Send us a message</h2>
                                    <form className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-2 block">First Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 focus:border-slate-300 focus:outline-none text-slate-800 text-sm font-light placeholder:text-slate-300 transition-colors"
                                                    placeholder="John"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-2 block">Last Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 focus:border-slate-300 focus:outline-none text-slate-800 text-sm font-light placeholder:text-slate-300 transition-colors"
                                                    placeholder="Doe"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-2 block">Email</label>
                                            <input
                                                type="email"
                                                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 focus:border-slate-300 focus:outline-none text-slate-800 text-sm font-light placeholder:text-slate-300 transition-colors"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-2 block">Subject</label>
                                            <select className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 focus:border-slate-300 focus:outline-none text-slate-800 text-sm font-light transition-colors">
                                                <option value="">Select a topic</option>
                                                <option value="general">General Inquiry</option>
                                                <option value="support">Technical Support</option>
                                                <option value="billing">Billing Question</option>
                                                <option value="partnership">Partnership</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-2 block">Message</label>
                                            <textarea
                                                rows={5}
                                                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 focus:border-slate-300 focus:outline-none text-slate-800 text-sm font-light placeholder:text-slate-300 transition-colors resize-none"
                                                placeholder="How can we help you?"
                                            ></textarea>
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full py-4 liquid-glass-button-primary rounded-xl text-xs uppercase tracking-widest font-bold text-white hover:opacity-90 transition-all"
                                        >
                                            Send Message
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-6">
                                {/* Email Card */}
                                <div className="liquid-glass-card rounded-[28px] p-8">
                                    <div className="relative z-10 flex items-start gap-5">
                                        <div className="w-12 h-12 rounded-2xl liquid-glass-icon flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-slate-500">mail</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-light text-slate-800 mb-2">Email Us</h3>
                                            <a href="mailto:hello@ad2go.com" className="text-slate-500 text-sm font-light hover:text-slate-700 transition-colors">
                                                hello@ad2go.com
                                            </a>
                                            <p className="text-slate-400 text-xs mt-2">We&apos;ll respond within 24 hours</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Response Time Card */}
                                <div className="liquid-glass-card rounded-[28px] p-8">
                                    <div className="relative z-10 flex items-start gap-5">
                                        <div className="w-12 h-12 rounded-2xl liquid-glass-icon flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-slate-500">schedule</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-light text-slate-800 mb-2">Response Time</h3>
                                            <p className="text-slate-500 text-sm font-light">Monday – Friday</p>
                                            <p className="text-slate-400 text-xs mt-2">9:00 AM – 6:00 PM EST</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Support Card */}
                                <div className="liquid-glass-card rounded-[28px] p-8">
                                    <div className="relative z-10 flex items-start gap-5">
                                        <div className="w-12 h-12 rounded-2xl liquid-glass-icon flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-slate-500">help</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-light text-slate-800 mb-2">Need Quick Help?</h3>
                                            <p className="text-slate-500 text-sm font-light">Check our documentation and FAQs for instant answers.</p>
                                            <a href="/solutions" className="inline-flex items-center gap-1 text-slate-600 text-sm font-medium mt-3 hover:text-slate-800 transition-colors group">
                                                View Solutions
                                                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Pill */}
                                <div className="liquid-glass-pill rounded-full py-4 px-6 flex items-center justify-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                    <span className="text-xs text-slate-500 font-medium">All systems operational</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
