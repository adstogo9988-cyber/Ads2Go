"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

import { adsenseChecks } from "@/lib/adsenseChecks";
import { getFormattedPolicy } from "@/lib/policyTemplates";

const ADSENSE_SUPPORTED_LANGS = new Set([
    "en", "es", "fr", "de", "hi", "ur", "ar", "pt", "ru", "ja", "zh", "ko", "it", "tr", "pl", "nl", "vi", "th"
]);

function ResultsContent() {
    const [activeTab, setActiveTab] = useState<"overview" | "report" | "roadmap" | "ai_assistant">("overview");
    const [selectedPlatform, setSelectedPlatform] = useState<"wordpress" | "shopify" | "nextjs" | "custom">("custom");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<any>(null);
    const [analysisUrl, setAnalysisUrl] = useState("site.com");
    const [siteInfo, setSiteInfo] = useState({
        email: '',
        address: '',
        phone: '',
        topic: '',
        tags: ''
    });
    const [isSiteInfoModalOpen, setIsSiteInfoModalOpen] = useState(false);
    const [pendingDraftType, setPendingDraftType] = useState<string | null>(null);
    const [scanData, setScanData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [generatingAI, setGeneratingAI] = useState<{ [key: string]: boolean }>({});
    const [copySuccess, setCopySuccess] = useState(false);
    const [activeDraft, setActiveDraft] = useState<{ type: string, content: string, regenerating: boolean } | null>(null);
    const [selectedAppealReason, setSelectedAppealReason] = useState<string>("");
    const [toast, setToast] = useState<{ message: string, type: "success" | "error" } | null>(null);

    // Auto-hide toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const appealReasons = [
        { id: "low_value_content", label: "Low Value Content", file: "Low Value Content.txt" },
        { id: "privacy_policy", label: "Privacy Policy Missing", file: "Privacy Policy Missing.txt" },
        { id: "replicated_content", label: "Replicated Content", file: "Replicated Content.txt" },
        { id: "scraped_content", label: "Scraped Content", file: "Scraped Content.txt" },
        { id: "site_navigation", label: "Site Navigation Issues", file: "Site Navigation.txt" },
        { id: "copyrighted_material", label: "Copyrighted Material", file: "Copyrighted Material.txt" },
        { id: "mobile_unfriendly", label: "Mobile Unfriendly", file: "Mobile Unfriendly.txt" },
        { id: "new_domain", label: "New Domain (Under 6 Months)", file: "New Domain.txt" },
        { id: "invalid_traffic", label: "Invalid Traffic", file: "Invalid Traffic.txt" },
        { id: "no_disclaimers", label: "No Disclaimers / Trust Pages", file: "No Disclaimers.txt" },
        { id: "language_not_supported", label: "Language Not Supported", file: "Language Not Supported.txt" },
        { id: "restricted_content", label: "Restricted Content", file: "Restricted Content.txt" },
        { id: "site_unavailable", label: "Site Down or Unavailable", file: "Site Down or Unavailable.txt" },
        { id: "under_construction", label: "Site Under Construction", file: "Under Construction.txt" },
        { id: "bad_ux", label: "Bad User Experience (UX)", file: "Bad User Experience (UX).txt" },
    ];
    const monetizationPlatforms = {
        adNetworks: [
            { name: 'Ezoic', url: 'https://ezoic.com', category: 'Testing & Optimization', requirement: 'Best for 10k+ monthly visitors.' },
            { name: 'Mediavine', url: 'https://mediavine.com', category: 'Premium Lifestyle', requirement: 'Requires 50k+ monthly sessions.' },
            { name: 'Raptive', url: 'https://raptive.com', category: 'High-Volume Ads', requirement: 'Requires 100k+ pageviews.' },
            { name: 'PropellerAds', url: 'https://propellerads.com', category: 'Instant Approval', requirement: 'No minimum traffic (New sites).' },
            { name: 'Monetag', url: 'https://monetag.com', category: 'Pop-Under Specialist', requirement: 'Great for push & pop monetization.' }
        ],
        affiliateMarketing: [
            { name: 'Amazon Associates', url: 'https://amazon.com', category: 'Multi-Utility', requirement: "The world's largest affiliate program." },
            { name: 'Impact', url: 'https://impact.com', category: 'Tech & SaaS', requirement: 'Best for tech and SaaS products.' },
            { name: 'ShareASale', url: 'https://shareasale.com', category: 'Niche Markets', requirement: 'Great for any niche.' },
            { name: 'Hostinger', url: 'https://hostinger.com', category: 'Hosting Partner', requirement: 'Best for promoting hosting services.' },
            { name: 'Bluehost', url: 'https://bluehost.com', category: 'Premium Affiliate', requirement: 'High-paying hosting commissions.' }
        ]
    };

    const contentStrategyBlueprints = [
        {
            title: "Semantic Content Enrichment",
            description: "Your architecture shows a lack of deep semantic associations. We recommend expanding your niche topics with 'entity-based' writing.",
            action_items: [
                "Integrate LSI keywords in H2/H3 subheadings.",
                "Increase average article depth to 1,200+ words.",
                "Cross-link relevant articles using descriptive anchor text."
            ]
        },
        {
            title: "Engagement & UX Optimization",
            description: "The current layout and content flow might be leading to high bounce rates. Focus on readability and visual cues.",
            action_items: [
                "Use bullet points and short paragraphs (3-4 lines max).",
                "Add high-quality custom visuals or infographics.",
                "Place a clear 'Conclusion' section with a call-to-action."
            ]
        },
        {
            title: "Technical Compliance Structure",
            description: "To meet strict AdSense guidelines, your technical content structure needs professional refinement.",
            action_items: [
                "Ensure every page has a unique meta description.",
                "Validate schema markups for FAQ or Article types.",
                "Verify all external links point to high-authority domains."
            ]
        }
    ];
    const searchParams = useSearchParams();
    const scanId = searchParams.get("id");

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
                        id: "robots_txt",
                        title: "robots.txt presence & validity",
                        status: core.robots_txt?.exists ? (core.robots_txt?.has_disallow ? "warning" : "pass") : "fail",
                        value: core.robots_txt?.exists ? "Found" : "Missing",
                        description: "Instructs search engines which pages to crawl or avoid.",
                        fix: core.robots_txt?.exists ? "Review Disallow rules to ensure important content isn't blocked." : "Create a robots.txt file in your root directory allowing Googlebot access."
                    },
                    {
                        id: "sitemap_xml",
                        title: "sitemap.xml health check",
                        status: core.sitemap_xml?.exists ? (core.sitemap_xml.is_valid_xml ? "pass" : "warning") : "fail",
                        value: core.sitemap_xml?.exists ? (core.sitemap_xml.is_valid_xml ? `Valid XML (${core.sitemap_xml.url_count || 0} URLs)` : "Invalid XML Format") : "Missing",
                        description: "Helps search engines discover all URLs on your website rapidly.",
                        fix: "Ensure your sitemap is a valid XML file and submit it to Google Search Console."
                    },
                    {
                        id: "canonical_tags",
                        title: "canonical tags",
                        status: seo.canonical_conflict ? "fail" : (seo.canonical ? "pass" : "fail"),
                        value: seo.canonical_conflict ? "Conflict Detected" : (seo.canonical ? "Present" : "Missing"),
                        description: "Prevents duplicate content issues by specifying the master URL.",
                        fix: seo.canonical_conflict ? "Ensure canonical URL matches the final resolved URL." : "Add <link rel=\"canonical\" href=\"...\"> to the <head> of all your pages."
                    },
                    {
                        id: "meta_tags_missing",
                        title: "meta title & meta description",
                        status: (!seo.title || !seo.meta_description) ? "fail" : ((!seo.title_optimization?.is_optimal || !seo.description_optimization?.is_optimal) ? "warning" : "pass"),
                        value: (!seo.title || !seo.meta_description) ? "Missing Elements" : ((seo.title_optimization?.is_optimal && seo.description_optimization?.is_optimal) ? "Optimal Lengths" : "Suboptimal Lengths"),
                        description: "Essential for search engine snippets and click-through rates.",
                        fix: "Ensure <title> is 50-60 characters and <meta name=\"description\"> is 120-160 characters."
                    },
                    {
                        id: "heading_structure",
                        title: "heading structure (H1–H6)",
                        status: seo.headings?.missing_h1 ? "fail" : ((seo.headings?.multiple_h1 || seo.headings?.hierarchy_issue) ? "warning" : "pass"),
                        value: seo.headings?.missing_h1 ? "Missing H1" : (seo.headings?.multiple_h1 ? "Multiple H1s" : (seo.headings?.hierarchy_issue ? "Hierarchy Issue" : "Proper Hierarchy")),
                        description: "Proper HTML heading hierarchy improves readability and SEO semantics.",
                        fix: "Use exactly one <h1> per page. Use <h2> and <h3> for sub-sections sequentially."
                    },
                    {
                        id: "nav_depth",
                        title: "internal linking & nav depth",
                        status: !core.nav_depth ? "not_scanned" : (core.nav_depth.orphan_count > 10 ? "fail" : (seo.internal_linking_analysis?.adequate_links ? "pass" : "warning")),
                        value: !core.nav_depth ? "Requires Re-scan" : `${seo.internal_links || 0} Links | ${core.nav_depth.orphan_count || 0} Orphans`,
                        description: "Analyzes site structure depth and identifies pages with no incoming links.",
                        fix: "Ensure all important pages are linked and reachable within 3 clicks from the homepage."
                    },
                    {
                        id: "tech_stack",
                        title: "Technology Stack",
                        status: !core.tech_stack ? "not_scanned" : (core.tech_stack.cms !== "Unknown" ? "pass" : "warning"),
                        value: !core.tech_stack ? "Requires Re-scan" : `${core.tech_stack.cms || "Custom"} | ${core.tech_stack.server || "Detected"}`,
                        description: "Identifies CMS, Themes, and Server-level technology like Cloudflare.",
                        fix: "Keep your CMS and plugins updated to the latest versions for security."
                    },
                    {
                        id: "broken_links",
                        title: "broken links detection",
                        status: core.broken_links?.broken === 0 ? "pass" : (core.broken_links ? "fail" : "not_scanned"),
                        value: core.broken_links ? `${core.broken_links.broken} Broken Link${core.broken_links.broken !== 1 ? 's' : ''}` : "N/A",
                        description: "Broken links (404s) severely harm user experience and crawl budgets.",
                        fix: "Identify and replace or remove all dead links pointing to 404 pages.",
                        instances: core.broken_links?.urls || []
                    },
                    {
                        id: "noindex_nofollow",
                        title: "noindex / nofollow pages",
                        status: seo.meta_robots?.noindex ? "fail" : "pass",
                        value: seo.meta_robots?.noindex ? "NoIndex Detected" : "Indexable",
                        description: "If active, search engines will completely ignore your pages.",
                        fix: "Remove <meta name=\"robots\" content=\"noindex\"> from pages you want to show up in search."
                    },
                    {
                        id: "crawlability_status",
                        title: "crawlability status",
                        status: core.redirects?.has_chain || core.ssl_check?.status === "fail" ? "fail" : (core.ssl_check?.status === "passed" && core.broken_links?.broken === 0 ? "pass" : "warning"),
                        value: core.redirects?.has_chain ? "Redirect Chain" : 
                               (core.ssl_check?.status !== "passed" ? "SSL/Security Issue" : 
                               (core.broken_links?.broken > 0 ? `${core.broken_links.broken} 404s Found` : (core.broken_links ? "Fully Crawlable" : "Analysis Pending"))),
                        description: "General assessment of how easily Googlebot can browse your site structure.",
                        fix: core.redirects?.has_chain ? "Remove long redirect chains to ensure direct resolution." : "Fix internal server errors, broken links, and SSL blockages."
                    },
                    {
                        id: "mobile_friendliness",
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
                        id: "domain_age",
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
                        id: "domain_authority",
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
                        id: "ssl_certificate",
                        title: "HTTPS & SSL validity",
                        status: core.ssl_check?.status === "passed" ? "pass" : "fail",
                        value: core.ssl_check?.protocol || "HTTP",
                        description: "Encrypts data between visitors and your server. A strict AdSense requirement.",
                        fix: "Install a valid SSL certificate (e.g., Let's Encrypt) and force HTTPS redirects."
                    },
                    {
                        id: "google_safe_browsing",
                        title: "Google Safe Browsing check",
                        status: security.safe_browsing?.status === "safe" ? "pass" : (security.safe_browsing ? "fail" : "not_scanned"),
                        value: security.safe_browsing?.status === "safe" ? "Clean" : (security.safe_browsing?.status === "unsafe" ? "Flagged" : "Unknown"),
                        description: "Checks if your domain is blacklisted by Google for malware or phishing.",
                        fix: "Use Google Search Console's Security Issues report to request a review after cleaning malware."
                    },
                    {
                        id: "whois_visibility",
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
                        id: "brand_signals",
                        title: "brand signals / email validity",
                        status: !core.email_validation ? "not_scanned" : ((trust.summary?.contact && core.email_validation.is_valid_mx !== false) ? "pass" : "fail"),
                        value: !core.email_validation ? "Requires Re-scan" : (core.email_validation.is_valid_mx ? "Valid MX Records" : (trust.summary?.contact ? "Contact Found (No MX)" : "Missing Contact")),
                        description: "Verifies contact presence and validates the authenticity of email MX records.",
                        fix: "Provide a working business email and ensure its domain has valid MX records configured."
                    }
                ]
            },
            {
                name: "Schema & Structured Data",
                checks: [
                    {
                        id: "schema_presence",
                        title: "schema markup presence",
                        status: seo.structured_data?.detected ? "pass" : "fail",
                        value: seo.structured_data?.detected ? "Detected" : "None",
                        description: "Code that helps search engines understand the exact meaning of your content.",
                        fix: "Inject basic JSON-LD schema into your document <head>."
                    },
                    {
                        id: "json_ld",
                        title: "JSON-LD validation",
                        status: seo.structured_data?.detected ? (seo.structured_data.valid_syntax ? "pass" : "fail") : "warning",
                        value: seo.structured_data?.detected ? (seo.structured_data.valid_syntax ? `Valid Syntax (${seo.structured_data.valid_count} Tags)` : "Parse Errors Detected") : "N/A",
                        description: "Modern format recommended by Google over Microdata.",
                        fix: "Validate your JSON-LD using Google's Rich Results Test tool to fix JSON syntax errors."
                    },
                    {
                        id: "org_schema",
                        title: "organization schema",
                        status: seo.structured_data?.types?.includes("Organization") || seo.structured_data?.types?.includes("WebSite") ? "pass" : "warning",
                        value: seo.structured_data?.types?.includes("Organization") ? "Found" : "Missing",
                        description: "Associates your brand name, logo, and social profiles centrally.",
                        fix: "Add an 'Organization' schema to the homepage."
                    },
                    {
                        id: "breadcrumb_schema",
                        title: "breadcrumb schema",
                        status: seo.structured_data?.types?.includes("BreadcrumbList") ? "pass" : "warning",
                        value: seo.structured_data?.types?.includes("BreadcrumbList") ? "Found" : "Missing",
                        description: "Displays clear navigation paths directly in Google Search Snippets.",
                        fix: "Implement 'BreadcrumbList' schema if your site has nested categories."
                    },
                    {
                        id: "article_product_schema",
                        title: "article/product schema",
                        status: seo.structured_data?.types?.includes("Article") || seo.structured_data?.types?.includes("NewsArticle") || seo.structured_data?.types?.includes("Product") ? "pass" : "warning",
                        value: seo.structured_data?.types?.includes("Article") ? "Found" : "Missing",
                        description: "Crucial for blogs to get featured in Top Stories and rich carousels.",
                        fix: "Add 'Article' or 'BlogPosting' schema to all your blog post templates."
                    },
                    {
                        id: "rich_results",
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
                        id: "word_count",
                        title: "word count",
                        status: core.content_analysis?.word_count > 500 ? "pass" : (core.content_analysis?.word_count ? "warning" : "not_scanned"),
                        value: core.content_analysis?.word_count ? `${core.content_analysis.word_count} Words` : "N/A",
                        description: "AdSense prefers rich, comprehensive content over short ambiguous posts.",
                        fix: "Aim for text-rich pages. Expand sparse articles with more detailed, helpful insights."
                    },
                    {
                        id: "duplicate_content",
                        title: "duplicate content detection",
                        status: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Duplicate Pattern") ? "fail" : (core.ai_policy ? "pass" : "not_scanned"),
                        value: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Duplicate Pattern") ? "Violations" : (core.ai_policy ? "Originality Expected" : "Requires Scan"),
                        description: "Scraping or duplicating content heavily violates AdSense Content Policies.",
                        fix: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Duplicate Pattern")?.fix_suggestion || "Write 100% original content from your own perspective."
                    },
                    {
                        id: "readability_score",
                        title: "readability score",
                        status: core.content_analysis?.readability_grade === "Easy" ? "pass" : (core.content_analysis?.readability_grade === "Moderate" ? "warning" : (core.content_analysis?.readability_grade ? "fail" : "not_scanned")),
                        value: core.content_analysis?.readability_grade ? `${core.content_analysis.readability_grade} (avg ${core.content_analysis.avg_sentence_length} words/sentence)` : "N/A",
                        description: "Content should be easily understandable by the general public.",
                        fix: "Write using short paragraphs, simple vocabulary, and clear formatting."
                    },
                    {
                        id: "keyword_density",
                        title: "keyword density",
                        status: core.content_analysis?.keyword_stuffed ? "warning" : (core.content_analysis?.top_keyword ? "pass" : "not_scanned"),
                        value: core.content_analysis?.top_keyword ? `"${core.content_analysis.top_keyword}" at ${core.content_analysis.keyword_density}%` : "N/A",
                        description: "Overusing keywords (Keyword Stuffing) leads to search penalties.",
                        fix: "Write naturally for humans. Keep top keyword density below 5%."
                    },
                    {
                        id: "content_originality",
                        title: "content originality",
                        status: core.ai_policy?.policy_violations?.find((v: any) => v.category === "AI Spam") ? "fail" : (core.ai_policy?.risk_score < 70 ? "pass" : (core.ai_policy ? "fail" : "not_scanned")),
                        value: core.ai_policy?.policy_violations?.find((v: any) => v.category === "AI Spam") ? "AI Spam Detected" : (core.ai_policy ? `AI Risk Score: ${core.ai_policy.risk_score}/100` : "N/A"),
                        description: "Detects purely automated, unedited AI content or spammy spin-offs.",
                        fix: core.ai_policy?.policy_violations?.find((v: any) => v.category === "AI Spam")?.fix_suggestion || "If using AI helpers, aggressively edit and inject your personal voice/opinions."
                    },
                    {
                        id: "placeholder_content",
                        title: "Placeholder / Lorem Ipsum Check",
                        status: core.placeholder_content?.found ? "fail" : "pass",
                        value: core.placeholder_content?.found ? "Placeholder Text Found" : "Clean",
                        description: "Detects 'Lorem Ipsum' or 'Sample Post' text that indicates incomplete sites.",
                        fix: "Replace all dummy text with original, high-quality content before applying."
                    },
                    {
                        id: "thin_content_pages",
                        title: "thin content pages",
                        status: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Thin Content") || core.content_analysis?.has_thin_content ? "fail" : "pass",
                        value: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Thin Content") ? "Low Value Content" : (core.content_analysis?.has_thin_content ? `${core.content_analysis.thin_content_pages?.length || 0} thin pages found` : "None Detected"),
                        description: "Pages with very little text are termed 'low value content' by AdSense.",
                        fix: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Thin Content")?.fix_suggestion || "Consolidate thin pages together or expand them significantly.",
                        instances: core.content_analysis?.thin_content_pages || []
                    }
                ]
            },
            {
                name: "AdSense Strategic Readiness",
                checks: [
                    {
                        id: "ads_txt",
                        title: "ads.txt presence & validity",
                        status: core.adsense_readiness?.ads_txt?.status === "pass" ? "pass" : (core.adsense_readiness?.ads_txt?.status === "missing" ? "fail" : "warning"),
                        value: core.adsense_readiness?.ads_txt?.status === "pass" ? "Valid" : (core.adsense_readiness?.ads_txt?.status === "missing" ? "Missing" : "Invalid Layout"),
                        description: "AdSense requirement to prevent domain spoofing and ad revenue fraud.",
                        fix: "Ensure your ads.txt file is correctly formatted and accessible at your-domain.com/ads.txt."
                    },
                    {
                        id: "adsense_snippet",
                        title: "AdSense verification snippet",
                        status: core.adsense_readiness?.snippet?.status === "found_in_head" ? "pass" : (core.adsense_readiness?.snippet?.status === "found_in_body" ? "warning" : "fail"),
                        value: core.adsense_readiness?.snippet?.status === "found_in_head" ? "Found in <head>" : (core.adsense_readiness?.snippet?.status === "found_in_body" ? "Wrong Location" : "Not Found"),
                        description: "Initial code required by AdSense to verify ownership and enable Auto-Ads.",
                        fix: "Place the AdSense code snippet exactly between the <head> and </head> tags of your site."
                    },
                    {
                        id: "site_language",
                        title: "AdSense Supported Language",
                        status: ADSENSE_SUPPORTED_LANGS.has(core.site_language?.primary || "") ? "pass" : "fail",
                        value: core.site_language?.primary?.toUpperCase() || "Unknown",
                        description: "Google only approves websites in languages supported by their ad network.",
                        fix: "Your site must be in one of the approved AdSense languages listed in Google's documentation."
                    },
                    {
                        id: "banned_keywords",
                        title: "Restricted / Spammy content intelligence",
                        status: (core.adsense_readiness?.content_intelligence?.risk_score || 0) > 40 ? "fail" : "pass",
                        value: (core.adsense_readiness?.content_intelligence?.risk_score || 0) > 0 ? `${core.adsense_readiness.content_intelligence.spam_keywords?.length || 0} Restricted Keywords` : "Safe Content",
                        description: "Scans for prohibited keywords (gambling, hacking, adult) that cause policy rejections.",
                        fix: "Remove or moderate content that mentions restricted topics to maintain compliance.",
                        instances: core.adsense_readiness?.content_intelligence?.spam_keywords || []
                    },
                    {
                        id: "thin_content",
                        title: "Word Count & Thin Content",
                        status: (core.content_analysis?.word_count || 0) < 300 ? "fail" : "pass",
                        value: `${core.content_analysis?.word_count || 0} words`,
                        description: "Analyzes text volume; AdSense requires substantial unique text per page.",
                        fix: "Expand your content with more descriptive text and unique information."
                    },
                    {
                        id: "keyword_cannibalization",
                        title: "Keyword Cannibalization analysis",
                        status: (core.keyword_intelligence?.conflicts_count || 0) > 5 ? "fail" : "pass",
                        value: `${core.keyword_intelligence?.conflicts_count || 0} Conflicts Found`,
                        description: "Detects URLs with identical or ultra-similar slugs that compete with each other.",
                        fix: "Restructure your URL slugs or content to target unique search intents per page."
                    },
                    {
                        id: "security_leaks",
                        title: "Sensitive technical leakage (Forensic)",
                        status: core.security_leaks?.found_leaks ? "fail" : "pass",
                        value: core.security_leaks?.found_leaks ? `${core.security_leaks.leaks?.length || 0} Sensitive files found` : "Clean Leak Check",
                        description: "Advanced scan for exposed .env, .git, or backup files in the root directory.",
                        fix: "Use .htaccess or server config to restrict public access to sensitive dev files immediately."
                    }
                ]
            },
            {
                name: "Performance",
                checks: [
                    {
                        id: "page_load_time",
                        title: "page load time",
                        status: core.pagespeed?.score >= 50 ? "pass" : (core.pagespeed ? "fail" : "not_scanned"),
                        value: core.pagespeed
                            ? `Mobile: ${core.pagespeed.mobile_score ?? "N/A"} | Desktop: ${core.pagespeed.desktop_score ?? "N/A"}${core.pagespeed.tbt ? ` | TBT: ${core.pagespeed.tbt}` : ""}`
                            : "N/A",
                        description: "Aggregated performance score representing overall speed.",
                        fix: "Optimize servers, leverage caching, and reduce heavy scripts."
                    },
                    {
                        id: "lcp_metric",
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
                        id: "cls_metric",
                        title: "image & accessibility audit",
                        status: !core.image_ux ? "not_scanned" : ((core.image_ux.missing_alt_count > 0 || core.image_ux.missing_dimensions > 0) ? "warning" : "pass"),
                        value: !core.image_ux ? "Requires Re-scan" : `${core.image_ux.missing_alt_count || 0} no-alt | ${core.image_ux.missing_dimensions || 0} no-size`,
                        description: "Audits images for alt tags (SEO) and explicit dimensions (CLS prevention).",
                        fix: "Add descriptive ALT text to all images and specify width/height to prevent layout shifts."
                    },
                    {
                        id: "unused_javascript",
                        title: "Reduce unused JavaScript",
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
                        id: "caching_headers",
                        title: "caching headers",
                        status: core.caching?.has_caching ? "pass" : (core.caching ? "warning" : "not_scanned"),
                        value: core.caching?.has_caching ? core.caching.cache_control || "Expires Set" : (core.caching ? "Not Configured" : "N/A"),
                        description: "Browser caching dramatically speeds up repeat visits.",
                        fix: "Configure Cache-Control headers on your server (Apache/Nginx/CDN) for static assets."
                    },
                    {
                        id: "lazy_loading",
                        title: "lazy loading",
                        status: core.image_checks?.total_images > 0 ? (core.image_checks.lazy_load_ratio >= 0.5 ? "pass" : "warning") : (core.pagespeed ? "pass" : "not_scanned"),
                        value: core.image_checks?.total_images > 0 ? `${core.image_checks.lazy_loaded}/${core.image_checks.total_images} images lazy-loaded` : "No Images Found",
                        description: "Defers loading of offscreen images until the user scrolls near them.",
                        fix: "Add loading=\"lazy\" to <img> and <iframe> tags below the fold."
                    },
                    {
                        id: "ttfb",
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
                        id: "fcp_metric",
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
                        id: "privacy_policy",
                        title: "privacy policy page",
                        status: trust.summary?.privacy ? "pass" : "fail",
                        value: trust.summary?.privacy ? "Found" : "Missing",
                        description: "Mandatory requirement. Must detail cookie usage and third-party data collection.",
                        fix: "Add a visible link in your footer to a comprehensive Privacy Policy regarding DoubleClick DART cookies.",
                        draftType: "privacy"
                    },
                    {
                        id: "terms_conditions",
                        title: "terms & conditions",
                        status: trust.summary?.terms ? "pass" : "warning",
                        value: trust.summary?.terms ? "Found" : "Missing",
                        description: "Outlines the rules for using your site, reducing overall liability risk.",
                        fix: "Draft a clear Terms of Service page, especially if you have user-generated content.",
                        draftType: "terms"
                    },
                    {
                        id: "about_page",
                        title: "about page",
                        status: trust.summary?.about ? "pass" : "warning",
                        value: trust.summary?.about ? "Found" : "Missing",
                        description: "Builds transparency and tells human reviewers who runs the publication.",
                        fix: "Create an About Us page detailing your team, mission, and editorial process.",
                        draftType: "about"
                    },
                    {
                        id: "contact_page",
                        title: "contact page",
                        status: trust.summary?.contact ? "pass" : "fail",
                        value: trust.summary?.contact ? "Found" : "Missing",
                        description: "Proves site ownership and provides accountability.",
                        fix: "Provide a working contact form or direct business email.",
                        draftType: "contact"
                    },
                    {
                        id: "cookie_consent",
                        title: "cookie consent",
                        status: trust.summary?.cookie_consent ? "pass" : "warning",
                        value: trust.summary?.cookie_consent ? "Found" : "Missing",
                        description: "Required for visitors from EU/UK (GDPR) and California (CCPA) if showing ads.",
                        fix: "Install a cookie consent popup/banner for EEA traffic compliance."
                    },
                    {
                        id: "prohibited_content",
                        title: "prohibited content detection",
                        status: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Prohibited Content") ? "fail" : (core.ai_policy ? "pass" : "not_scanned"),
                        value: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Prohibited Content") ? "Violations Detected" : "Clean",
                        description: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Prohibited Content")?.explanation || "AdSense bans adult, violence, copyrighted, and illegal drug content strictly.",
                        fix: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Prohibited Content")?.fix_suggestion || "Remove any content flagged by the AI engine as policy-violating immediately."
                    },
                    {
                        id: "copyright_risk",
                        title: "copyright risk signals",
                        status: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Copyright") ? "fail" : (core.ai_policy ? "pass" : "not_scanned"),
                        value: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Copyright") ? "Risk Detected" : "Clean",
                        description: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Copyright")?.explanation || "Providing illegal streaming links, warez or unauthorized downloads.",
                        fix: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Copyright")?.fix_suggestion || "Remove all links to unauthorized copyrighted material."
                    },
                    {
                        id: "clickbait_detection",
                        title: "misleading / clickbait detection",
                        status: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Clickbait") ? "warning" : (core.ai_policy ? "pass" : "not_scanned"),
                        value: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Clickbait") ? "Warning" : "Clean",
                        description: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Clickbait")?.explanation || "Sensational, false or purposely misleading content navigation.",
                        fix: core.ai_policy?.policy_violations?.find((v: any) => v.category === "Clickbait")?.fix_suggestion || "Ensure headings and promises accurately reflect the content provided."
                    },
                    {
                        id: "ad_placement",
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
                        id: "mixed_content",
                        title: "mixed content issues",
                        status: security.mixed_content ? "fail" : "pass",
                        value: security.mixed_content ? "Detected" : "Clean",
                        description: "Loading insecure (HTTP) scripts or images inside a secure (HTTPS) site.",
                        fix: "Ensure all resources (images, css, js) use 'https://' URLs."
                    },
                    {
                        id: "security_headers",
                        title: "security headers",
                        status: (security.headers?.csp || security.headers?.sts) ? "pass" : "warning",
                        value: security.headers?.sts ? "HSTS Active" : (security.headers?.csp ? "CSP Active" : "Missing Headers"),
                        description: "Headers like CSP or HSTS defend against XSS and injection attacks.",
                        fix: "Configure Strict-Transport-Security and Content-Security-Policy responses on your server."
                    },
                    {
                        id: "malware_phishing",
                        title: "malware / phishing flags",
                        status: security.safe_browsing?.status === "unsafe" ? "fail" : (security.safe_browsing ? "pass" : "not_scanned"),
                        value: security.safe_browsing?.status === "unsafe" ? "Blacklisted" : "Clean",
                        description: "Identifies if the domain is actively serving malicious payloads.",
                        fix: "Audit server logs, update CMS plugins, and scan for backdoor scripts."
                    },
                    {
                        id: "iframe_security",
                        title: "iframe security",
                        status: security.headers?.frame_options ? "pass" : "warning",
                        value: security.headers?.frame_options ? "Restricted" : "Unrestricted",
                        description: "Prevents clickjacking by restricting who can frame your site.",
                        fix: "Add 'X-Frame-Options: SAMEORIGIN' header to your web server config."
                    },
                    {
                        id: "security_leaks",
                        title: "Sensitive File Exposure",
                        status: !core.security_leaks ? "not_scanned" : (core.security_leaks.found_leaks ? "fail" : "pass"),
                        value: !core.security_leaks ? "Requires Re-scan" : (core.security_leaks.found_leaks ? `${core.security_leaks.leaks?.length} Leaks Found` : "Secure"),
                        description: "Checks for exposed .env, .git, and configuration backups.",
                        fix: "Restrict access to sensitive files using .htaccess or server permissions immediately."
                    }
                ]
            },
            {
                name: "Traffic & Audience Intelligence",
                checks: [
                    {
                        id: "domain_age",
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
                        id: "traffic_rank",
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
            const res = await fetch(`/api/scans/results?id=${id}`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to fetch scan results");
            }
            const { data } = await res.json();

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
                    page_type: pageType,
                    info: siteInfo
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

    const handleGenerateContentImprovements = async () => {
        if (!scanData || !scanId) return;
        setGeneratingAI(prev => ({ ...prev, content: true }));
        try {
            const res = await fetch('/api/ai/content-improvements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scan_id: scanId,
                    domain: scanData.sites?.domain || analysisUrl,
                    analysis_data: scanData.core_scan_data
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setScanData((prev: any) => ({
                    ...prev,
                    core_scan_data: {
                        ...prev.core_scan_data,
                        ai_recommendations: {
                            ...prev.core_scan_data.ai_recommendations,
                            content_improvements: data.suggestions
                        }
                    }
                }));
                // Scroll to strategy section
                setTimeout(() => {
                    document.getElementById('ai-strategy-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            } else {
                setToast({ message: `Failed to generate strategy: ${data.error}`, type: 'error' });
            }
        } catch (e) {
            console.error(`AI Strategy error:`, e);
        } finally {
            setGeneratingAI(prev => ({ ...prev, content: false }));
        }
    };

    const handleGenerateMonetization = async () => {
        if (!scanData || !scanId) return;
        setGeneratingAI(prev => ({ ...prev, monetization: true }));
        try {
            const res = await fetch('/api/ai/monetization/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scan_id: scanId,
                    domain: scanData.sites?.domain || analysisUrl,
                    analysis_data: scanData.core_scan_data
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setScanData((prev: any) => ({
                    ...prev,
                    core_scan_data: {
                        ...prev.core_scan_data,
                        ai_recommendations: {
                            ...prev.core_scan_data.ai_recommendations,
                            monetization_methods: data.methods
                        }
                    }
                }));
                // Scroll to monetization section
                setTimeout(() => {
                    document.getElementById('ai-monetization-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            } else {
                alert(`Failed to discover methods: ` + data.error);
            }
        } catch (e) {
            console.error(`Monetization error:`, e);
        } finally {
            setGeneratingAI(prev => ({ ...prev, monetization: false }));
        }
    };

    const suggestAppealReason = () => {
        if (!scanData) return "";
        const categories = getReportDetails() as any[];
        const allChecks = categories.flatMap(cat => cat.checks || []);
        
        // Priority issues
        const priorityMapping: { [key: string]: string } = {
            "privacy_policy": "privacy_policy",
            "low_value_content": "low_value_content",
            "thin_content": "low_value_content",
            "replicated_content": "replicated_content",
            "scraped_content": "scraped_content",
            "copyright_risk": "copyrighted_material",
            "mobile_friendliness": "mobile_unfriendly",
            "domain_age": "new_domain",
            "site_navigation": "site_navigation",
            "google_safe_browsing": "restricted_content"
        };

        for (const [checkId, reasonId] of Object.entries(priorityMapping)) {
            const check = allChecks.find((c: any) => c.id === checkId);
            if (check && check.status === 'fail') return reasonId;
        }

        return "";
    };

    const handleGenerateSmartAppeal = async (reasonIdParam?: string) => {
        const reasonId = reasonIdParam || selectedAppealReason || suggestAppealReason() || "low_value_content";
        if (reasonIdParam) setSelectedAppealReason(reasonIdParam);
        else if (!selectedAppealReason) setSelectedAppealReason(reasonId);

        const reason = appealReasons.find(r => r.id === reasonId);
        if (!reason) return;

        setGeneratingAI(prev => ({ ...prev, appeal: true }));
        try {
            const res = await fetch(`/appeal letters/${reason.file}`);
            let text = await res.text();

            // Placeholder replacement
            const siteUrl = scanData?.sites?.domain || analysisUrl;
            const siteName = siteUrl.split('.')[0].charAt(0).toUpperCase() + siteUrl.split('.')[0].slice(1);
            
            text = text.replace(/\[Your Website Name\]/g, siteName);
            text = text.replace(/\[Your Website URL\]/g, `https://${siteUrl}`);
            text = text.replace(/\[Insert Website URL\]/g, `https://${siteUrl}`);
            text = text.replace(/\[Your Full Name\]/g, "Webmaster");
            text = text.replace(/\[Date of Submission\]/g, new Date().toLocaleDateString());
            text = text.replace(/\[Your Niche, e.g., Finance\/Tech\/Fashion\]/g, "General Information");
            text = text.replace(/\[Mention Word Count, e.g., 1,200\+\]/g, "1,500+");

            setScanData((prev: any) => ({
                ...prev,
                core_scan_data: {
                    ...prev.core_scan_data,
                    ai_recommendations: {
                        ...prev.core_scan_data?.ai_recommendations,
                        appeal_draft: text
                    }
                }
            }));
        } catch (e) {
            console.error("Error loading appeal template:", e);
        } finally {
            setGeneratingAI(prev => ({ ...prev, appeal: false }));
        }
    };

    const handleGenerateAppeal = () => handleGenerateSmartAppeal();


    const reportCategories = getReportDetails();

    const IssueModal = ({ isOpen, onClose, issueId, platform }: { isOpen: boolean, onClose: () => void, issueId: string, platform: string }) => {
        if (!isOpen || !issueId) return null;
        const check = adsenseChecks[issueId];
        if (!check) return null;

        const platformAdvice = check.platformSpecific?.[platform as keyof typeof check.platformSpecific] || check.platformSpecific?.custom;

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <span className={`w-3 h-3 rounded-full ${check.severity === 'Critical' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : check.severity === 'Warning' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                            <h3 className="text-xl font-light text-slate-800 tracking-tight">{check.title}</h3>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200/50 flex items-center justify-center text-slate-400 transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                        {/* Platform Header Badge */}
                        <div className="flex items-center justify-between">
                            <div className={`inline-flex px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold ${
                                check.severity === 'Critical' ? 'bg-red-50 text-red-600 border border-red-100' : 
                                check.severity === 'Warning' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                                {check.severity}
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-slate-200">
                                <span className="material-symbols-outlined text-[14px]">devices</span>
                                {platform}
                            </div>
                        </div>

                        {/* Problem Section */}
                        <div>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 block">What is the Problem?</span>
                            <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-line">
                                {check.problem}
                            </p>
                        </div>

                        {/* Location */}
                        <div>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 block">Where is the Issue?</span>
                            <div className="flex items-center gap-2 text-slate-700 text-sm font-medium">
                                <span className="material-symbols-outlined text-base text-slate-400">location_on</span>
                                {check.location}
                            </div>
                        </div>

                        {/* Affected Items / Instances */}
                        {selectedIssue?.instances && selectedIssue.instances.length > 0 && (
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 block not-italic">Affected Items ({selectedIssue.instances.length})</span>
                                <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                    {selectedIssue.instances.map((item: string, idx: number) => (
                                        <li key={idx} className="text-xs text-slate-500 break-all flex items-start gap-2">
                                            <span className="text-slate-300">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Fix Guide Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-500 font-bold block">
                                    How to Fix it? (Step-by-Step)
                                </span>
                                {platformAdvice && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-emerald-100">
                                        <span className="material-symbols-outlined text-xs">auto_awesome</span>
                                        Expert Guidance
                                    </div>
                                )}
                            </div>

                            {/* Platform Advice - Primary if available */}
                            {platformAdvice ? (
                                <div className="p-6 bg-slate-50 rounded-[28px] border border-slate-100 shadow-sm transition-all">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold">Recommended for {platform}</span>
                                    </div>
                                    <p className="text-slate-800 text-sm leading-relaxed font-medium italic">
                                        "{platformAdvice}"
                                    </p>
                                </div>
                            ) : null}

                            {/* Standard 3-Step Solution */}
                            <div className={platformAdvice ? "pt-4 border-t border-slate-100" : ""}>
                                <span className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold mb-4 block">
                                    {platformAdvice ? "Technical Implementation Steps" : "3-Step Implementation Guide"}
                                </span>
                                <div className="space-y-4">
                                    {check.fixGuide.steps.map((step: string, i: number) => (
                                        <div key={i} className="flex gap-4 items-start">
                                            <div className="w-6 h-6 rounded-full bg-slate-50 text-slate-400 flex-shrink-0 flex items-center justify-center text-[10px] font-bold border border-slate-200">
                                                {i + 1}
                                            </div>
                                            <p className="text-slate-600 text-sm pt-0.5 leading-relaxed">{step}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 p-5 bg-slate-900 rounded-2xl text-slate-300">
                                    <p className="text-xs font-light leading-relaxed mb-4">{check.fixGuide.detailed}</p>
                                    {check.fixGuide.code && (
                                        <div className="relative group">
                                            <pre className="text-[11px] font-mono bg-black/30 p-4 rounded-xl overflow-x-auto text-emerald-400 selection:bg-emerald-500/20">
                                                <code>{check.fixGuide.code}</code>
                                            </pre>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(check.fixGuide.code!);
                                                    setCopySuccess(true);
                                                    setTimeout(() => setCopySuccess(false), 2000);
                                                }}
                                                className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm text-white">
                                                    {copySuccess ? 'check' : 'content_copy'}
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Vibe Coding Prompt - Developer Logic */}
                        {(platform === 'custom' || platform === 'nextjs') && check.vibeCodingPrompt && (
                            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-2xl border border-indigo-400/20 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="particle-glow w-2 h-2 rounded-full bg-indigo-400"></div>
                                        <span className="text-[10px] uppercase tracking-[0.3em] text-indigo-300 font-bold">Vibe Coding Prompt for AI IDE</span>
                                    </div>
                                    <p className="text-sm text-indigo-50/70 font-light leading-relaxed mb-4">
                                        Copy this prompt into Cursor, VS Code Copilot, or Windsurf to fix this issue automatically.
                                    </p>
                                    <div className="bg-black/40 border border-white/10 p-4 rounded-xl text-indigo-100/90 text-[11px] font-mono leading-relaxed relative flex items-center justify-between">
                                        <span className="pr-10">{check.vibeCodingPrompt}</span>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(check.vibeCodingPrompt!);
                                                setCopySuccess(true);
                                                setTimeout(() => setCopySuccess(false), 2000);
                                            }}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                                        >
                                            <span className="material-symbols-outlined text-sm">
                                                {copySuccess ? 'check' : 'content_copy'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <button 
                            onClick={onClose}
                            className="px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                        >
                            Got it, thanks!
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const getIssuesList = () => {
        const list: any[] = [];
        const categories = reportCategories as any[];
        categories.forEach((cat: any) => {
            cat.checks.forEach((check: any) => {
                if (check.status === "fail" || check.status === "warning") {
                    list.push({ ...check, category: cat.name });
                }
            });
        });
        return list;
    };

    const aggregatedIssues = getIssuesList();

    const issues = {
        critical: aggregatedIssues.filter((i: any) => i.status === "fail").length,
        warnings: aggregatedIssues.filter((i: any) => i.status === "warning").length,
        passed: (reportCategories as any[]).reduce((acc: number, cat: any) => acc + cat.checks.filter((i: any) => i.status === "pass").length, 0),
        missing: (reportCategories as any[]).reduce((acc: number, cat: any) => acc + cat.checks.filter((i: any) => i.status === "not_scanned").length, 0)
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

        // Temporarily hide UI elements not suited for a professional report
        const elementsToHide = document.querySelectorAll('.no-pdf');
        elementsToHide.forEach(el => (el as HTMLElement).style.display = 'none');

        try {
            const canvas = await html2canvas(element, { 
                scale: 2, 
                backgroundColor: "#f8fafc",
                useCORS: true,
                logging: false,
                windowWidth: 1200
            });
            const imgData = canvas.toDataURL("image/png");

            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

            // Add watermark
            pdf.setFontSize(40);
            pdf.setTextColor(240, 240, 240);
            pdf.text("www.ads2go.org", pdfWidth / 2, pdf.internal.pageSize.getHeight() / 2, { align: "center", angle: -45 });

            pdf.save(`${analysisUrl.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_adsense_report.pdf`);
        } catch (err) {
            console.error("PDF generation failed:", err);
            alert("Failed to generate PDF report.");
        } finally {
            elementsToHide.forEach(el => (el as HTMLElement).style.display = '');
        }
    };

    const copyShareLink = async () => {
        const url = `${window.location.origin}/results?id=${scanId || sessionStorage.getItem('currentScanId')}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `AdSense Audit Report: ${analysisUrl}`,
                    text: `View the AdSense Audit & Fix Roadmap for ${analysisUrl}. Ad2Go helps you get approved by Google.`,
                    url: url,
                });
            } catch (err) {
                console.log("Share failed or cancelled:", err);
            }
        } else {
            navigator.clipboard.writeText(url).then(() => {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            });
        }
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: `
                .zen-card {
                    background: #ffffff;
                    border: 1px solid rgba(0, 0, 0, 0.04);
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.01), 0 10px 20px -12px rgba(0, 0, 0, 0.03);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .zen-card:hover {
                    border-color: rgba(0, 0, 0, 0.08);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
                    transform: translateY(-2px);
                }
                .status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                }
                .feature-card {
                    background: #ffffff;
                    border: 1px solid #E5E7EB;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px -15px rgba(0,0,0,0.03);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .feature-card:hover {
                    transform: translateY(-2px);
                    border-color: #D1D5DB;
                }
                .policy-list-card {
                    background: #ffffff;
                    border: 1px solid #E5E7EB;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px -15px rgba(0,0,0,0.03);
                    overflow: hidden;
                }
            `}} />
            <Navbar />
            <main id="pdf-report-content" className="flex-grow flex flex-col relative z-10 bg-[#F8FAFC] pb-10">
                {/* Dashboard Header Section */}
                <header className="text-center pt-32 md:pt-40 space-y-4 px-6">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold tracking-widest uppercase mb-2">
                        Analysis Complete
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-light tracking-tight text-slate-900">
                        {analysisUrl}
                    </h1>
                    <div className="flex justify-center pt-4 no-pdf">
                        <button 
                            onClick={() => {
                                const roadmapTabBtn = document.getElementById("roadmap-tab-btn");
                                if (roadmapTabBtn) {
                                    roadmapTabBtn.click();
                                    document.getElementById("report-navigation-tabs")?.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-sm font-medium hover:bg-amber-100 transition-colors shadow-sm active:scale-95"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                            </svg>
                            Fix & Apply
                        </button>
                    </div>
                </header>

                {/* Hero Score Visualization */}
                <section className="relative mt-12 px-4 sm:px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="glass-card rounded-[40px] p-8 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 overflow-hidden relative">
                            {/* Decorative Background Glow */}
                            <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-100/40 rounded-full blur-[100px] pointer-events-none"></div>
                            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-100/40 rounded-full blur-[100px] pointer-events-none"></div>
                            
                            {/* Left Column: Circular Visualization */}
                            <div className="relative w-72 h-72 flex items-center justify-center shrink-0">
                                {/* Outer Progress Ring */}
                                <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" fill="transparent" r="44" stroke="#f1f5f9" strokeWidth="6"></circle>
                                    <circle cx="50" cy="50" fill="transparent" r="44" stroke="url(#gradient-purple)" strokeDasharray="276" strokeDashoffset={276 - (getOverallScore() / 100) * 276} strokeLinecap="round" strokeWidth="6" className="transition-all duration-1000 ease-out"></circle>
                                    <defs>
                                        <linearGradient id="gradient-purple" x1="0%" x2="100%" y1="0%" y2="100%">
                                            <stop offset="0%" stopColor="#8b5cf6"></stop>
                                            <stop offset="100%" stopColor="#6366f1"></stop>
                                        </linearGradient>
                                    </defs>
                                </svg>
                                
                                {/* Central Text */}
                                <div className="text-center z-10">
                                    <span className="block text-4xl font-bold tracking-tight text-slate-800">
                                        {getOverallScore()}<span className="text-lg opacity-50 ml-0.5">%</span>
                                    </span>
                                    <span className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">Analysis</span>
                                </div>

                                {/* Floating Category Icons */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-10 h-10 rounded-xl glass-card flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-indigo-500 text-xl">search</span>
                                    <span className="absolute -bottom-5 text-[8px] font-bold text-slate-400">SEO</span>
                                </div>
                                <div className="absolute top-1/4 -left-6 w-10 h-10 rounded-xl glass-card flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-indigo-500 text-xl">lock</span>
                                    <span className="absolute -bottom-5 text-[8px] font-bold text-slate-400 uppercase">Security</span>
                                </div>
                                <div className="absolute bottom-6 -left-2 w-10 h-10 rounded-xl glass-card flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-indigo-500 text-xl">gavel</span>
                                    <span className="absolute -bottom-5 text-[8px] font-bold text-slate-400 uppercase">Policy</span>
                                </div>
                                <div className="absolute bottom-6 -right-2 w-10 h-10 rounded-xl glass-card flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-indigo-500 text-xl">bolt</span>
                                    <span className="absolute -bottom-5 text-[8px] font-bold text-slate-400 uppercase">Perf</span>
                                </div>
                                <div className="absolute top-1/4 -right-6 w-10 h-10 rounded-xl glass-card flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-indigo-500 text-xl">description</span>
                                    <span className="absolute -bottom-5 text-[8px] font-bold text-slate-400 uppercase">Content</span>
                                </div>
                            </div>

                            {/* Right Column: Overall Score Text */}
                            <div className="text-center lg:text-left flex-1 lg:max-w-xs">
                                <div className="space-y-1 mb-8">
                                    <span className="text-[12px] font-bold text-slate-400 tracking-widest uppercase">Overall Score</span>
                                    <div className="flex items-baseline justify-center lg:justify-start">
                                        <span className="text-9xl font-light score-gradient-text leading-none">{getOverallScore()}</span>
                                        <span className="text-xl font-medium text-slate-300 ml-2">/100</span>
                                    </div>
                                </div>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    {getOverallScore() >= 80 
                                        ? "Excellent! Your website is highly eligible for AdSense. Just a few minor tweaks left to reach full potential."
                                        : getOverallScore() >= 50 
                                            ? "Your website shows moderate eligibility. Focus on critical security and policy issues to improve your score."
                                            : "Significant improvements needed. Your site currently has critical blockers for AdSense approval."}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Issue Metrics Row */}
                <section className="mt-8 px-4 sm:px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="glass-card rounded-[24px] px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
                            <div className="flex items-center gap-4 w-full md:w-1/3 md:justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 pulse-red"></div>
                                <span className="text-sm font-medium text-slate-600">Critical Issues</span>
                                <span className="text-xl font-bold text-slate-900 ml-auto md:ml-4">{String(issues.critical).padStart(2, '0')}</span>
                            </div>
                            <div className="flex items-center gap-4 w-full md:w-1/3 md:justify-center border-b md:border-b-0 md:border-r border-slate-100 py-6 md:py-0">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                                <span className="text-sm font-medium text-slate-600">Warnings</span>
                                <span className="text-xl font-bold text-slate-900 ml-auto md:ml-4">{String(issues.warnings).padStart(2, '0')}</span>
                            </div>
                            <div className="flex items-center gap-4 w-full md:w-1/3 md:justify-center pt-6 md:pt-0">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                                <span className="text-sm font-medium text-slate-600">Passed Checks</span>
                                <span className="text-xl font-bold text-slate-900 ml-auto md:ml-4">{String(issues.passed).padStart(2, '0')}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quick Actions Action Bar */}
                <section className="mt-12 px-4 sm:px-6 no-pdf">
                    <div className="max-w-5xl mx-auto">
                        <div className="bg-white rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.03)] p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
                            {/* Left Side: Primary Action */}
                            <button 
                                onClick={generatePDF}
                                className="bg-[#0F172A] text-white px-10 py-5 rounded-[22px] flex items-center gap-3 hover:bg-slate-800 transition-all shadow-[0_10px_20px_rgba(15,23,42,0.15)] active:scale-95 group w-full md:w-auto"
                            >
                                <span className="material-symbols-outlined text-[22px] group-hover:translate-y-0.5 transition-transform">download</span>
                                <span className="text-xs font-bold uppercase tracking-[0.15em]">Export Report</span>
                            </button>

                            {/* Right Side: Secondary Actions */}
                            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 md:pr-10">
                                <button 
                                    onClick={() => {
                                        const roadmapTabBtn = document.getElementById("roadmap-tab-btn");
                                        if (roadmapTabBtn) {
                                            roadmapTabBtn.click();
                                            document.getElementById("report-navigation-tabs")?.scrollIntoView({ behavior: 'smooth' });
                                        }
                                    }}
                                    className="flex items-center gap-2.5 text-slate-500 hover:text-indigo-600 transition-colors group"
                                >
                                    <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-indigo-500">map</span>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Fix Roadmap</span>
                                </button>

                                <button 
                                    onClick={copyShareLink}
                                    className="flex items-center gap-2.5 text-slate-500 hover:text-indigo-600 transition-colors group"
                                >
                                    <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-indigo-500">
                                        {copySuccess ? 'check' : 'share'}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
                                        {copySuccess ? 'Copied!' : 'Share Report'}
                                    </span>
                                </button>

                                <Link 
                                    href="/analysis"
                                    className="flex items-center gap-2.5 text-slate-500 hover:text-indigo-600 transition-colors group"
                                >
                                    <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-indigo-500">cached</span>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Re-Analyze</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Category Scores Breakdown - Zen Dashboard Style */}
                <section className="relative z-10 py-16 px-4 md:px-6">
                    <div className="max-w-6xl mx-auto">
                        <header className="mb-12">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-semibold mb-3">Overview</p>
                            <h1 className="text-4xl font-light tracking-tight text-slate-900">Category Scores</h1>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {reportCategories.map((category: any, index: number) => {
                                const total = category.checks.length;
                                const passed = category.checks.reduce((acc: number, c: any) => {
                                    if (c.status === 'pass') return acc + 1;
                                    if (c.status === 'warning') return acc + 0.5;
                                    return acc;
                                }, 0);
                                const score = total > 0 ? Math.round((passed / total) * 100) : 0;

                                // Icon Mapping
                                const getIcon = (name: string) => {
                                    const iconClass = "w-5 h-5 text-slate-300 stroke-[1.2]";
                                    if (name === "Technical SEO") return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>;
                                    if (name.includes("Trust") || name.includes("Domain")) return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>;
                                    if (name.includes("Schema") || name.includes("Structured")) return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>;
                                    if (name.includes("Content")) return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>;
                                    if (name.includes("AdSense") || name.includes("Readiness")) return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>;
                                    if (name.includes("Performance")) return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
                                    if (name.includes("Policy") || name.includes("Compliance")) return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>;
                                    if (name.includes("Security")) return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>;
                                    if (name.includes("Traffic") || name.includes("Intelligence")) return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>;
                                    return <span className="material-symbols-outlined text-slate-300">category</span>;
                                };

                                const getScoreColorClass = (s: number) => {
                                    if (s < 50) return "text-red-400";
                                    return "text-slate-800"; 
                                };

                                const getBarColorClass = (s: number) => {
                                    if (s >= 60) return "bg-emerald-400";
                                    if (s >= 50) return "bg-orange-400";
                                    return "bg-red-400";
                                };

                                return (
                                    <section key={index} className="zen-card rounded-[28px] p-6 flex flex-col justify-between h-[230px]">
                                        <div className="flex justify-between items-start">
                                            <h2 className="text-sm font-medium text-slate-500 tracking-tight">{category.name}</h2>
                                            {getIcon(category.name)}
                                        </div>
                                        
                                        <div className="flex items-baseline justify-between">
                                            <span className={`text-6xl font-light tracking-tighter ${getScoreColorClass(score)}`}>
                                                {score}
                                            </span>
                                            {score >= 60 && (
                                                <div className="status-dot bg-emerald-400"></div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="w-full bg-slate-50 rounded-full h-[3px] overflow-hidden">
                                                <div 
                                                    className={`${getBarColorClass(score)} h-full rounded-full transition-all duration-1000`} 
                                                    style={{ width: `${Math.max(score, 2)}%` }}
                                                ></div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setActiveTab("report");
                                                    document.getElementById("report-navigation-tabs")?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                                className="text-[10px] font-semibold tracking-widest text-slate-400 hover:text-slate-900 transition-colors uppercase text-left"
                                            >
                                                Details
                                            </button>
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Tabs Section */}
                <section id="report-navigation-tabs" className="relative z-10 py-12 md:py-16 px-4 sm:px-6 no-pdf">
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
                                id="roadmap-tab-btn"
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
                                {/* Platform Context Row */}
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-2">
                                    <div className="flex flex-col">
                                        <h3 className="text-xl md:text-2xl font-extralight text-slate-900 tracking-tight">Full AdSense Report</h3>
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mt-1">Select your platform for personalized fixes</p>
                                    </div>
                                    <div className="bg-slate-100/50 p-1.5 rounded-2xl flex gap-1 border border-slate-200/50">
                                        {["wordpress", "shopify", "nextjs", "custom"].map((p: string) => (
                                            <button
                                                key={p}
                                                onClick={() => setSelectedPlatform(p as any)}
                                                className={`px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all ${
                                                    selectedPlatform === p 
                                                    ? "bg-white text-indigo-600 shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-200" 
                                                    : "text-slate-500 hover:text-slate-800"
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
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
                                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                {check.id && adsenseChecks[check.id] && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedIssue(check);
                                                                            setIsModalOpen(true);
                                                                        }}
                                                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                                                            (check.status === 'fail' || check.status === 'warning') 
                                                                            ? "bg-slate-900 text-white border-slate-900 shadow-sm hover:shadow-md" 
                                                                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                                                        }`}
                                                                    >
                                                                        <span className="material-symbols-outlined text-[16px]">
                                                                            {(check.status === 'fail' || check.status === 'warning') ? "construction" : "info"}
                                                                        </span>
                                                                        {(check.status === 'fail' || check.status === 'warning') ? "Fix & Details" : "Explain"}
                                                                    </button>
                                                                )}
                                                                
                                                                {check.draftType && scanData?.trust_pages_data?.drafts?.[check.draftType] && (
                                                                    <button
                                                                        onClick={() => setActiveDraft({
                                                                            type: check.draftType,
                                                                            content: scanData.trust_pages_data.drafts[check.draftType],
                                                                            regenerating: false
                                                                        })}
                                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs rounded-lg font-semibold border border-indigo-100 hover:bg-indigo-100 transition-all"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                                                                        AI Draft
                                                                    </button>
                                                                )}

                                                                {(check.status === "fail" || check.status === "warning") && (
                                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-500 text-[11px] font-medium italic">
                                                                        {check.fix}
                                                                    </div>
                                                                )}
                                                            </div>
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
                                        ].map((phase: any, phaseIdx: number) => {
                                            const phaseIssues = aggregatedIssues.filter((i: any) => phase.categories.includes(i.category));
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
                                                                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                                                        <div className="flex gap-2">
                                                                                            <span className="material-symbols-outlined text-[14px] text-blue-500 mt-0.5">build</span>
                                                                                            <span>{issue.fix}</span>
                                                                                        </div>
                                                                                        {issue.id && adsenseChecks[issue.id] && (
                                                                                            <button
                                                                                                onClick={() => {
                                                                                                    setSelectedIssue(issue);
                                                                                                    setIsModalOpen(true);
                                                                                                }}
                                                                                                className="flex-shrink-0 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold uppercase tracking-widest text-[9px] border border-emerald-100 transition-all flex items-center gap-1.5"
                                                                                            >
                                                                                                <span className="material-symbols-outlined text-xs">plumbing</span>
                                                                                                Fix & Details
                                                                                            </button>
                                                                                        )}
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
                            <div className="flex flex-col gap-24 py-12">
                                {/* Hero Section */}
                                <div className="flex flex-col gap-6 max-w-3xl">
                                    <h1 className="text-black text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
                                        Ad2Go AI Assistant
                                    </h1>
                                    <p className="text-slate-500 text-lg md:text-xl font-normal leading-relaxed">
                                        The professional toolkit for content optimization, revenue maximization, and automated compliance management.
                                    </p>
                                </div>

                                {/* Feature Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                    {/* Card 1: Content Improvements */}
                                    <div className="bg-white rounded-[20px] p-10 border border-slate-200 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] hover:translate-y-[-2px] hover:border-slate-300 transition-all duration-300 flex flex-col justify-between">
                                        <div className="flex flex-col gap-8">
                                            <div className="size-11 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100">
                                                <span className="material-symbols-outlined text-2xl">query_stats</span>
                                            </div>
                                            <div>
                                                <h3 className="text-black text-[17px] font-semibold mb-3">Content Improvements</h3>
                                                <p className="text-slate-500 text-[14px] leading-relaxed">
                                                    AI-driven strategies to enhance your content performance and boost audience engagement.
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleGenerateContentImprovements}
                                            disabled={generatingAI['content']}
                                            className="mt-12 w-full h-11 rounded-lg border border-slate-200 text-slate-700 text-[13px] font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {generatingAI['content'] ? 'Analyzing...' : 'Generate Strategy'}
                                            {!generatingAI['content'] && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                                        </button>
                                    </div>

                                    {/* Card 2: Monetization Methods */}
                                    <div className="bg-white rounded-[20px] p-10 border border-slate-200 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] hover:translate-y-[-2px] hover:border-slate-300 transition-all duration-300 flex flex-col justify-between">
                                        <div className="flex flex-col gap-8">
                                            <div className="size-11 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100">
                                                <span className="material-symbols-outlined text-2xl">payments</span>
                                            </div>
                                            <div>
                                                <h3 className="text-black text-[17px] font-semibold mb-3">Monetization Methods</h3>
                                                <p className="text-slate-500 text-[14px] leading-relaxed">
                                                    Discover high-yield revenue streams tailored specifically for your platform's niche and audience.
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleGenerateMonetization}
                                            disabled={generatingAI['monetization']}
                                            className="mt-12 w-full h-11 rounded-lg border border-slate-200 text-slate-700 text-[13px] font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {generatingAI['monetization'] ? 'Analyzing...' : 'Discover Methods'}
                                            {!generatingAI['monetization'] && <span className="material-symbols-outlined text-[18px]">explore</span>}
                                        </button>
                                    </div>

                                    {/* Card 3: Appeal Letter Generator */}
                                    <div className="bg-white rounded-[20px] p-10 border border-slate-200 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] hover:translate-y-[-2px] hover:border-slate-300 transition-all duration-300 flex flex-col justify-between relative">
                                        <div className="flex flex-col gap-8">
                                            <div className="size-11 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100">
                                                <span className="material-symbols-outlined text-2xl">description</span>
                                            </div>
                                            <div>
                                                <h3 className="text-black text-[17px] font-semibold mb-3">Appeal Letter Generator</h3>
                                                <div className="mb-4">
                                                    <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1.5 block">Rejection Reason</label>
                                                    <select 
                                                        value={selectedAppealReason || suggestAppealReason()} 
                                                        onChange={(e) => {
                                                            setSelectedAppealReason(e.target.value);
                                                            // Clear existing draft when reason changes to avoid confusion
                                                            setScanData((prev: any) => ({
                                                                ...prev,
                                                                core_scan_data: {
                                                                    ...prev?.core_scan_data,
                                                                    ai_recommendations: {
                                                                        ...prev?.core_scan_data?.ai_recommendations,
                                                                        appeal_draft: null
                                                                    }
                                                                }
                                                            }));
                                                        }}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-black transition-all appearance-none cursor-pointer"
                                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                                                    >
                                                        <option value="" disabled>Select reason...</option>
                                                        {appealReasons.map(r => (
                                                            <option key={r.id} value={r.id}>{r.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <p className="text-slate-500 text-[14px] leading-relaxed">
                                                    Create professionally structured appeal letters for platform compliance and policy issues.
                                                </p>
                                            </div>
                                        </div>

                                        {scanData?.core_scan_data?.ai_recommendations?.appeal_draft ? (
                                            <div className="mt-8 flex gap-3">
                                                <button 
                                                    onClick={() => {
                                                        const draft = scanData.core_scan_data.ai_recommendations.appeal_draft;
                                                        navigator.clipboard.writeText(draft);
                                                        setCopySuccess(true);
                                                        setTimeout(() => setCopySuccess(false), 2000);
                                                    }}
                                                    className="flex-1 h-11 rounded-lg bg-black text-white text-[13px] font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">{copySuccess ? 'check' : 'content_copy'}</span>
                                                    {copySuccess ? 'Copied' : 'Copy Letter'}
                                                </button>
                                                <button 
                                                    onClick={() => handleGenerateSmartAppeal()}
                                                    disabled={generatingAI['appeal']}
                                                    className="size-11 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center disabled:opacity-50"
                                                    title="Regenerate"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleGenerateSmartAppeal()}
                                                disabled={generatingAI['appeal']}
                                                className="mt-12 w-full h-11 rounded-lg border border-slate-200 text-slate-700 text-[13px] font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {generatingAI['appeal'] ? 'Drafting...' : 'Generate Letter'}
                                                {!generatingAI['appeal'] && <span className="material-symbols-outlined text-[18px]">edit_note</span>}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Smart Draft Preview Section (Dedicated) */}
                                {scanData?.core_scan_data?.ai_recommendations?.appeal_draft && (
                                    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-top-6 duration-500">
                                        <div className="flex flex-col gap-2 px-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col gap-1">
                                                    <h2 className="text-black text-2xl font-semibold tracking-tight">Appeal Letter Preview</h2>
                                                    <p className="text-slate-500 text-[14px]">Review and finalize your professional appeal draft.</p>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        setScanData((prev: any) => ({
                                                            ...prev,
                                                            core_scan_data: {
                                                                ...prev?.core_scan_data,
                                                                ai_recommendations: {
                                                                    ...prev?.core_scan_data?.ai_recommendations,
                                                                    appeal_draft: null
                                                                }
                                                            }
                                                        }));
                                                    }}
                                                    className="size-10 rounded-full bg-slate-100 text-slate-400 hover:bg-black hover:text-white transition-all flex items-center justify-center shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="liquid-glass-card rounded-[32px] overflow-hidden border border-slate-200/50 shadow-xl bg-white/50 backdrop-blur-xl">
                                            <div className="p-8 md:p-12">
                                                <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                                            <span className="material-symbols-outlined">drafts</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Document Type</span>
                                                            <span className="text-[14px] font-semibold text-slate-800">Professional Appeal Letter</span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            const draft = scanData.core_scan_data.ai_recommendations.appeal_draft;
                                                            navigator.clipboard.writeText(draft);
                                                            setCopySuccess(true);
                                                            setTimeout(() => setCopySuccess(false), 2000);
                                                        }}
                                                        className="px-6 h-11 bg-black text-white hover:bg-slate-800 transition-all rounded-xl text-[13px] font-medium flex items-center gap-2 shadow-lg shadow-black/10"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">{copySuccess ? 'check' : 'content_copy'}</span>
                                                        {copySuccess ? 'Copied to Clipboard' : 'Copy Full Text'}
                                                    </button>
                                                </div>
                                                
                                                <div className="relative group">
                                                    <div className="max-h-[500px] overflow-y-auto text-[14px] md:text-[15px] text-slate-700 leading-relaxed font-mono whitespace-pre-wrap bg-slate-50/50 p-8 md:p-12 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                                                        {scanData.core_scan_data.ai_recommendations.appeal_draft}
                                                    </div>
                                                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-50/80 to-transparent rounded-b-2xl pointer-events-none"></div>
                                                </div>

                                                <div className="mt-8 flex items-center gap-3 text-slate-400 text-[11px] px-2 italic">
                                                    <span className="material-symbols-outlined text-sm">info</span>
                                                    This letter is a professional draft. Please review and customize any bracketed information before submission.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Content Strategy Section */}
                                {scanData?.core_scan_data?.ai_recommendations?.content_improvements && (
                                    <div id="ai-strategy-section" className="flex flex-col gap-10 animate-in fade-in slide-in-from-top-12 duration-700 pb-12">
                                        <div className="flex flex-col gap-2 px-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col gap-1">
                                                    <h2 className="text-black text-2xl font-semibold tracking-tight">AI Content Strategy</h2>
                                                    <p className="text-slate-500 text-[14px]">Personalized roadmap to elevate your content quality and bypass AdSense approval barriers.</p>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        setScanData((prev: any) => ({
                                                            ...prev,
                                                            core_scan_data: {
                                                                ...prev?.core_scan_data,
                                                                ai_recommendations: {
                                                                    ...prev?.core_scan_data?.ai_recommendations,
                                                                    content_improvements: null
                                                                }
                                                            }
                                                        }));
                                                    }}
                                                    className="size-10 rounded-full bg-slate-100 text-slate-400 hover:bg-black hover:text-white transition-all flex items-center justify-center shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                            {scanData.core_scan_data.ai_recommendations.content_improvements.map((improvement: any, idx: number) => (
                                                <div key={idx} className="liquid-glass-card rounded-[32px] p-8 flex flex-col gap-6 border border-slate-200/50 shadow-xl bg-white/50 backdrop-blur-xl group hover:border-indigo-200/50 transition-all duration-500">
                                                    <div className="flex items-start justify-between">
                                                        <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                                            <span className="material-symbols-outlined text-[24px]">
                                                                {idx === 0 ? 'article' : idx === 1 ? 'architecture' : idx === 2 ? 'speed' : 'diamond'}
                                                            </span>
                                                        </div>
                                                        <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-full">Step {idx + 1}</span>
                                                    </div>
                                                    
                                                    <div className="flex flex-col gap-3">
                                                        <h3 className="text-[17px] font-bold text-slate-800 leading-tight">{improvement.title}</h3>
                                                        <p className="text-[14px] text-slate-500 leading-relaxed font-normal">{improvement.description}</p>
                                                    </div>

                                                    {improvement.action_items && improvement.action_items.length > 0 && (
                                                        <div className="flex flex-col gap-4 pt-2">
                                                            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">Key Actions:</p>
                                                            <div className="flex flex-col gap-3">
                                                                {improvement.action_items.map((action: string, i: number) => (
                                                                    <div key={i} className="flex items-start gap-3">
                                                                        <div className="size-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0 mt-0.5">
                                                                            <span className="material-symbols-outlined text-[12px]">check</span>
                                                                        </div>
                                                                        <span className="text-[13px] text-slate-600 leading-tight">{action}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Monetization Discovery Section */}
                                {scanData?.core_scan_data?.ai_recommendations?.monetization_methods && (
                                    <div id="ai-monetization-section" className="flex flex-col gap-10 animate-in fade-in slide-in-from-top-12 duration-700 pb-12">
                                        <div className="flex flex-col gap-2 px-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col gap-1">
                                                    <h2 className="text-black text-2xl font-semibold tracking-tight">Monetization Discovery</h2>
                                                    <p className="text-slate-500 text-[14px]">Explore top-tier revenue streams carefully mapped to your platform's potential.</p>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        setScanData((prev: any) => ({
                                                            ...prev,
                                                            core_scan_data: {
                                                                ...prev?.core_scan_data,
                                                                ai_recommendations: {
                                                                    ...prev?.core_scan_data?.ai_recommendations,
                                                                    monetization_methods: null
                                                                }
                                                            }
                                                        }));
                                                    }}
                                                    className="size-10 rounded-full bg-slate-100 text-slate-400 hover:bg-black hover:text-white transition-all flex items-center justify-center shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Ad Networks Table */}
                                            <div className="liquid-glass-card rounded-[32px] overflow-hidden border border-slate-200/50 shadow-xl bg-white/50 backdrop-blur-xl h-fit">
                                                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-100/50">
                                                            <span className="material-symbols-outlined text-[20px]">ads_click</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-[15px] font-semibold text-slate-800">Ad Networks</h3>
                                                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Display Advertising</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-0 overflow-x-auto">
                                                    <table className="w-full text-left">
                                                        <thead>
                                                            <tr className="bg-slate-50/30">
                                                                <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Platform</th>
                                                                <th className="px-4 py-4 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Requirement</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {scanData.core_scan_data.ai_recommendations.monetization_methods.adNetworks.map((platform: any, idx: number) => (
                                                                <tr key={idx} className="hover:bg-indigo-50/20 transition-colors group">
                                                                    <td className="px-8 py-5">
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[14px] font-semibold text-slate-800">{platform.name}</span>
                                                                                <a href={platform.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 transition-colors">
                                                                                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                                                                </a>
                                                                            </div>
                                                                            <span className="text-[11px] text-slate-400">{platform.category}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-5 pr-8">
                                                                        <span className="text-[12px] text-slate-500 leading-relaxed block">{platform.requirement}</span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Affiliate Programs Table */}
                                            <div className="liquid-glass-card rounded-[32px] overflow-hidden border border-slate-200/50 shadow-xl bg-white/50 backdrop-blur-xl h-fit">
                                                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm border border-amber-100/50">
                                                            <span className="material-symbols-outlined text-[20px]">sell</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-[15px] font-semibold text-slate-800">Affiliate Marketing</h3>
                                                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Commissions & Referral</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-0 overflow-x-auto">
                                                    <table className="w-full text-left">
                                                        <thead>
                                                            <tr className="bg-slate-50/30">
                                                                <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Program</th>
                                                                <th className="px-4 py-4 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Network Reach</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {scanData.core_scan_data.ai_recommendations.monetization_methods.affiliateMarketing.map((platform: any, idx: number) => (
                                                                <tr key={idx} className="hover:bg-amber-50/20 transition-colors group">
                                                                    <td className="px-8 py-5">
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[14px] font-semibold text-slate-800">{platform.name}</span>
                                                                                <a href={platform.url} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-800 transition-colors">
                                                                                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                                                                </a>
                                                                            </div>
                                                                            <span className="text-[11px] text-slate-400">{platform.category}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-5 pr-8">
                                                                        <span className="text-[12px] text-slate-500 leading-relaxed block">{platform.requirement}</span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Policy Section */}
                                <div className="flex flex-col gap-10">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                                        <div className="flex flex-col gap-2">
                                            <h2 className="text-black text-2xl font-semibold tracking-tight">Policy Pages & Drafts</h2>
                                            <p className="text-slate-500 text-[14px]">Manage and export your legal and organizational documents.</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <button 
                                                onClick={() => setIsSiteInfoModalOpen(true)}
                                                className="px-4 py-2 bg-white border border-slate-200 hover:border-black transition-all rounded-xl text-[12px] font-semibold text-slate-700 flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">settings_account_box</span>
                                                {siteInfo.email ? 'Edit Site Info' : 'Add Site Info'}
                                            </button>
                                            <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>
                                            <span className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 text-[11px] font-medium rounded-full flex items-center gap-2">
                                                <span className="size-1.5 rounded-full bg-emerald-500"></span> 
                                                {Object.keys(scanData?.trust_pages_data?.drafts || {}).filter(k => scanData?.trust_pages_data?.drafts?.[k]).length} Ready
                                            </span>
                                            <span className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 text-[11px] font-medium rounded-full flex items-center gap-2">
                                                <span className="size-1.5 rounded-full bg-amber-400"></span> 
                                                {Object.keys(scanData?.trust_pages_data?.drafts || {}).filter(k => !scanData?.trust_pages_data?.drafts?.[k]).length} Drafts
                                            </span>
                                        </div>
                                    </div>

                                    <div className="policy-list-card">
                                        <div className="divide-y divide-slate-100">
                                            {[
                                                { id: 'privacy', title: 'Privacy Policy', icon: 'gavel', subtitle: 'Instant Professional Template' },
                                                { id: 'terms', title: 'Terms & Conditions', icon: 'list_alt', subtitle: 'Instant Professional Template' },
                                                { id: 'disclaimer', title: 'Disclaimer', icon: 'warning_amber', subtitle: 'Instant Professional Template' },
                                                { id: 'about', title: 'About Us', icon: 'info', subtitle: 'Instant Professional Template' },
                                                { id: 'contact', title: 'Contact Us', icon: 'mail', subtitle: 'Instant Professional Template' }
                                            ].map((item) => {
                                                const backendDraft = scanData?.trust_pages_data?.drafts?.[item.id];
                                                
                                                // Always use local templates for these 5 types to ensure instant & consistent design
                                                const localTemplate = getFormattedPolicy(item.id, {
                                                    domain: scanData?.sites?.domain || analysisUrl,
                                                    email: siteInfo.email || '[Your Email]',
                                                    phone: siteInfo.phone || '[Your Phone]',
                                                    address: siteInfo.address || '[Your Address]',
                                                    topic: siteInfo.topic || '[Your Topic]',
                                                    tags: siteInfo.tags || '[Your Tags]'
                                                });

                                                const finalDraft = localTemplate || backendDraft;
                                                
                                                return (
                                                    <div key={item.id} className="flex items-center justify-between px-10 py-8 hover:bg-slate-50/50 transition-colors group">
                                                        <div className="flex items-center gap-6">
                                                            <div className="size-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-black transition-colors">
                                                                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-black font-medium text-[15px]">{item.title}</p>
                                                                <p className="text-slate-400 text-[12px] mt-0.5">{item.subtitle}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => {
                                                                    if (!siteInfo.email && !backendDraft) {
                                                                        setPendingDraftType(item.id);
                                                                        setIsSiteInfoModalOpen(true);
                                                                        return;
                                                                    }
                                                                    navigator.clipboard.writeText(finalDraft);
                                                                    setToast({ message: `${item.title} HTML Copied!`, type: 'success' });
                                                                }}
                                                                className="px-4 py-1.5 bg-black text-white hover:bg-slate-800 transition-all rounded-lg text-[12px] font-medium flex items-center gap-2 shadow-sm"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                                                Copy HTML
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    setPendingDraftType(item.id);
                                                                    setIsSiteInfoModalOpen(true);
                                                                }}
                                                                className="size-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-black hover:border-black transition-all"
                                                                title="Edit variables"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                                            </button>
                                                        </div>
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
            <IssueModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                issueId={selectedIssue?.id} 
                platform={selectedPlatform} 
            />

            {/* Site Info Modal */}
            {isSiteInfoModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSiteInfoModalOpen(false)}></div>
                    <div className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-black text-white flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-outlined">description</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Generate Perfect Policy</h3>
                                    <p className="text-[12px] text-slate-500 font-medium">Provide your details for AdSense-friendly documents.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsSiteInfoModalOpen(false)}
                                className="size-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                            >
                                <span className="material-symbols-outlined text-slate-400">close</span>
                            </button>
                        </div>
                        
                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400">mail</span>
                                        <input 
                                            type="email"
                                            value={siteInfo.email}
                                            onChange={(e) => setSiteInfo(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="support@domain.com"
                                            className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:border-black outline-none transition-all text-slate-700 bg-slate-50/50"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400">call</span>
                                        <input 
                                            type="text"
                                            value={siteInfo.phone}
                                            onChange={(e) => setSiteInfo(prev => ({ ...prev, phone: e.target.value }))}
                                            placeholder="+1 234 567 890"
                                            className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:border-black outline-none transition-all text-slate-700 bg-slate-50/50"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2 flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Physical Address</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400">location_on</span>
                                        <input 
                                            type="text"
                                            value={siteInfo.address}
                                            onChange={(e) => setSiteInfo(prev => ({ ...prev, address: e.target.value }))}
                                            placeholder="123 Street, City, Country"
                                            className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:border-black outline-none transition-all text-slate-700 bg-slate-50/50"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Site Topic / Niche</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400">category</span>
                                        <input 
                                            type="text"
                                            value={siteInfo.topic}
                                            onChange={(e) => setSiteInfo(prev => ({ ...prev, topic: e.target.value }))}
                                            placeholder="Tech, Gaming, Health..."
                                            className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:border-black outline-none transition-all text-slate-700 bg-slate-50/50"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Keywords / Tags</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400">tag</span>
                                        <input 
                                            type="text"
                                            value={siteInfo.tags}
                                            onChange={(e) => setSiteInfo(prev => ({ ...prev, tags: e.target.value }))}
                                            placeholder="SEO, AdSense, Blogging..."
                                            className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:border-black outline-none transition-all text-slate-700 bg-slate-50/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                            <button 
                                onClick={() => setIsSiteInfoModalOpen(false)}
                                className="px-6 py-3 rounded-2xl text-slate-500 font-semibold hover:bg-slate-100 transition-colors text-[14px]"
                            >
                                Wait, I'll do later
                            </button>
                            <button 
                                onClick={() => {
                                    if (pendingDraftType) {
                                        handleRegenerateDraft(pendingDraftType);
                                        setPendingDraftType(null);
                                    }
                                    setIsSiteInfoModalOpen(false);
                                }}
                                className="px-8 py-3 bg-black text-white rounded-2xl font-bold shadow-xl hover:shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-[14px] flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">magic_button</span>
                                {pendingDraftType ? 'Generate with Info' : 'Save Details'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Minimal & Professional Toast Notification */}
            {toast && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[300] animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-none">
                    <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white border border-slate-200 shadow-[0_15px_50px_rgba(0,0,0,0.08)] min-w-[320px]">
                        <div className={`
                            size-9 rounded-xl flex items-center justify-center shadow-sm
                            ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}
                        `}>
                            <span className="material-symbols-outlined text-[20px] font-bold">
                                {toast.type === 'success' ? 'check' : 'priority_high'}
                            </span>
                        </div>
                        <div className="flex-1">
                            <p className="text-[14px] font-bold text-slate-900 tracking-tight leading-tight">{toast.message}</p>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Action completed successfully</p>
                        </div>
                    </div>
                </div>
            )}
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
