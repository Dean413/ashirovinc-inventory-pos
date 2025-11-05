// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL2!,
  process.env.SUPABASE_SERVICE_ROLE_KEY2! // service-side key only
);
