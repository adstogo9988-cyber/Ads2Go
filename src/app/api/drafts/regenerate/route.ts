import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { scan_id, domain, page_type } = body;

        if (!scan_id || !domain || !page_type) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify the scan belongs to the user or exists
        const { data: scan, error: scanError } = await supabase
            .from('adsense_scans')
            .select('id')
            .eq('id', scan_id)
            .single();

        if (scanError || !scan) {
            return NextResponse.json(
                { error: 'Scan not found' },
                { status: 404 }
            );
        }

        const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8080';

        // Call the Python worker
        const workerResponse = await fetch(`${WORKER_URL}/regenerate-draft`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                scan_id,
                domain,
                page_type
            })
        });

        if (!workerResponse.ok) {
            const errText = await workerResponse.text();
            throw new Error(`Worker returned ${workerResponse.status}: ${errText}`);
        }

        const data = await workerResponse.json();

        return NextResponse.json({
            status: 'success',
            draft: data.draft
        });

    } catch (error: any) {
        console.error('Error generating draft:', error);
        return NextResponse.json(
            { error: 'Failed to generate draft', details: error.message },
            { status: 500 }
        );
    }
}
