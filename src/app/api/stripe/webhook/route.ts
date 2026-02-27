import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecretKey || 'dummy_key_for_build', {
    apiVersion: '2023-10-16' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Create a Supabase client with the SERVICE ROLE key
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
    if (!webhookSecret || !stripeSecretKey) {
        return NextResponse.json({ error: 'Stripe webhook secret is not configured.' }, { status: 500 });
    }

    try {
        const body = await req.text();
        const headersList = await headers();
        const signature = headersList.get('stripe-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
        }

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err: any) {
            console.error(`Webhook signature verification failed.`, err.message);
            return NextResponse.json({ error: 'Webhook signature verification failed.' }, { status: 400 });
        }

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.client_reference_id;
                const planType = session.metadata?.planType;

                if (userId && planType) {
                    await handleSuccessfulPayment(userId, planType);
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                // Since this might not have client_reference_id directly, we need to find user by customer ID
                // Ideally you store stripe_customer_id on the user_credits row
                // For now, if we don't have it, we might need a metadata lookup if attached, or query by email.
                const customerId = subscription.customer as string;
                await handleDowngradeFree(customerId);
                break;
            }
            // ...handle other events as needed
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error("Webhook processing error:", err);
        return NextResponse.json({ error: err.message || "Failed processing webhook" }, { status: 500 });
    }
}

async function handleSuccessfulPayment(userId: string, planType: string) {
    let scans_limit = 3;
    if (planType === 'weekly') scans_limit = 5;
    if (planType === 'monthly') scans_limit = 30;
    if (planType === 'lifetime') scans_limit = -1; // -1 for infinity since db might not accept JS Infinity

    const { error: upsertError } = await supabaseAdmin
        .from('user_credits')
        .upsert({
            user_id: userId,
            plan_type: planType,
            scans_limit: scans_limit === -1 ? null : scans_limit, // null means unlimited in our logic
            scans_used: 0 // Reset usage on new plan
        }, { onConflict: 'user_id' });

    if (upsertError) {
        console.error("Failed to upgrade user credits:", upsertError);
    }
}

// Complex logic, simpler to do if we add stripe_customer_id to user_credits.
// Assuming we look up by customer email for this minimal implementation.
async function handleDowngradeFree(customerId: string) {
    try {
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        if (customer.email) {
            const { data: userAuth, error: authError } = await supabaseAdmin.auth.admin.listUsers();
            if (!authError && userAuth.users) {
                const match = userAuth.users.find(u => u.email === customer.email);
                if (match) {
                    await supabaseAdmin
                        .from('user_credits')
                        .update({ plan_type: 'free', scans_limit: 3 })
                        .eq('user_id', match.id);
                }
            }
        }
    } catch (e) {
        console.error("Downgrade failed", e);
    }
}
