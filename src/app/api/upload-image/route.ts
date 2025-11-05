// file: app/api/upload-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/subabaseserver";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const publicUrls: string[] = [];

    for (const file of files) {
      // Convert File -> Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await supabaseAdmin.storage
        .from("Laptops")
        .upload(fileName, buffer, {
          contentType: file.type, // preserve mime type
        });

      if (error) throw error;

      const { data: urlData } = supabaseAdmin.storage
        .from("Laptops")
        .getPublicUrl(fileName);

      publicUrls.push(urlData.publicUrl);
    }

    return NextResponse.json({ publicUrls });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
