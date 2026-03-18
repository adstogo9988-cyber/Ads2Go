export interface AdSenseCheck {
  id: string;
  title: string;
  condition: string;
  problem: string;
  location: string;
  fixGuide: {
    steps: string[];
    detailed: string;
    code?: string;
  };
  severity: 'Critical' | 'Warning' | 'Info';
  platformSpecific?: {
    wordpress?: string;
    shopify?: string;
    nextjs?: string;
    custom?: string;
  };
  vibeCodingPrompt?: string;
}

export const adsenseChecks: Record<string, AdSenseCheck> = {
  robots_txt: {
    id: "robots_txt",
    title: "Robots.txt Missing or Blocked",
    condition: "If robots.txt is not found or User-agent: * Disallow: / is present",
    problem: "A missing or misconfigured robots.txt file prevents Google from indexing your site content.\nWithout proper indexing, your site will not be eligible for AdSense approval.",
    location: "Website root directory (e.g., example.com/robots.txt)",
    fixGuide: {
       steps: [
        "Check your root directory for a 'robots.txt' file.",
        "If it is missing, create a new text file named 'robots.txt'.",
        "Add the standard allow-all code provided below and upload it."
      ],
      detailed: "The robots.txt file tells search engine crawlers which pages or files the crawler can or can't request from your site. For AdSense, it is vital that your primary content is accessible to Googlebot. Avoid using 'Disallow: /' as it blocks everything.",
      code: "User-agent: *\nAllow: /\nSitemap: https://yourdomain.com/sitemap.xml"
    },
    severity: "Critical",
    platformSpecific: {
      wordpress: "Go to Dashboard > Settings > Reading and ensure 'Discourage search engines' is unchecked. SEO plugins like Yoast or RankMath can also manage this.",
      shopify: "Shopify generates this automatically. To customize, edit the 'robots.txt.liquid' file in the 'Layout' folder.",
      nextjs: "Add a static 'robots.txt' file in the 'public' folder or use the 'next-sitemap' package for dynamic generation."
    },
    vibeCodingPrompt: "Create a standard robots.txt file in my public/root folder that allows all search engines and points to my sitemap. Ensure no critical paths are blocked."
  },
  ssl_certificate: {
    id: "ssl_certificate",
    title: "SSL Certificate (HTTPS) Missing",
    condition: "If site is running on HTTP instead of HTTPS",
    problem: "AdSense prioritizes secure websites and often rejects sites without a valid SSL certificate.\nInsecure sites reduce user trust and can cause issues with ad serving.",
    location: "Browser URL bar and Hosting/Server settings",
    fixGuide: {
      steps: [
        "Access your hosting dashboard (e.g., cPanel, Cloudflare, or Vercel).",
        "Enable a free SSL certificate (like Let's Encrypt).",
        "Configure your server to force-redirect all HTTP traffic to HTTPS."
      ],
      detailed: "SSL (Secure Sockets Layer) encrypts the data between your website and its visitors. Google favors HTTPS for ranking and AdSense approval. Use tools like Cloudflare's 'Always Use HTTPS' for an easy fix.",
    },
    severity: "Critical",
    platformSpecific: {
      wordpress: "Install the 'Really Simple SSL' plugin to automatically handle the migration of all links to HTTPS.",
      custom: "Update your .htaccess file or server configuration to include HTTPS redirection rules."
    },
    vibeCodingPrompt: "Update my configuration to force HTTPS on all routes and ensure the SSL certificate is correctly detected."
  },
  thin_content: {
    id: "thin_content",
    title: "Thin Content / Low Value Inventory",
    condition: "If average word count per page is less than 300 words",
    problem: "AdSense requires 'Valuable Inventory'. Pages with very little text are flagged as low quality.\nThin content is one of the most common reasons for AdSense rejection.",
    location: "Main body text of blog posts and primary pages",
    fixGuide: {
      steps: [
        "Identify pages or posts with fewer than 300 words of unique content.",
        "Expand these pages with more detailed information, images, and explanations.",
        "Set 'noindex' for low-value pages like archives or empty categories."
      ],
      detailed: "Google looks for content that provides significant value to the reader. Articles should be comprehensive; we recommend at least 600+ words per page for a higher chance of approval. Avoid publishing 'coming soon' or empty pages.",
    },
    severity: "Warning",
    platformSpecific: {
      wordpress: "Use a word count tool in Gutenberg or SEO plugins like Yoast/RankMath to ensure posts meet the 300+ word requirement."
    },
    vibeCodingPrompt: "Scan my content components and alert me if the word count is below 300 on any route. Provide a way to add meta descriptions and more content blocks."
  },
  banned_keywords: {
    id: "banned_keywords",
    title: "Prohibited / Restricted Content Detected",
    condition: "If keywords like gambling, hacking, adult, or violence are detected",
    problem: "Google has a strict policy against prohibited topics. Featuring these can lead to a permanent ban.\nRestricted content makes your site 'non-advertiser friendly'.",
    location: "Article titles, categories, tags, and body content",
    fixGuide: {
      steps: [
        "Review the list of flagged keywords found by the scanner.",
        "Immediately remove or heavily moderate articles containing prohibited topics.",
        "Ensure your site niche aligns with Google's Publisher Policies."
      ],
      detailed: "Content related to drugs, weapons, hacking, or illegal acts is strictly forbidden. Even the word 'hack' used in a non-technical context can trigger policy violations. Ensure all content is professional and safe for all audiences.",
    },
    severity: "Critical",
    vibeCodingPrompt: "Search throughout my project for restricted keywords like 'hack', 'gambling', 'adult content' and flag the files for review."
  },
  ads_txt: {
    id: "ads_txt",
    title: "Ads.txt Missing or Invalid",
    condition: "Missing ads.txt or missing publisher ID",
    problem: "Without ads.txt, advertisers cannot verify that you are an authorized seller of the ad space.\nThis can lead to 'Earnings at Risk' warnings in your AdSense dashboard.",
    location: "Public root directory (e.g., example.com/ads.txt)",
    fixGuide: {
      steps: [
        "Copy your Publisher ID (pub-xxxxxxxxxxx) from your AdSense account.",
        "Create a file named 'ads.txt' in your website's root folder.",
        "Add the authorization line: 'google.com, pub-xxxxx, DIRECT, f08c47fec0942fa0'."
      ],
      detailed: "Authorized Digital Sellers (ads.txt) is a simple text file that improves transparency. Google highly recommends it to prevent domain spoofing and help you get the best ad revenue.",
      code: "google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0"
    },
    severity: "Warning",
    vibeCodingPrompt: "Generate an ads.txt file in the public folder with my publisher ID: pub-xxxxxxxxxxxxxx and the standard Google AdSense entry."
  },
  sitemap_xml: {
    id: "sitemap_xml",
    title: "Sitemap XML Health Check",
    condition: "Invalid format or empty sitemap",
    problem: "An invalid sitemap confuses search engines and slows down indexing.\nAdSense reviewers check if your site is fully indexed and navigable.",
    location: "sitemap.xml file",
    fixGuide: {
      steps: [
        "Ensure your sitemap is in a valid XML format.",
        "Check that all URLs in the sitemap return a 200 OK status.",
        "Submit your sitemap to Google Search Console to check for errors."
      ],
      detailed: "A healthy sitemap is a key technical SEO requirement.",
    },
    severity: "Warning",
    platformSpecific: {
      wordpress: "Install Yoast SEO or RankMath; they generate and update sitemaps automatically.",
      shopify: "Shopify automatically manages /sitemap.xml; no manual action is usually needed.",
      nextjs: "Use the 'next-sitemap' package to generate sitemaps on every build."
    },
    vibeCodingPrompt: "I need a sitemap.xml generator script for my Next.js project that includes all dynamic routes and updates on every build."
  },
  meta_tags_missing: {
    id: "meta_tags_missing",
    title: "Meta Description Missing",
    condition: "If <meta name='description'> is not found",
    problem: "Missing meta descriptions make your search results look unprofessional and incomplete.\nGoogle uses these tags to assess the relevance and professionalism of your website.",
    location: "The <head> section of every page",
    fixGuide: {
      steps: [
        "Check the <head> tags of your pages for a description meta tag.",
        "Write a unique, concise summary (150-160 characters) for each page.",
        "Include your primary keywords naturally within the description."
      ],
      detailed: "Meta descriptions act as a pitch for your page in search engines. AdSense reviewers looks for professional standards; having unique and descriptive meta tags for each page is a sign of high-quality maintenance.",
      code: "<meta name=\"description\" content=\"A brief, professional summary of your page content goes here.\">"
    },
    severity: "Info",
    vibeCodingPrompt: "Help me add a dynamic Meta Description component to all my pages that pulls data from my CMS or page props."
  },
  placeholder_content: {
    id: "placeholder_content",
    title: "Placeholder Content Found",
    condition: "If 'Lorem Ipsum' or 'Sample Post' detected",
    problem: "Dummy text like 'Lorem Ipsum' signals that your site is under construction or lacks original content.\nGoogle will reject your site as 'Incomplete' or 'Scraped Content' if placeholders are present.",
    location: "Homepage, About page, or Blog post content",
    fixGuide: {
      steps: [
        "Search your entire site for 'Lorem Ipsum', 'Test Post', or 'Coming Soon' text.",
        "Replace all placeholder instances with actual, informative, and original content.",
        "Delete default posts like 'Hello World' and default comments."
      ],
      detailed: "Your website must be 'Finished' before applying for AdSense. Any dummy text is a red flag to human reviewers. Ensure every page publically accessible has real value for users.",
    },
    severity: "Critical",
    vibeCodingPrompt: "Find all instances of 'Lorem Ipsum' or dummy text in my project files and list them so I can replace them."
  },
  adsense_snippet: {
    id: "adsense_snippet",
    title: "AdSense Code Missing or Misplaced",
    condition: "Snippet not found or found in <body>",
    problem: "If your verification code is missing or in the wrong place, Google cannot verify your site.\nThis stops the approval process and prevents ads from being served correctly.",
    location: "The <head> section of your website (between <head> and </head> tags)",
    fixGuide: {
      steps: [
        "Copy the 'Auto Ads' or 'Verification' code from your AdSense dashboard.",
        "Paste the code exactly in the <head> section of your site.",
        "Verify that no caching plugins are stripping or delaying the script execution."
      ],
      detailed: "Google strictly recommends placing the code in the <head> section for the best crawal access. If it's in the <body>, it may load too late for the verification bot to detect it.",
      code: "<script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-xxxxxxxxxxxxxxxx\" crossorigin=\"anonymous\"></script>"
    },
    severity: "Critical",
    platformSpecific: {
      wordpress: "Use a plugin like 'Insert Headers and Footers' or edit your theme's `header.php` file.",
      shopify: "Go to Online Store > Themes > Edit Code and paste it in the `<head>` tag of `theme.liquid`.",
      nextjs: "Use the `next/script` component in your root `layout.tsx` (App Router) or `_document.tsx` (Pages Router)."
    },
    vibeCodingPrompt: "Add the AdSense script tag to my root layout using the Next.js Script component with strategy='afterInteractive'."
  },
  site_language: {
    id: "site_language",
    title: "Unsupported AdSense Language",
    condition: "If site language is not in Google's supported list",
    problem: "AdSense only serves ads on websites written in supported languages.\nUsing an unsupported language will lead to an immediate rejection or 'No Content' error.",
    location: "HTML <lang> attribute and site content",
    fixGuide: {
      steps: [
        "Check Google's official AdSense 'Supported Languages' list.",
        "Ensure your primary content is written in a supported language (e.g., English, Urdu, Hindi).",
        "Set the correct `lang` attribute in your `<html>` tag."
      ],
      detailed: "If your website is in a local dialect or a language not supported by Google, AdSense bots won't be able to crawl your content effectively. Translation plugins can help, but the original content must be in a supported language.",
    },
    severity: "Critical",
    vibeCodingPrompt: "Update my HTML lang attribute and ensure my text content is correctly localized for AdSense supported languages."
  },
  canonical_tags: {
    id: "canonical_tags",
    title: "Canonical Tags Missing or Conflicting",
    condition: "If <link rel='canonical'> is missing or conflict detected",
    problem: "Without canonical tags, Google may index multiple versions of the same page (e.g., http vs https), leading to duplicate content penalties.\nAdSense values unique, well-structured inventory.",
    location: "The <head> section of every page",
    fixGuide: {
      steps: [
        "Add a `<link rel='canonical' href='...'>` tag to every page on your site.",
        "Ensure the URL in the tag exactly matches your preferred (primary) version.",
        "Remove any conflicting or multiple canonical tags from the same page."
      ],
      detailed: "A canonical tag tells search engines which version of a URL you want to appear in search results. This is crucial for sites with similar content on different paths or parameters.",
      code: "<link rel=\"canonical\" href=\"https://example.com/current-page-url\" />"
    },
    severity: "Warning",
    vibeCodingPrompt: "Add a dynamic canonical tag component that uses the current absolute URL for every route."
  },
  heading_structure: {
    id: "heading_structure",
    title: "Heading Hierarchy Issues (H1-H6)",
    condition: "Missing H1 or multiple H1s or skipped levels",
    problem: "Google uses headings to understand your content structure. Missing H1 or chaotic hierarchy signals poor content quality.\nAdSense reviewers look for professionally structured articles.",
    location: "HTML body content",
    fixGuide: {
      steps: [
        "Ensure every page has exactly one `<h1>` tag containing the main title.",
        "Use `<h2>` for main sections and `<h3>` for sub-sections in order.",
        "Never skip levels (e.g., don't go from <h1> directly to <h3>)."
      ],
      detailed: "Proper heading structure improves accessibility and SEO. It acts as a table of contents for the Googlebot crawler.",
    },
    severity: "Warning",
    platformSpecific: {
      wordpress: "Most themes handle H1 automatically for the Title. Ensure you use 'Heading 2' and 'Heading 3' inside the Gutenberg editor."
    },
    vibeCodingPrompt: "Review my page components and ensure there is only one H1 and that the header hierarchy is logical (H1 -> H2 -> H3)."
  },
  nav_depth: {
    id: "nav_depth",
    title: "Navigation Depth & Orphan Pages",
    condition: "If pages are more than 3 clicks away or have no internal links",
    problem: "If content is deep or unlinked (orphaned), Googlebot might never find it.\nAdSense requires that all 'Valuable Inventory' is easily discoverable.",
    location: "Site architecture and internal linking",
    fixGuide: {
      steps: [
        "Increase internal linking to buried pages from your homepage or sidebar.",
        "Ensure every page has at least one incoming link from a high-level category.",
        "Simplify your menu structure to ensure most content is within 3 clicks."
      ],
      detailed: "Internal linking passes 'link juice' and ensures crawlers can traverse your entire site efficiently.",
    },
    severity: "Warning",
    vibeCodingPrompt: "Analyze my routing and components to ensure every page is linked in the navigation or from a main content block."
  },
  broken_links: {
    id: "broken_links",
    title: "Broken Internal / External Links",
    condition: "If 404 links are detected",
    problem: "Broken links (404s) create a terrible user experience and waste 'crawl budget'.\nA high number of dead links is a sign of an abandoned or low-quality site.",
    location: "Throughout all site content and navigation",
    fixGuide: {
      steps: [
        "Review the list of broken URLs provided in the audit report.",
        "Update the link to point to a valid URL or remove it entirely.",
        "Set up 301 redirects if the dead link is a moved page."
      ],
      detailed: "Consistently check for broken links as your site grows. Google values sites that are actively maintained and bug-free.",
    },
    severity: "Critical",
    platformSpecific: {
      wordpress: "Install the 'Broken Link Checker' plugin or use 'RankMath's' built-in 404 monitor to identify and fix dead links automatically."
    },
    vibeCodingPrompt: "I need a script to scan all <a> tags in my project and verify if their target paths exist."
  },
  crawlability_status: {
    id: "crawlability_status",
    title: "Website Crawlability Status",
    condition: "Redirect chains, 5xx errors, or blockages",
    problem: "If Google can't crawl your site, they can't approve it for AdSense. Blockages or redirect loops stop the process instantly.\nThis is a fundamental indexing requirement.",
    location: "Server headers, .htaccess, and robots.txt",
    fixGuide: {
      steps: [
        "Fix any internal server errors (500) reported by the scanner.",
        "Minimize redirect chains (e.g., A -> B -> C should be direct A -> C).",
        "Check Search Console for 'Crawl Errors' or 'Blocked by robots.txt'."
      ],
      detailed: "Crawlability depends on server response time and proper configuration. Ensure your hosting is reliable and not blocking bots.",
    },
    severity: "Critical",
    platformSpecific: {
      wordpress: "Check your 'Sitemap' settings in SEO plugins and ensure 'Discourage search engines' is unticked in Dashboard > Settings > Reading."
    }
  },
  domain_authority: {
    id: "domain_authority",
    title: "Domain Authority & Backlink Profile",
    condition: "Low DA/DR score (estimated)",
    problem: "While not a direct AdSense rule, low authority indicates a new or untrusted site.\nGoogle prefers sites that have some 'weight' or social proof before showing ads.",
    location: "General Web Presence",
    fixGuide: {
      steps: [
        "Produce high-quality content that others naturally want to link to.",
        "Promote your articles on trusted social media and industry platforms.",
        "Participate in community discussions and guest posting (white-hat)."
      ],
      detailed: "Authority is built over months. Focus on 'E-E-A-T' (Experience, Expertise, Authoritativeness, and Trustworthiness) to improve your standing.",
    },
    severity: "Info",
  },
  schema_presence: {
    id: "schema_presence",
    title: "Schema Markup Presence",
    condition: "No structured data detected",
    problem: "Missing Schema means you lose 'Rich Results' (stars, prices, snippets) in Google.\nStructured data makes your site look elite and professionally managed.",
    location: "The <head> or footer section (JSON-LD)",
    fixGuide: {
      steps: [
        "Determine the best schema type for your content (e.g., Article, Product, Recipe).",
        "Generate JSON-LD markup and inject it into your website.",
        "Test using Google's Rich Results Testing Tool."
      ],
      detailed: "Schema.org provides a vocabulary to better describe your content to search engines.",
    },
    severity: "Warning",
    vibeCodingPrompt: "Add a base JSON-LD Schema component to my site that includes Website and Organization details."
  },
  json_ld: {
    id: "json_ld",
    title: "JSON-LD Structured Data Quality",
    condition: "Syntax errors or missing required fields",
    problem: "If your Schema has errors, Google will ignore it entirely, and it might even cause crawl confusion.\nValid JSON-LD is a benchmark of modern web development.",
    location: "Inline <script type=\"application/ld+json\"> tags",
    fixGuide: {
      steps: [
        "Identify the specific syntax error (e.g., missing comma, unclosed bracket).",
        "Valid syntax is critical; use a JSON validator to check your tags.",
        "Ensure required fields (like 'name', 'headline', 'image') aren't empty."
      ],
      detailed: "Always use JSON-LD over Microdata or RDFa, as it's Google's preferred format.",
    },
    severity: "Warning",
    vibeCodingPrompt: "Validate the JSON-LD blocks in my project for common syntax errors and missing required properties."
  },
  org_schema: {
    id: "org_schema",
    title: "Organization Schema Missing",
    condition: "Missing Organization or LocalBusiness type",
    problem: "Organization schema links your website to your brand identity, logo, and social profiles.\nThis increases the 'Trust' score of your domain.",
    location: "Homepage <head> section",
    fixGuide: {
      steps: [
        "Add 'Organization' type to your JSON-LD on the homepage.",
        "Include your brand name, official URL, logo URL, and contact points.",
        "Link your social media profiles using the 'sameAs' property."
      ],
      detailed: "This helps Google build a Knowledge Graph for your brand.",
    },
    severity: "Info",
    vibeCodingPrompt: "Create a JSON-LD 'Organization' schema for my homepage with my brand name, logo, and social links."
  },
  breadcrumb_schema: {
    id: "breadcrumb_schema",
    title: "BreadcrumbList Schema Missing",
    condition: "Missing BreadcrumbList type on interior pages",
    problem: "Breadcrumb schema helps Google show the hierarchical path in search results (e.g., Home > Tech > Reviews).\nThis improves click-through rates and site architecture clarity.",
    location: "Interior / Content pages",
    fixGuide: {
      steps: [
        "Implement 'BreadcrumbList' schema on all post and category pages.",
        "Ensure the 'position' and 'name' fields match your actual site navigation.",
        "Verify that the URLs in the schema are absolute and active."
      ],
      detailed: "Breadcrumbs help users and search engines navigate deeper levels of your website.",
    },
    severity: "Info",
    vibeCodingPrompt: "Generate a dynamic BreadcrumbList JSON-LD component based on the current URL path."
  },
  article_product_schema: {
    id: "article_product_schema",
    title: "Article / Product Schema Missing",
    condition: "Missing Article, BlogPosting, or Product type",
    problem: "Articles without schema are less likely to appear in 'Google News' or 'Top Stories'.\nProducts without schema won't show prices or availability in search results.",
    location: "Blog post and Product detail pages",
    fixGuide: {
      steps: [
        "Add 'Article' or 'BlogPosting' schema for blogs, or 'Product' for shop items.",
        "Include author, datePublished, and mainEntityOfPage for articles.",
        "Include price, currency, and availability for products."
      ],
      detailed: "This specific schema is the most important for content-heavy sites aiming for AdSense.",
    },
    severity: "Warning",
    platformSpecific: {
      wordpress: "Most modern themes do this automatically. If not, use 'Schema Pro' or 'Yoast SEO' logic.",
    },
    vibeCodingPrompt: "Create an 'Article' schema component for my blog post template that takes title, date, author, and description as props."
  },
  rich_results: {
    id: "rich_results",
    title: "Rich Results Eligibility",
    condition: "Low eligibility percentage across pages",
    problem: "If your site isn't eligible for Rich Results, you are losing valuable search real estate.\nAdSense revenue increases with higher quality, visual traffic.",
    location: "Overall site SEO performance",
    fixGuide: {
      steps: [
        "Use the Google Search Console 'Enhancements' report to find errors.",
        "Fix all 'Critical' errors in your structured data immediately.",
        "Add optional fields to your schema to reach 'Elite' eligibility status."
      ],
      detailed: "Rich results make your search entry stand out with images, stars, or FAQ sections.",
    },
    severity: "Info",
  },
  word_count: {
    id: "word_count",
    title: "Average Word Count per Page",
    condition: "Below 300 words average",
    problem: "AdSense does not approve 'Thin' websites. If your average is too low, the automated review will flag your site as low-quality.\nSubstance is key for ad placement.",
    location: "Blog posts and primary content pages",
    fixGuide: {
      steps: [
        "Expand short posts with more details, examples, and expert insights.",
        "Delete or 'noindex' empty or placeholder pages.",
        "Aim for a minimum of 600-1000 words for primary pillar content."
      ],
      detailed: "Content depth proves to Google that you are a genuine publisher, not a spam site.",
    },
    severity: "Warning",
    platformSpecific: {
      wordpress: "Yoast SEO and RankMath provide real-time keyword density analysis directly in the WordPress post editor sidebar."
    },
    vibeCodingPrompt: "Report all pages in my project that have less than 300 words of text content."
  },
  keyword_density: {
    id: "keyword_density",
    title: "Keyword Density & Stuffing",
    condition: "Top keyword density > 5%",
    problem: "Overusing a keyword (Keyword Stuffing) makes content unreadable and signals spam.\nGoogle may penalize your site's ranking and reject AdSense for 'Poor User Experience'.",
    location: "Article body text",
    fixGuide: {
      steps: [
        "Read your content aloud; if it feels repetitive, you are overusing keywords.",
        "Use synonyms and LSI (Latent Semantic Indexing) keywords instead of repeating one term.",
        "Aim for a primary keyword density of 1% to 2.5%."
      ],
      detailed: "Write naturally for the reader first, and search engines second.",
    },
    severity: "Warning",
    platformSpecific: {
      wordpress: "Use the Yoast SEO 'Keyword Density' check in the post editor to maintain a safe balance.",
    },
    vibeCodingPrompt: "Analyze the text frequency in my content and highlight any keywords that appear more than 4% of the time."
  },
  duplicate_content: {
    id: "duplicate_content",
    title: "Duplicate Content Detection",
    condition: "High similarity score detected across pages",
    problem: "AdSense strictly forbids 'Scraped' or 'Repetitive' content across your own site.\nUnique value is the #1 requirement for approval.",
    location: "Internal pages vs overall web",
    fixGuide: {
      steps: [
        "Rewrite duplicate sections to provide a fresh perspective.",
        "Use '301 Redirects' to merge two pages that cover the exact same topic.",
        "Use 'Canonical Tags' if you must have the same content on different URLs."
      ],
      detailed: "Every page should offer something unique that isn't available elsewhere on your site.",
    },
    severity: "Critical",
    platformSpecific: {
      wordpress: "Use 'Yoast SEO' or 'RankMath' to set Canonical Tags if you have similar content on different URLs to avoid duplicate penalties."
    },
    vibeCodingPrompt: "Compare my content blocks and notify me if any two routes have more than 60% identical text."
  },
  readability_score: {
    id: "readability_score",
    title: "Content Readability & Flow",
    condition: "Low readability grade (e.g., college-level for general niche)",
    problem: "If your content is too complex or poorly written, users will leave quickly (high bounce rate).\nGoogle prefers content that is accessible to the widest possible audience.",
    location: "Article body text",
    fixGuide: {
      steps: [
        "Use shorter sentences and simpler vocabulary where possible.",
        "Break up large walls of text with subheadings, bullet points, and images.",
        "Use tools like the Hemingway Editor to improve your grade level."
      ],
      detailed: "Most successful AdSense sites aim for an 8th-grade reading level.",
    },
    severity: "Info",
  },
  lcp_metric: {
    id: "lcp_metric",
    title: "Largest Contentful Paint (LCP)",
    condition: "LCP > 2.5 seconds",
    problem: "LCP measures loading performance. If your main content takes too long to show, users leave.\nSpeed is a direct Core Web Vital and an AdSense preference.",
    location: "Main hero images or large text blocks",
    fixGuide: {
      steps: [
        "Optimize and compress large images using WebP or AVIF formats.",
        "Prioritize the loading of 'above the fold' content.",
        "Eliminate render-blocking resources (unnecessary JS/CSS)."
      ],
      detailed: "LCP should happen in 2.5 seconds or less for a good user experience.",
    },
    severity: "Warning",
    platformSpecific: {
      wordpress: "Use plugins like 'WP Rocket' or 'Flying Press' to optimize LCP and prioritize images.",
    },
    vibeCodingPrompt: "Help me optimize my largest images and set 'priority' on the main hero image to improve LCP."
  },
  cls_metric: {
    id: "cls_metric",
    title: "Cumulative Layout Shift (CLS)",
    condition: "CLS > 0.1",
    problem: "CLS measures visual stability. If components 'jump' while loading, it frustrates users.\nGoogle penalizes sites with unstable layouts.",
    location: "Images, Ads, and IFrames without dimensions",
    fixGuide: {
      steps: [
        "Always include `width` and `height` attributes on images and videos.",
        "Reserve space for ad slots with CSS so content doesn't jump when ads load.",
        "Never insert content above existing content, except in response to a user action."
      ],
      detailed: "A CLS score of less than 0.1 is considered good.",
    },
    severity: "Warning",
    platformSpecific: {
      wordpress: "Ensure your theme has 'Image Dimensions' enabled. Use 'EWWW Image Optimizer' to auto-add missing sizes.",
    },
    vibeCodingPrompt: "I need to add fixed aspect-ratio boxes to all my image containers to prevent layout shifts during load."
  },
  inp_metric: {
    id: "inp_metric",
    title: "Interaction to Next Paint (INP)",
    condition: "INP > 200ms",
    problem: "INP measures responsiveness. If a user clicks a button and nothing happens for 400ms, the site feels 'laggy'.\nInteractivity is a vital metric for modern web standards.",
    location: "Interactive buttons, menus, and forms",
    fixGuide: {
      steps: [
        "Reduce long-running JavaScript tasks that block the main thread.",
        "Use 'Web Workers' for heavy computations.",
        "Optimize event handlers to run as lean as possible."
      ],
      detailed: "A score below 200ms shows that your site is fast and responsive.",
    },
    severity: "Warning",
    vibeCodingPrompt: "Profile my main thread and identify any JavaScript functions that are taking longer than 50ms to execute."
  },
  fcp_metric: {
    id: "fcp_metric",
    title: "First Contentful Paint (FCP)",
    condition: "FCP > 1.8 seconds",
    problem: "FCP is the time until the first bit of content is rendered. Slow FCP makes users think the site is broken.\nIt is the first impression of your site's speed.",
    location: "Initial server response and CSS loading",
    fixGuide: {
      steps: [
        "Minimize server response times (TTFB) by using a fast host or CDN.",
        "Inlining critical CSS can help render the page faster.",
        "Gzip or Brotli compress your text-based assets."
      ],
      detailed: "FCP should be under 1.8 seconds for the best performance.",
    },
    severity: "Warning",
    platformSpecific: {
      wordpress: "Enable 'Critical CSS' in your optimization plugin and use a high-performance host.",
    },
    vibeCodingPrompt: "Analyze my CSS bundle size and suggest ways to reduce it or use critical CSS inlining."
  },
  unused_javascript: {
    id: "unused_javascript",
    title: "Unused JavaScript & Render Blocking",
    condition: "Significant unused JS detected",
    problem: "Unused JS slows down the page rendering and increases TBT.\nGoogle penalizes sites with poor render performance.",
    location: "Page header and heavy script sources",
    fixGuide: {
      steps: [
        "Minify and compress your JS files.",
        "Defer non-critical scripts to load after the main content.",
        "Remove plugins or libraries that you are not actively using."
      ],
      detailed: "Every kilobyte of JS counts towards your performance score.",
    },
    severity: "Warning",
    platformSpecific: {
      wordpress: "Use the 'Asset CleanUp' or 'Perfmatters' plugin to disable scripts on pages where they aren't needed.",
    },
    vibeCodingPrompt: "Identify any imported libraries or NPM packages that aren't being used in my current routes."
  },
  privacy_policy: {
    id: "privacy_policy",
    title: "Privacy Policy Page Missing",
    condition: "Page not found at standard paths",
    problem: "AdSense **requires** a Privacy Policy page by law and policy. It must explain how you use data and cookies.\nWithout this, your application will be rejected 100% of the time.",
    location: "Footer of the website (must be linked on every page)",
    fixGuide: {
      steps: [
        "Create a new page titled 'Privacy Policy'.",
        "Use a generator to include standard AdSense and Cookie disclosure clauses.",
        "Add a clear, visible link to this page in your website's footer."
      ],
      detailed: "You must inform users that third-party vendors, including Google, use cookies to serve ads based on prior visits.",
    },
    severity: "Critical",
    platformSpecific: {
      wordpress: "Go to Settings > Privacy and use the built-in Privacy Policy generator tool.",
    },
    vibeCodingPrompt: "Generate a standard Privacy Policy page template in my 'pages' or 'app' folder and link it in the Footer."
  },
  terms_conditions: {
    id: "terms_conditions",
    title: "Terms & Conditions Page",
    condition: "Page not found",
    problem: "While not as strict as Privacy Policy, having 'Terms' increases your site's professional credibility.\nIt defines the rules for using your website.",
    location: "Website footer",
    fixGuide: {
      steps: [
        "Create a 'Terms of Service' or 'Terms & Conditions' page.",
        "Outline user responsibilities, intellectual property, and limitations of liability.",
        "Ensure the link is accessible from all pages."
      ],
      detailed: "Terms and conditions protect both you and your users.",
    },
    severity: "Warning",
    platformSpecific: {
      wordpress: "Use a plugin like 'WP Legal Pages' or 'Auto Terms of Service' to quickly generate a standard, compliant Terms page."
    },
    vibeCodingPrompt: "Create a Terms and Conditions page with sections for User Agreement and Intellectual Property."
  },
  cookie_consent: {
    id: "cookie_consent",
    title: "Cookie Consent / GDPR Banner",
    condition: "No consent mechanism detected",
    problem: "In many regions (EU/California), you must legally ask for permission to use cookies for advertising.\nAdSense may restrict ads in these regions if a consent banner is missing.",
    location: "Appears on initial entry / Homepage",
    fixGuide: {
      steps: [
        "Implement a 'Cookie Consent' banner or popup.",
        "Integrate with 'Google Consent Mode' to properly communicate choices to AdSense.",
        "Provide a button for users to accept or decline non-essential cookies."
      ],
      detailed: "The Transparency and Consent Framework (TCF) is the standard for AdSense in Europe.",
    },
    severity: "Warning",
    platformSpecific: {
      wordpress: "Install the 'CookieYes' or 'Complianz' plugin to handle all GDPR/CCPA requirements.",
    },
    vibeCodingPrompt: "Add a simple Cookie Consent banner component that saves user preference and stays hidden after acceptance."
  },
  ad_placement: {
    id: "ad_placement",
    title: "Ad Placement Readiness",
    condition: "Lack of clear whitespace or reserved slots",
    problem: "Cluttered layouts make ads look like 'spam'. Google requires clear boundaries between content and ads.\nBad placement can lead to accidental clicks and account suspension.",
    location: "Sidebar, between paragraphs, and header",
    fixGuide: {
      steps: [
        "Ensure there is adequate whitespace (padding/margin) where ads will be placed.",
        "Avoid placing ads near images or navigation buttons where accidental clicks occur.",
        "Review Google's 'Ad Placement Policies' for prohibited layouts."
      ],
      detailed: "A clean, spacious design is historically better for AdSense approval.",
    },
    severity: "Warning",
    platformSpecific: {
      wordpress: "Use the 'Ad Inserter' plugin to safely manage your ad slots and preview their impact on your layout before going live."
    },
    vibeCodingPrompt: "Create placeholder <div> slots for ads in my layout with specific ID and clear margin styling."
  },
  iframe_security: {
    id: "iframe_security",
    title: "Iframe & Frame Security",
    condition: "Unsafe use of iframes or missing sandboxing",
    problem: "Malicious iframes can steal user data or cause 'Clickjacking'.\nGoogle's safety bots will flag your site as a security risk if iframes are unmanaged.",
    location: "Embedded videos, widgets, and maps",
    fixGuide: {
      steps: [
        "Only embed iframes from trusted sources (Google, YouTube, Vimeo).",
        "Add the `sandbox` attribute to your iframes for added security.",
        "Ensure all iframes use HTTPS URLs."
      ],
      detailed: "Security is a top priority for AdSense to protect their advertisers' reputation.",
      code: "<iframe src=\"...\" sandbox=\"allow-scripts allow-same-origin\" />"
    },
    severity: "Warning",
    vibeCodingPrompt: "Audit all <iframe> tags in my project and add the 'sandbox' attribute where it's missing."
  },
  mixed_content: {
    id: "mixed_content",
    title: "Mixed Content Issues",
    condition: "HTTP resources on HTTPS site",
    problem: "Mixed content (HTTP links on an HTTPS site) compromises user security and causes browser warnings.\nAdSense may block ads on pages with insecure content.",
    location: "Image sources, scripts, and stylesheets",
    fixGuide: {
      steps: [
        "Identify all URLs starting with 'http://' in your code.",
        "Change them to 'https://' or use relative protocol '//'.",
        "Use 'Content-Security-Policy: upgrade-insecure-requests' header."
      ],
      detailed: "Secure all resources to maintain the HTTPS padlock and AdSense eligibility.",
    },
    severity: "Critical",
    platformSpecific: {
      wordpress: "Use 'Really Simple SSL' or 'Better Search Replace' to update all database links to HTTPS.",
    },
    vibeCodingPrompt: "Find all 'http://' strings in my local files and replace them with 'https://' where appropriate."
  },
  security_headers: {
    id: "security_headers",
    title: "Missing Security Headers",
    condition: "Missing CSP, HSTS, or X-Frame-Options",
    problem: "Missing security headers expose your site to XSS and Clickjacking attacks.\nGoogle values technical safety as a key metric for trustworthy publishers.",
    location: "Server response headers",
    fixGuide: {
      steps: [
        "Configure your server (Apache/Nginx) to send security headers.",
        "Implement 'Content-Security-Policy' to restrict script sources.",
        "Enable 'Strict-Transport-Security' (HSTS) for long-term safety."
      ],
      detailed: "Headers like X-Frame-Options and X-Content-Type-Options are industry standards.",
    },
    severity: "Warning",
    platformSpecific: {
      wordpress: "Use the 'HTTP Security Headers' plugin to easily manage these settings without editing server files.",
    },
  },
  malware_phishing: {
    id: "malware_phishing",
    title: "Malware or Phishing Flags",
    condition: "Flagged by security scanners",
    problem: "Being flagged for malware is an immediate disqualification for AdSense.\nIt puts visitors at risk and ruins your domain reputation.",
    location: "Server files and database",
    fixGuide: {
      steps: [
        "Use a security scanner (like Wordfence or Sucuri) to find malicious code.",
        "Clean all infected files and update your CMS and plugins.",
        "Request a review from Google Safe Browsing after cleaning."
      ],
      detailed: "Prevention is better than cure. Keep everything updated and use strong passwords.",
    },
    severity: "Critical",
    platformSpecific: {
      wordpress: "Install 'Wordfence Security' and run a deep scan for backdoors and malware.",
    },
  },
  google_safe_browsing: {
    id: "google_safe_browsing",
    title: "Google Safe Browsing Check",
    condition: "Flagged as unsafe by Google",
    problem: "If Google's own safety bot flags your site, no ads will ever show.\nThis also leads to a 'Red Screen' warning for browser users.",
    location: "Google Search Console Security report",
    fixGuide: {
      steps: [
        "Check 'Security Issues' in Google Search Console.",
        "Identify the specific pages or resources Google has flagged.",
        "Fix the issue (remove malware or deceptive content) and request a review."
      ],
      detailed: "Google Safe Browsing monitors billions of URLs for safety threats.",
    },
    severity: "Critical",
  },
  whois_visibility: {
    id: "whois_visibility",
    title: "WHOIS Information & Transparency",
    condition: "Aggressive WHOIS privacy or invalid data",
    problem: "Anonymous registrations can sometimes be seen as a low-trust signal for commercial sites.\nTransparency increases your credibility with human reviewers.",
    location: "Domain Registrar records",
    fixGuide: {
      steps: [
        "Ensure your domain contact details are accurate and up-to-date.",
        "Consider disabling 'Private WHOIS' if you are a registered business.",
        "Link your domain data to your About Us and Contact pages."
      ],
      detailed: "WHOIS data transparency is a small but helpful trust signal.",
    },
    severity: "Info",
  },
  brand_signals: {
    id: "brand_signals",
    title: "Brand Authority & Email Validity",
    condition: "Missing professional email or MX records",
    problem: "Using a generic @gmail.com address or having no valid MX records looks unprofessional.\nAdSense prefers established 'Brands' over temporary niche sites.",
    location: "Contact page and DNS settings",
    fixGuide: {
      steps: [
        "Set up a professional email address (e.g., info@yourdomain.com).",
        "Verify your MX records are correctly configured in your DNS.",
        "Clearly display your contact email in the footer or contact page."
      ],
      detailed: "A business email domain increases your professionalism score.",
    },
    severity: "Info",
    platformSpecific: {
      wordpress: "Ensure your 'From' email in WordPress settings matches your domain for better trust.",
    },
  },
  content_originality: {
    id: "content_originality",
    title: "AI & Content Originality",
    condition: "High AI-generated risk score",
    problem: "Unedited AI content is often repetitive and lacks 'E-E-A-T'.\nGoogle's March 2024 update specifically targets low-quality AI spam.",
    location: "All published articles",
    fixGuide: {
      steps: [
        "If using AI, use it only as an outline or research tool.",
        "Aggressively edit AI output to include personal opinions, case studies, and unique data.",
        "Ensure the final article sounds human and provides new value."
      ],
      detailed: "AdSense does not ban AI content, but it does ban 'Low Value Content'.",
    },
    severity: "Warning",
    vibeCodingPrompt: "Analyze the tone of my articles and suggest where I can add personal expertise or human-like phrasing."
  },
  keyword_cannibalization: {
    id: "keyword_cannibalization",
    title: "Keyword Cannibalization",
    condition: "Multiple pages targeting the same keyword",
    problem: "When two pages compete for the same keyword, Google gets confused, and your ranking drops.\nThis signals a poor internal structure and redundant content.",
    location: "Site-wide SEO titles and slugs",
    fixGuide: {
      steps: [
        "Identify pages with overlapping keywords and intents.",
        "Merge the content into a single, high-quality 'Pillar' page.",
        "Use 301 redirects to point the old URLs to the new master page."
      ],
      detailed: "One master page per topic is always better for SEO and AdSense.",
    },
    severity: "Warning",
    vibeCodingPrompt: "Identify any duplicate <title> tags or ultra-similar URL slugs in my project."
  },
  security_leaks: {
    id: "security_leaks",
    title: "Sensitive Technical Exposure",
    condition: "Exposed .env, .git or backup files",
    problem: "Exposing .env or config files is a massive security risk.\nGoogle's technical reviews will flag your site as dangerous if leaks are found.",
    location: "Website root directory",
    fixGuide: {
      steps: [
        "Immediately restrict access to '.env', '.git', and '.bak' files using .htaccess.",
        "Ensure your web server (Nginx/Apache) isn't serving dot-files.",
        "Verify that your deployment script excludes sensitive dev files."
      ],
      detailed: "Never leave technical secrets accessible to the public.",
      code: "RedirectMatch 404 /\\.(git|env|bak|config)$"
    },
    severity: "Critical",
    vibeCodingPrompt: "Check if my .env or .git folders are accessible via a public URL and help me block them."
  },
  page_load_time: {
    id: "page_load_time",
    title: "Overall Page Speed & Load Time",
    condition: "Total load time > 3 seconds",
    problem: "Slow sites lose 50%+ of their visitors before the page even loads.\nAdSense revenue is directly proportional to how long users stay on your site.",
    location: "Network request and rendering pipeline",
    fixGuide: {
      steps: [
        "Use a global CDN (like Cloudflare) to serve assets faster.",
        "Minify all CSS, JS, and HTML files.",
        "Reduce the number of total requests per page."
      ],
      detailed: "A fast site is a happy site. Aim for under 2 seconds total load time.",
    },
    severity: "Warning",
    platformSpecific: {
      wordpress: "Use 'WP Rocket' or 'Autoptimize' for quick speed gains without touching code.",
    },
  },
  caching_headers: {
    id: "caching_headers",
    title: "Browser Caching Configuration",
    condition: "Missing Cache-Control or Expires headers",
    problem: "Without caching, repeat visitors have to download your entire site again.\nThis slows down their experience and increases your server load.",
    location: "Server response headers",
    fixGuide: {
      steps: [
        "Set 'Cache-Control' headers for all static assets (images, fonts, css).",
        "Use a long duration (e.g., 1 year) for files that rarely change.",
        "Configure your CDN to handle edge caching."
      ],
      detailed: "Effective caching makes your site feel instantaneous to repeat users.",
    },
    severity: "Info",
  },
  lazy_loading: {
    id: "lazy_loading",
    title: "Image & Media Lazy Loading",
    condition: "Missing loading='lazy' on below-fold images",
    problem: "Loading all images at once slows down the initial page render.\nLazy loading is a standard performance optimization recommended by Google.",
    location: "HTML <img> and <iframe> tags",
    fixGuide: {
      steps: [
        "Add the `loading=\"lazy\"` attribute to all images that aren't in the initial view.",
        "Use lazy-loading for video embeds and iframes as well.",
        "Ensure 'above the fold' images load instantly (don't lazy load the header logo)."
      ],
      detailed: "Lazy loading saves bandwidth and improves your performance score.",
      code: "<img src=\"image.jpg\" loading=\"lazy\" alt=\"...\" />"
    },
    severity: "Info",
  },
  ttfb: {
    id: "ttfb",
    title: "Time to First Byte (TTFB)",
    condition: "TTFB > 0.6 seconds",
    problem: "High TTFB means your server is slow to respond. This is often due to poor hosting or unoptimized code.\nIt is the foundation of all other speed metrics.",
    location: "Server-side processing and Database",
    fixGuide: {
      steps: [
        "Upgrade to a better hosting plan or use a faster server region.",
        "Optimize your database queries to run faster.",
        "Enable server-side caching (e.g., Redis or Object Cache)."
      ],
      detailed: "Aim for a TTFB of less than 200ms.",
    },
    severity: "Warning",
  },
  prohibited_content: {
    id: "prohibited_content",
    title: "AdSense Prohibited Content",
    condition: "Adult, gambling, or illegal drug references",
    problem: "Hosting prohibited content is the fastest way to get a permanent AdSense ban.\nGoogle has zero tolerance for non-family-friendly inventory.",
    location: "Article text, comments, and media",
    fixGuide: {
      steps: [
        "Review Google's 'Publisher Policies' carefully.",
        "Delete any content that falls into prohibited categories.",
        "Use automated filters for user-generated comments to prevent policy slips."
      ],
      detailed: "Safety is paramount for Google's advertisers.",
    },
    severity: "Critical",
  },
  copyright_risk: {
    id: "copyright_risk",
    title: "Copyright & DMCA Risk",
    condition: "Unauthorized downloads or copyrighted media",
    problem: "AdSense does not allow serving ads on sites with copyrighted content (warez, movie downloads).\nThis causes immediate account suspension.",
    location: "Download links and embedded media",
    fixGuide: {
      steps: [
        "Remove all unauthorized copyrighted material or links to it.",
        "Only use images that you own or have a license for.",
        "Add a DMCA contact page for copyright inquiries."
      ],
      detailed: "Intellectual property theft is a critical policy violation.",
    },
    severity: "Critical",
  },
  clickbait_detection: {
    id: "clickbait_detection",
    title: "Misleading Titles & Clickbait",
    condition: "High sensation/deception ratio",
    problem: "Misleading titles (Clickbait) frustrate users and are discouraged by Google News and AdSense.\nIt signals a low-quality publication.",
    location: "Post titles and Social share text",
    fixGuide: {
      steps: [
        "Ensure your titles accurately reflect the content of the article.",
        "Avoid using 'Shocking' or 'You won't believe' style tropes.",
        "Focus on informative, helpful titles that answer a user's intent."
      ],
      detailed: "Honesty in titles builds long-term reader trust.",
    },
    severity: "Warning",
  },
  thin_content_pages: {
    id: "thin_content_pages",
    title: "Thin Content Pages (Low Word Count)",
    condition: "Pages with < 100 words",
    problem: "Pages with very little text are termed 'low value content' by AdSense.\nGoogle expects substantial unique text per page to serve ads.",
    location: "Empty categories, short posts, and thin pages",
    fixGuide: {
      steps: [
        "Expand these pages to at least 400-600 words.",
        "Consolidate multiple thin pages into one comprehensive 'Guide'.",
        "Set 'noindex' for pages that don't need to be in search results."
      ],
      detailed: "Low value inventory is a top reason for rejection.",
    },
    severity: "Warning",
    platformSpecific: {
      wordpress: "Use 'Yoast SEO' content checks to ensure each post meets minimum length requirements.",
    },
  },
};


