"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

function ResultsContent() {
    const [activeTab, setActiveTab] = useState<"overview" | "report" | "roadmap" | "ai_assistant">("overview");
    const [analysisUrl, setAnalysisUrl] = useState("example.com");
    const [scanData, setScanData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [generatingAI, setGeneratingAI] = useState<{ [key: string]: boolean }>({});
    const [copySuccess, setCopySuccess] = useState(false);
    const [activeDraft, setActiveDraft] = useState<{ type: string, content: string, regenerating: boolean } | null>(null);
    const searchParams = useSearchParams();
    const scanId = searchParams.get("id");

    useEffect(() => {
        if (scanId) {
            fetchScanResults(scanId);
        } else {
            // Fallback to session storage if no ID in URL
            const storedId = sessionStorage.getItem("currentScanId");
            if (storedId) fetchScanResults(storedId);
        }
    }, [scanId]);

    const fetchScanResults = async (id: string) => {
        try {
            const { data, error } = await supabase
                .from('adsense_scans')
                .select('*, sites(url, domain)')
                .eq('id', id)
                .single();

            if (error) throw error;
            setScanData(data);
            setAnalysisUrl(data.sites?.domain || "site.com");
        } catch (err) {
            console.error("Error fetching scan results:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate dynamic state from scanData
    const getOverallScore = () => scanData?.overall_score || 0;
    const getVerdict = () => {
        const score = getOverallScore();
        if (score >= 80) return "ready";
        if (score >= 50) return "fix";
        return "not_ready";
    };

    const handleRegenerateDraft = async (pageType: string) => {
        if (!scanData || !scanId) return;
        setActiveDraft(prev => prev ? { ...prev, regenerating: true } : null);
        try {
            const res = await fetch('/api/drafts/regenerate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scan_id: scanId,
                    domain: scanData.sites?.domain || analysisUrl,
                    page_type: pageType
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setActiveDraft({ type: pageType, content: data.draft, regenerating: false });
                setScanData((prev: any) => {
                    const newData = { ...prev };
                    if (newData.trust_pages_data && newData.trust_pages_data.drafts) {
                        newData.trust_pages_data.drafts[pageType] = data.draft;
                    }
                    return newData;
                });
            }
        } catch (e) {
            console.error("Draft generation error:", e);
        } finally {
            setActiveDraft(prev => prev ? { ...prev, regenerating: false } : null);
        }
    };

    const handleGenerateAI = async (endpoint: string, stateKey: string) => {
        if (!scanData || !scanId) return;
        setGeneratingAI(prev => ({ ...prev, [stateKey]: true }));
        try {
            const res = await fetch(`/api/ai/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scan_id: scanId })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setScanData((prev: any) => {
                    const newData = { ...prev };
                    if (!newData.core_scan_data) newData.core_scan_data = {};
                    if (!newData.core_scan_data.ai_recommendations) newData.core_scan_data.ai_recommendations = {};

                    if (stateKey === 'content') newData.core_scan_data.ai_recommendations.content_improvements = data.improvements;
                    if (stateKey === 'monetization') newData.core_scan_data.ai_recommendations.monetization = data.suggestions;
                    if (stateKey === 'appeal') newData.core_scan_data.ai_recommendations.appeal_draft = data.draft;

                    return newData;
                });
            } else {
                alert(`Failed to generate ${stateKey}: ` + data.error);
            }
        } catch (e) {
            console.error(`AI generation error for ${stateKey}:`, e);
        } finally {
            setGeneratingAI(prev => ({ ...prev, [stateKey]: false }));
        }
    };

    const handleGenerateContentImprovements = () => handleGenerateAI('content-improvements', 'content');
    const handleGenerateMonetization = () => handleGenerateAI('monetization', 'monetization');
    const handleGenerateAppeal = () => handleGenerateAI('appeal/generate', 'appeal');

    // Categorized Check definitions
    const getReportDetails = () => {
        if (!scanData) return [];

        const core = scanData.core_scan_data || {};
        const trust = scanData.trust_pages_data || {};
        const seo = scanData.seo_indexing_data || {};
        const security = scanData.security_data || {};

        const categories = [
            {
                name: "Technical SEO",
                checks: [
                    {
                        title: "robots.txt presence & validity",
                        status: core.robots_txt?.exists ? (core.robots_txt?.has_disallow ? "warning" : "pass") : "fail",
                        value: core.robots_txt?.exists ? "Found" : "Missing",
                        description: "Instructs search engines which pages to crawl or avoid.",
                        fix: core.robots_txt?.exists ? "Review Disallow rules to ensure important content isn't blocked." : "Create a robots.txt file in your root directory allowing Googlebot access."
                    },
                    {
                        title: "sitemap.xml health check",
                        status: core.sitemap_xml?.exists ? (core.sitemap_xml.is_valid_xml ? "pass" : "warning") : "fail",
                        value: core.sitemap_xml?.exists ? (core.sitemap_xml.is_valid_xml ? `Valid XML (${core.sitemap_xml.url_count || 0} URLs)` : "Invalid XML Format") : "Missing",
                        description: "Helps search engines discover all URLs on your website rapidly.",
                        fix: "Ensure your sitemap is a valid XML file and submit it to Google Search Console."
                    },
                    {
                        title: "canonical tags",
                        status: seo.canonical_conflict ? "fail" : (seo.canonical ? "pass" : "fail"),
                        value: seo.canonical_conflict ? "Conflict Detected" : (seo.canonical ? "Present" : "Missing"),
                        description: "Prevents duplicate content issues by specifying the master URL.",
                        fix: seo.canonical_conflict ? "Ensure canonical URL matches the final resolved URL." : "Add <link rel=\"canonical\" href=\"...\"> to the <head> of all your pages."
                    },
                    {
                        title: "meta title & meta description",
                        status: (!seo.title || !seo.meta_description) ? "fail" : ((!seo.title_optimization?.is_optimal || !seo.description_optimization?.is_optimal) ? "warning" : "pass"),
                        value: (!seo.title || !seo.meta_description) ? "Missing Elements" : ((seo.title_optimization?.is_optimal && seo.description_optimization?.is_optimal) ? "Optimal Lengths" : "Suboptimal Lengths"),
                        description: "Essential for search engine snippets and click-through rates.",
                        fix: "Ensure <title> is 50-60 characters and <meta name=\"description\"> is 120-160 characters."
                    },
                    {
                        title: "heading structure (H1–H6)",
                        status: seo.headings?.missing_h1 ? "fail" : ((seo.headings?.multiple_h1 || seo.headings?.hierarchy_issue) ? "warning" : "pass"),
                        value: seo.headings?.missing_h1 ? "Missing H1" : (seo.headings?.multiple_h1 ? "Multiple H1s" : (seo.headings?.hierarchy_issue ? "Hierarchy Issue" : "Proper Hierarchy")),
                        description: "Proper HTML heading hierarchy improves readability and SEO semantics.",
                        fix: "Use exactly one <h1> per page. Use <h2> and <h3> for sub-sections sequentially."
                    },
                    {
                        title: "internal linking analysis",
                        status: seo.internal_linking_analysis?.orphan_risk === "High" ? "fail" : (seo.internal_linking_analysis?.adequate_links ? "pass" : "warning"),
                        value: `${seo.internal_links || 0} Links (${seo.internal_linking_analysis?.orphan_risk === "High" ? "Orphan Risk" : "Healthy"})`,
                        description: "Helps users and bots navigate your content and passes link equity.",
                        fix: "Ensure all important pages are linked internally to avoid orphan content."
                    },
                    {
                        title: "broken links detection",
                        status: core.broken_links?.broken === 0 ? "pass" : (core.broken_links ? "fail" : "not_scanned"),
                        value: core.broken_links ? `${core.broken_links.broken} Broken` : "N/A",
                        description: "Broken links (404s) severely harm user experience and crawl budgets.",
                        fix: "Identify and replace or remove all dead links pointing to 404 pages."
                    },
                    {
                        title: "noindex / nofollow pages",
                        status: seo.meta_robots?.noindex ? "fail" : "pass",
                        value: seo.meta_robots?.noindex ? "NoIndex Detected" : "Indexable",
                        description: "If active, search engines will completely ignore your pages.",
                        fix: "Remove <meta name=\"robots\" content=\"noindex\"> from pages you want to show up in search."
                    },
                    {
                        title: "crawlability status",
                        status: core.redirects?.has_chain ? "fail" : (core.ssl_check?.status === "passed" && core.broken_links?.broken === 0 ? "pass" : "warning"),
                        value: core.redirects?.has_chain ? "Redirect Chain Detected" : "Analyzed",
                        description: "General assessment of how easily Googlebot can browse your site structure.",
                        fix: core.redirects?.has_chain ? "Remove long redirect chains to ensure direct resolution." : "Fix internal server errors, broken links, and SSL blockages."
                    },
                    {
                        title: "mobile friendliness",
                        status: core.pagespeed?.mobile_score >= 60 ? "pass" : (core.pagespeed ? "fail" : "not_scanned"),
                        value: core.pagespeed ? `${core.pagespeed.mobile_score || core.pagespeed.score || "N/A"}/100 Score` : "N/A",
                        description: "Google exclusively indexes the mobile version of websites.",
                        fix: "Implement responsive design, readable font sizes, and spaced tap targets."
                    }
                ]
            },
            {
                name: "Trust & Domain Signals",
                checks: [
                    {
                        title: "domain age",
                        status: (() => {
                            const age = core.domain_age;
                            if (!age || !age.total_days) return "not_scanned";
                            if (age.total_days < 180) return "fail";
                            if (age.total_days < 365) return "warning";
                            return "pass";
                        })(),
                        value: (() => {
                            const age = core.domain_age;
                            if (!age || !age.total_days) return "N/A";
                            const yr = age.years > 0 ? `${age.years}y ` : "";
                            const mo = age.months > 0 ? `${age.months}mo` : "";
                            return `${yr}${mo}`.trim() || `${age.total_days} days`;
                        })(),
                        description: "Older domains generally possess higher inherent authority in search algorithms.",
                        fix: "Age naturally. Ensure continuous registration to avoid drops."
                    },
                    {
                        title: "domain authority (DA/DR estimate)",
                        status: (() => {
                            const da = core.domain_authority;
                            if (!da || da.source === "none" || da.score == null) return "not_scanned";
                            if (da.score >= 40) return "pass";
                            if (da.score >= 20) return "warning";
                            return "fail";
                        })(),
                        value: (() => {
                            const da = core.domain_authority;
                            if (!da || da.source === "none" || da.score == null)
                                return "Add OPEN_PAGERANK_API_KEY (free at openpr.info)";
                            return `${da.score}/100 (Open PageRank · ${da.scale || "0-100"})`;
                        })(),
                        description: "A metric predicting how well a website will rank based on its backlink profile.",
                        fix: "Build high-quality, relevant backlinks from trusted websites over time."
                    },
                    {
                        title: "HTTPS & SSL validity",
                        status: core.ssl_check?.status === "passed" ? "pass" : "fail",
                        value: core.ssl_check?.protocol || "HTTP",
                        description: "Encrypts data between visitors and your server. A strict AdSense requirement.",
                        fix: "Install a valid SSL certificate (e.g., Let's Encrypt) and force HTTPS redirects."
                    },
                    {
                        title: "Google Safe Browsing check",
                        status: security.safe_browsing?.status === "safe" ? "pass" : (security.safe_browsing ? "fail" : "not_scanned"),
                        value: security.safe_browsing?.status === "safe" ? "Clean" : (security.safe_browsing?.status === "unsafe" ? "Flagged" : "Unknown"),
                        description: "Checks if your domain is blacklisted by Google for malware or phishing.",
                        fix: "Use Google Search Console's Security Issues report to request a review after cleaning malware."
                    },
                    {
                        title: "WHOIS visibility & Registration",
                        status: core.whois_visibility?.creation_date ? "pass" : (core.whois_visibility ? "warning" : "not_scanned"),
                        value: core.whois_visibility?.creation_date
                            ? `Reg: ${core.whois_visibility.creation_date.substring(0, 10)}` +
                            (core.whois_visibility.expiration_date ? ` · Exp: ${core.whois_visibility.expiration_date.substring(0, 10)}` : "") +
                            (core.whois_visibility.registrar ? ` · ${core.whois_visibility.registrar}` : "") +
                            (core.whois_visibility.domain_status ? ` (${core.whois_visibility.domain_status.split(" ")[0]})` : "")
                            : (core.whois_visibility ? "Private / Hidden" : "N/A"),
                        description: "Public registration details increase transparency. Registrars and domain statuses provide tracking points.",
                        fix: "Optional: Remove aggressive WHOIS privacy if running a commercial corporate entity."
                    },
                    {
                        title: "brand signals / contact presence",
                        status: trust.summary?.contact ? "pass" : "fail",
                        value: trust.summary?.contact ? "Contact Found" : "Missing Contact",
                        description: "Real businesses have visible ways for users to reach them.",
                        fix: "Add a dedicated 'Contact Us' page with an email, form, or physical address."
                    }
                ]
            },
            {
                name: "Schema & Structured Data",
                checks: [
                    {
                        title: "schema markup presence",
                        status: seo.structured_data?.detected ? "pass" : "fail",
                        value: seo.structured_data?.detected ? "Detected" : "None",
                        description: "Code that helps search engines understand the exact meaning of your content.",
                        fix: "Inject basic JSON-LD schema into your document <head>."
                    },
                    {
                        title: "JSON-LD validation",
                        status: seo.structured_data?.detected ? (seo.structured_data.valid_syntax ? "pass" : "fail") : "warning",
                        value: seo.structured_data?.detected ? (seo.structured_data.valid_syntax ? `Valid Syntax (${seo.structured_data.valid_count} Tags)` : "Parse Errors Detected") : "N/A",
                        description: "Modern format recommended by Google over Microdata.",
                        fix: "Validate your JSON-LD using Google's Rich Results Test tool to fix JSON syntax errors."
                    },
                    {
                        title: "organization schema",
                        status: seo.structured_data?.types?.includes("Organization") || seo.structured_data?.types?.includes("WebSite") ? "pass" : "warning",
                        value: seo.structured_data?.types?.includes("Organization") ? "Found" : "Missing",
                        description: "Associates your brand name, logo, and social profiles centrally.",
                        fix: "Add an 'Organization' schema to the homepage."
                    },
                    {
                        title: "breadcrumb schema",
                        status: seo.structured_data?.types?.includes("BreadcrumbList") ? "pass" : "warning",
                        value: seo.structured_data?.types?.includes("BreadcrumbList") ? "Found" : "Missing",
                        description: "Displays clear navigation paths directly in Google Search Snippets.",
                        fix: "Implement 'BreadcrumbList' schema if your site has nested categories."
                    },
                    {
                        title: "article/product schema",
                        status: seo.structured_data?.types?.includes("Article") || seo.structured_data?.types?.includes("NewsArticle") || seo.structured_data?.types?.includes("Product") ? "pass" : "warning",
                        value: seo.structured_data?.types?.includes("Article") ? "Found" : "Missing",
                        description: "Crucial for blogs to get featured in Top Stories and rich carousels.",
                        fix: "Add 'Article' or 'BlogPosting' schema to all your blog post templates."
                    },
                    {
                        title: "rich results eligibility",
                        status: seo.structured_data?.detected ? "pass" : "fail",
                        value: seo.structured_data?.detected ? "Eligible" : "Ineligible",
                        description: "Determines if your site can trigger stars, FAQs, or carousel snippets.",
                        fix: "Use Google's Rich Results Testing Tool to validate your specific schemas."
                    }
                ]
            },
            {
                name: "Content Quality",
                checks: [
                    {
                        title: "word count",
                        status: core.content_analysis?.word_count > 500 ? "pass" : (core.content_analysis?.word_count ? "warning" : "not_scanned"),
                        value: core.content_analysis?.word_count ? `${core.content_analysis.word_count} Words` : "N/A",
                        description: "AdSense prefers rich, comprehensive content over short ambiguous posts.",
                        fix: "Aim for text-rich pages. Expand sparse articles with more detailed, helpful insights."
                    },
                    {
                        title: "duplicate content detection",
                        status: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Duplicate Pattern") ? "fail" : (core.ai_policy ? "pass" : "not_scanned"),
                        value: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Duplicate Pattern") ? "Violations" : (core.ai_policy ? "Originality Expected" : "Requires Scan"),
                        description: "Scraping or duplicating content heavily violates AdSense Content Policies.",
                        fix: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Duplicate Pattern")?.fix_suggestion || "Write 100% original content from your own perspective."
                    },
                    {
                        title: "readability score",
                        status: core.content_analysis?.readability_grade === "Easy" ? "pass" : (core.content_analysis?.readability_grade === "Moderate" ? "warning" : (core.content_analysis?.readability_grade ? "fail" : "not_scanned")),
                        value: core.content_analysis?.readability_grade ? `${core.content_analysis.readability_grade} (avg ${core.content_analysis.avg_sentence_length} words/sentence)` : "N/A",
                        description: "Content should be easily understandable by the general public.",
                        fix: "Write using short paragraphs, simple vocabulary, and clear formatting."
                    },
                    {
                        title: "keyword density",
                        status: core.content_analysis?.keyword_stuffed ? "warning" : (core.content_analysis?.top_keyword ? "pass" : "not_scanned"),
                        value: core.content_analysis?.top_keyword ? `"${core.content_analysis.top_keyword}" at ${core.content_analysis.keyword_density}%` : "N/A",
                        description: "Overusing keywords (Keyword Stuffing) leads to search penalties.",
                        fix: "Write naturally for humans. Keep top keyword density below 5%."
                    },
                    {
                        title: "content originality",
                        status: core.ai_policy?.policy_violations?.find((v: any) => v.category === "AI Spam") ? "fail" : (core.ai_policy?.risk_score < 70 ? "pass" : (core.ai_policy ? "fail" : "not_scanned")),
                        value: core.ai_policy?.policy_violations?.find((v: any) => v.category === "AI Spam") ? "AI Spam Detected" : (core.ai_policy ? `AI Risk Score: ${core.ai_policy.risk_score}/100` : "N/A"),
                        description: "Detects purely automated, unedited AI content or spammy spin-offs.",
                        fix: core.ai_policy?.policy_violations?.find((v: any) => v.category === "AI Spam")?.fix_suggestion || "If using AI helpers, aggressively edit and inject your personal voice/opinions."
                    },
                    {
                        title: "thin content pages",
                        status: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Thin Content") || core.content_analysis?.has_thin_content ? "fail" : "pass",
                        value: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Thin Content") ? "Low Value Content" : (core.content_analysis?.has_thin_content ? `${core.content_analysis.thin_content_pages} thin pages found` : "None Detected"),
                        description: "Pages with very little text are termed 'low value content' by AdSense.",
                        fix: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Thin Content")?.fix_suggestion || "Consolidate thin pages together or expand them significantly."
                    }
                ]
            },
            {
                name: "Performance",
                checks: [
                    {
                        title: "page load time",
                        status: core.pagespeed?.score >= 50 ? "pass" : (core.pagespeed ? "fail" : "not_scanned"),
                        value: core.pagespeed
                            ? `Mobile: ${core.pagespeed.mobile_score ?? "N/A"} | Desktop: ${core.pagespeed.desktop_score ?? "N/A"}${core.pagespeed.tbt ? ` | TBT: ${core.pagespeed.tbt}` : ""}`
                            : "N/A",
                        description: "Aggregated performance score representing overall speed.",
                        fix: "Optimize servers, leverage caching, and reduce heavy scripts."
                    },
                    {
                        title: "Core Web Vitals (LCP, CLS, INP)",
                        status: (() => {
                            if (!core.pagespeed) return "not_scanned";
                            const lcp = core.pagespeed.lcp || "";
                            const cls = core.pagespeed.cls || "";
                            // Try to parse LCP in seconds (e.g. "2.3 s" or "1,800 ms")
                            const lcpNum = parseFloat(lcp.replace(/[^0-9.]/g, ""));
                            const lcpInS = lcp.includes("ms") ? lcpNum / 1000 : lcpNum;
                            const clsNum = parseFloat(cls.replace(/[^0-9.]/g, ""));
                            if ((lcpInS > 4 || clsNum > 0.25) && (lcpNum > 0 || clsNum > 0)) return "fail";
                            if ((lcpInS > 2.5 || clsNum > 0.1) && (lcpNum > 0 || clsNum > 0)) return "warning";
                            return lcp && lcp !== "N/A" ? "pass" : "not_scanned";
                        })(),
                        value: core.pagespeed ? `LCP: ${core.pagespeed.lcp || "N/A"}, CLS: ${core.pagespeed.cls || "N/A"}, INP: ${core.pagespeed.inp || "N/A"}${core.pagespeed.has_crux_data ? " (Real-World)" : " (Lab)"}` : "N/A",
                        description: "Google's primary user-centric metrics for loading, interactivity, and visual stability.",
                        fix: "Preload largest images, define image dimensions to stop CLS, and defer heavy JS."
                    },
                    {
                        title: "image optimization",
                        status: (core.pagespeed?.image_optimization_issues > 0 || (core.image_checks?.no_alt_count > 3)) ? "warning" : (core.pagespeed ? "pass" : "not_scanned"),
                        value: core.pagespeed
                            ? `${core.pagespeed.image_optimization_issues} image issues${core.image_checks ? `, ${core.image_checks.no_alt_count} missing alt` : ""}${core.pagespeed.total_page_kb ? ` | Page: ${core.pagespeed.total_page_kb} KB` : ""}`
                            : "N/A",
                        description: "Uncompressed/unscaled images are the #1 cause of slow websites.",
                        fix: "Serve images in Next-Gen formats (WebP), compress sizes, implement lazy loading, and add alt attributes."
                    },
                    {
                        title: "JS/CSS size",
                        status: core.pagespeed?.render_blocking_issues > 0 ? "warning" : (core.pagespeed ? "pass" : "not_scanned"),
                        value: core.pagespeed
                            ? `${core.pagespeed.render_blocking_issues} render-blocking resource${core.pagespeed.render_blocking_issues !== 1 ? "s" : ""}${(core.pagespeed.unused_js_kb || core.pagespeed.unused_css_kb)
                                ? ` | Unused JS: ${core.pagespeed.unused_js_kb ?? "?"}KB, CSS: ${core.pagespeed.unused_css_kb ?? "?"}KB`
                                : ""
                            }`
                            : "N/A",
                        description: "Heavy or render-blocking scripts delay the page from appearing.",
                        fix: "Minify CSS/JS and Add 'defer' attribute to non-critical script tags."
                    },
                    {
                        title: "caching headers",
                        status: core.caching?.has_caching ? "pass" : (core.caching ? "warning" : "not_scanned"),
                        value: core.caching?.has_caching ? core.caching.cache_control || "Expires Set" : (core.caching ? "Not Configured" : "N/A"),
                        description: "Browser caching dramatically speeds up repeat visits.",
                        fix: "Configure Cache-Control headers on your server (Apache/Nginx/CDN) for static assets."
                    },
                    {
                        title: "lazy loading",
                        status: core.image_checks?.total_images > 0 ? (core.image_checks.lazy_load_ratio >= 0.5 ? "pass" : "warning") : (core.pagespeed ? "pass" : "not_scanned"),
                        value: core.image_checks?.total_images > 0 ? `${core.image_checks.lazy_loaded}/${core.image_checks.total_images} images lazy-loaded` : "No Images Found",
                        description: "Defers loading of offscreen images until the user scrolls near them.",
                        fix: "Add loading=\"lazy\" to <img> and <iframe> tags below the fold."
                    },
                    {
                        title: "TTFB (Time to First Byte)",
                        status: (() => {
                            const ttfb = core.pagespeed?.ttfb || "";
                            if (!ttfb || ttfb === "N/A") return "not_scanned";
                            const ms = parseFloat(ttfb.replace(/[^0-9.]/g, ""));
                            if (ttfb.includes("ms") ? ms > 600 : ms > 0.6) return "fail";
                            if (ttfb.includes("ms") ? ms > 200 : ms > 0.2) return "warning";
                            return "pass";
                        })(),
                        value: core.pagespeed?.ttfb && core.pagespeed.ttfb !== "N/A"
                            ? `${core.pagespeed.ttfb} server response time`
                            : "N/A",
                        description: "Time until server returns first byte. Critical for Google ranking — under 200ms is ideal.",
                        fix: "Use a CDN, upgrade hosting plan, enable server-side caching (Redis/Memcached), and optimize DB queries."
                    },
                    {
                        title: "FCP (First Contentful Paint)",
                        status: (() => {
                            const fcp = core.pagespeed?.fcp || "";
                            if (!fcp || fcp === "N/A") return "not_scanned";
                            const ms = parseFloat(fcp.replace(/[^0-9.]/g, ""));
                            const inMs = fcp.includes("ms") ? ms : ms * 1000;
                            if (inMs > 3000) return "fail";
                            if (inMs > 1800) return "warning";
                            return "pass";
                        })(),
                        value: core.pagespeed?.fcp && core.pagespeed.fcp !== "N/A"
                            ? core.pagespeed.fcp
                            : "N/A",
                        description: "When the first piece of content (text/image) appears on screen.",
                        fix: "Eliminate render-blocking resources, inline critical CSS, and preload key fonts."
                    },
                ]
            },
            {
                name: "Policy & AdSense Compliance",
                checks: [
                    {
                        title: "privacy policy page",
                        status: trust.summary?.privacy ? "pass" : "fail",
                        value: trust.summary?.privacy ? "Found" : "Missing",
                        description: "Mandatory requirement. Must detail cookie usage and third-party data collection.",
                        fix: "Add a visible link in your footer to a comprehensive Privacy Policy regarding DoubleClick DART cookies.",
                        draftType: "privacy"
                    },
                    {
                        title: "terms & conditions",
                        status: trust.summary?.terms ? "pass" : "warning",
                        value: trust.summary?.terms ? "Found" : "Missing",
                        description: "Outlines the rules for using your site, reducing overall liability risk.",
                        fix: "Draft a clear Terms of Service page, especially if you have user-generated content.",
                        draftType: "terms"
                    },
                    {
                        title: "about page",
                        status: trust.summary?.about ? "pass" : "warning",
                        value: trust.summary?.about ? "Found" : "Missing",
                        description: "Builds transparency and tells human reviewers who runs the publication.",
                        fix: "Create an About Us page detailing your team, mission, and editorial process.",
                        draftType: "about"
                    },
                    {
                        title: "contact page",
                        status: trust.summary?.contact ? "pass" : "fail",
                        value: trust.summary?.contact ? "Found" : "Missing",
                        description: "Proves site ownership and provides accountability.",
                        fix: "Provide a working contact form or direct business email.",
                        draftType: "contact"
                    },
                    {
                        title: "cookie consent",
                        status: trust.summary?.cookie_consent ? "pass" : "warning",
                        value: trust.summary?.cookie_consent ? "Found" : "Missing",
                        description: "Required for visitors from EU/UK (GDPR) and California (CCPA) if showing ads.",
                        fix: "Install a cookie consent popup/banner for EEA traffic compliance."
                    },
                    {
                        title: "prohibited content detection",
                        status: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Prohibited Content") ? "fail" : (core.ai_policy ? "pass" : "not_scanned"),
                        value: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Prohibited Content") ? "Violations Detected" : "Clean",
                        description: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Prohibited Content")?.explanation || "AdSense bans adult, violence, copyrighted, and illegal drug content strictly.",
                        fix: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Prohibited Content")?.fix_suggestion || "Remove any content flagged by the AI engine as policy-violating immediately."
                    },
                    {
                        title: "copyright risk signals",
                        status: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Copyright") ? "fail" : (core.ai_policy ? "pass" : "not_scanned"),
                        value: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Copyright") ? "Risk Detected" : "Clean",
                        description: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Copyright")?.explanation || "Providing illegal streaming links, warez or unauthorized downloads.",
                        fix: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Copyright")?.fix_suggestion || "Remove all links to unauthorized copyrighted material."
                    },
                    {
                        title: "misleading / clickbait detection",
                        status: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Clickbait") ? "warning" : (core.ai_policy ? "pass" : "not_scanned"),
                        value: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Clickbait") ? "Warning" : "Clean",
                        description: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Clickbait")?.explanation || "Sensational, false or purposely misleading content navigation.",
                        fix: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Clickbait")?.fix_suggestion || "Ensure headings and promises accurately reflect the content provided."
                    },
                    {
                        title: "ad placement readiness",
                        status: core.ad_placement?.status || "not_scanned",
                        value: core.ad_placement?.summary || "Analysis Pending",
                        description: "Ensures UI is prepared for ad units without causing layout shifts or AdSense policy violations.",
                        fix: core.ad_placement?.issues?.length > 0
                            ? core.ad_placement.issues.join(". ") + "."
                            : "Leave dedicated whitespace for ads, avoiding placements over navigation menus."
                    }
                ]
            },
            {
                name: "Security",
                checks: [
                    {
                        title: "mixed content issues",
                        status: security.mixed_content ? "fail" : "pass",
                        value: security.mixed_content ? "Detected" : "Clean",
                        description: "Loading insecure (HTTP) scripts or images inside a secure (HTTPS) site.",
                        fix: "Ensure all resources (images, css, js) use 'https://' URLs."
                    },
                    {
                        title: "security headers",
                        status: (security.headers?.csp || security.headers?.sts) ? "pass" : "warning",
                        value: security.headers?.sts ? "HSTS Active" : (security.headers?.csp ? "CSP Active" : "Missing Headers"),
                        description: "Headers like CSP or HSTS defend against XSS and injection attacks.",
                        fix: "Configure Strict-Transport-Security and Content-Security-Policy responses on your server."
                    },
                    {
                        title: "malware / phishing flags",
                        status: security.safe_browsing?.status === "unsafe" ? "fail" : (security.safe_browsing ? "pass" : "not_scanned"),
                        value: security.safe_browsing?.status === "unsafe" ? "Blacklisted" : "Clean",
                        description: "Identifies if the domain is actively serving malicious payloads.",
                        fix: "Audit server logs, update CMS plugins, and scan for backdoor scripts."
                    },
                    {
                        title: "iframe security",
                        status: security.headers?.frame_options ? "pass" : "warning",
                        value: security.headers?.frame_options ? "Restricted" : "Unrestricted",
                        description: "Prevents clickjacking by restricting who can frame your site.",
                        fix: "Add 'X-Frame-Options: SAMEORIGIN' header to your web server config."
                    }
                ]
            },
            {
                name: "Traffic & Audience Intelligence",
                checks: [
                    {
                        title: "domain age",
                        status: (() => {
                            const age = core.domain_age;
                            if (!age) return "not_scanned";
                            const days = age.total_days || 0;
                            if (days < 180) return "fail";
                            if (days < 365) return "warning";
                            return "pass";
                        })(),
                        value: (() => {
                            const age = core.domain_age;
                            if (!age) return "N/A";
                            const yr = age.years > 0 ? `${age.years}y ` : "";
                            const mo = age.months > 0 ? `${age.months}mo` : "";
                            const created = core.whois_visibility?.creation_date ? ` (from ${core.whois_visibility.creation_date.substring(0, 10)})` : "";
                            return `${yr}${mo}${created}` || `${age.total_days} days`;
                        })(),
                        description: "Domain age is a key trust signal. AdSense rarely approves sites under 6 months old.",
                        fix: "Ensure your domain has been registered and actively publishing content for at least 6 months before applying."
                    },
                    {
                        title: "global traffic rank",
                        status: core.traffic?.global_rank ? (core.traffic.global_rank < 1000000 ? "pass" : "warning") : "not_scanned",
                        value: core.traffic?.global_rank
                            ? `#${core.traffic.global_rank.toLocaleString()} globally${core.traffic.category ? ` · ${core.traffic.category.split(">").pop()?.trim()}` : ""}`
                            : "N/A",
                        description: "Similarweb global rank — higher traffic signals an established, legitimate publisher.",
                        fix: "Grow organic traffic through SEO, social sharing, and consistent content publishing."
                    },
                    {
                        title: "monthly traffic estimate",
                        status: core.traffic?.monthly_visits ? (core.traffic.monthly_visits > 1000 ? "pass" : "warning") : "not_scanned",
                        value: core.traffic?.monthly_visits
                            ? `${core.traffic.monthly_visits.toLocaleString()} visits/mo${core.traffic.bounce_rate ? ` · Bounce: ${core.traffic.bounce_rate}%` : ""}${core.traffic.pages_per_visit ? ` · ${core.traffic.pages_per_visit.toFixed(1)} pages/visit` : ""}`
                            : "N/A",
                        description: "Estimated monthly visits based on Similarweb data. Sites with real traffic are approved faster.",
                        fix: "Build an audience before applying. Aim for at least 1,000 monthly unique visits."
                    },
                    {
                        title: "top SEO keywords",
                        status: seo.top_keywords?.keywords?.length > 0 ? "pass" : "not_scanned",
                        value: (() => {
                            const kw = seo.top_keywords;
                            if (!kw?.keywords?.length) return "N/A";
                            const top = kw.keywords[0];
                            const isTfidf = kw.source === "tfidf" || top?.source === "tfidf";
                            const volPart = top?.search_volume != null ? `, ${top.search_volume.toLocaleString()} vol` : "";
                            return `${kw.total} keywords · Top: "${top?.keyword}"${volPart}${isTfidf ? " (on-page TF-IDF)" : ""}`;
                        })(),
                        description: "Organic keyword rankings indicate topical authority that AdSense reviewers value.",
                        fix: "Target long-tail keywords with consistent blog posts to build organic search presence."
                    },
                    {
                        title: "social media presence",
                        status: core.social_links && Object.keys(core.social_links).length > 0 ? "pass" : "warning",
                        value: core.social_links && Object.keys(core.social_links).length > 0
                            ? Object.keys(core.social_links).join(", ")
                            : "None detected",
                        description: "Active social profiles signal a real publisher and help build brand trust with Google.",
                        fix: "Create and link active Twitter, Facebook, or LinkedIn profiles to your website."
                    }
                ]
            }
        ];

        return categories;
    };

    const reportCategories = getReportDetails();

    const getIssuesList = () => {
        const list: any[] = [];
        reportCategories.forEach(cat => {
            cat.checks.forEach(check => {
                if (check.status === "fail" || check.status === "warning") {
                    list.push({ ...check, category: cat.name });
                }
            });
        });
        return list;
    };

    const aggregatedIssues = getIssuesList();

    const issues = {
        critical: aggregatedIssues.filter(i => i.status === "fail").length,
        warnings: aggregatedIssues.filter(i => i.status === "warning").length,
        passed: reportCategories.reduce((acc, cat) => acc + cat.checks.filter(i => i.status === "pass").length, 0),
        missing: reportCategories.reduce((acc, cat) => acc + cat.checks.filter(i => i.status === "not_scanned").length, 0)
    };

    const getVerdictDisplay = () => {
        const verdictType = getVerdict();
        switch (verdictType) {
            case "ready":
                return { emoji: "✅", text: "Ready for AdSense", color: "text-emerald-600", bg: "bg-emerald-50" };
            case "fix":
                return { emoji: "⚠️", text: "Fix & Apply", color: "text-amber-600", bg: "bg-amber-50" };
            case "not_ready":
                return { emoji: "❌", text: "Not Ready", color: "text-red-600", bg: "bg-red-50" };
            default:
                return { emoji: "⚠️", text: "Fix & Apply", color: "text-amber-600", bg: "bg-amber-50" };
        }
    };

    const verdict = getVerdictDisplay();

    const generatePDF = async () => {
        const element = document.getElementById("pdf-report-content");
        if (!element) return;

        try {
            // Hide navbar/footer from print if needed, but capturing main is usually enough
            const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#f8fafc" });
            const imgData = canvas.toDataURL("image/png");

            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

            // Add watermark
            pdf.setFontSize(40);
            pdf.setTextColor(200, 200, 200);
            pdf.text("www.ads2go.org", pdfWidth / 2, pdf.internal.pageSize.getHeight() / 2, { align: "center", angle: -45 });

            pdf.save(`${analysisUrl.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_adsense_report.pdf`);
        } catch (err) {
            console.error("PDF generation failed:", err);
            alert("Failed to generate PDF report.");
        }
    };

    const copyShareLink = () => {
        const url = `${window.location.origin}/results?id=${scanId || sessionStorage.getItem('currentScanId')}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    return (
        <>
            <Navbar />
            <main id="pdf-report-content" className="flex-grow flex flex-col relative z-10 bg-slate-50/30 pb-10">
                {/* Header */}
                <section className="relative z-10 pt-32 md:pt-40 pb-8 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-4xl w-full text-center">
                        <span className="text-[10px] uppercase tracking-[0.6em] text-slate-400 font-medium mb-4 block">Analysis Complete</span>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extralight text-slate-900 tracking-tighter mb-4 leading-tight">
                            {analysisUrl}
                        </h1>
                        <div className={`inline-flex items-center gap-2 px-4 py-2 ${verdict.bg} rounded-full`}>
                            <span className="text-lg">{verdict.emoji}</span>
                            <span className={`text-sm font-medium ${verdict.color}`}>{verdict.text}</span>
                        </div>
                    </div>
                </section>

                {/* Score Overview */}
                <section className="relative z-10 py-8 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col gap-6">
                            {/* Main Score Card */}
                            <div className="liquid-glass-card-dark rounded-[32px] p-10 md:p-14 text-center relative overflow-hidden">
                                {/* Subtle inner glow effect */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-full bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none"></div>
                                <div className="relative z-10">
                                    <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-white/50 font-medium mb-6 block">Overall Score</span>
                                    <div className="text-8xl sm:text-9xl font-extralight text-white mb-4 tracking-tight drop-shadow-sm flex items-center justify-center">
                                        {getOverallScore()}
                                    </div>
                                    <div className="text-white/40 text-sm font-light tracking-wide">out of 100</div>
                                </div>
                            </div>

                            {/* Issues Summary */}
                            <div className="liquid-glass-card rounded-[24px] p-6 sm:p-8">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-6 block">Issues Found</span>
                                <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100/50">
                                    <div className="flex flex-1 items-center justify-between sm:justify-center sm:gap-6 py-3 sm:py-0 px-2 sm:px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                                            <span className="text-slate-600 text-sm font-medium">Critical</span>
                                        </div>
                                        <span className="text-xl font-light text-slate-800">{issues.critical}</span>
                                    </div>
                                    <div className="flex flex-1 items-center justify-between sm:justify-center sm:gap-6 py-3 sm:py-0 px-2 sm:px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                                            <span className="text-slate-600 text-sm font-medium">Warnings</span>
                                        </div>
                                        <span className="text-xl font-light text-slate-800">{issues.warnings}</span>
                                    </div>
                                    <div className="flex flex-1 items-center justify-between sm:justify-center sm:gap-6 py-3 sm:py-0 px-2 sm:px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                            <span className="text-slate-600 text-sm font-medium">Passed</span>
                                        </div>
                                        <span className="text-xl font-light text-slate-800">{issues.passed}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="liquid-glass-card rounded-[24px] p-6 sm:p-8">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-6 block">Quick Actions</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    <button
                                        onClick={generatePDF}
                                        className="w-full py-3.5 px-4 liquid-glass-button-primary rounded-xl text-xs uppercase tracking-[0.15em] font-bold text-white flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">download</span>
                                        Export Report
                                    </button>
                                    <button
                                        onClick={() => {
                                            const roadmapTabBtn = document.getElementById("roadmap-tab-btn");
                                            if (roadmapTabBtn) {
                                                roadmapTabBtn.click();
                                                document.getElementById("report-navigation-tabs")?.scrollIntoView({ behavior: 'smooth' });
                                            }
                                        }}
                                        className="w-full py-3.5 px-4 liquid-glass-button rounded-xl text-xs uppercase tracking-[0.15em] font-bold text-slate-600 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">route</span>
                                        Fix Roadmap
                                    </button>
                                    <button
                                        onClick={copyShareLink}
                                        className="w-full py-3.5 px-4 liquid-glass-button rounded-xl text-xs uppercase tracking-[0.15em] font-bold text-slate-600 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] relative"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">{copySuccess ? 'check' : 'share'}</span>
                                        {copySuccess ? 'Copied!' : 'Share Report'}
                                    </button>
                                    <Link
                                        href="/analysis"
                                        className="w-full py-3.5 px-4 liquid-glass-button rounded-xl text-xs uppercase tracking-[0.15em] font-bold text-slate-600 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                                        Re-Analyze
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Category Scores */}
                <section className="relative z-10 py-12 md:py-16 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-8">
                            <span className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-medium mb-2 block">Breakdown</span>
                            <h2 className="text-2xl md:text-3xl font-extralight text-slate-900 tracking-tighter">Category Scores</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {reportCategories.map((category: any, index: number) => {
                                // Calculate a mock score for the category based on pass/fail ratio for visual purposes
                                const total = category.checks.length;
                                const passed = category.checks.filter((c: any) => c.status === 'pass').length;
                                const score = total > 0 ? Math.round((passed / total) * 100) : 0;

                                let status = 'good';
                                if (score < 50) status = 'error';
                                else if (score < 80) status = 'warning';

                                const getScoreColor = (score: number) => {
                                    if (score >= 80) return "text-emerald-500";
                                    if (score >= 50) return "text-amber-500";
                                    return "text-red-500";
                                };

                                const getStatusBg = (status: string) => {
                                    switch (status) {
                                        case 'good': return 'bg-emerald-500';
                                        case 'warning': return 'bg-amber-500';
                                        case 'error': return 'bg-red-500';
                                        default: return 'bg-slate-300';
                                    }
                                };

                                return (
                                    <div key={index} className="liquid-glass-card rounded-[24px] p-6 lg:p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                                        <div className="flex items-start justify-between mb-8">
                                            <h3 className="text-sm font-medium text-slate-800">{category.name}</h3>
                                            <div className={`w-2 h-2 rounded-sm ${getStatusBg(status)} shadow-sm`}></div>
                                        </div>

                                        <div>
                                            <div className={`text-4xl sm:text-5xl font-extralight ${getScoreColor(score)} mb-4 tracking-tight`}>
                                                {score}
                                            </div>

                                            <div className="w-full h-[3px] bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${getStatusBg(status)}`}
                                                    style={{ width: `${score}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                {/* Tabs Section */}
                <section className="relative z-10 py-12 md:py-16 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        {/* Tab Buttons */}
                        <div className="flex gap-2 mb-8 border-b border-slate-100 pb-4 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab("overview")}
                                className={`px-6 py-2.5 whitespace-nowrap rounded-full text-xs uppercase tracking-widest font-medium transition-all ${activeTab === "overview"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab("report")}
                                className={`px-6 py-2.5 whitespace-nowrap rounded-full text-xs uppercase tracking-widest font-medium transition-all ${activeTab === "report"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                Full Report
                            </button>
                            <button
                                onClick={() => setActiveTab("roadmap")}
                                className={`px-6 py-2.5 whitespace-nowrap rounded-full text-xs uppercase tracking-widest font-medium transition-all ${activeTab === "roadmap"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                Fix Roadmap ({issues.critical + issues.warnings})
                            </button>
                            <button
                                onClick={() => setActiveTab("ai_assistant")}
                                className={`px-6 py-2.5 whitespace-nowrap rounded-full text-xs uppercase tracking-widest font-medium transition-all ${activeTab === "ai_assistant"
                                    ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] border-transparent"
                                    : "text-indigo-600 border border-indigo-200 hover:bg-indigo-50"
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                                    AI Assistant
                                </span>
                            </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === "overview" && (
                            <div className="liquid-glass-card rounded-[32px] p-8 md:p-12">
                                <div className="relative z-10 space-y-6">
                                    <div>
                                        <h3 className="text-lg font-light text-slate-800 mb-3">Summary</h3>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed">
                                            {issues.critical > 0 ? "Critical issues were found that prevent AdSense approval. Follow the Fix Roadmap to resolve them." :
                                                issues.warnings > 0 ? "No critical blockers found, but several warnings should be addressed to optimize your approval odds." :
                                                    "Excellent metrics across the board. Your property is well-optimized."}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                                        <div className="text-center p-4 bg-slate-50/50 rounded-2xl">
                                            <div className="text-2xl font-extralight text-slate-800 mb-1">
                                                {scanData?.core_scan_data?.content_analysis?.pages_scanned || 1}
                                            </div>
                                            <div className="text-[10px] uppercase tracking-widest text-slate-400">Pages Scanned</div>
                                        </div>
                                        <div className="text-center p-4 bg-slate-50/50 rounded-2xl">
                                            <div className="text-2xl font-extralight text-slate-800 mb-1">
                                                {scanData?.core_scan_data?.pagespeed?.lcp ?? "N/A"}
                                            </div>
                                            <div className="text-[10px] uppercase tracking-widest text-slate-400">LCP Time</div>
                                        </div>
                                        <div className="text-center p-4 bg-slate-50/50 rounded-2xl">
                                            <div className="text-2xl font-extralight text-slate-800 mb-1">
                                                {scanData?.core_scan_data?.pagespeed?.mobile_score || scanData?.core_scan_data?.pagespeed?.score || "N/A"}
                                            </div>
                                            <div className="text-[10px] uppercase tracking-widest text-slate-400">Mobile Score</div>
                                        </div>
                                        <div className="text-center p-4 bg-slate-50/50 rounded-2xl">
                                            <div className="text-2xl font-extralight text-slate-800 mb-1">
                                                {scanData?.core_scan_data?.content_analysis?.word_count || "N/A"}
                                            </div>
                                            <div className="text-[10px] uppercase tracking-widest text-slate-400">Home Words</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "report" && (
                            <div className="space-y-8">
                                {reportCategories.map((category: any, catIdx: number) => (
                                    <div key={catIdx} className="liquid-glass-card rounded-[24px] overflow-hidden">
                                        <div className="px-6 py-4 border-b border-slate-200/50 flex items-center gap-3 bg-white/40 backdrop-blur-sm">
                                            <span className="material-symbols-outlined text-slate-500 text-lg">
                                                {category.name.includes("SEO") ? "search" :
                                                    category.name.includes("Trust") ? "verified_user" :
                                                        category.name.includes("Schema") ? "data_object" :
                                                            category.name.includes("Content") ? "article" :
                                                                category.name.includes("Performance") ? "speed" :
                                                                    category.name.includes("Policy") ? "policy" : "security"}
                                            </span>
                                            <h3 className="text-sm uppercase tracking-widest font-bold text-slate-700">{category.name}</h3>
                                        </div>
                                        <div className="divide-y divide-slate-100/50">
                                            {category.checks.map((check: any, checkIdx: number) => (
                                                <div key={checkIdx} className="p-6 transition-colors hover:bg-slate-50/30">
                                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                {check.status === "pass" && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                                                                {check.status === "warning" && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                                                                {check.status === "fail" && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                                                                {check.status === "not_scanned" && <span className="w-2 h-2 rounded-full bg-slate-300"></span>}
                                                                <h4 className="text-base font-medium text-slate-800 capitalize">{check.title}</h4>
                                                            </div>
                                                            <p className="text-slate-500 text-sm font-light mb-2">{check.description}</p>
                                                            {(check.status === "fail" || check.status === "warning") && (
                                                                <>
                                                                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50/50 text-blue-700 text-xs rounded-lg font-medium border border-blue-100">
                                                                        <span className="material-symbols-outlined text-sm">build</span>
                                                                        {check.fix}
                                                                    </div>

                                                                    {check.draftType && scanData?.trust_pages_data?.drafts?.[check.draftType] && (
                                                                        <button
                                                                            onClick={() => setActiveDraft({
                                                                                type: check.draftType,
                                                                                content: scanData.trust_pages_data.drafts[check.draftType],
                                                                                regenerating: false
                                                                            })}
                                                                            className="ml-3 mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50/50 hover:bg-indigo-100/50 text-indigo-700 text-xs rounded-lg font-medium border border-indigo-100 transition-colors"
                                                                        >
                                                                            <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                                                            View AI Draft
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="md:text-right flex items-center md:flex-col gap-3 md:gap-1">
                                                            <div className={`text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full whitespace-nowrap ${check.status === 'pass' ? 'bg-emerald-50 text-emerald-600' :
                                                                check.status === 'warning' ? 'bg-amber-50 text-amber-600' :
                                                                    check.status === 'fail' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                                                                }`}>
                                                                {check.status.replace("_", " ")}
                                                            </div>
                                                            <div className="text-sm text-slate-600 font-medium whitespace-nowrap">
                                                                {check.value}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* ── Lighthouse Opportunities ─────────────────────── */}
                                {(() => {
                                    const opps: any[] = scanData?.core_scan_data?.pagespeed?.opportunities ?? [];
                                    if (!opps.length) return null;
                                    return (
                                        <div className="liquid-glass-card rounded-[24px] overflow-hidden">
                                            <div className="px-6 py-4 border-b border-amber-200/50 flex items-center gap-3 bg-amber-50/40 backdrop-blur-sm">
                                                <span className="material-symbols-outlined text-amber-500 text-lg">bolt</span>
                                                <h3 className="text-sm uppercase tracking-widest font-bold text-slate-700">Lighthouse Opportunities</h3>
                                                <span className="ml-auto text-[10px] text-amber-600 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">{opps.length} fixes</span>
                                            </div>
                                            <div className="divide-y divide-slate-100/50">
                                                {opps.map((opp: any, i: number) => (
                                                    <div key={i} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-amber-50/20 transition-colors">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"></span>
                                                                <span className="text-sm font-semibold text-slate-800">{opp.title}</span>
                                                            </div>
                                                            {opp.display_value && <p className="text-xs text-slate-500 ml-4">{opp.display_value}</p>}
                                                        </div>
                                                        <div className="flex gap-2 flex-shrink-0">
                                                            {opp.savings_ms != null && (
                                                                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">−{opp.savings_ms.toLocaleString()} ms</span>
                                                            )}
                                                            {opp.savings_kb != null && (
                                                                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">−{opp.savings_kb} KB</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* ── Lighthouse Diagnostics ───────────────────────── */}
                                {(() => {
                                    const diags: any[] = (scanData?.core_scan_data?.pagespeed?.diagnostics ?? [])
                                        .filter((d: any) => d.display_value && d.display_value !== "");
                                    if (!diags.length) return null;
                                    return (
                                        <div className="liquid-glass-card rounded-[24px] overflow-hidden">
                                            <div className="px-6 py-4 border-b border-slate-200/50 flex items-center gap-3 bg-slate-50/60 backdrop-blur-sm">
                                                <span className="material-symbols-outlined text-slate-500 text-lg">monitoring</span>
                                                <h3 className="text-sm uppercase tracking-widest font-bold text-slate-700">Lighthouse Diagnostics</h3>
                                                <span className="ml-auto text-[10px] text-slate-500 font-semibold bg-slate-200 px-2 py-0.5 rounded-full">{diags.length} metrics</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                                {diags.map((d: any, i: number) => {
                                                    const col = d.score == null ? "text-slate-500" : d.score >= 0.9 ? "text-emerald-600" : d.score >= 0.5 ? "text-amber-600" : "text-red-600";
                                                    return (
                                                        <div key={i} className="p-5 border-b border-r border-slate-100/50 hover:bg-slate-50/30 transition-colors">
                                                            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">{d.title}</div>
                                                            <div className={`text-base font-semibold ${col}`}>{d.display_value}</div>
                                                            {d.total_kb != null && <div className="text-xs text-slate-400 mt-0.5">{d.total_kb.toLocaleString()} KB total</div>}
                                                            {d.element_count != null && <div className="text-xs text-slate-400 mt-0.5">{d.element_count.toLocaleString()} elements</div>}
                                                            {d.js_execution_ms != null && <div className="text-xs text-slate-400 mt-0.5">JS exec: {d.js_execution_ms.toLocaleString()} ms</div>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}


                        {activeTab === "roadmap" && (
                            <div className="max-w-4xl mx-auto space-y-12 pb-16">
                                {/* Roadmap Header */}
                                <div className="text-center md:text-left">
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-blue-500 font-bold mb-4 block">Strategic Intelligence</span>
                                    <h2 className="text-4xl md:text-5xl font-extralight text-slate-900 tracking-tighter mb-4">Fix Roadmap</h2>
                                    <p className="text-slate-500 font-light text-lg max-w-2xl">
                                        Systematic execution path to achieve full monetization readiness. A prioritized masterplan for enterprise AdSense alignment.
                                    </p>
                                </div>

                                {/* Progress Module */}
                                <div className="liquid-glass-card rounded-[32px] p-8 md:p-10 mb-10 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-end mb-6">
                                            <div>
                                                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Current Status</span>
                                                <div className="text-5xl font-extralight text-blue-600 tracking-tight">{getOverallScore()}%</div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Post Execution Target</span>
                                                <div className="text-xl font-bold text-slate-800">98%</div>
                                            </div>
                                        </div>

                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-6">
                                            <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${getOverallScore()}%` }}></div>
                                        </div>

                                        <div className="flex items-center gap-2 text-slate-500 text-sm font-light">
                                            <span className="material-symbols-outlined text-base text-slate-400">info</span>
                                            {aggregatedIssues.length} optimization modules remaining to reach certification threshold.
                                        </div>
                                    </div>
                                </div>

                                {/* Strategic Phases Timeline */}
                                <div className="relative">
                                    <div className="absolute left-[27px] md:left-[39px] top-8 bottom-8 w-[2px] bg-slate-200/60 rounded-full -z-10"></div>
                                    <div className="flex justify-between items-center mb-10 pl-2">
                                        <h3 className="text-xl font-medium text-slate-800">Strategic Phases</h3>
                                        <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">5 Phases Defined</div>
                                    </div>

                                    <div className="space-y-12">
                                        {[
                                            { title: "Phase 1: Structural Integrity", categories: ["Technical SEO", "Schema & Structured Data"], icon: "account_tree" },
                                            { title: "Phase 2: Semantic Alignment", categories: ["Content Quality"], icon: "format_list_bulleted" },
                                            { title: "Phase 3: Technical Performance", categories: ["Performance"], icon: "speed" },
                                            { title: "Phase 4: Policy Compliance", categories: ["Policy Setup", "Trust Signals"], icon: "gavel" },
                                            { title: "Phase 5: Final Verification", categories: ["Security"], icon: "rocket_launch" }
                                        ].map((phase, phaseIdx) => {
                                            const phaseIssues = aggregatedIssues.filter(i => phase.categories.includes(i.category));
                                            const isCompleted = phaseIssues.length === 0;
                                            const PhaseIcon = isCompleted ? "check_circle" : (phaseIdx === 0 || aggregatedIssues.filter(i => [{ title: "Phase 1: Structural Integrity", categories: ["Technical SEO", "Schema & Structured Data"] }][0].categories.includes(i.category)).length === 0) ? "play_circle" : "radio_button_unchecked";
                                            const statusText = isCompleted ? "Completed" : "In Progress";
                                            const statusColor = isCompleted ? "text-emerald-500" : "text-blue-500";

                                            return (
                                                <div key={phaseIdx} className="flex gap-4 md:gap-8 group">
                                                    {/* Timeline Node */}
                                                    <div className="relative pt-6">
                                                        <div className={`w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-[#fcfdfe] transition-all duration-500 shadow-sm
                                                            ${isCompleted ? "border-emerald-200 border-2" : PhaseIcon === "play_circle" ? "border-blue-300 border-[3px] shadow-[0_0_20px_rgba(59,130,246,0.3)]" : "border-slate-200 border-2"}`}>
                                                            <span className={`material-symbols-outlined sm:text-2xl 
                                                                ${isCompleted ? "text-emerald-500" : PhaseIcon === "play_circle" ? "text-blue-500" : "text-slate-300"}`}>
                                                                {PhaseIcon}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Phase Content Box */}
                                                    <div className={`flex-1 transition-all duration-500 ${!isCompleted && PhaseIcon !== 'play_circle' ? 'opacity-60 grayscale-[50%]' : 'hover:-translate-y-1'}`}>
                                                        <div className={`liquid-glass-card rounded-[32px] p-6 sm:p-8 md:p-10 border border-slate-200/50 shadow-lg ${PhaseIcon === "play_circle" ? "shadow-[0_10px_40px_-10px_rgba(59,130,246,0.15)] border-blue-100" : ""}`}>
                                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                                                                <div>
                                                                    <h4 className="text-xl md:text-2xl font-light text-slate-800 mb-2">{phase.title}</h4>
                                                                    <div className={`text-[9px] uppercase tracking-[0.2em] font-bold ${statusColor}`}>{statusText}</div>
                                                                </div>
                                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                                    <span className="material-symbols-outlined">{phase.icon}</span>
                                                                </div>
                                                            </div>

                                                            {isCompleted ? (
                                                                <div className="flex flex-wrap gap-4 text-sm text-slate-400 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                                                    <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">verified</span> Optimization Complete</span>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    {phaseIssues.map((issue: any, issueIdx: number) => (
                                                                        <div key={`issue-${phaseIdx}-${issueIdx}`} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                                                            <div className="flex items-start gap-4">
                                                                                <span className={`material-symbols-outlined mt-0.5 ${issue.status === 'fail' ? "text-red-500" : "text-amber-500"}`}>
                                                                                    {issue.status === 'fail' ? "error" : "warning"}
                                                                                </span>
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center gap-3 mb-1">
                                                                                        <h5 className="font-medium text-slate-800 capitalize">{issue.title}</h5>
                                                                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${issue.status === 'fail' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                                                                                            {issue.status === 'fail' ? "Critical" : "Warning"}
                                                                                        </span>
                                                                                    </div>
                                                                                    <p className="text-xs text-slate-500 mb-3">{issue.description}</p>
                                                                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs text-slate-600 flex gap-2">
                                                                                        <span className="material-symbols-outlined text-[14px] text-blue-500 mt-0.5">build</span>
                                                                                        <span>{issue.fix}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "ai_assistant" && (
                            <div className="space-y-6 md:space-y-8">
                                <div className="liquid-glass-card rounded-[32px] p-8 md:p-12 mb-8 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-indigo-100">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-2xl font-light text-indigo-900 mb-2">Ad2Go AI Assistant</h3>
                                            <p className="text-indigo-900/60 max-w-2xl text-sm leading-relaxed">
                                                Our AI tools use your site's specific scan data to generate contextual improvements, monetization ideas, and appeal letters instantly.
                                            </p>
                                        </div>
                                        <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-indigo-100 items-center justify-center text-indigo-500">
                                            <span className="material-symbols-outlined text-[24px]">smart_toy</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Improvements Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                                    <div className="liquid-glass-card rounded-[24px] p-6 lg:p-8 flex flex-col items-start min-h-[300px]">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-4">
                                            <span className="material-symbols-outlined">edit_note</span>
                                        </div>
                                        <h4 className="text-lg font-medium text-slate-800 mb-2">Content Improvements</h4>
                                        <p className="text-sm text-slate-500 mb-6 flex-1">
                                            Get actionable suggestions to improve your site's content depth and structure to meet Google AdSense standards.
                                        </p>
                                        {scanData?.core_scan_data?.ai_recommendations?.content_improvements ? (
                                            <div className="w-full space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                {scanData.core_scan_data.ai_recommendations.content_improvements.map((imp: any, idx: number) => (
                                                    <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                                        <h5 className="font-semibold text-sm text-slate-800 mb-1">{imp.title}</h5>
                                                        <p className="text-xs text-slate-600 mb-3">{imp.description}</p>
                                                        <ul className="space-y-1 list-disc pl-4 text-xs text-slate-500">
                                                            {imp.action_items.map((action: string, aidx: number) => <li key={aidx}>{action}</li>)}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleGenerateContentImprovements}
                                                disabled={generatingAI['content']}
                                                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                            >
                                                {generatingAI['content'] ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">auto_awesome</span>}
                                                {generatingAI['content'] ? 'Analyzing...' : 'Generate Content Strategy'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Monetization Suggestions Row */}
                                    <div className="liquid-glass-card rounded-[24px] p-6 lg:p-8 flex flex-col items-start min-h-[300px]">
                                        <div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center mb-4">
                                            <span className="material-symbols-outlined">payments</span>
                                        </div>
                                        <h4 className="text-lg font-medium text-slate-800 mb-2">Monetization Methods</h4>
                                        <p className="text-sm text-slate-500 mb-6 flex-1">
                                            If AdSense isn't an option right now, discover alternative ways to monetize your site based on its current profile.
                                        </p>
                                        {scanData?.core_scan_data?.ai_recommendations?.monetization ? (
                                            <div className="w-full space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                {scanData.core_scan_data.ai_recommendations.monetization.map((sug: any, idx: number) => (
                                                    <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h5 className="font-semibold text-sm text-slate-800">{sug.method}</h5>
                                                            <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${sug.suitability === 'High' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{sug.suitability} Match</span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 mb-2">{sug.reason}</p>
                                                        <div className="text-xs bg-white border border-slate-200 p-2 rounded text-slate-500"><span className="font-medium mr-1 text-slate-700">Next Step:</span>{sug.getting_started}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleGenerateMonetization}
                                                disabled={generatingAI['monetization']}
                                                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                            >
                                                {generatingAI['monetization'] ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">auto_awesome</span>}
                                                {generatingAI['monetization'] ? 'Generating...' : 'Discover Alternatives'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Appeal Letter Generator */}
                                    <div className="liquid-glass-card rounded-[24px] p-6 lg:p-8 flex flex-col items-start min-h-[300px] lg:col-span-2">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
                                            <span className="material-symbols-outlined">gavel</span>
                                        </div>
                                        <h4 className="text-lg font-medium text-slate-800 mb-2">Appeal Letter Generator</h4>
                                        <p className="text-sm text-slate-500 mb-6 flex-1">
                                            If your site was rejected by AdSense due to policy issues, use this tool to automatically draft a professional appeal letter based on the specific policy violations detected in our scan.
                                        </p>
                                        {scanData?.core_scan_data?.ai_recommendations?.appeal_draft && scanData.core_scan_data.ai_recommendations.appeal_draft.length > 0 ? (
                                            <div className="w-full relative">
                                                <textarea
                                                    className="w-full h-48 md:h-64 p-4 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                                    defaultValue={scanData.core_scan_data.ai_recommendations.appeal_draft}
                                                    readOnly={false}
                                                />
                                                <div className="absolute bottom-4 right-4 flex gap-2">
                                                    <button
                                                        onClick={() => { navigator.clipboard.writeText(scanData.core_scan_data.ai_recommendations.appeal_draft); alert('Copied to clipboard!') }}
                                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">content_copy</span> Copy Text
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleGenerateAppeal}
                                                disabled={generatingAI['appeal']}
                                                className="w-full md:w-auto px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                            >
                                                {generatingAI['appeal'] ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">auto_awesome</span>}
                                                {generatingAI['appeal'] ? 'Drafting Letter...' : 'Draft Appeal Letter'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Policy Drafts Box inside AI Assistant Tab */}
                                    <div className="liquid-glass-card rounded-[24px] p-6 lg:p-8 flex flex-col items-start min-h-[300px] lg:col-span-2">
                                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center mb-4">
                                            <span className="material-symbols-outlined">policy</span>
                                        </div>
                                        <h4 className="text-lg font-medium text-slate-800 mb-2">Policy Pages & Drafts</h4>
                                        <p className="text-sm text-slate-500 mb-6 flex-1">
                                            Missing mandatory trust pages (like Privacy Policy or Terms Conditions)? We automatically generate standard, compliant HTML drafts for these pages during your scan.
                                        </p>

                                        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {["privacy", "terms", "about", "contact", "disclaimer"].map(type => {
                                                const draft = scanData?.trust_pages_data?.drafts?.[type];
                                                const isDrafting = activeDraft?.regenerating && activeDraft?.type === type;
                                                return (
                                                    <div key={type} className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col">
                                                        <h5 className="font-semibold text-sm capitalize text-slate-800 mb-3">{type.replace('-', ' ')} Page</h5>

                                                        {draft ? (
                                                            <div className="mt-auto space-y-2">
                                                                <button
                                                                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors"
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(draft);
                                                                        alert(`${type} page HTML copied!`);
                                                                    }}
                                                                >
                                                                    Copy HTML Snippet
                                                                </button>
                                                                <button
                                                                    className="w-full py-1.5 text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors"
                                                                    onClick={() => handleRegenerateDraft(type)}
                                                                >
                                                                    {isDrafting ? 'Regenerating...' : 'Regenerate Draft'}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                className="mt-auto w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                                                                onClick={() => handleRegenerateDraft(type)}
                                                                disabled={isDrafting}
                                                            >
                                                                {isDrafting ? <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span> : null}
                                                                Generate Template
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}

export default function ResultsPage() {
    return (
        <React.Suspense fallback={
            <div className="flex justify-center items-center h-screen bg-slate-50/30">
                <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
        }>
            <ResultsContent />
        </React.Suspense>
    );
}
