import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { scan_id } = body;

        if (!scan_id) {
            return NextResponse.json({ error: "scan_id is required" }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // First check if a token already exists
        const { data: existing, error: fetchError } = await supabaseAdmin
            .from("adsense_scans")
            .select("share_token")
            .eq("id", scan_id)
            .single();

        if (fetchError) {
            return NextResponse.json({ error: "Failed to fetch scan" }, { status: 500 });
        }

        if (existing?.share_token) {
            return NextResponse.json({ status: "success", share_token: existing.share_token });
        }

        // Generate a new unique token
        const share_token = crypto.randomUUID();
        // Set an optional expiration constraint (e.g., 30 days from now)
        const expires_at = new Date();
        expires_at.setDate(expires_at.getDate() + 30);

        const { error: updateError } = await supabaseAdmin
            .from("adsense_scans")
            .update({
                share_token,
                share_expires_at: expires_at.toISOString()
            })
            .eq("id", scan_id);

        if (updateError) {
            console.error("Error setting share_token:", updateError);
            return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
        }

        return NextResponse.json({ status: "success", share_token });

    } catch (e: any) {
        console.error("Share endpoint error:", e);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
