import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function PrivacyPage() {
    return (
        <>
            <Navbar />
            <main className="flex-grow flex flex-col relative z-10">
                {/* Hero */}
                <section className="relative z-10 pt-32 md:pt-40 pb-8 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-4xl w-full text-center">
                        <span className="text-[10px] uppercase tracking-[0.6em] text-slate-400 font-medium mb-6 block">Legal</span>
                        <h1 className="text-4xl md:text-5xl font-extralight text-slate-900 tracking-tighter mb-4">Privacy Policy</h1>
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
                                        <h2 className="text-xl font-light text-slate-800 mb-4">1. Information We Collect</h2>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed mb-4">
                                            When you use Ad2Go, we collect information you provide directly to us, such as when you create an account, submit a website for analysis, or contact us for support.
                                        </p>
                                        <ul className="space-y-2 text-slate-500 text-sm font-light">
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0"></span>
                                                Account information (name, email, password)
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0"></span>
                                                Website URLs submitted for analysis
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0"></span>
                                                Usage data and analytics
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-light text-slate-800 mb-4">2. How We Use Your Information</h2>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed">
                                            We use the information we collect to provide, maintain, and improve our services, including analyzing websites for AdSense readiness, generating reports, and providing personalized recommendations.
                                        </p>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-light text-slate-800 mb-4">3. Data Security</h2>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed">
                                            We implement industry-standard security measures to protect your data. All data is encrypted in transit and at rest. We are SOC 2 compliant and undergo regular security audits.
                                        </p>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-light text-slate-800 mb-4">4. Data Retention</h2>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed">
                                            We retain your analysis data for as long as your account is active. You can request deletion of your data at any time by contacting our support team.
                                        </p>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-light text-slate-800 mb-4">5. Third-Party Services</h2>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed">
                                            We may share anonymized, aggregated data with third parties for analytics purposes. We do not sell your personal information to third parties.
                                        </p>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-light text-slate-800 mb-4">6. Cookies</h2>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed">
                                            We use cookies and similar technologies to provide functionality and analyze usage. You can control cookie settings through your browser preferences.
                                        </p>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-light text-slate-800 mb-4">7. Your Rights</h2>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed mb-4">
                                            Under GDPR and other privacy regulations, you have the right to:
                                        </p>
                                        <ul className="space-y-2 text-slate-500 text-sm font-light">
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0"></span>
                                                Access your personal data
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0"></span>
                                                Request correction or deletion
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0"></span>
                                                Export your data
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0"></span>
                                                Opt out of marketing communications
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-light text-slate-800 mb-4">8. Contact Us</h2>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed">
                                            If you have questions about this Privacy Policy, please contact us at{" "}
                                            <a href="mailto:privacy@ad2go.app" className="text-slate-700 hover:underline">privacy@ad2go.app</a>
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
