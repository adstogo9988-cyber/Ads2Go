import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ token: string }> | { token: string } }
) {
    try {
        const params = await context.params;
        const { token } = params;

        if (!token) {
            return NextResponse.json({ error: "Token is required" }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabaseAdmin
            .from("adsense_scans")
            .select("*, sites(url, domain)")
            .eq("share_token", token)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: "Report not found or invalid token" }, { status: 404 });
        }

        // Check expiration
        if (data.share_expires_at) {
            const expiresAt = new Date(data.share_expires_at);
            if (expiresAt < new Date()) {
                return NextResponse.json({ error: "Report link has expired" }, { status: 403 });
            }
        }

        // Return the scan data, but limit sensitive information if necessary.
        // E.g., don't return the user_id tied to this scan.
        const safeData = {
            id: data.id,
            status: data.status,
            overall_score: data.overall_score,
            created_at: data.created_at,
            core_scan_data: data.core_scan_data,
            trust_pages_data: data.trust_pages_data,
            seo_indexing_data: data.seo_indexing_data,
            security_data: data.security_data,
            sites: data.sites
        };

        return NextResponse.json(safeData);

    } catch (e: any) {
        console.error("Fetch shared report error:", e);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
