import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function TermsPage() {
    return (
        <>
            <Navbar />
            <main className="flex-grow flex flex-col relative z-10">
                {/* Hero */}
                <section className="relative z-10 pt-32 md:pt-40 pb-8 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-4xl w-full text-center">
                        <span className="text-[10px] uppercase tracking-[0.6em] text-slate-400 font-medium mb-6 block">Legal</span>
                        <h1 className="text-4xl md:text-5xl font-extralight text-slate-900 tracking-tighter mb-4">Terms of Service</h1>
                        <p className="text-slate-500 text-sm font-light">Last updated: February 2026</p>
                    </div>
                </section>

                {/* Content */}
                <section className="relative z-10 py-12 md:py-16 px-4 sm:px-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="liquid-glass-card rounded-[32px] p-8 md:p-12">
                            <div className="relative z-10 prose prose-slate max-w-none">
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-xl font-light text-slate-800 mb-4">1. Acceptance of Terms</h2>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed">
                                            By accessing or using Ad2Go (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
                                        </p>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-light text-slate-800 mb-4">2. Description of Service</h2>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed">
                                            Ad2Go provides website analysis tools to help users understand their Google AdSense readiness. The Service analyzes websites for technical SEO, content quality, trust signals, and policy compliance.
                                        </p>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-light text-slate-800 mb-4">3. User Accounts</h2>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed mb-4">
                                            To use certain features of the Service, you must create an account. You are responsible for:
                                        </p>
                                        <ul className="space-y-2 text-slate-500 text-sm font-light">
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0"></span>
                                                Maintaining the confidentiality of your account credentials
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0"></span>
                                                All activities that occur under your account
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0"></span>
                                                Notifying us of any unauthorized use
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-light text-slate-800 mb-4">4. Acceptable Use</h2>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed mb-4">
                                            You agree not to:
                                        </p>
                                        <ul className="space-y-2 text-slate-500 text-sm font-light">
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0"></span>
                                                Use the Service for any illegal purpose
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0"></span>
                                                Attempt to gain unauthorized access to our systems
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0"></span>
                                                Abuse, harass, or threaten other users
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0"></span>
                                                Submit websites you do not own or have permission to analyze
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-light text-slate-800 mb-4">5. Subscription & Billing</h2>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed">
                                            Paid subscriptions are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law. We reserve the right to change pricing with 30 days notice.
                                        </p>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-light text-slate-800 mb-4">6. Disclaimer of Warranties</h2>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed">
                                            The Service is provided &quot;as is&quot; without warranties of any kind. Ad2Go does not guarantee that using our Service will result in Google AdSense approval. Our analysis is informational and should not be considered as professional advice.
                                        </p>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-light text-slate-800 mb-4">7. Limitation of Liability</h2>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed">
                                            In no event shall Ad2Go be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
                                        </p>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-light text-slate-800 mb-4">8. Changes to Terms</h2>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed">
                                            We reserve the right to modify these Terms at any time. We will notify users of any material changes via email or through the Service.
                                        </p>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-light text-slate-800 mb-4">9. Contact</h2>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed">
                                            For questions about these Terms, please contact us at{" "}
                                            <a href="mailto:legal@ad2go.app" className="text-slate-700 hover:underline">legal@ad2go.app</a>
                                        </p>
                                    </div>
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
