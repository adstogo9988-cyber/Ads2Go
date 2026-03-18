export const POLICY_TEMPLATES: Record<string, string> = {
    privacy: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Privacy Policy for {domain_name} - Learn how we protect your data.">
    <title>Privacy Policy | {domain_name}</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --text-main: #1e293b;
            --text-muted: #64748b;
            --brand-color: #2563eb;
            --bg-body: #ffffff;
            --bg-card: #f8fafc;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Inter', sans-serif;
            color: var(--text-main);
            line-height: 1.7;
            background-color: var(--bg-body);
            padding: 20px;
        }

        .policy-container {
            max-width: 850px;
            margin: 50px auto;
            padding: 40px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
        }

        h1 { font-size: 2.2rem; margin-bottom: 10px; color: #0f172a; }
        h2 { font-size: 1.5rem; margin-top: 35px; margin-bottom: 15px; color: var(--brand-color); }
        
        p { margin-bottom: 20px; font-size: 1.1rem; }
        
        .update-date { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; display: inline-block; }

        ul { margin-bottom: 20px; margin-left: 25px; }
        li { margin-bottom: 10px; font-size: 1.1rem; }

        /* SEO & AdSense Box */
        .highlight-box {
            background-color: var(--bg-card);
            padding: 25px;
            border-left: 5px solid var(--brand-color);
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
        }

        .contact-info {
            background: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            margin-top: 40px;
        }

        @media (max-width: 600px) {
            .policy-container { padding: 20px; margin: 20px auto; }
            h1 { font-size: 1.8rem; }
        }
    </style>
</head>
<body>

<article class="policy-container">
    <h1>Privacy Policy</h1>
    <span class="update-date">Last Updated: {date}</span>

    <p>At <strong>{domain_name}</strong>, accessible from <strong>{domain_url}</strong>, one of our main priorities is the privacy of our visitors. This document contains types of information that is collected and recorded by us and how we use it.</p>

    <h2>1. Consent</h2>
    <p>By using our website, you hereby consent to our Privacy Policy and agree to its terms. If you do not agree, please do not use our site.</p>

    <h2>2. Information We Collect</h2>
    <p>We only collect the information that is necessary for a better user experience. This includes:</p>
    <ul>
        <li><strong>Log Files:</strong> We follow a standard procedure of using log files. These files log visitors when they visit websites (IP addresses, browser type, date/time stamp).</li>
        <li><strong>Contact Information:</strong> If you contact us directly, we may receive your name, email address, and the contents of your message.</li>
    </ul>

    <div class="highlight-box">
        <h2>3. Google AdSense & Cookies</h2>
        <p>Google is one of the third-party vendors on our site. It uses cookies, known as <strong>DART cookies</strong>, to serve ads to our site visitors based on their visit to our site and other sites on the internet.</p>
        <p>You can choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL: <a href="https://policies.google.com/technologies/ads" style="color:var(--brand-color);">https://policies.google.com/technologies/ads</a></p>
    </div>

    <h2>4. Third-Party Privacy Policies</h2>
    <p><strong>{domain_name}</strong>'s Privacy Policy does not apply to other advertisers or websites. We advise you to consult the respective Privacy Policies of these third-party ad servers for more detailed information.</p>

    <h2>5. Data Protection Rights</h2>
    <p>We want to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:</p>
    <ul>
        <li>The right to access your personal data.</li>
        <li>The right to request that we correct any information you believe is inaccurate.</li>
        <li>The right to request that we erase your personal data.</li>
    </ul>

    <div class="contact-info">
        <h2>6. Contact Us</h2>
        <p>If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us:</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Contact Page:</strong> {contact_url}</p>
    </div>
</article>

</body>
</html>`,

    terms: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Terms and Conditions for {domain_name}. Please read our rules and regulations carefully.">
    <title>Terms & Conditions | {domain_name}</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --text-main: #1e293b;
            --text-muted: #64748b;
            --brand-color: #2563eb;
            --bg-body: #ffffff;
            --bg-card: #f8fafc;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Inter', sans-serif;
            color: var(--text-main);
            line-height: 1.7;
            background-color: var(--bg-body);
            padding: 20px;
        }

        .terms-container {
            max-width: 850px;
            margin: 50px auto;
            padding: 40px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
        }

        h1 { font-size: 2.2rem; margin-bottom: 10px; color: #0f172a; }
        h2 { font-size: 1.5rem; margin-top: 35px; margin-bottom: 15px; color: var(--brand-color); }
        
        p { margin-bottom: 20px; font-size: 1.1rem; }
        
        .update-date { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; display: inline-block; }

        ul { margin-bottom: 20px; margin-left: 25px; }
        li { margin-bottom: 10px; font-size: 1.1rem; }

        .legal-notice {
            background-color: var(--bg-card);
            padding: 25px;
            border-left: 5px solid #94a3b8;
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
            font-style: italic;
        }

        .contact-box {
            background: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            margin-top: 40px;
        }

        @media (max-width: 600px) {
            .terms-container { padding: 20px; margin: 20px auto; }
            h1 { font-size: 1.8rem; }
        }
    </style>
</head>
<body>

<article class="terms-container">
    <h1>Terms & Conditions</h1>
    <span class="update-date">Last Updated: {date}</span>

    <p>Welcome to <strong>{domain_name}</strong>. By accessing this website, we assume you accept these terms and conditions. Please do not continue to use <strong>{domain_url}</strong> if you do not agree to all of the terms stated on this page.</p>

    <h2>1. Intellectual Property Rights</h2>
    <p>Unless otherwise stated, <strong>{domain_name}</strong> and/or its licensors own the intellectual property rights for all material on this website. All intellectual property rights are reserved. You may access this from <strong>{domain_name}</strong> for your own personal use subjected to restrictions set in these terms.</p>
    <p><strong>You must not:</strong></p>
    <ul>
        <li>Republish material from our site without permission.</li>
        <li>Sell, rent, or sub-license our content.</li>
        <li>Reproduce, duplicate, or copy our original articles or designs.</li>
    </ul>

    <h2>2. User Content & Conduct</h2>
    <p>In certain areas of this website, users may have the opportunity to post comments or feedback. We do not filter or review comments before they appear on the site. However, we reserve the right to monitor and remove any comments which can be considered inappropriate, offensive, or causes breach of these Terms.</p>

    <div className="legal-notice">
        "Your use of this site is at your own risk. The information provided is for general informational purposes only and does not constitute professional advice."
    </div>

    <h2>3. External Links</h2>
    <p>Our website may contain links to third-party websites (like advertisers or partners). We have no control over the content, privacy policies, or practices of any third-party sites and assume no responsibility for them. We strongly advise you to read their terms as well.</p>

    <h2>4. Limitation of Liability</h2>
    <p>We strive to ensure the information on this website is correct, but we do not warrant its completeness or accuracy. To the maximum extent permitted by law, we shall not be liable for any direct or indirect loss or damage arising under these terms and conditions.</p>

    <h2>5. Changes to These Terms</h2>
    <p>We reserve the right to update or change our Terms & Conditions at any time. Any changes will be posted on this page with an updated 'Last Updated' date. Your continued use of the website after changes are posted means you agree to the new terms.</p>

    <div class="contact-box">
        <h2>6. Contact Us</h2>
        <p>If you have any questions about our Terms and Conditions, please reach out to us:</p>
        <p><strong>Email:</strong> {email}</p>
    </div>
</article>

</body>
</html>`,

    disclaimer: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Disclaimer for {domain_name}. Read our professional disclosure regarding content, ads, and links.">
    <title>Disclaimer | {domain_name}</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --text-main: #1e293b;
            --text-muted: #64748b;
            --brand-color: #2563eb;
            --bg-body: #ffffff;
            --bg-accent: #f8fafc;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Inter', sans-serif;
            color: var(--text-main);
            line-height: 1.7;
            background-color: var(--bg-body);
            padding: 20px;
        }

        .disclaimer-container {
            max-width: 850px;
            margin: 50px auto;
            padding: 40px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
        }

        h1 { font-size: 2.2rem; margin-bottom: 10px; color: #0f172a; }
        h2 { font-size: 1.5rem; margin-top: 35px; margin-bottom: 15px; color: var(--brand-color); }
        
        p { margin-bottom: 20px; font-size: 1.1rem; }
        
        .update-date { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; display: inline-block; }

        /* Highlight Box for AdSense Transparency */
        .ad-disclosure {
            background-color: #fffbeb;
            border: 1px solid #fef3c7;
            padding: 25px;
            border-left: 5px solid #f59e0b;
            margin: 30px 0;
            border-radius: 8px;
        }

        .ad-disclosure h3 { color: #92400e; margin-bottom: 10px; }

        .contact-box {
            background: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            margin-top: 40px;
        }

        @media (max-width: 600px) {
            .disclaimer-container { padding: 20px; margin: 20px auto; }
            h1 { font-size: 1.8rem; }
        }
    </style>
</head>
<body>

<article class="disclaimer-container">
    <h1>Disclaimer</h1>
    <span class="update-date">Last Updated: {date}</span>

    <p>If you require any more information or have any questions about our site's disclaimer, please feel free to contact us. All information on <strong>{domain_url}</strong> is published in good faith and for general information purpose only.</p>

    <h2>1. General Information</h2>
    <p>The content provided on <strong>{domain_name}</strong> is for educational and informational purposes only. While we strive to keep the information up-to-date and correct, we make no representations or warranties of any kind about the completeness, accuracy, or reliability of the information found here.</p>

    <div class="ad-disclosure">
        <h3>2. Advertising & Affiliate Disclosure</h3>
        <p>This website uses <strong>Google AdSense</strong> to show advertisements. These ads help us keep our content free for everyone. Additionally, we may participate in <strong>affiliate marketing</strong> programs, which means we may earn a small commission if you purchase a product through one of our links, at no extra cost to you.</p>
        <p><strong>Please note:</strong> We only recommend products or services that we believe will add value to our readers.</p>
    </div>

    <h2>3. External Links Disclaimer</h2>
    <p>From our website, you can visit other websites by following hyperlinks to such external sites. While we strive to provide only quality links to useful and ethical websites, we have no control over the content and nature of these sites. These links do not imply a recommendation for all the content found on these sites.</p>

    <h2>4. Professional Disclaimer</h2>
    <p>The information on this site is not intended as professional advice (e.g., Financial, Medical, or Legal). Always seek the advice of a qualified professional with any questions you may have regarding a specific subject. Any action you take upon the information you find on this website is strictly at your own risk.</p>

    <h2>5. Consent</h2>
    <p>By using our website, you hereby consent to our disclaimer and agree to its terms.</p>

    <div class="contact-box">
        <h2>6. Update</h2>
        <p>Should we update, amend or make any changes to this document, those changes will be prominently posted here.</p>
        <p><strong>Questions? Email us:</strong> {email}</p>
    </div>
</article>

</body>
</html>`,

    about: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Learn more about {domain_name} - Our mission, our expertise, and why we create original content.">
    <title>About Us | {domain_name}</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --text-main: #1e293b;
            --text-muted: #64748b;
            --brand-color: #2563eb;
            --bg-body: #ffffff;
            --bg-accent: #f8fafc;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Inter', sans-serif;
            color: var(--text-main);
            line-height: 1.8;
            background-color: var(--bg-body);
            padding: 20px;
        }

        .about-container {
            max-width: 850px;
            margin: 50px auto;
            padding: 40px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
        }

        h1 { font-size: 2.5rem; color: #0f172a; margin-bottom: 20px; text-align: left; }
        h2 { font-size: 1.6rem; margin-top: 40px; margin-bottom: 15px; color: var(--brand-color); }
        
        p { margin-bottom: 20px; font-size: 1.1rem; color: var(--text-main); }

        .mission-box {
            background-color: var(--bg-accent);
            padding: 30px;
            border-radius: 12px;
            margin: 30px 0;
            border-left: 5px solid var(--brand-color);
        }

        .mission-box h3 { font-size: 1.3rem; margin-bottom: 10px; color: #0f172a; }

        .expertise-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .expertise-item {
            padding: 15px;
            background: #fff;
            border: 1px solid #f1f5f9;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }

        .expertise-item strong { display: block; color: var(--brand-color); margin-bottom: 5px; }

        .contact-cta {
            margin-top: 50px;
            padding: 30px;
            background: #eff6ff;
            border-radius: 12px;
            text-align: center;
        }

        @media (max-width: 600px) {
            .about-container { padding: 20px; }
            h1 { font-size: 2rem; }
        }
    </style>
</head>
<body>

<article class="about-container">
    <h1>About Us</h1>
    
    <p>Welcome to <strong>{domain_name}</strong>. We are a dedicated platform built on the pillars of transparency, expertise, and a passion for <strong>{topic}</strong>.</p>

    <div class="mission-box">
        <h3>Our Core Mission</h3>
        <p>In a digital world crowded with replicated content, our goal is to provide **100% original**, human-led, and deeply researched information that adds real value to our readers' lives.</p>
    </div>

    <h2>Who We Are</h2>
    <p>Founded in 2026, <strong>{domain_name}</strong> is more than just a blog. We are a team of professionals with roots in creative design and software engineering through our agency background, <strong>U DESIGNER</strong>. We believe that every user deserves high-quality, clear, and actionable content.</p>

    <h2>Why Trust Us?</h2>
    <p>We don't just "report" information—we analyze it. Our expertise comes from years of hands-on experience in the <strong>{topic}</strong> industry. When we write a guide or a review, it is based on actual testing and professional standards. We strictly follow the **E-E-A-T** principle to ensure that what you read here is accurate and reliable.</p>

    <div class="expertise-list">
        <div class="expertise-item">
            <strong>Originality</strong>
            No AI-spam or copy-paste. Only human insights.
        </div>
        <div class="expertise-item">
            <strong>Expertise</strong>
            Backed by the creative power of U DESIGNER.
        </div>
        <div class="expertise-item">
            <strong>Integrity</strong>
            We are transparent about our ads and affiliations.
        </div>
    </div>

    <h2>What You Will Find Here</h2>
    <p>On this website, we focus on providing:
    <ul>
        <li>Step-by-step tutorials that are easy to follow.</li>
        <li>In-depth analysis of the latest trends in <strong>{topic}</strong>.</li>
        <li>Professional tools and templates designed to solve your problems.</li>
    </ul>

    <div class="contact-cta">
        <p><strong>Have a question or want to work with us?</strong></p>
        <p>We are always open to feedback and collaboration.</p>
        <p><strong>Email us:</strong> {email}</p>
    </div>
</article>

</body>
</html>`,

    contact: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inquiries | {domain_name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --slate-900: #0f172a;
            --slate-600: #475569;
            --blue-600: #2563eb;
            --bg: #ffffff;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg);
            color: var(--slate-900);
            line-height: 1.6;
            margin: 0;
            padding: 80px 20px;
        }

        .wrapper {
            max-width: 1000px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 1.5fr;
            gap: 60px;
        }

        /* Content / Left Side */
        .info-section h1 {
            font-size: 3rem;
            font-weight: 700;
            letter-spacing: -0.04em;
            margin-bottom: 20px;
        }

        .info-section p {
            font-size: 1.15rem;
            color: var(--slate-600);
            margin-bottom: 40px;
        }

        .contact-detail {
            margin-bottom: 30px;
        }

        .contact-detail small {
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-weight: 700;
            color: var(--blue-600);
            display: block;
            margin-bottom: 5px;
        }

        .contact-detail span {
            font-size: 1.25rem;
            font-weight: 500;
        }

        /* Form / Right Side */
        .form-card {
            background: #fff;
            border: 1px solid #f1f5f9;
            padding: 40px;
            border-radius: 24px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.04);
        }

        .input-group {
            margin-bottom: 25px;
        }

        .input-group label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 0.9rem;
        }

        input, textarea {
            width: 100%;
            padding: 14px;
            border: 1.5px solid #e2e8f0;
            border-radius: 12px;
            font-size: 1rem;
            transition: all 0.2s;
        }

        input:focus, textarea:focus {
            outline: none;
            border-color: var(--blue-600);
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        button {
            width: 100%;
            background: var(--slate-900);
            color: white;
            padding: 16px;
            border-radius: 12px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            transition: transform 0.2s;
        }

        button:hover {
            transform: translateY(-2px);
            background: #000;
        }

        @media (max-width: 850px) {
            .wrapper { grid-template-columns: 1fr; gap: 40px; padding: 20px; }
            .info-section h1 { font-size: 2.2rem; }
        }
    </style>
</head>
<body>

<div class="wrapper">
    <div class="info-section">
        <h1>Let’s connect.</h1>
        <p>Whether you have a technical inquiry or a business proposal, our team at <strong>{domain_name}</strong> is ready to assist.</p>
        
        <div class="contact-detail">
            <small>Direct Email</small>
            <span>{email}</span>
        </div>

        <div class="contact-detail">
            <small>Office Location</small>
            <span>{address}</span>
        </div>
    </div>

    <div class="form-card">
        <form action="#">
            <div class="input-group">
                <label>Full Name</label>
                <input type="text" placeholder="e.g. Ali Khan">
            </div>
            <div class="input-group">
                <label>Email Address</label>
                <input type="email" placeholder="name@company.com">
            </div>
            <div class="input-group">
                <label>How can we help?</label>
                <textarea rows="4" placeholder="Briefly describe your inquiry..."></textarea>
            </div>
            <button type="submit">Send Inquiry</button>
        </form>
    </div>
</div>

</body>
</html>`
};

export function getFormattedPolicy(pageType: string, vars: Record<string, string>): string {
    let template = POLICY_TEMPLATES[pageType];
    if (!template) return `<div><h2>Missing Template</h2><p>No template found for ${pageType}.</p></div>`;

    // Derive extra variables
    const domain = vars.domain || '';
    const domain_name = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split('.')[0].toUpperCase();
    const domain_url = domain.includes('://') ? domain : `https://${domain}`;
    const contact_url = `${domain_url}/contact`;
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const allVars = {
        ...vars,
        domain_name,
        domain_url,
        contact_url,
        date
    };

    Object.entries(allVars).forEach(([key, value]) => {
        const regex = new RegExp(`{${key}}`, 'g');
        template = template.replace(regex, value || `[${key}]`);
    });

    return template;
}
