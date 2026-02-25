"use client";
import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            question: "What is Ad2Go?",
            answer: "Ad2Go is an AI-powered platform that analyzes your website's readiness for Google AdSense approval. Our neural engine scans over 100 factors including technical SEO, content quality, trust signals, and policy compliance to give you a comprehensive readiness score and actionable recommendations."
        },
        {
            question: "How accurate is the analysis?",
            answer: "Our analysis is based on publicly available Google AdSense guidelines and industry best practices. While we can't guarantee approval (only Google makes that decision), our users report a 94% approval rate after following our recommendations. The analysis covers all known factors that influence AdSense decisions."
        },
        {
            question: "How long does an analysis take?",
            answer: "A typical analysis takes 30-60 seconds. Our neural engine crawls your website, analyzes multiple data points, and generates a comprehensive report in real-time. Complex sites with many pages may take slightly longer."
        },
        {
            question: "Do I need to install anything on my website?",
            answer: "No installation required. Simply enter your website URL and we'll analyze it remotely. We only access publicly available information, just like Google's crawlers do. Your website's security and performance are not affected."
        },
        {
            question: "What's included in the free plan?",
            answer: "The free plan includes 3 website analyses per month, basic readiness scores, and essential recommendations. For unlimited scans, priority analysis, API access, and detailed fix roadmaps, consider upgrading to our Pro or Enterprise plans."
        },
        {
            question: "Can I analyze websites I don't own?",
            answer: "Yes, you can analyze any publicly accessible website. This is useful for competitive research or if you're helping clients prepare for AdSense. However, you should only implement changes on websites you have authorization to modify."
        },
        {
            question: "What if my site gets rejected after following recommendations?",
            answer: "While our recommendations significantly improve approval chances, Google's final decision depends on factors we may not fully capture. If rejected, use our re-analysis feature to identify any remaining issues. Pro users also get access to our support team for personalized guidance."
        },
        {
            question: "How often should I re-analyze my website?",
            answer: "We recommend re-analyzing after making significant changes to your website, or at least monthly to ensure ongoing compliance. Google's policies evolve, and our engine is continuously updated to reflect the latest requirements."
        },
        {
            question: "Is my website data secure?",
            answer: "Absolutely. We only analyze publicly accessible information and don't store sensitive data. All connections are encrypted with TLS 1.3, and we're SOC 2 compliant. Your analysis reports are private and accessible only to you."
        },
        {
            question: "Can I export or share my reports?",
            answer: "Yes! All plans include PDF export functionality. Pro and Enterprise users can also generate shareable links for team collaboration or client presentations. Reports can be customized with your branding on Enterprise plans."
        }
    ];

    return (
        <>
            <Navbar />
            <main className="flex-grow flex flex-col relative z-10">
                {/* Hero */}
                <section className="relative z-10 pt-32 md:pt-40 pb-8 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-4xl w-full text-center">
                        <span className="text-[10px] uppercase tracking-[0.6em] text-slate-400 font-medium mb-6 block">Support</span>
                        <h1 className="text-4xl md:text-5xl font-extralight text-slate-900 tracking-tighter mb-4">
                            Frequently Asked Questions
                        </h1>
                        <p className="text-slate-500 text-base font-light max-w-xl mx-auto">
                            Everything you need to know about Ad2Go and getting your website ready for AdSense.
                        </p>
                    </div>
                </section>

                {/* FAQ Accordion */}
                <section className="relative z-10 py-12 md:py-16 px-4 sm:px-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className="liquid-glass-card rounded-[24px] overflow-hidden"
                                >
                                    <button
                                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                        className="w-full px-6 md:px-8 py-5 md:py-6 flex items-center justify-between gap-4 text-left relative z-10"
                                    >
                                        <span className="text-slate-800 font-light text-base md:text-lg">{faq.question}</span>
                                        <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                                            expand_more
                                        </span>
                                    </button>
                                    <div
                                        className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'
                                            }`}
                                    >
                                        <div className="px-6 md:px-8 pb-6 md:pb-8 relative z-10">
                                            <p className="text-slate-500 text-sm font-light leading-relaxed">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Contact CTA */}
                        <div className="liquid-glass-card-dark rounded-[32px] p-8 md:p-12 text-center mt-12">
                            <div className="relative z-10">
                                <h3 className="text-xl md:text-2xl font-extralight text-white mb-3">Still have questions?</h3>
                                <p className="text-white/60 text-sm mb-6">Our team is here to help you succeed.</p>
                                <a
                                    href="/contact"
                                    className="inline-flex items-center gap-2 px-8 py-4 liquid-glass-button-light rounded-2xl text-xs uppercase tracking-widest font-bold text-slate-900"
                                >
                                    <span className="material-symbols-outlined text-base">mail</span>
                                    Contact Support
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
