// file: app/api/add-products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/subabaseserver";



export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { name, brand, price, supplier_name, cost_price, stock, image_url, description, display, ram, storage, processor, category } = body;

    if (!name || !price) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("products")
      .insert([
        { name, brand, price, stock, cost_price, supplier_name, image_url, description, display, ram, storage, processor, category },
      ]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
