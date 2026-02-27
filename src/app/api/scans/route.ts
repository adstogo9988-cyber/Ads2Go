import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the SERVICE ROLE key
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
    try {
        const { url, domain, userId, userPlan } = await req.json();

        if (!url || !domain) {
            return NextResponse.json({ error: 'URL and Domain are required' }, { status: 400 });
        }

        // 1. Enforce scan limits securely on the server
        if (userId) {
            // First, ensure user_credits record exists
            let { data: credits, error: creditsError } = await supabaseAdmin
                .from('user_credits')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (!credits) {
                // Initialize user credits if they don't exist
                const { data: newCredits, error: insertError } = await supabaseAdmin
                    .from('user_credits')
                    .insert({ user_id: userId, plan_type: 'free', scans_used: 0, scans_limit: 3 })
                    .select()
                    .single();

                if (insertError) throw insertError;
                credits = newCredits;
            } else if (creditsError) {
                throw creditsError;
            }

            // Enforce Limits
            if (credits && credits.scans_limit !== null && credits.scans_used >= credits.scans_limit) {
                return NextResponse.json({
                    error: `You have reached your scan limit of ${credits.scans_limit} for the ${credits.plan_type} plan. Please upgrade to continue.`
                }, { status: 403 });
            }

            // Increment usage
            const { error: updateError } = await supabaseAdmin
                .from('user_credits')
                .update({ scans_used: (credits?.scans_used || 0) + 1 })
                .eq('user_id', userId);

            if (updateError) throw updateError;
        }

        // 2. Register site (if doesn't exist)
        let siteId = null;

        // Try to find existing site first
        if (userId) {
            const { data: existingSite } = await supabaseAdmin
                .from('sites')
                .select('id')
                .eq('user_id', userId)
                .eq('domain', domain)
                .single();
            if (existingSite) {
                siteId = existingSite.id;
                console.log(`site select result: found existing site ${siteId}`);
            } else {
                console.log(`site select result: not found`);
            }
        } else {
            const { data: existingSite } = await supabaseAdmin
                .from('sites')
                .select('id')
                .is('user_id', null)
                .eq('domain', domain)
                .single();
            if (existingSite) {
                siteId = existingSite.id;
                console.log(`site select result: found existing site ${siteId}`);
            } else {
                console.log(`site select result: not found`);
            }
        }

        // If not found, insert
        if (!siteId) {
            const { data: newSite, error: insertError } = await supabaseAdmin
                .from('sites')
                .insert({
                    url: url,
                    domain: domain,
                    user_id: userId || null
                })
                .select()
                .single();

            if (insertError) {
                console.error("site insert result: failed", insertError);
                return NextResponse.json({ error: "Database error: Could not register site." }, { status: 500 });
            }
            siteId = newSite.id;
            console.log(`site insert result: successfully inserted new site ${siteId}`);
        }

        console.log(`final site_id used for scan: ${siteId}`);

        if (!siteId) {
            throw new Error("Site ID could not be generated and scan creation is aborted.");
        }

        // 3. Create pending scan using Service Role (Bypassing restrictive public RLS)
        const { data: scan, error: scanError } = await supabaseAdmin
            .from('adsense_scans')
            .insert({
                site_id: siteId,
                user_id: userId || null,
                status: 'pending'
            })
            .select()
            .single();

        if (scanError) throw scanError;

        // 4. Trigger the Python worker to process it immediately, bypassing the poll wait
        const WORKER_URL = process.env.WORKER_URL || 'https://ad2go-python-analyzer-production.up.railway.app';
        try {
            await fetch(`${WORKER_URL}/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: scan.id,
                    site_id: siteId
                })
            });
        } catch (workerErr) {
            console.warn("Could not instantly trigger worker, it will process via polling:", workerErr);
        }

        return NextResponse.json({ success: true, scanId: scan.id, siteId: siteId });

    } catch (err: any) {
        console.error("API Scan initialization error:", err);
        return NextResponse.json({ error: err.message || "Failed to start analysis" }, { status: 500 });
    }
}
