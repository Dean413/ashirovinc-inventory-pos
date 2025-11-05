import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/subabaseserver";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the promise to get the actual id
    const { id } = await context.params;

    const body = await req.json();
    const { name, brand, price, cost_price, supplier_name, stock, image_url, description, display, ram, storage, processor } = body;

    const updates: Record<string, any> = {
      brand, price, stock, image_url, cost_price, supplier_name, description, display, ram, storage, processor
    };
    if (name) updates.name = name;

    const { error } = await supabaseAdmin
      .from("products")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
