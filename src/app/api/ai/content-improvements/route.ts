import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { scan_id } = body;

        if (!scan_id) {
            return NextResponse.json({ error: 'Missing scan_id' }, { status: 400 });
        }

        // Fetch scan data
        const { data: scan, error: scanError } = await supabase
            .from('adsense_scans')
            .select(`
                core_scan_data,
                seo_indexing_data,
                sites(domain)
            `)
            .eq('id', scan_id)
            .single();

        if (scanError || !scan) {
            return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
        }

        const domain = Array.isArray(scan.sites) ? scan.sites[0]?.domain : (scan.sites as any)?.domain;
        const analysis_data = {
            content_analysis: scan.core_scan_data?.content_analysis || {},
            headings: scan.seo_indexing_data?.headings || {},
            meta_tags: scan.seo_indexing_data?.meta_tags_analysis || {}
        };

        const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8080';

        // Call Python worker
        const workerResponse = await fetch(`${WORKER_URL}/ai/content-improvements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                scan_id,
                domain,
                analysis_data
            })
        });

        if (!workerResponse.ok) {
            const errText = await workerResponse.text();
            throw new Error(`Worker returned ${workerResponse.status}: ${errText}`);
        }

        const result = await workerResponse.json();

        // Save AI recommendations to DB as cache
        if (result.status === 'success') {
            const updatedCoreData = { ...scan.core_scan_data };
            updatedCoreData.ai_recommendations = {
                ...(updatedCoreData.ai_recommendations || {}),
                content_improvements: result.improvements
            };

            await supabase
                .from('adsense_scans')
                .update({ core_scan_data: updatedCoreData })
                .eq('id', scan_id);
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error generating content improvements:', error);
        return NextResponse.json(
            { error: 'Failed to generate content improvements', details: error.message },
            { status: 500 }
        );
    }
}
