import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecretKey || 'dummy_key_for_build', {
    apiVersion: '2023-10-16' as any, // specify a constant stable apiVersion
});

// Create a Supabase client with the SERVICE ROLE key
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
    try {
        const { planType, priceId, userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
        }

        if (!stripeSecretKey) {
            return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 });
        }

        // Validate planType exists in our records
        if (!['weekly', 'monthly', 'lifetime'].includes(planType)) {
            return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
        }

        // Construct base URL for success/cancel redirects
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin') || 'http://localhost:3000';

        // Get user's email from Supabase
        const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

        const customerEmail = user?.user?.email;

        // If lifetime, it's a one-time payment, otherwise subscription
        const mode = planType === 'lifetime' ? 'payment' : 'subscription';

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: mode,
            success_url: `${baseUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/pricing?canceled=true`,
            customer_email: customerEmail,
            client_reference_id: userId, // CRITICAL: Links the stripe payment back to the Supabase user ID
            metadata: {
                planType: planType,
                userId: userId
            }
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (err: any) {
        console.error("Stripe checkout error:", err);
        return NextResponse.json({ error: err.message || "Failed to create checkout session" }, { status: 500 });
    }
}
