// @ts-nocheck
// This file is executed by Deno on Supabase Edge Functions, not Next.js.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { url, site_id, scan_id } = await req.json()

        // Initialize Supabase Client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Basic URL Validation & Normalization
        let targetUrl = url;
        if (!targetUrl.startsWith('http')) {
            targetUrl = `https://${targetUrl}`;
        }

        // Update status to 'running'
        await supabaseClient
            .from('adsense_scans')
            .update({ status: 'running' })
            .eq('id', scan_id)

        const coreScanData: any = {};
        const trustPagesData: any = {};
        const seoData: any = {};
        const securityData: any = {};

        // --- Start Scanning ---

        // 1. SSL/HTTPS Check
        try {
            const response = await fetch(targetUrl);
            coreScanData.ssl_check = {
                status: response.url.startsWith('https') ? 'passed' : 'failed',
                protocol: response.url.startsWith('https') ? 'HTTPS' : 'HTTP',
                url_reached: response.url
            };

            const html = await response.text();
            const $ = cheerio.load(html);
            const domain = new URL(response.url).origin;

            // 2. robots.txt & sitemap.xml discovery
            try {
                const robotsRes = await fetch(`${domain}/robots.txt`);
                const robotsText = robotsRes.status === 200 ? await robotsRes.text() : "";
                coreScanData.robots_txt = {
                    exists: robotsRes.status === 200,
                    url: `${domain}/robots.txt`,
                    has_disallow: robotsText.includes('Disallow: /')
                };
            } catch {
                coreScanData.robots_txt = { exists: false };
            }

            try {
                const sitemapRes = await fetch(`${domain}/sitemap.xml`);
                coreScanData.sitemap_xml = {
                    exists: sitemapRes.status === 200,
                    url: `${domain}/sitemap.xml`
                };
            } catch {
                coreScanData.sitemap_xml = { exists: false };
            }

            // 3. Cheerio HTML Parsing (SEO & Trust Pages)
            seoData.title = $('title').text() || null;
            seoData.meta_description = $('meta[name="description"]').attr('content') || null;
            seoData.canonical = $('link[rel="canonical"]').attr('href') || null;
            seoData.og_title = $('meta[property="og:title"]').attr('content') || null;

            // Trust Pages Detection
            const trustKeywords = ['privacy', 'about', 'contact', 'terms', 'disclaimer'];
            const detectedPages: any = {};
            const internalLinks: Set<string> = new Set();

            $('a').each((_: any, el: any) => {
                const href = $(el).attr('href');
                const text = $(el).text().toLowerCase();
                if (href) {
                    try {
                        const linkUrl = new URL(href, domain);
                        if (linkUrl.origin === domain) {
                            internalLinks.add(linkUrl.href);

                            // Check if it's a trust page
                            const lowerHref = linkUrl.pathname.toLowerCase();
                            for (const kw of trustKeywords) {
                                if (lowerHref.includes(kw) || text.includes(kw)) {
                                    detectedPages[kw] = { exists: true, url: linkUrl.href };
                                }
                            }
                        }
                    } catch (e) {
                        // invalid url
                    }
                }
            });

            trustPagesData.pages = detectedPages;
            trustPagesData.summary = {
                privacy: !!detectedPages.privacy,
                about: !!detectedPages.about,
                contact: !!detectedPages.contact,
                terms: !!detectedPages.terms,
                disclaimer: !!detectedPages.disclaimer
            };

            // Broken Links Check (Sample up to 5 internal links to prevent timeout)
            const linksToCheck = Array.from(internalLinks).slice(0, 5);
            let brokenLinksFound = 0;
            for (const link of linksToCheck) {
                try {
                    const lRes = await fetch(link, { method: 'HEAD' });
                    if (lRes.status >= 400) brokenLinksFound++;
                } catch {
                    brokenLinksFound++;
                }
            }
            coreScanData.broken_links = {
                checked: linksToCheck.length,
                broken: brokenLinksFound,
                status: brokenLinksFound > 0 ? 'failed' : 'passed'
            };

            // Security Headers (Basic)
            const headers = response.headers;
            securityData.headers = {
                csp: headers.has('content-security-policy'),
                sts: headers.has('strict-transport-security'),
                frame_options: headers.has('x-frame-options'),
                content_type_options: headers.has('x-content-type-options')
            };

        } catch (err: any) {
            console.error("Fetch error:", err);
            // Fallback or partial data
        }

        // --- AI / Advanced Logic Placeholder ---
        // In a real implementation, we would call Gemini here for content analysis
        // and PageSpeed for performance.

        // Calculate a mock readiness score for now
        let score = 50;
        if (coreScanData.ssl_check?.status === 'passed') score += 10;
        if (trustPagesData.summary?.privacy) score += 10;
        if (trustPagesData.summary?.about) score += 5;
        if (trustPagesData.summary?.contact) score += 5;
        if (seoData.title && seoData.meta_description) score += 10;
        if (coreScanData.sitemap_xml?.exists) score += 10;
        if (coreScanData.broken_links?.broken === 0) score += 5;

        // Finalize Scan
        await supabaseClient
            .from('adsense_scans')
            .update({
                status: 'completed',
                overall_score: score > 99 ? 99 : score,
                approval_probability: Math.min(score, 99),
                core_scan_data: coreScanData,
                trust_pages_data: trustPagesData,
                seo_indexing_data: seoData,
                security_data: securityData,
                completed_at: new Date().toISOString()
            })
            .eq('id', scan_id)

        return new Response(JSON.stringify({ success: true, score }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
