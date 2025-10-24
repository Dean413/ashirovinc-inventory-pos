// lib/supabaseClient.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from "@supabase/supabase-js";


// This automatically uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
export const supabase = createClientComponentClient()


// Manual client (can be used anywhere)
const supabaseUrl = "https://cmynewxgfrvowdbiryul.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNteW5ld3hnZnJ2b3dkYmlyeXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1OTU0NzYsImV4cCI6MjA3MTE3MTQ3Nn0.t4LejnC8vMFV3ci1odLbGAT8lW8t2zddMwvlFR-XHGI";

export const supaBase = createClient(supabaseUrl, supabaseKey)