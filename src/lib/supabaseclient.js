// lib/supabaseClient.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'


// This automatically uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
export const supabase = createClientComponentClient()


