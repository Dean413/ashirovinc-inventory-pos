import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/subabaseserver";

export async function POST(req: Request) {
  const { cartItems } = await req.json();

  for (const item of cartItems) {
    const { error: stockError } = await supabaseAdmin.rpc("decrement_stock", {
      product_id: item.id,
      qty: item.quantity,
    });

    if (stockError)
      return NextResponse.json({ error: stockError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
