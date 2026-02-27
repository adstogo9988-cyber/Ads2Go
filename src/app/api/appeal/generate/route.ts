import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { scan_id } = body;

        if (!scan_id) {
            return NextResponse.json({ error: 'Missing scan_id' }, { status: 400 });
        }

        const { data: scan, error: scanError } = await supabase
            .from('adsense_scans')
            .select(`
                core_scan_data,
                sites(domain)
            `)
            .eq('id', scan_id)
            .single();

        if (scanError || !scan) {
            return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
        }

        const domain = Array.isArray(scan.sites) ? scan.sites[0]?.domain : (scan.sites as any)?.domain;
        const violations = scan.core_scan_data?.ai_policy?.policy_violations || [];

        if (violations.length === 0) {
            return NextResponse.json({ status: 'success', draft: 'No specific policy violations detected. Make sure to fix any technical SEO or content quality warnings before reapplying.' });
        }

        const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8080';

        const workerResponse = await fetch(`${WORKER_URL}/ai/appeal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                scan_id,
                domain,
                violations
            })
        });

        if (!workerResponse.ok) {
            const errText = await workerResponse.text();
            throw new Error(`Worker returned ${workerResponse.status}: ${errText}`);
        }

        const result = await workerResponse.json();

        if (result.status === 'success') {
            const updatedCoreData = { ...scan.core_scan_data };
            updatedCoreData.ai_recommendations = {
                ...(updatedCoreData.ai_recommendations || {}),
                appeal_draft: result.draft
            };

            await supabase
                .from('adsense_scans')
                .update({ core_scan_data: updatedCoreData })
                .eq('id', scan_id);
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error generating appeal letter:', error);
        return NextResponse.json(
            { error: 'Failed to generate appeal letter', details: error.message },
            { status: 500 }
        );
    }
}
