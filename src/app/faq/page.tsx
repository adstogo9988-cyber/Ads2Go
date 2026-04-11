"use client";
import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
    Cpu, 
    ShieldAlert, 
    CreditCard, 
    Lock, 
    ChevronRight, 
    MessageCircle,
    CheckCircle2,
    Zap,
    Scale,
    FileText,
    HelpCircle
} from "lucide-react";

export default function FAQPage() {
    const [activeCategory, setActiveCategory] = useState("platform");
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const categories = [
        { id: "platform", label: "Analysis Engine", icon: <Cpu size={18} /> },
        { id: "policy", label: "Compliance & Policy", icon: <ShieldAlert size={18} /> },
        { id: "billing", label: "Billing & Accounts", icon: <CreditCard size={18} /> },
        { id: "tech", label: "Technical & Security", icon: <Lock size={18} /> },
    ];

    const faqData: Record<string, { question: string, answer: string }[]> = {
        platform: [
            {
                question: "What exactly is Ad2Go and how does it help?",
                answer: "Ad2Go is an AI-powered intelligence platform that bridges the gap between publishers and Google AdSense approval. We analyze 120+ factors that Google reviews, providing you with a readiness score and a prioritized roadmap to fix issues before you apply."
            },
            {
                question: "How does the AI Analysis engine simulate Google's review?",
                answer: "Our neural engine uses multi-layered crawlers that mimic both Googlebot and a human reviewer's perspective. It examines DOM structure, semantic content depth, technical SEO, and user experience signals, comparing them against millions of approved and rejected sites."
            },
            {
                question: "What is a 'Readiness Score'?",
                answer: "Your readiness score is a weighted index (0-100) calculated based on four pillars: Technical Quality, Content Value, Trust Signals, and Policy Compliance. A score above 85 generally indicates a very high probability of approval."
            },
            {
                question: "Can I analyze websites I don't own?",
                answer: "Yes. You can analyze any publicly accessible domain. This is perfect for competitive research, evaluating niche profitability, or for agencies helping clients prepare for monetization."
            },
            {
                question: "How long does a typical website analysis take?",
                answer: "Our system is optimized for speed. A deep scan usually completes in 45-90 seconds, depending on the site's size and server response time. You'll receive a full interactive report immediately after."
            },
            {
                question: "What are 'High-Value Content' recommendations?",
                answer: "Google's most common rejection is 'Low Value Content'. Our AI identifies thin pages, readability issues, and lack of topical authority, offering specific advice on how to improve your content's E-E-A-T signals."
            },
            {
                question: "How often should I re-analyze my site?",
                answer: "We recommend a fresh scan after implementing the major fixes suggested in your report, or at least monthly if you are constantly updating content. This ensures you haven't introduced any new policy blockers."
            },
            {
                question: "Does Ad2Go guarantee AdSense approval?",
                answer: "While we have a 94% correlation rate with Google's final decisions, only Google makes the final choice. However, following our roadmap ensures your site meets all technical and policy requirements, minimizing the risk of rejection."
            }
        ],
        policy: [
            {
                question: "Does Ad2Go detect hidden policy violations?",
                answer: "Yes. We scan for hundreds of triggers including copyrighted material, adult content, sensitive topics, and dynamic content that might violate AdSense Program Policies."
            },
            {
                question: "How do you help with 'Low Value Content' errors?",
                answer: "Our engine analyzes word count, information density, and original thought markers. We highlight exactly which pages are 'thin' and provide a content strategy to boost your value-per-page metrics."
            },
            {
                question: "Is navigation and site structure checked?",
                answer: "Absolutely. We check for broken links, confusing menu structures, and 'trap' navigation that could lead to a 'Difficult to Navigate' rejection."
            },
            {
                question: "Can you detect scraped or replicated content?",
                answer: "Our semantic analyzer checks for content uniqueness. If your page heavily borrows from other sources without adding significant value, we flag it so you can re-write it before Google's crawlers find it."
            },
            {
                question: "What about 'Site Down or Unavailable' errors?",
                answer: "We check your server response headers, SSL certificate validity, and mobile rendering to ensure your site is perfectly accessible to Google's reviewers across all devices."
            },
            {
                question: "Do you provide a formal Compliance Report?",
                answer: "Yes. All reports include a 'Compliance Checklist' that you can use as a final 10-point inspection before hitting the 'Submit' button on your AdSense dashboard."
            },
            {
                question: "What are 'Trust Signals'?",
                answer: "Trust signals include the presence of a Privacy Policy, About Us, and Contact pages, as well as clear authorship. We ensure these high-priority pages are correctly implemented and easily accessible."
            }
        ],
        billing: [
            {
                question: "How do I upgrade to a PRO or Enterprise plan?",
                answer: "You can upgrade directly from your Dashboard under the 'Billing' tab. Choose your preferred plan, and your account will be upgraded instantly with new credits and features."
            },
            {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and region-specific gateways like PayFast. All transactions are processed through enterprise-grade encrypted channels."
            },
            {
                question: "Are there any hidden fees or recurring charges?",
                answer: "No. We believe in transparent pricing. You only pay the subscription fee stated on our pricing page. You can cancel any time with no termination fees."
            },
            {
                question: "How do I get an invoice for my purchase?",
                answer: "Invoices are automatically generated and sent to your registered email address. You can also download them at any time from your account's 'Billing History' section."
            },
            {
                question: "Can I get a refund if I'm not satisfied?",
                answer: "We offer a 7-day money-back guarantee for our Pro plans if you've used fewer than 2 analysis credits. We are committed to your satisfaction and success."
            },
            {
                question: "Is there a discount for annual billing?",
                answer: "Yes! Choosing our annual plan saves you 20% compared to monthly billing. It's the best value for serious publishers and agencies."
            },
            {
                question: "What happens if I run out of analysis credits?",
                answer: "You can purchase individual 'Add-on' credits or upgrade to a higher tier. Credits in the Pro and Enterprise plans also roll over for a limited time."
            }
        ],
        tech: [
            {
                question: "Does Ad2Go's crawler affect my site's speed?",
                answer: "No. Our crawler is designed to be 'polite'. It fetches pages with controlled throttling that mimics a standard user, ensuring zero impact on your server performance or your site's SEO."
            },
            {
                question: "Is my site's data kept private?",
                answer: "Safety is our priority. We only analyze publicly accessible front-end data. Your analysis reports are stored in encrypted databases and are never shared with third parties or Google bots."
            },
            {
                question: "Do you offer API access for bulk analysis?",
                answer: "Yes. Our Enterprise plan includes full REST API access, perfect for developers and agencies who want to integrate our engine into their own proprietary dashboards."
            },
            {
                question: "Can I share or white-label my reports?",
                answer: "Pro users can generate shareable PDF reports. Enterprise users have the option to add their own branding to the analysis reports for client presentations."
            },
            {
                question: "Is my personal account data secure?",
                answer: "We use industry-standard TLS 1.3 encryption and Supabase's secure authentication. We never store your credit card information directly on our servers."
            },
            {
                question: "What technical SEO factors do you analyze?",
                answer: "We scan meta tags, schema markup, h1-h6 hierarchy, image alt attributes, mobile responsiveness, and core web vitals readiness."
            },
            {
                question: "Do I need to install any plugin to use Ad2Go?",
                answer: "No installation required. Ad2Go works entirely in the cloud. Just enter your URL and let our engine do the heavy lifting remotely."
            }
        ]
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#fcfdfe]">
            <Navbar />
            
            <main className="flex-grow pt-32 pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section - Themed */}
                    <div className="mb-20 relative text-center lg:text-left">
                        <div className="absolute -top-12 -left-20 w-64 h-64 bg-slate-400/5 blur-[80px] rounded-full"></div>
                        <div className="relative">
                            <span className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-bold mb-4 block">Knowledge Repository</span>
                            <h1 className="text-4xl md:text-7xl font-extralight text-[#0f172a] tracking-tight leading-[1.1] mb-6">
                                Everything you need <br />
                                to <span className="font-normal text-[#333a4a]">master AdSense.</span>
                            </h1>
                            <p className="text-slate-500 text-lg font-light max-w-2xl leading-relaxed mx-auto lg:mx-0">
                                Detailed insights into our AI engine, compliance protocols, and technical architecture. Transparent and comprehensive.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12 items-start">
                        
                        {/* ── Left Sidebar (Sticky Category Nav) ── */}
                        <div className="w-full lg:w-80 lg:sticky lg:top-32 space-y-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setActiveCategory(cat.id);
                                        setOpenIndex(0);
                                    }}
                                    className={`w-full text-left flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group border ${
                                        activeCategory === cat.id 
                                        ? "bg-[#333a4a] text-white border-[#333a4a] shadow-xl shadow-slate-900/10" 
                                        : "hover:bg-slate-50 text-slate-600 border-transparent"
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl transition-colors ${
                                            activeCategory === cat.id ? "bg-white/10" : "bg-slate-100 text-slate-500 group-hover:bg-white"
                                        }`}>
                                            {cat.icon}
                                        </div>
                                        <span className="font-semibold text-sm tracking-tight">{cat.label}</span>
                                    </div>
                                    <ChevronRight size={16} className={`transition-transform duration-300 ${
                                        activeCategory === cat.id ? "rotate-90 translate-x-1" : "opacity-0 group-hover:opacity-100"
                                    }`} />
                                </button>
                            ))}

                            {/* Help Box */}
                            <div className="mt-12 p-8 rounded-[32px] bg-slate-50 border border-slate-100 hidden lg:block relative overflow-hidden group">
                                <HelpCircle className="text-slate-200 absolute -bottom-4 -right-4 rotate-12 group-hover:text-[#333a4a]/10 transition-colors" size={80} />
                                <div className="relative z-10">
                                    <p className="text-sm font-semibold text-slate-900 mb-2">Need direct help?</p>
                                    <p className="text-xs text-slate-500 leading-relaxed font-light mb-4">
                                        Our support engineers are available for live consultation.
                                    </p>
                                    <a href="/contact" className="text-[10px] uppercase tracking-widest font-bold text-[#333a4a] flex items-center gap-2 hover:gap-3 transition-all">
                                        Talk to us <Zap size={10} />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* ── Right Content (FAQ Accordions) ── */}
                        <div className="flex-1 w-full space-y-5">
                            <div className="grid grid-cols-1 gap-4">
                                {faqData[activeCategory].map((faq, idx) => {
                                    const isOpen = openIndex === idx;
                                    return (
                                        <div 
                                            key={idx}
                                            className={`liquid-glass-card rounded-[24px] overflow-hidden transition-all duration-500 border ${
                                                isOpen ? "border-[#333a4a]/20 shadow-2xl shadow-[#333a4a]/5 bg-white" : "hover:border-slate-200 border-transparent bg-white/50"
                                            }`}
                                        >
                                            <button
                                                onClick={() => setOpenIndex(isOpen ? null : idx)}
                                                className="w-full px-8 py-6 flex items-center justify-between gap-6 text-left group"
                                            >
                                                <div className="flex items-center gap-4">
                                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOpen ? 'bg-[#333a4a] text-white' : 'bg-slate-100 text-slate-400'}`}>0{idx + 1}</span>
                                                  <span className={`text-base md:text-lg font-medium transition-all duration-300 ${
                                                      isOpen ? "text-[#0f172a]" : "text-slate-700"
                                                  }`}>
                                                      {faq.question}
                                                  </span>
                                                </div>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                                                    isOpen ? "bg-[#333a4a] text-white rotate-180" : "bg-slate-50 text-slate-400 group-hover:bg-white"
                                                }`}>
                                                    <ChevronRight size={18} />
                                                </div>
                                            </button>
                                            
                                            <div className={`transition-all duration-500 ease-in-out ${
                                                isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                                            }`}>
                                                <div className="px-8 pb-8 pl-16">
                                                    <div className="h-[1px] w-full bg-slate-100 mb-6" />
                                                    <p className="text-slate-600 text-base font-light leading-relaxed">
                                                        {faq.answer}
                                                    </p>
                                                    
                                                    <div className="mt-6 flex items-center gap-2 pt-4">
                                                        <CheckCircle2 size={14} className="text-[#333a4a]" />
                                                        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Verified by Ad2Go Experts</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Enhanced CTA */}
                            <div className="mt-12 p-12 rounded-[40px] bg-[#0f172a] relative overflow-hidden group shadow-2xl shadow-slate-900/30">
                                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#333a4a]/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-[#333a4a]/30 transition-all duration-1000"></div>
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                    <div className="text-center md:text-left">
                                        <h3 className="text-3xl font-extralight text-white mb-4">Ready to scan your <br /><span className="font-normal text-[#9ca3af]">own website?</span></h3>
                                        <div className="flex items-center gap-6 justify-center md:justify-start">
                                            <div className="flex -space-x-3">
                                            {[1,2,3].map(i => (
                                                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 overflow-hidden bg-slate-800 shadow-inner">
                                                    <img 
                                                        src={`/avatars/avatar-${i}.png`} 
                                                        alt={`Optimized User ${i}`} 
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=User&background=333a4a&color=fff"; }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-slate-400 text-xs font-light">+2.4k users optimized this week</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <a href="/analysis" className="px-10 py-5 bg-[#333a4a] hover:bg-[#2c3240] transition-all rounded-2xl text-[10px] uppercase tracking-widest font-bold text-white shadow-xl shadow-slate-900/40">
                                            Initiate Analysis
                                        </a>
                                        <a href="/contact" className="px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 transition-all rounded-2xl text-[10px] uppercase tracking-widest font-bold text-white">
                                            Contact Support
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
}
