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
            const planLimits: Record<string, number> = {
                free: 3,
                weekly: 5,
                monthly: 30,
                lifetime: Infinity
            };
            const maxScans = planLimits[userPlan || 'free'] || 3;

            if (maxScans !== Infinity) {
                const cycleDays = userPlan === 'weekly' ? 7 : 30;
                const cycleStart = new Date();
                cycleStart.setDate(cycleStart.getDate() - cycleDays);

                const { count, error: countError } = await supabaseAdmin
                    .from('adsense_scans')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .gte('created_at', cycleStart.toISOString());

                if (countError) throw countError;

                if (count !== null && count >= maxScans) {
                    return NextResponse.json({
                        error: `You have reached your scan limit of ${maxScans} scans per ${userPlan === 'weekly' ? 'week' : 'month'} for the ${userPlan} plan. Please upgrade to continue.`
                    }, { status: 403 });
                }

                // Free plan logic: 1 scan every 10 days limit
                if (userPlan === 'free' || !userPlan) {
                    const tenDaysAgo = new Date();
                    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
                    const { count: recentCount, error: recentError } = await supabaseAdmin
                        .from('adsense_scans')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', userId)
                        .gte('created_at', tenDaysAgo.toISOString());

                    if (recentError) throw recentError;

                    if (recentCount !== null && recentCount >= 1) {
                        return NextResponse.json({
                            error: `Free plan limits to 1 scan every 10 days. Please upgrade to scan immediately.`
                        }, { status: 403 });
                    }
                }
            }
        }

        // 2. Register site (if doesn't exist)
        const { data: site, error: siteError } = await supabaseAdmin
            .from('sites')
            .upsert({
                url: url,
                domain: domain,
                user_id: userId || null
            }, { onConflict: 'user_id,domain' })
            .select()
            .single();

        if (siteError) throw siteError;

        // 3. Create pending scan using Service Role (Bypassing restrictive public RLS)
        const { data: scan, error: scanError } = await supabaseAdmin
            .from('adsense_scans')
            .insert({
                site_id: site.id,
                user_id: userId || null,
                status: 'pending'
            })
            .select()
            .single();

        if (scanError) throw scanError;

        // 4. Trigger the Python worker to process it immediately, bypassing the poll wait
        const WORKER_URL = process.env.WORKER_URL || 'https://worker-production-8d3e.up.railway.app';
        try {
            await fetch(`${WORKER_URL}/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: scan.id,
                    site_id: site.id
                })
            });
        } catch (workerErr) {
            console.warn("Could not instantly trigger worker, it will process via polling:", workerErr);
        }

        return NextResponse.json({ success: true, scanId: scan.id, siteId: site.id });

    } catch (err: any) {
        console.error("API Scan initialization error:", err);
        return NextResponse.json({ error: err.message || "Failed to start analysis" }, { status: 500 });
    }
}
