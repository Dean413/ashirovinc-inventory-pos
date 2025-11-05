import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/subabaseserver";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

    const { error } = await supabaseAdmin.from("products").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
