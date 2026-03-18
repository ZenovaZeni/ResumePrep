import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Must disable body parsing so Stripe can validate the raw signature
export const config = { api: { bodyParser: false } };

async function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase admin credentials not configured.");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function setUserTier(userId: string, tier: "free" | "pro") {
  const supabase = await getSupabaseAdmin();
  await supabase.from("profiles").update({ tier }).eq("user_id", userId);
}

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(stripeKey);
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Webhook error";
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        if (userId && session.payment_status === "paid") {
          await setUserTier(userId, "pro");
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const userId = (invoice.subscription_details?.metadata as Record<string, string> | null)?.user_id
          ?? (invoice as unknown as { subscription_data?: { metadata?: Record<string, string> } })
              .subscription_data?.metadata?.user_id;
        if (userId) {
          await setUserTier(userId, "pro");
        }
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.paused": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        if (userId) {
          await setUserTier(userId, "free");
        }
        break;
      }

      case "invoice.payment_failed": {
        // Optional: could downgrade after grace period; for now just log
        break;
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Handler error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
