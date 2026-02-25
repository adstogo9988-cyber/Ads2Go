# Ad2Go - External APIs & Requirements

In order to implement the complete 10-module Ad2Go feature scope, we will need access to several external APIs and services. Please review this list and provide the necessary credentials/keys in the `.env.local` file (or provide them to me) when you are ready.

## 1. Google APIs
*   **Google PageSpeed Insights API Key**: Required for Module 2 (Performance & Core Web Vitals) to generate Lighthouse audits and mobile responsiveness scores.
*   **Google Safe Browsing API Key**: Required for Module 6 (Security & Safety Checks) to check for malware and phishing signals.
*   **Google OAuth 2.0 Credentials (Client ID & Client Secret)**: Required for Module 9 (Integrations) to allow users to connect their Google Search Console and AdSense accounts.

## 2. Artificial Intelligence (LLM)
*   **OpenAI API Key** (or **Google Gemini API Key**): Required for Module 3 (Policy Compliance Engine) and Module 8 (AI Assistance Features) to analyze content, detect AI spam, suggest fixes, and generate required pages (privacy, terms, appeal letters).

## 3. Payments & Billing (Module 10)
*   **Stripe Secret Key** (`STRIPE_SECRET_KEY`)
*   **Stripe Webhook Secret** (`STRIPE_WEBHOOK_SECRET`)
*   *Note: We already added placeholder Next.js public links for the front-end, but we need the backend keys to process subscriptions & webhooks for precise tier gating.*

## 4. Crawling & Processing (Optional but Recommended)
*   **Scraping/Crawling Service (e.g., Firecrawl, Apify)**: Since comprehensive website crawling (finding all broken links, deep page scraping) takes a lot of time, Supabase Edge Functions might time out (they have strict time limits). A unified scraping API key can help speed this up and bypass bot-protection. Alternatively, we can use a custom Python worker/background system if you have a separate hosting setup (like a VPS).

Please setup these accounts/services and provide the API keys. 
In the meantime, I will proceed with creating the backend database structure, UI scaffolding, and integration logic that doesn't strictly depend on live external APIs yet (or using mock data until keys are provided).
