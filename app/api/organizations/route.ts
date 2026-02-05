import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      slug,
      business_type,
      subscription_plan,
      subscription_status,
      max_rooms,
      max_users,
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create a server-side supabase client (reads cookies internally) to get current user
    const server = await createServerSupabaseClient();
    const { data: userData, error: userError } = await server.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const ownerId = userData.user.id;

    // Use a service_role admin client to perform the privileged operation in one atomic RPC
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set on the server" }, { status: 500 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Call the DB RPC to create org + owner
    const { data, error } = await admin.rpc("create_organization_with_owner_rpc", {
      p_business_type: business_type,
      p_max_rooms: max_rooms,
      p_max_users: max_users,
      p_name: name,
      p_owner_id: ownerId,
      p_slug: slug,
      p_subscription_plan: subscription_plan,
      p_subscription_status: subscription_status,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // rpc returns the org id
    return NextResponse.json({ orgId: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message || "Server error" }, { status: 500 });
  }
}
