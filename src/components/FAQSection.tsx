"use client";
import React, { useState } from "react";

const faqData = [
    {
        question: "How precise is the Ad2Go assessment?",
        answer: "Our assessment utilizes a multi-layered neural auditing framework that mirrors the complexity of premium monetization networks. It doesn't just look for keywords; it evaluates semantic depth, architectural integrity, and the intricate relationship between UX signals and content value."
    },
    {
        question: "Does a 100% score guarantee AdSense approval?",
        answer: "While a 100% score indicates perfect alignment with technical and published policy requirements, the final approval process involves human review. Our platform maximizes your probability by eliminating automated rejection triggers, but it cannot override the final subjective judgment of a human policy officer."
    },
    {
        question: "What specific data points are evaluated?",
        answer: "The engine processes over 200 signals across four core domains: technical infrastructure (crawlability, sitemaps), semantic quality (originality, E-E-A-T signals), structural policy (privacy disclosures, navigation), and performance metrics (LCP, CLS, and mobile responsiveness)."
    },
    {
        question: "Is my website data stored or shared?",
        answer: "We adhere to a strict zero-retention privacy protocol. Your website content and structural data are analyzed in an ephemeral session. Once the audit report is generated, all temporary crawling data is purged from our processing nodes. We never sell or share site data with third parties."
    },
    {
        question: "Who is the platform built for?",
        answer: "Ad2Go is engineered for both independent content creators seeking their first approval and large-scale digital agencies managing hundreds of publisher assets. Our enterprise tier provides the same high-depth intelligence for rapid portfolio scaling and risk mitigation."
    }
];

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const handleToggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="relative z-10 py-20 md:py-32 px-4 sm:px-6 flex flex-col items-center justify-center">
            <div className="max-w-4xl w-full">
                {/* Header */}
                <div className="text-center mb-16 md:mb-24">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-medium mb-4 block">
                        Knowledge Base
                    </span>
                    <h2 className="text-4xl md:text-5xl font-extralight text-slate-900 tracking-tight mb-6">
                        Intelligence Clarity & FAQ
                    </h2>
                    <p className="text-slate-500 max-w-xl mx-auto font-light leading-relaxed text-sm md:text-base">
                        Transparent insights into the mechanics of our neural assessment engine and data privacy protocols.
                    </p>
                </div>

                {/* FAQ Items */}
                <div className="space-y-0">
                    {faqData.map((item, index) => (
                        <div key={index} className="faq-item group">
                            <div className="py-6 md:py-8">
                                <button
                                    onClick={() => handleToggle(index)}
                                    className="w-full flex items-center justify-between cursor-pointer text-left"
                                >
                                    <h3 className="text-base md:text-xl font-medium text-slate-800 tracking-tight group-hover:text-slate-950 transition-colors pr-4">
                                        {item.question}
                                    </h3>
                                    <div className="glass-icon-circle w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 ml-4 md:ml-6 transition-all duration-300">
                                        <span className={`material-symbols-outlined text-slate-400 font-light text-lg md:text-xl transition-transform duration-300 ${openIndex === index ? 'rotate-45' : ''}`}>
                                            add
                                        </span>
                                    </div>
                                </button>
                                {openIndex === index && (
                                    <div className="glass-accordion-content mt-4 p-4 md:p-6">
                                        <p className="text-slate-500 font-light leading-relaxed text-sm md:text-base lg:text-lg">
                                            {item.answer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-16 md:mt-24 text-center">
                    <p className="text-slate-400 text-xs font-light tracking-[0.2em] uppercase mb-6 md:mb-8">
                        Direct support available for Enterprise partners
                    </p>
                    <div className="flex justify-center gap-3 md:gap-4">
                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
