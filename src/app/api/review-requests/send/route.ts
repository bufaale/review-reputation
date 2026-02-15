import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkReviewRequestLimit } from "@/lib/usage";
import { sendReviewRequestEmail } from "@/lib/email/resend";
import { z } from "zod";

const sendSchema = z.object({
  location_id: z.string().uuid(),
  customer_ids: z.array(z.string().uuid()).min(1).max(50),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = await checkReviewRequestLimit();

  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Check limit won't be exceeded
  if (
    limit.limit !== Infinity &&
    limit.used + parsed.data.customer_ids.length > limit.limit
  ) {
    return NextResponse.json(
      {
        error: `Would exceed monthly limit. You have ${limit.limit - limit.used} requests remaining.`,
      },
      { status: 429 },
    );
  }

  // Fetch location
  const { data: location } = await supabase
    .from("locations")
    .select("*")
    .eq("id", parsed.data.location_id)
    .eq("user_id", user.id)
    .single();

  if (!location)
    return NextResponse.json({ error: "Location not found" }, { status: 404 });

  // Fetch user profile for brand settings
  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_color")
    .eq("id", user.id)
    .single();

  // Fetch customers
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .in("id", parsed.data.customer_ids)
    .eq("user_id", user.id);

  if (!customers || customers.length === 0) {
    return NextResponse.json(
      { error: "No valid customers found" },
      { status: 400 },
    );
  }

  const reviewLink =
    location.google_maps_url || `${process.env.NEXT_PUBLIC_APP_URL}`;
  let sentCount = 0;

  for (const customer of customers) {
    try {
      await sendReviewRequestEmail({
        to: customer.email,
        customerName: customer.name,
        businessName: location.name,
        reviewLink,
        primaryColor: profile?.primary_color || undefined,
      });

      await supabase.from("review_requests").insert({
        user_id: user.id,
        location_id: location.id,
        customer_id: customer.id,
        channel: "email",
        status: "sent",
        review_link: reviewLink,
      });

      await supabase
        .from("customers")
        .update({ last_request_sent: new Date().toISOString() })
        .eq("id", customer.id);

      sentCount++;
    } catch (err) {
      console.error(`Failed to send to ${customer.email}:`, err);
    }
  }

  return NextResponse.json({ sent: sentCount });
}
