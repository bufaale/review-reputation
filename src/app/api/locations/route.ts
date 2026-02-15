import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkLocationLimit } from "@/lib/usage";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().optional(),
  google_maps_url: z.string().url().optional().or(z.literal("")),
  industry: z.string().optional(),
  tone: z.enum(["professional", "friendly", "casual"]).default("professional"),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ locations: data });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = await checkLocationLimit();
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Location limit reached (${limit.used}/${limit.limit}). Upgrade your plan.`,
      },
      { status: 429 },
    );
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from("locations")
    .insert({ user_id: user.id, ...parsed.data })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ location: data });
}
