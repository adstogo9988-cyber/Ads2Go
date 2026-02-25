import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export default function BlogPage() {
    const posts = [
        {
            id: 1,
            title: "10 Essential Steps to Get Your Blog Approved for AdSense",
            excerpt: "A comprehensive guide covering everything from content quality to technical SEO requirements for AdSense approval.",
            category: "Guides",
            date: "Feb 1, 2026",
            readTime: "8 min read",
            image: "📝"
        },
        {
            id: 2,
            title: "Understanding Google's E-E-A-T Guidelines",
            excerpt: "Experience, Expertise, Authoritativeness, and Trustworthiness - what they mean for your AdSense application.",
            category: "Education",
            date: "Jan 28, 2026",
            readTime: "6 min read",
            image: "🎓"
        },
        {
            id: 3,
            title: "Common AdSense Rejection Reasons and How to Fix Them",
            excerpt: "Learn from others' mistakes. We analyze the top 10 reasons applications get rejected and provide solutions.",
            category: "Troubleshooting",
            date: "Jan 25, 2026",
            readTime: "10 min read",
            image: "🔧"
        },
        {
            id: 4,
            title: "The Ultimate Privacy Policy Template for AdSense",
            excerpt: "A compliant privacy policy template that covers all Google AdSense requirements. Copy and customize.",
            category: "Templates",
            date: "Jan 22, 2026",
            readTime: "4 min read",
            image: "📋"
        },
        {
            id: 5,
            title: "How to Improve Your Website's Core Web Vitals",
            excerpt: "Page speed matters for AdSense. Here's how to optimize LCP, FID, and CLS for better approval chances.",
            category: "Technical",
            date: "Jan 18, 2026",
            readTime: "12 min read",
            image: "⚡"
        },
        {
            id: 6,
            title: "Content Quality: What Google Really Looks For",
            excerpt: "Beyond word count - understanding what makes content 'valuable' in Google's eyes.",
            category: "Education",
            date: "Jan 15, 2026",
            readTime: "7 min read",
            image: "✨"
        }
    ];

    const categories = ["All", "Guides", "Education", "Technical", "Templates", "Troubleshooting"];

    return (
        <>
            <Navbar />
            <main className="flex-grow flex flex-col relative z-10">
                {/* Hero */}
                <section className="relative z-10 pt-32 md:pt-40 pb-8 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-4xl w-full text-center">
                        <span className="text-[10px] uppercase tracking-[0.6em] text-slate-400 font-medium mb-6 block">Resources</span>
                        <h1 className="text-4xl md:text-5xl font-extralight text-slate-900 tracking-tighter mb-4">
                            AdSense Blog
                        </h1>
                        <p className="text-slate-500 text-base font-light max-w-xl mx-auto">
                            Expert insights, guides, and resources to help you succeed with Google AdSense.
                        </p>
                    </div>
                </section>

                {/* Categories */}
                <section className="relative z-10 py-8 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-wrap gap-2 justify-center">
                            {categories.map((category, index) => (
                                <button
                                    key={category}
                                    className={`px-5 py-2 rounded-full text-xs uppercase tracking-widest font-medium transition-all ${index === 0
                                            ? "bg-slate-900 text-white"
                                            : "liquid-glass-button text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Blog Posts Grid */}
                <section className="relative z-10 py-12 md:py-16 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {posts.map((post) => (
                                <article key={post.id} className="liquid-glass-card rounded-[28px] p-6 group hover:bg-white/60 transition-all">
                                    <div className="relative z-10">
                                        {/* Emoji Image */}
                                        <div className="w-14 h-14 rounded-2xl liquid-glass-icon flex items-center justify-center mb-6 text-2xl">
                                            {post.image}
                                        </div>

                                        {/* Category & Date */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-[10px] uppercase tracking-widest text-emerald-600 font-medium">{post.category}</span>
                                            <span className="text-slate-300">·</span>
                                            <span className="text-[10px] text-slate-400">{post.date}</span>
                                        </div>

                                        {/* Title */}
                                        <h2 className="text-lg font-light text-slate-800 mb-3 group-hover:text-slate-900 transition-colors leading-snug">
                                            {post.title}
                                        </h2>

                                        {/* Excerpt */}
                                        <p className="text-slate-500 text-sm font-light mb-4 line-clamp-2">
                                            {post.excerpt}
                                        </p>

                                        {/* Read More */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-slate-400">{post.readTime}</span>
                                            <Link
                                                href="#"
                                                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
                                            >
                                                Read More
                                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* Load More */}
                        <div className="text-center mt-12">
                            <button className="px-8 py-3 liquid-glass-button rounded-full text-xs uppercase tracking-widest font-medium text-slate-700">
                                Load More Articles
                            </button>
                        </div>
                    </div>
                </section>

                {/* Newsletter CTA */}
                <section className="relative z-10 py-16 md:py-24 px-4 sm:px-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="liquid-glass-card-dark rounded-[32px] p-8 md:p-12 text-center">
                            <div className="relative z-10">
                                <span className="text-[10px] uppercase tracking-[0.5em] text-white/40 font-medium mb-4 block">Newsletter</span>
                                <h3 className="text-2xl md:text-3xl font-extralight text-white mb-3">
                                    Stay Updated
                                </h3>
                                <p className="text-white/60 text-sm mb-8 max-w-md mx-auto">
                                    Get the latest AdSense tips and industry updates delivered to your inbox.
                                </p>
                                <form className="max-w-md mx-auto flex gap-3">
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="flex-1 px-5 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-white/30 focus:outline-none text-white text-sm placeholder:text-white/30"
                                    />
                                    <button
                                        type="submit"
                                        className="px-6 py-3 liquid-glass-button-light rounded-xl text-xs uppercase tracking-widest font-bold text-slate-900"
                                    >
                                        Subscribe
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
